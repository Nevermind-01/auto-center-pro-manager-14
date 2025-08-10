-- Ensure unique commission per OS and efficient sorting by finalized date (idempotent)
begin;

-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comissoes_mecanicos_venda_unique'
  ) THEN
    ALTER TABLE public.comissoes_mecanicos
      ADD CONSTRAINT comissoes_mecanicos_venda_unique UNIQUE (venda_id);
  END IF;
END
$$;

-- Create sorting index (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_comissoes_mecanicos_finalizado_em
  ON public.comissoes_mecanicos (finalizado_em DESC);

commit;