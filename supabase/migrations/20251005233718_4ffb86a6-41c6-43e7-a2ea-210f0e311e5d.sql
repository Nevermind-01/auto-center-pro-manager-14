-- Adicionar campo tipo_entrada na tabela pagamentos_os
ALTER TABLE pagamentos_os 
ADD COLUMN tipo_entrada TEXT DEFAULT 'pagamento_posterior';

-- Atualizar registros existentes para marcar pagamentos de finalização
-- (pagamentos que ocorreram no mesmo momento da finalização da OS)
UPDATE pagamentos_os 
SET tipo_entrada = 'finalizacao'
WHERE ABS(EXTRACT(EPOCH FROM (data_pagamento - (
  SELECT finalizado_em 
  FROM vendas 
  WHERE vendas.id = pagamentos_os.os_id
)))) < 5;