import { useState } from "react";
import { useStock } from "@/hooks/useStock";
import { ProductForm } from "@/components/stock/ProductForm";
import { ProductList } from "@/components/stock/ProductList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/stock";
import { 
  Package, 
  Plus, 
  AlertTriangle,
  TrendingDown,
  BarChart3,
  DollarSign
} from "lucide-react";

const NovaOS = () => {
  const { toast } = useToast();
  const { 
    products, 
    categories, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateStock,
    getLowStockProducts
  } = useStock();
  
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const lowStockProducts = getLowStockProducts();
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);
  const outOfStockProducts = products.filter(p => p.quantidade === 0).length;

  const handleAddProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(productData);
    setIsAddingProduct(false);
  };

  const handleEditProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
    toast({
      title: "Produto removido",
      description: "Produto removido do estoque com sucesso."
    });
  };

  const handleUpdateStock = (productId: string, quantity: number, motivo: string) => {
    const success = updateStock(productId, quantity, motivo);
    if (success) {
      toast({
        title: "Estoque atualizado",
        description: "Quantidade do produto atualizada com sucesso."
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque. Verifique a quantidade disponível.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Estoque</h1>
          <p className="text-muted-foreground">Gerencie produtos, categorias e controle de estoque</p>
        </div>
        <Button onClick={() => setIsAddingProduct(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Estatísticas do Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor do estoque
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Produtos precisam reposição
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos esgotados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span>Produtos com Estoque Baixo</span>
            </CardTitle>
            <CardDescription>
              Os seguintes produtos precisam de reposição urgente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <p className="font-medium">{product.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Atual: {product.quantidade} | Mínimo: {product.estoqueMinimo}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUpdateStock(product.id, 10, 'Reposição de estoque')}
                  >
                    Reabastecer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="produtos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="movimentacao">Movimentação</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-4">
          {/* Formulário de Produto */}
          {(isAddingProduct || editingProduct) && (
            <ProductForm
              product={editingProduct || undefined}
              categories={categories}
              onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
              onCancel={() => {
                setIsAddingProduct(false);
                setEditingProduct(null);
              }}
            />
          )}

          {/* Lista de Produtos */}
          {!isAddingProduct && !editingProduct && (
            <ProductList
              products={products}
              categories={categories}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
            />
          )}
        </TabsContent>

        <TabsContent value="movimentacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Movimentação de Estoque</span>
              </CardTitle>
              <CardDescription>
                Histórico de entradas e saídas de produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NovaOS;