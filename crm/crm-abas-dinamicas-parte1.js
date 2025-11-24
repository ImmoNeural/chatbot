// =========================================
// SISTEMA DE ABAS DINÂMICAS POR ESTÁGIO
// =========================================
// Adicione este código ao crm.js após a função openLeadModal existente

// Variável global para armazenar o estágio atual
let currentStage = null;

// Função modificada: openLeadModal
async function openLeadModalNova(leadId) {
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

// Configurar quais abas mostrar baseado no estágio
function configurarAbasDinamicas(etapa) {
    const tabButton = document.getElementById('tab-btn-dynamic');

    const configAbas = {
        'levantamento': {
            label: 'Documentos',
            icon: 'fa-folder'
        },
        'simulacao': {
            label: 'Qualificação',
            icon: 'fa-check-circle'
        },
        'proposta': {
            label: 'Resumo Proposta',
            icon: 'fa-file-invoice'
        },
        'negociacao': {
            label: 'Status',
            icon: 'fa-handshake'
        },
        'fechamento': {
            label: 'Instalação',
            icon: 'fa-tools'
        }
    };

    const config = configAbas[etapa] || configAbas['simulacao'];
    tabButton.innerHTML = `<i class="fas ${config.icon} mr-2"></i>${config.label}`;
}

// Renderizar conteúdo dinâmico baseado no estágio
async function renderConteudoDinamico(leadId, etapa) {
    switch(etapa) {
        case 'levantamento':
            await renderDocumentos(leadId);
            break;
        case 'simulacao':
            await renderQualificacaoComSimulador(leadId);
            break;
        case 'proposta':
            await renderResumoProposta(leadId);
            break;
        case 'negociacao':
            await renderStatusNegociacao(leadId);
            break;
        case 'fechamento':
            await renderInstalacao(leadId);
            break;
        default:
            await renderLeadQualificacao(leadId);
    }
}

// =========================================
// LEVANTAMENTO: Documentos
// =========================================
async function renderDocumentos(leadId) {
    const container = document.getElementById('qualificacao-content');

    // Buscar documentos existentes
    const { data: documentos } = await supabase
        .from('documentos')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Upload de Documentos</h3>
                </div>
                <p class="text-sm text-gray-600 mb-4">Faça upload de fotos do telhado, conta de luz, documentos do imóvel, etc.</p>

                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
                        <select id="tipo-documento" class="w-full border rounded px-3 py-2">
                            <option value="foto_telhado">Foto do Telhado</option>
                            <option value="foto_estrutura">Foto da Estrutura</option>
                            <option value="conta_luz">Conta de Luz</option>
                            <option value="documento_imovel">Documento do Imóvel</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Arquivo</label>
                        <input type="file" id="arquivo-upload" accept="image/*,.pdf"
                               class="w-full border rounded px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                        <textarea id="obs-documento" rows="2"
                                  class="w-full border rounded px-3 py-2"
                                  placeholder="Informações adicionais sobre o documento..."></textarea>
                    </div>
                    <button onclick="uploadDocumento('${leadId}')"
                            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition">
                        <i class="fas fa-upload mr-2"></i>Fazer Upload
                    </button>
                </div>
            </div>

            <!-- Lista de Documentos -->
            <div>
                <h4 class="font-bold text-gray-800 mb-3">Documentos Enviados</h4>
                <div class="space-y-2">
                    ${(documentos || []).map(doc => `
                        <div class="bg-white border rounded-lg p-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-file-${doc.mime_type?.includes('pdf') ? 'pdf' : 'image'} text-2xl text-gray-600"></i>
                                <div>
                                    <p class="font-semibold">${doc.nome_arquivo}</p>
                                    <p class="text-sm text-gray-500">${formatTipo(doc.tipo)} • ${formatDate(doc.created_at)}</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <a href="${doc.url_arquivo}" target="_blank"
                                   class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600">
                                    <i class="fas fa-eye"></i>
                                </a>
                                <button onclick="deletarDocumento('${doc.id}', '${leadId}')"
                                        class="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-center py-8">Nenhum documento enviado ainda</p>'}
                </div>
            </div>
        </div>
    `;
}

async function uploadDocumento(leadId) {
    const tipoSelect = document.getElementById('tipo-documento');
    const arquivoInput = document.getElementById('arquivo-upload');
    const obsTextarea = document.getElementById('obs-documento');

    if (!arquivoInput.files.length) {
        showNotification('Selecione um arquivo', 'warning');
        return;
    }

    const arquivo = arquivoInput.files[0];
    const tipo = tipoSelect.value;
    const observacoes = obsTextarea.value;

    try {
        // Upload para Supabase Storage (simulado - você precisará configurar o storage)
        // Por enquanto, vamos salvar apenas o registro sem o arquivo real
        const { error } = await supabase
            .from('documentos')
            .insert([{
                lead_id: leadId,
                tipo: tipo,
                nome_arquivo: arquivo.name,
                url_arquivo: `#documento-${Date.now()}`, // Placeholder
                tamanho_bytes: arquivo.size,
                mime_type: arquivo.type,
                observacoes: observacoes
            }]);

        if (error) throw error;

        // Registrar na timeline
        await supabase.from('interacoes').insert([{
            lead_id: leadId,
            tipo: 'upload',
            titulo: 'Documento Enviado',
            descricao: `${formatTipo(tipo)}: ${arquivo.name}`
        }]);

        showNotification('Documento enviado com sucesso!', 'success');
        await renderDocumentos(leadId);
        await renderLeadTimeline(leadId);
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        showNotification('Erro ao enviar documento', 'danger');
    }
}

async function deletarDocumento(docId, leadId) {
    if (!confirm('Deseja realmente deletar este documento?')) return;

    try {
        const { error } = await supabase
            .from('documentos')
            .delete()
            .eq('id', docId);

        if (error) throw error;

        showNotification('Documento deletado', 'success');
        await renderDocumentos(leadId);
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showNotification('Erro ao deletar documento', 'danger');
    }
}

// =========================================
// SIMULAÇÃO: Qualificação + Botão Calcular
// =========================================
async function renderQualificacaoComSimulador(leadId) {
    // Renderizar qualificação normal
    await renderLeadQualificacao(leadId);

    // Adicionar botão de calcular no topo
    const container = document.getElementById('qualificacao-content');
    const botaoCalcular = `
        <div class="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <button onclick="abrirSimuladorSolar()"
                    class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg">
                <i class="fas fa-solar-panel mr-2"></i>Calcular Sistema Solar
            </button>
            <p class="text-sm text-gray-600 text-center mt-2">
                Preencha a qualificação acima e depois calcule o sistema
            </p>
        </div>
    `;
    container.innerHTML = botaoCalcular + container.innerHTML;
}

// Continua no próximo arquivo...
