import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { type FormaPagamentoMultipla } from "@/components/MultiplePaymentForms";
import { type FormaPagamento } from "@/lib/paymentMethodMapper";

export const useMultiplePaymentForms = () => {
  const { toast } = useToast();

  const salvarFormasPagamento = useCallback(async (
    osId: string, 
    formas: FormaPagamentoMultipla[]
  ) => {
    try {
      // Primeiro, deletar formas existentes
      const { error: deleteError } = await supabase
        .from('os_formas_pagamento')
        .delete()
        .eq('os_id', osId);

      if (deleteError) throw deleteError;

      // Preparar formas para inserir
      const formasParaInserir = formas
        .filter(forma => forma.forma_pagamento && forma.valor > 0)
        .map((forma, index) => ({
          os_id: osId,
          forma_pagamento: forma.forma_pagamento as FormaPagamento,
          valor: forma.valor,
          parcelas: forma.forma_pagamento === 'credito' ? forma.parcelas : 1,
          observacoes: forma.observacoes || null,
          ordem: index + 1
        }));

      // Inserir novas formas
      if (formasParaInserir.length > 0) {
        // Buscar empresa_id do usuário atual
        const { data: userData } = await supabase.auth.getUser();
        const { data: profileData } = await supabase
          .from('profiles')
          .select('empresa_atual_id')
          .eq('user_id', userData.user?.id)
          .single();

        const formasComEmpresa = formasParaInserir.map(forma => ({
          ...forma,
          empresa_id: profileData?.empresa_atual_id
        }));

        const { error: insertError } = await supabase
          .from('os_formas_pagamento')
          .insert(formasComEmpresa);

        if (insertError) throw insertError;
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar formas de pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar formas de pagamento.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [toast]);

  const buscarFormasPagamento = useCallback(async (osId: string) => {
    try {
      const { data, error } = await supabase
        .from('os_formas_pagamento')
        .select('*')
        .eq('os_id', osId)
        .order('ordem');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      return [];
    }
  }, []);

  const criarFormaPadrao = useCallback((valorTotal: number, formaPagamento: FormaPagamento = "dinheiro"): FormaPagamentoMultipla[] => {
    return [{
      id: `forma-${Date.now()}`,
      forma_pagamento: formaPagamento,
      valor: valorTotal,
      parcelas: 1,
      observacoes: ""
    }];
  }, []);

  const validarFormas = useCallback((
    formas: FormaPagamentoMultipla[],
    valorTotal: number,
    saldoCarteira: number = 0
  ) => {
    const errors: string[] = [];

    if (formas.length === 0) {
      errors.push("Pelo menos uma forma de pagamento é obrigatória");
      return { isValid: false, errors };
    }

    const formasValidas = formas.filter(forma => forma.forma_pagamento && forma.valor > 0);
    if (formasValidas.length === 0) {
      errors.push("Pelo menos uma forma de pagamento deve ter valor maior que zero");
    }

    const valorPago = formas.reduce((total, forma) => total + forma.valor, 0);
    const diferenca = Math.abs(valorTotal - valorPago);
    
    if (diferenca > 0.01) { // Tolerância para arredondamento
      if (valorPago < valorTotal) {
        errors.push(`Valor insuficiente. Faltam ${(valorTotal - valorPago).toFixed(2)}`);
      } else {
        errors.push(`Valor excedente. Sobram ${(valorPago - valorTotal).toFixed(2)}`);
      }
    }

    // Validar formas duplicadas
    const formasUsadas = new Set();
    for (const forma of formasValidas) {
      if (formasUsadas.has(forma.forma_pagamento)) {
        errors.push(`Forma de pagamento "${forma.forma_pagamento}" duplicada`);
        break;
      }
      formasUsadas.add(forma.forma_pagamento);
    }

    // Validar carteira
    const formasCarteira = formas.filter(forma => forma.forma_pagamento === 'carteira');
    if (formasCarteira.length > 0) {
      const valorCarteira = formasCarteira.reduce((total, forma) => total + forma.valor, 0);
      if (valorCarteira > saldoCarteira) {
        errors.push(`Saldo insuficiente na carteira. Disponível: R$ ${saldoCarteira.toFixed(2)}`);
      }
    }

    // Validar parcelas
    for (const forma of formasValidas) {
      if (forma.forma_pagamento === 'credito') {
        if (!forma.parcelas || forma.parcelas < 1 || forma.parcelas > 99) {
          errors.push("Número de parcelas deve estar entre 1 e 99 para cartão de crédito");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    salvarFormasPagamento,
    buscarFormasPagamento,
    criarFormaPadrao,
    validarFormas
  };
};