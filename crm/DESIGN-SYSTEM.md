# Sistema de Design — CRM Solar

Nome: **Papel e Mesa**. Síntese de quatro direções exploradas e julgadas por um
painel de três lentes (vendedor diário, acessibilidade, marca). O painel se
dividiu — cada juiz elegeu uma vencedora diferente, com notas em 109/106/104/101.
Isso não é empate: cada direção ganhou num eixo e perdeu noutro. A síntese pega
o melhor de cada uma.

## A tese: dois registros, um sistema

O produto tem dois públicos que querem coisas opostas.

**Para dentro** (dashboard, kanban, tabelas, tarefas) está o vendedor, 8 horas
por dia, varrendo 200 leads. Ele quer densidade, números alinhados e zero
interrupção. Arejado aqui é imposto de produtividade: a direção mais bonita
custava 30-40% das linhas por tela.

**Para fora** (login, proposta pública, widget de chat) está o cliente que vai
assinar R$ 50 mil. Ele quer calma, respiro e o registro de documento. Densidade
aqui parece desleixo.

Os dois registros usam os **mesmos tokens**, o **mesmo ornamento** e o **mesmo
piso de acessibilidade**. O que muda é a escala de espaçamento e a densidade,
não a identidade.

## Tokens — todos medidos, nenhum estimado

Todo valor abaixo foi verificado com cálculo de contraste WCAG e com o validador
de paleta. Números alegados sem medição foram o erro que afundou uma das
direções propostas.

### Marca

A cor atual `#309086` **reprova**: 3,85:1 com texto branco. Todo botão primário
do CRM hoje está abaixo do mínimo legível. A escala abaixo preserva a matiz e
corrige o contraste.

```css
--brand-300: #8FC9C1;  /* fundos suaves, preenchimento de gráfico */
--brand-400: #5FAEA4;
--brand-500: #3B9287;  /* ornamento, bordas — NÃO para texto */
--brand-600: #297A72;  /* ← texto, links, botões. 5,10:1 em branco */
--brand-700: #1A5952;  /* hover, ênfase. 8,09:1 */
```

### Tinta — cláusula estrutural

**Nenhum token de texto abaixo de 4,5:1 em nenhuma superfície do sistema,
incluindo metadado, rótulo, placeholder e estado desabilitado.** Esta é a regra
que torna a falha de acessibilidade mais comum impossível por construção, em vez
de proibida por combinado.

```css
--ink-1: #16211F;  /* 14,64:1 na pior superfície */
--ink-2: #3D4744;  /*  8,53:1 */
--ink-3: #5A6764;  /*  5,23:1 — rótulos, th, timestamps */
```

Desabilitado se expressa por **borda tracejada + cursor + rótulo**, nunca por
opacidade. Opacidade apaga texto e é o caminho mais curto para reprovar.

### Superfícies

```css
--paper:   #FBFAF7;  /* fundo da página (registro externo) */
--card:    #FFFFFF;
--sunken:  #F4F1EA;  /* th, faixas alternadas, áreas recuadas */
--rule:    #D9D3C6;  /* fios estruturais — 2px, não 1px */
```

Fio de 1px a 1,2:1 desaparece em monitor TN descalibrado com sol na janela, que
é o hardware real deste público. Estrutura usa **2px**.

### Status — reservados, nunca reutilizados como série

```css
--ok:      #1B7A4B;  /* 5,12:1 como texto | 5,34:1 com branco em cima */
--atencao: #9A6209;  /* 4,88:1 | 5,09:1 */
--grave:   #B3421C;  /* 5,42:1 | 5,66:1 */
--critico: #A3231F;  /* 7,14:1 | 7,45:1 */
--info:    #1F5F8B;  /* 6,56:1 | 6,84:1 */
```

Status sempre com **ícone + palavra**, nunca só cor.

### Rampa ordinal do funil

O funil tem 5 etapas em ordem — é dado **sequencial**, não categórico. Hoje é
pintado de arco-íris (`#3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981`), que
reprova medido:

```
[FAIL] CVD         #8b5cf6↔#3b82f6  ΔE 1,3 (deuteranopia)
[FAIL] visão normal #8b5cf6↔#3b82f6  ΔE 12,0 (piso 15)
[WARN] contraste    #f59e0b 2,09:1 e #10b981 2,47:1
```

Violeta e azul são a mesma cor para ~8% dos homens. A rampa correta é **uma
matiz só**, do claro ao escuro, com luminância monotônica — a ordem fica legível
mesmo sem enxergar cor nenhuma:

