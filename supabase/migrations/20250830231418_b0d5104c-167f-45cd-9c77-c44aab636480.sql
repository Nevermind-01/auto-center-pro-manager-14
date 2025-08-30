-- =========================================
-- ETAPA 1: Criar tabela de contadores
-- =========================================

CREATE TABLE IF NOT EXISTS public.empresa_contadores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    contador_os INTEGER NOT NULL DEFAULT 0,
    contador_orcamento INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraint única por empresa
    CONSTRAINT empresa_contadores_empresa_id_unique UNIQUE (empresa_id)
);

-- =========================================
-- ETAPA 2: RLS para empresa_contadores
-- =========================================

ALTER TABLE public.empresa_contadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contadores from their empresa"
ON public.empresa_contadores
FOR SELECT
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert contadores for their empresa"
ON public.empresa_contadores
FOR INSERT
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update contadores from their empresa"
ON public.empresa_contadores
FOR UPDATE
USING (has_empresa_access(empresa_id));

-- =========================================
-- ETAPA 3: Trigger para updated_at
-- =========================================

CREATE TRIGGER update_empresa_contadores_updated_at
    BEFORE UPDATE ON public.empresa_contadores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ETAPA 4: Função atômica para números sequenciais
-- =========================================

CREATE OR REPLACE FUNCTION public.get_next_sequential_number(
    p_empresa_id UUID,
    p_tipo TEXT -- 'os' ou 'orcamento'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        
        -- Formatar número OS
        v_numero_formatado := 'OS' || LPAD(v_contador::TEXT, 2, '0');
        
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
        
        -- Formatar número Orçamento
        v_numero_formatado := 'ORC' || LPAD(v_contador::TEXT, 2, '0');
    END IF;
    
    RETURN v_numero_formatado;
END;
$$;

-- =========================================
-- ETAPA 5: Migrar dados existentes
-- =========================================

-- Inicializar contadores baseado no maior número existente por empresa
WITH os_maximos AS (
    SELECT 
        empresa_id,
        COUNT(*) as total_os
    FROM vendas 
    WHERE empresa_id IS NOT NULL
    GROUP BY empresa_id
),
orcamento_maximos AS (
    SELECT 
        empresa_id,
        COUNT(*) as total_orcamentos
    FROM orcamentos 
    WHERE empresa_id IS NOT NULL
    GROUP BY empresa_id
),
empresas_com_dados AS (
    SELECT 
        COALESCE(os.empresa_id, orc.empresa_id) as empresa_id,
        COALESCE(os.total_os, 0) as contador_os,
        COALESCE(orc.total_orcamentos, 0) as contador_orcamento
    FROM os_maximos os
    FULL OUTER JOIN orcamento_maximos orc ON os.empresa_id = orc.empresa_id
)
INSERT INTO public.empresa_contadores (empresa_id, contador_os, contador_orcamento)
SELECT 
    empresa_id,
    contador_os,
    contador_orcamento
FROM empresas_com_dados
ON CONFLICT (empresa_id) DO UPDATE SET
    contador_os = GREATEST(empresa_contadores.contador_os, EXCLUDED.contador_os),
    contador_orcamento = GREATEST(empresa_contadores.contador_orcamento, EXCLUDED.contador_orcamento),
    updated_at = now();

-- =========================================
-- ETAPA 6: Remover índices únicos globais antigos (se existirem)
-- =========================================

-- Verificar e remover índices únicos globais existentes
DO $$
BEGIN
    -- Remover constraint único global de numero_os se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%numero_os%' 
        AND table_name = 'vendas' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_numero_os_key;
    END IF;
    
    -- Remover constraint único global de numero_orcamento se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%numero_orcamento%' 
        AND table_name = 'orcamentos' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_numero_orcamento_key;
    END IF;
END $$;

-- =========================================
-- ETAPA 7: Criar índices únicos por empresa
-- =========================================

-- Índice único para (empresa_id, numero_os)
CREATE UNIQUE INDEX IF NOT EXISTS vendas_empresa_numero_os_unique 
ON public.vendas (empresa_id, numero_os);

-- Índice único para (empresa_id, numero_orcamento)
CREATE UNIQUE INDEX IF NOT EXISTS orcamentos_empresa_numero_orcamento_unique 
ON public.orcamentos (empresa_id, numero_orcamento);

-- =========================================
-- ETAPA 8: Índices de performance
-- =========================================

-- Índice para busca rápida de contadores por empresa
CREATE INDEX IF NOT EXISTS empresa_contadores_empresa_id_idx 
ON public.empresa_contadores (empresa_id);

-- =========================================
-- ETAPA 9: Trigger para definir empresa_id automaticamente
-- =========================================

-- Garantir que empresa_contadores tenha trigger para empresa_id
CREATE TRIGGER set_empresa_contadores_empresa_id
    BEFORE INSERT ON public.empresa_contadores
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();