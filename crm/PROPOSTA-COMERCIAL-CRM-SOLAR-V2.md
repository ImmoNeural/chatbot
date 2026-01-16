# PROPOSTA COMERCIAL
## CRM Solar - Sistema de Gestão Completo para Empresas de Energia Solar

---

**Versão:** 2.0
**Data:** Dezembro de 2025
**Validade:** 30 dias

---

\newpage

## 1. APRESENTAÇÃO DO SISTEMA

O **CRM Solar** é uma solução completa e moderna para gestão de empresas de energia fotovoltaica, desenvolvida com tecnologias de ponta para maximizar a conversão de leads e otimizar processos comerciais.

### 1.1 Tecnologias Utilizadas

| Componente | Tecnologia | Benefício |
|------------|------------|-----------|
| Frontend | HTML5, CSS3, JavaScript | Interface responsiva e moderna |
| Backend | Supabase (PostgreSQL) | Escalabilidade e segurança |
| Autenticação | Supabase Auth | Login seguro com 2FA |
| Chatbot | Widget customizado + n8n | Captação automática de leads |
| Mensageria | Twilio WhatsApp API | Comunicação oficial |
| Hospedagem | Cloud flexível | Alta disponibilidade |

---

## 2. FUNCIONALIDADES INCLUÍDAS

### 2.1 Gestão de Leads

- **Captação automática** via chatbot inteligente no site
- **Qualificação automatizada** com perguntas personalizadas
- **Lead Scoring** (0-100 pontos) baseado em critérios configuráveis
- **Importação/Exportação** de dados em CSV e Excel
- **Download de dados e documentos** do cliente em um clique

### 2.2 Kanban de Oportunidades

- **Visualização em colunas** das etapas do funil de vendas
- **Drag & Drop** para movimentação manual
- **Movimentação semi-automática** progressiva ou retrógrada baseada em regras:
  - Progressão automática ao completar checklist da etapa
  - Retrocesso automático por inatividade ou pendências
  - Notificações de mudança de status
- **Filtros avançados** por vendedor, período, valor

### 2.3 Propostas Comerciais

- **Geração automática** de propostas em PDF
- **Memorial técnico** com dimensionamento solar
- **Cálculo de ROI** e payback automático
- **Assinatura digital** integrada
- **Versionamento** de propostas

### 2.4 Comunicação Integrada

- **WhatsApp Business API** oficial (via Twilio)
- **Templates** de mensagens aprovados
- **Histórico completo** de conversas por lead
- **Disparo em massa** segmentado
- **Chatbot 24/7** para atendimento inicial

### 2.5 Automações

- **Nutrição automática** de leads frios
- **Alertas de follow-up** por inatividade
- **Marcação automática** de leads perdidos (30+ dias sem resposta)
- **Distribuição round-robin** de leads entre vendedores

### 2.6 Relatórios e Dashboards

- **Dashboard em tempo real** com KPIs principais
- **Taxa de conversão** por etapa do funil
- **Performance por vendedor**
- **Projeção de receita** (pipeline)
- **Exportação** de relatórios

### 2.7 Multi-tenant (SaaS)

- **Isolamento total** de dados por empresa
- **Planos flexíveis** (Microempresa, Pequeno Porte, Plus)
- **Customização** de logo e cores por tenant
- **Gestão de usuários** e permissões

---

## 3. NOVOS RECURSOS DESTA VERSÃO

### 3.1 Download de Dados e Documentos

Funcionalidade que permite aos usuários baixar todas as informações e documentos de um cliente de forma consolidada:

| Recurso | Descrição |
|---------|-----------|
| **Exportar Lead** | Dados cadastrais, qualificação, histórico |
| **Documentos** | Propostas, contratos, ARTs em ZIP |
| **Interações** | Timeline completa de comunicações |
| **Formato** | PDF consolidado ou arquivos separados |

**Benefício:** Facilita auditorias, handover entre vendedores e backup de informações.

### 3.2 Movimentação Semi-Automática do Kanban

Sistema inteligente de progressão e retrocesso de cards:

**Progressão Automática:**
```
Qualificado → Proposta Enviada
(quando proposta é gerada e enviada)

Proposta Enviada → Em Negociação
(quando cliente visualiza proposta)

Em Negociação → Contrato
(quando proposta é aceita)
```

**Retrocesso Automático:**
```
Em Negociação → Qualificado
(após 14 dias sem interação)

Qualificado → Em Nutrição
(após 7 dias sem resposta + 3 tentativas)
```

**Configurável:** O administrador pode ajustar regras e prazos.

---

## 4. RECURSOS ADICIONAIS (OPCIONAIS)

### 4.1 Tradução para Espanhol

| Item | Descrição |
|------|-----------|
| **Escopo** | Interface completa do CRM, chatbot, propostas, emails |
| **Método** | Sistema i18n com seletor de idioma |
| **Manutenção** | Fácil adição de novos idiomas futuros |
| **Prazo** | 15 dias úteis |

| **Investimento** | **R$ 5.000,00** |
|------------------|-----------------|

---

### 4.2 Módulo de Eletromobilidade

Expansão do sistema para incluir gestão de projetos de carregadores de veículos elétricos:

