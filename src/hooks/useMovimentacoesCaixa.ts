import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useCaixa } from './useCaixa';
import { type FormaPagamento, isValidFormaPagamento } from '@/lib/paymentMethodMapper';

export interface MovimentacaoCaixa {
  id: string;
  empresa_id: string;
  caixa_id: string;
  tipo_origem: 'OS' | 'VENDA' | 'MANUAL';
  referencia_id?: string;
  tipo: 'entrada' | 'saida';
  forma_pagamento: FormaPagamento;
  valor_bruto: number;
  valor_liquido: number;
  data_hora: string;
  descricao?: string;
  criado_por: string;
  conciliado: boolean;
  referencia_conciliacao?: string;
  metadados?: any;
  created_at: string;
}

export interface CriarMovimentacaoData {
  tipo_origem: 'OS' | 'VENDA' | 'MANUAL';
  referencia_id?: string;
  tipo: 'entrada' | 'saida';
  forma_pagamento: FormaPagamento;
  valor_bruto: number;
  valor_liquido?: number;
  descricao?: string;
  metadados?: any;
}

export function useMovimentacoesCaixa() {
  const { toast } = useToast();
  const { empresaId } = useEmpresaContext();
  const { caixaAtual } = useCaixa();
  const queryClient = useQueryClient();

  // Buscar movimentações do caixa atual
  const { data: movimentacoes, isLoading } = useQuery({
    queryKey: ['movimentacoes-caixa', caixaAtual?.id],
    queryFn: async () => {
      if (!caixaAtual?.id) return [];

      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .select('*')
        .eq('caixa_id', caixaAtual.id)
        .order('data_hora', { ascending: false });

      if (error) throw error;
      return data as MovimentacaoCaixa[];
    },
    enabled: !!caixaAtual?.id,
  });

  // Buscar resumo por forma de pagamento
  const { data: resumoPorForma } = useQuery({
    queryKey: ['resumo-caixa', caixaAtual?.id],
    queryFn: async () => {
      if (!caixaAtual?.id) return {};

      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .select('forma_pagamento, tipo, valor_liquido')
        .eq('caixa_id', caixaAtual.id);

      if (error) throw error;

      const resumo: Record<string, { entradas: number; saidas: number; total: number }> = {};
      
      data.forEach((mov) => {
        if (!resumo[mov.forma_pagamento]) {
          resumo[mov.forma_pagamento] = { entradas: 0, saidas: 0, total: 0 };
        }
        
        if (mov.tipo === 'entrada') {
          resumo[mov.forma_pagamento].entradas += Number(mov.valor_liquido);
        } else {
          resumo[mov.forma_pagamento].saidas += Number(mov.valor_liquido);
        }
        
        resumo[mov.forma_pagamento].total = 
          resumo[mov.forma_pagamento].entradas - resumo[mov.forma_pagamento].saidas;
      });

      return resumo;
    },
    enabled: !!caixaAtual?.id,
  });

  // Mutation para criar movimentação
  const criarMovimentacao = useMutation({
    mutationFn: async (data: CriarMovimentacaoData) => {
      console.log('🏦 [useMovimentacoesCaixa] Iniciando criação de movimentação:', {
        data,
        caixaAtual: caixaAtual?.id,
        empresaId
      });

      if (!caixaAtual) {
        console.error('❌ [useMovimentacoesCaixa] Nenhum caixa aberto encontrado');
        throw new Error('Nenhum caixa aberto encontrado');
      }
      
      if (!empresaId) {
        console.error('❌ [useMovimentacoesCaixa] Empresa não selecionada');
        throw new Error('Empresa não selecionada');
      }

      // Validar forma de pagamento antes de inserir
      if (!isValidFormaPagamento(data.forma_pagamento)) {
        console.error('❌ [useMovimentacoesCaixa] Forma de pagamento inválida:', data.forma_pagamento);
        throw new Error(`Forma de pagamento inválida: ${data.forma_pagamento}. Valores aceitos: dinheiro, pix, debito, credito, cheque, boleto, outros`);
      }

      console.log('✅ [useMovimentacoesCaixa] Validações passaram, prosseguindo com inserção');

      const valorLiquido = data.valor_liquido || data.valor_bruto;

      const { data: novaMovimentacao, error } = await supabase
        .from('movimentacoes_caixa')
        .insert({
          empresa_id: empresaId,
          caixa_id: caixaAtual.id,
          tipo_origem: data.tipo_origem,
          referencia_id: data.referencia_id,
          tipo: data.tipo,
          forma_pagamento: data.forma_pagamento,
          valor_bruto: data.valor_bruto,
          valor_liquido: valorLiquido,
          descricao: data.descricao,
          metadados: data.metadados,
          criado_por: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [useMovimentacoesCaixa] Erro ao inserir na tabela movimentacoes_caixa:', error);
        throw error;
      }

      console.log('✅ [useMovimentacoesCaixa] Movimentação inserida com sucesso:', novaMovimentacao);

      // Registrar na auditoria
      try {
        await supabase.from('auditoria_caixa').insert({
          empresa_id: empresaId,
          caixa_id: caixaAtual.id,
          acao: 'MOVIMENTACAO_CRIADA',
          detalhes: {
            tipo: data.tipo,
            forma_pagamento: data.forma_pagamento,
            valor: valorLiquido,
            descricao: data.descricao,
          },
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });
        console.log('✅ [useMovimentacoesCaixa] Auditoria registrada com sucesso');
      } catch (auditError) {
        console.warn('⚠️ [useMovimentacoesCaixa] Falha ao registrar auditoria (não crítico):', auditError);
      }

      return novaMovimentacao;
    },
    onSuccess: () => {
      toast({
        title: "Movimentação registrada",
        description: "A movimentação foi registrada no caixa com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-caixa'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para conciliar movimentação
  const conciliarMovimentacao = useMutation({
    mutationFn: async ({ id, referencia }: { id: string; referencia: string }) => {
      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .update({
          conciliado: true,
          referencia_conciliacao: referencia,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Movimentação conciliada",
        description: "A movimentação foi conciliada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-caixa'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao conciliar movimentação",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  return {
    movimentacoes,
    resumoPorForma,
    isLoading,
    criarMovimentacao: criarMovimentacao.mutate,
    criarMovimentacaoAsync: criarMovimentacao.mutateAsync,
    conciliarMovimentacao: conciliarMovimentacao.mutate,
    isCriandoMovimentacao: criarMovimentacao.isPending,
    isConciliandoMovimentacao: conciliarMovimentacao.isPending,
  };
}