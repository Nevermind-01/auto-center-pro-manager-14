-- Remove o campo 'role' desnecessário da tabela profiles
-- Este campo não é usado no código e pode representar um risco de segurança
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;