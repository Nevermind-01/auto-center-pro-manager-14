import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export type EmpresaRole = 'owner' | 'admin' | 'user';

interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
}

interface EmpresaContextType {
  empresaId: string | null;
  empresaRole: EmpresaRole | null;
  empresas: Empresa[];
  empresaAtual: Empresa | null;
  loading: boolean;
  switchEmpresa: (empresaId: string) => Promise<void>;
  refreshEmpresas: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export const useEmpresaContext = (): EmpresaContextType => {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresaContext must be used within an EmpresaProvider');
  }
  return context;
};

export const EmpresaProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaRole, setEmpresaRole] = useState<EmpresaRole | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEmpresaData = async () => {
    if (!user) {
      setEmpresaId(null);
      setEmpresaRole(null);
      setEmpresas([]);
      setEmpresaAtual(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar empresa atual do usuário
      const empresaAtualId = await supabase.rpc('get_current_empresa_id');
      logger.debug('Empresa atual ID:', empresaAtualId.data);

      if (empresaAtualId.data) {
        setEmpresaId(empresaAtualId.data);

        // Buscar role do usuário na empresa atual
        const { data: empresaUsuario } = await supabase
          .from('empresa_usuarios')
          .select('role')
          .eq('empresa_id', empresaAtualId.data)
          .eq('user_id', user.id)
          .eq('ativo', true)
          .single();

        if (empresaUsuario) {
          setEmpresaRole(empresaUsuario.role as EmpresaRole);
        }

        // Buscar dados da empresa atual
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id, nome, cnpj, email')
          .eq('id', empresaAtualId.data)
          .single();

        if (empresa) {
          setEmpresaAtual(empresa);
        }
      }

      // Buscar todas as empresas do usuário
      const { data: empresasDoUsuario } = await supabase
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .eq('ativo', true);

      if (empresasDoUsuario && empresasDoUsuario.length > 0) {
        const empresaIds = empresasDoUsuario.map(eu => eu.empresa_id);
        
        const { data: todasEmpresas } = await supabase
          .from('empresas')
          .select('id, nome, cnpj, email')
          .in('id', empresaIds);

        if (todasEmpresas) {
          setEmpresas(todasEmpresas);
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar dados da empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchEmpresa = async (novaEmpresaId: string) => {
    if (!user) return;

    try {
      // Atualizar empresa atual no perfil
      const { error } = await supabase
        .from('profiles')
        .update({ empresa_atual_id: novaEmpresaId })
        .eq('user_id', user.id);

      if (error) throw error;

      // Recarregar dados
      await loadEmpresaData();
    } catch (error) {
      logger.error('Erro ao trocar empresa:', error);
      throw error;
    }
  };

  const refreshEmpresas = async () => {
    await loadEmpresaData();
  };

  useEffect(() => {
    loadEmpresaData();
  }, [user]);

  const value = {
    empresaId,
    empresaRole,
    empresas,
    empresaAtual,
    loading,
    switchEmpresa,
    refreshEmpresas,
  };

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
};