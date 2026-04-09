

// Interactive Chat Widget for n8n
(function() {
    // Initialize widget only once
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    // Load font resource - using Poppins for a fresh look
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);
  //do WidgetStyles logo abaixo: Versao Neureka
            //--chat-shadow-sm: 0 1px 3px rgba(7, 235, 247, 0.1);
            //--chat-shadow-md: 0 4px 6px rgba(7, 235, 247, 0.15);
            //--chat-shadow-lg: 0 10px 15px rgba(7, 235, 247, 0.2);
  
    // Apply widget styles with completely different design approach
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        .chat-assist-widget {
            --chat-color-primary: var(--chat-widget-primary, #97B4BB);
            --chat-color-secondary: var(--chat-widget-secondary, #187874);
            --chat-color-tertiary: var(--chat-widget-tertiary, #b3dfa1);
            --chat-color-light: var(--chat-widget-light, #dff7d4);
            --chat-color-surface: var(--chat-widget-surface, #ffffff);
            --chat-color-text: var(--chat-widget-text, #1f2937);
            --chat-color-text-light: var(--chat-widget-text-light, #6b7280);
            --chat-color-border: var(--chat-widget-border, #e5e7eb);
            --chat-shadow-sm: 0 1px 3px rgba(7, 247, 191, 0.1);
            --chat-shadow-md: 0 4px 6px rgba(7, 247, 191, 0.15);
            --chat-shadow-lg: 0 10px 15px rgba(7, 247, 191, 0.2);
            --chat-radius-sm: 8px;
            --chat-radius-md: 12px;
            --chat-radius-lg: 20px;
            --chat-radius-full: 9999px;
            --chat-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: 'Poppins', sans-serif;
        }

        .chat-assist-widget .chat-window {
            position: fixed;
            bottom: 90px;
            z-index: 1000;
            width: 380px;
            height: 730px;
            background: var(--chat-color-surface);
            border-radius: var(--chat-radius-lg);
            box-shadow: var(--chat-shadow-lg);
            border: 1px solid var(--chat-color-light);
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
            color: white;
            position: relative;
        }

        .chat-assist-widget .chat-header-logo {
            width: 128px;
            height: 64px;
            border-radius: var(--chat-radius-sm);
            object-fit: contain;
            background: white;
            padding: 1px;
        }

        .chat-assist-widget .chat-header-title {
            font-size: 16px;
            font-weight: 600;
            color: white;
        }

        .chat-assist-widget .chat-close-btn {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--chat-transition);
            font-size: 18px;
            border-radius: var(--chat-radius-full);
            width: 28px;
            height: 28px;
        }

        .chat-assist-widget .chat-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-50%) scale(1.1);
        }

        .chat-assist-widget .chat-welcome {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 24px;
            text-align: center;
            width: 100%;
            max-width: 320px;
        }

        .chat-assist-widget .chat-welcome-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--chat-color-text);
            margin-bottom: 24px;
            line-height: 1.3;
        }

        .chat-assist-widget .chat-start-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            padding: 14px 20px;
            background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
            color: white;
            border: none;
            border-radius: var(--chat-radius-md);
            cursor: pointer;
            font-size: 15px;
            transition: var(--chat-transition);
            font-weight: 600;
            font-family: inherit;
            margin-bottom: 16px;
            box-shadow: var(--chat-shadow-md);
        }

        .chat-assist-widget .chat-start-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--chat-shadow-lg);
        }

        .chat-assist-widget .chat-response-time {
            font-size: 14px;
            color: var(--chat-color-text-light);
            margin: 0;
        }

        .chat-assist-widget .chat-body {
            display: none;
            flex-direction: column;
            height: 100%;
        }

        .chat-assist-widget .chat-body.active {
            display: flex;
        }
        
        /* Alinhamento para mensagens do bot */
        .chat-assist-widget .message-container.bot-message {
            justify-content: flex-start;
        }

        /* Timestamp do BOT (alinhado à esquerda) */
        .chat-assist-widget .message-container.bot-message .timestamp {
            text-align: left;
            margin-left: 8px;
            margin-top: 4px;
        }
        
        .chat-assist-widget {
            --chat-widget-primarybubble: #3498db; /* Azul mais claro */
            --chat-widget-secondarybubble: #2980b9; /* Azul médio */
        }
        
      /* Timestamp do USUÁRIO (alinhado à direita) */
      .chat-assist-widget .message-container.user-message .timestamp {
          text-align: right;
          margin-right: 8px;
          margin-top: 4px;
      }
        
      /* Ícones (NOVO - agora fora do balão) */
      .chat-assist-widget .message-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          margin-top: 4px; /* Alinha com o topo do balão */
      }
      
        /* Alinhamento para mensagens do usuário */
        .chat-assist-widget .message-container.user-message {
            justify-content: flex-end;
        }
        
       // .message-container.user-message
        
        .chat-assist-widget .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            padding-bottom: 105px !important;
            margin-bottom: -20px !important;
            box-sizing: border-box !important;
            background: #f9fafb;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .chat-assist-widget .chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .chat-assist-widget .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }

        .chat-assist-widget .chat-messages::-webkit-scrollbar-thumb {
            background-color: rgba(16, 185, 129, 0.3);
            border-radius: var(--chat-radius-full);
        }
        
        .chat-assist-widget .file-name {
            font-size: 12px;
            color: 0xffffff;
            margin-top: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
        }
        
        .chat-assist-widget .chat-bubble {
            max-width: calc(100% - 40px); /* Espaço para o ícone */
            padding: 12px 16px;
            margin: 0;
            border-radius: var(--chat-radius-md);
            max-width: 85%;
            word-wrap: break-word;
            font-size: 13px;
            line-height: 1.2;
            position: relative;
            display: block;
            align-items: flex-start;
            gap: 8px;;
            white-space: pre-line; /* This preserves line breaks */
        }

        .chat-assist-widget .chat-bubble.user-bubble {
            background: linear-gradient(135deg, var(--chat-widget-primarybubble) 0%, var(--chat-widget-secondarybubble) 100%);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            box-shadow: var(--chat-shadow-sm);
            flex-direction: row-reverse; /* Ícone à direita */
        }

          .chat-assist-widget .message-icon {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              flex-shrink: 0;
        }
        
          /* Timestamp */
          .chat-assist-widget .timestamp {
              display: block;
              font-size: 10px;
              color: var(--chat-color-text-light);
              text-align: right;
              opacity: 0.7;
              margin-top: 4px;
              margin-right: 8px;
          }

          /* Container da mensagem  */
          .chat-assist-widget .message-container {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              margin-bottom: 26px;
              width: 100%;
        }

        /* Container de conteúdo (agora inclui balão + timestamp) */
        .chat-assist-widget .message-content {
            display: flex;
            flex-direction: column;
            max-width: calc(100% - 40px);
        }

        .chat-assist-widget .chat-bubble.bot-bubble {
            background: white;
            color: var(--chat-color-text);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            box-shadow: var(--chat-shadow-sm);
            border: 1px solid var(--chat-color-light);
        }

        /* Typing animation */
        .chat-assist-widget .typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 14px 18px;
            background: white;
            border-radius: var(--chat-radius-md);
            border-bottom-left-radius: 4px;
            max-width: 80px;
            align-self: flex-start;
            box-shadow: var(--chat-shadow-sm);
            border: 1px solid var(--chat-color-light);
        }

        .chat-assist-widget .typing-dot {
            width: 8px;
            height: 8px;
            background: var(--chat-color-primary);
            border-radius: var(--chat-radius-full);
            opacity: 0.7;
            animation: typingAnimation 1.4s infinite ease-in-out;
        }

        .chat-assist-widget .typing-dot:nth-child(1) {
            animation-delay: 0s;
        }

        .chat-assist-widget .typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .chat-assist-widget .typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typingAnimation {
            0%, 60%, 100% {
                transform: translateY(0);
            }
            30% {
                transform: translateY(-4px);
            }
        }

        .chat-assist-widget .chat-controls {
            padding: 12px;
            flex-shrink: 0;
            background: var(--chat-color-surface);
            border-top: 1px solid var(--chat-color-light);
            display: flex;
            gap: 10px;
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
            width: 40px;
            height: 40px;
            background: var(--chat-color-light);
            border-radius: var(--chat-radius-md);
            cursor: pointer;
            transition: var(--chat-transition);
        }

        .chat-assist-widget .file-upload-label:hover {
            background: var(--chat-color-primary);
            color: white;
        }

        .chat-assist-widget .file-upload-label svg {
            width: 18px;
            height: 18px;
        }

        .chat-assist-widget .chat-textarea {
            flex: 1;
            padding: 14px 16px;
            border: 1px solid var(--chat-color-light);
            border-radius: var(--chat-radius-md);
            background: var(--chat-color-surface);
            color: var(--chat-color-text);
            resize: none;
            font-family: inherit;
            font-size: 13px;
            line-height: 1.5;
            max-height: 120px;
            min-height: 48px;
            transition: var(--chat-transition);
        }

        .chat-assist-widget .chat-textarea:focus {
            outline: none;
            border-color: var(--chat-color-primary);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .chat-assist-widget .chat-textarea::placeholder {
            color: var(--chat-color-text-light);
        }

        .chat-assist-widget .chat-submit {
            background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
            color: white;
            border: none;
            border-radius: var(--chat-radius-md);
            width: 48px;
            height: 48px;
            cursor: pointer;
            transition: var(--chat-transition);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: var(--chat-shadow-sm);
        }

        .chat-assist-widget .chat-submit:hover {
            transform: scale(1.05);
            box-shadow: var(--chat-shadow-md);
        }

        .chat-assist-widget .chat-submit svg {
            width: 22px;
            height: 22px;
        }

        .chat-assist-widget .chat-launcher {
            position: fixed;
            bottom: 20px;
            height: 56px;
            border-radius: var(--chat-radius-full);
            background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: var(--chat-shadow-md);
            z-index: 999;
            transition: var(--chat-transition);
            display: flex;
            align-items: center;
            padding: 0 20px 0 16px;
            gap: 8px;
        }

        .chat-assist-widget .chat-launcher.right-side {
            right: 20px;
        }

        .chat-assist-widget .chat-launcher.left-side {
            left: 20px;
        }

        .chat-assist-widget .chat-launcher:hover {
            transform: scale(1.05);
            box-shadow: var(--chat-shadow-lg);
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
            border-top: 1px solid var(--chat-color-light);
        }

        .chat-assist-widget .chat-footer-link {
            color: var(--chat-color-primary);
            text-decoration: none;
            font-size: 12px;
            opacity: 0.8;
            transition: var(--chat-transition);
            font-family: inherit;
        }

        .chat-assist-widget .chat-footer-link:hover {
            opacity: 1;
        }

        .chat-assist-widget .suggested-questions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 12px 0;
            align-self: flex-start;
            max-width: 85%;
        }

        .chat-assist-widget .suggested-question-btn {
            background: #f3f4f6;
            border: 1px solid var(--chat-color-light);
            border-radius: var(--chat-radius-md);
            padding: 10px 14px;
            text-align: left;
            font-size: 13px;
            color: var(--chat-color-text);
            cursor: pointer;
            transition: var(--chat-transition);
            font-family: inherit;
            line-height: 1.4;
        }

        .chat-assist-widget .suggested-question-btn:hover {
            background: var(--chat-color-light);
            border-color: var(--chat-color-primary);
        }

        .chat-assist-widget .chat-link {
            color: var(--chat-color-primary);
            text-decoration: underline;
            word-break: break-all;
            transition: var(--chat-transition);
        }

        .chat-assist-widget .chat-link:hover {
            color: var(--chat-color-secondary);
            text-decoration: underline;
        }

