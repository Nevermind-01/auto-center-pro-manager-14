-- Atualizar função get_next_sequential_number para numeração ilimitada
CREATE OR REPLACE FUNCTION public.get_next_sequential_number(p_empresa_id uuid, p_tipo text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_contador INTEGER;
    v_numero_formatado TEXT;
    v_user_id UUID;
BEGIN
    -- Verificar autenticação
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar acesso à empresa
    IF NOT has_empresa_access(p_empresa_id) THEN
        RAISE EXCEPTION 'Usuário não tem acesso a esta empresa';
    END IF;
    
    -- Validar tipo
    IF p_tipo NOT IN ('os', 'orcamento') THEN
        RAISE EXCEPTION 'Tipo deve ser "os" ou "orcamento"';
    END IF;
    
    -- Lock atômico e incremento do contador
    IF p_tipo = 'os' THEN
        UPDATE public.empresa_contadores 
        SET contador_os = contador_os + 1,
            updated_at = now()
        WHERE empresa_id = p_empresa_id
        RETURNING contador_os INTO v_contador;
        
        -- Se não existe registro, criar
        IF v_contador IS NULL THEN
            INSERT INTO public.empresa_contadores (empresa_id, contador_os, contador_orcamento)
            VALUES (p_empresa_id, 1, 0)
            RETURNING contador_os INTO v_contador;
        END IF;
        
        -- Formatar número OS (sem LPAD - numeração ilimitada)
        v_numero_formatado := 'OS' || v_contador::TEXT;
        
    ELSE -- orcamento
        UPDATE public.empresa_contadores 
        SET contador_orcamento = contador_orcamento + 1,
            updated_at = now()
        WHERE empresa_id = p_empresa_id
        RETURNING contador_orcamento INTO v_contador;
        
        -- Se não existe registro, criar
        IF v_contador IS NULL THEN
            INSERT INTO public.empresa_contadores (empresa_id, contador_os, contador_orcamento)
            VALUES (p_empresa_id, 0, 1)
            RETURNING contador_orcamento INTO v_contador;
        END IF;
        
        -- Formatar número Orçamento (sem LPAD - numeração ilimitada)
        v_numero_formatado := 'ORC' || v_contador::TEXT;
    END IF;
    
    RETURN v_numero_formatado;
END;
$function$;

-- Atualizar função get_next_sequential_number_safe para numeração ilimitada
CREATE OR REPLACE FUNCTION public.get_next_sequential_number_safe(p_empresa_id uuid, p_tipo text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_contador INTEGER;
    v_numero_formatado TEXT;
    v_user_id UUID;
    v_tentativas INTEGER := 0;
    v_max_tentativas CONSTANT INTEGER := 10;
    v_existe BOOLEAN;
BEGIN
    -- Verificar autenticação
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar acesso à empresa
    IF NOT has_empresa_access(p_empresa_id) THEN
        RAISE EXCEPTION 'Usuário não tem acesso a esta empresa';
    END IF;
    
    -- Validar tipo
    IF p_tipo NOT IN ('os', 'orcamento') THEN
        RAISE EXCEPTION 'Tipo deve ser "os" ou "orcamento"';
    END IF;
    
    -- Loop para tentar obter próximo número disponível
    LOOP
        v_tentativas := v_tentativas + 1;
        
        -- Limite de tentativas para evitar loop infinito
        IF v_tentativas > v_max_tentativas THEN
            RAISE EXCEPTION 'Muitas tentativas para gerar número sequencial. Tente novamente.';
        END IF;
        
        -- Lock atômico e incremento do contador
        IF p_tipo = 'os' THEN
            UPDATE public.empresa_contadores 
            SET contador_os = contador_os + 1,
                updated_at = now()
            WHERE empresa_id = p_empresa_id
            RETURNING contador_os INTO v_contador;
            
            -- Se não existe registro, criar
            IF v_contador IS NULL THEN
                INSERT INTO public.empresa_contadores (empresa_id, contador_os, contador_orcamento)
                VALUES (p_empresa_id, 1, 0)
                ON CONFLICT (empresa_id) DO UPDATE SET 
                    contador_os = empresa_contadores.contador_os + 1,
                    updated_at = now()
                RETURNING contador_os INTO v_contador;
            END IF;
            
            -- Formatar número OS (sem LPAD - numeração ilimitada)
            v_numero_formatado := 'OS' || v_contador::TEXT;
            
            -- Verificar se já existe na tabela vendas
            SELECT EXISTS(
                SELECT 1 FROM public.vendas 
                WHERE numero_os = v_numero_formatado AND empresa_id = p_empresa_id
            ) INTO v_existe;
            
        ELSE -- orcamento
            UPDATE public.empresa_contadores 
            SET contador_orcamento = contador_orcamento + 1,
                updated_at = now()
            WHERE empresa_id = p_empresa_id
            RETURNING contador_orcamento INTO v_contador;
            
            -- Se não existe registro, criar
            IF v_contador IS NULL THEN
                INSERT INTO public.empresa_contadores (empresa_id, contador_os, contador_orcamento)
                VALUES (p_empresa_id, 0, 1)
                ON CONFLICT (empresa_id) DO UPDATE SET 
                    contador_orcamento = empresa_contadores.contador_orcamento + 1,
                    updated_at = now()
                RETURNING contador_orcamento INTO v_contador;
            END IF;
            
            -- Formatar número Orçamento (sem LPAD - numeração ilimitada)
            v_numero_formatado := 'ORC' || v_contador::TEXT;
            
            -- Verificar se já existe na tabela orcamentos
            SELECT EXISTS(
                SELECT 1 FROM public.orcamentos 
                WHERE numero_orcamento = v_numero_formatado AND empresa_id = p_empresa_id
            ) INTO v_existe;
        END IF;
        
        -- Se número não existe, podemos usar
        IF NOT v_existe THEN
            -- Log de geração bem-sucedida
            INSERT INTO public.audit_logs (
                user_id,
                empresa_id,
                action,
                resource_type,
                details
            ) VALUES (
                v_user_id,
                p_empresa_id,
                'NUMERO_GERADO',
                p_tipo,
                jsonb_build_object(
                    'numero', v_numero_formatado,
                    'tentativas', v_tentativas,
                    'contador', v_contador
                )
            );
            
            RETURN v_numero_formatado;
        END IF;
        
        -- Se chegou aqui, número já existe, tentar próximo
        -- Log de conflito detectado
        INSERT INTO public.audit_logs (
            user_id,
            empresa_id,
            action,
            resource_type,
            details
        ) VALUES (
            v_user_id,
            p_empresa_id,
            'NUMERO_CONFLITO',
            p_tipo,
            jsonb_build_object(
                'numero_conflito', v_numero_formatado,
                'tentativa', v_tentativas
            )
        );
    END LOOP;
END;
$function$;