-- Remove a constraint global incorreta que impede empresas diferentes 
-- de terem OS com mesmo número
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_numero_os_unique;

-- Verificar se a constraint correta por empresa ainda existe
-- (esta deve permanecer para garantir unicidade dentro da mesma empresa)
-- vendas_empresa_numero_os_unique já existe e é a correta