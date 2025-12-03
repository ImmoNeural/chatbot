-- =========================================
-- MIGRATION: Adicionar Campos em clientes_instalados
-- =========================================
-- Adiciona campos de ART, Homologação e Observações

-- Adicionar campos de ART
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS numero_art VARCHAR(50);
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS data_art TIMESTAMP WITH TIME ZONE;

-- Adicionar campos de Homologação
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS protocolo_homologacao VARCHAR(50);
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS data_homologacao TIMESTAMP WITH TIME ZONE;

-- Adicionar campos adicionais
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE clientes_instalados ADD COLUMN IF NOT EXISTS data_conclusao_instalacao TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN clientes_instalados.numero_art IS 'Número da ART (Anotação de Responsabilidade Técnica)';
COMMENT ON COLUMN clientes_instalados.data_art IS 'Data de emissão/aprovação da ART';
COMMENT ON COLUMN clientes_instalados.protocolo_homologacao IS 'Protocolo da homologação junto à distribuidora';
COMMENT ON COLUMN clientes_instalados.data_homologacao IS 'Data de aprovação da homologação';
COMMENT ON COLUMN clientes_instalados.observacoes IS 'Observações sobre o agendamento e instalação';
COMMENT ON COLUMN clientes_instalados.data_conclusao_instalacao IS 'Data de conclusão efetiva da instalação';

-- Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes_instalados'
ORDER BY ordinal_position;
