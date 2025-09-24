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
import { CreditCard, Plus, TrendingDown, TrendingUp, Receipt, Clock, CheckCircle, Calendar, DollarSign } from "lucide-react";

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
  const { getPagamentosPendentes, getPagamentosConcluidos } = usePagamentosOS();

  const { data: carteira } = getCarteiraCliente(cliente?.id || '');
  const { data: historico = [] } = getHistoricoCarteira(cliente?.id || '');
  const { data: pagamentosPendentes = [] } = getPagamentosPendentes(cliente?.id || '');
  const { data: pagamentosConcluidos = [] } = getPagamentosConcluidos(cliente?.id || '');

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

    adicionarCredito.mutate({
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="carteira" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Carteira
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Pendentes
              {pagamentosPendentes.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pagamentosPendentes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="concluidos" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Concluídos
              {pagamentosConcluidos.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pagamentosConcluidos.length}
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
                     <div key={transacao.id || index}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {transacao.tipo === 'credito' ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-medium">
                                {transacao.forma_pagamento || (transacao.tipo === 'credito' ? 'Crédito Carteira' : 'Carteira')}
                              </span>
                              <Badge variant={transacao.tipo === 'credito' ? 'default' : 'destructive'}>
                                {transacao.tipo === 'credito' ? '+' : '-'}R$ {Number(transacao.valor).toFixed(2)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {transacao.descricao}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transacao.data_evento || transacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {transacao.tipo_evento && (
                              <p className="text-xs text-blue-600">
                                {transacao.tipo_evento === 'os_carteira' ? 'Débito OS' :
                                 transacao.tipo_evento === 'pagamento_os' ? 'Pagamento OS' :
                                 'Movimentação Manual'}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {transacao.saldo_novo !== undefined && (
                              <div className="text-sm font-medium">
                                Saldo: R$ {Number(transacao.saldo_novo).toFixed(2)}
                              </div>
                            )}
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
                               Finalizada em {format(new Date(os.finalizado_em), "dd/MM/yyyy", { locale: ptBR })}
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

                         {/* Mostrar pagamentos já realizados */}
                         {os.pagamentos_realizados && os.pagamentos_realizados.length > 0 && (
                           <div className="mt-4 pt-3 border-t">
                             <div className="flex items-center gap-2 mb-2">
                               <DollarSign className="h-4 w-4 text-green-600" />
                               <span className="text-sm font-medium">Pagamentos Realizados ({os.pagamentos_realizados.length})</span>
                             </div>
                             <div className="space-y-2">
                               {os.pagamentos_realizados.map((pagamento, index) => (
                                 <div key={pagamento.id} className="flex justify-between items-center text-xs bg-muted p-2 rounded">
                                   <div className="flex items-center gap-2">
                                     <Badge variant="outline">
                                       {pagamento.forma_pagamento}
                                     </Badge>
                                     <span className="text-muted-foreground">
                                       {format(new Date(pagamento.data_pagamento), "dd/MM/yy", { locale: ptBR })}
                                     </span>
                                   </div>
                                   <span className="font-medium text-green-600">
                                     R$ {Number(pagamento.valor_pago).toFixed(2)}
                                   </span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

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

          <TabsContent value="concluidos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  OSs Completamente Pagas
                </CardTitle>
                <CardDescription>
                  Ordens de serviço finalizadas em carteira digital com pagamentos concluídos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pagamentosConcluidos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum pagamento concluído encontrado
                  </p>
                ) : (
                  pagamentosConcluidos.map((os) => (
                    <Card key={os.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{os.numero_os}</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Finalizada: {format(new Date(os.finalizado_em), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <p className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Concluída: {format(new Date(os.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Pago
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span>Valor Total:</span>
                            <span className="font-bold text-green-600">R$ {os.valor_final.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Histórico completo de pagamentos */}
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Receipt className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Histórico de Pagamentos ({os.pagamentos.length})</span>
                          </div>
                          <div className="space-y-2">
                            {os.pagamentos.map((pagamento, index) => (
                              <div key={pagamento.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary">
                                      {pagamento.forma_pagamento}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                      R$ {Number(pagamento.valor_pago).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <p className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(pagamento.data_pagamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                    {pagamento.observacoes && (
                                      <p className="italic">"{pagamento.observacoes}"</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Totalizador */}
                          <div className="mt-3 pt-3 border-t flex justify-between items-center">
                            <span className="font-medium">Total Pago:</span>
                            <span className="font-bold text-green-600">
                              R$ {os.pagamentos.reduce((acc, p) => acc + Number(p.valor_pago), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
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