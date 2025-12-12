-- =====================================================
-- FIX: Auto-fill empresa_id for chatbot leads
-- Execute this script in Supabase SQL Editor
-- =====================================================
--
-- PROBLEMA: Leads inseridos pelo chatbot (via n8n) chegam
-- com empresa_id = NULL, tornando-os invisíveis no CRM
-- devido às políticas RLS.
--
-- SOLUÇÃO: Trigger que preenche empresa_id automaticamente
-- quando um lead é inserido sem esse campo.
-- =====================================================

-- 1. Criar função do trigger
CREATE OR REPLACE FUNCTION set_lead_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se empresa_id for NULL, usar a empresa padrão
    IF NEW.empresa_id IS NULL THEN
        NEW.empresa_id := 'a0000000-0000-0000-0000-000000000001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Remover trigger existente (se houver)
DROP TRIGGER IF EXISTS trigger_set_lead_empresa_id ON leads;

-- 3. Criar trigger BEFORE INSERT
CREATE TRIGGER trigger_set_lead_empresa_id
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_lead_empresa_id();

-- 4. Corrigir leads existentes que estão com empresa_id NULL
UPDATE leads
SET empresa_id = 'a0000000-0000-0000-0000-000000000001'
WHERE empresa_id IS NULL;

-- 5. Verificar se o trigger foi criado
SELECT
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'leads'
  AND trigger_name = 'trigger_set_lead_empresa_id';

-- 6. Testar (opcional) - inserir lead de teste sem empresa_id
-- INSERT INTO leads (nome, email, phone, origem)
-- VALUES ('Teste Trigger', 'teste@teste.com', '11999999999', 'chatbot');
--
-- SELECT id, nome, empresa_id FROM leads WHERE email = 'teste@teste.com';
-- (deve mostrar empresa_id preenchido automaticamente)
