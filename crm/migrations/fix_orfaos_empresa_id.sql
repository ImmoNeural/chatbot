-- =====================================================================
-- CORRECAO: linhas sem empresa_id ficam invisiveis apos o lockdown
-- =====================================================================
-- Rode DEPOIS de SECURITY_lockdown_rls.sql.
--
-- As policies de 'authenticated' usam:
--     empresa_id = get_user_empresa_id()
--
-- Em SQL, NULL = <qualquer coisa> nao e verdadeiro: e NULL. Entao toda
-- linha com empresa_id nulo deixa de aparecer para QUALQUER usuario.
-- Nao e perda de dado -- a linha continua no banco -- mas some do CRM.
--
-- Foi o caso das propostas PROP-2025-001/002/003, criadas antes do
-- add_multi_tenant.sql e nunca vinculadas a uma empresa.
--
-- Este script adota todas as linhas orfas para a empresa informada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DIAGNOSTICO - rode primeiro e veja o tamanho do problema.
--    Rode este bloco SOZINHO (o editor do Supabase so mostra o
--    resultado da ultima consulta do script).
-- ---------------------------------------------------------------------
SELECT 'leads'               AS tabela, count(*) AS orfaos FROM leads               WHERE empresa_id IS NULL
UNION ALL SELECT 'oportunidades',       count(*) FROM oportunidades       WHERE empresa_id IS NULL
UNION ALL SELECT 'propostas',           count(*) FROM propostas           WHERE empresa_id IS NULL
UNION ALL SELECT 'interacoes',          count(*) FROM interacoes          WHERE empresa_id IS NULL
UNION ALL SELECT 'tarefas',             count(*) FROM tarefas             WHERE empresa_id IS NULL
UNION ALL SELECT 'clientes_instalados', count(*) FROM clientes_instalados WHERE empresa_id IS NULL
UNION ALL SELECT 'instalacao',          count(*) FROM instalacao          WHERE empresa_id IS NULL
ORDER BY orfaos DESC;

-- ---------------------------------------------------------------------
-- 2. CORRECAO
--    Troque o UUID abaixo se a sua empresa for outra.
--    a0000000-0000-0000-0000-000000000001 = Neureka AI - Solar
-- ---------------------------------------------------------------------
BEGIN;

UPDATE leads               SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE oportunidades       SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE propostas           SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE interacoes          SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE tarefas             SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE clientes_instalados SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE instalacao          SET empresa_id = 'a0000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

COMMIT;

-- ---------------------------------------------------------------------
-- 3. CONFERENCIA - o bloco do passo 1 deve devolver 0 em tudo.
--    E a contagem por empresa deve bater com o que voce espera:
-- ---------------------------------------------------------------------
SELECT e.nome,
       (SELECT count(*) FROM leads               l WHERE l.empresa_id = e.id) AS leads,
       (SELECT count(*) FROM propostas           p WHERE p.empresa_id = e.id) AS propostas,
       (SELECT count(*) FROM oportunidades       o WHERE o.empresa_id = e.id) AS oportunidades,
       (SELECT count(*) FROM clientes_instalados c WHERE c.empresa_id = e.id) AS instalados
FROM empresas e
ORDER BY leads DESC;

-- ---------------------------------------------------------------------
-- 4. PREVENCAO
--    Faz o banco recusar proposta sem empresa. Rode so depois que o
--    passo 1 estiver zerado, senao a constraint falha na validacao.
-- ---------------------------------------------------------------------
-- ALTER TABLE propostas ALTER COLUMN empresa_id SET NOT NULL;
-- ALTER TABLE leads     ALTER COLUMN empresa_id SET NOT NULL;
