// =========================================
// CRM ENERGIA SOLAR - JavaScript Principal
// =========================================

// Configuração Supabase
const SUPABASE_URL = 'https://zralzmgsdmwispfvgqvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYWx6bWdzZG13aXNwZnZncXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzA1NTYsImV4cCI6MjA3OTQwNjU1Nn0.lAarNVapj0c6A-1ix6PISUya0wMcRzruta1GECtwDD8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado Global
let currentModule = 'dashboard';
let currentLead = null;
let leads = [];
let oportunidades = [];
let propostas = [];
let instalados = [];
let tarefas = [];
let kpis = {};

// Charts
let funnelChart = null;
let conversionChart = null;

// =========================================
// INICIALIZAÇÃO
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando CRM Solar...');

    // Verificar conexão Supabase
    try {
        const { data, error } = await supabase.from('leads').select('count');
        if (error) {
            console.error('Erro ao conectar Supabase:', error);
            showNotification('Erro ao conectar com o banco de dados', 'danger');
        } else {
            console.log('✅ Supabase conectado!');
        }
    } catch (err) {
        console.error('Erro crítico:', err);
    }

    // Carregar dados iniciais
    await loadAllData();

    // Carregar informações do usuário
    await loadCurrentUser();

    // Inicializar Kanban Drag & Drop
    initializeKanban();

    // Configurar event listeners
    setupEventListeners();

    // Atualizar automaticamente a cada 30 segundos
    setInterval(refreshData, 30000);
});

// =========================================
// CARREGAR DADOS
// =========================================
async function loadAllData() {
    showLoading(true);

    try {
        await Promise.all([
            loadLeads(),
            loadOportunidades(),
            loadPropostas(),
            loadInstalados(),
            loadTarefas(),
            loadKPIs()
        ]);

        // Renderizar módulo atual
        renderCurrentModule();

        showNotification('Dados carregados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados', 'danger');
    } finally {
        showLoading(false);
    }
}

async function loadCurrentUser() {
    try {
        // Buscar primeiro usuário ativo (para demo)
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('ativo', true)
            .limit(1)
            .single();

        if (data) {
            document.getElementById('user-name').textContent = data.nome || 'Vendedor';
            document.getElementById('user-role').textContent = data.role === 'gestor' ? 'Gestor' : 'Vendedor';
        } else {
            // Valores padrão se não houver usuário
            document.getElementById('user-name').textContent = 'Demo User';
            document.getElementById('user-role').textContent = 'Vendedor';
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        document.getElementById('user-name').textContent = 'Vendedor';
        document.getElementById('user-role').textContent = 'Vendedor';
    }
}

async function loadLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar leads:', error);
        return;
    }

    leads = data || [];
    console.log(`📊 ${leads.length} leads carregados`);
}

async function loadOportunidades() {
    const { data, error } = await supabase
        .from('oportunidades')
        .select(`
            *,
            leads:lead_id (
                id,
                nome,
                email,
                tipo_cliente,
                consumo_mensal
            )
        `)
        .neq('etapa', 'perdido')
        .order('data_ultima_atualizacao', { ascending: false });

    if (error) {
        console.error('Erro ao carregar oportunidades:', error);
        return;
    }

    oportunidades = data || [];
    console.log(`💼 ${oportunidades.length} oportunidades carregadas`);
}

