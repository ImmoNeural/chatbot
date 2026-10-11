-- =====================================================================
-- CORRECAO: proposta publica -- assinatura duplicada e vazamento de custo
-- =====================================================================
-- Rode DEPOIS de SECURITY_proposta_publica_rpc.sql. Pode rodar de novo.
--
-- PROBLEMA 1 - a visualizacao nunca era registrada
-- ------------------------------------------------
-- schema.sql:326 cria
--     registrar_visualizacao_proposta(p_token VARCHAR)
-- e SECURITY_proposta_publica_rpc.sql:70 cria
--     registrar_visualizacao_proposta(p_token TEXT)
--
-- CREATE OR REPLACE FUNCTION so substitui quando a assinatura e a MESMA.
-- Com tipos diferentes o Postgres cria uma SOBRECARGA: ficam as duas no
-- banco. O PostgREST, ao receber {"p_token": "..."}, nao consegue decidir
-- qual chamar e devolve PGRST203 ("Could not choose the best candidate
-- function"). A chamada de proposta.html falhava em silencio -- o catch
-- so escrevia no console -- e por isso a coluna "Rastreio" do CRM dizia
-- "Nao aberta" para toda proposta, mesmo as que o cliente tinha aberto.
--
-- PROBLEMA 2 - a pagina publica entregava o custo interno
-- -------------------------------------------------------
-- get_proposta_publica monta o retorno com to_jsonb(p), que despeja a
-- LINHA INTEIRA de propostas no navegador do cliente. Entre as colunas
-- vai valor_equipamentos (o custo da integradora) ao lado de valor_final
-- (o preco de venda). Qualquer cliente que abra o F12 na pagina da
-- proposta calcula a margem do negocio. A funcao e SECURITY DEFINER com
-- EXECUTE para anon: nao ha RLS que segure isso.
--
-- Aqui ela passa a devolver uma lista explicita de campos -- os que a
-- pagina de fato mostra, e nada mais.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Fora toda sobrecarga que nao seja a versao TEXT.
--    Hoje a duplicada e so registrar_visualizacao_proposta(VARCHAR), mas
--    varrer pelo catalogo cobre tambem qualquer sobra de migration antiga
--    deste banco, e diz em voz alta o que removeu.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN
        SELECT p.oid::regprocedure AS assinatura
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.proname IN ('get_proposta_publica',
                             'registrar_visualizacao_proposta',
                             'responder_proposta_publica')
           AND pg_get_function_identity_arguments(p.oid) NOT LIKE '%text%'
    LOOP
        EXECUTE 'DROP FUNCTION ' || f.assinatura;
        RAISE NOTICE 'sobrecarga removida: %', f.assinatura;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 2. get_proposta_publica com campos explicitos.
--    Regra para quem for mexer: so entra aqui o que a pagina mostra ao
--    cliente. Custo, margem e lucro nao sobem para o navegador.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_proposta_publica(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    resultado JSONB;
BEGIN
    IF p_token IS NULL OR length(p_token) < 16 THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
               'numero_proposta',          p.numero_proposta,
               'status',                   p.status,
               'created_at',               p.created_at,
               'validade_dias',            p.validade_dias,

               -- Sistema
               'potencia_total_kwp',       p.potencia_total_kwp,
               'num_modulos',              p.num_modulos,
               'marca_modulos',            COALESCE(p.marca_modulos, p.fabricante_placa),
               'modelo_placa',             p.modelo_placa,
               'tipo_inversor',            COALESCE(p.tipo_inversor, p.modelo_inversor),

               -- Preco ao cliente. valor_total e o preco de tabela e
               -- valor_final o negociado; valor_equipamentos (custo) NAO
               -- entra, e e por isso que esta funcao existe.
               'valor_total',              p.valor_total,
               'valor_final',              p.valor_final,
               'desconto_percentual',      p.desconto_percentual,
               'forma_pagamento',          p.forma_pagamento,

               -- Projecoes. As duas familias de coluna convivem na tabela
               -- (schema.sql x add_propostas_columns.sql), entao COALESCE
               -- aceita propostas antigas e novas.
               'economia_mensal_prevista', COALESCE(p.economia_mensal_prevista, p.economia_mensal),
               'payback_meses',            COALESCE(p.payback_meses, ROUND(p.payback_anos * 12)),
               'economia_25_anos',         p.economia_25_anos,

               'arquivo_pdf_url',          p.arquivo_pdf_url,

               'oportunidades', jsonb_build_object(
                   'id',      o.id,
                   'lead_id', o.lead_id,
                   'leads',   jsonb_build_object(
                       'nome',  l.nome,
                       'email', l.email
                   )
               )
           )
      INTO resultado
      FROM propostas p
      LEFT JOIN oportunidades o ON o.id = p.oportunidade_id
      LEFT JOIN leads         l ON l.id = o.lead_id
     WHERE p.token_rastreio = p_token
     LIMIT 1;

    RETURN resultado;  -- NULL quando o token nao existe
END;
$$;

REVOKE ALL ON FUNCTION public.get_proposta_publica(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_proposta_publica(TEXT) TO anon, authenticated;

COMMIT;

-- =====================================================================
-- 3. VERIFICACAO -- rode cada bloco separado.
-- =====================================================================

-- 3.1 Deve sobrar UMA assinatura de cada:
--
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS argumentos
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public'
--    AND p.proname IN ('get_proposta_publica',
--                      'registrar_visualizacao_proposta',
--                      'responder_proposta_publica')
--  ORDER BY p.proname;

-- 3.2 O retorno NAO pode mais trazer valor_equipamentos:
--
-- SELECT get_proposta_publica((SELECT token_rastreio FROM propostas LIMIT 1))
--        ? 'valor_equipamentos' AS ainda_vaza;   -- esperado: false

-- 3.3 Marcar como vista agora funciona (antes dava PGRST203 pelo PostgREST):
--
-- SELECT registrar_visualizacao_proposta((SELECT token_rastreio FROM propostas LIMIT 1));
-- SELECT numero_proposta, status, data_visualizacao FROM propostas
--  ORDER BY data_visualizacao DESC NULLS LAST LIMIT 3;
