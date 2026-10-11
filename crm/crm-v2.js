// =========================================
// CRM ENERGIA SOLAR - JavaScript Principal
// =========================================

// Configuração Supabase
const SUPABASE_URL = 'https://zralzmgsdmwispfvgqvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYWx6bWdzZG13aXNwZnZncXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzA1NTYsImV4cCI6MjA3OTQwNjU1Nn0.lAarNVapj0c6A-1ix6PISUya0wMcRzruta1GECtwDD8';

// Cria cliente Supabase (evita redeclaração)
const supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabaseClient = supabaseClient;

// =========================================
// SISTEMA DE DESIGN "PAPEL E MESA" — TOKENS
// =========================================
// Este arquivo gera metade da interface por template string, e template string
// nao enxerga CSS: por isso os tokens precisam existir tambem aqui, em um unico
// lugar, com os valores medidos do crm/DESIGN-SYSTEM.md.
const TOKENS = {
    '--brand-300': '#8FC9C1',
    '--brand-400': '#5FAEA4',
    '--brand-500': '#3B9287',
    '--brand-600': '#297A72',
    '--brand-700': '#1A5952',
    '--ink-1': '#16211F',
    '--ink-2': '#3D4744',
    '--ink-3': '#5A6764',
    '--paper': '#FBFAF7',
    '--card': '#FFFFFF',
    '--sunken': '#F4F1EA',
    '--rule': '#D9D3C6',
    '--ok': '#1B7A4B',
    '--atencao': '#9A6209',
    '--grave': '#B3421C',
    '--critico': '#A3231F',
    '--info': '#1F5F8B'
};

// Rampa ordinal do funil: a escala da marca do claro ao escuro. A luminancia cai
// de forma monotonica (0.515 -> 0.080), entao a ordem das 5 etapas continua
// legivel para quem nao distingue matiz. Arco-iris reprova medido.
const RAMPA_FUNIL = ['--brand-300', '--brand-400', '--brand-500', '--brand-600', '--brand-700'];

// Chart.js pinta em canvas e nao resolve var(): o token tem de chegar na config
// ja em hex. Le do :root para o CSS seguir sendo a fonte unica, e cai no valor
// medido do spec se a folha de estilo ainda nao carregou.
function corDoToken(nome) {
    const lido = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    return lido || TOKENS[nome] || TOKENS['--ink-1'];
}

// Reserva de estilo do que ESTE arquivo emite (chip, regua, toast, botao).
// Entra como PRIMEIRO no de <head> de proposito: assim qualquer regra do
// index.html com a mesma especificidade vence a daqui, e o CSS segue dono do
// visual. Sem a reserva, um var(--brand-600) escrito em atributo style
// resolveria vazio e o botao primario ficaria com texto branco sobre nada.
function aplicarReservaDeEstilo() {
    if (document.getElementById('crm-tokens-reserva')) return;

    const raiz = Object.entries(TOKENS).map(([k, v]) => `${k}:${v}`).join(';');
    const style = document.createElement('style');
    style.id = 'crm-tokens-reserva';
    style.textContent = `
:root{${raiz};--luz:72%;
  --fonte-texto:'Inter',system-ui,sans-serif;
  --fonte-numero:'Atkinson Hyperlegible','Inter',system-ui,sans-serif;
  --fonte-titulo:'Fraunces',Georgia,serif}

/* Numero que vira decisao: Atkinson tabular, para o digito alinhar na coluna
   e para 1/l/I e 0/O nao se confundirem em celula densa. */
.num{font-family:var(--fonte-numero);font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.num-dir{text-align:right}
/* Serifada so em figura de display >=24px (KPI, preco). Nunca em rotulo. */
.num-display{font-family:var(--fonte-titulo);font-variant-numeric:tabular-nums;font-optical-sizing:auto;font-size:28px;line-height:1.1;font-weight:600;color:var(--ink-1)}

.tinta-1{color:var(--ink-1)}
.tinta-2{color:var(--ink-2)}
.tinta-3{color:var(--ink-3)}
.cor-ok{color:var(--ok)}
.cor-atencao{color:var(--atencao)}
.cor-grave{color:var(--grave)}
.cor-critico{color:var(--critico)}
.cor-info{color:var(--info)}
.cor-marca{color:var(--brand-600)}
/* A estrela de favorito mora na borda superior do card, onde o banho do
   queimado de sol tem alfa maximo. Em --atencao media 4,18:1 na faixa 60;
   em --brand-700 mede 6,26:1. */
.cor-marca-700{color:var(--brand-700)}

.sup-card{background:var(--card)}
.sup-recuo{background:var(--sunken)}
/* Fio estrutural de 2px: 1px a 1,2:1 desaparece em monitor TN com sol na janela. */
.fio{border:2px solid var(--rule)}
.fio-topo{border-top:2px solid var(--rule)}
/* Enfase por fio de 2px na marca, nao por sombra difusa nem por pilula verde. */
[data-recomendado]{border-color:var(--brand-600)}
/* Mesmo bloco recuado que o index.html chama de .secao-recuada: um nome so. */
.secao-recuada{background:var(--sunken);border:2px solid var(--rule);border-radius:6px}
.linha:hover{background:var(--sunken)}
/* Um unico anel de foco, visivel, em vez de tres matizes de utilitario. */
.foco-marca:focus-visible,.foco-marca:focus{outline:2px solid var(--brand-600);outline-offset:1px}
input[type="checkbox"],input[type="radio"]{accent-color:var(--brand-600)}
.opcao:hover{background:var(--sunken)}
/* Campo de formulario: mesmo nome do index.html. Placeholder em --ink-3 e sem
   opacidade, senao o texto de apoio cai abaixo do piso de 4,5:1. */
.campo{padding:6px 10px;font-family:var(--fonte-texto);font-size:13px;color:var(--ink-1);background:var(--card);border:2px solid var(--rule);border-radius:6px}
.campo::placeholder{color:var(--ink-3);opacity:1}
.campo:focus{outline:none;border-color:var(--brand-600)}

.botao-primario{background:var(--brand-600);color:var(--card);border:2px solid var(--brand-700);border-radius:6px;font-weight:600;cursor:pointer}
.botao-primario:hover{background:var(--brand-700)}
.botao-secundario{background:var(--card);color:var(--ink-1);border:2px solid var(--rule);border-radius:6px;font-weight:600;cursor:pointer}
.botao-secundario:hover{background:var(--sunken)}
.botao-info{background:var(--info);color:var(--card);border:2px solid var(--info);border-radius:6px;font-weight:600;cursor:pointer}
.botao-info:hover{filter:brightness(.9)}
.botao-ok{background:var(--ok);color:var(--card);border:2px solid var(--ok);border-radius:6px;font-weight:600;cursor:pointer}
.botao-ok:hover{filter:brightness(.9)}
.botao-acao{color:var(--brand-600)}
.botao-acao:hover{color:var(--brand-700)}
.botao-acao-perigo{color:var(--critico)}
.botao-acao-perigo:hover{color:var(--grave)}
.botao-acao-ok{color:var(--ok)}
/* Desabilitado por borda tracejada + cursor + rotulo. Opacidade apaga texto e
   e o caminho mais curto para reprovar contraste. */
.desabilitado{background:var(--card);border:2px dashed var(--rule);color:var(--ink-3);cursor:not-allowed}

/* Status: sempre icone + palavra. A cor e reforco, nunca o unico canal. */
.chip{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;border:2px solid currentColor;background:var(--card);white-space:nowrap}
.chip-parado{color:var(--atencao)}
.chip-perdido{color:var(--grave)}
.chip-atrasada{color:var(--critico)}
.chip-ok{color:var(--ok)}
.chip-info{color:var(--info)}
.chip-neutro{color:var(--ink-2);border-color:var(--rule)}

/* Regua do lead score: 120px, tique de 1px cravado nos 50 pontos (o limiar de
   qualificacao), faixa por palavra e denominador explicito. */
.regua{display:inline-flex;align-items:center;gap:8px}
.regua-trilha{position:relative;width:120px;height:10px;background:var(--sunken);border:2px solid var(--rule);border-radius:6px}
.regua-preenche{position:absolute;left:0;top:0;height:100%;background:var(--brand-500);border-radius:4px}
.regua-tique{position:absolute;left:50%;top:-4px;bottom:-4px;width:1px;background:var(--ink-1)}
.regua-valor{font-size:12px;color:var(--ink-1)}
.regua-faixa{font-size:11px;font-weight:700;letter-spacing:.4px;color:var(--ink-2)}

/* Toast: so erro e acao do usuario. A informacao recorrente vive na fita, e e
   por isso que ele desceu para o pe da tela: o topo agora e da fita e nao pode
   ser coberto. Os 96px de folga e o z-index acima de 999 existem porque o
   lancador do chat mora exatamente nesse canto: a 16px o toast ficava 122x44px
   encoberto por ele, e desde que o toast de sucesso saiu daqui o que sobra
   neste canal e justamente a mensagem de ERRO. */
.toast{position:fixed;bottom:96px;right:16px;z-index:1000;display:flex;align-items:center;gap:8px;max-width:380px;padding:10px 14px;border-radius:6px;border:2px solid var(--rule);background:var(--card);font-weight:600}
.toast-texto{color:var(--ink-1);font-weight:600}
.toast-success{border-color:var(--ok);color:var(--ok)}
.toast-danger{border-color:var(--critico);color:var(--critico)}
.toast-warning{border-color:var(--atencao);color:var(--atencao)}
.toast-info{border-color:var(--info);color:var(--info)}

.icone-tipo{background:var(--sunken);border:2px solid var(--rule);color:var(--ink-1)}
.kpi-figura{background:var(--sunken);border:2px solid var(--rule);color:var(--brand-600)}
.tarefa-card{background:var(--card);border:2px solid var(--rule);border-left-width:6px;border-radius:6px}
.tarefa-card[data-prazo="atrasada"]{border-left-color:var(--critico)}
.tarefa-card[data-prazo="hoje"]{border-left-color:var(--atencao)}
.tarefa-card[data-prazo="proxima"]{border-left-color:var(--info)}
.avatar-marca{background:var(--brand-600);color:var(--card)}
`;
    document.head.insertBefore(style, document.head.firstChild);
}

aplicarReservaDeEstilo();

// A linha do horizonte (--luz) e definida no <head> do index.html, antes do
// primeiro paint, para o fio nunca piscar. Nao duplicamos aqui: um dono so.

// =========================================
// AUTENTICAÇÃO
// =========================================
let currentUser = null;

// Fazer login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');

    // Desabilitar botão durante login
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Entrando...';
    loginError.classList.add('hidden');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        console.log('✅ Login bem-sucedido!', data);
        currentUser = data.user;

        // Mesma sequencia de boot usada na carga da pagina.
        await iniciarCrm();
        showModule('dashboard');

    } catch (error) {
        console.error('❌ Erro no login:', error);
        loginError.classList.remove('hidden');
        document.getElementById('loginErrorMessage').textContent =
            error.message === 'Invalid login credentials'
                ? 'Email ou senha incorretos'
                : error.message;
    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = 'Entrar';
    }
}

// Verificar sessão ao carregar página
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        console.log('✅ Sessão ativa encontrada');
        currentUser = session.user;
        return true;
    } else {
        console.log('⚠️ Nenhuma sessão ativa');
        return false;
    }
}

// Logout
async function handleLogout() {
    await supabaseClient.auth.signOut();
    currentUser = null;

    // Mostrar tela de login
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('crmApp').classList.add('hidden');

    showNotification('Logout realizado com sucesso', 'info');
}

// Recuperar senha
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = prompt('Digite seu email para recuperar a senha:');

    if (!email) return;

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) throw error;

        alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
        alert('Erro ao enviar email: ' + error.message);
    }
}

