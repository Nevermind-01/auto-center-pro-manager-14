import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KmUpdateResult {
  success: boolean;
  km_anterior?: number;
  km_novo?: number;
  diferenca?: number;
  error?: string;
}

export const useKmUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateKm = async (
    veiculoId: string,
    novoKm: number,
    osId?: string,
    orcamentoId?: string,
    observacoes?: string
  ): Promise<KmUpdateResult> => {
    setIsUpdating(true);
    
    try {
      const { data, error } = await supabase.rpc('update_veiculo_km', {
        p_veiculo_id: veiculoId,
        p_km_novo: novoKm,
        p_os_id: osId || null,
        p_orcamento_id: orcamentoId || null,
        p_observacoes: observacoes || null
      });

      if (error) throw error;

      const result = data as any;

      if (!result?.success) {
        const errorMsg = result?.error || "Erro ao atualizar KM do veículo.";
        toast({
          title: "Erro",
          description: errorMsg,
          variant: "destructive",
        });
        return { success: false, error: errorMsg };
      }

      const diferenca = result?.diferenca || 0;
      
      toast({
        title: "KM Atualizado",
        description: diferenca > 0 
          ? `KM atualizado de ${result.km_anterior?.toLocaleString('pt-BR')} para ${result.km_novo?.toLocaleString('pt-BR')} (+${diferenca.toLocaleString('pt-BR')} km)`
          : "KM mantido (sem alteração)",
      });

      return {
        success: true,
        km_anterior: result.km_anterior,
        km_novo: result.km_novo,
        diferenca
      };
    } catch (error: any) {
      const errorMsg = error.message || "Erro ao atualizar KM do veículo.";
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateKm,
    isUpdating
  };
};