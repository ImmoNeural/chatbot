-- Tabela para rastrear sessões de conversas por lead
-- Cada vez que o vendedor clica em "Finalizar Conversa", uma nova sessão é criada
CREATE TABLE IF NOT EXISTS conversas_sessoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sessao_numero INTEGER NOT NULL DEFAULT 1,
    iniciada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encerrada_em TIMESTAMP WITH TIME ZONE,
    resumo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar sessões por lead
CREATE INDEX IF NOT EXISTS idx_conversas_sessoes_lead_id ON conversas_sessoes(lead_id);

-- Índice para buscar a sessão ativa (não encerrada)
CREATE INDEX IF NOT EXISTS idx_conversas_sessoes_ativa ON conversas_sessoes(lead_id, encerrada_em) WHERE encerrada_em IS NULL;

-- Comentários para documentação
COMMENT ON TABLE conversas_sessoes IS 'Rastreia sessões de conversas WhatsApp por lead';
COMMENT ON COLUMN conversas_sessoes.sessao_numero IS 'Número sequencial da sessão para este lead';
COMMENT ON COLUMN conversas_sessoes.iniciada_em IS 'Quando a sessão foi iniciada';
COMMENT ON COLUMN conversas_sessoes.encerrada_em IS 'Quando o vendedor clicou em Finalizar Conversa (NULL = sessão ativa)';
COMMENT ON COLUMN conversas_sessoes.resumo IS 'Resumo gerado pela IA ao finalizar a sessão';
