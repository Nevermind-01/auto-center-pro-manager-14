-- Criar enum para status do orçamento
CREATE TYPE orcamento_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'convertido_os');

-- Criar tabela de orçamentos
CREATE TABLE public.orcamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_orcamento TEXT NOT NULL UNIQUE,
    cliente_id UUID REFERENCES public.clientes(id),
    cliente_nome TEXT NOT NULL,
    veiculo_id UUID REFERENCES public.veiculos(id),
    mecanico_id UUID REFERENCES public.mecanicos(id),
    valor_total NUMERIC NOT NULL DEFAULT 0,
    valor_desconto NUMERIC DEFAULT 0,
    valor_final NUMERIC NOT NULL DEFAULT 0,
    status orcamento_status DEFAULT 'pendente',
    validade DATE NOT NULL,
    observacoes TEXT,
    observacoes_internas TEXT,
    os_id UUID REFERENCES public.vendas(id),
    user_id UUID,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos do orçamento
CREATE TABLE public.orcamento_produtos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id),
    produto_nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC NOT NULL,
    preco_total NUMERIC NOT NULL,
    empresa_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de serviços do orçamento
CREATE TABLE public.orcamento_servicos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    servico_id UUID REFERENCES public.servicos(id),
    servico_nome TEXT NOT NULL,
    preco NUMERIC NOT NULL,
    empresa_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_servicos ENABLE ROW LEVEL SECURITY;

-- RLS Policies para orcamentos
CREATE POLICY "Users can view orcamentos from their empresa" 
ON public.orcamentos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert orcamentos for their empresa" 
ON public.orcamentos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update orcamentos from their empresa" 
ON public.orcamentos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete orcamentos from their empresa" 
ON public.orcamentos 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- RLS Policies para orcamento_produtos
CREATE POLICY "Users can view orcamento_produtos from their empresa" 
ON public.orcamento_produtos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert orcamento_produtos for their empresa" 
ON public.orcamento_produtos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update orcamento_produtos from their empresa" 
ON public.orcamento_produtos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete orcamento_produtos from their empresa" 
ON public.orcamento_produtos 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- RLS Policies para orcamento_servicos
CREATE POLICY "Users can view orcamento_servicos from their empresa" 
ON public.orcamento_servicos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert orcamento_servicos for their empresa" 
ON public.orcamento_servicos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update orcamento_servicos from their empresa" 
ON public.orcamento_servicos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete orcamento_servicos from their empresa" 
ON public.orcamento_servicos 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- Triggers para atualizar updated_at e empresa_id
CREATE TRIGGER update_orcamentos_updated_at
BEFORE UPDATE ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_orcamentos_empresa_id
BEFORE INSERT OR UPDATE ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER set_orcamento_produtos_empresa_id
BEFORE INSERT OR UPDATE ON public.orcamento_produtos
FOR EACH ROW
EXECUTE FUNCTION public.set_empresa_id_trigger();

CREATE TRIGGER set_orcamento_servicos_empresa_id
BEFORE INSERT OR UPDATE ON public.orcamento_servicos
FOR EACH ROW
EXECUTE FUNCTION public.set_empresa_id_trigger();