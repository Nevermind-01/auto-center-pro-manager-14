import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';

export interface FechamentoCaixa {
  id: string;
  empresa_id: string;
  caixa_id: string;
  contagem_dinheiro: number;
  contagem_pix: number;
  contagem_debito: number;
  contagem_credito: number;
  contagem_outros: any;
  total_contado: number;
  total_esperado: number;
  diferenca: number;
  resumo_por_forma: any;
  gerado_por: string;
  gerado_em: string;
  arquivo_relatorio_url?: string;
  created_at: string;
}

export interface DadosFechamento {
  contagem_dinheiro: number;
  contagem_pix: number;
  contagem_debito: number;
  contagem_credito: number;
  contagem_outros?: Record<string, number>;
  caixa_id: string;
}

export function useFechamentoCaixa() {
  const { toast } = useToast();
  const { empresaId } = useEmpresaContext();
  const queryClient = useQueryClient();

  // Buscar fechamentos anteriores
  const { data: fechamentosAnteriores, isLoading } = useQuery({
    queryKey: ['fechamentos-caixa', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];

      const { data, error } = await supabase
        .from('fechamentos_caixa')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('gerado_em', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as FechamentoCaixa[];
    },
    enabled: !!empresaId,
  });

  // Função para calcular valores esperados
  const calcularValoresEsperados = useCallback(async (caixaId: string) => {
    // Buscar caixa
    const { data: caixa, error: caixaError } = await supabase
      .from('caixas')
      .select('troco_inicial')
      .eq('id', caixaId)
      .single();

    if (caixaError) throw caixaError;

    // Buscar movimentações
    const { data: movimentacoes, error: movError } = await supabase
      .from('movimentacoes_caixa')
      .select('forma_pagamento, tipo, valor_liquido')
      .eq('caixa_id', caixaId);

    if (movError) throw movError;

    // Buscar suprimentos
    const { data: suprimentos, error: supError } = await supabase
      .from('suprimentos')
      .select('valor')
      .eq('caixa_id', caixaId);

    if (supError) throw supError;

    // Buscar sangrias
    const { data: sangrias, error: sangError } = await supabase
      .from('sangrias')
      .select('valor')
      .eq('caixa_id', caixaId);

    if (sangError) throw sangError;

    // Calcular resumo por forma de pagamento
    const resumoPorForma: Record<string, { entradas: number; saidas: number; total: number }> = {};

    movimentacoes.forEach((mov) => {
      if (!resumoPorForma[mov.forma_pagamento]) {
        resumoPorForma[mov.forma_pagamento] = { entradas: 0, saidas: 0, total: 0 };
      }
      
      if (mov.tipo === 'entrada') {
        resumoPorForma[mov.forma_pagamento].entradas += Number(mov.valor_liquido);
      } else {
        resumoPorForma[mov.forma_pagamento].saidas += Number(mov.valor_liquido);
      }
      
      resumoPorForma[mov.forma_pagamento].total = 
        resumoPorForma[mov.forma_pagamento].entradas - resumoPorForma[mov.forma_pagamento].saidas;
    });

    const totalSuprimentos = suprimentos.reduce((sum, sup) => sum + Number(sup.valor), 0);
    const totalSangrias = sangrias.reduce((sum, sang) => sum + Number(sang.valor), 0);

    const valoresEsperados = {
      dinheiro: (resumoPorForma.dinheiro?.total || 0) + Number(caixa.troco_inicial) + totalSuprimentos - totalSangrias,
      pix: resumoPorForma.pix?.total || 0,
      debito: resumoPorForma.debito?.total || 0,
      credito: resumoPorForma.credito?.total || 0,
      outros: Object.entries(resumoPorForma)
        .filter(([forma]) => !['dinheiro', 'pix', 'debito', 'credito'].includes(forma))
        .reduce((acc, [forma, dados]) => ({ ...acc, [forma]: dados.total }), {} as Record<string, number>),
    };

    const totalOutros = Object.values(valoresEsperados.outros).reduce((sum: number, valor: number) => sum + valor, 0);
    const totalEsperado = valoresEsperados.dinheiro + valoresEsperados.pix + 
                         valoresEsperados.debito + valoresEsperados.credito + totalOutros;

    return {
      valoresEsperados,
      totalEsperado,
      resumoPorForma,
      totalSuprimentos,
      totalSangrias,
      trocoInicial: Number(caixa.troco_inicial),
    };
  }, []);

  // Mutation para processar fechamento
  const processarFechamento = useMutation({
    mutationFn: async (dados: DadosFechamento) => {
      if (!empresaId) throw new Error('Empresa não selecionada');

      const calculados = await calcularValoresEsperados(dados.caixa_id);

      const totalContado = dados.contagem_dinheiro + dados.contagem_pix + 
                          dados.contagem_debito + dados.contagem_credito +
                          Object.values(dados.contagem_outros || {}).reduce((sum: number, valor) => sum + valor, 0);

      const diferenca = totalContado - calculados.totalEsperado;

      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('Usuário não autenticado');

      // Criar registro de fechamento
      const { data: fechamento, error } = await supabase
        .from('fechamentos_caixa')
        .insert({
          empresa_id: empresaId,
          caixa_id: dados.caixa_id,
          contagem_dinheiro: dados.contagem_dinheiro,
          contagem_pix: dados.contagem_pix,
          contagem_debito: dados.contagem_debito,
          contagem_credito: dados.contagem_credito,
          contagem_outros: dados.contagem_outros,
          total_contado: totalContado,
          total_esperado: calculados.totalEsperado,
          diferenca: diferenca,
          resumo_por_forma: {
            esperado: calculados.valoresEsperados,
            contado: {
              dinheiro: dados.contagem_dinheiro,
              pix: dados.contagem_pix,
              debito: dados.contagem_debito,
              credito: dados.contagem_credito,
              outros: dados.contagem_outros || {},
            },
            movimentacoes: calculados.resumoPorForma,
            suprimentos: calculados.totalSuprimentos,
            sangrias: calculados.totalSangrias,
            troco_inicial: calculados.trocoInicial,
          },
          gerado_por: user.data.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_caixa').insert({
        empresa_id: empresaId,
        caixa_id: dados.caixa_id,
        acao: 'FECHAMENTO_PROCESSADO',
        detalhes: {
          total_contado: totalContado,
          total_esperado: calculados.totalEsperado,
          diferenca: diferenca,
          status_diferenca: diferenca === 0 ? 'BATEU' : diferenca > 0 ? 'SOBROU' : 'FALTOU',
        },
        user_id: user.data.user.id,
      });

      return fechamento;
    },
    onSuccess: (fechamento) => {
      const status = fechamento.diferenca === 0 ? 'fechou exato' : 
                    fechamento.diferenca > 0 ? `sobrou R$ ${Math.abs(fechamento.diferenca).toFixed(2)}` :
                    `faltou R$ ${Math.abs(fechamento.diferenca).toFixed(2)}`;

      toast({
        title: "Fechamento processado",
        description: `O fechamento foi processado - ${status}.`,
        variant: fechamento.diferenca === 0 ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ['fechamentos-caixa'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar fechamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  return {
    fechamentosAnteriores,
    isLoading,
    processarFechamento: processarFechamento.mutate,
    isProcessandoFechamento: processarFechamento.isPending,
    calcularValoresEsperados,
  };
}