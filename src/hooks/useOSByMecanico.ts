import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaContext } from "@/hooks/useEmpresaContext";

export type OSMecanico = {
  id: string;
  numero_os: string;
  cliente_nome: string;
  valor_final: number;
  status: string;
  created_at: string;
  finalizado_em?: string | null;
  tem_comissao: boolean;
};

interface UseOSByMecanicoParams {
  mecanicoId: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const useOSByMecanico = ({ mecanicoId, startDate, endDate }: UseOSByMecanicoParams) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ["os_mecanico", mecanicoId, startDate?.toISOString(), endDate?.toISOString(), empresaId],
    queryFn: async () => {
      if (!mecanicoId || !empresaId) return [];

      let query = supabase
        .from("vendas")
        .select(`
          id,
          numero_os,
          cliente_nome,
          valor_final,
          status,
          created_at,
          finalizado_em,
          comissoes_mecanicos(id)
        `)
        .eq("mecanico_id", mecanicoId)
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      if (startDate) query = query.gte("created_at", startDate.toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const osData: OSMecanico[] = (data || []).map((os: any) => ({
        id: os.id,
        numero_os: os.numero_os,
        cliente_nome: os.cliente_nome,
        valor_final: Number(os.valor_final || 0),
        status: os.status,
        created_at: os.created_at,
        finalizado_em: os.finalizado_em,
        tem_comissao: (os.comissoes_mecanicos || []).length > 0
      }));

      return osData;
    },
    enabled: !!mecanicoId && !!empresaId,
  });
};