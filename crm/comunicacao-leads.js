console.log('🟢🟢🟢 comunicacao-leads.js CARREGANDO...');

// =========================================
// MÓDULO DE COMUNICAÇÃO COM LEADS
// WhatsApp, Áudio e Texto com Resumo IA
// =========================================

// Configuração OpenAI (será preenchida pelo usuário)
let OPENAI_API_KEY = localStorage.getItem('openai_api_key') || '';

// Configuração Twilio
let TWILIO_CONFIG = {
    supabaseUrl: localStorage.getItem('supabase_url') || '',
    supabaseKey: localStorage.getItem('supabase_anon_key') || ''
};

// Carregar config do Supabase se disponível
if (typeof supabase !== 'undefined' && supabase.supabaseUrl) {
    TWILIO_CONFIG.supabaseUrl = supabase.supabaseUrl;
    TWILIO_CONFIG.supabaseKey = supabase.supabaseKey;
}

// Estado do módulo
let comunicacaoState = {
    isOpen: false,
    selectedLead: null,
    conversationType: null, // 'whatsapp' ou 'text'
    messages: [],
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    conversationStartTime: null,
    pollInterval: null,
    lastMessageId: null,
    loadedMessageIds: new Set()
};

// Inicializar módulo de comunicação
function initComunicacaoModule() {
    console.log('🟢 Inicializando módulo de comunicação...');
    createFloatingButtons();
    console.log('🟢 Botões flutuantes criados');
    createLeadSelectorModal();
    console.log('🟢 Modal seletor de leads criado');
    createConversationModal();
    console.log('🟢 Modal de conversa criado');
    createConfigModal();
    console.log('🟢 Modal de config criado');
    console.log('🟢 Módulo de comunicação inicializado!');
}

// =========================================
// BOTÕES NO HEADER (não mais flutuantes)
// =========================================
function createFloatingButtons() {
    // Botões agora estão fixos no header do index.html
    // Esta função mantida apenas para não quebrar a inicialização
    console.log('🟢 Botões de comunicação estão no header HTML');
}

