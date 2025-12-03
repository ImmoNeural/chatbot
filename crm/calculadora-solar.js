// =========================================
// CALCULADORA SOLAR - SISTEMA COMPLETO
// Análise de Irradiação, Dimensionamento e Memória de Cálculo
// =========================================

// Base de dados de irradiação solar média por estado (kWh/m²/dia)
// Dados baseados no Atlas Solarimétrico do Brasil - CRESESB
const IRRADIACAO_POR_ESTADO = {
    'AC': 4.50, 'AL': 5.49, 'AP': 4.84, 'AM': 4.53, 'BA': 5.70,
    'CE': 5.75, 'DF': 5.52, 'ES': 5.28, 'GO': 5.52, 'MA': 5.45,
    'MT': 5.58, 'MS': 5.47, 'MG': 5.42, 'PA': 4.92, 'PB': 5.65,
    'PR': 4.94, 'PE': 5.67, 'PI': 5.70, 'RJ': 5.00, 'RN': 5.88,
    'RS': 4.87, 'RO': 4.78, 'RR': 4.67, 'SC': 4.63, 'SP': 5.18,
    'SE': 5.62, 'TO': 5.48
};

// Base de dados de placas solares disponíveis no mercado brasileiro
const PLACAS_SOLARES = [
    {
        id: 1,
        fabricante: 'Canadian Solar',
        modelo: 'HiKu6 Mono PERC CS6W-550MS',
        potencia: 550,
        eficiencia: 21.2,
        preco_custo: 650.00,
        disponivel_brasil: true,
        garantia: 25
    },
    {
        id: 2,
        fabricante: 'Jinko Solar',
        modelo: 'Tiger Neo N-type 78HL4-BDV',
        potencia: 580,
        eficiencia: 22.3,
        preco_custo: 720.00,
        disponivel_brasil: true,
        garantia: 25
    },
    {
        id: 3,
        fabricante: 'Trina Solar',
        modelo: 'Vertex S+ TSM-DE09.08',
        potencia: 440,
        eficiencia: 20.8,
        preco_custo: 520.00,
        disponivel_brasil: true,
        garantia: 25
    },
    {
        id: 4,
        fabricante: 'DAH Solar',
        modelo: 'DHM-72X10/FS',
        potencia: 550,
        eficiencia: 21.0,
        preco_custo: 630.00,
        disponivel_brasil: true,
        garantia: 25
    },
    {
        id: 5,
        fabricante: 'BYD',
        modelo: 'PHK-36-370-1500V',
        potencia: 370,
        eficiencia: 19.1,
        preco_custo: 420.00,
        disponivel_brasil: true,
        garantia: 25
    }
];

// Inversores disponíveis no mercado brasileiro
const INVERSORES = [
    { fabricante: 'Growatt', modelo: 'MID 15KTL3-X', potencia_kw: 15, preco_custo: 6500, eficiencia: 98.5 },
    { fabricante: 'Fronius', modelo: 'Primo 8.2-1', potencia_kw: 8.2, preco_custo: 8200, eficiencia: 98.1 },
    { fabricante: 'Solis', modelo: '10K-5G', potencia_kw: 10, preco_custo: 5800, eficiencia: 98.3 },
    { fabricante: 'Deye', modelo: 'SUN-5K-G05-P', potencia_kw: 5, preco_custo: 3200, eficiencia: 97.8 },
    { fabricante: 'Canadian Solar', modelo: 'CSI-3.3KTL-GS', potencia_kw: 3.3, preco_custo: 2800, eficiencia: 97.5 }
];

// Custos adicionais do projeto
const CUSTOS_INSTALACAO = {
    mao_de_obra_por_kwp: 800.00,        // R$/kWp
    estrutura_fixacao_por_modulo: 120.00, // R$ por placa
    string_box: 450.00,                  // Fixo
    cabeamento_por_kwp: 150.00,          // R$/kWp
    disjuntores_protecao: 380.00,        // Fixo
    projeto_art: 1200.00,                // Fixo
    homologacao_concessionaria: 1500.00  // Fixo
};

// Margens de lucro padrão
const MARGENS_LUCRO = {
    residencial_pequeno: 0.40,   // até 5 kWp - 40%
    residencial_medio: 0.35,     // 5-10 kWp - 35%
    residencial_grande: 0.30,    // acima de 10 kWp - 30%
    empresarial_pequeno: 0.28,   // até 20 kWp - 28%
    empresarial_medio: 0.25,     // 20-50 kWp - 25%
    empresarial_grande: 0.22     // acima de 50 kWp - 22%
};

// =========================================
// FUNÇÕES DE BUSCA DE CEP
// =========================================
async function buscarCEP(cep) {
    try {
        const cepLimpo = cep.replace(/\D/g, '');
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        if (data.erro) {
            return null;
        }

        return {
            cep: data.cep,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
            irradiacao: IRRADIACAO_POR_ESTADO[data.uf] || 5.0
        };
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        return null;
    }
}

