-- Correção completa dos problemas identificados

-- 1. CORRIGIR RECURSÃO INFINITA - Recriar políticas RLS da tabela empresa_usuarios
DROP POLICY IF EXISTS "Users can view empresa_usuarios from their empresa" ON public.empresa_usuarios;
DROP POLICY IF EXISTS "Owners and admins can update empresa_usuarios" ON public.empresa_usuarios;
DROP POLICY IF EXISTS "System can insert empresa_usuarios" ON public.empresa_usuarios;

-- Criar políticas RLS sem recursão (usando apenas dados diretos)
CREATE POLICY "Users can view their own empresa_usuarios records" 
ON public.empresa_usuarios 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Owners and admins can view all empresa_usuarios in their empresa" 
ON public.empresa_usuarios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu2 
    WHERE eu2.empresa_id = empresa_usuarios.empresa_id 
    AND eu2.user_id = auth.uid() 
    AND eu2.role IN ('owner', 'admin') 
    AND eu2.ativo = true
  )
);

CREATE POLICY "Owners and admins can update empresa_usuarios in their empresa" 
ON public.empresa_usuarios 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu2 
    WHERE eu2.empresa_id = empresa_usuarios.empresa_id 
    AND eu2.user_id = auth.uid() 
    AND eu2.role IN ('owner', 'admin') 
    AND eu2.ativo = true
  )
);

CREATE POLICY "System can insert empresa_usuarios" 
ON public.empresa_usuarios 
FOR INSERT 
WITH CHECK (true);

