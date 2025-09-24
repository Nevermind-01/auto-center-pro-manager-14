import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCarteiraCliente } from "@/hooks/useCarteiraCliente";
import { usePagamentosOS } from "@/hooks/usePagamentosOS";
import { PagamentoOSModal } from "@/components/PagamentoOSModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Plus, TrendingDown, TrendingUp, Receipt, Clock } from "lucide-react";

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
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState<any>(null);

  const { getCarteiraCliente, getHistoricoCarteira, adicionarCredito } = useCarteiraCliente();
  const { getPagamentosPendentes } = usePagamentosOS();

  const { data: carteira } = getCarteiraCliente(cliente?.id || '');
  const { data: historico = [] } = getHistoricoCarteira(cliente?.id || '');
  const { data: pagamentosPendentes = [] } = getPagamentosPendentes(cliente?.id || '');

  useEffect(() => {
    if (open) {
      setValor('');
      setDescricao('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente?.id || !valor || !descricao) return;

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    
    if (valorNumerico <= 0) {
      alert('Valor deve ser maior que zero');
      return;
    }

    adicionarCredito({
      clienteId: cliente.id,
      valor: valorNumerico,
      descricao,
    });

    // Reset form
    setValor('');
    setDescricao('');
  };

  const handlePagamentoOS = (os: any) => {
    setOsSelecionada(os);
    setPagamentoModalOpen(true);
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Carteira Digital - {cliente.nome}
          </DialogTitle>
          <DialogDescription>
            Gerencie créditos e pagamentos pendentes do cliente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="carteira" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="carteira" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Carteira
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Pagamentos Pendentes
              {pagamentosPendentes.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pagamentosPendentes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carteira" className="space-y-6">
            {/* Saldo atual */}
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-base">Saldo Atual</CardTitle>
                </div>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {carteira?.saldo_atual?.toFixed(2) || '0,00'}
                </div>
              </CardContent>
            </Card>

            {/* Formulário para adicionar crédito */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      type="text"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Motivo do crédito..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Adicionar Crédito
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Histórico de transações */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Últimas movimentações da carteira
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {historico.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma transação encontrada
                  </p>
                ) : (
                  historico.map((transacao, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {transacao.tipo === 'credito' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">
                              {transacao.tipo === 'credito' ? 'Crédito' : 'Débito'}
                            </span>
                            <Badge variant={transacao.tipo === 'credito' ? 'default' : 'destructive'}>
                              {transacao.tipo === 'credito' ? '+' : '-'}R$ {Number(transacao.valor).toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {transacao.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(transacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Saldo: R$ {Number(transacao.saldo_novo).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      {index < historico.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  OSs Aguardando Pagamento
                </CardTitle>
                <CardDescription>
                  Ordens de serviço finalizadas em carteira digital pendentes de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pagamentosPendentes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum pagamento pendente
                  </p>
                ) : (
                  pagamentosPendentes.map((os) => (
                    <Card key={os.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{os.numero_os}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(os.finalizado_em), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Pendente
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Valor Total:</span>
                            <span className="font-medium">R$ {os.valor_final.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Já Pago:</span>
                            <span className="text-green-600">R$ {os.valor_pago.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">Restante:</span>
                            <span className="font-bold text-red-600">R$ {os.valor_restante.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handlePagamentoOS(os)}
                          className="w-full mt-4"
                          size="sm"
                        >
                          Registrar Pagamento
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PagamentoOSModal
          open={pagamentoModalOpen}
          onOpenChange={setPagamentoModalOpen}
          osPendente={osSelecionada}
        />
      </DialogContent>
    </Dialog>
  );
};