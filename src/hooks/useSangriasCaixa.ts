import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useCaixa } from './useCaixa';
import { useMovimentacoesCaixa } from './useMovimentacoesCaixa';

export interface Sangria {
  id: string;
  empresa_id: string;
  caixa_id: string;
  valor: number;
  motivo: string;
  data_hora: string;
  autorizado_por: string;
  criado_por: string;
  created_at: string;
}

export interface CriarSangriaData {
  valor: number;
  motivo: string;
  autorizado_por: string;
}

export function useSangriasCaixa() {
  const { toast } = useToast();
  const { empresaId } = useEmpresaContext();
  const { caixaAtual } = useCaixa();
  const { criarMovimentacao } = useMovimentacoesCaixa();
  const queryClient = useQueryClient();

  // Buscar sangrias do caixa atual
  const { data: sangrias, isLoading } = useQuery({
    queryKey: ['sangrias-caixa', caixaAtual?.id],
    queryFn: async () => {
      if (!caixaAtual?.id) return [];

      const { data, error } = await supabase
        .from('sangrias')
        .select('*')
        .eq('caixa_id', caixaAtual.id)
        .order('data_hora', { ascending: false });

      if (error) throw error;
      return data as Sangria[];
    },
    enabled: !!caixaAtual?.id,
  });

  // Buscar total de sangrias
  const { data: totalSangrias } = useQuery({
    queryKey: ['total-sangrias', caixaAtual?.id],
    queryFn: async () => {
      if (!caixaAtual?.id) return 0;

      const { data, error } = await supabase
        .from('sangrias')
        .select('valor')
        .eq('caixa_id', caixaAtual.id);

      if (error) throw error;
      
      return data.reduce((total, sangria) => total + Number(sangria.valor), 0);
    },
    enabled: !!caixaAtual?.id,
  });

  // Mutation para criar sangria
  const criarSangria = useMutation({
    mutationFn: async (data: CriarSangriaData) => {
      if (!caixaAtual) throw new Error('Nenhum caixa aberto encontrado');
      if (!empresaId) throw new Error('Empresa não selecionada');

      if (data.valor <= 0) {
        throw new Error('O valor da sangria deve ser maior que zero');
      }

      // Verificar se o usuário autorizado tem permissão (admin/owner)
      const { data: usuarioAutorizado, error: errorUsuario } = await supabase
        .from('empresa_usuarios')
        .select('role')
        .eq('empresa_id', empresaId)
        .eq('user_id', data.autorizado_por)
        .eq('ativo', true)
        .single();

      if (errorUsuario || !usuarioAutorizado) {
        throw new Error('Usuário autorizado não encontrado');
      }

      if (!['admin', 'owner'].includes(usuarioAutorizado.role)) {
        throw new Error('Apenas administradores e proprietários podem autorizar sangrias');
      }

      const { data: novaSangria, error } = await supabase
        .from('sangrias')
        .insert({
          empresa_id: empresaId,
          caixa_id: caixaAtual.id,
          valor: data.valor,
          motivo: data.motivo,
          autorizado_por: data.autorizado_por,
          criado_por: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

        // Registrar na auditoria
        await supabase.from('auditoria_caixa').insert({
          empresa_id: empresaId,
          caixa_id: caixaAtual.id,
          acao: 'SANGRIA_CRIADA',
          detalhes: {
            valor: data.valor,
            motivo: data.motivo,
            autorizado_por: data.autorizado_por,
          },
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

        // Criar movimentação no caixa
        await criarMovimentacao({
          tipo: 'saida',
          tipo_origem: 'MANUAL',
          forma_pagamento: 'dinheiro',
          valor_bruto: data.valor,
          valor_liquido: data.valor,
          descricao: `Sangria: ${data.motivo}`,
          referencia_id: novaSangria.id,
        });

        return novaSangria;
    },
    onSuccess: () => {
      toast({
        title: "Sangria registrada",
        description: "A sangria foi registrada no caixa com sucesso.",
      });
        queryClient.invalidateQueries({ queryKey: ['sangrias-caixa'] });
        queryClient.invalidateQueries({ queryKey: ['total-sangrias'] });
        queryClient.invalidateQueries({ queryKey: ['movimentacoes-caixa'] });
        queryClient.invalidateQueries({ queryKey: ['resumo-por-forma'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar sangria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  return {
    sangrias,
    totalSangrias,
    isLoading,
    criarSangria: criarSangria.mutate,
    isCriandoSangria: criarSangria.isPending,
  };
}