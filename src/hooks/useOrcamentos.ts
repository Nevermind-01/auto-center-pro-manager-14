import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEmpresaContext } from './useEmpresaContext';
import { useToast } from './use-toast';

export interface Orcamento {
  id: string;
  numero_orcamento: string;
  cliente_id: string;
  cliente_nome: string;
  veiculo_id?: string;
  mecanico_id?: string;
  valor_total: number;
  valor_desconto: number;
  valor_final: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'convertido_os';
  validade: string;
  observacoes?: string;
  observacoes_internas?: string;
  os_id?: string;
  created_at: string;
  updated_at: string;
  cliente: {
    nome: string;
    telefone?: string;
    cpf?: string;
  } | null;
  veiculo: {
    marca: string;
    modelo: string;
    placa: string;
  } | null;
  mecanico: {
    nome: string;
    especialidade?: string;
  } | null;
  orcamento_produtos: Array<{
    id: string;
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }>;
  orcamento_servicos: Array<{
    id: string;
    servico_nome: string;
    preco: number;
  }>;
  creator: {
    email?: string;
    full_name?: string;
  } | null;
}

export interface CreateOrcamentoData {
  numeroOrcamento: string;
  clienteId: string;
  clienteNome: string;
  veiculoId?: string;
  mecanicoId?: string;
  valorTotal: number;
  valorDesconto: number;
  valorFinal: number;
  validade: string;
  observacoes?: string;
  observacoesInternas?: string;
  produtos: Array<{
    id: string;
    nome: string;
    quantidade: number;
    valor: number;
  }>;
  servicos: Array<{
    id?: string;
    nome: string;
    valor: number;
  }>;
}

