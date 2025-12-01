-- ============================================
-- CORREÇÃO: Usar data_ultima_tentativa
-- ============================================
-- A lógica estava usando a última interação (qualquer tipo)
-- Agora usa data_ultima_tentativa (só tentativas sem resposta)
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
        l.nome::TEXT,
        l.email::TEXT,
        EXTRACT(DAY FROM NOW() - COALESCE(
            l.data_ultima_tentativa,  -- USA ESTA COLUNA!
            l.created_at
        ))::INTEGER as dias,
        l.tentativas_contato
    FROM leads l
    WHERE
        l.status NOT IN ('perdido', 'convertido')
        AND l.tentativas_contato >= 3
        AND EXTRACT(DAY FROM NOW() - COALESCE(
            l.data_ultima_tentativa,  -- USA ESTA COLUNA!
            l.created_at
        )) >= 30;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TESTE
-- ============================================

-- Simular que a última tentativa foi há 35 dias
UPDATE leads
SET data_ultima_tentativa = NOW() - INTERVAL '35 days'
WHERE email = 'rogerio@go.com';

-- Agora testar
SELECT 'Após simular 35 dias:' as status;
SELECT * FROM detectar_leads_perdidos();

-- Executar automação
SELECT 'Executando automação:' as status;
SELECT executar_automacao_leads();

-- Ver notificações criadas
SELECT 'Notificações criadas:' as status;
SELECT * FROM notificacoes ORDER BY created_at DESC LIMIT 5;
