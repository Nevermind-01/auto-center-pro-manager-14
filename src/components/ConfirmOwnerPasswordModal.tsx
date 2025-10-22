import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Shield } from 'lucide-react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ConfirmOwnerPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  empresaId: string;
}

export const ConfirmOwnerPasswordModal = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  empresaId 
}: ConfirmOwnerPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  // Buscar email do owner quando modal abrir
  useEffect(() => {
    const fetchOwnerEmail = async () => {
      if (!open || !empresaId) return;

      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select('user_id')
        .eq('empresa_id', empresaId)
        .eq('role', 'owner')
        .eq('ativo', true)
        .single();

      if (error || !data) {
        console.error('Erro ao buscar owner:', error);
        toast({
          title: "Erro",
          description: "Não foi possível identificar o proprietário da empresa",
          variant: "destructive"
        });
        return;
      }

      // Buscar email do owner no profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', data.user_id)
        .single();

      if (profileError || !profileData) {
        console.error('Erro ao buscar perfil do owner:', profileError);
        toast({
          title: "Erro",
          description: "Não foi possível buscar dados do proprietário",
          variant: "destructive"
        });
        return;
      }

      setOwnerEmail(profileData.email || null);
    };

    fetchOwnerEmail();
  }, [open, empresaId]);

  const { execute: handleConfirm, isLoading } = useAsyncAction(
    async () => {
      if (!ownerEmail) {
        toast({
          title: "Erro",
          description: "Email do proprietário não encontrado",
          variant: "destructive"
        });
        return false;
      }

      try {
        // Validar senha do owner
        const { error } = await supabase.auth.signInWithPassword({
          email: ownerEmail,
          password: password,
        });

        if (error) {
          toast({
            title: "Senha incorreta",
            description: "A senha do proprietário está incorreta",
            variant: "destructive"
          });
          return false;
        }

        // Senha correta - executar fechamento
        setPassword('');
        onOpenChange(false);
        onConfirm();
        return true;
      } catch (error) {
        console.error('Erro na validação:', error);
        toast({
          title: "Erro",
          description: "Erro inesperado na validação",
          variant: "destructive"
        });
        return false;
      }
    },
    'confirm-owner-password'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Autorização do Proprietário
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Por segurança, o fechamento do caixa requer autorização do proprietário da empresa.
            Digite a senha do proprietário para continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {ownerEmail && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Proprietário: <span className="font-medium text-foreground">{ownerEmail}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="owner-password">Senha do Proprietário</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="owner-password"
                type="password"
                placeholder="Digite a senha do proprietário"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                disabled={isLoading || !ownerEmail}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!password.trim() || isLoading || !ownerEmail}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Verificando...' : 'Autorizar Fechamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
