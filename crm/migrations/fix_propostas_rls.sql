-- ============================================
-- FIX RLS POLICIES FOR PROPOSTAS TABLE
-- ============================================
-- Este script corrige as políticas de segurança (RLS)
-- para permitir INSERT, SELECT e UPDATE na tabela propostas
-- ============================================

-- 1. Verificar se RLS está habilitado (deve estar)
-- Se não estiver, descomente a linha abaixo:
-- ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "propostas_insert_policy" ON propostas;
DROP POLICY IF EXISTS "propostas_select_policy" ON propostas;
DROP POLICY IF EXISTS "propostas_update_policy" ON propostas;

-- 3. Criar política para INSERT (permitir inserts autenticados ou anônimos)
CREATE POLICY "propostas_insert_policy"
ON propostas
FOR INSERT
TO public
WITH CHECK (true);

-- 4. Criar política para SELECT (permitir leitura)
CREATE POLICY "propostas_select_policy"
ON propostas
FOR SELECT
TO public
USING (true);

-- 5. Criar política para UPDATE (permitir atualizações)
CREATE POLICY "propostas_update_policy"
ON propostas
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute esta query para verificar se as políticas foram criadas:

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'propostas'
ORDER BY policyname;

-- Resultado esperado: 3 políticas (insert, select, update)

-- ============================================
-- TESTE DE INSERT
-- ============================================
-- Depois de executar as políticas acima, teste com este INSERT:
-- (Substitua os valores conforme necessário)

/*
INSERT INTO propostas (
    oportunidade_id,
    numero_proposta,
    potencia_total_kwp,
    num_modulos,
    modelo_placa,
    fabricante_placa,
    potencia_placa,
    modelo_inversor,
    fabricante_inversor,
    valor_equipamentos,
    valor_final,
    economia_mensal,
    economia_anual,
    payback_anos,
    status
) VALUES (
    'SEU_ID_OPORTUNIDADE_AQUI',  -- Substitua por um ID real de oportunidade
    'PROP-TEST-' || extract(epoch from now())::text,
    10.5,
    25,
    'Teste Placa',
    'Fabricante Teste',
    420,
    'Inversor Teste',
    'Fabricante Inv',
    25000.00,
    35000.00,
    450.00,
    5400.00,
    6.5,
    'enviada'
) RETURNING *;
*/

-- Se o INSERT acima funcionar, o problema está resolvido!
