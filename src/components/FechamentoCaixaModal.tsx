import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFechamentoCaixa } from '@/hooks/useFechamentoCaixa';
import { useCaixa } from '@/hooks/useCaixa';
import { Calculator, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface FechamentoCaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FechamentoCaixaModal({ open, onOpenChange }: FechamentoCaixaModalProps) {
  const { caixaAtual } = useCaixa();
  const { processarFechamento, isProcessandoFechamento, calcularValoresEsperados, isSuccess } = useFechamentoCaixa();
  
  const [contagemDinheiro, setContagemDinheiro] = useState('');
  const [contagemPix, setContagemPix] = useState('');
  const [contagemDebito, setContagemDebito] = useState('');
  const [contagemCredito, setContagemCredito] = useState('');
  const [valoresEsperados, setValoresEsperados] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && caixaAtual?.id) {
      setLoading(true);
      calcularValoresEsperados(caixaAtual.id)
        .then(valores => {
          setValoresEsperados(valores);
          // Pré-preencher com valores esperados como sugestão
          setContagemDinheiro(valores?.valoresEsperados?.dinheiro?.toString() || '0');
          setContagemPix(valores?.valoresEsperados?.pix?.toString() || '0');
          setContagemDebito(valores?.valoresEsperados?.debito?.toString() || '0');
          setContagemCredito(valores?.valoresEsperados?.credito?.toString() || '0');
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, caixaAtual?.id, calcularValoresEsperados]);

  const calcularTotalContado = () => {
    return (
      (parseFloat(contagemDinheiro) || 0) +
      (parseFloat(contagemPix) || 0) +
      (parseFloat(contagemDebito) || 0) +
      (parseFloat(contagemCredito) || 0)
    );
  };

  const calcularDiferenca = () => {
    if (!valoresEsperados) return 0;
    const totalEsperado = valoresEsperados.totalEsperado || 0;
    const totalContado = calcularTotalContado();
    return totalContado - totalEsperado;
  };

  const handleProcessarFechamento = () => {
    if (!caixaAtual?.id || isProcessandoFechamento) return;

    processarFechamento({
      contagem_dinheiro: parseFloat(contagemDinheiro) || 0,
      contagem_pix: parseFloat(contagemPix) || 0,
      contagem_debito: parseFloat(contagemDebito) || 0,
      contagem_credito: parseFloat(contagemCredito) || 0,
      caixa_id: caixaAtual.id,
    });
  };

  // Reset form when modal closes and close modal on success
  useEffect(() => {
    if (!open) {
      setContagemDinheiro('');
      setContagemPix('');
      setContagemDebito('');
      setContagemCredito('');
      setValoresEsperados(null);
    }
  }, [open]);

  // Close modal after successful processing
  useEffect(() => {
    if (isSuccess) {
      onOpenChange(false);
    }
  }, [isSuccess, onOpenChange]);

  if (!caixaAtual) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechamento de Caixa</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum caixa aberto encontrado.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            Fechamento de Caixa
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Carregando dados do caixa...</div>
        ) : (
          <div className="space-y-6">
            {/* Informações do Caixa */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Caixa ID</Label>
                    <p className="font-mono text-sm">{caixaAtual.id}</p>
                  </div>
                  <div>
                    <Label>Abertura</Label>
                    <p className="text-sm">
                      {new Date(caixaAtual.aberto_em).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label>Troco Inicial</Label>
                    <p className="text-sm font-medium">
                      R$ {Number(caixaAtual.troco_inicial).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant="default">Aberto</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valores Esperados vs Contados */}
            {valoresEsperados && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valores Esperados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Valores Esperados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Dinheiro:</span>
                      <span className="font-medium">R$ {valoresEsperados.valoresEsperados?.dinheiro?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PIX:</span>
                      <span className="font-medium">R$ {valoresEsperados.valoresEsperados?.pix?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Débito:</span>
                      <span className="font-medium">R$ {valoresEsperados.valoresEsperados?.debito?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crédito:</span>
                      <span className="font-medium">R$ {valoresEsperados.valoresEsperados?.credito?.toFixed(2) || '0.00'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Esperado:</span>
                      <span>R$ {valoresEsperados.totalEsperado?.toFixed(2) || '0.00'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Contagem Manual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      Contagem Manual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="dinheiro">Dinheiro Contado (R$)</Label>
                      <Input
                        id="dinheiro"
                        type="number"
                        step="0.01"
                        min="0"
                        value={contagemDinheiro}
                        onChange={(e) => setContagemDinheiro(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pix">PIX Contado (R$)</Label>
                      <Input
                        id="pix"
                        type="number"
                        step="0.01"
                        min="0"
                        value={contagemPix}
                        onChange={(e) => setContagemPix(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="debito">Débito Contado (R$)</Label>
                      <Input
                        id="debito"
                        type="number"
                        step="0.01"
                        min="0"
                        value={contagemDebito}
                        onChange={(e) => setContagemDebito(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="credito">Crédito Contado (R$)</Label>
                      <Input
                        id="credito"
                        type="number"
                        step="0.01"
                        min="0"
                        value={contagemCredito}
                        onChange={(e) => setContagemCredito(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Resumo Final */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo do Fechamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span>Total Esperado:</span>
                    <span className="font-medium">
                      R$ {valoresEsperados?.totalEsperado?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Total Contado:</span>
                    <span className="font-medium">
                      R$ {calcularTotalContado().toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Diferença:</span>
                    <div className="flex items-center gap-2">
                      {calcularDiferenca() !== 0 && (
                        calcularDiferenca() > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )
                      )}
                      <span className={`${
                        calcularDiferenca() === 0 ? 'text-green-600' :
                        calcularDiferenca() > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        R$ {calcularDiferenca().toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {calcularDiferenca() !== 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        {calcularDiferenca() > 0 
                          ? 'Há uma sobra no caixa. Verifique se todos os valores estão corretos.'
                          : 'Há uma diferença negativa no caixa. Verifique se todos os valores estão corretos.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleProcessarFechamento}
                disabled={isProcessandoFechamento}
                className="flex-1"
              >
                {isProcessandoFechamento ? 'Processando...' : 'Processar Fechamento'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}