-- ============================================
-- SISTEMA DE AUTOMAÇÃO DE LEADS
-- ============================================
-- Implementa auto-nutrição e auto-perdido com notificações
-- ============================================

-- 1. ADICIONAR CAMPOS NA TABELA LEADS
-- ============================================

-- Campo para armazenar motivo de espera (timing errado, precisa informações, etc)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS motivo_espera TEXT;

-- Data quando o cliente estará pronto (ex: quando vai construir a casa)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS data_prevista_retorno DATE;

-- Contador de tentativas de contato sem resposta
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS tentativas_contato INTEGER DEFAULT 0;

-- Data da última tentativa de contato
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS data_ultima_tentativa TIMESTAMP WITH TIME ZONE;

-- 2. CRIAR TABELA DE NOTIFICAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('auto_nutricao', 'auto_perdido', 'alerta_inatividade', 'retomar_contato')),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    acao_sugerida VARCHAR(50), -- 'mover_nutricao', 'marcar_perdido', etc
    lida BOOLEAN DEFAULT false,
    respondida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lead ON notificacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created ON notificacoes(created_at);

-- 3. CRIAR TABELA DE HISTÓRICO DE MUDANÇAS AUTOMÁTICAS
-- ============================================

CREATE TABLE IF NOT EXISTS historico_mudancas_automaticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
    tipo_mudanca VARCHAR(50) NOT NULL CHECK (tipo_mudanca IN ('auto_nutricao', 'auto_perdido', 'reversao')),
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30),
    etapa_anterior VARCHAR(30),
    etapa_nova VARCHAR(30),
    motivo TEXT,
    pode_reverter BOOLEAN DEFAULT true,
    revertido BOOLEAN DEFAULT false,
    revertido_em TIMESTAMP WITH TIME ZONE,
    revertido_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historico_lead ON historico_mudancas_automaticas(lead_id);
CREATE INDEX IF NOT EXISTS idx_historico_oportunidade ON historico_mudancas_automaticas(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_historico_revertido ON historico_mudancas_automaticas(revertido);

-- 4. FUNÇÃO PARA DETECTAR LEADS PARA NUTRIÇÃO
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
        l.nome,
        l.email,
        EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id),
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
            (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id),
            l.created_at
        )) BETWEEN 7 AND 14
        -- Tem motivo de espera (timing errado, precisa informações, etc)
        AND l.motivo_espera IS NOT NULL
        AND l.motivo_espera != ''
        -- Não está já em nutrição
        AND l.status != 'em_nutricao';
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO PARA DETECTAR LEADS PERDIDOS
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
        l.nome,
        l.email,
        EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id),
            l.created_at
        ))::INTEGER as dias,
        l.tentativas_contato
    FROM leads l
    WHERE
        -- Não está já perdido ou convertido
        l.status NOT IN ('perdido', 'convertido')
        -- Sem resposta há mais de 30 dias
        AND EXTRACT(DAY FROM NOW() - COALESCE(
            (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id),
            l.created_at
        )) >= 30
        -- Teve 3 ou mais tentativas de contato
        AND l.tentativas_contato >= 3;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA DETECTAR OPORTUNIDADES PERDIDAS
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
        l.nome,
        o.etapa,
        EXTRACT(DAY FROM NOW() - o.data_ultima_atualizacao)::INTEGER as dias
    FROM oportunidades o
    INNER JOIN leads l ON l.id = o.lead_id
    WHERE
        -- Não está já perdida ou concluída
        o.etapa NOT IN ('perdido', 'concluida')
        -- Sem atualização há mais de 60 dias
        AND EXTRACT(DAY FROM NOW() - o.data_ultima_atualizacao) >= 60;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA MOVER LEAD PARA NUTRIÇÃO (COM NOTIFICAÇÃO)
-- ============================================

