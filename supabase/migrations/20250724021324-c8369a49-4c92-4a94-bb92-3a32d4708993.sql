-- Criar enum para status de produtos
CREATE TYPE public.produto_status AS ENUM ('ativo', 'inativo');

-- Criar enum para tipos de movimentação
CREATE TYPE public.movimentacao_tipo AS ENUM ('entrada', 'saida', 'ajuste');

-- Criar enum para status de vendas
CREATE TYPE public.venda_status AS ENUM ('pendente', 'finalizada', 'cancelada');

-- Criar enum para formas de pagamento
CREATE TYPE public.forma_pagamento AS ENUM ('dinheiro', 'cartao', 'pix', 'cheque', 'parcelado');

-- Tabela de categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  marca TEXT,
  codigo TEXT UNIQUE,
  categoria_id UUID REFERENCES public.categorias(id),
  preco_custo DECIMAL(10,2) DEFAULT 0,
  preco_venda DECIMAL(10,2) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  status produto_status DEFAULT 'ativo',
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de movimentações de estoque
CREATE TABLE public.movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo movimentacao_tipo NOT NULL,
  quantidade INTEGER NOT NULL,
  quantidade_anterior INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  valor_unitario DECIMAL(10,2),
  os_numero TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de vendas/OS
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os TEXT UNIQUE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2) NOT NULL DEFAULT 0,
  forma_pagamento forma_pagamento NOT NULL,
  parcelas INTEGER DEFAULT 1,
  observacoes TEXT,
  status venda_status DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens da venda (produtos)
CREATE TABLE public.venda_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de serviços da venda
CREATE TABLE public.venda_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id),
  servico_nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_servicos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (permitindo acesso público por enquanto)
-- Categorias
CREATE POLICY "Permitir tudo em categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);

-- Produtos
CREATE POLICY "Permitir tudo em produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

-- Movimentações
CREATE POLICY "Permitir tudo em movimentacoes" ON public.movimentacoes FOR ALL USING (true) WITH CHECK (true);

-- Clientes
CREATE POLICY "Permitir tudo em clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- Serviços
CREATE POLICY "Permitir tudo em servicos" ON public.servicos FOR ALL USING (true) WITH CHECK (true);

-- Vendas
CREATE POLICY "Permitir tudo em vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);

-- Venda produtos
CREATE POLICY "Permitir tudo em venda_produtos" ON public.venda_produtos FOR ALL USING (true) WITH CHECK (true);

-- Venda serviços
CREATE POLICY "Permitir tudo em venda_servicos" ON public.venda_servicos FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas categorias padrão
INSERT INTO public.categorias (nome, descricao) VALUES
  ('Peças Automotivas', 'Peças e componentes para veículos'),
  ('Ferramentas', 'Ferramentas e equipamentos'),
  ('Óleos e Lubrificantes', 'Óleos, graxas e lubrificantes'),
  ('Acessórios', 'Acessórios diversos para veículos');

-- Inserir alguns serviços padrão
INSERT INTO public.servicos (nome, descricao, preco) VALUES
  ('Troca de Óleo', 'Troca de óleo do motor', 50.00),
  ('Alinhamento', 'Alinhamento de direção', 80.00),
  ('Balanceamento', 'Balanceamento de rodas', 60.00),
  ('Revisão Geral', 'Revisão completa do veículo', 150.00);