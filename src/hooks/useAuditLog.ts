import { supabase } from '@/integrations/supabase/client';
import { useEmpresaContext } from './useEmpresaContext';
import { useAuth } from './useAuth';

interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
}

export const useAuditLog = () => {
  const { empresaId } = useEmpresaContext();
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    if (!user || !empresaId) return;
    
    try {
      // Get client IP and user agent
      const userAgent = navigator.userAgent;
      
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          empresa_id: empresaId,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          user_agent: userAgent,
        });
    } catch (error) {
      // Silently fail - don't break user experience for audit logging
      console.warn('Failed to log audit entry:', error);
    }
  };

  return { logAction };
};