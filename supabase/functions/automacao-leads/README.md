# 🤖 Edge Function: Automação de Leads

Esta Edge Function executa automaticamente a função SQL `executar_automacao_leads()` que:

- 🌱 Move leads qualificados (7-14 dias sem interação + motivo_espera) → **Em Nutrição**
- ❌ Marca leads (30+ dias + 3+ tentativas) → **Perdido**
- ❌ Marca oportunidades (60+ dias sem atualização) → **Perdido**

---

## 📦 Deploy da Edge Function

### 1️⃣ Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -g supabase
```

### 2️⃣ Login no Supabase

```bash
supabase login
```

Vai abrir o browser para você fazer login.

### 3️⃣ Link com seu projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

**Como encontrar o PROJECT_REF:**
- Abra seu projeto no Supabase Dashboard
- A URL será: `https://supabase.com/dashboard/project/SEU_PROJECT_REF`
- Copie o `SEU_PROJECT_REF`

### 4️⃣ Deploy da função

```bash
cd /home/user/chatbot
supabase functions deploy automacao-leads
```

✅ **Pronto!** A função está no ar.

---

## ⏰ Configurar Cron Job (Executar Diariamente)

### Opção 1: Via Dashboard (Mais Fácil)

1. Vá em **Supabase Dashboard → Database → Cron Jobs**
2. Clique em **"Create a new cron job"**
3. Preencha:
   - **Name:** `automacao-leads-diaria`
   - **Schedule:** `0 9 * * *` (9h da manhã todo dia)
   - **SQL Command:**
     ```sql
     SELECT
       net.http_post(
         url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/automacao-leads',
         headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
         body := '{}'::jsonb
       );
     ```
4. Clique em **"Create"**

### Opção 2: Via SQL (pg_cron)

Execute no SQL Editor:

```sql
-- Instalar extensão pg_cron (se ainda não tiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar cron job que roda todo dia às 9h
SELECT cron.schedule(
  'automacao-leads-diaria',
  '0 9 * * *',  -- 9h da manhã todo dia
  $$
  SELECT executar_automacao_leads();
  $$
);

-- Ver cron jobs criados
SELECT * FROM cron.job;
```

### Opção 3: Via Serviço Externo (GitHub Actions, Vercel Cron, etc.)

Faça uma requisição HTTP diariamente:

```bash
curl -X POST 'https://SEU_PROJECT_REF.supabase.co/functions/v1/automacao-leads' \
  -H 'Authorization: Bearer SEU_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

---

## 🧪 Testar Manualmente

### Via Dashboard:
1. Vá em **Edge Functions**
2. Clique em **automacao-leads**
3. Clique em **"Invoke function"**

### Via cURL:
```bash
curl -X POST 'https://SEU_PROJECT_REF.supabase.co/functions/v1/automacao-leads' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Via SQL Editor:
```sql
-- Chamar diretamente a função SQL (sem Edge Function)
SELECT executar_automacao_leads();
```

---

## 📊 Monitorar Execuções

### Ver logs da Edge Function:
1. **Dashboard → Edge Functions → automacao-leads**
2. Clique em **"Logs"**
3. Veja o histórico de execuções

### Ver histórico de mudanças automáticas:
```sql
SELECT
  h.*,
  l.nome as lead_nome,
  l.email as lead_email
FROM historico_mudancas_automaticas h
LEFT JOIN leads l ON l.id = h.lead_id
ORDER BY h.created_at DESC
LIMIT 50;
```

### Ver notificações criadas:
```sql
SELECT * FROM notificacoes
WHERE tipo IN ('auto_nutricao', 'auto_perdido')
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🎯 Próximos Passos

1. ✅ Deploy da Edge Function
2. ✅ Configurar cron para rodar diariamente
3. ✅ Testar manualmente uma vez
4. ✅ Monitorar logs por alguns dias
5. ✅ Ajustar horário do cron se necessário

---

## ⚙️ Configurações Avançadas

### Mudar horário do cron:
```
0 9 * * *   → 9h da manhã (UTC)
0 14 * * *  → 14h (UTC) = 11h (BRT)
0 0 * * *   → Meia-noite (UTC)
0 */6 * * * → A cada 6 horas
```

### Desativar temporariamente:
```sql
SELECT cron.unschedule('automacao-leads-diaria');
```

### Reativar:
```sql
-- Recriar o schedule
SELECT cron.schedule(
  'automacao-leads-diaria',
  '0 9 * * *',
  $$ SELECT executar_automacao_leads(); $$
);
```

---

## 🆘 Troubleshooting

**Edge Function não aparece no Dashboard?**
- Aguarde 1-2 minutos após deploy
- Recarregue a página

**Cron não está rodando?**
- Verifique se a extensão pg_cron está instalada: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verifique se o schedule foi criado: `SELECT * FROM cron.job;`

**Automação não detecta leads?**
- Verifique se as funções SQL foram criadas corretamente
- Execute manualmente: `SELECT * FROM detectar_leads_perdidos();`
- Verifique os dados: `SELECT tentativas_contato, data_ultima_tentativa FROM leads;`

---

**🎉 Automação configurada com sucesso!** Agora o sistema vai rodar sozinho todo dia.
