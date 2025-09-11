/**
 * Unified payment method types and utilities
 * After unification, both vendas and movimentacoes_caixa use the same enum
 */

// Unified enum matching the database enum exactly
export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'cheque' | 'boleto' | 'carteira' | 'outros';

/**
 * Validates if a payment method is valid
 * @param formaPagamento - Payment method to validate
 * @returns true if valid, false otherwise
 */
export function isValidFormaPagamento(formaPagamento: string): formaPagamento is FormaPagamento {
  const validMethods: FormaPagamento[] = ['dinheiro', 'pix', 'debito', 'credito', 'cheque', 'boleto', 'carteira', 'outros'];
  return validMethods.includes(formaPagamento as FormaPagamento);
}

/**
 * Gets a human-readable description for payment methods
 * @param formaPagamento - Payment method
 * @returns Human-readable description
 */
export function getFormaPagamentoDescription(formaPagamento: FormaPagamento): string {
  const descriptions: Record<FormaPagamento, string> = {
    'dinheiro': 'Dinheiro',
    'pix': 'PIX',
    'debito': 'Cartão de Débito',
    'credito': 'Cartão de Crédito',
    'cheque': 'Cheque',
    'boleto': 'Boleto Bancário',
    'carteira': 'Carteira Digital',
    'outros': 'Outros'
  };

  return descriptions[formaPagamento] || formaPagamento;
}

/**
 * Gets all available payment methods with their descriptions
 * @returns Array of payment methods with descriptions
 */
export function getAvailablePaymentMethods(): Array<{ value: FormaPagamento, label: string }> {
  return [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'debito', label: 'Cartão de Débito' },
    { value: 'credito', label: 'Cartão de Crédito' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'boleto', label: 'Boleto Bancário' },
    { value: 'carteira', label: 'Carteira Digital' },
    { value: 'outros', label: 'Outros' }
  ];
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
      .eq('tipo_origem', 'os')
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
      // Validar forma de pagamento (agora unificada)
      const formaPagamento = isValidFormaPagamento(os.forma_pagamento) 
        ? os.forma_pagamento as FormaPagamento
        : 'outros' as FormaPagamento;
      
      // Criar movimentação
      const { data: novaMovimentacao, error } = await supabase
        .from('movimentacoes_caixa')
        .insert({
          empresa_id: empresaId,
          caixa_id: caixaId,
          tipo_origem: 'os',
          referencia_id: os.id,
          tipo: 'entrada',
          forma_pagamento: formaPagamento,
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