```js
['#8FC9C1', '#5FAEA4', '#3B9287', '#297A72', '#1A5952']
// L = 0.515 → 0.354 → 0.232 → 0.156 → 0.080  (monotônica, verificada)
```

Nunca eixo duplo. Nunca arco-íris. Cor categórica em ordem fixa, nunca ciclada.

### Tipografia

```css
--fonte-texto:  'Inter', system-ui, sans-serif;      /* já declarada, nunca carregada */
--fonte-numero: 'Atkinson Hyperlegible', 'Inter', sans-serif;
--fonte-titulo: 'Fraunces', Georgia, serif;          /* SOMENTE ≥24px */
```

**Todo número que vira decisão** (valor, consumo, score, NPS, potência,
contagem) usa Atkinson Hyperlegible com `font-variant-numeric: tabular-nums`.
Desenhada pelo Braille Institute, com `1/l/I` e `0/O` inequívocos. É
acessibilidade como traço estético visível, e resolve o risco da serifada virar
mingau em célula densa.

A serifada é faca: `Fraunces` **só** em figura de display ≥24px (preço da
proposta, número de KPI). Nunca em rótulo, nunca em célula.

### Espaçamento — a escala muda por registro

| | Para dentro (denso) | Para fora (calmo) |
|---|---|---|
| Altura de linha de tabela | 32px fixa | — |
| Padding de célula | 8px 12px | 18px |
| Padding de card | 16px | 32px |
| Gap de seção | 20px | 48px |

Raio: 6px padrão, 10px em cards do registro externo. Elevação por fio de 2px,
não por sombra difusa.

## O ornamento único: a linha do horizonte

Um fio âmbar de 2px cujo brilho acompanha a **hora solar local**:

```css
--luz: 72%;  /* definida uma vez no carregamento */
```

```js
const h = new Date().getHours();
const luz = Math.max(0, Math.round(100 * Math.sin(Math.PI * (h - 6) / 12)));
document.documentElement.style.setProperty('--luz', luz + '%');
```

Aparece em três lugares e **só** neles: sob a topbar do CRM, sob o lockup do
login, e na aresta do masthead da proposta que o cliente abre no WhatsApp.

É o único ornamento do produto, e significa algo: a hora em que o sistema gera
energia. Custa um gradiente e um `new Date()`, não depende de dado nenhum, então
nunca quebra. E costura a jornada — login, CRM e documento passam a ser
visivelmente a mesma marca, resolvendo as duas identidades que hoje convivem.

## Correções de produto que o design carrega

Estas não são estéticas. São defeitos que o redesenho conserta.

### 1. Ênfase invertida no kanban

Hoje: `.kanban-card.inactive { opacity: .85 }` — **o card que você mais precisa
tocar é o mais apagado da coluna.** Isso custa negócios.

Correção — "queimado de sol": `opacity` volta a **1**. O card recebe um banho
quente de cima para baixo que **aprofunda em três degraus** conforme
`data-dias-faixa="14|30|60"`, régua âmbar de 2px no topo, e o aviso promovido a
chip legível com ícone e texto ("13 dias sem contato"). A metáfora é literal: o
tempo parado desbota o card ao sol.

Gradua o que hoje é binário — 15 dias deixa de ser idêntico a 120 — e separa
"parado" (âmbar) de "perdido" (tijolo), que hoje dividem o mesmo vermelho.

### 2. O toast que dispara duas vezes por minuto

Hoje: `crm-v2.js` mostra "Dados carregados com sucesso!" a cada refresh de 30s,
8 horas por dia. É o elemento mais irritante do produto.

Correção — **fita de operação**: uma faixa sticky de 28px, presente em todos os
módulos, inteira em figuras tabulares:

```
PIPELINE R$ 1.284.300 · ATIVOS 47 · PARADOS 9 · ATRASADAS 3 · SYNC 00:12
```

O contador sobe desde a última carga; quando o refresh chega, uma régua de 2px
varre a fita. Troca uma interrupção recorrente por informação sempre presente.
O toast fica só para erro e para ação do usuário.

### 3. Lead score que não diz nada

Hoje: barra de 64px sempre verde — 8 e 95 têm a mesma cor, e o limiar de
qualificação é invisível.

Correção: régua de 120px com **tique de 1px cravado nos 50 pontos**, faixa
carregada por **palavra** (`FRIO` / `MORNO` / `QUENTE`) e não por matiz, e
denominador explícito: `42/100`.

### 4. Identidade de coluna independente de cor

