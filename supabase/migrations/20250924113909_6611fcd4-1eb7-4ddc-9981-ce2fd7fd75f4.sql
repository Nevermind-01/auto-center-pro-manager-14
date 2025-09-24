-- Adicionar foreign keys para clientes_carteira
ALTER TABLE public.clientes_carteira 
ADD CONSTRAINT clientes_carteira_cliente_id_fkey 
FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

ALTER TABLE public.clientes_carteira 
ADD CONSTRAINT clientes_carteira_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_carteira_cliente_id ON public.clientes_carteira(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_carteira_empresa_id ON public.clientes_carteira(empresa_id);