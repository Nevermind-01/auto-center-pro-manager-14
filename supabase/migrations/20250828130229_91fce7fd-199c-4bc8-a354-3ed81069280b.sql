-- Adicionar coluna categoria_nome na tabela venda_produtos
ALTER TABLE public.venda_produtos 
ADD COLUMN categoria_nome TEXT;

-- Criar índice para melhor performance em consultas por categoria
CREATE INDEX idx_venda_produtos_categoria_nome ON public.venda_produtos(categoria_nome);