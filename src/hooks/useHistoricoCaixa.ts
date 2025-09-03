import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

export interface HistoricoVenda {
  id: string;
  numero_os: string;
  finalizado_em: string;
  cliente_nome: string;
  valor_total: number;
  valor_desconto: number;
  valor_final: number;
  forma_pagamento: string;
  status: string;
  valor_comissao: number;
}

export interface FiltrosPeriodo {
  dataInicio: Date;
  dataFim: Date;
}

export type TipoPeriodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';

export function useHistoricoCaixa(filtros: FiltrosPeriodo, numeroOS?: string) {
  const { empresaId } = useEmpresaContext();

  const { data: historico, isLoading, error } = useQuery({
    queryKey: ['historico-caixa', empresaId, filtros.dataInicio, filtros.dataFim, numeroOS],
    queryFn: async () => {
      if (!empresaId) return [];

      let query = supabase
        .from('vendas')
        .select(`
          id,
          numero_os,
          finalizado_em,
          cliente_nome,
          valor_total,
          valor_desconto,
          valor_final,
          forma_pagamento,
          status,
          comissoes_mecanicos(valor_final)
        `)
        .eq('empresa_id', empresaId)
        .not('finalizado_em', 'is', null)
        .gte('finalizado_em', filtros.dataInicio.toISOString())
        .lte('finalizado_em', filtros.dataFim.toISOString())
        .order('finalizado_em', { ascending: false });

      if (numeroOS) {
        query = query.ilike('numero_os', `%${numeroOS}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Formatar dados para incluir valor da comissão
      return data.map((venda: any) => ({
        id: venda.id,
        numero_os: venda.numero_os,
        finalizado_em: venda.finalizado_em,
        cliente_nome: venda.cliente_nome,
        valor_total: venda.valor_total,
        valor_desconto: venda.valor_desconto || 0,
        valor_final: venda.valor_final,
        forma_pagamento: venda.forma_pagamento,
        status: venda.status,
        valor_comissao: venda.comissoes_mecanicos?.[0]?.valor_final || 0,
      })) as HistoricoVenda[];
    },
    enabled: !!empresaId,
  });

  // Calcular totalizadores
  const totalizadores = {
    totalVendas: historico?.length || 0,
    valorTotal: historico?.reduce((sum, v) => sum + v.valor_total, 0) || 0,
    valorDesconto: historico?.reduce((sum, v) => sum + v.valor_desconto, 0) || 0,
    valorFinal: historico?.reduce((sum, v) => sum + v.valor_final, 0) || 0,
    valorComissao: historico?.reduce((sum, v) => sum + v.valor_comissao, 0) || 0,
  };

  return {
    historico: historico || [],
    totalizadores,
    isLoading,
    error,
  };
}

// Funções utilitárias para períodos
export function obterPeriodo(tipo: TipoPeriodo, dataCustom?: { inicio: Date; fim: Date }): FiltrosPeriodo {
  const hoje = new Date();

  switch (tipo) {
    case 'hoje':
      return {
        dataInicio: startOfDay(hoje),
        dataFim: endOfDay(hoje),
      };
    case 'semana':
      return {
        dataInicio: startOfWeek(hoje),
        dataFim: endOfWeek(hoje),
      };
    case 'mes':
      return {
        dataInicio: startOfMonth(hoje),
        dataFim: endOfMonth(hoje),
      };
    case 'ano':
      return {
        dataInicio: startOfYear(hoje),
        dataFim: endOfYear(hoje),
      };
    case 'personalizado':
      if (!dataCustom) {
        return obterPeriodo('hoje');
      }
      return {
        dataInicio: startOfDay(dataCustom.inicio),
        dataFim: endOfDay(dataCustom.fim),
      };
    default:
      return obterPeriodo('hoje');
  }
}