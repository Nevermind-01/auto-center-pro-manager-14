-- Padronização das Formas de Pagamento - Fase 1
-- Adicionando novos valores ao enum

-- Adicionar novos valores ao enum existente forma_pagamento
ALTER TYPE forma_pagamento ADD VALUE 'debito';
ALTER TYPE forma_pagamento ADD VALUE 'credito';
ALTER TYPE forma_pagamento ADD VALUE 'boleto';
ALTER TYPE forma_pagamento ADD VALUE 'carteira';
ALTER TYPE forma_pagamento ADD VALUE 'outros';