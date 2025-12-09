// Chatbot Preferences Panel - Component that can be added to any page
// Include this script and call openChatbotPreferences() to open the panel

(function() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Chatbot Preferences Panel Overlay */
        .chatbot-prefs-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.4);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 9998;
        }

        .chatbot-prefs-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        /* Side Panel */
        .chatbot-prefs-panel {
            position: fixed;
            top: 0;
            right: -900px;
            width: 860px;
            max-width: 95%;
            height: 100vh;
            background: #f9fafb;
            box-shadow: -4px 0 30px rgba(0,0,0,0.2);
            transition: right 0.3s ease;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            font-family: 'Poppins', sans-serif;
        }

        .chatbot-prefs-panel.active {
            right: 0;
        }

        .chatbot-prefs-panel * {
            box-sizing: border-box;
        }

        .chatbot-prefs-header {
            padding: 20px 24px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
        }

        .chatbot-prefs-header h2 {
            font-size: 18px;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
        }

        .chatbot-prefs-header h2 i {
            color: #309086;
        }

        .chatbot-prefs-close {
            width: 36px;
            height: 36px;
            border: none;
            background: #f3f4f6;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            transition: all 0.2s;
        }

        .chatbot-prefs-close:hover {
            background: #fee2e2;
            color: #dc2626;
        }

        /* Panel Content - Two Columns */
        .chatbot-prefs-content {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 380px;
            overflow: hidden;
        }

        @media (max-width: 800px) {
            .chatbot-prefs-content {
                grid-template-columns: 1fr;
            }
            .chatbot-prefs-preview {
                display: none;
            }
        }

        /* Settings Section */
        .chatbot-prefs-settings {
            overflow-y: auto;
            padding: 24px;
            background: white;
        }

        /* Preview Section */
        .chatbot-prefs-preview {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-y: auto;
        }

        .chatbot-prefs-preview-label {
            color: rgba(255,255,255,0.7);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chatbot-prefs-chat-preview {
            width: 100%;
            max-width: 340px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .chatbot-prefs-preview-header {
            padding: 14px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
        }

        .chatbot-prefs-preview-logo {
            width: 70px;
            height: 35px;
            border-radius: 6px;
            object-fit: contain;
            background: white;
            padding: 3px;
        }

        .chatbot-prefs-preview-title {
            font-size: 13px;
            font-weight: 600;
            flex: 1;
        }

        .chatbot-prefs-preview-close-btn {
            width: 26px;
            height: 26px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .chatbot-prefs-preview-body {
            background: #f9fafb;
            padding: 16px;
            min-height: 200px;
        }

        .chatbot-prefs-preview-message {
            display: flex;
            gap: 10px;
        }

        .chatbot-prefs-preview-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .chatbot-prefs-preview-avatar svg {
            width: 16px;
            height: 16px;
            fill: white;
        }

        .chatbot-prefs-preview-bubble {
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 12px;
            max-width: 240px;
            line-height: 1.4;
        }

        .chatbot-prefs-preview-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
        }

        .chatbot-prefs-preview-btn {
            padding: 6px 10px;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 500;
            color: white;
            flex: 1 1 calc(50% - 3px);
            text-align: center;
        }

        .chatbot-prefs-preview-footer {
            background: white;
            padding: 10px;
            border-top: 1px solid #e5e7eb;
        }

        .chatbot-prefs-preview-input {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .chatbot-prefs-preview-textarea {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 12px;
            color: #9ca3af;
        }

        .chatbot-prefs-preview-send {
            width: 34px;
            height: 34px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chatbot-prefs-preview-send svg {
            width: 16px;
            height: 16px;
        }

        .chatbot-prefs-preview-powered {
            text-align: center;
            padding: 8px;
            font-size: 10px;
            color: #9ca3af;
            background: white;
        }

        /* Panel Footer */
        .chatbot-prefs-footer {
            padding: 16px 24px;
            border-top: 1px solid #e5e7eb;
            background: white;
            display: flex;
            gap: 10px;
        }

        .chatbot-prefs-footer .chatbot-prefs-btn {
            flex: 1;
        }

        /* Form Styles */
        .chatbot-prefs-section {
            margin-bottom: 24px;
        }

        .chatbot-prefs-section-title {
            font-size: 12px;
            font-weight: 600;
            color: #309086;
            margin-bottom: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chatbot-prefs-section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e5e7eb;
        }

        .chatbot-prefs-form-group {
            margin-bottom: 14px;
        }

        .chatbot-prefs-form-group label {
            display: block;
            font-size: 12px;
            color: #4b5563;
            margin-bottom: 5px;
            font-weight: 500;
        }

        .chatbot-prefs-form-group input[type="text"],
        .chatbot-prefs-form-group input[type="url"] {
            width: 100%;
            padding: 9px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            transition: all 0.2s;
        }

        .chatbot-prefs-form-group input[type="text"]:focus,
        .chatbot-prefs-form-group input[type="url"]:focus {
            outline: none;
            border-color: #309086;
            box-shadow: 0 0 0 3px rgba(48, 144, 134, 0.15);
        }

        .chatbot-prefs-color-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .chatbot-prefs-color-input {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chatbot-prefs-color-input input[type="color"] {
            width: 38px;
            height: 34px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            padding: 2px;
        }

        .chatbot-prefs-color-input input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
        }

        .chatbot-prefs-color-input input[type="color"]::-webkit-color-swatch {
            border: none;
            border-radius: 3px;
        }

        .chatbot-prefs-color-hex {
            flex: 1;
            padding: 8px 10px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            min-width: 0;
        }

        .chatbot-prefs-logo-upload {
            border: 2px dashed #e5e7eb;
            border-radius: 10px;
            padding: 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .chatbot-prefs-logo-upload:hover {
            border-color: #309086;
            background: #f0fdfa;
        }

        .chatbot-prefs-logo-upload input {
            display: none;
        }

        .chatbot-prefs-logo-preview {
            max-width: 120px;
            max-height: 60px;
            margin: 8px auto;
            display: block;
            border-radius: 6px;
        }

        .chatbot-prefs-logo-upload-text {
            color: #6b7280;
            font-size: 12px;
        }

        .chatbot-prefs-logo-upload-text i {
            display: block;
            font-size: 20px;
            color: #309086;
            margin-bottom: 6px;
        }

        /* Buttons */
        .chatbot-prefs-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .chatbot-prefs-btn-primary {
            background: linear-gradient(135deg, #309086 0%, #26a69a 100%);
            color: white;
        }

        .chatbot-prefs-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(48, 144, 134, 0.3);
        }

        .chatbot-prefs-btn-secondary {
            background: white;
            color: #374151;
            border: 1px solid #e5e7eb;
        }

        .chatbot-prefs-btn-secondary:hover {
            background: #f9fafb;
        }

        /* Code Section */
        .chatbot-prefs-code-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            display: none;
        }

        .chatbot-prefs-code-section.visible {
            display: block;
        }

        .chatbot-prefs-code-box {
            background: #1f2937;
            border-radius: 8px;
            padding: 14px;
            overflow-x: auto;
        }

        .chatbot-prefs-code-box pre {
            color: #e5e7eb;
            font-size: 11px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
        }

        .chatbot-prefs-copy-btn {
            margin-top: 10px;
            background: #10b981 !important;
            color: white !important;
            width: 100%;
            border: none !important;
        }

        .chatbot-prefs-copy-btn:hover {
            background: #059669 !important;
        }

        .chatbot-prefs-success-msg {
            color: #10b981;
            font-size: 12px;
            margin-top: 8px;
            text-align: center;
            display: none;
        }

        /* Toast */
        .chatbot-prefs-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: #059669;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
            z-index: 10000;
        }

        .chatbot-prefs-toast.show {
            transform: translateX(-50%) translateY(0);
        }
    `;
    document.head.appendChild(style);

    // Create HTML structure
    const panelHTML = `
        <div class="chatbot-prefs-overlay" id="chatbotPrefsOverlay"></div>
        <div class="chatbot-prefs-panel" id="chatbotPrefsPanel">
            <div class="chatbot-prefs-header">
                <h2>
                    <i class="fas fa-sliders-h"></i>
                    Personalização do Chatbot
                </h2>
                <button class="chatbot-prefs-close" id="chatbotPrefsClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="chatbot-prefs-content">
                <!-- Settings Column -->
                <div class="chatbot-prefs-settings">
                    <div class="chatbot-prefs-section">
                        <div class="chatbot-prefs-section-title">Identidade Visual</div>
                        <div class="chatbot-prefs-form-group">
                            <label>Título do Chatbot</label>
                            <input type="text" id="cpChatTitle" value="Sunbotic Energia Solar" placeholder="Nome do seu chatbot">
                        </div>
                        <div class="chatbot-prefs-form-group">
                            <label>Logo (URL)</label>
                            <input type="url" id="cpLogoUrl" value="https://neureka-ai.com/wp-content/uploads/2025/02/2-1.png" placeholder="https://exemplo.com/logo.png">
                        </div>
                        <div class="chatbot-prefs-form-group">
                            <label>Ou faça upload</label>
                            <div class="chatbot-prefs-logo-upload" id="cpLogoUpload">
                                <input type="file" id="cpLogoFile" accept="image/*">
                                <img id="cpLogoPreviewImg" class="chatbot-prefs-logo-preview" style="display: none;">
                                <p class="chatbot-prefs-logo-upload-text">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    Clique para upload
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="chatbot-prefs-section">
                        <div class="chatbot-prefs-section-title">Cores do Header</div>
                        <div class="chatbot-prefs-color-row">
                            <div class="chatbot-prefs-form-group">
                                <label>Primária</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpHeaderPrimary" value="#309086">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpHeaderPrimaryHex" value="#309086">
                                </div>
                            </div>
                            <div class="chatbot-prefs-form-group">
                                <label>Secundária</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpHeaderSecondary" value="#26a69a">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpHeaderSecondaryHex" value="#26a69a">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="chatbot-prefs-section">
                        <div class="chatbot-prefs-section-title">Cores dos Botões</div>
                        <div class="chatbot-prefs-color-row">
                            <div class="chatbot-prefs-form-group">
                                <label>Primária</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpButtonPrimary" value="#309086">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpButtonPrimaryHex" value="#309086">
                                </div>
                            </div>
                            <div class="chatbot-prefs-form-group">
                                <label>Secundária</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpButtonSecondary" value="#1f6e66">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpButtonSecondaryHex" value="#1f6e66">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="chatbot-prefs-section">
                        <div class="chatbot-prefs-section-title">Mensagem do Bot</div>
                        <div class="chatbot-prefs-color-row">
                            <div class="chatbot-prefs-form-group">
                                <label>Fundo</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpBubbleBg" value="#ffffff">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpBubbleBgHex" value="#ffffff">
                                </div>
                            </div>
                            <div class="chatbot-prefs-form-group">
                                <label>Texto</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpBubbleText" value="#1f2937">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpBubbleTextHex" value="#1f2937">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="chatbot-prefs-section">
                        <div class="chatbot-prefs-section-title">Avatar do Bot</div>
                        <div class="chatbot-prefs-color-row">
                            <div class="chatbot-prefs-form-group">
                                <label>Primária</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpAvatarPrimary" value="#309086">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpAvatarPrimaryHex" value="#309086">
                                </div>
                            </div>
                            <div class="chatbot-prefs-form-group">
                                <label>Secundária</label>
                                <div class="chatbot-prefs-color-input">
                                    <input type="color" id="cpAvatarSecondary" value="#26a69a">
                                    <input type="text" class="chatbot-prefs-color-hex" id="cpAvatarSecondaryHex" value="#26a69a">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="chatbot-prefs-code-section" id="cpCodeSection">
                        <div class="chatbot-prefs-section-title">Código Gerado</div>
                        <div class="chatbot-prefs-code-box">
                            <pre id="cpGeneratedCode"></pre>
                        </div>
                        <button class="chatbot-prefs-btn chatbot-prefs-copy-btn" id="cpCopyBtn">
                            <i class="fas fa-copy"></i>
                            Copiar Código
                        </button>
                        <p class="chatbot-prefs-success-msg" id="cpCopySuccess">
                            <i class="fas fa-check-circle"></i> Código copiado!
                        </p>
                    </div>
                </div>

                <!-- Preview Column -->
                <div class="chatbot-prefs-preview">
                    <div class="chatbot-prefs-preview-label">
                        <i class="fas fa-eye"></i>
                        Preview em Tempo Real
                    </div>

                    <div class="chatbot-prefs-chat-preview">
                        <div class="chatbot-prefs-preview-header" id="cpPreviewHeader">
                            <img class="chatbot-prefs-preview-logo" id="cpPreviewLogo" src="https://neureka-ai.com/wp-content/uploads/2025/02/2-1.png" alt="Logo">
                            <span class="chatbot-prefs-preview-title" id="cpPreviewTitle">Sunbotic Energia Solar</span>
                            <div class="chatbot-prefs-preview-close-btn">×</div>
                        </div>

                        <div class="chatbot-prefs-preview-body">
                            <div class="chatbot-prefs-preview-message">
                                <div class="chatbot-prefs-preview-avatar" id="cpPreviewAvatar">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z"/>
                                    </svg>
                                </div>
                                <div>
                                    <div class="chatbot-prefs-preview-bubble" id="cpPreviewBubble">
                                        Olá! Eu sou seu assistente virtual especializado em energia solar. Como posso te ajudar?

                                        <div class="chatbot-prefs-preview-buttons" id="cpPreviewButtons">
                                            <div class="chatbot-prefs-preview-btn">Quero economizar</div>
                                            <div class="chatbot-prefs-preview-btn">Agendar reunião</div>
                                            <div class="chatbot-prefs-preview-btn">Falar com alguém</div>
                                            <div class="chatbot-prefs-preview-btn">Tenho dúvidas</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="chatbot-prefs-preview-footer">
                            <div class="chatbot-prefs-preview-input">
                                <div class="chatbot-prefs-preview-textarea">Digite aqui...</div>
                                <div class="chatbot-prefs-preview-send" id="cpPreviewSend">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div class="chatbot-prefs-preview-powered">Powered by Neureka AI</div>
                    </div>
                </div>
            </div>

            <div class="chatbot-prefs-footer">
                <button class="chatbot-prefs-btn chatbot-prefs-btn-secondary" id="cpGenerateCode">
                    <i class="fas fa-code"></i>
                    Gerar Código
                </button>
                <button class="chatbot-prefs-btn chatbot-prefs-btn-primary" id="cpSavePrefs">
                    <i class="fas fa-save"></i>
                    Salvar Preferências
                </button>
            </div>
        </div>

        <div class="chatbot-prefs-toast" id="chatbotPrefsToast">
            <i class="fas fa-check-circle"></i>
            <span id="chatbotPrefsToastMsg">Preferências salvas!</span>
        </div>
    `;

    // Append to body
    const container = document.createElement('div');
    container.innerHTML = panelHTML;
    document.body.appendChild(container);

    // Setup event listeners
    function setupChatbotPrefsPanel() {
        const overlay = document.getElementById('chatbotPrefsOverlay');
        const panel = document.getElementById('chatbotPrefsPanel');
        const closeBtn = document.getElementById('chatbotPrefsClose');
        const saveBtn = document.getElementById('cpSavePrefs');
        const generateBtn = document.getElementById('cpGenerateCode');
        const copyBtn = document.getElementById('cpCopyBtn');
        const logoUpload = document.getElementById('cpLogoUpload');
        const logoFile = document.getElementById('cpLogoFile');

        // Close panel
        overlay.addEventListener('click', closeChatbotPreferences);
        closeBtn.addEventListener('click', closeChatbotPreferences);

        // Save preferences
        saveBtn.addEventListener('click', saveChatbotPreferences);

        // Generate code
        generateBtn.addEventListener('click', generateChatbotCode);

        // Copy code
        copyBtn.addEventListener('click', copyChatbotCode);

        // Logo upload
        logoUpload.addEventListener('click', () => logoFile.click());
        logoFile.addEventListener('change', handleLogoUpload);

        // Color sync
        setupColorSync('cpHeaderPrimary', 'cpHeaderPrimaryHex');
        setupColorSync('cpHeaderSecondary', 'cpHeaderSecondaryHex');
        setupColorSync('cpButtonPrimary', 'cpButtonPrimaryHex');
        setupColorSync('cpButtonSecondary', 'cpButtonSecondaryHex');
        setupColorSync('cpBubbleBg', 'cpBubbleBgHex');
        setupColorSync('cpBubbleText', 'cpBubbleTextHex');
        setupColorSync('cpAvatarPrimary', 'cpAvatarPrimaryHex');
        setupColorSync('cpAvatarSecondary', 'cpAvatarSecondaryHex');

        // Input listeners for preview
        document.getElementById('cpChatTitle').addEventListener('input', updateChatbotPreview);
        document.getElementById('cpLogoUrl').addEventListener('input', updateChatbotPreview);

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeChatbotPreferences();
        });

        // Load saved preferences
        loadChatbotPreferences();
        updateChatbotPreview();
    }

    function setupColorSync(colorId, hexId) {
        const colorInput = document.getElementById(colorId);
        const hexInput = document.getElementById(hexId);

        colorInput.addEventListener('input', () => {
            hexInput.value = colorInput.value;
            updateChatbotPreview();
        });

        hexInput.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
                colorInput.value = hexInput.value;
                updateChatbotPreview();
            }
        });
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                document.getElementById('cpLogoUrl').value = dataUrl;
                document.getElementById('cpLogoPreviewImg').src = dataUrl;
                document.getElementById('cpLogoPreviewImg').style.display = 'block';
                document.querySelector('.chatbot-prefs-logo-upload-text').style.display = 'none';
                updateChatbotPreview();
            };
            reader.readAsDataURL(file);
        }
    }

    function updateChatbotPreview() {
        const headerPrimary = document.getElementById('cpHeaderPrimary').value;
        const headerSecondary = document.getElementById('cpHeaderSecondary').value;
        const buttonPrimary = document.getElementById('cpButtonPrimary').value;
        const buttonSecondary = document.getElementById('cpButtonSecondary').value;
        const bubbleBg = document.getElementById('cpBubbleBg').value;
        const bubbleText = document.getElementById('cpBubbleText').value;
        const avatarPrimary = document.getElementById('cpAvatarPrimary').value;
        const avatarSecondary = document.getElementById('cpAvatarSecondary').value;
        const title = document.getElementById('cpChatTitle').value;
        const logoUrl = document.getElementById('cpLogoUrl').value;

        document.getElementById('cpPreviewHeader').style.background =
            `linear-gradient(135deg, ${headerPrimary} 0%, ${headerSecondary} 100%)`;
        document.getElementById('cpPreviewTitle').textContent = title;
        document.getElementById('cpPreviewLogo').src = logoUrl;

        document.querySelectorAll('.chatbot-prefs-preview-btn').forEach(btn => {
            btn.style.background = `linear-gradient(135deg, ${buttonPrimary} 0%, ${buttonSecondary} 100%)`;
        });

        document.getElementById('cpPreviewBubble').style.background = bubbleBg;
        document.getElementById('cpPreviewBubble').style.color = bubbleText;

        document.getElementById('cpPreviewAvatar').style.background =
            `linear-gradient(135deg, ${avatarPrimary} 0%, ${avatarSecondary} 100%)`;

        document.getElementById('cpPreviewSend').style.background =
            `linear-gradient(135deg, ${headerPrimary} 0%, ${headerSecondary} 100%)`;
        document.getElementById('cpPreviewSend').style.color = 'white';
    }

    function saveChatbotPreferences() {
        const prefs = {
            headerPrimary: document.getElementById('cpHeaderPrimary').value,
            headerSecondary: document.getElementById('cpHeaderSecondary').value,
            buttonPrimary: document.getElementById('cpButtonPrimary').value,
            buttonSecondary: document.getElementById('cpButtonSecondary').value,
            bubbleBg: document.getElementById('cpBubbleBg').value,
            bubbleText: document.getElementById('cpBubbleText').value,
            avatarPrimary: document.getElementById('cpAvatarPrimary').value,
            avatarSecondary: document.getElementById('cpAvatarSecondary').value,
            title: document.getElementById('cpChatTitle').value,
            logoUrl: document.getElementById('cpLogoUrl').value
        };

        localStorage.setItem('chatbotPreferences', JSON.stringify(prefs));
        showChatbotToast('Preferências salvas com sucesso!');
    }

    function loadChatbotPreferences() {
        const saved = localStorage.getItem('chatbotPreferences');
        if (saved) {
            const prefs = JSON.parse(saved);

            document.getElementById('cpHeaderPrimary').value = prefs.headerPrimary || '#309086';
            document.getElementById('cpHeaderPrimaryHex').value = prefs.headerPrimary || '#309086';
            document.getElementById('cpHeaderSecondary').value = prefs.headerSecondary || '#26a69a';
            document.getElementById('cpHeaderSecondaryHex').value = prefs.headerSecondary || '#26a69a';
            document.getElementById('cpButtonPrimary').value = prefs.buttonPrimary || '#309086';
            document.getElementById('cpButtonPrimaryHex').value = prefs.buttonPrimary || '#309086';
            document.getElementById('cpButtonSecondary').value = prefs.buttonSecondary || '#1f6e66';
            document.getElementById('cpButtonSecondaryHex').value = prefs.buttonSecondary || '#1f6e66';
            document.getElementById('cpBubbleBg').value = prefs.bubbleBg || '#ffffff';
            document.getElementById('cpBubbleBgHex').value = prefs.bubbleBg || '#ffffff';
            document.getElementById('cpBubbleText').value = prefs.bubbleText || '#1f2937';
            document.getElementById('cpBubbleTextHex').value = prefs.bubbleText || '#1f2937';
            document.getElementById('cpAvatarPrimary').value = prefs.avatarPrimary || '#309086';
            document.getElementById('cpAvatarPrimaryHex').value = prefs.avatarPrimary || '#309086';
            document.getElementById('cpAvatarSecondary').value = prefs.avatarSecondary || '#26a69a';
            document.getElementById('cpAvatarSecondaryHex').value = prefs.avatarSecondary || '#26a69a';
            document.getElementById('cpChatTitle').value = prefs.title || 'Sunbotic Energia Solar';
            document.getElementById('cpLogoUrl').value = prefs.logoUrl || 'https://neureka-ai.com/wp-content/uploads/2025/02/2-1.png';
        }
    }

    function generateChatbotCode() {
        const config = {
            headerPrimary: document.getElementById('cpHeaderPrimary').value,
            headerSecondary: document.getElementById('cpHeaderSecondary').value,
            buttonPrimary: document.getElementById('cpButtonPrimary').value,
            buttonSecondary: document.getElementById('cpButtonSecondary').value,
            bubbleBg: document.getElementById('cpBubbleBg').value,
            bubbleText: document.getElementById('cpBubbleText').value,
            avatarPrimary: document.getElementById('cpAvatarPrimary').value,
            avatarSecondary: document.getElementById('cpAvatarSecondary').value,
            title: document.getElementById('cpChatTitle').value,
            logoUrl: document.getElementById('cpLogoUrl').value
        };

        const code = `<script>
window.ChatWidgetConfig = {
    branding: {
        name: '${config.title}',
        logo: '${config.logoUrl}'
    },
    style: {
        primaryColor: '${config.headerPrimary}',
        secondaryColor: '${config.headerSecondary}'
    },
    customStyles: {
        buttonPrimary: '${config.buttonPrimary}',
        buttonSecondary: '${config.buttonSecondary}',
        bubbleBackground: '${config.bubbleBg}',
        bubbleText: '${config.bubbleText}',
        avatarPrimary: '${config.avatarPrimary}',
        avatarSecondary: '${config.avatarSecondary}'
    }
};
<\/script>`;

        document.getElementById('cpGeneratedCode').textContent = code;
        document.getElementById('cpCodeSection').classList.add('visible');
        document.getElementById('cpCodeSection').scrollIntoView({ behavior: 'smooth' });
    }

    function copyChatbotCode() {
        const code = document.getElementById('cpGeneratedCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            document.getElementById('cpCopySuccess').style.display = 'block';
            setTimeout(() => {
                document.getElementById('cpCopySuccess').style.display = 'none';
            }, 2000);
        });
    }

    function showChatbotToast(message) {
        const toast = document.getElementById('chatbotPrefsToast');
        document.getElementById('chatbotPrefsToastMsg').textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Global functions
    window.openChatbotPreferences = function() {
        document.getElementById('chatbotPrefsPanel').classList.add('active');
        document.getElementById('chatbotPrefsOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        updateChatbotPreview();
    };

    window.closeChatbotPreferences = function() {
        document.getElementById('chatbotPrefsPanel').classList.remove('active');
        document.getElementById('chatbotPrefsOverlay').classList.remove('active');
        document.body.style.overflow = '';
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupChatbotPrefsPanel);
    } else {
        setupChatbotPrefsPanel();
    }
})();
