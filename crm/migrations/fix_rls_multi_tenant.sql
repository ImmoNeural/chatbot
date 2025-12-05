-- ============================================
-- FIX: Corrigir isolamento multi-tenant (RLS)
-- ============================================
-- Este script garante que cada empresa só veja seus próprios dados

-- 1. Verificar e corrigir a função get_user_empresa_id
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    -- Tentar obter empresa_id do usuário atual na tabela usuarios
    SELECT empresa_id INTO v_empresa_id
    FROM usuarios
    WHERE id = auth.uid();

    -- Se não encontrou, tentar pela tabela de empresas via email
    IF v_empresa_id IS NULL THEN
        SELECT e.id INTO v_empresa_id
        FROM empresas e
        WHERE e.email = (SELECT email FROM auth.users WHERE id = auth.uid());
    END IF;

    RETURN v_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Garantir que RLS está habilitado em todas as tabelas
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

-- 3. Remover políticas antigas que podem estar permitindo acesso total
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover políticas que permitem tudo em leads
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'leads' AND policyname LIKE '%todas%' OR policyname LIKE '%all%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON leads', r.policyname);
    END LOOP;
END $$;

-- 4. Recriar políticas para LEADS (drop e create para garantir)
DROP POLICY IF EXISTS "Usuários veem leads da sua empresa" ON leads;
DROP POLICY IF EXISTS "Usuários inserem leads na sua empresa" ON leads;
DROP POLICY IF EXISTS "Usuários atualizam leads da sua empresa" ON leads;
DROP POLICY IF EXISTS "Usuários deletam leads da sua empresa" ON leads;
DROP POLICY IF EXISTS "leads_select_policy" ON leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;

CREATE POLICY "leads_select_policy" ON leads
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "leads_insert_policy" ON leads
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "leads_update_policy" ON leads
    FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "leads_delete_policy" ON leads
    FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- 5. Recriar políticas para OPORTUNIDADES
DROP POLICY IF EXISTS "Usuários veem oportunidades da sua empresa" ON oportunidades;
DROP POLICY IF EXISTS "Usuários inserem oportunidades na sua empresa" ON oportunidades;
DROP POLICY IF EXISTS "Usuários atualizam oportunidades da sua empresa" ON oportunidades;
DROP POLICY IF EXISTS "Usuários deletam oportunidades da sua empresa" ON oportunidades;
DROP POLICY IF EXISTS "oportunidades_select_policy" ON oportunidades;
DROP POLICY IF EXISTS "oportunidades_insert_policy" ON oportunidades;
DROP POLICY IF EXISTS "oportunidades_update_policy" ON oportunidades;
DROP POLICY IF EXISTS "oportunidades_delete_policy" ON oportunidades;

CREATE POLICY "oportunidades_select_policy" ON oportunidades
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "oportunidades_insert_policy" ON oportunidades
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "oportunidades_update_policy" ON oportunidades
    FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "oportunidades_delete_policy" ON oportunidades
    FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- 6. Recriar políticas para INTERACOES
DROP POLICY IF EXISTS "Usuários veem interações da sua empresa" ON interacoes;
DROP POLICY IF EXISTS "Usuários inserem interações na sua empresa" ON interacoes;
DROP POLICY IF EXISTS "interacoes_select_policy" ON interacoes;
DROP POLICY IF EXISTS "interacoes_insert_policy" ON interacoes;
DROP POLICY IF EXISTS "interacoes_update_policy" ON interacoes;
DROP POLICY IF EXISTS "interacoes_delete_policy" ON interacoes;

CREATE POLICY "interacoes_select_policy" ON interacoes
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "interacoes_insert_policy" ON interacoes
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "interacoes_update_policy" ON interacoes
    FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "interacoes_delete_policy" ON interacoes
    FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- 7. Recriar políticas para MENSAGENS_WHATSAPP
