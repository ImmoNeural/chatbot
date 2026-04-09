-- =========================================
-- ATUALIZAR DATAS PARA APARECER NO DASHBOARD
-- Execute este script no Supabase SQL Editor
-- https://supabase.com/dashboard/project/zralzmgsdmwispfvgqvy/sql
-- =========================================

-- Data atual para referencia
-- Script atualiza todas as datas para os ultimos 30 dias

-- =========================================
-- 1. ATUALIZAR LEADS
-- Distribui os leads nos ultimos 30 dias
-- =========================================
UPDATE leads SET
    created_at = NOW() - (random() * INTERVAL '30 days'),
    updated_at = NOW() - (random() * INTERVAL '7 days')
WHERE created_at < NOW() - INTERVAL '30 days';

-- =========================================
-- 2. ATUALIZAR QUALIFICACAO
-- =========================================
UPDATE qualificacao SET
    created_at = NOW() - (random() * INTERVAL '25 days'),
    updated_at = NOW() - (random() * INTERVAL '5 days')
WHERE created_at < NOW() - INTERVAL '30 days';

-- =========================================
-- 3. ATUALIZAR OPORTUNIDADES
-- Datas recentes e previsao de fechamento no futuro proximo
-- =========================================
UPDATE oportunidades SET
    created_at = NOW() - (random() * INTERVAL '20 days'),
    updated_at = NOW() - (random() * INTERVAL '3 days'),
    data_ultima_atualizacao = NOW() - (random() * INTERVAL '5 days'),
    data_previsao_fechamento = CURRENT_DATE + (random() * 30)::integer
WHERE created_at < NOW() - INTERVAL '30 days';

-- =========================================
-- 4. ATUALIZAR PROPOSTAS
-- =========================================
UPDATE propostas SET
    created_at = NOW() - (random() * INTERVAL '15 days'),
    updated_at = NOW() - (random() * INTERVAL '3 days'),
    data_validade = CURRENT_DATE + 30,
    data_geracao = CURRENT_DATE - (random() * 10)::integer
WHERE created_at < NOW() - INTERVAL '30 days';

-- =========================================
-- 5. ATUALIZAR INTERACOES
-- Distribuir nos ultimos 14 dias
-- =========================================
UPDATE interacoes SET
    created_at = NOW() - (random() * INTERVAL '14 days')
WHERE created_at < NOW() - INTERVAL '30 days';

-- =========================================
-- 6. ATUALIZAR TAREFAS
-- =========================================
UPDATE tarefas SET
    created_at = NOW() - (random() * INTERVAL '14 days'),
    data_vencimento = CURRENT_DATE + (random() * 14)::integer
WHERE created_at < NOW() - INTERVAL '30 days';

-- =========================================
-- 7. ATUALIZAR CLIENTES INSTALADOS
-- =========================================
UPDATE clientes_instalados SET
    created_at = NOW() - (random() * INTERVAL '60 days'),
    data_instalacao = CURRENT_DATE - (random() * 45)::integer,
    data_ativacao = CURRENT_DATE - (random() * 40)::integer
WHERE created_at < NOW() - INTERVAL '90 days';

-- =========================================
-- 8. ATUALIZAR CONVERSAS SESSOES (se existir)
-- =========================================
UPDATE conversas_sessoes SET
    created_at = NOW() - (random() * INTERVAL '10 days'),
    iniciada_em = NOW() - (random() * INTERVAL '10 days')
WHERE created_at < NOW() - INTERVAL '30 days';

-- =========================================
-- 9. ATUALIZAR USERS (data de criacao)
-- =========================================
UPDATE users SET
    created_at = NOW() - INTERVAL '60 days',
    updated_at = NOW() - (random() * INTERVAL '7 days')
WHERE created_at < NOW() - INTERVAL '90 days';

-- =========================================
-- VERIFICAR RESULTADOS
-- =========================================
SELECT 'Leads' as tabela, COUNT(*) as total, MIN(created_at) as mais_antigo, MAX(created_at) as mais_recente FROM leads
UNION ALL
SELECT 'Oportunidades', COUNT(*), MIN(created_at), MAX(created_at) FROM oportunidades
UNION ALL
SELECT 'Propostas', COUNT(*), MIN(created_at), MAX(created_at) FROM propostas
UNION ALL
SELECT 'Interacoes', COUNT(*), MIN(created_at), MAX(created_at) FROM interacoes;
