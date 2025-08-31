-- Melhorar função de geração sequencial com melhor controle de concorrência
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
            
            -- Formatar número OS
            v_numero_formatado := 'OS' || LPAD(v_contador::TEXT, 2, '0');
            
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
            
            -- Formatar número Orçamento
            v_numero_formatado := 'ORC' || LPAD(v_contador::TEXT, 2, '0');
            
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

-- Função para criar venda com controle completo de concorrência
CREATE OR REPLACE FUNCTION public.create_venda_safe(
    p_numero_os text,
    p_cliente_id uuid,
    p_cliente_nome text,
    p_veiculo_id uuid,
    p_mecanico_id uuid,
    p_valor_total numeric,
    p_valor_desconto numeric,
    p_valor_final numeric,
    p_forma_pagamento forma_pagamento,
    p_parcelas integer,
    p_observacoes text,
    p_status venda_status DEFAULT 'pendente'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_empresa_id uuid;
    v_venda_id uuid;
BEGIN
    -- Verificações iniciais
    v_user_id := auth.uid();
    v_empresa_id := get_current_empresa_id();
    
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado ou empresa não selecionada';
    END IF;
    
    -- Verificar se número já existe (proteção adicional)
    IF EXISTS(SELECT 1 FROM vendas WHERE numero_os = p_numero_os AND empresa_id = v_empresa_id) THEN
        RAISE EXCEPTION 'Número de OS já existe: %', p_numero_os;
    END IF;
    
    -- Criar venda em transação
    INSERT INTO vendas (
        numero_os,
        cliente_id,
        cliente_nome,
        veiculo_id,
        mecanico_id,
        valor_total,
        valor_desconto,
        valor_final,
        forma_pagamento,
        parcelas,
        observacoes,
        status,
        user_id,
        empresa_id
    ) VALUES (
        p_numero_os,
        p_cliente_id,
        p_cliente_nome,
        p_veiculo_id,
        p_mecanico_id,
        p_valor_total,
        p_valor_desconto,
        p_valor_final,
        p_forma_pagamento,
        p_parcelas,
        p_observacoes,
        p_status,
        v_user_id,
        v_empresa_id
    ) RETURNING id INTO v_venda_id;
    
    -- Log de criação
    INSERT INTO audit_logs (
        user_id,
        empresa_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        v_user_id,
        v_empresa_id,
        'CREATE',
        'venda',
        v_venda_id,
        jsonb_build_object(
            'numero_os', p_numero_os,
            'status', p_status,
            'valor_final', p_valor_final
        )
    );
    
    RETURN v_venda_id;
END;
$function$;

-- Função para criar orçamento com controle de concorrência
CREATE OR REPLACE FUNCTION public.create_orcamento_safe(
    p_numero_orcamento text,
    p_cliente_id uuid,
    p_cliente_nome text,
    p_veiculo_id uuid,
    p_mecanico_id uuid,
    p_validade date,
    p_valor_total numeric,
    p_valor_desconto numeric,
    p_valor_final numeric,
    p_observacoes text,
    p_observacoes_internas text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_empresa_id uuid;
    v_orcamento_id uuid;
BEGIN
    -- Verificações iniciais
    v_user_id := auth.uid();
    v_empresa_id := get_current_empresa_id();
    
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado ou empresa não selecionada';
    END IF;
    
    -- Verificar se número já existe
    IF EXISTS(SELECT 1 FROM orcamentos WHERE numero_orcamento = p_numero_orcamento AND empresa_id = v_empresa_id) THEN
        RAISE EXCEPTION 'Número de orçamento já existe: %', p_numero_orcamento;
    END IF;
    
    -- Criar orçamento
    INSERT INTO orcamentos (
        numero_orcamento,
        cliente_id,
        cliente_nome,
        veiculo_id,
        mecanico_id,
        validade,
        valor_total,
        valor_desconto,
        valor_final,
        observacoes,
        observacoes_internas,
        status,
        user_id,
        empresa_id
    ) VALUES (
        p_numero_orcamento,
        p_cliente_id,
        p_cliente_nome,
        p_veiculo_id,
        p_mecanico_id,
        p_validade,
        p_valor_total,
        p_valor_desconto,
        p_valor_final,
        p_observacoes,
        p_observacoes_internas,
        'pendente',
        v_user_id,
        v_empresa_id
    ) RETURNING id INTO v_orcamento_id;
    
    -- Log de criação
    INSERT INTO audit_logs (
        user_id,
        empresa_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        v_user_id,
        v_empresa_id,
        'CREATE',
        'orcamento',
        v_orcamento_id,
        jsonb_build_object(
            'numero_orcamento', p_numero_orcamento,
            'valor_final', p_valor_final
        )
    );
    
    RETURN v_orcamento_id;
END;
$function$;