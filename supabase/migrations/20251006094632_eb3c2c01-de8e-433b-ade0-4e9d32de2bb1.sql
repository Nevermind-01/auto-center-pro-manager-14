-- Corrigir registros de finalização que estão marcados incorretamente como pagamento_posterior
-- Atualiza apenas registros que foram criados na finalização (dentro de 30 segundos da finalização da OS)
UPDATE pagamentos_os
SET tipo_entrada = 'finalizacao'
WHERE tipo_entrada = 'pagamento_posterior'
  AND ABS(EXTRACT(EPOCH FROM (
    data_pagamento - (
      SELECT finalizado_em 
      FROM vendas 
      WHERE vendas.id = pagamentos_os.os_id
    )
  ))) < 30;