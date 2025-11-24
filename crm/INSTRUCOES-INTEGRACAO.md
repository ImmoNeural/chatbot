# 🚀 Instruções para Integração do Sistema de Abas Dinâmicas

## ✅ O Que Foi Implementado:

1. **Sistema de Abas Dinâmicas por Estágio do Kanban**
2. **Aba Documentos** (Levantamento) - Upload de arquivos
3. **Aba Qualificação + Calcular Sistema** (Simulação)
4. **Aba Resumo da Proposta** (Proposta) - Com botão enviar email
5. **Aba Status** (Negociação) - Agendamento e aceite
6. **Aba Instalação** (Fechamento) - ART, homologação e agendamento

---

## 📋 Como Integrar no crm.js:

### Passo 1: Substituir a função openLeadModal

No arquivo `/crm/crm.js`, localize a função `async function openLeadModal(leadId)` (linha ~619) e substitua por:

```javascript
async function openLeadModal(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    currentLead = lead;

    // Buscar oportunidade para determinar o estágio
    const { data: oportunidade } = await supabase
        .from('oportunidades')
        .select('etapa')
        .eq('lead_id', leadId)
        .single();

    currentStage = oportunidade?.etapa || 'levantamento';

    // Preencher informações do lead
    document.getElementById('modal-lead-name').textContent = lead.nome || lead.email;
    document.getElementById('modal-lead-email').textContent = lead.email;

    // Configurar abas dinâmicas baseado no estágio
    configurarAbasDinamicas(currentStage);

    // Mostrar modal
    document.getElementById('leadModal').classList.remove('hidden');

    // Carregar conteúdo das abas
    await renderLeadInfo(lead);
    await renderLeadTimeline(leadId);
    await renderConteudoDinamico(leadId, currentStage);
}
```

### Passo 2: Adicionar variável global

No início do arquivo `crm.js`, adicione:

```javascript
let currentStage = null;
```

### Passo 3: Copiar todas as funções dos arquivos de partes

Copie TODO o conteúdo de:
- `/crm/crm-abas-dinamicas-parte1.js`
- `/crm/crm-abas-dinamicas-parte2.js`

E cole no final do arquivo `crm.js`, ANTES da linha que exporta as funções globais (`window.showModule = showModule;`)

### Passo 4: Exportar as novas funções globalmente

No final do `crm.js`, adicione estas linhas às exportações:

```javascript
window.uploadDocumento = uploadDocumento;
window.deletarDocumento = deletarDocumento;
window.enviarPropostaPorEmail = enviarPropostaPorEmail;
window.salvarStatusNegociacao = salvarStatusNegociacao;
window.salvarAgendamentoInstalacao = salvarAgendamentoInstalacao;
```

---

## ⚙️ Configurações Necessárias:

### 1. Upload de Arquivos (Supabase Storage)

A funcionalidade de upload está SIMULADA. Para implementar corretamente:

1. Vá no Supabase Dashboard → Storage
2. Crie um bucket chamado `documentos-leads`
3. Configure as políticas de acesso
4. Substitua a função `uploadDocumento` com código real de upload:

```javascript
// Upload real para Supabase Storage
const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documentos-leads')
    .upload(`${leadId}/${arquivo.name}`, arquivo);

if (uploadError) throw uploadError;

const url = supabase.storage
    .from('documentos-leads')
    .getPublicUrl(`${leadId}/${arquivo.name}`).data.publicUrl;
```

### 2. Envio de Email

A funcionalidade de envio de email está com placeholder. Você precisará:

1. Configurar um serviço de email (SendGrid, AWS SES, etc.)
2. Criar uma edge function no Supabase ou usar uma API externa
3. Implementar a função `enviarPropostaPorEmail` com lógica real

---

## 🧪 Como Testar:

1. **Recarregue o CRM** (Ctrl+Shift+R)

2. **Crie leads em diferentes estágios** do Kanban:
   - Arraste um lead para "Levantamento" → Clique nele → Deve ver aba "Documentos"
   - Arraste para "Simulação" → Clique nele → Deve ver aba "Qualificação" com botão Calcular
   - Arraste para "Proposta" → Clique nele → Deve ver aba "Resumo Proposta"
   - Arraste para "Negociação" → Clique nele → Deve ver aba "Status"
   - Arraste para "Fechamento" → Clique nele → Deve ver aba "Instalação"

3. **Teste cada funcionalidade**:
   - Upload de documentos
   - Salvamento de qualificação
   - Cálculo de sistema solar
   - Envio de proposta (placeholder)
   - Agendamento de reunião
   - Agendamento de instalação

4. **Verifique a Timeline** - Todas as ações devem aparecer lá

---

## 🐛 Troubleshooting:

### Erro: "Cannot read property 'etapa' of null"
**Solução**: O lead não tem oportunidade associada. Crie uma oportunidade para o lead.

### Erro: Aba não muda ao clicar no lead
**Solução**: Verifique se as migrations foram aplicadas corretamente no Supabase.

### Upload não funciona
**Solução**: Configure o Supabase Storage conforme instruções acima.

### Timeline não atualiza
**Solução**: Verifique se a tabela `interacoes` aceita o tipo 'sistema'.

---

## 📊 Estrutura do Banco de Dados:

Certifique-se de que estas tabelas existem:
- ✅ `qualificacao` (com novos campos de checkboxes)
- ✅ `documentos`
- ✅ `instalacao`
- ✅ `status_negociacao`
- ✅ `oportunidades` (com campo `etapa`)

---

## 🎯 Próximos Passos (Futuro):

1. ✅ Implementar upload real de arquivos
2. ✅ Implementar envio de email
3. ✅ Adicionar notificações push quando cliente visualiza proposta
4. ✅ IA para preencher qualificação automaticamente (como você mencionou)
5. ✅ Assinatura digital de contratos
6. ✅ Integração com WhatsApp para envio de propostas

---

## 🆘 Suporte:

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Verifique se todas as migrations foram aplicadas
3. Confirme que o Supabase está conectado corretamente
4. Teste com dados fictícios primeiro

**Boa sorte com a implementação! 🚀**
