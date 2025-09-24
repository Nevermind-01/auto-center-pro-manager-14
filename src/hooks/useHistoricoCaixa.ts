import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import { getFormaPagamentoDescription, type FormaPagamento } from '@/lib/paymentMethodMapper';

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
  tipo_transacao: 'bruto' | 'carteira';
  valor_pago_posterior?: number;
  forma_pagamento_posterior?: string;
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

      // Query para buscar vendas (incluindo carteira)
      let vendasQuery = supabase
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
          status
        `)
        .eq('empresa_id', empresaId)
        .not('finalizado_em', 'is', null)
        .gte('finalizado_em', filtros.dataInicio.toISOString())
        .lte('finalizado_em', filtros.dataFim.toISOString())
        .order('finalizado_em', { ascending: false });

      if (numeroOS) {
        vendasQuery = vendasQuery.ilike('numero_os', `%${numeroOS}%`);
      }

      // Query para buscar comissões
      const comissoesQuery = supabase
        .from('comissoes_mecanicos')
        .select('venda_id, valor_final')
        .eq('empresa_id', empresaId);

      // Query para buscar pagamentos posteriores das vendas em carteira
      const pagamentosQuery = supabase
        .from('pagamentos_os')
        .select(`
          os_id,
          valor_pago,
          forma_pagamento,
          data_pagamento,
          vendas!inner(
            id,
            numero_os,
            forma_pagamento
          )
        `)
        .eq('empresa_id', empresaId)
        .gte('data_pagamento', filtros.dataInicio.toISOString())
        .lte('data_pagamento', filtros.dataFim.toISOString());

      // Executar queries em paralelo
      const [vendasResult, comissoesResult, pagamentosResult] = await Promise.all([
        vendasQuery,
        comissoesQuery,
        pagamentosQuery
      ]);

      if (vendasResult.error) throw vendasResult.error;
      if (comissoesResult.error) throw comissoesResult.error;
      if (pagamentosResult.error) throw pagamentosResult.error;

      // Criar mapa de comissões por venda_id
      const comissoesMap = new Map<string, number>();
      comissoesResult.data?.forEach((comissao) => {
        comissoesMap.set(comissao.venda_id, comissao.valor_final || 0);
      });

      // Criar mapa de pagamentos posteriores por venda_id
      const pagamentosMap = new Map<string, { valor_pago: number; forma_pagamento: string }>();
      pagamentosResult.data?.forEach((pagamento: any) => {
        const existente = pagamentosMap.get(pagamento.os_id) || { valor_pago: 0, forma_pagamento: '' };
        pagamentosMap.set(pagamento.os_id, {
          valor_pago: existente.valor_pago + pagamento.valor_pago,
          forma_pagamento: pagamento.forma_pagamento || existente.forma_pagamento
        });
      });

      // Combinar dados de vendas com comissões e pagamentos
      return vendasResult.data.map((venda: any) => {
        const pagamentoPosterior = pagamentosMap.get(venda.id);
        const isCarteira = venda.forma_pagamento === 'carteira';
        const temPagamentoPosterior = pagamentoPosterior && pagamentoPosterior.valor_pago > 0;

        return {
          id: venda.id,
          numero_os: venda.numero_os,
          finalizado_em: venda.finalizado_em,
          cliente_nome: venda.cliente_nome,
          valor_total: venda.valor_total,
          valor_desconto: venda.valor_desconto || 0,
          valor_final: venda.valor_final,
          forma_pagamento: getFormaPagamentoDescription(venda.forma_pagamento as FormaPagamento),
          status: venda.status,
          valor_comissao: comissoesMap.get(venda.id) || 0,
          tipo_transacao: (isCarteira && !temPagamentePosterior) ? 'carteira' : 'bruto',
          valor_pago_posterior: pagamentoPosterior?.valor_pago,
          forma_pagamento_posterior: pagamentoPosterior?.forma_pagamento 
            ? getFormaPagamentoDescription(pagamentoPosterior.forma_pagamento as FormaPagamento)
            : undefined,
        };
      }) as HistoricoVenda[];
    },
    enabled: !!empresaId,
  });

  // Calcular totalizadores separados
  const vendasBruto = historico?.filter(v => v.tipo_transacao === 'bruto') || [];
  const vendasCarteira = historico?.filter(v => v.tipo_transacao === 'carteira') || [];

  const totalizadores = {
    totalVendas: historico?.length || 0,
    totalVendasBruto: vendasBruto.length,
    totalVendasCarteira: vendasCarteira.length,
    
    // Valores brutos (apenas vendas pagas)
    valorTotalBruto: vendasBruto.reduce((sum, v) => sum + v.valor_total, 0),
    valorDescontoBruto: vendasBruto.reduce((sum, v) => sum + v.valor_desconto, 0),
    valorFinalBruto: vendasBruto.reduce((sum, v) => sum + v.valor_final, 0),
    valorComissaoBruto: vendasBruto.reduce((sum, v) => sum + v.valor_comissao, 0),
    
    // Valores carteira (apenas vendas em carteira)
    valorTotalCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_total, 0),
    valorDescontoCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_desconto, 0),
    valorFinalCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_final, 0),
    valorComissaoCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_comissao, 0),
    
    // Totais gerais (para compatibilidade)
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