import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';

export interface Caixa {
  id: string;
  empresa_id: string;
  aberto_por: string;
  aberto_em: string;
  troco_inicial: number;
  status: 'aberto' | 'fechado';
  fechado_por?: string;
  fechado_em?: string;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export interface AbrirCaixaData {
  troco_inicial: number;
  observacao?: string;
}

export interface FecharCaixaData {
  observacao?: string;
}

export function useCaixa() {
  const { toast } = useToast();
  const { empresaId } = useEmpresaContext();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Buscar caixa atual (aberto)
  const { data: caixaAtual, isLoading } = useQuery({
    queryKey: ['caixa-atual', empresaId],
    queryFn: async () => {
      if (!empresaId) return null;

      const { data, error } = await supabase
        .from('caixas')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'aberto')
        .order('aberto_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Caixa | null;
    },
    enabled: !!empresaId,
  });

  // Buscar histórico de caixas
  const { data: historicoCaixas } = useQuery({
    queryKey: ['historico-caixas', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];

      const { data, error } = await supabase
        .from('caixas')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('aberto_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Caixa[];
    },
    enabled: !!empresaId,
  });

  // Mutation para abrir caixa
  const abrirCaixa = useMutation({
    mutationFn: async (data: AbrirCaixaData) => {
      if (!empresaId) throw new Error('Empresa não selecionada');

      // Verificar se já existe caixa aberto
      const { data: caixaExistente } = await supabase
        .from('caixas')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('status', 'aberto')
        .maybeSingle();

      if (caixaExistente) {
        throw new Error('Já existe um caixa aberto para esta empresa');
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('Usuário não autenticado');

      const { data: novoCaixa, error } = await supabase
        .from('caixas')
        .insert({
          empresa_id: empresaId,
          aberto_por: user.data.user.id,
          troco_inicial: data.troco_inicial,
          observacao: data.observacao,
          status: 'aberto' as const,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_caixa').insert({
        empresa_id: empresaId,
        caixa_id: novoCaixa.id,
        acao: 'ABERTURA_CAIXA',
        detalhes: {
          troco_inicial: data.troco_inicial,
          observacao: data.observacao,
        },
        user_id: user.data.user.id,
      });

      return novoCaixa;
    },
    onSuccess: () => {
      toast({
        title: "Caixa aberto com sucesso",
        description: "O caixa foi aberto e está pronto para receber movimentações.",
      });
      queryClient.invalidateQueries({ queryKey: ['caixa-atual'] });
      queryClient.invalidateQueries({ queryKey: ['historico-caixas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao abrir caixa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para fechar caixa
  const fecharCaixa = useMutation({
    mutationFn: async (data: FecharCaixaData) => {
      if (!caixaAtual) throw new Error('Nenhum caixa aberto encontrado');

      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('Usuário não autenticado');

      const { data: caixaFechado, error } = await supabase
        .from('caixas')
        .update({
          status: 'fechado' as const,
          fechado_em: new Date().toISOString(),
          fechado_por: user.data.user.id,
          observacao: data.observacao || caixaAtual.observacao,
        })
        .eq('id', caixaAtual.id)
        .select()
        .single();

      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_caixa').insert({
        empresa_id: caixaAtual.empresa_id,
        caixa_id: caixaAtual.id,
        acao: 'FECHAMENTO_CAIXA',
        detalhes: {
          observacao: data.observacao,
        },
        user_id: user.data.user.id,
      });

      return caixaFechado;
    },
    onSuccess: () => {
      toast({
        title: "Caixa fechado com sucesso",
        description: "O caixa foi fechado e não receberá mais movimentações.",
      });
      queryClient.invalidateQueries({ queryKey: ['caixa-atual'] });
      queryClient.invalidateQueries({ queryKey: ['historico-caixas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fechar caixa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  return {
    caixaAtual,
    historicoCaixas,
    isLoading,
    loading,
    abrirCaixa: abrirCaixa.mutate,
    fecharCaixa: fecharCaixa.mutate,
    isAbrindoCaixa: abrirCaixa.isPending,
    isFechandoCaixa: fecharCaixa.isPending,
  };
}