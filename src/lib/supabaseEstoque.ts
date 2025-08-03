// Sistema de estoque integrado com Supabase
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Types from Supabase
type Produto = Database['public']['Tables']['produtos']['Row'];
type Movimentacao = Database['public']['Tables']['movimentacoes']['Row'];

// Interface para produtos usados nas vendas
export interface ProdutoVenda {
  id: string;
  nome: string;
  marca?: string | null;
  valor: number;
  quantidade: number;
}

// Extended produto type with categoria info
export interface ProdutoComCategoria extends Produto {
  categoria?: { nome: string } | null;
}

// Classe para gerenciar o estoque com Supabase
class SupabaseEstoqueManager {
  private static instance: SupabaseEstoqueManager;
  private listeners: Array<() => void> = [];

  public static getInstance(): SupabaseEstoqueManager {
    if (!SupabaseEstoqueManager.instance) {
      SupabaseEstoqueManager.instance = new SupabaseEstoqueManager();
    }
    return SupabaseEstoqueManager.instance;
  }

  // Buscar produtos por termo
  public async buscarProduto(termo: string): Promise<ProdutoComCategoria[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(nome)
      `)
      .or(`nome.ilike.%${termo}%,marca.ilike.%${termo}%,codigo.ilike.%${termo}%`)
      .eq('status', 'ativo');

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }

    return data || [];
  }

  // Buscar produto por ID
  public async buscarProdutoPorId(id: string): Promise<ProdutoComCategoria | null> {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(nome)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Produto não encontrado
      }
      console.error('Erro ao buscar produto por ID:', error);
      throw error;
    }

    return data;
  }

  // Verificar se há estoque suficiente
  public async verificarEstoque(produtoId: string, quantidade: number): Promise<boolean> {
    const produto = await this.buscarProdutoPorId(produtoId);
    return produto ? produto.quantidade >= quantidade : false;
  }

  // Dar baixa no estoque (usado nas vendas)
  public async darBaixaEstoque(produtoId: string, quantidade: number, osNumero: string): Promise<boolean> {
    console.log(`[ESTOQUE] Iniciando baixa - Produto: ${produtoId}, Quantidade: ${quantidade}, OS: ${osNumero}`);
    
    try {
      // Verificar usuário autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[ESTOQUE] Usuário não autenticado:', authError);
        return false;
      }
      console.log(`[ESTOQUE] Usuário autenticado: ${user.id}`);

      // Buscar produto atual
      const produto = await this.buscarProdutoPorId(produtoId);
      
      if (!produto) {
        console.error(`[ESTOQUE] Produto com ID ${produtoId} não encontrado`);
        return false;
      }
      console.log(`[ESTOQUE] Produto encontrado: ${produto.nome}, Estoque atual: ${produto.quantidade}`);

      if (produto.quantidade < quantidade) {
        console.error(`[ESTOQUE] Estoque insuficiente para ${produto.nome}. Disponível: ${produto.quantidade}, Solicitado: ${quantidade}`);
        return false;
      }

      const quantidadeAnterior = produto.quantidade;
      const novaQuantidade = quantidadeAnterior - quantidade;
      console.log(`[ESTOQUE] Calculando nova quantidade: ${quantidadeAnterior} - ${quantidade} = ${novaQuantidade}`);

      // Atualizar quantidade do produto
      console.log(`[ESTOQUE] Atualizando produto ${produtoId} para quantidade ${novaQuantidade}`);
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ quantidade: novaQuantidade })
        .eq('id', produtoId);

      if (updateError) {
        console.error('[ESTOQUE] Erro ao atualizar quantidade do produto:', updateError);
        return false;
      }
      console.log(`[ESTOQUE] Produto atualizado com sucesso`);

      // Registrar movimentação
      const movimentacaoData = {
        produto_id: produtoId,
        tipo: 'saida' as const,
        quantidade,
        quantidade_anterior: quantidadeAnterior,
        motivo: `Venda - OS ${osNumero}`,
        valor_unitario: produto.preco_venda,
        os_numero: osNumero,
        user_id: user.id
      };
      console.log(`[ESTOQUE] Inserindo movimentação:`, movimentacaoData);

      const { data: movData, error: movError } = await supabase
        .from('movimentacoes')
        .insert(movimentacaoData)
        .select();

      if (movError) {
        console.error('[ESTOQUE] Erro ao registrar movimentação:', movError);
        console.error('[ESTOQUE] Dados da movimentação que falharam:', movimentacaoData);
        
        // Reverter a atualização do produto
        console.log(`[ESTOQUE] Revertendo quantidade do produto para ${quantidadeAnterior}`);
        const { error: revertError } = await supabase
          .from('produtos')
          .update({ quantidade: quantidadeAnterior })
          .eq('id', produtoId);
        
        if (revertError) {
          console.error('[ESTOQUE] Erro crítico ao reverter quantidade:', revertError);
        }
        return false;
      }

      console.log(`[ESTOQUE] Movimentação registrada com sucesso:`, movData);
      this.notificarListeners();
      console.log(`[ESTOQUE] ✅ Baixa no estoque concluída: ${quantidade} unidades de ${produto.nome} para OS ${osNumero}`);
      return true;
    } catch (error) {
      console.error('[ESTOQUE] Erro inesperado ao dar baixa no estoque:', error);
      return false;
    }
  }

  // Adicionar estoque (entrada)
  public async adicionarEstoque(
    produtoId: string, 
    quantidade: number, 
    motivo: string, 
    valorUnitario?: number
  ): Promise<boolean> {
    console.log(`[ESTOQUE] Iniciando entrada - Produto: ${produtoId}, Quantidade: ${quantidade}, Motivo: ${motivo}`);
    
    try {
      // Verificar usuário autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[ESTOQUE] Usuário não autenticado:', authError);
        return false;
      }

      // Buscar produto atual
      const produto = await this.buscarProdutoPorId(produtoId);
      
      if (!produto) {
        console.error(`[ESTOQUE] Produto com ID ${produtoId} não encontrado`);
        return false;
      }

      const quantidadeAnterior = produto.quantidade;
      const novaQuantidade = quantidadeAnterior + quantidade;

      // Atualizar quantidade do produto
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ 
          quantidade: novaQuantidade,
          data_entrada: new Date().toISOString()
        })
        .eq('id', produtoId);

      if (updateError) {
        console.error('[ESTOQUE] Erro ao atualizar quantidade do produto:', updateError);
        return false;
      }

      // Registrar movimentação
      const movimentacaoData = {
        produto_id: produtoId,
        tipo: 'entrada' as const,
        quantidade,
        quantidade_anterior: quantidadeAnterior,
        motivo,
        valor_unitario: valorUnitario || produto.preco_custo,
        user_id: user.id
      };

      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert(movimentacaoData);

      if (movError) {
        console.error('[ESTOQUE] Erro ao registrar movimentação:', movError);
        // Reverter a atualização do produto
        await supabase
          .from('produtos')
          .update({ quantidade: quantidadeAnterior })
          .eq('id', produtoId);
        return false;
      }

      this.notificarListeners();
      console.log(`[ESTOQUE] ✅ Entrada no estoque: ${quantidade} unidades de ${produto.nome}`);
      return true;
    } catch (error) {
      console.error('[ESTOQUE] Erro ao adicionar estoque:', error);
      return false;
    }
  }

  // Obter produtos com estoque baixo
  public async getProdutosEstoqueBaixo(): Promise<ProdutoComCategoria[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(nome)
      `)
      .eq('status', 'ativo');

