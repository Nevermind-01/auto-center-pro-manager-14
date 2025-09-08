-- Implementar plano completo para fortalecer RPC com validações robustas
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
    v_empresa_id uuid;
    v_valor_total numeric;
    v_valor_desconto numeric;
    v_valor_final numeric;
    v_forma_pagamento text;
    v_parcelas integer;
    v_observacoes text;
    v_produtos jsonb;
    v_servicos jsonb;
    v_comissao jsonb;
    v_caixa_info jsonb;
    v_produto jsonb;
    v_servico jsonb;
    v_valor_produtos_calculado numeric := 0;
    v_valor_servicos_calculado numeric := 0;
    v_valor_total_calculado numeric := 0;
    v_valor_final_calculado numeric := 0;
    v_comissao_valor_final numeric := 0;
    v_base_calculo numeric;
    v_percentual numeric;
    v_valor_fixo numeric;
    v_tipo_calculo text;
    v_comissao_observacoes text;
    v_categoria_nome text;
    v_caixa_id uuid;
    v_tem_produtos boolean := false;
    v_tem_servicos boolean := false;
    v_tem_comissao boolean := false;
    v_cliente_existe boolean := false;
    v_mecanico_existe boolean := false;
    v_veiculo_valido boolean := true;
    v_caixa_aberto boolean := false;
    -- Otimização: armazenar dados de estoque em uma única consulta
    v_produto_estoque record;
    v_tolerancia_calculo numeric := 0.01; -- Tolerância para diferenças de arredondamento
