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
      
      const { data, error } = await supabase.rpc('get_next_sequential_number', {
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
      
      const { data, error } = await supabase.rpc('get_next_sequential_number', {
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

/**
 * @deprecated Use generateSequentialOSNumber instead
 * Mantido para compatibilidade com código legado
 */
export async function generateUniqueOSNumber(maxTentativas: number = 100): Promise<string> {
  console.warn('⚠️ generateUniqueOSNumber está deprecated. Use generateSequentialOSNumber instead.');
  // Para compatibilidade temporária, ainda gera o formato antigo
  let numeroValido = false;
  let novoNumero = "";
  let tentativas = 0;
  
  while (!numeroValido && tentativas < maxTentativas) {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');
    
    // Adicionar segundos e timestamp mais preciso se houver tentativas anteriores
    novoNumero = tentativas > 0 
      ? `OS${ano}${mes}${dia}${hora}${minuto}${segundo}${tentativas}`
      : `OS${ano}${mes}${dia}${hora}${minuto}`;
    
    // Verificar se o número já existe
    const { data: existeOS } = await supabase
      .from('vendas')
      .select('id')
      .eq('numero_os', novoNumero)
      .maybeSingle();
    
    if (!existeOS) {
      numeroValido = true;
      console.log(`✅ Número OS único gerado: ${novoNumero} (tentativa ${tentativas + 1})`);
    } else {
      tentativas++;
      console.log(`⚠️ Número OS ${novoNumero} já existe, tentativa ${tentativas}...`);
      // Aguardar um tempo aleatório entre 50-200ms para evitar conflitos
      const delay = Math.random() * 150 + 50;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  if (!numeroValido) {
    throw new Error(`Não foi possível gerar um número de OS único após ${maxTentativas} tentativas`);
  }
  
  return novoNumero;
}

/**
 * Executa uma operação de criação de OS com retry automático usando numeração sequencial
 */
export async function createOSWithRetry<T>(
  createFunction: (numeroOS: string) => Promise<T>,
  empresaId: string,
  maxTentativas: number = 5
): Promise<{ result: T; numeroOS: string }> {
  let tentativas = 0;
  
  while (tentativas < maxTentativas) {
    try {
      // Gerar número sequencial para esta tentativa
      const numeroOS = await generateSequentialOSNumber(empresaId);
      console.log(`🔄 Tentativa ${tentativas + 1}/${maxTentativas} para criar OS ${numeroOS}`);
      
      // Executar a função de criação
      const result = await createFunction(numeroOS);
      
      console.log(`✅ OS ${numeroOS} criada com sucesso na tentativa ${tentativas + 1}`);
      return { result, numeroOS };
      
    } catch (error: any) {
      // Verificar se é erro de constraint unique (código 23505)
      const isUniqueConstraintError = 
        error?.code === '23505' ||
        (error?.message && (
          error.message.includes('numero_os') && error.message.includes('already exists') ||
          error.message.includes('unique constraint') ||
          error.message.includes('duplicate key')
        ));
      
      if (isUniqueConstraintError) {
        tentativas++;
        console.log(`❌ Conflito de numeração OS (tentativa ${tentativas}/${maxTentativas}):`, error.message);
        
        if (tentativas < maxTentativas) {
          // Aguardar um tempo aleatório maior a cada tentativa (backoff exponencial)
          const baseDelay = 200;
          const delay = baseDelay * Math.pow(2, tentativas - 1) + Math.random() * 300;
          console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Para outros erros ou se esgotaram as tentativas, lança o erro
      console.error(`💥 Erro não recuperável ou tentativas esgotadas:`, error);
      throw error;
    }
  }
  
  throw new Error(`Não foi possível criar OS após ${maxTentativas} tentativas devido à concorrência`);
}

/**
 * Executa uma operação de criação de orçamento com retry automático usando numeração sequencial
 */
export async function createOrcamentoWithRetry<T>(
  createFunction: (numeroOrcamento: string) => Promise<T>,
  empresaId: string,
  maxTentativas: number = 5
): Promise<{ result: T; numeroOrcamento: string }> {
  let tentativas = 0;
  
  while (tentativas < maxTentativas) {
    try {
      // Gerar número sequencial para esta tentativa
      const numeroOrcamento = await generateSequentialOrcamentoNumber(empresaId);
      console.log(`🔄 Tentativa ${tentativas + 1}/${maxTentativas} para criar orçamento ${numeroOrcamento}`);
      
      // Executar a função de criação
      const result = await createFunction(numeroOrcamento);
      
      console.log(`✅ Orçamento ${numeroOrcamento} criado com sucesso na tentativa ${tentativas + 1}`);
      return { result, numeroOrcamento };
      
    } catch (error: any) {
      // Verificar se é erro de constraint unique (código 23505)
      const isUniqueConstraintError = 
        error?.code === '23505' ||
        (error?.message && (
          error.message.includes('numero_orcamento') && error.message.includes('already exists') ||
          error.message.includes('unique constraint') ||
          error.message.includes('duplicate key')
        ));
      
      if (isUniqueConstraintError) {
        tentativas++;
        console.log(`❌ Conflito de numeração orçamento (tentativa ${tentativas}/${maxTentativas}):`, error.message);
        
        if (tentativas < maxTentativas) {
          // Aguardar um tempo aleatório maior a cada tentativa (backoff exponencial)
          const baseDelay = 200;
          const delay = baseDelay * Math.pow(2, tentativas - 1) + Math.random() * 300;
          console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Para outros erros ou se esgotaram as tentativas, lança o erro
      console.error(`💥 Erro não recuperável ou tentativas esgotadas:`, error);
      throw error;
    }
  }
  
  throw new Error(`Não foi possível criar orçamento após ${maxTentativas} tentativas devido à concorrência`);
}
