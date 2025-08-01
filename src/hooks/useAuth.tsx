import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
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
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (mounted) {
          // If user signs in, verify the user still exists
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { data: isValid, error } = await supabase.rpc('validate_user_exists');
              
              if (error || !isValid) {
                console.warn('User validation failed, signing out');
                await supabase.auth.signOut();
                localStorage.clear(); // Clear all localStorage data
                setSession(null);
                setUser(null);
                setLoading(false);
                toast({
                  title: "Sessão inválida",
                  description: "Sua conta foi removida. Faça login novamente.",
                  variant: "destructive",
                });
                return;
              }
            } catch (err) {
              console.error('Error validating user:', err);
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
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session:', session, error);
        
        if (mounted) {
          // If there's a cached session, validate the user still exists
          if (session?.user) {
            try {
              const { data: isValid, error: validationError } = await supabase.rpc('validate_user_exists');
              
              if (validationError || !isValid) {
                console.warn('Cached user validation failed, clearing session');
                await supabase.auth.signOut();
                localStorage.clear(); // Clear all localStorage data
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error('Error validating cached user:', err);
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
        console.error('Error getting session:', error);
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || email,
        }
      }
    });
    setLoading(false);
    return { error };
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