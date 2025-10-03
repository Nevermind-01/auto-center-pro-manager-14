import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEmpresaContext } from "@/hooks/useEmpresaContext";
import { useMovimentacoesCaixa } from "@/hooks/useMovimentacoesCaixa";
import { useCarteiraCliente } from "@/hooks/useCarteiraCliente";
import { getFormaPagamentoDescription, isValidFormaPagamento } from '@/lib/paymentMethodMapper';

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
  pagamentos_realizados?: PagamentoOS[];
}

interface OSConcluida {
  id: string;
  numero_os: string;
  valor_final: number;
  cliente_nome: string;
  finalizado_em: string;
  data_conclusao: string;
  pagamentos: PagamentoOS[];
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
  const { adicionarCredito } = useCarteiraCliente();

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

        // Para cada venda, calcular valor pago e restante usando pagamentos_os como fonte única
        const ossPendentes: OSPendente[] = [];
        
        for (const venda of vendas || []) {
          // Buscar todos os pagamentos (incluindo o registro inicial da finalização)
          const { data: pagamentos, error: pagError } = await supabase
            .from("pagamentos_os")
            .select(`
              id,
              valor_pago,
              forma_pagamento,
              data_pagamento,
              observacoes
            `)
            .eq("os_id", venda.id)
            .order("data_pagamento", { ascending: false });

          if (pagError) throw pagError;

          // Total pago = soma de TODOS os pagamentos em pagamentos_os
          const valorPagoTotal = pagamentos?.reduce((acc, p) => acc + Number(p.valor_pago), 0) || 0;
          const valorRestante = Number(venda.valor_final) - valorPagoTotal;

          if (valorRestante > 0) {
            ossPendentes.push({
              ...venda,
              valor_pago: valorPagoTotal,
              valor_restante: valorRestante,
              pagamentos_realizados: pagamentos?.map(p => ({
                ...p,
                os_id: venda.id,
                valor_restante: 0,
                vendas: {
                  numero_os: venda.numero_os,
                  valor_final: venda.valor_final,
                  cliente_nome: venda.cliente_nome
                }
              })) || []
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

        // Buscar dados da OS primeiro para saber se foi paga via carteira
        const { data: venda, error: vendaError } = await supabase
          .from("vendas")
          .select("numero_os, valor_final, cliente_nome, forma_pagamento, status, finalizado_em")
          .eq("id", osId)
          .single();

        if (vendaError) throw vendaError;

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

        const pagamentos = data as PagamentoOS[];

        // Se OS foi finalizada via carteira, adicionar registro inicial do pagamento via carteira
        if (venda.forma_pagamento === 'carteira' && venda.status === 'finalizada-carteira') {
          const pagamentoInicialCarteira: PagamentoOS = {
            id: `carteira-inicial-${osId}`,
            os_id: osId,
            valor_pago: 0,
            forma_pagamento: 'carteira',
            valor_restante: venda.valor_final,
            data_pagamento: venda.finalizado_em,
            observacoes: `OS finalizada via carteira - Valor debitado: R$ ${venda.valor_final.toFixed(2)}`,
            vendas: {
              numero_os: venda.numero_os,
              valor_final: venda.valor_final,
              cliente_nome: venda.cliente_nome
            }
          };
          
          // Adicionar o pagamento inicial e ordenar por data
          const todosPagamentos = [pagamentoInicialCarteira, ...pagamentos];
          return todosPagamentos.sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime());
        }

        return pagamentos;
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

      // Mapear e validar forma de pagamento
      const formaPagamentoMapeada = formaPagamento === 'transferencia' ? 'outros' : formaPagamento;
      const formaPagamentoValidada = isValidFormaPagamento(formaPagamentoMapeada) ? formaPagamentoMapeada : 'outros';

      // Registrar pagamento
      const { data: pagamento, error: pagamentoError } = await supabase
        .from("pagamentos_os")
        .insert({
          os_id: osId,
          valor_pago: valorPago,
          forma_pagamento: formaPagamentoValidada,
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
        forma_pagamento: formaPagamentoValidada as any,
        valor_bruto: valorPago,
        valor_liquido: valorPago,
        descricao: `Pagamento parcial OS ${venda.numero_os} - ${venda.cliente_nome}`,
        referencia_id: osId
      });

      // Creditar o valor pago de volta na carteira do cliente
      const { data: vendaCompleta } = await supabase
        .from("vendas")
        .select("cliente_id")
        .eq("id", osId)
        .single();

      if (vendaCompleta?.cliente_id) {
        try {
          // Usar a forma de pagamento já validada e formatada
          const formaPagamentoFormatada = getFormaPagamentoDescription(formaPagamentoValidada as any);
          
          await adicionarCredito.mutateAsync({
            clienteId: vendaCompleta.cliente_id,
            valor: valorPago,
            descricao: `Pagamento OS ${venda.numero_os}`,
            formaPagamento: formaPagamentoFormatada
          });
        } catch (carteiraError) {
          console.error('Erro ao creditar na carteira:', carteiraError);
          // Não falha a operação, apenas loga o erro
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ["carteira-cliente"] });
      queryClient.invalidateQueries({ queryKey: ["historico-carteira"] });
      queryClient.invalidateQueries({ queryKey: ["todos-clientes-carteira"] });
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

  // Buscar OSs concluídas de um cliente
  const getPagamentosConcluidos = (clienteId: string) => {
    return useQuery({
      queryKey: ["pagamentos-concluidos", clienteId, empresaAtual?.id],
      queryFn: async () => {
        if (!clienteId || !empresaAtual?.id) return [];

        const { data: vendas, error } = await supabase
          .from("vendas")
          .select(`
            id,
            numero_os,
            valor_final,
            cliente_nome,
            finalizado_em,
            updated_at,
            status
          `)
          .eq("cliente_id", clienteId)
          .eq("empresa_id", empresaAtual.id)
          .in("status", ["finalizada-carteira"])
          .order("updated_at", { ascending: false });

        if (error) throw error;

        // Para cada venda, buscar todos os pagamentos
        const ossConcluidas: OSConcluida[] = [];
        
        for (const venda of vendas || []) {
          const { data: pagamentos, error: pagError } = await supabase
            .from("pagamentos_os")
            .select(`
              id,
              valor_pago,
              valor_restante,
              forma_pagamento,
              data_pagamento,
              observacoes
            `)
            .eq("os_id", venda.id)
            .order("data_pagamento", { ascending: true });

          if (pagError) throw pagError;

          // Verificar se a OS foi realmente concluída
          let foiConcluida = false;
          let dataConclusao = venda.finalizado_em;
          let pagamentosHistorico = [...(pagamentos || [])];

          if (venda.status === "finalizada-carteira") {
            // Para OSs finalizadas via carteira, verificar se foi completamente paga
            if (pagamentos && pagamentos.length > 0) {
              const ultimoPagamento = pagamentos[pagamentos.length - 1];
              foiConcluida = ultimoPagamento.valor_restante <= 0.01; // Tolerância para arredondamento
              dataConclusao = ultimoPagamento.data_pagamento;

              // Adicionar o débito inicial da carteira como primeiro item
              pagamentosHistorico.unshift({
                id: `carteira-${venda.id}`,
                valor_pago: venda.valor_final,
                valor_restante: venda.valor_final,
                forma_pagamento: "carteira" as any,
                data_pagamento: venda.finalizado_em,
                observacoes: "Finalização via carteira (débito inicial)"
              });
            }
          }

          // Só incluir OSs que foram realmente concluídas
          if (foiConcluida) {
            ossConcluidas.push({
              ...venda,
              data_conclusao: dataConclusao,
              pagamentos: pagamentosHistorico.map(p => ({
                ...p,
                os_id: venda.id,
                vendas: {
                  numero_os: venda.numero_os,
                  valor_final: venda.valor_final,
                  cliente_nome: venda.cliente_nome
                }
              }))
            });
          }
        }

        return ossConcluidas;
      },
      enabled: !!clienteId && !!empresaAtual?.id,
    });
  };

  return {
    getPagamentosPendentes,
    getPagamentosConcluidos,
    getHistoricoPagamentos,
    registrarPagamento: registrarPagamento.mutate,
    isRegistrandoPagamento: registrarPagamento.isPending,
  };
}