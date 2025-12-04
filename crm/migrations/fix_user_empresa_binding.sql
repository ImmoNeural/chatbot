-- ============================================
-- FIX: Vincular usuário existente à empresa
-- ============================================

-- 1. Verificar se o usuário existe no auth.users
-- SELECT * FROM auth.users WHERE email = 'neurekaai@gmail.com';

-- 2. Verificar se existe na tabela usuarios
-- SELECT * FROM usuarios WHERE email = 'neurekaai@gmail.com';

-- 3. Verificar se a empresa existe
-- SELECT * FROM empresas WHERE email = 'neurekaai@gmail.com';

-- ============================================
-- CORREÇÃO: Criar/atualizar vínculos
-- ============================================

-- Garantir que a empresa padrão existe
INSERT INTO empresas (id, nome, email, plano, ativo)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Neureka AI - Solar',
    'neurekaai@gmail.com',
    'enterprise',
    true
) ON CONFLICT (email) DO UPDATE SET
    id = 'a0000000-0000-0000-0000-000000000001',
    nome = 'Neureka AI - Solar',
    plano = 'enterprise',
    ativo = true;

-- Vincular usuário do auth à tabela usuarios (se existir no auth)
INSERT INTO usuarios (id, empresa_id, nome, email, cargo, ativo)
SELECT
    id,
    'a0000000-0000-0000-0000-000000000001',
    COALESCE(raw_user_meta_data->>'nome', 'Administrador'),
    email,
    'admin',
    true
FROM auth.users
WHERE email = 'neurekaai@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    empresa_id = 'a0000000-0000-0000-0000-000000000001',
    cargo = 'admin',
    ativo = true;

-- ============================================
-- CORREÇÃO: Garantir que todos os dados existentes
-- estão vinculados à empresa padrão
-- ============================================
UPDATE leads SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE oportunidades SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE propostas SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE interacoes SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE tarefas SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE clientes_instalados SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE instalacao SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE mensagens_whatsapp SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE notificacoes SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- Atualizar tabelas extras se existirem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'empresa_id') THEN
        UPDATE documentos SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qualificacao' AND column_name = 'empresa_id') THEN
        UPDATE qualificacao SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'status_negociacao' AND column_name = 'empresa_id') THEN
        UPDATE status_negociacao SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'empresa_id') THEN
        UPDATE users SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO: Conferir se está tudo certo
-- ============================================
-- Execute separadamente para verificar:

-- SELECT 'empresas' as tabela, COUNT(*) as total FROM empresas;
-- SELECT 'usuarios' as tabela, COUNT(*) as total FROM usuarios;
-- SELECT 'leads' as tabela, COUNT(*) as total, COUNT(empresa_id) as com_empresa FROM leads;

-- Verificar usuário específico:
-- SELECT u.*, e.nome as empresa_nome
-- FROM usuarios u
-- JOIN empresas e ON u.empresa_id = e.id
-- WHERE u.email = 'neurekaai@gmail.com';
