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
            bottom: 88px;
            z-index: 10000;
            width: 416px !important;
            max-width: calc(100vw - 32px) !important;
            /* Altura com teto em vez de fixa: a altura travada estourava a
               viewport em notebook baixo e em celular na horizontal. A 1a
               declaracao e o fallback de quem nao tem dvh. */
            height: min(640px, calc(100vh - 108px)) !important;
            height: min(640px, calc(100dvh - 108px)) !important;
            background: var(--chat-color-surface);
            border-radius: var(--chat-radius-lg);
            /* Elevacao por fio de 2px: 1px a 1,2:1 desaparece em monitor
               descalibrado, que e o hardware real deste publico. */
            border: 2px solid var(--rule);
            overflow: hidden;
            display: none;
            flex-direction: column;
            transition: var(--chat-transition);
            opacity: 0;
            transform: translateY(20px) scale(0.85);
        }

        .chat-assist-widget .chat-window.right-side {
            right: 20px;
        }

        .chat-assist-widget .chat-window.left-side {
            left: 20px;
        }

        .chat-assist-widget .chat-window.visible {
            display: flex;
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .chat-assist-widget .chat-header {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
            color: #ffffff;
            position: relative;
            flex-shrink: 0;
            border-bottom: 2px solid var(--brand-700);
        }

        .chat-assist-widget .chat-header-logo {
            width: 128px;
            height: 64px;
            border-radius: var(--chat-radius-sm);
            object-fit: contain;
            background: var(--card);
            padding: 2px;
        }

        .chat-assist-widget .chat-header-title {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
        }

        .chat-assist-widget .chat-close-btn {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            /* Chip solido: o branco sobre vidro translucido media 3,46:1. */
            background: var(--brand-700);
            /* rgba(255,255,255,0.45) media 2,99:1 e nao servia de segunda pista
               (o piso de indicador e 3:1). Solido mede 8,09:1. */
            border: 2px solid var(--ink-sobre-marca-2, #CFE3DF);
            color: #ffffff;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--chat-transition);
            font-size: 18px;
            line-height: 1;
            border-radius: var(--chat-radius-full);
            width: 28px;
            height: 28px;
        }

        .chat-assist-widget .chat-close-btn:hover {
            background: var(--ink-1);
            border-color: #ffffff;
            transform: translateY(-50%) scale(1.1);
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
            max-width: 95%;
            padding: 14px 16px;
            margin: 0;
            border-radius: var(--chat-radius-lg);
            word-wrap: break-word;
            font-size: 13px;
            line-height: 1.5;
            position: relative;
            display: block;
            align-items: flex-start;
            gap: 8px;
            white-space: pre-line;
        }

        .chat-assist-widget .chat-bubble.user-bubble {
            background: linear-gradient(135deg, var(--brand-600) 0%, var(--brand-700) 100%);
            color: #ffffff;
            align-self: flex-end;
            border: 2px solid var(--brand-700);
            border-bottom-right-radius: 4px;
        }

        .chat-assist-widget .chat-bubble.user-bubble .chat-figure,
        .chat-assist-widget .chat-bubble.user-bubble .chat-hint {
            color: #ffffff;
        }

        .chat-assist-widget .chat-bubble.bot-bubble {
            background: var(--chat-bubble-bg);
            color: var(--chat-bubble-text);
            align-self: flex-start;
            border: 2px solid var(--rule);
            border-bottom-left-radius: 4px;
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
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--chat-avatar-primary) 0%, var(--chat-avatar-secondary) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 4px;
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
            max-width: calc(100% - 40px);
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

        .chat-assist-widget .chat-controls {
            padding: 12px;
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
            padding: 12px 14px;
            border: 2px solid var(--rule);
            border-radius: var(--chat-radius-md);
            background: var(--chat-color-surface);
            color: var(--chat-color-text);
            resize: none;
            font-family: inherit;
            font-size: 13px;
            line-height: 1.5;
            max-height: 120px;
            min-height: 48px;
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
            width: 48px;
            height: 48px;
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

        .chat-assist-widget .chat-launcher {
            position: fixed;
            bottom: 20px;
            height: 56px;
            border-radius: var(--chat-radius-full);
            background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
            color: #ffffff;
            border: 2px solid var(--brand-700);
            cursor: pointer;
            z-index: 999;
            transition: var(--chat-transition);
            display: flex;
            align-items: center;
            padding: 0 20px 0 16px;
            gap: 8px;
            font-family: var(--fonte-texto);
        }

        .chat-assist-widget .chat-launcher.right-side {
            right: 20px;
        }

        .chat-assist-widget .chat-launcher.left-side {
            left: 20px;
        }

        .chat-assist-widget .chat-launcher:hover {
            background: var(--brand-700);
            transform: scale(1.05);
        }

        .chat-assist-widget .chat-launcher svg {
            width: 24px;
            height: 24px;
        }

        .chat-assist-widget .chat-launcher-text {
            font-weight: 600;
            font-size: 15px;
            white-space: nowrap;
        }

        .chat-assist-widget .chat-footer {
            padding: 10px;
            text-align: center;
            background: var(--chat-color-surface);
            border-top: 2px solid var(--rule);
            flex-shrink: 0;
        }

        .chat-assist-widget .chat-footer-link {
            color: var(--brand-600);
            text-decoration: none;
            font-size: 12px;
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

        .chat-assist-widget .chat-image {
            max-width: 100%;
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
            padding: 8px 10px;
            border: 2px solid var(--rule);
            border-radius: var(--chat-radius-md);
            background-color: var(--card);
            color: var(--ink-1);
            cursor: pointer;
            font-family: var(--fonte-texto);
            font-weight: 400;
            font-size: 13px;
            line-height: 1.3;
            transition: all 0.2s ease;
            text-align: left;
            flex: 0 0 48%;
            box-sizing: border-box;
        }

        .dynamic-button:hover {
            background-color: var(--brand-600);
            border-color: var(--brand-700);
            color: #ffffff;
        }

        /* Opcao de consumo e de contagem de pessoas: numero e decisao, entao
           entra em Atkinson tabular com digito alinhado. */
        .dynamic-button[data-kwh],
        .dynamic-button[data-family] {
            font-family: var(--fonte-numero);
            font-variant-numeric: tabular-nums;
        }

        .solar-panel-image {
            max-width: 100%;
            border-radius: var(--chat-radius-sm);
            margin: 12px 0;
            border: 2px solid var(--rule);
        }

        @media (max-width: 480px) {
            .chat-assist-widget .chat-window {
                /* O teto antigo de 260px deixava a janela mais estreita que o
                   proprio teclado do celular. */
                width: calc(100vw - 24px) !important;
                max-width: 420px !important;
                padding: 0 !important;
                height: min(560px, calc(100vh - 104px)) !important;
                height: min(560px, calc(100dvh - 104px)) !important;
                bottom: 84px !important;
                left: 50% !important;
                right: auto !important;
                transform: translateX(-50%) !important;
                border-radius: var(--chat-radius-lg) !important;
            }

            .chat-assist-widget .chat-header-logo {
                width: 96px;
                height: 48px;
            }
        }

        @media (min-width: 481px) {
            .chat-assist-widget .chat-window {
                width: 416px !important;
                max-width: calc(100vw - 32px) !important;
                height: min(640px, calc(100vh - 108px)) !important;
                height: min(640px, calc(100dvh - 108px)) !important;
                top: auto !important;
                left: auto !important;
                bottom: 88px !important;
                right: 20px !important;
                transform: none !important;
                border-radius: var(--chat-radius-lg) !important;
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
            outline-color: #ffffff;
        }
    `;
    document.head.appendChild(widgetStyles);

    // Default configuration - Sunbotic Theme
    const defaultSettings = {
        webhook: { url: '', route: '' },
        branding: {
            logo: 'https://neureka-ai.com/wp-content/uploads/2025/02/2-1.png',
            name: 'Sunbotic 🌞 Energia Solar',
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
        empresa_id: window.ChatWidgetConfig.empresa_id || null
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

    const validatePhone = (phone) => {
        const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    };

    // Create widget DOM structure
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

    // Create launcher button
    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    launchButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <span class="chat-launcher-text">Ajuda?</span>`;

    // Add elements to DOM
    widgetRoot.appendChild(chatWindow);
    widgetRoot.appendChild(launchButton);
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
            .replace(/^- (.*)$/gm, '<li>$1</li>');
    };

    // Bot avatar SVG inline
    const botAvatarHTML = `
        <div class="bot-avatar">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5A2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5a2.5 2.5 0 0 0-2.5-2.5z"/>
            </svg>
        </div>
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
                <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
            </div>
        `;
        messagesContainer.appendChild(messageContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
                <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
            </div>
            <img src="https://cdn-icons-png.flaticon.com/512/4202/4202836.png" class="message-icon" alt="Usuário">
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
            <p>📅 <strong>O calendário foi aberto em uma nova janela!</strong></p>
            <p class="chat-hint">Escolha o melhor horário para sua reunião com nosso especialista.</p>
        `);
    };

    // Function to show the dynamic buttons for different doubt topics
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
                <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
            </div>
        `;
        messagesContainer.appendChild(botFollowUpContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add event listeners to the new dynamic buttons
        botFollowUpContainer.querySelectorAll('.dynamic-button').forEach(btn => {
            btn.addEventListener('click', () => {
                submitMessage(btn.dataset.topic);
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
                <p>Ótimo! Vou fazer algumas perguntas rápidas para entender melhor sua necessidade. ☀️</p>
                <p><strong>Primeiro, qual é o seu e-mail?</strong></p>
                <p class="chat-hint">Digite seu e-mail no campo abaixo 👇</p>
            `, true, emailImage);

            messageTextarea.placeholder = "exemplo@email.com";
            messageTextarea.focus();
        }, 500);
    };

    // Step 2: Ask for phone
    const askPhone = () => {
        const phoneImage = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500';

        setTimeout(() => {
            addBotMessage(`
                <p>Perfeito! Agora me informe seu telefone com DDD.</p>
                <p><strong>Qual é o seu telefone?</strong></p>
                <p class="chat-hint">Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX</p>
            `, true, phoneImage);

            messageTextarea.placeholder = "(11) 91234-5678";
            messageTextarea.focus();
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

            messageContainer.querySelectorAll('.dynamic-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    qualificationData.familySize = btn.dataset.family;
                    addUserMessage(btn.dataset.family);
                    messageTextarea.placeholder = "Digite aqui...";
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

            messageContainer.querySelectorAll('.dynamic-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    qualificationData.kwhConsumption = btn.dataset.kwh;
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
                    <button class="dynamic-button" data-roof="Cerâmica/Telha">🏠 Cerâmica/Telha</button>
                    <button class="dynamic-button" data-roof="Fibrocimento">🏭 Fibrocimento</button>
                    <button class="dynamic-button" data-roof="Metálico">🔩 Metálico</button>
                    <button class="dynamic-button" data-roof="Laje">🏢 Laje</button>
                    <button class="dynamic-button" data-roof="Não sei">❓ Não sei</button>
                </div>
            `, true, roofTypesImage);

            messageContainer.querySelectorAll('.dynamic-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    qualificationData.roofType = btn.dataset.roof;
                    addUserMessage(btn.dataset.roof);
                    showQualificationResult();
                });
            });
        }, 500);
    };

    // Step 6: Show result and save to Supabase
    const showQualificationResult = async () => {
        const savingsImage = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500';

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
                        <p>🎉 <strong>Excelente! Com base nas informações fornecidas:</strong></p>
                        <p>📧 E-mail: ${qualificationData.email}<br>
                        📱 Telefone: <span class="chat-figure">${qualificationData.phone}</span><br>
                        👥 Pessoas na casa: <span class="chat-figure">${qualificationData.familySize}</span><br>
                        ⚡ Consumo mensal: <span class="chat-figure">${qualificationData.kwhConsumption}</span><br>
                        🏠 Tipo de telhado: ${qualificationData.roofType}</p>
                        <p>💰 <strong>Você tem potencial de reduzir até <span class="chat-figure-strong">90%</span> do valor da sua conta de luz!</strong></p>
                        <p>A energia solar é perfeita para seu perfil de consumo. Com um sistema fotovoltaico adequado, você pode economizar milhares de reais por ano e ainda valorizar seu imóvel.</p>
                        <p>🌟 <strong>Próximo passo:</strong> Agende uma conversa com nosso especialista para fazer uma análise detalhada e personalizada do seu caso!</p>
                        <div class="action-buttons-container" style="margin-top: 15px;">
                            <button class="action-button green-button schedule-btn">📅 Agende aqui</button>
                        </div>
                    </div>
                    <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
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
                scheduleBtn.textContent = '📅 Agendamento aberto';

                setTimeout(() => {
                    addBotMessage(`
                        <p>📅 <strong>Escolha o melhor horário para você:</strong></p>
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
                    <p>Olá! 😊 Eu sou seu assistente virtual especializado em energia solar. Como posso te ajudar hoje?</p>
                    <div class="action-buttons-container">
                        <button class="action-button blue-button" data-action="Qualificar">Quero economizar na luz</button>
                        <button class="action-button green-button" data-action="Agendamento">Agendar reunião</button>
                        <button class="action-button orange-button" data-action="Ticket">Falar com alguém</button>
                        <button class="action-button yellow-button" data-action="Dúvida">Tenho dúvidas</button>
                    </div>
                </div>
                <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
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
                            <p>📱 Perfeito! Você será redirecionado para o nosso WhatsApp.</p>
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
                        <p>❌ E-mail inválido! Por favor, digite um e-mail válido.</p>
                        <p class="chat-hint">Exemplo: seunome@email.com</p>
                    `);
                }, 300);
                messageTextarea.value = '';
                return;
            }
            qualificationData.email = trimmedMessage;
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
                    addBotMessage(`
                        <p>❌ Telefone inválido! Por favor, digite no formato correto.</p>
                        <p class="chat-hint">Exemplo: (11) 91234-5678 ou (11) 1234-5678</p>
                    `);
                }, 300);
                messageTextarea.value = '';
                return;
            }
            qualificationData.phone = trimmedMessage;
            addUserMessage(trimmedMessage);
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
                    <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/4202/4202836.png" class="message-icon" alt="Usuário">
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

        // Prepare data for webhook
        const formData = new FormData();
        formData.append('action', 'sendMessage');
        formData.append('sessionId', conversationId);
        formData.append('route', settings.webhook.route);
        formData.append('chatInput', trimmedMessage);

        try {
            const response = await fetch(settings.webhook.url, {
                method: 'POST',
                body: formData
            });
            const responseData = await response.json();

            // Remove typing indicator
            if (typingIndicator) messagesContainer.removeChild(typingIndicator);

            // Display bot response
            const rawResponse = Array.isArray(responseData) ? responseData[0].output : responseData.output;
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
                    <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
                </div>
            `;
            messagesContainer.appendChild(botMessageContainer);

        } catch (error) {
            console.error('Chat Widget Error:', error);
            if (typingIndicator) messagesContainer.removeChild(typingIndicator);
            // Display error message in chat
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message-container bot-message';
            errorMessage.innerHTML = `<p class="chat-bubble bot-bubble"><span class="chat-status chat-status-erro"><span class="chat-status-label">⚠ Erro</span><span>Desculpe, ocorreu um erro. Tente novamente.</span></span></p>`;
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
    });

    // Close chat window
    chatWindow.querySelector('.chat-close-btn').addEventListener('click', () => chatWindow.classList.remove('visible'));

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
        const newHeight = Math.min(messageTextarea.scrollHeight, 120);
        messageTextarea.style.height = `${newHeight}px`;
    }

    // Adjust textarea size on input
    messageTextarea.addEventListener('input', autoResizeTextarea);

})();
