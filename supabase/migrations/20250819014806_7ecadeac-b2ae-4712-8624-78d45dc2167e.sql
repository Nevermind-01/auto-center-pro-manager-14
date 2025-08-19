-- Update create_empresa_with_owner function to set primeiro_acesso to false
CREATE OR REPLACE FUNCTION public.create_empresa_with_owner(nome_empresa text, cnpj_empresa text DEFAULT NULL::text, email_empresa text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    nova_empresa_id UUID;
    current_user_id UUID;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Criar a empresa
    INSERT INTO public.empresas (nome, cnpj, email)
    VALUES (nome_empresa, cnpj_empresa, email_empresa)
    RETURNING id INTO nova_empresa_id;

    -- Adicionar usuário como owner da empresa
    INSERT INTO public.empresa_usuarios (empresa_id, user_id, role)
    VALUES (nova_empresa_id, current_user_id, 'owner');

    -- Definir como empresa atual do usuário e marcar primeiro_acesso como false
    UPDATE public.profiles 
    SET empresa_atual_id = nova_empresa_id,
        primeiro_acesso = false
    WHERE user_id = current_user_id;

    RETURN nova_empresa_id;
END;
$function$