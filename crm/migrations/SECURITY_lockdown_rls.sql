-- =====================================================================
-- SEGURANCA: Fecha o acesso anonimo irrestrito ao CRM
-- =====================================================================
-- CONTEXTO DO PROBLEMA
-- A chave 'anon' do Supabase e publica por design: ela esta embutida no
-- JavaScript que roda no navegador de qualquer visitante e, neste projeto,
-- tambem esta num repositorio publico no GitHub. Esconder a chave nao
-- protege nada. O que protege os dados e o Row Level Security (RLS).
--
-- A migration anterior (fix_rls_permitir_anon.sql) criou policies com
-- USING (true) para o papel 'anon' em leads, qualificacao, oportunidades,
-- propostas, clientes_instalados, interacoes, tarefas e users. Com isso,
-- qualquer pessoa que tivesse a chave publica podia LER e ALTERAR todos
-- os leads, propostas e clientes instalados de todas as empresas.
--
-- O QUE ESTA MIGRATION FAZ
-- Aplica privilegio minimo: remove TODAS as policies das tabelas do CRM
-- e reconstroi apenas o necessario.
--
--   anon (visitante nao logado)........: SOMENTE INSERT de leads e
--                                        qualificacao (o chatbot precisa).
--                                        Nenhuma leitura. Nenhum UPDATE.
--   authenticated (usuario logado).....: acesso completo, restrito aos
--                                        dados da propria empresa via
--                                        get_user_empresa_id().
--   proposta publica (link com token)..: via funcoes SECURITY DEFINER,
--                                        que entregam UMA proposta pelo
--                                        token, sem expor a tabela.
--
-- IMPORTANTE: depois de aplicar isto, o CRM EXIGE LOGIN. Isso e
-- intencional: nao existe forma de um CRM ler todos os leads com uma
-- chave publica e ao mesmo tempo esses leads ficarem protegidos.
--
-- COMO APLICAR
-- Supabase Dashboard > SQL Editor > cole este arquivo inteiro > Run.
-- E idempotente: pode rodar novamente sem problema.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Helper de empresa do usuario logado
--    SET search_path e obrigatorio em SECURITY DEFINER: sem isso um
--    schema malicioso no search_path do chamador pode sequestrar a
--    resolucao dos nomes de tabela dentro da funcao.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT empresa_id FROM usuarios WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION get_user_empresa_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_user_empresa_id() TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Limpeza total: remove TODAS as policies das tabelas do CRM.
--    Necessario porque varias migrations anteriores criaram policies
--    com nomes diferentes, alem de policies sem clausula TO (que valem
--    para PUBLIC e portanto tambem para anon).
--    Tambem liga RLS em cada tabela que existir.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    t            text;
    pol          record;
    tabelas_crm  text[] := ARRAY[
        'empresas', 'usuarios', 'users', 'leads', 'qualificacao',
        'oportunidades', 'propostas', 'interacoes', 'tarefas',
        'clientes_instalados', 'instalacao', 'mensagens_whatsapp',
        'notificacoes', 'log_atividades'
    ];
BEGIN
    FOREACH t IN ARRAY tabelas_crm LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = t
        ) THEN
            RAISE NOTICE 'Tabela %.% nao existe - ignorando', 'public', t;
            CONTINUE;
        END IF;

        FOR pol IN
            SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                           pol.policyname, t);
        END LOOP;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Sem nenhuma policy, RLS nega tudo por padrao. As policies
        -- desejadas sao recriadas nas secoes 3 e 4.
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 3. ANON: apenas o que o chatbot precisa para criar um lead.
--    Nenhum SELECT, nenhum UPDATE, nenhum DELETE em nenhuma tabela.
-- ---------------------------------------------------------------------

-- 3.1 Inserir lead novo. Exige empresa_id valido para que o lead nasca
--     dentro de uma empresa real e apareca para o dono certo.
CREATE POLICY "anon_insert_lead_chatbot" ON public.leads
    FOR INSERT TO anon
    WITH CHECK (
        empresa_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.empresas e
            WHERE e.id = leads.empresa_id AND e.ativo = true
        )
    );

