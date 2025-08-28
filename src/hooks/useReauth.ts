import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface ReauthSession {
  isActive: boolean;
  expiresAt: Date | null;
  timeRemaining: number;
}

export const useReauth = () => {
  const { user } = useAuth();
  const [reauthSession, setReauthSession] = useState<ReauthSession>({
    isActive: false,
    expiresAt: null,
    timeRemaining: 0,
  });

  const authenticateUser = useCallback(async (password: string): Promise<boolean> => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Email do usuário não encontrado",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Tentar fazer login com as credenciais para validar a senha
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        toast({
          title: "Senha incorreta",
          description: "Verifique sua senha e tente novamente",
          variant: "destructive"
        });
        return false;
      }

      // Criar sessão de reautenticação (10 minutos)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      setReauthSession({
        isActive: true,
        expiresAt,
        timeRemaining: 10 * 60,
      });

      // Timer para atualizar tempo restante e expirar sessão
      const timer = setInterval(() => {
        const now = new Date();
        if (expiresAt <= now) {
          setReauthSession({
            isActive: false,
            expiresAt: null,
            timeRemaining: 0,
          });
          clearInterval(timer);
          toast({
            title: "Sessão de edição expirada",
            description: "Por segurança, a edição foi desabilitada",
          });
          return;
        }

        const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        setReauthSession(prev => ({
          ...prev,
          timeRemaining: remaining,
        }));
      }, 1000);

      toast({
        title: "Edição desbloqueada",
        description: "Você pode editar por 10 minutos",
      });

      return true;
    } catch (error) {
      console.error('Erro na reautenticação:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado na autenticação",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.email]);

  const cancelReauth = useCallback(() => {
    setReauthSession({
      isActive: false,
      expiresAt: null,
      timeRemaining: 0,
    });
    toast({
      title: "Edição cancelada",
      description: "Modo de edição desabilitado",
    });
  }, []);

  const formatTimeRemaining = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    reauthSession,
    authenticateUser,
    cancelReauth,
    formatTimeRemaining,
  };
};