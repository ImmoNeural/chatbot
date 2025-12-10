# Documentação: Sistema de Leads e Kanban

## 1. Sistema de Pontuação (Lead Score)

O lead score é calculado automaticamente de 0 a 100 pontos, baseado em 5 fatores:

### Fatores e Pontuação

| Fator | Critério | Pontos |
|-------|----------|--------|
| **Consumo Mensal** | >= 500 kWh | 30 pts |
| | >= 300 kWh | 20 pts |
| | >= 150 kWh | 10 pts |
| | < 150 kWh | 0 pts |
| **Tipo de Cliente** | Comercial | 10 pts |
| | Residencial | 5 pts |
| **Prontidão de Compra** | Imediata | 40 pts |
| | 1-3 meses | 30 pts |
| | 3-6 meses | 20 pts |
| | 6-12 meses | 10 pts |
| | Apenas pesquisando | 5 pts |
| **É Decisor?** | Sim | 20 pts |
| | Não | 0 pts |
| **Viabilidade Técnica** | Sim (telhado OK, pouco sombreamento) | 10 pts |
| | Não | 0 pts |

**Pontuação Máxima Possível:** 100 pontos (30 + 10 + 40 + 20 + 10 = 110, limitado a 100)

### Cálculo Automático

O score é recalculado automaticamente sempre que:
- O `consumo_mensal` ou `tipo_cliente` do lead muda
- Os dados de `qualificacao` são atualizados (prontidão, decisor, viabilidade)

---

## 2. Status do Lead

| Status | Descrição | Cor |
|--------|-----------|-----|
| `novo` | Lead recém chegado, ainda não qualificado | Cinza |
| `qualificado` | Lead com score >= 50 pontos | Verde |
| `em_nutricao` | Lead ainda não está pronto, precisa ser nutrido | Laranja |
| `nao_qualificado` | Lead não atende os critérios mínimos | Vermelho |
| `convertido` | Lead virou oportunidade no Kanban | Azul |
| `perdido` | Lead desistiu ou foi perdido | Vermelho |
| `instalado` | Instalação concluída | Verde |

### Qualificação Automática

Quando o lead atinge **score >= 50 pontos**, ele é automaticamente movido para status `qualificado`.

---

## 3. Kanban de Oportunidades

O Kanban representa o funil de vendas com 5 etapas:

```
LEVANTAMENTO → SIMULAÇÃO → PROPOSTA → NEGOCIAÇÃO → FECHAMENTO
```

### 3.1 Etapas e Requisitos

#### Etapa 1: Levantamento
**O que fazer:** Coletar documentos, fotos do local e fazer qualificação técnica

**Requisito para avançar:** Ter a qualificação técnica preenchida com:
- Tipo de telhado
- Estado do telhado (bom/ruim)
- Sombreamento (sim/não)
- Prontidão de compra
- Se é decisor

---

#### Etapa 2: Simulação
**O que fazer:** Gerar proposta comercial usando o simulador

**Requisito para avançar:** Ter pelo menos uma proposta gerada para o lead

---

#### Etapa 3: Proposta
**O que fazer:** Apresentar proposta ao cliente, negociar valores

**Requisito para avançar:** A proposta precisa ser enviada ao cliente

---

#### Etapa 4: Negociação
**O que fazer:** Acompanhar aceite da proposta

**Requisito para avançar:** A proposta precisa ter status = `aceita`

Isso é atualizado em dois lugares:
- Tabela `propostas` campo `status` = 'aceita'
- Tabela `status_negociacao` campo `proposta_aceita` = true

---

#### Etapa 5: Fechamento
**O que fazer:**
- Preencher ART (Anotação de Responsabilidade Técnica)
- Registrar protocolo de homologação junto à concessionária
- Agendar data da instalação

**Requisito para marcar como instalado:**
- Número da ART preenchido
- Protocolo de homologação preenchido
- Data de instalação agendada

---

### 3.2 Regras de Movimentação

1. **Só pode avançar uma etapa por vez** - Não é permitido pular etapas
2. **Pode voltar etapas** - É permitido voltar para etapas anteriores
3. **Validação automática** - O sistema valida se os requisitos foram cumpridos antes de permitir o avanço

---

## 4. Fluxo: Lead → Oportunidade → Cliente Instalado

```
┌─────────────┐      ┌──────────────────┐      ┌───────────────────┐
│    LEAD     │ ──→  │   OPORTUNIDADE   │ ──→  │ CLIENTE INSTALADO │
│             │      │    (Kanban)      │      │                   │
│ score >= 50 │      │ 5 etapas         │      │ Instalação OK     │
└─────────────┘      └──────────────────┘      └───────────────────┘
```

### Quando um lead vira oportunidade?
Manualmente, quando o usuário cria uma oportunidade para o lead no Kanban.

### Quando a oportunidade vira cliente instalado?
Quando o usuário clica em "Marcar como Instalado" na etapa de Fechamento, após:
1. ART preenchida
2. Homologação protocolada
3. Instalação realizada

---

## 5. Lead Perdido

Um lead pode ser marcado como **perdido** a qualquer momento. Isso acontece quando:

- O cliente desiste da compra
- O cliente não tem viabilidade técnica
- O cliente foi para um concorrente
- Contato perdido (não responde)

**Como marcar:** Alterar o status do lead para `perdido` na tela de edição.

Se o lead estava no Kanban (tinha oportunidade), a oportunidade também é marcada como `perdido`.

---

## 6. Lead em Nutrição

Um lead entra em **nutrição** quando:

- Ainda não está pronto para comprar (prontidão = "6-12 meses" ou "apenas pesquisando")
- Está aguardando algo (construção, financiamento, etc.)
- Score baixo mas com potencial futuro

**Campo importante:** `motivo_espera` - descreve por que o lead está em espera

O status `em_nutricao` indica que o lead precisa receber comunicações periódicas (e-mails, WhatsApp) para manter o relacionamento até que esteja pronto.

---

## 7. Resumo dos Requisitos por Etapa

| Etapa | Requisito para Avançar |
|-------|------------------------|
| Levantamento → Simulação | Qualificação técnica preenchida |
| Simulação → Proposta | Proposta gerada |
| Proposta → Negociação | Proposta enviada |
| Negociação → Fechamento | Proposta aceita pelo cliente |
| Fechamento → Instalado | ART + Homologação + Data instalação |

---

## 8. Tabelas Envolvidas

| Tabela | Descrição |
|--------|-----------|
| `leads` | Dados básicos do lead (nome, email, consumo, score, status) |
| `qualificacao` | Dados de qualificação técnica (telhado, prontidão, decisor) |
| `oportunidades` | Registro no Kanban (etapa atual, datas) |
| `propostas` | Propostas comerciais geradas |
| `status_negociacao` | Status da negociação (proposta aceita, contrato assinado) |
| `instalacao` | Dados de agendamento (ART, homologação, data) |
| `clientes_instalados` | Clientes com instalação concluída |
