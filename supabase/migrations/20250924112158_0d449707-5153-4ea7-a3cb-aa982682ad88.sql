-- Adicionar novo status 'finalizada-carteira' ao enum venda_status
ALTER TYPE venda_status ADD VALUE 'finalizada-carteira';

-- Criar tabela para controle de pagamentos parciais de OS
CREATE TABLE public.pagamentos_os (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    valor_pago NUMERIC NOT NULL DEFAULT 0,
    forma_pagamento forma_pagamento NOT NULL,
    valor_restante NUMERIC NOT NULL DEFAULT 0,
    data_pagamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    usuario_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagamentos_os ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view pagamentos_os from their empresa"
ON public.pagamentos_os
FOR SELECT
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert pagamentos_os for their empresa"
ON public.pagamentos_os
FOR INSERT
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update pagamentos_os from their empresa"
ON public.pagamentos_os
FOR UPDATE
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete pagamentos_os from their empresa"
ON public.pagamentos_os
FOR DELETE
USING (has_empresa_access(empresa_id));

-- Add indexes for better performance
CREATE INDEX idx_pagamentos_os_os_id ON public.pagamentos_os(os_id);
CREATE INDEX idx_pagamentos_os_empresa_id ON public.pagamentos_os(empresa_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_pagamentos_os_updated_at
    BEFORE UPDATE ON public.pagamentos_os
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();