// =========================================
// CÁLCULOS DE DIMENSIONAMENTO
// =========================================

/**
 * Calcula a potência necessária do sistema baseado no consumo e % de redução desejada
 * @param {number} consumoMensalKwh - Consumo mensal em kWh
 * @param {number} percentualReducao - % de redução desejada (0-100)
 * @param {number} irradiacao - Irradiação solar média do local (kWh/m²/dia)
 * @returns {object} Dados do dimensionamento
 */
function calcularDimensionamento(consumoMensalKwh, percentualReducao, irradiacao) {
    // Energia que o sistema deve gerar por mês
    const energiaMensalNecessaria = consumoMensalKwh * (percentualReducao / 100);

    // Energia diária necessária
    const energiaDiariaNecessaria = energiaMensalNecessaria / 30;

    // Fator de performance típico (considera perdas)
    const fatorPerformance = 0.80; // 80% (perdas por temperatura, sujeira, cabeamento, etc)

    // Potência do sistema necessária (kWp)
    const potenciaNecessariaKwp = energiaDiariaNecessaria / (irradiacao * fatorPerformance);

    // Horas de sol pleno equivalente
    const horasSolPleno = irradiacao;

    return {
        energiaMensalNecessaria: Math.round(energiaMensalNecessaria),
        energiaDiariaNecessaria: Math.round(energiaDiariaNecessaria * 100) / 100,
        potenciaNecessariaKwp: Math.round(potenciaNecessariaKwp * 100) / 100,
        horasSolPleno: Math.round(horasSolPleno * 100) / 100,
        fatorPerformance: fatorPerformance
    };
}

/**
 * Seleciona a melhor configuração de placas solares
 */
function selecionarMelhorPlaca(potenciaNecessariaKwp, tipoCliente) {
    // Ordenar placas por melhor custo-benefício (eficiência / preço)
    const placasOrdenadas = PLACAS_SOLARES
        .filter(p => p.disponivel_brasil)
        .map(p => ({
            ...p,
            custoWp: p.preco_custo / p.potencia,
            scoreCustoBeneficio: (p.eficiencia / (p.preco_custo / p.potencia))
        }))
        .sort((a, b) => b.scoreCustoBeneficio - a.scoreCustoBeneficio);

    const resultados = [];

    // Testar cada placa
    for (const placa of placasOrdenadas) {
        const potenciaWp = potenciaNecessariaKwp * 1000;
        const numModulos = Math.ceil(potenciaWp / placa.potencia);
        const potenciaRealKwp = (numModulos * placa.potencia) / 1000;

        resultados.push({
            placa: placa,
            numModulos: numModulos,
            potenciaRealKwp: Math.round(potenciaRealKwp * 100) / 100,
            custoTotal: numModulos * placa.preco_custo,
            area: numModulos * 2.0 // ~2m² por placa aproximadamente
        });
    }

    return resultados;
}

/**
 * Seleciona o inversor adequado
 */
function selecionarInversor(potenciaKwp) {
    // Inversor deve ter potência entre 85% e 110% da potência dos painéis
    const potenciaMinima = potenciaKwp * 0.85;
    const potenciaMaxima = potenciaKwp * 1.10;

    const inversoresAdequados = INVERSORES.filter(inv =>
        inv.potencia_kw >= potenciaMinima && inv.potencia_kw <= potenciaMaxima
    );

    if (inversoresAdequados.length === 0) {
        // Se não encontrar, pegar o mais próximo
        return INVERSORES.reduce((prev, curr) =>
            Math.abs(curr.potencia_kw - potenciaKwp) < Math.abs(prev.potencia_kw - potenciaKwp) ? curr : prev
        );
    }

    // Retornar o de melhor custo-benefício
    return inversoresAdequados.sort((a, b) =>
        (b.eficiencia / b.preco_custo) - (a.eficiencia / a.preco_custo)
    )[0];
}

/**
 * Calcula todos os custos do projeto
 */
