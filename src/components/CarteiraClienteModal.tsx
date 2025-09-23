import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCarteiraCliente } from "@/hooks/useCarteiraCliente";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Wallet, Plus, Minus, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CarteiraClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  } | null;
}

export const CarteiraClienteModal = ({ open, onOpenChange, cliente }: CarteiraClienteModalProps) => {
  const [tipoOperacao, setTipoOperacao] = useState<'credito' | 'debito'>('credito');
  const [valor, setValor] = useState<string>('');
  const [descricao, setDescricao] = useState('');

  const { 
    getCarteiraCliente, 
    getHistoricoCarteira,
    adicionarCredito,
    isAdicionandoCredito 
  } = useCarteiraCliente();

  const carteiraQuery = getCarteiraCliente(cliente?.id || '');
  const historicoQuery = getHistoricoCarteira(cliente?.id || '');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setTipoOperacao('credito');
      setValor('');
      setDescricao('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !valor || !descricao) return;

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) return;

    try {
      if (tipoOperacao === 'credito') {
        await adicionarCredito.mutateAsync({
          clienteId: cliente.id,
          valor: valorNumerico,
          descricao
        });
      }
      
      // Reset form
      setValor('');
      setDescricao('');
    } catch (error) {
      console.error('Erro ao processar operação:', error);
    }
  };

  const saldoAtual = carteiraQuery.data?.saldo_atual || 0;
  const historico = historicoQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Carteira Digital - {cliente?.nome}
          </DialogTitle>
          <DialogDescription>
            Gerencie o saldo e histórico da carteira digital do cliente
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Saldo e Operações */}
          <div className="space-y-4">
            {/* Saldo Atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Saldo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(saldoAtual)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Disponível para utilização
                </p>
              </CardContent>
            </Card>

            {/* Formulário de Operação */}
            <Card>
              <CardHeader>
                <CardTitle>Nova Operação</CardTitle>
                <CardDescription>
                  Adicione ou remova créditos da carteira
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Tipo de Operação</Label>
                    <RadioGroup
                      value={tipoOperacao}
                      onValueChange={(value) => setTipoOperacao(value as 'credito' | 'debito')}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credito" id="credito" />
                        <Label 
                          htmlFor="credito" 
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="h-4 w-4 text-green-600" />
                          Adicionar Crédito
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debito" id="debito" disabled />
                        <Label 
                          htmlFor="debito" 
                          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                        >
                          <Minus className="h-4 w-4 text-red-600" />
                          Remover Crédito (Em breve)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Motivo da operação..."
                      rows={3}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={!valor || !descricao || isAdicionandoCredito}
                    className="w-full"
                  >
                    {isAdicionandoCredito ? 'Processando...' : 
                     tipoOperacao === 'credito' ? 'Adicionar Crédito' : 'Remover Crédito'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Histórico */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Histórico de Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historicoQuery.isLoading ? (
                  <p className="text-center text-muted-foreground">Carregando histórico...</p>
                ) : historico.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhuma movimentação encontrada</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {historico.map((movimentacao) => (
                      <div key={movimentacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {movimentacao.tipo === 'credito' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{movimentacao.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(movimentacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {movimentacao.os_id && (
                              <Badge variant="outline" className="text-xs mt-1">
                                OS Relacionada
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            movimentacao.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movimentacao.tipo === 'credito' ? '+' : '-'}{formatCurrency(movimentacao.valor)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saldo: {formatCurrency(movimentacao.saldo_novo)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};