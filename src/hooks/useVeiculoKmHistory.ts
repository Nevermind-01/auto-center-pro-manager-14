import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVeiculoKmHistory(veiculoId: string | null) {
  return useQuery({
    queryKey: ['veiculo-km-history', veiculoId],
    queryFn: async () => {
      if (!veiculoId) return { hasHistory: false, count: 0 };
      
      const { data, error } = await supabase
        .from('veiculo_km_historico')
        .select('id', { count: 'exact' })
        .eq('veiculo_id', veiculoId);
      
      if (error) {
        throw error;
      }
      
      return {
        hasHistory: (data?.length || 0) > 0,
        count: data?.length || 0
      };
    },
    enabled: !!veiculoId,
  });
}

export function useMultipleVeiculosKmHistory(veiculoIds: string[]) {
  return useQuery({
    queryKey: ['multiple-veiculos-km-history', veiculoIds],
    queryFn: async () => {
      if (veiculoIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('veiculo_km_historico')
        .select('veiculo_id, id')
        .in('veiculo_id', veiculoIds);
      
      if (error) {
        throw error;
      }
      
      // Group by veiculo_id and count
      const historyMap: Record<string, { hasHistory: boolean; count: number }> = {};
      
      veiculoIds.forEach(id => {
        historyMap[id] = { hasHistory: false, count: 0 };
      });
      
      data?.forEach(record => {
        if (!historyMap[record.veiculo_id]) {
          historyMap[record.veiculo_id] = { hasHistory: false, count: 0 };
        }
        historyMap[record.veiculo_id].count++;
        historyMap[record.veiculo_id].hasHistory = true;
      });
      
      return historyMap;
    },
    enabled: veiculoIds.length > 0,
  });
}