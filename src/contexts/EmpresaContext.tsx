import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativa: boolean;
  plano: string;
  configuracoes: any;
}

interface EmpresaUsuario {
  id: string;
  empresa_id: string;
  user_id: string;
  role: 'owner' | 'admin';
  ativo: boolean;
  empresa: Empresa;
}

interface EmpresaContextType {
  empresaAtual: Empresa | null;
  empresasUsuario: EmpresaUsuario[];
  loading: boolean;
  error: string | null;
  trocarEmpresa: (empresaId: string) => Promise<void>;
  migrarDadosUsuario: () => Promise<void>;
  recarregarEmpresas: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null);
  const [empresasUsuario, setEmpresasUsuario] = useState<EmpresaUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEmpresas = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Buscar empresas do usuário
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresa_usuarios')
        .select(`
          *,
          empresa:empresas (*)
        `)
        .eq('user_id', user.id)
        .eq('ativo', true);

      if (empresasError) throw empresasError;

      const empresasFormatadas = empresasData?.map(item => ({
        ...item,
        empresa: item.empresa as Empresa
      })) || [];

      setEmpresasUsuario(empresasFormatadas);

      // Buscar empresa atual do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_atual_id, primeiro_acesso')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Se usuário tem empresa atual definida, buscar os dados
      if (profileData?.empresa_atual_id) {
        const empresaAtualData = empresasFormatadas.find(
          emp => emp.empresa.id === profileData.empresa_atual_id
        );
        
        if (empresaAtualData) {
          setEmpresaAtual(empresaAtualData.empresa);
        }
      } else if (empresasFormatadas.length > 0) {
        // Se não tem empresa atual mas tem empresas, definir a primeira como atual
        const primeiraEmpresa = empresasFormatadas[0].empresa;
        await trocarEmpresa(primeiraEmpresa.id);
      } else if (profileData?.primeiro_acesso !== false) {
        // Se é primeiro acesso e não tem empresas, migrar dados
        console.log('🔄 Primeiro acesso detectado. Iniciando migração de dados...');
        await migrarDadosUsuario();
      }

    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const trocarEmpresa = async (empresaId: string) => {
    if (!user) return;

    try {
      // Atualizar empresa atual no perfil
      const { error } = await supabase
        .from('profiles')
        .update({ empresa_atual_id: empresaId })
        .eq('user_id', user.id);

      if (error) throw error;

      // Encontrar e definir a nova empresa atual
      const novaEmpresa = empresasUsuario.find(
        emp => emp.empresa.id === empresaId
      )?.empresa;

      if (novaEmpresa) {
        setEmpresaAtual(novaEmpresa);
      }

    } catch (err) {
      console.error('Erro ao trocar empresa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao trocar empresa');
    }
  };

  const migrarDadosUsuario = async () => {
    if (!user) return;

    try {
      console.log('🔧 Iniciando migração de dados para empresa...');
      
      const { data, error } = await supabase.rpc('migrate_user_data_to_empresa');

      if (error) throw error;

      console.log('✅ Migração concluída:', data);
      
      // Recarregar empresas após migração
      await carregarEmpresas();

    } catch (err) {
      console.error('Erro na migração:', err);
      setError(err instanceof Error ? err.message : 'Erro na migração de dados');
    }
  };

  const recarregarEmpresas = async () => {
    setLoading(true);
    await carregarEmpresas();
  };

  useEffect(() => {
    if (user) {
      carregarEmpresas();
    } else {
      setEmpresaAtual(null);
      setEmpresasUsuario([]);
      setLoading(false);
    }
  }, [user]);

  return (
    <EmpresaContext.Provider value={{
      empresaAtual,
      empresasUsuario,
      loading,
      error,
      trocarEmpresa,
      migrarDadosUsuario,
      recarregarEmpresas
    }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa deve ser usado dentro de um EmpresaProvider');
  }
  return context;
}