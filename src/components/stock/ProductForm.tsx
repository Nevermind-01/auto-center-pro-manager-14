import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Product, Category } from '@/types/stock';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const ProductForm = ({ product, categories, onSubmit, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: product?.nome || '',
    categoria: product?.categoria || '',
    descricao: product?.descricao || '',
    preco: product?.preco?.toString() || '',
    quantidade: product?.quantidade?.toString() || '',
    estoqueMinimo: product?.estoqueMinimo?.toString() || '',
    fornecedor: product?.fornecedor || '',
    codigoBarras: product?.codigoBarras || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.categoria || !formData.preco) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios (Nome, Categoria e Preço).',
        variant: 'destructive'
      });
      return;
    }

    onSubmit({
      nome: formData.nome,
      categoria: formData.categoria,
      descricao: formData.descricao,
      preco: parseFloat(formData.preco),
      quantidade: parseInt(formData.quantidade) || 0,
      estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
      fornecedor: formData.fornecedor,
      codigoBarras: formData.codigoBarras
    });

    toast({
      title: 'Sucesso',
      description: `Produto ${product ? 'atualizado' : 'cadastrado'} com sucesso!`
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
        <CardDescription>
          {product ? 'Atualize as informações do produto' : 'Cadastre um novo produto no estoque'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome do produto"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.nome}>
                      {category.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição detalhada do produto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$) *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) => handleInputChange('preco', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={(e) => handleInputChange('quantidade', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                value={formData.estoqueMinimo}
                onChange={(e) => handleInputChange('estoqueMinimo', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                value={formData.fornecedor}
                onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigoBarras">Código de Barras</Label>
              <Input
                id="codigoBarras"
                value={formData.codigoBarras}
                onChange={(e) => handleInputChange('codigoBarras', e.target.value)}
                placeholder="Código de barras do produto"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {product ? 'Atualizar' : 'Cadastrar'} Produto
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};