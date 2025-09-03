import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuprimentosCaixa } from '@/hooks/useSuprimentosCaixa';
import { useCaixa } from '@/hooks/useCaixa';
import { TrendingUp, Plus, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface SuprimentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuprimentoModal({ open, onOpenChange }: SuprimentoModalProps) {
  const { caixaAtual } = useCaixa();
  const { suprimentos, totalSuprimentos, criarSuprimento, isCriandoSuprimento } = useSuprimentosCaixa();
  
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');

  // Reset form when modal closes or operation succeeds
  useEffect(() => {
    if (!open || !isCriandoSuprimento) {
      setValor('');
      setMotivo('');
    }
  }, [open, isCriandoSuprimento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || !motivo || isCriandoSuprimento) return;
    
    criarSuprimento({
      valor: parseFloat(valor),
      motivo,
    });
  };

  if (!caixaAtual) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suprimentos</DialogTitle>
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            Suprimentos do Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total de Suprimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                R$ {(totalSuprimentos || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Formulário para novo suprimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Novo Suprimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor (R$) *</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="motivo">Motivo do Suprimento *</Label>
                  <Textarea
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Descreva o motivo do suprimento..."
                    rows={3}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!valor || !motivo || isCriandoSuprimento}
                  className="w-full"
                >
                  {isCriandoSuprimento ? 'Registrando...' : 'Registrar Suprimento'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de suprimentos */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Suprimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {suprimentos && suprimentos.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {suprimentos.map((suprimento) => (
                    <div
                      key={suprimento.id}
                      className="flex justify-between items-start p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-green-600">
                          + R$ {Number(suprimento.valor).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {suprimento.motivo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(suprimento.data_hora), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum suprimento registrado ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}