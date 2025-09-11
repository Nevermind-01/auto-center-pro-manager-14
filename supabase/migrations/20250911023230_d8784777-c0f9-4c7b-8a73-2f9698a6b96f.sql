-- Padronização das Formas de Pagamento - Fase 2
-- Migração de dados e unificação das tabelas

-- 1. Migrar dados existentes na tabela vendas
UPDATE vendas SET forma_pagamento = 'credito'::forma_pagamento WHERE forma_pagamento = 'cartao'::forma_pagamento;
UPDATE vendas SET forma_pagamento = 'credito'::forma_pagamento WHERE forma_pagamento = 'parcelado'::forma_pagamento;

-- 2. Alterar a tabela movimentacoes_caixa para usar o mesmo enum
-- Primeiro criar uma coluna temporária
ALTER TABLE movimentacoes_caixa ADD COLUMN forma_pagamento_temp forma_pagamento;

-- Migrar os dados
UPDATE movimentacoes_caixa SET forma_pagamento_temp = (
    CASE forma_pagamento::text
        WHEN 'credito' THEN 'credito'::forma_pagamento
        WHEN 'debito' THEN 'debito'::forma_pagamento
        WHEN 'dinheiro' THEN 'dinheiro'::forma_pagamento
        WHEN 'pix' THEN 'pix'::forma_pagamento
        WHEN 'cheque' THEN 'cheque'::forma_pagamento
        WHEN 'boleto' THEN 'boleto'::forma_pagamento
        WHEN 'outros' THEN 'outros'::forma_pagamento
        ELSE 'outros'::forma_pagamento
    END
);

-- Remover a coluna antiga e renomear a nova
ALTER TABLE movimentacoes_caixa DROP COLUMN forma_pagamento;
ALTER TABLE movimentacoes_caixa RENAME COLUMN forma_pagamento_temp TO forma_pagamento;
ALTER TABLE movimentacoes_caixa ALTER COLUMN forma_pagamento SET NOT NULL;
ALTER TABLE movimentacoes_caixa ALTER COLUMN forma_pagamento SET DEFAULT 'dinheiro'::forma_pagamento;

-- 3. Remover o enum antigo
DROP TYPE IF EXISTS forma_pagamento_caixa;