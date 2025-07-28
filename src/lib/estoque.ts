// Sistema global de estoque
// Definindo interfaces localmente já que o arquivo original foi removido
export interface ProdutoEstoque {
  id: number;
  nome: string;
  marca: string;
  categoria: string;
  codigo: string;
  valorCompra: number;
  valorVenda: number;
  quantidadeAtual: number;
  quantidadeMinima: number;
  fornecedor: string;
  localizacao: string;
  dataUltimaEntrada: string;
  dataUltimaSaida?: string;
  status: "Ativo" | "Inativo" | "Descontinuado";
}

export interface MovimentacaoEstoque {
  id: number;
  produtoId: number;
  tipo: "Entrada" | "Saida" | "Ajuste";
  quantidade: number;
  motivo: string;
  valorUnitario: number;
  valorTotal: number;
  data: string;
  usuario: string;
  osNumero?: string;
}

// Interface para produtos usados nas vendas
export interface ProdutoVenda {
  id: number;
  nome: string;
  marca: string;
  valor: number;
  quantidade: number;
}

// Classe para gerenciar o estoque globalmente
class EstoqueManager {
  private static instance: EstoqueManager;
  private produtos: ProdutoEstoque[] = [];
  private movimentacoes: MovimentacaoEstoque[] = [];
  private listeners: Array<(produtos: ProdutoEstoque[]) => void> = [];

  public static getInstance(): EstoqueManager {
    if (!EstoqueManager.instance) {
      EstoqueManager.instance = new EstoqueManager();
    }
    return EstoqueManager.instance;
  }

  // Inicializar com produtos padrão
  public inicializarEstoque(produtos: ProdutoEstoque[]) {
    this.produtos = produtos;
    this.notificarListeners();
  }

