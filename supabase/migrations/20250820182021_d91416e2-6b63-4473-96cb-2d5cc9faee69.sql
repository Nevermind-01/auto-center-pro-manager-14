-- Create a database function to check if user has admin role in current empresa
CREATE OR REPLACE FUNCTION public.is_current_empresa_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_usuarios
    WHERE empresa_id = public.get_current_empresa_id()
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin') 
    AND ativo = true
  );
$$;

-- Create audit log table for PII access tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.is_current_empresa_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);