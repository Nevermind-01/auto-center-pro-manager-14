import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCaixa } from '@/hooks/useCaixa';
import { useMovimentacoesCaixa } from '@/hooks/useMovimentacoesCaixa';
import { useSuprimentosCaixa } from '@/hooks/useSuprimentosCaixa';
import { useSangriasCaixa } from '@/hooks/useSangriasCaixa';
import { Wallet, Plus, Minus, Calculator, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface CaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CaixaModal({ open, onOpenChange }: CaixaModalProps) {
  const { caixaAtual, abrirCaixa, fecharCaixa, isAbrindoCaixa, isFechandoCaixa } = useCaixa();
  const { movimentacoes, resumoPorForma } = useMovimentacoesCaixa();
  const { totalSuprimentos } = useSuprimentosCaixa();
  const { totalSangrias } = useSangriasCaixa();

  const [trocoInicial, setTrocoInicial] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleAbrirCaixa = () => {
    if (!trocoInicial) return;
    
    abrirCaixa({
      troco_inicial: parseFloat(trocoInicial),
      observacao: observacao || undefined,
    });
    
    setTrocoInicial('');
    setObservacao('');
  };

  const handleFecharCaixa = () => {
    fecharCaixa({
      observacao: observacao || undefined,
    });
    
    setObservacao('');
  };

  const calcularTotalCaixa = () => {
    if (!caixaAtual || !resumoPorForma) return 0;
    
    const totalMovimentacoes = Object.values(resumoPorForma).reduce(
      (sum: number, forma: any) => sum + forma.total, 0
    );
    
    return caixaAtual.troco_inicial + totalMovimentacoes + (totalSuprimentos || 0) - (totalSangrias || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Gerenciamento de Caixa
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={caixaAtual ? "resumo" : "abrir"} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="abrir" disabled={!!caixaAtual}>
              Abrir Caixa
            </TabsTrigger>
            <TabsTrigger value="resumo" disabled={!caixaAtual}>
              Resumo
            </TabsTrigger>
            <TabsTrigger value="movimentacoes" disabled={!caixaAtual}>
              Movimentações
            </TabsTrigger>
            <TabsTrigger value="fechar" disabled={!caixaAtual}>
              Fechar Caixa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abrir" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Abrir Novo Caixa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="troco_inicial">Troco Inicial (R$)</Label>
                    <Input
                      id="troco_inicial"
                      type="number"
                      step="0.01"
                      min="0"
                      value={trocoInicial}
                      onChange={(e) => setTrocoInicial(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="observacao">Observação</Label>
                    <Input
                      id="observacao"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Observação opcional"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleAbrirCaixa}
                  disabled={!trocoInicial || isAbrindoCaixa}
                  className="w-full"
                >
                  {isAbrindoCaixa ? 'Abrindo...' : 'Abrir Caixa'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumo" className="space-y-4">
            {caixaAtual && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Status do Caixa
                      </span>
                      <Badge variant={caixaAtual.status === 'aberto' ? 'default' : 'secondary'}>
                        {caixaAtual.status === 'aberto' ? 'Aberto' : 'Fechado'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Aberto em</p>
                        <p className="font-medium">
                          {format(new Date(caixaAtual.aberto_em), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Troco Inicial</p>
                        <p className="font-medium">
                          R$ {caixaAtual.troco_inicial.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total em Caixa</p>
                        <p className="font-bold text-lg">
                          R$ {calcularTotalCaixa().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Resumo por Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {resumoPorForma && Object.entries(resumoPorForma).map(([forma, dados]: [string, any]) => (
                        <div key={forma} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="capitalize font-medium">{forma}</span>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Entradas: R$ {dados.entradas.toFixed(2)} | Saídas: R$ {dados.saidas.toFixed(2)}
                            </p>
                            <p className="font-medium">
                              Total: R$ {dados.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Suprimentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {(totalSuprimentos || 0).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Sangrias</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">
                        R$ {(totalSangrias || 0).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="movimentacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Últimas Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movimentacoes && movimentacoes.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {movimentacoes.slice(0, 20).map((mov) => (
                      <div key={mov.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{mov.forma_pagamento}</p>
                          <p className="text-sm text-muted-foreground">
                            {mov.descricao || `${mov.tipo_origem} - ${mov.tipo}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(mov.data_hora), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {mov.tipo === 'entrada' ? '+' : '-'} R$ {Number(mov.valor_liquido).toFixed(2)}
                          </p>
                          {mov.conciliado && (
                            <Badge variant="outline" className="text-xs">
                              Conciliado
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação registrada ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fechar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="h-5 w-5" />
                  Fechar Caixa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> Ao fechar o caixa, não será mais possível registrar movimentações.
                    Certifique-se de que todas as transações foram registradas.
                  </p>
                </div>

                <div>
                  <Label htmlFor="observacao_fechamento">Observação de Fechamento</Label>
                  <Textarea
                    id="observacao_fechamento"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Observação opcional para o fechamento"
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Esperado</p>
                    <p className="text-2xl font-bold">
                      R$ {calcularTotalCaixa().toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>Aguardando Fechamento</Badge>
                  </div>
                </div>

                <Button
                  onClick={handleFecharCaixa}
                  disabled={isFechandoCaixa}
                  variant="destructive"
                  className="w-full"
                >
                  {isFechandoCaixa ? 'Fechando...' : 'Fechar Caixa'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}