# 🌞 CRM Funil Completo - Energia Solar

Sistema completo de Customer Relationship Management especializado em Energia Solar, integrado com chatbot e Supabase.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Como Usar](#como-usar)
- [API e Integrações](#api-e-integrações)

## 🎯 Visão Geral

O CRM Solar é uma plataforma completa para gestão do ciclo de vida do cliente, desde o lead inicial (capturado via chatbot) até o pós-instalação e medição de performance.

### Características Principais:

- ✅ **Dashboard Executivo** com KPIs em tempo real
- ✅ **Kanban Visual** com drag & drop para gestão do funil
- ✅ **Gestão Completa de Leads** capturados pelo chatbot
- ✅ **Timeline 360°** de interações com cada lead
- ✅ **Rastreamento de Propostas** com link único
- ✅ **Pós-venda** e gestão de clientes instalados
- ✅ **Automações** e alertas inteligentes
- ✅ **Suporta** clientes Residenciais e Empresariais

## 🚀 Funcionalidades

### 1. Dashboard Executivo

- KPIs principais: Leads Ativos, Pipeline, Instalados, NPS
- Gráfico de funil de vendas interativo
- Gráfico de conversão por mês
- Leads recentes do chatbot

### 2. Kanban de Oportunidades

- 5 Etapas: Levantamento → Simulação → Proposta → Negociação → Fechamento
- Drag & Drop entre etapas
- Alertas visuais de inatividade (>14 dias)
- Filtros por tipo de cliente (Residencial/Empresarial)

### 3. Gestão de Leads

- Tabela completa com todos os leads
- Filtros por status, tipo, vendedor
- Lead Score visual (0-100)
- Exportação para Excel/CSV
- Integração automática com leads do chatbot

### 4. Timeline de Interações

- Registro de e-mails, WhatsApp, chamadas, visitas
- Upload de documentos (conta de luz, fotos do telhado)
- Histórico completo de comunicações
- Sistema de notas internas

### 5. Propostas Comerciais

- Criação e versionamento de propostas
- Rastreamento de visualização via link único
- Status: Enviada, Visualizada, Aceita, Recusada
- Especificações técnicas (kWp, módulos, inversores)
- Cálculo de economia e payback

### 6. Clientes Instalados

- Dados do contrato e instalação
- Performance real vs prevista
- NPS (Net Promoter Score)
- Agendamento de manutenções

### 7. Tarefas e Follow-ups

- Organização por: Atrasadas, Hoje, Próximas
- Alertas automáticos de follow-up (48h)
- Integração com leads

## 📦 Instalação

### 1. Configurar Banco de Dados Supabase

Execute o script SQL no Supabase SQL Editor:

```bash
# Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql
# Cole e execute o conteúdo de: crm/schema.sql
```

### 2. Abrir o CRM

```bash
# Opção 1: Servidor local simples
cd /home/user/chatbot/crm
python3 -m http.server 8080

# Acesse: http://localhost:8080
```

```bash
# Opção 2: Hospedar em servidor web
# Copie os arquivos para seu servidor:
# - index.html
# - crm.js
# - (sem necessidade de backend adicional)
```

### 3. Configurar Credenciais

As credenciais do Supabase já estão configuradas em `crm.js`:

```javascript
const SUPABASE_URL = 'https://zralzmgsdmwispfvgqvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**⚠️ IMPORTANTE:** Em produção, use variáveis de ambiente e **nunca** exponha a chave secreta (service_role_key).

## 📁 Estrutura do Projeto

```
crm/
├── schema.sql          # Schema completo do banco de dados
├── index.html          # Interface principal do CRM
├── crm.js             # Lógica JavaScript
├── proposta.html      # Página de rastreamento de propostas
└── README.md          # Esta documentação
```

## 🗄️ Configuração do Banco de Dados

### Tabelas Principais

1. **users** - Usuários do CRM (vendedores, gestores)
2. **leads** - Leads do funil (integrado com chatbot)
3. **qualificacao** - Dados técnicos e de viabilidade (1:1 com leads)
4. **oportunidades** - Estágios do funil de vendas
5. **interacoes** - Log de atividades e comunicações
6. **propostas** - Propostas comerciais com rastreamento
7. **clientes_instalados** - Dados pós-venda (1:1 com leads)
8. **tarefas** - Gestão de follow-ups e ações

### Views (Consultas Otimizadas)

- `vw_funil_vendas` - Dados agregados do funil
- `vw_leads_completo` - Leads com qualificação e vendedor
- `vw_kpis` - KPIs principais do dashboard

### Automações (Triggers)

- **auto_criar_oportunidade**: Cria oportunidade quando lead é qualificado
- **update_updated_at**: Atualiza campo updated_at automaticamente
- **calcular_lead_score**: Calcula score de qualidade do lead (0-100)

## 💡 Como Usar

### Fluxo Completo do Funil

```mermaid
graph LR
    A[Lead Chatbot] --> B[Qualificação]
    B --> C[Oportunidade]
    C --> D[Kanban: Levantamento]
    D --> E[Kanban: Simulação]
    E --> F[Kanban: Proposta]
    F --> G[Kanban: Negociação]
    G --> H[Kanban: Fechamento]
    H --> I[Cliente Instalado]
```

### 1. Lead chega pelo Chatbot

- Lead preenche formulário no chatbot
- Dados salvos automaticamente em `leads` e `qualificacao`
- Aparecem na tabela "Leads Recentes" do Dashboard

### 2. Qualificação

- Vendedor acessa o lead e visualiza Timeline
- Completa dados adicionais de qualificação
- Sistema calcula Lead Score automaticamente
- Se qualificado → Oportunidade é criada automaticamente

### 3. Gestão no Kanban

- Vendedor arrasta oportunidade entre etapas
- Sistema alerta se ficar >14 dias sem atualização
- Ao mover para "Fechamento" → Modal de fechamento

### 4. Envio de Proposta

- Vendedor cria proposta com especificações técnicas
- Sistema gera **token único de rastreamento**
- Link enviado ao cliente: `https://seu-site.com/crm/proposta.html?t=TOKEN`
- Quando cliente abre → Status muda para "Visualizada"

### 5. Fechamento

- Proposta aceita → Cria registro em `clientes_instalados`
- Lead marcado como "Convertido"
- Oportunidade arquivada

### 6. Pós-venda

- Acompanhamento de performance real
- Coleta de NPS
- Agendamento de manutenções

## 🔗 API e Integrações

### Endpoints Disponíveis (Supabase REST API)

Exemplos de consultas via REST:

```javascript
// Buscar todos os leads
GET https://SUPABASE_URL/rest/v1/leads
Headers: { apikey: 'SUA_KEY', Authorization: 'Bearer SUA_KEY' }

// Criar nova interação
POST https://SUPABASE_URL/rest/v1/interacoes
Body: {
  lead_id: 'uuid',
  tipo: 'email',
  titulo: 'Follow-up enviado',
  descricao: 'E-mail de acompanhamento...'
}

// Atualizar etapa de oportunidade
PATCH https://SUPABASE_URL/rest/v1/oportunidades?id=eq.UUID
Body: {
  etapa: 'proposta',
  data_ultima_atualizacao: '2025-01-15T10:00:00Z'
}
```

### Integração com Chatbot

O chatbot já está integrado! Os leads capturados são automaticamente:

1. Salvos na tabela `leads` com `origem: 'chatbot'`
2. Dados de qualificação salvos em `qualificacao`
3. Disponíveis no CRM para gestão

### Webhooks (Opcional)

Configure webhooks no Supabase para:

- Enviar e-mail quando proposta é visualizada
- Notificar vendedor sobre novo lead
- Integrar com WhatsApp Business API

Exemplo (Supabase Function):

```sql
CREATE OR REPLACE FUNCTION notify_proposta_visualizada()
RETURNS TRIGGER AS $$
BEGIN
  -- Enviar notificação via webhook/email
  PERFORM net.http_post(
    url := 'https://seu-webhook.com/proposta-visualizada',
    body := json_build_object('proposta_id', NEW.id, 'lead_id', NEW.lead_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_proposta
  AFTER UPDATE OF status ON propostas
  FOR EACH ROW
  WHEN (NEW.status = 'visualizada')
  EXECUTE FUNCTION notify_proposta_visualizada();
```

## 🎨 Customização

### Cores e Branding

Edite as variáveis CSS em `index.html`:

```css
:root {
    --primary: #10b981;      /* Verde principal */
    --secondary: #059669;     /* Verde secundário */
    --danger: #ef4444;        /* Vermelho */
    --warning: #f59e0b;       /* Laranja */
}
```

### Estágios do Kanban

Adicione ou remova etapas editando:

1. Enum no banco (`schema.sql`):
```sql
ALTER TABLE oportunidades ADD CONSTRAINT etapa_check
CHECK (etapa IN ('levantamento', 'simulacao', 'proposta', 'negociacao', 'fechamento', 'SUA_NOVA_ETAPA'));
```

2. HTML do Kanban (`index.html`)
3. Lógica JavaScript (`crm.js`)

## 📊 KPIs e Métricas

O sistema calcula automaticamente:

- **Taxa de Conversão**: Leads → Oportunidades → Instalados
- **Ticket Médio**: Valor médio dos contratos fechados
- **Ciclo de Vendas**: Tempo médio de fechamento
- **Pipeline**: Valor total em negociação
- **NPS**: Satisfação dos clientes instalados

## 🔐 Segurança

### Row Level Security (RLS)

Habilite RLS no Supabase para proteger dados:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política: Vendedor só vê seus próprios leads
CREATE POLICY vendedor_own_leads ON leads
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Autenticação

Implemente autenticação com Supabase Auth:

```javascript
// Login
const { user, error } = await supabase.auth.signInWithPassword({
  email: 'vendedor@example.com',
  password: 'senha123'
});

// Verificar sessão
const { data: { session } } = await supabase.auth.getSession();
```

## 🐛 Troubleshooting

### Problema: Leads do chatbot não aparecem

**Solução**: Verifique se as tabelas `leads` e `qualificacao` têm as colunas corretas:

```sql
-- Executar no Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads';
```

### Problema: Drag & Drop não funciona

**Solução**: Verifique se SortableJS foi carregado:

```javascript
console.log(typeof Sortable); // Deve retornar "function"
```

### Problema: Erro ao conectar Supabase

**Solução**: Verifique as credenciais em `crm.js` e teste:

```javascript
const { data, error } = await supabase.from('leads').select('count');
console.log(data, error);
```

## 📈 Roadmap

Funcionalidades futuras:

- [ ] Integração com WhatsApp Business API
- [ ] Envio automático de e-mails (templates)
- [ ] Geração automática de propostas (PDF)
- [ ] Integração com Google Calendar
- [ ] App mobile (React Native)
- [ ] Dashboard de performance de vendedores
- [ ] Sistema de comissões

## 👥 Suporte

Para dúvidas ou suporte:

- 📧 Email: suporte@exemplo.com
- 💬 WhatsApp: +55 11 99999-9999
- 📚 Documentação completa: [docs.exemplo.com](https://docs.exemplo.com)

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para revolucionar vendas de Energia Solar**
