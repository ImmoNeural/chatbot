# 🤖 Sistema de Automação de Leads

Este documento explica como funciona o sistema de automação de leads (auto-nutrição e auto-perdido) e como configurá-lo.

## 📋 Visão Geral

O sistema automatiza a movimentação de leads baseado em regras de negócio:

### **Auto-Nutrição** 🌱
Leads **qualificados** são movidos automaticamente para "Em Nutrição" quando:
- ✅ Sem interação há **7-14 dias**
- ✅ Têm **motivo de espera** preenchido (timing errado, precisa informações, etc.)
- ✅ Exemplos:
  - Cliente vai construir casa em 6 meses
  - Aguardando aprovação de financiamento
  - Precisa de mais tempo para decidir

### **Auto-Perdido** ❌
Leads/Oportunidades são marcados como "Perdido" automaticamente quando:

**Para Leads:**
- ❌ Sem resposta há **30+ dias**
- ❌ **3+ tentativas** de contato registradas
- ❌ Não está já perdido ou convertido

**Para Oportunidades:**
- ❌ Sem atualização há **60+ dias**
- ❌ Não está já perdida ou concluída

### **Notificações** 🔔
- Vendedor é notificado **ANTES** da mudança automática
- Pode **reverter** a ação a qualquer momento
- Histórico completo de mudanças mantido

---

## 🚀 Configuração Inicial

### 1. Executar Migração SQL

Primeiro, execute a migração no Supabase SQL Editor:

```bash
/home/user/chatbot/crm/migrations/add_automation_system.sql
```

Isso cria:
- ✅ Campos `motivo_espera`, `data_prevista_retorno`, `tentativas_contato` na tabela `leads`
- ✅ Tabela `notificacoes`
- ✅ Tabela `historico_mudancas_automaticas`
- ✅ Funções SQL para detecção e processamento automático
- ✅ Políticas RLS

### 2. Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar se as funções foram criadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%nutricao%'
   OR routine_name LIKE '%perdido%'
   OR routine_name LIKE '%automacao%';

-- Deve retornar:
-- - detectar_leads_para_nutricao
-- - detectar_leads_perdidos
-- - detectar_oportunidades_perdidas
-- - mover_para_nutricao
-- - marcar_como_perdido
-- - reverter_mudanca_automatica
-- - executar_automacao_leads
```

---

## 💻 Uso no CRM

### Configurar Lead para Nutrição

1. Abra o card do lead no Kanban
2. Clique em **"Editar"**
3. Preencha o campo **"Motivo de Espera"**:
   ```
   Exemplo: "Cliente vai construir a casa em 6 meses"
   ```
4. (Opcional) Defina **"Data Prevista de Retorno"**
5. Clique em **"Salvar"**

Agora, se o lead ficar 7-14 dias sem interação, será movido automaticamente para "Em Nutrição".

### Registrar Tentativa sem Resposta

1. Abra o lead e vá para a aba **"Timeline"**
2. Clique em **"Nova Interação"**
3. Preencha normalmente (tipo, título, descrição)
4. ✅ Marque o checkbox **"Tentativa sem resposta"**
5. Clique em **"Salvar"**

Isso incrementa o contador de tentativas. Após 3+ tentativas e 30 dias sem resposta, o lead será marcado como "Perdido".

### Ver Notificações

1. Clique no ícone 🔔 no canto superior direito
2. Veja todas as notificações de mudanças automáticas
3. Clique em **"Reverter"** para desfazer uma ação automática

---

## ⚙️ Executar Job Automático

O sistema precisa que a função `executar_automacao_leads()` seja executada periodicamente (recomendado: diariamente).

### Opção 1: Manualmente via SQL Editor (Teste)

Execute no Supabase SQL Editor:

```sql
SELECT executar_automacao_leads();
```

Retorna um JSON com o resultado:

```json
{
  "leads_movidos_nutricao": 3,
  "leads_marcados_perdido": 2,
  "oportunidades_marcadas_perdido": 1,
  "executado_em": "2025-12-01T10:30:00Z"
}
```

### Opção 2: Cron Job (Recomendado para Produção)

#### A. Usando Supabase Edge Functions

Crie uma Edge Function que executa a automação:

1. No Supabase Dashboard → Edge Functions → New Function
2. Nome: `daily-automation`
3. Código:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase.rpc('executar_automacao_leads')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

4. Deploy: `supabase functions deploy daily-automation`
5. Configure cron no Dashboard:
   - Schedule: `0 9 * * *` (Todo dia às 9h)
   - Function: `daily-automation`

#### B. Usando Serviço Externo (ex: cron-job.org)

1. Crie um endpoint protegido no seu backend que chama a função SQL
2. Configure o cron job para chamar esse endpoint diariamente

---

## 🧪 Testes

### Testar Detecção de Leads para Nutrição

```sql
SELECT * FROM detectar_leads_para_nutricao();
```

Retorna leads que seriam movidos para nutrição.

### Testar Detecção de Leads Perdidos

```sql
SELECT * FROM detectar_leads_perdidos();
```

### Testar Detecção de Oportunidades Perdidas

```sql
SELECT * FROM detectar_oportunidades_perdidas();
```

### Simular Mudança Automática (SEM criar notificação)

```sql
-- Mover para nutrição (sem notificar)
SELECT mover_para_nutricao('UUID-DO-LEAD', false);

