import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CreditCard, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAvailablePaymentMethods, type FormaPagamento } from "@/lib/paymentMethodMapper";

export interface FormaPagamentoMultipla {
  id: string;
  forma_pagamento: FormaPagamento | "";
  valor: number;
  parcelas: number;
  observacoes: string;
}

interface MultiplePaymentFormsProps {
  formasPagamento: FormaPagamentoMultipla[];
  onChange: (formas: FormaPagamentoMultipla[]) => void;
  valorTotal: number;
  saldoCarteira?: number;
  clienteSelecionado?: any;
  disabled?: boolean;
}

export const MultiplePaymentForms = ({
  formasPagamento,
  onChange,
  valorTotal,
  saldoCarteira = 0,
  clienteSelecionado,
  disabled = false
}: MultiplePaymentFormsProps) => {
  const [formasInternas, setFormasInternas] = useState<FormaPagamentoMultipla[]>(formasPagamento);

  // Sincronizar com props quando mudar externamente
  useEffect(() => {
    setFormasInternas(formasPagamento);
  }, [formasPagamento]);

  // Notificar mudanças para o componente pai
  const notificarMudancas = (novasFormas: FormaPagamentoMultipla[]) => {
    setFormasInternas(novasFormas);
    onChange(novasFormas);
  };

  const adicionarFormaPagamento = () => {
    const valorRestante = valorTotal - formasInternas.reduce((total, forma) => total + forma.valor, 0);
    const novaForma: FormaPagamentoMultipla = {
      id: `forma-${Date.now()}`,
      forma_pagamento: "",
      valor: Math.max(0, valorRestante),
      parcelas: 1,
      observacoes: ""
    };
    
    notificarMudancas([...formasInternas, novaForma]);
  };

  const removerFormaPagamento = (id: string) => {
    if (formasInternas.length <= 1) return; // Manter pelo menos uma forma
    notificarMudancas(formasInternas.filter(forma => forma.id !== id));
  };

  const atualizarFormaPagamento = (id: string, campo: keyof FormaPagamentoMultipla, valor: any) => {
    const novasFormas = formasInternas.map(forma => {
      if (forma.id === id) {
        const formaAtualizada = { ...forma, [campo]: valor };
        
        // Reset parcelas se não for crédito
        if (campo === 'forma_pagamento' && valor !== 'credito') {
          formaAtualizada.parcelas = 1;
        }
        
        return formaAtualizada;
      }
      return forma;
    });
    
    notificarMudancas(novasFormas);
  };

  const formasPagamentoDisponiveis = getAvailablePaymentMethods();
  const valorPago = formasInternas.reduce((total, forma) => total + forma.valor, 0);
  const valorRestante = valorTotal - valorPago;
  const isValorValido = Math.abs(valorRestante) < 0.01; // Tolerância para arredondamento

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Formas de Pagamento
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarFormaPagamento}
          disabled={disabled || formasInternas.length >= 5}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Resumo de valores */}
      <Card className="bg-accent/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total a Pagar:</span>
              <p className="font-semibold">{formatCurrency(valorTotal)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Valor Pago:</span>
              <p className="font-semibold">{formatCurrency(valorPago)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Restante:</span>
              <p className={`font-semibold ${valorRestante > 0 ? 'text-destructive' : valorRestante < 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {formatCurrency(valorRestante)}
              </p>
            </div>
          </div>
          
          {!isValorValido && (
            <div className="mt-2">
              <Badge variant={valorRestante > 0 ? "destructive" : "secondary"}>
                {valorRestante > 0 ? "Valor insuficiente" : "Valor excedente"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formas de pagamento */}
      <div className="space-y-3">
        {formasInternas.map((forma, index) => (
          <Card key={forma.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Forma de Pagamento {index + 1}
                </CardTitle>
                {formasInternas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerFormaPagamento(forma.id)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Forma de Pagamento */}
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={forma.forma_pagamento}
                    onValueChange={(value) => atualizarFormaPagamento(forma.id, 'forma_pagamento', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamentoDisponiveis.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor */}
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={valorTotal}
                    value={forma.valor}
                    onChange={(e) => atualizarFormaPagamento(forma.id, 'valor', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    placeholder="0,00"
                  />
                </div>

                {/* Parcelas (só para crédito) */}
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={forma.parcelas}
                    onChange={(e) => atualizarFormaPagamento(forma.id, 'parcelas', parseInt(e.target.value) || 1)}
                    disabled={disabled || forma.forma_pagamento !== 'credito'}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Alerta para carteira */}
              {forma.forma_pagamento === 'carteira' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <Wallet className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">
                        Pagamento via Carteira Digital
                      </p>
                      <p className="text-blue-600">
                        Saldo disponível: {formatCurrency(saldoCarteira)}
                      </p>
                      {forma.valor > saldoCarteira && (
                        <p className="text-red-600 font-medium mt-1">
                          ⚠️ Valor maior que o saldo disponível
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={forma.observacoes}
                  onChange={(e) => atualizarFormaPagamento(forma.id, 'observacoes', e.target.value)}
                  disabled={disabled}
                  placeholder="Observações sobre esta forma de pagamento..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const novasFormas = [...formasInternas];
            novasFormas[0] = { ...novasFormas[0], valor: valorTotal };
            notificarMudancas(novasFormas);
          }}
          disabled={disabled || formasInternas.length === 0}
        >
          Pagar Total na 1ª Forma
        </Button>
        
        {formasInternas.length === 2 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const metade = valorTotal / 2;
              const novasFormas = [...formasInternas];
              novasFormas[0] = { ...novasFormas[0], valor: metade };
              novasFormas[1] = { ...novasFormas[1], valor: metade };
              notificarMudancas(novasFormas);
            }}
            disabled={disabled}
          >
            Dividir ao Meio
          </Button>
        )}
      </div>
    </div>
  );
};