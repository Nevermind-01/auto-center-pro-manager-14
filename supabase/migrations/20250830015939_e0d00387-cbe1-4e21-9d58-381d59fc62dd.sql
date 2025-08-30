-- Adicionar campos km_atual e cor à tabela veiculos
ALTER TABLE public.veiculos 
ADD COLUMN km_atual NUMERIC DEFAULT 0,
ADD COLUMN cor TEXT;

-- Criar tabela para histórico de KM dos veículos
CREATE TABLE public.veiculo_km_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    veiculo_id UUID NOT NULL,
    km_anterior NUMERIC NOT NULL,
    km_novo NUMERIC NOT NULL,
    data_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    os_id UUID,
    orcamento_id UUID,
    observacoes TEXT,
    user_id UUID,
    empresa_id UUID NOT NULL
);

-- Habilitar RLS para a nova tabela
ALTER TABLE public.veiculo_km_historico ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para veiculo_km_historico
CREATE POLICY "Users can view veiculo_km_historico from their empresa" 
ON public.veiculo_km_historico 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert veiculo_km_historico for their empresa" 
ON public.veiculo_km_historico 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

-- Criar função para atualizar KM e registrar histórico
CREATE OR REPLACE FUNCTION public.update_veiculo_km(
    p_veiculo_id UUID,
    p_km_novo NUMERIC,
    p_os_id UUID DEFAULT NULL,
    p_orcamento_id UUID DEFAULT NULL,
    p_observacoes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_km_anterior NUMERIC;
    v_empresa_id UUID;
    v_user_id UUID;
BEGIN
    -- Obter usuário e empresa atuais
    v_user_id := auth.uid();
    v_empresa_id := public.get_current_empresa_id();
    
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado ou empresa não selecionada');
    END IF;
    
    -- Obter KM atual do veículo
    SELECT km_atual INTO v_km_anterior
    FROM veiculos
    WHERE id = p_veiculo_id AND empresa_id = v_empresa_id;
    
    IF v_km_anterior IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Veículo não encontrado');
    END IF;
    
    -- Validar se o novo KM é maior ou igual ao anterior
    IF p_km_novo < v_km_anterior THEN
        RETURN jsonb_build_object('success', false, 'error', 'O novo KM deve ser maior ou igual ao KM atual (' || v_km_anterior || ')');
    END IF;
    
    -- Atualizar KM do veículo
    UPDATE veiculos 
    SET km_atual = p_km_novo,
        updated_at = now()
    WHERE id = p_veiculo_id AND empresa_id = v_empresa_id;
    
    -- Registrar no histórico apenas se houve mudança no KM
    IF p_km_novo != v_km_anterior THEN
        INSERT INTO veiculo_km_historico (
            veiculo_id,
            km_anterior,
            km_novo,
            os_id,
            orcamento_id,
            observacoes,
            user_id,
            empresa_id
        ) VALUES (
            p_veiculo_id,
            v_km_anterior,
            p_km_novo,
            p_os_id,
            p_orcamento_id,
            p_observacoes,
            v_user_id,
            v_empresa_id
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true, 
        'km_anterior', v_km_anterior,
        'km_novo', p_km_novo,
        'diferenca', p_km_novo - v_km_anterior
    );
END;
$$;