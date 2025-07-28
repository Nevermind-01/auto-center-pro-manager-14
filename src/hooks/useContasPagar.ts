import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContaPagar {
  id: string;
  empresa: string;
  descricao?: string;
  valor: number;
  status: 'pendente' | 'paga' | 'cancelada';
  forma_pagamento?: string;
  vencimento: string;
  data_pagamento?: string;
  comprovante_url?: string;
  fixa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContaPagarFilters {
  status?: string;
  empresa?: string;
  vencimento_inicio?: string;
  vencimento_fim?: string;
}

export function useContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContaPagarFilters>({});
  const { toast } = useToast();

  const fetchContas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('contas_a_pagar')
        .select('*')
        .order('vencimento', { ascending: true });

      if (filters.status && filters.status !== 'todas') {
        query = query.eq('status', filters.status);
      }

      if (filters.empresa) {
        query = query.ilike('empresa', `%${filters.empresa}%`);
      }

      if (filters.vencimento_inicio) {
        query = query.gte('vencimento', filters.vencimento_inicio);
      }

      if (filters.vencimento_fim) {
        query = query.lte('vencimento', filters.vencimento_fim);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContas((data || []) as ContaPagar[]);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar contas a pagar."
      });
    } finally {
      setLoading(false);
    }
  };

  const createConta = async (contaData: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .insert(contaData)
        .select()
        .single();

      if (error) throw error;

      // Se a conta está sendo criada como "paga", registrar no log
      if (contaData.status === 'paga') {
        await registrarLogPagamento(data as ContaPagar);
      }

      await fetchContas();
      toast({
        title: "Sucesso",
        description: "Conta a pagar criada com sucesso!"
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar conta a pagar."
      });
      throw error;
    }
  };

  const updateContaStatus = async (id: string, status: 'paga' | 'cancelada') => {
    try {
      const updateData: any = { status };
      if (status === 'paga') {
        updateData.data_pagamento = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('contas_a_pagar')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Se marcou como paga, registrar no log
      if (status === 'paga') {
        await registrarLogPagamento(data as ContaPagar);
      }

      await fetchContas();
      toast({
        title: "Sucesso",
        description: `Conta ${status === 'paga' ? 'marcada como paga' : 'cancelada'} com sucesso!`
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status da conta."
      });
      throw error;
    }
  };

  const registrarLogPagamento = async (conta: ContaPagar) => {
    try {
      await supabase
        .from('log_movimentacoes')
        .insert({
          tipo: 'conta_a_pagar',
          os_id: conta.id,
          dados_novos: {
            empresa: conta.empresa,
            valor: conta.valor,
            status: conta.status,
            descricao: `Pagamento de ${conta.empresa}`
          },
          observacoes: `Pagamento de ${conta.empresa} - R$ ${conta.valor}`
        });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const uploadComprovante = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer upload do comprovante."
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchContas();
  }, [filters]);

  return {
    contas,
    loading,
    filters,
    setFilters,
    createConta,
    updateContaStatus,
    uploadComprovante,
    refetch: fetchContas
  };
}