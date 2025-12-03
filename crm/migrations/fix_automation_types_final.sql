-- ============================================
-- CORREÇÃO FINAL: Usar tipos compatíveis
-- ============================================
-- Usa CAST para garantir compatibilidade de tipos
-- ============================================

-- 1. DELETAR FUNÇÕES ANTIGAS
-- ============================================

DROP FUNCTION IF EXISTS detectar_leads_para_nutricao();
DROP FUNCTION IF EXISTS detectar_leads_perdidos();
DROP FUNCTION IF EXISTS detectar_oportunidades_perdidas();

-- 2. FUNÇÃO detectar_leads_para_nutricao (com CAST)
-- ============================================

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
        l.nome::TEXT,
        l.email::TEXT,
        EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        ))::INTEGER as dias,
        (l.motivo_espera IS NOT NULL AND l.motivo_espera != '') as tem_motivo,
        l.motivo_espera
    FROM leads l
    WHERE
        l.status = 'qualificado'
        AND EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        )) BETWEEN 7 AND 14
        AND l.motivo_espera IS NOT NULL
        AND l.motivo_espera != ''
        AND l.status != 'em_nutricao';
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO detectar_leads_perdidos (com CAST)
-- ============================================

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
        l.nome::TEXT,
        l.email::TEXT,
        EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        ))::INTEGER as dias,
        l.tentativas_contato
    FROM leads l
    WHERE
        l.status NOT IN ('perdido', 'convertido')
        AND EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(i.created_at) FROM interacoes i WHERE i.lead_id = l.id),
            l.created_at
        )) >= 30
        AND l.tentativas_contato >= 3;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO detectar_oportunidades_perdidas
-- ============================================

CREATE OR REPLACE FUNCTION detectar_oportunidades_perdidas()
RETURNS TABLE(
    oportunidade_id UUID,
    lead_id UUID,
    lead_nome TEXT,
    etapa_atual VARCHAR(30),
    dias_sem_atualizacao INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.lead_id,
        l.nome::TEXT,
        o.etapa,
        EXTRACT(DAY FROM NOW() - o.data_ultima_atualizacao)::INTEGER as dias
    FROM oportunidades o
    INNER JOIN leads l ON l.id = o.lead_id
    WHERE
        o.etapa NOT IN ('perdido', 'concluida')
        AND EXTRACT(DAY FROM NOW() - o.data_ultima_atualizacao) >= 60;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TESTE IMEDIATO
-- ============================================

-- Ver se as funções foram criadas
SELECT 'Funções criadas com sucesso!' as status;

-- Testar detecção de leads para nutrição
SELECT 'detectar_leads_para_nutricao' as funcao, COUNT(*) as candidatos
FROM detectar_leads_para_nutricao();

-- Testar detecção de leads perdidos
SELECT 'detectar_leads_perdidos' as funcao, COUNT(*) as candidatos
FROM detectar_leads_perdidos();

-- Testar detecção de oportunidades perdidas
SELECT 'detectar_oportunidades_perdidas' as funcao, COUNT(*) as candidatos
FROM detectar_oportunidades_perdidas();

-- Ver candidatos reais
SELECT * FROM detectar_leads_perdidos();
