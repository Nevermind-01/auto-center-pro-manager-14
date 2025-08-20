-- FASE 1: Correção Estrutural das Tabelas

-- Adicionar empresa_id às tabelas venda_produtos e venda_servicos
ALTER TABLE public.venda_produtos ADD COLUMN empresa_id UUID;
ALTER TABLE public.venda_servicos ADD COLUMN empresa_id UUID;

-- Backfill: Popular empresa_id com base na venda relacionada
UPDATE public.venda_produtos 
SET empresa_id = (
    SELECT v.empresa_id 
    FROM public.vendas v 
    WHERE v.id = venda_produtos.venda_id
);

UPDATE public.venda_servicos 
SET empresa_id = (
    SELECT v.empresa_id 
    FROM public.vendas v 
    WHERE v.id = venda_servicos.venda_id
);

-- Criar índices para performance
CREATE INDEX idx_venda_produtos_empresa_id ON public.venda_produtos(empresa_id);
CREATE INDEX idx_venda_servicos_empresa_id ON public.venda_servicos(empresa_id);

-- Tornar empresa_id NOT NULL após backfill
ALTER TABLE public.venda_produtos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.venda_servicos ALTER COLUMN empresa_id SET NOT NULL;

-- FASE 2: Implementar "Fiscal Automático" (Triggers)

-- Criar função de trigger universal para empresa_id
CREATE OR REPLACE FUNCTION public.set_empresa_id_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT: sempre definir empresa_id com base no usuário atual
    IF TG_OP = 'INSERT' THEN
        NEW.empresa_id := public.get_current_empresa_id();
        RETURN NEW;
    END IF;
    
    -- Para UPDATE: preservar empresa_id original (não permitir mudança)
    IF TG_OP = 'UPDATE' THEN
        NEW.empresa_id := OLD.empresa_id;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instalar triggers em todas as tabelas de negócio
CREATE TRIGGER trg_set_empresa_id_vendas
    BEFORE INSERT OR UPDATE ON public.vendas
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_venda_produtos
    BEFORE INSERT OR UPDATE ON public.venda_produtos
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_venda_servicos
    BEFORE INSERT OR UPDATE ON public.venda_servicos
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_clientes
    BEFORE INSERT OR UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_produtos
    BEFORE INSERT OR UPDATE ON public.produtos
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_movimentacoes
    BEFORE INSERT OR UPDATE ON public.movimentacoes
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_log_movimentacoes
    BEFORE INSERT OR UPDATE ON public.log_movimentacoes
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_contas_a_pagar
    BEFORE INSERT OR UPDATE ON public.contas_a_pagar
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_mecanicos
    BEFORE INSERT OR UPDATE ON public.mecanicos
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_categorias
    BEFORE INSERT OR UPDATE ON public.categorias
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_servicos
    BEFORE INSERT OR UPDATE ON public.servicos
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_veiculos
    BEFORE INSERT OR UPDATE ON public.veiculos
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER trg_set_empresa_id_comissoes_mecanicos
    BEFORE INSERT OR UPDATE ON public.comissoes_mecanicos
    FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_trigger();

-- FASE 3: Simplificar Políticas RLS

-- Remover políticas existentes que têm dependências circulares
DROP POLICY IF EXISTS "Users can view venda_produtos from their empresa" ON public.venda_produtos;
DROP POLICY IF EXISTS "Users can insert venda_produtos for their empresa" ON public.venda_produtos;
DROP POLICY IF EXISTS "Users can update venda_produtos from their empresa" ON public.venda_produtos;
DROP POLICY IF EXISTS "Users can delete venda_produtos from their empresa" ON public.venda_produtos;

DROP POLICY IF EXISTS "Users can view venda_servicos from their empresa" ON public.venda_servicos;
DROP POLICY IF EXISTS "Users can insert venda_servicos for their empresa" ON public.venda_servicos;
DROP POLICY IF EXISTS "Users can update venda_servicos from their empresa" ON public.venda_servicos;
DROP POLICY IF EXISTS "Users can delete venda_servicos from their empresa" ON public.venda_servicos;

-- Criar políticas simplificadas para venda_produtos
CREATE POLICY "Users can view venda_produtos from their empresa" 
ON public.venda_produtos FOR SELECT 
USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Users can insert venda_produtos for their empresa" 
ON public.venda_produtos FOR INSERT 
WITH CHECK (empresa_id = public.get_current_empresa_id());

CREATE POLICY "Users can update venda_produtos from their empresa" 
ON public.venda_produtos FOR UPDATE 
USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Users can delete venda_produtos from their empresa" 
ON public.venda_produtos FOR DELETE 
USING (public.has_empresa_access(empresa_id));

-- Criar políticas simplificadas para venda_servicos
CREATE POLICY "Users can view venda_servicos from their empresa" 
ON public.venda_servicos FOR SELECT 
USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Users can insert venda_servicos for their empresa" 
ON public.venda_servicos FOR INSERT 
WITH CHECK (empresa_id = public.get_current_empresa_id());

CREATE POLICY "Users can update venda_servicos from their empresa" 
ON public.venda_servicos FOR UPDATE 
USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Users can delete venda_servicos from their empresa" 
ON public.venda_servicos FOR DELETE 
USING (public.has_empresa_access(empresa_id));

-- FASE 4: Atualizar RPC para funcionar com triggers

-- Atualizar RPC rpc_finalizar_os_com_comissao para funcionar com triggers
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
        v_forma_pagamento::venda_forma_pagamento,
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
            'saida'::tipo_movimentacao,
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