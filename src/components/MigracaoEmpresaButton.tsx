import React from 'react';
import { Button } from '@/components/ui/button';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { useToast } from '@/hooks/use-toast';

export function MigracaoEmpresaButton() {
  const { migrarDadosUsuario, loading } = useEmpresa();
  const { toast } = useToast();

  const handleMigrar = async () => {
    try {
      await migrarDadosUsuario();
      toast({
        title: "Migração concluída",
        description: "Seus dados foram migrados para o sistema multi-empresas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na migração",
        description: "Ocorreu um erro durante a migração dos dados.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleMigrar} 
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? 'Migrando...' : 'Migrar para Multi-Empresas'}
    </Button>
  );
}