-- Tornar os_id nullable na tabela log_movimentacoes para permitir exclusão de usuários
-- Isso é necessário porque alguns logs podem não estar associados a uma OS específica
ALTER TABLE public.log_movimentacoes 
ALTER COLUMN os_id DROP NOT NULL;