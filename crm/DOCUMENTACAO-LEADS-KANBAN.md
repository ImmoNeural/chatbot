# Sistema de Leads e Kanban

**CRM Solar - Documentação Técnica**

*My Clever Bot - 2025*

---

## Índice

1. Sistema de Pontuação (Lead Score)
2. Status do Lead
3. Sistema de Automação
4. Kanban de Oportunidades
5. Fluxo Completo do Lead
6. Tabelas do Sistema

---

# 1. Sistema de Pontuação (Lead Score)

O lead score é calculado automaticamente de **0 a 100 pontos**, baseado em 5 fatores.

## 1.1 Consumo Mensal (até 30 pontos)

| Faixa de Consumo | Pontuação |
|------------------|-----------|
| >= 500 kWh | 30 pts |
| >= 300 kWh | 20 pts |
| >= 150 kWh | 10 pts |
| < 150 kWh | 0 pts |

<p class="table-caption">Tabela 1 - Pontuação por consumo mensal</p>

## 1.2 Tipo de Cliente (até 10 pontos)

| Categoria | Pontuação |
|-----------|-----------|
| Comercial | 10 pts |
| Residencial | 5 pts |

<p class="table-caption">Tabela 2 - Pontuação por tipo de cliente</p>

## 1.3 Prontidão de Compra (até 40 pontos)

| Prazo | Pontuação |
|-------|-----------|
| Imediata | 40 pts |
| 1-3 meses | 30 pts |
| 3-6 meses | 20 pts |
| 6-12 meses | 10 pts |
| Apenas pesquisando | 5 pts |

<p class="table-caption">Tabela 3 - Pontuação por prontidão</p>

## 1.4 É Decisor? (até 20 pontos)

| Perfil | Pontuação |
|--------|-----------|
| Sim | 20 pts |
| Não | 0 pts |

<p class="table-caption">Tabela 4 - Pontuação por perfil decisor</p>

## 1.5 Viabilidade Técnica (até 10 pontos)

| Condição | Pontuação |
|----------|-----------|
| Telhado OK, pouco sombreamento | 10 pts |
| Problemas técnicos | 0 pts |

<p class="table-caption">Tabela 5 - Pontuação por viabilidade</p>

---

# 2. Status do Lead

| Status | Descrição | Indicador |
|--------|-----------|-----------|
| novo | Lead recém chegado | Cinza |
| qualificado | Score >= 50 pts | Verde |
| em_nutricao | Aguardando momento | Laranja |
| nao_qualificado | Não atende critérios | Vermelho |
| convertido | Virou oportunidade | Azul |
| perdido | Desistiu/perdido | Vermelho |
| instalado | Instalação OK | Verde |

<p class="table-caption">Tabela 6 - Status do lead</p>

---

# 3. Sistema de Automação

## 3.1 Regras de Automação

| Situação | Condições | Resultado |
|----------|-----------|-----------|
| Sem interação | 7-14 dias + motivo | em_nutricao |
| Sem resposta | 30+ dias + 3+ tent. | perdido |
| Opp. parada | 60+ dias | perdido |
| Score alto | >= 50 pts | qualificado |

<p class="table-caption">Tabela 7 - Regras de automação</p>

## 3.2 Campos de Automação

| Campo | Tabela | Finalidade |
|-------|--------|------------|
| motivo_espera | leads | Motivo da espera |
| data_prevista_retorno | leads | Data retorno |
| tentativas_contato | leads | Contador |
| data_ultima_tentativa | leads | Última tentativa |

<p class="table-caption">Tabela 8 - Campos de automação</p>

---

# 4. Kanban de Oportunidades

## 4.1 Fluxo do Funil de Vendas

<div class="flow-snake">
<div class="flow-row">
<div class="flow-sm blue">LEVANTAMENTO</div>
<div class="arr">→</div>
<div class="flow-sm purple">SIMULAÇÃO</div>
<div class="arr">→</div>
<div class="flow-sm orange">PROPOSTA</div>
<div class="arr">→</div>
<div class="flow-sm green">NEGOCIAÇÃO</div>
<div class="arr">→</div>
<div class="flow-sm cyan">FECHAMENTO</div>
</div>
</div>

<p class="flow-caption">Figura 1 - Funil de vendas</p>

## 4.2 Requisitos por Etapa

| Etapa | Ação | Requisito |
|-------|------|-----------|
| Levantamento | Coletar docs/fotos | Qualificação OK |
| Simulação | Gerar proposta | Proposta gerada |
| Proposta | Apresentar | Proposta enviada |
| Negociação | Acompanhar | Proposta aceita |
| Fechamento | ART/Homologação | Dados completos |

<p class="table-caption">Tabela 9 - Requisitos do funil</p>

---

# 5. Fluxo Completo do Lead

<div class="flow-snake">
<div class="flow-row">
<div class="flow-sm blue">LEAD</div>
<div class="arr">→</div>
<div class="flow-sm purple">OPORTUNIDADE</div>
<div class="arr">→</div>
<div class="flow-sm green">INSTALADO</div>
</div>
<div class="flow-turn">↓</div>
<div class="flow-row-rev">
<div class="flow-sm red">PERDIDO</div>
<div class="arr">←</div>
<div class="flow-sm orange">EM NUTRIÇÃO</div>
</div>
</div>

<p class="flow-caption">Figura 2 - Fluxo completo do lead</p>

---

# 6. Tabelas do Sistema

| Tabela | Descrição |
|--------|-----------|
| leads | Dados do lead |
| qualificacao | Qualificação técnica |
| oportunidades | Kanban |
| propostas | Propostas comerciais |
| status_negociacao | Status negociação |
| instalacao | Agendamento |
| clientes_instalados | Clientes instalados |
| notificacoes | Notificações |
| interacoes | Timeline |

<p class="table-caption">Tabela 10 - Estrutura do banco</p>