BEGIN
    -- ========================================
    -- 1. EXTRAIR E VALIDAR DADOS BÁSICOS
    -- ========================================
    
    v_user_id := auth.uid();
    v_empresa_id := public.get_current_empresa_id();
    
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado ou empresa não selecionada';
    END IF;
    
    -- Extrair dados obrigatórios do payload com validações de segurança
    v_numero_os := payload->>'numeroOS';
    v_cliente_id := (payload->>'clienteId')::uuid;
    v_valor_total := (payload->>'valorTotal')::numeric;
    v_valor_desconto := COALESCE((payload->>'valorDesconto')::numeric, 0);
    v_valor_final := (payload->>'valorFinal')::numeric;
    v_forma_pagamento := payload->>'formaPagamento';
    v_parcelas := COALESCE((payload->>'parcelas')::integer, 1);
    v_observacoes := payload->>'observacoes';

    -- Validações básicas obrigatórias
    IF v_numero_os IS NULL OR trim(v_numero_os) = '' THEN
        RAISE EXCEPTION 'Número da OS é obrigatório';
    END IF;
    
    IF v_cliente_id IS NULL THEN
        RAISE EXCEPTION 'Cliente é obrigatório';
    END IF;
    
    IF v_forma_pagamento IS NULL OR trim(v_forma_pagamento) = '' THEN
        RAISE EXCEPTION 'Forma de pagamento é obrigatória';
    END IF;
    
    -- Validações de segurança para valores numéricos
    IF v_valor_total IS NULL OR v_valor_total < 0 THEN
        RAISE EXCEPTION 'Valor total deve ser maior ou igual a zero';
    END IF;
    
    IF v_valor_desconto < 0 THEN
        RAISE EXCEPTION 'Valor do desconto não pode ser negativo';
    END IF;
    
    IF v_valor_final IS NULL OR v_valor_final <= 0 THEN
        RAISE EXCEPTION 'Valor final deve ser maior que zero';
    END IF;
    
    -- Validar limites máximos realistas (prevenir overflow)
    IF v_valor_total > 999999999.99 OR v_valor_final > 999999999.99 THEN
        RAISE EXCEPTION 'Valores informados excedem o limite máximo permitido';
    END IF;
    
    IF v_parcelas <= 0 OR v_parcelas > 999 THEN
        RAISE EXCEPTION 'Número de parcelas deve estar entre 1 e 999';
    END IF;

    -- ========================================
    -- 2. VALIDAR EXISTÊNCIA DE ENTIDADES
    -- ========================================
    
    -- Verificar se cliente existe
    SELECT EXISTS(
        SELECT 1 FROM public.clientes 
        WHERE id = v_cliente_id AND empresa_id = v_empresa_id
    ) INTO v_cliente_existe;
    
    IF NOT v_cliente_existe THEN
        RAISE EXCEPTION 'Cliente não encontrado na empresa atual';
    END IF;

    -- Extrair e validar veículo (opcional)
    IF payload->>'veiculoId' IS NOT NULL AND payload->>'veiculoId' != 'null' THEN
        v_veiculo_id := (payload->>'veiculoId')::uuid;
        
        -- Verificar se veículo pertence ao cliente
        SELECT EXISTS(
            SELECT 1 FROM public.veiculos 
            WHERE id = v_veiculo_id 
            AND cliente_id = v_cliente_id 
            AND empresa_id = v_empresa_id
        ) INTO v_veiculo_valido;
        
        IF NOT v_veiculo_valido THEN
            RAISE EXCEPTION 'Veículo não pertence ao cliente ou não existe na empresa atual';
        END IF;
    END IF;

    -- Extrair e validar mecânico (opcional)
    IF payload->>'mecanicoId' IS NOT NULL AND payload->>'mecanicoId' != 'null' THEN
        v_mecanico_id := (payload->>'mecanicoId')::uuid;
        
        -- Verificar se mecânico existe e está ativo
        SELECT EXISTS(
            SELECT 1 FROM public.mecanicos 
            WHERE id = v_mecanico_id 
            AND empresa_id = v_empresa_id 
            AND ativo = true
        ) INTO v_mecanico_existe;
        
        IF NOT v_mecanico_existe THEN
            RAISE EXCEPTION 'Mecânico não encontrado ou não está ativo na empresa atual';
        END IF;
    END IF;

    -- ========================================
    -- 3. PROCESSAR E VALIDAR ARRAYS
    -- ========================================
    
    -- Processar produtos (se existirem) - validação robusta para arrays nulos
    v_produtos := COALESCE(payload->'produtos', '[]'::jsonb);
    IF jsonb_typeof(v_produtos) != 'array' THEN
        v_produtos := '[]'::jsonb;
    END IF;
    v_tem_produtos := jsonb_array_length(v_produtos) > 0;
    
    -- Processar serviços (se existirem) - validação robusta para arrays nulos
    v_servicos := COALESCE(payload->'servicos', '[]'::jsonb);
    IF jsonb_typeof(v_servicos) != 'array' THEN
        v_servicos := '[]'::jsonb;
    END IF;
    v_tem_servicos := jsonb_array_length(v_servicos) > 0;
    
    -- Processar comissão (se existir) - opcional
    v_comissao := payload->'comissao';
    v_tem_comissao := v_comissao IS NOT NULL AND v_mecanico_id IS NOT NULL;
    
    -- Validar estrutura do objeto caixa de forma mais robusta
    v_caixa_info := payload->'caixa';
    IF v_caixa_info IS NOT NULL THEN
        -- Verificar se contém a chave caixaId
        IF v_caixa_info ? 'caixaId' AND v_caixa_info->>'caixaId' IS NOT NULL AND v_caixa_info->>'caixaId' != 'null' THEN
            -- Validar se é um UUID válido antes de fazer cast
            BEGIN
                v_caixa_id := (v_caixa_info->>'caixaId')::uuid;
            EXCEPTION WHEN invalid_text_representation THEN
                RAISE EXCEPTION 'ID do caixa deve ser um UUID válido';
            END;
        ELSE
            RAISE EXCEPTION 'Objeto caixa deve conter um caixaId válido';
        END IF;
    END IF;

    -- Validar se há pelo menos produtos ou serviços
    IF NOT v_tem_produtos AND NOT v_tem_servicos THEN
        RAISE EXCEPTION 'OS deve conter pelo menos um produto ou um serviço';
    END IF;

    -- ========================================
    -- 4. VERIFICAR DUPLICIDADE DE OS
    -- ========================================
    
    SELECT id INTO v_venda_id FROM vendas 
    WHERE numero_os = v_numero_os AND empresa_id = v_empresa_id;
    
    IF v_venda_id IS NOT NULL THEN
        RAISE EXCEPTION 'Número de OS % já existe na empresa. ID: %', v_numero_os, v_venda_id;
    END IF;

    -- ========================================
    -- 5. VALIDAR ESTOQUE COM BLOQUEIO DE LINHA (OTIMIZADO)
    -- ========================================
    
    IF v_tem_produtos THEN
        FOR v_produto IN SELECT * FROM jsonb_array_elements(v_produtos)
        LOOP
            -- Validar estrutura do produto
            IF v_produto->>'id' IS NULL OR v_produto->>'nome' IS NULL 
               OR v_produto->>'quantidade' IS NULL OR v_produto->>'valor' IS NULL THEN
                RAISE EXCEPTION 'Produto com dados incompletos encontrado';
            END IF;
            
            -- Validar valores de segurança para o produto
            IF (v_produto->>'quantidade')::integer <= 0 THEN
                RAISE EXCEPTION 'Quantidade do produto % deve ser maior que zero', v_produto->>'nome';
            END IF;
            
            IF (v_produto->>'valor')::numeric < 0 THEN
                RAISE EXCEPTION 'Valor do produto % não pode ser negativo', v_produto->>'nome';
            END IF;
            
            IF (v_produto->>'quantidade')::integer > 9999 THEN
                RAISE EXCEPTION 'Quantidade do produto % excede o limite máximo (9999)', v_produto->>'nome';
            END IF;
            
            -- OTIMIZAÇÃO: Usar SELECT FOR UPDATE para bloqueio de linha e evitar race conditions
            -- Consulta única que já traz dados para validação E atualização posterior
            SELECT id, nome, quantidade INTO v_produto_estoque
            FROM produtos 
            WHERE id = (v_produto->>'id')::uuid 
            AND empresa_id = v_empresa_id
            FOR UPDATE; -- Lock pessimista para prevenir race conditions

            IF v_produto_estoque.id IS NULL THEN
                RAISE EXCEPTION 'Produto % não encontrado na empresa', v_produto->>'nome';
            END IF;

            IF v_produto_estoque.quantidade < (v_produto->>'quantidade')::integer THEN
                RAISE EXCEPTION 'Estoque insuficiente para produto %. Disponível: %, Solicitado: %', 
                    v_produto->>'nome', v_produto_estoque.quantidade, (v_produto->>'quantidade')::integer;
            END IF;
            
            -- Acumular valor dos produtos para validação de totais
            v_valor_produtos_calculado := v_valor_produtos_calculado + 
                ((v_produto->>'valor')::numeric * (v_produto->>'quantidade')::integer);
        END LOOP;
    END IF;

    -- ========================================
    -- 6. VALIDAR SERVIÇOS E CALCULAR TOTAIS
    -- ========================================
    
    IF v_tem_servicos THEN
        FOR v_servico IN SELECT * FROM jsonb_array_elements(v_servicos)
        LOOP
            -- Validar estrutura do serviço
            IF v_servico->>'nome' IS NULL OR v_servico->>'valor' IS NULL THEN
                RAISE EXCEPTION 'Serviço com dados incompletos encontrado';
            END IF;
            
            -- Validar valores de segurança para o serviço
            IF (v_servico->>'valor')::numeric < 0 THEN
                RAISE EXCEPTION 'Valor do serviço % não pode ser negativo', v_servico->>'nome';
            END IF;
            
            -- Acumular valor dos serviços para validação de totais
            v_valor_servicos_calculado := v_valor_servicos_calculado + (v_servico->>'valor')::numeric;
        END LOOP;
        
        -- Se há serviços mas não há mecânico, avisar
        IF v_mecanico_id IS NULL THEN
            RAISE EXCEPTION 'Serviços foram informados mas nenhum mecânico foi selecionado';
        END IF;
    END IF;

    -- ========================================
    -- 7. VALIDAR COERÊNCIA DOS TOTAIS
    -- ========================================
    
    v_valor_total_calculado := v_valor_produtos_calculado + v_valor_servicos_calculado;
    v_valor_final_calculado := v_valor_total_calculado - v_valor_desconto;
    
    -- Validar se os totais calculados batem com os enviados (com tolerância para arredondamento)
    IF ABS(v_valor_total - v_valor_total_calculado) > v_tolerancia_calculo THEN
        RAISE EXCEPTION 'Valor total informado (%) não confere com a soma de produtos e serviços (%). Diferença: %', 
            v_valor_total, v_valor_total_calculado, ABS(v_valor_total - v_valor_total_calculado);
    END IF;
    
    IF ABS(v_valor_final - v_valor_final_calculado) > v_tolerancia_calculo THEN
        RAISE EXCEPTION 'Valor final informado (%) não confere com o cálculo (total % - desconto %). Diferença: %', 
            v_valor_final, v_valor_final_calculado, v_valor_desconto, ABS(v_valor_final - v_valor_final_calculado);
    END IF;
    
    -- Validar se desconto não é maior que o total
    IF v_valor_desconto > v_valor_total_calculado THEN
        RAISE EXCEPTION 'Desconto (%) não pode ser maior que o valor total (%)', v_valor_desconto, v_valor_total_calculado;
    END IF;

    -- ========================================
    -- 8. PROCESSAR COMISSÃO (SE APLICÁVEL)
    -- ========================================
    
    IF v_tem_comissao AND v_tem_servicos THEN
        -- Extrair dados da comissão
        v_tipo_calculo := v_comissao->>'tipoCalculo';
        v_percentual := CASE 
            WHEN v_comissao->>'percentual' IS NULL OR v_comissao->>'percentual' = 'null' 
            THEN NULL 
            ELSE (v_comissao->>'percentual')::numeric 
        END;
        v_valor_fixo := CASE 
            WHEN v_comissao->>'valorFixo' IS NULL OR v_comissao->>'valorFixo' = 'null' 
            THEN NULL 
            ELSE (v_comissao->>'valorFixo')::numeric 
        END;
        v_comissao_observacoes := v_comissao->>'observacoes';

        -- Validar dados da comissão
        IF v_tipo_calculo IS NULL THEN
            RAISE EXCEPTION 'Tipo de cálculo da comissão é obrigatório quando há comissão';
        END IF;
        
        IF v_tipo_calculo = 'percentual' THEN
            IF v_percentual IS NULL OR v_percentual <= 0 THEN
                RAISE EXCEPTION 'Percentual deve ser maior que zero para comissão percentual';
            END IF;
            IF v_percentual > 100 THEN
                RAISE EXCEPTION 'Percentual de comissão não pode ser maior que 100%';
            END IF;
        END IF;
        
        IF v_tipo_calculo = 'fixo' THEN
            IF v_valor_fixo IS NULL OR v_valor_fixo <= 0 THEN
                RAISE EXCEPTION 'Valor fixo deve ser maior que zero para comissão fixa';
            END IF;
            IF v_valor_fixo > v_valor_servicos_calculado THEN
                RAISE EXCEPTION 'Comissão fixa (%) não pode ser maior que o valor dos serviços (%)', v_valor_fixo, v_valor_servicos_calculado;
            END IF;
        END IF;

        -- Calcular comissão
        v_base_calculo := v_valor_servicos_calculado;
        
        IF v_tipo_calculo = 'percentual' THEN
            v_comissao_valor_final := (v_base_calculo * v_percentual) / 100;
        ELSIF v_tipo_calculo = 'fixo' THEN
            v_comissao_valor_final := v_valor_fixo;
        ELSE
            RAISE EXCEPTION 'Tipo de cálculo de comissão inválido: %. Deve ser "percentual" ou "fixo"', v_tipo_calculo;
        END IF;
    END IF;

    -- ========================================
    -- 9. VERIFICAR CAIXA (SE NECESSÁRIO)
    -- ========================================
    
    IF v_caixa_id IS NOT NULL THEN
        -- Verificar se caixa está aberto (com mensagem mais específica)
        SELECT EXISTS(
            SELECT 1 FROM public.caixas 
            WHERE id = v_caixa_id 
            AND empresa_id = v_empresa_id 
            AND status = 'aberto'
        ) INTO v_caixa_aberto;
        
        IF NOT v_caixa_aberto THEN
            -- Verificar se caixa existe mas está fechado
            IF EXISTS(SELECT 1 FROM public.caixas WHERE id = v_caixa_id AND empresa_id = v_empresa_id) THEN
                RAISE EXCEPTION 'Caixa está fechado. É necessário abrir o caixa antes de finalizar a OS';
            ELSE
                RAISE EXCEPTION 'Caixa não encontrado ou não pertence à empresa atual';
            END IF;
        END IF;
    END IF;

    -- ========================================
    -- 10. INICIAR TRANSAÇÃO - CRIAR VENDA
    -- ========================================
    
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
        user_id,
        empresa_id
    ) VALUES (
        v_numero_os,
        v_cliente_id,
        (SELECT nome FROM clientes WHERE id = v_cliente_id),
        v_veiculo_id,
        v_mecanico_id,
        v_valor_total_calculado, -- Usar valor calculado para garantir consistência
        v_valor_desconto,
        v_valor_final_calculado, -- Usar valor calculado para garantir consistência
        v_forma_pagamento::forma_pagamento,
        v_parcelas,
        v_observacoes,
        'finalizada'::venda_status,
        NOW(),
        v_user_id,
        v_empresa_id
    ) RETURNING id INTO v_venda_id;

    -- ========================================
    -- 11. PROCESSAR PRODUTOS E ESTOQUE (OTIMIZADO)
    -- ========================================
    
    IF v_tem_produtos THEN
        FOR v_produto IN SELECT * FROM jsonb_array_elements(v_produtos)
        LOOP
            -- Buscar categoria do produto
            SELECT c.nome INTO v_categoria_nome
            FROM produtos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = (v_produto->>'id')::uuid 
            AND p.empresa_id = v_empresa_id;

            -- Inserir produto da venda
            INSERT INTO venda_produtos (
                venda_id,
                produto_id,
                produto_nome,
                quantidade,
                preco_unitario,
                preco_total,
                categoria_nome,
                empresa_id
            ) VALUES (
                v_venda_id,
                (v_produto->>'id')::uuid,
                v_produto->>'nome',
                (v_produto->>'quantidade')::integer,
                (v_produto->>'valor')::numeric,
                (v_produto->>'valor')::numeric * (v_produto->>'quantidade')::integer,
                v_categoria_nome,
                v_empresa_id
            );

            -- OTIMIZAÇÃO: Reutilizar consulta anterior que já fez lock
            -- Baixar estoque (já protegido por FOR UPDATE anterior)
            UPDATE produtos 
            SET quantidade = quantidade - (v_produto->>'quantidade')::integer
            WHERE id = (v_produto->>'id')::uuid 
            AND empresa_id = v_empresa_id;

            -- Registrar movimentação de estoque (usando estoque atual ANTES da baixa)
            INSERT INTO movimentacoes (
                produto_id,
                tipo,
                quantidade,
                quantidade_anterior,
                motivo,
                os_numero,
                valor_unitario,
                user_id,
                empresa_id
            ) VALUES (
                (v_produto->>'id')::uuid,
                'saida'::movimentacao_tipo,
                (v_produto->>'quantidade')::integer,
                -- Usar dados já obtidos na validação com lock
                (SELECT quantidade + (v_produto->>'quantidade')::integer 
                 FROM produtos 
                 WHERE id = (v_produto->>'id')::uuid AND empresa_id = v_empresa_id),
                'Venda - OS ' || v_numero_os,
                v_numero_os,
                (v_produto->>'valor')::numeric,
                v_user_id,
                v_empresa_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- 12. PROCESSAR SERVIÇOS
    -- ========================================
    
    IF v_tem_servicos THEN
        FOR v_servico IN SELECT * FROM jsonb_array_elements(v_servicos)
        LOOP
            INSERT INTO venda_servicos (
                venda_id,
                servico_id,
                servico_nome,
                preco,
                empresa_id
            ) VALUES (
                v_venda_id,
                CASE 
                    WHEN v_servico->>'id' IS NULL OR v_servico->>'id' = 'null' 
                    THEN NULL 
                    ELSE (v_servico->>'id')::uuid 
                END,
                v_servico->>'nome',
                (v_servico->>'valor')::numeric,
                v_empresa_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- 13. REGISTRAR COMISSÃO (SE APLICÁVEL)
    -- ========================================
    
    IF v_tem_comissao AND v_comissao_valor_final > 0 THEN
        INSERT INTO comissoes_mecanicos (
            venda_id,
            mecanico_id,
            tipo_calculo,
            percentual,
            valor_fixo,
            valor_final,
            base_calculo,
            observacoes,
            user_id,
            empresa_id
        ) VALUES (
            v_venda_id,
            v_mecanico_id,
            v_tipo_calculo,
            v_percentual,
            v_valor_fixo,
            v_comissao_valor_final,
            v_base_calculo,
            v_comissao_observacoes,
            v_user_id,
            v_empresa_id
        );
    END IF;

    -- ========================================
    -- 14. REGISTRAR MOVIMENTAÇÃO DO CAIXA (SE APLICÁVEL)
    -- ========================================
    
    IF v_caixa_aberto AND v_caixa_id IS NOT NULL THEN
        INSERT INTO movimentacoes_caixa (
            caixa_id,
            tipo,
            tipo_origem,
            valor_bruto,
            valor_liquido,
            forma_pagamento,
            descricao,
            referencia_id,
            criado_por,
            empresa_id,
            metadados
        ) VALUES (
            v_caixa_id,
            'entrada'::tipo_movimentacao_caixa,
            'venda'::tipo_origem_movimentacao,
            v_valor_final_calculado, -- Usar valor calculado
            v_valor_final_calculado,
            v_forma_pagamento::forma_pagamento,
            'Venda OS ' || v_numero_os || ' - ' || 
            CASE 
                WHEN v_tem_produtos AND v_tem_servicos THEN 'Produtos e Serviços'
                WHEN v_tem_produtos THEN 'Produtos'
                ELSE 'Serviços'
            END,
            v_venda_id,
            v_user_id,
            v_empresa_id,
            jsonb_build_object(
                'numero_os', v_numero_os,
                'cliente_id', v_cliente_id,
                'valor_produtos', v_valor_produtos_calculado,
                'valor_servicos', v_valor_servicos_calculado,
                'desconto', v_valor_desconto,
                'parcelas', v_parcelas,
                'totais_validados', true
            )
        );
    END IF;

    -- ========================================
    -- 15. REGISTRAR LOGS DE AUDITORIA COM DETALHES MELHORADOS
    -- ========================================
    
    -- Log OS_CRIADA
    INSERT INTO log_movimentacoes (
        os_id,
        tipo,
        usuario,
        observacoes,
        user_id,
        empresa_id
    ) VALUES (
        v_venda_id,
        'OS_CRIADA',
        'Sistema',
        'OS ' || v_numero_os || ' criada com valor total R$ ' || v_valor_total_calculado || ' (validado)',
        v_user_id,
        v_empresa_id
    );

    -- Log ESTOQUE_BAIXADO (se houver produtos)
    IF v_tem_produtos THEN
        INSERT INTO log_movimentacoes (
            os_id,
            tipo,
            usuario,
            observacoes,
            user_id,
            empresa_id
        ) VALUES (
            v_venda_id,
            'ESTOQUE_BAIXADO',
            'Sistema',
            'Estoque baixado para OS ' || v_numero_os || ' - ' || jsonb_array_length(v_produtos) || ' produtos (com lock)',
            v_user_id,
            v_empresa_id
        );
    END IF;

    -- Log OS_FINALIZADA
    INSERT INTO log_movimentacoes (
        os_id,
        tipo,
        usuario,
        observacoes,
        user_id,
        empresa_id
    ) VALUES (
        v_venda_id,
        'OS_FINALIZADA',
        'Sistema',
        'OS ' || v_numero_os || ' finalizada com pagamento ' || v_forma_pagamento || ' (totais validados)',
        v_user_id,
        v_empresa_id
    );

    -- Log COMISSAO_REGISTRADA (se houver comissão)
    IF v_tem_comissao AND v_comissao_valor_final > 0 THEN
        INSERT INTO log_movimentacoes (
            os_id,
            tipo,
            usuario,
            observacoes,
            user_id,
            empresa_id
        ) VALUES (
            v_venda_id,
            'COMISSAO_REGISTRADA',
            'Sistema',
            'Comissão registrada para mecânico. Base: R$ ' || v_base_calculo || ', Valor: R$ ' || v_comissao_valor_final || ' (' || v_tipo_calculo || ')',
            v_user_id,
            v_empresa_id
        );
    END IF;

    -- Log CAIXA_REGISTRADO (se houver movimentação de caixa)
    IF v_caixa_aberto AND v_caixa_id IS NOT NULL THEN
        INSERT INTO log_movimentacoes (
            os_id,
            tipo,
            usuario,
            observacoes,
            user_id,
            empresa_id
        ) VALUES (
            v_venda_id,
            'CAIXA_REGISTRADO',
            'Sistema',
            'Entrada registrada no caixa: R$ ' || v_valor_final_calculado || ' via ' || v_forma_pagamento || ' (validado)',
            v_user_id,
            v_empresa_id
        );
    END IF;

    -- ========================================
    -- 16. RETORNAR RESULTADO DE SUCESSO COM DADOS VALIDADOS
    -- ========================================
    
    RETURN jsonb_build_object(
        'success', true,
        'vendaId', v_venda_id,
        'numeroOS', v_numero_os,
        'valorTotal', v_valor_total_calculado, -- Retornar valores validados
        'valorFinal', v_valor_final_calculado,
        'valorComissao', v_comissao_valor_final,
        'baseCalculo', COALESCE(v_base_calculo, 0),
        'temProdutos', v_tem_produtos,
        'temServicos', v_tem_servicos,
        'temComissao', v_tem_comissao,
        'caixaRegistrado', (v_caixa_aberto AND v_caixa_id IS NOT NULL),
        'quantidadeProdutos', CASE WHEN v_tem_produtos THEN jsonb_array_length(v_produtos) ELSE 0 END,
        'quantidadeServicos', CASE WHEN v_tem_servicos THEN jsonb_array_length(v_servicos) ELSE 0 END,
        'totaisValidados', true,
        'diferencaTolerada', v_tolerancia_calculo
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback automático garantido e log detalhado do erro
        RAISE EXCEPTION 'Erro ao finalizar OS %: % (SQLSTATE: %)', 
            COALESCE(v_numero_os, 'N/A'), SQLERRM, SQLSTATE;
END;
$function$;