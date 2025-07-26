-- Criar tabela para registro de movimentações/logs do sistema
CREATE TABLE public.log_movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'cancelamento', 'edicao', 'finalizacao', 'criacao'
  usuario text DEFAULT 'Admin', -- por enquanto padrão, futuramente pode vir do auth
  data_hora timestamp with time zone DEFAULT now(),
  observacoes text,
  dados_anteriores jsonb, -- para guardar estado anterior em edições
  dados_novos jsonb, -- para guardar novo estado em edições
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT log_movimentacoes_pkey PRIMARY KEY (id)
);

-- Habilitar RLS na tabela
ALTER TABLE public.log_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso total (ajustar conforme necessário)
CREATE POLICY "Permitir tudo em log_movimentacoes" 
ON public.log_movimentacoes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Índice para melhorar performance de consultas por OS
CREATE INDEX idx_log_movimentacoes_os_id ON public.log_movimentacoes(os_id);
CREATE INDEX idx_log_movimentacoes_tipo ON public.log_movimentacoes(tipo);
CREATE INDEX idx_log_movimentacoes_data_hora ON public.log_movimentacoes(data_hora DESC);