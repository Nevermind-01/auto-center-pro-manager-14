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
  const { processarFechamento, isProcessandoFechamento, calcularValoresEsperados } = useFechamentoCaixa();
  
  const [contagemDinheiro, setContagemDinheiro] = useState('');
  const [contagemPix, setContagemPix] = useState('');
  const [contagemDebito, setContagemDebito] = useState('');
  const [contagemCredito, setContagemCredito] = useState('');
  const [valoresEsperados, setValoresEsperados] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && caixaAtual) {
      setLoading(true);
      calcularValoresEsperados(caixaAtual.id)
        .then((valores) => {
          setValoresEsperados(valores);
          // Pre-preencher com valores esperados
          setContagemDinheiro(valores.valoresEsperados.dinheiro.toFixed(2));
          setContagemPix(valores.valoresEsperados.pix.toFixed(2));
          setContagemDebito(valores.valoresEsperados.debito.toFixed(2));
          setContagemCredito(valores.valoresEsperados.credito.toFixed(2));
        })
        .catch((error) => {
          console.error('Erro ao calcular valores esperados:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, caixaAtual, calcularValoresEsperados]);

  const calcularTotalContado = () => {
    return (
      parseFloat(contagemDinheiro || '0') +
      parseFloat(contagemPix || '0') +
      parseFloat(contagemDebito || '0') +
      parseFloat(contagemCredito || '0')
    );
  };

  const calcularDiferenca = () => {
    if (!valoresEsperados) return 0;
    return calcularTotalContado() - valoresEsperados.totalEsperado;
  };

  const handleProcessarFechamento = () => {
    if (!caixaAtual) return;

    processarFechamento({
      caixa_id: caixaAtual.id,
      contagem_dinheiro: parseFloat(contagemDinheiro || '0'),
      contagem_pix: parseFloat(contagemPix || '0'),
      contagem_debito: parseFloat(contagemDebito || '0'),
      contagem_credito: parseFloat(contagemCredito || '0'),
    });

    // Reset form
    setContagemDinheiro('');
    setContagemPix('');
    setContagemDebito('');
    setContagemCredito('');
    setValoresEsperados(null);
    onOpenChange(false);
  };

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
            <Calculator className="h-6 w-6" />
            Fechamento de Caixa
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <p>Calculando valores esperados...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informações do caixa */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Troco Inicial</p>
                    <p className="font-medium">R$ {caixaAtual.troco_inicial.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Suprimentos</p>
                    <p className="font-medium text-green-600">
                      + R$ {valoresEsperados?.totalSuprimentos.toFixed(2) || '0,00'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Sangrias</p>
                    <p className="font-medium text-red-600">
                      - R$ {valoresEsperados?.totalSangrias.toFixed(2) || '0,00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              {/* Valores Esperados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Valores Esperados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {valoresEsperados && (
                    <>
                      <div className="flex justify-between">
                        <span>Dinheiro:</span>
                        <span className="font-medium">
                          R$ {valoresEsperados.valoresEsperados.dinheiro.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>PIX:</span>
                        <span className="font-medium">
                          R$ {valoresEsperados.valoresEsperados.pix.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Débito:</span>
                        <span className="font-medium">
                          R$ {valoresEsperados.valoresEsperados.debito.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crédito:</span>
                        <span className="font-medium">
                          R$ {valoresEsperados.valoresEsperados.credito.toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total Esperado:</span>
                        <span>R$ {valoresEsperados.totalEsperado.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contagem Real */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Contagem Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dinheiro">Dinheiro (R$)</Label>
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
                    <Label htmlFor="pix">PIX (R$)</Label>
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
                    <Label htmlFor="debito">Débito (R$)</Label>
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
                    <Label htmlFor="credito">Crédito (R$)</Label>
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

            {/* Resumo do Fechamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumo do Fechamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Esperado</p>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {valoresEsperados?.totalEsperado.toFixed(2) || '0,00'}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Contado</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {calcularTotalContado().toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Diferença</p>
                    <p className={`text-2xl font-bold ${
                      calcularDiferenca() === 0 ? 'text-green-600' :
                      calcularDiferenca() > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {calcularDiferenca() >= 0 ? '+' : ''}R$ {calcularDiferenca().toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <Badge variant={
                    calcularDiferenca() === 0 ? 'default' :
                    calcularDiferenca() > 0 ? 'secondary' : 'destructive'
                  }>
                    {calcularDiferenca() === 0 ? 'Caixa Bateu' :
                     calcularDiferenca() > 0 ? 'Sobrou Dinheiro' : 'Faltou Dinheiro'}
                  </Badge>
                </div>

                {calcularDiferenca() !== 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Atenção - Diferença no Caixa</p>
                      <p>
                        {calcularDiferenca() > 0 
                          ? 'Foi encontrado dinheiro a mais no caixa. Verifique se todas as transações foram registradas.'
                          : 'Está faltando dinheiro no caixa. Verifique se houve alguma saída não registrada.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProcessarFechamento}
                disabled={isProcessandoFechamento || !valoresEsperados}
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