-- Marcar como perdido (sem notificar)
SELECT marcar_como_perdido(p_lead_id := 'UUID-DO-LEAD', p_notificar := false);
```

### Reverter Mudança

```sql
-- Buscar histórico
SELECT * FROM historico_mudancas_automaticas
WHERE revertido = false
ORDER BY created_at DESC
LIMIT 10;

-- Reverter
SELECT reverter_mudanca_automatica('UUID-DO-HISTORICO', 'UUID-DO-USER');
```

---

## 📊 Monitoramento

### Ver Estatísticas

```sql
-- Leads em nutrição
SELECT COUNT(*) FROM leads WHERE status = 'em_nutricao';

-- Leads perdidos
SELECT COUNT(*) FROM leads WHERE status = 'perdido';

-- Notificações não lidas
SELECT COUNT(*) FROM notificacoes WHERE lida = false;

-- Mudanças automáticas hoje
SELECT COUNT(*) FROM historico_mudancas_automaticas
WHERE created_at >= CURRENT_DATE;

-- Mudanças revertidas
SELECT COUNT(*) FROM historico_mudancas_automaticas
WHERE revertido = true;
```

### Ver Leads Candidatos a Nutrição/Perdido

```sql
-- Próximos candidatos a nutrição
SELECT
    l.nome,
    l.email,
    l.motivo_espera,
    EXTRACT(DAY FROM NOW() - COALESCE(
        (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id),
        l.created_at
    )) as dias_sem_interacao
FROM leads l
WHERE status = 'qualificado'
  AND motivo_espera IS NOT NULL
  AND motivo_espera != ''
ORDER BY dias_sem_interacao DESC;

-- Próximos candidatos a perdido
SELECT
    l.nome,
    l.email,
    l.tentativas_contato,
    EXTRACT(DAY FROM NOW() - COALESCE(
        (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id),
        l.created_at
    )) as dias_sem_resposta
FROM leads l
WHERE status NOT IN ('perdido', 'convertido')
  AND tentativas_contato >= 2
ORDER BY dias_sem_resposta DESC;
```

---

## 🔧 Configuração Avançada

### Ajustar Prazos

Edite as funções SQL se precisar mudar os prazos:

```sql
-- Na função detectar_leads_para_nutricao()
-- Linha: BETWEEN 7 AND 14
-- Altere para: BETWEEN 5 AND 10 (por exemplo)

-- Na função detectar_leads_perdidos()
-- Linha: >= 30
-- Altere para: >= 45 (por exemplo)

-- Na função detectar_oportunidades_perdidas()
-- Linha: >= 60
-- Altere para: >= 90 (por exemplo)
```

### Desabilitar Notificações

Se quiser que as mudanças sejam silenciosas (não criar notificações):

```sql
-- Execute com p_notificar := false
SELECT executar_automacao_leads();

-- Ou edite as funções para passar false por padrão
```

---

## ❓ FAQ

**P: Os leads são movidos automaticamente assim que as condições são atingidas?**
R: Não. As mudanças só acontecem quando a função `executar_automacao_leads()` é executada (manualmente ou via cron job).

**P: Posso reverter uma mudança automática?**
R: Sim! Clique no sino 🔔 → encontre a notificação → clique em "Reverter".

**P: O que acontece se eu reverter e o job rodar de novo?**
R: Se as condições ainda estiverem presentes, o lead será movido novamente. Para evitar isso, atualize o lead (adicione interação, remova motivo de espera, etc.).

**P: Como sei se um lead tem motivo de espera preenchido?**
R: Ao editar o lead, o campo "Motivo de Espera" mostrará o texto. Você também pode ver no banco: `SELECT nome, motivo_espera FROM leads WHERE motivo_espera IS NOT NULL;`

**P: Posso testar sem afetar os dados reais?**
R: Sim! Use as funções `detectar_*` para VER quais leads seriam afetados, sem fazer alterações. Só as funções `mover_*` e `marcar_*` fazem mudanças reais.

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no console do navegador (F12)
2. Execute as queries de teste acima
3. Verifique se a migração foi executada corretamente
4. Revise as políticas RLS no Supabase

---

**Desenvolvido com ❤️ para otimizar seu funil de vendas!**
