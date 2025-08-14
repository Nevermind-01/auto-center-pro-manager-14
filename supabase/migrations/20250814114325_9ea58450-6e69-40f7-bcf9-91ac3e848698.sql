-- Remove the audit trigger from clientes table
DROP TRIGGER IF EXISTS audit_clientes_trigger ON public.clientes;

-- Drop the audit_clientes_changes function that's causing constraint violations
DROP FUNCTION IF EXISTS public.audit_clientes_changes();