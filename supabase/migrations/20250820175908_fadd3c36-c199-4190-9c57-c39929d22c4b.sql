-- Correção completa: constraint de log e recursão infinita nas RLS policies

-- 1. CORRIGIR CONSTRAINT DA TABELA log_movimentacoes
-- Primeiro, remover a constraint existente se existir
ALTER TABLE public.log_movimentacoes DROP CONSTRAINT IF EXISTS check_tipo_valido;

-- Adicionar nova constraint com os tipos corretos que a função RPC usa
ALTER TABLE public.log_movimentacoes ADD CONSTRAINT check_tipo_valido 
CHECK (tipo IN ('OS_CRIADA', 'OS_FINALIZADA', 'ESTOQUE_BAIXADO', 'COMISSAO_REGISTRADA', 'criacao', 'edicao', 'cancelamento', 'finalizacao'));

-- 2. RESOLVER RECURSÃO INFINITA NAS POLÍTICAS RLS
-- Remover todas as políticas problemáticas da tabela empresa_usuarios
DROP POLICY IF EXISTS "Owners and admins can view all empresa_usuarios in their empres" ON public.empresa_usuarios;
DROP POLICY IF EXISTS "Owners and admins can update empresa_usuarios in their empresa" ON public.empresa_usuarios;
DROP POLICY IF EXISTS "Users can view their own empresa_usuarios records" ON public.empresa_usuarios;
DROP POLICY IF EXISTS "System can insert empresa_usuarios" ON public.empresa_usuarios;

-- 3. CRIAR FUNÇÃO SECURITY DEFINER PARA VERIFICAR PERMISSÕES SEM RECURSÃO
CREATE OR REPLACE FUNCTION public.is_empresa_owner_or_admin(check_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_usuarios
    WHERE empresa_id = check_empresa_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin') 
    AND ativo = true
  );
$$;

-- 4. RECRIAR POLÍTICAS RLS SEM RECURSÃO
-- Política para usuários verem seus próprios registros
CREATE POLICY "Users can view their own empresa_usuarios records" 
ON public.empresa_usuarios 
FOR SELECT 
USING (user_id = auth.uid());

-- Política para owners e admins verem todos os registros da empresa (usando função security definer)
CREATE POLICY "Owners and admins can view empresa_usuarios" 
ON public.empresa_usuarios 
FOR SELECT 
USING (public.is_empresa_owner_or_admin(empresa_id));

-- Política para owners e admins atualizarem registros da empresa
CREATE POLICY "Owners and admins can update empresa_usuarios" 
ON public.empresa_usuarios 
FOR UPDATE 
USING (public.is_empresa_owner_or_admin(empresa_id));

-- Política para inserção (sistema/funções)
CREATE POLICY "System can insert empresa_usuarios" 
ON public.empresa_usuarios 
FOR INSERT 
WITH CHECK (true);

-- 5. MELHORAR A FUNÇÃO get_current_empresa_id PARA SER MAIS ROBUSTA
CREATE OR REPLACE FUNCTION public.get_current_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    empresa_atual uuid;
    primeira_empresa uuid;
    current_user_id uuid;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Primeiro tentar pegar a empresa atual do perfil
    SELECT empresa_atual_id INTO empresa_atual 
    FROM public.profiles 
    WHERE user_id = current_user_id;
    
    -- Se encontrou empresa atual válida, retornar
    IF empresa_atual IS NOT NULL THEN
        -- Verificar se o usuário ainda tem acesso a esta empresa
        IF EXISTS (
            SELECT 1 FROM public.empresa_usuarios 
            WHERE empresa_id = empresa_atual 
            AND user_id = current_user_id 
            AND ativo = true
        ) THEN
            RETURN empresa_atual;
        END IF;
    END IF;
    
    -- Se não tem empresa atual ou perdeu acesso, pegar a primeira empresa ativa
    SELECT empresa_id INTO primeira_empresa
    FROM public.empresa_usuarios 
    WHERE user_id = current_user_id 
    AND ativo = true 
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Se encontrou uma empresa, atualizar o perfil
    IF primeira_empresa IS NOT NULL THEN
        UPDATE public.profiles 
        SET empresa_atual_id = primeira_empresa
        WHERE user_id = current_user_id;
        
        RETURN primeira_empresa;
    END IF;
    
    -- Se não encontrou nenhuma empresa, retornar NULL
    RETURN NULL;
END;
$$;

-- 6. GARANTIR QUE A FUNÇÃO RPC FUNCIONE CORRETAMENTE
-- Verificar se existe e recriar se necessário a função de trigger para empresa_id
CREATE OR REPLACE FUNCTION public.set_empresa_id_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Para INSERT: sempre definir empresa_id com base no usuário atual
    IF TG_OP = 'INSERT' THEN
        NEW.empresa_id := public.get_current_empresa_id();
        RETURN NEW;
    END IF;
    
    -- Para UPDATE: preservar empresa_id original (não permitir mudança)
    IF TG_OP = 'UPDATE' THEN
        NEW.empresa_id := OLD.empresa_id;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- 7. GARANTIR QUE OS TRIGGERS ESTEJAM CONFIGURADOS CORRETAMENTE
-- Trigger para log_movimentacoes
DROP TRIGGER IF EXISTS set_empresa_id_trigger ON public.log_movimentacoes;
CREATE TRIGGER set_empresa_id_trigger
    BEFORE INSERT OR UPDATE ON public.log_movimentacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();

-- Trigger para outras tabelas importantes
DROP TRIGGER IF EXISTS set_empresa_id_trigger ON public.vendas;
CREATE TRIGGER set_empresa_id_trigger
    BEFORE INSERT OR UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();

DROP TRIGGER IF EXISTS set_empresa_id_trigger ON public.venda_produtos;
CREATE TRIGGER set_empresa_id_trigger
    BEFORE INSERT OR UPDATE ON public.venda_produtos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();

DROP TRIGGER IF EXISTS set_empresa_id_trigger ON public.venda_servicos;
CREATE TRIGGER set_empresa_id_trigger
    BEFORE INSERT OR UPDATE ON public.venda_servicos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();

DROP TRIGGER IF EXISTS set_empresa_id_trigger ON public.comissoes_mecanicos;
CREATE TRIGGER set_empresa_id_trigger
    BEFORE INSERT OR UPDATE ON public.comissoes_mecanicos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();

DROP TRIGGER IF EXISTS set_empresa_id_trigger ON public.movimentacoes;
CREATE TRIGGER set_empresa_id_trigger
    BEFORE INSERT OR UPDATE ON public.movimentacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_empresa_id_trigger();