-- Adicionar coluna forma_pagamento na tabela movimentacoes_carteira
ALTER TABLE public.movimentacoes_carteira 
ADD COLUMN forma_pagamento text DEFAULT 'Crédito Carteira';

-- Atualizar registros existentes para ter uma forma de pagamento padrão
UPDATE public.movimentacoes_carteira 
SET forma_pagamento = CASE 
    WHEN tipo = 'credito' AND descricao LIKE '%Pagamento OS%' THEN 'Dinheiro'
    WHEN tipo = 'credito' THEN 'Crédito Carteira'
    WHEN tipo = 'debito' THEN 'Carteira'
    ELSE 'Crédito Carteira'
END
WHERE forma_pagamento IS NULL OR forma_pagamento = 'Crédito Carteira';