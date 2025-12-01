-- ============================================
-- CORREÇÃO: Ambiguidade nas funções de detecção
-- ============================================
-- Corrige erro "column reference lead_id is ambiguous"
-- ============================================

-- 1. RECRIAR FUNÇÃO detectar_leads_para_nutricao
-- ============================================

DROP FUNCTION IF EXISTS detectar_leads_para_nutricao();

CREATE OR REPLACE FUNCTION detectar_leads_para_nutricao()
RETURNS TABLE(
    lead_id UUID,
    lead_nome TEXT,
    lead_email TEXT,
    dias_sem_interacao INTEGER,
    tem_motivo_espera BOOLEAN,
    motivo TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.nome,
        l.email,
        EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        ))::INTEGER as dias,
        (l.motivo_espera IS NOT NULL AND l.motivo_espera != '') as tem_motivo,
        l.motivo_espera
    FROM leads l
    WHERE
        -- Lead qualificado
        l.status = 'qualificado'
        -- Sem interação há 7-14 dias
        AND EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        )) BETWEEN 7 AND 14
        -- Tem motivo de espera (timing errado, precisa informações, etc)
        AND l.motivo_espera IS NOT NULL
        AND l.motivo_espera != ''
        -- Não está já em nutrição
        AND l.status != 'em_nutricao';
END;
$$ LANGUAGE plpgsql;

-- 2. RECRIAR FUNÇÃO detectar_leads_perdidos
-- ============================================

DROP FUNCTION IF EXISTS detectar_leads_perdidos();

CREATE OR REPLACE FUNCTION detectar_leads_perdidos()
RETURNS TABLE(
    lead_id UUID,
    lead_nome TEXT,
    lead_email TEXT,
    dias_sem_resposta INTEGER,
    tentativas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.nome,
        l.email,
        EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        ))::INTEGER as dias,
        l.tentativas_contato
    FROM leads l
    WHERE
        -- Não está já perdido ou convertido
        l.status NOT IN ('perdido', 'convertido')
        -- Sem resposta há mais de 30 dias
        AND EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        )) >= 30
        -- Teve 3 ou mais tentativas de contato
        AND l.tentativas_contato >= 3;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TESTE
-- ============================================

-- Testar as funções corrigidas
SELECT 'detectar_leads_para_nutricao' as funcao, COUNT(*) as candidatos
FROM detectar_leads_para_nutricao()
UNION ALL
SELECT 'detectar_leads_perdidos' as funcao, COUNT(*) as candidatos
FROM detectar_leads_perdidos();

-- Executar automação
SELECT executar_automacao_leads();