/* MOBILE OPTIMIZATIONS - PORTRAIT & LANDSCAPE */
@media (max-width: 1500px) {
  /* Base mobile styles */
  .chat-assist-widget .chat-window {
    width: 80vw !important;
    max-width: 400px !important;
    height: 60vh !important;
    bottom: 10px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    border-radius: 16px !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }

/* MOBILE LANDSCAPE FIXED SOLUTION */
@media (max-width: 3200px) and (orientation: landscape) {
  .chat-assist-widget .chat-window {
    width: 65vw !important;
    max-width: 500px !important;
    height: 60vh !important;
    top: 50% !important;
    left: 50% !important;
    bottom: auto !important;
    transform: translate(-50%, -50%) !important;
    border-radius: 16px !important;
    box-shadow: 0 5px 30px rgba(0,0,0,0.15);
  }
 }
}

        .chat-assist-widget .chat-body {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-assist-widget .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 20px !important; /* Espaço extra na parte inferior */
    min-height: 0; /* Isso é importante! */
}

.chat-assist-widget .chat-controls {
    flex-shrink: 0; /* Mantém fixo */
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 10;
}
    `;
    document.head.appendChild(widgetStyles);

    // Default configuration
    const defaultSettings = {
        webhook: {
            url: '',
            route: ''
        },
        branding: {
            logo: '',
            name: '',
            welcomeText: '',
            responseTimeText: '',
            poweredBy: {
                text: 'Powered by Neureka AI',
                link: 'https://neureka-ai.com'
            }
        },
        style: {
            primaryColor: '#10b981', // Green
            secondaryColor: '#059669', // Darker green
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#1f2937'
        },
        suggestedQuestions: [] // Default empty array for suggested questions
    };



    // Merge user settings with defaults
    const settings = window.ChatWidgetConfig ? 
        {
            webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
            branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
            style: { 
                ...defaultSettings.style, 
                ...window.ChatWidgetConfig.style,
                // Force green colors if user provided purple
                primaryColor: window.ChatWidgetConfig.style?.primaryColor === '#854fff' ? '#10b981' : (window.ChatWidgetConfig.style?.primaryColor || '#10b981'),
                secondaryColor: window.ChatWidgetConfig.style?.secondaryColor === '#6b3fd4' ? '#059669' : (window.ChatWidgetConfig.style?.secondaryColor || '#059669')
            },
            suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || defaultSettings.suggestedQuestions
        } : defaultSettings;

    // Session tracking
    let conversationId = '';
    let isWaitingForResponse = false;

    // Create widget DOM structure
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';
    
    // Apply custom colors
    widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-tertiary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);

    function resetFileInput() {
    fileInput.value = '';
    const fileNameDisplay = document.querySelector('.file-name-display');
    if (fileNameDisplay) fileNameDisplay.textContent = '';
    fileInput.nextElementSibling.style.backgroundColor = ''; // Remove o feedback visual
}
    // Create chat panel
    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    
    // Create welcome screen with header
    const welcomeScreenHTML = `
        <div class="chat-header">
            <img class="chat-header-logo" src="${settings.branding.logo}" alt="${settings.branding.name}">
            <span class="chat-header-title">${settings.branding.name}</span>
            <button class="chat-close-btn">×</button>
        </div>
        <div class="chat-welcome">
            <h2 class="chat-welcome-title">${settings.branding.welcomeText}</h2>
            <button class="chat-start-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Start chatting
            </button>
            <p class="chat-response-time">${settings.branding.responseTimeText}</p>
        </div>
    `;

    // Create chat interface with file upload
    const chatInterfaceHTML = `
        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <div class="file-upload-container">
                    <label for="chat-file-upload" class="file-upload-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </label>
                    <input type="file" id="chat-file-upload" class="file-upload-input" accept=".pdf,.doc,.docx,.jpg,.png">
                    <div class="file-name-display"></div> <!-- ESTA É A ÚNICA LINHA ADICIONADA -->
                </div>
                <textarea class="chat-textarea" placeholder="Digite aqui..." rows="1"></textarea>
                <button class="chat-submit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                </button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
            </div>
        </div>
    `;
    
    chatWindow.innerHTML = welcomeScreenHTML + chatInterfaceHTML;
    
    // Create toggle button
    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    launchButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        <span class="chat-launcher-text">Ajuda?</span>`;
    
    // Add elements to DOM
    widgetRoot.appendChild(chatWindow);
    widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);



