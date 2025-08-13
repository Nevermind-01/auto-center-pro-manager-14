-- Atualizar função get_current_empresa_id para ser mais robusta
CREATE OR REPLACE FUNCTION public.get_current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT COALESCE(
        (SELECT empresa_atual_id FROM public.profiles WHERE user_id = auth.uid()),
        (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND ativo = true LIMIT 1)
    );
$function$;