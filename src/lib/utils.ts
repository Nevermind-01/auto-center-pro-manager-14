import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera um número sequencial de OS no formato OS01, OS02, etc.
 * Usa função PostgreSQL para garantir atomicidade e evitar conflitos
 */
export async function generateSequentialOSNumber(empresaId: string, maxTentativas: number = 5): Promise<string> {
  let tentativas = 0;
  
  while (tentativas < maxTentativas) {
    try {
      console.log(`🔄 Tentativa ${tentativas + 1}/${maxTentativas} para gerar número sequencial de OS`);
      
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

      console.log(`✅ Número OS sequencial gerado: ${data}`);
      return data;

    } catch (error: any) {
      tentativas++;
      console.log(`❌ Erro ao gerar número OS sequencial (tentativa ${tentativas}/${maxTentativas}):`, error.message);
      
      if (tentativas < maxTentativas) {
        // Aguardar um tempo aleatório maior a cada tentativa (backoff exponencial)
        const baseDelay = 200;
        const delay = baseDelay * Math.pow(2, tentativas - 1) + Math.random() * 300;
        console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para outros erros ou se esgotaram as tentativas, lança o erro
      console.error(`💥 Erro não recuperável ou tentativas esgotadas:`, error);
      throw error;
    }
  }
  
  throw new Error(`Não foi possível gerar número de OS após ${maxTentativas} tentativas`);
}

/**
 * Gera um número sequencial de orçamento no formato ORC01, ORC02, etc.
 * Usa função PostgreSQL para garantir atomicidade e evitar conflitos
 */
export async function generateSequentialOrcamentoNumber(empresaId: string, maxTentativas: number = 5): Promise<string> {
  let tentativas = 0;
  
  while (tentativas < maxTentativas) {
    try {
      console.log(`🔄 Tentativa ${tentativas + 1}/${maxTentativas} para gerar número sequencial de orçamento`);
      
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

      console.log(`✅ Número orçamento sequencial gerado: ${data}`);
      return data;

    } catch (error: any) {
      tentativas++;
      console.log(`❌ Erro ao gerar número orçamento sequencial (tentativa ${tentativas}/${maxTentativas}):`, error.message);
      
      if (tentativas < maxTentativas) {
        // Aguardar um tempo aleatório maior a cada tentativa (backoff exponencial)
        const baseDelay = 200;
        const delay = baseDelay * Math.pow(2, tentativas - 1) + Math.random() * 300;
        console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para outros erros ou se esgotaram as tentativas, lança o erro
      console.error(`💥 Erro não recuperável ou tentativas esgotadas:`, error);
      throw error;
    }
  }
  
  throw new Error(`Não foi possível gerar número de orçamento após ${maxTentativas} tentativas`);
}

