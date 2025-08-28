import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Shield } from 'lucide-react';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface ConfirmEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<boolean>;
}

export const ConfirmEditModal = ({ open, onOpenChange, onConfirm }: ConfirmEditModalProps) => {
  const [password, setPassword] = useState('');
  const { execute: handleConfirm, isLoading } = useAsyncAction(
    async () => {
      const success = await onConfirm(password);
      if (success) {
        setPassword('');
        onOpenChange(false);
      }
      return success;
    },
    'confirm-edit'
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Confirme sua identidade
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Por segurança, confirme sua senha para habilitar a edição dos dados da empresa.
            A edição será liberada por 10 minutos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha atual</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                disabled={isLoading}
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
              disabled={!password.trim() || isLoading}
            >
              {isLoading ? 'Verificando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};