-- Adicionar constraint UNIQUE na coluna numero_os para evitar duplicatas
ALTER TABLE public.vendas 
ADD CONSTRAINT vendas_numero_os_unique UNIQUE (numero_os);