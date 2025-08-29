-- Função para criar empresa a partir dos dados do metadata do usuário
CREATE OR REPLACE FUNCTION public.create_empresa_from_metadata()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_meta jsonb;
    nova_empresa_id uuid;
    current_user_id uuid;
    empresa_nome text;
    empresa_cnpj text;
    empresa_email text;
    needs_creation boolean;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;

    -- Buscar metadata do usuário
    SELECT raw_user_meta_data INTO user_meta 
    FROM auth.users WHERE id = current_user_id;
    
    IF user_meta IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Metadata não encontrado');
    END IF;
    
    -- Verificar se precisa criar empresa
    needs_creation := COALESCE((user_meta->>'needs_empresa_creation')::boolean, false);
    
    IF NOT needs_creation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não precisa de empresa');
    END IF;
    
    -- Extrair dados da empresa do metadata
    empresa_nome := user_meta->>'empresa_nome';
    empresa_cnpj := user_meta->>'empresa_cnpj';
    empresa_email := user_meta->>'empresa_email';
    
    IF empresa_nome IS NULL OR empresa_nome = '' THEN
        -- Usar email como fallback
        SELECT email INTO empresa_nome FROM public.profiles WHERE user_id = current_user_id;
        IF empresa_nome IS NULL THEN
            empresa_nome := 'Minha Empresa';
        END IF;
    END IF;

    -- Criar a empresa
    INSERT INTO public.empresas (nome, cnpj, email)
    VALUES (empresa_nome, NULLIF(empresa_cnpj, ''), NULLIF(empresa_email, ''))
    RETURNING id INTO nova_empresa_id;

    -- Adicionar usuário como owner da empresa
    INSERT INTO public.empresa_usuarios (empresa_id, user_id, role)
    VALUES (nova_empresa_id, current_user_id, 'owner');

    -- Definir como empresa atual do usuário
    UPDATE public.profiles 
    SET empresa_atual_id = nova_empresa_id,
        primeiro_acesso = false
    WHERE user_id = current_user_id;

    -- Limpar flag do metadata (atualizar auth.users)
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data - 'needs_empresa_creation' - 'empresa_nome' - 'empresa_cnpj' - 'empresa_email'
    WHERE id = current_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'empresa_id', nova_empresa_id,
        'empresa_nome', empresa_nome
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;