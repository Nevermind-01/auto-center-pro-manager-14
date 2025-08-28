import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaContext } from './useEmpresaContext';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface EmpresaData {
  id: string;
  nome: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae_principal?: string;
  regime_tributario?: string;
  data_fundacao?: string;
  
  // Endereço
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  pais?: string;
  
  // Contato
  telefone_principal?: string;
  telefone_secundario?: string;
  email_fiscal?: string;
  email_comercial?: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  
  // Fiscais
  serie_nfe?: string;
  natureza_operacao?: string;
  ambiente_fiscal?: string;
  csc_token?: string;
  codigo_regime_tributario?: string;
  aliquota_iss?: number;
  municipio_iss?: string;
  responsavel_tecnico?: string;
  
  // Arquivos
  logo_url?: string;
  certificado_url?: string;
  politica_privacidade_url?: string;
  
  // Metadados
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export const useEmpresaData = () => {
  const { empresaId } = useEmpresaContext();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchEmpresaData = useCallback(async (): Promise<EmpresaData | null> => {
    if (!empresaId) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da empresa",
          variant: "destructive"
        });
        return null;
      }

      return data as EmpresaData;
    } catch (error) {
      console.error('Erro inesperado:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const updateEmpresaData = useCallback(async (updates: Partial<EmpresaData>): Promise<boolean> => {
    if (!empresaId || !user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', empresaId);

      if (error) {
        console.error('Erro ao atualizar empresa:', error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar as alterações",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Dados da empresa atualizados com sucesso",
      });
      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [empresaId, user]);

  const validateCNPJ = useCallback(async (cnpj: string): Promise<{ isValid: boolean; isUnique: boolean }> => {
    // Validação básica de formato CNPJ
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      return { isValid: false, isUnique: false };
    }
    
    // Verificar se é único (excluindo a empresa atual)
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id')
        .eq('cnpj', cnpj)
        .neq('id', empresaId);

      if (error) {
        console.error('Erro ao validar CNPJ:', error);
        return { isValid: true, isUnique: false };
      }

      return { isValid: true, isUnique: !data || data.length === 0 };
    } catch (error) {
      console.error('Erro inesperado na validação:', error);
      return { isValid: true, isUnique: false };
    }
  }, [empresaId]);

  const fetchCEP = useCallback(async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) return null;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (data.erro) return null;
      
      return {
        logradouro: data.logradouro,
        bairro: data.bairro,
        municipio: data.localidade,
        uf: data.uf,
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }, []);

  return {
    loading,
    fetchEmpresaData,
    updateEmpresaData,
    validateCNPJ,
    fetchCEP,
  };
};