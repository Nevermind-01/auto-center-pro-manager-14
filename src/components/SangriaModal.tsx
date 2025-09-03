import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSangriasCaixa } from '@/hooks/useSangriasCaixa';
import { useCaixa } from '@/hooks/useCaixa';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingDown, Minus, DollarSign, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface SangriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SangriaModal({ open, onOpenChange }: SangriaModalProps) {
  const { caixaAtual } = useCaixa();
  const { empresaId } = useEmpresaContext();
  const { sangrias, totalSangrias, criarSangria, isCriandoSangria } = useSangriasCaixa();
  
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [autorizadoPor, setAutorizadoPor] = useState('');

  // Buscar usuários admin/owner da empresa
  const { data: usuariosAutorizados } = useQuery({
    queryKey: ['usuarios-autorizados', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];

      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select(`
          user_id,
          role
        `)
        .eq('empresa_id', empresaId)
        .in('role', ['admin', 'owner'])
        .eq('ativo', true);

      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || !motivo || !autorizadoPor) return;
    
    criarSangria({
      valor: parseFloat(valor),
      motivo,
      autorizado_por: autorizadoPor,
    });
    
    setValor('');
    setMotivo('');
    setAutorizadoPor('');
    onOpenChange(false);
  };

  if (!caixaAtual) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sangrias</DialogTitle>
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
            <TrendingDown className="h-6 w-6 text-red-600" />
            Sangrias do Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total de Sangrias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                R$ {(totalSangrias || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Formulário para nova sangria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Minus className="h-5 w-5" />
                Nova Sangria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Atenção:</p>
                  <p>Sangrias precisam ser autorizadas por um administrador ou proprietário.</p>
                </div>
              </div>

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
                  <div>
                    <Label htmlFor="autorizado_por">Autorizado Por *</Label>
                    <Select value={autorizadoPor} onValueChange={setAutorizadoPor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione quem autoriza" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuariosAutorizados?.map((usuario) => (
                          <SelectItem key={usuario.user_id} value={usuario.user_id}>
                            {usuario.user_id} ({usuario.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="motivo">Motivo da Sangria *</Label>
                  <Textarea
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Descreva o motivo da sangria..."
                    rows={3}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!valor || !motivo || !autorizadoPor || isCriandoSangria}
                  variant="destructive"
                  className="w-full"
                >
                  {isCriandoSangria ? 'Registrando...' : 'Registrar Sangria'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de sangrias */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Sangrias</CardTitle>
            </CardHeader>
            <CardContent>
              {sangrias && sangrias.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sangrias.map((sangria) => (
                    <div
                      key={sangria.id}
                      className="flex justify-between items-start p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-red-600">
                          - R$ {Number(sangria.valor).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sangria.motivo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Autorizada por: {sangria.autorizado_por}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sangria.data_hora), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma sangria registrada ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}