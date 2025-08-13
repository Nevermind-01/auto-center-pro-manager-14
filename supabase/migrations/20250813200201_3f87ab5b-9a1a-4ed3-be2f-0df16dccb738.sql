-- FASE 2: Migração de Dados e Adição de empresa_id

-- 1. Adicionar empresa_id em todas as tabelas principais (nullable inicialmente)
ALTER TABLE public.clientes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.produtos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.vendas ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.servicos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.categorias ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.mecanicos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.veiculos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.movimentacoes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.comissoes_mecanicos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.contas_a_pagar ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.log_movimentacoes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);

-- 2. Função para migrar dados do usuário atual para sua empresa
CREATE OR REPLACE FUNCTION public.migrate_user_data_to_empresa()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id UUID;
    empresa_id_usuario UUID;
    nome_empresa TEXT;
    email_usuario TEXT;
    resultado TEXT;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se usuário já tem empresa
    SELECT empresa_atual_id INTO empresa_id_usuario 
    FROM public.profiles 
    WHERE user_id = current_user_id;

    -- Se não tem empresa, criar uma
    IF empresa_id_usuario IS NULL THEN
        -- Obter email do usuário para nome da empresa
        SELECT email INTO email_usuario 
        FROM public.profiles 
        WHERE user_id = current_user_id;
        
        nome_empresa := COALESCE(email_usuario, 'Minha Empresa');
        
        -- Criar empresa usando função existente
        empresa_id_usuario := public.create_empresa_with_owner(nome_empresa);
        
        resultado := 'Empresa criada: ' || nome_empresa || ' (ID: ' || empresa_id_usuario || ')';
    ELSE
        resultado := 'Usuário já possui empresa (ID: ' || empresa_id_usuario || ')';
    END IF;

    -- Migrar dados existentes para a empresa
    UPDATE public.clientes SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.produtos SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.vendas SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.servicos SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.categorias SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.mecanicos SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.veiculos SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.movimentacoes SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.comissoes_mecanicos SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.contas_a_pagar SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;
    UPDATE public.log_movimentacoes SET empresa_id = empresa_id_usuario WHERE user_id = current_user_id AND empresa_id IS NULL;

    RETURN resultado;
END;
$$;