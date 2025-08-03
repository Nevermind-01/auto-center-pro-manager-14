-- Atualizar registros com tipos combinados para os tipos válidos
UPDATE log_movimentacoes 
SET tipo = 'finalizacao' 
WHERE tipo IN ('criacao_finalizacao', 'edicao_finalizacao');

-- Agora adicionar a constraint para aceitar apenas os tipos válidos
ALTER TABLE log_movimentacoes 
ADD CONSTRAINT check_tipo_valido 
CHECK (tipo IN ('criacao', 'edicao', 'cancelamento', 'finalizacao'));