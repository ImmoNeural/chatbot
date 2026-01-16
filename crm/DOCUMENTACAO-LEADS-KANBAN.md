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

## 3. Sistema de Automação

O sistema executa automações diárias para mover leads automaticamente baseado em inatividade.

### 3.1 Lead → Em Nutrição (Automático)

Um lead é movido **automaticamente** para `em_nutricao` quando:

| Critério | Condição |
|----------|----------|
| Status atual | `qualificado` |
| Dias sem interação | Entre **7 e 14 dias** |
| Motivo de espera | **Preenchido** (campo `motivo_espera` não vazio) |

**Motivos de espera comuns:**
- "Vai construir a casa em 6 meses"
- "Aguardando aprovação de financiamento"
- "Precisa consultar cônjuge"
- "Esperando mudança de residência"

### 3.2 Lead → Perdido (Automático)

Um lead é marcado **automaticamente** como `perdido` quando:

| Critério | Condição |
|----------|----------|
| Status atual | NÃO é `perdido` nem `convertido` |
| Dias sem resposta | **30 dias ou mais** |
| Tentativas de contato | **3 ou mais** tentativas sem resposta |

### 3.3 Oportunidade → Perdida (Automático)

Uma oportunidade no Kanban é marcada como `perdido` quando:

| Critério | Condição |
|----------|----------|
| Etapa atual | NÃO é `perdido` nem `concluida` |
| Dias sem atualização | **60 dias ou mais** |

### 3.4 Notificações e Reversão

Quando uma mudança automática acontece:
1. O sistema cria uma **notificação** para o usuário
2. A mudança fica registrada no **histórico**
3. O usuário pode **reverter** a mudança se necessário

---

## 4. Kanban de Oportunidades

O Kanban representa o funil de vendas com 5 etapas:

```
LEVANTAMENTO → SIMULAÇÃO → PROPOSTA → NEGOCIAÇÃO → FECHAMENTO
```

### 4.1 Etapas e Requisitos

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

### 4.2 Regras de Movimentação

1. **Só pode avançar uma etapa por vez** - Não é permitido pular etapas
2. **Pode voltar etapas** - É permitido voltar para etapas anteriores
3. **Validação automática** - O sistema valida se os requisitos foram cumpridos antes de permitir o avanço

---

## 5. Fluxo Completo: Lead → Cliente Instalado

```
┌─────────────┐      ┌──────────────────┐      ┌───────────────────┐
│    LEAD     │ ──→  │   OPORTUNIDADE   │ ──→  │ CLIENTE INSTALADO │
│             │      │    (Kanban)      │      │                   │
│ score >= 50 │      │ 5 etapas         │      │ Instalação OK     │
└─────────────┘      └──────────────────┘      └───────────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────────┐
│ EM NUTRIÇÃO │      │     PERDIDO      │
│             │      │                  │
│ 7-14 dias + │      │ 30 dias + 3 tent │
│ motivo esp. │      │ ou 60 dias opp   │
└─────────────┘      └──────────────────┘
```

### Quando um lead vira oportunidade?
Manualmente, quando o usuário cria uma oportunidade para o lead no Kanban.

### Quando a oportunidade vira cliente instalado?
Quando o usuário clica em "Marcar como Instalado" na etapa de Fechamento, após:
1. ART preenchida
2. Homologação protocolada
3. Instalação realizada

---

## 6. Resumo das Automações

| Situação | Condições | Resultado |
|----------|-----------|-----------|
| Lead qualificado sem interação | 7-14 dias + motivo espera | → `em_nutricao` |
| Lead sem resposta | 30+ dias + 3+ tentativas | → `perdido` |
| Oportunidade parada | 60+ dias sem atualização | → `perdido` |
| Lead com score alto | score >= 50 | → `qualificado` |

---

## 7. Campos Importantes para Automação

| Campo | Tabela | Descrição |
|-------|--------|-----------|
| `motivo_espera` | leads | Por que o lead está esperando |
| `data_prevista_retorno` | leads | Quando o cliente estará pronto |
| `tentativas_contato` | leads | Quantas vezes tentou contato sem resposta |
| `data_ultima_tentativa` | leads | Data da última tentativa de contato |

---

## 8. Tabelas do Sistema

| Tabela | Descrição |
|--------|-----------|
| `leads` | Dados básicos do lead (nome, email, consumo, score, status) |
| `qualificacao` | Dados de qualificação técnica (telhado, prontidão, decisor) |
| `oportunidades` | Registro no Kanban (etapa atual, datas) |
| `propostas` | Propostas comerciais geradas |
| `status_negociacao` | Status da negociação (proposta aceita, contrato assinado) |
| `instalacao` | Dados de agendamento (ART, homologação, data) |
| `clientes_instalados` | Clientes com instalação concluída |
| `notificacoes` | Notificações de automação para o usuário |
| `historico_mudancas_automaticas` | Histórico de mudanças automáticas (reversíveis) |
| `interacoes` | Timeline de interações com o lead |
