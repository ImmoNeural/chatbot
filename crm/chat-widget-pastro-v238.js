// Interactive Chat Widget for n8n - Versão v238 - sistema de design "Papel e Mesa"
(function() {
    // Remove widget anterior se existir (força atualização de cores)
    const oldWidget = document.querySelector('.chat-assist-widget');
    if (oldWidget) oldWidget.remove();
    const oldStyles = document.querySelectorAll('style[data-chat-widget]');
    oldStyles.forEach(s => s.remove());

    // Initialize widget v238
    if (window.N8nChatWidgetV238) return;
    window.N8nChatWidgetV238 = true;
    window.N8nChatWidgetLoaded = true;

    // Inter (texto) + Atkinson Hyperlegible (numeros de decisao) num unico
    // request: duas families no mesmo css2 evitam dois round-trips no site
    // do cliente, que e onde o widget roda.
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap';
    document.head.appendChild(fontElement);

    // Apply widget styles - sistema "Papel e Mesa", registro externo
    const widgetStyles = document.createElement('style');
    // O bloco de limpeza no topo procura style[data-chat-widget]; sem este
    // atributo o <style> antigo nunca saia do head e as regras se acumulavam
    // a cada recarga do widget.
    widgetStyles.setAttribute('data-chat-widget', 'v238');
    widgetStyles.textContent = `
        .chat-assist-widget {
            /* Escala de marca: a matiz antiga (#06a288) reprovava em contraste
               com texto branco. Esta preserva a matiz e passa o piso. */
            --brand-300: #8FC9C1;
            --brand-400: #5FAEA4;
            --brand-500: #3B9287;
            --brand-600: #297A72;
            --brand-700: #1A5952;
            /* Tinte de marca para fundo de bolha: --ink-1 sobre ele mede
               12,9:1, entao a resposta do usuario fica legivel sem precisar
               de um bloco de cor cheia. */
            --tinte-marca: #E7F0EE;

            /* Tinta: nenhum token de texto abaixo de 4,5:1 em nenhuma
               superficie do widget, inclusive placeholder e timestamp. */
            --ink-1: #16211F;
            --ink-2: #3D4744;
            --ink-3: #5A6764;

            --paper: #FBFAF7;
            --card: #FFFFFF;
            --sunken: #F4F1EA;
            --rule: #D9D3C6;

            --ok: #1B7A4B;
            --atencao: #9A6209;
            --grave: #B3421C;
            --critico: #A3231F;
            --info: #1F5F8B;

            --fonte-texto: 'Inter', system-ui, sans-serif;
            --fonte-numero: 'Atkinson Hyperlegible', 'Inter', sans-serif;

            /* Ponte com o contrato externo: window.ChatWidgetConfig injeta
               --chat-widget-* por setProperty. O token do spec entra como
               fallback, entao o widget nasce correto sem config nenhuma. */
            --chat-color-primary: var(--chat-widget-primary, var(--brand-600));
            --chat-color-secondary: var(--chat-widget-secondary, var(--brand-700));
            --chat-color-tertiary: var(--brand-300);
            --chat-color-light: var(--sunken);
            --chat-color-surface: var(--chat-widget-surface, var(--card));
            --chat-color-text: var(--chat-widget-text, var(--ink-1));
            --chat-color-text-light: var(--ink-3);
            --chat-color-border: var(--rule);
            --chat-button-primary: var(--chat-widget-button-primary, var(--brand-600));
            --chat-button-secondary: var(--chat-widget-button-secondary, var(--brand-700));
            --chat-bubble-bg: var(--chat-widget-bubble-bg, var(--card));
            --chat-bubble-text: var(--chat-widget-bubble-text, var(--ink-1));
            --chat-avatar-primary: var(--chat-widget-avatar-primary, var(--brand-600));
            --chat-avatar-secondary: var(--chat-widget-avatar-secondary, var(--brand-700));
            --chat-widget-primarybubble: var(--brand-600);
            --chat-widget-secondarybubble: var(--brand-700);

            /* Raio: 6px nos controles, 10px nos cards do registro externo. */
            --chat-radius-sm: 6px;
            --chat-radius-md: 6px;
            --chat-radius-lg: 10px;
            --chat-radius-full: 9999px;
            --chat-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: var(--fonte-texto);
        }

        .chat-assist-widget .chat-window {
            position: fixed;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            left: auto !important;
            z-index: 10000;
            width: 440px !important;
            max-width: 100vw !important;
            /* Aba encostada na direita, do topo ao rodape. A janela flutuante
               brigava por altura com a pagina; a aba entrega a tela inteira a
               conversa, que e o que o funil precisa para mostrar a foto e a
               pergunta juntas. */
            height: 100vh !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            border-left: 2px solid var(--rule) !important;
            border-top: 0 !important;
            border-right: 0 !important;
            border-bottom: 0 !important;
            background: var(--chat-color-surface);
            border-radius: var(--chat-radius-lg);
            /* Elevacao por fio de 2px: 1px a 1,2:1 desaparece em monitor
               descalibrado, que e o hardware real deste publico. */
            border: 2px solid var(--rule);
            overflow: hidden;
            display: none;
            flex-direction: column;
            /* Desliza da borda, como gaveta. O scale de janela flutuante
               ficava estranho num painel encostado na lateral: o que entra
               pela direita deve vir da direita, nao crescer do centro. */
            transition: transform .32s cubic-bezier(.32,.72,0,1), opacity .22s ease;
            opacity: 0;
            transform: translateX(100%);
        }

        /* A posicao e sempre a direita: numa aba de altura inteira, colar na
           esquerda brigaria com a navegacao de quase todo site. As classes
           continuam existindo porque o JS as aplica. */
        .chat-assist-widget .chat-window.right-side,
        .chat-assist-widget .chat-window.left-side {
            right: 0;
            left: auto;
        }

        .chat-assist-widget .chat-window.visible {
            display: flex;
            opacity: 1;
            transform: translateX(0);
        }

        @media (prefers-reduced-motion: reduce) {
            .chat-assist-widget .chat-window { transition: opacity .15s ease; transform: none; }
        }

        /* Icone sempre alinhado ao texto que acompanha e nunca encolhido
           pelo flex: emoji nao permitia nenhuma das duas coisas. */
        .chat-assist-widget .ico {
            flex: 0 0 auto;
            vertical-align: -0.18em;
            display: inline-block;
        }

        .chat-assist-widget .chat-header {
            padding: 12px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            /* Verde escuro com tinta branca. E a unica faixa de marca do
               painel, e marca a identidade logo na primeira olhada; o resto
               da aba continua em papel. Branco sobre --brand-700 mede 8,09:1. */
            background: var(--brand-700);
            color: var(--ink-sobre-marca);
            position: relative;
            flex-shrink: 0;
            border-bottom: 0;
        }

        /* O chip branco existe para logo de cliente, que pode vir em qualquer
           cor e precisa de fundo neutro. Como a largura e fixa em 128px, uma
           marca quadrada ficava nadando no meio dele: o width passa a ser
           automatico e o chip se ajusta ao que recebe. */
        .chat-assist-widget .chat-header-logo {
            width: auto;
            max-width: 104px;
            height: 24px;
            object-fit: contain;
            background: transparent;
            padding: 0;
            flex: 0 0 auto;
        }

        .chat-assist-widget .chat-header-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--ink-sobre-marca);
            letter-spacing: -0.01em;
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .chat-assist-widget .chat-close-btn {
            position: static;
            transform: none;
            margin-left: auto;
            flex: 0 0 auto;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: 2px solid var(--ink-sobre-marca-2);
            color: var(--ink-sobre-marca);
            border-radius: var(--chat-radius-sm);
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
            transition: var(--chat-transition);
        }

        .chat-assist-widget .chat-close-btn:hover {
            background: rgba(255,255,255,.14);
            border-color: var(--ink-sobre-marca);
        }

        .chat-assist-widget .chat-body {
            display: none;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        .chat-assist-widget .chat-body.active {
            display: flex;
        }

        .chat-assist-widget .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px 12px;
            background: var(--paper);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .chat-assist-widget .chat-messages::-webkit-scrollbar {
            width: 8px;
        }

        .chat-assist-widget .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }

        .chat-assist-widget .chat-messages::-webkit-scrollbar-thumb {
            background-color: var(--brand-500);
            border-radius: var(--chat-radius-full);
        }

        .chat-assist-widget .file-name {
            font-size: 12px;
            color: var(--ink-2);
            margin-top: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
        }

        /* Linha de apoio (ex.: "Formato: (XX) XXXXX-XXXX"). Metadado tambem
           obedece ao piso de 4,5:1 - nada de cinza apagado. */
        .chat-assist-widget .chat-hint {
            font-size: 12px;
            line-height: 1.45;
            color: var(--ink-3);
        }

        /* Todo numero que vira decisao (consumo, economia, contagem) em
           Atkinson tabular: 1/l/I e 0/O inequivocos, digito alinhado. */
        .chat-assist-widget .chat-figure {
            font-family: var(--fonte-numero);
            font-variant-numeric: tabular-nums;
            font-weight: 700;
            color: var(--ink-1);
        }

        .chat-assist-widget .chat-bubble .chat-figure-strong {
            font-family: var(--fonte-numero);
            font-variant-numeric: tabular-nums;
            font-weight: 700;
            font-size: 15px;
            color: var(--brand-700);
        }

        /* Status sempre com icone + palavra: a cor e reforco, nunca o recado. */
        .chat-assist-widget .chat-status {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-weight: 500;
            color: var(--ink-1);
        }

        .chat-assist-widget .chat-status-label {
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            font-size: 11px;
            padding: 1px 6px;
            border-radius: var(--chat-radius-sm);
            border: 2px solid currentColor;
            flex-shrink: 0;
        }

        .chat-assist-widget .chat-status-erro .chat-status-label { color: var(--grave); }
        .chat-assist-widget .chat-status-ok .chat-status-label { color: var(--ok); }
        .chat-assist-widget .chat-status-info .chat-status-label { color: var(--info); }

        .chat-assist-widget .chat-bubble {
            max-width: 100%;
            /* 14/16 numa fonte de 13px dava uma moldura maior que o texto que
               ela emoldura. 10/13 mantem o ar sem a bolha parecer vazia. */
            /* 8/12: a resposta do usuario tem uma linha. Com 10/13 a
               moldura somava 20px de altura a um texto de 20px. */
            padding: 8px 12px;
            margin: 0;
            border-radius: var(--chat-radius-lg);
            word-wrap: break-word;
            font-size: 13px;
            line-height: 1.45;
            position: relative;
            display: block;
            align-items: flex-start;
            gap: 8px;
            /* 'normal', nao 'pre-line': com pre-line cada quebra do template
               string virava uma linha de verdade e a bolha ganhava 80px de
               nada. O texto livre do n8n preserva seus paragrafos pelo <br>
               que renderMarkdown insere. */
            white-space: normal;
        }

        .chat-assist-widget .chat-bubble.user-bubble {
            /* Tinte claro em vez de gradiente solido: a resposta do usuario e
               curta (um e-mail, um telefone) e nao precisa de um bloco de cor
               do tamanho de um botao para se distinguir. O fio a esquerda ja
               separa quem fala. */
            background: var(--tinte-marca);
            color: var(--ink-1);
            align-self: flex-end;
            border: 0;
            border-right: 3px solid var(--brand-600);
            border-radius: var(--chat-radius-md);
        }

        .chat-assist-widget .chat-bubble.user-bubble .chat-figure,
        .chat-assist-widget .chat-bubble.user-bubble .chat-hint {
            color: #ffffff;
        }

        .chat-assist-widget .chat-bubble.bot-bubble {
            background: var(--card);
            color: var(--chat-bubble-text);
            align-self: flex-start;
            border: 0;
            border-left: 3px solid var(--rule);
            border-radius: var(--chat-radius-md);
        }

        .chat-assist-widget .message-icon {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 4px;
            border: 2px solid var(--rule);
            background: var(--card);
        }

        .chat-assist-widget .bot-avatar {
            width: 26px;
            height: 26px;
            /* Sem circulo: o sol ja tem forma propria, e os raios se perdiam
               encostados na borda. O simbolo solto respira e marca a fala sem
               virar mais uma caixa na tela. */
            background: transparent;
            border: 0;
            /* Usa o token de avatar, nao --brand-600 direto: quem embute o
               widget pode trocar a cor por window.ChatWidgetConfig sem
               precisar editar o arquivo. */
            color: var(--chat-avatar-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 3px;
        }

        .chat-assist-widget .bot-avatar svg {
            width: 16px;
            height: 16px;
            fill: #ffffff;
        }

        /* Sem opacidade: opacidade apaga texto e e o caminho mais curto
           para reprovar o piso de contraste. */
        .chat-assist-widget .timestamp {
            display: block;
            font-size: 10px;
            font-family: var(--fonte-numero);
            font-variant-numeric: tabular-nums;
            color: var(--ink-3);
            margin-top: 4px;
        }

        .chat-assist-widget .message-container {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 20px;
            width: 100%;
        }

        .chat-assist-widget .message-container.bot-message {
            justify-content: flex-start;
        }

        .chat-assist-widget .message-container.bot-message .timestamp {
            text-align: left;
            margin-left: 8px;
        }

        .chat-assist-widget .message-container.user-message {
            justify-content: flex-end;
        }

        .chat-assist-widget .message-container.user-message .timestamp {
            text-align: right;
            margin-right: 8px;
        }

        .chat-assist-widget .message-content {
            display: flex;
            flex-direction: column;
            /* Sem o avatar do usuario, so a fala do bot desconta a coluna
               do avatar dele. A do usuario usa a largura inteira. */
            max-width: calc(100% - 36px);
            min-width: min(240px, 100%);
        }

        .chat-assist-widget .typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 14px 18px;
            background: var(--card);
            border-radius: var(--chat-radius-lg);
            border-bottom-left-radius: 4px;
            max-width: 80px;
            align-self: flex-start;
            border: 2px solid var(--rule);
        }

        .chat-assist-widget .typing-dot {
            width: 8px;
            height: 8px;
            background: var(--brand-500);
            border-radius: var(--chat-radius-full);
            animation: typingAnimation 1.4s infinite ease-in-out;
        }

        .chat-assist-widget .typing-dot:nth-child(1) { animation-delay: 0s; }
        .chat-assist-widget .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .chat-assist-widget .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingAnimation {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
        }

        /* ============================================================
           LEITURA SOLAR
           Painel que so existe durante o funil. O sol percorre o arco do
           ceu conforme as respostas chegam, e os numeros se recalculam a
           cada uma. Fechado (altura 0) fora do funil, para nao roubar
           espaco da conversa.
           ============================================================ */
        .chat-assist-widget .leitura-solar {
            display: grid;
            grid-template-rows: 0fr;
            opacity: 0;
            /* Fora do funil o painel some por inteiro: sem a borda e sem
               altura minima, senao sobra uma faixa morta de 24px acima da
               caixa de entrada durante a conversa normal. */
            border-top: 0 solid var(--rule);
            min-height: 0;
            background: linear-gradient(180deg, var(--sunken) 0%, var(--card) 100%);
            transition: grid-template-rows .45s cubic-bezier(.4,0,.2,1), opacity .3s;
        }

        /* min-height: 0 no ITEM do grid, nao no container: sem isto o
           conteudo impoe sua altura minima e a linha de 0fr nao colapsa
           — sobravam 22px de faixa morta acima da caixa de entrada. */
        .chat-assist-widget .leitura-solar > * {
            overflow: hidden;
            min-height: 0;
        }

        .chat-assist-widget .leitura-solar.ativa {
            grid-template-rows: 1fr;
            opacity: 1;
            border-top-width: 2px;
        }

        /* O wrapper existe porque grid-template-rows:0fr so colapsa um
           filho unico; o conteudo real vai dentro dele. */
        /* O padding fica em zero enquanto o painel esta fechado: a unidade
           fr dimensiona o CONTEUDO, entao o padding do item do grid
           sobrevive ao 0fr e eram exatamente ele os 22px que restavam
           (10 em cima + 12 embaixo). */
        .chat-assist-widget .leitura-interna {
            padding: 0 12px;
            transition: padding .45s cubic-bezier(.4,0,.2,1);
        }

        .chat-assist-widget .leitura-solar.ativa .leitura-interna {
            padding: 6px 12px 8px;
        }

        .chat-assist-widget .leitura-ceu {
            position: relative;
            height: 30px;
            margin-bottom: 4px;
        }

        .chat-assist-widget .leitura-arco {
            width: 100%;
            height: 30px;
            display: block;
            overflow: visible;
        }

        .chat-assist-widget .leitura-trilha,
        .chat-assist-widget .leitura-percorrido {
            fill: none;
            stroke-linecap: round;
        }

        /* Trilha tracejada: o caminho que ainda falta se le como caminho,
           nao como linha cheia apagada. */
        .chat-assist-widget .leitura-trilha {
            stroke: var(--rule);
            stroke-width: 2;
            stroke-dasharray: 3 6;
        }

        /* O percorrido e desenhado por stroke-dashoffset, controlado por
           --progresso (0 a 1). Uma variavel so move o arco e o sol juntos. */
        .chat-assist-widget .leitura-percorrido {
            stroke: var(--brand-600);
            stroke-width: 3;
            stroke-dasharray: var(--arco-comprimento, 340);
            stroke-dashoffset: calc(var(--arco-comprimento, 340) * (1 - var(--progresso, 0)));
            transition: stroke-dashoffset .6s cubic-bezier(.34,1.3,.64,1);
        }

        .chat-assist-widget .leitura-horizonte {
            stroke: var(--rule);
            stroke-width: 2;
        }

        /* O sol anda pelo arco: angulo de 180 graus mapeado em --progresso.
           Raio e centro batem com o path do SVG (A 108 108, centro em 120,42). */
        /* O sol e posicionado pelo PONTO EXATO do tracado, calculado com
           getPointAtLength no JS, e nao por trigonometria no CSS. Trig no
           CSS exige que o raio e o centro do arco sejam replicados a mao
           nos dois lugares: na hora que o path muda, o sol descola da
           linha e ninguem percebe. Assim ele segue qualquer curva. */
        .chat-assist-widget .leitura-sol {
            position: absolute;
            left: 0;
            top: 0;
            width: 11px;
            height: 11px;
            margin: -5.5px 0 0 -5.5px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #F6C96B 0%, var(--atencao) 70%);
            box-shadow: 0 0 0 3px rgba(154, 98, 9, .16), 0 0 14px rgba(246, 201, 107, .55);
            transform: translate(var(--sol-x, 12px), var(--sol-y, 42px));
            transition: transform .6s cubic-bezier(.34,1.3,.64,1);
        }

        .chat-assist-widget .leitura-dados {
            display: flex;
            align-items: baseline;
            gap: 14px;
        }

        .chat-assist-widget .leitura-item {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
        }

        .chat-assist-widget .leitura-item--destaque { margin-left: auto; text-align: right; }

        .chat-assist-widget .leitura-rotulo {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: var(--ink-3);
            white-space: nowrap;
        }

        .chat-assist-widget .leitura-valor {
            font-family: var(--fonte-numero, 'Atkinson Hyperlegible', sans-serif);
            font-variant-numeric: tabular-nums;
            font-size: 13px;
            font-weight: 700;
            color: var(--ink-1);
            white-space: nowrap;
        }

        .chat-assist-widget .leitura-item--destaque .leitura-valor {
            font-size: 17px;
            color: var(--brand-700);
        }

        /* Pulso curto quando o numero muda: a pessoa percebe que a propria
           resposta mexeu no resultado. */
        .chat-assist-widget .leitura-valor.mudou { animation: leituraPulso .5s ease-out; }

        @keyframes leituraPulso {
            0%   { transform: translateY(3px); opacity: .4; }
            100% { transform: translateY(0);   opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
            .chat-assist-widget .leitura-solar,
            .chat-assist-widget .leitura-percorrido,
            .chat-assist-widget .leitura-sol { transition: none; }
            .chat-assist-widget .leitura-valor.mudou { animation: none; }
        }

        .chat-assist-widget .chat-controls {
            padding: 8px 10px;
            flex-shrink: 0;
            background: var(--chat-color-surface);
            border-top: 2px solid var(--rule);
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .chat-assist-widget .file-upload-container {
            position: relative;
            display: flex;
            align-items: center;
        }

        .chat-assist-widget .file-upload-input {
            display: none;
        }

        .chat-assist-widget .file-upload-label {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            background: var(--sunken);
            color: var(--ink-2);
            border: 2px solid var(--rule);
            border-radius: var(--chat-radius-md);
            cursor: pointer;
            transition: var(--chat-transition);
            box-sizing: border-box;
        }

        .chat-assist-widget .file-upload-label:hover {
            background: var(--brand-600);
            border-color: var(--brand-700);
            color: #ffffff;
        }

        .chat-assist-widget .file-upload-label svg {
            width: 22px;
            height: 22px;
        }

        .chat-assist-widget .chat-textarea {
            flex: 1;
            padding: 9px 12px;
            border: 2px solid var(--rule);
            border-radius: var(--chat-radius-md);
            background: var(--chat-color-surface);
            color: var(--chat-color-text);
            resize: none;
            font-family: inherit;
            font-size: 13px;
            line-height: 1.5;
            max-height: 104px;
            min-height: 38px;
            box-sizing: border-box;
            transition: var(--chat-transition);
        }

        .chat-assist-widget .chat-textarea:focus {
            outline: none;
            border-color: var(--brand-600);
            box-shadow: 0 0 0 3px rgba(41, 122, 114, 0.28);
        }

        /* Placeholder tambem passa o piso: 5,23:1 sobre a superficie branca. */
        .chat-assist-widget .chat-textarea::placeholder {
            color: var(--ink-3);
            opacity: 1;
        }

        .chat-assist-widget .chat-submit {
            width: 38px;
            height: 38px;
            background-color: var(--chat-button-primary);
            border: 2px solid var(--brand-700);
            border-radius: var(--chat-radius-md);
            color: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-sizing: border-box;
            transition: var(--chat-transition);
        }

        .chat-assist-widget .chat-submit:hover {
            background-color: var(--brand-700);
            color: #ffffff;
        }

        .chat-assist-widget .chat-submit svg {
            width: 22px;
            height: 22px;
            display: block;
        }

        /* Enquanto a pessoa rola, o lancador sai de cena. Ele e fixo no canto
           inferior direito, entao durante a rolagem flutua por cima de
           qualquer coisa que passe por ali — no CRM, por cima do status do
           lead, que fica na ponta direita da linha. Folga no rodape so
           resolve o fim da pagina; o meio continua coberto. */
        .chat-assist-widget .chat-launcher.rolando {
            transform: translateY(90px);
            opacity: 0;
            pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
            .chat-assist-widget .chat-launcher.rolando {
                transform: none;
                opacity: 0;
            }
        }

        .chat-assist-widget .chat-launcher {
            position: fixed;
            bottom: 24px;
            /* Circulo de 54px: o menor alvo confortavel para o dedo e 44px, e
               54 da folga sem virar um bloco de cor na tela. A pilula anterior
               tinha 122px de largura para dizer o que o simbolo ja diz. */
            width: 54px;
            height: 54px;
            padding: 0;
            border-radius: 50%;
            background: var(--brand-600);
            color: #ffffff;
            border: 0;
            cursor: pointer;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            /* Anel claro em vez de borda escura: separa o botao de qualquer
               fundo sobre o qual ele caia, inclusive foto e tabela. */
            box-shadow: 0 0 0 3px rgba(255,255,255,.9), 0 6px 20px rgba(22,33,31,.22);
            transition: transform .18s cubic-bezier(.34,1.3,.64,1), opacity .22s ease, background-color .18s ease;
        }

        .chat-assist-widget .chat-launcher.right-side {
            right: 20px;
        }

        .chat-assist-widget .chat-launcher.left-side {
            left: 20px;
        }

        .chat-assist-widget .chat-launcher:hover {
            background: var(--brand-700);
            transform: scale(1.06);
        }

        .chat-assist-widget .chat-launcher svg {
            width: 24px;
            height: 24px;
        }

        /* Antes era uma faixa de 47px com borda propria so para a assinatura.
           Num widget de 780px de altura isso e 6% da janela gasto em credito.
           Agora e uma linha fina sem borda, encostada na caixa de entrada. */
        .chat-assist-widget .chat-footer {
            padding: 0 10px 5px;
            font-size: 10px;
            text-align: center;
            background: var(--chat-color-surface);
            flex-shrink: 0;
        }

        .chat-assist-widget .chat-footer-link {
            /* Em --brand-600 o credito tinha o mesmo peso visual dos links da
               conversa e puxava o olho para o rodape. Tinta suave resolve, e
               --ink-3 mede 5,23:1, bem acima do minimo. */
            color: var(--ink-3);
            text-decoration: none;
            font-size: 10px;
            transition: var(--chat-transition);
            font-family: inherit;
        }

        .chat-assist-widget .chat-footer-link:hover {
            color: var(--brand-700);
            text-decoration: underline;
        }

        .chat-assist-widget .chat-link {
            color: var(--brand-600);
            text-decoration: underline;
            word-break: break-all;
            transition: var(--chat-transition);
        }

        .chat-assist-widget .chat-link:hover {
            color: var(--brand-700);
        }

        .chat-assist-widget .chat-bubble.user-bubble .chat-link {
            color: #ffffff;
        }

        /* O navegador da 1em de margem a <p>, o que numa bolha de chat abre
           um vao do tamanho de uma linha inteira entre frases da MESMA fala.
           O espacamento passa a ser menor que a linha, nao maior. */
        .chat-assist-widget .chat-bubble p {
            margin: 0 0 6px;
        }

        .chat-assist-widget .chat-bubble p:last-child { margin-bottom: 0; }

        .chat-assist-widget .chat-bubble .chat-hint {
            margin-top: 6px;
            font-size: 12px;
            color: var(--ink-3);
        }

        /* E-mail longo quebrava no meio da palavra ("cliente@exemplo.co / m").
           break-word so quebra quando nao ha alternativa. */
        .chat-assist-widget .chat-bubble,
        .chat-assist-widget .chat-bubble p {
            overflow-wrap: break-word;
            word-break: normal;
        }

        .chat-assist-widget .chat-image {
            max-width: 100%;
            /* Teto de altura com recorte pelo centro: a foto e apoio, nao
               conteudo. Sem o teto ela saia com ~230px numa bolha de 340px,
               mais alta que a propria pergunta, e empurrava o texto para
               fora da tela. Recortar preserva o assunto da foto; encolher
               deixaria a bolha com faixas vazias dos lados. */
            max-height: 104px;
            object-fit: cover;
            object-position: center;
            width: 100%;
            border-radius: var(--chat-radius-sm);
            margin-top: 8px;
            display: block;
            border: 2px solid var(--rule);
        }

        .chat-assist-widget .image-container {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .chat-assist-widget .image-caption {
            font-size: 12px;
            color: var(--ink-3);
            text-align: center;
        }

        .action-buttons-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
        }

        /* Base = acao secundaria. Papel, nao matiz: um primario cheio por
           bloco e os demais em papel com fio de 2px. */
        .action-button .ico { color: currentColor; }

        .action-button {
            flex: 1 1 calc(50% - 4px);
            min-width: 96px;
            padding: 8px 10px;
            background: var(--card);
            color: var(--ink-1);
            border: 2px solid var(--rule);
            border-radius: var(--chat-radius-md);
            cursor: pointer;
            font-family: var(--fonte-texto);
            font-weight: 500;
            font-size: 12px;
            line-height: 1.3;
            text-align: center;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .action-button:hover {
            border-color: var(--brand-600);
            background: var(--sunken);
        }

        /* Desabilitado por borda tracejada + cursor + rotulo, nunca por
           opacidade: o texto continua legivel. */
        .action-button:disabled,
        .action-button[disabled] {
            border-style: dashed !important;
            border-color: var(--ink-3) !important;
            background: var(--sunken) !important;
            color: var(--ink-2) !important;
            cursor: not-allowed !important;
            transform: none !important;
        }

        /* As quatro classes de cor vem de template string e tem de continuar
           existindo; o que muda e o significado: as tres secundarias deixam
           de gritar matiz propria. */
        .green-button,
        .orange-button,
        .yellow-button {
            background: var(--card) !important;
            color: var(--ink-1) !important;
            border-color: var(--rule) !important;
        }

        .green-button:hover,
        .orange-button:hover,
        .yellow-button:hover {
            background: var(--sunken) !important;
            border-color: var(--brand-600) !important;
        }

        /* Primario: a acao que o negocio quer. .schedule-btn tem (0,2,0) e
           vence o .green-button (0,1,0) que ele carrega junto. */
        .blue-button,
        .action-button.schedule-btn {
            background: var(--brand-600) !important;
            color: #ffffff !important;
            border-color: var(--brand-700) !important;
            font-weight: 600 !important;
        }

        .blue-button:hover,
        .action-button.schedule-btn:hover {
            background: var(--brand-700) !important;
            border-color: var(--ink-1) !important;
        }

        .dynamic-buttons-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
            align-self: flex-start;
        }

        .dynamic-button {
            /* Icone e rotulo numa linha, com o icone fixo a esquerda: assim
               as opcoes formam uma coluna de icones alinhada, que se varre
               com o olho mais rapido do que texto solto. */
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 11px;
            border: 2px solid var(--rule);
            border-radius: var(--chat-radius-md);
            background-color: var(--card);
            color: var(--ink-1);
            cursor: pointer;
            font-family: var(--fonte-texto);
            font-weight: 500;
            font-size: 13px;
            line-height: 1.3;
            transition: border-color .18s ease, background-color .18s ease, color .18s ease;
            text-align: left;
            flex: 0 0 48%;
            box-sizing: border-box;
        }

        /* O icone fica em tinta suave ate a opcao ser apontada: antes do
           toque ele e orientacao, nao enfase. */
        .dynamic-button .ico { color: var(--ink-3); transition: color .18s ease; }

        .dynamic-button:hover {
            border-color: var(--brand-600);
            background-color: var(--tinte-marca);
        }

        .dynamic-button:hover .ico { color: var(--brand-600); }

        /* Opcao de consumo e de contagem de pessoas: numero e decisao, entao
           entra em Atkinson tabular com digito alinhado. */
        .dynamic-button[data-kwh],
        .dynamic-button[data-family] {
            font-family: var(--fonte-numero);
            font-variant-numeric: tabular-nums;
        }

        .solar-panel-image {
            width: 100%;
            max-width: 100%;
            /* Teto com recorte pelo centro: a foto e apoio da pergunta, nao
               conteudo. Sem ele a imagem ficava mais alta que o texto e
               empurrava a pergunta para fora da area visivel. */
            max-height: 96px;
            object-fit: cover;
            object-position: center;
            border-radius: var(--chat-radius-sm);
            margin: 0 0 8px;
            border: 2px solid var(--rule);
            display: block;
        }

        @media (max-width: 480px) {
            /* No celular a aba e a tela inteira: meia tela num aparelho de
               360px de largura nao serve para ler nem para digitar. */
            .chat-assist-widget .chat-window {
                width: 100vw !important;
                max-width: 100vw !important;
                padding: 0 !important;
                border-left: 0 !important;
            }

            .chat-assist-widget .chat-header-logo { height: 26px; }
        }

        @media (min-width: 481px) {
            /* A regra base ja monta a aba de altura inteira. Aqui so a
               largura cresce em tela grande, com teto para nao virar meia
               pagina num monitor ultralargo. */
            .chat-assist-widget .chat-window {
                width: min(440px, 38vw) !important;
                min-width: 380px !important;
            }
        }

        /* Teclado fisico: foco visivel e requisito, nao enfeite. */
        .chat-assist-widget button:focus-visible,
        .chat-assist-widget a:focus-visible,
        .action-button:focus-visible,
        .dynamic-button:focus-visible {
            outline: 2px solid var(--brand-700);
            outline-offset: 2px;
        }

        /* O botao de fechar e o unico controle que vive sobre a faixa de marca,
           e seu proprio fundo e --brand-700: o anel media 1,00:1, ou seja,
           invisivel. Branco sobre --brand-700 mede 8,09:1. */
        .chat-assist-widget .chat-close-btn:focus-visible {
            outline-color: var(--ink-sobre-marca);
        }
    `;
    document.head.appendChild(widgetStyles);

    // Default configuration - Sunbotic Theme
    const LOGO_PADRAO = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round'%3E%3Ccircle cx='24' cy='24' r='8' fill='%23ffffff' stroke='none'/%3E%3Cpath d='M24 6v5M24 37v5M6 24h5M37 24h5M11.2 11.2l3.5 3.5M33.3 33.3l3.5 3.5M36.8 11.2l-3.5 3.5M14.7 33.3l-3.5 3.5'/%3E%3C/g%3E%3C/svg%3E";

    const defaultSettings = {
        webhook: { url: '', route: '' },
        branding: {
            // Marca em SVG inline: o PNG antigo (neureka-ai.com/.../2-1.png) saiu
            // do ar e o cabecalho ficava com icone de imagem quebrada. Data URI
            // nao depende de servidor nenhum e nao tem como falhar.
            logo: LOGO_PADRAO,
            // Sem emoji no titulo: o logo ao lado ja e um sol, e emoji
            // muda de desenho em cada sistema operacional.
            name: 'Sunbotic Energia Solar',
            welcomeText: 'Olá! Como posso ajudá-lo hoje?',
            responseTimeText: 'Responde em segundos',
            poweredBy: { text: 'Powered by Neureka AI', link: 'https://neureka-ai.com' }
        },
        // A forma deste objeto e contrato externo (window.ChatWidgetConfig) e
        // nao muda; o que muda sao os defaults, que agora sao os tokens do
        // sistema. A paleta antiga reprovava o piso de contraste.
        style: {
            primaryColor: '#297A72',
            secondaryColor: '#1A5952',
            position: 'right',
            backgroundColor: '#FFFFFF',
            fontColor: '#16211F'
        },
        customStyles: {
            buttonPrimary: '#297A72',
            buttonSecondary: '#1A5952',
            bubbleBackground: '#FFFFFF',
            bubbleText: '#16211F',
            avatarPrimary: '#297A72',
            avatarSecondary: '#1A5952'
        },
        suggestedQuestions: []
    };

    // Merge user settings with defaults
    const settings = window.ChatWidgetConfig ? {
        webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
        branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
        style: { ...defaultSettings.style, ...window.ChatWidgetConfig.style },
        customStyles: { ...defaultSettings.customStyles, ...window.ChatWidgetConfig.customStyles },
        suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || defaultSettings.suggestedQuestions,
        // Obrigatorio para o RLS multi-tenant: o lead precisa nascer dentro
        // de uma empresa, senao o banco recusa o INSERT (ver
        // crm/migrations/SECURITY_lockdown_rls.sql).
        empresa_id: window.ChatWidgetConfig.empresa_id || null,
        // 'flutuante' (padrao) desenha o botao no canto; 'nenhum' nao desenha
        // nada e deixa a pagina abrir a aba pelo proprio menu. Num sistema que
        // ja tem navegacao, um botao fixo no canto so existe para cobrir
        // conteudo: a porta de entrada ja existe.
        launcher: window.ChatWidgetConfig.launcher || 'flutuante'
    } : defaultSettings;

    // Session tracking
    let conversationId = '';
    let isWaitingForResponse = false;
    let isChatInitialized = false;

    // Qualification funnel data
    let qualificationData = {
        email: null,
        phone: null,
        familySize: null,
        kwhConsumption: null,
        roofType: null
    };
    let qualificationStep = 0;
    // Liga a formatacao ao vivo so durante a pergunta do telefone.
    let modoTelefone = false;

    // Supabase configuration
    const SUPABASE_URL = 'https://zralzmgsdmwispfvgqvy.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYWx6bWdzZG13aXNwZnZncXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzA1NTYsImV4cCI6MjA3OTQwNjU1Nn0.lAarNVapj0c6A-1ix6PISUya0wMcRzruta1GECtwDD8';

    // Function to save lead to Supabase
    async function saveLeadToSupabase(data) {
        // Sem empresa_id o INSERT e recusado pelo RLS. Avisa claro no console
        // em vez de deixar o lead sumir silenciosamente.
        if (!settings.empresa_id) {
            console.error(
                '[chat-widget] empresa_id ausente: o lead NAO foi salvo. ' +
                'Defina window.ChatWidgetConfig.empresa_id com o id da sua ' +
                'empresa na tabela "empresas" do Supabase.'
            );
            return false;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({
                    empresa_id: settings.empresa_id,
                    email: data.email,
                    phone: data.phone,
                    family_size: data.familySize,
                    kwh_consumption: data.kwhConsumption,
                    roof_type: data.roofType,
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                // 401/403 aqui normalmente significa policy de INSERT ausente
                // ou empresa_id invalido/inativo.
                console.error('[chat-widget] Supabase recusou o lead:',
                              response.status, await response.text());
            }

            return response.ok;
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            return false;
        }
    }

    // Validation functions
    const validateEmail = (email) => {
        return email.includes('@') && email.includes('.');
    };

    // So os digitos importam. O usuario digita como quiser — "11912345678",
    // "(11) 91234-5678", "11 91234 5678", "+55 11 91234-5678" — e nos
    // normalizamos. Exigir pontuacao exata e empurrar para o usuario um
    // trabalho que o codigo faz melhor, e era o que fazia a conversa travar.
    const soDigitos = (texto) => (texto || '').replace(/\D/g, '');

    const normalizarTelefone = (texto) => {
        let d = soDigitos(texto);
        // Codigo do pais, com ou sem o zero de operadora na frente.
        if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
        if (d.length > 11 && d.startsWith('0')) d = d.slice(1);
        return d;
    };

    const validatePhone = (phone) => {
        const d = normalizarTelefone(phone);
        if (d.length !== 10 && d.length !== 11) return false;      // DDD + 8 ou 9 digitos
        if (!/^[1-9][1-9]$/.test(d.slice(0, 2))) return false;      // DDD valido no Brasil
        if (d.length === 11 && d[2] !== '9') return false;          // celular de 9 digitos comeca com 9
        if (/^(\d)\1+$/.test(d.slice(2))) return false;            // 11111111111 nao e telefone
        return true;
    };

    // Formata para guardar e exibir sempre do mesmo jeito, venha como vier.
    const formatarTelefone = (texto) => {
        const d = normalizarTelefone(texto);
        if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
        if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return texto;
    };

    // Formatacao ao vivo enquanto digita, sem bloquear nada: o usuario ve o
    // numero tomando forma em vez de receber um erro depois de enviar.
    const formatarParcial = (texto) => {
        const d = normalizarTelefone(texto).slice(0, 11);
        if (!d) return '';
        if (d.length <= 2) return `(${d}`;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };

    // Create widget DOM structure
    // Os icones precisam existir ANTES do primeiro uso: o lancador e montado
    // logo abaixo e chama icone(). Como sao const, usar antes da declaracao
    // lanca ReferenceError por zona morta temporal — e um ReferenceError aqui
    // derruba o widget inteiro, sem deixar nem o botao na tela.
    const ICONES = {
        telhaCeramica: '<path d="M2 9 12 3l10 6"/><path d="M4 9v11h16V9"/><path d="M8 20v-6h8v6"/>',
        fibrocimento:  '<path d="M3 8h18"/><path d="M3 8v12h18V8"/><path d="M7 8v12M12 8v12M17 8v12"/><path d="M3 8 6 4h12l3 4"/>',
        metalico:      '<path d="M3 20 7 5h10l4 15"/><path d="M8 5 6 20M12 5v15M16 5l2 15"/>',
        laje:          '<path d="M3 7h18v3H3z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
        duvida:        '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4"/><path d="M12 17.6h.01"/>',
        agenda:        '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h3v3H8z"/>',
        pessoas:       '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6"/><path d="M17 14.4A6 6 0 0 1 21 20"/>',
        raio:          '<path d="M13 2 4.5 13.5H11l-1 8.5L18.5 10H12z"/>',
        correio:       '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
        telefone:      '<path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z"/>',
        casa:          '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/><path d="M9.5 21v-6h5v6"/>',
        economia:      '<path d="M4 19V9M10 19V5M16 19v-7M4 19h16"/><path d="m14 8 3-3 3 3"/>',
        conversa:      '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
        aceno:         '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
        alerta:        '<path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4M12 17.5h.01"/>',
        confirma:      '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16 9.7"/>',
        setaBaixo:     '<path d="M12 4v14"/><path d="m6 12.5 6 6 6-6"/>',
        setaCima:      '<path d="M12 20V6"/><path d="m6 11.5 6-6 6 6"/>',
        sol:           '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/>',
    };

    // tam em px; o traco acompanha para o peso optico nao mudar com o tamanho.
    const icone = (nome, tam = 16) => {
        const d = ICONES[nome];
        if (!d) return '';
        return `<svg class="ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" ` +
               `stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ` +
               `stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
    };

    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';

    // Apply custom colors from settings
    widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);

    // Apply customStyles
    widgetRoot.style.setProperty('--chat-widget-button-primary', settings.customStyles.buttonPrimary);
    widgetRoot.style.setProperty('--chat-widget-button-secondary', settings.customStyles.buttonSecondary);
    widgetRoot.style.setProperty('--chat-widget-bubble-bg', settings.customStyles.bubbleBackground);
    widgetRoot.style.setProperty('--chat-widget-bubble-text', settings.customStyles.bubbleText);
    widgetRoot.style.setProperty('--chat-widget-avatar-primary', settings.customStyles.avatarPrimary);
    widgetRoot.style.setProperty('--chat-widget-avatar-secondary', settings.customStyles.avatarSecondary);
    widgetRoot.style.setProperty('--chat-widget-primarybubble', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondarybubble', settings.style.secondaryColor);

    // Create chat panel
    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;

    // Create header HTML
    const headerHTML = `
        <div class="chat-header">
            <img class="chat-header-logo" src="${settings.branding.logo}" alt="${settings.branding.name}">
            <span class="chat-header-title">${settings.branding.name}</span>
            <button class="chat-close-btn">×</button>
        </div>
    `;

    // Create main chat interface HTML
    const chatInterfaceHTML = `
        <div class="chat-body active">
            <div class="chat-messages"></div>
            <div class="leitura-solar" aria-live="polite">
              <div class="leitura-interna">
                <div class="leitura-ceu">
                    <svg class="leitura-arco" viewBox="0 0 240 30" aria-hidden="true">
                        <path class="leitura-trilha" d="M12 26 A 302 302 0 0 1 228 26" />
                        <path class="leitura-percorrido" d="M12 26 A 302 302 0 0 1 228 26" />
                        <line class="leitura-horizonte" x1="0" y1="26.5" x2="240" y2="26.5" />
                    </svg>
                    <span class="leitura-sol" aria-hidden="true"></span>
                </div>
                <div class="leitura-dados">
                    <div class="leitura-item">
                        <span class="leitura-rotulo">Etapa</span>
                        <span class="leitura-valor" data-leitura="etapa">0 de 5</span>
                    </div>
                    <div class="leitura-item">
                        <span class="leitura-rotulo">Consumo</span>
                        <span class="leitura-valor" data-leitura="consumo">—</span>
                    </div>
                    <div class="leitura-item leitura-item--destaque">
                        <span class="leitura-rotulo">Economia estimada</span>
                        <span class="leitura-valor" data-leitura="economia">—</span>
                    </div>
                </div>
              </div>
            </div>
            <div class="chat-controls">
                <textarea class="chat-textarea" placeholder="Digite aqui..." rows="1"></textarea>
                <button class="chat-submit">
                    <svg xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         stroke-linecap="round"
                         stroke-linejoin="round">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                </button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

    chatWindow.innerHTML = headerHTML + chatInterfaceHTML;

    // Fallback do logo ligado por JavaScript, nao por atributo onerror no HTML:
    // a data URI da marca contem aspas simples (xmlns='...') e elas fechavam a
    // string do atributo antes da hora, deixando o handler invalido. Em JS nao
    // ha conflito de aspas. Serve para quando quem embute o widget configurar
    // uma URL de logo que nao existe mais — foi exatamente o que aconteceu.
    const logoEl = chatWindow.querySelector('.chat-header-logo');
    if (logoEl) {
        logoEl.addEventListener('error', () => {
            if (logoEl.getAttribute('src') !== LOGO_PADRAO) logoEl.src = LOGO_PADRAO;
        });
    }

    // Create launcher button
    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    // So o icone. A pilula com "Ajuda?" tinha 122px de largura e nao dizia
    // mais do que o simbolo ja diz. O rotulo vive no title e no aria-label,
    // onde serve a quem navega por teclado ou leitor de tela sem ocupar a tela.
    launchButton.setAttribute('aria-label', 'Abrir atendimento');
    launchButton.setAttribute('title', 'Fale com a gente');
    launchButton.innerHTML = icone('conversa', 24);

    // Add elements to DOM
    widgetRoot.appendChild(chatWindow);
    if (settings.launcher !== 'nenhum') widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);

    // Get DOM elements after they are created
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    const messageTextarea = chatWindow.querySelector('.chat-textarea');
    const sendButton = chatWindow.querySelector('.chat-submit');

    // Helper to generate a unique session ID
    const createSessionId = () => crypto.randomUUID();

    // Helper to create the "typing..." animation element
    const createTypingIndicator = () => {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
        return indicator;
    };

    // Helper to convert URLs in text to clickable links
    const linkifyText = (text) => {
        const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        return text.replace(urlPattern, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`);
    };

    // Helper to detect and render images from URLs in the text
    const renderImages = (text) => {
        const imgPattern = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?)/gi;
        return text.replace(imgPattern, url => `<div class="image-container"><img src="${url}" class="chat-image" alt="Image from link"><span class="image-caption">Image</span></div>`);
    };

    // Helper to render basic markdown
    const renderMarkdown = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*)$/gm, '<li>$1</li>')
            // A bolha nao preserva mais quebra de linha por CSS, entao a
            // quebra do texto livre vira <br> aqui. Sem isto a resposta do
            // n8n chegaria como um paragrafo unico e corrido.
            .replace(/\n/g, '<br>');
    };



    // Bot avatar SVG inline
    // O marcador de quem fala e o sol da marca, nao um rosto de robo: ele se
    // repete em toda fala, entao e o elemento mais visto do painel. Um robo
    // generico de banco de icones nao diz nada sobre energia solar; o sol e o
    // mesmo simbolo do cabecalho, do login e da leitura — a marca aparece onde
    // o olho ja esta.
    const botAvatarHTML = `
        <div class="bot-avatar">${icone('sol', 18)}</div>
    `;

    // Function to add bot message
    const addBotMessage = (content, includeImage = false, imageUrl = '') => {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container bot-message';

        let imageHTML = '';
        if (includeImage && imageUrl) {
            imageHTML = `<img src="${imageUrl}" class="solar-panel-image" alt="Painel Solar">`;
        }

        messageContainer.innerHTML = `
            ${botAvatarHTML}
            <div class="message-content">
                <div class="chat-bubble bot-bubble">
                    ${imageHTML}
                    ${content}
                </div>
                <span class="timestamp">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
        messagesContainer.appendChild(messageContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // A rolagem acima acontece ANTES de a foto carregar, quando a bolha
        // ainda nao tem a altura final: quando a imagem chega, ela empurra o
        // texto para baixo e a pergunta nova nasce cortada no rodape. Rolar de
        // novo no onload resolve. O onerror tambem rola, senao uma imagem que
        // falha deixa a conversa parada no lugar errado.
        const foto = messageContainer.querySelector('.solar-panel-image');
        if (foto && !foto.complete) {
            const rolar = () => { messagesContainer.scrollTop = messagesContainer.scrollHeight; };
            foto.addEventListener('load', rolar, { once: true });
            foto.addEventListener('error', rolar, { once: true });
        }

        return messageContainer;
    };

    // Function to add user message
    const addUserMessage = (text) => {
        const userMessageContainer = document.createElement('div');
        userMessageContainer.className = 'message-container user-message';

        userMessageContainer.innerHTML = `
            <div class="message-content">
                <div class="chat-bubble user-bubble">
                    <p>${text}</p>
                </div>
                <span class="timestamp">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
        messagesContainer.appendChild(userMessageContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Function to open calendar in external window
    const addCalendarToChat = () => {
        // Abre o calendário em uma nova aba/janela externa
        window.open('https://calendar.app.google/tps9rXCFtW3VUoiBA', '_blank');

        // Mostra mensagem confirmando
        addBotMessage(`
            <p>${icone('agenda')} <strong>O calendário foi aberto numa nova janela.</strong></p>
            <p class="chat-hint">Escolha o melhor horário para sua reunião com nosso especialista.</p>
        `);
    };

    // Function to show the dynamic buttons for different doubt topics
    // =================================================================
    // BASE DE CONHECIMENTO LOCAL
    // =================================================================
    // As 22 duvidas sao perguntas fixas com respostas fixas. Depender de um
    // servico externo para responder "o que e energia solar" significa que,
    // toda vez que ele cair, o cliente que so queria o basico bate num erro
    // — foi exatamente o que aconteceu. Aqui as respostas viajam junto com o
    // widget: funcionam offline, respondem na hora e nao tem como quebrar.
    //
    // Numeros conferem com a calculadora do CRM (crm/calculadora-solar.js) e
    // com a Lei 14.300/2022, o marco legal da geracao distribuida.
    const BASE_DUVIDAS = {
        'Energia Solar': {
            titulo: 'Da luz à tomada',
            palavras: ['energia solar', 'o que e energia solar', 'como funciona energia solar', 'enegia solar', 'placa solar', 'painel solar', 'placas no telhado', 'energia do sol', 'fotovoltaica', 'fotovoltaico', 'painel fotovoltaico', 'luz do sol em eletricidade', 'placa de energia', 'efeito fotovoltaico'],
            resposta: `<p>O módulo no telhado é uma placa de silício. Quando a luz do sol bate nela, os elétrons do silício se movem e aparece corrente elétrica. Chama-se efeito fotovoltaico: não tem peça girando, não queima nada, não faz ruído.</p><p>Essa corrente sai da placa em <strong>corrente contínua</strong>, que não serve para a sua tomada. O inversor, instalado perto do quadro de luz, converte para <strong>corrente alternada</strong> em 127 V ou 220 V e entrega essa energia no quadro. Dali em diante a geladeira não sabe se a energia veio do telhado ou da rua.</p><p>Quanto cada placa rende depende de onde você mora. A irradiação no Brasil vai de 4,6 kWh/m²/dia em Santa Catarina a 5,9 no Rio Grande do Norte. Na prática, um módulo de 550 Wp bem orientado gera entre <strong>60 e 77 kWh por mês</strong>. A R$ 0,85/kWh isso vale de R$ 51 a R$ 65 se você consumir no mesmo horário em que gera, e de R$ 44 a R$ 56 se a energia for para a rede e voltar como crédito, porque o crédito paga o Fio B.</p><p>O sistema só gera com luz. À noite não gera nada, e em dia fechado a geração cai bastante. Tem mais: quando a rede da rua cai, o sistema desliga junto, mesmo ao meio-dia — é exigência de segurança, para não energizar o poste em que o eletricista está trabalhando. Quem quer luz no apagão precisa de bateria, que é outro projeto. Por isso o sistema não é dimensionado pelo pico do seu consumo, e sim pelo consumo do ano: o que sobra no verão cobre o que falta no inverno.</p><p class="chat-hint">Sombra é o que mais estraga o cálculo. Uma árvore ou uma caixa d'água em cima de uma placa derruba a geração da fileira inteira, não só daquela placa. Vale exigir que o projeto mostre o estudo de sombreamento do seu telhado, e não só a potência total.</p>`,
            relacionados: ['Sistema Fotovoltaico', 'Compensação Energia', 'Retorno Investimento'],
        },
        'Sistema Fotovoltaico': {
            titulo: 'Como o sistema funciona',
            palavras: ['sistema fotovoltaico', 'como funciona o sistema', 'etapas do sistema', 'precisa de bateria', 'tem bateria', 'sistema sem bateria', 'funciona a noite', 'inversor converte', 'medidor bidirecional', 'fotovoltaico como funciona', 'funcionamento do sistema solar', 'como a energia chega na tomada', 'gera de dia', 'corrente continua e alternada'],
            resposta: `<p>São cinco etapas, e vale saber o que acontece em cada uma.</p><p><strong>1.</strong> As placas, ligadas em série, entregam corrente contínua em tensão alta — de 300 a 600 V num sistema residencial.<br><strong>2.</strong> O inversor converte para corrente alternada e fica procurando o ponto de maior potência das placas várias vezes por segundo. Nessa conversão ele perde de 2% a 3%.<br><strong>3.</strong> A energia entra no seu quadro e abastece primeiro o que estiver ligado naquele instante.<br><strong>4.</strong> O que sobra vai para a rede pelo medidor bidirecional, que conta os dois sentidos.<br><strong>5.</strong> O que foi injetado volta como crédito em kWh e abate o consumo da noite ou dos meses seguintes, com validade de 60 meses.</p><p>É por isso que o sistema mais comum não tem bateria: a rede faz o papel dela. Você guarda a energia na forma de crédito, e a <strong>Lei 14.300/2022</strong> é o que garante essa troca. Bateria, nesse caso, seria custo a mais sem economia a mais.</p><p>A troca não é um para um. Quem protocolou a solicitação de acesso na distribuidora depois de 7 de janeiro de 2023 paga uma parcela do uso da rede sobre a energia <strong>compensada</strong> — o crédito que volta para abater o consumo —, o chamado Fio B. Em <strong>2026 ele está em 60%</strong>, algo entre R$ 0,10 e R$ 0,20 por kWh compensado conforme a distribuidora. Energia consumida na hora em que é gerada não entra nessa conta — daí a recomendação de rodar máquina de lavar, bomba de piscina e ar-condicionado durante o dia.</p><p class="chat-hint">O inversor on-grid é obrigado por norma a desligar quando a rede cai, para não energizar o poste e pôr em risco quem for consertar. Então, na falta de luz, o sistema on-grid fica fora do ar junto com o bairro, mesmo em pleno sol. Se manter a casa de pé no apagão importa para você, o caminho é o híbrido, com bateria.</p>`,
            relacionados: ['Componentes Solares', 'Off-grid, On-grid e Híbrido', 'Falta de Energia'],
        },
        'Componentes Solares': {
            titulo: 'Componentes e durabilidade',
            palavras: ['componentes', 'equipamentos', 'o que vem no kit', 'kit solar', 'modulo', 'inversor', 'string box', 'dps', 'estrutura de fixacao', 'cabeamento', 'protecoes', 'aterramento', 'qual peca dura menos', 'o que precisa trocar', 'microinversor'],
            resposta: `<p><strong>Módulos</strong> — as placas. Hoje de 550 a 580 Wp, cerca de <strong>2,6 m²</strong> (2,28 m por 1,13 m) e 25 a 30 kg cada, convertendo de 21% a 23% da luz que recebem. A garantia de desempenho e de 25 anos: a placa perde de 1% a 2% no primeiro ano e de 0,4% a 0,55% ao ano depois disso, e no ano 25 ainda entrega entre <strong>85% e 89%</strong> da potencia original, conforme o fabricante.</p><p><strong>Inversor</strong> — converte a corrente, monitora a geração pelo aplicativo e desliga sozinho em caso de falha. Garantia de fábrica de 5 a 10 anos, com extensão vendida à parte, e vida útil de 10 a 15. <strong>É o componente que você provavelmente vai trocar uma vez</strong>, e o custo dessa troca, de 15% a 25% do valor do sistema, tem de estar no cálculo de retorno que te apresentarem.</p><p><strong>Estrutura de fixação</strong> — perfis de alumínio e parafusos de inox, dimensionados para a carga de vento da sua região. É o item que decide se o telhado vai vazar: fixação errada é a causa mais comum de infiltração depois da obra.</p><p><strong>String box, DPS e disjuntores</strong> — a proteção. O dispositivo contra surtos é sacrificial: ele se queima para salvar o resto, e depois de uma descarga próxima pode precisar de troca. Custa pouco, e quem economiza nele costuma perder o inversor.</p><p><strong>Cabeamento, conectores e aterramento</strong> — cabo solar de 4 ou 6 mm², com isolação resistente a sol e chuva por 25 anos, e conectores do tipo MC4. Conector mal crimpado esquenta, cria mau contato e é um dos poucos riscos reais de incêndio no sistema. Isso é serviço, não produto: depende de quem instala.</p><p class="chat-hint">Resumindo a durabilidade: módulo e estrutura passam dos 25 anos, inversor fica entre 10 e 15, o DPS é peça de reposição. Peça o prazo de garantia de cada item por escrito e separe garantia de fábrica de garantia de serviço — são coisas diferentes, e quase toda reclamação de pós-venda nasce nessa confusão.</p>`,
            relacionados: ['Vida Útil', 'Manutenção Sistema', 'Espaço da Instalação'],
        },
        'Benefícios Solares': {
            titulo: 'Quais são os benefícios',
            palavras: ['beneficio', 'beneficios', 'vantagem', 'vantagens', 'vale a pena instalar', 'por que instalar', 'pra que serve', 'valorizacao do imovel', 'valoriza imovel', 'valoriza a casa', 'reajuste de tarifa', 'aumento de tarifa', 'o que eu ganho', 'desvantagem', 'desvantagens'],
            resposta: `<p><strong>Conta menor e previsivel.</strong> A reducao fica entre 75% e 90% do valor da fatura, nunca 100%: ficam o custo de disponibilidade, os tributos e o Fio B sobre a energia que voce injeta e consome depois. Quem consome mais de dia chega perto dos 90%; quem usa quase tudo de noite fica nos 75%. O ganho de fundo e trocar uma despesa que voce nao controla por um equipamento que voce ja pagou.</p> <p><strong>Protecao contra reajuste de tarifa.</strong> E o beneficio mais subestimado. A tarifa e reajustada todo ano e, em boa parte da ultima decada, subiu acima da inflacao — com bandeira tarifaria por cima nos periodos de seca. Depois do sistema instalado, cada aumento futuro melhora o seu retorno em vez de piorar sua conta. E o unico item da lista que fica melhor com o tempo.</p> <p><strong>Valorizacao do imovel.</strong> Existe, mas o numero e mais fraco do que a propaganda sugere. A faixa mais citada no Brasil chega a 10%, estimativa da ABSOLAR; pesquisas americanas apontam de 3% a 6%. Nao achei estudo brasileiro de mercado que sustente os 10%. Trate como bonus na hora de vender, nao como parte da conta de retorno.</p> <p><strong>Vinte e cinco anos de geracao com manutencao baixa.</strong> Limpeza uma ou duas vezes por ano e a troca do inversor entre o ano 10 e o 15. Nao ha peca movel nem combustivel.</p> <p>E o que o sistema <strong>nao</strong> faz: nao funciona na falta de luz. O on-grid desliga junto com a rede, por norma de seguranca, para nao energizar o fio em que o eletricista da concessionaria esta trabalhando. Quem quer luz durante o apagao precisa de bateria, que e investimento a parte.</p> <p class="chat-hint">Se o seu consumo e concentrado de dia — home office, comercio, bomba de piscina, ar-condicionado a tarde — o retorno fica acima da media, porque voce usa a energia na hora em que ela e gerada e nao paga a parcela de uso da rede sobre ela.</p>`,
            relacionados: ['Retorno Investimento', 'Conta Luz', 'Incentivos Fiscais'],
        },
        'Vida Útil': {
            titulo: 'Quanto tempo dura',
            palavras: ['vida util', 'vida util das placas', 'quanto tempo dura', 'quanto dura a placa solar', 'durabilidade', 'garantia', 'garantia de 25 anos', 'garantia das placas', 'degradacao', 'perde potencia', 'quanto dura o inversor', 'troca de inversor', 'dura quantos anos', 'placa estraga', 'vence a garantia'],
            resposta: `<p><strong>Módulos: 25 a 30 anos de geração.</strong> Eles não param de funcionar de um dia para o outro — vão perdendo potência devagar. A queda é de 1% a 2% no primeiro ano e fica entre 0,4% e 0,55% ao ano depois disso. No ano 25, a placa ainda entrega de 85% a 89% do que entregava nova.</p> <p><strong>Inversor: 10 a 15 anos.</strong> É o único componente que trabalha convertendo corrente todos os dias, e o primeiro a ser trocado. A garantia de fábrica costuma ser de 5 a 10 anos, com extensão vendida à parte. Conte com uma troca ao longo da vida do sistema e exija que ela apareça no cálculo de retorno — se não aparecer, o payback que te mostraram está otimista.</p> <p><strong>Estrutura: acompanha as placas.</strong> Perfil de alumínio e parafuso de inox não enferrujam. O que envelhece é outra coisa: a vedação dos furos no telhado. É isso que se inspeciona, não o metal.</p> <p><strong>O que a garantia de 25 anos garante de verdade.</strong> São duas garantias diferentes, e costuma-se citar só a maior. A de <strong>desempenho</strong>, de 25 ou 30 anos, cobre apenas a curva de potência: se a placa cair abaixo dela, o fabricante repõe a diferença, mediante laudo de medição. A de <strong>produto</strong> — defeito de fabricação, delaminação, caixa de junção, moldura — costuma ser de 12 anos, não 25.</p> <p>Nenhuma dessas duas é garantia do instalador: a do fabricante cobre a peça, não a mão de obra, o frete nem o andaime da troca. Quem cobre isso é o contrato de instalação, e o prazo do nosso está na proposta, com o que inclui — vale comparar esse item entre os orçamentos, porque é o que mais varia e o que mais pesa no dia em que a troca acontece. Raio, surto e granizo ficam fora das duas: isso é caso de seguro.</p> <p class="chat-hint">Peça os dois prazos por escrito e pergunte quem responde pela garantia no Brasil. Fabricante sem representação aqui transforma 25 anos de garantia em papel, e a conta da troca sobra para você.</p>`,
            relacionados: ['Manutenção Sistema', 'Retorno Investimento', 'Clima e Sujeira'],
        },
        'Retorno Investimento': {
            titulo: 'Qual o retorno',
            palavras: ['retorno', 'retorno do investimento', 'vale a pena', 'vale apena', 'quanto economizo', 'economia', 'roi', 'compensa', 'quanto rende', 'retorno financeiro', 'investimento solar', 'vale o investimento', 'economiza quanto', 'retorno solar'],
            resposta: `<p>Na maior parte do Brasil o sistema se paga entre <strong>4 e 7 anos</strong> e segue gerando por mais de 15 anos depois de pago. Não dou múltiplo de retorno em 25 anos: ele depende do que a tarifa fizer no período, e quem fecha esse número está adivinhando. Desde 2023 existe ainda o <strong>Fio B</strong>, uma parcela do custo da rede que incide sobre a energia injetada e consumida depois — 60% dela em 2026 —, e isso empurra o retorno para a parte alta da faixa em quem injeta muito. A posição dentro dela depende de quatro coisas.</p> <p>A <strong>tarifa da sua concessionaria</strong> e a que mais pesa: usamos R$ 0,85/kWh como referencia, e quem paga mais que isso tem retorno mais rapido. A <strong>irradiacao da sua cidade</strong> vai de 4,6 kWh/m2/dia em Santa Catarina a 5,9 no Rio Grande do Norte: 28% de geracao a mais para o mesmo sistema. Depois vem a <strong>orientacao e a sombra do telhado</strong> e a <strong>forma de pagamento</strong>.</p> <p>Depois de pago, sobram mais de 18 anos de geração. Mas a energia não fica de graça. Continua o custo de disponibilidade da concessionária. Continua o Fio B sobre a energia que você injeta e consome depois: 60% em 2026, 75% em 2027, 90% em 2028 e, de 2029 em diante, pela regra que a ANEEL ainda vai definir. E em algum ponto entre o ano 10 e o 15 você troca o inversor, algo entre R$ 3 mil e R$ 8 mil num sistema residencial. Conta de retorno honesta prevê os três.</p> <p>Os modulos perdem cerca de <strong>0,5% de potencia por ano</strong>. No ano 25 ainda geram ao menos 80% do original, e e isso que a garantia de desempenho de 25 anos assegura.</p> <p class="chat-hint">Desconfie de proposta que promete payback em 3 anos sem ter visto sua conta. Prazo abaixo de 4 anos so aparece com tarifa muito alta ou consumo concentrado de dia. Posso estimar o seu caso em cinco perguntas.</p>`,
            relacionados: ['Tempo de Payback', 'Conta Luz', 'Benefícios Solares'],
        },
        'Conta Luz': {
            titulo: 'O que acontece com a conta',
            palavras: ['conta de luz', 'conta', 'fatura', 'conta zera', 'zera a conta', 'zerar a conta', 'conta vai zerar', 'quanto fica a conta', 'custo de disponibilidade', 'taxa minima', 'iluminacao publica', 'conta de energia', 'minimo da conta', 'continua pagando', 'taxa minima de luz'],
            resposta: `<p>A conta cai muito, mas <strong>nao zera</strong>. Mesmo que voce gere mais do que consome, continua ligado a rede e paga o <strong>custo de disponibilidade</strong> — um minimo mensal em kWh que o credito nao abate. A regra da ANEEL define por tipo de ligacao:</p> <p>Monofásico ou bifásico a dois condutores: <strong>30 kWh</strong><br>Bifásico a três condutores: <strong>50 kWh</strong><br>Trifásico: <strong>100 kWh</strong></p> <p>Alem disso continuam dois itens. A <strong>iluminacao publica</strong>, cobrada pela prefeitura, que vai de poucos reais a algumas dezenas conforme o municipio e a faixa de consumo. E os <strong>tributos</strong> — ICMS, PIS e Cofins incidem sobre o valor que for faturado.</p> <p><strong>Um exemplo.</strong> Conta de R$ 600 por mes, ligacao bifasica, tarifa de R$ 0,85/kWh. Os 50 kWh do minimo dao R$ 42,50. Falta um item: sobre a energia que voce injetou de dia e consumiu de noite incide o Fio B, de R$ 0,09 a R$ 0,23 por kWh conforme a distribuidora. Quem injeta cerca de 70% do que gera paga ai de R$ 45 a R$ 115 por mes. Com iluminacao publica e tributos, a fatura fica entre <strong>R$ 110 e R$ 180</strong> — uma queda de 70% a 82%, nao de 100%. Consumindo mais de dia, voce fica na ponta de baixo dessa faixa.</p> <p>O piso muda com a ligacao: no monofasico sao 30 kWh, uns R$ 25,50; no trifasico sao 100 kWh, cerca de R$ 85 antes das taxas. Vale olhar qual e a sua antes de aceitar qualquer numero.</p> <p class="chat-hint">Se alguem garantir conta zerada, ou esta errado ou esta vendendo um sistema off-grid, que e outro produto — mais caro, com bateria e desligado da rede. Nenhum sistema conectado a concessionaria zera a fatura.</p>`,
            relacionados: ['Compensação Energia', 'Créditos por Residência', 'Retorno Investimento'],
        },
        'Manutenção Sistema': {
            titulo: 'Qual a manutenção',
            palavras: ['manutencao', 'manutencao placa solar', 'manutencao do sistema', 'limpeza', 'limpar as placas', 'lavar as placas', 'precisa limpar', 'de quanto em quanto tempo limpa', 'cuidados', 'da trabalho', 'custo de manutencao', 'monitoramento', 'app do inversor', 'inspecao anual', 'sujeira na placa'],
            resposta: `<p><strong>Limpeza: duas vezes por ano</strong> na maior parte dos casos. Em região de poeira, maresia, pólen, obra por perto ou muita ave, três ou quatro vezes. Água e pano ou escova macia, no começo da manhã ou no fim da tarde — placa quente com água fria sofre choque térmico. Sem máquina de pressão e sem produto abrasivo.</p> <p>É a manutenção que mais rende: sujeira acumulada pode tirar 25% ou mais da geração em caso extremo, e é a perda mais barata de corrigir.</p> <p><strong>Inspeção elétrica: uma vez por ano.</strong> Verifica os conectores — aquecimento em conexão mal feita é a falha mais comum —, o aperto da estrutura, o aterramento, a vedação dos furos do telhado e os dispositivos de proteção contra surto. Esses dispositivos são consumíveis: queimam protegendo o sistema e precisam ser substituídos.</p> <p><strong>O que o inversor avisa sozinho</strong>, pelo aplicativo, no mesmo dia: queda de geração de uma fileira de placas, falha de isolamento, tensão da rede fora da faixa, desligamento por temperatura, perda de comunicação e parada total.</p> <p><strong>O que ele não avisa.</strong> Sujeira acumulada e sombra nova — a árvore que cresceu no terreno do vizinho — aparecem apenas como geração menor, mês a mês. Um módulo fraco dentro de uma fileira grande também passa quase sem assinatura. Por isso vale abrir o aplicativo uma vez por mês e comparar com o mesmo mês do ano anterior.</p> <p class="chat-hint">A periodicidade oficial do seu sistema vem do manual de operação e manutenção do projeto, previsto na NBR 16274. Exija esse manual na entrega, com o intervalo de cada componente: sem ele, qualquer discussão de garantia ou de seguro começa contra você.</p>`,
            relacionados: ['Clima e Sujeira', 'Vida Útil', 'Componentes Solares'],
        },
        'Compensação Energia': {
            titulo: 'Como funciona a compensação',
            palavras: ['compensacao', 'compensacao de energia', 'credito de energia', 'creditos', 'como funciona o credito', 'energia que sobra', 'excedente', 'injetar na rede', 'abater a conta', 'validade do credito', 'credito vence', '60 meses', 'saldo de energia', 'medidor bidirecional', 'lei 14300'],
            resposta: `<p>O medidor passa a contar nos dois sentidos. O que a casa consome na mesma hora em que o sol está gerando não chega a passar pela rede. O que sobra é injetado, e a concessionária registra esse excedente em <strong>kWh</strong>, não em reais.</p> <p>No mês seguinte, esses kWh abatem o seu consumo. Primeiro na própria unidade onde está o sistema; o que ainda sobrar vai para os outros imóveis que você tiver indicado. A fatura cobra o que não foi compensado, com um piso que o crédito não abate: o <strong>custo de disponibilidade</strong>, de 30 kWh no monofásico e no bifásico a dois condutores, 50 kWh no bifásico a três condutores e 100 kWh no trifásico. Piso, não soma — a distribuidora cobra o maior dos dois valores, não um mais o outro.</p> <p>O crédito que não foi usado fica guardado e <strong>vale 60 meses</strong>. É o que faz a sobra de dezembro pagar o consumo de junho. A concessionária gasta sempre o crédito mais antigo primeiro, e o que passar de 60 meses expira e não volta — por isso o sistema é dimensionado para o seu consumo anual, e não para o máximo que o telhado aguentaria.</p> <p>Quem fixou essa regra foi a <strong>Lei 14.300/2022</strong>. Antes dela a compensação vivia de resolução da ANEEL, que podia mudar a qualquer momento; era a insegurança que mais travava a decisão de comprar. Hoje a validade dos créditos e a regra de abatimento estão em lei.</p> <p class="chat-hint">A mesma lei criou a cobrança gradual do Fio B para projetos novos: em 2026 cada kWh compensado abate um pouco menos que o kWh cheio. Isso já entra no cálculo de retorno que eu faço, e está detalhado no tópico de incentivos.</p>`,
            relacionados: ['Créditos por Residência', 'Conta Luz', 'Incentivos Fiscais'],
        },
        'Tipos de Sistemas': {
            titulo: 'On-grid, off-grid e híbrido',
            palavras: ['tipos de sistema', 'on grid', 'ongrid', 'off grid', 'offgrid', 'hibrido', 'sistema com bateria', 'sistema isolado', 'qual sistema escolher', 'diferenca entre on grid e off grid', 'sistema para sitio', 'backup de energia', 'nobreak solar', 'quanto custa a bateria', 'falta de luz'],
            resposta: `<p><strong>On-grid</strong> — ligado à rede, sem bateria. Resolve conta de luz e é o único dos três com retorno calculável: entre 4 e 7 anos, conforme consumo, tarifa e irradiação da sua cidade. Atende quase todo caso residencial. E tem um porém que você precisa ouvir antes de comprar, não depois: <strong>o on-grid não funciona na falta de luz</strong>. Quando a rede cai, o inversor desliga por norma e a casa fica no escuro como a dos vizinhos, mesmo ao meio-dia.</p><p><strong>Off-grid</strong> — isolado, sem rede nenhuma. Exige banco de baterias, controlador de carga e geração sobrada para os dias nublados, e muita gente mantém um gerador de reserva. Faz sentido onde não chega poste: sítio, bomba de captação de água, antena. Para o mesmo consumo, custa de <strong>duas a três vezes</strong> o on-grid, e não gera crédito nenhum, porque não há rede para compensar.</p><p><strong>Híbrido</strong> — ligado à rede e com bateria. Abate a conta como o on-grid e ainda mantém parte da casa de pé no apagão: em geral geladeira, luzes, internet e algumas tomadas escolhidas no projeto. Chuveiro e ar-condicionado quase nunca entram nesse grupo.</p><p>O custo extra é a bateria. Uma casa que queira segurar o essencial por algumas horas pede de 5 a 10 kWh de armazenamento, e o kWh instalado está na faixa de R$ 3 mil a R$ 6 mil, preço que vem caindo ano a ano. Somando o inversor híbrido, mais caro que o comum, a bateria acrescenta de <strong>R$ 18 mil</strong>, num banco de 5 kWh, a <strong>R$ 65 mil</strong>, num banco de 10 kWh. O tamanho do banco decide o preço, não a marca.</p><p>Uma coisa precisa ficar clara: <strong>bateria não se paga em economia</strong>. Ela estica o tempo de retorno. Você paga por não ficar sem luz. Se a sua rua cai duas vezes por ano por uma hora, não vale; se tem equipamento médico em casa, se você trabalha em reunião o dia inteiro ou se mora onde falta energia a cada chuva forte, vale.</p><p class="chat-hint">Existe um meio de caminho: instalar o on-grid agora com um inversor já preparado para receber bateria e acrescentar o armazenamento depois, quando o preço cair mais. Pergunte se o inversor do seu orçamento tem essa possibilidade — alguns têm, outros não, e isso não aparece sozinho na proposta.</p>`,
            relacionados: ['Off-grid, On-grid e Híbrido', 'Falta de Energia', 'Retorno Investimento'],
        },
        'Espaço da Instalação': {
            titulo: 'Quanto espaço preciso',
            palavras: ['espaco', 'area', 'quantos metros', 'metros de telhado', 'tamanho', 'cabe no telhado', 'quantas placas', 'quantos m2', 'area do telhado', 'telhado pequeno', 'quantos paineis', 'peso no telhado', 'laje', 'espaco necessario', 'cabe'],
            resposta: `<p>Um módulo de 550 Wp mede cerca de 2,28 m por 1,13 m, o que dá <strong>2,6 m² por placa</strong>. Os de 580 Wp têm praticamente o mesmo tamanho: entregam mais potência no mesmo espaço.</p> <p>A conta prática muda com o tipo de telhado:<br> <strong>Telhado inclinado</strong> (cerâmica, fibrocimento, metálico) — 6 a 7 m² por kWp. As placas ficam quase coladas, acompanhando a água do telhado.<br> <strong>Laje plana</strong> — 10 a 12 m² por kWp. Aqui as placas sobem em estrutura inclinada e uma fileira sombreia a outra, então é preciso deixar corredor entre elas.</p> <p>Um sistema residencial de <strong>5 kWp são 9 módulos de 550 Wp</strong>: cerca de 24 m² de placa e 30 a 35 m² de telhado livre, contando as bordas. Esse sistema gera de 550 a 700 kWh por mês, dependendo da cidade.</p> <p>Não precisa ser tudo numa água só. Dá para dividir entre faces diferentes, e é comum fazer isso. Cada face com orientação própria pede uma entrada separada no inversor, e isso entra no projeto.</p> <p>Sobre peso: o sistema acrescenta <strong>12 a 15 kg por m²</strong> na área coberta. Telhado em bom estado aguenta sem reforço. Madeiramento antigo ou telha já quebradiça precisa ser avaliado antes. E se o telhado vai ser trocado nos próximos anos, troque primeiro.</p> <p class="chat-hint">Telhado curto não é impedimento: com módulo de maior potência cabe mais kWp no mesmo metro quadrado. Na visita técnica medimos a área útil real, descontando beiral, claraboia e caixa d'água.</p>`,
            relacionados: ['Impacto Posição', 'Componentes Solares', 'Sistema Fotovoltaico'],
        },
        'Falta de Energia': {
            titulo: 'Funciona na falta de luz',
            palavras: ['funciona quando falta', 'quando falta luz', 'falta luz', 'falta energia', 'se faltar luz', 'cai a luz', 'falta de luz', 'falta de energia', 'acabou a luz', 'caiu a luz', 'cai a luz', 'apagao', 'blecaute', 'sem luz', 'sem energia', 'funciona na queda de energia', 'anti ilhamento', 'antiilhamento', 'precisa de bateria', 'bateria', 'nobreak', 'gerador'],
            resposta: `<p><strong>Não. Quando a rede cai, o sistema on-grid desliga junto</strong>, mesmo com sol forte no telhado. Isso é projeto, não defeito, e é a informação que mais pega gente de surpresa depois da instalação.</p> <p>O mecanismo se chama <strong>anti-ilhamento</strong>. O inversor monitora a rede e, ao perceber que ela caiu, se desconecta em até 2 segundos. Se não fizesse isso, continuaria empurrando energia para o cabo da rua — e o eletricista que desligou a linha para consertar o problema encontraria o cabo energizado pela sua casa. A exigência está na <strong>ABNT NBR 16149</strong>, que é quem fixa esses 2 segundos, e o ensaio que comprova a função está na NBR IEC 62116. Sem essa certificação o inversor não entra na lista do INMETRO e a distribuidora não aprova a conexão.</p> <p>Quando a energia volta, o inversor aguarda a tensão estabilizar e religa sozinho. Você não precisa fazer nada.</p> <p>Para ter energia durante a queda existem dois caminhos, os dois mais caros. <strong>Sistema híbrido</strong>, com inversor próprio e bateria, que mantém os circuitos essenciais — geladeira, luz, internet, bomba. Um banco pequeno, de 5 kWh, acrescenta cerca de <strong>60%</strong> ao preço do on-grid; um de 10 kWh pode mais que <strong>dobrar</strong> o projeto. Ou <strong>gerador a combustível</strong>, mais barato de instalar, porém com combustível, ruído e manutenção para sempre.</p> <p>Antes de decidir, pergunte-se quanto tempo a luz costuma faltar no seu endereço. Em rua urbana com poucas quedas curtas por ano, a bateria raramente se paga dentro da vida útil dela. Em área rural, ou com equipamento que não pode parar, a conta muda.</p> <p class="chat-hint">Prefiro que você saiba disso agora, e não na primeira queda de luz depois da instalação. Se o que você quer é justamente não ficar no escuro, o projeto é outro, e vale dizer isso desde o começo.</p>`,
            relacionados: ['Off-grid, On-grid e Híbrido', 'Tipos de Sistemas'],
        },
        'Off-grid, On-grid e Híbrido': {
            titulo: 'Off-grid, on-grid e híbrido',
            palavras: ['off grid', 'offgrid', 'on grid', 'ongrid', 'hibrido', 'bateria', 'baterias', 'sistema isolado', 'sem rede', 'backup', 'nobreak', 'gerador', 'com bateria', 'qual sistema escolher', 'sitio sem luz'],
            resposta: `<p><strong>On-grid</strong> — ligado à rede, sem bateria. A rede faz o papel de bateria: o excedente do meio-dia vira crédito e volta à noite. É o mais barato e o de melhor retorno, e responde pela grande maioria das instalações. Desliga na falta de luz, por exigência de segurança.</p> <p><strong>Off-grid</strong> — isolado, sem rede nenhuma. Além das placas, leva banco de baterias, controlador de carga e geração sobredimensionada para aguentar uma sequência de dias nublados. Custa de duas a três vezes mais por kWh gerado, e não tem compensação de créditos, porque não há rede para injetar.</p> <p><strong>Híbrido</strong> — ligado à rede e com bateria de reserva. Na queda de luz mantém os circuitos essenciais: geladeira, iluminação, internet, bomba d'água. Não é para manter a casa inteira com ar-condicionado e chuveiro elétrico. O preço depende do tamanho do banco: 5 kWh acrescentam cerca de 60% ao on-grid, 10 kWh podem mais que dobrar o projeto.</p> <p>O que decide o custo é a bateria, cobrada por kWh de capacidade. Uma bateria para a geladeira e as luzes de uma noite é um projeto; a casa inteira é outro, várias vezes maior. E a bateria é peça de consumo: as de lítio (LFP) duram de 10 a 15 anos, as de chumbo-ácido de 3 a 5.</p> <p><strong>Para quem é cada um</strong>: on-grid para casa urbana com rede estável, que é a maioria dos casos. Off-grid para sítio onde não chega rede, ou onde estender a rede custa mais que o sistema. Híbrido para quem tem queda de luz com frequência, trabalha de casa, depende de bomba ou de equipamento médico.</p> <p class="chat-hint">Seja honesto com o seu motivo: a bateria não melhora o retorno financeiro, ela compra conforto e segurança. Se o objetivo é só economia na conta, o on-grid se paga mais rápido. Se a falta de luz te custa dinheiro ou sono, aí o híbrido se justifica.</p>`,
            relacionados: ['Falta de Energia', 'Tipos de Sistemas', 'Retorno Investimento'],
        },
        'Clima e Sujeira': {
            titulo: 'Chuva, nuvem e sujeira',
            palavras: ['chuva', 'chove', 'nublado', 'nuvem', 'sujeira', 'sujo', 'poeira', 'clima', 'inverno', 'granizo', 'tempo fechado', 'passaro', 'fezes de passaro', 'calor', 'limpar placa'],
            resposta: `<p><strong>Céu totalmente fechado</strong>: a geração cai para 10% a 25% de um dia de sol. <strong>Nublado parcial</strong>: 50% a 80%. Em nenhum dos casos para, porque o módulo trabalha também com luz difusa, não precisa de sol batendo direto.</p> <p><strong>Chuva</strong> gera pouco, mas lava as placas: é a sua manutenção de graça. O dimensionamento já é feito pela média anual, com os meses bons e os ruins. Entre o melhor e o pior mês do ano a diferença costuma ficar em 20% a 30%.</p> <p><strong>Calor atrapalha</strong>, ao contrário do que parece. O módulo perde de 0,3% a 0,4% de potência por cada grau acima de 25°C na célula, e numa tarde quente a célula passa de 60°C. O melhor dia não é o mais quente: é o de céu limpo com temperatura amena.</p> <p><strong>Poeira</strong> tira de 3% a 6% ao ano na maioria dos casos, e bem mais perto de estrada de terra, obra ou maresia. Há medição no semiárido com 18% de perda depois de 70 dias sem chuva, e um estudo brasileiro com 42 usinas achou cerca de 11% de ganho médio só com a limpeza.</p> <p>Dois casos pontuais:<br> <strong>Fezes de pássaro</strong> — a mancha é opaca, se comporta como sombra dura e pode derrubar um terço do módulo. Chuva não lava, tem de ser removida.<br> <strong>Granizo</strong> — o ensaio obrigatório da norma IEC 61215 joga bolas de gelo de 25 mm a 23 m/s, cerca de 83 km/h, em 11 pontos do módulo. Pedra maior que isso pode quebrar o vidro.</p> <p class="chat-hint">Vale confirmar se o seu seguro residencial cobre o sistema no telhado. Granizo grande e vendaval são os dois eventos que de fato danificam placa, e muita apólice só inclui o equipamento se você avisar.</p>`,
            relacionados: ['Manutenção Sistema', 'Impacto Posição', 'Vida Útil'],
        },
        'Tempo de Payback': {
            titulo: 'Em quanto tempo se paga',
            palavras: ['payback', 'pay back', 'quanto tempo se paga', 'em quanto tempo se paga', 'tempo de retorno', 'prazo de retorno', 'quanto tempo pra pagar', 'quantos anos pra pagar', 'demora quanto pra pagar', 'se paga em quanto tempo', 'prazo', 'quando se paga', 'tempo payback', 'fio b'],
            resposta: `<p>Entre <strong>4 e 7 anos</strong> na maior parte do Brasil. Cinco variaveis explicam quase toda a diferenca dentro dessa faixa.</p> <p><strong>1. Tarifa da concessionaria.</strong> E a maior de todas. Cada kWh gerado vale o que voce deixa de pagar; com referencia de R$ 0,85/kWh, tarifa mais alta encurta o prazo.<br> <strong>2. Irradiacao da sua cidade.</strong> De 4,6 kWh/m2/dia no Sul a 5,9 no Nordeste. O mesmo sistema rende bem mais em Natal que em Florianopolis.<br> <strong>3. Quando voce consome.</strong> Energia usada na hora em que e gerada vale a tarifa cheia. Energia injetada e consumida de noite vale um pouco menos.<br> <strong>4. Telhado.</strong> Face norte e sem sombra e o cenario ideal. Face leste ou oeste perde de 10% a 15%, e quanto mais inclinado o telhado, mais perto dos 15%; sombra de predio ou arvore em parte do dia pesa mais que a orientacao.<br> <strong>5. Forma de pagamento.</strong> À vista encurta. Financiado alonga, e a parcela nem sempre cabe na economia: depende da taxa, do prazo e da entrada. Em boa parte dos casos a parcela começa acima do que você deixa de pagar e só fica abaixo depois de alguns reajustes de tarifa. Peça as duas linhas lado a lado, parcela e economia, mês a mês, antes de assinar.</p> <p>Ha um sexto fator que mudou a conta de todo mundo: o <strong>Fio B</strong>. Pela Lei 14.300/2022, sobre a energia que voce injeta na rede e consome depois incide uma parcela do custo de uso da rede. Em 2026 essa parcela é de <strong>60%</strong>, sobe para 75% em 2027 e 90% em 2028. Para 2029 em diante a lei não fixa percentual: ela remete a uma nova regra de valoração que a ANEEL ainda tem de definir, e a leitura corrente do setor é que a cobrança fique integral. O cronograma vale para quem protocolou a solicitação de acesso depois de 7 de janeiro de 2023, e não congela no ano da instalação: o percentual sobe pelo calendário, não pela data em que você instalou.</p> <p class="chat-hint">Payback calculado sem o Fio B e sem a troca do inversor sai curto demais. Quando receber qualquer proposta, nossa inclusive, peca para ver esses dois itens na planilha.</p>`,
            relacionados: ['Retorno Investimento', 'Impacto Posição', 'Conta Luz'],
        },
        'Créditos por Residência': {
            titulo: 'Créditos em outro imóvel',
            palavras: ['no sitio', 'sitio', 'usar os creditos', 'outra casa', 'chacara', 'segundo imovel', 'credito em outro imovel', 'usar credito em outra casa', 'outro imovel', 'segunda casa', 'outra casa', 'sitio', 'chacara', 'autoconsumo remoto', 'transferir credito', 'dividir credito', 'rateio', 'credito para o sitio', 'mesmo titular', 'duas contas de luz', 'abater conta de outro endereco'],
            resposta: `<p>Dá, e o nome disso é <strong>autoconsumo remoto</strong>. O sistema fica num imóvel e os créditos abatem a conta de outros. Serve bem para quem tem a casa com o telhado bom e o sítio com a bomba, o chuveiro e a conta alta.</p> <p>São três requisitos, e nenhum deles é negociável:</p> <p><strong>Mesmo titular</strong> — a conferência é pelo CPF, ou pela raiz do CNPJ no caso de empresa, o que permite matriz e filiais.<br> <strong>Mesma área de concessão</strong> — todas as unidades na mesma distribuidora. Casa em São Paulo não manda crédito para sítio em Minas.<br> <strong>Cadastro formal</strong> — você entrega à concessionária um formulário dizendo qual porcentagem do excedente vai para cada imóvel.</p> <p>O rateio é em porcentagem e a soma não passa de 100%; o que você não distribuir fica na unidade geradora. Pode ser mudado depois — o formulário novo cancela e substitui o anterior —, mas não é imediato: a distribuidora costuma exigir o pedido com cerca de 30 dias de antecedência, e a mudança passa a valer no ciclo seguinte. Vale revisar quando o consumo muda de lugar: alguém se muda, entra ar-condicionado, chega carro elétrico.</p> <p class="chat-hint">O detalhe que costuma passar batido: cada imóvel ligado à rede paga o seu próprio custo de disponibilidade, de 30 a 100 kWh por mês. Espalhar crédito por cinco contas pequenas multiplica esses mínimos por cinco. Na prática, concentrar o crédito onde o consumo é maior rende mais que dividir em partes iguais.</p>`,
            relacionados: ['Compensação Energia', 'Conta Luz', 'Incentivos Fiscais'],
        },
        'Incentivos Fiscais': {
            titulo: 'Incentivos e isenções',
            palavras: ['incentivo fiscal', 'incentivos', 'isencao', 'isencao de icms', 'icms', 'imposto', 'pis cofins', 'fio b', 'taxacao do sol', 'taxa do sol', 'financiamento', 'financiar energia solar', 'lei 14300 transicao', 'tem incentivo do governo', 'desconto de imposto'],
            resposta: `<p><strong>PIS e Cofins</strong> — alíquota zero sobre a energia compensada, pela Lei 13.169/2015. Essa é federal e vale em todo o país. <strong>ICMS</strong> — depende do estado. O Convênio ICMS 16/2015 autoriza a isenção do imposto sobre a energia compensada em sistemas de até 1 MW, mas autorizar não é obrigar: cada estado precisou aderir, e as adesões vieram em anos diferentes. Em Santa Catarina e no Paraná a isenção era limitada a 48 meses por beneficiário; esse teto caiu com o Convênio ICMS 187/2023.</p> <p><strong>Regra de transição da Lei 14.300</strong> — quem protocolou o pedido de acesso até 7 de janeiro de 2023 ficou com a compensação integral até 31 de dezembro de 2045. Projeto novo entra na cobrança gradual do Fio B.</p> <p><strong>Fio B</strong> — é a parte da tarifa que remunera o fio da rua. A escada da lei é 15% em 2023, 30% em 2024, 45% em 2025, <strong>60% em 2026</strong>, 75% em 2027 e 90% em 2028. Em reais: o Fio B ficava entre R$ 0,15 e R$ 0,39 por kWh conforme a distribuidora, então hoje o abatimento do crédito encolhe algo entre R$ 0,09 e R$ 0,23 por kWh compensado. A energia que a casa usa no mesmo instante em que gera não entra nessa conta — por isso consumir de dia passou a valer mais.</p> <p><strong>Financiamento</strong> — há linhas específicas para energia solar, com carência e prazo longo. Juro e prazo dependem do banco e do seu perfil de crédito, e eu não trabalho com número fixo aqui para não prometer parcela que o banco não vai confirmar.</p> <p class="chat-hint">Isenção de ICMS é decisão estadual e já mudou várias vezes. Antes de assinar, nosso especialista confirma o que vale hoje no seu estado e na sua distribuidora — é a diferença que mais mexe no retorno, mais que a marca da placa.</p>`,
            relacionados: ['Compensação Energia', 'Retorno Investimento', 'Conta Luz'],
        },
        'Impacto Posição': {
            titulo: 'Posição, inclinação e sombra',
            palavras: ['posicao', 'orientacao', 'inclinacao', 'norte', 'sul', 'leste', 'oeste', 'sombra', 'sombreamento', 'arvore', 'caixa dagua', 'face do telhado', 'telhado virado pro sul', 'angulo', 'perde com sombra'],
            resposta: `<p><strong>Face norte</strong> é a referência no Brasil e rende 100% do previsto. Estamos no hemisfério sul, e é para o norte que o sol fica ao longo do ano.</p> <p><strong>Leste ou oeste</strong> perdem de 10% a 15%. Segue muito viável, e há um detalhe a favor do oeste: ele gera mais à tarde, quando a casa costuma estar consumindo. Pela Lei 14.300, com a cobrança do Fio B, energia usada na hora vale mais que energia injetada na rede.</p> <p><strong>Face sul</strong> perde de 20% a 30%, e quanto mais inclinado o telhado, pior. Num telhado quase plano a perda da face sul cai para perto de 10%, porque a inclinação deixa de jogar a placa contra o sol. Dá para compensar com mais placas, se houver área.</p> <p><strong>Inclinação</strong>: a ideal é próxima da latitude da cidade, mas entre 10° e 30° a diferença fica abaixo de 8%. Abaixo de 10° a chuva não escorre direito e a sujeira se acumula, então é telhado que pede limpeza mais frequente.</p> <p><strong>Sombra é o que mais machuca</strong>, por um motivo que não é óbvio: as placas são ligadas em série, e a corrente de toda a série é limitada pela placa mais fraca. Uma antena que sombreia o canto de um módulo pode custar 20% a 30% da geração da série inteira, não só daquele módulo. E a sombra é mais longa em junho, quando o sol passa mais baixo: é nessa época que o estudo de sombreamento tem de ser feito.</p> <p class="chat-hint">Quando a sombra é inevitável — caixa d'água, prédio vizinho, árvore que não vai ser cortada — a saída é microinversor ou otimizador, que isola cada placa. Encarece o equipamento, mas salva o projeto num telhado problemático.</p>`,
            relacionados: ['Espaço da Instalação', 'Clima e Sujeira', 'Tempo de Payback'],
        },
        'Estação de Recarga': {
            titulo: 'Estação de recarga',
            palavras: ['estacao de recarga', 'carregador', 'carregador de carro', 'wallbox', 'wall box', 'walbox', 'carregar carro em casa', 'ponto de recarga', 'instalar carregador', 'quanto tempo carrega', 'carregador na garagem', 'carregador residencial', 'tomada carro eletrico', 'eletroposto em casa'],
            resposta: `<p>É o ponto de recarga do carro elétrico na sua garagem. Há dois caminhos: o cabo que vem com o carro, ligado numa tomada comum, ou o <strong>wallbox</strong>, equipamento fixo na parede com circuito próprio.</p> <p><strong>Potência</strong> — o wallbox residencial mais vendido é o de <strong>7,4 kW</strong>, que puxa 32 A numa única fase. Os de 11 kW e 22 kW existem, mas pedem rede trifásica, e muitos carros limitam a recarga em 7 kW de qualquer forma.</p> <p><strong>Tempo de carga</strong> — as baterias dos elétricos vendidos aqui têm de 40 a 60 kWh. No wallbox de 7,4 kW, a carga cheia leva de <strong>6 a 9 horas</strong>, o que cabe numa noite. Na tomada comum de 220 V e 10 A são só 2,2 kW: a mesma carga leva de 20 a 30 horas. Na rotina você quase nunca carrega de zero — 50 km por dia pedem cerca de 9 kWh, pouco mais de uma hora.</p> <p><strong>O que a instalação exige</strong> — circuito exclusivo, disjuntor dedicado, DR tipo A de 30 mA, DPS e cabo dimensionado pela distância até o quadro. É o que pedem a <strong>NBR 17019</strong> e a NBR 5410, com projeto e ART de profissional habilitado.</p> <p><strong>O detalhe que estoura orçamento</strong> — 32 A de carga contínua é muito para um padrão monofásico comum. Dependendo do seu, o wallbox exige troca do padrão de entrada e pedido de aumento de carga na distribuidora. Equipamento e instalação somam de R$ 4.500 a R$ 9.000 quando o quadro está perto da garagem; com aumento de carga ou percurso longo, passa bem disso.</p> <p class="chat-hint">Se o carro elétrico está nos planos, diga na visita técnica. Dimensionar o solar e a recarga de uma vez sai mais barato que voltar depois para ampliar.</p>`,
            relacionados: ['Recarga Solar', 'O que é eletromobilidade?', 'Benefícios Eletromobilidade'],
        },
        'Recarga Solar': {
            titulo: 'Recarga com energia solar',
            palavras: ['recarga solar', 'carregar com solar', 'carregar o carro com solar', 'carro eletrico solar', 'carregar meu carro', 'quanto gasta carro eletrico', 'km por kwh', 'quantos kwp para o carro', 'placa para carregar carro', 'consumo carro eletrico', 'carregar de graca', 'abastecer com sol', 'custo por km eletrico', 'energia solar carro eletrico'],
            resposta: `<p><strong>Quanto o carro consome</strong> — entre 4 e 7 km por kWh, conforme o modelo e o trânsito. Um compacto faz perto de 6; um SUV elétrico, perto de 4. A 6 km por kWh, 1.000 km por mês são 170 kWh na bateria — e de 185 a 195 kWh no medidor, porque a recarga em corrente alternada perde de 10% a 15% no caminho.</p> <p><strong>Quanto custaria na rede</strong> — esses 190 kWh na tarifa de R$ 0,85 dão cerca de <strong>R$ 160 por mês</strong>. Por quilômetro, de R$ 0,14 a R$ 0,24 já contando a perda, contra R$ 0,50 a R$ 0,65 de um carro a gasolina.</p> <p><strong>Quantos kWp a mais</strong> — cada kWp instalado gera de 110 kWh por mês em Santa Catarina a 140 kWh no Rio Grande do Norte. Para esses 1.000 km mensais, são de <strong>1,4 a 1,8 kWp</strong> somados ao projeto: três ou quatro módulos de 550 Wp. Um SUV elétrico com a mesma rodagem pede de 2,0 a 2,6 kWp.</p> <p><strong>A ressalva honesta</strong> — carregando de madrugada, a energia volta da rede como crédito, e crédito paga parcela do Fio B: <strong>60% dele em 2026</strong>, para quem protocolou a solicitação de acesso depois de 7 de janeiro de 2023. Não sai de graça, sai por algo entre R$ 0,10 e R$ 0,20 por kWh, conforme a distribuidora.</p> <p>Carregar durante o dia, com sol na placa, é autoconsumo direto e não passa por essa conta. Quem trabalha em casa, ou deixa o carro na garagem à tarde, aproveita isso de verdade.</p> <p class="chat-hint">Se o carro elétrico vem só no ano que vem, vale dizer agora. Inversor e padrão de entrada se dimensionam uma vez; ampliar depois custa mais que incluir junto.</p>`,
            relacionados: ['Estação de Recarga', 'Benefícios Eletromobilidade', 'Retorno Investimento'],
        },
        'O que é eletromobilidade?': {
            titulo: 'O que é eletromobilidade',
            palavras: ['eletromobilidade', 'eletro mobilidade', 'o que e eletromobilidade', 'carro eletrico', 'veiculo eletrico', 'carro a bateria', 'hibrido', 'hibrido plug in', 'mobilidade eletrica', 'carro sem gasolina', 'bev', 'phev', 'motor eletrico'],
            resposta: `<p>É o transporte movido a eletricidade no lugar de combustível: carros, motos, ônibus e utilitários elétricos, mais a infraestrutura de recarga que os sustenta.</p> <p>Vale separar três categorias que se misturam na conversa. <strong>Elétrico puro</strong> só anda com bateria e precisa de tomada. <strong>Híbrido plug-in</strong> tem motor a combustão e também carrega na tomada. <strong>Híbrido comum</strong> não se liga em tomada nenhuma, e não muda sua conta de luz — se é esse o carro, recarga não entra no projeto.</p> <p>A ligação com a energia solar é de custo, antes de ser ambiental. O elétrico tira a despesa da bomba de combustível e a joga na conta de luz: de cerca de R$ 0,55 por quilômetro para algo perto de R$ 0,16. Continua sendo conta todo mês, e sobe quando a tarifa sobe.</p> <p>Gerando no próprio telhado, esse gasto deixa de ser mensalidade e passa a sair de um investimento que você já fez. É a diferença entre trocar de fornecedor e virar o fornecedor.</p> <p>No lado ambiental, a matriz elétrica brasileira já é mais de 80% renovável, então o carro elétrico aqui nasce mais limpo que em país movido a carvão. O telhado solar fecha o ciclo.</p> <p class="chat-hint">A consequência prática: a hora de pensar no ponto de recarga é enquanto o projeto do telhado está na mesa, não depois de instalado.</p>`,
            relacionados: ['Benefícios Eletromobilidade', 'Recarga Solar', 'Estação de Recarga'],
        },
        'Benefícios Eletromobilidade': {
            titulo: 'Benefícios do carro elétrico',
            palavras: ['beneficio carro eletrico', 'vantagem carro eletrico', 'vale a pena carro eletrico', 'economia carro eletrico', 'ipva carro eletrico', 'isencao ipva eletrico', 'manutencao carro eletrico', 'custo por km', 'carro eletrico compensa', 'quanto economiza carro eletrico', 'desvantagem carro eletrico', 'preco carro eletrico', 'bateria carro eletrico garantia', 'carro eletrico e caro'],
            resposta: `<p><strong>Custo por quilômetro</strong> — gasolina a R$ 6,50 o litro, num carro que faz de 10 a 13 km/l, dá de R$ 0,50 a R$ 0,65 por km. O elétrico na tarifa de R$ 0,85 fica entre R$ 0,14 e R$ 0,24. Comparando carros equivalentes, de duas a quatro vezes menos: um compacto elétrico contra um compacto a gasolina fica perto de três vezes; um SUV elétrico contra um carro econômico, perto de duas.</p> <p><strong>Manutenção</strong> — sem troca de óleo, filtro, vela, correia ou embreagem. A frenagem regenerativa poupa as pastilhas, que duram muito mais. Em troca, o pneu gasta mais rápido, por causa do peso e do torque, e em algumas marcas a rede de oficinas é curta: um reparo fora do comum pode esperar semanas por peça.</p> <p><strong>IPVA</strong> — varia muito por estado. Rio Grande do Norte, Rio Grande do Sul, Pernambuco, Paraíba e o Distrito Federal isentam o elétrico puro. O Rio de Janeiro cobra 0,5% contra 4% de um flex. São Paulo cobra normalmente. Confira o seu antes de contar com o desconto.</p> <p><strong>O lado ruim</strong> — o elétrico ainda custa mais que o equivalente a combustão: a diferença hoje fica entre R$ 20 mil e R$ 60 mil. Com economia de cerca de R$ 0,40 por km, são de 50 mil a 150 mil km rodados para empatar. E a bateria, com garantia de 8 anos na maioria das marcas, é o que mais pesa na revenda.</p> <p><strong>Somando energia solar</strong> — o custo por km cai para a parcela de rede que sobra, uns poucos centavos, e para de acompanhar o preço da bomba. Com o sistema dimensionado para a casa mais o carro, a rodagem passa a sair do telhado.</p> <p class="chat-hint">O elétrico compensa com rodagem. A R$ 0,40 de economia por km, quem faz 2.000 km por mês empata entre dois e seis anos, conforme a diferença de preço ter sido de R$ 20 mil ou de R$ 60 mil. Quem faz 500 km por mês leva mais de oito anos — mais que a garantia da bateria — e está comprando conforto, não economia.</p>`,
            relacionados: ['Recarga Solar', 'Estação de Recarga', 'O que é eletromobilidade?'],
        },
    };

    // Normaliza para comparar: sem acento, minusculo, sem pontuacao. Quem
    // digita no chat escreve "nao", "ENERGIA SOLAR?" e "fotovoltáico" — tudo
    // isso precisa cair no mesmo lugar.
    const normalizar = (t) => (t || '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Procura o topico que melhor responde a uma pergunta escrita a mao.
    // Pontua por palavra-chave encontrada, dando peso maior as expressoes
    // longas: "falta de energia" vale mais que "energia" sozinha, senao
    // quase tudo cairia no topico generico.
    const acharDuvida = (texto) => {
        const alvo = normalizar(texto);
        if (alvo.length < 3) return null;

        let melhor = null, melhorNota = 0;
        for (const [chave, item] of Object.entries(BASE_DUVIDAS)) {
            let nota = 0;
            for (const palavra of item.palavras) {
                const p = normalizar(palavra);
                if (alvo.includes(p)) nota += p.split(' ').length * 2 + p.length / 10;
            }
            // O proprio nome do topico tambem conta.
            if (alvo.includes(normalizar(chave))) nota += 6;
            if (nota > melhorNota) { melhorNota = nota; melhor = chave; }
        }
        // 2,5 deixa passar uma palavra unica e especifica ("limpar",
        // "nublado", "payback"), que vale 2 + o comprimento dela / 10, e
        // ainda barra o acerto por coincidencia. Abaixo disso, responder
        // errado e pior do que admitir que nao entendeu.
        return melhorNota >= 2.5 ? melhor : null;
    };

    // Responde um topico da base, com os relacionados como proximo passo.
    const responderDuvida = (chave) => {
        const item = BASE_DUVIDAS[chave];
        if (!item) return false;

        setTimeout(() => {
            const relacionados = (item.relacionados || [])
                .filter(r => BASE_DUVIDAS[r])
                .map(r => `<button class="dynamic-button" data-topic="${r}">${BASE_DUVIDAS[r].titulo}</button>`)
                .join('');

            const container = addBotMessage(`
                ${item.resposta}
                <p class="chat-hint" style="margin-top:10px">Quer saber mais sobre:</p>
                <div class="dynamic-buttons-container">
                    ${relacionados}
                    <button class="dynamic-button" data-duvida-acao="simular">${icone('economia')}<span>Calcular minha economia</span></button>
                </div>
            `);

            // Os relacionados continuam respondendo da base; o botao de
            // simular entra no funil.
            container.querySelectorAll('[data-topic]').forEach(b => {
                b.addEventListener('click', () => {
                    addUserMessage(BASE_DUVIDAS[b.dataset.topic].titulo);
                    responderDuvida(b.dataset.topic);
                });
            });
            container.querySelector('[data-duvida-acao="simular"]')?.addEventListener('click', () => {
                addUserMessage('Quero calcular minha economia');
                startQualificationFunnel();
            });
        }, 420);

        return true;
    };

    // Quando nao da para responder: nao inventa. Oferece os caminhos que
    // funcionam de verdade — o funil, a lista de duvidas e o WhatsApp.
    const naoEntendi = (texto) => {
        setTimeout(() => {
            const container = addBotMessage(`
                <p>Não encontrei uma resposta pronta para isso.</p>
                <p class="chat-hint">Posso ajudar de outras formas:</p>
                <div class="dynamic-buttons-container">
                    <button class="dynamic-button" data-nao-acao="simular">${icone('economia')}<span>Calcular minha economia</span></button>
                    <button class="dynamic-button" data-nao-acao="duvidas">${icone('duvida')}<span>Ver todas as dúvidas</span></button>
                    <button class="dynamic-button" data-nao-acao="whatsapp">${icone('conversa')}<span>Falar com a equipe</span></button>
                </div>
            `);
            container.querySelector('[data-nao-acao="simular"]')?.addEventListener('click', () => {
                addUserMessage('Quero calcular minha economia');
                startQualificationFunnel();
            });
            container.querySelector('[data-nao-acao="duvidas"]')?.addEventListener('click', () => {
                addUserMessage('Ver todas as dúvidas');
                showDoubtTopics();
            });
            container.querySelector('[data-nao-acao="whatsapp"]')?.addEventListener('click', () => {
                window.open('https://wa.me/4901799044322', '_blank');
            });
        }, 420);
    };

    const showDoubtTopics = () => {
        const botFollowUpContainer = document.createElement('div');
        botFollowUpContainer.className = 'message-container bot-message';
        botFollowUpContainer.innerHTML = `
            ${botAvatarHTML}
            <div class="message-content">
                <div class="chat-bubble bot-bubble">
                    <p>Sobre qual tópico você tem dúvidas? Escolha uma opção abaixo:</p>
                    <div class="dynamic-buttons-container">
                        <button class="dynamic-button" data-topic="Energia Solar">Energia Solar</button>
                        <button class="dynamic-button" data-topic="Sistema Fotovoltaico">Sistema Fotovoltaico</button>
                        <button class="dynamic-button" data-topic="Componentes Solares">Componentes Solares</button>
                        <button class="dynamic-button" data-topic="Benefícios Solares">Benefícios Solares</button>
                        <button class="dynamic-button" data-topic="Vida Útil">Vida Útil</button>
                        <button class="dynamic-button" data-topic="Retorno Investimento">Retorno Investimento</button>
                        <button class="dynamic-button" data-topic="Conta Luz">Conta Luz</button>
                        <button class="dynamic-button" data-topic="Manutenção Sistema">Manutenção Sistema</button>
                        <button class="dynamic-button" data-topic="Compensação Energia">Compensação Energia</button>
                        <button class="dynamic-button" data-topic="Tipos de Sistemas">Tipos de Sistemas</button>
                        <button class="dynamic-button" data-topic="Espaço da Instalação">Espaço da Instalação</button>
                        <button class="dynamic-button" data-topic="Falta de Energia">Falta de Energia</button>
                        <button class="dynamic-button" data-topic="Off-grid, On-grid e Híbrido">Off-grid e Híbrido</button>
                        <button class="dynamic-button" data-topic="Clima e Sujeira">Clima e Sujeira</button>
                        <button class="dynamic-button" data-topic="Tempo de Payback">Tempo de Payback</button>
                        <button class="dynamic-button" data-topic="Créditos por Residência">Créditos por Residência</button>
                        <button class="dynamic-button" data-topic="Incentivos Fiscais">Incentivos Fiscais</button>
                        <button class="dynamic-button" data-topic="Impacto Posição">Impacto Posição</button>
                        <button class="dynamic-button" data-topic="Estação de Recarga">Estação de Recarga</button>
                        <button class="dynamic-button" data-topic="Recarga Solar">Recarga Solar</button>
                        <button class="dynamic-button" data-topic="O que é eletromobilidade?">O que é eletromobilidade?</button>
                        <button class="dynamic-button" data-topic="Benefícios Eletromobilidade">Benefícios Eletromobilidade</button>
                    </div>
                </div>
                <span class="timestamp">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
        messagesContainer.appendChild(botFollowUpContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Responde da base local. Antes isto chamava submitMessage, que
        // mandava a pergunta para um servico externo: com o servico fora do
        // ar, os 22 topicos pararam todos de funcionar de uma vez.
        botFollowUpContainer.querySelectorAll('.dynamic-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const topico = btn.dataset.topic;
                addUserMessage(BASE_DUVIDAS[topico] ? BASE_DUVIDAS[topico].titulo : topico);
                if (!responderDuvida(topico)) naoEntendi(topico);
            });
        });
    };

    // Qualification funnel functions
    const startQualificationFunnel = () => {
        qualificationStep = 1;
        askEmail();
    };

    // Step 1: Ask for email
    const askEmail = () => {
        const emailImage = 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=500';

        setTimeout(() => {
            addBotMessage(`
                <p>Ótimo. Vou fazer cinco perguntas rápidas para entender seu caso.</p>
                <p><strong>Primeiro, qual é o seu e-mail?</strong></p>
                <p class="chat-hint">${icone('setaBaixo', 13)} Digite seu e-mail no campo abaixo</p>
            `, true, emailImage);

            esperarTexto("exemplo@email.com");
        }, 500);
    };

    // Cada passo declara o que espera na caixa de entrada. Antes o placeholder
    // so era devolvido ao normal dentro do clique do botao do passo SEGUINTE,
    // entao o exemplo de telefone continuava na tela durante a pergunta de
    // quantas pessoas moram na casa — e se lia como o que o bot estava pedindo.
    const esperarTexto = (exemplo) => {
        modoTelefone = false;
        messageTextarea.placeholder = exemplo || "Digite aqui...";
        messageTextarea.disabled = false;
        messageTextarea.focus();
    };

    // Passo de botoes: nao ha o que digitar. A caixa volta ao estado neutro
    // para nao sugerir uma resposta que o passo nem aceita.
    const esperarBotao = () => {
        modoTelefone = false;
        messageTextarea.placeholder = "Escolha uma opção acima";
        messageTextarea.value = '';
    };

    // =================================================================
    // LEITURA SOLAR — recalcula a cada resposta
    // =================================================================
    // Tarifa media residencial no Brasil. Fica como constante nomeada
    // porque e a unica premissa economica do calculo: quando mudar, muda
    // aqui e em lugar nenhum mais.
    const TARIFA_KWH = 0.85;
    // Um sistema bem dimensionado cobre ate ~95% da conta; o resto e
    // custo de disponibilidade, que a concessionaria cobra de todo jeito.
    const COBERTURA = 0.95;

    const leituraEl = () => widgetRoot.querySelector('.leitura-solar');

    // Converte a faixa escolhida ("250-400 kWh", "Ate 150 kWh",
    // "Acima de 800 kWh") no ponto medio, que e a melhor estimativa
    // pontual que uma faixa permite. Para "acima de X" usa X * 1,25:
    // chutar o proprio X subestimaria sempre.
    const kwhDaFaixa = (faixa) => {
        if (!faixa) return null;
        const nums = (faixa.match(/\d+/g) || []).map(Number);
        if (!nums.length) return null;
        if (/acima/i.test(faixa)) return Math.round(nums[0] * 1.25);
        if (/at[ée]/i.test(faixa)) return Math.round(nums[0] * 0.7);
        if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
        return nums[0];
    };

    const moeda = (v) => v.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL', maximumFractionDigits: 0
    });

    // Escreve so quando o valor muda, e pulsa para a pessoa perceber que
    // foi a resposta dela que mexeu no numero.
    const escreverLeitura = (chave, texto) => {
        const el = widgetRoot.querySelector(`[data-leitura="${chave}"]`);
        if (!el || el.textContent === texto) return;
        el.textContent = texto;
        el.classList.remove('mudou');
        void el.offsetWidth;   // reinicia a animacao
        el.classList.add('mudou');
    };

    const atualizarLeitura = () => {
        const painel = leituraEl();
        if (!painel) return;

        const d = qualificationData;
        const preenchidos = ['email', 'phone', 'familySize', 'kwhConsumption', 'roofType']
            .filter(k => d[k]).length;

        painel.classList.add('ativa');
        calibrarArco();
        painel.style.setProperty('--progresso', (preenchidos / 5).toFixed(3));
        posicionarSol();
        escreverLeitura('etapa', `${preenchidos} de 5`);

        const kwh = kwhDaFaixa(d.kwhConsumption);
        if (kwh) {
            escreverLeitura('consumo', `${kwh.toLocaleString('pt-BR')} kWh`);
            escreverLeitura('economia', `${moeda(kwh * TARIFA_KWH * COBERTURA)}/mês`);
        } else if (d.familySize) {
            // Antes do consumo, a casa ja diz muito: da para mostrar uma
            // faixa em vez de um travessao mudo.
            const porPessoas = { '1-2 pessoas': 180, '3-4 pessoas': 320, '5-6 pessoas': 520 };
            const est = porPessoas[d.familySize] || 800;
            escreverLeitura('consumo', `~${est} kWh`);
            escreverLeitura('economia', `~${moeda(est * TARIFA_KWH * COBERTURA)}/mês`);
        }
    };

    const fecharLeitura = () => {
        const painel = leituraEl();
        if (painel) painel.classList.remove('ativa');
    };

    // Calibra o arco com a geometria REAL, nao com numero chutado: o SVG
    // escala com a largura do widget, entao o raio em pixels muda com ela.
    // Sem isto o sol descola da linha em telas diferentes.
    const calibrarArco = () => {
        const painel = leituraEl();
        if (!painel) return;
        const caminho = painel.querySelector('.leitura-percorrido');
        const svg = painel.querySelector('.leitura-arco');
        if (!caminho || !svg) return;

        // Comprimento do traco, para o stroke-dashoffset desenhar o arco.
        try {
            painel.style.setProperty('--arco-comprimento', caminho.getTotalLength().toFixed(1));
        } catch (e) { /* getTotalLength indisponivel: o dasharray padrao serve */ }

        // Escala do viewBox (240 de largura) para os pixels reais. O sol
        // usa isto para converter o ponto do tracado em posicao na tela.
        const largura = svg.getBoundingClientRect().width;
        if (largura > 0) painel.dataset.escala = (largura / 240).toFixed(4);

        posicionarSol();
    };

    // Coloca o sol sobre o tracado, no ponto correspondente ao progresso.
    const posicionarSol = () => {
        const painel = leituraEl();
        if (!painel) return;
        const caminho = painel.querySelector('.leitura-percorrido');
        if (!caminho || !caminho.getPointAtLength) return;

        const escala = parseFloat(painel.dataset.escala || '1');
        const prog = parseFloat(getComputedStyle(painel).getPropertyValue('--progresso')) || 0;

        try {
            const pt = caminho.getPointAtLength(caminho.getTotalLength() * prog);
            painel.style.setProperty('--sol-x', (pt.x * escala).toFixed(1) + 'px');
            painel.style.setProperty('--sol-y', (pt.y * escala).toFixed(1) + 'px');
        } catch (e) { /* SVG nao medivel: o sol fica no inicio, sem quebrar nada */ }
    };

    // Recalibra quando a janela muda de tamanho: o widget e responsivo.
    window.addEventListener('resize', calibrarArco);

    // Step 2: Ask for phone
    const askPhone = () => {
        const phoneImage = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500';

        setTimeout(() => {
            addBotMessage(`
                <p>Perfeito! Agora me informe seu telefone com DDD.</p>
                <p><strong>Qual é o seu telefone?</strong></p>
                <p class="chat-hint">Pode digitar do jeito que preferir — eu formato para você.</p>
            `, true, phoneImage);

            esperarTexto("(11) 91234-5678");
            modoTelefone = true;
        }, 500);
    };

    // Step 3: Ask for family size
    const askFamilySize = () => {
        const familyImage = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500';

        setTimeout(() => {
            const messageContainer = addBotMessage(`
                <p><strong>Quantas pessoas moram na sua casa?</strong></p>
                <div class="dynamic-buttons-container">
                    <button class="dynamic-button" data-family="1-2 pessoas">1-2 pessoas</button>
                    <button class="dynamic-button" data-family="3-4 pessoas">3-4 pessoas</button>
                    <button class="dynamic-button" data-family="5-6 pessoas">5-6 pessoas</button>
                    <button class="dynamic-button" data-family="Mais de 6 pessoas">Mais de 6 pessoas</button>
                </div>
            `, true, familyImage);

            // A caixa de entrada volta ao estado neutro assim que a pergunta
            // aparece, nao depois do clique: era isso que deixava o exemplo de
            // telefone preso na tela durante a pergunta seguinte.
            esperarBotao();

            messageContainer.querySelectorAll('.dynamic-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    qualificationData.familySize = btn.dataset.family;
                    atualizarLeitura();
                    addUserMessage(btn.dataset.family);
                    askKwhConsumption();
                });
            });
        }, 500);
    };

    // Step 4: Ask for kWh consumption based on family size
    const askKwhConsumption = () => {
        const energyBillImage = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=500';

        // Determine kWh ranges based on family size
        let kwhOptions = [];
        if (qualificationData.familySize === '1-2 pessoas') {
            kwhOptions = [
                { label: 'Até 150 kWh/mês', value: 'Até 150 kWh' },
                { label: '150-250 kWh/mês', value: '150-250 kWh' },
                { label: '250-350 kWh/mês', value: '250-350 kWh' },
                { label: 'Acima de 350 kWh/mês', value: 'Acima de 350 kWh' }
            ];
        } else if (qualificationData.familySize === '3-4 pessoas') {
            kwhOptions = [
                { label: 'Até 250 kWh/mês', value: 'Até 250 kWh' },
                { label: '250-400 kWh/mês', value: '250-400 kWh' },
                { label: '400-550 kWh/mês', value: '400-550 kWh' },
                { label: 'Acima de 550 kWh/mês', value: 'Acima de 550 kWh' }
            ];
        } else if (qualificationData.familySize === '5-6 pessoas') {
            kwhOptions = [
                { label: 'Até 400 kWh/mês', value: 'Até 400 kWh' },
                { label: '400-600 kWh/mês', value: '400-600 kWh' },
                { label: '600-800 kWh/mês', value: '600-800 kWh' },
                { label: 'Acima de 800 kWh/mês', value: 'Acima de 800 kWh' }
            ];
        } else {
            kwhOptions = [
                { label: 'Até 600 kWh/mês', value: 'Até 600 kWh' },
                { label: '600-900 kWh/mês', value: '600-900 kWh' },
                { label: '900-1200 kWh/mês', value: '900-1200 kWh' },
                { label: 'Acima de 1200 kWh/mês', value: 'Acima de 1200 kWh' }
            ];
        }

        setTimeout(() => {
            const buttonHTML = kwhOptions.map(opt =>
                `<button class="dynamic-button" data-kwh="${opt.value}">${opt.label}</button>`
            ).join('');

            const messageContainer = addBotMessage(`
                <p><strong>Qual é o consumo mensal de energia elétrica da sua casa?</strong></p>
                <p class="chat-hint">Você pode verificar essa informação na sua conta de luz (em kWh)</p>
                <div class="dynamic-buttons-container">
                    ${buttonHTML}
                </div>
            `, true, energyBillImage);

            // A caixa de entrada volta ao estado neutro assim que a pergunta
            // aparece, nao depois do clique: era isso que deixava o exemplo de
            // telefone preso na tela durante a pergunta seguinte.
            esperarBotao();

            messageContainer.querySelectorAll('.dynamic-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    qualificationData.kwhConsumption = btn.dataset.kwh;
                    atualizarLeitura();
                    addUserMessage(btn.dataset.kwh);
                    askRoofType();
                });
            });
        }, 500);
    };

    // Step 5: Ask for roof type
    const askRoofType = () => {
        const roofTypesImage = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500';

        setTimeout(() => {
            const messageContainer = addBotMessage(`
                <p><strong>Que tipo de telhado você tem?</strong></p>
                <p class="chat-hint">Escolha o tipo mais próximo do seu:</p>
                <div class="dynamic-buttons-container">
                    <button class="dynamic-button" data-roof="Cerâmica/Telha">${icone('telhaCeramica')}<span>Cerâmica ou telha</span></button>
                    <button class="dynamic-button" data-roof="Fibrocimento">${icone('fibrocimento')}<span>Fibrocimento</span></button>
                    <button class="dynamic-button" data-roof="Metálico">${icone('metalico')}<span>Metálico</span></button>
                    <button class="dynamic-button" data-roof="Laje">${icone('laje')}<span>Laje</span></button>
                    <button class="dynamic-button" data-roof="Não sei">${icone('duvida')}<span>Não sei dizer</span></button>
                </div>
            `, true, roofTypesImage);

            // A caixa de entrada volta ao estado neutro assim que a pergunta
            // aparece, nao depois do clique: era isso que deixava o exemplo de
            // telefone preso na tela durante a pergunta seguinte.
            esperarBotao();

            messageContainer.querySelectorAll('.dynamic-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    qualificationData.roofType = btn.dataset.roof;
                    atualizarLeitura();
                    addUserMessage(btn.dataset.roof);
                    showQualificationResult();
                });
            });
        }, 500);
    };

    // Step 6: Show result and save to Supabase
    const showQualificationResult = async () => {
        const savingsImage = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500';

        // Funil encerrado: a caixa volta a aceitar conversa livre. Sem isto ela
        // seguiria pedindo "Escolha uma opcao acima" sem haver opcao na tela.
        qualificationStep = 0;
        esperarTexto();
        // O resultado completo entra na conversa logo abaixo: manter o
        // painel seria repetir a mesma informacao ocupando espaco.
        fecharLeitura();

        // Save to Supabase
        const saved = await saveLeadToSupabase(qualificationData);

        setTimeout(() => {
            const messageContainer = document.createElement('div');
            messageContainer.className = 'message-container bot-message';
            messageContainer.innerHTML = `
                ${botAvatarHTML}
                <div class="message-content">
                    <div class="chat-bubble bot-bubble">
                        <img src="${savingsImage}" class="solar-panel-image" style="width: 100%;" alt="Economia">
                        <p><strong>Pronto. Com base no que você informou:</strong></p>
                        <p>${icone('correio', 14)} E-mail: ${qualificationData.email}<br>
                        ${icone('telefone', 14)} Telefone: <span class="chat-figure">${qualificationData.phone}</span><br>
                        ${icone('pessoas', 14)} Pessoas na casa: <span class="chat-figure">${qualificationData.familySize}</span><br>
                        ${icone('raio', 14)} Consumo mensal: <span class="chat-figure">${qualificationData.kwhConsumption}</span><br>
                        ${icone('casa', 14)} Tipo de telhado: ${qualificationData.roofType}</p>
                        <p>${icone('economia', 14)} <strong>Você tem potencial de reduzir até <span class="chat-figure-strong">90%</span> do valor da sua conta de luz!</strong></p>
                        <p>A energia solar é perfeita para seu perfil de consumo. Com um sistema fotovoltaico adequado, você pode economizar milhares de reais por ano e ainda valorizar seu imóvel.</p>
                        <p><strong>Próximo passo:</strong> Agende uma conversa com nosso especialista para fazer uma análise detalhada e personalizada do seu caso!</p>
                        <div class="action-buttons-container" style="margin-top: 15px;">
                            <button class="action-button green-button schedule-btn">${icone('agenda')}<span>Agendar conversa</span></button>
                        </div>
                    </div>
                    <span class="timestamp">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `;

            messagesContainer.appendChild(messageContainer);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Add event listener to the schedule button
            const scheduleBtn = messageContainer.querySelector('.schedule-btn');
            scheduleBtn.addEventListener('click', () => {
                scheduleBtn.disabled = true;
                // Opacidade apagaria o texto; o estado vira rotulo legivel e
                // a borda tracejada do CSS carrega o resto do recado.
                scheduleBtn.innerHTML = icone('confirma') + '<span>Agendamento aberto</span>';

                setTimeout(() => {
                    addBotMessage(`
                        <p>${icone('agenda')} <strong>Escolha o melhor horário para você:</strong></p>
                    `);
                    addCalendarToChat();
                }, 500);
            });
        }, 500);
    };

    // Main function to start the chat and display the initial message
    const startChat = () => {
        conversationId = createSessionId();

        const welcomeContainer = document.createElement('div');
        welcomeContainer.className = 'message-container bot-message';
        welcomeContainer.innerHTML = `
            ${botAvatarHTML}
            <div class="message-content">
                <div class="chat-bubble bot-bubble">
                    <p>Olá. Sou o assistente da Sunbotic, especializado em energia solar. Como posso te ajudar hoje?</p>
                    <div class="action-buttons-container">
                        <button class="action-button blue-button" data-action="Qualificar">Quero economizar na luz</button>
                        <button class="action-button green-button" data-action="Agendamento">Agendar reunião</button>
                        <button class="action-button orange-button" data-action="Ticket">Falar com alguém</button>
                        <button class="action-button yellow-button" data-action="Dúvida">Tenho dúvidas</button>
                    </div>
                </div>
                <span class="timestamp">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
        messagesContainer.appendChild(welcomeContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add event listeners to the initial action buttons
        welcomeContainer.querySelectorAll('.action-button').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                if (action === 'Qualificar') {
                    addUserMessage('Quero economizar na luz');
                    startQualificationFunnel();
                } else if (action === 'Dúvida') {
                    addUserMessage('Tenho dúvidas');
                    showDoubtTopics();
                } else if (action === 'Agendamento') {
                    addUserMessage('Agendar reunião');
                    addCalendarToChat();
                } else if (action === 'Ticket') {
                    addUserMessage('Falar com alguém');
                    setTimeout(() => {
                        addBotMessage(`
                            <p>${icone('conversa')} Perfeito. Você será levado ao nosso WhatsApp.</p>
                            <p>Nossa equipe está pronta para te atender!</p>
                        `);
                        setTimeout(() => {
                            window.open('https://wa.me/4901799044322', '_blank');
                        }, 1000);
                    }, 500);
                }
            });
        });
    };

    // Function to handle sending a message (user or internal)
    async function submitMessage(messageText, isInternal = false) {
        if (isWaitingForResponse && !isInternal) return;

        const trimmedMessage = messageText.trim();
        if (!trimmedMessage) return;

        // Handle qualification funnel input
        if (qualificationStep === 1 && !qualificationData.email) {
            // Validating email
            if (!validateEmail(trimmedMessage)) {
                addUserMessage(trimmedMessage);
                setTimeout(() => {
                    addBotMessage(`
                        <p>${icone('alerta')} Esse e-mail não parece válido. Confira e tente de novo.</p>
                        <p class="chat-hint">Exemplo: seunome@email.com</p>
                    `);
                }, 300);
                messageTextarea.value = '';
                return;
            }
            qualificationData.email = trimmedMessage;
            atualizarLeitura();
            addUserMessage(trimmedMessage);
            messageTextarea.value = '';
            askPhone();
            return;
        }

        if (qualificationStep === 1 && qualificationData.email && !qualificationData.phone) {
            // Validating phone
            if (!validatePhone(trimmedMessage)) {
                addUserMessage(trimmedMessage);
                setTimeout(() => {
                    const digitados = soDigitos(trimmedMessage).length;
                    const motivo = digitados < 10
                        ? 'Faltam dígitos — preciso do DDD mais o número.'
                        : digitados > 11
                            ? 'Vieram dígitos a mais. Confira o número.'
                            : 'Esse número não parece válido. Confira o DDD.';
                    addBotMessage(`
                        <p>Hmm, ${motivo}</p>
                        <p class="chat-hint">Pode digitar do jeito que preferir: 11912345678, (11) 91234-5678 ou 11 91234 5678.</p>
                    `);
                }, 300);
                messageTextarea.value = '';
                return;
            }
            // Guarda normalizado: o CRM recebe sempre "(11) 91234-5678",
            // independente de como foi digitado.
            qualificationData.phone = formatarTelefone(trimmedMessage);
            atualizarLeitura();
            addUserMessage(qualificationData.phone);
            messageTextarea.value = '';
            askFamilySize();
            return;
        }

        // Display user message bubble (only if not in funnel)
        if (!isInternal) {
            const userMessageContainer = document.createElement('div');
            userMessageContainer.className = 'message-container user-message';

            userMessageContainer.innerHTML = `
                <div class="message-content">
                    <div class="chat-bubble user-bubble">
                        <p>${renderImages(trimmedMessage)}</p>
                    </div>
                    <span class="timestamp">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `;
            messagesContainer.appendChild(userMessageContainer);

            messageTextarea.value = '';
            autoResizeTextarea();
        }

        // Show typing indicator and scroll down
        let typingIndicator;
        if (!isInternal) {
            isWaitingForResponse = true;
            typingIndicator = createTypingIndicator();
            messagesContainer.appendChild(typingIndicator);
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Sem servico de conversa configurado, a base local e a unica fonte
        // de resposta — e, mesmo com servico, responder do que ja esta aqui e
        // instantaneo e nao pode falhar. So o que a base nao cobre vai para a
        // rede.
        const daBase = acharDuvida(trimmedMessage);
        if (daBase) {
            if (typingIndicator && typingIndicator.parentNode) {
                messagesContainer.removeChild(typingIndicator);
            }
            isWaitingForResponse = false;
            responderDuvida(daBase);
            return;
        }

        if (!settings.webhook.url) {
            if (typingIndicator && typingIndicator.parentNode) {
                messagesContainer.removeChild(typingIndicator);
            }
            isWaitingForResponse = false;
            naoEntendi(trimmedMessage);
            return;
        }

        // Prepare data for webhook
        const formData = new FormData();
        formData.append('action', 'sendMessage');
        formData.append('sessionId', conversationId);
        formData.append('route', settings.webhook.route);
        formData.append('chatInput', trimmedMessage);

        try {
            if (!settings.webhook.url) {
                throw new Error('SEM_WEBHOOK');
            }

            const response = await fetch(settings.webhook.url, {
                method: 'POST',
                body: formData
            });

            // Sem esta checagem, um 404 ou 500 do n8n caia direto no .json()
            // e o usuario via um erro de parse em vez do problema real.
            if (!response.ok) {
                throw new Error(`HTTP_${response.status}`);
            }

            // O n8n as vezes devolve 200 com corpo vazio ou com uma pagina de
            // erro em HTML; .json() estoura nos dois casos com uma mensagem
            // que nao ajuda ninguem a descobrir o que houve.
            const corpo = await response.text();
            let responseData;
            try {
                responseData = JSON.parse(corpo);
            } catch (e) {
                throw new Error(corpo.trim() ? 'RESPOSTA_NAO_JSON' : 'RESPOSTA_VAZIA');
            }

            // Remove typing indicator
            if (typingIndicator) messagesContainer.removeChild(typingIndicator);

            // Display bot response
            const item = Array.isArray(responseData) ? responseData[0] : responseData;
            const rawResponse = item && (item.output ?? item.text ?? item.message ?? item.answer);
            if (typeof rawResponse !== 'string' || !rawResponse.trim()) {
                // Array vazio ou objeto sem 'output': antes isto virava
                // "cannot read property of undefined" dentro do renderMarkdown.
                throw new Error('SEM_CAMPO_OUTPUT');
            }

            let processedResponse = renderMarkdown(rawResponse);
            processedResponse = renderImages(processedResponse);
            processedResponse = linkifyText(processedResponse);

            const botMessageContainer = document.createElement('div');
            botMessageContainer.className = 'message-container bot-message';
            botMessageContainer.innerHTML = `
                ${botAvatarHTML}
                <div class="message-content">
                    <div class="chat-bubble bot-bubble">
                        <p>${processedResponse}</p>
                    </div>
                    <span class="timestamp">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `;
            messagesContainer.appendChild(botMessageContainer);

        } catch (error) {
            console.error('[chat-widget] falha ao consultar o webhook:', settings.webhook.url, error);
            if (typingIndicator && typingIndicator.parentNode) {
                messagesContainer.removeChild(typingIndicator);
            }

            // Uma mensagem por causa. "Ocorreu um erro" nao permite a ninguem
            // descobrir se o problema e a rede, o fluxo desligado no n8n ou a
            // forma da resposta — e essas tres se consertam em lugares
            // diferentes.
            const causas = {
                SEM_WEBHOOK:        'O endereço do atendimento não está configurado nesta página.',
                RESPOSTA_VAZIA:     'O serviço respondeu sem conteúdo. O fluxo pode estar desligado.',
                RESPOSTA_NAO_JSON:  'O serviço respondeu num formato inesperado.',
                SEM_CAMPO_OUTPUT:   'O serviço respondeu sem texto de resposta.',
            };
            let detalhe = causas[error.message];
            if (!detalhe && /^HTTP_/.test(error.message)) {
                const cod = error.message.slice(5);
                detalhe = cod === '404'
                    ? 'O atendimento não foi encontrado no servidor (404). O fluxo pode estar desativado.'
                    : `O servidor respondeu com erro ${cod}.`;
            }
            if (!detalhe) {
                detalhe = 'Não consegui falar com o servidor. Verifique sua conexão.';
            }

            const errorMessage = document.createElement('div');
            errorMessage.className = 'message-container bot-message';
            errorMessage.innerHTML = `
                ${botAvatarHTML}
                <div class="message-content">
                    <div class="chat-bubble bot-bubble">
                        <p><strong>Não consegui responder agora.</strong></p>
                        <p class="chat-hint">${detalhe}</p>
                        <p class="chat-hint">Se preferir, fale com a nossa equipe no WhatsApp.</p>
                        <div class="dynamic-buttons-container">
                            <button class="dynamic-button" data-erro-acao="whatsapp">${icone('conversa')}<span>Falar no WhatsApp</span></button>
                        </div>
                    </div>
                </div>
            `;
            errorMessage.querySelector('[data-erro-acao="whatsapp"]')
                ?.addEventListener('click', () => window.open('https://wa.me/4901799044322', '_blank'));
            messagesContainer.appendChild(errorMessage);
        } finally {
            isWaitingForResponse = false;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // --- Event Listeners ---

    // Toggle chat window visibility and start chat on first open
    launchButton.addEventListener('click', () => {
        chatWindow.classList.toggle('visible');
        if (chatWindow.classList.contains('visible') && !isChatInitialized) {
            startChat();
            isChatInitialized = true;
        }
        anunciarEstado();
    });

    // Porta de entrada para quem nao usa o botao flutuante: a propria pagina
    // abre a aba a partir do seu menu.
    // Anuncia o estado da aba no <html>, junto da largura dela. A pagina que
    // hospeda decide o que fazer com isso: o CRM encolhe o conteudo para a
    // esquerda em vez de ficar por baixo. O widget nao mexe no layout alheio
    // por conta propria — so ele nao sabe o que pode encolher sem quebrar.
    const anunciarEstado = () => {
        const aberta = chatWindow.classList.contains('visible');
        document.documentElement.classList.toggle('sunbotic-aberto', aberta);
        if (aberta) {
            const l = Math.round(chatWindow.getBoundingClientRect().width);
            document.documentElement.style.setProperty('--sunbotic-largura', l + 'px');
        }
    };

    window.SunboticChat = {
        abrir() {
            chatWindow.classList.add('visible');
            if (!isChatInitialized) { startChat(); isChatInitialized = true; }
            anunciarEstado();
        },
        fechar() { chatWindow.classList.remove('visible'); anunciarEstado(); },
        alternar() {
            chatWindow.classList.contains('visible') ? this.fechar() : this.abrir();
        },
    };

    // Esconde o lancador durante a rolagem e devolve quando ela para. Sem
    // isto ele cobre o que estiver no canto inferior direito a cada rolagem.
    // Nao se aplica com a aba aberta: ali o lancador ja nao aparece.
    let timerRolagem = null;
    const aoRolar = () => {
        if (chatWindow.classList.contains('visible')) return;
        launchButton.classList.add('rolando');
        clearTimeout(timerRolagem);
        // 420ms: tempo suficiente para a rolagem por inercia terminar, sem a
        // sensacao de que o botao demorou a voltar.
        timerRolagem = setTimeout(() => launchButton.classList.remove('rolando'), 420);
    };
    window.addEventListener('scroll', aoRolar, { passive: true });
    // Alguns layouts rolam num container interno, nao na janela.
    document.addEventListener('scroll', aoRolar, { passive: true, capture: true });

    // Close chat window
    chatWindow.querySelector('.chat-close-btn').addEventListener('click', () => {
        chatWindow.classList.remove('visible');
        anunciarEstado();
    });

    // Send message on button click
    sendButton.addEventListener('click', () => submitMessage(messageTextarea.value));

    // Send message on Enter key press (but not Shift+Enter)
    messageTextarea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitMessage(messageTextarea.value);
        }
    });

    // Auto-resize textarea height based on content
    function autoResizeTextarea() {
        messageTextarea.style.height = 'auto';
        const newHeight = Math.min(messageTextarea.scrollHeight, 104);
        messageTextarea.style.height = `${newHeight}px`;
    }

    // Adjust textarea size on input
    messageTextarea.addEventListener('input', autoResizeTextarea);

    // Formatacao ao vivo do telefone. Nao bloqueia tecla nenhuma: aceita colar,
    // aceita apagar, e so reescreve quando o texto ganha digito novo. O cursor
    // vai para o fim porque a mascara so cresce a direita.
    messageTextarea.addEventListener('input', () => {
        if (!modoTelefone) return;
        const bruto = messageTextarea.value;
        const formatado = formatarParcial(bruto);
        if (formatado !== bruto) {
            messageTextarea.value = formatado;
            messageTextarea.setSelectionRange(formatado.length, formatado.length);
        }
    });

})();
