-- ============================================
-- MIGRAÇÃO COMPLETA - EXECUTAR APENAS ESTE
-- ============================================
-- Contém todas as funções necessárias para automação
-- ============================================

-- LIMPAR FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS detectar_leads_para_nutricao();
DROP FUNCTION IF EXISTS detectar_leads_perdidos();
DROP FUNCTION IF EXISTS detectar_oportunidades_perdidas();
DROP FUNCTION IF EXISTS mover_para_nutricao(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS marcar_como_perdido(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS reverter_mudanca_automatica(UUID, UUID);
DROP FUNCTION IF EXISTS executar_automacao_leads();

-- ============================================
-- 1. FUNÇÃO: detectar_leads_para_nutricao
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

-- ============================================
-- 2. FUNÇÃO: detectar_leads_perdidos
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

-- ============================================
-- 3. FUNÇÃO: detectar_oportunidades_perdidas
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
-- 4. FUNÇÃO: mover_para_nutricao
-- ============================================
CREATE OR REPLACE FUNCTION mover_para_nutricao(p_lead_id UUID, p_notificar BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_lead_nome TEXT;
    v_lead_email TEXT;
    v_status_anterior VARCHAR(30);
    v_user_id UUID;
BEGIN
    SELECT nome::TEXT, email::TEXT, status, user_id
    INTO v_lead_nome, v_lead_email, v_status_anterior, v_user_id
    FROM leads WHERE id = p_lead_id;

    UPDATE leads SET status = 'em_nutricao', updated_at = NOW()
    WHERE id = p_lead_id;

    INSERT INTO historico_mudancas_automaticas (
        lead_id, tipo_mudanca, status_anterior, status_novo,
        motivo, pode_reverter
    ) VALUES (
        p_lead_id, 'auto_nutricao', v_status_anterior, 'em_nutricao',
        'Lead qualificado sem interação há 7-14 dias com motivo de espera definido', true
    );

    IF p_notificar AND v_user_id IS NOT NULL THEN
        INSERT INTO notificacoes (
            user_id, lead_id, tipo, titulo, mensagem, acao_sugerida
        ) VALUES (
            v_user_id, p_lead_id, 'auto_nutricao',
            'Lead movido para Nutrição automaticamente',
            format('O lead %s (%s) foi movido para "Em Nutrição" automaticamente após 7-14 dias sem interação. Você pode reverter esta ação.', v_lead_nome, v_lead_email),
            'reverter'
        );
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. FUNÇÃO: marcar_como_perdido
-- ============================================
CREATE OR REPLACE FUNCTION marcar_como_perdido(
    p_lead_id UUID DEFAULT NULL,
    p_oportunidade_id UUID DEFAULT NULL,
    p_notificar BOOLEAN DEFAULT true
) RETURNS BOOLEAN AS $$
DECLARE
    v_lead_nome TEXT;
    v_lead_email TEXT;
    v_status_anterior VARCHAR(30);
    v_etapa_anterior VARCHAR(30);
    v_user_id UUID;
BEGIN
    IF p_lead_id IS NOT NULL THEN
        SELECT nome::TEXT, email::TEXT, status, user_id
        INTO v_lead_nome, v_lead_email, v_status_anterior, v_user_id
        FROM leads WHERE id = p_lead_id;

        UPDATE leads SET status = 'perdido', updated_at = NOW()
        WHERE id = p_lead_id;

        INSERT INTO historico_mudancas_automaticas (
            lead_id, tipo_mudanca, status_anterior, status_novo,
            motivo, pode_reverter
        ) VALUES (
            p_lead_id, 'auto_perdido', v_status_anterior, 'perdido',
            'Lead sem resposta há 30+ dias com 3+ tentativas de contato', true
        );

        IF p_notificar AND v_user_id IS NOT NULL THEN
            INSERT INTO notificacoes (
                user_id, lead_id, tipo, titulo, mensagem, acao_sugerida
            ) VALUES (
                v_user_id, p_lead_id, 'auto_perdido',
                'Lead marcado como Perdido automaticamente',
                format('O lead %s (%s) foi marcado como "Perdido" automaticamente após 30 dias sem resposta e 3+ tentativas. Você pode reverter esta ação.', v_lead_nome, v_lead_email),
                'reverter'
            );
        END IF;
    END IF;

    IF p_oportunidade_id IS NOT NULL THEN
        SELECT l.nome::TEXT, l.email::TEXT, o.etapa, l.user_id
        INTO v_lead_nome, v_lead_email, v_etapa_anterior, v_user_id
        FROM oportunidades o
        INNER JOIN leads l ON l.id = o.lead_id
        WHERE o.id = p_oportunidade_id;

        UPDATE oportunidades SET etapa = 'perdido', data_ultima_atualizacao = NOW()
        WHERE id = p_oportunidade_id;

        INSERT INTO historico_mudancas_automaticas (
            oportunidade_id, tipo_mudanca, etapa_anterior, etapa_nova,
            motivo, pode_reverter
        ) VALUES (
            p_oportunidade_id, 'auto_perdido', v_etapa_anterior, 'perdido',
            'Oportunidade sem atualização há 60+ dias', true
        );

        IF p_notificar AND v_user_id IS NOT NULL THEN
            INSERT INTO notificacoes (
                user_id, oportunidade_id, tipo, titulo, mensagem, acao_sugerida
            ) VALUES (
                v_user_id, p_oportunidade_id, 'auto_perdido',
                'Oportunidade marcada como Perdida automaticamente',
                format('A oportunidade de %s (%s) foi marcada como "Perdida" automaticamente após 60 dias sem atualização. Você pode reverter esta ação.', v_lead_nome, v_lead_email),
                'reverter'
            );
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNÇÃO: reverter_mudanca_automatica
-- ============================================
CREATE OR REPLACE FUNCTION reverter_mudanca_automatica(p_historico_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_historico RECORD;
BEGIN
    SELECT * INTO v_historico
    FROM historico_mudancas_automaticas
    WHERE id = p_historico_id
    AND pode_reverter = true
    AND revertido = false;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mudança não encontrada ou não pode ser revertida';
    END IF;

    IF v_historico.lead_id IS NOT NULL THEN
        UPDATE leads SET status = v_historico.status_anterior, updated_at = NOW()
        WHERE id = v_historico.lead_id;
    END IF;

    IF v_historico.oportunidade_id IS NOT NULL THEN
        UPDATE oportunidades SET etapa = v_historico.etapa_anterior, data_ultima_atualizacao = NOW()
        WHERE id = v_historico.oportunidade_id;
    END IF;

    UPDATE historico_mudancas_automaticas
    SET revertido = true, revertido_em = NOW(), revertido_por = p_user_id
    WHERE id = p_historico_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNÇÃO PRINCIPAL: executar_automacao_leads
-- ============================================
CREATE OR REPLACE FUNCTION executar_automacao_leads()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
    v_leads_nutricao INTEGER := 0;
    v_leads_perdidos INTEGER := 0;
    v_oportunidades_perdidas INTEGER := 0;
    v_lead RECORD;
    v_oportunidade RECORD;
BEGIN
    -- Processar leads para nutrição
    FOR v_lead IN SELECT * FROM detectar_leads_para_nutricao() LOOP
        PERFORM mover_para_nutricao(v_lead.lead_id, true);
        v_leads_nutricao := v_leads_nutricao + 1;
    END LOOP;

    -- Processar leads perdidos
    FOR v_lead IN SELECT * FROM detectar_leads_perdidos() LOOP
        PERFORM marcar_como_perdido(p_lead_id := v_lead.lead_id, p_notificar := true);
        v_leads_perdidos := v_leads_perdidos + 1;
    END LOOP;

    -- Processar oportunidades perdidas
    FOR v_oportunidade IN SELECT * FROM detectar_oportunidades_perdidas() LOOP
        PERFORM marcar_como_perdido(p_oportunidade_id := v_oportunidade.oportunidade_id, p_notificar := true);
        v_oportunidades_perdidas := v_oportunidades_perdidas + 1;
    END LOOP;

    v_resultado := json_build_object(
        'leads_movidos_nutricao', v_leads_nutricao,
        'leads_marcados_perdido', v_leads_perdidos,
        'oportunidades_marcadas_perdido', v_oportunidades_perdidas,
        'executado_em', NOW()
    );

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TESTE AUTOMÁTICO
-- ============================================
SELECT '✅ FUNÇÕES CRIADAS COM SUCESSO!' as status;

-- Listar funções criadas
SELECT routine_name as funcao_criada
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'detectar_leads_para_nutricao',
    'detectar_leads_perdidos',
    'detectar_oportunidades_perdidas',
    'mover_para_nutricao',
    'marcar_como_perdido',
    'reverter_mudanca_automatica',
    'executar_automacao_leads'
  )
ORDER BY routine_name;

-- Testar detecções
SELECT '📊 CANDIDATOS POR TIPO:' as titulo;

SELECT 'Nutrição' as tipo, COUNT(*) as total FROM detectar_leads_para_nutricao()
UNION ALL
SELECT 'Perdido (Lead)' as tipo, COUNT(*) as total FROM detectar_leads_perdidos()
UNION ALL
SELECT 'Perdido (Oportunidade)' as tipo, COUNT(*) as total FROM detectar_oportunidades_perdidas();

-- Mostrar leads candidatos a perdido
SELECT '🔴 LEADS CANDIDATOS A PERDIDO:' as titulo;
SELECT * FROM detectar_leads_perdidos();
