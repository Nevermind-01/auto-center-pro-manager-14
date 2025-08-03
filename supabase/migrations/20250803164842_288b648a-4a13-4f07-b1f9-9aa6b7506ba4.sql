-- Atualizar constraint para aceitar apenas os tipos válidos de log
ALTER TABLE log_movimentacoes 
ADD CONSTRAINT check_tipo_valido 
CHECK (tipo IN ('criacao', 'edicao', 'cancelamento', 'finalizacao'));