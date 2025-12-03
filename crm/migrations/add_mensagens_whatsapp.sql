-- ============================================
-- MIGRATION: Tabela de Mensagens WhatsApp
-- ============================================
-- Armazena mensagens enviadas/recebidas via WhatsApp
-- Integração com Twilio
-- ============================================

-- Criar tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_sid VARCHAR(255),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    telefone VARCHAR(50) NOT NULL,
    nome_perfil VARCHAR(255),
    mensagem TEXT,
    direcao VARCHAR(20) NOT NULL CHECK (direcao IN ('enviada', 'recebida')),
    tipo VARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'midia', 'audio', 'documento')),
    status VARCHAR(50) DEFAULT 'entregue',
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_lead_id ON mensagens_whatsapp(lead_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_telefone ON mensagens_whatsapp(telefone);
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_created_at ON mensagens_whatsapp(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_message_sid ON mensagens_whatsapp(message_sid);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_mensagens_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mensagens_whatsapp_updated_at ON mensagens_whatsapp;
CREATE TRIGGER trigger_mensagens_whatsapp_updated_at
    BEFORE UPDATE ON mensagens_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION update_mensagens_whatsapp_updated_at();

-- RLS (Row Level Security)
ALTER TABLE mensagens_whatsapp ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura autenticada
CREATE POLICY "Permitir leitura de mensagens para usuários autenticados"
    ON mensagens_whatsapp FOR SELECT
    TO authenticated
    USING (true);

-- Política para permitir inserção autenticada
CREATE POLICY "Permitir inserção de mensagens para usuários autenticados"
    ON mensagens_whatsapp FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para permitir inserção via service_role (Edge Functions)
CREATE POLICY "Permitir inserção via service_role"
    ON mensagens_whatsapp FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Política para permitir leitura via service_role (Edge Functions)
CREATE POLICY "Permitir leitura via service_role"
    ON mensagens_whatsapp FOR SELECT
    TO service_role
    USING (true);

-- Comentários
COMMENT ON TABLE mensagens_whatsapp IS 'Armazena mensagens do WhatsApp via Twilio';
COMMENT ON COLUMN mensagens_whatsapp.message_sid IS 'ID único da mensagem no Twilio';
COMMENT ON COLUMN mensagens_whatsapp.direcao IS 'Se a mensagem foi enviada ou recebida';
COMMENT ON COLUMN mensagens_whatsapp.raw_data IS 'Dados brutos do webhook do Twilio';
