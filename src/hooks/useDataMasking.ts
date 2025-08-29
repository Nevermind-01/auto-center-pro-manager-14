import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useDataMasking = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_current_empresa_admin');
        
        if (error) {
          console.error('Erro ao verificar permissões:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data || false);
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const maskData = (data: string | null | undefined, showLast: number = 4): string => {
    if (!data || data.length <= showLast) return data || '';
    
    if (isAdmin) return data;
    
    return '*'.repeat(data.length - showLast) + data.slice(-showLast);
  };

  const maskCPF = (cpf: string | null | undefined): string => {
    if (!cpf) return '';
    return isAdmin ? cpf : maskData(cpf, 4);
  };

  const maskCNPJ = (cnpj: string | null | undefined): string => {
    if (!cnpj) return '';
    return isAdmin ? cnpj : maskData(cnpj, 4);
  };

  const maskPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    return isAdmin ? phone : maskData(phone, 4);
  };

  const maskEmail = (email: string | null | undefined): string => {
    if (!email) return '';
    return isAdmin ? email : maskData(email, 4);
  };

  return {
    isAdmin,
    loading,
    maskData,
    maskCPF,
    maskCNPJ,
    maskPhone,
    maskEmail,
  };
};