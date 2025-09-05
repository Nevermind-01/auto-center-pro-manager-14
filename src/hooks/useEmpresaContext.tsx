import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  const { user, loading: authLoading } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaRole, setEmpresaRole] = useState<EmpresaRole | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEmpresaData = useCallback(async () => {
    if (!user) {
      console.log('=== DEBUG: No user found, skipping empresa data load ===');
      setEmpresaId(null);
      setEmpresaRole(null);
      setEmpresas([]);
      setEmpresaAtual(null);
      setLoading(false);
      return;
    }

    try {
      console.log('=== DEBUG: Loading empresa data for user ===', user.id);
      setLoading(true);

      // Buscar empresa atual do usuário
      const empresaAtualId = await supabase.rpc('get_current_empresa_id');
      console.log('=== DEBUG: get_current_empresa_id result ===');
      console.log('EmpresaId:', empresaAtualId.data);
      console.log('Error:', empresaAtualId.error);
      
      logger.debug('Empresa atual ID:', empresaAtualId.data);

      // Se não tem empresa, verificar se precisa criar uma a partir do metadata
      if (!empresaAtualId.data) {
        console.log('=== DEBUG: Usuário sem empresa, verificando se precisa criar ===');
        logger.debug('Usuário sem empresa, verificando se precisa criar...');
        
        try {
          const { data: result } = await supabase.rpc('create_empresa_from_metadata');
          console.log('=== DEBUG: create_empresa_from_metadata result ===', result);
          
          if (result && typeof result === 'object' && (result as any).success) {
            logger.info('Empresa criada automaticamente a partir do metadata:', result);
            console.log('=== DEBUG: Empresa criada, recarregando dados ===');
            // Recarregar dados após criação
            setTimeout(() => loadEmpresaData(), 500);
            return;
          } else if (result && typeof result === 'object' && (result as any).error && (result as any).error !== 'Usuário não precisa de empresa') {
            logger.error('Erro ao criar empresa do metadata:', (result as any).error);
            console.error('=== DEBUG: Erro ao criar empresa ===', (result as any).error);
          }
        } catch (error) {
          logger.error('Erro ao tentar criar empresa do metadata:', error);
          console.error('=== DEBUG: Exception ao criar empresa ===', error);
        }
      }

      if (empresaAtualId.data) {
        console.log('=== DEBUG: Setting empresaId ===', empresaAtualId.data);
        setEmpresaId(empresaAtualId.data);

        // Buscar role do usuário na empresa atual
        const { data: empresaUsuario } = await supabase
          .from('empresa_usuarios')
          .select('role')
          .eq('empresa_id', empresaAtualId.data)
          .eq('user_id', user.id)
          .eq('ativo', true)
          .single();

        console.log('=== DEBUG: User role ===', empresaUsuario?.role);
        if (empresaUsuario) {
          setEmpresaRole(empresaUsuario.role as EmpresaRole);
        }

        // Buscar dados da empresa atual
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id, nome, cnpj, email')
          .eq('id', empresaAtualId.data)
          .single();

        console.log('=== DEBUG: Empresa atual ===', empresa);
        if (empresa) {
          setEmpresaAtual(empresa);
        }
      } else {
        console.log('=== DEBUG: No empresaId found, user may not have a company ===');
      }

      // Buscar todas as empresas do usuário
      const { data: empresasDoUsuario } = await supabase
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .eq('ativo', true);

      console.log('=== DEBUG: Empresas do usuário ===', empresasDoUsuario);

      if (empresasDoUsuario && empresasDoUsuario.length > 0) {
        const empresaIds = empresasDoUsuario.map(eu => eu.empresa_id);
        
        const { data: todasEmpresas } = await supabase
          .from('empresas')
          .select('id, nome, cnpj, email')
          .in('id', empresaIds);

        console.log('=== DEBUG: Dados das empresas ===', todasEmpresas);
        if (todasEmpresas) {
          setEmpresas(todasEmpresas);
        }
      } else {
        console.log('=== DEBUG: Usuário não está vinculado a nenhuma empresa ===');
        setEmpresas([]);
      }
    } catch (error) {
      console.error('=== DEBUG: Erro ao carregar dados da empresa ===', error);
      logger.error('Erro ao carregar dados da empresa:', error);
    } finally {
      setLoading(false);
      console.log('=== DEBUG: loadEmpresaData completed ===');
    }
  }, [user]);

  const switchEmpresa = useCallback(async (novaEmpresaId: string) => {
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
  }, [user, loadEmpresaData]);

  const refreshEmpresas = useCallback(async () => {
    await loadEmpresaData();
  }, [loadEmpresaData]);

  useEffect(() => {
    if (!authLoading) {
      loadEmpresaData();
    }
  }, [user, authLoading, loadEmpresaData]);

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
      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando empresa...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </EmpresaContext.Provider>
  );
};