-- Add new customer fields to the clientes table
ALTER TABLE public.clientes 
ADD COLUMN cpf TEXT,
ADD COLUMN cnpj TEXT,
ADD COLUMN rg TEXT,
ADD COLUMN rua TEXT,
ADD COLUMN numero_residencia TEXT,
ADD COLUMN bairro TEXT,
ADD COLUMN cidade TEXT,
ADD COLUMN estado TEXT;

-- Update existing endereco column to be nullable since we're breaking it down
-- (keeping it for backward compatibility for now)