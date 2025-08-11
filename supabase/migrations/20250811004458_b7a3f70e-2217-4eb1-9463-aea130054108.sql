-- Add finalizado_em column to vendas table
ALTER TABLE public.vendas 
ADD COLUMN finalizado_em TIMESTAMP WITH TIME ZONE;

-- For existing finalized OS records, set finalizado_em to updated_at
UPDATE public.vendas 
SET finalizado_em = updated_at 
WHERE status = 'finalizada';