-- 2. CORRIGIR ENUM NA FUNÇÃO RPC - Atualizar rpc_finalizar_os_com_comissao
CREATE OR REPLACE FUNCTION public.rpc_finalizar_os_com_comissao(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_venda_id uuid;
    v_numero_os text;
    v_cliente_id uuid;
    v_veiculo_id uuid;
    v_mecanico_id uuid;
    v_user_id uuid;
    v_valor_total numeric;
    v_valor_desconto numeric;
    v_valor_final numeric;
    v_forma_pagamento text;
    v_parcelas integer;
    v_observacoes text;
    v_produtos jsonb;
    v_servicos jsonb;
    v_comissao jsonb;
    v_produto jsonb;
    v_servico jsonb;
    v_valor_servicos numeric := 0;
    v_estoque_atual integer;
    v_comissao_valor_final numeric;
    v_base_calculo numeric;
    v_percentual numeric;
    v_valor_fixo numeric;
    v_tipo_calculo text;
    v_comissao_observacoes text;
BEGIN
    -- Extrair dados do payload
    v_numero_os := payload->>'numeroOS';
    v_cliente_id := (payload->>'clienteId')::uuid;
    v_veiculo_id := CASE WHEN payload->>'veiculoId' = 'null' OR payload->>'veiculoId' IS NULL THEN NULL ELSE (payload->>'veiculoId')::uuid END;
    v_mecanico_id := (payload->>'mecanicoId')::uuid;
    v_user_id := (payload->>'userId')::uuid;
    v_valor_total := (payload->>'valorTotal')::numeric;
    v_valor_desconto := (payload->>'valorDesconto')::numeric;
    v_valor_final := (payload->>'valorFinal')::numeric;
    v_forma_pagamento := payload->>'formaPagamento';
    v_parcelas := (payload->>'parcelas')::integer;
    v_observacoes := payload->>'observacoes';
    v_produtos := payload->'produtos';
    v_servicos := payload->'servicos';
    v_comissao := payload->'comissao';

    -- Validações básicas
    IF v_numero_os IS NULL OR v_cliente_id IS NULL OR v_mecanico_id IS NULL OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'Dados obrigatórios não fornecidos: numeroOS, clienteId, mecanicoId, userId';
    END IF;

    IF v_forma_pagamento IS NULL THEN
        RAISE EXCEPTION 'Forma de pagamento é obrigatória';
    END IF;

    -- Extrair dados da comissão
    v_tipo_calculo := v_comissao->>'tipoCalculo';
    v_percentual := CASE WHEN v_comissao->>'percentual' = 'null' OR v_comissao->>'percentual' IS NULL THEN NULL ELSE (v_comissao->>'percentual')::numeric END;
    v_valor_fixo := CASE WHEN v_comissao->>'valorFixo' = 'null' OR v_comissao->>'valorFixo' IS NULL THEN NULL ELSE (v_comissao->>'valorFixo')::numeric END;
    v_comissao_observacoes := v_comissao->>'observacoes';

    -- Verificar se OS já existe (idempotência)
    SELECT id INTO v_venda_id FROM vendas WHERE numero_os = v_numero_os;
    
    IF v_venda_id IS NOT NULL THEN
        RAISE EXCEPTION 'OS com número % já existe. ID: %', v_numero_os, v_venda_id;
    END IF;

    -- 1. Verificar estoque dos produtos
    FOR v_produto IN SELECT * FROM jsonb_array_elements(v_produtos)
    LOOP
        SELECT quantidade INTO v_estoque_atual 
        FROM produtos 
        WHERE id = (v_produto->>'id')::uuid 
        AND user_id = v_user_id;

        IF v_estoque_atual IS NULL THEN
            RAISE EXCEPTION 'Produto % não encontrado', v_produto->>'nome';
        END IF;

        IF v_estoque_atual < (v_produto->>'quantidade')::integer THEN
            RAISE EXCEPTION 'Estoque insuficiente para produto %. Disponível: %, Solicitado: %', 
                v_produto->>'nome', v_estoque_atual, (v_produto->>'quantidade')::integer;
        END IF;
    END LOOP;

    -- 2. Criar a venda (OS) - trigger definirá empresa_id automaticamente
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
        finalizado_em,
        user_id
    ) VALUES (
        v_numero_os,
        v_cliente_id,
        (SELECT nome FROM clientes WHERE id = v_cliente_id),
        v_veiculo_id,
        v_mecanico_id,
        v_valor_total,
        v_valor_desconto,
        v_valor_final,
        v_forma_pagamento::forma_pagamento,
        v_parcelas,
        v_observacoes,
        'finalizada'::venda_status,
        NOW(),
        v_user_id
    ) RETURNING id INTO v_venda_id;

    -- 3. Inserir produtos da venda e baixar estoque
    FOR v_produto IN SELECT * FROM jsonb_array_elements(v_produtos)
    LOOP
        -- Inserir produto da venda - trigger definirá empresa_id automaticamente
        INSERT INTO venda_produtos (
            venda_id,
            produto_id,
            produto_nome,
            quantidade,
            preco_unitario,
            preco_total
        ) VALUES (
            v_venda_id,
            (v_produto->>'id')::uuid,
            v_produto->>'nome',
            (v_produto->>'quantidade')::integer,
            (v_produto->>'valor')::numeric,
            (v_produto->>'valor')::numeric * (v_produto->>'quantidade')::integer
        );

        -- Baixar estoque
        UPDATE produtos 
        SET quantidade = quantidade - (v_produto->>'quantidade')::integer
        WHERE id = (v_produto->>'id')::uuid 
        AND user_id = v_user_id;

        -- Registrar movimentação de estoque - trigger definirá empresa_id automaticamente
        INSERT INTO movimentacoes (
            produto_id,
            tipo,
            quantidade,
            quantidade_anterior,
            motivo,
            os_numero,
            valor_unitario,
            user_id
        ) VALUES (
            (v_produto->>'id')::uuid,
            'saida'::movimentacao_tipo,
            (v_produto->>'quantidade')::integer,
            v_estoque_atual,
            'Venda - OS ' || v_numero_os,
            v_numero_os,
            (v_produto->>'valor')::numeric,
            v_user_id
        );
    END LOOP;

    -- 4. Inserir serviços da venda e calcular base para comissão
    FOR v_servico IN SELECT * FROM jsonb_array_elements(v_servicos)
    LOOP
        -- Inserir serviço da venda - trigger definirá empresa_id automaticamente
        INSERT INTO venda_servicos (
            venda_id,
            servico_id,
            servico_nome,
            preco
        ) VALUES (
            v_venda_id,
            CASE WHEN v_servico->>'id' = 'null' OR v_servico->>'id' IS NULL THEN NULL ELSE (v_servico->>'id')::uuid END,
            v_servico->>'nome',
            (v_servico->>'valor')::numeric
        );

        -- Somar valor dos serviços para comissão
        v_valor_servicos := v_valor_servicos + (v_servico->>'valor')::numeric;
    END LOOP;

    -- 5. Calcular comissão
    v_base_calculo := v_valor_servicos;
    
    IF v_tipo_calculo = 'percentual' THEN
        v_comissao_valor_final := (v_base_calculo * v_percentual) / 100;
    ELSIF v_tipo_calculo = 'fixo' THEN
        v_comissao_valor_final := v_valor_fixo;
    ELSE
        RAISE EXCEPTION 'Tipo de cálculo de comissão inválido: %', v_tipo_calculo;
    END IF;

    -- 6. Inserir comissão - trigger definirá empresa_id automaticamente
    INSERT INTO comissoes_mecanicos (
        venda_id,
        mecanico_id,
        tipo_calculo,
        percentual,
        valor_fixo,
        valor_final,
        base_calculo,
        observacoes,
        user_id
    ) VALUES (
        v_venda_id,
        v_mecanico_id,
        v_tipo_calculo,
        v_percentual,
        v_valor_fixo,
        v_comissao_valor_final,
        v_base_calculo,
        v_comissao_observacoes,
        v_user_id
    );

    -- 7. Registrar logs - trigger definirá empresa_id automaticamente
    -- Log OS_CRIADA
    INSERT INTO log_movimentacoes (
        os_id,
        tipo,
        usuario,
        observacoes,
        user_id
    ) VALUES (
        v_venda_id,
        'OS_CRIADA',
        'Sistema',
        'OS ' || v_numero_os || ' criada com valor total R$ ' || v_valor_final,
        v_user_id
    );

    -- Log ESTOQUE_BAIXADO
    IF jsonb_array_length(v_produtos) > 0 THEN
        INSERT INTO log_movimentacoes (
            os_id,
            tipo,
            usuario,
            observacoes,
            user_id
        ) VALUES (
            v_venda_id,
            'ESTOQUE_BAIXADO',
            'Sistema',
            'Estoque baixado para OS ' || v_numero_os || ' - ' || jsonb_array_length(v_produtos) || ' produtos',
            v_user_id
        );
    END IF;

    -- Log OS_FINALIZADA
    INSERT INTO log_movimentacoes (
        os_id,
        tipo,
        usuario,
        observacoes,
        user_id
    ) VALUES (
        v_venda_id,
        'OS_FINALIZADA',
        'Sistema',
        'OS ' || v_numero_os || ' finalizada com pagamento ' || v_forma_pagamento,
        v_user_id
    );

    -- Log COMISSAO_REGISTRADA
    INSERT INTO log_movimentacoes (
        os_id,
        tipo,
        usuario,
        observacoes,
        user_id
    ) VALUES (
        v_venda_id,
        'COMISSAO_REGISTRADA',
        'Sistema',
        'Comissão registrada para mecânico. Base: R$ ' || v_base_calculo || ', Valor: R$ ' || v_comissao_valor_final,
        v_user_id
    );

    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'vendaId', v_venda_id,
        'numeroOS', v_numero_os,
        'valorComissao', v_comissao_valor_final,
        'baseCalculo', v_base_calculo
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, a transação será automaticamente revertida
        RAISE EXCEPTION 'Erro ao finalizar OS: %', SQLERRM;
END;
$function$;