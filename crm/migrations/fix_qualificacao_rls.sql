-- =====================================================
-- CORREÇÃO RLS PARA TABELA QUALIFICACAO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar se a coluna empresa_id existe, se não, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'qualificacao' AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE qualificacao ADD COLUMN empresa_id UUID REFERENCES empresas(id);
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela qualificacao';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe na tabela qualificacao';
    END IF;
END $$;

-- 2. Atualizar registros existentes para ter o empresa_id do lead associado
UPDATE qualificacao q
SET empresa_id = l.empresa_id
FROM leads l
WHERE q.lead_id = l.id
AND q.empresa_id IS NULL;

-- 3. Remover políticas antigas da tabela qualificacao
DROP POLICY IF EXISTS "Allow authenticated select" ON qualificacao;
DROP POLICY IF EXISTS "Allow authenticated insert" ON qualificacao;
DROP POLICY IF EXISTS "Allow authenticated update" ON qualificacao;
DROP POLICY IF EXISTS "Allow authenticated delete" ON qualificacao;
DROP POLICY IF EXISTS "qualificacao_select_policy" ON qualificacao;
DROP POLICY IF EXISTS "qualificacao_insert_policy" ON qualificacao;
DROP POLICY IF EXISTS "qualificacao_update_policy" ON qualificacao;
DROP POLICY IF EXISTS "qualificacao_delete_policy" ON qualificacao;

-- 4. Habilitar RLS na tabela
ALTER TABLE qualificacao ENABLE ROW LEVEL SECURITY;

-- 5. Criar novas políticas RLS baseadas em empresa_id
CREATE POLICY "qualificacao_select_empresa" ON qualificacao
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "qualificacao_insert_empresa" ON qualificacao
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "qualificacao_update_empresa" ON qualificacao
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "qualificacao_delete_empresa" ON qualificacao
    FOR DELETE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- 6. Fazer o mesmo para a tabela interacoes (caso também tenha problema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'interacoes' AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE interacoes ADD COLUMN empresa_id UUID REFERENCES empresas(id);
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela interacoes';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe na tabela interacoes';
    END IF;
END $$;

-- 7. Atualizar registros existentes de interacoes
UPDATE interacoes i
SET empresa_id = l.empresa_id
FROM leads l
WHERE i.lead_id = l.id
AND i.empresa_id IS NULL;

-- 8. Remover políticas antigas da tabela interacoes
DROP POLICY IF EXISTS "Allow authenticated select" ON interacoes;
DROP POLICY IF EXISTS "Allow authenticated insert" ON interacoes;
DROP POLICY IF EXISTS "Allow authenticated update" ON interacoes;
DROP POLICY IF EXISTS "Allow authenticated delete" ON interacoes;
DROP POLICY IF EXISTS "interacoes_select_policy" ON interacoes;
DROP POLICY IF EXISTS "interacoes_insert_policy" ON interacoes;
DROP POLICY IF EXISTS "interacoes_update_policy" ON interacoes;
DROP POLICY IF EXISTS "interacoes_delete_policy" ON interacoes;

-- 9. Habilitar RLS na tabela interacoes
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;

-- 10. Criar novas políticas RLS para interacoes
CREATE POLICY "interacoes_select_empresa" ON interacoes
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "interacoes_insert_empresa" ON interacoes
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "interacoes_update_empresa" ON interacoes
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "interacoes_delete_empresa" ON interacoes
    FOR DELETE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- 11. Verificar resultado
SELECT 'qualificacao' as tabela, count(*) as registros_sem_empresa
FROM qualificacao WHERE empresa_id IS NULL
UNION ALL
SELECT 'interacoes' as tabela, count(*) as registros_sem_empresa
FROM interacoes WHERE empresa_id IS NULL;
