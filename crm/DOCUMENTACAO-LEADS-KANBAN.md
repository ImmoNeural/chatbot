# Sistema de Leads e Kanban

**CRM Solar - Documentação Técnica**

*Neureka AI - 2025*

---

# Sistema de Pontuação (Lead Score)

O lead score é calculado automaticamente de **0 a 100 pontos**, baseado em 5 fatores.

## Consumo Mensal (até 30 pontos)

| Consumo | Pontos |
|---------|--------|
| >= 500 kWh | 30 |
| >= 300 kWh | 20 |
| >= 150 kWh | 10 |
| < 150 kWh | 0 |

## Tipo de Cliente (até 10 pontos)

| Tipo | Pontos |
|------|--------|
| Comercial | 10 |
| Residencial | 5 |

## Prontidão de Compra (até 40 pontos)

| Prontidão | Pontos |
|-----------|--------|
| Imediata | 40 |
| 1-3 meses | 30 |
| 3-6 meses | 20 |
| 6-12 meses | 10 |
| Apenas pesquisando | 5 |

## É Decisor? (até 20 pontos)

| Resposta | Pontos |
|----------|--------|
| Sim | 20 |
| Não | 0 |

## Viabilidade Técnica (até 10 pontos)

| Situação | Pontos |
|----------|--------|
| Telhado OK, pouco sombreamento | 10 |
| Problemas técnicos | 0 |

**Pontuação Máxima:** 100 pontos

---

# Status do Lead

| Status | Descrição | Cor |
|--------|-----------|-----|
| novo | Lead recém chegado | Cinza |
| qualificado | Score >= 50 pontos | Verde |
| em_nutricao | Aguardando momento certo | Laranja |
| nao_qualificado | Não atende critérios | Vermelho |
| convertido | Virou oportunidade | Azul |
| perdido | Desistiu ou perdido | Vermelho |
| instalado | Instalação concluída | Verde |

**Qualificação Automática:** Quando o lead atinge score >= 50, muda automaticamente para qualificado.

---

# Sistema de Automação

O sistema move leads automaticamente baseado em inatividade.

## Regras de Automação

| Situação | Condições | Resultado |
|----------|-----------|-----------|
| Lead sem interação | 7-14 dias + motivo espera | em_nutricao |
| Lead sem resposta | 30+ dias + 3+ tentativas | perdido |
| Oportunidade parada | 60+ dias sem atualização | perdido |
| Score alto | >= 50 pontos | qualificado |

## Campos para Automação

| Campo | Tabela | Descrição |
|-------|--------|-----------|
| motivo_espera | leads | Por que está esperando |
| data_prevista_retorno | leads | Quando estará pronto |
| tentativas_contato | leads | Tentativas sem resposta |
| data_ultima_tentativa | leads | Última tentativa |

---

# Kanban de Oportunidades

**Fluxo:** LEVANTAMENTO → SIMULAÇÃO → PROPOSTA → NEGOCIAÇÃO → FECHAMENTO

## Requisitos por Etapa

| Etapa | O que fazer | Requisito para avançar |
|-------|-------------|------------------------|
| Levantamento | Coletar docs e fotos | Qualificação preenchida |
| Simulação | Gerar proposta | Proposta gerada |
| Proposta | Apresentar ao cliente | Proposta enviada |
| Negociação | Acompanhar aceite | Proposta aceita |
| Fechamento | ART e homologação | Dados completos |

## Regras de Movimentação

- Só pode avançar **uma etapa por vez**
- Pode voltar para etapas anteriores
- Sistema valida requisitos automaticamente

---

# Fluxo Completo

## Quando um lead vira oportunidade?

Manualmente, quando o usuário cria uma oportunidade no Kanban.

## Quando vira cliente instalado?

Ao clicar "Marcar como Instalado" na etapa Fechamento, após:

1. ART preenchida
2. Homologação protocolada
3. Instalação realizada

---

# Tabelas do Sistema

| Tabela | Descrição |
|--------|-----------|
| leads | Dados básicos do lead |
| qualificacao | Qualificação técnica |
| oportunidades | Registro no Kanban |
| propostas | Propostas comerciais |
| status_negociacao | Status da negociação |
| instalacao | Dados de agendamento |
| clientes_instalados | Clientes instalados |
| notificacoes | Notificações automáticas |
| interacoes | Timeline do lead |
