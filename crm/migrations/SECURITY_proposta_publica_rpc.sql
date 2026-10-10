-- =====================================================================
-- SEGURANCA: Link publico de proposta sem expor a tabela propostas
-- =====================================================================
-- Rode DEPOIS de SECURITY_lockdown_rls.sql.
--
-- POR QUE ISTO E NECESSARIO
-- A pagina proposta.html e publica: o cliente abre
--   .../crm/proposta.html?t=TOKEN
-- sem estar logado. Antes, ela buscava a proposta assim:
--
--   supabase.from('propostas').select('*').eq('token_rastreio', token)
--
-- O filtro .eq() fica no NAVEGADOR, nao no banco. Quem tem a chave anon
-- publica podia simplesmente remover o filtro e baixar TODAS as
-- propostas de TODAS as empresas: valores, descontos e dados dos
-- clientes. O RLS nao enxerga o filtro do cliente, so o papel que chama.
--
-- A SOLUCAO
-- O anon perde o acesso a tabela e passa a chamar funcoes SECURITY
-- DEFINER, que rodam com privilegio do dono e devolvem no maximo UMA
-- proposta, a do token informado. Sem token valido, nada volta.
-- O token e um MD5 de 32 caracteres (idx_propostas_token), inadivinhavel
-- na pratica.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Buscar UMA proposta pelo token
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_proposta_publica(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    resultado JSONB;
BEGIN
    -- Token curto ou vazio: nao gasta consulta.
    IF p_token IS NULL OR length(p_token) < 16 THEN
        RETURN NULL;
    END IF;

    SELECT to_jsonb(p) || jsonb_build_object(
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

-- ---------------------------------------------------------------------
-- 2. Registrar que o cliente abriu a proposta
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_visualizacao_proposta(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_token IS NULL OR length(p_token) < 16 THEN
        RETURN;
    END IF;

    -- Só promove 'enviada' -> 'visualizada'. Nao rebaixa uma proposta
    -- que ja foi aceita ou recusada.
    UPDATE propostas
       SET status             = 'visualizada',
           data_visualizacao  = COALESCE(data_visualizacao, NOW()),
           updated_at         = NOW()
     WHERE token_rastreio = p_token
       AND status IN ('enviada', 'rascunho');
END;
$$;

-- ---------------------------------------------------------------------
-- 3. Cliente aceita ou recusa a proposta
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION responder_proposta_publica(
    p_token  TEXT,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_proposta  propostas;
    v_lead_id   UUID;
    v_empresa   UUID;
BEGIN
    -- Só estes dois valores. Impede que alguem use esta funcao para
    -- gravar qualquer status arbitrario.
    IF p_status NOT IN ('aceita', 'recusada') THEN
        RAISE EXCEPTION 'Status invalido: %', p_status;
    END IF;

    IF p_token IS NULL OR length(p_token) < 16 THEN
        RETURN jsonb_build_object('ok', false, 'erro', 'token_invalido');
    END IF;

    SELECT * INTO v_proposta
      FROM propostas
     WHERE token_rastreio = p_token
     LIMIT 1;

    IF v_proposta.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'erro', 'nao_encontrada');
    END IF;

    -- Resposta definitiva nao se sobrescreve: evita que um link
    -- reenviado troque um "aceita" por "recusada".
    IF v_proposta.status IN ('aceita', 'recusada') THEN
        RETURN jsonb_build_object(
            'ok', false, 'erro', 'ja_respondida',
            'status_atual', v_proposta.status
        );
    END IF;

    UPDATE propostas
       SET status        = p_status,
           data_resposta = NOW(),
           updated_at    = NOW()
     WHERE id = v_proposta.id;

    SELECT o.lead_id, l.empresa_id
      INTO v_lead_id, v_empresa
      FROM oportunidades o
      LEFT JOIN leads l ON l.id = o.lead_id
     WHERE o.id = v_proposta.oportunidade_id;

    -- Timeline do lead, para o vendedor ver a resposta no CRM.
    IF v_lead_id IS NOT NULL THEN
        INSERT INTO interacoes (lead_id, empresa_id, tipo, titulo, descricao)
        VALUES (
            v_lead_id,
            v_empresa,
            'sistema',
            CASE WHEN p_status = 'aceita'
                 THEN 'Proposta Aceita!'
                 ELSE 'Proposta Recusada' END,
            format('Cliente %s a proposta %s no valor de R$ %s',
                   CASE WHEN p_status = 'aceita' THEN 'aceitou' ELSE 'recusou' END,
                   v_proposta.numero_proposta,
                   to_char(v_proposta.valor_final, 'FM999G999G990D00'))
        );
    END IF;

    RETURN jsonb_build_object('ok', true, 'status', p_status);
END;
$$;

-- ---------------------------------------------------------------------
-- 4. Permissoes: o anon so pode EXECUTAR estas tres funcoes.
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION get_proposta_publica(TEXT)              FROM PUBLIC;
REVOKE ALL ON FUNCTION registrar_visualizacao_proposta(TEXT)   FROM PUBLIC;
REVOKE ALL ON FUNCTION responder_proposta_publica(TEXT, TEXT)  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_proposta_publica(TEXT)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION registrar_visualizacao_proposta(TEXT)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION responder_proposta_publica(TEXT, TEXT) TO anon, authenticated;

COMMIT;

-- =====================================================================
-- 5. TESTE
-- =====================================================================
-- 5.1 Token invalido deve devolver NULL (e nao um erro):
--     SELECT get_proposta_publica('token-que-nao-existe-aaaaaaaa');
--
-- 5.2 Com um token real, deve devolver a proposta:
--     SELECT token_rastreio FROM propostas LIMIT 1;
--     SELECT get_proposta_publica('<cole o token aqui>');
--
-- 5.3 Confirme que o anon NAO le a tabela direto. No SQL Editor:
--     SET ROLE anon;
--     SELECT count(*) FROM propostas;   -- deve dar erro de permissao
--     RESET ROLE;