function calcularCustosProjeto(configuracao, tipoCliente) {
    const { numModulos, potenciaRealKwp, placa } = configuracao;

    // Custos de materiais
    const custoPlacas = numModulos * placa.preco_custo;
    const inversor = selecionarInversor(potenciaRealKwp);
    const custoInversor = inversor.preco_custo;
    const custoEstrutura = numModulos * CUSTOS_INSTALACAO.estrutura_fixacao_por_modulo;
    const custoCabeamento = potenciaRealKwp * CUSTOS_INSTALACAO.cabeamento_por_kwp;
    const custoStringBox = CUSTOS_INSTALACAO.string_box;
    const custoDisjuntores = CUSTOS_INSTALACAO.disjuntores_protecao;

    const custoMateriais = custoPlacas + custoInversor + custoEstrutura +
                          custoCabeamento + custoStringBox + custoDisjuntores;

    // Custos de serviços
    const custoMaoObra = potenciaRealKwp * CUSTOS_INSTALACAO.mao_de_obra_por_kwp;
    const custoProjeto = CUSTOS_INSTALACAO.projeto_art;
    const custoHomologacao = CUSTOS_INSTALACAO.homologacao_concessionaria;

    const custoServicos = custoMaoObra + custoProjeto + custoHomologacao;

    // Custo total
    const custoTotal = custoMateriais + custoServicos;

    // Determinar margem de lucro
    let margemLucro;
    if (tipoCliente === 'residencial') {
        if (potenciaRealKwp <= 5) margemLucro = MARGENS_LUCRO.residencial_pequeno;
        else if (potenciaRealKwp <= 10) margemLucro = MARGENS_LUCRO.residencial_medio;
        else margemLucro = MARGENS_LUCRO.residencial_grande;
    } else {
        if (potenciaRealKwp <= 20) margemLucro = MARGENS_LUCRO.empresarial_pequeno;
        else if (potenciaRealKwp <= 50) margemLucro = MARGENS_LUCRO.empresarial_medio;
        else margemLucro = MARGENS_LUCRO.empresarial_grande;
    }

    const valorVenda = custoTotal / (1 - margemLucro);
    const lucro = valorVenda - custoTotal;

    return {
        materiais: {
            placas: custoPlacas,
            inversor: custoInversor,
            estrutura: custoEstrutura,
            cabeamento: custoCabeamento,
            stringBox: custoStringBox,
            disjuntores: custoDisjuntores,
            total: custoMateriais
        },
        servicos: {
            maoObra: custoMaoObra,
            projeto: custoProjeto,
            homologacao: custoHomologacao,
            total: custoServicos
        },
        inversor: inversor,
        custoTotal: custoTotal,
        margemLucro: margemLucro,
        valorVenda: valorVenda,
        lucro: lucro,
        margemPercentual: (margemLucro * 100).toFixed(1)
    };
}

/**
 * Calcula economia e payback
 */
function calcularEconomia(energiaMensalGerada, tarifaKwh = 0.85) {
    const economiaMensal = energiaMensalGerada * tarifaKwh;
    const economiaAnual = economiaMensal * 12;
    const economia25Anos = economiaAnual * 25; // Vida útil das placas

    return {
        economiaMensal: Math.round(economiaMensal * 100) / 100,
        economiaAnual: Math.round(economiaAnual * 100) / 100,
        economia25Anos: Math.round(economia25Anos * 100) / 100,
        tarifaKwh: tarifaKwh
    };
}

function calcularPayback(valorInvestimento, economiaMensal) {
    const meses = valorInvestimento / economiaMensal;
    const anos = meses / 12;

    return {
        meses: Math.round(meses),
        anos: Math.round(anos * 10) / 10
    };
}

// =========================================
// FUNÇÃO PRINCIPAL - GERAR PROPOSTA COMPLETA
// =========================================
async function gerarPropostaCompleta(dados) {
    const {
        cep,
        consumoMensalKwh,
        percentualReducao,
        tarifaKwh = 0.85,
        tipoCliente = 'residencial'
    } = dados;

    // 1. Buscar localização e irradiação
    const localizacao = await buscarCEP(cep);
    if (!localizacao) {
        throw new Error('CEP inválido');
    }

    // 2. Calcular dimensionamento
    const dimensionamento = calcularDimensionamento(
        consumoMensalKwh,
        percentualReducao,
        localizacao.irradiacao
    );

    // 3. Selecionar melhores placas
    const configuracoes = selecionarMelhorPlaca(
        dimensionamento.potenciaNecessariaKwp,
        tipoCliente
    );

    // Pegar as 3 melhores opções
    const melhorConfiguracoes = configuracoes.slice(0, 3);

    // 4. Calcular custos para cada configuração
    const propostasCompletas = melhorConfiguracoes.map(config => {
        const custos = calcularCustosProjeto(config, tipoCliente);
        const economia = calcularEconomia(dimensionamento.energiaMensalNecessaria, tarifaKwh);
        const payback = calcularPayback(custos.valorVenda, economia.economiaMensal);

        return {
            configuracao: config,
            custos: custos,
            economia: economia,
            payback: payback,
            energiaGerada: dimensionamento.energiaMensalNecessaria
        };
    });

    return {
        localizacao: localizacao,
        dimensionamento: dimensionamento,
        propostas: propostasCompletas,
        dataCalculo: new Date().toISOString()
    };
}

// =========================================
// EXPORTAR FUNÇÕES
// =========================================
if (typeof window !== 'undefined') {
    window.CalculadoraSolar = {
        buscarCEP,
        calcularDimensionamento,
        selecionarMelhorPlaca,
        selecionarInversor,
        calcularCustosProjeto,
        calcularEconomia,
        calcularPayback,
        gerarPropostaCompleta,
        // Exportar dados para uso em interface
        PLACAS_SOLARES,
        INVERSORES,
        IRRADIACAO_POR_ESTADO,
        MARGENS_LUCRO
    };
}
