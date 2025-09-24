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
  tipo_entrada: 'finalizacao' | 'pagamento_posterior';
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

      // Query para buscar vendas finalizadas no período
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

      // Query para buscar TODOS os pagamentos no período (incluindo avulsos)
      const pagamentosQuery = supabase
        .from('pagamentos_os')
        .select(`
          id,
          os_id,
          valor_pago,
          forma_pagamento,
          data_pagamento,
          observacoes,
          vendas(
            id,
            numero_os,
            cliente_nome,
            forma_pagamento,
            finalizado_em
          )
        `)
        .eq('empresa_id', empresaId)
        .gte('data_pagamento', filtros.dataInicio.toISOString())
        .lte('data_pagamento', filtros.dataFim.toISOString())
        .order('data_pagamento', { ascending: false });

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

      const historico: HistoricoVenda[] = [];

      // 1. Processar vendas finalizadas no período
      vendasResult.data.forEach((venda: any) => {
        const isCarteira = venda.forma_pagamento === 'carteira';
        
        historico.push({
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
          // Vendas em carteira sempre ficam como "carteira", outras sempre como "bruto"
          tipo_transacao: isCarteira ? 'carteira' : 'bruto',
          tipo_entrada: 'finalizacao',
        });
      });

      // 2. Processar pagamentos posteriores/avulsos no período
      pagamentosResult.data?.forEach((pagamento: any) => {
        const venda = pagamento.vendas;
        
        // Se a venda não foi finalizada no período atual, adicionar como entrada separada
        const vendaJaIncluida = venda && vendasResult.data.some((v: any) => v.id === venda.id);
        
        if (!vendaJaIncluida && venda) {
          // Pagamento de venda de outro período - incluir como entrada separada
          historico.push({
            id: `pagamento-${pagamento.id}`,
            numero_os: venda.numero_os,
            finalizado_em: pagamento.data_pagamento,
            cliente_nome: venda.cliente_nome,
            valor_total: 0,
            valor_desconto: 0,
            valor_final: pagamento.valor_pago,
            forma_pagamento: getFormaPagamentoDescription(pagamento.forma_pagamento as FormaPagamento),
            status: 'Pago',
            valor_comissao: 0,
            tipo_transacao: 'bruto', // Pagamentos sempre vão para bruto
            tipo_entrada: 'pagamento_posterior',
            valor_pago_posterior: pagamento.valor_pago,
            forma_pagamento_posterior: getFormaPagamentoDescription(pagamento.forma_pagamento as FormaPagamento),
          });
        }
      });

      // Ordenar por data (mais recente primeiro)
      return historico.sort((a, b) => 
        new Date(b.finalizado_em).getTime() - new Date(a.finalizado_em).getTime()
      );
    },
    enabled: !!empresaId,
  });

  // Calcular totalizadores separados
  const vendasCarteira = historico?.filter(v => v.tipo_transacao === 'carteira' && v.tipo_entrada === 'finalizacao') || [];
  const vendasBruto = historico?.filter(v => v.tipo_transacao === 'bruto') || [];
  const pagamentosPosteriores = historico?.filter(v => v.tipo_entrada === 'pagamento_posterior') || [];

  const totalizadores = {
    totalVendas: vendasCarteira.length + vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').length,
    totalVendasBruto: vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').length,
    totalVendasCarteira: vendasCarteira.length,
    totalPagamentosPosteriores: pagamentosPosteriores.length,
    
    // Valores carteira (apenas finalizações em carteira)
    valorTotalCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_total, 0),
    valorDescontoCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_desconto, 0),
    valorFinalCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_final, 0),
    valorComissaoCarteira: vendasCarteira.reduce((sum, v) => sum + v.valor_comissao, 0),
    
    // Valores brutos reais (finalizações não-carteira + pagamentos posteriores)
    valorTotalBrutoReal: vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').reduce((sum, v) => sum + v.valor_total, 0),
    valorDescontoBrutoReal: vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').reduce((sum, v) => sum + v.valor_desconto, 0),
    valorFinalBrutoReal: vendasBruto.reduce((sum, v) => sum + v.valor_final, 0), // Inclui pagamentos posteriores
    valorComissaoBrutoReal: vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').reduce((sum, v) => sum + v.valor_comissao, 0),
    
    // Valores dos pagamentos posteriores/avulsos
    valorPagamentosPosteriores: pagamentosPosteriores.reduce((sum, v) => sum + v.valor_final, 0),
    
    // Totais gerais (para compatibilidade)
    valorTotal: vendasCarteira.reduce((sum, v) => sum + v.valor_total, 0) + 
               vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').reduce((sum, v) => sum + v.valor_total, 0),
    valorDesconto: vendasCarteira.reduce((sum, v) => sum + v.valor_desconto, 0) + 
                  vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').reduce((sum, v) => sum + v.valor_desconto, 0),
    valorFinal: historico?.reduce((sum, v) => sum + v.valor_final, 0) || 0,
    valorComissao: vendasCarteira.reduce((sum, v) => sum + v.valor_comissao, 0) + 
                  vendasBruto.filter(v => v.tipo_entrada === 'finalizacao').reduce((sum, v) => sum + v.valor_comissao, 0),
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