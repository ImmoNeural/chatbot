# Sistema de Leads e Kanban

**CRM Solar - Documentação Técnica**

*My Clever Bot - 2025*

---

# Sistema de Pontuação (Lead Score)

O lead score é calculado automaticamente de **0 a 100 pontos**, baseado em 5 fatores.

## Consumo Mensal (até 30 pontos)

| Consumo Mensal | Pontuação |
|----------------|-----------|
| >= 500 kWh | 30 pontos |
| >= 300 kWh | 20 pontos |
| >= 150 kWh | 10 pontos |
| < 150 kWh | 0 pontos |

## Tipo de Cliente (até 10 pontos)

| Tipo de Cliente | Pontuação |
|-----------------|-----------|
| Comercial | 10 pontos |
| Residencial | 5 pontos |

## Prontidão de Compra (até 40 pontos)

| Prontidão de Compra | Pontuação |
|---------------------|-----------|
| Imediata | 40 pontos |
| 1-3 meses | 30 pontos |
| 3-6 meses | 20 pontos |
| 6-12 meses | 10 pontos |
| Apenas pesquisando | 5 pontos |

## É Decisor? (até 20 pontos)

| É Decisor? | Pontuação |
|------------|-----------|
| Sim | 20 pontos |
| Não | 0 pontos |

## Viabilidade Técnica (até 10 pontos)

| Viabilidade Técnica | Pontuação |
|---------------------|-----------|
| Telhado OK, pouco sombreamento | 10 pontos |
| Problemas técnicos | 0 pontos |

**Pontuação Máxima:** 100 pontos

---

# Status do Lead

| Status | Descrição | Indicador |
|--------|-----------|-----------|
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

## Fluxo do Funil de Vendas

<div class="flow-container">
<div class="flow-step step-1">LEVANTAMENTO</div>
<div class="flow-arrow">→</div>
<div class="flow-step step-2">SIMULAÇÃO</div>
<div class="flow-arrow">→</div>
<div class="flow-step step-3">PROPOSTA</div>
<div class="flow-arrow">→</div>
<div class="flow-step step-4">NEGOCIAÇÃO</div>
<div class="flow-arrow">→</div>
<div class="flow-step step-5">FECHAMENTO</div>
</div>

## Requisitos por Etapa

| Etapa | Ação Necessária | Requisito para Avançar |
|-------|-----------------|------------------------|
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

# Fluxo Completo do Lead

<div class="flow-vertical">
<div class="flow-box box-lead">LEAD<br><small>Score >= 50</small></div>
<div class="flow-arrow-down">⬇</div>
<div class="flow-box box-opp">OPORTUNIDADE<br><small>5 etapas no Kanban</small></div>
<div class="flow-arrow-down">⬇</div>
<div class="flow-box box-installed">CLIENTE INSTALADO<br><small>Instalação concluída</small></div>
</div>

<div class="flow-side">
<div class="flow-box box-nutrition">EM NUTRIÇÃO<br><small>7-14 dias + motivo</small></div>
<div class="flow-box box-lost">PERDIDO<br><small>30 dias + 3 tentativas</small></div>
</div>

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
