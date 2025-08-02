-- Ajustar a política de inserção para venda_produtos para funcionar corretamente durante edições
DROP POLICY IF EXISTS "Users can insert venda_produtos for their vendas" ON public.venda_produtos;

CREATE POLICY "Users can insert venda_produtos for their vendas" 
ON public.venda_produtos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendas 
    WHERE vendas.id = venda_produtos.venda_id 
    AND (vendas.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Fazer o mesmo para venda_servicos
DROP POLICY IF EXISTS "Users can insert venda_servicos for their vendas" ON public.venda_servicos;

CREATE POLICY "Users can insert venda_servicos for their vendas" 
ON public.venda_servicos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendas 
    WHERE vendas.id = venda_servicos.venda_id 
    AND (vendas.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);