  // Buscar produto por nome ou ID
  public buscarProduto(termo: string): ProdutoEstoque[] {
    return this.produtos.filter(produto => 
      produto.nome.toLowerCase().includes(termo.toLowerCase()) ||
      produto.marca.toLowerCase().includes(termo.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(termo.toLowerCase())
    );
  }

  // Buscar produto por ID
  public buscarProdutoPorId(id: number): ProdutoEstoque | undefined {
    return this.produtos.find(produto => produto.id === id);
  }

  // Verificar se há estoque suficiente
  public verificarEstoque(produtoId: number, quantidade: number): boolean {
    const produto = this.buscarProdutoPorId(produtoId);
    return produto ? produto.quantidadeAtual >= quantidade : false;
  }

  // Dar baixa no estoque (usado nas vendas)
  public darBaixaEstoque(produtoId: number, quantidade: number, osNumero: string): boolean {
    const produto = this.buscarProdutoPorId(produtoId);
    
    if (!produto) {
      console.error(`Produto com ID ${produtoId} não encontrado`);
      return false;
    }

    if (produto.quantidadeAtual < quantidade) {
      console.error(`Estoque insuficiente para ${produto.nome}. Disponível: ${produto.quantidadeAtual}, Solicitado: ${quantidade}`);
      return false;
    }

    // Atualizar quantidade
    produto.quantidadeAtual -= quantidade;
    produto.dataUltimaSaida = new Date().toISOString().split('T')[0];

    // Registrar movimentação
    const movimentacao: MovimentacaoEstoque = {
      id: Date.now(),
      produtoId: produto.id,
      tipo: "Saida",
      quantidade: quantidade,
      motivo: `Venda - OS ${osNumero}`,
      valorUnitario: produto.valorVenda,
      valorTotal: quantidade * produto.valorVenda,
      data: new Date().toISOString().split('T')[0],
      usuario: "Sistema",
      osNumero: osNumero
    };

    this.movimentacoes.push(movimentacao);
    this.notificarListeners();

    console.log(`Baixa no estoque: ${quantidade} unidades de ${produto.nome} para OS ${osNumero}`);
    return true;
  }

  // Adicionar estoque (entrada)
  public adicionarEstoque(produtoId: number, quantidade: number, motivo: string, valorUnitario?: number): boolean {
    const produto = this.buscarProdutoPorId(produtoId);
    
    if (!produto) {
      console.error(`Produto com ID ${produtoId} não encontrado`);
      return false;
    }

    // Atualizar quantidade
    produto.quantidadeAtual += quantidade;
    produto.dataUltimaEntrada = new Date().toISOString().split('T')[0];

    // Registrar movimentação
    const movimentacao: MovimentacaoEstoque = {
      id: Date.now(),
      produtoId: produto.id,
      tipo: "Entrada",
      quantidade: quantidade,
      motivo: motivo,
      valorUnitario: valorUnitario || produto.valorCompra,
      valorTotal: quantidade * (valorUnitario || produto.valorCompra),
      data: new Date().toISOString().split('T')[0],
      usuario: "Sistema"
    };

    this.movimentacoes.push(movimentacao);
    this.notificarListeners();

    console.log(`Entrada no estoque: ${quantidade} unidades de ${produto.nome}`);
    return true;
  }

  // Obter produtos com estoque baixo
  public getProdutosEstoqueBaixo(): ProdutoEstoque[] {
    return this.produtos.filter(produto => 
      produto.quantidadeAtual <= produto.quantidadeMinima && produto.status === "Ativo"
    );
  }

  // Obter todos os produtos
  public getProdutos(): ProdutoEstoque[] {
    return [...this.produtos];
  }

  // Obter movimentações
  public getMovimentacoes(): MovimentacaoEstoque[] {
    return [...this.movimentacoes];
  }

  // Adicionar listener para mudanças no estoque
  public addListener(callback: (produtos: ProdutoEstoque[]) => void) {
    this.listeners.push(callback);
  }

  // Remover listener
  public removeListener(callback: (produtos: ProdutoEstoque[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar todos os listeners
  private notificarListeners() {
    this.listeners.forEach(listener => listener([...this.produtos]));
  }

  // Converter produto do estoque para produto de venda
  public produtoParaVenda(produtoEstoque: ProdutoEstoque, quantidade: number = 1): ProdutoVenda {
    return {
      id: produtoEstoque.id,
      nome: produtoEstoque.nome,
      marca: produtoEstoque.marca,
      valor: produtoEstoque.valorVenda,
      quantidade: quantidade
    };
  }

  // Processar venda (dar baixa em múltiplos produtos)
  public processarVenda(produtos: ProdutoVenda[], osNumero: string): boolean {
    // Verificar se todos os produtos têm estoque suficiente
    for (const produto of produtos) {
      if (!this.verificarEstoque(produto.id, produto.quantidade)) {
        const produtoEstoque = this.buscarProdutoPorId(produto.id);
        console.error(`Estoque insuficiente para ${produtoEstoque?.nome}. Disponível: ${produtoEstoque?.quantidadeAtual}, Solicitado: ${produto.quantidade}`);
        return false;
      }
    }

    // Dar baixa em todos os produtos
    for (const produto of produtos) {
      if (!this.darBaixaEstoque(produto.id, produto.quantidade, osNumero)) {
        console.error(`Erro ao dar baixa no produto ${produto.nome}`);
        return false;
      }
    }

    return true;
  }
}

// Exportar instância singleton
export const estoqueManager = EstoqueManager.getInstance();

// Hook personalizado para usar o estoque
export const useEstoque = () => {
  return {
    buscarProduto: (termo: string) => estoqueManager.buscarProduto(termo),
    buscarProdutoPorId: (id: number) => estoqueManager.buscarProdutoPorId(id),
    verificarEstoque: (produtoId: number, quantidade: number) => estoqueManager.verificarEstoque(produtoId, quantidade),
    darBaixaEstoque: (produtoId: number, quantidade: number, osNumero: string) => estoqueManager.darBaixaEstoque(produtoId, quantidade, osNumero),
    adicionarEstoque: (produtoId: number, quantidade: number, motivo: string, valorUnitario?: number) => estoqueManager.adicionarEstoque(produtoId, quantidade, motivo, valorUnitario),
    getProdutosEstoqueBaixo: () => estoqueManager.getProdutosEstoqueBaixo(),
    getProdutos: () => estoqueManager.getProdutos(),
    getMovimentacoes: () => estoqueManager.getMovimentacoes(),
    produtoParaVenda: (produtoEstoque: ProdutoEstoque, quantidade?: number) => estoqueManager.produtoParaVenda(produtoEstoque, quantidade),
    processarVenda: (produtos: ProdutoVenda[], osNumero: string) => estoqueManager.processarVenda(produtos, osNumero)
  };
};