-- FASE 1: Estrutura Base Multi-Empresas SaaS

-- 1. Criar enum para roles da empresa
CREATE TYPE public.empresa_role AS ENUM ('owner', 'admin');

-- 2. Criar tabela empresas
CREATE TABLE public.empresas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    ativa BOOLEAN NOT NULL DEFAULT true,
    plano TEXT DEFAULT 'basico',
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar tabela empresa_usuarios (ligação usuários <-> empresas)
CREATE TABLE public.empresa_usuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role empresa_role NOT NULL DEFAULT 'admin',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, user_id)
);

-- 4. Modificar tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN empresa_atual_id UUID REFERENCES public.empresas(id),
ADD COLUMN primeiro_acesso BOOLEAN DEFAULT true;

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para empresas
CREATE POLICY "Users can view their empresas" 
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

CREATE POLICY "Owners can update their empresa" 
ON public.empresas 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.empresa_usuarios 
        WHERE empresa_id = empresas.id 
        AND user_id = auth.uid() 
        AND role = 'owner' 
        AND ativo = true
    )
);

CREATE POLICY "Users can insert empresas" 
ON public.empresas 
FOR INSERT 
WITH CHECK (true);

-- 7. Criar políticas RLS para empresa_usuarios
CREATE POLICY "Users can view their empresa_usuarios" 
ON public.empresa_usuarios 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Owners and admins can manage empresa_usuarios" 
ON public.empresa_usuarios 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.empresa_usuarios eu 
        WHERE eu.empresa_id = empresa_usuarios.empresa_id 
        AND eu.user_id = auth.uid() 
        AND eu.role IN ('owner', 'admin') 
        AND eu.ativo = true
    )
);

-- 8. Função para obter empresa atual do usuário
CREATE OR REPLACE FUNCTION public.get_current_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT empresa_atual_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 9. Função para verificar role do usuário na empresa
CREATE OR REPLACE FUNCTION public.has_empresa_role(check_empresa_id UUID, required_role empresa_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.empresa_usuarios 
        WHERE empresa_id = check_empresa_id 
        AND user_id = auth.uid() 
        AND role = required_role 
        AND ativo = true
    );
$$;

-- 10. Função para verificar se usuário tem qualquer role na empresa
CREATE OR REPLACE FUNCTION public.has_empresa_access(check_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.empresa_usuarios 
        WHERE empresa_id = check_empresa_id 
        AND user_id = auth.uid() 
        AND ativo = true
    );
$$;

-- 11. Função para criar empresa com owner
CREATE OR REPLACE FUNCTION public.create_empresa_with_owner(
    nome_empresa TEXT,
    cnpj_empresa TEXT DEFAULT NULL,
    email_empresa TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    nova_empresa_id UUID;
    current_user_id UUID;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Criar a empresa
    INSERT INTO public.empresas (nome, cnpj, email)
    VALUES (nome_empresa, cnpj_empresa, email_empresa)
    RETURNING id INTO nova_empresa_id;

    -- Adicionar usuário como owner da empresa
    INSERT INTO public.empresa_usuarios (empresa_id, user_id, role)
    VALUES (nova_empresa_id, current_user_id, 'owner');

    -- Definir como empresa atual do usuário
    UPDATE public.profiles 
    SET empresa_atual_id = nova_empresa_id,
        primeiro_acesso = false
    WHERE user_id = current_user_id;

    RETURN nova_empresa_id;
END;
$$;

-- 12. Trigger para atualizar updated_at nas empresas
CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresa_usuarios_updated_at
    BEFORE UPDATE ON public.empresa_usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();