async function loadPropostas() {
    const { data, error } = await supabase
        .from('propostas')
        .select(`
            *,
            oportunidades:oportunidade_id (
                lead_id,
                leads:lead_id (nome, email)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Erro ao carregar propostas:', error);
        return;
    }

    propostas = data || [];
    console.log(`📄 ${propostas.length} propostas carregadas`);
}

async function loadInstalados() {
    const { data, error } = await supabase
        .from('clientes_instalados')
        .select(`
            *,
            leads:lead_id (nome, email)
        `)
        .order('data_instalacao', { ascending: false });

    if (error) {
        console.error('Erro ao carregar instalados:', error);
        return;
    }

    instalados = data || [];
    console.log(`✅ ${instalados.length} clientes instalados`);
}

async function loadTarefas() {
    const { data, error } = await supabase
        .from('tarefas')
        .select(`
            *,
            leads:lead_id (nome, email)
        `)
        .eq('status', 'pendente')
        .order('data_vencimento', { ascending: true });

    if (error) {
        console.error('Erro ao carregar tarefas:', error);
        return;
    }

    tarefas = data || [];

    // Atualizar badge de tarefas atrasadas
    const atrasadas = tarefas.filter(t => new Date(t.data_vencimento) < new Date());
    const badge = document.getElementById('tarefas-badge');
    if (atrasadas.length > 0) {
        badge.textContent = atrasadas.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    console.log(`📋 ${tarefas.length} tarefas carregadas`);
}

async function loadKPIs() {
    // Calcular KPIs localmente
    kpis = {
        leads_ativos: leads.filter(l => !['convertido', 'perdido'].includes(l.status)).length,
        oportunidades_ativas: oportunidades.length,
        pipeline_valor: oportunidades.reduce((sum, o) => sum + (parseFloat(o.valor_estimado) || 0), 0),
        clientes_instalados: instalados.length,
        receita_total: instalados.reduce((sum, c) => sum + (parseFloat(c.valor_final_negociado) || 0), 0),
        nps_medio: calcularNPSMedio(),
        tarefas_atrasadas: tarefas.filter(t => new Date(t.data_vencimento) < new Date()).length
    };

    console.log('📈 KPIs calculados:', kpis);
}

function calcularNPSMedio() {
    const npsValidos = instalados.filter(c => c.nps != null && c.nps >= 0);
    if (npsValidos.length === 0) return 0;

    const soma = npsValidos.reduce((sum, c) => sum + c.nps, 0);
    return (soma / npsValidos.length).toFixed(1);
}

// =========================================
// NAVEGAÇÃO ENTRE MÓDULOS
// =========================================
function showModule(moduleName) {
    currentModule = moduleName;

    // Ocultar todos os módulos
    document.querySelectorAll('.module').forEach(m => m.classList.add('hidden'));

    // Mostrar módulo selecionado
    const module = document.getElementById(`module-${moduleName}`);
    if (module) {
        module.classList.remove('hidden');
        module.classList.add('fade-in');
    }

    // Atualizar navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'bg-white/20');
    });
    event?.target.closest('.nav-link')?.classList.add('active', 'bg-white/20');

    // Atualizar título
    const titles = {
        dashboard: { title: 'Dashboard Executivo', subtitle: 'Visão geral do funil de vendas' },
        kanban: { title: 'Kanban de Oportunidades', subtitle: 'Gestão visual do funil' },
        leads: { title: 'Gestão de Leads', subtitle: 'Todos os leads do sistema' },
        propostas: { title: 'Propostas Comerciais', subtitle: 'Rastreamento de propostas' },
        instalados: { title: 'Clientes Instalados', subtitle: 'Pós-venda e satisfação' },
        tarefas: { title: 'Tarefas e Follow-ups', subtitle: 'Ações pendentes' }
    };

    document.getElementById('module-title').textContent = titles[moduleName]?.title || '';
    document.getElementById('module-subtitle').textContent = titles[moduleName]?.subtitle || '';

    // Renderizar módulo
    renderCurrentModule();
}

function renderCurrentModule() {
    switch(currentModule) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'kanban':
            renderKanban();
            break;
        case 'leads':
            renderLeadsTable();
            break;
        case 'propostas':
            renderPropostas();
            break;
        case 'instalados':
            renderInstalados();
            break;
        case 'tarefas':
            renderTarefas();
            break;
    }
}

// =========================================
// DASHBOARD
// =========================================
function renderDashboard() {
    renderKPICards();
    renderCharts();
    renderRecentLeads();
}

function renderKPICards() {
    const kpiContainer = document.querySelector('#module-dashboard .grid');

    const kpiData = [
        {
            title: 'Leads Ativos',
            value: kpis.leads_ativos,
            icon: 'fa-users',
            color: 'blue',
            change: '+12%'
        },
        {
            title: 'Pipeline',
            value: formatCurrency(kpis.pipeline_valor),
            icon: 'fa-dollar-sign',
            color: 'green',
            change: '+8%'
        },
        {
            title: 'Instalados',
            value: kpis.clientes_instalados,
            icon: 'fa-check-circle',
            color: 'purple',
            change: '+5%'
        },
        {
            title: 'NPS Médio',
            value: kpis.nps_medio,
            icon: 'fa-star',
            color: 'yellow',
            change: '+0.5'
        }
    ];

    kpiContainer.innerHTML = kpiData.map(kpi => `
        <div class="module-card kpi-card p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-600 text-sm font-medium">${kpi.title}</p>
                    <p class="text-3xl font-bold text-gray-800 mt-2">${kpi.value}</p>
                    <p class="text-green-600 text-sm mt-2">
                        <i class="fas fa-arrow-up"></i> ${kpi.change} vs mês anterior
                    </p>
                </div>
                <div class="w-14 h-14 bg-${kpi.color}-100 rounded-full flex items-center justify-center">
                    <i class="fas ${kpi.icon} text-2xl text-${kpi.color}-600"></i>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCharts() {
    renderFunnelChart();
    renderConversionChart();
}

function renderFunnelChart() {
    const ctx = document.getElementById('funnelChart');
    if (!ctx) return;

    // Contar oportunidades por etapa
    const etapas = ['levantamento', 'simulacao', 'proposta', 'negociacao', 'fechamento'];
    const counts = etapas.map(etapa =>
        oportunidades.filter(o => o.etapa === etapa).length
    );

    if (funnelChart) funnelChart.destroy();

    funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Levantamento', 'Simulação', 'Proposta', 'Negociação', 'Fechamento'],
            datasets: [{
                label: 'Oportunidades',
                data: counts,
                backgroundColor: [
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderConversionChart() {
    const ctx = document.getElementById('conversionChart');
    if (!ctx) return;

    // Dados simulados (em produção, vir do backend)
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const conversoes = [12, 19, 15, 25, 22, 30];

    if (conversionChart) conversionChart.destroy();

    conversionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Conversões',
                data: conversoes,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderRecentLeads() {
    const container = document.getElementById('recent-leads');
    if (!container) return;

    const recentLeads = leads
        .filter(l => l.origem === 'chatbot')
        .slice(0, 5);

    container.innerHTML = recentLeads.map(lead => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white" style="background: #309086;">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <p class="font-semibold text-gray-800">${lead.nome || lead.email}</p>
                    <p class="text-sm text-gray-600">${lead.email}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="badge badge-${getStatusColor(lead.status)}">${formatStatus(lead.status)}</span>
                <p class="text-xs text-gray-500 mt-1">${formatDate(lead.created_at)}</p>
            </div>
        </div>
    `).join('') || '<p class="text-gray-500 text-center py-8">Nenhum lead recente do chatbot</p>';
}

// =========================================
// KANBAN
// =========================================
function initializeKanban() {
    const columns = document.querySelectorAll('.kanban-cards');

    columns.forEach(column => {
        new Sortable(column, {
            group: 'kanban',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: async function(evt) {
                const itemId = evt.item.dataset.id;
                const novaEtapa = evt.to.dataset.etapa;

                await atualizarEtapaOportunidade(itemId, novaEtapa);
            }
        });
    });
}

async function atualizarEtapaOportunidade(id, novaEtapa) {
    try {
        const { error } = await supabase
            .from('oportunidades')
            .update({
                etapa: novaEtapa,
                data_ultima_atualizacao: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Erro do Supabase:', error);
            throw error;
        }

        showNotification(`Oportunidade movida para ${novaEtapa}!`, 'success');
        await loadOportunidades();
        renderKanban();
    } catch (error) {
        console.error('Erro ao atualizar etapa:', error);
        showNotification('Erro ao mover oportunidade', 'danger');
    }
}

function renderKanban() {
    const etapas = ['levantamento', 'simulacao', 'proposta', 'negociacao', 'fechamento'];

    etapas.forEach(etapa => {
        const container = document.querySelector(`.kanban-cards[data-etapa="${etapa}"]`);
        const countBadge = document.querySelector(`.kanban-column[data-etapa="${etapa}"] .kanban-count`);

        if (!container) return;

        const oportunidadesEtapa = oportunidades.filter(o => o.etapa === etapa);

        // Atualizar contador
        if (countBadge) {
            countBadge.textContent = oportunidadesEtapa.length;
        }

        container.innerHTML = oportunidadesEtapa.map(oportunidade => {
            const lead = oportunidade.leads;
            const diasInativo = calcularDiasInativo(oportunidade.data_ultima_atualizacao);
            const isInactive = diasInativo > 14;

            return `
                <div class="kanban-card ${isInactive ? 'inactive' : ''}" data-id="${oportunidade.id}" onclick="openLeadModal('${oportunidade.lead_id}')">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-semibold text-gray-800 text-sm">${lead?.nome || lead?.email || 'Lead sem nome'}</h4>
                        ${isInactive ? '<span class="text-red-500 text-xs"><i class="fas fa-exclamation-circle"></i></span>' : ''}
                    </div>
                    <p class="text-xs text-gray-600 mb-2">
                        <i class="fas fa-bolt"></i> ${lead?.consumo_mensal || 0} kWh/mês
                    </p>
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-bold text-green-600">${formatCurrency(oportunidade.valor_estimado)}</span>
                        <span class="badge badge-${lead?.tipo_cliente === 'empresarial' ? 'info' : 'gray'} text-xs">
                            ${lead?.tipo_cliente === 'empresarial' ? 'EMP' : 'RES'}
                        </span>
                    </div>
                    ${isInactive ? `<p class="text-xs text-red-500 mt-2"><i class="fas fa-clock"></i> ${diasInativo} dias sem atualização</p>` : ''}
                </div>
            `;
        }).join('') || '<p class="text-gray-400 text-sm text-center py-4">Nenhuma oportunidade</p>';
    });
}

function calcularDiasInativo(dataUltimaAtualizacao) {
    const agora = new Date();
    const ultima = new Date(dataUltimaAtualizacao);
    const diff = agora - ultima;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// =========================================
// TABELA DE LEADS
// =========================================
function renderLeadsTable() {
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;

    tbody.innerHTML = leads.map(lead => `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3" style="background: linear-gradient(135deg, #309086 0%, #267269 100%);">
                        ${(lead.nome || lead.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-semibold text-gray-800">${lead.nome || 'Sem nome'}</p>
                        <p class="text-sm text-gray-600">${lead.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${lead.tipo_cliente === 'empresarial' ? 'info' : 'gray'}">
                    ${lead.tipo_cliente === 'empresarial' ? 'Empresarial' : 'Residencial'}
                </span>
            </td>
            <td class="px-6 py-4 font-semibold">${lead.consumo_mensal || 0} kWh</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <div class="w-16 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${lead.lead_score || 0}%"></div>
                    </div>
                    <span class="text-sm font-semibold">${lead.lead_score || 0}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${getStatusColor(lead.status)}">${formatStatus(lead.status)}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">${lead.user_id ? 'Atribuído' : 'Não atribuído'}</td>
            <td class="px-6 py-4">
                <button onclick="event.stopPropagation(); editLead('${lead.id}')" class="text-blue-600 hover:text-blue-800 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteLead('${lead.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhum lead encontrado</td></tr>';
}

// =========================================
// MODAL DE LEAD (Timeline)
// =========================================
async function openLeadModal(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    currentLead = lead;

    // Preencher informações do lead
    document.getElementById('modal-lead-name').textContent = lead.nome || lead.email;
    document.getElementById('modal-lead-email').textContent = lead.email;

    // Mostrar modal
    document.getElementById('leadModal').classList.remove('hidden');

    // Carregar abas
    await renderLeadInfo(lead);
    await renderLeadTimeline(leadId);
    await renderLeadQualificacao(leadId);
}

function closeLeadModal() {
    document.getElementById('leadModal').classList.add('hidden');
    currentLead = null;
    hideAddInteractionForm();
}

function showAddInteractionForm() {
    document.getElementById('interaction-form').classList.remove('hidden');
    document.getElementById('btn-show-interaction-form').classList.add('hidden');
}

function hideAddInteractionForm() {
    document.getElementById('interaction-form').classList.add('hidden');
    document.getElementById('btn-show-interaction-form').classList.remove('hidden');
    // Limpar campos
    document.getElementById('new-interaction-type').value = 'ligacao';
    document.getElementById('new-interaction-title').value = '';
    document.getElementById('new-interaction-desc').value = '';
}

async function salvarNovaInteracao() {
    if (!currentLead) return;

    const tipo = document.getElementById('new-interaction-type').value;
    const titulo = document.getElementById('new-interaction-title').value.trim();
    const descricao = document.getElementById('new-interaction-desc').value.trim();

    if (!titulo) {
        showNotification('Por favor, preencha o título', 'warning');
        return;
    }

    try {
        const { error } = await supabase
            .from('interacoes')
            .insert([{
                lead_id: currentLead.id,
                tipo: tipo,
                titulo: titulo,
                descricao: descricao || null
            }]);

        if (error) throw error;

        showNotification('Interação adicionada com sucesso!', 'success');
        hideAddInteractionForm();
        await renderLeadTimeline(currentLead.id);
    } catch (error) {
        console.error('Erro ao salvar interação:', error);
        showNotification('Erro ao salvar interação', 'danger');
    }
}

async function renderLeadInfo(lead) {
    const container = document.getElementById('lead-info-grid');

    container.innerHTML = `
        <div>
            <p class="text-sm text-gray-600">Tipo</p>
            <p class="font-semibold">${lead.tipo_cliente === 'empresarial' ? 'Empresarial' : 'Residencial'}</p>
        </div>
        <div>
            <p class="text-sm text-gray-600">Telefone</p>
            <p class="font-semibold">${lead.phone || 'Não informado'}</p>
        </div>
        <div>
            <p class="text-sm text-gray-600">Consumo Mensal</p>
            <p class="font-semibold">${lead.consumo_mensal || 0} kWh</p>
        </div>
        <div>
            <p class="text-sm text-gray-600">Status</p>
            <p><span class="badge badge-${getStatusColor(lead.status)}">${formatStatus(lead.status)}</span></p>
        </div>
        <div>
            <p class="text-sm text-gray-600">Lead Score</p>
            <p class="font-semibold text-green-600">${lead.lead_score || 0}/100</p>
        </div>
        <div>
            <p class="text-sm text-gray-600">Origem</p>
            <p class="font-semibold">${lead.origem || 'chatbot'}</p>
        </div>
        <div class="col-span-2">
            <p class="text-sm text-gray-600">Cadastrado em</p>
            <p class="font-semibold">${formatDate(lead.created_at)}</p>
        </div>
    `;
}

let editModeActive = false;

function toggleEditLead() {
    editModeActive = !editModeActive;
    const btn = document.getElementById('btn-edit-lead');

    if (editModeActive) {
        btn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar';
        btn.onclick = saveLead;
        renderLeadInfoEdit(currentLead);
    } else {
        btn.innerHTML = '<i class="fas fa-edit mr-2"></i>Editar';
        btn.onclick = toggleEditLead;
        renderLeadInfo(currentLead);
    }
}

function renderLeadInfoEdit(lead) {
    const container = document.getElementById('lead-info-grid');

    container.innerHTML = `
        <div>
            <label class="text-sm text-gray-600">Nome</label>
            <input type="text" id="edit-nome" value="${lead.nome || ''}" class="w-full border rounded px-3 py-2 mt-1">
        </div>
        <div>
            <label class="text-sm text-gray-600">Email</label>
            <input type="email" id="edit-email" value="${lead.email || ''}" class="w-full border rounded px-3 py-2 mt-1">
        </div>
        <div>
            <label class="text-sm text-gray-600">Telefone</label>
            <input type="text" id="edit-phone" value="${lead.phone || ''}" class="w-full border rounded px-3 py-2 mt-1">
        </div>
        <div>
            <label class="text-sm text-gray-600">Tipo</label>
            <select id="edit-tipo" class="w-full border rounded px-3 py-2 mt-1">
                <option value="residencial" ${lead.tipo_cliente === 'residencial' ? 'selected' : ''}>Residencial</option>
                <option value="empresarial" ${lead.tipo_cliente === 'empresarial' ? 'selected' : ''}>Empresarial</option>
            </select>
        </div>
        <div>
            <label class="text-sm text-gray-600">Consumo Mensal (kWh)</label>
            <input type="number" id="edit-consumo" value="${lead.consumo_mensal || 0}" class="w-full border rounded px-3 py-2 mt-1">
        </div>
        <div>
            <label class="text-sm text-gray-600">Status</label>
            <select id="edit-status" class="w-full border rounded px-3 py-2 mt-1">
                <option value="novo" ${lead.status === 'novo' ? 'selected' : ''}>Novo</option>
                <option value="qualificado" ${lead.status === 'qualificado' ? 'selected' : ''}>Qualificado</option>
                <option value="em_nutricao" ${lead.status === 'em_nutricao' ? 'selected' : ''}>Em Nutrição</option>
                <option value="nao_qualificado" ${lead.status === 'nao_qualificado' ? 'selected' : ''}>Não Qualificado</option>
                <option value="convertido" ${lead.status === 'convertido' ? 'selected' : ''}>Convertido</option>
                <option value="perdido" ${lead.status === 'perdido' ? 'selected' : ''}>Perdido</option>
            </select>
        </div>
    `;
}

async function saveLead() {
    try {
        const updatedData = {
            nome: document.getElementById('edit-nome').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            tipo_cliente: document.getElementById('edit-tipo').value,
            consumo_mensal: parseFloat(document.getElementById('edit-consumo').value),
            status: document.getElementById('edit-status').value
        };

        const { error } = await supabase
            .from('leads')
            .update(updatedData)
            .eq('id', currentLead.id);

        if (error) throw error;

        showNotification('Lead atualizado com sucesso!', 'success');

        // Atualizar lead atual e recarregar dados
        Object.assign(currentLead, updatedData);
        await loadLeads();
        renderLeadsTable();

        // Voltar para modo visualização
        editModeActive = false;
        const btn = document.getElementById('btn-edit-lead');
        btn.innerHTML = '<i class="fas fa-edit mr-2"></i>Editar';
        btn.onclick = toggleEditLead;
        renderLeadInfo(currentLead);

    } catch (error) {
        console.error('Erro ao salvar lead:', error);
        showNotification('Erro ao salvar alterações', 'danger');
    }
}

async function renderLeadTimeline(leadId) {
    const container = document.getElementById('timeline-container');

    // Buscar interações
    const { data: interacoes, error } = await supabase
        .from('interacoes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar timeline:', error);
        return;
    }

    const iconMap = {
        email: { icon: 'fa-envelope', color: 'bg-blue-500' },
        whatsapp: { icon: 'fa-whatsapp', color: 'bg-green-500' },
        chamada: { icon: 'fa-phone', color: 'bg-purple-500' },
        visita: { icon: 'fa-home', color: 'bg-orange-500' },
        nota: { icon: 'fa-sticky-note', color: 'bg-yellow-500' },
        upload: { icon: 'fa-paperclip', color: 'bg-gray-500' },
        sistema: { icon: 'fa-robot', color: 'bg-indigo-500' }
    };

    container.innerHTML = interacoes.map(interacao => {
        const config = iconMap[interacao.tipo] || iconMap.sistema;

        return `
            <div class="timeline-item">
                <div class="timeline-icon ${config.color} text-white">
                    <i class="fas ${config.icon}"></i>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-800">${interacao.titulo || formatTipo(interacao.tipo)}</h4>
                        <span class="text-xs text-gray-500">${formatDateTime(interacao.created_at)}</span>
                    </div>
                    ${interacao.descricao ? `<p class="text-sm text-gray-600">${interacao.descricao}</p>` : ''}
                    ${interacao.arquivo_url ? `<a href="${interacao.arquivo_url}" target="_blank" class="text-blue-600 text-sm hover:underline mt-2 inline-block"><i class="fas fa-file"></i> Ver arquivo</a>` : ''}
                </div>
            </div>
        `;
    }).join('') || '<p class="text-gray-500 text-center py-8">Nenhuma interação registrada</p>';
}

async function renderLeadQualificacao(leadId) {
    const container = document.getElementById('qualificacao-content');

    // Buscar qualificação
    const { data: qualificacao, error } = await supabase
        .from('qualificacao')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    if (error || !qualificacao) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum dado de qualificação</p>';
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <p class="text-sm text-gray-600">Pessoas na Casa</p>
                <p class="font-semibold">${qualificacao.family_size || 'Não informado'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Consumo kWh</p>
                <p class="font-semibold">${qualificacao.kwh_consumption || 'Não informado'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Tipo de Telhado</p>
                <p class="font-semibold">${qualificacao.roof_type || qualificacao.tipo_telhado || 'Não informado'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Tipo de Ligação</p>
                <p class="font-semibold">${qualificacao.tipo_ligacao || 'Não informado'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">É Decisor?</p>
                <p class="font-semibold">${qualificacao.decisor ? 'Sim' : 'Não'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Prontidão de Compra</p>
                <p class="font-semibold">${formatProntidao(qualificacao.prontidao_compra)}</p>
            </div>
            <div class="col-span-2">
                <p class="text-sm text-gray-600">Viabilidade Técnica</p>
                <p class="font-semibold ${qualificacao.viabilidade_tecnica ? 'text-green-600' : 'text-red-600'}">
                    ${qualificacao.viabilidade_tecnica ? '✓ Viável' : '✗ Não viável'}
                </p>
            </div>
            ${qualificacao.observacoes ? `
                <div class="col-span-2">
                    <p class="text-sm text-gray-600">Observações</p>
                    <p class="text-gray-800">${qualificacao.observacoes}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function showTab(tabName) {
    // Ocultar todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));

    // Mostrar tab selecionado
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    // Atualizar botões
    document.querySelectorAll('#leadModal .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// =========================================
// PROPOSTAS
// =========================================
function renderPropostas() {
    const container = document.getElementById('propostas-grid');
    if (!container) return;

    container.innerHTML = propostas.map(proposta => {
        const statusColors = {
            rascunho: 'gray',
            enviada: 'blue',
            visualizada: 'warning',
            aceita: 'success',
            recusada: 'danger',
            revisao: 'info'
        };

        return `
            <div class="module-card p-6">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h4 class="font-bold text-gray-800">${proposta.numero_proposta}</h4>
                        <p class="text-sm text-gray-600">${proposta.oportunidades?.leads?.nome || 'Lead sem nome'}</p>
                    </div>
                    <span class="badge badge-${statusColors[proposta.status] || 'gray'}">${formatStatus(proposta.status)}</span>
                </div>

                <div class="space-y-2 mb-4 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Potência:</span>
                        <span class="font-semibold">${proposta.potencia_total_kwp} kWp</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Módulos:</span>
                        <span class="font-semibold">${proposta.num_modulos} un</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Valor:</span>
                        <span class="font-semibold text-green-600">${formatCurrency(proposta.valor_final)}</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button onclick="abrirProposta('${proposta.token_rastreio}')" class="flex-1 text-white py-2 rounded-lg transition text-sm" style="background: #309086;" onmouseover="this.style.background='#267269'" onmouseout="this.style.background='#309086'">
                        <i class="fas fa-eye mr-1"></i> Visualizar
                    </button>
                    ${proposta.arquivo_pdf_url ? `
                        <a href="${proposta.arquivo_pdf_url}" target="_blank" class="flex-1 bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                            <i class="fas fa-file-pdf mr-1"></i> PDF
                        </a>
                    ` : ''}
                    <button onclick="copiarLinkProposta('${proposta.token_rastreio}')" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-sm">
                        <i class="fas fa-link mr-1"></i> Copiar Link
                    </button>
                </div>

                ${proposta.data_visualizacao ? `
                    <p class="text-xs text-gray-500 mt-3">
                        <i class="fas fa-eye"></i> Visualizada em ${formatDate(proposta.data_visualizacao)}
                    </p>
                ` : ''}
            </div>
        `;
    }).join('') || '<p class="text-gray-500 col-span-3 text-center py-8">Nenhuma proposta encontrada</p>';
}

function abrirProposta(token) {
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const url = `${baseUrl}proposta.html?t=${token}`;
    window.open(url, '_blank');
}

function copiarLinkProposta(token) {
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const url = `${baseUrl}proposta.html?t=${token}`;
    navigator.clipboard.writeText(url);
    showNotification('Link copiado para área de transferência!', 'success');
}

// =========================================
// CLIENTES INSTALADOS
// =========================================
function renderInstalados() {
    // Atualizar KPIs
    document.getElementById('total-instalados').textContent = instalados.length;

    const potenciaTotal = instalados.reduce((sum, c) => sum + (parseFloat(c.potencia_instalada_kwp) || 0), 0);
    document.getElementById('potencia-total').textContent = potenciaTotal.toFixed(2) + ' kWp';

    document.getElementById('nps-medio').textContent = kpis.nps_medio;

    // Renderizar tabela
    const tbody = document.getElementById('instalados-table-body');
    if (!tbody) return;

    tbody.innerHTML = instalados.map(cliente => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <p class="font-semibold">${cliente.leads?.nome || 'Sem nome'}</p>
                <p class="text-sm text-gray-600">${cliente.leads?.email}</p>
            </td>
            <td class="px-6 py-4 font-mono text-sm">${cliente.numero_contrato || 'N/A'}</td>
            <td class="px-6 py-4 text-sm">${formatDate(cliente.data_instalacao)}</td>
            <td class="px-6 py-4 font-semibold">${cliente.potencia_instalada_kwp || 0} kWp</td>
            <td class="px-6 py-4 font-semibold text-green-600">${formatCurrency(cliente.valor_final_negociado)}</td>
            <td class="px-6 py-4">
                ${cliente.nps != null ? `
                    <div class="flex items-center gap-2">
                        <span class="font-bold ${cliente.nps >= 9 ? 'text-green-600' : cliente.nps >= 7 ? 'text-yellow-600' : 'text-red-600'}">
                            ${cliente.nps}
                        </span>
                        <i class="fas fa-star text-yellow-500"></i>
                    </div>
                ` : '<span class="text-gray-400">N/A</span>'}
            </td>
            <td class="px-6 py-4">
                <button class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhum cliente instalado</td></tr>';
}

// =========================================
// TAREFAS
// =========================================
function renderTarefas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const atrasadas = tarefas.filter(t => new Date(t.data_vencimento) < hoje);
    const hojeTarefas = tarefas.filter(t => {
        const venc = new Date(t.data_vencimento);
        return venc >= hoje && venc < amanha;
    });
    const proximas = tarefas.filter(t => new Date(t.data_vencimento) >= amanha);

    renderTarefasColumn('tarefas-atrasadas', atrasadas, 'red');
    renderTarefasColumn('tarefas-hoje', hojeTarefas, 'yellow');
    renderTarefasColumn('tarefas-proximas', proximas, 'blue');
}

function renderTarefasColumn(containerId, tarefas, color) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = tarefas.map(tarefa => `
        <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-${color}-500">
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-800 text-sm">${tarefa.titulo}</h4>
                <div class="flex gap-2">
                    <button onclick="concluirTarefa('${tarefa.id}')" class="text-green-600 hover:text-green-800" title="Concluir">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="editarTarefa('${tarefa.id}')" class="text-blue-600 hover:text-blue-800" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deletarTarefa('${tarefa.id}')" class="text-red-600 hover:text-red-800" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="text-xs text-gray-600 mb-2">${tarefa.descricao || ''}</p>
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">
                    <i class="fas fa-calendar"></i> ${formatDate(tarefa.data_vencimento)}
                </span>
                ${tarefa.leads ? `
                    <span class="text-xs font-semibold text-gray-700">${tarefa.leads.nome || tarefa.leads.email}</span>
                ` : ''}
            </div>
        </div>
    `).join('') || '<p class="text-gray-400 text-sm text-center py-4">Nenhuma tarefa</p>';
}

async function concluirTarefa(tarefaId) {
    try {
        const { error } = await supabase
            .from('tarefas')
            .update({
                status: 'concluida',
                data_conclusao: new Date().toISOString()
            })
            .eq('id', tarefaId);

        if (error) throw error;

        showNotification('Tarefa concluída!', 'success');
        await loadTarefas();
        renderTarefas();
    } catch (error) {
        console.error('Erro ao concluir tarefa:', error);
        showNotification('Erro ao concluir tarefa', 'danger');
    }
}

let currentTaskId = null;

function editarTarefa(tarefaId) {
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (!tarefa) return;

    currentTaskId = tarefaId;

    // Preencher formulário
    document.getElementById('edit-task-title').value = tarefa.titulo || '';
    document.getElementById('edit-task-desc').value = tarefa.descricao || '';
    document.getElementById('edit-task-date').value = tarefa.data_vencimento ? tarefa.data_vencimento.split('T')[0] : '';
    document.getElementById('edit-task-priority').value = tarefa.prioridade || 'media';

    // Mostrar modal
    document.getElementById('editTaskModal').classList.remove('hidden');
}

function closeEditTaskModal() {
    document.getElementById('editTaskModal').classList.add('hidden');
    currentTaskId = null;
}

async function salvarEdicaoTarefa() {
    if (!currentTaskId) return;

    const titulo = document.getElementById('edit-task-title').value.trim();
    const descricao = document.getElementById('edit-task-desc').value.trim();
    const dataVencimento = document.getElementById('edit-task-date').value;
    const prioridade = document.getElementById('edit-task-priority').value;

    if (!titulo) {
        showNotification('Por favor, preencha o título', 'warning');
        return;
    }

    try {
        const dados = {
            titulo,
            descricao: descricao || null,
            data_vencimento: dataVencimento || new Date().toISOString(),
            prioridade
        };

        const { error } = await supabase
            .from('tarefas')
            .update(dados)
            .eq('id', currentTaskId);

        if (error) throw error;

        showNotification('Tarefa atualizada!', 'success');
        closeEditTaskModal();
        await loadTarefas();
        renderTarefas();
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        showNotification('Erro ao atualizar tarefa', 'danger');
    }
}

async function deletarTarefa(tarefaId) {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;

    try {
        const { error } = await supabase
            .from('tarefas')
            .delete()
            .eq('id', tarefaId);

        if (error) throw error;

        showNotification('Tarefa deletada!', 'success');
        await loadTarefas();
        renderTarefas();
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        showNotification('Erro ao deletar tarefa', 'danger');
    }
}

async function novaTarefa() {
    const titulo = prompt('Título da tarefa:');
    if (!titulo) return;

    const descricao = prompt('Descrição (opcional):');
    const dataVencimento = prompt('Data de vencimento (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    const prioridade = prompt('Prioridade (baixa/media/alta):', 'media');

    try {
        const novaTarefaData = {
            titulo,
            descricao: descricao || null,
            data_vencimento: dataVencimento || new Date().toISOString(),
            prioridade: prioridade || 'media',
            status: 'pendente',
            tipo: 'geral'
        };

        const { error } = await supabase
            .from('tarefas')
            .insert([novaTarefaData]);

        if (error) throw error;

        showNotification('Tarefa criada com sucesso!', 'success');
        await loadTarefas();
        renderTarefas();
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        showNotification('Erro ao criar tarefa', 'danger');
    }
}

// =========================================
// UTILITÁRIOS
// =========================================
function formatCurrency(value) {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function formatStatus(status) {
    const statusMap = {
        novo: 'Novo',
        qualificado: 'Qualificado',
        nao_qualificado: 'Não Qualificado',
        em_nutricao: 'Em Nutrição',
        convertido: 'Convertido',
        perdido: 'Perdido',
        enviada: 'Enviada',
        visualizada: 'Visualizada',
        aceita: 'Aceita',
        recusada: 'Recusada',
        revisao: 'Em Revisão'
    };
    return statusMap[status] || status;
}

function formatTipo(tipo) {
    const tipoMap = {
        email: 'E-mail',
        whatsapp: 'WhatsApp',
        chamada: 'Chamada',
        visita: 'Visita',
        nota: 'Nota',
        upload: 'Upload',
        sistema: 'Sistema'
    };
    return tipoMap[tipo] || tipo;
}

function formatProntidao(prontidao) {
    const map = {
        imediato: 'Imediato',
        '30_dias': '30 dias',
        '90_dias': '90 dias',
        'mais_90_dias': '+90 dias'
    };
    return map[prontidao] || 'Não informado';
}

function getStatusColor(status) {
    const colorMap = {
        novo: 'info',
        qualificado: 'success',
        nao_qualificado: 'danger',
        em_nutricao: 'warning',
        convertido: 'success',
        perdido: 'danger'
    };
    return colorMap[status] || 'gray';
}

function showNotification(message, type = 'info') {
    // Implementação simples - pode usar biblioteca como Toastify
    const colors = {
        success: 'green',
        danger: 'red',
        warning: 'yellow',
        info: 'blue'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 bg-${colors[type]}-500 text-white px-6 py-3 rounded-lg shadow-lg z-[100] fade-in`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showLoading(show) {
    const icon = document.getElementById('refresh-icon');
    if (icon) {
        if (show) {
            icon.classList.add('fa-spin');
        } else {
            icon.classList.remove('fa-spin');
        }
    }
}

async function refreshData() {
    await loadAllData();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('mobile-open');
}

function setupEventListeners() {
    // Filtros de leads
    const searchInput = document.getElementById('lead-search');
    const statusFilter = document.getElementById('lead-status-filter');
    const typeFilter = document.getElementById('lead-type-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterLeads);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterLeads);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', filterLeads);
    }

    // Form de novo lead
    const newLeadForm = document.getElementById('newLeadForm');
    if (newLeadForm) {
        newLeadForm.addEventListener('submit', salvarNovoLead);
    }
}

function filterLeads() {
    const searchInput = document.getElementById('lead-search');
    const statusFilter = document.getElementById('lead-status-filter');
    const typeFilter = document.getElementById('lead-type-filter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const typeValue = typeFilter ? typeFilter.value : '';

    const filteredLeads = leads.filter(lead => {
        // Filtro de busca
        const matchesSearch = !searchTerm ||
            (lead.nome && lead.nome.toLowerCase().includes(searchTerm)) ||
            (lead.email && lead.email.toLowerCase().includes(searchTerm)) ||
            (lead.phone && lead.phone.toLowerCase().includes(searchTerm));

        // Filtro de status
        const matchesStatus = !statusValue || lead.status === statusValue;

        // Filtro de tipo
        const matchesType = !typeValue || lead.tipo_cliente === typeValue;

        return matchesSearch && matchesStatus && matchesType;
    });

    renderFilteredLeadsTable(filteredLeads);
}

function renderFilteredLeadsTable(filteredLeads) {
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;

    tbody.innerHTML = filteredLeads.map(lead => `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3" style="background: linear-gradient(135deg, #309086 0%, #267269 100%);">
                        ${(lead.nome || lead.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-semibold text-gray-800">${lead.nome || 'Sem nome'}</p>
                        <p class="text-sm text-gray-600">${lead.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${lead.tipo_cliente === 'empresarial' ? 'info' : 'gray'}">
                    ${lead.tipo_cliente === 'empresarial' ? 'Empresarial' : 'Residencial'}
                </span>
            </td>
            <td class="px-6 py-4">${lead.consumo_mensal || 0} kWh</td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${lead.lead_score || 0}%"></div>
                    </div>
                    <span class="text-sm font-semibold">${lead.lead_score || 0}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${getStatusColor(lead.status)}">${formatStatus(lead.status)}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
                ${lead.users ? lead.users.nome : 'Não atribuído'}
            </td>
            <td class="px-6 py-4">
                <button onclick="event.stopPropagation(); openLeadModal('${lead.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhum lead encontrado</td></tr>';
}

function showNewLeadModal() {
    document.getElementById('newLeadModal').classList.remove('hidden');
    document.getElementById('newLeadForm').reset();
}

function closeNewLeadModal() {
    document.getElementById('newLeadModal').classList.add('hidden');
}

async function salvarNovoLead(event) {
    event.preventDefault();

    try {
        const novoLead = {
            nome: document.getElementById('new-lead-nome').value,
            email: document.getElementById('new-lead-email').value,
            phone: document.getElementById('new-lead-phone').value || null,
            tipo_cliente: document.getElementById('new-lead-tipo').value,
            consumo_mensal: parseFloat(document.getElementById('new-lead-consumo').value) || 0,
            status: document.getElementById('new-lead-status').value,
            origem: 'manual',
            lead_score: 0
        };

        const { error } = await supabase
            .from('leads')
            .insert([novoLead]);

        if (error) throw error;

        showNotification('Lead criado com sucesso!', 'success');
        closeNewLeadModal();
        await loadLeads();
        renderLeadsTable();
    } catch (error) {
        console.error('Erro ao criar lead:', error);
        showNotification('Erro ao criar lead: ' + error.message, 'danger');
    }
}

async function deleteLead(leadId) {
    if (!confirm('Tem certeza que deseja deletar este lead?')) return;

    try {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);

        if (error) throw error;

        showNotification('Lead deletado com sucesso!', 'success');
        await loadLeads();
        renderLeadsTable();
    } catch (error) {
        console.error('Erro ao deletar lead:', error);
        showNotification('Erro ao deletar lead', 'danger');
    }
}

function exportLeads() {
    if (leads.length === 0) {
        showNotification('Nenhum lead para exportar', 'warning');
        return;
    }

    // Criar CSV
    const headers = ['Nome', 'Email', 'Telefone', 'Tipo', 'Consumo (kWh)', 'Score', 'Status', 'Origem'];
    const rows = leads.map(lead => [
        lead.nome || '',
        lead.email || '',
        lead.phone || '',
        lead.tipo_cliente || '',
        lead.consumo_mensal || 0,
        lead.lead_score || 0,
        lead.status || '',
        lead.origem || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification('Leads exportados com sucesso!', 'success');
}

function logout() {
    // Implementar logout
    window.location.href = '/';
}

// =========================================
// FILTRO KANBAN
// =========================================
let kanbanFilterType = 'todos';

function filterKanban(tipo) {
    kanbanFilterType = tipo;

    // Atualizar botões ativos
    document.querySelectorAll('#module-kanban .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event?.target.classList.add('active');

    // Renderizar kanban filtrado
    renderKanbanFiltered();
}

function renderKanbanFiltered() {
    const etapas = ['levantamento', 'simulacao', 'proposta', 'negociacao', 'fechamento'];

    etapas.forEach(etapa => {
        const container = document.querySelector(`.kanban-cards[data-etapa="${etapa}"]`);
        const countBadge = document.querySelector(`.kanban-column[data-etapa="${etapa}"] .kanban-count`);

        if (!container) return;

        // Filtrar oportunidades por etapa e tipo
        let oportunidadesEtapa = oportunidades.filter(o => o.etapa === etapa);

        if (kanbanFilterType !== 'todos') {
            oportunidadesEtapa = oportunidadesEtapa.filter(o =>
                o.leads?.tipo_cliente === kanbanFilterType
            );
        }

        // Atualizar contador
        if (countBadge) {
            countBadge.textContent = oportunidadesEtapa.length;
        }

        container.innerHTML = oportunidadesEtapa.map(oportunidade => {
            const lead = oportunidade.leads;
            const diasInativo = calcularDiasInativo(oportunidade.data_ultima_atualizacao);
            const isInactive = diasInativo > 14;

            return `
                <div class="kanban-card ${isInactive ? 'inactive' : ''}" data-id="${oportunidade.id}" onclick="openLeadModal('${oportunidade.lead_id}')">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-semibold text-gray-800 text-sm">${lead?.nome || lead?.email || 'Lead sem nome'}</h4>
                        ${isInactive ? '<span class="text-red-500 text-xs"><i class="fas fa-exclamation-circle"></i></span>' : ''}
                    </div>
                    <p class="text-xs text-gray-600 mb-2">
                        <i class="fas fa-bolt"></i> ${lead?.consumo_mensal || 0} kWh/mês
                    </p>
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-bold text-green-600">${formatCurrency(oportunidade.valor_estimado)}</span>
                        <span class="badge badge-${lead?.tipo_cliente === 'empresarial' ? 'info' : 'gray'} text-xs">
                            ${lead?.tipo_cliente === 'empresarial' ? 'EMP' : 'RES'}
                        </span>
                    </div>
                    ${isInactive ? `<p class="text-xs text-red-500 mt-2"><i class="fas fa-clock"></i> ${diasInativo} dias sem atualização</p>` : ''}
                </div>
            `;
        }).join('') || '<p class="text-gray-400 text-sm text-center py-4">Nenhuma oportunidade</p>';
    });
}

// =========================================
// RASTREAMENTO DE PROPOSTA
// =========================================
async function trackProposta(token) {
    try {
        const { data, error } = await supabase
            .from('propostas')
            .select('*, oportunidades:oportunidade_id(lead_id, leads:lead_id(nome, email))')
            .eq('token_rastreio', token)
            .single();

        if (error || !data) {
            showNotification('Proposta não encontrada', 'warning');
            return null;
        }

        // Registrar visualização se ainda não foi visualizada
        if (!data.data_visualizacao) {
            await supabase
                .from('propostas')
                .update({
                    data_visualizacao: new Date().toISOString(),
                    status: 'visualizada'
                })
                .eq('id', data.id);
        }

        return data;
    } catch (error) {
        console.error('Erro ao rastrear proposta:', error);
        return null;
    }
}

// =========================================
// SIMULADOR SOLAR
// =========================================

// Tabela de latitudes aproximadas por estado (centro do estado)
const LATITUDES_ESTADOS = {
    'AC': -9, 'AL': -9, 'AP': 0, 'AM': -4, 'BA': -12,
    'CE': -5, 'DF': -16, 'ES': -20, 'GO': -16, 'MA': -5,
    'MT': -13, 'MS': -21, 'MG': -19, 'PA': -3, 'PB': -7,
    'PR': -25, 'PE': -8, 'PI': -7, 'RJ': -22, 'RN': -6,
    'RS': -30, 'RO': -11, 'RR': 2, 'SC': -27, 'SP': -23,
    'SE': -11, 'TO': -10
};

/**
 * Estima inclinação e azimute ideais baseado no CEP
 * Inclinação ideal ≈ latitude do local (no Brasil, quanto mais ao sul, maior a inclinação)
 * Azimute ideal = 0° (Norte) em todo o Brasil
 */
async function estimarOrientacaoSolar(cep) {
    try {
        const Calculadora = window.CalculadoraSolarCompleta || window.CalculadoraSolar;
        if (!Calculadora) return { inclinacao: 15, azimute: 0 };

        const localizacao = await Calculadora.buscarCEP(cep);
        if (!localizacao) return { inclinacao: 15, azimute: 0 };

        const estado = localizacao.estado;
        const latitude = Math.abs(LATITUDES_ESTADOS[estado] || -15);

        // Inclinação ideal = latitude (com mínimo de 10° e máximo de 30°)
        const inclinacaoIdeal = Math.max(10, Math.min(30, latitude));

        return {
            inclinacao: Math.round(inclinacaoIdeal),
            azimute: 0, // Norte é sempre ideal no Brasil
            cidade: localizacao.cidade,
            estado: estado
        };
    } catch (error) {
        console.error('Erro ao estimar orientação:', error);
        return { inclinacao: 15, azimute: 0 };
    }
}

/**
 * Auto-preenche inclinação e azimute quando CEP é inserido
 */
async function autoPreencherOrientacao() {
    const cep = document.getElementById('sim-cep').value.trim();
    if (!cep || cep.length < 8) return;

    const estimativa = await estimarOrientacaoSolar(cep);

    // Preencher campos com valores estimados (se ainda estiverem com valores padrão)
    const inclinacaoInput = document.getElementById('sim-inclinacao');
    const azimuteInput = document.getElementById('sim-azimute');

    if (!inclinacaoInput.value || inclinacaoInput.value == '15') {
        inclinacaoInput.value = estimativa.inclinacao;
    }

    if (!azimuteInput.value || azimuteInput.value == '0') {
        azimuteInput.value = estimativa.azimute;
    }

    // Mostrar dica para o usuário
    if (estimativa.cidade) {
        showNotification(
            `📍 ${estimativa.cidade}-${estimativa.estado}: Inclinação sugerida ${estimativa.inclinacao}° | Azimute Norte (0°)`,
            'info',
            3000
        );
    }
}

function abrirSimuladorSolar() {
    // Preencher com dados do lead se disponível
    if (currentLead) {
        if (currentLead.cep) document.getElementById('sim-cep').value = currentLead.cep;
        if (currentLead.consumo_mensal) document.getElementById('sim-consumo').value = currentLead.consumo_mensal;
        if (currentLead.tipo_cliente) document.getElementById('sim-tipo').value = currentLead.tipo_cliente;
    }

    document.getElementById('simuladorSolarModal').classList.remove('hidden');
    document.getElementById('simulador-resultados').classList.add('hidden');
}

function closeSimuladorSolar() {
    document.getElementById('simuladorSolarModal').classList.add('hidden');
}

async function calcularSistema() {
    const cep = document.getElementById('sim-cep').value.trim();
    const consumoMensalKwh = parseFloat(document.getElementById('sim-consumo').value);
    const percentualReducao = parseFloat(document.getElementById('sim-reducao').value);
    const tarifaKwh = parseFloat(document.getElementById('sim-tarifa').value);
    const tipoCliente = document.getElementById('sim-tipo').value;

    // Novos campos
    const inclinacao = parseFloat(document.getElementById('sim-inclinacao').value) || 15;
    const azimute = parseFloat(document.getElementById('sim-azimute').value) || 0;
    const distDC = parseFloat(document.getElementById('sim-dist-dc').value) || 15;
    const distAC = parseFloat(document.getElementById('sim-dist-ac').value) || 10;
    const reajusteAnual = (parseFloat(document.getElementById('sim-reajuste').value) || 8.0) / 100;
    const inflacao = (parseFloat(document.getElementById('sim-inflacao').value) || 4.5) / 100;

    if (!cep || !consumoMensalKwh) {
        showNotification('Preencha CEP e consumo mensal', 'warning');
        return;
    }

    showLoading(true);

    try {
        // Verificar qual calculadora usar (completa ou simples)
        const Calculadora = window.CalculadoraSolarCompleta || window.CalculadoraSolar;

        if (!Calculadora) {
            throw new Error('Calculadora solar não carregada. Recarregue a página.');
        }

        const resultado = await Calculadora.gerarPropostaCompleta({
            cep,
            consumoMensalKwh,
            percentualReducao,
            tarifaKwh,
            tipoCliente,
            inclinacao,
            azimute,
            distanciaCabos: { dc: distDC, ac: distAC },
            reajusteAnual,
            inflacao
        });

        renderResultadosSimulador(resultado);
        document.getElementById('simulador-resultados').classList.remove('hidden');

        // Salvar cálculo no banco de dados (opcional)
        if (currentLead) {
            await salvarCalculoNoLead(currentLead.id, resultado);
        }

    } catch (error) {
        console.error('Erro ao calcular:', error);
        showNotification('Erro ao calcular sistema: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

function renderResultadosSimulador(resultado) {
    const { localizacao, dimensionamento, propostas } = resultado;

    // Localização
    document.getElementById('sim-localizacao').textContent =
        `${localizacao.cidade} - ${localizacao.estado} | ${localizacao.bairro}`;
    document.getElementById('sim-irradiacao').textContent =
        `☀️ Irradiação Solar: ${localizacao.irradiacao} kWh/m²/dia (excelente para energia solar!)`;

    // Renderizar as 3 propostas
    const container = document.getElementById('propostas-container');
    container.innerHTML = propostas.map((proposta, index) => {
        const { configuracao, custos, economia, payback, energiaGerada } = proposta;
        const { placa, numModulos, potenciaRealKwp, area } = configuracao;

        // Compatibilidade: inversor pode estar em custos.inversor (antigo) ou custos.equipamentos.inversor (novo)
        const inversor = custos.equipamentos?.inversor || custos.inversor;

        // Compatibilidade: payback pode ter estrutura simples ou real
        const paybackAnos = payback.real?.anos || payback.anos;

        // Compatibilidade: TIR e VPL podem não existir na calculadora antiga
        const tir = proposta.tir || 0;
        const vpl = proposta.vpl || 0;

        return `
            <div class="bg-white border-2 ${index === 0 ? 'border-green-500' : 'border-gray-200'} rounded-xl p-6 shadow-lg">
                ${index === 0 ? '<div class="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">RECOMENDADO</div>' : ''}

                <h4 class="text-lg font-bold mb-2">${placa.fabricante}</h4>
                <p class="text-sm text-gray-600 mb-4">${placa.modelo}</p>

                <!-- Sistema -->
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <h5 class="font-bold text-sm mb-2">📦 Sistema</h5>
                    <div class="text-sm space-y-1">
                        <div class="flex justify-between">
                            <span>Placas ${placa.potencia}Wp:</span>
                            <span class="font-semibold">${numModulos} unidades</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Potência Total:</span>
                            <span class="font-semibold">${potenciaRealKwp} kWp</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Área Necessária:</span>
                            <span class="font-semibold">${area.toFixed(1)} m²</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Inversor:</span>
                            <span class="font-semibold text-xs">${inversor.fabricante} ${inversor.potencia_kw}kW</span>
                        </div>
                    </div>
                </div>

                <!-- Economia -->
                <div class="bg-green-50 rounded-lg p-4 mb-4">
                    <h5 class="font-bold text-sm mb-2 text-green-800">💰 Economia & Retorno</h5>
                    <div class="text-sm space-y-1">
                        <div class="flex justify-between">
                            <span>Por mês:</span>
                            <span class="font-bold text-green-600">${formatCurrency(economia.economiaMensal)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Por ano:</span>
                            <span class="font-bold text-green-600">${formatCurrency(economia.economiaAnual)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Em 25 anos:</span>
                            <span class="font-bold text-green-600">${formatCurrency(economia.economia25Anos)}</span>
                        </div>
                        <div class="border-t border-green-200 pt-2 mt-2 space-y-1">
                            <div class="flex justify-between">
                                <span class="font-bold">Payback:</span>
                                <span class="font-bold text-green-800">${paybackAnos} anos</span>
                            </div>
                            ${tir > 0 ? `<div class="flex justify-between">
                                <span class="text-xs">TIR:</span>
                                <span class="font-semibold text-xs">${tir}% a.a.</span>
                            </div>` : ''}
                            ${vpl !== 0 ? `<div class="flex justify-between">
                                <span class="text-xs">VPL:</span>
                                <span class="font-semibold text-xs">${formatCurrency(vpl)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Valores -->
                <div class="border-t-2 pt-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm text-gray-600">Custo Total:</span>
                        <span class="text-sm line-through text-gray-400">${formatCurrency(custos.custoTotal)}</span>
                    </div>
                    <div class="flex justify-between mb-3">
                        <span class="font-bold">Valor Final:</span>
                        <span class="font-bold text-2xl text-green-600">${formatCurrency(custos.valorVenda)}</span>
                    </div>
                    <button onclick="verMemoriaCalculo(${index})" class="w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600 mb-2">
                        <i class="fas fa-file-invoice mr-2"></i>Ver Memória de Cálculo
                    </button>
                    <button onclick="gerarPropostaComercial(${index})" class="w-full text-white py-2 rounded-lg text-sm" style="background: #309086;" onmouseover="this.style.background='#267269'" onmouseout="this.style.background='#309086'">
                        <i class="fas fa-file-pdf mr-2"></i>Gerar Proposta
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Armazenar resultado globalmente para uso posterior
    window.ultimoResultadoSimulador = resultado;
}

function verMemoriaCalculo(propostaIndex) {
    const resultado = window.ultimoResultadoSimulador;
    if (!resultado) return;

    const proposta = resultado.propostas[propostaIndex];
    const { configuracao, custos, economia } = proposta;

    const html = `
        <div class="max-w-4xl mx-auto bg-white p-8">
            <h2 class="text-2xl font-bold mb-6 text-center">MEMÓRIA DE CÁLCULO - SISTEMA FOTOVOLTAICO</h2>

            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3 border-b-2 pb-2">1. DADOS DO PROJETO</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Local:</strong> ${resultado.localizacao.cidade} - ${resultado.localizacao.estado}
                    </div>
                    <div>
                        <strong>Irradiação Solar:</strong> ${resultado.localizacao.irradiacao} kWh/m²/dia
                    </div>
                    <div>
                        <strong>Potência do Sistema:</strong> ${configuracao.potenciaRealKwp} kWp
                    </div>
                    <div>
                        <strong>Geração Mensal:</strong> ${resultado.dimensionamento.energiaMensalNecessaria} kWh
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3 border-b-2 pb-2">2. CUSTOS DE MATERIAIS</h3>
                <table class="w-full text-sm">
                    <tr class="border-b">
                        <td class="py-2">Placas Solares (${configuracao.numModulos}x ${configuracao.placa.potencia}Wp)</td>
                        <td class="py-2 text-right">${formatCurrency(custos.materiais.placas)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Inversor ${custos.inversor.fabricante} ${custos.inversor.potencia_kw}kW</td>
                        <td class="py-2 text-right">${formatCurrency(custos.materiais.inversor)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Estrutura de Fixação</td>
                        <td class="py-2 text-right">${formatCurrency(custos.materiais.estrutura)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Cabeamento e Conectores</td>
                        <td class="py-2 text-right">${formatCurrency(custos.materiais.cabeamento)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">String Box e Proteções</td>
                        <td class="py-2 text-right">${formatCurrency(custos.materiais.stringBox + custos.materiais.disjuntores)}</td>
                    </tr>
                    <tr class="bg-gray-100 font-bold">
                        <td class="py-2">SUBTOTAL MATERIAIS</td>
                        <td class="py-2 text-right">${formatCurrency(custos.materiais.total)}</td>
                    </tr>
                </table>
            </div>

            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3 border-b-2 pb-2">3. CUSTOS DE SERVIÇOS</h3>
                <table class="w-full text-sm">
                    <tr class="border-b">
                        <td class="py-2">Mão de Obra (R$ 800/kWp)</td>
                        <td class="py-2 text-right">${formatCurrency(custos.servicos.maoObra)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Projeto e ART</td>
                        <td class="py-2 text-right">${formatCurrency(custos.servicos.projeto)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Homologação na Concessionária</td>
                        <td class="py-2 text-right">${formatCurrency(custos.servicos.homologacao)}</td>
                    </tr>
                    <tr class="bg-gray-100 font-bold">
                        <td class="py-2">SUBTOTAL SERVIÇOS</td>
                        <td class="py-2 text-right">${formatCurrency(custos.servicos.total)}</td>
                    </tr>
                </table>
            </div>

            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3 border-b-2 pb-2">4. COMPOSIÇÃO DE PREÇO</h3>
                <table class="w-full text-sm">
                    <tr class="border-b">
                        <td class="py-2">Custo Total do Projeto</td>
                        <td class="py-2 text-right font-bold">${formatCurrency(custos.custoTotal)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Margem de Lucro (${custos.margemPercentual}%)</td>
                        <td class="py-2 text-right text-green-600 font-bold">+ ${formatCurrency(custos.lucro)}</td>
                    </tr>
                    <tr class="bg-green-50 font-bold text-lg">
                        <td class="py-3">VALOR DE VENDA</td>
                        <td class="py-3 text-right text-green-600">${formatCurrency(custos.valorVenda)}</td>
                    </tr>
                </table>
            </div>

            <div class="mb-6">
                <h3 class="text-lg font-bold mb-3 border-b-2 pb-2">5. RETORNO DO INVESTIMENTO</h3>
                <table class="w-full text-sm">
                    <tr class="border-b">
                        <td class="py-2">Economia Mensal</td>
                        <td class="py-2 text-right">${formatCurrency(economia.economiaMensal)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Economia Anual</td>
                        <td class="py-2 text-right">${formatCurrency(economia.economiaAnual)}</td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">Payback do Investimento</td>
                        <td class="py-2 text-right font-bold text-blue-600">${Math.round(custos.valorVenda / economia.economiaMensal / 12 * 10) / 10} anos</td>
                    </tr>
                    <tr class="bg-blue-50">
                        <td class="py-2 font-bold">Economia Total (25 anos)</td>
                        <td class="py-2 text-right font-bold text-blue-600">${formatCurrency(economia.economia25Anos)}</td>
                    </tr>
                </table>
            </div>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                <h3 class="font-bold text-yellow-800 mb-2">💡 RESUMO FINANCEIRO PARA O INTEGRADOR</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Investimento:</strong> ${formatCurrency(custos.custoTotal)}
                    </div>
                    <div>
                        <strong class="text-green-600">Lucro Bruto:</strong> ${formatCurrency(custos.lucro)}
                    </div>
                    <div>
                        <strong>Valor de Venda:</strong> ${formatCurrency(custos.valorVenda)}
                    </div>
                    <div>
                        <strong class="text-green-600">Margem:</strong> ${custos.margemPercentual}%
                    </div>
                </div>
            </div>

            <div class="text-center text-xs text-gray-500 mt-8">
                <p>Cálculo gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                <p>Sistema: CRM Solar - Sunbotic Energia Solar</p>
            </div>
        </div>
    `;

    // Abrir em nova janela para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Memória de Cálculo - ${configuracao.placa.fabricante}</title>
            <link href="https://cdn.tailwindcss.com" rel="stylesheet">
            <style>
                @media print {
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body class="p-8">
            ${html}
            <div class="text-center mt-8 no-print">
                <button onclick="window.print()" class="bg-blue-500 text-white px-6 py-2 rounded">Imprimir</button>
                <button onclick="window.close()" class="bg-gray-300 text-gray-700 px-6 py-2 rounded ml-2">Fechar</button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

async function gerarPropostaComercial(propostaIndex) {
    showNotification('Gerando proposta comercial...', 'info');
    // TODO: Integrar com geração de PDF da proposta
    // Por enquanto, apenas mostra a memória de cálculo
    verMemoriaCalculo(propostaIndex);
}

async function salvarCalculoNoLead(leadId, resultado) {
    try {
        // Salvar o cálculo na tabela de interações como nota
        const melhorProposta = resultado.propostas[0];

        await supabase
            .from('interacoes')
            .insert([{
                lead_id: leadId,
                tipo: 'nota',
                titulo: `Cálculo Solar - ${melhorProposta.configuracao.potenciaRealKwp} kWp`,
                descricao: `Sistema calculado: ${melhorProposta.configuracao.numModulos}x ${melhorProposta.configuracao.placa.potencia}Wp | Valor: ${formatCurrency(melhorProposta.custos.valorVenda)} | Payback: ${melhorProposta.payback.anos} anos`
            }]);

        console.log('Cálculo salvo no lead');
    } catch (error) {
        console.error('Erro ao salvar cálculo:', error);
    }
}

// Exportar para uso global
window.showModule = showModule;
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;
window.showTab = showTab;
window.toggleSidebar = toggleSidebar;
window.refreshData = refreshData;
window.filterKanban = filterKanban;
window.exportLeads = exportLeads;
window.showNewLeadModal = showNewLeadModal;
window.closeNewLeadModal = closeNewLeadModal;
window.editLead = (id) => openLeadModal(id);
window.deleteLead = deleteLead;
window.trackProposta = trackProposta;
window.concluirTarefa = concluirTarefa;
window.logout = logout;
window.toggleEditLead = toggleEditLead;
window.showAddInteractionForm = showAddInteractionForm;
window.hideAddInteractionForm = hideAddInteractionForm;
window.salvarNovaInteracao = salvarNovaInteracao;
window.editarTarefa = editarTarefa;
window.closeEditTaskModal = closeEditTaskModal;
window.salvarEdicaoTarefa = salvarEdicaoTarefa;
window.deletarTarefa = deletarTarefa;
window.novaTarefa = novaTarefa;
window.abrirProposta = abrirProposta;
window.copiarLinkProposta = copiarLinkProposta;
window.abrirSimuladorSolar = abrirSimuladorSolar;
window.closeSimuladorSolar = closeSimuladorSolar;
window.calcularSistema = calcularSistema;
window.verMemoriaCalculo = verMemoriaCalculo;
window.gerarPropostaComercial = gerarPropostaComercial;

console.log('✅ CRM Solar carregado com sucesso!');
