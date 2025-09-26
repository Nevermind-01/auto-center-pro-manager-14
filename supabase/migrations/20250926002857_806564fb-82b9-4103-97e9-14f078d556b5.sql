-- Criar tabela para múltiplas formas de pagamento
CREATE TABLE IF NOT EXISTS public.os_formas_pagamento (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    os_id UUID NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    valor NUMERIC NOT NULL DEFAULT 0,
    parcelas INTEGER NOT NULL DEFAULT 1,
    observacoes TEXT,
    ordem INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.os_formas_pagamento ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view os_formas_pagamento from their empresa" 
ON public.os_formas_pagamento 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert os_formas_pagamento for their empresa" 
ON public.os_formas_pagamento 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update os_formas_pagamento from their empresa" 
ON public.os_formas_pagamento 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete os_formas_pagamento from their empresa" 
ON public.os_formas_pagamento 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- Add trigger for empresa_id
CREATE TRIGGER set_empresa_id_os_formas_pagamento
    BEFORE INSERT OR UPDATE ON public.os_formas_pagamento
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();

-- Add trigger for updated_at
CREATE TRIGGER update_os_formas_pagamento_updated_at
    BEFORE UPDATE ON public.os_formas_pagamento
    FOR EACH ROW
    EXECUTE FUNCTION public.update_clientes_carteira_updated_at();