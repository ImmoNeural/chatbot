-- Adicionar 'concluida' à constraint de etapa em oportunidades
-- Primeiro remover a constraint existente, depois recriar com o novo valor

-- Remover constraint antiga
ALTER TABLE oportunidades DROP CONSTRAINT IF EXISTS oportunidades_etapa_check;

-- Recriar constraint incluindo 'concluida'
ALTER TABLE oportunidades ADD CONSTRAINT oportunidades_etapa_check
CHECK (etapa IN ('levantamento', 'simulacao', 'proposta', 'negociacao', 'fechamento', 'concluida'));

-- Verificar
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'oportunidades'::regclass AND contype = 'c';
