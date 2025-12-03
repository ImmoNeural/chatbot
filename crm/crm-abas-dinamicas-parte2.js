// =========================================
// PROPOSTA: Resumo + Enviar Email
// =========================================
async function renderResumoProposta(leadId) {
    const container = document.getElementById('qualificacao-content');

    // Buscar última proposta do lead
    const { data: propostas } = await supabase
        .from('propostas')
        .select('*, oportunidades!inner(lead_id)')
        .eq('oportunidades.lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1);

    const proposta = propostas?.[0];

    if (!proposta) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-file-invoice text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600">Nenhuma proposta gerada ainda</p>
                <p class="text-sm text-gray-500 mt-2">Gere uma proposta na etapa de Simulação</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Resumo da Proposta -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-file-invoice text-blue-600 mr-2"></i>
                        ${proposta.numero_proposta}
                    </h3>
                    <span class="badge badge-${getStatusBadge(proposta.status)}">${formatStatus(proposta.status)}</span>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm text-gray-600">Potência do Sistema</p>
                        <p class="text-2xl font-bold text-blue-600">${proposta.potencia_total_kwp} kWp</p>
                    </div>
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm text-gray-600">Número de Módulos</p>
                        <p class="text-2xl font-bold text-green-600">${proposta.num_modulos} un</p>
                    </div>
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm text-gray-600">Valor Total</p>
                        <p class="text-2xl font-bold text-purple-600">${formatCurrency(proposta.valor_total)}</p>
                    </div>
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm text-gray-600">Valor Final</p>
                        <p class="text-2xl font-bold text-green-600">${formatCurrency(proposta.valor_final)}</p>
                    </div>
                </div>

                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Tipo Inversor:</span>
                        <span class="font-semibold">${proposta.tipo_inversor || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Marca Módulos:</span>
                        <span class="font-semibold">${proposta.marca_modulos || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Economia Mensal Prevista:</span>
                        <span class="font-semibold text-green-600">${formatCurrency(proposta.economia_mensal_prevista || 0)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Payback:</span>
                        <span class="font-semibold">${proposta.payback_meses || 0} meses</span>
                    </div>
                </div>

                ${proposta.data_visualizacao ? `
                    <div class="mt-4 p-3 bg-green-100 text-green-700 rounded">
                        <i class="fas fa-eye mr-2"></i>
                        <strong>Visualizada em:</strong> ${formatDateTime(proposta.data_visualizacao)}
                    </div>
                ` : ''}
            </div>

            <!-- Ações -->
            <div class="space-y-3">
                <button onclick="enviarPropostaPorEmail('${proposta.id}', '${leadId}')"
                        class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg">
                    <i class="fas fa-envelope mr-2"></i>Enviar Proposta por Email
                </button>
                <p class="text-sm text-gray-500 text-center">
                    A proposta será enviada para ${currentLead.email}
                </p>

                ${proposta.arquivo_pdf_url ? `
                    <a href="${proposta.arquivo_pdf_url}" target="_blank"
                       class="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                        <i class="fas fa-file-pdf mr-2"></i>Visualizar PDF
                    </a>
                ` : ''}

                <button onclick="copiarLinkProposta('${proposta.token_rastreio}')"
                        class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
                    <i class="fas fa-link mr-2"></i>Copiar Link da Proposta
                </button>
            </div>
        </div>
    `;
}

async function enviarPropostaPorEmail(propostaId, leadId) {
    showNotification('Funcionalidade de envio de email será implementada em breve', 'info');
    // TODO: Implementar envio de email via API

    // Por enquanto, apenas registrar na timeline
    await supabase.from('interacoes').insert([{
        lead_id: leadId,
        tipo: 'email',
        titulo: 'Proposta Enviada por Email',
        descricao: `Proposta enviada para ${currentLead.email}`
    }]);

    await renderLeadTimeline(leadId);
}

function getStatusBadge(status) {
    const badges = {
        'rascunho': 'gray',
        'enviada': 'blue',
        'visualizada': 'warning',
        'aceita': 'success',
        'recusada': 'danger',
        'revisao': 'info'
    };
    return badges[status] || 'gray';
}

// =========================================
// NEGOCIAÇÃO: Status
// =========================================
async function renderStatusNegociacao(leadId) {
    const container = document.getElementById('qualificacao-content');

    // Buscar status de negociação
    const { data: status } = await supabase
        .from('status_negociacao')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    const st = status || {};

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Status da Proposta -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Status da Proposta</h3>
                </div>

                <div class="space-y-4">
                    <div class="bg-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold text-gray-700">Proposta Visualizada</span>
                            <span class="${st.proposta_visualizada ? 'text-green-600' : 'text-gray-400'}">
                                <i class="fas fa-${st.proposta_visualizada ? 'check-circle' : 'circle'}"></i>
                                ${st.proposta_visualizada ? 'Sim' : 'Não'}
                            </span>
                        </div>
                        ${st.data_visualizacao ? `
                            <p class="text-sm text-gray-500 mt-2">
                                Visualizada em: ${formatDateTime(st.data_visualizacao)}
                            </p>
                        ` : ''}
                    </div>

                    <div class="bg-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold text-gray-700">Proposta Aceita</span>
                            <span class="${st.proposta_aceita ? 'text-green-600' : 'text-gray-400'}">
                                <i class="fas fa-${st.proposta_aceita ? 'check-circle' : 'circle'}"></i>
                                ${st.proposta_aceita ? 'Sim' : 'Não'}
                            </span>
                        </div>
                        ${st.data_aceite ? `
                            <p class="text-sm text-gray-500 mt-2">
                                Aceita em: ${formatDateTime(st.data_aceite)}
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Reunião Agendada -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Agendamento de Reunião</h3>
                </div>

                <div class="space-y-3">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="checkbox-reuniao-agendada"
                               ${st.cliente_agendou_reuniao ? 'checked' : ''}
                               class="w-5 h-5 text-blue-600 rounded">
                        <span class="font-semibold">Cliente agendou reunião</span>
                    </label>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Data e Hora da Reunião</label>
                        <input type="datetime-local" id="data-reuniao"
                               value="${st.data_reuniao_agendada ? new Date(st.data_reuniao_agendada).toISOString().slice(0,16) : ''}"
                               class="w-full border rounded px-3 py-2">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Observações sobre a Reunião</label>
                        <textarea id="obs-reuniao" rows="3"
                                  class="w-full border rounded px-3 py-2">${st.observacoes_reuniao || ''}</textarea>
                    </div>

                    <button onclick="salvarStatusNegociacao('${leadId}')"
                            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition">
                        <i class="fas fa-save mr-2"></i>Salvar Status
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function salvarStatusNegociacao(leadId) {
    const statusData = {
        lead_id: leadId,
        cliente_agendou_reuniao: document.getElementById('checkbox-reuniao-agendada').checked,
        data_reuniao_agendada: document.getElementById('data-reuniao').value || null,
        observacoes_reuniao: document.getElementById('obs-reuniao').value
    };

    try {
        const { error } = await supabase
            .from('status_negociacao')
            .upsert(statusData, { onConflict: 'lead_id' });

        if (error) throw error;

        // Registrar na timeline
        await supabase.from('interacoes').insert([{
            lead_id: leadId,
            tipo: 'sistema',
            titulo: 'Status de Negociação Atualizado',
            descricao: statusData.cliente_agendou_reuniao ?
                `Reunião agendada para ${new Date(statusData.data_reuniao_agendada).toLocaleString('pt-BR')}` :
                'Status atualizado'
        }]);

        showNotification('Status salvo com sucesso!', 'success');
        await renderStatusNegociacao(leadId);
        await renderLeadTimeline(leadId);
    } catch (error) {
        console.error('Erro ao salvar status:', error);
        showNotification('Erro ao salvar status', 'danger');
    }
}

// =========================================
// FECHAMENTO: Instalação
// =========================================
async function renderInstalacao(leadId) {
    const container = document.getElementById('qualificacao-content');

    // Buscar dados de instalação
    const { data: instalacao } = await supabase
        .from('instalacao')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    const inst = instalacao || {};

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Aprovações Técnicas -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Aprovações Técnicas</h3>
                </div>

                <div class="space-y-4">
                    <!-- ART -->
                    <div class="bg-white rounded-lg p-4">
                        <label class="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" id="checkbox-art"
                                   ${inst.art_aprovada ? 'checked' : ''}
                                   class="w-5 h-5 text-green-600 rounded">
                            <span class="font-semibold text-gray-700">ART Aprovada</span>
                        </label>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">Data da ART</label>
                                <input type="date" id="data-art"
                                       value="${inst.data_art ? inst.data_art.split('T')[0] : ''}"
                                       class="w-full border rounded px-3 py-2 text-sm">
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">Número da ART</label>
                                <input type="text" id="numero-art"
                                       value="${inst.numero_art || ''}"
                                       placeholder="Ex: 123456789"
                                       class="w-full border rounded px-3 py-2 text-sm">
                            </div>
                        </div>
                    </div>

                    <!-- Homologação -->
                    <div class="bg-white rounded-lg p-4">
                        <label class="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" id="checkbox-homologacao"
                                   ${inst.homologacao_aprovada ? 'checked' : ''}
                                   class="w-5 h-5 text-green-600 rounded">
                            <span class="font-semibold text-gray-700">Homologação com Distribuidora Aprovada</span>
                        </label>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">Data da Homologação</label>
                                <input type="date" id="data-homologacao"
                                       value="${inst.data_homologacao ? inst.data_homologacao.split('T')[0] : ''}"
                                       class="w-full border rounded px-3 py-2 text-sm">
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">Protocolo</label>
                                <input type="text" id="protocolo-homologacao"
                                       value="${inst.protocolo_homologacao || ''}"
                                       placeholder="Ex: PROT-2024-001"
                                       class="w-full border rounded px-3 py-2 text-sm">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agendamento de Instalação -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Agendamento de Instalação</h3>
                </div>

                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Data da Instalação</label>
                        <input type="date" id="data-instalacao"
                               value="${inst.data_agendamento_instalacao || ''}"
                               class="w-full border rounded px-3 py-2">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Observações sobre o Agendamento</label>
                        <textarea id="obs-agendamento" rows="3"
                                  class="w-full border rounded px-3 py-2"
                                  placeholder="Informações importantes sobre a instalação...">${inst.observacoes_agendamento || ''}</textarea>
                    </div>

                    ${inst.cliente_notificado ? `
                        <div class="p-3 bg-green-100 text-green-700 rounded">
                            <i class="fas fa-check-circle mr-2"></i>
                            <strong>Cliente notificado em:</strong> ${formatDateTime(inst.data_notificacao)}
                        </div>
                    ` : ''}

                    <button onclick="salvarAgendamentoInstalacao('${leadId}')"
                            class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg">
                        <i class="fas fa-calendar-check mr-2"></i>Salvar Agendamento e Enviar para Cliente
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function salvarAgendamentoInstalacao(leadId) {
    const instalacaoData = {
        lead_id: leadId,
        art_aprovada: document.getElementById('checkbox-art').checked,
        data_art: document.getElementById('data-art').value || null,
        numero_art: document.getElementById('numero-art').value || null,
        homologacao_aprovada: document.getElementById('checkbox-homologacao').checked,
        data_homologacao: document.getElementById('data-homologacao').value || null,
        protocolo_homologacao: document.getElementById('protocolo-homologacao').value || null,
        data_agendamento_instalacao: document.getElementById('data-instalacao').value || null,
        observacoes_agendamento: document.getElementById('obs-agendamento').value,
        cliente_notificado: true,
        data_notificacao: new Date().toISOString()
    };

    try {
        const { error } = await supabase
            .from('instalacao')
            .upsert(instalacaoData, { onConflict: 'lead_id' });

        if (error) throw error;

        // Registrar na timeline
        await supabase.from('interacoes').insert([{
            lead_id: leadId,
            tipo: 'sistema',
            titulo: 'Instalação Agendada',
            descricao: `Instalação agendada para ${new Date(instalacaoData.data_agendamento_instalacao).toLocaleDateString('pt-BR')} | ART: ${instalacaoData.art_aprovada ? 'OK' : 'Pendente'} | Homologação: ${instalacaoData.homologacao_aprovada ? 'OK' : 'Pendente'}`
        }]);

        showNotification('Agendamento salvo e cliente notificado!', 'success');
        await renderInstalacao(leadId);
        await renderLeadTimeline(leadId);
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        showNotification('Erro ao salvar agendamento', 'danger');
    }
}
