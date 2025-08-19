import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Mecanico {
  id: string;
  nome: string;
  especialidade?: string;
  telefone?: string;
  ativo: boolean;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const useMecanicos = (ativos = true) => {
  const { empresaId } = useAuth();
  
  return useQuery({
    queryKey: ['mecanicos', ativos, empresaId],
    queryFn: async (): Promise<Mecanico[]> => {
      if (!empresaId) return [];
      
      let query = supabase
        .from('mecanicos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome', { ascending: true });

      if (ativos) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
};

export const useCriarMecanico = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, empresaId } = useAuth();

  return useMutation({
    mutationFn: async (mecanico: Omit<Mecanico, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');

      const { data, error } = await supabase
        .from('mecanicos')
        .insert({
          ...mecanico,
          user_id: user.id,
          empresa_id: empresaId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mecanicos'] });
      toast({
        title: "Sucesso",
        description: "Mecânico criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar mecânico. Tente novamente.",
        variant: "destructive",
      });
      console.error('Erro ao criar mecânico:', error);
    },
  });
};

export const useAtualizarMecanico = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Mecanico> & { id: string }) => {
      const { data, error } = await supabase
        .from('mecanicos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mecanicos'] });
      toast({
        title: "Sucesso",
        description: "Mecânico atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar mecânico. Tente novamente.",
        variant: "destructive",
      });
      console.error('Erro ao atualizar mecânico:', error);
    },
  });
};

export const useDeletarMecanico = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mecanicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mecanicos'] });
      toast({
        title: "Sucesso",
        description: "Mecânico removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover mecânico. Tente novamente.",
        variant: "destructive",
      });
      console.error('Erro ao remover mecânico:', error);
    },
  });
};