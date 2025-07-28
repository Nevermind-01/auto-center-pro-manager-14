import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertCircle, TrendingUp, DollarSign, Filter, MoreHorizontal, Eye, Edit, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProdutos, useProdutoMutations, useCategorias, useCategoriaMutations, useMovimentacoes, useMovimentacaoMutations } from '@/hooks/useSupabaseQueries';
import { useEstoqueOperations } from '@/hooks/useSupabaseQueries';
import { ProdutoComCategoria } from '@/lib/supabaseEstoque';
import MovementHistoryModal from '@/components/MovementHistoryModal';

const InventorySupabase = () => {
  const { toast } = useToast();
  
  // Queries
  const { data: produtos = [], isLoading: loadingProdutos, refetch: refetchProdutos } = useProdutos();
  const { data: categorias = [], isLoading: loadingCategorias } = useCategorias();
  const { data: movimentacoes = [], isLoading: loadingMovimentacoes } = useMovimentacoes();
  
  // Mutations
  const { createProduto, updateProduto, deleteProduto } = useProdutoMutations();
  const { createCategoria } = useCategoriaMutations();
  const { createMovimentacao } = useMovimentacaoMutations();
  const { adicionarEstoque } = useEstoqueOperations();

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProdutoComCategoria | null>(null);

  // Estados para formulários
  const [newProduct, setNewProduct] = useState({
    nome: '',
    marca: '',
    codigo: '',
    categoria_id: '',
    preco_custo: '',
    preco_venda: '',
    quantidade: '',
    estoque_minimo: ''
  });

  const [newCategory, setNewCategory] = useState({
    nome: '',
    descricao: ''
  });

  const [movement, setMovement] = useState({
    tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantidade: '',
    motivo: '',
    valorUnitario: ''
  });

  // Cálculos de estatísticas
  const totalProducts = produtos.length;
  const activeProducts = produtos.filter(p => p.status === 'ativo').length;
  const lowStockProducts = produtos.filter(p => p.quantidade <= p.estoque_minimo && p.status === 'ativo').length;
  const totalStockValue = produtos.reduce((total, produto) => {
    return total + (Number(produto.preco_venda) * produto.quantidade);
  }, 0);

  // Filtrar produtos
  const filteredProducts = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (produto.marca?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (produto.codigo?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || produto.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || produto.categoria_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handlers
  const handleAddProduct = async () => {
    try {
      await createProduto.mutateAsync({
        nome: newProduct.nome,
        marca: newProduct.marca || null,
        codigo: newProduct.codigo || null,
        categoria_id: newProduct.categoria_id || null,
        preco_custo: parseFloat(newProduct.preco_custo) || 0,
        preco_venda: parseFloat(newProduct.preco_venda),
        quantidade: parseInt(newProduct.quantidade) || 0,
        estoque_minimo: parseInt(newProduct.estoque_minimo) || 5
      });

      toast({
        title: "Produto adicionado",
        description: `${newProduct.nome} foi adicionado ao estoque.`,
      });

      setNewProduct({
        nome: '',
        marca: '',
        codigo: '',
        categoria_id: '',
        preco_custo: '',
        preco_venda: '',
        quantidade: '',
        estoque_minimo: ''
      });
      setShowNewProductModal(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar produto.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      await createCategoria.mutateAsync({
        nome: newCategory.nome,
        descricao: newCategory.descricao || null
      });

      toast({
        title: "Categoria adicionada",
        description: `${newCategory.nome} foi adicionada.`,
      });

      setNewCategory({ nome: '', descricao: '' });
      setShowNewCategoryModal(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar categoria.",
        variant: "destructive",
      });
    }
  };

  const handleStockMovement = async () => {
    if (!selectedProduct) return;

    try {
      const quantidade = parseInt(movement.quantidade);
      const valorUnitario = movement.valorUnitario ? parseFloat(movement.valorUnitario) : undefined;

      if (movement.tipo === 'entrada') {
        await adicionarEstoque.mutateAsync({
          produtoId: selectedProduct.id,
          quantidade,
          motivo: movement.motivo,
          valorUnitario
        });
      } else {
        // Para saídas e ajustes, usar createMovimentacao diretamente
        await createMovimentacao.mutateAsync({
          produto_id: selectedProduct.id,
          tipo: movement.tipo,
          quantidade: movement.tipo === 'saida' ? quantidade : quantidade,
          quantidade_anterior: selectedProduct.quantidade,
          motivo: movement.motivo,
          valor_unitario: valorUnitario || selectedProduct.preco_venda
        });

        // Atualizar quantidade do produto
        const novaQuantidade = movement.tipo === 'saida' 
          ? selectedProduct.quantidade - quantidade 
          : quantidade; // Para ajuste, definir nova quantidade absoluta

        await updateProduto.mutateAsync({
          id: selectedProduct.id,
          quantidade: novaQuantidade
        });
      }

      toast({
        title: "Movimentação registrada",
        description: `${movement.tipo} de ${quantidade} unidades de ${selectedProduct.nome}.`,
      });

      setMovement({
        tipo: 'entrada',
        quantidade: '',
        motivo: '',
        valorUnitario: ''
      });
      setSelectedProduct(null);
      setShowMovementModal(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStockStatus = (produto: ProdutoComCategoria) => {
    if (produto.quantidade === 0) return { label: 'Sem estoque', color: 'bg-red-100 text-red-800' };
    if (produto.quantidade <= produto.estoque_minimo) return { label: 'Estoque baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Em estoque', color: 'bg-green-100 text-green-800' };
  };

  if (loadingProdutos || loadingCategorias || loadingMovimentacoes) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estoque</h2>
          <p className="text-muted-foreground">Gerencie seus produtos e movimentações de estoque</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                <DialogDescription>Crie uma nova categoria para organizar seus produtos.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nome da Categoria</Label>
                  <Input
                    id="category-name"
                    value={newCategory.nome}
                    onChange={(e) => setNewCategory({ ...newCategory, nome: e.target.value })}
                    placeholder="Nome da categoria"
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Descrição</Label>
                  <Input
                    id="category-description"
                    value={newCategory.descricao}
                    onChange={(e) => setNewCategory({ ...newCategory, descricao: e.target.value })}
                    placeholder="Descrição da categoria"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCategory}>Adicionar Categoria</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewProductModal} onOpenChange={setShowNewProductModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
                <DialogDescription>Adicione um novo produto ao seu estoque.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">Nome do Produto</Label>
                  <Input
                    id="product-name"
                    value={newProduct.nome}
                    onChange={(e) => setNewProduct({ ...newProduct, nome: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <Label htmlFor="product-brand">Marca</Label>
                  <Input
                    id="product-brand"
                    value={newProduct.marca}
                    onChange={(e) => setNewProduct({ ...newProduct, marca: e.target.value })}
                    placeholder="Marca do produto"
                  />
                </div>
                <div>
                  <Label htmlFor="product-code">Código</Label>
                  <Input
                    id="product-code"
                    value={newProduct.codigo}
                    onChange={(e) => setNewProduct({ ...newProduct, codigo: e.target.value })}
                    placeholder="Código do produto"
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">Categoria</Label>
                  <Select value={newProduct.categoria_id} onValueChange={(value) => setNewProduct({ ...newProduct, categoria_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product-cost">Preço de Custo</Label>
                  <Input
                    id="product-cost"
                    type="number"
                    step="0.01"
                    value={newProduct.preco_custo}
                    onChange={(e) => setNewProduct({ ...newProduct, preco_custo: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">Preço de Venda</Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    value={newProduct.preco_venda}
                    onChange={(e) => setNewProduct({ ...newProduct, preco_venda: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="product-quantity">Quantidade Inicial</Label>
                  <Input
                    id="product-quantity"
                    type="number"
                    value={newProduct.quantidade}
                    onChange={(e) => setNewProduct({ ...newProduct, quantidade: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="product-min-stock">Estoque Mínimo</Label>
                  <Input
                    id="product-min-stock"
                    type="number"
                    value={newProduct.estoque_minimo}
                    onChange={(e) => setNewProduct({ ...newProduct, estoque_minimo: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddProduct}>Adicionar Produto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">{activeProducts} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">produtos precisam reposição</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalStockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">valor total do estoque</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movimentacoes.length}</div>
            <p className="text-xs text-muted-foreground">movimentações registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map((categoria) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>Lista de todos os produtos em estoque</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((produto) => {
                const stockStatus = getStockStatus(produto);
                return (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{produto.nome}</div>
                        {produto.marca && <div className="text-sm text-muted-foreground">{produto.marca}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {produto.categoria?.nome || 'Sem categoria'}
                      </Badge>
                    </TableCell>
                    <TableCell>{produto.codigo || '-'}</TableCell>
                    <TableCell>R$ {Number(produto.preco_venda).toFixed(2)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{produto.quantidade}</div>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(produto.status)}>
                        {produto.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(produto);
                              setShowMovementModal(true);
                            }}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Movimentar Estoque
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(produto);
                              setShowHistoryModal(true);
                            }}
                          >
                            <History className="mr-2 h-4 w-4" />
                            Histórico Movimentação
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movement Modal */}
      <Dialog open={showMovementModal} onOpenChange={setShowMovementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto: ${selectedProduct.nome} (Estoque atual: ${selectedProduct.quantidade})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="movement-type">Tipo de Movimentação</Label>
              <Select value={movement.tipo} onValueChange={(value: 'entrada' | 'saida' | 'ajuste') => setMovement({ ...movement, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="movement-quantity">Quantidade</Label>
              <Input
                id="movement-quantity"
                type="number"
                value={movement.quantidade}
                onChange={(e) => setMovement({ ...movement, quantidade: e.target.value })}
                placeholder="Quantidade"
              />
            </div>
            <div>
              <Label htmlFor="movement-reason">Motivo</Label>
              <Input
                id="movement-reason"
                value={movement.motivo}
                onChange={(e) => setMovement({ ...movement, motivo: e.target.value })}
                placeholder="Motivo da movimentação"
              />
            </div>
            <div>
              <Label htmlFor="movement-value">Valor Unitário (opcional)</Label>
              <Input
                id="movement-value"
                type="number"
                step="0.01"
                value={movement.valorUnitario}
                onChange={(e) => setMovement({ ...movement, valorUnitario: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleStockMovement}>Registrar Movimentação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement History Modal */}
      <MovementHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default InventorySupabase;