// Estado Global
let currentModule = 'dashboard';
let currentLead = null;
let currentStage = null; // Estágio atual do lead no Kanban
let leads = [];
let oportunidades = [];
let propostas = [];
let instalados = [];
let tarefas = [];
let kpis = {};
let interacoesStats = {}; // Estatísticas de interações por lead_id
let notificacoes = []; // Notificações do sistema de automação

// Charts
let funnelChart = null;
let conversionChart = null;

// =========================================
// INICIALIZAÇÃO
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando CRM Solar...');

    // Sem sessao valida o banco nao devolve nada: as tabelas estao sob RLS
    // e so respondem ao papel 'authenticated' (ver
    // crm/migrations/SECURITY_lockdown_rls.sql). Por isso a tela de login
    // fica na frente ate existir sessao, em vez de carregar um CRM vazio.
    const autenticado = await checkSession();

    if (!autenticado) {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('crmApp').classList.add('hidden');
        return;
    }

    await iniciarCrm();
});

// Carrega o CRM depois que existe sessao. Chamado pela inicializacao e
// tambem por handleLogin, para nao duplicar a sequencia de boot.
async function iniciarCrm() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('crmApp').classList.remove('hidden');

    await loadAllData();
    await loadCurrentUser();
    initializeKanban();
    setupEventListeners();

    if (!window._crmRefreshTimer) {
        window._crmRefreshTimer = setInterval(refreshData, 30000);
    }

    // O contador SYNC sobe desde a ultima carga: é ele que diz que o dado está
    // fresco, papel que antes era do toast.
    if (!window._crmFitaTimer) {
        window._crmFitaTimer = setInterval(atualizarSyncDaFita, 1000);
    }
}

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
            loadInteracoesStats(),
            loadNotificacoes()
        ]);

        // loadKPIs soma os arrays que os loaders acima preenchem, entao precisa
        // vir DEPOIS do await. Dentro do Promise.all ela rodava em paralelo com
        // eles e somava array vazio: a fita publicava "PIPELINE R$ 0,00 · ATIVOS 0"
        // nos primeiros 30 segundos de toda sessao, enquanto as raias do kanban
        // mostravam o valor real na mesma tela. Fita que mente nao substitui toast.
        await loadKPIs();

        // Renderizar módulo atual
        renderCurrentModule();

        // O toast de sucesso saiu daqui: com refresh de 30s ele aparecia duas
        // vezes por minuto, 8h por dia. A carga agora se anuncia na fita.
        ultimaCargaEm = Date.now();
        atualizarFitaOperacao();
        varrerFita();
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
        const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
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

