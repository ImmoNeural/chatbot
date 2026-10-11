-- =====================================================================
-- CORRECAO: todo INSERT do CRM parou depois do lockdown de RLS
-- =====================================================================
-- Rode DEPOIS de SECURITY_lockdown_rls.sql. Pode rodar mais de uma vez.
--
-- O QUE QUEBROU
-- -------------
-- O lockdown isola cada tabela por empresa com:
--
--     CREATE POLICY "auth_rw_empresa" ON public.<tabela>
--         FOR ALL TO authenticated
--         USING      (empresa_id = get_user_empresa_id())
--         WITH CHECK (empresa_id = get_user_empresa_id());
--
-- A clausula WITH CHECK vale para INSERT e UPDATE. Em SQL, NULL = <uuid>
-- nao e falso: e NULL -- e o Postgres so aceita a linha quando a checagem
-- e verdadeira. Resultado: qualquer INSERT que nao preencha empresa_id e
-- recusado com
--
--     new row violates row-level security policy for table "propostas"
--
-- O CRM nunca preenchia esse campo (ele nasceu antes do multi-tenant),
-- entao depois do lockdown parou TODA criacao: lead novo, tarefa,
-- interacao, proposta gerada pelo simulador, cliente instalado.
--
-- O crm-v2.js agora carimba empresa_id em todo insert. Este script e a
-- segunda camada, no banco: vale para o chatbot, para os outros scripts
-- da pasta, para o SQL Editor e para qualquer integracao futura, que nao
-- tem como lembrar de um campo que nao aparece em nenhum formulario.
--
-- COMO DECIDE A EMPRESA
-- ---------------------
--   1. empresa_id ja veio preenchido -> respeita.
--   2. usuario logado (authenticated) -> a empresa do proprio usuario.
--   3. usuario logado SEM empresa em public.usuarios -> levanta excecao.
--      Nao chuta uma empresa: chutar aqui significaria gravar o dado de
--      um cliente dentro de outro inquilino do sistema.
--   4. anon (o chatbot do site) -> a empresa padrao ativa.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Empresa padrao para quem chega sem login (chatbot).
--    Prefere o UUID historico; se ele nao existir, cai na empresa ativa
--    mais antiga, para nao depender de um id escrito na mao.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.empresa_padrao()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT id FROM public.empresas
     WHERE ativo = true
     ORDER BY (id <> 'a0000000-0000-0000-0000-000000000001'), created_at, id
     LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.empresa_padrao() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.empresa_padrao() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. O gatilho.
--    SECURITY DEFINER porque le public.usuarios, que o anon nao pode
--    ler -- e e justamente o anon do chatbot que mais precisa dele.
--    SET search_path e obrigatorio em SECURITY DEFINER: sem isso, um
--    schema plantado no search_path do chamador sequestra a resolucao
--    dos nomes de tabela dentro da funcao.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preencher_empresa_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_empresa uuid;
BEGIN
    IF NEW.empresa_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NOT NULL THEN
        SELECT empresa_id INTO v_empresa
          FROM public.usuarios
         WHERE id = auth.uid();

        IF v_empresa IS NULL THEN
            RAISE EXCEPTION
                'Usuario % nao esta vinculado a nenhuma empresa em public.usuarios. '
                'Rode crm/migrations/fix_user_empresa_binding.sql antes de gravar dados.',
                auth.uid()
              USING ERRCODE = 'check_violation';
        END IF;
    ELSE
        -- Sem login: e o chatbot publico. Vai para a empresa padrao.
        v_empresa := public.empresa_padrao();

        IF v_empresa IS NULL THEN
            RAISE EXCEPTION
                'Nenhuma empresa ativa cadastrada em public.empresas.'
              USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    NEW.empresa_id := v_empresa;
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. Instala em TODA tabela do schema public que tenha empresa_id.
--    Descobrir pelo catalogo em vez de listar na mao: assim uma tabela
--    criada depois deste script ja nasce coberta quando ele for rodado
--    de novo, e nenhuma lista fica desatualizada em silencio.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT c.table_name
          FROM information_schema.columns c
          JOIN pg_tables p
            ON p.schemaname = c.table_schema AND p.tablename = c.table_name
         WHERE c.table_schema = 'public'
           AND c.column_name  = 'empresa_id'
         ORDER BY c.table_name
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_preencher_empresa_id ON public.%I', t);
        EXECUTE format($f$
            CREATE TRIGGER trg_preencher_empresa_id
                BEFORE INSERT ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.preencher_empresa_id()
        $f$, t);
        RAISE NOTICE 'gatilho instalado em public.%', t;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. O gatilho antigo de leads sai de cena.
--    fix_leads_empresa_id_trigger.sql gravava a empresa padrao com o
--    UUID escrito na mao, inclusive para usuario logado de OUTRA
--    empresa -- o lead ia para o inquilino errado. Como ele e BEFORE
--    INSERT igual ao novo, os dois rodariam em ordem alfabetica de nome
--    e o resultado dependeria disso.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_set_lead_empresa_id ON public.leads;

COMMIT;

-- =====================================================================
-- 5. VERIFICACAO -- rode cada bloco separado (o editor do Supabase so
--    mostra o resultado da ultima consulta do script).
-- =====================================================================

-- 5.1 Em quais tabelas o gatilho ficou:
--
-- SELECT event_object_table AS tabela, action_timing, event_manipulation
--   FROM information_schema.triggers
--  WHERE trigger_name = 'trg_preencher_empresa_id'
--  ORDER BY tabela;

-- 5.2 Teste real: logado no CRM, crie uma tarefa pela tela. Antes disto
--     o console mostrava "new row violates row-level security policy".
--     Pelo SQL Editor o teste NAO vale -- lá você roda como service
--     role, que ignora RLS e nunca viu este problema.

-- 5.3 Ainda ha linha orfa de antes da correcao? Se houver, rode
--     fix_orfaos_empresa_id.sql: linha com empresa_id nulo nao aparece
--     para ninguem.
--
-- SELECT 'leads' AS tabela, count(*) AS orfaos FROM leads WHERE empresa_id IS NULL
-- UNION ALL SELECT 'oportunidades',       count(*) FROM oportunidades       WHERE empresa_id IS NULL
-- UNION ALL SELECT 'propostas',           count(*) FROM propostas           WHERE empresa_id IS NULL
-- UNION ALL SELECT 'interacoes',          count(*) FROM interacoes          WHERE empresa_id IS NULL
-- UNION ALL SELECT 'tarefas',             count(*) FROM tarefas             WHERE empresa_id IS NULL
-- UNION ALL SELECT 'clientes_instalados', count(*) FROM clientes_instalados WHERE empresa_id IS NULL
-- ORDER BY orfaos DESC;
