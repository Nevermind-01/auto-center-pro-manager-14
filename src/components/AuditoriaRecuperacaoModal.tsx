import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuditoriaRecuperacao } from '@/hooks/useAuditoriaRecuperacao';
import { 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditoriaRecuperacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditoriaRecuperacaoModal({ 
  open, 
  onOpenChange 
}: AuditoriaRecuperacaoModalProps) {
  const [diasAuditoria, setDiasAuditoria] = useState(7);
  
  const {
    isAuditando,
    isRecuperando,
    resultadoAuditoria,
    executarAuditoria,
    recuperarMovimentacoes,
    limparResultado,
  } = useAuditoriaRecuperacao();

  const handleAuditoria = async () => {
    await executarAuditoria(diasAuditoria);
  };

  const handleRecuperacao = async () => {
    await recuperarMovimentacoes();
  };

  const handleClose = () => {
    limparResultado();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Auditoria e Recuperação de Movimentações
          </DialogTitle>
          <DialogDescription>
            Identifique OSs finalizadas que não geraram movimentações no caixa e recupere-as automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controles de Auditoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Executar Auditoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="dias">Período de Análise (dias)</Label>
                  <Input
                    id="dias"
                    type="number"
                    min="1"
                    max="365"
                    value={diasAuditoria}
                    onChange={(e) => setDiasAuditoria(parseInt(e.target.value) || 7)}
                    className="w-32"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAuditoria}
                    disabled={isAuditando}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {isAuditando ? 'Auditando...' : 'Executar Auditoria'}
                  </Button>
                  {resultadoAuditoria && (
                    <Button 
                      variant="outline"
                      onClick={limparResultado}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Auditoria */}
          {resultadoAuditoria && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resultado da Auditoria</span>
                  <Badge variant={resultadoAuditoria.semMovimentacao > 0 ? 'destructive' : 'default'}>
                    {resultadoAuditoria.semMovimentacao > 0 ? 'Issues Found' : 'All Good'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {resultadoAuditoria.totalOSs}
                    </p>
                    <p className="text-sm text-muted-foreground">OSs Finalizadas</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {resultadoAuditoria.comMovimentacao}
                    </p>
                    <p className="text-sm text-muted-foreground">Com Movimentação</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {resultadoAuditoria.semMovimentacao}
                    </p>
                    <p className="text-sm text-muted-foreground">Sem Movimentação</p>
                  </div>
                </div>

                {/* OSs Problemáticas */}
                {resultadoAuditoria.semMovimentacao > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          OSs sem Movimentação no Caixa
                        </h4>
                        <Button
                          onClick={handleRecuperacao}
                          disabled={isRecuperando}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {isRecuperando ? 'Recuperando...' : 'Recuperar Todas'}
                        </Button>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {resultadoAuditoria.ossSemMovimentacao.map((os: any) => (
                          <div 
                            key={os.id} 
                            className="flex justify-between items-center p-3 border rounded-lg bg-red-50"
                          >
                            <div>
                              <p className="font-medium">{os.numero_os}</p>
                              <p className="text-sm text-muted-foreground">
                                {os.cliente_nome}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(os.finalizado_em), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                R$ {Number(os.valor_final).toFixed(2)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {os.forma_pagamento}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Mensagem de Sucesso */}
                {resultadoAuditoria.semMovimentacao === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-green-600 mb-2">
                      Tudo em Ordem!
                    </h3>
                    <p className="text-muted-foreground">
                      Todas as OSs finalizadas possuem movimentações correspondentes no caixa.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações e Avisos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-orange-600">
                ⚠️ Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Esta ferramenta identifica OSs finalizadas que não geraram movimentações no caixa.</p>
              <p>• A recuperação só funciona se houver um caixa aberto atualmente.</p>
              <p>• As movimentações recuperadas terão a data/hora original da finalização da OS.</p>
              <p>• OSs recuperadas terão "(RECUPERADA)" no final da descrição.</p>
              <p>• Recomenda-se executar auditoria periodicamente para detectar problemas futuros.</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}