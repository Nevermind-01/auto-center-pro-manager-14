import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera um número único de OS no formato OSYYYYMMDDHHMM
 * Verifica duplicatas no banco e adiciona segundos/tentativas se necessário
 */
export async function generateUniqueOSNumber(): Promise<string> {
  let numeroValido = false;
  let novoNumero = "";
  let tentativas = 0;
  
  while (!numeroValido && tentativas < 100) {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');
    
    // Adicionar segundos se houver tentativas anteriores
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
    } else {
      tentativas++;
      // Aguardar 100ms antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  if (!numeroValido) {
    throw new Error('Não foi possível gerar um número de OS único após 100 tentativas');
  }
  
  return novoNumero;
}
