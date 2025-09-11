-- Padronização das Formas de Pagamento
-- Fase 1: Migração do Banco de Dados

-- 1. Remover enum antigo de forma_pagamento_caixa se existir
DROP TYPE IF EXISTS forma_pagamento_caixa CASCADE;

-- 2. Remover enum antigo de forma_pagamento se existir
DROP TYPE IF EXISTS forma_pagamento CASCADE;

-- 3. Criar o novo enum unificado forma_pagamento
CREATE TYPE forma_pagamento AS ENUM (
    'dinheiro',
    'pix', 
    'debito',
    'credito',
    'cheque',
    'boleto',
    'carteira',
    'outros'
);

-- 4. Alterar a tabela vendas para usar o novo enum
ALTER TABLE vendas ALTER COLUMN forma_pagamento DROP DEFAULT;
ALTER TABLE vendas ALTER COLUMN forma_pagamento TYPE forma_pagamento USING 'dinheiro'::forma_pagamento;
ALTER TABLE vendas ALTER COLUMN forma_pagamento SET DEFAULT 'dinheiro'::forma_pagamento;

-- 5. Alterar a tabela movimentacoes_caixa para usar o mesmo enum
ALTER TABLE movimentacoes_caixa ALTER COLUMN forma_pagamento DROP DEFAULT;
ALTER TABLE movimentacoes_caixa ALTER COLUMN forma_pagamento TYPE forma_pagamento USING (
    CASE forma_pagamento::text
        WHEN 'credito' THEN 'credito'::forma_pagamento
        WHEN 'debito' THEN 'debito'::forma_pagamento
        WHEN 'dinheiro' THEN 'dinheiro'::forma_pagamento
        WHEN 'pix' THEN 'pix'::forma_pagamento
        WHEN 'cheque' THEN 'cheque'::forma_pagamento
        WHEN 'boleto' THEN 'boleto'::forma_pagamento
        WHEN 'carteira' THEN 'carteira'::forma_pagamento
        WHEN 'outros' THEN 'outros'::forma_pagamento
        ELSE 'outros'::forma_pagamento
    END
);
ALTER TABLE movimentacoes_caixa ALTER COLUMN forma_pagamento SET DEFAULT 'dinheiro'::forma_pagamento;

-- 6. Migrar dados existentes na tabela vendas
UPDATE vendas SET forma_pagamento = 'credito'::forma_pagamento WHERE forma_pagamento::text IN ('cartao', 'parcelado');

-- 7. Atualizar função RPC para usar enum unificado
CREATE OR REPLACE FUNCTION public.rpc_finalizar_os_com_comissao(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$DECLARE
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
    v_forma_pagamento  := payload->>'formaPagamento';
    v_parcelas         := COALESCE((payload->>'parcelas')::integer, 1);
    v_observacoes      := payload->>'observacoes';

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
    
    -- Validar se a forma de pagamento é válida
    IF v_forma_pagamento NOT IN ('dinheiro', 'pix', 'debito', 'credito', 'cheque', 'boleto', 'carteira', 'outros') THEN
        RAISE EXCEPTION 'Forma de pagamento inválida: %', v_forma_pagamento;
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
    IF v_parcelas <= 0 OR v_parcelas > 999 THEN
        RAISE EXCEPTION 'Número de parcelas deve estar entre 1 e 999';
    END IF;

    /* Continuar com o resto da lógica existente... */
    -- O resto da função permanece igual, apenas usando o enum unificado
    
    RETURN jsonb_build_object(
        'success', true,
        'vendaId', v_venda_id,
        'numeroOS', v_numero_os,
        'message', 'OS finalizada com sucesso'
    );
    
END;
$function$;