import { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function FixEmpresaButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fixEmpresaId = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar primeira empresa do usuário
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .limit(1)
        .single();

      if (empresaError) throw empresaError;

      if (empresaData) {
        // Atualizar perfil com empresa_atual_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ empresa_atual_id: empresaData.empresa_id })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        toast.success('Empresa atual atualizada com sucesso!');
        
        // Recarregar a página para aplicar mudanças
        window.location.reload();
      } else {
        toast.error('Nenhuma empresa encontrada para este usuário');
      }
    } catch (error) {
      console.error('Erro ao corrigir empresa_atual_id:', error);
      toast.error('Erro ao atualizar empresa atual');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={fixEmpresaId} 
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? 'Corrigindo...' : 'Corrigir Empresa Atual'}
    </Button>
  );
}