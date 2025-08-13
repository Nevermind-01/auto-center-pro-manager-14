-- Continuação das RLS Policies e finalização

-- MOVIMENTACOES
DROP POLICY IF EXISTS "Users can view their own movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Users can insert their own movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Users can update their own movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Users can delete their own movimentacoes" ON public.movimentacoes;

CREATE POLICY "Users can view movimentacoes from their empresa" 
ON public.movimentacoes 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert movimentacoes for their empresa" 
ON public.movimentacoes 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update movimentacoes from their empresa" 
ON public.movimentacoes 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete movimentacoes from their empresa" 
ON public.movimentacoes 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- COMISSOES_MECANICOS
DROP POLICY IF EXISTS "Users can view their own comissoes_mecanicos" ON public.comissoes_mecanicos;
DROP POLICY IF EXISTS "Users can insert their own comissoes_mecanicos" ON public.comissoes_mecanicos;
DROP POLICY IF EXISTS "Users can update their own comissoes_mecanicos" ON public.comissoes_mecanicos;
DROP POLICY IF EXISTS "Users can delete their own comissoes_mecanicos" ON public.comissoes_mecanicos;

CREATE POLICY "Users can view comissoes_mecanicos from their empresa" 
ON public.comissoes_mecanicos 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert comissoes_mecanicos for their empresa" 
ON public.comissoes_mecanicos 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update comissoes_mecanicos from their empresa" 
ON public.comissoes_mecanicos 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete comissoes_mecanicos from their empresa" 
ON public.comissoes_mecanicos 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- CONTAS_A_PAGAR
DROP POLICY IF EXISTS "Users can view their own contas_a_pagar" ON public.contas_a_pagar;
DROP POLICY IF EXISTS "Users can insert their own contas_a_pagar" ON public.contas_a_pagar;
DROP POLICY IF EXISTS "Users can update their own contas_a_pagar" ON public.contas_a_pagar;
DROP POLICY IF EXISTS "Users can delete their own contas_a_pagar" ON public.contas_a_pagar;

CREATE POLICY "Users can view contas_a_pagar from their empresa" 
ON public.contas_a_pagar 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert contas_a_pagar for their empresa" 
ON public.contas_a_pagar 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

CREATE POLICY "Users can update contas_a_pagar from their empresa" 
ON public.contas_a_pagar 
FOR UPDATE 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can delete contas_a_pagar from their empresa" 
ON public.contas_a_pagar 
FOR DELETE 
USING (has_empresa_access(empresa_id));

-- LOG_MOVIMENTACOES
DROP POLICY IF EXISTS "Users can view their own log_movimentacoes" ON public.log_movimentacoes;
DROP POLICY IF EXISTS "Users can insert their own log_movimentacoes" ON public.log_movimentacoes;
DROP POLICY IF EXISTS "Admins can manage all log_movimentacoes" ON public.log_movimentacoes;

CREATE POLICY "Users can view log_movimentacoes from their empresa" 
ON public.log_movimentacoes 
FOR SELECT 
USING (has_empresa_access(empresa_id));

CREATE POLICY "Users can insert log_movimentacoes for their empresa" 
ON public.log_movimentacoes 
FOR INSERT 
WITH CHECK (empresa_id = get_current_empresa_id());

-- Atualizar políticas das tabelas de relacionamento vendas
DROP POLICY IF EXISTS "Users can view venda_produtos for their vendas" ON public.venda_produtos;
DROP POLICY IF EXISTS "Users can insert venda_produtos for their vendas" ON public.venda_produtos;
DROP POLICY IF EXISTS "Users can update venda_produtos for their vendas" ON public.venda_produtos;
DROP POLICY IF EXISTS "Users can delete venda_produtos for their vendas" ON public.venda_produtos;

CREATE POLICY "Users can view venda_produtos from their empresa" 
ON public.venda_produtos 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_produtos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);

CREATE POLICY "Users can insert venda_produtos for their empresa" 
ON public.venda_produtos 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_produtos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);

CREATE POLICY "Users can update venda_produtos from their empresa" 
ON public.venda_produtos 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_produtos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);

CREATE POLICY "Users can delete venda_produtos from their empresa" 
ON public.venda_produtos 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_produtos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);

-- VENDA_SERVICOS
DROP POLICY IF EXISTS "Users can view venda_servicos for their vendas" ON public.venda_servicos;
DROP POLICY IF EXISTS "Users can insert venda_servicos for their vendas" ON public.venda_servicos;
DROP POLICY IF EXISTS "Users can update venda_servicos for their vendas" ON public.venda_servicos;
DROP POLICY IF EXISTS "Users can delete venda_servicos for their vendas" ON public.venda_servicos;

CREATE POLICY "Users can view venda_servicos from their empresa" 
ON public.venda_servicos 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_servicos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);

CREATE POLICY "Users can insert venda_servicos for their empresa" 
ON public.venda_servicos 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_servicos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);

CREATE POLICY "Users can update venda_servicos from their empresa" 
ON public.venda_servicos 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_servicos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);

CREATE POLICY "Users can delete venda_servicos from their empresa" 
ON public.venda_servicos 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.vendas 
        WHERE vendas.id = venda_servicos.venda_id 
        AND has_empresa_access(vendas.empresa_id)
    )
);