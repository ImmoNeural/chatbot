-- ============================================
-- MIGRATION: Sistema Multi-Tenant (SaaS)
-- ============================================
-- Transforma o sistema em SaaS com:
-- - Múltiplas empresas (tenants)
-- - Usuários por empresa (vendedores/admins)
-- - Isolamento de dados via RLS
-- - Rastreamento de ações
-- ============================================

-- ============================================
-- 1. TABELA DE EMPRESAS (TENANTS)
-- ============================================
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    cnpj VARCHAR(20),
    logo_url TEXT,
    plano VARCHAR(50) DEFAULT 'trial', -- trial, basic, pro, enterprise
    ativo BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}', -- Configurações específicas da empresa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_email ON empresas(email);
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON empresas(ativo);

-- ============================================
-- 2. TABELA DE USUÁRIOS (VENDEDORES/ADMINS)
-- ============================================
-- Extende o auth.users do Supabase
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    cargo VARCHAR(100), -- admin, gerente, vendedor
    avatar_url TEXT,
    ativo BOOLEAN DEFAULT true,
    permissoes JSONB DEFAULT '{}', -- Permissões específicas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- ============================================
-- 3. ADICIONAR COLUNAS NAS TABELAS EXISTENTES
-- ============================================

-- Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS atualizado_por UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_leads_empresa ON leads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_leads_usuario ON leads(usuario_id);

-- Oportunidades
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS atualizado_por UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_empresa ON oportunidades(empresa_id);

-- Propostas
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS atualizado_por UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_propostas_empresa ON propostas(empresa_id);

-- Interações
ALTER TABLE interacoes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE interacoes ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_interacoes_empresa ON interacoes(empresa_id);

-- Tarefas
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS atualizado_por UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa ON tarefas(empresa_id);

-- Clientes Instalados
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_clientes_instalados_empresa ON clientes_instalados(empresa_id);

-- Instalação (agendamentos)
ALTER TABLE instalacao ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE instalacao ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_instalacao_empresa ON instalacao(empresa_id);

-- Mensagens WhatsApp
ALTER TABLE mensagens_whatsapp ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE mensagens_whatsapp ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_empresa ON mensagens_whatsapp(empresa_id);

-- Notificações
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_empresa ON notificacoes(empresa_id);

-- ============================================
-- 4. TABELA DE LOG DE ATIVIDADES
-- ============================================
CREATE TABLE IF NOT EXISTS log_atividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL, -- criar, editar, excluir, login, etc
    entidade VARCHAR(100) NOT NULL, -- lead, oportunidade, proposta, etc
    entidade_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_atividades_empresa ON log_atividades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_log_atividades_usuario ON log_atividades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_atividades_created ON log_atividades(created_at DESC);

-- ============================================
-- 5. CRIAR EMPRESA PADRÃO E MIGRAR DADOS
-- ============================================

-- Criar empresa padrão (Neureka AI)
INSERT INTO empresas (id, nome, email, plano, ativo)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Neureka AI - Solar',
    'neurekaai@gmail.com',
    'enterprise',
    true
) ON CONFLICT (email) DO NOTHING;

-- Migrar dados existentes para a empresa padrão
UPDATE leads SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE oportunidades SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE propostas SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE interacoes SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE tarefas SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE clientes_instalados SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE instalacao SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE mensagens_whatsapp SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE notificacoes SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- ============================================
-- 6. FUNÇÃO PARA OBTER EMPRESA DO USUÁRIO ATUAL
-- ============================================
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT empresa_id
        FROM usuarios
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_instalados ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas para EMPRESAS
CREATE POLICY "Usuários veem apenas sua empresa"
    ON empresas FOR SELECT
    TO authenticated
    USING (id = get_user_empresa_id());

-- Políticas para USUARIOS
CREATE POLICY "Usuários veem apenas colegas da mesma empresa"
    ON usuarios FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Admins podem inserir usuários na sua empresa"
    ON usuarios FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Admins podem atualizar usuários na sua empresa"
    ON usuarios FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- Políticas para LEADS
DROP POLICY IF EXISTS "Permitir todas as operações para usuários autenticados" ON leads;
DROP POLICY IF EXISTS "Permitir todas as operações" ON leads;

CREATE POLICY "Usuários veem leads da sua empresa"
    ON leads FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem leads na sua empresa"
    ON leads FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam leads da sua empresa"
    ON leads FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários deletam leads da sua empresa"
    ON leads FOR DELETE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- Políticas para OPORTUNIDADES
