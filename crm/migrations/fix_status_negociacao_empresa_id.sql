-- Corrigir registros na status_negociacao que não têm empresa_id
-- Pegar o empresa_id do lead correspondente

UPDATE status_negociacao sn
SET empresa_id = l.empresa_id
FROM leads l
WHERE sn.lead_id = l.id
AND sn.empresa_id IS NULL;

-- Verificar resultado
SELECT sn.id, sn.lead_id, sn.empresa_id, l.nome as lead_nome
FROM status_negociacao sn
JOIN leads l ON l.id = sn.lead_id;
