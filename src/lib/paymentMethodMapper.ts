/**
 * Utility functions to handle payment method enum mapping between different tables
 */

// Enum from vendas table - matching database enum exactly
export type VendaFormaPagamento = 'dinheiro' | 'pix' | 'cheque' | 'cartao' | 'parcelado';

// Enum from movimentacoes_caixa table  
export type CaixaFormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'cheque' | 'boleto' | 'outros';

/**
 * Maps payment methods from vendas table to movimentacoes_caixa table
 * @param vendaFormaPagamento - Payment method from vendas table
 * @returns Corresponding payment method for movimentacoes_caixa table
 */
export function mapVendaToCaixaFormaPagamento(vendaFormaPagamento: VendaFormaPagamento): CaixaFormaPagamento {
  const mappingTable: Record<VendaFormaPagamento, CaixaFormaPagamento> = {
    'dinheiro': 'dinheiro',
    'pix': 'pix', 
    'cartao': 'credito', // Default mapping: cartao → credito
    'parcelado': 'credito', // Parcelado is usually credit card
    'cheque': 'cheque'
  };

  const mapped = mappingTable[vendaFormaPagamento];
  
  if (!mapped) {
    console.warn(`Payment method '${vendaFormaPagamento}' not found in mapping table, defaulting to 'outros'`);
    return 'outros';
  }

  return mapped;
}

/**
 * Validates if a payment method is valid for movimentacoes_caixa table
 * @param formaPagamento - Payment method to validate
 * @returns true if valid, false otherwise
 */
export function isValidCaixaFormaPagamento(formaPagamento: string): formaPagamento is CaixaFormaPagamento {
  const validMethods: CaixaFormaPagamento[] = ['dinheiro', 'pix', 'debito', 'credito', 'cheque', 'boleto', 'outros'];
  return validMethods.includes(formaPagamento as CaixaFormaPagamento);
}

/**
 * Validates if a payment method is valid for vendas table
 * @param formaPagamento - Payment method to validate
 * @returns true if valid, false otherwise
 */
export function isValidVendaFormaPagamento(formaPagamento: string): formaPagamento is VendaFormaPagamento {
  const validMethods: VendaFormaPagamento[] = ['dinheiro', 'pix', 'cheque', 'cartao', 'parcelado'];
  return validMethods.includes(formaPagamento as VendaFormaPagamento);
}

/**
 * Gets a human-readable description for payment methods
 * @param formaPagamento - Payment method
 * @returns Human-readable description
 */
export function getFormaPagamentoDescription(formaPagamento: VendaFormaPagamento | CaixaFormaPagamento): string {
  const descriptions: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'pix': 'PIX',
    'debito': 'Cartão de Débito',
    'credito': 'Cartão de Crédito',
    'cartao': 'Cartão',
    'parcelado': 'Parcelado no Cartão',
    'cheque': 'Cheque',
    'boleto': 'Boleto Bancário',
    'outros': 'Outros'
  };

  return descriptions[formaPagamento] || formaPagamento;
}

/**
 * Função de auditoria para identificar OSs sem movimentação correspondente no caixa
 */
export async function auditarOSSemMovimentacao(supabase: any, empresaId: string, days: number = 7) {
  console.log(`🔍 Iniciando auditoria de OSs sem movimentação nos últimos ${days} dias`);
  
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - days);
  
  try {
    // Buscar OSs finalizadas na empresa nos últimos dias
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('id, numero_os, finalizado_em, valor_final, forma_pagamento, cliente_nome')
      .eq('empresa_id', empresaId)
      .eq('status', 'finalizada')
      .gte('finalizado_em', dataLimite.toISOString())
      .order('finalizado_em', { ascending: false });

    if (vendasError) throw vendasError;

    // Buscar movimentações de caixa correspondentes
    const osIds = vendas.map(v => v.id);
    const { data: movimentacoes, error: movError } = await supabase
      .from('movimentacoes_caixa')
      .select('referencia_id')
      .eq('empresa_id', empresaId)
      .eq('tipo_origem', 'OS')
      .in('referencia_id', osIds);

    if (movError) throw movError;

    // Identificar OSs sem movimentação
    const movimentacoesIds = new Set(movimentacoes.map(m => m.referencia_id));
    const ossSemMovimentacao = vendas.filter(v => !movimentacoesIds.has(v.id));

    console.log(`📊 Resultado da auditoria:`, {
      totalOSsFinalizadas: vendas.length,
      totalComMovimentacao: movimentacoesIds.size,
      totalSemMovimentacao: ossSemMovimentacao.length,
      ossSemMovimentacao: ossSemMovimentacao.map(os => ({
        numero_os: os.numero_os,
        valor_final: os.valor_final,
        finalizado_em: os.finalizado_em,
        cliente: os.cliente_nome
      }))
    });

    return {
      totalOSs: vendas.length,
      comMovimentacao: movimentacoesIds.size,
      semMovimentacao: ossSemMovimentacao.length,
      ossSemMovimentacao
    };

  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
    throw error;
  }
}

/**
 * Função para recuperar movimentações perdidas
 */
export async function recuperarMovimentacoesPerdidas(
  supabase: any, 
  empresaId: string, 
  caixaId: string, 
  ossSemMovimentacao: any[],
  userId: string
) {
  console.log(`🔧 Iniciando recuperação de ${ossSemMovimentacao.length} movimentações perdidas`);
  
  const resultados = [];
  
  for (const os of ossSemMovimentacao) {
    try {
      // Mapear forma de pagamento
      const caixaFormaPagamento = mapVendaToCaixaFormaPagamento(os.forma_pagamento);
      
      // Criar movimentação
      const { data: novaMovimentacao, error } = await supabase
        .from('movimentacoes_caixa')
        .insert({
          empresa_id: empresaId,
          caixa_id: caixaId,
          tipo_origem: 'OS',
          referencia_id: os.id,
          tipo: 'entrada',
          forma_pagamento: caixaFormaPagamento,
          valor_bruto: os.valor_final,
          valor_liquido: os.valor_final,
          descricao: `OS ${os.numero_os} - ${os.cliente_nome} (RECUPERADA)`,
          criado_por: userId,
          data_hora: os.finalizado_em, // Usar data original da finalização
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao recuperar OS ${os.numero_os}:`, error);
        resultados.push({ os: os.numero_os, sucesso: false, erro: error.message });
      } else {
        console.log(`✅ OS ${os.numero_os} recuperada com sucesso`);
        resultados.push({ os: os.numero_os, sucesso: true, movimentacao: novaMovimentacao });
      }
      
    } catch (error) {
      console.error(`❌ Erro inesperado ao recuperar OS ${os.numero_os}:`, error);
      resultados.push({ os: os.numero_os, sucesso: false, erro: (error as any)?.message || 'Erro inesperado' });
    }
  }
  
  const sucessos = resultados.filter(r => r.sucesso).length;
  const falhas = resultados.filter(r => !r.sucesso).length;
  
  console.log(`📈 Resultado da recuperação: ${sucessos} sucessos, ${falhas} falhas`);
  
  return {
    total: ossSemMovimentacao.length,
    sucessos,
    falhas,
    detalhes: resultados
  };
}