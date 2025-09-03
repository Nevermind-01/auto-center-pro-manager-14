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