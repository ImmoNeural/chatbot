// =========================================
// CRM ENERGIA SOLAR - JavaScript Principal
// =========================================

// Configuração Supabase
const SUPABASE_URL = 'https://zralzmgsdmwispfvgqvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYWx6bWdzZG13aXNwZnZncXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzA1NTYsImV4cCI6MjA3OTQwNjU1Nn0.lAarNVapj0c6A-1ix6PISUya0wMcRzruta1GECtwDD8';

// Expor variáveis globais para outros módulos
window.supabaseUrl = SUPABASE_URL;
window.supabaseAnonKey = SUPABASE_KEY;

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado Global - Autenticação
let currentUser = null;     // Usuário logado (da tabela usuarios)
let currentEmpresa = null;  // Empresa do usuário
let authUser = null;        // Usuário do Supabase Auth

// Estado Global
let currentModule = 'dashboard';
let currentLead = null;
let currentStage = null; // Estágio atual do lead no Kanban
let leads = [];
let oportunidades = [];
let propostas = [];
let instalados = [];
let instalacoes = []; // Dados de agendamento de instalação (tabela instalacao)
let tarefas = [];
let kpis = {};
let interacoesStats = {}; // Estatísticas de interações por lead_id
let notificacoes = []; // Notificações do sistema de automação

// =========================================
// FUNÇÕES DE AUTENTICAÇÃO
// =========================================
async function loadCurrentUser() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            console.log('Usuário não autenticado, redirecionando...');
            window.location.href = 'login.html';
            return false;
        }

        authUser = session.user;
        window.authUser = authUser;

        // Buscar dados do usuário na tabela usuarios
        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .select('*, empresas(*)')
            .eq('id', authUser.id)
            .single();

        if (userError) {
            // Se não encontrar na tabela usuarios, pode ser usuário antigo
            // Criar entrada na tabela usuarios
            console.log('Usuário não encontrado na tabela usuarios, criando...');

            // Verificar se existe empresa padrão
            const { data: empresa } = await supabase
                .from('empresas')
                .select('*')
                .eq('email', 'neurekaai@gmail.com')
                .single();

            if (empresa) {
                // Criar usuário vinculado à empresa padrão
                const { data: novoUsuario, error: createError } = await supabase
                    .from('usuarios')
                    .insert({
                        id: authUser.id,
                        empresa_id: empresa.id,
                        nome: authUser.user_metadata?.nome || authUser.email.split('@')[0],
                        email: authUser.email,
                        cargo: 'admin'
                    })
                    .select('*, empresas(*)')
                    .single();

                if (createError) {
                    console.error('Erro ao criar usuário:', createError);
                    return false;
                }

                currentUser = novoUsuario;
                currentEmpresa = empresa;
            }
        } else {
            currentUser = usuario;
            currentEmpresa = usuario.empresas;
        }

        // Expor globalmente
        window.currentUser = currentUser;
        window.currentEmpresa = currentEmpresa;

        // Atualizar header com info do usuário
        updateUserHeader();

        console.log('👤 Usuário:', currentUser?.nome);
        console.log('🏢 Empresa:', currentEmpresa?.nome);

        return true;
    } catch (err) {
        console.error('Erro ao carregar usuário:', err);
        return false;
    }
}

function updateUserHeader() {
    // Procurar ou criar área do usuário no header
    let userArea = document.getElementById('user-header-area');

    if (!userArea) {
        // Criar área do usuário no header (perto do botão Atualizar)
        const header = document.querySelector('header');
        if (header) {
            const rightArea = header.querySelector('.flex.items-center.gap-4');
            if (rightArea) {
                userArea = document.createElement('div');
                userArea.id = 'user-header-area';
                userArea.className = 'flex items-center gap-3 ml-4 pl-4 border-l border-gray-200';
                userArea.innerHTML = `
                    <div class="text-right">
                        <div class="text-sm font-medium text-gray-700" id="header-user-name">${currentUser?.nome || 'Usuário'}</div>
                        <div class="text-xs text-gray-500" id="header-empresa-name">${currentEmpresa?.nome || 'Empresa'}</div>
                    </div>
                    <div class="relative">
                        <button onclick="toggleUserMenu()" class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                            ${getInitials(currentUser?.nome || 'U')}
                        </button>
                        <div id="user-menu" class="hidden absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                            <div class="px-4 py-2 border-b border-gray-100">
                                <div class="text-sm font-medium text-gray-700">${currentUser?.nome}</div>
                                <div class="text-xs text-gray-500">${currentUser?.email}</div>
                            </div>
                            <a href="#" onclick="showProfile()" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <i class="fas fa-user"></i> Meu Perfil
                            </a>
                            <a href="#" onclick="showEmpresaSettings()" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <i class="fas fa-building"></i> Configurações
                            </a>
                            <hr class="my-1">
                            <a href="#" onclick="handleLogout()" class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <i class="fas fa-sign-out-alt"></i> Sair
                            </a>
                        </div>
                    </div>
                `;
                rightArea.appendChild(userArea);
            }
        }
    }
}

function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Função para inferir gênero pelo primeiro nome (padrões brasileiros)
function inferirGenero(nome) {
    if (!nome) return 'desconhecido';

    const primeiroNome = nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Nomes femininos comuns que terminam em 'o' (exceções)
    const nomesFemininosExcecao = ['socorro', 'conceicao', 'aparecida'];
    if (nomesFemininosExcecao.includes(primeiroNome)) return 'feminino';

    // Nomes masculinos comuns que terminam em 'a' (exceções)
    const nomesMasculinosExcecao = ['josue', 'andre', 'felipe', 'henrique', 'jorge', 'jose', 'luca', 'nikolas'];
    if (nomesMasculinosExcecao.includes(primeiroNome)) return 'masculino';

    // Regras gerais por terminação
    if (primeiroNome.endsWith('a') || primeiroNome.endsWith('e') && !primeiroNome.endsWith('ue')) {
        return 'feminino';
    }
    if (primeiroNome.endsWith('o') || primeiroNome.endsWith('os') || primeiroNome.endsWith('or') || primeiroNome.endsWith('son')) {
        return 'masculino';
    }

    // Nomes comuns
    const nomesFemininos = ['julia', 'camila', 'fernanda', 'patricia', 'sabrina', 'maria', 'ana', 'beatriz', 'larissa', 'leticia', 'gabriela', 'isabela', 'amanda', 'bruna', 'carol', 'daniela'];
    const nomesMasculinos = ['joao', 'pedro', 'lucas', 'rafael', 'bruno', 'diego', 'roberto', 'carlos', 'daniel', 'gabriel', 'matheus', 'gustavo', 'thiago', 'leonardo', 'marcos', 'rodrigo'];

    if (nomesFemininos.includes(primeiroNome)) return 'feminino';
    if (nomesMasculinos.includes(primeiroNome)) return 'masculino';

    return 'masculino'; // Default
}

// SVG de avatar masculino (homem de negócios)
const svgAvatarMasculino = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="36" r="20" fill="#e8beac"/>
    <ellipse cx="50" cy="85" rx="35" ry="25" fill="#2d3748"/>
    <path d="M50 56 L35 85 L50 75 L65 85 Z" fill="#1a202c"/>
    <rect x="46" y="56" width="8" height="12" fill="white"/>
    <polygon points="50,56 42,68 50,65 58,68" fill="#c53030"/>
    <path d="M30 30 Q35 15 50 15 Q65 15 70 30 Q70 35 65 36 L60 25 Q50 20 40 25 L35 36 Q30 35 30 30" fill="#1a202c"/>
</svg>`;

// SVG de avatar feminino (mulher de negócios)
const svgAvatarFeminino = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="36" r="20" fill="#e8beac"/>
    <ellipse cx="50" cy="85" rx="35" ry="25" fill="#d69e2e"/>
    <path d="M25 28 Q30 5 50 8 Q70 5 75 28 Q78 45 70 50 L65 35 Q50 30 35 35 L30 50 Q22 45 25 28" fill="#5c4033"/>
    <circle cx="38" cy="40" r="3" fill="#e8beac"/>
    <circle cx="62" cy="40" r="3" fill="#e8beac"/>
</svg>`;

// SVG de avatar empresa
const svgAvatarEmpresa = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="30" width="50" height="55" fill="white" rx="2"/>
    <rect x="30" y="35" width="10" height="10" fill="#60a5fa"/>
    <rect x="45" y="35" width="10" height="10" fill="#60a5fa"/>
    <rect x="60" y="35" width="10" height="10" fill="#60a5fa"/>
    <rect x="30" y="50" width="10" height="10" fill="#60a5fa"/>
    <rect x="45" y="50" width="10" height="10" fill="#60a5fa"/>
    <rect x="60" y="50" width="10" height="10" fill="#60a5fa"/>
    <rect x="30" y="65" width="10" height="10" fill="#60a5fa"/>
    <rect x="60" y="65" width="10" height="10" fill="#60a5fa"/>
    <rect x="43" y="65" width="14" height="20" fill="#1e40af"/>
</svg>`;

// Função para obter o ícone do avatar baseado no tipo de lead
function getLeadAvatarIcon(lead) {
    if (lead.tipo_cliente === 'empresarial') {
        return {
            bgColor: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
            title: 'Empresa',
            svg: svgAvatarEmpresa
        };
    }

    const genero = inferirGenero(lead.nome);

    if (genero === 'feminino') {
        return {
            bgColor: 'linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)',
            title: 'Pessoa Física (Feminino)',
            svg: svgAvatarFeminino
        };
    }

    return {
        bgColor: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)',
        title: 'Pessoa Física (Masculino)',
        svg: svgAvatarMasculino
    };
}

// Cores pastel bonitas para avatares (mantido para compatibilidade)
const avatarColors = [
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

function getAvatarColor(name) {
    if (!name) return avatarColors[0];
    const charCode = name.charCodeAt(0);
    return avatarColors[charCode % avatarColors.length];
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Fechar menu ao clicar fora
document.addEventListener('click', (e) => {
    const menu = document.getElementById('user-menu');
    const userArea = document.getElementById('user-header-area');
    if (menu && userArea && !userArea.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

async function handleLogout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Erro ao fazer logout:', err);
        showNotification('Erro ao sair', 'danger');
    }
}

function showProfile() {
    // TODO: Implementar tela de perfil
    showNotification('Perfil em desenvolvimento', 'info');
    toggleUserMenu();
}

function showEmpresaSettings() {
    // TODO: Implementar configurações da empresa
    showNotification('Configurações em desenvolvimento', 'info');
    toggleUserMenu();
}

// Charts
let funnelChart = null;
let conversionChart = null;
let leadsStatusChart = null;
let propostasResultChart = null;

// =========================================
// INICIALIZAÇÃO
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando CRM Solar...');

    // PRIMEIRO: Carregar informações do usuário (inclui verificação de autenticação)
    const userLoaded = await loadCurrentUser();
    if (!userLoaded) {
        console.log('Falha ao carregar usuário');
        return;
    }

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

    // Carregar dados iniciais (agora filtrados pela empresa do usuário via RLS)
    await loadAllData();

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
            loadInstalacoes(),
            loadTarefas(),
            loadKPIs(),
            loadInteracoesStats(),
            loadNotificacoes()
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
                consumo_mensal,
                status
            )
        `)
        .neq('etapa', 'perdido')
        .neq('etapa', 'concluida')  // Excluir oportunidades concluídas (clientes instalados)
        .order('data_ultima_atualizacao', { ascending: false });

    if (error) {
        console.error('Erro ao carregar oportunidades:', error);
        return;
    }

    oportunidades = data || [];
    console.log(`💼 ${oportunidades.length} oportunidades carregadas`);
}