| Funcionalidade | Descrição |
|----------------|-----------|
| **Qualificação EV** | Chatbot específico para eletromobilidade |
| **Campos técnicos** | Garagem, veículos, kVA, distância ao quadro |
| **Dimensionamento** | Cálculo de carregadores (7kW a 150kW) |
| **Propostas EV** | Templates para venda, locação, EV as a Service |
| **Checklist** | Vistoria específica para instalação de carregadores |
| **Integração CPMS** | Preparado para sistemas de gestão de carga |

**Benefícios:**
- Cross-sell para clientes de solar
- Novo mercado em expansão
- Sistema unificado (mesma base de clientes)

| **Investimento** | **R$ 15.000,00** |
|------------------|------------------|

---

## 5. CUSTOS OPERACIONAIS MENSAIS

### 5.1 APIs e Infraestrutura

| Serviço | Descrição | Custo Mensal |
|---------|-----------|--------------|
| **Supabase** | Banco de dados PostgreSQL + Auth | ~US$ 25 |
| **Twilio WhatsApp** | API oficial (por mensagem) | ~US$ 20* |
| **Domínio** | Registro anual (.com.br) | ~US$ 3 |
| **Hospedagem** | Vercel/Netlify ou similar | US$ 0-10 |

| **Total Estimado** | **< US$ 60/mês** |
|--------------------|------------------|

*Custo Twilio varia conforme volume de mensagens. Estimativa para ~500 mensagens/mês.

### 5.2 Detalhamento Twilio (WhatsApp)

| Tipo de Mensagem | Custo (Brasil) |
|------------------|----------------|
| Marketing | ~R$ 0,35/msg |
| Utilidade | ~R$ 0,05/msg |
| Autenticação | ~R$ 0,02/msg |
| Serviço (resposta) | Gratuito* |

*Gratuito dentro da janela de 24h após mensagem do cliente.

---

## 6. PLANOS DE ASSINATURA (SaaS)

### Para seus clientes finais:

| Plano | Usuários | Leads/mês | Preço Sugerido |
|-------|----------|-----------|----------------|
| **Microempresa** | Até 2 | Até 100 | R$ 80/mês |
| **Pequeno Porte** | Até 5 | Até 500 | R$ 250/mês |
| **Pequeno Porte Plus** | Até 10 | Ilimitado | R$ 400+/mês |

### Projeção de Receita (6 meses)

| Mês | Microempresa | Peq. Porte | Plus | MRR |
|-----|--------------|------------|------|-----|
| 1 | 3 | 1 | 0 | R$ 490 |
| 2 | 5 | 2 | 1 | R$ 1.300 |
| 3 | 8 | 4 | 2 | R$ 2.440 |
| 4 | 12 | 6 | 3 | R$ 3.660 |
| 5 | 15 | 8 | 4 | R$ 4.800 |
| 6 | 20 | 10 | 6 | R$ 6.500 |

**MRR projetado em 6 meses: R$ 6.500/mês**

---

## 7. RESUMO DO INVESTIMENTO

### 7.1 Sistema Base (Incluído)

| Item | Status |
|------|--------|
| CRM completo com todas as funcionalidades | ✅ Incluído |
| Chatbot de qualificação | ✅ Incluído |
| Kanban semi-automático | ✅ Incluído |
| Download de dados/documentos | ✅ Incluído |
| Multi-tenant (SaaS) | ✅ Incluído |
| Integração WhatsApp | ✅ Incluído |
| Suporte 90 dias | ✅ Incluído |

### 7.2 Módulos Adicionais (Opcionais)

| Módulo | Investimento |
|--------|--------------|
| Tradução Espanhol | R$ 5.000,00 |
| Eletromobilidade | R$ 15.000,00 |
| **Combo (ambos)** | **R$ 18.000,00** (10% desc.) |

### 7.3 Custos Recorrentes

| Item | Custo |
|------|-------|
| APIs + Infraestrutura | < US$ 60/mês (~R$ 300) |

---

## 8. CONDIÇÕES COMERCIAIS

### 8.1 Forma de Pagamento

**Módulos Adicionais:**
- 50% na aprovação
- 50% na entrega

**Custos Operacionais:**
- Pagos diretamente aos fornecedores (Supabase, Twilio, etc.)

### 8.2 Prazo de Entrega

| Módulo | Prazo |
|--------|-------|
| Tradução Espanhol | 15 dias úteis |
| Eletromobilidade | 30 dias úteis |
| Combo | 40 dias úteis |

### 8.3 Garantia e Suporte

- **Garantia:** 90 dias para correção de bugs
- **Suporte:** Via WhatsApp/Email em horário comercial
- **Treinamento:** 8 horas incluídas
- **Documentação:** Manual completo do sistema

---

## 9. PRÓXIMOS PASSOS

1. **Aprovação** desta proposta
2. **Pagamento** do sinal (50%)
3. **Kickoff** do projeto
4. **Desenvolvimento** conforme cronograma
5. **Homologação** e ajustes
6. **Entrega** e treinamento
7. **Go-live** 🚀

---

## 10. CONTATO

**Neureka AI**
Soluções em Inteligência Artificial e Automação

📧 Email: [CAMPO_EMAIL]
📱 WhatsApp: [CAMPO_WHATSAPP]
🌐 Site: [CAMPO_SITE]

---

*Esta proposta tem validade de 30 dias a partir da data de emissão.*

---

**Aceite:**

___________________________________
**Nome:**
**Empresa:**
**Data:**
