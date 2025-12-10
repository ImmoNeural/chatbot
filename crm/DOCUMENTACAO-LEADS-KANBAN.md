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

| Faixa de Consumo | Pontuação Atribuída |
|------------------|---------------------|
| >= 500 kWh | 30 pontos |
| >= 300 kWh | 20 pontos |
| >= 150 kWh | 10 pontos |
| < 150 kWh | 0 pontos |

<p class="table-caption">Tabela 1 - Pontuação por faixa de consumo mensal de energia</p>

## 1.2 Tipo de Cliente (até 10 pontos)

| Categoria do Cliente | Pontuação Atribuída |
|----------------------|---------------------|
| Comercial | 10 pontos |
| Residencial | 5 pontos |

<p class="table-caption">Tabela 2 - Pontuação por tipo de cliente</p>

## 1.3 Prontidão de Compra (até 40 pontos)

| Prazo para Decisão | Pontuação Atribuída |
|--------------------|---------------------|
| Imediata | 40 pontos |
| 1-3 meses | 30 pontos |
| 3-6 meses | 20 pontos |
| 6-12 meses | 10 pontos |
| Apenas pesquisando | 5 pontos |

<p class="table-caption">Tabela 3 - Pontuação por prontidão de compra</p>

## 1.4 É Decisor? (até 20 pontos)

| Perfil do Contato | Pontuação Atribuída |
|-------------------|---------------------|
| Sim, é decisor | 20 pontos |
| Não é decisor | 0 pontos |

<p class="table-caption">Tabela 4 - Pontuação por perfil decisor</p>

## 1.5 Viabilidade Técnica (até 10 pontos)

| Condição do Imóvel | Pontuação Atribuída |
|--------------------|---------------------|
| Telhado OK, pouco sombreamento | 10 pontos |
| Problemas técnicos identificados | 0 pontos |

<p class="table-caption">Tabela 5 - Pontuação por viabilidade técnica</p>

**Pontuação Máxima Possível:** 100 pontos

---

# 2. Status do Lead

| Tipo de Status | Descrição do Status | Indicador Visual |
|----------------|---------------------|------------------|
| novo | Lead recém chegado no sistema | Cinza |
| qualificado | Lead com score >= 50 pontos | Verde |
| em_nutricao | Aguardando momento certo para compra | Laranja |
| nao_qualificado | Não atende aos critérios mínimos | Vermelho |
| convertido | Lead convertido em oportunidade | Azul |
| perdido | Lead desistiu ou foi perdido | Vermelho |
| instalado | Instalação concluída com sucesso | Verde |

<p class="table-caption">Tabela 6 - Status disponíveis para classificação de leads</p>

**Qualificação Automática:** Quando o lead atinge score >= 50, o sistema automaticamente altera o status para qualificado.

---

# 3. Sistema de Automação

O sistema executa automações diárias para mover leads automaticamente baseado em inatividade.

## 3.1 Regras de Automação

| Situação Identificada | Condições Necessárias | Ação Automática |
|-----------------------|-----------------------|-----------------|
| Lead sem interação | 7-14 dias + motivo espera preenchido | Mover para em_nutricao |
| Lead sem resposta | 30+ dias + 3+ tentativas de contato | Marcar como perdido |
| Oportunidade parada | 60+ dias sem atualização | Marcar como perdido |
| Score alto atingido | >= 50 pontos | Marcar como qualificado |

<p class="table-caption">Tabela 7 - Regras de automação do sistema</p>

## 3.2 Campos para Automação

| Nome do Campo | Tabela Relacionada | Finalidade do Campo |
|---------------|--------------------|--------------------|
| motivo_espera | leads | Registrar motivo da espera |
| data_prevista_retorno | leads | Data prevista para retorno |
| tentativas_contato | leads | Contador de tentativas |
| data_ultima_tentativa | leads | Data da última tentativa |

<p class="table-caption">Tabela 8 - Campos utilizados pelo sistema de automação</p>

---

# 4. Kanban de Oportunidades

## 4.1 Fluxo do Funil de Vendas

<div class="flow-horizontal">
<div class="flow-block blue">LEVANTAMENTO</div>
<div class="flow-arrow-right">➔</div>
<div class="flow-block purple">SIMULAÇÃO</div>
<div class="flow-arrow-right">➔</div>
<div class="flow-block orange">PROPOSTA</div>
<div class="flow-arrow-right">➔</div>
<div class="flow-block green">NEGOCIAÇÃO</div>
<div class="flow-arrow-right">➔</div>
<div class="flow-block cyan">FECHAMENTO</div>
</div>

<p class="flow-caption">Figura 1 - Fluxo horizontal do funil de vendas</p>

## 4.2 Requisitos por Etapa

| Etapa do Funil | Ação Necessária | Critério para Avançar |
|----------------|-----------------|----------------------|
| Levantamento | Coletar documentos e fotos | Qualificação técnica preenchida |
| Simulação | Gerar proposta comercial | Proposta gerada no sistema |
| Proposta | Apresentar proposta ao cliente | Proposta enviada ao cliente |
| Negociação | Acompanhar aceite do cliente | Proposta aceita pelo cliente |
| Fechamento | Providenciar ART e homologação | Todos os dados completos |

<p class="table-caption">Tabela 9 - Requisitos para progressão no funil de vendas</p>

## 4.3 Regras de Movimentação

- Só é permitido avançar **uma etapa por vez**
- É permitido retornar para etapas anteriores
- O sistema valida automaticamente os requisitos antes de permitir avanço

---

# 5. Fluxo Completo do Lead

<div class="flow-vertical-container">
<div class="flow-block-lg blue">LEAD<br><span class="flow-subtitle">Score >= 50 pontos</span></div>
<div class="flow-arrow-down-big">▼</div>
<div class="flow-block-lg purple">OPORTUNIDADE<br><span class="flow-subtitle">5 etapas no Kanban</span></div>
<div class="flow-arrow-down-big">▼</div>
<div class="flow-block-lg green">CLIENTE INSTALADO<br><span class="flow-subtitle">Instalação concluída</span></div>
</div>

<p class="flow-caption">Figura 2 - Fluxo principal de conversão do lead</p>

<div class="flow-side-container">
<div class="flow-block-lg orange">EM NUTRIÇÃO<br><span class="flow-subtitle">7-14 dias sem interação</span></div>
<div class="flow-block-lg red">PERDIDO<br><span class="flow-subtitle">30 dias + 3 tentativas</span></div>
</div>

<p class="flow-caption">Figura 3 - Status alternativos do lead</p>

---

# 6. Tabelas do Sistema

| Nome da Tabela | Descrição da Finalidade |
|----------------|-------------------------|
| leads | Armazena dados básicos do lead |
| qualificacao | Armazena dados de qualificação técnica |
| oportunidades | Registra oportunidades no Kanban |
| propostas | Armazena propostas comerciais |
| status_negociacao | Controla status da negociação |
| instalacao | Armazena dados de agendamento |
| clientes_instalados | Registra clientes com instalação concluída |
| notificacoes | Armazena notificações automáticas |
| interacoes | Registra timeline de interações |

<p class="table-caption">Tabela 10 - Estrutura de tabelas do banco de dados</p>
