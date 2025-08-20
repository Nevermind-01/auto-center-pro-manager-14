import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export type EmpresaRole = 'owner' | 'admin' | 'user';

interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  empresaId: string | null;
  empresaRole: EmpresaRole | null;
  empresas: Empresa[];
  empresaAtual: Empresa | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, nomeEmpresa?: string, cnpjEmpresa?: string, emailEmpresa?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  switchEmpresa: (empresaId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaRole, setEmpresaRole] = useState<EmpresaRole | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null);
  const { toast } = useToast();

  const loadEmpresaData = async (userId: string) => {
    try {
      // Buscar empresa atual do usuário
      const { data: empresaAtualId } = await supabase.rpc('get_current_empresa_id');
      
      if (empresaAtualId) {
        setEmpresaId(empresaAtualId);

        // Buscar role do usuário na empresa atual
        const { data: empresaUsuario } = await supabase
          .from('empresa_usuarios')
          .select('role')
          .eq('empresa_id', empresaAtualId)
          .eq('user_id', userId)
          .eq('ativo', true)
          .single();

        if (empresaUsuario) {
          setEmpresaRole(empresaUsuario.role as EmpresaRole);
        }

        // Buscar dados da empresa atual
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id, nome, cnpj, email')
          .eq('id', empresaAtualId)
          .single();

        if (empresa) {
          setEmpresaAtual(empresa);
        }
      }

      // Buscar todas as empresas do usuário
      const { data: empresasDoUsuario } = await supabase
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', userId)
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
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state changed:', event, session?.user?.id || 'no user');
        
        if (mounted) {
          // Only synchronous state updates here
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Defer user validation and empresa data loading
          if (event === 'SIGNED_IN' && session?.user) {
            setTimeout(async () => {
              try {
                const { data: isValid, error } = await supabase.rpc('validate_user_exists');
                
                if (error || !isValid) {
                  logger.warn('User validation failed, signing out');
                  await supabase.auth.signOut();
                  localStorage.clear();
                  toast({
                    title: "Sessão inválida",
                    description: "Sua conta foi removida. Faça login novamente.",
                    variant: "destructive",
                  });
                } else {
                  // Carregar dados da empresa após validação
                  await loadEmpresaData(session.user.id);
                }
              } catch (err) {
                logger.error('Error validating user:', err);
                await supabase.auth.signOut();
                localStorage.clear();
              }
            }, 0);
          } else if (event === 'SIGNED_OUT') {
            // Limpar dados da empresa
            setEmpresaId(null);
            setEmpresaRole(null);
            setEmpresas([]);
            setEmpresaAtual(null);
          }
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        logger.info('Initial session:', session?.user?.id || 'no user');
        
        if (mounted) {
          // If there's a cached session, validate the user still exists
          if (session?.user) {
            try {
              const { data: isValid, error: validationError } = await supabase.rpc('validate_user_exists');
              
              if (validationError || !isValid) {
                logger.warn('Cached user validation failed, clearing session');
                await supabase.auth.signOut();
                localStorage.clear();
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
              } else {
                // Carregar dados da empresa para sessão existente
                await loadEmpresaData(session.user.id);
              }
            } catch (err) {
              logger.error('Error validating cached user:', err);
              await supabase.auth.signOut();
              localStorage.clear();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string, nomeEmpresa?: string, cnpjEmpresa?: string, emailEmpresa?: string) => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email,
          }
        }
      });

      if (error) throw error;

      // Se o usuário foi criado e tem empresa para criar
      if (data.user && nomeEmpresa) {
        try {
          const { error: empresaError } = await supabase.rpc('create_empresa_with_owner', {
            nome_empresa: nomeEmpresa,
            cnpj_empresa: cnpjEmpresa || null,
            email_empresa: emailEmpresa || null,
          });

          if (empresaError) {
            logger.error('Erro ao criar empresa:', empresaError);
          }
        } catch (empresaErr) {
          logger.error('Erro ao criar empresa:', empresaErr);
        }
      }

      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    
    // Clear all authentication data
    localStorage.clear();
    setUser(null);
    setSession(null);
    setEmpresaId(null);
    setEmpresaRole(null);
    setEmpresas([]);
    setEmpresaAtual(null);
    setLoading(false);
    
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema",
    });
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

      // Recarregar dados da empresa
      await loadEmpresaData(user.id);
    } catch (error) {
      logger.error('Erro ao trocar empresa:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    empresaId,
    empresaRole,
    empresas,
    empresaAtual,
    signIn,
    signUp,
    signOut,
    switchEmpresa,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};