async function loadInteracoesStats() {
    // Carregar todas as interações
    const { data: interacoes, error: intError } = await supabaseClient
        .from('interacoes')
        .select('lead_id, tipo');

    if (intError) {
        console.error('Erro ao carregar interações:', intError);
        return;
    }

    // Carregar todas as propostas
    const { data: props, error: propError } = await supabaseClient
        .from('propostas')
        .select('oportunidade_id, oportunidades!inner(lead_id)');

    if (propError) {
        console.error('Erro ao carregar propostas para stats:', propError);
    }

    // Carregar instalações
    const { data: installs, error: instError } = await supabaseClient
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
    const { data, error } = await supabaseClient
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
        badge.classList.add('num');
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

    // A cor por KPI saiu: 'blue'/'green'/'purple'/'yellow' montavam
    // bg-${color}-100 e text-${color}-600 por interpolacao, quatro matizes sem
    // significado nenhum. As quatro figuras agora tem o mesmo tratamento e o
    // icone e que distingue o indicador.
    const kpiData = [
        {
            title: 'Leads Ativos',
            value: kpis.leads_ativos,
            icon: 'fa-users',
            change: '+12%'
        },
        {
            title: 'Pipeline',
            value: formatCurrency(kpis.pipeline_valor),
            icon: 'fa-dollar-sign',
            change: '+8%'
        },
        {
            title: 'Instalados',
            value: kpis.clientes_instalados,
            icon: 'fa-check-circle',
            change: '+5%'
        },
        {
            title: 'NPS Médio',
            value: kpis.nps_medio,
            icon: 'fa-star',
            change: '+0.5'
        }
    ];

    kpiContainer.innerHTML = kpiData.map(kpi => `
        <div class="module-card kpi-card p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="tinta-2 text-sm font-medium">${kpi.title}</p>
                    <p class="num-display mt-2">${kpi.value}</p>
                    <p class="cor-ok text-sm mt-2">
                        <i class="fas fa-arrow-up"></i> <span class="num">${kpi.change}</span> vs mês anterior
                    </p>
                </div>
                <div class="kpi-figura w-14 h-14 rounded-full flex items-center justify-center">
                    <i class="fas ${kpi.icon} text-2xl"></i>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCharts() {
    renderFunnelChart();
    renderConversionChart();
}

// Base comum dos dois graficos: eixo e grade recessivos, texto nos tokens de
// tinta e tooltip com fio de 2px. Nunca eixo duplo — um grafico, uma escala.
function opcoesGrafico() {
    const tinta = corDoToken('--ink-3');
    const fio = corDoToken('--rule');

    return {
        responsive: true,
        plugins: {
            legend: {
                display: false,
                labels: { color: corDoToken('--ink-2') }
            },
            tooltip: {
                backgroundColor: corDoToken('--ink-1'),
                titleColor: corDoToken('--card'),
                bodyColor: corDoToken('--card'),
                borderColor: fio,
                borderWidth: 2,
                cornerRadius: 6,
                padding: 10,
                bodyFont: { family: "'Atkinson Hyperlegible','Inter',sans-serif" }
            }
        },
        scales: {
            x: {
                grid: { display: false, color: fio },
                border: { color: fio, width: 2 },
                ticks: { color: tinta }
            },
            y: {
                beginAtZero: true,
                grid: { color: fio, lineWidth: 1, drawTicks: false },
                border: { display: false },
                ticks: {
                    color: tinta,
                    precision: 0,
                    font: { family: "'Atkinson Hyperlegible','Inter',sans-serif" }
                }
            }
        }
    };
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
                // O funil e dado sequencial (5 etapas em ordem), nao categorico:
                // o arco-iris anterior dava a MESMA cor para violeta e azul em
                // deuteranopia. Rampa de uma matiz, luminancia decrescente.
                backgroundColor: RAMPA_FUNIL.map(corDoToken),
                borderColor: corDoToken('--brand-700'),
                borderWidth: 1,
                data: counts
            }]
        },
        options: opcoesGrafico()
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
                borderColor: corDoToken('--brand-600'),
                // Preenchimento no tom claro da marca: fundo de grafico, nunca texto.
                backgroundColor: corDoToken('--brand-300') + '59',
                pointBackgroundColor: corDoToken('--brand-700'),
                pointBorderColor: corDoToken('--card'),
                pointBorderWidth: 2,
                pointRadius: 4,
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: opcoesGrafico()
    });
}

function renderRecentLeads() {
    const container = document.getElementById('recent-leads');
    if (!container) return;

    const recentLeads = leads
        .filter(l => l.origem === 'chatbot')
        .slice(0, 5);

    container.innerHTML = recentLeads.map(lead => `
        <div class="flex items-center justify-between p-4 sup-recuo rounded-lg linha transition cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <div class="flex items-center gap-3">
                <div class="avatar-marca w-10 h-10 rounded-full flex items-center justify-center">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <p class="font-semibold tinta-1">${lead.nome || lead.email}</p>
                    <p class="text-sm tinta-2">${lead.email}</p>
                </div>
            </div>
            <div class="text-right">
                ${badgeStatus(lead.status)}
                <p class="num text-xs tinta-3 mt-1">${formatDate(lead.created_at)}</p>
            </div>
        </div>
    `).join('') || '<p class="tinta-3 text-center py-8">Nenhum lead recente do chatbot</p>';
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
        const { error } = await supabaseClient
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
                const { data: qualificacao } = await supabaseClient
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
                const { data: oportunidade, error: oppError } = await supabaseClient
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
                const { data: propostas, error: propError } = await supabaseClient
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
                // Verificar se tem dados de negociação
                const { data: negociacao } = await supabaseClient
                    .from('negociacao')
                    .select('*')
                    .eq('lead_id', leadId)
                    .single();

                if (!negociacao || !negociacao.status_proposta) {
                    return {
                        completo: false,
                        mensagem: 'Atualize o status da proposta na aba Negociação'
                    };
                }
                break;

            case 'negociacao':
                // Verificar se proposta foi aceita
                const { data: negociacaoStatus } = await supabaseClient
                    .from('negociacao')
                    .select('status_proposta')
                    .eq('lead_id', leadId)
                    .single();

                if (!negociacaoStatus || negociacaoStatus.status_proposta !== 'aceita') {
                    return {
                        completo: false,
                        mensagem: 'A proposta precisa estar aceita para ir ao fechamento'
                    };
                }
                break;

            case 'fechamento':
                // Verificar se tem ART, homologação e data preenchidos
                const { data: instalacao } = await supabaseClient
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

        // Atualizar contador. A figura tabular entra por classList porque o
        // elemento vive no index.html e so recebe textContent, sem filhos.
        if (countBadge) {
            countBadge.classList.add('num');
            countBadge.textContent = oportunidadesEtapa.length;
        }

        // Valor somado da raia: o vendedor decide por dinheiro parado na coluna,
        // nao por quantidade de cartoes. Escreve so se o cabecalho da coluna
        // tiver o elemento, porque esse markup e do index.html.
        const somaRaia = document.querySelector(`.kanban-column[data-etapa="${etapa}"] .kanban-soma`);
        if (somaRaia) {
            somaRaia.classList.add('num');
            somaRaia.textContent = formatCurrency(
                oportunidadesEtapa.reduce((t, o) => t + (parseFloat(o.valor_estimado) || 0), 0)
            );
        }

        container.innerHTML = oportunidadesEtapa.map(oportunidade => {
            const lead = oportunidade.leads;
            const diasInativo = calcularDiasInativo(oportunidade.data_ultima_atualizacao);
            // Tres degraus em vez de um binario: 15 dias deixa de ser identico a
            // 120. O banho quente do CSS le este atributo; a opacidade saiu de
            // cena, porque apagar o card que mais precisa de toque custa negocio.
            const faixaDias = diasInativo >= 60 ? '60'
                : diasInativo >= 30 ? '30'
                : diasInativo >= 14 ? '14' : '';

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

            // Verificar se há instalação agendada (buscar no array instalados)
            const instalacao = instalados.find(inst => inst.oportunidade_id === oportunidade.id);
            const temInstalacaoAgendada = instalacao?.data_agendamento_instalacao;

            // Status por ícone + palavra. Antes era um ponto colorido com a
            // primeira letra ("P"), que some para quem não distingue matiz — e
            // "perdido" (tijolo) dividia o mesmo vermelho de "parado" (âmbar).
            let statusChip = '';

            if (temInstalacaoAgendada) {
                statusChip = chipStatus('chip-info', 'fa-trophy', 'Agendada');
            } else if (lead?.status === 'perdido') {
                statusChip = chipStatus('chip-perdido', 'fa-circle-xmark', 'Perdido');
            } else if (lead?.status === 'qualificado') {
                statusChip = chipStatus('chip-ok', 'fa-circle-check', 'Qualificado');
            } else if (lead?.status === 'em_nutricao') {
                statusChip = chipStatus('chip-parado', 'fa-seedling', 'Nutrição');
            }

            return `
                <div class="kanban-card"${faixaDias ? ` data-dias-faixa="${faixaDias}"` : ''} data-id="${oportunidade.id}" onclick="openLeadModal('${oportunidade.lead_id}')">
                    <!-- Cabeçalho com nome e estrela de favorito -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1 min-w-0 kanban-card-titulo">
                            <h4 class="font-semibold tinta-1 text-sm">${lead?.nome || lead?.email || 'Lead sem nome'}</h4>
                            <p class="text-xs tinta-3 mt-0.5">
                                <i class="fas fa-clock"></i> <span class="num">${dataFormatada} ${horaFormatada}</span>
                            </p>
                        </div>
                        <div class="flex items-center gap-2 kanban-card-acoes">
                            ${statusChip}
                            <button onclick="event.stopPropagation(); toggleFavorito('${oportunidade.id}')" class="transition-transform hover:scale-110" title="${oportunidade.favorito ? 'Remover dos favoritos' : 'Marcar como favorito'}">
                                <i class="fas fa-star text-lg ${oportunidade.favorito ? 'cor-marca-700' : 'tinta-3'}"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Valor e consumo: numero que vira decisao, em figura tabular -->
                    <div class="flex items-center justify-between mb-2 kanban-card-valor">
                        <span class="num text-sm font-bold tinta-1">${formatCurrency(oportunidade.valor_estimado)}</span>
                        <span class="text-xs tinta-2">
                            <i class="fas fa-bolt"></i> <span class="num">${lead?.consumo_mensal || 0}</span> kWh
                        </span>
                    </div>

                    <!-- Ícones de estatísticas: contagem zero fica legível, não apagada -->
                    <div class="flex items-center justify-between pt-2 fio-topo">
                        <!-- Email -->
                        <div class="flex items-center gap-1" title="${stats.emails} email(s) enviado(s)">
                            <i class="fas fa-envelope text-xs ${stats.emails > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.emails > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.emails}</span>
                        </div>

                        <!-- Chamadas -->
                        <div class="flex items-center gap-1" title="${stats.chamadas} ligaç(ões) realizada(s)">
                            <i class="fas fa-phone text-xs ${stats.chamadas > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.chamadas > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.chamadas}</span>
                        </div>

                        <!-- Propostas -->
                        <div class="flex items-center gap-1" title="${stats.propostas} proposta(s) criada(s)">
                            <i class="fas fa-file-invoice-dollar text-xs ${stats.propostas > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.propostas > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.propostas}</span>
                        </div>

                        <!-- Instalações -->
                        <div class="flex items-center gap-1" title="${stats.instalacoes} instalação(ões) concluída(s)">
                            <i class="fas fa-solar-panel text-xs ${stats.instalacoes > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.instalacoes > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.instalacoes}</span>
                        </div>

                        <!-- Badge tipo cliente -->
                        <span class="badge badge-${lead?.tipo_cliente === 'empresarial' ? 'info' : 'gray'} text-xs">
                            ${lead?.tipo_cliente === 'empresarial' ? 'EMP' : 'RES'}
                        </span>
                    </div>

                    ${faixaDias ? `
                        <p class="mt-2">
                            <span class="chip chip-parado">
                                <i class="fas fa-hourglass-half"></i>
                                <span class="num">${diasInativo}</span> dias sem contato
                            </span>
                        </p>
                    ` : ''}
                </div>
            `;
        }).join('') || '<p class="tinta-3 text-sm text-center py-4">Nenhuma oportunidade</p>';
    });
}

// Status nunca sai só na cor: o chip carrega ícone + palavra, e a palavra é que
// separa "parado" de "perdido" para quem não distingue matiz.
function chipStatus(classe, icone, palavra) {
    return `<span class="chip ${classe}" title="${palavra}"><i class="fas ${icone}"></i> ${palavra}</span>`;
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
    const { error } = await supabaseClient
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
function renderLeadsTable() {
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;

    tbody.innerHTML = ordenarLista(leads, 'leads').map(lead => `
        <tr class="linha cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="avatar-marca w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3">
                        ${(lead.nome || lead.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-semibold tinta-1">${lead.nome || 'Sem nome'}</p>
                        <p class="text-sm tinta-2">${lead.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${lead.tipo_cliente === 'empresarial' ? 'info' : 'gray'}">
                    ${lead.tipo_cliente === 'empresarial' ? 'Empresarial' : 'Residencial'}
                </span>
            </td>
            <td class="px-6 py-4 num num-dir font-semibold tinta-1">${lead.consumo_mensal || 0} kWh</td>
            <td class="px-6 py-4">${reguaScore(lead.lead_score)}</td>
            <td class="px-6 py-4">
                ${badgeStatus(lead.status)}
            </td>
            <td class="px-6 py-4 text-sm tinta-2">${lead.user_id ? 'Atribuído' : 'Não atribuído'}</td>
            <td class="px-6 py-4">
                <button onclick="event.stopPropagation(); editLead('${lead.id}')" class="botao-acao mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteLead('${lead.id}')" class="botao-acao botao-acao-perigo">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center py-8 tinta-3">Nenhum lead encontrado</td></tr>';
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
    const { data: oportunidade } = await supabaseClient
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
        const { error } = await supabaseClient
            .from('interacoes')
            .insert([{
                lead_id: currentLead.id,
                tipo: tipo,
                titulo: titulo,
                descricao: descricao || null
            }]);

        if (error) throw error;

        // Se marcado como tentativa sem resposta, incrementar contador
        if (semResposta) {
            // Buscar valor atual do banco primeiro
            const { data: leadAtual, error: fetchError } = await supabaseClient
                .from('leads')
                .select('tentativas_contato')
                .eq('id', currentLead.id)
                .single();

            if (fetchError) {
                console.error('Erro ao buscar lead:', fetchError);
            } else {
                const novoValor = (leadAtual.tentativas_contato || 0) + 1;

                const { error: leadError } = await supabaseClient
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
            <p class="text-sm tinta-2">Tipo</p>
            <p class="font-semibold">${lead.tipo_cliente === 'empresarial' ? 'Empresarial' : 'Residencial'}</p>
        </div>
        <div>
            <p class="text-sm tinta-2">Telefone</p>
            <p class="font-semibold">${lead.phone || 'Não informado'}</p>
        </div>
        <div>
            <p class="text-sm tinta-2">Consumo Mensal</p>
            <p class="num font-semibold tinta-1">${lead.consumo_mensal || 0} kWh</p>
        </div>
        <div>
            <p class="text-sm tinta-2">Status</p>
            <p>${badgeStatus(lead.status)}</p>
        </div>
        <div class="col-span-2">
            <p class="text-sm tinta-2">Lead Score</p>
            <p class="mt-1">${reguaScore(lead.lead_score)}</p>
        </div>
        <div>
            <p class="text-sm tinta-2">Origem</p>
            <p class="font-semibold">${lead.origem || 'chatbot'}</p>
        </div>
        <div class="col-span-2">
            <p class="text-sm tinta-2">Cadastrado em</p>
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
            <label class="text-sm tinta-2">Nome</label>
            <input type="text" id="edit-nome" value="${lead.nome || ''}" class="campo w-full mt-1">
        </div>
        <div>
            <label class="text-sm tinta-2">Email</label>
            <input type="email" id="edit-email" value="${lead.email || ''}" class="campo w-full mt-1">
        </div>
        <div>
            <label class="text-sm tinta-2">Telefone</label>
            <input type="text" id="edit-phone" value="${lead.phone || ''}" class="campo w-full mt-1">
        </div>
        <div>
            <label class="text-sm tinta-2">Tipo</label>
            <select id="edit-tipo" class="campo w-full mt-1">
                <option value="residencial" ${lead.tipo_cliente === 'residencial' ? 'selected' : ''}>Residencial</option>
                <option value="empresarial" ${lead.tipo_cliente === 'empresarial' ? 'selected' : ''}>Empresarial</option>
            </select>
        </div>
        <div>
            <label class="text-sm tinta-2">Consumo Mensal (kWh)</label>
            <input type="number" id="edit-consumo" value="${lead.consumo_mensal || 0}" class="campo w-full mt-1">
        </div>
        <div>
            <label class="text-sm tinta-2">Status</label>
            <select id="edit-status" class="campo w-full mt-1">
                <option value="novo" ${lead.status === 'novo' ? 'selected' : ''}>Novo</option>
                <option value="qualificado" ${lead.status === 'qualificado' ? 'selected' : ''}>Qualificado</option>
                <option value="em_nutricao" ${lead.status === 'em_nutricao' ? 'selected' : ''}>Em Nutrição</option>
                <option value="nao_qualificado" ${lead.status === 'nao_qualificado' ? 'selected' : ''}>Não Qualificado</option>
                <option value="convertido" ${lead.status === 'convertido' ? 'selected' : ''}>Convertido</option>
                <option value="perdido" ${lead.status === 'perdido' ? 'selected' : ''}>Perdido</option>
            </select>
        </div>
        <div class="col-span-2">
            <label class="text-sm tinta-2">Motivo de Espera <span class="text-xs tinta-3">(Para nutrição automática)</span></label>
            <textarea id="edit-motivo-espera" class="campo w-full mt-1 text-sm" rows="2" placeholder="Ex: Vai construir a casa em 6 meses, aguardando aprovação de financiamento, etc.">${lead.motivo_espera || ''}</textarea>
            <p class="text-xs tinta-3 mt-1">💡 Se preenchido + sem interação 7-14 dias → move para "Em Nutrição" automaticamente</p>
        </div>
        <div>
            <label class="text-sm tinta-2">Data Prevista de Retorno</label>
            <input type="date" id="edit-data-retorno" value="${lead.data_prevista_retorno || ''}" class="campo w-full mt-1">
            <p class="text-xs tinta-3 mt-1">Quando retomar o contato</p>
        </div>
        <div>
            <label class="text-sm tinta-2">Tentativas de Contato</label>
            <input type="number" id="edit-tentativas" value="${lead.tentativas_contato || 0}" class="campo desabilitado w-full mt-1" readonly title="Somente leitura: contado pelo sistema">
            <p class="text-xs tinta-3 mt-1">3+ tentativas + 30 dias → marca como "Perdido"</p>
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

        const { error } = await supabaseClient
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
    const { data: interacoes, error } = await supabaseClient
        .from('interacoes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar timeline:', error);
        return;
    }

    // Sete tipos pintados de sete matizes era arco-iris categorico: o glifo
    // ja distingue o tipo, entao o circulo fica neutro e o icone legivel.
    const iconMap = {
        email: { icon: 'fa-envelope' },
        whatsapp: { icon: 'fa-whatsapp' },
        chamada: { icon: 'fa-phone' },
        visita: { icon: 'fa-home' },
        nota: { icon: 'fa-sticky-note' },
        upload: { icon: 'fa-paperclip' },
        sistema: { icon: 'fa-robot' }
    };

    container.innerHTML = interacoes.map(interacao => {
        const config = iconMap[interacao.tipo] || iconMap.sistema;

        return `
            <div class="timeline-item">
                <div class="timeline-icon icone-tipo" title="${formatTipo(interacao.tipo)}">
                    <i class="fas ${config.icon}"></i>
                </div>
                <div class="sup-recuo rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold tinta-1">${interacao.titulo || formatTipo(interacao.tipo)}</h4>
                        <span class="text-xs tinta-3">${formatDateTime(interacao.created_at)}</span>
                    </div>
                    ${interacao.descricao ? `<p class="text-sm tinta-2">${interacao.descricao}</p>` : ''}
                    ${interacao.arquivo_url ? `<a href="${interacao.arquivo_url}" target="_blank" class="cor-info text-sm hover:underline mt-2 inline-block"><i class="fas fa-file"></i> Ver arquivo</a>` : ''}
                </div>
            </div>
        `;
    }).join('') || '<p class="tinta-3 text-center py-8">Nenhuma interação registrada</p>';
}

async function renderLeadQualificacao(leadId) {
    const container = document.getElementById('qualificacao-content');

    // Buscar qualificação
    const { data: qualificacao, error } = await supabaseClient
        .from('qualificacao')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    if (error && error.code !== 'PGRST116') {
        container.innerHTML = '<p class="cor-critico text-center py-8">Erro ao carregar qualificação</p>';
        return;
    }

    const qual = qualificacao || {};

    container.innerHTML = `
        <form id="form-qualificacao" class="space-y-6">
            <!-- Seção: Viabilidade Técnica -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Viabilidade Técnica</h3>
                </div>
                <div class="space-y-3">
                    <label class="flex items-start gap-3 cursor-pointer opcao p-2 rounded">
                        <input type="checkbox" name="telhado_bom_estado" ${qual.telhado_bom_estado ? 'checked' : ''}
                               class="mt-1 w-5 h-5 rounded foco-marca">
                        <span class="tinta-1">
                            <strong>Telhado em bom estado</strong>
                            <p class="text-sm tinta-3">Sem rachaduras, telhas quebradas ou infiltrações</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer opcao p-2 rounded">
                        <input type="checkbox" name="pouco_sombreamento" ${qual.pouco_sombreamento ? 'checked' : ''}
                               class="mt-1 w-5 h-5 rounded foco-marca">
                        <span class="tinta-1">
                            <strong>Pouco ou nenhum sombreamento (&lt; 20%)</strong>
                            <p class="text-sm tinta-3">Sem árvores, prédios ou estruturas que façam sombra</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer opcao p-2 rounded">
                        <input type="checkbox" name="estrutura_suporta_peso" ${qual.estrutura_suporta_peso ? 'checked' : ''}
                               class="mt-1 w-5 h-5 rounded foco-marca">
                        <span class="tinta-1">
                            <strong>Estrutura suporta peso dos painéis</strong>
                            <p class="text-sm tinta-3">Telhado tem capacidade estrutural adequada (15-20 kg/m²)</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer opcao p-2 rounded">
                        <input type="checkbox" name="telhado_compativel" ${qual.telhado_compativel ? 'checked' : ''}
                               class="mt-1 w-5 h-5 rounded foco-marca">
                        <span class="tinta-1">
                            <strong>Tipo de telhado compatível</strong>
                            <p class="text-sm tinta-3">Cerâmico, metálico, fibrocimento ou laje</p>
                        </span>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer opcao p-2 rounded">
                        <input type="checkbox" name="acesso_adequado" ${qual.acesso_adequado ? 'checked' : ''}
                               class="mt-1 w-5 h-5 rounded foco-marca">
                        <span class="tinta-1">
                            <strong>Acesso adequado para instalação</strong>
                            <p class="text-sm tinta-3">Escada, andaime ou acesso seguro ao telhado</p>
                        </span>
                    </label>
                </div>
                <div class="mt-4 p-3 secao-recuada">
                    ${qual.viabilidade_tecnica
                        ? chipStatus('chip-ok', 'fa-circle-check', 'Viável tecnicamente')
                        : chipStatus('chip-neutro', 'fa-list-check', 'Marque todos os itens para confirmar viabilidade')}
                </div>
            </div>

            <!-- Seção: Decisor -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Poder de Decisão</h3>
                </div>
                <div class="space-y-3">
                    <label class="flex items-start gap-3 cursor-pointer opcao p-2 rounded">
                        <input type="checkbox" name="decisor_autonomia" ${qual.decisor_autonomia || qual.decisor ? 'checked' : ''}
                               class="mt-1 w-5 h-5 rounded foco-marca">
                        <span class="tinta-1">
                            <strong>Tem autonomia para decidir</strong>
                            <p class="text-sm tinta-3">
                                <strong>Residencial:</strong> Proprietário que decide sozinho<br>
                                <strong>Empresarial:</strong> Dono, CEO, CFO ou diretor com autonomia
                            </p>
                        </span>
                    </label>
                </div>
                <div class="mt-3">
                    <label class="block text-sm font-medium tinta-1 mb-1">Observações sobre decisor</label>
                    <textarea name="observacoes_decisor" rows="2"
                              class="campo w-full text-sm"
                              placeholder="Ex: Precisa consultar sócio, esposa tem veto, etc.">${qual.observacoes_decisor || ''}</textarea>
                </div>
            </div>

            <!-- Seção: Prontidão de Compra -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Prontidão de Compra</h3>
                </div>
                <div>
                    <label class="block text-sm font-medium tinta-1 mb-2">Quando pretende instalar?</label>
                    <select name="prontidao_compra"
                            class="campo w-full">
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
                    <label class="block text-sm font-medium tinta-1 mb-1">Tipo de Telhado</label>
                    <select name="tipo_telhado" class="campo w-full">
                        <option value="">Selecione...</option>
                        <option value="fibrocimento" ${qual.tipo_telhado === 'fibrocimento' ? 'selected' : ''}>Fibrocimento</option>
                        <option value="ceramico" ${qual.tipo_telhado === 'ceramico' ? 'selected' : ''}>Cerâmico</option>
                        <option value="metalico" ${qual.tipo_telhado === 'metalico' ? 'selected' : ''}>Metálico</option>
                        <option value="laje" ${qual.tipo_telhado === 'laje' ? 'selected' : ''}>Laje</option>
                        <option value="outro" ${qual.tipo_telhado === 'outro' ? 'selected' : ''}>Outro</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium tinta-1 mb-1">Tipo de Ligação</label>
                    <select name="tipo_ligacao" class="campo w-full">
                        <option value="">Selecione...</option>
                        <option value="monofasica" ${qual.tipo_ligacao === 'monofasica' ? 'selected' : ''}>Monofásica</option>
                        <option value="bifasica" ${qual.tipo_ligacao === 'bifasica' ? 'selected' : ''}>Bifásica</option>
                        <option value="trifasica" ${qual.tipo_ligacao === 'trifasica' ? 'selected' : ''}>Trifásica</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium tinta-1 mb-1">Observações Gerais</label>
                <textarea name="observacoes" rows="3"
                          class="campo w-full"
                          placeholder="Informações adicionais sobre a qualificação...">${qual.observacoes || ''}</textarea>
            </div>

            <!-- Botão Salvar -->
            <div class="flex gap-3">
                <button type="submit"
                        class="flex-1 botao-primario px-6 py-3">
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

    try {
        // Buscar qualificação existente para preservar dados do chatbot
        const { data: existingQual } = await supabaseClient
            .from('qualificacao')
            .select('*')
            .eq('lead_id', leadId)
            .single();

        // Mesclar dados existentes com novos dados do formulário
        const qualificacaoData = {
            ...(existingQual || {}), // Preserva TODOS os campos existentes (family_size, kwh_consumption, roof_type, sombreamento_percentual, etc)
            lead_id: leadId,
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

        const { error } = await supabaseClient
            .from('qualificacao')
            .upsert(qualificacaoData, { onConflict: 'lead_id' });

        if (error) throw error;

        // Registrar na timeline
        await supabaseClient.from('interacoes').insert([{
            lead_id: leadId,
            tipo: 'sistema',
            titulo: 'Qualificação Atualizada',
            descricao: `Viabilidade: ${qualificacaoData.telhado_bom_estado && qualificacaoData.pouco_sombreamento ? 'OK' : 'Pendente'} | Prontidão: ${formatProntidao(qualificacaoData.prontidao_compra)}`
        }]);

        showNotification('Qualificação salva com sucesso!', 'success');

        // Buscar lead atualizado com score para verificar se deve qualificar
        const { data: leadAtualizado } = await supabaseClient
            .from('leads')
            .select('lead_score, status')
            .eq('id', leadId)
            .single();

        // Se score >= 50, atualizar status para qualificado automaticamente
        if (leadAtualizado && leadAtualizado.lead_score >= 50 && leadAtualizado.status !== 'qualificado') {
            await supabaseClient
                .from('leads')
                .update({ status: 'qualificado' })
                .eq('id', leadId);

            // Registrar na timeline
            await supabaseClient.from('interacoes').insert([{
                lead_id: leadId,
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
    // currentTarget, nao target: configurarAbasDinamicas injeta um <i> dentro do
    // #tab-btn-dynamic, e um clique no icone faria event.target ser o <i> — o
    // .active ia para o icone e a barra de abas ficava sem nada selecionado.
    (event.currentTarget || event.target).classList.add('active');
}

// =========================================
// PROPOSTAS
// =========================================
function renderPropostas() {
    const container = document.getElementById('propostas-grid');
    if (!container) return;

    // Ordena por valor: a proposta de R$ 1,2 milhao e a que decide o mes, e
    // nao faz sentido ela aparecer embaixo de uma de R$ 20 mil so porque foi
    // cadastrada depois.
    const lista = [...propostas].sort(
        (a, b) => (parseFloat(b.valor_final) || 0) - (parseFloat(a.valor_final) || 0)
    );

    // Resumo da carteira. O vendedor abre esta tela para saber quanto esta na
    // rua, e esse numero nao existia em lugar nenhum: ele tinha de somar os
    // cards com o olho.
    const aguardando = lista.filter(p => ['enviada', 'visualizada'].includes(p.status));
    const totalRua = aguardando.reduce((s, p) => s + (parseFloat(p.valor_final) || 0), 0);
    const aceitas = lista.filter(p => p.status === 'aceita');
    const totalAceito = aceitas.reduce((s, p) => s + (parseFloat(p.valor_final) || 0), 0);

    const resumo = `
        <div class="propostas-resumo fio">
            <div class="propostas-resumo__item">
                <span class="propostas-resumo__rotulo">Na rua</span>
                <span class="propostas-resumo__valor num">${formatCurrency(totalRua)}</span>
                <span class="propostas-resumo__nota num">${aguardando.length} aguardando resposta</span>
            </div>
            <div class="propostas-resumo__item">
                <span class="propostas-resumo__rotulo">Fechado</span>
                <span class="propostas-resumo__valor num cor-ok">${formatCurrency(totalAceito)}</span>
                <span class="propostas-resumo__nota num">${aceitas.length} aceitas</span>
            </div>
            <div class="propostas-resumo__item">
                <span class="propostas-resumo__rotulo">Conversão</span>
                <span class="propostas-resumo__valor num">${lista.length ? Math.round(aceitas.length / lista.length * 100) : 0}%</span>
                <span class="propostas-resumo__nota num">${lista.length} propostas no total</span>
            </div>
        </div>`;

    const cards = lista.map(proposta => {
        const vista = !!proposta.data_visualizacao;
        const diasDesde = proposta.created_at
            ? Math.floor((Date.now() - new Date(proposta.created_at).getTime()) / 86400000)
            : null;
        // Validade padrao de 15 dias, como no schema. Proposta vencida sem
        // resposta e a que mais precisa de telefonema, e antes nada na tela
        // dizia isso.
        const validade = proposta.validade_dias || 15;
        const vencida = diasDesde !== null && diasDesde > validade
            && ['enviada', 'visualizada'].includes(proposta.status);

        const economia = parseFloat(proposta.economia_mensal_prevista) || 0;
        const payback = parseInt(proposta.payback_meses) || 0;

        return `
            <article class="proposta-card module-card ${vencida ? 'proposta-card--vencida' : ''}">
                <header class="proposta-card__topo">
                    <div class="proposta-card__id">
                        <span class="proposta-card__numero num">${proposta.numero_proposta}</span>
                        <span class="proposta-card__lead">${proposta.oportunidades?.leads?.nome || 'Lead sem nome'}</span>
                    </div>
                    ${badgeStatus(proposta.status)}
                </header>

                <p class="proposta-card__valor num">${formatCurrency(proposta.valor_final)}</p>

                <dl class="proposta-card__specs">
                    <div><dt>Potência</dt><dd class="num">${proposta.potencia_total_kwp || 0} kWp</dd></div>
                    <div><dt>Módulos</dt><dd class="num">${proposta.num_modulos || 0}</dd></div>
                    ${economia ? `<div><dt>Economia</dt><dd class="num">${formatCurrency(economia)}/mês</dd></div>` : ''}
                    ${payback ? `<div><dt>Payback</dt><dd class="num">${(payback / 12).toFixed(1)} anos</dd></div>` : ''}
                </dl>

                <p class="proposta-card__rastro">
                    ${vencida
                        ? `<span class="chip chip-parado"><i class="fas fa-hourglass-half"></i> Vencida há ${diasDesde - validade} dias</span>`
                        : vista
                            ? `<span class="chip chip-ok"><i class="fas fa-eye"></i> Vista em ${formatDate(proposta.data_visualizacao)}</span>`
                            : `<span class="chip"><i class="fas fa-paper-plane"></i> Ainda não aberta</span>`}
                </p>

                <footer class="proposta-card__acoes">
                    <button onclick="abrirProposta('${proposta.token_rastreio}')" class="botao-primario">
                        <i class="fas fa-eye" aria-hidden="true"></i> Abrir
                    </button>
                    <button onclick="copiarLinkProposta('${proposta.token_rastreio}')" class="botao-secundario" title="Copiar o link para enviar ao cliente">
                        <i class="fas fa-link" aria-hidden="true"></i> Link
                    </button>
                    ${proposta.arquivo_pdf_url ? `
                        <a href="${proposta.arquivo_pdf_url}" target="_blank" rel="noopener" class="botao-secundario">
                            <i class="fas fa-file-pdf" aria-hidden="true"></i> PDF
                        </a>` : ''}
                </footer>
            </article>`;
    }).join('');

    container.innerHTML = lista.length
        ? resumo + `<div class="propostas-lista">${cards}</div>`
        : `<div class="estado-vazio fio">
               <i class="fas fa-file-invoice-dollar" aria-hidden="true"></i>
               <p><strong>Nenhuma proposta ainda.</strong></p>
               <p class="tinta-3">As propostas aparecem aqui assim que você fechar uma oportunidade no kanban.</p>
           </div>`;
}

// Monta o link publico da proposta. Antes isto recortava a URL ate a ultima
// barra: aberto em /crm (sem barra final) o recorte parava no dominio e o
// link saia como /proposta.html, que nao existe. Com pathname a conta e feita
// sobre o caminho, e query string e ancora nao entram no meio.
function linkDaProposta(token) {
    const dir = window.location.pathname.replace(/[^/]*$/, '');
    return `${window.location.origin}${dir}proposta.html?t=${encodeURIComponent(token)}`;
}

function abrirProposta(token) {
    const janela = window.open(linkDaProposta(token), '_blank', 'noopener');
    // O navegador bloqueia popup quando o clique nao e reconhecido como gesto
    // do usuario. Sem este aviso, clicar em "Visualizar" nao fazia nada e nao
    // explicava nada.
    if (!janela) {
        showNotification('O navegador bloqueou a nova aba. Libere os pop-ups deste site.', 'error');
    }
}

async function copiarLinkProposta(token) {
    const url = linkDaProposta(token);

    // navigator.clipboard so existe em contexto seguro: funciona em https e em
    // localhost, mas NAO em http://192.168.x.x, que e como a equipe costuma
    // abrir o CRM na rede do escritorio. Antes a promessa era ignorada, entao
    // o toast dizia "copiado" sem ter copiado nada.
    try {
        if (!navigator.clipboard) throw new Error('sem_clipboard');
        await navigator.clipboard.writeText(url);
        showNotification('Link copiado.', 'success');
        return;
    } catch (e) {
        // Caminho antigo, que funciona fora de contexto seguro.
        try {
            const campo = document.createElement('textarea');
            campo.value = url;
            campo.setAttribute('readonly', '');
            campo.style.cssText = 'position:fixed;top:-1000px;opacity:0';
            document.body.appendChild(campo);
            campo.select();
            const deu = document.execCommand('copy');
            document.body.removeChild(campo);
            if (deu) { showNotification('Link copiado.', 'success'); return; }
        } catch (e2) { /* cai no aviso abaixo */ }

        // Nem um nem outro: mostra o link para copiar a mao, em vez de mentir.
        showNotification('Não consegui copiar. O link é: ' + url, 'error');
        console.warn('[crm] cópia bloqueada. Link da proposta:', url);
    }
}

// =========================================
// CLIENTES INSTALADOS
// =========================================
function renderInstalados() {
    // Atualizar KPIs. A classe entra por classList porque estes três elementos
    // vivem no index.html e aqui só recebem textContent: sem a figura tabular o
    // numeral desalinha a cada carga.
    marcarComoNumero('total-instalados', instalados.length);

    const potenciaTotal = instalados.reduce((sum, c) => sum + (parseFloat(c.potencia_instalada_kwp) || 0), 0);
    marcarComoNumero('potencia-total', potenciaTotal.toFixed(2) + ' kWp');

    marcarComoNumero('nps-medio', kpis.nps_medio);

    // Renderizar tabela
    const tbody = document.getElementById('instalados-table-body');
    if (!tbody) return;

    tbody.innerHTML = ordenarLista(instalados, 'instalados').map(cliente => `
        <tr class="linha">
            <td class="px-6 py-4">
                <p class="font-semibold">${cliente.leads?.nome || 'Sem nome'}</p>
                <p class="text-sm tinta-2">${cliente.leads?.email}</p>
            </td>
            <td class="px-6 py-4 num text-sm tinta-1">${cliente.numero_contrato || 'N/A'}</td>
            <td class="px-6 py-4 num text-sm tinta-2">${formatDate(cliente.data_instalacao)}</td>
            <td class="px-6 py-4 num num-dir font-semibold tinta-1">${cliente.potencia_instalada_kwp || 0} kWp</td>
            <td class="px-6 py-4 num num-dir font-semibold tinta-1">${formatCurrency(cliente.valor_final_negociado)}</td>
            <td class="px-6 py-4">
                ${cliente.nps != null ? `
                    <div class="flex items-center gap-2">
                        <span class="num font-bold tinta-1">${cliente.nps}/10</span>
                        ${cliente.nps >= 9
                            ? chipStatus('chip-ok', 'fa-face-smile', 'Promotor')
                            : cliente.nps >= 7
                                ? chipStatus('chip-neutro', 'fa-face-meh', 'Neutro')
                                : chipStatus('chip-perdido', 'fa-face-frown', 'Detrator')}
                    </div>
                ` : '<span class="tinta-3">N/A</span>'}
            </td>
            <td class="px-6 py-4">
                <button class="botao-acao">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center py-8 tinta-3">Nenhum cliente instalado</td></tr>';
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

    // O terceiro argumento virou o prazo, nao a cor: border-${color}-500 era
    // classe montada em runtime e só pintava se o Tailwind compilado a tivesse.
    renderTarefasColumn('tarefas-atrasadas', atrasadas, 'atrasada');
    renderTarefasColumn('tarefas-hoje', hojeTarefas, 'hoje');
    renderTarefasColumn('tarefas-proximas', proximas, 'proxima');
}

function renderTarefasColumn(containerId, tarefas, prazo) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chipPrazo = {
        atrasada: chipStatus('chip-atrasada', 'fa-triangle-exclamation', 'Atrasada'),
        hoje: chipStatus('chip-parado', 'fa-clock', 'Hoje'),
        proxima: chipStatus('chip-info', 'fa-calendar-day', 'Próxima')
    }[prazo] || '';

    container.innerHTML = tarefas.map(tarefa => `
        <div class="tarefa-card p-4" data-prazo="${prazo}">
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold tinta-1 text-sm">${tarefa.titulo}</h4>
                <div class="flex gap-2">
                    <button onclick="concluirTarefa('${tarefa.id}')" class="botao-acao botao-acao-ok" title="Concluir">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="editarTarefa('${tarefa.id}')" class="botao-acao" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deletarTarefa('${tarefa.id}')" class="botao-acao botao-acao-perigo" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="text-xs tinta-2 mb-2">${tarefa.descricao || ''}</p>
            <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-xs tinta-2">
                    <i class="fas fa-calendar"></i> <span class="num">${formatDate(tarefa.data_vencimento)}</span>
                </span>
                ${chipPrazo}
                ${tarefa.leads ? `
                    <span class="text-xs font-semibold tinta-1">${tarefa.leads.nome || tarefa.leads.email}</span>
                ` : ''}
            </div>
        </div>
    `).join('') || '<p class="tinta-3 text-sm text-center py-4">Nenhuma tarefa</p>';
}

async function concluirTarefa(tarefaId) {
    try {
        const { error } = await supabaseClient
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

        const { error } = await supabaseClient
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
        const { error } = await supabaseClient
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
            lead_id: leadId
        };

        const { error } = await supabaseClient
            .from('tarefas')
            .insert([novaTarefaData]);

        if (error) throw error;

        // Se tarefa vinculada a lead, registrar na timeline
        if (leadId) {
            await supabaseClient.from('interacoes').insert([{
                lead_id: leadId,
                tipo: 'tarefa',
                titulo: `📋 Nova Tarefa: ${titulo}`,
                descricao: descricao || `Tarefa agendada para ${new Date(dataVencimentoCompleta).toLocaleDateString('pt-BR')}`
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
// FITA DE OPERAÇÃO
// =========================================
// Faixa sempre presente, em figuras tabulares, que substitui a interrupção
// recorrente do toast. Os ids vivem no index.html; cada escrita é protegida por
// checagem de null para o caso de os ids divergirem — fita ausente não pode
// derrubar a carga de dados.
let ultimaCargaEm = Date.now();

function escreverNaFita(id, texto, modificador = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    // O modificador de cor vive no CSS do index.html e e so reforco: o rotulo
    // da fita ja diz em palavra o que o numero significa.
    el.classList.remove('fita__valor--atencao', 'fita__valor--critico');
    if (modificador) el.classList.add(modificador);
}

function atualizarFitaOperacao() {
    // "Parado" é o mesmo critério do card queimado de sol (14 dias), para a fita
    // e o kanban nunca contarem coisas diferentes.
    const parados = oportunidades.filter(o =>
        calcularDiasInativo(o.data_ultima_atualizacao) >= 14
    ).length;

    const atrasadas = kpis.tarefas_atrasadas ?? 0;

    escreverNaFita('fita-pipeline', formatCurrency(kpis.pipeline_valor));
    escreverNaFita('fita-ativos', String(kpis.oportunidades_ativas ?? oportunidades.length));
    escreverNaFita('fita-parados', String(parados), parados > 0 ? 'fita__valor--atencao' : '');
    escreverNaFita('fita-atrasadas', String(atrasadas), atrasadas > 0 ? 'fita__valor--critico' : '');
    atualizarSyncDaFita();
}

function atualizarSyncDaFita() {
    const seg = Math.max(0, Math.floor((Date.now() - ultimaCargaEm) / 1000));
    const mm = String(Math.floor(seg / 60)).padStart(2, '0');
    const ss = String(seg % 60).padStart(2, '0');
    escreverNaFita('fita-sync', `${mm}:${ss}`);
}

// Quando o refresh chega, uma régua varre a fita. Avisa sem roubar o foco, que
// era o pecado do toast de 30 em 30 segundos.
function varrerFita() {
    const fita = document.getElementById('fita') || document.querySelector('.fita');
    if (!fita) return;
    fita.classList.remove('fita-varrendo');
    void fita.offsetWidth; // reinicia a animação quando dois refreshes se encostam
    fita.classList.add('fita-varrendo');
    setTimeout(() => fita.classList.remove('fita-varrendo'), 1200);
}

// =========================================
// UTILITÁRIOS
// =========================================
// Régua do lead score. Antes era barra de 64px sempre verde: 8 e 95 saiam
// iguais e o limiar de qualificação era invisível. Agora 120px com tique de 1px
// cravado nos 50 pontos, faixa por PALAVRA (matiz não carrega sozinha) e
// denominador explícito, porque "42" sem o /100 não decide nada.
function reguaScore(score) {
    const valor = Math.max(0, Math.min(100, Number(score) || 0));
    const faixa = valor >= 75 ? 'QUENTE' : valor >= 50 ? 'MORNO' : 'FRIO';

    return `
        <span class="regua" title="Lead score ${valor} de 100 — ${faixa}">
            <span class="regua-trilha">
                <span class="regua-preenche" style="width: ${valor}%"></span>
                <span class="regua-tique" title="Limiar de qualificação: 50"></span>
            </span>
            <span class="num regua-valor">${valor}/100</span>
            <span class="regua-faixa">${faixa}</span>
        </span>`;
}

// Escreve um número em elemento que vive no index.html garantindo a figura
// tabular. Protegido por null: id ausente não pode derrubar a renderização.
function marcarComoNumero(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('num');
    el.textContent = valor;
}

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

// Status sempre com ícone + palavra: a cor do badge é reforço. O sufixo sai
// desta tabela em vez de vir de interpolação solta — badge-blue, por exemplo,
// nunca existiu no CSS e saia sem estilo nenhum.
const ESTADOS_STATUS = {
    novo:            { cor: 'info',    icone: 'fa-circle-dot' },
    qualificado:     { cor: 'success', icone: 'fa-circle-check' },
    nao_qualificado: { cor: 'danger',  icone: 'fa-circle-xmark' },
    em_nutricao:     { cor: 'warning', icone: 'fa-seedling' },
    convertido:      { cor: 'success', icone: 'fa-handshake' },
    perdido:         { cor: 'danger',  icone: 'fa-circle-xmark' },
    instalado:       { cor: 'success', icone: 'fa-solar-panel' },
    rascunho:        { cor: 'gray',    icone: 'fa-pen' },
    enviada:         { cor: 'info',    icone: 'fa-paper-plane' },
    visualizada:     { cor: 'warning', icone: 'fa-eye' },
    aceita:          { cor: 'success', icone: 'fa-circle-check' },
    recusada:        { cor: 'danger',  icone: 'fa-circle-xmark' },
    revisao:         { cor: 'info',    icone: 'fa-rotate' }
};

function badgeStatus(status) {
    const estado = ESTADOS_STATUS[status] || { cor: 'gray', icone: 'fa-circle-question' };
    return `<span class="badge badge-${estado.cor}"><i class="fas ${estado.icone}"></i> ${formatStatus(status)}</span>`;
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

// Só erro e ação do usuário chegam aqui: informação recorrente vive na fita.
// As classes saem do CSS próprio em vez de bg-${colors[type]}-500 montado por
// interpolação — classe assim só existe se o Tailwind compilado a tiver.
function showNotification(message, type = 'info') {
    const estados = {
        success: { icone: 'fa-circle-check', palavra: 'Feito' },
        danger: { icone: 'fa-circle-exclamation', palavra: 'Erro' },
        warning: { icone: 'fa-triangle-exclamation', palavra: 'Atenção' },
        info: { icone: 'fa-circle-info', palavra: 'Aviso' }
    };
    const tipo = estados[type] ? type : 'info';
    const estado = estados[tipo];

    const notification = document.createElement('div');
    notification.className = `toast toast-${tipo} fade-in`;

    // Ícone + palavra: a cor da borda é reforço, nunca o único canal.
    const icone = document.createElement('i');
    icone.className = `fas ${estado.icone}`;
    const rotulo = document.createElement('strong');
    rotulo.textContent = estado.palavra;
    // textContent porque a mensagem carrega error.message e nome de lead.
    const texto = document.createElement('span');
    texto.className = 'toast-texto';
    texto.textContent = message;

    notification.appendChild(icone);
    notification.appendChild(rotulo);
    notification.appendChild(texto);

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

    configurarOrdenacao();
}

// =========================================
// ORDENAÇÃO DAS TABELAS DENSAS
// =========================================
// Os <th data-ordenavel> do index.html mostram a seta e esperam o aria-sort
// daqui: sem este bloco a afordancia existiria e nao faria nada. Ordena sempre
// uma COPIA, porque a ordem dos arrays globais e usada por kanban, fita e KPIs.
const ordemTabela = {
    leads: { chave: null, dir: 1 },
    instalados: { chave: null, dir: 1 }
};

const CHAVES_ORDENACAO = {
    consumo: lead => parseFloat(lead.consumo_mensal) || 0,
    score: lead => parseFloat(lead.lead_score) || 0,
    valor: cliente => parseFloat(cliente.valor_final_negociado) || 0
};

function ordenarLista(lista, tabela) {
    const { chave, dir } = ordemTabela[tabela];
    const extrai = CHAVES_ORDENACAO[chave];
    if (!extrai) return lista;
    return [...lista].sort((a, b) => (extrai(a) - extrai(b)) * dir);
}

function filtroDeLeadsAtivo() {
    return ['lead-search', 'lead-status-filter', 'lead-type-filter']
        .some(id => (document.getElementById(id)?.value || '') !== '');
}

function configurarOrdenacao() {
    document.querySelectorAll('.tabela th[data-ordenavel]').forEach(th => {
        if (th.dataset.ordenacaoLigada) return;
        th.dataset.ordenacaoLigada = '1';

        th.addEventListener('click', () => {
            const tabela = th.closest('table')?.id === 'tabela-instalados' ? 'instalados' : 'leads';
            const estado = ordemTabela[tabela];
            const chave = th.dataset.ordenavel;

            estado.dir = (estado.chave === chave && estado.dir === 1) ? -1 : 1;
            estado.chave = chave;

            // aria-sort e o estado que o CSS do index.html le para virar a seta.
            th.closest('tr').querySelectorAll('th[data-ordenavel]')
                .forEach(outro => outro.removeAttribute('aria-sort'));
            th.setAttribute('aria-sort', estado.dir === 1 ? 'ascending' : 'descending');

            if (tabela === 'instalados') {
                renderInstalados();
            } else if (filtroDeLeadsAtivo()) {
                filterLeads();
            } else {
                renderLeadsTable();
            }
        });
    });
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

    tbody.innerHTML = ordenarLista(filteredLeads, 'leads').map(lead => `
        <tr class="linha cursor-pointer" onclick="openLeadModal('${lead.id}')">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="avatar-marca w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3">
                        ${(lead.nome || lead.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-semibold tinta-1">${lead.nome || 'Sem nome'}</p>
                        <p class="text-sm tinta-2">${lead.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${lead.tipo_cliente === 'empresarial' ? 'info' : 'gray'}">
                    ${lead.tipo_cliente === 'empresarial' ? 'Empresarial' : 'Residencial'}
                </span>
            </td>
            <td class="px-6 py-4 num num-dir tinta-1">${lead.consumo_mensal || 0} kWh</td>
            <td class="px-6 py-4">${reguaScore(lead.lead_score)}</td>
            <td class="px-6 py-4">
                ${badgeStatus(lead.status)}
            </td>
            <td class="px-6 py-4 text-sm tinta-2">
                ${lead.users ? lead.users.nome : 'Não atribuído'}
            </td>
            <td class="px-6 py-4">
                <button onclick="event.stopPropagation(); openLeadModal('${lead.id}')" class="botao-acao mr-2">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center py-8 tinta-3">Nenhum lead encontrado</td></tr>';
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

        const { error } = await supabaseClient
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
        const { error } = await supabaseClient
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
    // Antes isto so trocava a URL e deixava a sessao do Supabase viva no
    // localStorage: quem abrisse o CRM de novo entrava sem senha.
    handleLogout();
}

// =========================================
// SISTEMA DE NOTIFICAÇÕES
// =========================================

async function loadNotificacoes() {
    try {
        const { data, error } = await supabaseClient
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
        badge.classList.add('num');
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
            <div class="p-8 text-center tinta-3">
                <i class="fas fa-bell-slash text-4xl mb-2"></i>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notificacoes.map(notif => {
        const icone = {
            'auto_nutricao': 'fa-seedling cor-atencao',
            'auto_perdido': 'fa-times-circle cor-critico',
            'alerta_inatividade': 'fa-clock cor-atencao',
            'retomar_contato': 'fa-phone cor-info'
        }[notif.tipo] || 'fa-bell tinta-2';

        return `
            <div class="p-4 linha transition ${!notif.lida ? 'sup-recuo' : ''}" onclick="marcarComoLida('${notif.id}')">
                <div class="flex items-start gap-3">
                    <div class="icone-tipo flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                        <i class="fas ${icone}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                            <h4 class="font-semibold text-sm tinta-1">${notif.titulo}</h4>
                            ${!notif.lida ? '<span class="chip chip-info flex-shrink-0"><i class="fas fa-circle-dot"></i> Nova</span>' : ''}
                        </div>
                        <p class="text-sm tinta-2 mt-1">${notif.mensagem}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs tinta-3">
                                <i class="fas fa-clock"></i>
                                ${formatarDataRelativa(notif.created_at)}
                            </span>
                            ${notif.acao_sugerida === 'reverter' ? `
                                <button onclick="event.stopPropagation(); abrirReversao('${notif.id}')" class="text-xs botao-acao font-semibold">
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
        const { error } = await supabaseClient
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

        const { error } = await supabaseClient
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
        const { data: historico, error: histError } = await supabaseClient
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
        const { data, error } = await supabaseClient.rpc('reverter_mudanca_automatica', {
            p_historico_id: historico.id,
            p_user_id: null // TODO: pegar user_id do usuário logado
        });

        if (error) throw error;

        showNotification('Ação revertida com sucesso!', 'success');

        // Marcar notificação como respondida
        await supabaseClient
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
    // Mesma armadilha do showTab: o alvo e o botao, nunca um filho dele.
    (event?.currentTarget || event?.target)?.classList.add('active');

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

        // Atualizar contador. A figura tabular entra por classList porque o
        // elemento vive no index.html e so recebe textContent, sem filhos.
        if (countBadge) {
            countBadge.classList.add('num');
            countBadge.textContent = oportunidadesEtapa.length;
        }

        // Valor somado da raia: o vendedor decide por dinheiro parado na coluna,
        // nao por quantidade de cartoes. Escreve so se o cabecalho da coluna
        // tiver o elemento, porque esse markup e do index.html.
        const somaRaia = document.querySelector(`.kanban-column[data-etapa="${etapa}"] .kanban-soma`);
        if (somaRaia) {
            somaRaia.classList.add('num');
            somaRaia.textContent = formatCurrency(
                oportunidadesEtapa.reduce((t, o) => t + (parseFloat(o.valor_estimado) || 0), 0)
            );
        }

        container.innerHTML = oportunidadesEtapa.map(oportunidade => {
            const lead = oportunidade.leads;
            const diasInativo = calcularDiasInativo(oportunidade.data_ultima_atualizacao);
            // Tres degraus em vez de um binario: 15 dias deixa de ser identico a
            // 120. O banho quente do CSS le este atributo; a opacidade saiu de
            // cena, porque apagar o card que mais precisa de toque custa negocio.
            const faixaDias = diasInativo >= 60 ? '60'
                : diasInativo >= 30 ? '30'
                : diasInativo >= 14 ? '14' : '';

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

            // Verificar se há instalação agendada (buscar no array instalados)
            const instalacao = instalados.find(inst => inst.oportunidade_id === oportunidade.id);
            const temInstalacaoAgendada = instalacao?.data_agendamento_instalacao;

            // Status por ícone + palavra. Antes era um ponto colorido com a
            // primeira letra ("P"), que some para quem não distingue matiz — e
            // "perdido" (tijolo) dividia o mesmo vermelho de "parado" (âmbar).
            let statusChip = '';

            if (temInstalacaoAgendada) {
                statusChip = chipStatus('chip-info', 'fa-trophy', 'Agendada');
            } else if (lead?.status === 'perdido') {
                statusChip = chipStatus('chip-perdido', 'fa-circle-xmark', 'Perdido');
            } else if (lead?.status === 'qualificado') {
                statusChip = chipStatus('chip-ok', 'fa-circle-check', 'Qualificado');
            } else if (lead?.status === 'em_nutricao') {
                statusChip = chipStatus('chip-parado', 'fa-seedling', 'Nutrição');
            }

            return `
                <div class="kanban-card"${faixaDias ? ` data-dias-faixa="${faixaDias}"` : ''} data-id="${oportunidade.id}" onclick="openLeadModal('${oportunidade.lead_id}')">
                    <!-- Cabeçalho com nome e estrela de favorito -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1 min-w-0 kanban-card-titulo">
                            <h4 class="font-semibold tinta-1 text-sm">${lead?.nome || lead?.email || 'Lead sem nome'}</h4>
                            <p class="text-xs tinta-3 mt-0.5">
                                <i class="fas fa-clock"></i> <span class="num">${dataFormatada} ${horaFormatada}</span>
                            </p>
                        </div>
                        <div class="flex items-center gap-2 kanban-card-acoes">
                            ${statusChip}
                            <button onclick="event.stopPropagation(); toggleFavorito('${oportunidade.id}')" class="transition-transform hover:scale-110" title="${oportunidade.favorito ? 'Remover dos favoritos' : 'Marcar como favorito'}">
                                <i class="fas fa-star text-lg ${oportunidade.favorito ? 'cor-marca-700' : 'tinta-3'}"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Valor e consumo: numero que vira decisao, em figura tabular -->
                    <div class="flex items-center justify-between mb-2 kanban-card-valor">
                        <span class="num text-sm font-bold tinta-1">${formatCurrency(oportunidade.valor_estimado)}</span>
                        <span class="text-xs tinta-2">
                            <i class="fas fa-bolt"></i> <span class="num">${lead?.consumo_mensal || 0}</span> kWh
                        </span>
                    </div>

                    <!-- Ícones de estatísticas: contagem zero fica legível, não apagada -->
                    <div class="flex items-center justify-between pt-2 fio-topo">
                        <!-- Email -->
                        <div class="flex items-center gap-1" title="${stats.emails} email(s) enviado(s)">
                            <i class="fas fa-envelope text-xs ${stats.emails > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.emails > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.emails}</span>
                        </div>

                        <!-- Chamadas -->
                        <div class="flex items-center gap-1" title="${stats.chamadas} ligaç(ões) realizada(s)">
                            <i class="fas fa-phone text-xs ${stats.chamadas > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.chamadas > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.chamadas}</span>
                        </div>

                        <!-- Propostas -->
                        <div class="flex items-center gap-1" title="${stats.propostas} proposta(s) criada(s)">
                            <i class="fas fa-file-invoice-dollar text-xs ${stats.propostas > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.propostas > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.propostas}</span>
                        </div>

                        <!-- Instalações -->
                        <div class="flex items-center gap-1" title="${stats.instalacoes} instalação(ões) concluída(s)">
                            <i class="fas fa-solar-panel text-xs ${stats.instalacoes > 0 ? 'tinta-1' : 'tinta-3'}"></i>
                            <span class="num text-xs ${stats.instalacoes > 0 ? 'tinta-1 font-semibold' : 'tinta-3'}">${stats.instalacoes}</span>
                        </div>

                        <!-- Badge tipo cliente -->
                        <span class="badge badge-${lead?.tipo_cliente === 'empresarial' ? 'info' : 'gray'} text-xs">
                            ${lead?.tipo_cliente === 'empresarial' ? 'EMP' : 'RES'}
                        </span>
                    </div>

                    ${faixaDias ? `
                        <p class="mt-2">
                            <span class="chip chip-parado">
                                <i class="fas fa-hourglass-half"></i>
                                <span class="num">${diasInativo}</span> dias sem contato
                            </span>
                        </p>
                    ` : ''}
                </div>
            `;
        }).join('') || '<p class="tinta-3 text-sm text-center py-4">Nenhuma oportunidade</p>';
    });
}

// =========================================
// RASTREAMENTO DE PROPOSTA
// =========================================
async function trackProposta(token) {
    try {
        const { data, error } = await supabaseClient
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
            await supabaseClient
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
            <div class="sup-card fio rounded-lg p-6" ${index === 0 ? 'data-recomendado="1"' : ''}>
                ${index === 0 ? chipStatus('chip-ok', 'fa-circle-check', 'Recomendado') : ''}

                <h4 class="text-lg font-bold tinta-1 mb-2 mt-2">${placa.fabricante}</h4>
                <p class="text-sm tinta-2 mb-4">${placa.modelo}</p>

                <!-- Sistema -->
                <div class="sup-recuo rounded-lg p-4 mb-4">
                    <h5 class="font-bold text-sm mb-2">📦 Sistema</h5>
                    <div class="text-sm space-y-1">
                        <div class="flex justify-between">
                            <span class="tinta-2">Placas <span class="num">${placa.potencia}</span>Wp:</span>
                            <span class="num font-semibold tinta-1">${numModulos} unidades</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="tinta-2">Potência Total:</span>
                            <span class="num font-semibold tinta-1">${potenciaRealKwp} kWp</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="tinta-2">Área Necessária:</span>
                            <span class="num font-semibold tinta-1">${area.toFixed(1)} m²</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Inversor:</span>
                            <span class="font-semibold text-xs">${inversor.fabricante} ${inversor.potencia_kw}kW</span>
                        </div>
                    </div>
                </div>

                <!-- Economia -->
                <div class="secao-recuada p-4 mb-4">
                    <h5 class="font-bold text-sm mb-2 cor-ok">💰 Economia & Retorno</h5>
                    <div class="text-sm space-y-1">
                        <div class="flex justify-between">
                            <span class="tinta-2">Por mês:</span>
                            <span class="num font-bold cor-ok">${formatCurrency(economia.economiaMensal)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="tinta-2">Por ano:</span>
                            <span class="num font-bold cor-ok">${formatCurrency(economia.economiaAnual)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="tinta-2">Em 25 anos:</span>
                            <span class="num font-bold cor-ok">${formatCurrency(economia.economia25Anos)}</span>
                        </div>
                        <div class="fio-topo pt-2 mt-2 space-y-1">
                            <div class="flex justify-between">
                                <span class="font-bold tinta-1">Payback:</span>
                                <span class="num font-bold tinta-1">${paybackAnos} anos</span>
                            </div>
                            ${tir > 0 ? `<div class="flex justify-between">
                                <span class="text-xs tinta-2">TIR:</span>
                                <span class="num font-semibold text-xs tinta-1">${tir}% a.a.</span>
                            </div>` : ''}
                            ${vpl !== 0 ? `<div class="flex justify-between">
                                <span class="text-xs tinta-2">VPL:</span>
                                <span class="num font-semibold text-xs tinta-1">${formatCurrency(vpl)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Valores -->
                <div class="fio-topo pt-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm tinta-2">Custo Total:</span>
                        <span class="num text-sm line-through tinta-2">${formatCurrency(custos.custoTotal)}</span>
                    </div>
                    <div class="flex items-baseline justify-between mb-3">
                        <span class="font-bold tinta-1">Valor Final:</span>
                        <span class="num-display">${formatCurrency(custos.valorVenda)}</span>
                    </div>
                    <button onclick="verMemoriaCalculo(${index})" class="w-full botao-secundario py-2 text-sm mb-2">
                        <i class="fas fa-file-invoice mr-2"></i>Ver Memória de Cálculo
                    </button>
                    <button onclick="gerarPropostaComercial(${index})" class="botao-primario w-full py-2 text-sm">
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
            const { data: oportunidade, error: oppError } = await supabaseClient
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

            const dadosProposta = {
                oportunidade_id: oportunidade.id,
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
            const { data: propostaSalva, error } = await supabaseClient
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

        await supabaseClient
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
    const { data: documentos } = await supabaseClient
        .from('documentos')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="space-y-6">
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Upload de Documentos</h3>
                </div>
                <p class="text-sm tinta-2 mb-4">Faça upload de fotos do telhado, conta de luz, documentos do imóvel, etc.</p>

                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium tinta-1 mb-2">Tipo de Documento</label>
                        <select id="tipo-documento" class="campo w-full">
                            <option value="foto_telhado">Foto do Telhado</option>
                            <option value="foto_estrutura">Foto da Estrutura</option>
                            <option value="conta_luz">Conta de Luz</option>
                            <option value="documento_imovel">Documento do Imóvel</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium tinta-1 mb-2">Arquivo</label>
                        <input type="file" id="arquivo-upload" accept="image/*,.pdf"
                               class="campo w-full">
                    </div>
                    <div>
                        <label class="block text-sm font-medium tinta-1 mb-2">Observações</label>
                        <textarea id="obs-documento" rows="2"
                                  class="campo w-full"
                                  placeholder="Informações adicionais sobre o documento..."></textarea>
                    </div>
                    <button onclick="uploadDocumento('${leadId}')"
                            class="w-full botao-primario px-6 py-3">
                        <i class="fas fa-upload mr-2"></i>Fazer Upload
                    </button>
                </div>
            </div>

            <!-- Lista de Documentos -->
            <div>
                <h4 class="font-bold tinta-1 mb-3">Documentos Enviados</h4>
                <div class="space-y-2">
                    ${(documentos || []).map(doc => `
                        <div class="sup-card fio rounded p-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-file-${doc.mime_type?.includes('pdf') ? 'pdf' : 'image'} text-2xl tinta-2"></i>
                                <div>
                                    <p class="font-semibold">${doc.nome_arquivo}</p>
                                    <p class="text-sm tinta-3">${formatTipo(doc.tipo)} • ${formatDate(doc.created_at)}</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <a href="${doc.url_arquivo}" target="_blank"
                                   class="botao-acao px-3 py-1 rounded fio">
                                    <i class="fas fa-eye"></i>
                                </a>
                                <button onclick="deletarDocumento('${doc.id}', '${leadId}')"
                                        class="botao-acao botao-acao-perigo px-3 py-1 rounded fio">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('') || '<p class="tinta-3 text-center py-8">Nenhum documento enviado ainda</p>'}
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
        const { error } = await supabaseClient
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
        await supabaseClient.from('interacoes').insert([{
            lead_id: leadId,
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
        const { error } = await supabaseClient
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
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-3 mb-4">
                    <svg class="w-8 h-8 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-xl font-bold tinta-1">Etapa de Simulação</h3>
                </div>
                <p class="tinta-1 leading-relaxed mb-4">
                    Agora você pode gerar o <strong>projeto completo do sistema solar fotovoltaico</strong>
                    para este cliente. O sistema irá calcular automaticamente:
                </p>
                <ul class="space-y-2 tinta-1 ml-6">
                    <li class="flex items-start gap-2">
                        <svg class="w-5 h-5 cor-ok mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span><strong>Dimensionamento do sistema</strong> - Número de módulos, potência total e inversor adequado</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <svg class="w-5 h-5 cor-ok mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span><strong>Memória de cálculo técnica</strong> - Geração estimada, área necessária e análise financeira</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <svg class="w-5 h-5 cor-ok mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span><strong>Proposta comercial</strong> - Documento profissional pronto para apresentar ao cliente</span>
                    </li>
                </ul>
            </div>

            <!-- Botão Calcular -->
            <div class="secao-recuada rounded-lg p-8 text-center">
                <button onclick="abrirSimuladorSolar()"
                        class="botao-primario w-full px-8 py-5 text-lg">
                    <i class="fas fa-solar-panel mr-3"></i>Calcular Sistema Solar
                </button>
                <p class="text-sm tinta-2 mt-4">
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
    const { data: propostas } = await supabaseClient
        .from('propostas')
        .select('*, oportunidades!inner(lead_id)')
        .eq('oportunidades.lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1);

    const proposta = propostas?.[0];

    if (!proposta) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-file-invoice text-6xl tinta-3 mb-4"></i>
                <p class="tinta-2">Nenhuma proposta gerada ainda</p>
                <p class="text-sm tinta-3 mt-2">Gere uma proposta na etapa de Simulação</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Resumo da Proposta -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold tinta-1">
                        <i class="fas fa-file-invoice cor-info mr-2"></i>
                        ${proposta.numero_proposta}
                    </h3>
                    ${badgeStatus(proposta.status)}
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm tinta-2">Potência do Sistema</p>
                        <p class="num-display">${proposta.potencia_total_kwp} kWp</p>
                    </div>
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm tinta-2">Número de Módulos</p>
                        <p class="num-display">${proposta.num_modulos} un</p>
                    </div>
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm tinta-2">Valor Total</p>
                        <p class="num-display">${formatCurrency(proposta.valor_total)}</p>
                    </div>
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm tinta-2">Valor Final</p>
                        <p class="num-display">${formatCurrency(proposta.valor_final)}</p>
                    </div>
                </div>

                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="tinta-2">Tipo Inversor:</span>
                        <span class="font-semibold">${proposta.tipo_inversor || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="tinta-2">Marca Módulos:</span>
                        <span class="font-semibold">${proposta.marca_modulos || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="tinta-2">Economia Mensal Prevista:</span>
                        <span class="num font-semibold cor-ok">${formatCurrency(proposta.economia_mensal_prevista || 0)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="tinta-2">Payback:</span>
                        <span class="num font-semibold tinta-1">${proposta.payback_meses || 0} meses</span>
                    </div>
                </div>

                ${proposta.data_visualizacao ? `
                    <div class="mt-4 p-3 secao-recuada cor-ok rounded">
                        <i class="fas fa-eye mr-2"></i>
                        <strong>Visualizada em:</strong> ${formatDateTime(proposta.data_visualizacao)}
                    </div>
                ` : ''}
            </div>

            <!-- Ações -->
            <div class="space-y-3">
                <button onclick="enviarPropostaPorEmail('${proposta.id}', '${leadId}')"
                        class="botao-info w-full px-6 py-4 text-lg">
                    <i class="fas fa-envelope mr-2"></i>Enviar Proposta por Email
                </button>
                <p class="text-sm tinta-3 text-center">
                    A proposta será enviada para ${currentLead.email}
                </p>

                ${proposta.arquivo_pdf_url ? `
                    <a href="${proposta.arquivo_pdf_url}" target="_blank"
                       class="block w-full botao-secundario text-center px-6 py-3">
                        <i class="fas fa-file-pdf mr-2"></i>Visualizar PDF
                    </a>
                ` : ''}

                <button onclick="copiarLinkProposta('${proposta.token_rastreio}')"
                        class="w-full botao-secundario px-6 py-3">
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
    await supabaseClient.from('interacoes').insert([{
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
    const { data: status } = await supabaseClient
        .from('status_negociacao')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    const st = status || {};

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Status da Proposta -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Status da Proposta</h3>
                </div>

                <div class="space-y-4">
                    <div class="bg-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold tinta-1">Proposta Visualizada</span>
                            <span class="${st.proposta_visualizada ? 'cor-ok' : 'tinta-3'}">
                                <i class="fas fa-${st.proposta_visualizada ? 'check-circle' : 'circle'}"></i>
                                ${st.proposta_visualizada ? 'Sim' : 'Não'}
                            </span>
                        </div>
                        ${st.data_visualizacao ? `
                            <p class="text-sm tinta-3 mt-2">
                                Visualizada em: ${formatDateTime(st.data_visualizacao)}
                            </p>
                        ` : ''}
                    </div>

                    <div class="bg-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold tinta-1">Proposta Aceita</span>
                            <span class="${st.proposta_aceita ? 'cor-ok' : 'tinta-3'}">
                                <i class="fas fa-${st.proposta_aceita ? 'check-circle' : 'circle'}"></i>
                                ${st.proposta_aceita ? 'Sim' : 'Não'}
                            </span>
                        </div>
                        ${st.data_aceite ? `
                            <p class="text-sm tinta-3 mt-2">
                                Aceita em: ${formatDateTime(st.data_aceite)}
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Reunião Agendada -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Agendamento de Reunião</h3>
                </div>

                <div class="space-y-3">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="checkbox-reuniao-agendada"
                               ${st.cliente_agendou_reuniao ? 'checked' : ''}
                               class="w-5 h-5 rounded foco-marca">
                        <span class="font-semibold">Cliente agendou reunião</span>
                    </label>

                    <div>
                        <label class="block text-sm font-medium tinta-1 mb-2">Data e Hora da Reunião</label>
                        <input type="datetime-local" id="data-reuniao"
                               value="${st.data_reuniao_agendada ? new Date(st.data_reuniao_agendada).toISOString().slice(0,16) : ''}"
                               class="campo w-full">
                    </div>

                    <div>
                        <label class="block text-sm font-medium tinta-1 mb-2">Observações sobre a Reunião</label>
                        <textarea id="obs-reuniao" rows="3"
                                  class="campo w-full">${st.observacoes_reuniao || ''}</textarea>
                    </div>

                    <button onclick="salvarStatusNegociacao('${leadId}')"
                            class="botao-primario w-full px-6 py-3">
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
        const { error } = await supabaseClient
            .from('status_negociacao')
            .upsert(statusData, { onConflict: 'lead_id' });

        if (error) throw error;

        // Registrar na timeline
        await supabaseClient.from('interacoes').insert([{
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
    const { data: instalacao } = await supabaseClient
        .from('instalacao')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    const inst = instalacao || {};

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Aprovações Técnicas -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Aprovações Técnicas</h3>
                </div>

                <div class="space-y-4">
                    <!-- ART -->
                    <div class="bg-white rounded-lg p-4">
                        <label class="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" id="checkbox-art"
                                   ${inst.art_aprovada ? 'checked' : ''}
                                   class="w-5 h-5 rounded foco-marca">
                            <span class="font-semibold tinta-1">ART Aprovada</span>
                        </label>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm tinta-2 mb-1">Data da ART</label>
                                <input type="date" id="data-art"
                                       value="${inst.data_art ? inst.data_art.split('T')[0] : ''}"
                                       class="campo w-full text-sm">
                            </div>
                            <div>
                                <label class="block text-sm tinta-2 mb-1">Número da ART</label>
                                <input type="text" id="numero-art"
                                       value="${inst.numero_art || ''}"
                                       placeholder="Ex: 123456789"
                                       class="campo w-full text-sm">
                            </div>
                        </div>
                    </div>

                    <!-- Homologação -->
                    <div class="bg-white rounded-lg p-4">
                        <label class="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" id="checkbox-homologacao"
                                   ${inst.homologacao_aprovada ? 'checked' : ''}
                                   class="w-5 h-5 rounded foco-marca">
                            <span class="font-semibold tinta-1">Homologação com Distribuidora Aprovada</span>
                        </label>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm tinta-2 mb-1">Data da Homologação</label>
                                <input type="date" id="data-homologacao"
                                       value="${inst.data_homologacao ? inst.data_homologacao.split('T')[0] : ''}"
                                       class="campo w-full text-sm">
                            </div>
                            <div>
                                <label class="block text-sm tinta-2 mb-1">Protocolo</label>
                                <input type="text" id="protocolo-homologacao"
                                       value="${inst.protocolo_homologacao || ''}"
                                       placeholder="Ex: PROT-2024-001"
                                       class="campo w-full text-sm">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agendamento de Instalação -->
            <div class="secao-recuada rounded-lg p-6">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-6 h-6 tinta-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="text-lg font-bold tinta-1">Agendamento de Instalação</h3>
                </div>

                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium tinta-1 mb-2">Data da Instalação</label>
                        <input type="date" id="data-instalacao"
                               value="${inst.data_agendamento_instalacao ? inst.data_agendamento_instalacao.split('T')[0] : ''}"
                               class="campo w-full">
                    </div>

                    <div>
                        <label class="block text-sm font-medium tinta-1 mb-2">Observações sobre o Agendamento</label>
                        <textarea id="obs-agendamento" rows="3"
                                  class="campo w-full"
                                  placeholder="Informações importantes sobre a instalação...">${inst.observacoes_agendamento || ''}</textarea>
                    </div>

                    ${inst.cliente_notificado ? `
                        <div class="p-3 secao-recuada cor-ok rounded">
                            <i class="fas fa-check-circle mr-2"></i>
                            <strong>Cliente notificado em:</strong> ${formatDateTime(inst.data_notificacao)}
                        </div>
                    ` : ''}

                    <button onclick="salvarAgendamentoInstalacao('${leadId}')"
                            class="botao-primario w-full px-6 py-4 text-lg">
                        <i class="fas fa-calendar-check mr-2"></i>Salvar Agendamento e Enviar para Cliente
                    </button>
                </div>
            </div>

            <!-- Botão Marcar como Instalado -->
            ${inst.art_aprovada && inst.homologacao_aprovada && inst.data_agendamento_instalacao ? `
                <div class="secao-recuada rounded-lg p-8 text-center">
                    <div class="mb-4">
                        ${chipStatus('chip-ok', 'fa-circle-check', 'Todos os requisitos atendidos')}
                    </div>
                    <button onclick="marcarComoInstalado('${leadId}')"
                            class="botao-ok w-full px-8 py-5 text-lg">
                        <i class="fas fa-check-circle mr-3"></i>Marcar como Instalado
                    </button>
                    <p class="text-sm tinta-2 mt-3">
                        Isso moverá o cliente para a página "Instalados" e removerá do Kanban
                    </p>
                </div>
            ` : `
                <div class="secao-recuada rounded-lg p-6 text-center">
                    <p class="tinta-1 font-semibold mb-3">
                        <i class="fas fa-lock"></i> Marcar como Instalado — indisponível
                    </p>
                    <!-- Antes os tres requisitos apareciam sempre com visto, mesmo
                         pendentes. Cada um agora diz o proprio estado. -->
                    <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
                        ${inst.art_aprovada
                            ? chipStatus('chip-ok', 'fa-circle-check', 'ART aprovada')
                            : chipStatus('chip-parado', 'fa-hourglass-half', 'ART pendente')}
                        ${inst.homologacao_aprovada
                            ? chipStatus('chip-ok', 'fa-circle-check', 'Homologação aprovada')
                            : chipStatus('chip-parado', 'fa-hourglass-half', 'Homologação pendente')}
                        ${inst.data_agendamento_instalacao
                            ? chipStatus('chip-ok', 'fa-circle-check', 'Data definida')
                            : chipStatus('chip-parado', 'fa-hourglass-half', 'Data pendente')}
                    </div>
                    <!-- Desabilitado por borda tracejada + cursor + rotulo: opacidade
                         apagaria o texto e reprovaria contraste. -->
                    <button type="button" disabled
                            class="desabilitado w-full px-8 py-5 text-lg"
                            title="Complete os requisitos acima para liberar">
                        <i class="fas fa-lock mr-3"></i>Marcar como Instalado
                    </button>
                    <p class="text-sm tinta-2 mt-3">
                        Libera quando ART, homologação e data estiverem preenchidas.
                    </p>
                </div>
            `}
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
        const { error } = await supabaseClient
            .from('instalacao')
            .upsert(instalacaoData, { onConflict: 'lead_id' });

        if (error) throw error;

        // Registrar na timeline
        await supabaseClient.from('interacoes').insert([{
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
        const { data: lead, error: leadError } = await supabaseClient
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError) throw leadError;

        // 2. Buscar última proposta aceita
        const { data: propostas, error: propostaError } = await supabaseClient
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
        const { data: instalacao, error: instError } = await supabaseClient
            .from('instalacao')
            .select('*')
            .eq('lead_id', leadId)
            .single();

        if (instError) throw instError;

        // 4. Criar registro em clientes_instalados com TODOS os dados
        const clienteInstaladoData = {
            lead_id: leadId,
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

        const { error: insertError } = await supabaseClient
            .from('clientes_instalados')
            .insert([clienteInstaladoData]);

        if (insertError) throw insertError;

        // 5. NÃO deletar oportunidade - preservar para manter relacionamento com proposta
        // Apenas marcar como concluída para remover do Kanban
        const { data: updateData, error: updateOppError } = await supabaseClient
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
        await supabaseClient
            .from('leads')
            .update({ status: 'instalado' })
            .eq('id', leadId);

        // 7. Registrar na timeline
        await supabaseClient.from('interacoes').insert([{
            lead_id: leadId,
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
