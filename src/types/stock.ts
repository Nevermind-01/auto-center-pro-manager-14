export interface Product {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  preco: number;
  quantidade: number;
  estoqueMinimo: number;
  fornecedor?: string;
  codigoBarras?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  produtoId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  observacao?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  nome: string;
  descricao?: string;
}