function adicionarCalendarioNaConversa() {
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'mensagem-bot'; // Use o mesmo estilo das respostas do bot
    iframeContainer.innerHTML = `
        <iframe 
            src="https://calendar.app.google/CgsSSRopGdoaxKKK9" 
            width="100%" height="1500" frameborder="0" 
            style="border-radius: 0px; margin-top: 30px;">
        </iframe>
    `;
    messagesContainer.appendChild(iframeContainer);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

    // Get DOM elements
    const chatBody = chatWindow.querySelector('.chat-body');
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    const messageTextarea = chatWindow.querySelector('.chat-textarea');
    const sendButton = chatWindow.querySelector('.chat-submit');
    const chatWelcome = chatWindow.querySelector('.chat-welcome');
    const fileInput = chatWindow.querySelector('#chat-file-upload');

    // Helper function to generate unique session ID
    function createSessionId() {
        return crypto.randomUUID();
    }

    // Create typing indicator element
    function createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        return indicator;
    }

    // Function to convert URLs in text to clickable links
    function linkifyText(text) {
        // URL pattern that matches http, https, ftp links
        const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        
        // Convert URLs to HTML links
        return text.replace(urlPattern, function(url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
        });
    }

    // Start chat directly without registration
    // Start chat directly without registration
function startChat() {
    conversationId = createSessionId();
    if (chatWelcome) chatWelcome.style.display = 'none';
    chatBody.classList.add('active');
    
    // Custom welcome message (same as your n8n original)
    const welcomeContainer = document.createElement('div');
    welcomeContainer.className = 'message-container bot-message';
    welcomeContainer.innerHTML = `
        <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" class="message-icon" alt="Chatbot">
        <div class="message-content">
          <div class="chat-bubble bot-bubble">
              <p>Olá! 😊 Eu sou seu assistente virtual especializado em energia solar. Confira o que posso fazer por você:<br>
          1. Responder dúvidas sobre energia solar ☀️<br>
          2. Agendar uma reunião no calendário 📅<br>
          3. Criar um chamado para falar com alguém 👨‍💼<br>
          4. Analisar sua conta de luz e estimar quanto você pode economizar usando painéis solares 💡💰<br>
          Do que você precisa?</p>
                  <div class="action-buttons-container">
                    <button class="action-button blue-button">Dúvida</button>
                    <button class="action-button green-button">Agendamento</button>
                    <button class="action-button orange-button">Ticket</button>
                    <button class="action-button yellow-button">Energia</button>
                  </div>
          </div>
              <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
        </div>
    `;
    messagesContainer.appendChild(welcomeContainer);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;


 // Add styles for the action buttons
        const buttonStyles = document.createElement('style');
        buttonStyles.textContent = `
            .action-buttons-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
            }
            
            .action-button {
                flex: 1 1 calc(50% - 4px);
                min-width: 120px;
                padding: 10px 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.9;
            }
            
            .action-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                opacity: 1;
            }
            
            .blue-button {
                background-color: rgba(100, 149, 237, 0.7); /* Azul clarinho */
                color: white;
            }
            
            .green-button {
                background-color: rgba(144, 238, 144, 0.7); /* Verde clarinho */
                color: #333;
            }
            
            .orange-button {
                background-color: rgba(255, 182, 193, 0.7); /* Laranja clarinho (usando Light Pink como base) */
                color: #333;
            }
            
            .yellow-button {
                background-color: rgba(255, 255, 153, 0.7); /* Amarelo clarinho */
                color: #333;
            }
        `;
        document.head.appendChild(buttonStyles);

        // Add event listeners to the buttons
        const buttons = welcomeContainer.querySelectorAll('.action-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const buttonText = button.textContent;
                let message = '';
                
                switch(buttonText) {
                    case 'Dúvida':
                        message = 'Dúvida';
                        break;
                    case 'Agendamento':
                        message = 'Agendamento';
                        adicionarCalendarioNaConversa();
                        break;
                    case 'Ticket':
                        message = 'Ticket de suporte';
                        break;
                    case 'Energia':
                        message = 'Análise de energia';
                        break;
                    default:
                        message = buttonText;
                }
                
                submitMessage(message);
            });
        });

    // Show suggested questions if configured
    if (settings.suggestedQuestions && Array.isArray(settings.suggestedQuestions) && settings.suggestedQuestions.length > 0) {
        const suggestedQuestionsContainer = document.createElement('div');
        suggestedQuestionsContainer.className = 'suggested-questions';
        
        settings.suggestedQuestions.forEach(question => {
            const questionButton = document.createElement('button');
            questionButton.className = 'suggested-question-btn';
            questionButton.textContent = question;
            questionButton.addEventListener('click', () => {
                submitMessage(question);
                // Remove the suggestions after clicking
                if (suggestedQuestionsContainer.parentNode) {
                    suggestedQuestionsContainer.parentNode.removeChild(suggestedQuestionsContainer);
                }
            });
            suggestedQuestionsContainer.appendChild(questionButton);
        });
        
        messagesContainer.appendChild(suggestedQuestionsContainer);
    }
}

