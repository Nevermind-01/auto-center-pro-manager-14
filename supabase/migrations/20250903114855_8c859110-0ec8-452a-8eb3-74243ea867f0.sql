-- Criar enums necessários para o sistema de caixa
CREATE TYPE public.caixa_status AS ENUM ('aberto', 'fechado');
CREATE TYPE public.movimentacao_caixa_tipo AS ENUM ('entrada', 'saida');
CREATE TYPE public.movimentacao_caixa_origem AS ENUM ('OS', 'VENDA', 'MANUAL');
CREATE TYPE public.forma_pagamento_caixa AS ENUM ('dinheiro', 'pix', 'debito', 'credito', 'cheque', 'boleto', 'outros');

-- Tabela de caixas (sessões de caixa)
CREATE TABLE public.caixas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    aberto_por UUID NOT NULL,
    aberto_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    troco_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
    status caixa_status NOT NULL DEFAULT 'aberto',
    fechado_por UUID NULL,
    fechado_em TIMESTAMP WITH TIME ZONE NULL,
    observacao TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de movimentações do caixa
CREATE TABLE public.movimentacoes_caixa (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
    tipo_origem movimentacao_caixa_origem NOT NULL,
    referencia_id UUID NULL, -- ID da OS/venda quando houver
    tipo movimentacao_caixa_tipo NOT NULL,
    forma_pagamento forma_pagamento_caixa NOT NULL,
    valor_bruto NUMERIC(10,2) NOT NULL,
    valor_liquido NUMERIC(10,2) NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    descricao TEXT NULL,
    criado_por UUID NOT NULL,
    conciliado BOOLEAN NOT NULL DEFAULT false,
    referencia_conciliacao TEXT NULL,
    metadados JSONB NULL, -- Para status de cheque/boleto, etc
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de suprimentos (reforços de caixa)
CREATE TABLE public.suprimentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    motivo TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    criado_por UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de sangrias (retiradas de caixa)
CREATE TABLE public.sangrias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    motivo TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    autorizado_por UUID NOT NULL, -- Deve ser admin/owner
    criado_por UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fechamentos de caixa
CREATE TABLE public.fechamentos_caixa (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
    contagem_dinheiro NUMERIC(10,2) NOT NULL DEFAULT 0,
    contagem_pix NUMERIC(10,2) NOT NULL DEFAULT 0,
    contagem_debito NUMERIC(10,2) NOT NULL DEFAULT 0,
    contagem_credito NUMERIC(10,2) NOT NULL DEFAULT 0,
    contagem_outros JSONB NULL, -- Para outras formas de pagamento
    total_contado NUMERIC(10,2) NOT NULL,
    total_esperado NUMERIC(10,2) NOT NULL,
    diferenca NUMERIC(10,2) NOT NULL,
    resumo_por_forma JSONB NOT NULL, -- Snapshot dos valores por forma de pagamento
    gerado_por UUID NOT NULL,
    gerado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    arquivo_relatorio_url TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de auditoria do caixa
CREATE TABLE public.auditoria_caixa (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    caixa_id UUID NULL REFERENCES public.caixas(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    detalhes JSONB NULL,
    user_id UUID NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_caixas_empresa_status ON public.caixas(empresa_id, status);
CREATE INDEX idx_caixas_aberto_por_status ON public.caixas(aberto_por, status);
CREATE INDEX idx_movimentacoes_caixa_empresa_data ON public.movimentacoes_caixa(empresa_id, data_hora);
CREATE INDEX idx_movimentacoes_caixa_caixa_tipo ON public.movimentacoes_caixa(caixa_id, tipo);
CREATE INDEX idx_movimentacoes_caixa_referencia ON public.movimentacoes_caixa(referencia_id) WHERE referencia_id IS NOT NULL;
CREATE INDEX idx_suprimentos_empresa_data ON public.suprimentos(empresa_id, data_hora);
CREATE INDEX idx_sangrias_empresa_data ON public.sangrias(empresa_id, data_hora);
CREATE INDEX idx_fechamentos_empresa_data ON public.fechamentos_caixa(empresa_id, gerado_em);
CREATE INDEX idx_auditoria_caixa_empresa_data ON public.auditoria_caixa(empresa_id, criado_em);

-- Triggers para updated_at
CREATE TRIGGER update_caixas_updated_at
    BEFORE UPDATE ON public.caixas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suprimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sangrias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamentos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_caixa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para caixas
CREATE POLICY "Users can view caixas from their empresa" ON public.caixas
    FOR SELECT USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert caixas for their empresa" ON public.caixas
    FOR INSERT WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update caixas from their empresa" ON public.caixas
    FOR UPDATE USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete caixas from their empresa" ON public.caixas
    FOR DELETE USING (has_empresa_access(empresa_id));

-- Políticas RLS para movimentacoes_caixa
CREATE POLICY "Users can view movimentacoes_caixa from their empresa" ON public.movimentacoes_caixa
    FOR SELECT USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert movimentacoes_caixa for their empresa" ON public.movimentacoes_caixa
    FOR INSERT WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update movimentacoes_caixa from their empresa" ON public.movimentacoes_caixa
    FOR UPDATE USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete movimentacoes_caixa from their empresa" ON public.movimentacoes_caixa
    FOR DELETE USING (has_empresa_access(empresa_id));

-- Políticas RLS para suprimentos
CREATE POLICY "Users can view suprimentos from their empresa" ON public.suprimentos
    FOR SELECT USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert suprimentos for their empresa" ON public.suprimentos
    FOR INSERT WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update suprimentos from their empresa" ON public.suprimentos
    FOR UPDATE USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete suprimentos from their empresa" ON public.suprimentos
    FOR DELETE USING (has_empresa_access(empresa_id));

-- Políticas RLS para sangrias
CREATE POLICY "Users can view sangrias from their empresa" ON public.sangrias
    FOR SELECT USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert sangrias for their empresa" ON public.sangrias
    FOR INSERT WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update sangrias from their empresa" ON public.sangrias
    FOR UPDATE USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete sangrias from their empresa" ON public.sangrias
    FOR DELETE USING (has_empresa_access(empresa_id));

-- Políticas RLS para fechamentos_caixa
CREATE POLICY "Users can view fechamentos_caixa from their empresa" ON public.fechamentos_caixa
    FOR SELECT USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert fechamentos_caixa for their empresa" ON public.fechamentos_caixa
    FOR INSERT WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update fechamentos_caixa from their empresa" ON public.fechamentos_caixa
    FOR UPDATE USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete fechamentos_caixa from their empresa" ON public.fechamentos_caixa
    FOR DELETE USING (has_empresa_access(empresa_id));

-- Políticas RLS para auditoria_caixa
CREATE POLICY "Users can view auditoria_caixa from their empresa" ON public.auditoria_caixa
    FOR SELECT USING (has_empresa_access(empresa_id));

CREATE POLICY "System can insert auditoria_caixa" ON public.auditoria_caixa
    FOR INSERT WITH CHECK (true);

-- Constraint para garantir apenas um caixa aberto por empresa por operador
CREATE UNIQUE INDEX idx_caixa_unico_aberto_por_empresa 
ON public.caixas(empresa_id, aberto_por) 
WHERE status = 'aberto';