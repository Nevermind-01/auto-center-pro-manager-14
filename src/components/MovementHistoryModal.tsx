import React, { useState } from 'react';
import { History, Calendar, User, Package, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ProdutoComCategoria } from '@/lib/supabaseEstoque';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MovementHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProdutoComCategoria | null;
}

interface MovimentacaoDetalhada {
  id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  quantidade_anterior: number;
  motivo: string;
  valor_unitario: number | null;
  os_numero: string | null;
  created_at: string;
}

const MovementHistoryModal: React.FC<MovementHistoryModalProps> = ({
  open,
  onOpenChange,
  product
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Query para buscar movimentações do produto específico
  const { data: movimentacoes = [], isLoading } = useQuery({
    queryKey: ['movimentacoes-produto', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('produto_id', product.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MovimentacaoDetalhada[];
    },
    enabled: !!product?.id && open
  });

  // Calcular paginação
  const totalPages = Math.ceil(movimentacoes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMovimentacoes = movimentacoes.slice(startIndex, endIndex);

  const getMovementTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'ajuste': return 'Ajuste';
      default: return tipo;
    }
  };

  const getMovementTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'saida': return 'bg-red-100 text-red-800';
      case 'ajuste': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: number | null) => {
    if (value === null) return '-';
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Movimentações
          </DialogTitle>
          <DialogDescription>
            {product && `Histórico completo de movimentações para: ${product.nome}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do produto */}
          {product && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Produto:</span>
                  <p>{product.nome}</p>
                </div>
                <div>
                  <span className="font-medium">Marca:</span>
                  <p>{product.marca || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Código:</span>
                  <p>{product.codigo || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Estoque Atual:</span>
                  <p className="font-semibold">{product.quantidade} unidades</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de movimentações */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Carregando histórico...</div>
                </div>
              ) : movimentacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Package className="h-8 w-8 mb-2" />
                  <p>Nenhuma movimentação encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Estoque Anterior</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>OS/Ref.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMovimentacoes.map((movimento) => (
                      <TableRow key={movimento.id}>
                        <TableCell>
                          <Badge className={getMovementTypeColor(movimento.tipo)}>
                            {getMovementTypeLabel(movimento.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(movimento.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            movimento.tipo === 'entrada' ? 'text-green-600' : 
                            movimento.tipo === 'saida' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {movimento.tipo === 'entrada' ? '+' : 
                             movimento.tipo === 'saida' ? '-' : ''}
                            {movimento.quantidade}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {movimento.quantidade_anterior}
                        </TableCell>
                        <TableCell>
                          {formatValue(movimento.valor_unitario)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 max-w-[200px]">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="text-sm truncate" title={movimento.motivo}>
                              {movimento.motivo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {movimento.os_numero && (
                            <Badge variant="outline" className="text-xs">
                              {movimento.os_numero}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, movimentacoes.length)} de {movimentacoes.length} movimentações
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovementHistoryModal;