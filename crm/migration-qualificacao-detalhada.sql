-- =========================================
-- MIGRATION: Qualificação Detalhada
-- =========================================
-- Adiciona campos detalhados de qualificação com checkboxes

-- =========================================
-- 1. ADICIONAR CAMPOS DE VIABILIDADE TÉCNICA
-- =========================================
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS telhado_bom_estado BOOLEAN DEFAULT false;
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS pouco_sombreamento BOOLEAN DEFAULT false;
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS estrutura_suporta_peso BOOLEAN DEFAULT false;
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS telhado_compativel BOOLEAN DEFAULT false;
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS acesso_adequado BOOLEAN DEFAULT false;

-- =========================================
-- 2. ADICIONAR CAMPOS DE DECISOR
-- =========================================
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS decisor_autonomia BOOLEAN DEFAULT false;
ALTER TABLE qualificacao ADD COLUMN IF NOT EXISTS observacoes_decisor TEXT;

-- =========================================
-- 3. FUNÇÃO: Calcular viabilidade técnica automaticamente
-- =========================================
CREATE OR REPLACE FUNCTION atualizar_viabilidade_tecnica()
RETURNS TRIGGER AS $$
BEGIN
    -- Se todos os 5 checkboxes de viabilidade estão marcados, marcar viabilidade_tecnica como true
    IF NEW.telhado_bom_estado = true AND
       NEW.pouco_sombreamento = true AND
       NEW.estrutura_suporta_peso = true AND
       NEW.telhado_compativel = true AND
       NEW.acesso_adequado = true THEN
        NEW.viabilidade_tecnica = true;
    ELSE
        NEW.viabilidade_tecnica = false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 4. TRIGGER: Atualizar viabilidade automaticamente
-- =========================================
DROP TRIGGER IF EXISTS trigger_atualizar_viabilidade ON qualificacao;

CREATE TRIGGER trigger_atualizar_viabilidade
    BEFORE INSERT OR UPDATE ON qualificacao
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_viabilidade_tecnica();

-- =========================================
-- 5. ADICIONAR TABELA: documentos
-- =========================================
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('foto_telhado', 'foto_estrutura', 'conta_luz', 'documento_imovel', 'outro')),
    nome_arquivo VARCHAR(255) NOT NULL,
    url_arquivo TEXT NOT NULL,
    tamanho_bytes BIGINT,
    mime_type VARCHAR(100),

    observacoes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_lead ON documentos(lead_id, created_at DESC);

COMMENT ON TABLE documentos IS 'Armazenamento de documentos e fotos dos leads (fotos de telhado, conta de luz, etc)';

-- =========================================
-- 6. ADICIONAR TABELA: instalacao
-- =========================================
CREATE TABLE IF NOT EXISTS instalacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- Aprovações técnicas
    art_aprovada BOOLEAN DEFAULT false,
    data_art TIMESTAMP WITH TIME ZONE,
    numero_art VARCHAR(50),

    homologacao_aprovada BOOLEAN DEFAULT false,
    data_homologacao TIMESTAMP WITH TIME ZONE,
    protocolo_homologacao VARCHAR(50),

    -- Agendamento de instalação
    data_agendamento_instalacao DATE,
    observacoes_agendamento TEXT,
    cliente_notificado BOOLEAN DEFAULT false,
    data_notificacao TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instalacao_lead ON instalacao(lead_id);

COMMENT ON TABLE instalacao IS 'Gestão de instalação: ART, homologação e agendamento';

-- =========================================
-- 7. ADICIONAR TABELA: status_negociacao
-- =========================================
CREATE TABLE IF NOT EXISTS status_negociacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- Status da negociação
    cliente_agendou_reuniao BOOLEAN DEFAULT false,
    data_reuniao_agendada TIMESTAMP WITH TIME ZONE,
    observacoes_reuniao TEXT,

    -- Status da proposta
    proposta_visualizada BOOLEAN DEFAULT false,
    data_visualizacao TIMESTAMP WITH TIME ZONE,
    proposta_aceita BOOLEAN DEFAULT false,
    data_aceite TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_negociacao_lead ON status_negociacao(lead_id);

COMMENT ON TABLE status_negociacao IS 'Status de negociação e interações com proposta';

-- =========================================
-- 8. TRIGGERS: Atualizar updated_at
-- =========================================
CREATE TRIGGER update_instalacao_updated_at BEFORE UPDATE ON instalacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_negociacao_updated_at BEFORE UPDATE ON status_negociacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- COMENTÁRIOS
-- =========================================
COMMENT ON COLUMN qualificacao.telhado_bom_estado IS 'Checkbox: Telhado em bom estado';
COMMENT ON COLUMN qualificacao.pouco_sombreamento IS 'Checkbox: Pouco ou nenhum sombreamento (<20%)';
COMMENT ON COLUMN qualificacao.estrutura_suporta_peso IS 'Checkbox: Estrutura suporta peso dos painéis';
COMMENT ON COLUMN qualificacao.telhado_compativel IS 'Checkbox: Tipo de telhado compatível';
COMMENT ON COLUMN qualificacao.acesso_adequado IS 'Checkbox: Acesso adequado para instalação';
COMMENT ON COLUMN qualificacao.decisor_autonomia IS 'Checkbox: Tem autonomia para decidir (proprietário/CEO/CFO)';
