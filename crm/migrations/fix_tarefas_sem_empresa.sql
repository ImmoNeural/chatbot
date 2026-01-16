-- =========================================
-- Fix: Atualizar tarefas sem empresa_id
-- =========================================

-- Primeiro, encontrar a empresa padrão
DO $$
DECLARE
    v_empresa_id UUID;
    v_usuario_id UUID;
BEGIN
    -- Buscar empresa padrão (primeira empresa ou específica)
    SELECT id INTO v_empresa_id
    FROM empresas
    LIMIT 1;

    -- Buscar primeiro usuário dessa empresa
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE empresa_id = v_empresa_id
    LIMIT 1;

    IF v_empresa_id IS NOT NULL THEN
        -- Atualizar tarefas sem empresa_id
        UPDATE tarefas
        SET
            empresa_id = v_empresa_id,
            usuario_id = COALESCE(usuario_id, v_usuario_id)
        WHERE empresa_id IS NULL;

        RAISE NOTICE 'Tarefas atualizadas com empresa_id: %', v_empresa_id;
    END IF;
END $$;

-- Verificar resultado
SELECT id, titulo, empresa_id, usuario_id FROM tarefas;