CREATE OR REPLACE FUNCTION mover_para_nutricao(p_lead_id UUID, p_notificar BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_lead_nome TEXT;
    v_lead_email TEXT;
    v_status_anterior VARCHAR(30);
    v_user_id UUID;
BEGIN
    -- Buscar dados do lead
    SELECT nome, email, status, user_id
    INTO v_lead_nome, v_lead_email, v_status_anterior, v_user_id
    FROM leads
    WHERE id = p_lead_id;

    -- Atualizar status
    UPDATE leads
    SET status = 'em_nutricao',
        updated_at = NOW()
    WHERE id = p_lead_id;

    -- Registrar no histórico
    INSERT INTO historico_mudancas_automaticas (
        lead_id,
        tipo_mudanca,
        status_anterior,
        status_novo,
        motivo,
        pode_reverter
    ) VALUES (
        p_lead_id,
        'auto_nutricao',
        v_status_anterior,
        'em_nutricao',
        'Lead qualificado sem interação há 7-14 dias com motivo de espera definido',
        true
    );

    -- Criar notificação se solicitado
    IF p_notificar AND v_user_id IS NOT NULL THEN
        INSERT INTO notificacoes (
            user_id,
            lead_id,
            tipo,
            titulo,
            mensagem,
            acao_sugerida
        ) VALUES (
            v_user_id,
            p_lead_id,
            'auto_nutricao',
            'Lead movido para Nutrição automaticamente',
            format('O lead %s (%s) foi movido para "Em Nutrição" automaticamente após 7-14 dias sem interação. Você pode reverter esta ação.', v_lead_nome, v_lead_email),
            'reverter'
        );
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO PARA MARCAR COMO PERDIDO (COM NOTIFICAÇÃO)
-- ============================================

CREATE OR REPLACE FUNCTION marcar_como_perdido(
    p_lead_id UUID DEFAULT NULL,
    p_oportunidade_id UUID DEFAULT NULL,
    p_notificar BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
    v_lead_nome TEXT;
    v_lead_email TEXT;
    v_status_anterior VARCHAR(30);
    v_etapa_anterior VARCHAR(30);
    v_user_id UUID;
BEGIN
    -- Se for lead
    IF p_lead_id IS NOT NULL THEN
        -- Buscar dados do lead
        SELECT nome, email, status, user_id
        INTO v_lead_nome, v_lead_email, v_status_anterior, v_user_id
        FROM leads
        WHERE id = p_lead_id;

        -- Atualizar status
        UPDATE leads
        SET status = 'perdido',
            updated_at = NOW()
        WHERE id = p_lead_id;

        -- Registrar no histórico
        INSERT INTO historico_mudancas_automaticas (
            lead_id,
            tipo_mudanca,
            status_anterior,
            status_novo,
            motivo,
            pode_reverter
        ) VALUES (
            p_lead_id,
            'auto_perdido',
            v_status_anterior,
            'perdido',
            'Lead sem resposta há 30+ dias com 3+ tentativas de contato',
            true
        );

        -- Criar notificação
        IF p_notificar AND v_user_id IS NOT NULL THEN
            INSERT INTO notificacoes (
                user_id,
                lead_id,
                tipo,
                titulo,
                mensagem,
                acao_sugerida
            ) VALUES (
                v_user_id,
                p_lead_id,
                'auto_perdido',
                'Lead marcado como Perdido automaticamente',
                format('O lead %s (%s) foi marcado como "Perdido" automaticamente após 30 dias sem resposta e 3+ tentativas. Você pode reverter esta ação.', v_lead_nome, v_lead_email),
                'reverter'
            );
        END IF;
    END IF;

    -- Se for oportunidade
    IF p_oportunidade_id IS NOT NULL THEN
        -- Buscar dados
        SELECT l.nome, l.email, o.etapa, l.user_id
        INTO v_lead_nome, v_lead_email, v_etapa_anterior, v_user_id
        FROM oportunidades o
        INNER JOIN leads l ON l.id = o.lead_id
        WHERE o.id = p_oportunidade_id;

        -- Atualizar etapa
        UPDATE oportunidades
        SET etapa = 'perdido',
            data_ultima_atualizacao = NOW()
        WHERE id = p_oportunidade_id;

        -- Registrar no histórico
        INSERT INTO historico_mudancas_automaticas (
            oportunidade_id,
            tipo_mudanca,
            etapa_anterior,
            etapa_nova,
            motivo,
            pode_reverter
        ) VALUES (
            p_oportunidade_id,
            'auto_perdido',
            v_etapa_anterior,
            'perdido',
            'Oportunidade sem atualização há 60+ dias',
            true
        );

        -- Criar notificação
        IF p_notificar AND v_user_id IS NOT NULL THEN
            INSERT INTO notificacoes (
                user_id,
                oportunidade_id,
                tipo,
                titulo,
                mensagem,
                acao_sugerida
            ) VALUES (
                v_user_id,
                p_oportunidade_id,
                'auto_perdido',
                'Oportunidade marcada como Perdida automaticamente',
                format('A oportunidade de %s (%s) foi marcada como "Perdida" automaticamente após 60 dias sem atualização. Você pode reverter esta ação.', v_lead_nome, v_lead_email),
                'reverter'
            );
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA REVERTER MUDANÇA AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION reverter_mudanca_automatica(p_historico_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_historico RECORD;
BEGIN
    -- Buscar registro do histórico
    SELECT * INTO v_historico
    FROM historico_mudancas_automaticas
    WHERE id = p_historico_id
    AND pode_reverter = true
    AND revertido = false;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mudança não encontrada ou não pode ser revertida';
    END IF;

    -- Reverter lead
    IF v_historico.lead_id IS NOT NULL THEN
        UPDATE leads
        SET status = v_historico.status_anterior,
            updated_at = NOW()
        WHERE id = v_historico.lead_id;
    END IF;

    -- Reverter oportunidade
    IF v_historico.oportunidade_id IS NOT NULL THEN
        UPDATE oportunidades
        SET etapa = v_historico.etapa_anterior,
            data_ultima_atualizacao = NOW()
        WHERE id = v_historico.oportunidade_id;
    END IF;

    -- Marcar como revertido
    UPDATE historico_mudancas_automaticas
    SET revertido = true,
        revertido_em = NOW(),
        revertido_por = p_user_id
    WHERE id = p_historico_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PRINCIPAL DE AUTOMAÇÃO (RODAR DIARIAMENTE)
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
    -- 1. Processar leads para nutrição
    FOR v_lead IN SELECT * FROM detectar_leads_para_nutricao() LOOP
        PERFORM mover_para_nutricao(v_lead.lead_id, true);
        v_leads_nutricao := v_leads_nutricao + 1;
    END LOOP;

    -- 2. Processar leads perdidos
    FOR v_lead IN SELECT * FROM detectar_leads_perdidos() LOOP
        PERFORM marcar_como_perdido(p_lead_id := v_lead.lead_id, p_notificar := true);
        v_leads_perdidos := v_leads_perdidos + 1;
    END LOOP;

    -- 3. Processar oportunidades perdidas
    FOR v_oportunidade IN SELECT * FROM detectar_oportunidades_perdidas() LOOP
        PERFORM marcar_como_perdido(p_oportunidade_id := v_oportunidade.oportunidade_id, p_notificar := true);
        v_oportunidades_perdidas := v_oportunidades_perdidas + 1;
    END LOOP;

    -- Retornar resultado
    v_resultado := json_build_object(
        'leads_movidos_nutricao', v_leads_nutricao,
        'leads_marcados_perdido', v_leads_perdidos,
        'oportunidades_marcadas_perdido', v_oportunidades_perdidas,
        'executado_em', NOW()
    );

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- 11. HABILITAR RLS NAS NOVAS TABELAS
-- ============================================

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_mudancas_automaticas ENABLE ROW LEVEL SECURITY;

-- Políticas para notificações
DROP POLICY IF EXISTS "notificacoes_select_policy" ON notificacoes;
CREATE POLICY "notificacoes_select_policy" ON notificacoes FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "notificacoes_insert_policy" ON notificacoes;
CREATE POLICY "notificacoes_insert_policy" ON notificacoes FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "notificacoes_update_policy" ON notificacoes;
CREATE POLICY "notificacoes_update_policy" ON notificacoes FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Políticas para histórico
DROP POLICY IF EXISTS "historico_select_policy" ON historico_mudancas_automaticas;
CREATE POLICY "historico_select_policy" ON historico_mudancas_automaticas FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "historico_insert_policy" ON historico_mudancas_automaticas;
CREATE POLICY "historico_insert_policy" ON historico_mudancas_automaticas FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "historico_update_policy" ON historico_mudancas_automaticas;
CREATE POLICY "historico_update_policy" ON historico_mudancas_automaticas FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar campos adicionados
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leads'
AND column_name IN ('motivo_espera', 'data_prevista_retorno', 'tentativas_contato', 'data_ultima_tentativa');

-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('notificacoes', 'historico_mudancas_automaticas');

-- Verificar funções criadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%nutricao%' OR routine_name LIKE '%perdido%' OR routine_name LIKE '%automacao%';

-- ============================================
-- TESTE MANUAL (DESCOMENTE PARA TESTAR)
-- ============================================

/*
-- Executar automação manualmente
SELECT executar_automacao_leads();

-- Ver notificações criadas
SELECT * FROM notificacoes ORDER BY created_at DESC LIMIT 10;

-- Ver histórico de mudanças
SELECT * FROM historico_mudancas_automaticas ORDER BY created_at DESC LIMIT 10;

-- Ver leads candidatos a nutrição
SELECT * FROM detectar_leads_para_nutricao();

-- Ver leads candidatos a perdido
SELECT * FROM detectar_leads_perdidos();

-- Ver oportunidades candidatas a perdido
SELECT * FROM detectar_oportunidades_perdidas();
*/