// =========================================
// MODAL DE SELEÇÃO DE LEAD
// =========================================
function createLeadSelectorModal() {
    const modal = document.createElement('div');
    modal.id = 'lead-selector-modal';
    modal.innerHTML = `
        <style>
            #lead-selector-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10001;
                align-items: center;
                justify-content: center;
            }

            #lead-selector-modal.visible {
                display: flex;
            }

            .lead-selector-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .lead-selector-header {
                padding: 20px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .lead-selector-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .lead-selector-header p {
                margin: 4px 0 0;
                font-size: 13px;
                opacity: 0.9;
            }

            .lead-selector-search {
                padding: 16px 24px;
                border-bottom: 1px solid #e5e7eb;
            }

            .lead-selector-search input {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }

            .lead-selector-search input:focus {
                border-color: #667eea;
            }

            .lead-selector-list {
                max-height: 400px;
                overflow-y: auto;
                padding: 8px;
            }

            .lead-selector-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .lead-selector-item:hover {
                background: #f3f4f6;
            }

            .lead-selector-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 16px;
            }

            .lead-selector-info {
                flex: 1;
            }

            .lead-selector-name {
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
            }

            .lead-selector-phone {
                color: #6b7280;
                font-size: 13px;
                margin-top: 2px;
            }

            .lead-selector-status {
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 500;
            }

            .status-novo { background: #dbeafe; color: #1d4ed8; }
            .status-qualificado { background: #dcfce7; color: #15803d; }
            .status-negociando { background: #fef3c7; color: #b45309; }

            .lead-selector-footer {
                padding: 16px 24px;
                border-top: 1px solid #e5e7eb;
                text-align: right;
            }

            .lead-selector-cancel {
                padding: 10px 20px;
                border: none;
                background: #f3f4f6;
                color: #4b5563;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            }

            .lead-selector-cancel:hover {
                background: #e5e7eb;
            }

            .lead-selector-empty {
                padding: 40px 20px;
                text-align: center;
                color: #6b7280;
            }
        </style>

        <div class="lead-selector-content">
            <div class="lead-selector-header">
                <h3 id="lead-selector-title">Selecionar Contato</h3>
                <p id="lead-selector-subtitle">Escolha um lead para iniciar a conversa</p>
            </div>

            <div class="lead-selector-search">
                <input type="text" id="lead-search-input" placeholder="Buscar por nome ou telefone..." oninput="comFilterLeads(this.value)">
            </div>

            <div class="lead-selector-list" id="lead-selector-list">
                <!-- Lista de leads será inserida aqui -->
            </div>

            <div class="lead-selector-footer">
                <button class="lead-selector-cancel" onclick="closeLeadSelector()">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// =========================================
// MODAL DE CONVERSA
// =========================================
function createConversationModal() {
    const modal = document.createElement('div');
    modal.id = 'conversation-modal';
    modal.innerHTML = `
        <style>
            #conversation-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10002;
                align-items: center;
                justify-content: center;
            }

            #conversation-modal.visible {
                display: flex;
            }

            .conversation-content {
                background: white;
                border-radius: 16px;
                width: 95%;
                max-width: 600px;
                height: 85vh;
                max-height: 700px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                animation: slideUp 0.3s ease;
            }

            .conversation-header {
                padding: 16px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .conversation-header-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 16px;
            }

            .conversation-header-info {
                flex: 1;
            }

            .conversation-header-name {
                font-weight: 600;
                font-size: 16px;
            }

            .conversation-header-phone {
                font-size: 13px;
                opacity: 0.9;
            }

            .conversation-header-close {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .conversation-header-close:hover {
                background: rgba(255,255,255,0.3);
            }

            .conversation-type-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
                color: #6b7280;
            }

            .conversation-type-indicator svg {
                width: 18px;
                height: 18px;
            }

            .conversation-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f3f4f6;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .conv-message {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 16px;
                font-size: 14px;
                line-height: 1.4;
                position: relative;
            }

            .conv-message-sent {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }

            .conv-message-received {
                background: white;
                color: #1f2937;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .conv-message-time {
                font-size: 10px;
                opacity: 0.7;
                margin-top: 4px;
                text-align: right;
            }

            .conv-message-audio {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .conv-message-audio audio {
                height: 36px;
            }

            .conversation-input-area {
                padding: 16px 20px;
                background: white;
                border-top: 1px solid #e5e7eb;
            }

            .conversation-input-row {
                display: flex;
                gap: 10px;
                align-items: flex-end;
            }

            .conversation-textarea {
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #e5e7eb;
                border-radius: 24px;
                font-size: 14px;
                resize: none;
                max-height: 100px;
                font-family: inherit;
                outline: none;
            }

            .conversation-textarea:focus {
                border-color: #667eea;
            }

            .conversation-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .conversation-btn svg {
                width: 20px;
                height: 20px;
            }

            .conversation-btn-send {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .conversation-btn-send svg {
                fill: white;
            }

            .conversation-btn-record {
                background: #ef4444;
            }

            .conversation-btn-record svg {
                fill: white;
            }

            .conversation-btn-record.recording {
                animation: pulse 1s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .conversation-btn-whatsapp {
                background: #25D366;
            }

            .conversation-btn-whatsapp svg {
                fill: white;
            }

            .conversation-actions {
                display: flex;
                gap: 10px;
                margin-top: 12px;
            }

            .conversation-action-btn {
                flex: 1;
                padding: 12px 16px;
                border: none;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s;
            }

            .conversation-action-btn svg {
                width: 18px;
                height: 18px;
            }

            .btn-finish {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }

            .btn-finish:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            }

            .btn-cancel-conv {
                background: #f3f4f6;
                color: #4b5563;
            }

            .btn-cancel-conv:hover {
                background: #e5e7eb;
            }

            .recording-indicator {
                display: none;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: #fef2f2;
                border-radius: 20px;
                color: #ef4444;
                font-size: 13px;
                margin-bottom: 10px;
            }

            .recording-indicator.visible {
                display: flex;
            }

            .recording-dot {
                width: 10px;
                height: 10px;
                background: #ef4444;
                border-radius: 50%;
                animation: blink 1s infinite;
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }

            .summary-section {
                display: none;
                padding: 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
            }

            .summary-section.visible {
                display: block;
            }

            .summary-title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .summary-textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                font-size: 14px;
                min-height: 80px;
                resize: vertical;
                font-family: inherit;
            }

            .summary-loading {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #6b7280;
                font-size: 13px;
            }

            .summary-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #e5e7eb;
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .contact-type-selector {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .contact-type-btn {
                flex: 1;
                padding: 10px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                background: white;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .contact-type-btn.selected {
                border-color: #667eea;
                background: #eef2ff;
                color: #667eea;
            }

            .contact-type-btn svg {
                width: 16px;
                height: 16px;
            }
        </style>

        <div class="conversation-content">
            <div class="conversation-header">
                <div class="conversation-header-avatar" id="conv-avatar">JD</div>
                <div class="conversation-header-info">
                    <div class="conversation-header-name" id="conv-name">João da Silva</div>
                    <div class="conversation-header-phone" id="conv-phone">(11) 99999-9999</div>
                </div>
                <button class="conversation-header-close" onclick="closeConversation()">×</button>
            </div>

            <div class="conversation-type-indicator" id="conv-type-indicator">
                <svg id="conv-type-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                <span id="conv-type-text">Conversa via WhatsApp</span>
            </div>

            <div class="conversation-messages" id="conv-messages">
                <!-- Mensagens serão inseridas aqui -->
            </div>

            <div class="summary-section" id="summary-section">
                <div class="summary-title">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#667eea">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    Resumo da Conversa (IA)
                </div>
                <div class="summary-loading" id="summary-loading">
                    <div class="summary-spinner"></div>
                    Gerando resumo com IA...
                </div>
                <textarea class="summary-textarea" id="summary-textarea" placeholder="O resumo da conversa aparecerá aqui..." style="display: none;"></textarea>

                <div class="contact-type-selector" id="contact-type-selector" style="display: none;">
                    <button class="contact-type-btn" data-type="ligacao" onclick="selectContactType('ligacao')">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        Ligação
                    </button>
                    <button class="contact-type-btn" data-type="audio" onclick="selectContactType('audio')">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
                        Áudio
                    </button>
                    <button class="contact-type-btn" data-type="texto" onclick="selectContactType('texto')">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                        Texto
                    </button>
                </div>
            </div>

            <div class="conversation-input-area">
                <div class="recording-indicator" id="recording-indicator">
                    <div class="recording-dot"></div>
                    <span>Gravando áudio...</span>
                    <span id="recording-time">00:00</span>
                </div>

                <div class="conversation-input-row">
                    <textarea class="conversation-textarea" id="conv-textarea" placeholder="Digite sua mensagem..." rows="1"></textarea>

                    <button class="conversation-btn conversation-btn-whatsapp" id="btn-whatsapp" onclick="sendViaWhatsApp()" title="Enviar via WhatsApp">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        </svg>
                    </button>
                </div>

                <div class="conversation-actions">
                    <button class="conversation-action-btn btn-cancel-conv" onclick="closeConversation()">
                        Cancelar
                    </button>
                    <button class="conversation-action-btn btn-finish" onclick="finishConversation()">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Finalizar Conversa
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// =========================================
// MODAL DE CONFIGURAÇÃO
// =========================================
function createConfigModal() {
    const modal = document.createElement('div');
    modal.id = 'config-modal';
    modal.innerHTML = `
        <style>
            #config-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10003;
                align-items: center;
                justify-content: center;
            }

            #config-modal.visible {
                display: flex;
            }

            .config-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 450px;
                padding: 24px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }

            .config-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .config-title svg {
                width: 24px;
                height: 24px;
                fill: #667eea;
            }

            .config-field {
                margin-bottom: 16px;
            }

            .config-label {
                display: block;
                font-size: 13px;
                color: #4b5563;
                margin-bottom: 6px;
                font-weight: 500;
            }

            .config-input {
                width: 100%;
                padding: 12px 14px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                font-size: 14px;
                font-family: monospace;
            }

            .config-input:focus {
                outline: none;
                border-color: #667eea;
            }

            .config-hint {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 4px;
            }

            .config-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }

            .config-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            }

            .config-btn-save {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .config-btn-cancel {
                background: #f3f4f6;
                color: #4b5563;
            }
        </style>

        <div class="config-content">
            <div class="config-title">
                <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                Configurações da API
            </div>

            <div class="config-field">
                <label class="config-label">Chave da API OpenAI</label>
                <input type="password" class="config-input" id="config-openai-key" placeholder="sk-...">
                <p class="config-hint">Necessária para gerar resumos automáticos das conversas</p>
            </div>

            <div class="config-actions">
                <button class="config-btn config-btn-cancel" onclick="closeConfigModal()">Cancelar</button>
                <button class="config-btn config-btn-save" onclick="saveConfig()">Salvar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// =========================================
// FUNÇÕES DE CONTROLE
// =========================================

function openLeadSelector(type) {
    console.log('🟢 openLeadSelector chamado com tipo:', type);
    comunicacaoState.conversationType = type;

    const modal = document.getElementById('lead-selector-modal');
    const title = document.getElementById('lead-selector-title');
    const subtitle = document.getElementById('lead-selector-subtitle');

    console.log('🟢 Modal encontrado:', !!modal);
    console.log('🟢 Title encontrado:', !!title);
    console.log('🟢 Subtitle encontrado:', !!subtitle);

    if (type === 'whatsapp') {
        title.textContent = 'Ligar via WhatsApp';
        subtitle.textContent = 'Selecione um lead para ligar ou enviar áudio';
    } else {
        title.textContent = 'Enviar Mensagem';
        subtitle.textContent = 'Selecione um lead para enviar mensagem de texto';
    }

    // Buscar leads e popular lista
    fetchAndPopulateLeads();
    modal.classList.add('visible');
}

// Buscar leads diretamente do Supabase
async function fetchAndPopulateLeads() {
    const list = document.getElementById('lead-selector-list');

    // Mostrar loading
    list.innerHTML = `
        <div class="lead-selector-empty">
            <p>Carregando leads...</p>
        </div>
    `;

    try {
        // Buscar leads do Supabase
        const { data: leadsData, error } = await supabase
            .from('leads')
            .select('*')
            .not('phone', 'is', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar leads:', error);
            list.innerHTML = `
                <div class="lead-selector-empty">
                    <p>Erro ao carregar leads</p>
                </div>
            `;
            return;
        }

        // Filtrar leads com telefone válido
        const leadsComTelefone = (leadsData || []).filter(lead => lead.phone && lead.phone.trim() !== '');

        console.log('Leads com telefone encontrados:', leadsComTelefone.length);

        if (leadsComTelefone.length === 0) {
            list.innerHTML = `
                <div class="lead-selector-empty">
                    <p>Nenhum lead com telefone cadastrado</p>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">Cadastre leads com telefone no CRM</p>
                </div>
            `;
            return;
        }

        // Armazenar leads para uso posterior
        comunicacaoState.leadsCache = leadsComTelefone;

        renderLeadList(leadsComTelefone);

    } catch (err) {
        console.error('Erro ao buscar leads:', err);
        list.innerHTML = `
            <div class="lead-selector-empty">
                <p>Erro ao carregar leads</p>
            </div>
        `;
    }
}

function renderLeadList(leadsToRender) {
    const list = document.getElementById('lead-selector-list');

    list.innerHTML = leadsToRender.map(lead => {
        const statusClass = getStatusClass(lead.status);
        const statusText = getStatusText(lead.status);

        // Usar função de ícone do crm.js se disponível
        let avatarHtml;
        if (typeof getLeadAvatarIcon === 'function') {
            const avatarInfo = getLeadAvatarIcon(lead);
            avatarHtml = `<div class="lead-selector-avatar" style="background: ${avatarInfo.bgColor}; overflow: hidden;" title="${avatarInfo.title}">${avatarInfo.svg}</div>`;
        } else {
            const initials = comGetInitials(lead.nome || lead.email || 'Lead');
            const avatarColor = comGetAvatarColor(lead.nome || lead.email || 'Lead');
            avatarHtml = `<div class="lead-selector-avatar" style="background: ${avatarColor}">${initials}</div>`;
        }

        return `
            <div class="lead-selector-item" onclick="selectLead('${lead.id}')">
                ${avatarHtml}
                <div class="lead-selector-info">
                    <div class="lead-selector-name">${lead.nome || lead.email || 'Lead sem nome'}</div>
                    <div class="lead-selector-phone">${lead.phone || 'Sem telefone'}</div>
                </div>
                <span class="lead-selector-status ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');
}

function closeLeadSelector() {
    document.getElementById('lead-selector-modal').classList.remove('visible');
    document.getElementById('lead-search-input').value = '';
}

function comFilterLeads(searchTerm) {
    const leadsCache = comunicacaoState.leadsCache || [];

    if (!searchTerm || searchTerm.trim() === '') {
        renderLeadList(leadsCache);
        return;
    }

    const filtered = leadsCache.filter(lead => {
        const nome = (lead.nome || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return nome.includes(term) || phone.includes(term) || email.includes(term);
    });

    if (filtered.length === 0) {
        const list = document.getElementById('lead-selector-list');
        list.innerHTML = `
            <div class="lead-selector-empty">
                <p>Nenhum lead encontrado para "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    renderLeadList(filtered);
}

function selectLead(leadId) {
    // Buscar do cache local
    const lead = (comunicacaoState.leadsCache || []).find(l => l.id === leadId);
    if (!lead) {
        console.error('Lead não encontrado:', leadId);
        return;
    }

    comunicacaoState.selectedLead = lead;
    comunicacaoState.messages = [];
    comunicacaoState.conversationStartTime = new Date();

    closeLeadSelector();
    openConversation();
}

// =========================================
// POLLING DE MENSAGENS WHATSAPP
// =========================================

// Buscar mensagens do banco de dados
async function fetchWhatsAppMessages() {
    const lead = comunicacaoState.selectedLead;
    if (!lead || !lead.phone) return;

    try {
        // Formatar telefone para busca
        let phone = lead.phone.replace(/[^\d+]/g, '');
        if (!phone.startsWith('+')) {
            if (phone.length === 11 || phone.length === 10) {
                phone = '+55' + phone;
            } else {
                phone = '+' + phone;
            }
        }

        // Buscar mensagens da tabela mensagens_whatsapp
        const { data: mensagens, error } = await supabase
            .from('mensagens_whatsapp')
            .select('*')
            .or(`telefone.eq.${phone},telefone.eq.${phone.replace('+', '')}`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao buscar mensagens:', error);
            return;
        }

        if (mensagens && mensagens.length > 0) {
            // Adicionar mensagens novas que ainda não foram exibidas
            mensagens.forEach(msg => {
                if (!comunicacaoState.loadedMessageIds.has(msg.id)) {
                    comunicacaoState.loadedMessageIds.add(msg.id);

                    const tipo = msg.direcao === 'recebida' ? 'received' : 'sent';
                    const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    addMessageToConversation(msg.mensagem, tipo, time);
                }
            });
        }
    } catch (err) {
        console.error('Erro no polling de mensagens:', err);
    }
}

// Iniciar polling de mensagens
function startMessagePolling() {
    // Parar polling anterior se existir
    stopMessagePolling();

    // Carregar mensagens existentes primeiro
    fetchWhatsAppMessages();

    // Iniciar polling a cada 3 segundos
    comunicacaoState.pollInterval = setInterval(() => {
        fetchWhatsAppMessages();
    }, 3000);

    console.log('🟢 Polling de mensagens iniciado');
}

// Parar polling de mensagens
function stopMessagePolling() {
    if (comunicacaoState.pollInterval) {
        clearInterval(comunicacaoState.pollInterval);
        comunicacaoState.pollInterval = null;
        console.log('🟢 Polling de mensagens parado');
    }
}

function openConversation() {
    const lead = comunicacaoState.selectedLead;
    if (!lead) return;

    const modal = document.getElementById('conversation-modal');
    const avatar = document.getElementById('conv-avatar');
    const name = document.getElementById('conv-name');
    const phone = document.getElementById('conv-phone');
    const typeIcon = document.getElementById('conv-type-icon');
    const typeText = document.getElementById('conv-type-text');
    const messages = document.getElementById('conv-messages');

    avatar.textContent = comGetInitials(lead.nome || lead.email || 'Lead');
    avatar.style.background = comGetAvatarColor(lead.nome || lead.email || 'Lead');
    name.textContent = lead.nome || lead.email || 'Lead sem nome';
    phone.textContent = lead.phone || 'Sem telefone';

    if (comunicacaoState.conversationType === 'whatsapp') {
        typeText.textContent = 'Conversa via WhatsApp';
        typeIcon.innerHTML = '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>';
    } else {
        typeText.textContent = 'Conversa via Mensagem de Texto';
        typeIcon.innerHTML = '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>';
    }

    messages.innerHTML = `
        <div class="conv-message conv-message-received">
            <div>Conversa iniciada com ${lead.nome || 'o lead'}</div>
            <div class="conv-message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;

    // Reset summary section
    document.getElementById('summary-section').classList.remove('visible');
    document.getElementById('summary-loading').style.display = 'flex';
    document.getElementById('summary-textarea').style.display = 'none';
    document.getElementById('contact-type-selector').style.display = 'none';

    modal.classList.add('visible');

    // Reset e iniciar polling de mensagens
    comunicacaoState.loadedMessageIds = new Set();
    startMessagePolling();
}

function closeConversation() {
    // Parar polling de mensagens
    stopMessagePolling();

    document.getElementById('conversation-modal').classList.remove('visible');
    comunicacaoState.selectedLead = null;
    comunicacaoState.messages = [];
    comunicacaoState.isRecording = false;
    comunicacaoState.loadedMessageIds = new Set();
    stopRecording();
}

function sendMessage() {
    const textarea = document.getElementById('conv-textarea');
    const text = textarea.value.trim();
    if (!text) return;

    addMessageToConversation(text, 'sent');
    comunicacaoState.messages.push({
        type: 'text',
        content: text,
        direction: 'sent',
        timestamp: new Date().toISOString()
    });

    textarea.value = '';
}

async function sendViaWhatsApp() {
    const textarea = document.getElementById('conv-textarea');
    const text = textarea.value.trim();
    const lead = comunicacaoState.selectedLead;

    if (!lead || !lead.phone) {
        alert('Lead não possui telefone cadastrado');
        return;
    }

    if (!text) {
        alert('Digite uma mensagem para enviar');
        return;
    }

    // Formatar número de telefone (remover caracteres especiais, manter +)
    let phone = lead.phone.replace(/[^\d+]/g, '');

    // Se não começar com +, adicionar
    if (!phone.startsWith('+')) {
        // Se for número brasileiro sem código do país
        if (phone.length === 11 || phone.length === 10) {
            phone = '+55' + phone;
        } else {
            phone = '+' + phone;
        }
    }

    // Mostrar loading
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const originalHTML = btnWhatsapp.innerHTML;
    btnWhatsapp.innerHTML = '<div class="summary-spinner" style="width:20px;height:20px;border-width:2px;"></div>';
    btnWhatsapp.disabled = true;

    try {
        // Obter URL do Supabase
        const supabaseUrl = window.supabaseUrl || 'https://zralzmgsdmwispfvgqvy.supabase.co';

        // Chamar Edge Function para enviar via Twilio
        const response = await fetch(`${supabaseUrl}/functions/v1/twilio-send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.supabaseAnonKey || ''}`
            },
            body: JSON.stringify({
                to: phone,
                message: text,
                lead_id: lead.id
            })
        });

        const result = await response.json();

        if (result.success) {
            addMessageToConversation(text, 'sent');
            comunicacaoState.messages.push({
                type: 'whatsapp',
                content: text,
                direction: 'sent',
                timestamp: new Date().toISOString()
            });
            textarea.value = '';

            if (typeof showNotification === 'function') {
                showNotification('Mensagem enviada via WhatsApp!', 'success');
            }
        } else {
            throw new Error(result.error || 'Erro ao enviar mensagem');
        }
    } catch (err) {
        console.error('Erro ao enviar via Twilio:', err);

        // Fallback: abrir WhatsApp Web
        const fallback = confirm(`Erro ao enviar via API: ${err.message}\n\nDeseja abrir o WhatsApp Web para enviar manualmente?`);
        if (fallback) {
            const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank');

            addMessageToConversation(text + ' (enviado manualmente)', 'sent');
            comunicacaoState.messages.push({
                type: 'whatsapp',
                content: text,
                direction: 'sent',
                timestamp: new Date().toISOString()
            });
            textarea.value = '';
        }
    } finally {
        btnWhatsapp.innerHTML = originalHTML;
        btnWhatsapp.disabled = false;
    }
}

function addMessageToConversation(content, direction, timeOrAudio = false) {
    const messages = document.getElementById('conv-messages');

    // Se timeOrAudio for string, usa como tempo; se for boolean true, é áudio
    const isAudio = timeOrAudio === true;
    const time = typeof timeOrAudio === 'string'
        ? timeOrAudio
        : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const messageDiv = document.createElement('div');
    messageDiv.className = `conv-message conv-message-${direction}`;

    if (isAudio) {
        messageDiv.innerHTML = `
            <div class="conv-message-audio">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                </svg>
                <span>Áudio gravado</span>
            </div>
            <div class="conv-message-time">${time}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div>${content}</div>
            <div class="conv-message-time">${time}</div>
        `;
    }

    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// =========================================
// GRAVAÇÃO DE ÁUDIO
// =========================================
let recordingTimer = null;
let recordingSeconds = 0;

async function toggleRecording() {
    if (comunicacaoState.isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        comunicacaoState.mediaRecorder = new MediaRecorder(stream);
        comunicacaoState.audioChunks = [];

        comunicacaoState.mediaRecorder.ondataavailable = (event) => {
            comunicacaoState.audioChunks.push(event.data);
        };

        comunicacaoState.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(comunicacaoState.audioChunks, { type: 'audio/webm' });
            handleRecordedAudio(audioBlob);
        };

        comunicacaoState.mediaRecorder.start();
        comunicacaoState.isRecording = true;

        document.getElementById('btn-record').classList.add('recording');
        document.getElementById('recording-indicator').classList.add('visible');

        recordingSeconds = 0;
        recordingTimer = setInterval(() => {
            recordingSeconds++;
            const mins = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
            const secs = (recordingSeconds % 60).toString().padStart(2, '0');
            document.getElementById('recording-time').textContent = `${mins}:${secs}`;
        }, 1000);

    } catch (err) {
        console.error('Erro ao acessar microfone:', err);
        alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
}

function stopRecording() {
    if (comunicacaoState.mediaRecorder && comunicacaoState.isRecording) {
        comunicacaoState.mediaRecorder.stop();
        comunicacaoState.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    comunicacaoState.isRecording = false;
    document.getElementById('btn-record').classList.remove('recording');
    document.getElementById('recording-indicator').classList.remove('visible');

    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

function handleRecordedAudio(audioBlob) {
    // Adicionar mensagem de áudio à conversa
    addMessageToConversation('Áudio gravado', 'sent', true);

    comunicacaoState.messages.push({
        type: 'audio',
        content: 'Áudio gravado',
        audioBlob: audioBlob,
        direction: 'sent',
        timestamp: new Date().toISOString()
    });

    // Abrir WhatsApp para enviar (usuário precisará anexar o áudio manualmente)
    const lead = comunicacaoState.selectedLead;
    if (lead && lead.phone) {
        let phone = lead.phone.replace(/\D/g, '');
        if (!phone.startsWith('55')) phone = '55' + phone;

        // Download do áudio para o usuário poder enviar
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio_${Date.now()}.webm`;
        a.click();

        // Abrir WhatsApp
        setTimeout(() => {
            window.open(`https://wa.me/${phone}`, '_blank');
        }, 500);
    }
}

// =========================================
// FINALIZAR CONVERSA
// =========================================
let selectedContactType = 'texto';

function selectContactType(type) {
    selectedContactType = type;
    document.querySelectorAll('.contact-type-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.type === type);
    });
}

async function finishConversation() {
    const summarySection = document.getElementById('summary-section');
    summarySection.classList.add('visible');

    // Gerar resumo com IA
    await generateSummary();
}

async function generateSummary() {
    const loadingEl = document.getElementById('summary-loading');
    const textareaEl = document.getElementById('summary-textarea');
    const typeSelector = document.getElementById('contact-type-selector');

    loadingEl.style.display = 'flex';
    textareaEl.style.display = 'none';
    typeSelector.style.display = 'none';

    // Preparar contexto da conversa
    const lead = comunicacaoState.selectedLead;
    const messages = comunicacaoState.messages;

    const conversationText = messages.map(m => {
        const prefix = m.direction === 'sent' ? 'Vendedor' : 'Cliente';
        return `${prefix}: ${m.content}`;
    }).join('\n');

    const prompt = `Você é um assistente que resume conversas de vendas de energia solar.
Analise a conversa abaixo e gere um resumo conciso (2-3 frases) com os pontos mais importantes.

REGRAS IMPORTANTES:
- Baseie-se APENAS no que foi dito na conversa
- NÃO invente informações que não existem na conversa
- Se a conversa tiver poucas mensagens ou só saudações, diga apenas: "Contato inicial realizado. Aguardando continuidade da conversa."
- Foque em: interesse do cliente, próximos passos, objeções ou dúvidas mencionadas

Cliente: ${lead?.nome || 'Lead'}
Telefone: ${lead?.phone || 'N/A'}

Conversa:
${conversationText || 'Sem mensagens registradas'}

${messages.length <= 2 ? 'ATENÇÃO: Esta conversa tem poucas mensagens. Seja objetivo e não invente detalhes.' : ''}

Gere apenas o resumo, sem explicações adicionais.`;

    try {
        if (!OPENAI_API_KEY) {
            throw new Error('API Key não configurada');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            textareaEl.value = data.choices[0].message.content;
        } else {
            throw new Error('Resposta inválida da API');
        }
    } catch (err) {
        console.error('Erro ao gerar resumo:', err);
        textareaEl.value = `Conversa realizada com ${lead?.nome || 'o lead'} em ${new Date().toLocaleDateString('pt-BR')}. ${messages.length} mensagens trocadas.`;

        if (!OPENAI_API_KEY) {
            textareaEl.value += '\n\n(Configure a chave da API OpenAI para resumos automáticos)';
        }
    }

    loadingEl.style.display = 'none';
    textareaEl.style.display = 'block';
    typeSelector.style.display = 'flex';

    // Selecionar tipo padrão baseado na conversa
    if (comunicacaoState.conversationType === 'whatsapp') {
        selectContactType('audio');
    } else {
        selectContactType('texto');
    }
}

async function saveConversationToSupabase() {
    const lead = comunicacaoState.selectedLead;
    const summary = document.getElementById('summary-textarea').value;

    if (!lead) return;

    try {
        // Salvar interação no Supabase
        const interacao = {
            lead_id: lead.id,
            tipo: selectedContactType === 'ligacao' ? 'ligacao' :
                  selectedContactType === 'audio' ? 'whatsapp' : 'mensagem',
            descricao: summary,
            data_interacao: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('interacoes')
            .insert([interacao]);

        if (error) throw error;

        // Mostrar notificação de sucesso
        if (typeof showNotification === 'function') {
            showNotification('Conversa salva com sucesso!', 'success');
        } else {
            alert('Conversa salva com sucesso!');
        }

        // Recarregar dados do CRM
        if (typeof loadAllData === 'function') {
            await loadAllData();
        }

        closeConversation();

    } catch (err) {
        console.error('Erro ao salvar conversa:', err);
        alert('Erro ao salvar conversa. Tente novamente.');
    }
}

// Sobrescrever finishConversation para salvar
const originalFinishConversation = finishConversation;
finishConversation = async function() {
    await originalFinishConversation();

    // Adicionar botão de salvar após o resumo
    const summarySection = document.getElementById('summary-section');

    // Remover botão existente se houver
    const existingBtn = summarySection.querySelector('.btn-save-summary');
    if (existingBtn) existingBtn.remove();

    const saveBtn = document.createElement('button');
    saveBtn.className = 'conversation-action-btn btn-finish btn-save-summary';
    saveBtn.style.marginTop = '12px';
    saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        Salvar no CRM
    `;
    saveBtn.onclick = saveConversationToSupabase;
    summarySection.appendChild(saveBtn);
};

// =========================================
// CONFIGURAÇÕES
// =========================================
function openConfigModal() {
    const modal = document.getElementById('config-modal');
    const input = document.getElementById('config-openai-key');
    input.value = OPENAI_API_KEY || '';
    modal.classList.add('visible');
}

function closeConfigModal() {
    document.getElementById('config-modal').classList.remove('visible');
}

function saveConfig() {
    const key = document.getElementById('config-openai-key').value.trim();
    OPENAI_API_KEY = key;
    localStorage.setItem('openai_api_key', key);
    closeConfigModal();

    if (typeof showNotification === 'function') {
        showNotification('Configurações salvas!', 'success');
    } else {
        alert('Configurações salvas!');
    }
}

// =========================================
// UTILITÁRIOS
// =========================================

// Cores pastel bonitas para avatares (prefixo com_ para evitar conflito com crm.js)
const comAvatarColors = [
    'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)', // Índigo suave
    'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)', // Violeta suave
    'linear-gradient(135deg, #f0abfc 0%, #e879f9 100%)', // Fúcsia suave
    'linear-gradient(135deg, #fda4af 0%, #fb7185 100%)', // Rosa suave
    'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)', // Âmbar suave
    'linear-gradient(135deg, #86efac 0%, #4ade80 100%)', // Verde suave
    'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', // Teal suave
    'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)', // Azul céu suave
    'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)', // Azul suave
    'linear-gradient(135deg, #fdba74 0%, #fb923c 100%)', // Laranja suave
];

function comGetAvatarColor(name) {
    if (!name) return comAvatarColors[0];
    const charCode = name.charCodeAt(0);
    return comAvatarColors[charCode % comAvatarColors.length];
}

function comGetInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function getStatusClass(status) {
    switch (status) {
        case 'novo': return 'status-novo';
        case 'qualificado': return 'status-qualificado';
        case 'negociando': return 'status-negociando';
        default: return 'status-novo';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'novo': return 'Novo';
        case 'qualificado': return 'Qualificado';
        case 'negociando': return 'Negociando';
        case 'perdido': return 'Perdido';
        default: return 'Novo';
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComunicacaoModule);
} else {
    initComunicacaoModule();
}

// Exportar para uso global IMEDIATAMENTE após inicialização
window.comunicacaoState = comunicacaoState;
window.openConversation = openConversation;
window.closeConversation = closeConversation;
window.openLeadSelector = openLeadSelector;
window.closeLeadSelector = closeLeadSelector;
window.selectLead = selectLead;
window.openConfigModal = openConfigModal;
console.log('🟢 Módulo de comunicação exportado para window');

// =========================================
// FUNÇÃO PARA ADICIONAR LEAD DE TESTE
// =========================================
async function addTestLead() {
    try {
        const testLead = {
            nome: 'Thiago RS Pastro',
            email: 'thiago.pastro@test.com',
            phone: '+49 1799044322',
            status: 'novo',
            origem: 'teste',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('leads')
            .insert([testLead])
            .select();

        if (error) {
            console.error('Erro ao adicionar lead de teste:', error);
            alert('Erro ao adicionar lead: ' + error.message);
            return;
        }

        console.log('Lead de teste adicionado:', data);
        alert('Lead de teste "Thiago RS Pastro" adicionado com sucesso!');

        // Recarregar dados do CRM se disponível
        if (typeof loadAllData === 'function') {
            await loadAllData();
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao adicionar lead de teste');
    }
}

// Executar automaticamente ao carregar (apenas uma vez)
(async function() {
    try {
        // Verificar se o lead já existe
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', '+49 1799044322')
            .single();

        if (!existingLead) {
            console.log('Adicionando lead de teste...');
            await addTestLead();
        } else {
            console.log('Lead de teste já existe');
        }
    } catch (err) {
        console.log('Verificação de lead de teste ignorada:', err.message);
    }
})();
