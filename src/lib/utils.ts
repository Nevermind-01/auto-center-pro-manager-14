import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"
import { logger } from "@/lib/logger"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
 */
export async function generateSequentialOSNumber(empresaId: string, maxTentativas: number = 5): Promise<string> {
  // Validação do empresaId
  if (!empresaId || !isValidUUID(empresaId)) {
    const error = new Error('empresaId deve ser um UUID válido');
    logger.error('Validação falhou ao gerar número OS:', { empresaId, error: error.message });
    throw error;
  }

  let tentativas = 0;
  
  while (tentativas < maxTentativas) {
    try {
      logger.debug(`Tentativa ${tentativas + 1}/${maxTentativas} para gerar número sequencial de OS`, { empresaId });
      
      const { data, error } = await supabase.rpc('get_next_sequential_number_safe', {
        p_empresa_id: empresaId,
        p_tipo: 'os'
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Função não retornou número válido');
      }

      logger.info('Número OS sequencial gerado com sucesso', { numero: data, empresaId });
      return data;

    } catch (error: any) {
      tentativas++;
      logger.warn(`Tentativa ${tentativas}/${maxTentativas} falhou ao gerar número OS`, { 
        empresaId, 
        error: error.message,
        tentativa: tentativas 
      });
      
      if (tentativas < maxTentativas) {
        // Aguardar um tempo aleatório maior a cada tentativa (backoff exponencial)
        const baseDelay = 200;
        const delay = baseDelay * Math.pow(2, tentativas - 1) + Math.random() * 300;
        logger.debug(`Aguardando ${Math.round(delay)}ms antes da próxima tentativa`, { delay });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para outros erros ou se esgotaram as tentativas, lança o erro
      logger.error('Erro não recuperável ao gerar número OS - tentativas esgotadas', { 
        empresaId, 
        maxTentativas, 
        error: error.message 
      });
      throw error;
    }
  }
  
  const finalError = new Error(`Não foi possível gerar número de OS após ${maxTentativas} tentativas`);
  logger.error('Falha total ao gerar número OS', { empresaId, maxTentativas });
  throw finalError;
}

/**
 * Gera um número sequencial de orçamento no formato ORC01, ORC02, etc.
 * Usa função PostgreSQL para garantir atomicidade e evitar conflitos
 */
export async function generateSequentialOrcamentoNumber(empresaId: string, maxTentativas: number = 5): Promise<string> {
  // Validação do empresaId
  if (!empresaId || !isValidUUID(empresaId)) {
    const error = new Error('empresaId deve ser um UUID válido');
    logger.error('Validação falhou ao gerar número orçamento:', { empresaId, error: error.message });
    throw error;
  }

  let tentativas = 0;
  
  while (tentativas < maxTentativas) {
    try {
      logger.debug(`Tentativa ${tentativas + 1}/${maxTentativas} para gerar número sequencial de orçamento`, { empresaId });
      
      const { data, error } = await supabase.rpc('get_next_sequential_number_safe', {
        p_empresa_id: empresaId,
        p_tipo: 'orcamento'
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Função não retornou número válido');
      }

      logger.info('Número orçamento sequencial gerado com sucesso', { numero: data, empresaId });
      return data;

    } catch (error: any) {
      tentativas++;
      logger.warn(`Tentativa ${tentativas}/${maxTentativas} falhou ao gerar número orçamento`, { 
        empresaId, 
        error: error.message,
        tentativa: tentativas 
      });
      
      if (tentativas < maxTentativas) {
        // Aguardar um tempo aleatório maior a cada tentativa (backoff exponencial)
        const baseDelay = 200;
        const delay = baseDelay * Math.pow(2, tentativas - 1) + Math.random() * 300;
        logger.debug(`Aguardando ${Math.round(delay)}ms antes da próxima tentativa`, { delay });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para outros erros ou se esgotaram as tentativas, lança o erro
      logger.error('Erro não recuperável ao gerar número orçamento - tentativas esgotadas', { 
        empresaId, 
        maxTentativas, 
        error: error.message 
      });
      throw error;
    }
  }
  
  const finalError = new Error(`Não foi possível gerar número de orçamento após ${maxTentativas} tentativas`);
  logger.error('Falha total ao gerar número orçamento', { empresaId, maxTentativas });
  throw finalError;
}

