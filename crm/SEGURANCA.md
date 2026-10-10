# 🔒 Segurança do CRM Solar — o que foi corrigido e o que você precisa fazer

## O problema que existia

A migration `fix_rls_permitir_anon.sql` criou policies com `USING (true)` para o
papel `anon` em **leads, qualificacao, oportunidades, propostas,
clientes_instalados, interacoes, tarefas e users**.

A chave `anon` do Supabase está no JavaScript que roda no navegador de qualquer
visitante — e também neste repositório, que é **público**. Combinando as duas
coisas, qualquer pessoa podia:

- baixar a lista completa de leads (nome, e-mail, telefone, consumo);
- ler todas as propostas de todas as empresas, com valores e descontos;
- ler a base de clientes instalados;
- **alterar** leads, oportunidades, qualificações e tarefas.

Bastava a chave pública e uma requisição HTTP. Nenhum login.

## Sobre "esconder a chave"

Não dá, e não é o ponto. A chave `anon` **tem** que estar no frontend para o
navegador conversar com o Supabase — ela é pública por design. Tirá-la do Git
não protegeria nada, porque ela continua visível no "ver código-fonte" de
qualquer página.

**O que protege os dados é o RLS**, e era exatamente ele que estava aberto.

A chave que **nunca** pode aparecer é a `service_role` — ela ignora RLS por
completo. Verifiquei todo o histórico do repositório: **só existe a `anon`**,
nenhuma `service_role` vazou. Seu `GPTKey.txt` também nunca foi commitado.

## O que foi corrigido

| Arquivo | O que mudou |
|---|---|
| `.gitignore` (novo, na raiz) | O repo não tinha nenhum. Agora `GPTKey.txt`, `.env`, `*.key`, `*.pem`, `service_role*` e `supabase/.temp/` estão bloqueados. Antes, um `git add -A` publicava sua chave da OpenAI. |
| `crm/migrations/SECURITY_lockdown_rls.sql` (novo) | Remove todas as policies permissivas e reconstrói com privilégio mínimo. |
| `crm/migrations/SECURITY_proposta_publica_rpc.sql` (novo) | Funções `SECURITY DEFINER` para o link público de proposta. |
| `crm/proposta.html` | Passa a usar as funções em vez de consultar a tabela direto. |
| `crm/crm-v2.js` | Autenticação religada; `logout()` agora encerra a sessão de verdade. |
| `crm/index.html` | Tela de login (que não existia) e `empresa_id` no widget. |
| `crm/chat-widget-pastro-v238.js` | Envia `empresa_id` no INSERT do lead. |

### Permissões depois da correção

| Quem | Pode fazer |
|---|---|
| `anon` (visitante) | **Só INSERT** de `leads` e `qualificacao` — o que o chatbot precisa. Nenhuma leitura, nenhum UPDATE. |
| `authenticated` (logado) | Acesso completo, **restrito à própria empresa** via `get_user_empresa_id()`. |
| Cliente com link de proposta | Vê **uma** proposta, a do token, através de função `SECURITY DEFINER`. |

### Por que `proposta.html` precisou de funções no banco

A página fazia:

```js
supabase.from('propostas').select('*').eq('token_rastreio', token)
```

O `.eq()` roda **no navegador**, não no banco. O RLS não enxerga o filtro do
cliente — só o papel que chamou. Quem tivesse a chave pública podia apagar o
filtro e baixar tudo. Agora o filtro está dentro da função, no servidor.

## ⚠️ Consequência: o CRM agora exige login

Isso é intencional e inevitável. Não existe forma de um CRM ler todos os seus
leads usando uma chave pública **e** esses leads ficarem protegidos — é a mesma
permissão. Então o CRM passa a se autenticar como usuário.

Junto com isso corrigi dois bugs que impediam o login de funcionar:

1. `crm-v2.js` chamava `supabaseClientClient` (nome duplicado, provavelmente de
   um rename mal aplicado) nas 4 funções de autenticação — todas quebradas.
2. O `index.html` não tinha o elemento `#loginScreen`, mas o JS tentava acessá-lo
   na inicialização. Isso lançava `TypeError` e **abortava todo o
   `DOMContentLoaded`**, então `loadAllData()` nunca rodava e o CRM abria vazio.

---

# 🚀 Como aplicar e rodar local

## Passo 1 — Aplicar as migrations

No **Supabase Dashboard → SQL Editor**, rode **nesta ordem**:

