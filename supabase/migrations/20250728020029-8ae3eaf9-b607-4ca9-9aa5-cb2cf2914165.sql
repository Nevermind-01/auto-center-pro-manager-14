-- Criar tabela contas_a_pagar
CREATE TABLE public.contas_a_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa text NOT NULL,
  descricao text,
  valor numeric NOT NULL,
  status text CHECK (status IN ('pendente', 'paga', 'cancelada')) DEFAULT 'pendente',
  forma_pagamento text,
  vencimento date NOT NULL,
  data_pagamento date,
  comprovante_url text,
  fixa boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.contas_a_pagar ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (similar às outras tabelas)
CREATE POLICY "Permitir tudo em contas_a_pagar" 
ON public.contas_a_pagar 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_contas_a_pagar_updated_at
  BEFORE UPDATE ON public.contas_a_pagar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket comprovantes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', true);

-- Criar políticas para o bucket comprovantes
CREATE POLICY "Permitir visualização de comprovantes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'comprovantes');

CREATE POLICY "Permitir upload de comprovantes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'comprovantes');

CREATE POLICY "Permitir atualização de comprovantes" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'comprovantes');

CREATE POLICY "Permitir exclusão de comprovantes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'comprovantes');