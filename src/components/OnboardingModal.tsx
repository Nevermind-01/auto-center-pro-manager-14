import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateEmpresa = async () => {
    if (!nomeEmpresa.trim()) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Chamar função RPC para criar empresa
      const { data, error } = await supabase.rpc('create_empresa_with_owner', {
        nome_empresa: nomeEmpresa.trim(),
        cnpj_empresa: cnpjEmpresa.trim() || null,
        email_empresa: emailEmpresa.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Empresa criada com sucesso!",
        description: `${nomeEmpresa} foi configurada como sua empresa principal.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateData = async () => {
    try {
      setLoading(true);

      // Chamar função de migração
      const { data, error } = await supabase.rpc('migrate_user_data_to_empresa');

      if (error) throw error;

      toast({
        title: "Dados migrados com sucesso!",
        description: data || "Seus dados foram organizados na nova empresa.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Erro na migração:', error);
      toast({
        title: "Erro na migração",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Bem-vindo ao Auto Center Pro Manager!</DialogTitle>
          <DialogDescription className="text-center">
            Para continuar, precisamos configurar sua empresa no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Nova Empresa</CardTitle>
              <CardDescription>
                Configure uma nova empresa para gerenciar seus dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                <Input
                  id="nomeEmpresa"
                  placeholder="Ex: Auto Center Silva"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpjEmpresa">CNPJ (opcional)</Label>
                <Input
                  id="cnpjEmpresa"
                  placeholder="00.000.000/0000-00"
                  value={cnpjEmpresa}
                  onChange={(e) => setCnpjEmpresa(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailEmpresa">Email da Empresa (opcional)</Label>
                <Input
                  id="emailEmpresa"
                  type="email"
                  placeholder="contato@empresa.com"
                  value={emailEmpresa}
                  onChange={(e) => setEmailEmpresa(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleCreateEmpresa}
                disabled={loading || !nomeEmpresa.trim()}
                className="w-full"
              >
                {loading ? "Criando..." : "Criar Empresa"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Já tenho dados no sistema</CardTitle>
              <CardDescription>
                Migrar dados existentes para uma empresa padrão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleMigrateData}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? "Migrando..." : "Migrar Dados Existentes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};