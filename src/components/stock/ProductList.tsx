import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus, 
  Minus,
  AlertTriangle,
  Package
} from 'lucide-react';
import { Product, Category } from '@/types/stock';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onUpdateStock: (productId: string, quantity: number, motivo: string) => void;
}

export const ProductList = ({ products, categories, onEdit, onDelete, onUpdateStock }: ProductListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.categoria === categoryFilter;
    
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.quantidade <= product.estoqueMinimo) ||
                        (stockFilter === 'normal' && product.quantidade > product.estoqueMinimo);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (product: Product) => {
    if (product.quantidade === 0) return { status: 'Sem estoque', variant: 'destructive' as const };
    if (product.quantidade <= product.estoqueMinimo) return { status: 'Estoque baixo', variant: 'secondary' as const };
    return { status: 'Normal', variant: 'default' as const };
  };

  const handleStockAdjustment = (productId: string, adjustment: number) => {
    const motivo = adjustment > 0 ? 'Entrada manual' : 'Saída manual';
    onUpdateStock(productId, adjustment, motivo);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Produtos em Estoque</span>
          </CardTitle>
          <CardDescription>
            Gerencie seus produtos e controle de estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.nome}>
                    {category.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status do estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                <SelectItem value="normal">Estoque normal</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de produtos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.nome}</div>
                        {product.descricao && (
                          <div className="text-sm text-muted-foreground">
                            {product.descricao}
                          </div>
                        )}
                        {product.fornecedor && (
                          <div className="text-xs text-muted-foreground">
                            Fornecedor: {product.fornecedor}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.categoria}</Badge>
                    </TableCell>
                    <TableCell>R$ {product.preco.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockAdjustment(product.id, -1)}
                          disabled={product.quantidade === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="min-w-[40px] text-center font-medium">
                          {product.quantidade}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockAdjustment(product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Mín: {product.estoqueMinimo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant} className="flex items-center space-x-1">
                        {stockStatus.status === 'Estoque baixo' && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        <span>{stockStatus.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(product)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};