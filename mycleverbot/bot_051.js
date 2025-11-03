/**
 * Chatbot Widget - Versão 051
 * Customizado para integração com n8n webhook
 *
 * Características desta versão:
 * - Sem floating bubble (apenas modo embedded)
 * - Envia UUID e email do usuário para o webhook
 * - Integração automática com a página
 * - Design mantido conforme original
 */

(function() {
    'use strict';

    const VERSION = '051';
    console.log(`🤖 Chatbot Widget v${VERSION} carregando...`);

    // Configuração padrão
    const defaultConfig = {
        webhook: {
            url: 'https://pastro83.app.n8n.cloud/webhook/chatbot'
        },
        embedded: true,
        showBubble: false,
        autoOpen: true,
        getUserData: null,
        placeholder: 'Digite sua mensagem...',
        sendButtonText: 'Enviar',
        theme: {
            primaryColor: '#4CAF50',
            textColor: '#333',
            backgroundColor: '#fff'
        }
    };

    // Mesclar configuração do usuário
    const config = { ...defaultConfig, ...(window.ChatWidgetConfig || {}) };

    // Classe principal do Chatbot
    class ChatWidget {
        constructor(config) {
            this.config = config;
            this.messages = [];
            this.isOpen = config.autoOpen || false;
            this.container = null;
            this.inputElement = null;
            this.messagesContainer = null;

            this.init();
        }

        init() {
            console.log('🔧 Inicializando Chatbot Widget v' + VERSION);

            // NÃO criar bubble se showBubble for false
            if (this.config.showBubble === false) {
                console.log('✅ Bubble desabilitado - modo embedded ativo');
            }

            // Criar interface do chat
            this.createChatInterface();

            // Se autoOpen está ativo, abrir automaticamente
            if (this.config.autoOpen) {
                this.open();
            }
        }

        createChatInterface() {
            // Procurar container existente ou usar o root
            const targetContainer = document.getElementById('chatbot-root') || document.body;

            // Criar container principal
            this.container = document.createElement('div');
            this.container.id = 'chat-widget-container';
            this.container.style.cssText = `
                display: ${this.isOpen ? 'flex' : 'none'};
                flex-direction: column;
                width: 100%;
                height: 100%;
                background-color: ${this.config.theme.backgroundColor};
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            `;

            // Criar área de mensagens
            this.messagesContainer = document.createElement('div');
            this.messagesContainer.id = 'chat-messages';
            this.messagesContainer.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;

            // Criar área de input
            const inputArea = document.createElement('div');
            inputArea.style.cssText = `
                display: flex;
                padding: 16px;
                background-color: #f5f5f5;
                border-top: 1px solid #e0e0e0;
                gap: 8px;
            `;

            this.inputElement = document.createElement('input');
            this.inputElement.type = 'text';
            this.inputElement.placeholder = this.config.placeholder;
            this.inputElement.style.cssText = `
                flex: 1;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 24px;
                font-size: 14px;
                outline: none;
                background-color: white;
            `;

            const sendButton = document.createElement('button');
            sendButton.textContent = this.config.sendButtonText;
            sendButton.style.cssText = `
                padding: 12px 24px;
                background-color: ${this.config.theme.primaryColor};
                color: white;
                border: none;
                border-radius: 24px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            `;

            sendButton.addEventListener('mouseenter', () => {
                sendButton.style.backgroundColor = this.darkenColor(this.config.theme.primaryColor);
            });

            sendButton.addEventListener('mouseleave', () => {
                sendButton.style.backgroundColor = this.config.theme.primaryColor;
            });

            // Event listeners
            sendButton.addEventListener('click', () => this.sendMessage());
            this.inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });

            // Montar estrutura
            inputArea.appendChild(this.inputElement);
            inputArea.appendChild(sendButton);
            this.container.appendChild(this.messagesContainer);
            this.container.appendChild(inputArea);
            targetContainer.appendChild(this.container);

            // Adicionar mensagem de boas-vindas
            this.addMessage('Olá! Sou seu assistente de alemão. Como posso ajudar você hoje?', 'bot');
        }

        darkenColor(color) {
            // Função auxiliar para escurecer cor no hover
            const rgb = this.hexToRgb(color);
            if (!rgb) return color;

            return `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
        }

        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                display: flex;
                justify-content: ${sender === 'user' ? 'flex-end' : 'flex-start'};
                animation: slideIn 0.3s ease-out;
            `;

            const messageBubble = document.createElement('div');
            messageBubble.textContent = text;
            messageBubble.style.cssText = `
                max-width: 70%;
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                ${sender === 'user'
                    ? `background-color: ${this.config.theme.primaryColor}; color: white;`
                    : `background-color: #f0f0f0; color: ${this.config.theme.textColor};`
                }
            `;

            messageDiv.appendChild(messageBubble);
            this.messagesContainer.appendChild(messageDiv);

            // Scroll para o final
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

            // Armazenar mensagem
            this.messages.push({ text, sender, timestamp: new Date() });
        }

        addTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.style.cssText = `
                display: flex;
                justify-content: flex-start;
            `;

            const typingBubble = document.createElement('div');
            typingBubble.style.cssText = `
                padding: 12px 16px;
                border-radius: 18px;
                background-color: #f0f0f0;
                display: flex;
                gap: 4px;
            `;

            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('span');
                dot.style.cssText = `
                    width: 8px;
                    height: 8px;
                    background-color: #999;
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                    animation-delay: ${i * 0.2}s;
                `;
                typingBubble.appendChild(dot);
            }

            typingDiv.appendChild(typingBubble);
            this.messagesContainer.appendChild(typingDiv);
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

            // Adicionar animação de digitação
            if (!document.getElementById('typing-animation-style')) {
                const style = document.createElement('style');
                style.id = 'typing-animation-style';
                style.textContent = `
                    @keyframes typing {
                        0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
                        30% { transform: translateY(-10px); opacity: 1; }
                    }
                    @keyframes slideIn {
                        from { transform: translateY(10px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        removeTypingIndicator() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        async sendMessage() {
            const message = this.inputElement.value.trim();
            if (!message) return;

            // Adicionar mensagem do usuário
            this.addMessage(message, 'user');
            this.inputElement.value = '';

            // Adicionar indicador de digitação
            this.addTypingIndicator();

            try {
                // Obter dados do usuário
                let userData = { userId: null, email: null };
                if (typeof this.config.getUserData === 'function') {
                    userData = this.config.getUserData();
                    console.log('👤 Dados do usuário obtidos:', userData);
                }

                // Preparar payload
                const payload = {
                    message: message,
                    userId: userData.userId,
                    email: userData.email,
                    timestamp: new Date().toISOString(),
                    version: VERSION
                };

                console.log('📤 Enviando payload para webhook:', payload);

                // Fazer requisição para o webhook
                const response = await fetch(this.config.webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                console.log('📥 Resposta do webhook - Status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Dados recebidos do webhook:', data);

                // Remover indicador de digitação
                this.removeTypingIndicator();

                // Extrair mensagem da resposta
                let botMessage = data.output || data.message || data.response || 'Desculpe, não entendi.';

                // Adicionar resposta do bot
                this.addMessage(botMessage, 'bot');

            } catch (error) {
                console.error('❌ Erro ao enviar mensagem:', error);
                this.removeTypingIndicator();
                this.addMessage('Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.', 'bot');
            }
        }

        open() {
            if (this.container) {
                this.container.style.display = 'flex';
                this.isOpen = true;
                console.log('✅ Chat aberto');
            }
        }

        close() {
            if (this.container) {
                this.container.style.display = 'none';
                this.isOpen = false;
                console.log('✅ Chat fechado');
            }
        }

        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }
    }

    // Inicializar widget quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.chatWidget = new ChatWidget(config);
            console.log('✅ Chatbot Widget v' + VERSION + ' inicializado!');
        });
    } else {
        window.chatWidget = new ChatWidget(config);
        console.log('✅ Chatbot Widget v' + VERSION + ' inicializado!');
    }

    // Expor API global
    window.ChatWidget = ChatWidget;

})();
