import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OSDetails {
  id: string;
  numero_os: string;
  status: string;
  created_at: string;
  updated_at: string;
  finalizado_em?: string;
  cliente_nome: string;
  observacoes?: string;
  valor_total: number;
  valor_desconto: number;
  valor_final: number;
  forma_pagamento: string;
  parcelas: number;
  user_id?: string;
  cliente: {
    nome: string;
    telefone?: string;
    cpf?: string;
    cnpj?: string;
    rg?: string;
    rua?: string;
    numero_residencia?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  } | null;
  veiculo: {
    marca: string;
    modelo: string;
    placa: string;
    ano?: string;
    observacoes?: string;
  } | null;
  mecanico: {
    nome: string;
    especialidade?: string;
  } | null;
  venda_produtos: Array<{
    id: string;
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }>;
  venda_servicos: Array<{
    id: string;
    servico_nome: string;
    preco: number;
  }>;
  creator: {
    email?: string;
    full_name?: string;
  } | null;
}

export const useOSDetails = (osId: string | null) => {
  return useQuery({
    queryKey: ['os-details', osId],
    queryFn: async (): Promise<OSDetails | null> => {
      if (!osId) return null;

      // Fetch main OS data with relationships
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .select(`
          id,
          numero_os,
          status,
          created_at,
          updated_at,
          finalizado_em,
          cliente_nome,
          observacoes,
          valor_total,
          valor_desconto,
          valor_final,
          forma_pagamento,
          parcelas,
          user_id,
          clientes!vendas_cliente_id_fkey (
            nome,
            telefone,
            cpf,
            cnpj,
            rg,
            rua,
            numero_residencia,
            bairro,
            cidade,
            estado
          ),
          veiculos!vendas_veiculo_id_fkey (
            marca,
            modelo,
            placa,
            ano,
            observacoes
          ),
          mecanicos!vendas_mecanico_id_fkey (
            nome,
            especialidade
          )
        `)
        .eq('id', osId)
        .single();

      if (vendaError) throw vendaError;
      if (!vendaData) return null;

      // Fetch products
      const { data: produtosData, error: produtosError } = await supabase
        .from('venda_produtos')
        .select('id, produto_nome, quantidade, preco_unitario, preco_total')
        .eq('venda_id', osId);

      if (produtosError) throw produtosError;

      // Fetch services
      const { data: servicosData, error: servicosError } = await supabase
        .from('venda_servicos')
        .select('id, servico_nome, preco')
        .eq('venda_id', osId);

      if (servicosError) throw servicosError;

      // Fetch creator profile if user_id exists
      let creatorData = null;
      if (vendaData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', vendaData.user_id)
          .single();
        
        creatorData = profileData;
      }

      return {
        ...vendaData,
        cliente: vendaData.clientes || null,
        veiculo: vendaData.veiculos || null,
        mecanico: vendaData.mecanicos || null,
        venda_produtos: produtosData || [],
        venda_servicos: servicosData || [],
        creator: creatorData
      };
    },
    enabled: !!osId,
  });
};