import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useAuth } from '@/hooks/useAuth';
import { useCaixa } from '@/hooks/useCaixa';
import { auditarOSSemMovimentacao, recuperarMovimentacoesPerdidas } from '@/lib/paymentMethodMapper';

/**
 * Hook para auditoria e recuperação de movimentações perdidas
 */
export const useAuditoriaRecuperacao = () => {
  const [isAuditando, setIsAuditando] = useState(false);
  const [isRecuperando, setIsRecuperando] = useState(false);
  const [resultadoAuditoria, setResultadoAuditoria] = useState<any>(null);
  
  const { toast } = useToast();
  const { empresaId } = useEmpresaContext();
  const { user } = useAuth();
  const { caixaAtual } = useCaixa();

  const executarAuditoria = async (dias: number = 7) => {
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "Empresa não selecionada",
        variant: "destructive",
      });
      return;
    }

    setIsAuditando(true);
    try {
      console.log(`🔍 Iniciando auditoria para empresa ${empresaId} nos últimos ${dias} dias`);
      
      const resultado = await auditarOSSemMovimentacao(supabase, empresaId, dias);
      setResultadoAuditoria(resultado);
      
      toast({
        title: "Auditoria Concluída",
        description: `Encontradas ${resultado.semMovimentacao} OSs sem movimentação de caixa de um total de ${resultado.totalOSs} OSs finalizadas.`,
      });
      
      return resultado;
    } catch (error) {
      console.error('Erro na auditoria:', error);
      toast({
        title: "Erro na Auditoria",
        description: "Não foi possível executar a auditoria. Verifique os logs.",
        variant: "destructive",
      });
    } finally {
      setIsAuditando(false);
    }
  };

  const recuperarMovimentacoes = async () => {
    if (!resultadoAuditoria?.ossSemMovimentacao?.length) {
      toast({
        title: "Nada para Recuperar",
        description: "Execute uma auditoria primeiro ou não há OSs para recuperar.",
        variant: "destructive",
      });
      return;
    }

    if (!caixaAtual) {
      toast({
        title: "Erro",
        description: "É necessário ter um caixa aberto para recuperar movimentações.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !empresaId) {
      toast({
        title: "Erro",
        description: "Usuário ou empresa não identificados.",
        variant: "destructive",
      });
      return;
    }

    setIsRecuperando(true);
    try {
      console.log(`🔧 Iniciando recuperação de ${resultadoAuditoria.ossSemMovimentacao.length} movimentações`);
      
      const resultado = await recuperarMovimentacoesPerdidas(
        supabase,
        empresaId,
        caixaAtual.id,
        resultadoAuditoria.ossSemMovimentacao,
        user.id
      );
      
      toast({
        title: "Recuperação Concluída",
        description: `${resultado.sucessos} movimentações recuperadas com sucesso. ${resultado.falhas} falharam.`,
      });
      
      // Limpar resultado da auditoria para forçar nova auditoria
      setResultadoAuditoria(null);
      
      return resultado;
    } catch (error) {
      console.error('Erro na recuperação:', error);
      toast({
        title: "Erro na Recuperação",
        description: "Não foi possível recuperar as movimentações. Verifique os logs.",
        variant: "destructive",
      });
    } finally {
      setIsRecuperando(false);
    }
  };

  return {
    // Estados
    isAuditando,
    isRecuperando,
    resultadoAuditoria,
    
    // Ações
    executarAuditoria,
    recuperarMovimentacoes,
    limparResultado: () => setResultadoAuditoria(null),
  };
};