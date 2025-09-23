import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaContext } from "./useEmpresaContext";
import { toast } from "sonner";

export interface CarteiraCliente {
  id: string;
  cliente_id: string;
  empresa_id: string;
  saldo_atual: number;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoCarteira {
  id: string;
  cliente_id: string;
  empresa_id: string;
  tipo: 'credito' | 'debito';
  valor: number;
  descricao: string;
  os_id?: string;
  saldo_anterior: number;
  saldo_novo: number;
  criado_por: string;
  created_at: string;
}

export function useCarteiraCliente() {
  const { empresaId } = useEmpresaContext();
  const queryClient = useQueryClient();

  // Buscar saldo de um cliente específico
  const getCarteiraCliente = (clienteId: string) => {
    return useQuery({
      queryKey: ["carteira-cliente", clienteId, empresaId],
      queryFn: async () => {
        if (!empresaId || !clienteId) return null;

        const { data, error } = await supabase
          .from("clientes_carteira")
          .select("*")
          .eq("cliente_id", clienteId)
          .eq("empresa_id", empresaId)
          .maybeSingle();

        if (error) throw error;
        return data as CarteiraCliente | null;
      },
      enabled: !!empresaId && !!clienteId,
    });
  };

  // Buscar histórico de movimentações de um cliente
  const getHistoricoCarteira = (clienteId: string) => {
    return useQuery({
      queryKey: ["historico-carteira", clienteId, empresaId],
      queryFn: async () => {
        if (!empresaId || !clienteId) return [];

        const { data, error } = await supabase
          .from("movimentacoes_carteira")
          .select("*")
          .eq("cliente_id", clienteId)
          .eq("empresa_id", empresaId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as MovimentacaoCarteira[];
      },
      enabled: !!empresaId && !!clienteId,
    });
  };

  // Buscar todas as carteiras da empresa
  const getCarteirasEmpresas = () => {
    return useQuery({
      queryKey: ["carteiras-empresa", empresaId],
      queryFn: async () => {
        if (!empresaId) return [];

        const { data, error } = await supabase
          .from("clientes_carteira")
          .select(`
            *,
            clientes (
              nome,
              email,
              telefone
            )
          `)
          .eq("empresa_id", empresaId)
          .order("saldo_atual", { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: !!empresaId,
    });
  };

  // Adicionar crédito à carteira
  const adicionarCredito = useMutation({
    mutationFn: async ({ 
      clienteId, 
      valor, 
      descricao 
    }: { 
      clienteId: string; 
      valor: number; 
      descricao: string; 
    }) => {
      if (!empresaId) throw new Error("Empresa não selecionada");

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Buscar carteira atual ou criar se não existir
      let { data: carteira, error: carteiraError } = await supabase
        .from("clientes_carteira")
        .select("*")
        .eq("cliente_id", clienteId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (carteiraError) throw carteiraError;

      let saldoAnterior = 0;

      if (!carteira) {
        // Criar nova carteira
        const { data: novaCarteira, error: novaCarteiraError } = await supabase
          .from("clientes_carteira")
          .insert({
            cliente_id: clienteId,
            empresa_id: empresaId,
            saldo_atual: 0
          })
          .select()
          .single();

        if (novaCarteiraError) throw novaCarteiraError;
        carteira = novaCarteira;
      }

      saldoAnterior = carteira.saldo_atual;
      const saldoNovo = saldoAnterior + valor;

      // Atualizar saldo na carteira
      const { error: updateError } = await supabase
        .from("clientes_carteira")
        .update({ saldo_atual: saldoNovo })
        .eq("id", carteira.id);

      if (updateError) throw updateError;

      // Registrar movimentação
      const { error: movError } = await supabase
        .from("movimentacoes_carteira")
        .insert({
          cliente_id: clienteId,
          empresa_id: empresaId,
          tipo: 'credito',
          valor,
          descricao,
          saldo_anterior: saldoAnterior,
          saldo_novo: saldoNovo,
          criado_por: user.user.id
        });

      if (movError) throw movError;

      return { saldoNovo, saldoAnterior };
    },
    onSuccess: () => {
      toast.success("Crédito adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["carteira-cliente"] });
      queryClient.invalidateQueries({ queryKey: ["historico-carteira"] });
      queryClient.invalidateQueries({ queryKey: ["carteiras-empresa"] });
    },
    onError: (error) => {
      console.error("Erro ao adicionar crédito:", error);
      toast.error("Erro ao adicionar crédito à carteira");
    },
  });

  // Debitar da carteira
  const debitarCarteira = useMutation({
    mutationFn: async ({ 
      clienteId, 
      valor, 
      descricao, 
      osId 
    }: { 
      clienteId: string; 
      valor: number; 
      descricao: string; 
      osId?: string; 
    }) => {
      if (!empresaId) throw new Error("Empresa não selecionada");

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Buscar carteira atual
      const { data: carteira, error: carteiraError } = await supabase
        .from("clientes_carteira")
        .select("*")
        .eq("cliente_id", clienteId)
        .eq("empresa_id", empresaId)
        .single();

      if (carteiraError) throw carteiraError;
      if (!carteira) throw new Error("Cliente não possui carteira");

      const saldoAnterior = carteira.saldo_atual;
      
      // Verificar se há saldo suficiente
      if (saldoAnterior < valor) {
        throw new Error("Saldo insuficiente na carteira");
      }

      const saldoNovo = saldoAnterior - valor;

      // Atualizar saldo na carteira
      const { error: updateError } = await supabase
        .from("clientes_carteira")
        .update({ saldo_atual: saldoNovo })
        .eq("id", carteira.id);

      if (updateError) throw updateError;

      // Registrar movimentação
      const { error: movError } = await supabase
        .from("movimentacoes_carteira")
        .insert({
          cliente_id: clienteId,
          empresa_id: empresaId,
          tipo: 'debito',
          valor,
          descricao,
          os_id: osId,
          saldo_anterior: saldoAnterior,
          saldo_novo: saldoNovo,
          criado_por: user.user.id
        });

      if (movError) throw movError;

      return { saldoNovo, saldoAnterior };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carteira-cliente"] });
      queryClient.invalidateQueries({ queryKey: ["historico-carteira"] });
      queryClient.invalidateQueries({ queryKey: ["carteiras-empresa"] });
    },
    onError: (error) => {
      console.error("Erro ao debitar carteira:", error);
      toast.error(error.message || "Erro ao debitar da carteira");
    },
  });

  return {
    getCarteiraCliente,
    getHistoricoCarteira,
    getCarteirasEmpresas,
    adicionarCredito,
    debitarCarteira,
    isAdicionandoCredito: adicionarCredito.isPending,
    isDebitandoCarteira: debitarCarteira.isPending,
  };
}