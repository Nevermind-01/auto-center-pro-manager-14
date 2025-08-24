-- Drop the invalid trigger if it exists
DROP TRIGGER IF EXISTS audit_sensitive_data_access ON public.clientes;

-- Drop the existing function to allow changing return type
DROP FUNCTION IF EXISTS public.get_masked_clientes();

-- Recreate the function with correct return type and audit logging
CREATE OR REPLACE FUNCTION public.get_masked_clientes()
RETURNS TABLE(
  id uuid, 
  nome text, 
  email text, 
  telefone text, 
  cpf text, 
  cnpj text, 
  rg text, 
  rua text, 
  numero_residencia text, 
  bairro text, 
  cidade text, 
  estado text, 
  endereco text, 
  user_id uuid, 
  empresa_id uuid,
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_empresa_id uuid;
    is_admin_user boolean;
    current_user_id uuid;
    client_count integer := 0;
BEGIN
    -- Get current user and empresa
    current_user_id := auth.uid();
    current_empresa_id := public.get_current_empresa_id();
    
    -- Check if user is admin for the current empresa
    is_admin_user := public.is_current_empresa_admin();
    
    -- Return masked data filtered by empresa
    RETURN QUERY
    SELECT 
        c.id,
        c.nome,
        CASE 
            WHEN is_admin_user THEN c.email
            ELSE public.mask_sensitive_data(c.email, 4)
        END as email,
        CASE 
            WHEN is_admin_user THEN c.telefone
            ELSE public.mask_sensitive_data(c.telefone, 4)
        END as telefone,
        CASE 
            WHEN is_admin_user THEN c.cpf
            ELSE public.mask_sensitive_data(c.cpf, 4)
        END as cpf,
        CASE 
            WHEN is_admin_user THEN c.cnpj
            ELSE public.mask_sensitive_data(c.cnpj, 4)
        END as cnpj,
        CASE 
            WHEN is_admin_user THEN c.rg
            ELSE public.mask_sensitive_data(c.rg, 4)
        END as rg,
        c.rua,
        c.numero_residencia,
        c.bairro,
        c.cidade,
        c.estado,
        c.endereco,
        c.user_id,
        c.empresa_id,
        c.created_at,
        c.updated_at
    FROM public.clientes c
    WHERE c.empresa_id = current_empresa_id;
    
    -- Count returned clients for audit
    GET DIAGNOSTICS client_count = ROW_COUNT;
    
    -- Log the data access for audit purposes
    IF current_user_id IS NOT NULL AND current_empresa_id IS NOT NULL AND client_count > 0 THEN
        INSERT INTO public.audit_logs (
            user_id,
            empresa_id,
            action,
            resource_type,
            details
        ) VALUES (
            current_user_id,
            current_empresa_id,
            'PII_ACCESS',
            'clientes',
            jsonb_build_object(
                'masked_data', NOT is_admin_user,
                'client_count', client_count,
                'fields_accessed', ARRAY['email', 'telefone', 'cpf', 'cnpj', 'rg']
            )
        );
    END IF;
END;
$function$;