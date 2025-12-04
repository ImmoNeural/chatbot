-- ============================================
-- FIX: Corrigir trigger handle_new_user
-- ============================================

-- Primeiro, remover o trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Criar função corrigida com tratamento de erros
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_empresa_id UUID;
    v_empresa_nome TEXT;
BEGIN
    -- Log para debug
    RAISE NOTICE 'handle_new_user: Processing user %', NEW.email;

    -- Obter nome da empresa dos metadados ou usar padrão
    v_empresa_nome := COALESCE(
        NEW.raw_user_meta_data->>'nome_empresa',
        'Empresa de ' || split_part(NEW.email, '@', 1)
    );

    -- Verificar se já existe uma empresa com este email
    SELECT id INTO v_empresa_id
    FROM empresas
    WHERE email = NEW.email;

    -- Se não existir, criar nova empresa
    IF v_empresa_id IS NULL THEN
        BEGIN
            INSERT INTO empresas (nome, email, plano, ativo)
            VALUES (v_empresa_nome, NEW.email, 'trial', true)
            RETURNING id INTO v_empresa_id;

            RAISE NOTICE 'handle_new_user: Created empresa % with id %', v_empresa_nome, v_empresa_id;
        EXCEPTION WHEN OTHERS THEN
            -- Se falhar ao criar empresa, usar a empresa padrão
            SELECT id INTO v_empresa_id
            FROM empresas
            WHERE email = 'neurekaai@gmail.com';

            -- Se nem a empresa padrão existir, criar uma
            IF v_empresa_id IS NULL THEN
                INSERT INTO empresas (nome, email, plano, ativo)
                VALUES ('Empresa Padrão', 'default@sistema.com', 'trial', true)
                RETURNING id INTO v_empresa_id;
            END IF;

            RAISE NOTICE 'handle_new_user: Using fallback empresa %', v_empresa_id;
        END;
    END IF;

    -- Criar usuário vinculado à empresa
    BEGIN
        INSERT INTO usuarios (id, empresa_id, nome, email, cargo, ativo)
        VALUES (
            NEW.id,
            v_empresa_id,
            COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'cargo', 'admin'),
            true
        );

        RAISE NOTICE 'handle_new_user: Created usuario for %', NEW.email;
    EXCEPTION WHEN unique_violation THEN
        -- Usuário já existe, ignorar
        RAISE NOTICE 'handle_new_user: Usuario already exists for %', NEW.email;
    WHEN OTHERS THEN
        -- Log do erro mas não falha (permite o signup continuar)
        RAISE WARNING 'handle_new_user: Error creating usuario: %', SQLERRM;
    END;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Em caso de qualquer erro, log mas não impede o signup
    RAISE WARNING 'handle_new_user: Unexpected error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verificar se a tabela empresas existe e tem a estrutura correta
DO $$
BEGIN
    -- Verificar se a tabela empresas existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas') THEN
        CREATE TABLE empresas (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            telefone VARCHAR(50),
            cnpj VARCHAR(20),
            logo_url TEXT,
            plano VARCHAR(50) DEFAULT 'trial',
            ativo BOOLEAN DEFAULT true,
            config JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created empresas table';
    END IF;

    -- Verificar se a tabela usuarios existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        CREATE TABLE usuarios (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            telefone VARCHAR(50),
            cargo VARCHAR(100),
            avatar_url TEXT,
            ativo BOOLEAN DEFAULT true,
            permissoes JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created usuarios table';
    END IF;
END $$;

-- Garantir que a empresa padrão existe
INSERT INTO empresas (id, nome, email, plano, ativo)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Neureka AI - Solar',
    'neurekaai@gmail.com',
    'enterprise',
    true
) ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    plano = EXCLUDED.plano;

-- Dar permissões necessárias
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON empresas TO authenticated;
GRANT ALL ON usuarios TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