async function loadPropostas() {
    const empresaId = window.currentEmpresa?.id;

    let query = supabase
        .from('propostas')
        .select(`
            *,
            oportunidades:oportunidade_id (
                lead_id,
                leads:lead_id (nome, email, tipo_cliente)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    // Só filtra por empresa se empresaId existir
    if (empresaId) {
        query = query.eq('empresa_id', empresaId);
    }

    const { data, error } = await query;

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

async function loadInstalacoes() {
    const { data, error } = await supabase
        .from('instalacao')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar instalações:', error);
        return;
    }

    instalacoes = data || [];
    console.log(`✅ ${instalacoes.length} instalações agendadas`);
}

async function loadInteracoesStats() {
    // Carregar todas as interações
    const { data: interacoes, error: intError } = await supabase
        .from('interacoes')
        .select('lead_id, tipo');

    if (intError) {
        console.error('Erro ao carregar interações:', intError);
        return;
    }

    // Carregar todas as propostas
    const { data: props, error: propError } = await supabase
        .from('propostas')
        .select('oportunidade_id, oportunidades!inner(lead_id)');

    if (propError) {
        console.error('Erro ao carregar propostas para stats:', propError);
    }

    // Carregar instalações
    const { data: installs, error: instError } = await supabase
        .from('clientes_instalados')
        .select('lead_id');

    if (instError) {
        console.error('Erro ao carregar instalações para stats:', instError);
    }

    // Processar estatísticas por lead_id
    interacoesStats = {};

    // Contar interações por tipo
    (interacoes || []).forEach(int => {
        if (!interacoesStats[int.lead_id]) {
            interacoesStats[int.lead_id] = {
                emails: 0,
                chamadas: 0,
                propostas: 0,
                instalacoes: 0
            };
        }

        if (int.tipo === 'email') interacoesStats[int.lead_id].emails++;
        else if (int.tipo === 'chamada') interacoesStats[int.lead_id].chamadas++;
    });

    // Contar propostas
    (props || []).forEach(prop => {
        const leadId = prop.oportunidades?.lead_id;
        if (leadId) {
            if (!interacoesStats[leadId]) {
                interacoesStats[leadId] = {
                    emails: 0,
                    chamadas: 0,
                    propostas: 0,
                    instalacoes: 0
                };
            }
            interacoesStats[leadId].propostas++;
        }
    });

    // Contar instalações
    (installs || []).forEach(inst => {
        if (!interacoesStats[inst.lead_id]) {
            interacoesStats[inst.lead_id] = {
                emails: 0,
                chamadas: 0,
                propostas: 0,
                instalacoes: 0
            };
        }
        interacoesStats[inst.lead_id].instalacoes++;
    });

    console.log(`📊 Estatísticas de interações carregadas para ${Object.keys(interacoesStats).length} leads`);
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
    console.log('📍 showModule chamado:', moduleName);
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
    console.log('📍 renderCurrentModule:', currentModule);
    switch(currentModule) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'kanban':
            renderKanban();
            break;
        case 'leads':
            console.log('📍 Chamando filterLeads...');
            filterLeads(); // Usar filterLeads para respeitar os filtros ativos
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
            title: 'Receita Total',
            value: formatCurrency(kpis.receita_total),
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
    renderLeadsStatusChart();
    renderPropostasResultChart();
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

function renderLeadsStatusChart() {
    const ctx = document.getElementById('leadsStatusChart');
    if (!ctx) return;

    // Contar leads por status
    const statusCounts = {
        novo: leads.filter(l => l.status === 'novo').length,
        qualificado: leads.filter(l => l.status === 'qualificado').length,
        em_nutricao: leads.filter(l => l.status === 'em_nutricao').length,
        nao_qualificado: leads.filter(l => l.status === 'nao_qualificado').length,
        convertido: leads.filter(l => l.status === 'convertido').length,
        perdido: leads.filter(l => l.status === 'perdido').length
    };

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    document.getElementById('totalLeadsCount').textContent = total;

    const statusLabels = {
        novo: 'Novo',
        qualificado: 'Qualificado',
        em_nutricao: 'Em Nutrição',
        nao_qualificado: 'Não Qualificado',
        convertido: 'Convertido',
        perdido: 'Perdido'
    };

    const statusColors = {
        novo: '#fb923c',        // Laranja
        qualificado: '#14b8a6', // Teal
        em_nutricao: '#a78bfa', // Roxo
        nao_qualificado: '#9ca3af', // Cinza
        convertido: '#22c55e',  // Verde
        perdido: '#ef4444'      // Vermelho
    };

    // Filtrar apenas status com valores > 0
    const activeStatuses = Object.entries(statusCounts).filter(([_, count]) => count > 0);

    if (leadsStatusChart) leadsStatusChart.destroy();

    leadsStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: activeStatuses.map(([status, _]) => statusLabels[status]),
            datasets: [{
                data: activeStatuses.map(([_, count]) => count),
                backgroundColor: activeStatuses.map(([status, _]) => statusColors[status]),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Renderizar legenda customizada
    const legendContainer = document.getElementById('leadsStatusLegend');
    legendContainer.innerHTML = activeStatuses.map(([status, count]) => `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            <div class="w-3 h-3 rounded-full" style="background: ${statusColors[status]}"></div>
            <span class="text-gray-700">${statusLabels[status]}</span>
            <span class="font-bold text-gray-800 ml-auto">${count}</span>
        </div>
    `).join('');
}

function renderPropostasResultChart() {
    const ctx = document.getElementById('propostasResultChart');
    if (!ctx) return;

    // Contar propostas por status e tipo (acesso via oportunidades -> leads)
    const getTipoCliente = (p) => p.oportunidades?.leads?.tipo_cliente || 'residencial';

    const propostasCounts = {
        aceita_residencial: propostas.filter(p => p.status === 'aceita' && getTipoCliente(p) === 'residencial').length,
        aceita_empresarial: propostas.filter(p => p.status === 'aceita' && getTipoCliente(p) === 'empresarial').length,
        recusada_residencial: propostas.filter(p => p.status === 'recusada' && getTipoCliente(p) === 'residencial').length,
        recusada_empresarial: propostas.filter(p => p.status === 'recusada' && getTipoCliente(p) === 'empresarial').length,
        pendente_residencial: propostas.filter(p => ['enviada', 'visualizada'].includes(p.status) && getTipoCliente(p) === 'residencial').length,
        pendente_empresarial: propostas.filter(p => ['enviada', 'visualizada'].includes(p.status) && getTipoCliente(p) === 'empresarial').length
    };

    const total = Object.values(propostasCounts).reduce((a, b) => a + b, 0);
    document.getElementById('totalPropostasCount').textContent = total;

    const labels = {
        aceita_residencial: 'Aceitas (Residencial)',
        aceita_empresarial: 'Aceitas (Empresarial)',
        recusada_residencial: 'Recusadas (Residencial)',
        recusada_empresarial: 'Recusadas (Empresarial)',
        pendente_residencial: 'Pendentes (Residencial)',
        pendente_empresarial: 'Pendentes (Empresarial)'
    };

    const colors = {
        aceita_residencial: '#22c55e',     // Verde claro
        aceita_empresarial: '#15803d',     // Verde escuro
        recusada_residencial: '#f87171',   // Vermelho claro
        recusada_empresarial: '#dc2626',   // Vermelho escuro
        pendente_residencial: '#60a5fa',   // Azul claro
        pendente_empresarial: '#2563eb'    // Azul escuro
    };

    // Filtrar apenas com valores > 0
    const activeCategories = Object.entries(propostasCounts).filter(([_, count]) => count > 0);

    if (propostasResultChart) propostasResultChart.destroy();

    propostasResultChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: activeCategories.map(([key, _]) => labels[key]),
            datasets: [{
                data: activeCategories.map(([_, count]) => count),
                backgroundColor: activeCategories.map(([key, _]) => colors[key]),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Renderizar legenda customizada
    const legendContainer = document.getElementById('propostasResultLegend');
    legendContainer.innerHTML = activeCategories.map(([key, count]) => `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            <div class="w-3 h-3 rounded-full" style="background: ${colors[key]}"></div>
            <span class="text-gray-700 text-xs">${labels[key]}</span>
            <span class="font-bold text-gray-800 ml-auto">${count}</span>
        </div>
    `).join('');
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
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background: ${getAvatarColor(lead.nome || lead.email)};">
                    ${(lead.nome || lead.email || '?').charAt(0).toUpperCase()}
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
        // Buscar oportunidade atual
        const oportunidade = oportunidades.find(o => o.id === id);
        if (!oportunidade) {
            throw new Error('Oportunidade não encontrada');
        }

        const etapaAtual = oportunidade.etapa;

        // Definir ordem das etapas
        const etapas = ['levantamento', 'simulacao', 'proposta', 'negociacao', 'fechamento'];
        const indexAtual = etapas.indexOf(etapaAtual);
        const indexNova = etapas.indexOf(novaEtapa);

        // Validar se está movendo apenas para próxima ou anterior
        const diferencaEtapas = Math.abs(indexNova - indexAtual);
        if (diferencaEtapas > 1) {
            showNotification('❌ Você só pode mover para a etapa anterior ou próxima!', 'danger');
            await loadOportunidades();
            renderKanban();
            return;
        }

        // Se está movendo para frente (próxima etapa), validar completude
        if (indexNova > indexAtual) {
            const validacao = await validarCompletudeEtapa(oportunidade.lead_id, etapaAtual);
            if (!validacao.completo) {
                showNotification(`❌ Complete os requisitos antes de avançar: ${validacao.mensagem}`, 'danger');
                await loadOportunidades();
                renderKanban();
                return;
            }
        }

        // Atualizar etapa
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

        const nomesEtapas = {
            'levantamento': 'Levantamento',
            'simulacao': 'Simulação',
            'proposta': 'Proposta',
            'negociacao': 'Negociação',
            'fechamento': 'Fechamento'
        };

        showNotification(`✅ Oportunidade movida para ${nomesEtapas[novaEtapa]}!`, 'success');
        await loadOportunidades();
        renderKanban();
    } catch (error) {
        console.error('Erro ao atualizar etapa:', error);
        showNotification('Erro ao mover oportunidade', 'danger');
        await loadOportunidades();
        renderKanban();
    }
}

// Função para validar se a etapa está completa antes de avançar
async function validarCompletudeEtapa(leadId, etapa) {
    try {
        switch (etapa) {
            case 'levantamento':
                // Verificar se tem documentos/fotos ou qualificação preenchida
                const { data: qualificacao } = await supabase
                    .from('qualificacao')
                    .select('*')
                    .eq('lead_id', leadId)
                    .single();

                if (!qualificacao || !qualificacao.telhado_bom_estado) {
                    return {
                        completo: false,
                        mensagem: 'Preencha a qualificação técnica do lead'
                    };
                }
                break;

            case 'simulacao':
                // Verificar se tem proposta gerada
                // Primeiro buscar a oportunidade do lead
                const { data: oportunidade, error: oppError } = await supabase
                    .from('oportunidades')
                    .select('id')
                    .eq('lead_id', leadId)
                    .single();

                console.log('🔍 Validação Simulação - Oportunidade:', oportunidade, oppError);

                if (!oportunidade) {
                    return {
                        completo: false,
                        mensagem: 'Oportunidade não encontrada'
                    };
                }

                // Depois buscar proposta pela oportunidade
                const { data: propostas, error: propError } = await supabase
                    .from('propostas')
                    .select('*')
                    .eq('oportunidade_id', oportunidade.id);

                console.log('🔍 Validação Simulação - Propostas encontradas:', propostas, propError);

                if (!propostas || propostas.length === 0) {
                    return {
                        completo: false,
                        mensagem: 'Gere o projeto solar antes de enviar proposta'
                    };
                }

                console.log('✅ Validação passou - proposta encontrada!');
                break;

            case 'proposta':
                // Para avançar de Proposta para Negociação, basta ter proposta enviada
                // (já validado na etapa anterior)
                break;

            case 'negociacao':
                // Verificar se proposta foi aceita
                console.log('🔍 Validação Negociação - leadId:', leadId);

                const { data: oppNegociacao, error: oppNegError } = await supabase
                    .from('oportunidades')
                    .select('id')
                    .eq('lead_id', leadId)
                    .maybeSingle();

                console.log('🔍 Oportunidade encontrada:', oppNegociacao, 'Erro:', oppNegError);

                if (oppNegociacao) {
                    const { data: propostasAceitas, error: propAceitaError } = await supabase
                        .from('propostas')
                        .select('id, status, oportunidade_id')
                        .eq('oportunidade_id', oppNegociacao.id)
                        .eq('status', 'aceita');

                    console.log('🔍 Propostas aceitas:', propostasAceitas, 'Erro:', propAceitaError);

                    // Também vamos ver TODAS as propostas dessa oportunidade
                    const { data: todasPropostas } = await supabase
                        .from('propostas')
                        .select('id, status, oportunidade_id')
                        .eq('oportunidade_id', oppNegociacao.id);

                    console.log('🔍 TODAS as propostas da oportunidade:', todasPropostas);

                    if (!propostasAceitas || propostasAceitas.length === 0) {
                        return {
                            completo: false,
                            mensagem: 'A proposta precisa estar aceita para ir ao fechamento'
                        };
                    }
                } else {
                    console.log('⚠️ Nenhuma oportunidade encontrada para este lead');
                }
                break;

            case 'fechamento':
                // Verificar se tem ART, homologação e data preenchidos
                const { data: instalacao } = await supabase
                    .from('instalacao')
                    .select('*')
                    .eq('lead_id', leadId)
                    .single();

                if (!instalacao || !instalacao.numero_art || !instalacao.protocolo_homologacao || !instalacao.data_agendamento_instalacao) {
                    return {
                        completo: false,
                        mensagem: 'Preencha ART, Homologação e Data de Instalação'
                    };
                }
                break;
        }

        return { completo: true };
    } catch (error) {
        console.error('Erro ao validar completude:', error);
        // Em caso de erro, permitir movimentação
        return { completo: true };
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

            // Pegar estatísticas de interações
            const stats = interacoesStats[oportunidade.lead_id] || {
                emails: 0,
                chamadas: 0,
                propostas: 0,
                instalacoes: 0
            };

            // Formatar data da última atualização
            const dataAtualizacao = new Date(oportunidade.data_ultima_atualizacao || oportunidade.created_at);
            const dataFormatada = dataAtualizacao.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const horaFormatada = dataAtualizacao.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Verificar se há instalação agendada (buscar no array instalacoes pela tabela instalacao)
            const instalacao = instalacoes.find(inst => inst.lead_id === oportunidade.lead_id);
            const temInstalacaoAgendada = instalacao?.data_agendamento_instalacao;

            // Determinar badge/ícone de status
            let statusBadge = '';
            let statusColor = '';
            let statusText = '';
            let statusIcon = '';

            if (temInstalacaoAgendada) {
                // Mostrar troféu se tiver instalação agendada
                statusIcon = '🏆';
                statusText = 'Instalação Agendada';
                statusColor = 'text-yellow-600';
            } else if (lead?.status === 'perdido') {
                statusBadge = 'bg-red-500';
                statusColor = 'text-red-500';
                statusText = 'Perdido';
            } else if (lead?.status === 'qualificado') {
                statusBadge = 'bg-green-500';
                statusColor = 'text-green-500';
                statusText = 'Qualificado';
            } else if (lead?.status === 'em_nutricao') {
                statusBadge = 'bg-orange-500';
                statusColor = 'text-orange-500';
                statusText = 'Em Nutrição';
            }

            return `
                <div class="kanban-card ${isInactive ? 'inactive' : ''}" data-id="${oportunidade.id}" onclick="openLeadModal('${oportunidade.lead_id}')">
                    <!-- Cabeçalho com nome e estrela de favorito -->
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 text-sm">${lead?.nome || lead?.email || 'Lead sem nome'}</h4>
                            <p class="text-xs text-gray-500 mt-0.5">
                                <i class="fas fa-clock"></i> ${dataFormatada} ${horaFormatada}
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            ${statusIcon ? `
                                <div class="flex items-center gap-1" title="${statusText}">
                                    <span class="text-lg">${statusIcon}</span>
                                </div>
                            ` : statusBadge ? `
                                <div class="flex items-center gap-1.5" title="${statusText}">
                                    <div class="w-2 h-2 rounded-full ${statusBadge}"></div>
                                    <span class="text-xs font-medium ${statusColor}">${statusText.charAt(0)}</span>
                                </div>
                            ` : ''}
                            <button onclick="event.stopPropagation(); toggleFavorito('${oportunidade.id}')" class="focus:outline-none transition-transform hover:scale-110">
                                <i class="fas fa-star text-lg ${oportunidade.favorito ? 'text-yellow-400' : 'text-gray-300'}"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Valor e consumo -->
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-bold text-green-600">${formatCurrency(oportunidade.valor_estimado)}</span>
                        <span class="text-xs text-gray-600">
                            <i class="fas fa-bolt"></i> ${lead?.consumo_mensal || 0} kWh
                        </span>
                    </div>

                    <!-- Ícones de estatísticas -->
                    <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                        <!-- Email -->
                        <div class="flex items-center gap-1" title="${stats.emails} email(s) enviado(s)">
                            <i class="fas fa-envelope text-xs ${stats.emails > 0 ? 'text-blue-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.emails > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}">${stats.emails}</span>
                        </div>

                        <!-- Chamadas -->
                        <div class="flex items-center gap-1" title="${stats.chamadas} ligaç(ões) realizada(s)">
                            <i class="fas fa-phone text-xs ${stats.chamadas > 0 ? 'text-purple-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.chamadas > 0 ? 'text-purple-600 font-semibold' : 'text-gray-400'}">${stats.chamadas}</span>
                        </div>

                        <!-- Propostas -->
                        <div class="flex items-center gap-1" title="${stats.propostas} proposta(s) criada(s)">
                            <i class="fas fa-file-invoice-dollar text-xs ${stats.propostas > 0 ? 'text-green-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.propostas > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}">${stats.propostas}</span>
                        </div>

                        <!-- Instalações -->
                        <div class="flex items-center gap-1" title="${stats.instalacoes} instalação(ões) concluída(s)">
                            <i class="fas fa-solar-panel text-xs ${stats.instalacoes > 0 ? 'text-orange-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.instalacoes > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'}">${stats.instalacoes}</span>
                        </div>

                        <!-- Badge tipo cliente -->
                        <span class="badge badge-${lead?.tipo_cliente === 'empresarial' ? 'info' : 'gray'} text-xs">
                            ${lead?.tipo_cliente === 'empresarial' ? 'EMP' : 'RES'}
                        </span>
                    </div>

                    ${isInactive ? `<p class="text-xs text-red-500 mt-2"><i class="fas fa-exclamation-triangle"></i> ${diasInativo} dias sem atualização</p>` : ''}
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

async function toggleFavorito(oportunidadeId) {
    const oportunidade = oportunidades.find(o => o.id === oportunidadeId);
    if (!oportunidade) return;

    const novoEstado = !oportunidade.favorito;

    // Atualizar no banco
    const { error } = await supabase
        .from('oportunidades')
        .update({ favorito: novoEstado })
        .eq('id', oportunidadeId);

    if (error) {
        console.error('Erro ao atualizar favorito:', error);
        showNotification('Erro ao favoritar', 'danger');
        return;
    }

    // Atualizar localmente
    oportunidade.favorito = novoEstado;

    // Re-renderizar apenas o card específico (ou todo o Kanban)
    renderKanban();

    showNotification(
        novoEstado ? '⭐ Adicionado aos favoritos' : 'Removido dos favoritos',
        novoEstado ? 'success' : 'info'
    );
}

// =========================================
// TABELA DE LEADS
// =========================================

// Helper para obter dados da proposta do lead
function getLeadPropostaData(lead) {
    // Buscar oportunidade do lead nas listas globais
    const oportunidade = oportunidades.find(o => o.lead_id === lead.id);
    if (!oportunidade) {
        return { status: null, modulos: null, preco: null };
    }

    // Buscar proposta da oportunidade
    const proposta = propostas.find(p => p.oportunidade_id === oportunidade.id);
    if (!proposta) {
        return { status: null, modulos: null, preco: null };
    }

    return {
        status: proposta.status,
        modulos: proposta.num_modulos || proposta.numero_modulos,
        preco: proposta.valor_final
    };
}

// Helper para cor do status da proposta
function getPropostaStatusBadge(status) {
    const statusConfig = {
        enviada: { class: 'badge-info', label: 'Enviada' },
        visualizada: { class: 'badge-warning', label: 'Visualizada' },
        aceita: { class: 'badge-success', label: 'Aceita' },
        recusada: { class: 'badge-danger', label: 'Recusada' }
    };
    return statusConfig[status] || { class: 'badge-gray', label: '-' };
}

function renderLeadsTable() {
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;

    tbody.innerHTML = leads.map(lead => {
        const propostaData = getLeadPropostaData(lead);
        const propostaStatus = getPropostaStatusBadge(propostaData.status);
        const avatarInfo = getLeadAvatarIcon(lead);

        return `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden mr-3" style="background: ${avatarInfo.bgColor};" title="${avatarInfo.title}">
                        ${avatarInfo.svg}
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
            <td class="px-6 py-4">
                <span class="badge ${propostaStatus.class}">${propostaStatus.label}</span>
            </td>
            <td class="px-6 py-4 text-center font-semibold text-gray-700">
                ${propostaData.modulos || '-'}
            </td>
            <td class="px-6 py-4 font-semibold text-green-600">
                ${propostaData.preco ? formatCurrency(propostaData.preco) : '-'}
            </td>
            <td class="px-6 py-4">
                <button onclick="event.stopPropagation(); editLead('${lead.id}')" class="text-blue-600 hover:text-blue-800 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteLead('${lead.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="9" class="text-center py-8 text-gray-500">Nenhum lead encontrado</td></tr>';
}

// =========================================
// MODAL DE LEAD (Timeline)
// =========================================
async function openLeadModal(leadId) {
    console.log('🔍 openLeadModal chamado:', leadId);

    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
        console.error('❌ Lead não encontrado');
        return;
    }

    currentLead = lead;

    // Buscar oportunidade para determinar o estágio
    const { data: oportunidade } = await supabase
        .from('oportunidades')
        .select('etapa')
        .eq('lead_id', leadId)
        .single();

    currentStage = oportunidade?.etapa || null;

    // Preencher informações do lead
    document.getElementById('modal-lead-name').textContent = lead.nome || lead.email;
    document.getElementById('modal-lead-email').textContent = lead.email;

    // Configurar abas dinâmicas baseado no estágio
    configurarAbasDinamicas(currentStage);

    // Mostrar overlay e painel lateral com animação
    const overlay = document.getElementById('leadModalOverlay');
    const panel = document.getElementById('leadModal');

    if (!overlay || !panel) {
        console.error('❌ Elementos não encontrados!', { overlay, panel });
        // Fallback: tentar o método antigo
        document.getElementById('leadModal')?.classList.remove('hidden');
        await renderLeadInfo(lead);
        await renderLeadTimeline(leadId);
        await renderConteudoDinamico(leadId, currentStage);
        return;
    }

    console.log('✅ Abrindo painel lateral');
    overlay.classList.remove('hidden');
    panel.classList.remove('hidden');

    // Trigger animation após um pequeno delay para garantir transição
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        panel.classList.remove('translate-x-full');
        panel.classList.add('translate-x-0');
    }, 10);

    // Carregar abas
    await renderLeadInfo(lead);
    await renderLeadTimeline(leadId);
    await renderConteudoDinamico(leadId, currentStage);
}

function closeLeadModal() {
    const overlay = document.getElementById('leadModalOverlay');
    const panel = document.getElementById('leadModal');

    if (!overlay || !panel) {
        // Fallback
        document.getElementById('leadModal')?.classList.add('hidden');
        currentLead = null;
        hideAddInteractionForm();
        return;
    }

    // Animar saída
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');
    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');

    // Esconder após animação
    setTimeout(() => {
        overlay.classList.add('hidden');
        panel.classList.add('hidden');
    }, 300);

    currentLead = null;
    hideAddInteractionForm();
}

// Abrir WhatsApp para o lead atual no modal
function openWhatsAppForCurrentLead() {
    console.log('🔵 openWhatsAppForCurrentLead chamado');
    console.log('🔵 currentLead:', currentLead);
    console.log('🔵 window.comunicacaoState:', window.comunicacaoState);
    console.log('🔵 window.openConversation:', typeof window.openConversation);

    if (!currentLead) {
        showNotification('Nenhum lead selecionado', 'error');
        return;
    }

    // Verificar se o lead tem telefone
    if (!currentLead.phone && !currentLead.telefone) {
        showNotification('Este lead não possui telefone cadastrado', 'error');
        return;
    }

    // Configurar estado de comunicação e abrir conversa
    if (window.comunicacaoState && typeof window.openConversation === 'function') {
        console.log('🔵 Abrindo modal de conversa...');
        window.comunicacaoState.selectedLead = currentLead;
        window.comunicacaoState.conversationType = 'whatsapp';
        window.comunicacaoState.messages = [];
        window.comunicacaoState.conversationStartTime = new Date();
        window.openConversation();
    } else {
        // Fallback: abrir WhatsApp Web diretamente
        console.warn('🔵 Módulo de comunicação não disponível, abrindo WhatsApp Web');
        const phone = currentLead.phone || currentLead.telefone;
        const phoneClean = phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phoneClean}`;
        window.open(whatsappUrl, '_blank');
    }
}

function showAddInteractionForm() {
    document.getElementById('interaction-form').classList.remove('hidden');
    document.getElementById('btn-show-interaction-form').classList.add('hidden');
}

function hideAddInteractionForm() {
    document.getElementById('interaction-form').classList.add('hidden');
    document.getElementById('btn-show-interaction-form').classList.remove('hidden');
    // Limpar campos
    document.getElementById('new-interaction-type').value = 'chamada';
    document.getElementById('new-interaction-title').value = '';
    document.getElementById('new-interaction-desc').value = '';
    document.getElementById('new-interaction-sem-resposta').checked = false;
}

async function salvarNovaInteracao() {
    if (!currentLead) return;

    const tipo = document.getElementById('new-interaction-type').value;
    const titulo = document.getElementById('new-interaction-title').value.trim();
    const descricao = document.getElementById('new-interaction-desc').value.trim();
    const semResposta = document.getElementById('new-interaction-sem-resposta').checked;

    if (!titulo) {
        showNotification('Por favor, preencha o título', 'warning');
        return;
    }

    try {
        // Salvar interação
        const { error } = await supabase
            .from('interacoes')
            .insert([{
                lead_id: currentLead.id,
                empresa_id: currentEmpresa?.id,
                tipo: tipo,
                titulo: titulo,
                descricao: descricao || null
            }]);

        if (error) throw error;

        // Se marcado como tentativa sem resposta, incrementar contador
        if (semResposta) {
            // Buscar valor atual do banco primeiro
            const { data: leadAtual, error: fetchError } = await supabase
                .from('leads')
                .select('tentativas_contato')
                .eq('id', currentLead.id)
                .single();

            if (fetchError) {
                console.error('Erro ao buscar lead:', fetchError);
            } else {
                const novoValor = (leadAtual.tentativas_contato || 0) + 1;

                const { error: leadError } = await supabase
                    .from('leads')
                    .update({
                        tentativas_contato: novoValor,
                        data_ultima_tentativa: new Date().toISOString()
                    })
                    .eq('id', currentLead.id);

                if (leadError) {
                    console.error('Erro ao atualizar tentativas:', leadError);
                } else {
                    console.log('✅ Contador de tentativas incrementado:', novoValor);
                    // Atualizar valor local também
                    currentLead.tentativas_contato = novoValor;
                }
            }
        }

        showNotification('Interação adicionada com sucesso!', 'success');
        hideAddInteractionForm();
        await renderLeadTimeline(currentLead.id);
        await loadLeads(); // Recarregar para atualizar contador
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
        <div class="col-span-2">
            <label class="text-sm text-gray-600">Motivo de Espera <span class="text-xs text-gray-400">(Para nutrição automática)</span></label>
            <textarea id="edit-motivo-espera" class="w-full border rounded px-3 py-2 mt-1 text-sm" rows="2" placeholder="Ex: Vai construir a casa em 6 meses, aguardando aprovação de financiamento, etc.">${lead.motivo_espera || ''}</textarea>
            <p class="text-xs text-gray-500 mt-1">💡 Se preenchido + sem interação 7-14 dias → move para "Em Nutrição" automaticamente</p>
        </div>
        <div>
            <label class="text-sm text-gray-600">Data Prevista de Retorno</label>
            <input type="date" id="edit-data-retorno" value="${lead.data_prevista_retorno || ''}" class="w-full border rounded px-3 py-2 mt-1">
            <p class="text-xs text-gray-500 mt-1">Quando retomar o contato</p>
        </div>
        <div>
            <label class="text-sm text-gray-600">Tentativas de Contato</label>
            <input type="number" id="edit-tentativas" value="${lead.tentativas_contato || 0}" class="w-full border rounded px-3 py-2 mt-1" readonly>
            <p class="text-xs text-gray-500 mt-1">3+ tentativas + 30 dias → marca como "Perdido"</p>
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
            status: document.getElementById('edit-status').value,
            motivo_espera: document.getElementById('edit-motivo-espera').value,
            data_prevista_retorno: document.getElementById('edit-data-retorno').value || null
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

    if (error && error.code !== 'PGRST116') {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Erro ao carregar qualificação</p>';
        return;
    }

    const qual = qualificacao || {};

    container.innerHTML = `
        <form id="form-qualificacao" class="space-y-6">
            <!-- Seção: Viabilidade Técnica -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Viabilidade Técnica</h3>
                </div>
                <div class="space-y-3">
                    <label class="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
                        <input type="checkbox" name="telhado_bom_estado" ${qual.telhado_bom_estado ? 'checked' : ''}
                               class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                        <span class="text-gray-700">
                            <strong>Telhado em bom estado</strong>
                            <p class="text-sm text-gray-500">Sem rachaduras, telhas quebradas ou infiltrações</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
                        <input type="checkbox" name="pouco_sombreamento" ${qual.pouco_sombreamento ? 'checked' : ''}
                               class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                        <span class="text-gray-700">
                            <strong>Pouco ou nenhum sombreamento (&lt; 20%)</strong>
                            <p class="text-sm text-gray-500">Sem árvores, prédios ou estruturas que façam sombra</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
                        <input type="checkbox" name="estrutura_suporta_peso" ${qual.estrutura_suporta_peso ? 'checked' : ''}
                               class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                        <span class="text-gray-700">
                            <strong>Estrutura suporta peso dos painéis</strong>
                            <p class="text-sm text-gray-500">Telhado tem capacidade estrutural adequada (15-20 kg/m²)</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
                        <input type="checkbox" name="telhado_compativel" ${qual.telhado_compativel ? 'checked' : ''}
                               class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                        <span class="text-gray-700">
                            <strong>Tipo de telhado compatível</strong>
                            <p class="text-sm text-gray-500">Cerâmico, metálico, fibrocimento ou laje</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
                        <input type="checkbox" name="acesso_adequado" ${qual.acesso_adequado ? 'checked' : ''}
                               class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                        <span class="text-gray-700">
                            <strong>Acesso adequado para instalação</strong>
                            <p class="text-sm text-gray-500">Escada, andaime ou acesso seguro ao telhado</p>
                        </span>
                    </label>
                </div>
                <div class="mt-4 p-3 rounded ${qual.viabilidade_tecnica ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                    <strong>${qual.viabilidade_tecnica ? '✓ Viável tecnicamente' : 'Marque todos os itens para confirmar viabilidade'}</strong>
                </div>
            </div>

            <!-- Seção: Decisor -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Poder de Decisão</h3>
                </div>
                <div class="space-y-3">
                    <label class="flex items-start gap-3 cursor-pointer hover:bg-purple-100 p-2 rounded">
                        <input type="checkbox" name="decisor_autonomia" ${qual.decisor_autonomia || qual.decisor ? 'checked' : ''}
                               class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500">
                        <span class="text-gray-700">
                            <strong>Tem autonomia para decidir</strong>
                            <p class="text-sm text-gray-500">
                                <strong>Residencial:</strong> Proprietário que decide sozinho<br>
                                <strong>Empresarial:</strong> Dono, CEO, CFO ou diretor com autonomia
                            </p>
                        </span>
                    </label>
                </div>
                <div class="mt-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Observações sobre decisor</label>
                    <textarea name="observacoes_decisor" rows="2"
                              class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                              placeholder="Ex: Precisa consultar sócio, esposa tem veto, etc.">${qual.observacoes_decisor || ''}</textarea>
                </div>
            </div>

            <!-- Seção: Prontidão de Compra -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold text-gray-800">Prontidão de Compra</h3>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Quando pretende instalar?</label>
                    <select name="prontidao_compra"
                            class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500">
                        <option value="">Selecione...</option>
                        <option value="imediato" ${qual.prontidao_compra === 'imediato' ? 'selected' : ''}>Imediato (compra já)</option>
                        <option value="30_dias" ${qual.prontidao_compra === '30_dias' ? 'selected' : ''}>Até 30 dias</option>
                        <option value="90_dias" ${qual.prontidao_compra === '90_dias' ? 'selected' : ''}>30 a 90 dias</option>
                        <option value="mais_90_dias" ${qual.prontidao_compra === 'mais_90_dias' ? 'selected' : ''}>Mais de 90 dias</option>
                    </select>
                </div>
            </div>

            <!-- Campos adicionais -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Telhado</label>
                    <select name="tipo_telhado" class="w-full border rounded px-3 py-2">
                        <option value="">Selecione...</option>
                        <option value="fibrocimento" ${qual.tipo_telhado === 'fibrocimento' ? 'selected' : ''}>Fibrocimento</option>
                        <option value="ceramico" ${qual.tipo_telhado === 'ceramico' ? 'selected' : ''}>Cerâmico</option>
                        <option value="metalico" ${qual.tipo_telhado === 'metalico' ? 'selected' : ''}>Metálico</option>
                        <option value="laje" ${qual.tipo_telhado === 'laje' ? 'selected' : ''}>Laje</option>
                        <option value="outro" ${qual.tipo_telhado === 'outro' ? 'selected' : ''}>Outro</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Ligação</label>
                    <select name="tipo_ligacao" class="w-full border rounded px-3 py-2">
                        <option value="">Selecione...</option>
                        <option value="monofasica" ${qual.tipo_ligacao === 'monofasica' ? 'selected' : ''}>Monofásica</option>
                        <option value="bifasica" ${qual.tipo_ligacao === 'bifasica' ? 'selected' : ''}>Bifásica</option>
                        <option value="trifasica" ${qual.tipo_ligacao === 'trifasica' ? 'selected' : ''}>Trifásica</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
                <textarea name="observacoes" rows="3"
                          class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Informações adicionais sobre a qualificação...">${qual.observacoes || ''}</textarea>
            </div>

            <!-- Botão Salvar -->
            <div class="flex gap-3">
                <button type="submit"
                        class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg">
                    <i class="fas fa-save mr-2"></i>Salvar Qualificação
                </button>
            </div>
        </form>
    `;

    // Event listener para salvar
    document.getElementById('form-qualificacao').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarQualificacao(leadId);
    });
}

async function salvarQualificacao(leadId) {
    const form = document.getElementById('form-qualificacao');
    const formData = new FormData(form);

    // Obter empresa_id do usuário atual (necessário para RLS)
    const empresaId = window.currentEmpresa?.id;
    if (!empresaId) {
        showNotification('Erro: Empresa não identificada. Faça login novamente.', 'danger');
        return;
    }

    try {
        // Buscar qualificação existente para preservar dados do chatbot
        const { data: existingQual } = await supabase
            .from('qualificacao')
            .select('*')
            .eq('lead_id', leadId)
            .single();

        // Mesclar dados existentes com novos dados do formulário
        const qualificacaoData = {
            ...(existingQual || {}), // Preserva TODOS os campos existentes (family_size, kwh_consumption, roof_type, sombreamento_percentual, etc)
            lead_id: leadId,
            empresa_id: empresaId,
            // Sobrescrever apenas com os campos do formulário
            telhado_bom_estado: formData.get('telhado_bom_estado') === 'on',
            pouco_sombreamento: formData.get('pouco_sombreamento') === 'on',
            estrutura_suporta_peso: formData.get('estrutura_suporta_peso') === 'on',
            telhado_compativel: formData.get('telhado_compativel') === 'on',
            acesso_adequado: formData.get('acesso_adequado') === 'on',
            decisor_autonomia: formData.get('decisor_autonomia') === 'on',
            decisor: formData.get('decisor_autonomia') === 'on', // Compatibilidade
            observacoes_decisor: formData.get('observacoes_decisor'),
            prontidao_compra: formData.get('prontidao_compra'),
            tipo_telhado: formData.get('tipo_telhado'),
            tipo_ligacao: formData.get('tipo_ligacao'),
            observacoes: formData.get('observacoes')
        };

        const { error } = await supabase
            .from('qualificacao')
            .upsert(qualificacaoData, { onConflict: 'lead_id' });

        if (error) throw error;

        // Registrar na timeline
        await supabase.from('interacoes').insert([{
            lead_id: leadId,
            empresa_id: empresaId,
            tipo: 'sistema',
            titulo: 'Qualificação Atualizada',
            descricao: `Viabilidade: ${qualificacaoData.telhado_bom_estado && qualificacaoData.pouco_sombreamento ? 'OK' : 'Pendente'} | Prontidão: ${formatProntidao(qualificacaoData.prontidao_compra)}`
        }]);

        showNotification('Qualificação salva com sucesso!', 'success');

        // Buscar lead atualizado com score para verificar se deve qualificar
        const { data: leadAtualizado } = await supabase
            .from('leads')
            .select('lead_score, status')
            .eq('id', leadId)
            .single();

        // Se score >= 50, atualizar status para qualificado automaticamente
        if (leadAtualizado && leadAtualizado.lead_score >= 50 && leadAtualizado.status !== 'qualificado') {
            await supabase
                .from('leads')
                .update({ status: 'qualificado' })
                .eq('id', leadId);

            // Registrar na timeline
            await supabase.from('interacoes').insert([{
                lead_id: leadId,
                empresa_id: empresaId,
                tipo: 'sistema',
                titulo: 'Lead Qualificado Automaticamente',
                descricao: `Lead qualificado por atingir score ${leadAtualizado.lead_score} (≥ 50 pontos)`
            }]);

            showNotification(`Lead qualificado automaticamente! Score: ${leadAtualizado.lead_score}`, 'success');

            // Recarregar dados do CRM para atualizar badge de status
            await refreshData();
        }

        await renderLeadQualificacao(leadId);
        await renderLeadTimeline(leadId);
    } catch (error) {
        console.error('Erro ao salvar qualificação:', error);
        showNotification('Erro ao salvar qualificação', 'danger');
    }
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
    // Abrir modal
    document.getElementById('novaTarefaModal').classList.remove('hidden');

    // Preencher select de leads
    const selectLead = document.getElementById('nova-task-lead');
    selectLead.innerHTML = '<option value="">-- Sem cliente vinculado --</option>';

    leads.forEach(lead => {
        const option = document.createElement('option');
        option.value = lead.id;
        option.textContent = `${lead.nome || lead.email} ${lead.tipo_cliente === 'empresarial' ? '🏢' : '🏠'}`;
        selectLead.appendChild(option);
    });

    // Definir data mínima como hoje
    const dataInput = document.getElementById('nova-task-date');
    dataInput.value = new Date().toISOString().split('T')[0];
    dataInput.min = new Date().toISOString().split('T')[0];

    // Setup do form submit
    const form = document.getElementById('form-nova-tarefa');
    form.onsubmit = async (e) => {
        e.preventDefault();
        await salvarNovaTarefa();
    };
}

function closeNovaTarefaModal() {
    document.getElementById('novaTarefaModal').classList.add('hidden');
    document.getElementById('form-nova-tarefa').reset();
}

async function salvarNovaTarefa() {
    const form = document.getElementById('form-nova-tarefa');
    const formData = new FormData(form);

    const titulo = formData.get('titulo');
    const leadId = formData.get('lead_id') || null;
    const descricao = formData.get('descricao') || null;
    const dataVencimento = formData.get('data_vencimento');
    const horario = formData.get('horario');
    const prioridade = formData.get('prioridade');
    const tipo = formData.get('tipo');

    // Combinar data e horário
    let dataVencimentoCompleta = dataVencimento;
    if (horario) {
        dataVencimentoCompleta = `${dataVencimento}T${horario}:00`;
    }

    try {
        const novaTarefaData = {
            titulo,
            descricao,
            data_vencimento: dataVencimentoCompleta,
            prioridade,
            status: 'pendente',
            tipo,
            lead_id: leadId,
            empresa_id: currentEmpresa?.id || null,
            usuario_id: currentUser?.id || null
        };

        const { error } = await supabase
            .from('tarefas')
            .insert([novaTarefaData]);

        if (error) throw error;

        // Se tarefa vinculada a lead, registrar na timeline
        if (leadId) {
            await supabase.from('interacoes').insert([{
                lead_id: leadId,
                tipo: 'nota',
                titulo: `📋 Nova Tarefa: ${titulo}`,
                descricao: descricao || `Tarefa agendada para ${new Date(dataVencimentoCompleta).toLocaleDateString('pt-BR')}`,
                empresa_id: currentEmpresa?.id || null,
                usuario_id: currentUser?.id || null
            }]);
        }

        showNotification('✅ Tarefa criada com sucesso!', 'success');
        closeNovaTarefaModal();
        await loadTarefas();
        renderTarefas();
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        showNotification('❌ Erro ao criar tarefa', 'danger');
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
        novo: 'orange',
        qualificado: 'teal',
        nao_qualificado: 'gray',
        em_nutricao: 'purple',
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
    try {
        console.log('🔍 filterLeads chamado, leads:', leads ? leads.length : 'UNDEFINED');
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

    console.log('🔍 filteredLeads:', filteredLeads.length);
    renderFilteredLeadsTable(filteredLeads);
    } catch (error) {
        console.error('❌ Erro em filterLeads:', error);
    }
}

function renderFilteredLeadsTable(filteredLeads) {
    const tbody = document.getElementById('leads-table-body');
    console.log('🔍 renderFilteredLeadsTable - tbody:', !!tbody, 'leads:', filteredLeads.length);
    if (!tbody) return;

    tbody.innerHTML = filteredLeads.map(lead => {
        const propostaData = getLeadPropostaData(lead);
        const propostaStatus = getPropostaStatusBadge(propostaData.status);
        const avatarInfo = getLeadAvatarIcon(lead);

        return `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden mr-3" style="background: ${avatarInfo.bgColor};" title="${avatarInfo.title}">
                        ${avatarInfo.svg}
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
            <td class="px-6 py-4">
                <span class="badge ${propostaStatus.class}">${propostaStatus.label}</span>
            </td>
            <td class="px-6 py-4 text-center font-semibold text-gray-700">
                ${propostaData.modulos || '-'}
            </td>
            <td class="px-6 py-4 font-semibold text-green-600">
                ${propostaData.preco ? formatCurrency(propostaData.preco) : '-'}
            </td>
            <td class="px-6 py-4">
                <button onclick="event.stopPropagation(); editLead('${lead.id}')" class="text-blue-600 hover:text-blue-800 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteLead('${lead.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="9" class="text-center py-8 text-gray-500">Nenhum lead encontrado</td></tr>';
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

async function logout() {
    try {
        // Fazer signOut do Supabase
        await supabase.auth.signOut();
        // Limpar localStorage
        localStorage.removeItem('supabase.auth.token');
        // Redirecionar para login
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Erro ao fazer logout:', err);
        // Mesmo com erro, redireciona
        window.location.href = 'login.html';
    }
}

// =========================================
// SISTEMA DE NOTIFICAÇÕES
// =========================================

async function loadNotificacoes() {
    try {
        const { data, error } = await supabase
            .from('notificacoes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        notificacoes = data || [];
        console.log(`🔔 ${notificacoes.length} notificações carregadas`);

        // Atualizar badge
        updateNotificacoesBadge();
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
    }
}

function updateNotificacoesBadge() {
    const badge = document.getElementById('notificacoes-badge');
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    if (naoLidas > 0) {
        badge.textContent = naoLidas > 99 ? '99+' : naoLidas;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleNotificacoes() {
    const dropdown = document.getElementById('notificacoes-dropdown');
    const isHidden = dropdown.classList.contains('hidden');

    if (isHidden) {
        renderNotificacoes();
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

function renderNotificacoes() {
    const container = document.getElementById('notificacoes-container');

    if (notificacoes.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-gray-500">
                <i class="fas fa-bell-slash text-4xl mb-2"></i>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notificacoes.map(notif => {
        const icone = {
            'auto_nutricao': 'fa-seedling text-yellow-500',
            'auto_perdido': 'fa-times-circle text-red-500',
            'alerta_inatividade': 'fa-clock text-orange-500',
            'retomar_contato': 'fa-phone text-blue-500'
        }[notif.tipo] || 'fa-bell text-gray-500';

        return `
            <div class="p-4 hover:bg-gray-50 transition ${!notif.lida ? 'bg-blue-50' : ''}" onclick="marcarComoLida('${notif.id}')">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <i class="fas ${icone}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                            <h4 class="font-semibold text-sm text-gray-900">${notif.titulo}</h4>
                            ${!notif.lida ? '<span class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                        </div>
                        <p class="text-sm text-gray-600 mt-1">${notif.mensagem}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs text-gray-500">
                                <i class="fas fa-clock"></i>
                                ${formatarDataRelativa(notif.created_at)}
                            </span>
                            ${notif.acao_sugerida === 'reverter' ? `
                                <button onclick="event.stopPropagation(); abrirReversao('${notif.id}')" class="text-xs text-teal-600 hover:text-teal-700 font-semibold">
                                    <i class="fas fa-undo"></i> Reverter
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatarDataRelativa(dataString) {
    const data = new Date(dataString);
    const agora = new Date();
    const diffMs = agora - data;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias < 7) return `${diffDias}d atrás`;

    return data.toLocaleDateString('pt-BR');
}

async function marcarComoLida(notifId) {
    try {
        const { error } = await supabase
            .from('notificacoes')
            .update({ lida: true })
            .eq('id', notifId);

        if (error) throw error;

        // Atualizar localmente
        const notif = notificacoes.find(n => n.id === notifId);
        if (notif) notif.lida = true;

        updateNotificacoesBadge();
        renderNotificacoes();
    } catch (error) {
        console.error('Erro ao marcar como lida:', error);
    }
}

async function marcarTodasLidas() {
    try {
        const naoLidas = notificacoes.filter(n => !n.lida).map(n => n.id);

        if (naoLidas.length === 0) return;

        const { error } = await supabase
            .from('notificacoes')
            .update({ lida: true })
            .in('id', naoLidas);

        if (error) throw error;

        // Atualizar localmente
        notificacoes.forEach(n => n.lida = true);

        updateNotificacoesBadge();
        renderNotificacoes();
        showNotification('Todas as notificações foram marcadas como lidas', 'success');
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        showNotification('Erro ao marcar notificações', 'danger');
    }
}

async function abrirReversao(notifId) {
    const notif = notificacoes.find(n => n.id === notifId);
    if (!notif) return;

    const confirmar = confirm(`Deseja reverter esta ação automática?\n\n${notif.mensagem}`);
    if (!confirmar) return;

    try {
        // Buscar o histórico relacionado a esta notificação
        const { data: historico, error: histError } = await supabase
            .from('historico_mudancas_automaticas')
            .select('*')
            .eq('lead_id', notif.lead_id)
            .eq('revertido', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (histError || !historico) {
            showNotification('Histórico não encontrado', 'warning');
            return;
        }

        // Chamar função SQL para reverter
        const { data, error } = await supabase.rpc('reverter_mudanca_automatica', {
            p_historico_id: historico.id,
            p_user_id: null // TODO: pegar user_id do usuário logado
        });

        if (error) throw error;

        showNotification('Ação revertida com sucesso!', 'success');

        // Marcar notificação como respondida
        await supabase
            .from('notificacoes')
            .update({ respondida: true })
            .eq('id', notifId);

        // Recarregar dados
        await loadAllData();
    } catch (error) {
        console.error('Erro ao reverter:', error);
        showNotification('Erro ao reverter ação: ' + error.message, 'danger');
    }
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

            // Pegar estatísticas de interações
            const stats = interacoesStats[oportunidade.lead_id] || {
                emails: 0,
                chamadas: 0,
                propostas: 0,
                instalacoes: 0
            };

            // Formatar data da última atualização
            const dataAtualizacao = new Date(oportunidade.data_ultima_atualizacao || oportunidade.created_at);
            const dataFormatada = dataAtualizacao.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const horaFormatada = dataAtualizacao.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Verificar se há instalação agendada (buscar no array instalacoes pela tabela instalacao)
            const instalacao = instalacoes.find(inst => inst.lead_id === oportunidade.lead_id);
            const temInstalacaoAgendada = instalacao?.data_agendamento_instalacao;

            // Determinar badge/ícone de status
            let statusBadge = '';
            let statusColor = '';
            let statusText = '';
            let statusIcon = '';

            if (temInstalacaoAgendada) {
                // Mostrar troféu se tiver instalação agendada
                statusIcon = '🏆';
                statusText = 'Instalação Agendada';
                statusColor = 'text-yellow-600';
            } else if (lead?.status === 'perdido') {
                statusBadge = 'bg-red-500';
                statusColor = 'text-red-500';
                statusText = 'Perdido';
            } else if (lead?.status === 'qualificado') {
                statusBadge = 'bg-green-500';
                statusColor = 'text-green-500';
                statusText = 'Qualificado';
            } else if (lead?.status === 'em_nutricao') {
                statusBadge = 'bg-orange-500';
                statusColor = 'text-orange-500';
                statusText = 'Em Nutrição';
            }

            return `
                <div class="kanban-card ${isInactive ? 'inactive' : ''}" data-id="${oportunidade.id}" onclick="openLeadModal('${oportunidade.lead_id}')">
                    <!-- Cabeçalho com nome e estrela de favorito -->
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 text-sm">${lead?.nome || lead?.email || 'Lead sem nome'}</h4>
                            <p class="text-xs text-gray-500 mt-0.5">
                                <i class="fas fa-clock"></i> ${dataFormatada} ${horaFormatada}
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            ${statusIcon ? `
                                <div class="flex items-center gap-1" title="${statusText}">
                                    <span class="text-lg">${statusIcon}</span>
                                </div>
                            ` : statusBadge ? `
                                <div class="flex items-center gap-1.5" title="${statusText}">
                                    <div class="w-2 h-2 rounded-full ${statusBadge}"></div>
                                    <span class="text-xs font-medium ${statusColor}">${statusText.charAt(0)}</span>
                                </div>
                            ` : ''}
                            <button onclick="event.stopPropagation(); toggleFavorito('${oportunidade.id}')" class="focus:outline-none transition-transform hover:scale-110">
                                <i class="fas fa-star text-lg ${oportunidade.favorito ? 'text-yellow-400' : 'text-gray-300'}"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Valor e consumo -->
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-bold text-green-600">${formatCurrency(oportunidade.valor_estimado)}</span>
                        <span class="text-xs text-gray-600">
                            <i class="fas fa-bolt"></i> ${lead?.consumo_mensal || 0} kWh
                        </span>
                    </div>

                    <!-- Ícones de estatísticas -->
                    <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                        <!-- Email -->
                        <div class="flex items-center gap-1" title="${stats.emails} email(s) enviado(s)">
                            <i class="fas fa-envelope text-xs ${stats.emails > 0 ? 'text-blue-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.emails > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}">${stats.emails}</span>
                        </div>

                        <!-- Chamadas -->
                        <div class="flex items-center gap-1" title="${stats.chamadas} ligaç(ões) realizada(s)">
                            <i class="fas fa-phone text-xs ${stats.chamadas > 0 ? 'text-purple-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.chamadas > 0 ? 'text-purple-600 font-semibold' : 'text-gray-400'}">${stats.chamadas}</span>
                        </div>

                        <!-- Propostas -->
                        <div class="flex items-center gap-1" title="${stats.propostas} proposta(s) criada(s)">
                            <i class="fas fa-file-invoice-dollar text-xs ${stats.propostas > 0 ? 'text-green-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.propostas > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}">${stats.propostas}</span>
                        </div>

                        <!-- Instalações -->
                        <div class="flex items-center gap-1" title="${stats.instalacoes} instalação(ões) concluída(s)">
                            <i class="fas fa-solar-panel text-xs ${stats.instalacoes > 0 ? 'text-orange-500' : 'text-gray-300'}"></i>
                            <span class="text-xs ${stats.instalacoes > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'}">${stats.instalacoes}</span>
                        </div>

                        <!-- Badge tipo cliente -->
                        <span class="badge badge-${lead?.tipo_cliente === 'empresarial' ? 'info' : 'gray'} text-xs">
                            ${lead?.tipo_cliente === 'empresarial' ? 'EMP' : 'RES'}
                        </span>
                    </div>

                    ${isInactive ? `<p class="text-xs text-red-500 mt-2"><i class="fas fa-exclamation-triangle"></i> ${diasInativo} dias sem atualização</p>` : ''}
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
    const tipoSistema = document.getElementById('sim-tipo-sistema').value;

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
        // Usar APENAS a calculadora completa
        if (!window.CalculadoraSolarCompleta) {
            throw new Error('Calculadora solar completa não carregada. Recarregue a página.');
        }

        const resultado = await window.CalculadoraSolarCompleta.gerarPropostaCompleta({
            cep,
            consumoMensalKwh,
            percentualReducao,
            tarifaKwh,
            tipoCliente,
            tipoSistema,
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
    if (!resultado) {
        showNotification('Nenhum resultado disponível', 'warning');
        return;
    }

    if (!window.CalculadoraSolarCompleta) {
        showNotification('Calculadora solar completa não carregada. Recarregue a página.', 'danger');
        return;
    }

    // Armazenar dados globalmente para a nova janela acessar
    window.dadosMemorialTecnico = {
        resultado,
        propostaIndex
    };

    // Abrir página React
    window.open('./memorial-tecnico-react.html', '_blank', 'width=1200,height=900');
}

async function gerarPropostaComercial(propostaIndex) {
    const resultado = window.ultimoResultadoSimulador;
    if (!resultado) {
        showNotification('Nenhum resultado disponível', 'warning');
        return;
    }

    if (!window.CalculadoraSolarCompleta) {
        showNotification('Calculadora solar completa não carregada. Recarregue a página.', 'danger');
        return;
    }

    showNotification('Gerando proposta comercial...', 'info');

    // Salvar proposta no banco de dados ANTES de abrir o PDF
    if (currentLead) {
        try {
            console.log('💾 Salvando proposta no banco de dados...');
            console.log('📋 currentLead:', currentLead);

            // Buscar oportunidade do lead
            const { data: oportunidade, error: oppError } = await supabase
                .from('oportunidades')
                .select('id')
                .eq('lead_id', currentLead.id)
                .single();

            console.log('🔍 Oportunidade encontrada:', oportunidade, oppError);

            if (!oportunidade) {
                console.error('❌ Oportunidade não encontrada para o lead:', currentLead.id);
                showNotification('Erro: Oportunidade não encontrada', 'danger');
                return;
            }

            const proposta = resultado.propostas[propostaIndex];
            const { configuracao, custos, economia, payback } = proposta;

            // Obter empresa_id do usuário logado
            const empresaId = window.currentEmpresa?.id;

            const dadosProposta = {
                oportunidade_id: oportunidade.id,
                empresa_id: empresaId,
                numero_proposta: `PROP-${Date.now()}`,
                potencia_total_kwp: configuracao.potenciaRealKwp,
                num_modulos: configuracao.numModulos,
                modelo_placa: configuracao.placa.modelo,
                fabricante_placa: configuracao.placa.fabricante,
                potencia_placa: configuracao.placa.potencia,
                modelo_inversor: custos.equipamentos?.inversor?.modelo || 'N/A',
                fabricante_inversor: custos.equipamentos?.inversor?.fabricante || 'N/A',
                valor_equipamentos: custos.custoTotal,
                valor_total: custos.valorVenda,
                valor_final: custos.valorVenda,
                economia_mensal: economia.economiaMensal,
                economia_anual: economia.economiaAnual,
                payback_anos: payback.real?.anos || payback.anos,
                status: 'enviada'
            };

            console.log('📊 Dados COMPLETOS da proposta a salvar:', dadosProposta);
            console.log('⏳ Iniciando insert no Supabase...');

            // Salvar proposta no banco SEM .select() primeiro
            const { data: propostaSalva, error } = await supabase
                .from('propostas')
                .insert([dadosProposta]);

            console.log('⏹️ Insert retornou:', { data: propostaSalva, error });

            if (error) {
                console.error('❌ ERRO DETALHADO ao salvar proposta:', error);
                console.error('❌ Mensagem:', error.message);
                console.error('❌ Código:', error.code);
                console.error('❌ Details:', error.details);
                console.error('❌ Hint:', error.hint);
                showNotification('Erro ao salvar proposta: ' + error.message, 'danger');
            } else {
                console.log('✅ Proposta salva no banco com sucesso!');
                showNotification('Proposta salva com sucesso!', 'success');

                // Recarregar propostas
                await loadPropostas();
            }
        } catch (error) {
            console.error('❌ EXCEÇÃO ao salvar proposta:', error);
            console.error('❌ Stack:', error.stack);
            showNotification('Erro ao salvar proposta', 'danger');
        }
    } else {
        console.warn('⚠️ currentLead é null - não pode salvar proposta');
    }

    // Armazenar dados globalmente para a nova janela acessar
    window.dadosPropostaComercial = {
        resultado,
        propostaIndex
    };

    // Abrir página React
    window.open('./proposta-comercial-react.html', '_blank', 'width=1200,height=900');
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

// =========================================
// SISTEMA DE ABAS DINÂMICAS POR ESTÁGIO
// =========================================

// Configurar quais abas mostrar baseado no estágio
function configurarAbasDinamicas(etapa) {
    const tabButton = document.getElementById('tab-btn-dynamic');
    if (!tabButton) return; // Proteção caso o elemento não exista

    const configAbas = {
        'levantamento': {
            label: 'Documentos',
            icon: 'fa-folder'
        },
        'simulacao': {
            label: 'Projeto',
            icon: 'fa-solar-panel'
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

    // Se não tiver etapa definida, manter "Qualificação" padrão sem modificar
    if (!etapa) return;

    const config = configAbas[etapa];
    if (config) {
        tabButton.innerHTML = `<i class="fas ${config.icon} mr-2"></i>${config.label}`;
    }
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
            empresa_id: currentEmpresa?.id,
            tipo: 'sistema',
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
    const container = document.getElementById('qualificacao-content');

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Texto Explicativo -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center gap-3 mb-4">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-xl font-bold text-gray-800">Etapa de Simulação</h3>
                </div>
                <p class="text-gray-700 leading-relaxed mb-4">
                    Agora você pode gerar o <strong>projeto completo do sistema solar fotovoltaico</strong>
                    para este cliente. O sistema irá calcular automaticamente:
                </p>
                <ul class="space-y-2 text-gray-700 ml-6">
                    <li class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span><strong>Dimensionamento do sistema</strong> - Número de módulos, potência total e inversor adequado</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span><strong>Memória de cálculo técnica</strong> - Geração estimada, área necessária e análise financeira</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span><strong>Proposta comercial</strong> - Documento profissional pronto para apresentar ao cliente</span>
                    </li>
                </ul>
            </div>

            <!-- Botão Calcular -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-8 text-center">
                <button onclick="abrirSimuladorSolar()"
                        class="w-full text-white px-8 py-5 rounded-lg font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-102"
                        style="background: linear-gradient(135deg, #309086 0%, #26a69a 100%);"
                        onmouseover="this.style.background='linear-gradient(135deg, #267269 0%, #1e8a7e 100%)'"
                        onmouseout="this.style.background='linear-gradient(135deg, #309086 0%, #26a69a 100%)'">
                    <i class="fas fa-solar-panel mr-3"></i>Calcular Sistema Solar
                </button>
                <p class="text-sm text-gray-600 mt-4">
                    O simulador abrirá em uma nova janela com todos os dados do lead já preenchidos
                </p>
            </div>
        </div>
    `;
}

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
                ${proposta.status !== 'aceita' && proposta.status !== 'recusada' ? `
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="aceitarProposta('${proposta.id}', '${leadId}')"
                                class="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition shadow-md">
                            <i class="fas fa-check-circle mr-2"></i>Aceitar Proposta
                        </button>
                        <button onclick="recusarProposta('${proposta.id}', '${leadId}')"
                                class="w-full bg-red-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition shadow-md">
                            <i class="fas fa-times-circle mr-2"></i>Recusar Proposta
                        </button>
                    </div>
                ` : `
                    <div class="p-4 rounded-lg ${proposta.status === 'aceita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        <i class="fas fa-${proposta.status === 'aceita' ? 'check-circle' : 'times-circle'} mr-2"></i>
                        <strong>Proposta ${proposta.status === 'aceita' ? 'Aceita' : 'Recusada'}</strong>
                    </div>
                `}

                <button onclick="enviarPropostaPorEmail('${proposta.id}', '${leadId}')"
                        class="w-full text-white px-6 py-4 rounded-lg font-semibold text-lg transition shadow-md hover:shadow-lg"
                        style="background: linear-gradient(135deg, #42a5f5 0%, #5c6bc0 100%);"
                        onmouseover="this.style.background='linear-gradient(135deg, #1e88e5 0%, #3f51b5 100%)'"
                        onmouseout="this.style.background='linear-gradient(135deg, #42a5f5 0%, #5c6bc0 100%)'">
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
        empresa_id: currentEmpresa?.id,
        tipo: 'email',
        titulo: 'Proposta Enviada por Email',
        descricao: `Proposta enviada para ${currentLead.email}`
    }]);

    await renderLeadTimeline(leadId);
}

// Aceitar proposta - atualiza AMBAS as tabelas
async function aceitarProposta(propostaId, leadId) {
    const empresaId = window.currentEmpresa?.id;

    try {
        // 1. Atualizar status na tabela propostas
        const { error: errProposta } = await supabase
            .from('propostas')
            .update({ status: 'aceita' })
            .eq('id', propostaId);

        if (errProposta) throw errProposta;

        // 2. Atualizar/criar registro na tabela status_negociacao
        const { error: errStatus } = await supabase
            .from('status_negociacao')
            .upsert({
                lead_id: leadId,
                empresa_id: empresaId,
                proposta_aceita: true,
                data_aceite: new Date().toISOString()
            }, { onConflict: 'lead_id' });

        if (errStatus) {
            console.warn('Aviso ao atualizar status_negociacao:', errStatus);
        }

        // 3. Registrar na timeline
        await supabase.from('interacoes').insert([{
            lead_id: leadId,
            empresa_id: empresaId,
            tipo: 'sistema',
            titulo: 'Proposta Aceita',
            descricao: 'Cliente aceitou a proposta comercial'
        }]);

        showNotification('Proposta aceita com sucesso!', 'success');

        // Recarregar a visualização
        await renderResumoProposta(leadId);
        await renderLeadTimeline(leadId);

    } catch (error) {
        console.error('Erro ao aceitar proposta:', error);
        showNotification('Erro ao aceitar proposta: ' + error.message, 'danger');
    }
}

// Recusar proposta - atualiza AMBAS as tabelas
async function recusarProposta(propostaId, leadId) {
    const empresaId = window.currentEmpresa?.id;

    try {
        // 1. Atualizar status na tabela propostas
        const { error: errProposta } = await supabase
            .from('propostas')
            .update({ status: 'recusada' })
            .eq('id', propostaId);

        if (errProposta) throw errProposta;

        // 2. Atualizar/criar registro na tabela status_negociacao
        const { error: errStatus } = await supabase
            .from('status_negociacao')
            .upsert({
                lead_id: leadId,
                empresa_id: empresaId,
                proposta_aceita: false,
                data_aceite: null
            }, { onConflict: 'lead_id' });

        if (errStatus) {
            console.warn('Aviso ao atualizar status_negociacao:', errStatus);
        }

        // 3. Registrar na timeline
        await supabase.from('interacoes').insert([{
            lead_id: leadId,
            empresa_id: empresaId,
            tipo: 'sistema',
            titulo: 'Proposta Recusada',
            descricao: 'Cliente recusou a proposta comercial'
        }]);

        showNotification('Proposta marcada como recusada', 'warning');

        // Recarregar a visualização
        await renderResumoProposta(leadId);
        await renderLeadTimeline(leadId);

    } catch (error) {
        console.error('Erro ao recusar proposta:', error);
        showNotification('Erro ao recusar proposta: ' + error.message, 'danger');
    }
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
        .maybeSingle();

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
                            class="w-full text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg"
                            style="background: linear-gradient(135deg, #309086 0%, #26a69a 100%);"
                            onmouseover="this.style.background='linear-gradient(135deg, #267269 0%, #1e8a7e 100%)'"
                            onmouseout="this.style.background='linear-gradient(135deg, #309086 0%, #26a69a 100%)'">
                        <i class="fas fa-save mr-2"></i>Salvar Status
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function salvarStatusNegociacao(leadId) {
    const empresaId = window.currentEmpresa?.id;

    const statusData = {
        lead_id: leadId,
        empresa_id: empresaId,
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
            empresa_id: currentEmpresa?.id,
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
        .maybeSingle();

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
                               value="${inst.data_agendamento_instalacao ? inst.data_agendamento_instalacao.split('T')[0] : ''}"
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
                            class="w-full text-white px-6 py-4 rounded-lg font-semibold text-lg transition shadow-md hover:shadow-lg"
                            style="background: linear-gradient(135deg, #309086 0%, #26a69a 100%);"
                            onmouseover="this.style.background='linear-gradient(135deg, #267269 0%, #1e8a7e 100%)'"
                            onmouseout="this.style.background='linear-gradient(135deg, #309086 0%, #26a69a 100%)'">
                        <i class="fas fa-calendar-check mr-2"></i>Salvar Agendamento e Enviar para Cliente
                    </button>
                </div>
            </div>

            <!-- Botão Marcar como Instalado -->
            ${inst.art_aprovada && inst.homologacao_aprovada && inst.data_agendamento_instalacao ? `
                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-8 text-center">
                    <div class="mb-4">
                        <div class="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                            <i class="fas fa-check-circle text-green-600"></i>
                            <span class="text-sm font-semibold text-gray-700">Todos os requisitos atendidos</span>
                        </div>
                    </div>
                    <button onclick="marcarComoInstalado('${leadId}')"
                            class="w-full text-white px-8 py-5 rounded-lg font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-102"
                            style="background: linear-gradient(135deg, #66bb6a 0%, #4caf50 100%);"
                            onmouseover="this.style.background='linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'"
                            onmouseout="this.style.background='linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)'">
                        <i class="fas fa-check-circle mr-3"></i>Marcar como Instalado
                    </button>
                    <p class="text-sm text-gray-600 mt-3">
                        Isso moverá o cliente para a página "Instalados" e removerá do Kanban
                    </p>
                </div>
            ` : `
                <div class="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center">
                    <i class="fas fa-lock text-gray-400 text-3xl mb-3"></i>
                    <p class="text-gray-600 font-semibold mb-2">Botão "Marcar como Instalado" bloqueado</p>
                    <p class="text-sm text-gray-500">
                        Complete os requisitos acima para desbloquear:
                        <br>✓ ART aprovada | ✓ Homologação aprovada | ✓ Data de instalação
                    </p>
                </div>
            `}
        </div>
    `;
}

async function salvarAgendamentoInstalacao(leadId) {
    const empresaId = window.currentEmpresa?.id;

    const instalacaoData = {
        lead_id: leadId,
        empresa_id: empresaId,
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
            empresa_id: currentEmpresa?.id,
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

// =========================================
// MARCAR COMO INSTALADO
// =========================================
async function marcarComoInstalado(leadId) {
    // Confirmar ação
    if (!confirm('Confirma que a instalação foi concluída com sucesso? O cliente será movido para "Instalados" e removido do Kanban.')) {
        return;
    }

    try {
        // 1. Buscar dados do lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError) throw leadError;

        // 2. Buscar última proposta aceita
        const { data: propostas, error: propostaError } = await supabase
            .from('propostas')
            .select('*, oportunidades!inner(lead_id)')
            .eq('oportunidades.lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (propostaError) throw propostaError;

        const proposta = propostas?.[0];

        // Debug: Ver o que está vindo da proposta
        console.log('🔍 Debug - Proposta encontrada:', proposta);
        console.log('🔍 Potência:', proposta?.potencia_total_kwp);
        console.log('🔍 Valor final:', proposta?.valor_final);

        // 3. Buscar dados de instalação
        const { data: instalacao, error: instError } = await supabase
            .from('instalacao')
            .select('*')
            .eq('lead_id', leadId)
            .single();

        if (instError) throw instError;

        // 4. Criar registro em clientes_instalados com TODOS os dados
        const empresaId = window.currentEmpresa?.id;
        const clienteInstaladoData = {
            lead_id: leadId,
            empresa_id: empresaId,
            numero_contrato: proposta?.numero_proposta || `CONTRATO-${Date.now()}`,
            data_instalacao: instalacao.data_agendamento_instalacao || new Date().toISOString(),
            data_assinatura: proposta?.created_at || new Date().toISOString(), // Data da proposta ou data atual
            potencia_instalada_kwp: proposta?.potencia_total_kwp || 0,
            valor_final_negociado: proposta?.valor_final || 0,
            // Dados de ART
            numero_art: instalacao.numero_art,
            data_art: instalacao.data_art,
            // Dados de Homologação
            protocolo_homologacao: instalacao.protocolo_homologacao,
            data_homologacao: instalacao.data_homologacao,
            // Observações e data de conclusão
            observacoes: instalacao.observacoes_agendamento,
            data_conclusao_instalacao: new Date().toISOString(), // Data atual como conclusão
            nps: null // Será preenchido depois no pós-venda
        };

        const { error: insertError } = await supabase
            .from('clientes_instalados')
            .upsert(clienteInstaladoData, { onConflict: 'lead_id' });

        if (insertError) throw insertError;

        // 5. NÃO deletar oportunidade - preservar para manter relacionamento com proposta
        // Apenas marcar como concluída para remover do Kanban
        const { data: updateData, error: updateOppError } = await supabase
            .from('oportunidades')
            .update({
                etapa: 'concluida', // Marca como concluída
                updated_at: new Date().toISOString()
            })
            .eq('lead_id', leadId)
            .select();

        if (updateOppError) throw updateOppError;

        console.log('✅ Oportunidade marcada como concluída:', updateData);

        // 6. Atualizar status do lead
        await supabase
            .from('leads')
            .update({ status: 'instalado' })
            .eq('id', leadId);

        // 7. Registrar na timeline
        await supabase.from('interacoes').insert([{
            lead_id: leadId,
            empresa_id: currentEmpresa?.id,
            tipo: 'sistema',
            titulo: '🎉 Cliente Instalado com Sucesso!',
            descricao: `Sistema de ${clienteInstaladoData.potencia_instalada_kwp} kWp instalado | Valor: ${formatCurrency(clienteInstaladoData.valor_final_negociado)} | ART: ${instalacao.numero_art || 'N/A'} | Homologação: ${instalacao.protocolo_homologacao || 'N/A'}`
        }]);

        // 8. Fechar modal e recarregar dados
        closeLeadModal();
        await refreshData();

        // 9. Mostrar notificação de sucesso
        showNotification(`🎉 Parabéns! Cliente instalado com sucesso e movido para "Instalados"!`, 'success');

    } catch (error) {
        console.error('Erro ao marcar como instalado:', error);
        showNotification(`Erro ao marcar como instalado: ${error.message}`, 'danger');
    }
}

// Exportar para uso global
window.showModule = showModule;
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;
window.openWhatsAppForCurrentLead = openWhatsAppForCurrentLead;
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
// Abas dinâmicas
window.uploadDocumento = uploadDocumento;
window.deletarDocumento = deletarDocumento;
window.enviarPropostaPorEmail = enviarPropostaPorEmail;
window.salvarStatusNegociacao = salvarStatusNegociacao;
window.salvarAgendamentoInstalacao = salvarAgendamentoInstalacao;
window.marcarComoInstalado = marcarComoInstalado;

console.log('✅ CRM Solar carregado com sucesso!');
