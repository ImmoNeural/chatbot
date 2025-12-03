-- ============================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA PROPOSTAS
-- ============================================
-- Este script adiciona todas as colunas necessárias
-- para o correto funcionamento do sistema de propostas
-- ============================================

-- Adicionar coluna economia_anual (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS economia_anual DECIMAL(10,2);

-- Adicionar coluna economia_mensal (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS economia_mensal DECIMAL(10,2);

-- Adicionar coluna payback_anos (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS payback_anos DECIMAL(5,2);

-- Adicionar coluna potencia_total_kwp (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS potencia_total_kwp DECIMAL(10,2);

-- Adicionar coluna num_modulos (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS num_modulos INTEGER;

-- Adicionar coluna modelo_placa (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS modelo_placa TEXT;

-- Adicionar coluna fabricante_placa (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS fabricante_placa TEXT;

-- Adicionar coluna potencia_placa (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS potencia_placa INTEGER;

-- Adicionar coluna modelo_inversor (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS modelo_inversor TEXT;

-- Adicionar coluna fabricante_inversor (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS fabricante_inversor TEXT;

-- Adicionar coluna valor_equipamentos (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS valor_equipamentos DECIMAL(10,2);

-- Adicionar coluna valor_final (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS valor_final DECIMAL(10,2);

-- Adicionar coluna numero_proposta (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS numero_proposta TEXT UNIQUE;

-- Adicionar coluna status (se não existir)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'enviada';

-- Adicionar coluna oportunidade_id (se não existir) com foreign key
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute esta query para verificar todas as colunas:

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'propostas'
ORDER BY ordinal_position;

-- ============================================
-- Resultado esperado: Deve mostrar TODAS as colunas acima
-- ============================================

-- COMENTÁRIOS:
-- 1. Se a tabela propostas não existir, você verá um erro
-- 2. Se algumas colunas já existirem, elas serão ignoradas (IF NOT EXISTS)
-- 3. Se precisar recriar a tabela, descomente o bloco abaixo:

/*
-- ATENÇÃO: Isto vai APAGAR todos os dados da tabela propostas!
-- Use apenas se estiver começando do zero

DROP TABLE IF EXISTS propostas CASCADE;

CREATE TABLE propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
    numero_proposta TEXT UNIQUE,
    potencia_total_kwp DECIMAL(10,2),
    num_modulos INTEGER,
    modelo_placa TEXT,
    fabricante_placa TEXT,
    potencia_placa INTEGER,
    modelo_inversor TEXT,
    fabricante_inversor TEXT,
    valor_equipamentos DECIMAL(10,2),
    valor_final DECIMAL(10,2),
    economia_mensal DECIMAL(10,2),
    economia_anual DECIMAL(10,2),
    payback_anos DECIMAL(5,2),
    status TEXT DEFAULT 'enviada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "propostas_insert_policy" ON propostas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "propostas_select_policy" ON propostas FOR SELECT TO public USING (true);
CREATE POLICY "propostas_update_policy" ON propostas FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Criar índices
CREATE INDEX idx_propostas_oportunidade ON propostas(oportunidade_id);
CREATE INDEX idx_propostas_numero ON propostas(numero_proposta);
CREATE INDEX idx_propostas_status ON propostas(status);
*/
