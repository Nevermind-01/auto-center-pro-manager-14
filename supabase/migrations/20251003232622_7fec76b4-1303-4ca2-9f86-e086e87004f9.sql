-- Corrigir RPC para tratar carteira como pendente (não debitar imediatamente)
CREATE OR REPLACE FUNCTION public.rpc_finalizar_os_com_comissao(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_venda_id               uuid;
    v_venda_id_payload       uuid;
    v_numero_os              text;
    v_cliente_id             uuid;
    v_veiculo_id             uuid;
    v_mecanico_id            uuid;
    v_user_id                uuid;
    v_empresa_id             uuid;
    v_valor_total            numeric;
    v_valor_desconto         numeric;
    v_valor_final            numeric;
    v_forma_pagamento        text;
    v_formas_pagamento       jsonb;
    v_forma                  jsonb;
    v_parcelas               integer;
    v_observacoes            text;
    v_produtos               jsonb;
    v_servicos               jsonb;
    v_comissao               jsonb;
    v_caixa_info             jsonb;
    v_produto                jsonb;
    v_servico                jsonb;
    v_valor_produtos_calculado numeric := 0;
    v_valor_servicos_calculado numeric := 0;
    v_valor_total_calculado    numeric := 0;
    v_valor_final_calculado    numeric := 0;
    v_comissao_valor_final    numeric := 0;
    v_base_calculo            numeric;
    v_percentual              numeric;
    v_valor_fixo              numeric;
    v_tipo_calculo            text;
    v_comissao_observacoes    text;
    v_categoria_nome          text;
    v_caixa_id                uuid;
    v_tem_produtos            boolean := false;
    v_tem_servicos            boolean := false;
    v_tem_comissao            boolean := false;
    v_cliente_existe          boolean := false;
    v_mecanico_existe         boolean := false;
    v_veiculo_valido          boolean := true;
    v_caixa_aberto            boolean := false;
    v_produto_estoque         record;
    v_tolerancia_calculo      numeric := 0.01;
    v_tem_carteira            boolean := false;
    v_valor_carteira          numeric := 0;
    v_valor_nao_carteira      numeric := 0;
    v_ordem_forma             integer := 0;
    v_forma_pg_text           text;
    v_forma_valor             numeric;
    v_forma_parcelas          integer;
    v_carteira_id             uuid;
    v_saldo_carteira          numeric;
    v_soma_formas             numeric := 0;
BEGIN
    /* 1) CONTEXTO E CAMPOS BÁSICOS */
    v_user_id    := auth.uid();
    v_empresa_id := public.get_current_empresa_id();
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado ou empresa não selecionada';
    END IF;

    v_venda_id_payload := NULLIF(payload->>'vendaId','')::uuid;
    v_numero_os        := payload->>'numeroOS';
    v_cliente_id       := (payload->>'clienteId')::uuid;
    v_valor_total      := (payload->>'valorTotal')::numeric;
    v_valor_desconto   := COALESCE((payload->>'valorDesconto')::numeric, 0);
    v_valor_final      := (payload->>'valorFinal')::numeric;
    v_parcelas         := COALESCE((payload->>'parcelas')::integer, 1);
    v_observacoes      := payload->>'observacoes';

    /* SUPORTE A MÚLTIPLAS FORMAS DE PAGAMENTO */
    IF payload ? 'formasPagamento' AND payload->'formasPagamento' IS NOT NULL THEN
        v_formas_pagamento := payload->'formasPagamento';
        v_forma_pagamento := (v_formas_pagamento->0->>'forma')::text;
    ELSE
        v_forma_pagamento := payload->>'formaPagamento';
        v_formas_pagamento := jsonb_build_array(
            jsonb_build_object(
                'forma', v_forma_pagamento,
                'valor', v_valor_final,
                'parcelas', v_parcelas
            )
        );
    END IF;

    /* Validar soma das formas */
    FOR v_forma IN SELECT * FROM jsonb_array_elements(v_formas_pagamento)
    LOOP
        v_soma_formas := v_soma_formas + COALESCE((v_forma->>'valor')::numeric, 0);
    END LOOP;
    
    IF ABS(v_soma_formas - v_valor_final) > v_tolerancia_calculo THEN
        RAISE EXCEPTION 'Soma das formas de pagamento não confere com valor final';
    END IF;

    /* validações básicas */
    IF v_numero_os IS NULL OR trim(v_numero_os) = '' THEN
        RAISE EXCEPTION 'Número da OS é obrigatório';
    END IF;
    IF v_cliente_id IS NULL THEN
        RAISE EXCEPTION 'Cliente é obrigatório';
    END IF;
    IF v_forma_pagamento IS NULL OR trim(v_forma_pagamento) = '' THEN
        RAISE EXCEPTION 'Forma de pagamento é obrigatória';
    END IF;
    IF v_valor_total IS NULL OR v_valor_total < 0 THEN
        RAISE EXCEPTION 'Valor total deve ser maior ou igual a zero';
    END IF;
    IF v_valor_desconto < 0 THEN
        RAISE EXCEPTION 'Valor do desconto não pode ser negativo';
    END IF;
    IF v_valor_final IS NULL OR v_valor_final <= 0 THEN
        RAISE EXCEPTION 'Valor final deve ser maior que zero';
    END IF;
    IF v_valor_total > 999999999.99 OR v_valor_final > 999999999.99 THEN
        RAISE EXCEPTION 'Valores informados excedem o limite máximo permitido';
    END IF;

    /* 2) EXISTÊNCIA DE ENTIDADES */
    SELECT EXISTS(
        SELECT 1 FROM public.clientes 
        WHERE id = v_cliente_id AND empresa_id = v_empresa_id
    ) INTO v_cliente_existe;
    IF NOT v_cliente_existe THEN
        RAISE EXCEPTION 'Cliente não encontrado na empresa atual';
    END IF;
    
    IF payload->>'veiculoId' IS NOT NULL AND payload->>'veiculoId' <> 'null' THEN
        v_veiculo_id := (payload->>'veiculoId')::uuid;
        SELECT EXISTS(
            SELECT 1 FROM public.veiculos 
            WHERE id = v_veiculo_id AND cliente_id = v_cliente_id AND empresa_id = v_empresa_id
        ) INTO v_veiculo_valido;
        IF NOT v_veiculo_valido THEN
            RAISE EXCEPTION 'Veículo não pertence ao cliente ou não existe na empresa atual';
        END IF;
    END IF;
    
    IF payload->>'mecanicoId' IS NOT NULL AND payload->>'mecanicoId' <> 'null' THEN
        v_mecanico_id := (payload->>'mecanicoId')::uuid;
        SELECT EXISTS(
            SELECT 1 FROM public.mecanicos 
            WHERE id = v_mecanico_id AND empresa_id = v_empresa_id AND ativo = true
        ) INTO v_mecanico_existe;
        IF NOT v_mecanico_existe THEN
            RAISE EXCEPTION 'Mecânico não encontrado ou não está ativo na empresa atual';
        END IF;
    END IF;

    /* 3) ARRAYS, COMISSÃO E CAIXA */
    v_produtos := COALESCE(payload->'produtos', '[]'::jsonb);
    IF jsonb_typeof(v_produtos) <> 'array' THEN v_produtos := '[]'::jsonb; END IF;
    v_tem_produtos := jsonb_array_length(v_produtos) > 0;
    
    v_servicos := COALESCE(payload->'servicos', '[]'::jsonb);
    IF jsonb_typeof(v_servicos) <> 'array' THEN v_servicos := '[]'::jsonb; END IF;
    v_tem_servicos := jsonb_array_length(v_servicos) > 0;
    
    v_comissao := payload->'comissao';
    v_tem_comissao := v_comissao IS NOT NULL AND v_mecanico_id IS NOT NULL;
    
    v_caixa_info := payload->'caixa';
    IF v_caixa_info IS NOT NULL THEN
        IF v_caixa_info ? 'caixaId'
           AND v_caixa_info->>'caixaId' IS NOT NULL
           AND v_caixa_info->>'caixaId' <> 'null' THEN
            BEGIN
                v_caixa_id := (v_caixa_info->>'caixaId')::uuid;
            EXCEPTION WHEN invalid_text_representation THEN
                RAISE EXCEPTION 'ID do caixa deve ser um UUID válido';
            END;
        ELSE
            RAISE EXCEPTION 'Objeto caixa deve conter um caixaId válido';
        END IF;
    END IF;
    
    IF NOT v_tem_produtos AND NOT v_tem_servicos THEN
        RAISE EXCEPTION 'OS deve conter pelo menos um produto ou um serviço';
    END IF;

    /* 4) DUPLICIDADE / EDIÇÃO / IDEMPOTÊNCIA */
    IF v_venda_id_payload IS NOT NULL THEN
        SELECT id INTO v_venda_id
          FROM public.vendas
         WHERE id = v_venda_id_payload AND empresa_id = v_empresa_id;
        IF v_venda_id IS NULL THEN
            RAISE EXCEPTION 'Venda (OS) não encontrada para edição na empresa atual';
        END IF;
        IF EXISTS (
            SELECT 1 FROM public.vendas
             WHERE empresa_id = v_empresa_id
               AND numero_os = v_numero_os
               AND id <> v_venda_id
        ) THEN
            RAISE EXCEPTION 'Número de OS já está em uso por outra venda na empresa';
        END IF;
    ELSE
        SELECT id INTO v_venda_id
          FROM public.vendas
         WHERE empresa_id = v_empresa_id AND numero_os = v_numero_os;
        IF v_venda_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'vendaId', v_venda_id,
                'numeroOS', v_numero_os,
                'caixaRegistrado', false,
                'mensagem', 'OS já existia'
            );
        END IF;
    END IF;

    /* 5) ESTOQUE */
    IF v_tem_produtos THEN
        FOR v_produto IN SELECT * FROM jsonb_array_elements(v_produtos)
        LOOP
            IF v_produto->>'id' IS NULL OR v_produto->>'nome' IS NULL
               OR v_produto->>'quantidade' IS NULL OR v_produto->>'valor' IS NULL THEN
                RAISE EXCEPTION 'Produto com dados incompletos encontrado';
            END IF;
            IF (v_produto->>'quantidade')::integer <= 0 THEN
                RAISE EXCEPTION 'Quantidade deve ser maior que zero para produto';
            END IF;
            IF (v_produto->>'valor')::numeric < 0 THEN
                RAISE EXCEPTION 'Valor não pode ser negativo para produto';
            END IF;
            IF (v_produto->>'quantidade')::integer > 9999 THEN
                RAISE EXCEPTION 'Quantidade excede limite máximo para produto';
            END IF;
            
            SELECT id, nome, quantidade INTO v_produto_estoque
              FROM produtos
             WHERE id = (v_produto->>'id')::uuid AND empresa_id = v_empresa_id
             FOR UPDATE;
            IF v_produto_estoque.id IS NULL THEN
                RAISE EXCEPTION 'Produto não encontrado';
            END IF;
            IF v_produto_estoque.quantidade < (v_produto->>'quantidade')::integer THEN
                RAISE EXCEPTION 'Estoque insuficiente para produto';
            END IF;
            
            v_valor_produtos_calculado := v_valor_produtos_calculado +
                ((v_produto->>'valor')::numeric * (v_produto->>'quantidade')::integer);
        END LOOP;
    END IF;

    /* 6) SERVIÇOS */
    IF v_tem_servicos THEN
        FOR v_servico IN SELECT * FROM jsonb_array_elements(v_servicos)
        LOOP
            IF v_servico->>'nome' IS NULL OR v_servico->>'valor' IS NULL THEN
                RAISE EXCEPTION 'Serviço com dados incompletos encontrado';
            END IF;
            IF (v_servico->>'valor')::numeric < 0 THEN
                RAISE EXCEPTION 'Valor não pode ser negativo para serviço';
            END IF;
            v_valor_servicos_calculado := v_valor_servicos_calculado + (v_servico->>'valor')::numeric;
        END LOOP;
        IF v_mecanico_id IS NULL THEN
            RAISE EXCEPTION 'Serviços foram informados mas nenhum mecânico foi selecionado';
        END IF;
    END IF;

    /* 7) COERÊNCIA DOS TOTAIS */
    v_valor_total_calculado := v_valor_produtos_calculado + v_valor_servicos_calculado;
    v_valor_final_calculado := v_valor_total_calculado - v_valor_desconto;
    IF ABS(v_valor_total - v_valor_total_calculado) > v_tolerancia_calculo THEN
        RAISE EXCEPTION 'Valor total informado não confere com a soma de produtos e serviços';
    END IF;
    IF ABS(v_valor_final - v_valor_final_calculado) > v_tolerancia_calculo THEN
        RAISE EXCEPTION 'Valor final informado não confere com o cálculo esperado';
    END IF;
    IF v_valor_desconto > v_valor_total_calculado THEN
        RAISE EXCEPTION 'Desconto não pode ser maior que o valor total';
    END IF;

    /* 8) COMISSÃO */
    IF v_tem_comissao AND v_tem_servicos THEN
        v_tipo_calculo := v_comissao->>'tipoCalculo';
        v_percentual   := CASE
            WHEN v_comissao->>'percentual' IS NULL OR v_comissao->>'percentual' = 'null'
            THEN NULL ELSE (v_comissao->>'percentual')::numeric END;
        v_valor_fixo   := CASE
            WHEN v_comissao->>'valorFixo' IS NULL OR v_comissao->>'valorFixo' = 'null'
            THEN NULL ELSE (v_comissao->>'valorFixo')::numeric END;
        v_comissao_observacoes := v_comissao->>'observacoes';
        
        IF v_tipo_calculo IS NULL THEN
            RAISE EXCEPTION 'Tipo de cálculo da comissão é obrigatório quando há comissão';
        END IF;
        IF v_tipo_calculo = 'percentual' THEN
            IF v_percentual IS NULL OR v_percentual <= 0 THEN
                RAISE EXCEPTION 'Percentual deve ser maior que zero para comissão percentual';
            END IF;
            IF v_percentual > 100 THEN
                RAISE EXCEPTION 'Percentual de comissão não pode ser maior que 100';
            END IF;
        ELSIF v_tipo_calculo = 'fixo' THEN
            IF v_valor_fixo IS NULL OR v_valor_fixo <= 0 THEN
                RAISE EXCEPTION 'Valor fixo deve ser maior que zero para comissão fixa';
            END IF;
            IF v_valor_fixo > v_valor_servicos_calculado THEN
                RAISE EXCEPTION 'Comissão fixa não pode ser maior que o valor dos serviços';
            END IF;
        ELSE
            RAISE EXCEPTION 'Tipo de cálculo de comissão inválido';
        END IF;
        
        v_base_calculo := v_valor_servicos_calculado;
        IF v_tipo_calculo = 'percentual' THEN
            v_comissao_valor_final := (v_base_calculo * v_percentual) / 100;
        ELSE
            v_comissao_valor_final := v_valor_fixo;
        END IF;
    END IF;

    /* 9) VERIFICAR CARTEIRA (APENAS PARA VALIDAÇÃO - NÃO DEBITA) */
    FOR v_forma IN SELECT * FROM jsonb_array_elements(v_formas_pagamento)
    LOOP
        IF (v_forma->>'forma')::text = 'carteira' THEN
            v_tem_carteira := true;
            v_valor_carteira := v_valor_carteira + COALESCE((v_forma->>'valor')::numeric, 0);
        ELSE
            v_valor_nao_carteira := v_valor_nao_carteira + COALESCE((v_forma->>'valor')::numeric, 0);
        END IF;
    END LOOP;

    /* Se tem carteira, apenas validar que existe (sem validar saldo) */
    IF v_tem_carteira THEN
        SELECT id, saldo_atual INTO v_carteira_id, v_saldo_carteira
        FROM public.clientes_carteira
        WHERE cliente_id = v_cliente_id AND empresa_id = v_empresa_id;
        
        IF v_carteira_id IS NULL THEN
            RAISE EXCEPTION 'Cliente não possui carteira cadastrada';
        END IF;
    END IF;

    /* 10) CAIXA */
    IF v_caixa_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.caixas
             WHERE id = v_caixa_id
               AND empresa_id = v_empresa_id
               AND status = 'aberto'
        ) INTO v_caixa_aberto;
        IF NOT v_caixa_aberto THEN
            v_caixa_id := NULL;
        END IF;
    END IF;

    /* 11) CRIAR ou ATUALIZAR VENDA */
    IF v_venda_id_payload IS NOT NULL THEN
        UPDATE public.vendas SET
            numero_os      = v_numero_os,
            cliente_id     = v_cliente_id,
            cliente_nome   = (SELECT nome FROM clientes WHERE id = v_cliente_id),
            veiculo_id     = v_veiculo_id,
            mecanico_id    = v_mecanico_id,
            valor_total    = v_valor_total_calculado,
            valor_desconto = v_valor_desconto,
            valor_final    = v_valor_final_calculado,
            forma_pagamento= v_forma_pagamento::forma_pagamento,
            parcelas       = v_parcelas,
            observacoes    = v_observacoes,
            status         = CASE 
                WHEN v_tem_carteira AND v_valor_carteira > 0 THEN 'finalizada-carteira'::venda_status
                ELSE 'finalizada'::venda_status
            END,
            finalizado_em  = NOW(),
            user_id        = v_user_id
        WHERE id = v_venda_id_payload AND empresa_id = v_empresa_id;
        
        v_venda_id := v_venda_id_payload;
        
        DELETE FROM public.venda_produtos WHERE venda_id = v_venda_id AND empresa_id = v_empresa_id;
        DELETE FROM public.venda_servicos WHERE venda_id = v_venda_id AND empresa_id = v_empresa_id;
        DELETE FROM public.os_formas_pagamento WHERE os_id = v_venda_id AND empresa_id = v_empresa_id;
    ELSE
        INSERT INTO public.vendas (
            numero_os, cliente_id, cliente_nome, veiculo_id, mecanico_id,
            valor_total, valor_desconto, valor_final, forma_pagamento, parcelas,
            observacoes, status, finalizado_em, user_id, empresa_id
        ) VALUES (
            v_numero_os, v_cliente_id, (SELECT nome FROM clientes WHERE id = v_cliente_id),
            v_veiculo_id, v_mecanico_id, v_valor_total_calculado, v_valor_desconto,
            v_valor_final_calculado, v_forma_pagamento::forma_pagamento, v_parcelas,
            v_observacoes, 
            CASE 
                WHEN v_tem_carteira AND v_valor_carteira > 0 THEN 'finalizada-carteira'::venda_status
                ELSE 'finalizada'::venda_status
            END,
            NOW(), v_user_id, v_empresa_id
        ) RETURNING id INTO v_venda_id;
    END IF;

    /* 12) SALVAR FORMAS DE PAGAMENTO */
    v_ordem_forma := 0;
    FOR v_forma IN SELECT * FROM jsonb_array_elements(v_formas_pagamento)
    LOOP
        v_ordem_forma := v_ordem_forma + 1;
        v_forma_pg_text := (v_forma->>'forma')::text;
        v_forma_valor := COALESCE((v_forma->>'valor')::numeric, 0);
        v_forma_parcelas := COALESCE((v_forma->>'parcelas')::integer, 1);
        
        INSERT INTO public.os_formas_pagamento (
            os_id, empresa_id, forma_pagamento, valor, parcelas, ordem, observacoes
        ) VALUES (
            v_venda_id, v_empresa_id, v_forma_pg_text::forma_pagamento, 
            v_forma_valor, v_forma_parcelas, v_ordem_forma,
            v_forma->>'observacoes'
        );
    END LOOP;

    /* 13) INSERIR PRODUTOS */
    IF v_tem_produtos THEN
        FOR v_produto IN SELECT * FROM jsonb_array_elements(v_produtos)
        LOOP
            SELECT nome INTO v_categoria_nome
              FROM categorias
             WHERE id = (v_produto->>'categoriaId')::uuid;

            INSERT INTO public.venda_produtos (
                venda_id, produto_id, produto_nome, quantidade,
                preco_unitario, preco_total, categoria_nome, empresa_id
            ) VALUES (
                v_venda_id, (v_produto->>'id')::uuid, v_produto->>'nome',
                (v_produto->>'quantidade')::integer, (v_produto->>'valor')::numeric,
                (v_produto->>'valor')::numeric * (v_produto->>'quantidade')::integer,
                v_categoria_nome, v_empresa_id
            );

            UPDATE public.produtos
               SET quantidade = quantidade - (v_produto->>'quantidade')::integer
             WHERE id = (v_produto->>'id')::uuid AND empresa_id = v_empresa_id;
        END LOOP;
    END IF;

    /* 14) INSERIR SERVIÇOS */
    IF v_tem_servicos THEN
        FOR v_servico IN SELECT * FROM jsonb_array_elements(v_servicos)
        LOOP
            INSERT INTO public.venda_servicos (
                venda_id, servico_id, servico_nome, preco, empresa_id
            ) VALUES (
                v_venda_id,
                CASE WHEN v_servico->>'id' IS NOT NULL AND v_servico->>'id' <> 'null'
                     THEN (v_servico->>'id')::uuid ELSE NULL END,
                v_servico->>'nome',
                (v_servico->>'valor')::numeric,
                v_empresa_id
            );
        END LOOP;
    END IF;

    /* 15) INSERIR COMISSÃO */
    IF v_tem_comissao THEN
        INSERT INTO public.comissoes_mecanicos (
            venda_id, mecanico_id, tipo_calculo, percentual, valor_fixo,
            base_calculo, valor_final, observacoes, user_id, empresa_id
        ) VALUES (
            v_venda_id, v_mecanico_id, v_tipo_calculo, v_percentual, v_valor_fixo,
            v_base_calculo, v_comissao_valor_final, v_comissao_observacoes,
            v_user_id, v_empresa_id
        );
    END IF;

    /* 16) MOVIMENTAÇÕES DE CAIXA - APENAS PARA FORMAS NÃO-CARTEIRA */
    IF v_caixa_id IS NOT NULL AND v_caixa_aberto THEN
        FOR v_forma IN SELECT * FROM jsonb_array_elements(v_formas_pagamento)
        LOOP
            v_forma_pg_text := (v_forma->>'forma')::text;
            v_forma_valor := COALESCE((v_forma->>'valor')::numeric, 0);
            
            IF v_forma_pg_text <> 'carteira' THEN
                INSERT INTO public.movimentacoes_caixa (
                    caixa_id, tipo, tipo_origem, referencia_id, forma_pagamento,
                    valor_bruto, valor_liquido, descricao, criado_por, empresa_id
                ) VALUES (
                    v_caixa_id, 'entrada'::tipo_movimentacao_caixa, 'venda'::origem_movimentacao,
                    v_venda_id, v_forma_pg_text::forma_pagamento,
                    v_forma_valor, v_forma_valor,
                    'Venda OS ' || v_numero_os || ' - ' || UPPER(v_forma_pg_text),
                    v_user_id, v_empresa_id
                );
            END IF;
        END LOOP;
    END IF;

    /* 17) REGISTRAR CARTEIRA COMO PENDENTE (NÃO DEBITAR) */
    IF v_tem_carteira AND v_valor_carteira > 0 THEN
        INSERT INTO public.pagamentos_os (
            os_id, forma_pagamento, valor_pago, valor_restante,
            data_pagamento, usuario_id, empresa_id, observacoes
        ) VALUES (
            v_venda_id, 
            CASE WHEN v_valor_nao_carteira > 0 
                 THEN v_forma_pagamento::forma_pagamento 
                 ELSE 'outros'::forma_pagamento 
            END,
            v_valor_nao_carteira,
            v_valor_carteira,
            NOW(), 
            v_user_id, 
            v_empresa_id,
            CASE 
                WHEN v_valor_nao_carteira > 0 
                THEN 'Valor pago: R$ ' || v_valor_nao_carteira::text || '. Valor pendente (carteira): R$ ' || v_valor_carteira::text
                ELSE 'Valor total pendente (carteira): R$ ' || v_valor_carteira::text
            END
        );
    END IF;

    /* 18) RETORNO */
    RETURN jsonb_build_object(
        'success', true,
        'vendaId', v_venda_id,
        'numeroOS', v_numero_os,
        'caixaRegistrado', v_caixa_aberto,
        'valorCarteira', v_valor_carteira,
        'valorNaoCarteira', v_valor_nao_carteira
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao finalizar OS: %', SQLERRM;
END;
$function$;