-- 3.2 Inserir a qualificacao do lead recem-criado, amarrada a um lead
--     que exista. Sem isso o funil do chatbot nao consegue gravar as
--     respostas (consumo, telhado, etc.).
CREATE POLICY "anon_insert_qualificacao_chatbot" ON public.qualificacao
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = qualificacao.lead_id
        )
    );

-- 3.3 Privilegios de tabela (camada independente do RLS). Mesmo que uma
--     policy futura seja criada por engano, sem GRANT o anon nao le nada.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT INSERT ON public.leads        TO anon;
GRANT INSERT ON public.qualificacao TO anon;

-- ---------------------------------------------------------------------
-- 4. AUTHENTICATED: acesso completo, isolado por empresa.
-- ---------------------------------------------------------------------

-- 4.1 Empresas / usuarios
CREATE POLICY "auth_select_propria_empresa" ON public.empresas
    FOR SELECT TO authenticated
    USING (id = get_user_empresa_id());

CREATE POLICY "auth_select_colegas" ON public.usuarios
    FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id());

CREATE POLICY "auth_update_proprio_perfil" ON public.usuarios
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND empresa_id = get_user_empresa_id());

-- 4.2 Tabelas com empresa_id: acesso total dentro da propria empresa.
DO $$
DECLARE
    t text;
    tabelas_empresa text[] := ARRAY[
        'leads', 'oportunidades', 'propostas', 'interacoes', 'tarefas',
        'clientes_instalados', 'instalacao', 'mensagens_whatsapp',
        'notificacoes', 'log_atividades'
    ];
BEGIN
    FOREACH t IN ARRAY tabelas_empresa LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = t
        ) THEN
            CONTINUE;
        END IF;

        -- A coluna empresa_id vem de add_multi_tenant.sql. Se faltar,
        -- avisa alto em vez de criar uma policy que nao isola nada.
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = t
              AND column_name = 'empresa_id'
        ) THEN
            RAISE WARNING 'ATENCAO: %.% sem coluna empresa_id. Rode add_multi_tenant.sql antes. Tabela ficou SEM acesso.', 'public', t;
            CONTINUE;
        END IF;

        EXECUTE format($f$
            CREATE POLICY "auth_rw_empresa" ON public.%I
                FOR ALL TO authenticated
                USING (empresa_id = get_user_empresa_id())
                WITH CHECK (empresa_id = get_user_empresa_id())
        $f$, t);

        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    END LOOP;
END $$;

-- 4.3 qualificacao nao tem empresa_id: isola pelo lead ao qual pertence.
CREATE POLICY "auth_rw_qualificacao" ON public.qualificacao
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = qualificacao.lead_id
              AND l.empresa_id = get_user_empresa_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = qualificacao.lead_id
              AND l.empresa_id = get_user_empresa_id()
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualificacao TO authenticated;
GRANT SELECT ON public.empresas TO authenticated;
GRANT SELECT, UPDATE ON public.usuarios TO authenticated;

-- 4.4 Tabela legada 'users' (do schema.sql original). Fica sem policy
--     para anon; leitura apenas para usuario logado.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='users') THEN
        EXECUTE 'CREATE POLICY "auth_select_users" ON public.users
                 FOR SELECT TO authenticated USING (true)';
        EXECUTE 'GRANT SELECT ON public.users TO authenticated';
    END IF;
END $$;

COMMIT;

-- =====================================================================
-- 5. VERIFICACAO
--    Rode os blocos abaixo depois do COMMIT e confira o resultado.
-- =====================================================================

-- 5.1 O anon NAO deve aparecer com cmd 'SELECT', 'UPDATE', 'DELETE' nem
--     'ALL' aqui. O esperado sao exatamente 2 linhas, ambas INSERT,
--     em leads e qualificacao.
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND 'anon' = ANY(roles)
ORDER BY tablename, cmd;

-- 5.2 Privilegios diretos do anon. Esperado: apenas INSERT em leads e
--     qualificacao. Qualquer SELECT nesta lista e um vazamento.
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- 5.3 Toda tabela do CRM deve ter rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('empresas','usuarios','users','leads','qualificacao',
                    'oportunidades','propostas','interacoes','tarefas',
                    'clientes_instalados','instalacao','mensagens_whatsapp',
                    'notificacoes','log_atividades')
ORDER BY tablename;