1. `crm/migrations/add_multi_tenant.sql` — só se ainda não rodou. Cria
   `empresas`, `usuarios` e as colunas `empresa_id`.
2. `crm/migrations/SECURITY_lockdown_rls.sql`
3. `crm/migrations/SECURITY_proposta_publica_rpc.sql`

Os dois arquivos novos são idempotentes: pode rodar de novo sem problema.

No fim do primeiro, as consultas de verificação devem mostrar:

- **exatamente 2 policies** para `anon`, ambas `INSERT`, em `leads` e `qualificacao`;
- privilégios do `anon`: **apenas INSERT** nessas duas tabelas (qualquer `SELECT` na lista é vazamento);
- `rowsecurity = true` em todas as tabelas.

Se aparecer `WARNING: ... sem coluna empresa_id`, rode o `add_multi_tenant.sql`
e aplique o lockdown de novo.

## Passo 2 — Garantir que você tem um usuário

O login usa o Supabase Auth. Se ainda não tem usuário:

**Dashboard → Authentication → Users → Add user** (marque *Auto Confirm User*).

Depois vincule esse usuário à empresa, senão `get_user_empresa_id()` retorna
`NULL` e o CRM abre sem dados:

```sql
-- Troque o e-mail pelo seu
INSERT INTO usuarios (id, empresa_id, nome, email, cargo, ativo)
SELECT id, '13b204e6-203b-40dd-9dde-4b6e573d1554', 'Administrador',
       email, 'admin', true
FROM auth.users WHERE email = 'seu@email.com'
ON CONFLICT (id) DO UPDATE
SET empresa_id = '13b204e6-203b-40dd-9dde-4b6e573d1554',
    cargo = 'admin', ativo = true;
```

Confirme com `SELECT * FROM usuarios WHERE email = 'seu@email.com';` — a coluna
`empresa_id` não pode estar vazia.

> O `empresa_id` acima é o da *Trans Solar*, que estava no
> `test-chatbot.html`. Veja os seus com `SELECT id, nome FROM empresas;` e use
> o que corresponder aos seus leads.

## Passo 3 — Subir o servidor local

```powershell
cd C:\Solarbot\chatbot\crm
python -m http.server 8080
```

Abra **http://localhost:8080/** — a tela de login aparece. Entre com o usuário
do Passo 2.

Para testar o chatbot, um segundo servidor na raiz:

```powershell
cd C:\Solarbot\chatbot
python -m http.server 8000
```

E abra **http://localhost:8000/test-chatbot.html**.

> Tem que ser por `http://localhost`. Abrir o `.html` com duplo clique
> (`file://`) quebra as chamadas ao Supabase.

## Passo 4 — Proteger a chave da OpenAI

O `GPTKey.txt` está solto na raiz. Nunca foi commitado, e o `.gitignore` novo
impede que seja — mas tire da pasta do repositório:

```powershell
Move-Item C:\Solarbot\chatbot\GPTKey.txt C:\Solarbot\GPTKey.txt
```

---

## Checklist de verificação

- [ ] As 3 consultas do fim do `SECURITY_lockdown_rls.sql` mostram o esperado
- [ ] `SET ROLE anon; SELECT count(*) FROM leads;` → **erro de permissão**
- [ ] Login no CRM funciona e o dashboard carrega com dados
- [ ] Console do navegador (F12) sem erro vermelho ao abrir o CRM
- [ ] Chatbot cria lead e ele aparece no CRM
- [ ] Link `proposta.html?t=TOKEN` abre a proposta certa
- [ ] `GPTKey.txt` fora da pasta do repositório

## Ainda em aberto

- **Rotação da chave `anon`:** não é urgente (ela é pública por design), mas se
  quiser invalidar a que circulou, dá para rotacionar o JWT secret no Dashboard
  → Settings → API. Isso obriga a atualizar a chave em `crm-v2.js`,
  `proposta.html`, `login.html`, `debug-auth.html`, `test-login.html` e nos
  widgets `v236`/`v237`/`v238`.
- **`debug-auth.html` e `test-login.html`:** páginas de debug com a chave
  embutida. Não expõem nada além do que já é público, mas convém apagar quando
  publicar em produção.
- **Backup antes do lockdown:** o `SECURITY_lockdown_rls.sql` apaga e recria as
  policies. Se tinha policy customizada feita à mão no Dashboard, salve antes
  com `SELECT * FROM pg_policies WHERE schemaname = 'public';`.
