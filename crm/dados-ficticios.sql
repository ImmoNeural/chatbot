-- =========================================
-- DADOS FICTÍCIOS PARA TESTE DO CRM
-- Execute este script no Supabase SQL Editor
-- =========================================

-- Limpar dados existentes (CUIDADO: Remove tudo!)
-- DELETE FROM interacoes;
-- DELETE FROM propostas;
-- DELETE FROM oportunidades;
-- DELETE FROM clientes_instalados;
-- DELETE FROM tarefas;
-- DELETE FROM qualificacao;
-- DELETE FROM leads;
-- DELETE FROM users WHERE email != 'admin@energia-solar.com';

-- =========================================
-- 1. USUÁRIOS (Vendedores)
-- =========================================
INSERT INTO users (id, nome, email, role, ativo) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Carlos Silva', 'carlos@energiasolar.com', 'vendedor', true),
('550e8400-e29b-41d4-a716-446655440001', 'Ana Paula', 'ana@energiasolar.com', 'vendedor', true),
('550e8400-e29b-41d4-a716-446655440002', 'Roberto Santos', 'roberto@energiasolar.com', 'gestor', true)
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- 2. LEADS (20 leads variados)
-- =========================================
INSERT INTO leads (id, email, phone, tipo_cliente, nome, consumo_mensal, user_id, status, lead_score, origem, family_size, kwh_consumption, roof_type) VALUES
-- Leads NOVOS do chatbot
('a1111111-1111-1111-1111-111111111111', 'joao.silva@gmail.com', '(11) 98765-4321', 'residencial', 'João Silva', 450, NULL, 'novo', 0, 'chatbot', '4 pessoas', '400-600 kWh', 'Cerâmico'),
('a2222222-2222-2222-2222-222222222222', 'maria.santos@hotmail.com', '(11) 97654-3210', 'residencial', 'Maria Santos', 380, NULL, 'novo', 0, 'chatbot', '3 pessoas', '200-400 kWh', 'Fibrocimento'),
('a3333333-3333-3333-3333-333333333333', 'empresa.abc@empresa.com', '(11) 3456-7890', 'empresarial', 'Empresa ABC Ltda', 2500, NULL, 'novo', 0, 'chatbot', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Metálico'),

-- Leads QUALIFICADOS
('b1111111-1111-1111-1111-111111111111', 'pedro.oliveira@gmail.com', '(21) 98888-7777', 'residencial', 'Pedro Oliveira', 520, '550e8400-e29b-41d4-a716-446655440000', 'qualificado', 85, 'chatbot', '4 pessoas', 'Mais de 600 kWh', 'Cerâmico'),
('b2222222-2222-2222-2222-222222222222', 'julia.costa@yahoo.com', '(11) 96666-5555', 'residencial', 'Julia Costa', 410, '550e8400-e29b-41d4-a716-446655440000', 'qualificado', 75, 'chatbot', '3 pessoas', '400-600 kWh', 'Metálico'),
('b3333333-3333-3333-3333-333333333333', 'restaurante.bom@empresa.com', '(11) 3333-4444', 'empresarial', 'Restaurante Bom Sabor', 3200, '550e8400-e29b-41d4-a716-446655440001', 'qualificado', 90, 'indicacao', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Laje'),

-- Leads EM NUTRIÇÃO
('c1111111-1111-1111-1111-111111111111', 'lucas.ferreira@gmail.com', '(19) 99999-8888', 'residencial', 'Lucas Ferreira', 280, '550e8400-e29b-41d4-a716-446655440001', 'em_nutricao', 45, 'chatbot', '2 pessoas', '200-400 kWh', 'Fibrocimento'),
('c2222222-2222-2222-2222-222222222222', 'fernanda.lima@outlook.com', NULL, 'residencial', 'Fernanda Lima', 310, NULL, 'em_nutricao', 35, 'chatbot', '3 pessoas', '200-400 kWh', 'Cerâmico'),

-- Leads NÃO QUALIFICADOS
('d1111111-1111-1111-1111-111111111111', 'cliente.baixo@email.com', '(11) 91111-2222', 'residencial', 'Cliente Baixo Consumo', 150, NULL, 'nao_qualificado', 15, 'chatbot', '1 pessoa', 'Menos de 200 kWh', 'Fibrocimento'),

-- Leads CONVERTIDOS (viraram clientes)
('e1111111-1111-1111-1111-111111111111', 'roberto.alves@gmail.com', '(11) 98888-9999', 'residencial', 'Roberto Alves', 550, '550e8400-e29b-41d4-a716-446655440000', 'convertido', 100, 'chatbot', '5 pessoas', 'Mais de 600 kWh', 'Cerâmico'),
('e2222222-2222-2222-2222-222222222222', 'patricia.rocha@hotmail.com', '(21) 97777-6666', 'residencial', 'Patricia Rocha', 480, '550e8400-e29b-41d4-a716-446655440000', 'convertido', 95, 'indicacao', '4 pessoas', '400-600 kWh', 'Metálico'),
('e3333333-3333-3333-3333-333333333333', 'mercado.central@empresa.com', '(11) 3000-5000', 'empresarial', 'Mercado Central', 4500, '550e8400-e29b-41d4-a716-446655440001', 'convertido', 100, 'google', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Metálico'),

-- Leads PERDIDOS
('f1111111-1111-1111-1111-111111111111', 'cliente.perdido@email.com', '(11) 94444-3333', 'residencial', 'Cliente Perdido', 420, '550e8400-e29b-41d4-a716-446655440001', 'perdido', 60, 'chatbot', '3 pessoas', '400-600 kWh', 'Cerâmico'),

-- Mais leads para volume
('71111111-1111-1111-1111-111111111111', 'rafael.mendes@gmail.com', '(11) 95555-4444', 'residencial', 'Rafael Mendes', 390, '550e8400-e29b-41d4-a716-446655440000', 'qualificado', 70, 'chatbot', '3 pessoas', '200-400 kWh', 'Fibrocimento'),
('72222222-2222-2222-2222-222222222222', 'camila.dias@yahoo.com', '(19) 98888-7777', 'residencial', 'Camila Dias', 510, '550e8400-e29b-41d4-a716-446655440001', 'qualificado', 80, 'chatbot', '4 pessoas', 'Mais de 600 kWh', 'Cerâmico'),
('73333333-3333-3333-3333-333333333333', 'fabrica.xyz@empresa.com', '(11) 4000-6000', 'empresarial', 'Fábrica XYZ', 5800, '550e8400-e29b-41d4-a716-446655440000', 'qualificado', 95, 'indicacao', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Metálico'),
('74444444-4444-4444-4444-444444444444', 'bruno.cardoso@outlook.com', '(21) 96666-5555', 'residencial', 'Bruno Cardoso', 460, NULL, 'novo', 0, 'chatbot', '4 pessoas', '400-600 kWh', 'Metálico'),
('75555555-5555-5555-5555-555555555555', 'sabrina.torres@gmail.com', '(11) 97777-8888', 'residencial', 'Sabrina Torres', 420, '550e8400-e29b-41d4-a716-446655440001', 'qualificado', 75, 'chatbot', '3 pessoas', '400-600 kWh', 'Cerâmico'),
('76666666-6666-6666-6666-666666666666', 'loja.roupas@empresa.com', '(11) 3200-7000', 'empresarial', 'Loja de Roupas Fashion', 1800, '550e8400-e29b-41d4-a716-446655440000', 'qualificado', 85, 'google', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Laje'),
('77777777-7777-7777-7777-777777777777', 'diego.santos@hotmail.com', '(19) 99999-0000', 'residencial', 'Diego Santos', 380, NULL, 'novo', 0, 'chatbot', '3 pessoas', '200-400 kWh', 'Fibrocimento')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 3. QUALIFICAÇÃO (para os leads)
-- =========================================
INSERT INTO qualificacao (lead_id, family_size, kwh_consumption, roof_type, tipo_telhado, tipo_ligacao, sombreamento_percentual, decisor, prontidao_compra, viabilidade_tecnica) VALUES
('a1111111-1111-1111-1111-111111111111', '4 pessoas', '400-600 kWh', 'Cerâmico', 'ceramico', 'bifasica', 10, true, 'imediato', true),
('a2222222-2222-2222-2222-222222222222', '3 pessoas', '200-400 kWh', 'Fibrocimento', 'fibrocimento', 'monofasica', 5, false, '30_dias', true),
('a3333333-3333-3333-3333-333333333333', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Metálico', 'metalico', 'trifasica', 0, true, 'imediato', true),
('b1111111-1111-1111-1111-111111111111', '4 pessoas', 'Mais de 600 kWh', 'Cerâmico', 'ceramico', 'bifasica', 15, true, 'imediato', true),
('b2222222-2222-2222-2222-222222222222', '3 pessoas', '400-600 kWh', 'Metálico', 'metalico', 'bifasica', 8, true, '30_dias', true),
('b3333333-3333-3333-3333-333333333333', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Laje', 'laje', 'trifasica', 0, true, 'imediato', true),
('c1111111-1111-1111-1111-111111111111', '2 pessoas', '200-400 kWh', 'Fibrocimento', 'fibrocimento', 'monofasica', 20, false, '90_dias', true),
('c2222222-2222-2222-2222-222222222222', '3 pessoas', '200-400 kWh', 'Cerâmico', 'ceramico', 'monofasica', 12, false, 'mais_90_dias', true),
('d1111111-1111-1111-1111-111111111111', '1 pessoa', 'Menos de 200 kWh', 'Fibrocimento', 'fibrocimento', 'monofasica', 30, false, 'mais_90_dias', false),
('e1111111-1111-1111-1111-111111111111', '5 pessoas', 'Mais de 600 kWh', 'Cerâmico', 'ceramico', 'bifasica', 5, true, 'imediato', true),
('e2222222-2222-2222-2222-222222222222', '4 pessoas', '400-600 kWh', 'Metálico', 'metalico', 'bifasica', 10, true, 'imediato', true),
('e3333333-3333-3333-3333-333333333333', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Metálico', 'metalico', 'trifasica', 0, true, 'imediato', true),
('f1111111-1111-1111-1111-111111111111', '3 pessoas', '400-600 kWh', 'Cerâmico', 'ceramico', 'bifasica', 25, true, '30_dias', true),
('71111111-1111-1111-1111-111111111111', '3 pessoas', '200-400 kWh', 'Fibrocimento', 'fibrocimento', 'monofasica', 8, true, '30_dias', true),
('72222222-2222-2222-2222-222222222222', '4 pessoas', 'Mais de 600 kWh', 'Cerâmico', 'ceramico', 'bifasica', 12, true, 'imediato', true),
('73333333-3333-3333-3333-333333333333', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Metálico', 'metalico', 'trifasica', 0, true, 'imediato', true),
('74444444-4444-4444-4444-444444444444', '4 pessoas', '400-600 kWh', 'Metálico', 'metalico', 'bifasica', 10, false, '90_dias', true),
('75555555-5555-5555-5555-555555555555', '3 pessoas', '400-600 kWh', 'Cerâmico', 'ceramico', 'monofasica', 15, true, '30_dias', true),
('76666666-6666-6666-6666-666666666666', 'Mais de 5 pessoas', 'Mais de 600 kWh', 'Laje', 'laje', 'trifasica', 5, true, 'imediato', true),
('77777777-7777-7777-7777-777777777777', '3 pessoas', '200-400 kWh', 'Fibrocimento', 'fibrocimento', 'monofasica', 18, false, 'mais_90_dias', true)
ON CONFLICT (lead_id) DO NOTHING;

-- =========================================
-- 4. OPORTUNIDADES (no funil Kanban)
-- =========================================
INSERT INTO oportunidades (id, lead_id, etapa, valor_estimado, probabilidade, data_previsao_fechamento, data_ultima_atualizacao) VALUES
-- Levantamento
('0a111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'levantamento', 32000, 30, '2025-12-15', NOW() - INTERVAL '5 days'),
('0a222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'levantamento', 28000, 25, '2025-12-20', NOW() - INTERVAL '3 days'),

-- Simulação
('0a333333-3333-3333-3333-333333333333', '71111111-1111-1111-1111-111111111111', 'simulacao', 26000, 40, '2025-12-10', NOW() - INTERVAL '2 days'),
('0a444444-4444-4444-4444-444444444444', '72222222-2222-2222-2222-222222222222', 'simulacao', 30000, 45, '2025-12-12', NOW() - INTERVAL '1 day'),

-- Proposta
('0a555555-5555-5555-5555-555555555555', '75555555-5555-5555-5555-555555555555', 'proposta', 27000, 60, '2025-12-05', NOW() - INTERVAL '8 hours'),
('0a666666-6666-6666-6666-666666666666', 'b3333333-3333-3333-3333-333333333333', 'proposta', 180000, 65, '2025-12-08', NOW() - INTERVAL '1 day'),

-- Negociação
('0a777777-7777-7777-7777-777777777777', '73333333-3333-3333-3333-333333333333', 'negociacao', 290000, 75, '2025-12-01', NOW() - INTERVAL '12 hours'),
('0a888888-8888-8888-8888-888888888888', '76666666-6666-6666-6666-666666666666', 'negociacao', 95000, 70, '2025-12-03', NOW() - INTERVAL '6 hours'),

-- Fechamento
('0a999999-9999-9999-9999-999999999999', 'e1111111-1111-1111-1111-111111111111', 'fechamento', 33000, 90, '2025-11-28', NOW() - INTERVAL '3 hours'),

-- Perdido (para estatística)
('0a000000-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', 'perdido', 28000, 0, NULL, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 5. INTERAÇÕES (Timeline dos leads)
-- =========================================
INSERT INTO interacoes (lead_id, user_id, tipo, titulo, descricao, created_at) VALUES
-- João Silva (novo)
('a1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Lead cadastrado via chatbot', 'Lead preencheu formulário no site', NOW() - INTERVAL '2 days'),

-- Pedro Oliveira (qualificado)
('b1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Lead cadastrado via chatbot', 'Lead preencheu formulário no site', NOW() - INTERVAL '10 days'),
('b1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'chamada', 'Primeira ligação', 'Cliente muito interessado. Quer economia na conta de luz.', NOW() - INTERVAL '9 days'),
('b1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'email', 'Enviado informações sobre energia solar', 'Material explicativo sobre funcionamento e economia', NOW() - INTERVAL '8 days'),
('b1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'upload', 'Conta de luz recebida', 'Cliente enviou foto da conta de luz via WhatsApp', NOW() - INTERVAL '7 days'),
('b1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Oportunidade criada', 'Lead qualificado automaticamente. Oportunidade criada no funil.', NOW() - INTERVAL '6 days'),
('b1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'visita', 'Visita técnica agendada', 'Agendado para 25/11 às 14h', NOW() - INTERVAL '5 days'),

-- Julia Costa
('b2222222-2222-2222-2222-222222222222', NULL, 'sistema', 'Lead cadastrado via chatbot', 'Lead preencheu formulário no site', NOW() - INTERVAL '5 days'),
('b2222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'whatsapp', 'Contato via WhatsApp', 'Cliente respondeu rápido, muito interessada', NOW() - INTERVAL '4 days'),
('b2222222-2222-2222-2222-222222222222', NULL, 'sistema', 'Oportunidade criada', 'Lead qualificado. Etapa: Levantamento', NOW() - INTERVAL '3 days'),

-- Restaurante (empresarial)
('b3333333-3333-3333-3333-333333333333', NULL, 'sistema', 'Lead cadastrado', 'Indicação de cliente', NOW() - INTERVAL '12 days'),
('b3333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440001', 'chamada', 'Ligação com dono', 'Sr. Antonio muito receptivo. Conta alta (R$ 3.500/mês)', NOW() - INTERVAL '11 days'),
('b3333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440001', 'visita', 'Visita ao restaurante', 'Telhado em ótimas condições. Viabilidade 100%', NOW() - INTERVAL '9 days'),
('b3333333-3333-3333-3333-333333333333', NULL, 'sistema', 'Oportunidade criada', 'Lead qualificado. Alto potencial!', NOW() - INTERVAL '8 days'),
('b3333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440001', 'nota', 'Cliente pediu prazo', 'Precisa falar com sócio. Retornar em 3 dias', NOW() - INTERVAL '2 days'),

-- Roberto Alves (convertido)
('e1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Lead cadastrado via chatbot', 'Lead preencheu formulário', NOW() - INTERVAL '45 days'),
('e1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'chamada', 'Primeiro contato', 'Cliente super interessado', NOW() - INTERVAL '44 days'),
('e1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Oportunidade criada', 'Lead qualificado', NOW() - INTERVAL '43 days'),
('e1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'visita', 'Visita técnica', 'Telhado perfeito para instalação', NOW() - INTERVAL '40 days'),
('e1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'email', 'Proposta enviada', 'PROP-2025-001', NOW() - INTERVAL '35 days'),
('e1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Proposta visualizada', 'Cliente acessou o link da proposta', NOW() - INTERVAL '34 days'),
('e1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'chamada', 'Follow-up proposta', 'Cliente gostou. Pediu 5% desconto', NOW() - INTERVAL '33 days'),
('e1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Proposta aceita!', 'Cliente aceitou proposta com desconto aprovado', NOW() - INTERVAL '30 days'),
('e1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'nota', 'Contrato assinado', 'Entrada paga. Instalação agendada', NOW() - INTERVAL '28 days'),
('e1111111-1111-1111-1111-111111111111', NULL, 'sistema', 'Sistema instalado', 'Instalação concluída com sucesso', NOW() - INTERVAL '15 days'),

-- Mais interações para outros leads
('72222222-2222-2222-2222-222222222222', NULL, 'sistema', 'Lead cadastrado via chatbot', 'Novo lead', NOW() - INTERVAL '6 days'),
('72222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'whatsapp', 'Contato inicial', 'Cliente respondeu', NOW() - INTERVAL '5 days'),
('73333333-3333-3333-3333-333333333333', NULL, 'sistema', 'Lead cadastrado', 'Indicação', NOW() - INTERVAL '8 days'),
('73333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 'chamada', 'Ligação com gerente', 'Fábrica com conta de R$ 8.000/mês', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- =========================================
-- 6. PROPOSTAS
-- =========================================
INSERT INTO propostas (id, oportunidade_id, numero_proposta, versao, num_modulos, potencia_total_kwp, tipo_inversor, marca_modulos, valor_total, desconto_percentual, valor_final, economia_mensal_prevista, payback_meses, economia_25_anos, status, validade_dias, created_at) VALUES
-- Proposta enviada (aguardando)
('0b111111-1111-1111-1111-111111111111', '0a555555-5555-5555-5555-555555555555', 'PROP-2025-001', 1, 12, 5.4, 'Growatt 5kW', 'Canadian Solar', 29000, 0, 29000, 850, 34, 255000, 'enviada', 15, NOW() - INTERVAL '1 day'),

-- Proposta visualizada
('0b222222-2222-2222-2222-222222222222', '0a666666-6666-6666-6666-666666666666', 'PROP-2025-002', 1, 48, 21.6, 'Fronius 20kW', 'Jinko Solar', 195000, 5, 185250, 5200, 36, 1560000, 'visualizada', 15, NOW() - INTERVAL '2 days'),

-- Proposta em negociação (v2 com desconto)
('0b333333-3333-3333-3333-333333333333', '0a777777-7777-7777-7777-777777777777', 'PROP-2025-003', 1, 72, 32.4, 'Fronius 30kW', 'Canadian Solar', 310000, 0, 310000, 8500, 36, 2550000, 'visualizada', 15, NOW() - INTERVAL '5 days'),
('0b444444-4444-4444-4444-444444444444', '0a777777-7777-7777-7777-777777777777', 'PROP-2025-003', 2, 72, 32.4, 'Fronius 30kW', 'Canadian Solar', 310000, 8, 285200, 8500, 34, 2550000, 'enviada', 15, NOW() - INTERVAL '12 hours'),

-- Proposta aceita (cliente convertido)
('0b555555-5555-5555-5555-555555555555', '0a999999-9999-9999-9999-999999999999', 'PROP-2025-004', 1, 14, 6.3, 'Growatt 6kW', 'Jinko Solar', 35000, 5, 33250, 920, 36, 276000, 'aceita', 15, NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 7. CLIENTES INSTALADOS
-- =========================================
INSERT INTO clientes_instalados (id, lead_id, oportunidade_id, proposta_final_id, numero_contrato, valor_final_negociado, data_assinatura, data_instalacao, potencia_instalada_kwp, num_modulos_instalados, garantia_modulos_anos, garantia_inversor_anos, garantia_instalacao_anos, economia_real_mensal, geracao_media_mensal_kwh, nps, feedback) VALUES
-- Roberto Alves
('0d111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '0a999999-9999-9999-9999-999999999999', '0b555555-5555-5555-5555-555555555555', 'CONT-2025-001', 33250, '2025-10-20', '2025-11-05', 6.3, 14, 25, 5, 2, 920, 780, 9, 'Excelente serviço! Sistema funcionando perfeitamente. Economia já apareceu na primeira conta.'),

-- Patricia Rocha
('0d222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', NULL, NULL, 'CONT-2025-002', 27500, '2025-09-15', '2025-10-02', 5.4, 12, 25, 5, 2, 780, 650, 10, 'Recomendo! Equipe profissional e sistema de qualidade.'),

-- Mercado Central
('0d333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', NULL, NULL, 'CONT-2024-015', 225000, '2024-08-10', '2024-09-20', 25.2, 56, 25, 5, 2, 6200, 3100, 8, 'Ótimo investimento. Redução significativa na conta de energia.')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 8. TAREFAS
-- =========================================
INSERT INTO tarefas (id, lead_id, user_id, titulo, descricao, tipo, data_vencimento, prioridade, status) VALUES
-- Atrasadas
('0c111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'Ligar para João Silva', 'Fazer primeiro contato e qualificar', 'ligacao', NOW() - INTERVAL '2 days', 'alta', 'pendente'),
('0c222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'Solicitar fotos do telhado', 'Pedir fotos para análise técnica', 'follow_up', NOW() - INTERVAL '1 day', 'media', 'pendente'),

-- Hoje
('0c333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440001', 'Retornar ligação restaurante', 'Cliente pediu para retornar hoje sobre desconto', 'ligacao', NOW() + INTERVAL '4 hours', 'urgente', 'pendente'),
('0c444444-4444-4444-4444-444444444444', '72222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'Enviar proposta Camila', 'Finalizar e enviar proposta comercial', 'proposta', NOW() + INTERVAL '6 hours', 'alta', 'pendente'),

-- Próximas
('0c555555-5555-5555-5555-555555555555', '73333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 'Visita técnica fábrica XYZ', 'Agendar e realizar visita técnica', 'visita', NOW() + INTERVAL '2 days', 'alta', 'pendente'),
('0c666666-6666-6666-6666-666666666666', 'a2222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'Follow-up Maria Santos', 'Verificar interesse após envio de material', 'follow_up', NOW() + INTERVAL '3 days', 'media', 'pendente'),
('0c777777-7777-7777-7777-777777777777', '75555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440001', 'Follow-up proposta Sabrina', 'Cliente visualizou proposta há 2 dias', 'email', NOW() + INTERVAL '5 days', 'media', 'pendente')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 9. ATUALIZAR LEAD SCORES
-- =========================================
UPDATE leads SET lead_score = 100 WHERE id IN ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111');
UPDATE leads SET lead_score = 95 WHERE id IN ('e2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', '73333333-3333-3333-3333-333333333333');
UPDATE leads SET lead_score = 85 WHERE id IN ('72222222-2222-2222-2222-222222222222', '76666666-6666-6666-6666-666666666666');
UPDATE leads SET lead_score = 75 WHERE id IN ('b2222222-2222-2222-2222-222222222222', '71111111-1111-1111-1111-111111111111', '75555555-5555-5555-5555-555555555555');
UPDATE leads SET lead_score = 60 WHERE id = 'f1111111-1111-1111-1111-111111111111';
UPDATE leads SET lead_score = 45 WHERE id = 'c1111111-1111-1111-1111-111111111111';
UPDATE leads SET lead_score = 35 WHERE id = 'c2222222-2222-2222-2222-222222222222';
UPDATE leads SET lead_score = 15 WHERE id = 'd1111111-1111-1111-1111-111111111111';

-- =========================================
-- VERIFICAÇÃO
-- =========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DADOS FICTÍCIOS INSERIDOS COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuários: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Leads: %', (SELECT COUNT(*) FROM leads);
    RAISE NOTICE 'Qualificações: %', (SELECT COUNT(*) FROM qualificacao);
    RAISE NOTICE 'Oportunidades: %', (SELECT COUNT(*) FROM oportunidades);
    RAISE NOTICE 'Interações: %', (SELECT COUNT(*) FROM interacoes);
    RAISE NOTICE 'Propostas: %', (SELECT COUNT(*) FROM propostas);
    RAISE NOTICE 'Clientes Instalados: %', (SELECT COUNT(*) FROM clientes_instalados);
    RAISE NOTICE 'Tarefas: %', (SELECT COUNT(*) FROM tarefas);
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STATUS DOS LEADS:';
    RAISE NOTICE '  Novos: %', (SELECT COUNT(*) FROM leads WHERE status = 'novo');
    RAISE NOTICE '  Qualificados: %', (SELECT COUNT(*) FROM leads WHERE status = 'qualificado');
    RAISE NOTICE '  Em Nutrição: %', (SELECT COUNT(*) FROM leads WHERE status = 'em_nutricao');
    RAISE NOTICE '  Convertidos: %', (SELECT COUNT(*) FROM leads WHERE status = 'convertido');
    RAISE NOTICE '  Perdidos: %', (SELECT COUNT(*) FROM leads WHERE status = 'perdido');
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Agora recarregue o CRM no navegador!';
    RAISE NOTICE '========================================';
END $$;
