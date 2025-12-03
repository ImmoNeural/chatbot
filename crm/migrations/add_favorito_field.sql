-- ============================================
-- ADICIONAR CAMPO FAVORITO NAS OPORTUNIDADES
-- ============================================
-- Permite que vendedores marquem oportunidades como favoritas
-- ============================================

-- Adicionar coluna favorito (boolean, padrão false)
ALTER TABLE oportunidades
ADD COLUMN IF NOT EXISTS favorito BOOLEAN DEFAULT false;

-- Criar índice para facilitar filtros por favoritos
CREATE INDEX IF NOT EXISTS idx_oportunidades_favorito ON oportunidades(favorito);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'oportunidades' AND column_name = 'favorito';

-- Resultado esperado:
-- column_name | data_type | column_default | is_nullable
-- favorito    | boolean   | false          | YES
