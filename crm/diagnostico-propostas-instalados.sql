-- =========================================
-- DIAGNÓSTICO: Verificar estrutura da tabela propostas
-- =========================================

-- 1. Ver todos os campos da tabela propostas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'propostas'
ORDER BY ordinal_position;

-- 2. Ver uma proposta de exemplo para identificar os nomes corretos dos campos
SELECT * FROM propostas LIMIT 1;

-- 3. Ver quais propostas existem para os leads instalados
SELECT
    ci.lead_id,
    l.nome,
    p.numero_proposta,
    p.potencia_total_kwp,
    p.valor_final,
    p.num_modulos,
    p.*
FROM clientes_instalados ci
LEFT JOIN leads l ON l.id = ci.lead_id
LEFT JOIN propostas p ON p.oportunidade_id IN (
    SELECT id FROM oportunidades WHERE lead_id = ci.lead_id
)
ORDER BY ci.created_at DESC;

-- =========================================
-- CORREÇÃO: Atualizar valores em clientes_instalados
-- =========================================
-- Execute isso DEPOIS de ver os resultados acima para confirmar os nomes corretos dos campos

-- Atualizar potência e valor de clientes instalados com dados das propostas
UPDATE clientes_instalados ci
SET
    potencia_instalada_kwp = COALESCE(
        (SELECT p.potencia_total_kwp
         FROM propostas p
         WHERE p.oportunidade_id IN (SELECT id FROM oportunidades WHERE lead_id = ci.lead_id)
         ORDER BY p.created_at DESC
         LIMIT 1),
        0
    ),
    valor_final_negociado = COALESCE(
        (SELECT p.valor_final
         FROM propostas p
         WHERE p.oportunidade_id IN (SELECT id FROM oportunidades WHERE lead_id = ci.lead_id)
         ORDER BY p.created_at DESC
         LIMIT 1),
        0
    )
WHERE potencia_instalada_kwp = 0 OR valor_final_negociado = 0;

-- Verificar resultados
SELECT
    l.nome,
    ci.numero_contrato,
    ci.potencia_instalada_kwp,
    ci.valor_final_negociado,
    ci.data_instalacao
FROM clientes_instalados ci
LEFT JOIN leads l ON l.id = ci.lead_id
ORDER BY ci.created_at DESC;
