-- Corrigir recursão infinita nas políticas RLS da tabela empresa_usuarios

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can view their empresa_usuarios" ON public.empresa_usuarios;
DROP POLICY IF EXISTS "Owners and admins can manage empresa_usuarios" ON public.empresa_usuarios;

-- Recriar políticas sem recursão
CREATE POLICY "Users can view their own empresa_usuarios"
ON public.empresa_usuarios
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Owners and admins can view all empresa_usuarios for their empresa"
ON public.empresa_usuarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu2
    WHERE eu2.empresa_id = empresa_usuarios.empresa_id
    AND eu2.user_id = auth.uid()
    AND eu2.role IN ('owner', 'admin')
    AND eu2.ativo = true
  )
);

CREATE POLICY "Owners and admins can insert empresa_usuarios"
ON public.empresa_usuarios
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu2
    WHERE eu2.empresa_id = empresa_usuarios.empresa_id
    AND eu2.user_id = auth.uid()
    AND eu2.role IN ('owner', 'admin')
    AND eu2.ativo = true
  )
);

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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu2
    WHERE eu2.empresa_id = empresa_usuarios.empresa_id
    AND eu2.user_id = auth.uid()
    AND eu2.role IN ('owner', 'admin')
    AND eu2.ativo = true
  )
);

CREATE POLICY "Owners can delete empresa_usuarios"
ON public.empresa_usuarios
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu2
    WHERE eu2.empresa_id = empresa_usuarios.empresa_id
    AND eu2.user_id = auth.uid()
    AND eu2.role = 'owner'
    AND eu2.ativo = true
  )
);