async function submitMessage(messageText) {
    if (isWaitingForResponse) return;
    
    isWaitingForResponse = true;
    
    const formData = new FormData();
    formData.append('action', 'sendMessage');
    formData.append('sessionId', conversationId);
    formData.append('route', settings.webhook.route);
    formData.append('chatInput', messageText);

  // ADICIONAR: Tratamento do arquivo
    let fileInfo = '';
  
    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
        fileInfo = `<div class="file-name">Arquivo: ${fileInput.files[0].name}</div>`;
    }

    // 👇 1. Mensagem do USUÁRIO (container + ícone à direita)
    const userMessageContainer = document.createElement('div');
    userMessageContainer.className = 'message-container user-message';
    userMessageContainer.innerHTML = `
    <div class="message-content">
        <div class="chat-bubble user-bubble">
            <p>${messageText}</p>
            ${fileInfo} 
            </div>
              <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
            </div>
            <img src="https://cdn-icons-png.flaticon.com/512/4202/4202836.png" class="message-icon" alt="Usuário">
    `;
 
    messagesContainer.appendChild(userMessageContainer);
    
    // 👇 2. Mostrar indicador de digitação
    const typingIndicator = createTypingIndicator();
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(settings.webhook.url, {
            method: 'POST',
            body: formData
        });
        
        const responseData = await response.json();
        messagesContainer.removeChild(typingIndicator);
        
        // 👇 3. Mensagem do BOT (container + ícone à esquerda)
        const botMessageContainer = document.createElement('div');
        botMessageContainer.className = 'message-container bot-message';
        const rawResponse = Array.isArray(responseData) ? responseData[0].output : responseData.output;
        const responseText = renderMarkdown(rawResponse); // Processa Markdown para HTML
        botMessageContainer.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" class="message-icon" alt="Chatbot">
            <div class="message-content">
              <div class="chat-bubble bot-bubble">
                  <p>${linkifyText(responseText)}</p>
              </div>
                  <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
            </div>
        `;
        messagesContainer.appendChild(botMessageContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error:', error);
        messagesContainer.removeChild(typingIndicator);
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message-container bot-message';
        errorMessage.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" class="message-icon" alt="Chatbot">
            <div class="chat-bubble bot-bubble">
                <p>Desculpe, ocorreu um erro. Tente novamente.</p>
                <span class="timestamp">${new Date().toLocaleString('pt-BR')}</span>
            </div>
        `;
        messagesContainer.appendChild(errorMessage);
    } finally {
        isWaitingForResponse = false;
        fileInput.value = '';
       resetFileInput(); 
        messageTextarea.value = ''; // Limpa o campo de texto
        messageTextarea.style.height = 'auto'; // Reseta a altura
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

    // Auto-resize textarea as user types
    function autoResizeTextarea() {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = (messageTextarea.scrollHeight > 120 ? 120 : messageTextarea.scrollHeight) + 'px';
    }

    // Event listeners
    startChat(); 

fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {

        // Feedback visual
        fileInput.nextElementSibling.style.backgroundColor = 'var(--chat-color-light)';

        // Foca no campo de texto para facilitar a edição
        messageTextarea.focus();
    }
});
  
    sendButton.addEventListener('click', () => {
        const messageText = messageTextarea.value.trim();
        if (messageText && !isWaitingForResponse) {
            submitMessage(messageText);
            //adicionarCalendarioNaConversa(); // 👈 Aqui abre o Cal.com
            messageTextarea.value = '';
            messageTextarea.style.height = 'auto';
            messageTextarea.focus();
        }
    });
    
    messageTextarea.addEventListener('input', autoResizeTextarea);
    
    messageTextarea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const messageText = messageTextarea.value.trim();
            if (messageText && !isWaitingForResponse) {
                submitMessage(messageText);
                //adicionarCalendarioNaConversa(); // 👈 Também aqui, para quem envia com Enter
                messageTextarea.value = '';
                messageTextarea.style.height = 'auto';
                messageTextarea.focus();
            }
        }
    });
    
    launchButton.addEventListener('click', () => {
        chatWindow.classList.toggle('visible');
    });
// Versão minimizada testada - cole no final do seu arquivo
const chatWidget = document.createElement('div');
chatWidget.innerHTML = `
    <div class="chat-window">
        <div class="chat-messages"></div>
        <div class="chat-controls">
        </div>
    </div>
`;
document.body.appendChild(chatWidget);

// Estilos mínimos garantidos
const style = document.createElement('style');
style.textContent = `
    .chat-submit {
        background: #10b981;
        border-radius: 12px;
        border: none;
        padding: 12px;
        cursor: pointer;
    }
`;

document.head.appendChild(style);
    // Close button functionality
    const closeButtons = chatWindow.querySelectorAll('.chat-close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            chatWindow.classList.remove('visible');
        });
    });
})();
