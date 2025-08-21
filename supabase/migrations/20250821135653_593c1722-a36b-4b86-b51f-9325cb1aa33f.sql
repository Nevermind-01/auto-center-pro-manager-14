-- Remove the current permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update vendas from their empresa" ON public.vendas;

-- Create new restrictive UPDATE policy that only allows editing pending OS
CREATE POLICY "Users can update only pending vendas from their empresa" 
ON public.vendas 
FOR UPDATE 
USING (has_empresa_access(empresa_id) AND status = 'pendente')
WITH CHECK (has_empresa_access(empresa_id));