export const useOrcamentos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          id,
          numero_orcamento,
          cliente_id,
          cliente_nome,
          veiculo_id,
          mecanico_id,
          valor_total,
          valor_desconto,
          valor_final,
          status,
          validade,
          observacoes,
          observacoes_internas,
          os_id,
          user_id,
          created_at,
          updated_at,
          clientes!orcamentos_cliente_id_fkey (
            nome,
            telefone,
            cpf
          ),
          veiculos!orcamentos_veiculo_id_fkey (
            marca,
            modelo,
            placa
          ),
          mecanicos!orcamentos_mecanico_id_fkey (
            nome,
            especialidade
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useOrcamentoDetails = (orcamentoId: string | null) => {
  return useQuery({
    queryKey: ['orcamento-details', orcamentoId],
    queryFn: async (): Promise<Orcamento | null> => {
      if (!orcamentoId) return null;

      // Buscar orçamento principal
      const { data: orcamentoData, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          numero_orcamento,
          cliente_id,
          cliente_nome,
          veiculo_id,
          mecanico_id,
          valor_total,
          valor_desconto,
          valor_final,
          status,
          validade,
          observacoes,
          observacoes_internas,
          os_id,
          user_id,
          created_at,
          updated_at,
          clientes!orcamentos_cliente_id_fkey (
            nome,
            telefone,
            cpf
          ),
          veiculos!orcamentos_veiculo_id_fkey (
            marca,
            modelo,
            placa
          ),
          mecanicos!orcamentos_mecanico_id_fkey (
            nome,
            especialidade
          )
        `)
        .eq('id', orcamentoId)
        .single();

      if (orcamentoError) throw orcamentoError;
      if (!orcamentoData) return null;

      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('orcamento_produtos')
        .select('id, produto_nome, quantidade, preco_unitario, preco_total')
        .eq('orcamento_id', orcamentoId);

      if (produtosError) throw produtosError;

      // Buscar serviços
      const { data: servicosData, error: servicosError } = await supabase
        .from('orcamento_servicos')
        .select('id, servico_nome, preco')
        .eq('orcamento_id', orcamentoId);

      if (servicosError) throw servicosError;

      // Buscar criador do orçamento se user_id existir
      let creatorData = null;
      if (orcamentoData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', orcamentoData.user_id)
          .single();
        
        creatorData = profileData;
      }

      return {
        ...orcamentoData,
        cliente: orcamentoData.clientes || null,
        veiculo: orcamentoData.veiculos || null,
        mecanico: orcamentoData.mecanicos || null,
        orcamento_produtos: produtosData || [],
        orcamento_servicos: servicosData || [],
        creator: creatorData
      };
    },
    enabled: !!orcamentoId,
  });
};

export const useOrcamentoMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createOrcamento = useMutation({
    mutationFn: async (data: CreateOrcamentoData) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!empresaId) throw new Error('Empresa não selecionada');

      // Criar o orçamento
      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .insert({
          numero_orcamento: data.numeroOrcamento,
          cliente_id: data.clienteId,
          cliente_nome: data.clienteNome,
          veiculo_id: data.veiculoId,
          mecanico_id: data.mecanicoId,
          valor_total: data.valorTotal,
          valor_desconto: data.valorDesconto,
          valor_final: data.valorFinal,
          validade: data.validade,
          observacoes: data.observacoes,
          observacoes_internas: data.observacoesInternas,
          user_id: user.id,
        })
        .select()
        .single();

      if (orcamentoError) throw orcamentoError;

      // Inserir produtos (empresa_id será definido pelo trigger)
      if (data.produtos.length > 0) {
        const produtosInsert = data.produtos.map(produto => ({
          orcamento_id: orcamento.id,
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade: produto.quantidade,
          preco_unitario: produto.valor,
          preco_total: produto.valor * produto.quantidade,
          empresa_id: empresaId, // Adicionar empresa_id explicitamente
        }));
        
        const { error: produtosError } = await supabase
          .from('orcamento_produtos')
          .insert(produtosInsert);

        if (produtosError) throw produtosError;
      }

      // Inserir serviços (empresa_id será definido pelo trigger)
      if (data.servicos.length > 0) {
        const servicosInsert = data.servicos.map(servico => ({
          orcamento_id: orcamento.id,
          servico_id: servico.id || null,
          servico_nome: servico.nome,
          preco: servico.valor,
          empresa_id: empresaId, // Adicionar empresa_id explicitamente
        }));
        
        const { error: servicosError } = await supabase
          .from('orcamento_servicos')
          .insert(servicosInsert);

        if (servicosError) throw servicosError;
      }

      return orcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast({
        title: "Orçamento criado com sucesso!",
        description: "O orçamento foi salvo e está disponível na lista.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrcamentoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Orcamento['status'] }) => {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['orcamento-details'] });
      toast({
        title: "Status atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertToOS = useMutation({
    mutationFn: async (orcamentoId: string) => {
      if (!empresaId) throw new Error('Empresa não selecionada');
      
      // Buscar orçamento completo
      const orcamento = await queryClient.fetchQuery({
        queryKey: ['orcamento-details', orcamentoId],
      }) as Orcamento;

      if (!orcamento) throw new Error('Orçamento não encontrado');
      if (orcamento.status !== 'aprovado') throw new Error('Apenas orçamentos aprovados podem ser convertidos');

      // Gerar número da OS
      const numeroOS = `OS-${Date.now()}`;

      // Criar a OS
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          numero_os: numeroOS,
          cliente_id: orcamento.cliente_id,
          cliente_nome: orcamento.cliente_nome,
          veiculo_id: orcamento.veiculo_id,
          mecanico_id: orcamento.mecanico_id,
          valor_total: orcamento.valor_total,
          valor_desconto: orcamento.valor_desconto,
          valor_final: orcamento.valor_final,
          forma_pagamento: 'dinheiro',
          observacoes: orcamento.observacoes,
          status: 'pendente',
          user_id: user?.id,
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Copiar produtos
      if (orcamento.orcamento_produtos.length > 0) {
        const produtosInsert = orcamento.orcamento_produtos.map(produto => ({
          venda_id: venda.id,
          produto_id: produto.id,
          produto_nome: produto.produto_nome,
          quantidade: produto.quantidade,
          preco_unitario: produto.preco_unitario,
          preco_total: produto.preco_total,
          empresa_id: empresaId, // Adicionar empresa_id explicitamente
        }));
        
        const { error: produtosError } = await supabase
          .from('venda_produtos')
          .insert(produtosInsert);

        if (produtosError) throw produtosError;
      }

      // Copiar serviços
      if (orcamento.orcamento_servicos.length > 0) {
        const servicosInsert = orcamento.orcamento_servicos.map(servico => ({
          venda_id: venda.id,
          servico_id: servico.id || null,
          servico_nome: servico.servico_nome,
          preco: servico.preco,
          empresa_id: empresaId, // Adicionar empresa_id explicitamente
        }));
        
        const { error: servicosError } = await supabase
          .from('venda_servicos')
          .insert(servicosInsert);

        if (servicosError) throw servicosError;
      }

      // Atualizar orçamento
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({
          status: 'convertido_os',
          os_id: venda.id,
        })
        .eq('id', orcamentoId);

      if (updateError) throw updateError;

      return { venda, numeroOS };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['orcamento-details'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: "Orçamento convertido com sucesso!",
        description: `OS ${result.numeroOS} criada e disponível no Histórico.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao converter orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createOrcamento,
    updateOrcamentoStatus,
    convertToOS,
  };
};