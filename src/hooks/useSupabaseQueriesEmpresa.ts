import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresa } from '@/contexts/EmpresaContext';

// Hook para queries que dependem da empresa atual
export function useEmpresaQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const { empresaAtual } = useEmpresa();

  return useQuery({
    queryKey: [...queryKey, empresaAtual?.id],
    queryFn,
    enabled: !!empresaAtual && (options?.enabled !== false),
    staleTime: options?.staleTime,
  });
}

// Hook para mutations que incluem empresa_id automaticamente
export function useEmpresaMutation<TData, TVariables extends Record<string, any>>(
  mutationFn: (variables: TVariables & { empresa_id: string }) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables & { empresa_id: string }) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  }
) {
  const { empresaAtual } = useEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) => {
      if (!empresaAtual) {
        throw new Error('Nenhuma empresa selecionada');
      }
      return mutationFn({ ...variables, empresa_id: empresaAtual.id });
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      if (options?.onSuccess) {
        options.onSuccess(data, { ...variables, empresa_id: empresaAtual!.id });
      }
    },
    onError: options?.onError,
  });
}

// Hook específico para operações com empresa_id automático
export function useEmpresaOperations() {
  const { empresaAtual } = useEmpresa();

  const getEmpresaId = () => {
    if (!empresaAtual) {
      throw new Error('Nenhuma empresa selecionada');
    }
    return empresaAtual.id;
  };

  return {
    empresaId: empresaAtual?.id,
    getEmpresaId,
  };
}