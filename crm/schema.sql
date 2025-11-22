-- =========================================
-- CRM FUNIL COMPLETO - ENERGIA SOLAR
-- Schema SQL para Supabase
-- =========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. TABELA: users
-- Usuários do CRM (Vendedores, Gestores)
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor' CHECK (role IN ('vendedor', 'gestor', 'admin')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 2. TABELA: leads (MODIFICADA - integra com chatbot)
-- Informações cadastrais e de status inicial
-- =========================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_cliente VARCHAR(20) DEFAULT 'residencial' CHECK (tipo_cliente IN ('residencial', 'empresarial'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nome VARCHAR(150);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consumo_mensal DECIMAL(10, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'novo' CHECK (status IN ('novo', 'qualificado', 'nao_qualificado', 'em_nutricao', 'convertido', 'perdido'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'chatbot';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Atualizar nome baseado no email se nome estiver vazio
UPDATE leads SET nome = SPLIT_PART(email, '@', 1) WHERE nome IS NULL OR nome = '';

-- =========================================
-- 3. TABELA: qualificacao
-- Detalhes técnicos e de viabilidade (1:1 com leads)
-- =========================================
CREATE TABLE IF NOT EXISTS qualificacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- Dados do chatbot (já coletados)
    family_size VARCHAR(50),
    kwh_consumption VARCHAR(50),
    roof_type VARCHAR(100),

    -- Dados adicionais de qualificação
    sombreamento_percentual DECIMAL(5, 2) CHECK (sombreamento_percentual >= 0 AND sombreamento_percentual <= 100),
    tipo_telhado VARCHAR(30) CHECK (tipo_telhado IN ('fibrocimento', 'ceramico', 'metalico', 'laje', 'outro')),
    tipo_ligacao VARCHAR(20) CHECK (tipo_ligacao IN ('monofasica', 'bifasica', 'trifasica')),
    decisor BOOLEAN DEFAULT false,
    prontidao_compra VARCHAR(20) CHECK (prontidao_compra IN ('imediato', '30_dias', '90_dias', 'mais_90_dias')),

    -- Documentação
    conta_luz_url TEXT,
    fotos_telhado_urls TEXT[], -- Array de URLs

    -- Viabilidade
    viabilidade_tecnica BOOLEAN DEFAULT true,
    observacoes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrar dados existentes do chatbot para qualificacao
INSERT INTO qualificacao (lead_id, family_size, kwh_consumption, roof_type, created_at)
SELECT id, family_size, kwh_consumption, roof_type, created_at
FROM leads
WHERE NOT EXISTS (SELECT 1 FROM qualificacao WHERE qualificacao.lead_id = leads.id);

-- =========================================
-- 4. TABELA: oportunidades
-- Estágios do funil de vendas
-- =========================================
CREATE TABLE IF NOT EXISTS oportunidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    etapa VARCHAR(30) DEFAULT 'levantamento' CHECK (etapa IN ('levantamento', 'simulacao', 'proposta', 'negociacao', 'fechamento', 'perdido')),
    valor_estimado DECIMAL(12, 2),
    probabilidade INTEGER DEFAULT 30 CHECK (probabilidade >= 0 AND probabilidade <= 100),

    data_previsao_fechamento DATE,
    data_ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    motivo_perda TEXT,
    concorrente VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 5. TABELA: interacoes
-- Log de atividades e comunicações
-- =========================================
CREATE TABLE IF NOT EXISTS interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('email', 'whatsapp', 'chamada', 'visita', 'nota', 'upload', 'sistema')),
    titulo VARCHAR(200),
    descricao TEXT,

    -- Metadados
    arquivo_url TEXT,
    duracao_minutos INTEGER, -- Para chamadas
    resultado VARCHAR(50), -- Ex: "agendado", "sem_resposta", "interessado"

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por lead
CREATE INDEX IF NOT EXISTS idx_interacoes_lead ON interacoes(lead_id, created_at DESC);

-- =========================================
-- 6. TABELA: propostas
-- Detalhes financeiros e técnicos da proposta
-- =========================================
CREATE TABLE IF NOT EXISTS propostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oportunidade_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,

    -- Identificação
    numero_proposta VARCHAR(50) UNIQUE NOT NULL,
    versao INTEGER DEFAULT 1,
    proposta_anterior_id UUID REFERENCES propostas(id),

    -- Especificações técnicas
    num_modulos INTEGER NOT NULL,
    potencia_total_kwp DECIMAL(8, 2) NOT NULL,
    tipo_inversor VARCHAR(100),
    marca_modulos VARCHAR(100),

    -- Financeiro
    valor_total DECIMAL(12, 2) NOT NULL,
    desconto_percentual DECIMAL(5, 2) DEFAULT 0,
    valor_final DECIMAL(12, 2) NOT NULL,
    forma_pagamento VARCHAR(100),

    -- Projeções
    economia_mensal_prevista DECIMAL(10, 2),
    payback_meses INTEGER,
    economia_25_anos DECIMAL(12, 2),

    -- Arquivos e rastreamento
    arquivo_pdf_url TEXT,
    token_rastreio VARCHAR(64) UNIQUE DEFAULT MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT),

    status VARCHAR(30) DEFAULT 'enviada' CHECK (status IN ('rascunho', 'enviada', 'visualizada', 'aceita', 'recusada', 'revisao')),
    data_visualizacao TIMESTAMP WITH TIME ZONE,
    data_resposta TIMESTAMP WITH TIME ZONE,

    validade_dias INTEGER DEFAULT 15,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para rastreamento
CREATE INDEX IF NOT EXISTS idx_propostas_token ON propostas(token_rastreio);

-- =========================================
-- 7. TABELA: clientes_instalados
-- Dados do projeto fechado e pós-venda (1:1 com leads)
-- =========================================
CREATE TABLE IF NOT EXISTS clientes_instalados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    oportunidade_id UUID REFERENCES oportunidades(id),
    proposta_final_id UUID REFERENCES propostas(id),

    -- Contrato
    numero_contrato VARCHAR(50) UNIQUE,
    valor_final_negociado DECIMAL(12, 2) NOT NULL,
    data_assinatura DATE NOT NULL,

    -- Instalação
    data_instalacao DATE,
    responsavel_instalacao VARCHAR(150),
    potencia_instalada_kwp DECIMAL(8, 2),
    num_modulos_instalados INTEGER,

    -- Garantias
    garantia_modulos_anos INTEGER DEFAULT 25,
    garantia_inversor_anos INTEGER DEFAULT 5,
    garantia_instalacao_anos INTEGER DEFAULT 2,

    -- Performance e Satisfação
    economia_real_mensal DECIMAL(10, 2),
    geracao_media_mensal_kwh DECIMAL(10, 2),
    nps INTEGER CHECK (nps >= 0 AND nps <= 10),
    feedback TEXT,

    -- Manutenção
    proxima_manutencao DATE,
    manutencoes_realizadas INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 8. TABELA: tarefas
-- Gestão de follow-ups e ações pendentes
-- =========================================
CREATE TABLE IF NOT EXISTS tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(30) CHECK (tipo IN ('follow_up', 'ligacao', 'email', 'visita', 'proposta', 'outro')),

    data_vencimento TIMESTAMP WITH TIME ZONE,
    prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),

    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
    data_conclusao TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- FUNCTIONS E TRIGGERS
-- =========================================

-- Trigger: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qualificacao_updated_at BEFORE UPDATE ON qualificacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oportunidades_updated_at BEFORE UPDATE ON oportunidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON propostas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_instalados_updated_at BEFORE UPDATE ON clientes_instalados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calcular lead_score automaticamente
CREATE OR REPLACE FUNCTION calcular_lead_score(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_lead RECORD;
    v_qual RECORD;
BEGIN
    -- Buscar dados do lead
    SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
    SELECT * INTO v_qual FROM qualificacao WHERE lead_id = p_lead_id;

    -- Critérios de pontuação
    -- Consumo alto (+30)
    IF v_lead.tipo_cliente = 'residencial' AND v_lead.consumo_mensal >= 400 THEN
        v_score := v_score + 30;
    ELSIF v_lead.tipo_cliente = 'empresarial' AND v_lead.consumo_mensal >= 2000 THEN
        v_score := v_score + 30;
    END IF;

    -- Prontidão de compra (+40)
    IF v_qual.prontidao_compra = 'imediato' THEN
        v_score := v_score + 40;
    ELSIF v_qual.prontidao_compra = '30_dias' THEN
        v_score := v_score + 25;
    END IF;

    -- É decisor (+20)
    IF v_qual.decisor = true THEN
        v_score := v_score + 20;
    END IF;

    -- Viabilidade técnica (+10)
    IF v_qual.viabilidade_tecnica = true THEN
        v_score := v_score + 10;
    END IF;

    RETURN LEAST(v_score, 100); -- Máximo 100
END;
$$ LANGUAGE plpgsql;

-- Function: Criar oportunidade automaticamente quando lead é qualificado
CREATE OR REPLACE FUNCTION auto_criar_oportunidade()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'qualificado' AND OLD.status != 'qualificado' THEN
        INSERT INTO oportunidades (lead_id, etapa, valor_estimado)
        VALUES (NEW.id, 'levantamento', NEW.consumo_mensal * 12 * 0.9 * 0.75); -- Estimativa básica

        -- Registrar interação automática
        INSERT INTO interacoes (lead_id, tipo, titulo, descricao)
        VALUES (NEW.id, 'sistema', 'Oportunidade Criada', 'Lead qualificado automaticamente. Oportunidade criada no funil.');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_criar_oportunidade
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_criar_oportunidade();

-- Function: Registrar visualização de proposta
CREATE OR REPLACE FUNCTION registrar_visualizacao_proposta(p_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_proposta_id UUID;
    v_lead_id UUID;
BEGIN
    -- Buscar proposta pelo token
    SELECT p.id, o.lead_id INTO v_proposta_id, v_lead_id
    FROM propostas p
    JOIN oportunidades o ON p.oportunidade_id = o.id
    WHERE p.token_rastreio = p_token;

    IF v_proposta_id IS NULL THEN
        RETURN false;
    END IF;

    -- Atualizar status da proposta
    UPDATE propostas
    SET status = 'visualizada',
        data_visualizacao = NOW()
    WHERE id = v_proposta_id
    AND status = 'enviada';

    -- Criar interação
    INSERT INTO interacoes (lead_id, tipo, titulo, descricao)
    VALUES (v_lead_id, 'sistema', 'Proposta Visualizada', 'Cliente acessou o link da proposta.');

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- VIEWS ÚTEIS
-- =========================================

-- View: Funil Completo (para Dashboard)
CREATE OR REPLACE VIEW vw_funil_vendas AS
SELECT
    etapa,
    COUNT(*) as quantidade,
    SUM(valor_estimado) as valor_total,
    AVG(valor_estimado) as ticket_medio
FROM oportunidades
WHERE etapa != 'perdido'
GROUP BY etapa
ORDER BY
    CASE etapa
        WHEN 'levantamento' THEN 1
        WHEN 'simulacao' THEN 2
        WHEN 'proposta' THEN 3
        WHEN 'negociacao' THEN 4
        WHEN 'fechamento' THEN 5
    END;

-- View: Leads Completos (com qualificação)
CREATE OR REPLACE VIEW vw_leads_completo AS
SELECT
    l.*,
    q.viabilidade_tecnica,
    q.prontidao_compra,
    q.decisor,
    u.nome as vendedor_nome,
    (SELECT COUNT(*) FROM interacoes WHERE lead_id = l.id) as total_interacoes,
    (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id) as ultima_interacao
FROM leads l
LEFT JOIN qualificacao q ON l.id = q.lead_id
LEFT JOIN users u ON l.user_id = u.id;

-- View: KPIs do Dashboard
CREATE OR REPLACE VIEW vw_kpis AS
SELECT
    (SELECT COUNT(*) FROM leads WHERE status NOT IN ('convertido', 'perdido')) as leads_ativos,
    (SELECT COUNT(*) FROM oportunidades WHERE etapa != 'perdido') as oportunidades_ativas,
    (SELECT SUM(valor_estimado) FROM oportunidades WHERE etapa != 'perdido') as pipeline_valor,
    (SELECT COUNT(*) FROM clientes_instalados) as clientes_instalados,
    (SELECT SUM(valor_final_negociado) FROM clientes_instalados) as receita_total,
    (SELECT AVG(nps) FROM clientes_instalados WHERE nps IS NOT NULL) as nps_medio,
    (SELECT COUNT(*) FROM tarefas WHERE status = 'pendente' AND data_vencimento < NOW()) as tarefas_atrasadas;

-- =========================================
-- INSERIR USUÁRIO ADMIN PADRÃO
-- =========================================
INSERT INTO users (nome, email, role)
VALUES ('Administrador', 'admin@energia-solar.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- POLÍTICAS RLS (Row Level Security) - Opcional
-- =========================================
-- Habilitar RLS nas tabelas sensíveis
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
-- etc...

-- =========================================
-- COMENTÁRIOS NAS TABELAS
-- =========================================
COMMENT ON TABLE leads IS 'Leads do funil de vendas - integrado com chatbot';
COMMENT ON TABLE qualificacao IS 'Dados de qualificação técnica e comercial';
COMMENT ON TABLE oportunidades IS 'Oportunidades no funil de vendas';
COMMENT ON TABLE interacoes IS 'Histórico de todas as interações com leads';
COMMENT ON TABLE propostas IS 'Propostas comerciais enviadas';
COMMENT ON TABLE clientes_instalados IS 'Clientes com sistemas instalados';
COMMENT ON TABLE tarefas IS 'Tarefas e follow-ups pendentes';
