-- ============================================
-- MIGRATION: Corrigir RLS das tabelas restantes
-- ============================================

-- ============================================
-- 1. TABELA DOCUMENTOS
-- ============================================
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON documentos(empresa_id);

-- Migrar dados existentes
UPDATE documentos SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- Habilitar RLS
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Criar policies
CREATE POLICY "Usuários veem documentos da sua empresa"
    ON documentos FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem documentos na sua empresa"
    ON documentos FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam documentos da sua empresa"
    ON documentos FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários deletam documentos da sua empresa"
    ON documentos FOR DELETE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- ============================================
-- 2. TABELA QUALIFICACAO
-- ============================================
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
CREATE INDEX IF NOT EXISTS idx_qualificacao_empresa ON qualificacao(empresa_id);

-- Migrar dados existentes
UPDATE qualificacao SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- Habilitar RLS
ALTER TABLE qualificacao ENABLE ROW LEVEL SECURITY;

-- Criar policies
CREATE POLICY "Usuários veem qualificacao da sua empresa"
    ON qualificacao FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem qualificacao na sua empresa"
    ON qualificacao FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam qualificacao da sua empresa"
    ON qualificacao FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários deletam qualificacao da sua empresa"
    ON qualificacao FOR DELETE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- ============================================
-- 3. TABELA STATUS_NEGOCIACAO
-- ============================================
ALTER TABLE status_negociacao ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
CREATE INDEX IF NOT EXISTS idx_status_negociacao_empresa ON status_negociacao(empresa_id);

-- Migrar dados existentes
UPDATE status_negociacao SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- Habilitar RLS
ALTER TABLE status_negociacao ENABLE ROW LEVEL SECURITY;

-- Criar policies
CREATE POLICY "Usuários veem status_negociacao da sua empresa"
    ON status_negociacao FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem status_negociacao na sua empresa"
    ON status_negociacao FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam status_negociacao da sua empresa"
    ON status_negociacao FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários deletam status_negociacao da sua empresa"
    ON status_negociacao FOR DELETE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- ============================================
-- 4. TABELA USERS (se for tabela customizada, não auth.users)
-- ============================================
-- Se 'users' for uma tabela customizada (não a auth.users do Supabase)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Adicionar coluna empresa_id se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'empresa_id') THEN
            ALTER TABLE users ADD COLUMN empresa_id UUID REFERENCES empresas(id);
        END IF;

        -- Migrar dados existentes
        UPDATE users SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

        -- Habilitar RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Criar policies (usar IF NOT EXISTS para evitar erro)
        DROP POLICY IF EXISTS "Usuários veem users da sua empresa" ON users;
        CREATE POLICY "Usuários veem users da sua empresa"
            ON users FOR SELECT
            TO authenticated
            USING (empresa_id = get_user_empresa_id());

        DROP POLICY IF EXISTS "Usuários inserem users na sua empresa" ON users;
        CREATE POLICY "Usuários inserem users na sua empresa"
            ON users FOR INSERT
            TO authenticated
            WITH CHECK (empresa_id = get_user_empresa_id());

        DROP POLICY IF EXISTS "Usuários atualizam users da sua empresa" ON users;
        CREATE POLICY "Usuários atualizam users da sua empresa"
            ON users FOR UPDATE
            TO authenticated
            USING (empresa_id = get_user_empresa_id());
    END IF;
END $$;

-- ============================================
-- 5. GARANTIR QUE HISTORICO_MUDANCAS_AUTOMATICAS TEM RLS
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'historico_mudancas_automaticas') THEN
        -- Adicionar coluna empresa_id se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historico_mudancas_automaticas' AND column_name = 'empresa_id') THEN
            ALTER TABLE historico_mudancas_automaticas ADD COLUMN empresa_id UUID REFERENCES empresas(id);
        END IF;

        -- Migrar dados existentes
        UPDATE historico_mudancas_automaticas SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

        -- Habilitar RLS
        ALTER TABLE historico_mudancas_automaticas ENABLE ROW LEVEL SECURITY;

        -- Criar policies
        DROP POLICY IF EXISTS "Usuários veem historico da sua empresa" ON historico_mudancas_automaticas;
        CREATE POLICY "Usuários veem historico da sua empresa"
            ON historico_mudancas_automaticas FOR SELECT
            TO authenticated
            USING (empresa_id = get_user_empresa_id());

        DROP POLICY IF EXISTS "Usuários inserem historico na sua empresa" ON historico_mudancas_automaticas;
        CREATE POLICY "Usuários inserem historico na sua empresa"
            ON historico_mudancas_automaticas FOR INSERT
            TO authenticated
            WITH CHECK (empresa_id = get_user_empresa_id());
    END IF;
END $$;
