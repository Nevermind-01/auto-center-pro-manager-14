import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEmpresaContext } from "@/hooks/useEmpresaContext";
import { useMovimentacoesCaixa } from "@/hooks/useMovimentacoesCaixa";

interface PagamentoOS {
  id: string;
  os_id: string;
  valor_pago: number;
  forma_pagamento: string;
  valor_restante: number;
  data_pagamento: string;
  observacoes?: string;
  vendas?: {
    numero_os: string;
    valor_final: number;
    cliente_nome: string;
  };
}

interface OSPendente {
  id: string;
  numero_os: string;
  valor_final: number;
  cliente_nome: string;
  finalizado_em: string;
  valor_pago: number;
  valor_restante: number;
}

interface RegistrarPagamentoData {
  osId: string;
  valorPago: number;
  formaPagamento: string;
  observacoes?: string;
}

export function usePagamentosOS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { empresaAtual } = useEmpresaContext();
  const { criarMovimentacaoAsync } = useMovimentacoesCaixa();

  // Buscar OSs pendentes de um cliente
  const getPagamentosPendentes = (clienteId: string) => {
    return useQuery({
      queryKey: ["pagamentos-pendentes", clienteId, empresaAtual?.id],
      queryFn: async () => {
        if (!clienteId || !empresaAtual?.id) return [];

        const { data: vendas, error } = await supabase
          .from("vendas")
          .select(`
            id,
            numero_os,
            valor_final,
            cliente_nome,
            finalizado_em
          `)
          .eq("cliente_id", clienteId)
          .eq("empresa_id", empresaAtual.id)
          .eq("status", "finalizada-carteira")
          .order("finalizado_em", { ascending: false });

        if (error) throw error;

        // Para cada venda, calcular valor pago e restante
        const ossPendentes: OSPendente[] = [];
        
        for (const venda of vendas || []) {
          const { data: pagamentos, error: pagError } = await supabase
            .from("pagamentos_os")
            .select("valor_pago")
            .eq("os_id", venda.id);

          if (pagError) throw pagError;

          const valorPago = pagamentos?.reduce((acc, p) => acc + Number(p.valor_pago), 0) || 0;
          const valorRestante = Number(venda.valor_final) - valorPago;

          if (valorRestante > 0) {
            ossPendentes.push({
              ...venda,
              valor_pago: valorPago,
              valor_restante: valorRestante
            });
          }
        }

        return ossPendentes;
      },
      enabled: !!clienteId && !!empresaAtual?.id,
    });
  };

  // Buscar histórico de pagamentos de uma OS
  const getHistoricoPagamentos = (osId: string) => {
    return useQuery({
      queryKey: ["historico-pagamentos", osId, empresaAtual?.id],
      queryFn: async () => {
        if (!osId) return [];

        const { data, error } = await supabase
          .from("pagamentos_os")
          .select(`
            *,
            vendas:os_id (
              numero_os,
              valor_final,
              cliente_nome
            )
          `)
          .eq("os_id", osId)
          .eq("empresa_id", empresaAtual?.id)
          .order("data_pagamento", { ascending: false });

        if (error) throw error;
        return data as PagamentoOS[];
      },
      enabled: !!osId && !!empresaAtual?.id,
    });
  };

  // Registrar pagamento parcial
  const registrarPagamento = useMutation({
    mutationFn: async ({ osId, valorPago, formaPagamento, observacoes }: RegistrarPagamentoData) => {
      if (!empresaAtual?.id) throw new Error("Empresa não selecionada");
      
      // Buscar dados da OS
      const { data: venda, error: vendaError } = await supabase
        .from("vendas")
        .select("valor_final, numero_os, cliente_nome")
        .eq("id", osId)
        .eq("empresa_id", empresaAtual.id)
        .single();

      if (vendaError) throw vendaError;

      // Calcular valor já pago
      const { data: pagamentosAnteriores } = await supabase
        .from("pagamentos_os")
        .select("valor_pago")
        .eq("os_id", osId);

      const valorJaPago = pagamentosAnteriores?.reduce((acc, p) => acc + Number(p.valor_pago), 0) || 0;
      const valorRestanteAntes = Number(venda.valor_final) - valorJaPago;
      const novoValorRestante = valorRestanteAntes - valorPago;

      if (valorPago > valorRestanteAntes) {
        throw new Error(`Valor do pagamento (R$ ${valorPago.toFixed(2)}) não pode ser maior que o valor restante (R$ ${valorRestanteAntes.toFixed(2)})`);
      }

      // Registrar pagamento
      const { data: pagamento, error: pagamentoError } = await supabase
        .from("pagamentos_os")
        .insert({
          os_id: osId,
          valor_pago: valorPago,
          forma_pagamento: formaPagamento as any,
          valor_restante: novoValorRestante,
          usuario_id: (await supabase.auth.getUser()).data.user?.id,
          empresa_id: empresaAtual.id,
          observacoes
        })
        .select()
        .single();

      if (pagamentoError) throw pagamentoError;

      // Criar movimentação no caixa
      await criarMovimentacaoAsync({
        tipo: 'entrada',
        tipo_origem: 'MANUAL',
        forma_pagamento: formaPagamento as any,
        valor_bruto: valorPago,
        valor_liquido: valorPago,
        descricao: `Pagamento parcial OS ${venda.numero_os} - ${venda.cliente_nome}`,
        referencia_id: osId
      });

      // Se pagamento completou a OS, alterar status
      if (novoValorRestante <= 0.01) { // Tolerância para arredondamentos
        const { error: statusError } = await supabase
          .from("vendas")
          .update({ status: "finalizada" })
          .eq("id", osId);

        if (statusError) throw statusError;
      }

      return { pagamento, osCompletada: novoValorRestante <= 0.01 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pagamentos-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["historico-pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["carteiras-empresas"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-caixa"] });
      
      if (data.osCompletada) {
        toast({
          title: "Pagamento registrado",
          description: "Pagamento registrado com sucesso! OS foi finalizada completamente.",
        });
      } else {
        toast({
          title: "Pagamento registrado", 
          description: "Pagamento parcial registrado com sucesso.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    getPagamentosPendentes,
    getHistoricoPagamentos,
    registrarPagamento: registrarPagamento.mutate,
    isRegistrandoPagamento: registrarPagamento.isPending,
  };
}