    if (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      throw error;
    }

    // Filter on client side since we need to compare two columns
    const produtosEstoqueBaixo = (data || []).filter(produto => 
      produto.quantidade <= produto.estoque_minimo
    );

    return produtosEstoqueBaixo;
  }

  // Obter todos os produtos
  public async getProdutos(): Promise<ProdutoComCategoria[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(nome)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }

    return data || [];
  }

  // Obter movimentações
  public async getMovimentacoes(): Promise<any[]> {
    const { data, error } = await supabase
      .from('movimentacoes')
      .select(`
        *,
        produto:produtos(nome, marca)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar movimentações:', error);
      throw error;
    }

    return data || [];
  }

  // Adicionar listener para mudanças no estoque
  public addListener(callback: () => void) {
    this.listeners.push(callback);
  }

  // Remover listener
  public removeListener(callback: () => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar todos os listeners
  private notificarListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Converter produto do estoque para produto de venda
  public produtoParaVenda(produto: ProdutoComCategoria, quantidade: number = 1): ProdutoVenda {
    return {
      id: produto.id,
      nome: produto.nome,
      marca: produto.marca,
      valor: Number(produto.preco_venda),
      quantidade: quantidade
    };
  }

  // Processar venda (dar baixa em múltiplos produtos)
  public async processarVenda(produtos: ProdutoVenda[], osNumero: string): Promise<boolean> {
    console.log(`[ESTOQUE] Iniciando processamento de venda - OS: ${osNumero}, Produtos: ${produtos.length}`);
    
    try {
      const produtosProcessados: string[] = [];

      // Verificar se todos os produtos têm estoque suficiente
      console.log(`[ESTOQUE] Verificando estoque para ${produtos.length} produtos`);
      for (const produto of produtos) {
        const temEstoque = await this.verificarEstoque(produto.id, produto.quantidade);
        if (!temEstoque) {
          const produtoEstoque = await this.buscarProdutoPorId(produto.id);
          console.error(`[ESTOQUE] Estoque insuficiente para ${produtoEstoque?.nome}. Disponível: ${produtoEstoque?.quantidade}, Solicitado: ${produto.quantidade}`);
          return false;
        }
        console.log(`[ESTOQUE] ✅ Estoque verificado para ${produto.nome}: ${produto.quantidade} unidades`);
      }

      // Dar baixa em todos os produtos
      console.log(`[ESTOQUE] Iniciando baixa em todos os produtos`);
      for (const produto of produtos) {
        console.log(`[ESTOQUE] Processando produto: ${produto.nome} (${produto.quantidade} unidades)`);
        const sucesso = await this.darBaixaEstoque(produto.id, produto.quantidade, osNumero);
        if (!sucesso) {
          console.error(`[ESTOQUE] ❌ Erro ao dar baixa no produto ${produto.nome}`);
          
          // Tentar reverter produtos já processados
          console.log(`[ESTOQUE] Tentando reverter produtos já processados: ${produtosProcessados.length}`);
          for (const produtoId of produtosProcessados) {
            const produtoReverter = produtos.find(p => p.id === produtoId);
            if (produtoReverter) {
              await this.adicionarEstoque(
                produtoId, 
                produtoReverter.quantidade, 
                `Reversão automática - Falha na venda OS ${osNumero}`
              );
            }
          }
          return false;
        }
        produtosProcessados.push(produto.id);
        console.log(`[ESTOQUE] ✅ Baixa concluída para ${produto.nome}`);
      }

      console.log(`[ESTOQUE] ✅ Venda processada com sucesso - OS: ${osNumero}, ${produtos.length} produtos`);
      return true;
    } catch (error) {
      console.error('[ESTOQUE] Erro inesperado ao processar venda:', error);
      return false;
    }
  }

  // Inicializar com produtos padrão (para migração)
  public async inicializarComProdutosPadrao(produtos: any[]): Promise<void> {
    try {
      for (const produto of produtos) {
        // Buscar categoria padrão
        const { data: categoria } = await supabase
          .from('categorias')
          .select('id')
          .eq('nome', 'Peças Automotivas')
          .single();

        const produtoData = {
          nome: produto.nome,
          marca: produto.marca,
          codigo: produto.codigo,
          categoria_id: categoria?.id,
          preco_custo: produto.valorCompra,
          preco_venda: produto.valorVenda,
          quantidade: produto.quantidadeAtual,
          estoque_minimo: produto.quantidadeMinima,
          status: produto.status === 'Ativo' ? 'ativo' as const : 'inativo' as const
        };

        const { error } = await supabase
          .from('produtos')
          .insert(produtoData);

        if (error) {
          console.error('Erro ao inserir produto:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar produtos padrão:', error);
    }
  }
}

// Exportar instância singleton
export const supabaseEstoqueManager = SupabaseEstoqueManager.getInstance();

// Hook personalizado para usar o estoque com Supabase
export const useSupabaseEstoque = () => {
  return {
    buscarProduto: (termo: string) => supabaseEstoqueManager.buscarProduto(termo),
    buscarProdutoPorId: (id: string) => supabaseEstoqueManager.buscarProdutoPorId(id),
    verificarEstoque: (produtoId: string, quantidade: number) => supabaseEstoqueManager.verificarEstoque(produtoId, quantidade),
    darBaixaEstoque: (produtoId: string, quantidade: number, osNumero: string) => supabaseEstoqueManager.darBaixaEstoque(produtoId, quantidade, osNumero),
    adicionarEstoque: (produtoId: string, quantidade: number, motivo: string, valorUnitario?: number) => supabaseEstoqueManager.adicionarEstoque(produtoId, quantidade, motivo, valorUnitario),
    getProdutosEstoqueBaixo: () => supabaseEstoqueManager.getProdutosEstoqueBaixo(),
    getProdutos: () => supabaseEstoqueManager.getProdutos(),
    getMovimentacoes: () => supabaseEstoqueManager.getMovimentacoes(),
    produtoParaVenda: (produto: ProdutoComCategoria, quantidade?: number) => supabaseEstoqueManager.produtoParaVenda(produto, quantidade),
    processarVenda: (produtos: ProdutoVenda[], osNumero: string) => supabaseEstoqueManager.processarVenda(produtos, osNumero),
    inicializarComProdutosPadrao: (produtos: any[]) => supabaseEstoqueManager.inicializarComProdutosPadrao(produtos)
  };
};