/**
 * Sistema de tratamento de erros específicos para criação de OS
 * Analisa e categoriza erros para fornecer mensagens úteis ao usuário
 */

export interface ErrorAnalysis {
  type: 'duplicate_os' | 'stock_insufficient' | 'validation' | 'cashier' | 'permission' | 'network' | 'unknown';
  message: string;
  canRetry: boolean;
  details?: string;
}

export function analyzeError(error: any): ErrorAnalysis {
  const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
  const errorCode = error?.code;
  
  // Erro de duplicação de número OS
  if (errorMessage.includes('vendas_numero_os_unique') || 
      errorMessage.includes('duplicate key') || 
      errorMessage.includes('já existe')) {
    return {
      type: 'duplicate_os',
      message: 'Conflito na numeração da OS. Tentando novamente...',
      canRetry: true,
      details: 'Outro usuário pode ter criado uma OS com o mesmo número simultaneamente'
    };
  }

  // Erro de estoque insuficiente
  if (errorMessage.includes('estoque insuficiente') || 
      errorMessage.includes('Estoque insuficiente')) {
    const productMatch = errorMessage.match(/produto (.+?)[\.\s]/);
    const availableMatch = errorMessage.match(/Disponível: (\d+)/);
    const neededMatch = errorMessage.match(/Necessário: (\d+)/);
    
    const productName = productMatch?.[1] || 'produto';
    const available = availableMatch?.[1] || '0';
    const needed = neededMatch?.[1] || 'quantidade solicitada';
    
    return {
      type: 'stock_insufficient',
      message: `Estoque insuficiente para ${productName}`,
      canRetry: false,
      details: `Disponível: ${available}, Necessário: ${needed}`
    };
  }

  // Erros de validação
  if (errorMessage.includes('é obrigatório') || 
      errorMessage.includes('inválido') ||
      errorMessage.includes('deve ser') ||
      errorMessage.includes('não selecionado') ||
      errorMessage.includes('não foi gerado')) {
    return {
      type: 'validation',
      message: errorMessage,
      canRetry: false,
      details: 'Verifique os dados obrigatórios antes de continuar'
    };
  }

  // Erros de caixa
  if (errorMessage.includes('caixa') && 
      (errorMessage.includes('fechado') || errorMessage.includes('não há caixa'))) {
    return {
      type: 'cashier',
      message: 'OS salva, mas não foi possível registrar no caixa',
      canRetry: false,
      details: 'Caixa fechado ou indisponível. A OS foi salva com sucesso'
    };
  }

  // Erros de permissão RLS
  if (errorMessage.includes('row-level security') || 
      errorMessage.includes('permission denied') ||
      errorMessage.includes('não tem acesso')) {
    return {
      type: 'permission',
      message: 'Erro de permissão. Verifique se você tem acesso à empresa',
      canRetry: false,
      details: 'Possível problema de configuração de empresa ou permissões'
    };
  }

  // Erros de rede
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorCode === 'NETWORK_ERROR') {
    return {
      type: 'network',
      message: 'Problema de conexão. Tente novamente',
      canRetry: true,
      details: 'Verifique sua conexão com a internet'
    };
  }

  // Erro genérico
  return {
    type: 'unknown',
    message: 'Erro inesperado. Tente novamente',
    canRetry: true,
    details: errorMessage
  };
}

/**
 * Função para retry inteligente com backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const analysis = analyzeError(error);
      
      // Não tenta novamente se o erro não permite retry
      if (!analysis.canRetry || attempt === maxRetries) {
        throw error;
      }

      // Delay com backoff exponencial apenas para erros que permitem retry
      if (analysis.type === 'duplicate_os' || analysis.type === 'network') {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Para outros tipos, não faz retry
      }
    }
  }
  
  throw lastError;
}

/**
 * Função para gerar mensagem de erro específica com sugestões de ação
 */
export function getErrorToastConfig(analysis: ErrorAnalysis) {
  const baseConfig = {
    variant: "destructive" as const,
    title: "",
    description: ""
  };

  switch (analysis.type) {
    case 'duplicate_os':
      return {
        ...baseConfig,
        title: "Conflito de Numeração",
        description: analysis.message
      };

    case 'stock_insufficient':
      return {
        ...baseConfig,
        title: "Estoque Insuficiente",
        description: `${analysis.message}. ${analysis.details}`
      };

    case 'validation':
      return {
        ...baseConfig,
        title: "Dados Incompletos",
        description: analysis.message
      };

    case 'cashier':
      return {
        ...baseConfig,
        title: "Atenção",
        description: analysis.message,
        variant: "default" as const // Menos severo pois a OS foi salva
      };

    case 'permission':
      return {
        ...baseConfig,
        title: "Erro de Permissão",
        description: analysis.message
      };

    case 'network':
      return {
        ...baseConfig,
        title: "Problema de Conexão",
        description: analysis.message
      };

    default:
      return {
        ...baseConfig,
        title: "Erro",
        description: analysis.message
      };
  }
}