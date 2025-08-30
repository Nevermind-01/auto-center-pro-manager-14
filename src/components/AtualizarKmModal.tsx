import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Gauge, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Veiculo {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
  ano?: string;
  cor?: string;
  km_atual: number;
}

interface AtualizarKmModalProps {
  veiculo: Veiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKmUpdated: (novoKm: number) => void;
  osId?: string;
  orcamentoId?: string;
  observacoes?: string;
}

export function AtualizarKmModal({ 
  veiculo, 
  open, 
  onOpenChange, 
  onKmUpdated,
  osId,
  orcamentoId,
  observacoes = ''
}: AtualizarKmModalProps) {
  const [novoKm, setNovoKm] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (veiculo && open) {
      setNovoKm(veiculo.km_atual || 0);
    }
  }, [veiculo, open]);

  const handleUpdateKm = async () => {
    if (!veiculo) return;

    if (novoKm < (veiculo.km_atual || 0)) {
      toast({
        title: "Erro",
        description: `O novo KM (${novoKm.toLocaleString('pt-BR')}) deve ser maior ou igual ao KM atual (${(veiculo.km_atual || 0).toLocaleString('pt-BR')}).`,
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      const { data, error } = await supabase.rpc('update_veiculo_km', {
        p_veiculo_id: veiculo.id,
        p_km_novo: novoKm,
        p_os_id: osId || null,
        p_orcamento_id: orcamentoId || null,
        p_observacoes: observacoes || null
      });

      if (error) throw error;

      const result = data as any;

      if (!result?.success) {
        toast({
          title: "Erro",
          description: result?.error || "Erro ao atualizar KM do veículo.",
          variant: "destructive",
        });
        return;
      }

      const diferenca = result?.diferenca || 0;
      
      toast({
        title: "KM Atualizado",
        description: diferenca > 0 
          ? `KM atualizado de ${result.km_anterior?.toLocaleString('pt-BR')} para ${result.km_novo?.toLocaleString('pt-BR')} (+${diferenca.toLocaleString('pt-BR')} km)`
          : "KM mantido (sem alteração)",
      });

      onKmUpdated(novoKm);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar KM do veículo.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const diferenca = novoKm - (veiculo?.km_atual || 0);
  const temDiferenca = diferenca > 0;

  if (!veiculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Atualizar KM do Veículo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do veículo */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Car className="w-8 h-8 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">{veiculo.marca} {veiculo.modelo}</h3>
              <div className="text-sm text-muted-foreground">
                <p>Placa: {veiculo.placa}</p>
                {veiculo.ano && <p>Ano/Modelo: {veiculo.ano}</p>}
                {veiculo.cor && <p>Cor: {veiculo.cor}</p>}
              </div>
            </div>
          </div>

          {/* KM Atual */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">KM Atual</Label>
              <div className="text-lg font-semibold text-muted-foreground">
                {(veiculo.km_atual || 0).toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <Label htmlFor="novoKm">Novo KM *</Label>
              <Input
                id="novoKm"
                type="number"
                value={novoKm}
                onChange={(e) => setNovoKm(Number(e.target.value) || 0)}
                min={veiculo.km_atual || 0}
                placeholder="Digite o novo KM"
                className="text-lg font-semibold"
              />
            </div>
          </div>

          {/* Diferença de KM */}
          {temDiferenca && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Serão adicionados <strong>{diferenca.toLocaleString('pt-BR')} km</strong> ao veículo.
              </AlertDescription>
            </Alert>
          )}

          {diferenca < 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O novo KM não pode ser menor que o KM atual.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateKm}
            disabled={isUpdating || diferenca < 0}
          >
            {isUpdating ? 'Atualizando...' : temDiferenca ? 'Atualizar KM' : 'Manter KM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}