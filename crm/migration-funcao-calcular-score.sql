-- =========================================
-- MIGRATION: Função para Calcular Lead Score
-- =========================================
-- Esta função calcula o lead_score baseado em múltiplos fatores

CREATE OR REPLACE FUNCTION calcular_lead_score(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_lead RECORD;
    v_qual RECORD;
BEGIN
    -- Buscar dados do lead
    SELECT consumo_mensal, tipo_cliente
    INTO v_lead
    FROM leads
    WHERE id = p_lead_id;

    -- Buscar dados de qualificação
    SELECT prontidao_compra, decisor, viabilidade_tecnica
    INTO v_qual
    FROM qualificacao
    WHERE lead_id = p_lead_id;

    -- Se não encontrar dados, retornar 0
    IF v_lead IS NULL THEN
        RETURN 0;
    END IF;

    -- =========================================
    -- CÁLCULO DO SCORE (0-100 pontos)
    -- =========================================

    -- 1. CONSUMO MENSAL (até 30 pontos)
    IF v_lead.consumo_mensal IS NOT NULL THEN
        IF v_lead.consumo_mensal >= 500 THEN
            v_score := v_score + 30;  -- Alto consumo
        ELSIF v_lead.consumo_mensal >= 300 THEN
            v_score := v_score + 20;  -- Médio consumo
        ELSIF v_lead.consumo_mensal >= 150 THEN
            v_score := v_score + 10;  -- Baixo consumo
        END IF;
    END IF;

    -- 2. TIPO DE CLIENTE (até 10 pontos)
    IF v_lead.tipo_cliente = 'comercial' THEN
        v_score := v_score + 10;  -- Comercial vale mais
    ELSIF v_lead.tipo_cliente = 'residencial' THEN
        v_score := v_score + 5;   -- Residencial vale menos
    END IF;

    -- 3. PRONTIDÃO DE COMPRA (até 40 pontos)
    IF v_qual.prontidao_compra IS NOT NULL THEN
        CASE v_qual.prontidao_compra
            WHEN 'imediata' THEN
                v_score := v_score + 40;
            WHEN '1-3_meses' THEN
                v_score := v_score + 30;
            WHEN '3-6_meses' THEN
                v_score := v_score + 20;
            WHEN '6-12_meses' THEN
                v_score := v_score + 10;
            WHEN 'apenas_pesquisando' THEN
                v_score := v_score + 5;
            ELSE
                v_score := v_score + 0;
        END CASE;
    END IF;

    -- 4. É DECISOR (até 20 pontos)
    IF v_qual.decisor = true THEN
        v_score := v_score + 20;
    END IF;

    -- 5. VIABILIDADE TÉCNICA (até 10 pontos)
    IF v_qual.viabilidade_tecnica = true THEN
        v_score := v_score + 10;
    END IF;

    -- Garantir que score não ultrapasse 100
    IF v_score > 100 THEN
        v_score := 100;
    END IF;

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION calcular_lead_score(UUID) IS 'Calcula o lead score (0-100) baseado em consumo, tipo de cliente, prontidão de compra, decisor e viabilidade técnica';

-- =========================================
-- RECALCULAR TODOS OS SCORES EXISTENTES
-- =========================================
DO $$
DECLARE
    v_lead RECORD;
BEGIN
    FOR v_lead IN SELECT id FROM leads LOOP
        UPDATE leads
        SET lead_score = calcular_lead_score(v_lead.id)
        WHERE id = v_lead.id;
    END LOOP;
END $$;

-- Verificar scores atualizados
SELECT
    l.nome,
    l.email,
    l.consumo_mensal,
    l.tipo_cliente,
    l.lead_score,
    l.status,
    q.prontidao_compra,
    q.decisor,
    q.viabilidade_tecnica
FROM leads l
LEFT JOIN qualificacao q ON q.lead_id = l.id
ORDER BY l.lead_score DESC
LIMIT 10;
