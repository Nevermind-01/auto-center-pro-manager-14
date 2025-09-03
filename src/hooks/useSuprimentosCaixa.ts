import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useCaixa } from './useCaixa';

export interface Suprimento {
  id: string;
  empresa_id: string;
  caixa_id: string;
  valor: number;
  motivo: string;
  data_hora: string;
  criado_por: string;
  created_at: string;
}

export interface CriarSuprimentoData {
  valor: number;
  motivo: string;
}

export function useSuprimentosCaixa() {
  const { toast } = useToast();
  const { empresaId } = useEmpresaContext();
  const { caixaAtual } = useCaixa();
  const queryClient = useQueryClient();

  // Buscar suprimentos do caixa atual
  const { data: suprimentos, isLoading } = useQuery({
    queryKey: ['suprimentos-caixa', caixaAtual?.id],
    queryFn: async () => {
      if (!caixaAtual?.id) return [];

      const { data, error } = await supabase
        .from('suprimentos')
        .select('*')
        .eq('caixa_id', caixaAtual.id)
        .order('data_hora', { ascending: false });

      if (error) throw error;
      return data as Suprimento[];
    },
    enabled: !!caixaAtual?.id,
  });

  // Buscar total de suprimentos
  const { data: totalSuprimentos } = useQuery({
    queryKey: ['total-suprimentos', caixaAtual?.id],
    queryFn: async () => {
      if (!caixaAtual?.id) return 0;

      const { data, error } = await supabase
        .from('suprimentos')
        .select('valor')
        .eq('caixa_id', caixaAtual.id);

      if (error) throw error;
      
      return data.reduce((total, suprimento) => total + Number(suprimento.valor), 0);
    },
    enabled: !!caixaAtual?.id,
  });

  // Mutation para criar suprimento
  const criarSuprimento = useMutation({
    mutationFn: async (data: CriarSuprimentoData) => {
      if (!caixaAtual) throw new Error('Nenhum caixa aberto encontrado');
      if (!empresaId) throw new Error('Empresa não selecionada');

      if (data.valor <= 0) {
        throw new Error('O valor do suprimento deve ser maior que zero');
      }

      const { data: novoSuprimento, error } = await supabase
        .from('suprimentos')
        .insert({
          empresa_id: empresaId,
          caixa_id: caixaAtual.id,
          valor: data.valor,
          motivo: data.motivo,
          criado_por: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_caixa').insert({
        empresa_id: empresaId,
        caixa_id: caixaAtual.id,
        acao: 'SUPRIMENTO_CRIADO',
        detalhes: {
          valor: data.valor,
          motivo: data.motivo,
        },
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      return novoSuprimento;
    },
    onSuccess: () => {
      toast({
        title: "Suprimento registrado",
        description: "O suprimento foi registrado no caixa com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['suprimentos-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['total-suprimentos'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar suprimento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  return {
    suprimentos,
    totalSuprimentos,
    isLoading,
    criarSuprimento: criarSuprimento.mutate,
    isCriandoSuprimento: criarSuprimento.isPending,
  };
}