DROP POLICY IF EXISTS "Usuários veem mensagens da sua empresa" ON mensagens_whatsapp;
DROP POLICY IF EXISTS "Usuários inserem mensagens na sua empresa" ON mensagens_whatsapp;
DROP POLICY IF EXISTS "mensagens_whatsapp_select_policy" ON mensagens_whatsapp;
DROP POLICY IF EXISTS "mensagens_whatsapp_insert_policy" ON mensagens_whatsapp;
DROP POLICY IF EXISTS "mensagens_whatsapp_update_policy" ON mensagens_whatsapp;

CREATE POLICY "mensagens_whatsapp_select_policy" ON mensagens_whatsapp
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "mensagens_whatsapp_insert_policy" ON mensagens_whatsapp
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "mensagens_whatsapp_update_policy" ON mensagens_whatsapp
    FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- 8. Adicionar empresa_id na tabela conversas_sessoes
ALTER TABLE conversas_sessoes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
CREATE INDEX IF NOT EXISTS idx_conversas_sessoes_empresa ON conversas_sessoes(empresa_id);

-- Habilitar RLS na conversas_sessoes
ALTER TABLE conversas_sessoes ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas_sessoes
DROP POLICY IF EXISTS "conversas_sessoes_select_policy" ON conversas_sessoes;
DROP POLICY IF EXISTS "conversas_sessoes_insert_policy" ON conversas_sessoes;
DROP POLICY IF EXISTS "conversas_sessoes_update_policy" ON conversas_sessoes;
DROP POLICY IF EXISTS "conversas_sessoes_delete_policy" ON conversas_sessoes;

CREATE POLICY "conversas_sessoes_select_policy" ON conversas_sessoes
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "conversas_sessoes_insert_policy" ON conversas_sessoes
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "conversas_sessoes_update_policy" ON conversas_sessoes
    FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "conversas_sessoes_delete_policy" ON conversas_sessoes
    FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- 9. Recriar políticas para TAREFAS
DROP POLICY IF EXISTS "Usuários veem tarefas da sua empresa" ON tarefas;
DROP POLICY IF EXISTS "Usuários inserem tarefas na sua empresa" ON tarefas;
DROP POLICY IF EXISTS "Usuários atualizam tarefas da sua empresa" ON tarefas;
DROP POLICY IF EXISTS "Usuários deletam tarefas da sua empresa" ON tarefas;
DROP POLICY IF EXISTS "tarefas_select_policy" ON tarefas;
DROP POLICY IF EXISTS "tarefas_insert_policy" ON tarefas;
DROP POLICY IF EXISTS "tarefas_update_policy" ON tarefas;
DROP POLICY IF EXISTS "tarefas_delete_policy" ON tarefas;

CREATE POLICY "tarefas_select_policy" ON tarefas
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "tarefas_insert_policy" ON tarefas
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "tarefas_update_policy" ON tarefas
    FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "tarefas_delete_policy" ON tarefas
    FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- 10. Recriar políticas para PROPOSTAS
DROP POLICY IF EXISTS "Usuários veem propostas da sua empresa" ON propostas;
DROP POLICY IF EXISTS "Usuários inserem propostas na sua empresa" ON propostas;
DROP POLICY IF EXISTS "Usuários atualizam propostas da sua empresa" ON propostas;
DROP POLICY IF EXISTS "propostas_select_policy" ON propostas;
DROP POLICY IF EXISTS "propostas_insert_policy" ON propostas;
DROP POLICY IF EXISTS "propostas_update_policy" ON propostas;

CREATE POLICY "propostas_select_policy" ON propostas
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "propostas_insert_policy" ON propostas
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "propostas_update_policy" ON propostas
    FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id());

-- 11. Função para debug - verificar empresa do usuário atual
CREATE OR REPLACE FUNCTION debug_current_user_empresa()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    empresa_id UUID,
    empresa_nome TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        auth.uid() as user_id,
        (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email,
        get_user_empresa_id() as empresa_id,
        (SELECT nome FROM empresas WHERE id = get_user_empresa_id()) as empresa_nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Comentário informativo
COMMENT ON FUNCTION get_user_empresa_id() IS 'Retorna o empresa_id do usuário logado para uso nas políticas RLS';
COMMENT ON FUNCTION debug_current_user_empresa() IS 'Função para debug - mostra empresa do usuário atual';
