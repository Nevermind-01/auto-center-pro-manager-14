-- Criar tabela mecanicos
CREATE TABLE public.mecanicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  especialidade text,
  telefone text,
  ativo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela mecanicos
ALTER TABLE public.mecanicos ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários verem apenas seus mecânicos
CREATE POLICY "Usuários podem ver seus mecânicos"
ON public.mecanicos
FOR SELECT
USING (user_id = auth.uid());

-- Criar política para usuários criarem seus mecânicos
CREATE POLICY "Usuários podem criar seus mecânicos"
ON public.mecanicos
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Criar política para usuários atualizarem seus mecânicos
CREATE POLICY "Usuários podem atualizar seus mecânicos"
ON public.mecanicos
FOR UPDATE
USING (user_id = auth.uid());

-- Criar política para usuários deletarem seus mecânicos
CREATE POLICY "Usuários podem deletar seus mecânicos"
ON public.mecanicos
FOR DELETE
USING (user_id = auth.uid());

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_mecanicos_updated_at
BEFORE UPDATE ON public.mecanicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Alterar tabela vendas para adicionar mecanico_id
ALTER TABLE public.vendas
ADD COLUMN mecanico_id uuid REFERENCES public.mecanicos(id);