-- ============================================
-- FIX: Permitir acesso anônimo para CRM e Chatbot
-- ============================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Permitir que usuários anônimos LEIAM leads (para o CRM sem auth)
DROP POLICY IF EXISTS "leads_anon_select" ON leads;
CREATE POLICY "leads_anon_select" ON leads
    FOR SELECT TO anon
    USING (true);

-- 2. Permitir que usuários anônimos INSIRAM leads (para o chatbot)
DROP POLICY IF EXISTS "leads_anon_insert" ON leads;
CREATE POLICY "leads_anon_insert" ON leads
    FOR INSERT TO anon
    WITH CHECK (true);

-- 3. Permitir que usuários anônimos ATUALIZEM leads
DROP POLICY IF EXISTS "leads_anon_update" ON leads;
CREATE POLICY "leads_anon_update" ON leads
    FOR UPDATE TO anon
    USING (true);

-- 4. Mesmas permissões para OPORTUNIDADES
DROP POLICY IF EXISTS "oportunidades_anon_select" ON oportunidades;
CREATE POLICY "oportunidades_anon_select" ON oportunidades
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "oportunidades_anon_insert" ON oportunidades;
CREATE POLICY "oportunidades_anon_insert" ON oportunidades
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "oportunidades_anon_update" ON oportunidades;
CREATE POLICY "oportunidades_anon_update" ON oportunidades
    FOR UPDATE TO anon
    USING (true);

-- 5. Mesmas permissões para PROPOSTAS
DROP POLICY IF EXISTS "propostas_anon_select" ON propostas;
CREATE POLICY "propostas_anon_select" ON propostas
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "propostas_anon_insert" ON propostas;
CREATE POLICY "propostas_anon_insert" ON propostas
    FOR INSERT TO anon
    WITH CHECK (true);

-- 6. Mesmas permissões para CLIENTES_INSTALADOS
DROP POLICY IF EXISTS "instalados_anon_select" ON clientes_instalados;
CREATE POLICY "instalados_anon_select" ON clientes_instalados
    FOR SELECT TO anon
    USING (true);

-- 7. Mesmas permissões para INTERACOES
DROP POLICY IF EXISTS "interacoes_anon_select" ON interacoes;
CREATE POLICY "interacoes_anon_select" ON interacoes
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "interacoes_anon_insert" ON interacoes;
CREATE POLICY "interacoes_anon_insert" ON interacoes
    FOR INSERT TO anon
    WITH CHECK (true);

-- 8. Mesmas permissões para TAREFAS
DROP POLICY IF EXISTS "tarefas_anon_select" ON tarefas;
CREATE POLICY "tarefas_anon_select" ON tarefas
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "tarefas_anon_insert" ON tarefas;
CREATE POLICY "tarefas_anon_insert" ON tarefas
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "tarefas_anon_update" ON tarefas;
CREATE POLICY "tarefas_anon_update" ON tarefas
    FOR UPDATE TO anon
    USING (true);

-- 9. Permissões para QUALIFICACAO
DROP POLICY IF EXISTS "qualificacao_anon_select" ON qualificacao;
CREATE POLICY "qualificacao_anon_select" ON qualificacao
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "qualificacao_anon_insert" ON qualificacao;
CREATE POLICY "qualificacao_anon_insert" ON qualificacao
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "qualificacao_anon_update" ON qualificacao;
CREATE POLICY "qualificacao_anon_update" ON qualificacao
    FOR UPDATE TO anon
    USING (true);

-- 10. Permissões para USERS (tabela de vendedores)
DROP POLICY IF EXISTS "users_anon_select" ON users;
CREATE POLICY "users_anon_select" ON users
    FOR SELECT TO anon
    USING (true);

-- 11. Verificar se as políticas foram criadas
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('leads', 'oportunidades', 'propostas', 'clientes_instalados', 'qualificacao')
ORDER BY tablename, policyname;
