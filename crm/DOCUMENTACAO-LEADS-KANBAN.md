---
title: "Sistema de Leads e Kanban"
subtitle: "CRM Solar - Documentação Técnica"
author: "Neureka AI"
date: "2025"
toc: true
---

# Sistema de Pontuação (Lead Score)

O lead score é calculado automaticamente de **0 a 100 pontos**, baseado em 5 fatores.

## Consumo Mensal (até 30 pontos)

- **>= 500 kWh:** 30 pontos
- **>= 300 kWh:** 20 pontos
- **>= 150 kWh:** 10 pontos
- **< 150 kWh:** 0 pontos

## Tipo de Cliente (até 10 pontos)

- **Comercial:** 10 pontos
- **Residencial:** 5 pontos

## Prontidão de Compra (até 40 pontos)

- **Imediata:** 40 pontos
- **1-3 meses:** 30 pontos
- **3-6 meses:** 20 pontos
- **6-12 meses:** 10 pontos
- **Apenas pesquisando:** 5 pontos

## É Decisor? (até 20 pontos)

- **Sim:** 20 pontos
- **Não:** 0 pontos

## Viabilidade Técnica (até 10 pontos)

- **Telhado OK e pouco sombreamento:** 10 pontos
- **Problemas técnicos:** 0 pontos

**Pontuação Máxima:** 100 pontos

## Cálculo Automático

O score é recalculado automaticamente sempre que:

- O consumo mensal ou tipo de cliente do lead muda
- Os dados de qualificação são atualizados

---

# Status do Lead

- **novo:** Lead recém chegado (Cinza)
- **qualificado:** Score >= 50 pontos (Verde)
- **em_nutricao:** Não está pronto, precisa ser nutrido (Laranja)
- **nao_qualificado:** Não atende critérios mínimos (Vermelho)
- **convertido:** Virou oportunidade no Kanban (Azul)
- **perdido:** Desistiu ou foi perdido (Vermelho)
- **instalado:** Instalação concluída (Verde)

## Qualificação Automática

Quando o lead atinge **score >= 50 pontos**, ele é automaticamente movido para status qualificado.

---

# Sistema de Automação

O sistema executa automações diárias para mover leads automaticamente baseado em inatividade.

## Lead para Em Nutrição (Automático)

Um lead é movido automaticamente para **em_nutricao** quando:

- **Status atual:** qualificado
- **Dias sem interação:** Entre 7 e 14 dias
- **Motivo de espera:** Preenchido

**Motivos de espera comuns:**

- Vai construir a casa em 6 meses
- Aguardando aprovação de financiamento
- Precisa consultar cônjuge
- Esperando mudança de residência

## Lead para Perdido (Automático)

Um lead é marcado automaticamente como **perdido** quando:

- **Status atual:** NÃO é perdido nem convertido
- **Dias sem resposta:** 30 dias ou mais
- **Tentativas de contato:** 3 ou mais tentativas

## Oportunidade para Perdida (Automático)

Uma oportunidade no Kanban é marcada como **perdido** quando:

- **Etapa atual:** NÃO é perdido nem concluida
- **Dias sem atualização:** 60 dias ou mais

## Notificações e Reversão

Quando uma mudança automática acontece:

1. O sistema cria uma notificação para o usuário
2. A mudança fica registrada no histórico
3. O usuário pode reverter a mudança se necessário

---

# Kanban de Oportunidades

O Kanban representa o funil de vendas com 5 etapas:

**LEVANTAMENTO → SIMULAÇÃO → PROPOSTA → NEGOCIAÇÃO → FECHAMENTO**

## Etapa 1: Levantamento

**O que fazer:** Coletar documentos, fotos do local e fazer qualificação técnica

**Requisito para avançar:** Ter a qualificação técnica preenchida com:

- Tipo de telhado
- Estado do telhado (bom/ruim)
- Sombreamento (sim/não)
- Prontidão de compra
- Se é decisor

## Etapa 2: Simulação

**O que fazer:** Gerar proposta comercial usando o simulador

**Requisito para avançar:** Ter pelo menos uma proposta gerada para o lead

## Etapa 3: Proposta

**O que fazer:** Apresentar proposta ao cliente, negociar valores

**Requisito para avançar:** A proposta precisa ser enviada ao cliente

## Etapa 4: Negociação

**O que fazer:** Acompanhar aceite da proposta

**Requisito para avançar:** A proposta precisa ter status **aceita**

Isso é atualizado em dois lugares:

- Tabela propostas: campo status = aceita
- Tabela status_negociacao: campo proposta_aceita = true

## Etapa 5: Fechamento

**O que fazer:**

- Preencher ART (Anotação de Responsabilidade Técnica)
- Registrar protocolo de homologação junto à concessionária
- Agendar data da instalação

**Requisito para marcar como instalado:**

- Número da ART preenchido
- Protocolo de homologação preenchido
- Data de instalação agendada

## Regras de Movimentação

1. **Só pode avançar uma etapa por vez** - Não é permitido pular etapas
2. **Pode voltar etapas** - É permitido voltar para etapas anteriores
3. **Validação automática** - O sistema valida requisitos antes de permitir o avanço

---

# Fluxo Completo

## Quando um lead vira oportunidade?

Manualmente, quando o usuário cria uma oportunidade para o lead no Kanban.

## Quando a oportunidade vira cliente instalado?

Quando o usuário clica em "Marcar como Instalado" na etapa de Fechamento, após:

1. ART preenchida
2. Homologação protocolada
3. Instalação realizada

---

# Resumo das Automações

- **Lead qualificado sem interação (7-14 dias + motivo espera):** vai para em_nutricao
- **Lead sem resposta (30+ dias + 3+ tentativas):** vai para perdido
- **Oportunidade parada (60+ dias sem atualização):** vai para perdido
- **Lead com score >= 50:** vai para qualificado

---

# Campos Importantes para Automação

- **motivo_espera** (leads): Por que o lead está esperando
- **data_prevista_retorno** (leads): Quando o cliente estará pronto
- **tentativas_contato** (leads): Quantas vezes tentou contato
- **data_ultima_tentativa** (leads): Data da última tentativa

---

# Tabelas do Sistema

- **leads:** Dados básicos do lead
- **qualificacao:** Dados de qualificação técnica
- **oportunidades:** Registro no Kanban
- **propostas:** Propostas comerciais geradas
- **status_negociacao:** Status da negociação
- **instalacao:** Dados de agendamento
- **clientes_instalados:** Clientes com instalação concluída
- **notificacoes:** Notificações de automação
- **historico_mudancas_automaticas:** Histórico de mudanças automáticas
- **interacoes:** Timeline de interações com o lead
