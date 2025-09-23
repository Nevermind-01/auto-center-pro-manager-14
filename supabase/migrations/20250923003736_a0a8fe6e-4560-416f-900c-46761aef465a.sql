-- Criar tabela para gerenciar carteira dos clientes
CREATE TABLE public.clientes_carteira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  saldo_atual NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cliente_id, empresa_id)
);

-- Criar tabela para movimentações da carteira
CREATE TABLE public.movimentacoes_carteira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  os_id UUID,
  saldo_anterior NUMERIC(10,2) NOT NULL,
  saldo_novo NUMERIC(10,2) NOT NULL,
  criado_por UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clientes_carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_carteira ENABLE ROW LEVEL SECURITY;

-- RLS Policies para clientes_carteira
CREATE POLICY "Users can view carteira from their empresa" 
ON public.clientes_carteira 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert carteira for their empresa" 
ON public.clientes_carteira 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update carteira from their empresa" 
ON public.clientes_carteira 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete carteira from their empresa" 
ON public.clientes_carteira 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- RLS Policies para movimentacoes_carteira
CREATE POLICY "Users can view movimentacoes_carteira from their empresa" 
ON public.movimentacoes_carteira 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert movimentacoes_carteira for their empresa" 
ON public.movimentacoes_carteira 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_clientes_carteira_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_carteira_updated_at
  BEFORE UPDATE ON public.clientes_carteira
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_carteira_updated_at();

-- Índices para performance
CREATE INDEX idx_clientes_carteira_cliente_empresa ON public.clientes_carteira(cliente_id, empresa_id);
CREATE INDEX idx_movimentacoes_carteira_cliente ON public.movimentacoes_carteira(cliente_id);
CREATE INDEX idx_movimentacoes_carteira_os ON public.movimentacoes_carteira(os_id);