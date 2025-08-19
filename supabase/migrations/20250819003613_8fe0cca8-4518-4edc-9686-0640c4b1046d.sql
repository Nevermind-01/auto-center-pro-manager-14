-- Criar tabelas empresas e empresa_usuarios

-- Criar tabela empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela empresa_usuarios (relacionamento many-to-many usuários/empresas)
CREATE TABLE IF NOT EXISTS public.empresa_usuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role empresa_role NOT NULL DEFAULT 'user',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, user_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas
CREATE POLICY "Users can view empresas they belong to" 
ON public.empresas 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.empresa_usuarios 
        WHERE empresa_id = empresas.id 
        AND user_id = auth.uid() 
        AND ativo = true
    )
);

CREATE POLICY "Owners and admins can update their empresa" 
ON public.empresas 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.empresa_usuarios 
        WHERE empresa_id = empresas.id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND ativo = true
    )
);

-- Políticas RLS para empresa_usuarios
CREATE POLICY "Users can view empresa_usuarios from their empresa" 
ON public.empresa_usuarios 
FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.empresa_usuarios eu2
        WHERE eu2.empresa_id = empresa_usuarios.empresa_id 
        AND eu2.user_id = auth.uid() 
        AND eu2.role IN ('owner', 'admin')
        AND eu2.ativo = true
    )
);

CREATE POLICY "System can insert empresa_usuarios" 
ON public.empresa_usuarios 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Owners and admins can update empresa_usuarios" 
ON public.empresa_usuarios 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.empresa_usuarios eu2
        WHERE eu2.empresa_id = empresa_usuarios.empresa_id 
        AND eu2.user_id = auth.uid() 
        AND eu2.role IN ('owner', 'admin')
        AND eu2.ativo = true
    )
);

-- Trigger para updated_at
CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();