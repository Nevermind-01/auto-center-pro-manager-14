-- 1) Create table for mechanic commissions
CREATE TABLE IF NOT EXISTS public.comissoes_mecanicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  mecanico_id UUID NOT NULL REFERENCES public.mecanicos(id) ON DELETE RESTRICT,
  tipo_calculo TEXT NOT NULL CHECK (tipo_calculo IN ('percentual', 'fixo')),
  percentual NUMERIC,
  valor_fixo NUMERIC,
  valor_final NUMERIC NOT NULL DEFAULT 0,
  base_calculo NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  finalizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_comissao_por_venda UNIQUE (venda_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_comissoes_mecanicos_mecanico_id ON public.comissoes_mecanicos (mecanico_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_mecanicos_finalizado_em ON public.comissoes_mecanicos (finalizado_em DESC);

-- Enable RLS
ALTER TABLE public.comissoes_mecanicos ENABLE ROW LEVEL SECURITY;

-- Policies similar to other tables (user scoped with admin override)
DROP POLICY IF EXISTS "Users can view their own comissoes_mecanicos" ON public.comissoes_mecanicos;
CREATE POLICY "Users can view their own comissoes_mecanicos"
ON public.comissoes_mecanicos
FOR SELECT
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own comissoes_mecanicos" ON public.comissoes_mecanicos;
CREATE POLICY "Users can insert their own comissoes_mecanicos"
ON public.comissoes_mecanicos
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own comissoes_mecanicos" ON public.comissoes_mecanicos;
CREATE POLICY "Users can update their own comissoes_mecanicos"
ON public.comissoes_mecanicos
FOR UPDATE
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete their own comissoes_mecanicos" ON public.comissoes_mecanicos;
CREATE POLICY "Users can delete their own comissoes_mecanicos"
ON public.comissoes_mecanicos
FOR DELETE
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_comissoes_mecanicos_updated_at ON public.comissoes_mecanicos;
CREATE TRIGGER update_comissoes_mecanicos_updated_at
BEFORE UPDATE ON public.comissoes_mecanicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();