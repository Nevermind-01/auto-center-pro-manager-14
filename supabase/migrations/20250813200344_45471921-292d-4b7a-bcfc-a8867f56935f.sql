-- FASE 3: Atualização das RLS Policies para usar empresa_id

-- 1. Remover policies antigas baseadas em user_id e criar novas baseadas em empresa_id

-- CLIENTES
DROP POLICY IF EXISTS "Users can view their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can update their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can delete their own clientes" ON public.clientes;

CREATE POLICY "Users can view clientes from their empresa" 
ON public.clientes 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert clientes for their empresa" 
ON public.clientes 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update clientes from their empresa" 
ON public.clientes 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete clientes from their empresa" 
ON public.clientes 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- PRODUTOS
DROP POLICY IF EXISTS "Users can view their own produtos" ON public.produtos;
DROP POLICY IF EXISTS "Users can insert their own produtos" ON public.produtos;
DROP POLICY IF EXISTS "Users can update their own produtos" ON public.produtos;
DROP POLICY IF EXISTS "Users can delete their own produtos" ON public.produtos;

CREATE POLICY "Users can view produtos from their empresa" 
ON public.produtos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert produtos for their empresa" 
ON public.produtos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update produtos from their empresa" 
ON public.produtos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete produtos from their empresa" 
ON public.produtos 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- VENDAS
DROP POLICY IF EXISTS "Users can view their own vendas" ON public.vendas;
DROP POLICY IF EXISTS "Users can insert their own vendas" ON public.vendas;
DROP POLICY IF EXISTS "Users can update their own vendas" ON public.vendas;
DROP POLICY IF EXISTS "Users can delete their own vendas" ON public.vendas;

CREATE POLICY "Users can view vendas from their empresa" 
ON public.vendas 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert vendas for their empresa" 
ON public.vendas 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update vendas from their empresa" 
ON public.vendas 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete vendas from their empresa" 
ON public.vendas 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- SERVICOS
DROP POLICY IF EXISTS "Users can view their own servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users can insert their own servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users can update their own servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users can delete their own servicos" ON public.servicos;

CREATE POLICY "Users can view servicos from their empresa" 
ON public.servicos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert servicos for their empresa" 
ON public.servicos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update servicos from their empresa" 
ON public.servicos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete servicos from their empresa" 
ON public.servicos 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- CATEGORIAS
DROP POLICY IF EXISTS "Users can view their own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can insert their own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can update their own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can delete their own categorias" ON public.categorias;

CREATE POLICY "Users can view categorias from their empresa" 
ON public.categorias 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert categorias for their empresa" 
ON public.categorias 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update categorias from their empresa" 
ON public.categorias 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete categorias from their empresa" 
ON public.categorias 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- 2. Continuar com as demais tabelas...

-- MECANICOS
DROP POLICY IF EXISTS "Usuários podem ver seus mecânicos" ON public.mecanicos;
DROP POLICY IF EXISTS "Usuários podem criar seus mecânicos" ON public.mecanicos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus mecânicos" ON public.mecanicos;
DROP POLICY IF EXISTS "Usuários podem deletar seus mecânicos" ON public.mecanicos;

CREATE POLICY "Users can view mecanicos from their empresa" 
ON public.mecanicos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert mecanicos for their empresa" 
ON public.mecanicos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update mecanicos from their empresa" 
ON public.mecanicos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete mecanicos from their empresa" 
ON public.mecanicos 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- VEICULOS
DROP POLICY IF EXISTS "Users can view their own veiculos" ON public.veiculos;
DROP POLICY IF EXISTS "Users can insert their own veiculos" ON public.veiculos;
DROP POLICY IF EXISTS "Users can update their own veiculos" ON public.veiculos;
DROP POLICY IF EXISTS "Users can delete their own veiculos" ON public.veiculos;

CREATE POLICY "Users can view veiculos from their empresa" 
ON public.veiculos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert veiculos for their empresa" 
ON public.veiculos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update veiculos from their empresa" 
ON public.veiculos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete veiculos from their empresa" 
ON public.veiculos 
FOR DELETE 
USING (has_empresa_access(empresa_id));