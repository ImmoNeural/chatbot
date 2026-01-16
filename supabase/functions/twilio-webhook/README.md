# Twilio WhatsApp Webhook

Edge Function para receber mensagens do WhatsApp via Twilio.

## Configuração

### 1. Executar Migration

Execute o SQL no Supabase para criar a tabela de mensagens:

```bash
# Via Supabase CLI
supabase db push

# Ou execute manualmente o arquivo:
# crm/migrations/add_mensagens_whatsapp.sql
```

### 2. Deploy da Edge Function

```bash
# Login no Supabase (se ainda não fez)
supabase login

# Linkar com seu projeto
supabase link --project-ref SEU_PROJECT_ID

# Deploy da função
supabase functions deploy twilio-webhook
```

### 3. Configurar Webhook no Twilio

1. Acesse o Console do Twilio: https://console.twilio.com
2. Vá em **Messaging** > **Try it Out** > **Send a WhatsApp message**
3. Na seção **Sandbox Settings**, configure:
   - **When a message comes in**: `https://SEU_PROJECT_ID.supabase.co/functions/v1/twilio-webhook`
   - **HTTP Method**: POST

### 4. Testar

Envie uma mensagem para o número do sandbox do Twilio (+14155238886) no WhatsApp.
A mensagem deve aparecer na tabela `mensagens_whatsapp` do Supabase.

## Estrutura da Mensagem Salva

```json
{
  "id": "uuid",
  "message_sid": "SMxxxxx",
  "lead_id": "uuid ou null",
  "telefone": "+5511999999999",
  "nome_perfil": "Nome do WhatsApp",
  "mensagem": "Texto da mensagem",
  "direcao": "recebida",
  "tipo": "texto",
  "raw_data": { ... dados completos do Twilio ... },
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Personalização

Para adicionar respostas automáticas, edite a seção `autoReply` no `index.ts`:

```typescript
// Exemplo: responder automaticamente
if (messageBody.toLowerCase().includes('olá')) {
  autoReply = 'Olá! Como posso ajudar?'
}
```