DROP POLICY IF EXISTS "Permitir todas as operações para usuários autenticados" ON oportunidades;

CREATE POLICY "Usuários veem oportunidades da sua empresa"
    ON oportunidades FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem oportunidades na sua empresa"
    ON oportunidades FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam oportunidades da sua empresa"
    ON oportunidades FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários deletam oportunidades da sua empresa"
    ON oportunidades FOR DELETE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- Políticas para PROPOSTAS
DROP POLICY IF EXISTS "Permitir leitura de propostas para usuários autenticados" ON propostas;
DROP POLICY IF EXISTS "Permitir inserção de propostas para usuários autenticados" ON propostas;
DROP POLICY IF EXISTS "Permitir atualização de propostas para usuários autenticados" ON propostas;

CREATE POLICY "Usuários veem propostas da sua empresa"
    ON propostas FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem propostas na sua empresa"
    ON propostas FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam propostas da sua empresa"
    ON propostas FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- Políticas para INTERACOES
CREATE POLICY "Usuários veem interações da sua empresa"
    ON interacoes FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem interações na sua empresa"
    ON interacoes FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

-- Políticas para TAREFAS
CREATE POLICY "Usuários veem tarefas da sua empresa"
    ON tarefas FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem tarefas na sua empresa"
    ON tarefas FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam tarefas da sua empresa"
    ON tarefas FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- Políticas para CLIENTES_INSTALADOS
CREATE POLICY "Usuários veem clientes instalados da sua empresa"
    ON clientes_instalados FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem clientes instalados na sua empresa"
    ON clientes_instalados FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

-- Políticas para INSTALACAO
CREATE POLICY "Usuários veem instalações da sua empresa"
    ON instalacao FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem instalações na sua empresa"
    ON instalacao FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam instalações da sua empresa"
    ON instalacao FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- Políticas para MENSAGENS_WHATSAPP
DROP POLICY IF EXISTS "Permitir leitura de mensagens para usuários autenticados" ON mensagens_whatsapp;
DROP POLICY IF EXISTS "Permitir inserção de mensagens para usuários autenticados" ON mensagens_whatsapp;

CREATE POLICY "Usuários veem mensagens da sua empresa"
    ON mensagens_whatsapp FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem mensagens na sua empresa"
    ON mensagens_whatsapp FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

-- Manter políticas para service_role (Edge Functions)
CREATE POLICY "Service role tem acesso total a mensagens"
    ON mensagens_whatsapp FOR ALL
    TO service_role
    USING (true);

-- Políticas para NOTIFICACOES
CREATE POLICY "Usuários veem notificações da sua empresa"
    ON notificacoes FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem notificações na sua empresa"
    ON notificacoes FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários atualizam notificações da sua empresa"
    ON notificacoes FOR UPDATE
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- Políticas para LOG_ATIVIDADES
CREATE POLICY "Usuários veem logs da sua empresa"
    ON log_atividades FOR SELECT
    TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários inserem logs na sua empresa"
    ON log_atividades FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

-- ============================================
-- 8. TRIGGERS PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_empresas_updated_at ON empresas;
CREATE TRIGGER trigger_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON usuarios;
CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. FUNÇÃO PARA CRIAR USUÁRIO APÓS SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    -- Verificar se já existe uma empresa com este email
    SELECT id INTO v_empresa_id FROM empresas WHERE email = NEW.email;

    -- Se não existir, criar nova empresa
    IF v_empresa_id IS NULL THEN
        INSERT INTO empresas (nome, email, plano)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'nome_empresa', 'Minha Empresa'),
            NEW.email,
            'trial'
        )
        RETURNING id INTO v_empresa_id;
    END IF;

    -- Criar usuário vinculado à empresa
    INSERT INTO usuarios (id, empresa_id, nome, email, cargo)
    VALUES (
        NEW.id,
        v_empresa_id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'cargo', 'admin')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE empresas IS 'Empresas/Tenants do sistema SaaS';
COMMENT ON TABLE usuarios IS 'Usuários do sistema vinculados a empresas';
COMMENT ON TABLE log_atividades IS 'Log de todas as ações realizadas no sistema';
COMMENT ON FUNCTION get_user_empresa_id() IS 'Retorna o empresa_id do usuário logado';
