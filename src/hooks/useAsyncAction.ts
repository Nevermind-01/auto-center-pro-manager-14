import { useState, useCallback } from 'react';

/**
 * Hook para controlar execução de ações assíncronas e prevenir múltiplos cliques
 * @param action - Função assíncrona a ser executada
 * @param key - Chave única para identificar a ação (opcional, padrão 'default')
 * @returns Objeto com função wrapped e estado de loading
 */
export function useAsyncAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  key: string = 'default'
) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const execute = useCallback(async (...args: T): Promise<R | undefined> => {
    // Prevenir execução se já está em andamento
    if (loadingStates[key]) {
      console.log(`⚠️ Ação "${key}" já está em execução, ignorando novo clique`);
      return;
    }

    setLoadingStates(prev => ({ ...prev, [key]: true }));

    try {
      const result = await action(...args);
      return result;
    } catch (error) {
      console.error(`❌ Erro na ação "${key}":`, error);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, [action, key, loadingStates]);

  const isLoading = loadingStates[key] || false;

  return {
    execute,
    isLoading
  };
}

/**
 * Hook para múltiplas ações assíncronas com estados independentes
 * @param actions - Objeto com chaves e funções assíncronas
 * @returns Objeto com funções wrapped e estados de loading
 */
export function useMultipleAsyncActions<T extends Record<string, (...args: any[]) => Promise<any>>>(
  actions: T
) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const wrappedActions = {} as {
    [K in keyof T]: (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>> | undefined>
  };

  Object.keys(actions).forEach((key) => {
    const action = actions[key];
    
    wrappedActions[key as keyof T] = async (...args: Parameters<typeof action>) => {
      // Prevenir execução se já está em andamento
      if (loadingStates[key]) {
        console.log(`⚠️ Ação "${key}" já está em execução, ignorando novo clique`);
        return;
      }

      setLoadingStates(prev => ({ ...prev, [key]: true }));

      try {
        const result = await action(...args);
        return result;
      } catch (error) {
        console.error(`❌ Erro na ação "${key}":`, error);
        throw error;
      } finally {
        setLoadingStates(prev => ({ ...prev, [key]: false }));
      }
    };
  });

  return {
    actions: wrappedActions,
    isLoading: (key: keyof T) => loadingStates[key as string] || false,
    isAnyLoading: Object.values(loadingStates).some(Boolean)
  };
}