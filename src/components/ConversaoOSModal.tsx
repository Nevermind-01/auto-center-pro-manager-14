import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { type Orcamento } from '@/hooks/useOrcamentos';

interface ConversaoOSModalProps {
  open: boolean;
  onClose: () => void;
  orcamento: Orcamento | null;
  onConfirm: () => void;
}

export function ConversaoOSModal({ open, onClose, orcamento, onConfirm }: ConversaoOSModalProps) {
  if (!orcamento) return null;

  const valorTotalProdutos = orcamento.orcamento_produtos?.reduce((total, produto) => 
    total + produto.preco_total, 0
  ) || 0;

  const valorTotalServicos = orcamento.orcamento_servicos?.reduce((total, servico) => 
    total + servico.preco, 0
  ) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Converter Orçamento em OS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-2">Sobre a conversão:</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• A OS será criada com status "Pendente"</li>
                  <li>• O estoque NÃO será baixado automaticamente</li>
                  <li>• A comissão NÃO será gerada ainda</li>
                  <li>• Você precisará finalizar a OS posteriormente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resumo do Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número</p>
                  <p className="font-mono">{orcamento.numero_orcamento}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p>{orcamento.cliente_nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status Atual</p>
                  <Badge variant="default">Aprovado</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-lg">R$ {orcamento.valor_final.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes dos Itens */}
          <Card>
            <CardHeader>
              <CardTitle>Itens que serão transferidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orcamento.orcamento_produtos && orcamento.orcamento_produtos.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Produtos ({orcamento.orcamento_produtos.length})</p>
                  <div className="space-y-1">
                    {orcamento.orcamento_produtos.map(produto => (
                      <div key={produto.id} className="flex justify-between text-sm">
                        <span>{produto.produto_nome} (x{produto.quantidade})</span>
                        <span>R$ {produto.preco_total.toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal Produtos:</span>
                      <span>R$ {valorTotalProdutos.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              )}

              {orcamento.orcamento_servicos && orcamento.orcamento_servicos.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Serviços ({orcamento.orcamento_servicos.length})</p>
                  <div className="space-y-1">
                    {orcamento.orcamento_servicos.map(servico => (
                      <div key={servico.id} className="flex justify-between text-sm">
                        <span>{servico.servico_nome}</span>
                        <span>R$ {servico.preco.toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal Serviços:</span>
                      <span>R$ {valorTotalServicos.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              )}

              {orcamento.valor_desconto > 0 && (
                <div className="border-t pt-2">
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>- R$ {orcamento.valor_desconto.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-2 border-black">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Final:</span>
                  <span>R$ {orcamento.valor_final.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos Passos */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-2">Após a conversão:</p>
                <ul className="text-green-700 space-y-1">
                  <li>• A OS aparecerá na página "Histórico"</li>
                  <li>• Você poderá finalizar a OS quando necessário</li>
                  <li>• O orçamento ficará marcado como "Convertido"</li>
                  <li>• A baixa de estoque acontecerá na finalização da OS</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
              Confirmar Conversão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}