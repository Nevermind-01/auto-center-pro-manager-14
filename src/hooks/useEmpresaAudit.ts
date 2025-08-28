import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaContext } from './useEmpresaContext';

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  created_at: string;
  user_id: string;
  // Dados do usuário (quando possível obter)
  user_email?: string;
}

export const useEmpresaAudit = () => {
  const { empresaId } = useEmpresaContext();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    if (!empresaId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          resource_type,
          resource_id,
          details,
          created_at,
          user_id
        `)
        .eq('empresa_id', empresaId)
        .eq('resource_type', 'empresa')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        return;
      }

      // Buscar informações dos usuários
      const userIds = [...new Set(data?.map(log => log.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const logsWithUsers = data?.map(log => ({
        ...log,
        user_email: profileMap.get(log.user_id)?.email || 'Usuário desconhecido',
      })) || [];

      setAuditLogs(logsWithUsers);
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const formatAuditEntry = useCallback((entry: AuditLogEntry): string => {
    const date = new Date(entry.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let description = `${entry.user_email} - ${date}`;

    if (entry.details && typeof entry.details === 'object') {
      const changes = Object.entries(entry.details).map(([field, change]) => {
        if (typeof change === 'object' && change !== null && 'old' in change && 'new' in change) {
          const oldValue = (change as any).old || '(vazio)';
          const newValue = (change as any).new || '(vazio)';
          return `${field}: "${oldValue}" → "${newValue}"`;
        }
        return `${field}: ${JSON.stringify(change)}`;
      });

      if (changes.length > 0) {
        description += ` - Alterações: ${changes.join(', ')}`;
      }
    }

    return description;
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return {
    auditLogs,
    loading,
    fetchAuditLogs,
    formatAuditEntry,
  };
};