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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, nomeEmpresa?: string, cnpjEmpresa?: string, emailEmpresa?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
  const { toast } = useToast();


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
                }
              } catch (err) {
                logger.error('Error validating user:', err);
                await supabase.auth.signOut();
                localStorage.clear();
              }
            }, 0);
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
    setLoading(false);
    
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema",
    });
  };


  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};