Numeral `01`–`05` no cabeçalho de cada coluna do kanban, com as cinco colunas
visualmente idênticas. A rampa ordinal **reforça** a ordem; nunca a carrega
sozinha. Sobrevive a acromatopsia.

### 5. A proposta pública não tem regra de impressão

Zero `@media print` hoje, e zero `og:`. O cliente imprime ou salva em PDF um
layout de tela. Correção: `@media print` de verdade — preço em display,
sem navegação, sem widget de chat, quebras controladas.

## Densidade para dentro

- Altura de linha fixa de **32px**, `thead` sticky.
- **Toda coluna numérica** em Atkinson tabular, alinhada à direita, alinhada no dígito.
- Ordenação em Score, Consumo e Valor.
- Valor somado por raia do kanban.

Meta: **24 linhas por tela em 1080p**, contra as ~11 de hoje.

## Amarras — o JavaScript depende destes seletores

O design muda; a estrutura de seletores **não**. Renomear qualquer item abaixo
quebra o aplicativo.

**Portão de autenticação:** `#loginScreen` (nasce SEM `.hidden`), `#crmApp`
(nasce COM `class="hidden"`), `#loginEmail`, `#loginPassword`, `#loginButton`
(tem `innerHTML` sobrescrito com `<i class="fas fa-spinner fa-spin">`),
`#loginError` (contêiner), `#loginErrorMessage` (filho de texto).

**Navegação:** `.module` em todo wrapper de módulo (hook puro de JS, sem CSS
hoje), os ids `#module-dashboard|kanban|leads|propostas|instalados|tarefas`
(montados por template string), `.nav-link` (recebe `active` E `bg-white/20`
juntas), `#module-title` e `#module-subtitle` (`textContent` — não podem ter
filhos), `#sidebar` + `.mobile-open`.

**Kanban:** `.kanban-column[data-etapa]` > `.kanban-cards[data-etapa]` >
`.kanban-card[data-id]` — ancestralidade exigida pelo Sortable; nenhum wrapper
intermediário. `data-etapa` exatamente
`levantamento|simulacao|proposta|negociacao|fechamento`. `.kanban-count`
(`textContent`, sem filhos). `.sortable-ghost` e `.sortable-drag` precisam
existir no CSS. O conteúdo de `.kanban-cards` vem de `innerHTML` — markup
decorativo colocado no HTML é apagado; use `:empty::before`.

**Classes montadas em runtime** (só funcionam se existirem no CSS compilado):
`badge badge-${...}` com sufixos `success|warning|danger|info|gray`,
`bg-${kpi.color}-100`, `text-${kpi.color}-600`, `border-${color}-500`,
`bg-${colors[type]}-500`. `.module-card`, `.kpi-card`, `.fade-in` (+ keyframe
`slideIn`), `.tab-button`/`.tab-content`/`#tab-${nome}`.

**Armadilha das abas:** `event.target.classList.add('active')` — se um
`.tab-button` ganhar filhos (`<span>`, `<i>`), o `event.target` vira o filho e o
estado ativo vai para o elemento errado.

**`#module-dashboard .grid`** — `querySelector` pega o PRIMEIRO descendente com
classe `grid`. O contêiner de KPIs precisa continuar sendo o primeiro.

**`.hidden { display: none !important; }`** (index.html) — fallback deliberado
para quando o Tailwind do CDN atrasa. **Não remover, não enfraquecer.**

**Canvas:** `#funnelChart` e `#conversionChart` precisam continuar sendo
`<canvas>` com esses ids.

**Contratos externos:** o caminho `crm/proposta.html?t=TOKEN`, o nome do arquivo
`chat-widget-pastro-v238.js`, a forma de `window.ChatWidgetConfig`, as RPCs
`get_proposta_publica({p_token})` / `registrar_visualizacao_proposta({p_token})`
/ `responder_proposta_publica({p_token,p_status})`, e as colunas do POST de lead
do widget.

**Font Awesome 6.4 tem de continuar carregado** — o JS injeta `<i class="fas
fa-spinner fa-spin">` no botão de login e ícones nos cards.

## Técnica: vencer o Tailwind sem `!important`

- `.nav-link.active` tem especificidade (0,2,0) e vence `bg-white/20` (0,1,0).
- `#loginScreen > div` vence utilitário por especificidade de ID, sem tocar no markup.
- `:has()` suprime o widget de chat sobre a tela de login, com zero JS.
- `:empty::before` cria drop zone que sobrevive ao `innerHTML`.
- `.module` não tem nenhuma regra CSS hoje — é hook seguro para contenção.
