-- Criar tabela veiculos
CREATE TABLE public.veiculos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  marca text NOT NULL,
  modelo text NOT NULL,
  placa text NOT NULL,
  ano text,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT veiculos_pkey PRIMARY KEY (id)
);

-- Habilitar RLS na tabela veiculos
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações em veiculos
CREATE POLICY "Permitir tudo em veiculos" 
ON public.veiculos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_veiculos_updated_at
BEFORE UPDATE ON public.veiculos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna veiculo_id na tabela vendas
ALTER TABLE public.vendas
ADD COLUMN veiculo_id uuid REFERENCES public.veiculos(id);

-- Criar índice para melhor performance
CREATE INDEX idx_veiculos_cliente_id ON public.veiculos(cliente_id);
CREATE INDEX idx_vendas_veiculo_id ON public.vendas(veiculo_id);