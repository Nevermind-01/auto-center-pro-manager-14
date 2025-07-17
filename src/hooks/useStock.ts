import { useState } from 'react';
import { Product, StockTransaction, Category } from '@/types/stock';

export const useStock = () => {
  // Dados mockados iniciais
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      nome: 'Óleo Motor 5W30',
      categoria: 'Lubrificantes',
      descricao: 'Óleo sintético para motores',
      preco: 35.50,
      quantidade: 15,
      estoqueMinimo: 10,
      fornecedor: 'Petrobras',
      codigoBarras: '7891234567890',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      nome: 'Filtro de Ar',
      categoria: 'Filtros',
      descricao: 'Filtro de ar para diversos modelos',
      preco: 25.00,
      quantidade: 8,
      estoqueMinimo: 15,
      fornecedor: 'Mann Filter',
      codigoBarras: '7891234567891',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      nome: 'Pastilha de Freio',
      categoria: 'Freios',
      descricao: 'Pastilha de freio dianteira',
      preco: 85.00,
      quantidade: 12,
      estoqueMinimo: 8,
      fornecedor: 'TRW',
      codigoBarras: '7891234567892',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      nome: 'Pneu 195/65R15',
      categoria: 'Pneus',
      descricao: 'Pneu aro 15 para carros de passeio',
      preco: 280.00,
      quantidade: 6,
      estoqueMinimo: 4,
      fornecedor: 'Michelin',
      codigoBarras: '7891234567893',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]);

  const [categories] = useState<Category[]>([
    { id: '1', nome: 'Lubrificantes', descricao: 'Óleos e lubrificantes' },
    { id: '2', nome: 'Filtros', descricao: 'Filtros de ar, óleo e combustível' },
    { id: '3', nome: 'Freios', descricao: 'Pastilhas, discos e componentes de freio' },
    { id: '4', nome: 'Pneus', descricao: 'Pneus e câmaras de ar' },
    { id: '5', nome: 'Suspensão', descricao: 'Amortecedores e componentes de suspensão' },
    { id: '6', nome: 'Motor', descricao: 'Peças e componentes do motor' },
    { id: '7', nome: 'Elétrica', descricao: 'Componentes elétricos e eletrônicos' },
    { id: '8', nome: 'Transmissão', descricao: 'Peças de câmbio e transmissão' }
  ]);

  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateStock = (productId: string, quantity: number, motivo: string, observacao?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    const newQuantity = product.quantidade + quantity;
    if (newQuantity < 0) return false;

    // Atualizar quantidade do produto
    updateProduct(productId, { quantidade: newQuantity });

    // Registrar transação
    const transaction: StockTransaction = {
      id: Date.now().toString(),
      produtoId: productId,
      tipo: quantity > 0 ? 'entrada' : 'saida',
      quantidade: Math.abs(quantity),
      motivo,
      observacao,
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [transaction, ...prev]);

    return true;
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.quantidade <= p.estoqueMinimo);
  };

  const getProductsByCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    return products.filter(p => p.categoria === category.nome);
  };

  // Função para dar baixa automática no estoque quando uma venda é finalizada
  const processStockForSale = (productNames: string[], quantities?: number[]) => {
    const failedProducts: string[] = [];
    
    productNames.forEach((productName, index) => {
      const product = products.find(p => p.nome === productName);
      const quantity = quantities ? quantities[index] : 1;
      
      if (product) {
        const success = updateStock(
          product.id, 
          -quantity, 
          'Venda',
          `Saída automática por venda - Quantidade: ${quantity}`
        );
        
        if (!success) {
          failedProducts.push(productName);
        }
      }
    });
    
    return {
      success: failedProducts.length === 0,
      failedProducts
    };
  };

  return {
    products,
    categories,
    transactions,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts,
    getProductsByCategory,
    processStockForSale
  };
};