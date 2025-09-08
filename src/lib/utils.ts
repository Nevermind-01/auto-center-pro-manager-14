import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"
import { logger } from "@/lib/logger"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extrai mensagem de erro de forma segura
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erro desconhecido';
}

/**
 * Valida se um UUID é válido
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuid.length > 0 && uuidRegex.test(uuid);
}

/**
 * Gera um número sequencial de OS no formato OS01, OS02, etc.
 * Usa função PostgreSQL para garantir atomicidade e evitar conflitos
 * Inclui retry inteligente para conflitos de numeração
 */
export async function generateSequentialOSNumber(empresaId: string, maxTentativas: number = 5): Promise<string> {
  // Validação do empresaId
  if (!empresaId || !isValidUUID(empresaId)) {
    const error = new Error('empresaId deve ser um UUID válido');
    logger.error('Validação falhou ao gerar número OS:', { empresaId, error: error.message });
    throw error;
  }

  // Importar dinamicamente para evitar circular dependencies
  const { retryWithBackoff } = await import('@/lib/errorHandler');

  const gerarNumero = async (): Promise<string> => {
    logger.debug('Tentando gerar número sequencial de OS', { empresaId });
    
    const { data, error } = await supabase.rpc('get_next_sequential_number_safe', {
      p_empresa_id: empresaId,
      p_tipo: 'os'
    });

    if (error) {
      logger.error('Erro no RPC get_next_sequential_number_safe:', { 
        empresaId, 
        error: error.message,
        code: error.code 
      });
      throw error;
    }

    if (!data) {
      const error = new Error('Função não retornou número válido');
      logger.error('RPC retornou dados vazios:', { empresaId });
      throw error;
    }

    logger.info('Número OS sequencial gerado com sucesso', { numero: data, empresaId });
    return data;
  };

  try {
    // Usar retry inteligente com backoff exponencial
    return await retryWithBackoff(gerarNumero, maxTentativas, 300);
  } catch (error: unknown) {
    logger.error('Erro não recuperável ao gerar número OS - tentativas esgotadas', { 
      empresaId, 
      maxTentativas, 
      error: getErrorMessage(error) 
    });
    throw error;
  }
}

/**
 * Gera um número sequencial de orçamento no formato ORC01, ORC02, etc.
 * Usa função PostgreSQL para garantir atomicidade e evitar conflitos
 * Inclui retry inteligente para conflitos de numeração
 */
export async function generateSequentialOrcamentoNumber(empresaId: string, maxTentativas: number = 5): Promise<string> {
  // Validação do empresaId
  if (!empresaId || !isValidUUID(empresaId)) {
    const error = new Error('empresaId deve ser um UUID válido');
    logger.error('Validação falhou ao gerar número orçamento:', { empresaId, error: error.message });
    throw error;
  }

  // Importar dinamicamente para evitar circular dependencies
  const { retryWithBackoff } = await import('@/lib/errorHandler');

  const gerarNumero = async (): Promise<string> => {
    logger.debug('Tentando gerar número sequencial de orçamento', { empresaId });
    
    const { data, error } = await supabase.rpc('get_next_sequential_number_safe', {
      p_empresa_id: empresaId,
      p_tipo: 'orcamento'
    });

    if (error) {
      logger.error('Erro no RPC get_next_sequential_number_safe:', { 
        empresaId, 
        error: error.message,
        code: error.code 
      });
      throw error;
    }

    if (!data) {
      const error = new Error('Função não retornou número válido');
      logger.error('RPC retornou dados vazios:', { empresaId });
      throw error;
    }

    logger.info('Número orçamento sequencial gerado com sucesso', { numero: data, empresaId });
    return data;
  };

  try {
    // Usar retry inteligente com backoff exponencial
    return await retryWithBackoff(gerarNumero, maxTentativas, 300);
  } catch (error: unknown) {
    logger.error('Erro não recuperável ao gerar número orçamento - tentativas esgotadas', { 
      empresaId, 
      maxTentativas, 
      error: getErrorMessage(error) 
    });
    throw error;
  }
}

