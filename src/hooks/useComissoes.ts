import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Comissao = {
  id: string;
  venda_id: string;
  mecanico_id: string;
  tipo_calculo: "percentual" | "fixo";
  percentual?: number | null;
  valor_fixo?: number | null;
  valor_final: number;
  base_calculo: number;
  observacoes?: string | null;
  finalizado_em?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ComissaoInsert = {
  venda_id: string;
  mecanico_id: string;
  tipo_calculo: "percentual" | "fixo";
  percentual?: number | null;
  valor_fixo?: number | null;
  valor_final: number;
  base_calculo: number;
  observacoes?: string | null;
};

interface UseComissoesByMecanicoParams {
  mecanicoId: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const useComissoesByMecanico = ({ mecanicoId, startDate, endDate }: UseComissoesByMecanicoParams) => {
  const { empresaId } = useAuth();
  
  return useQuery({
    queryKey: ["comissoes_mecanico", mecanicoId, startDate?.toISOString(), endDate?.toISOString(), empresaId],
    queryFn: async () => {
      if (!mecanicoId || !empresaId) return { rows: [] as Array<Comissao & { vendas?: { numero_os: string } | null }>, total: 0 };

      let query = supabase
        .from("comissoes_mecanicos")
        .select("*, vendas(numero_os)")
        .eq("mecanico_id", mecanicoId)
        .eq("empresa_id", empresaId)
        .order("finalizado_em", { ascending: false });

      if (startDate) query = query.gte("finalizado_em", startDate.toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("finalizado_em", end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = (data || []).reduce((acc, r) => acc + Number((r as any).valor_final || 0), 0);
      return { rows: (data as any) || [], total };
    },
    enabled: !!mecanicoId && !!empresaId,
  });
};

export const useComissoesMutations = () => {
  const queryClient = useQueryClient();
  const { user, empresaId } = useAuth();

  const createComissao = useMutation({
    mutationFn: async (payload: ComissaoInsert) => {
      if (!user || !empresaId) throw new Error("User not authenticated or no empresa selected");

      const { data, error } = await supabase
        .from("comissoes_mecanicos")
        .insert({ ...payload, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();

      if (error) throw error;
      return data as Comissao;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comissoes_mecanico", data.mecanico_id] });
    },
  });

  return { createComissao };
};
