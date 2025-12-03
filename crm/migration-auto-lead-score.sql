-- =========================================
-- MIGRATION: Cálculo Automático de Lead Score
-- =========================================
-- Este script cria triggers para calcular automaticamente
-- o lead_score sempre que os dados relevantes mudarem

-- =========================================
-- 1. Trigger Function: Atualizar Lead Score
-- =========================================
CREATE OR REPLACE FUNCTION trigger_atualizar_lead_score()
RETURNS TRIGGER AS $$
DECLARE
    v_lead_id UUID;
    v_novo_score INTEGER;
BEGIN
    -- Determinar qual lead_id usar baseado na tabela
    IF TG_TABLE_NAME = 'leads' THEN
        v_lead_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'qualificacao' THEN
        v_lead_id := NEW.lead_id;
    END IF;

    -- Calcular novo score usando a função existente
    v_novo_score := calcular_lead_score(v_lead_id);

    -- Atualizar o lead_score na tabela leads
    UPDATE leads
    SET lead_score = v_novo_score
    WHERE id = v_lead_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 2. Trigger na tabela LEADS
-- =========================================
-- Recalcula score quando consumo_mensal ou tipo_cliente mudar
DROP TRIGGER IF EXISTS trigger_leads_atualizar_score ON leads;

CREATE TRIGGER trigger_leads_atualizar_score
    AFTER INSERT OR UPDATE OF consumo_mensal, tipo_cliente ON leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_lead_score();

-- =========================================
-- 3. Trigger na tabela QUALIFICACAO
-- =========================================
-- Recalcula score quando dados de qualificação mudarem
DROP TRIGGER IF EXISTS trigger_qualificacao_atualizar_score ON qualificacao;

CREATE TRIGGER trigger_qualificacao_atualizar_score
    AFTER INSERT OR UPDATE OF prontidao_compra, decisor, viabilidade_tecnica ON qualificacao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_lead_score();

-- =========================================
-- 4. RECALCULAR SCORES EXISTENTES
-- =========================================
-- Atualizar o score de todos os leads existentes
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

-- =========================================
-- VERIFICAÇÃO
-- =========================================
-- Ver os scores atualizados
SELECT
    id,
    nome,
    email,
    tipo_cliente,
    consumo_mensal,
    lead_score,
    status
FROM leads
ORDER BY lead_score DESC
LIMIT 10;

-- Comentários
COMMENT ON FUNCTION trigger_atualizar_lead_score() IS 'Trigger function que recalcula automaticamente o lead_score quando dados relevantes mudam';
