// =========================================
// CALCULADORA SOLAR COMPLETA - PROFISSIONAL
// Sistema completo de dimensionamento fotovoltaico
// Conforme Manual Completo de Dimensionamento
// =========================================

// =========================================
// 1. BASES DE DADOS
// =========================================

// Irradiação solar média por estado (kWh/m²/dia)
// Fonte: Atlas Solarimétrico do Brasil - CRESESB
const IRRADIACAO_POR_ESTADO = {
    'AC': 4.50, 'AL': 5.49, 'AP': 4.84, 'AM': 4.53, 'BA': 5.70,
    'CE': 5.75, 'DF': 5.52, 'ES': 5.28, 'GO': 5.52, 'MA': 5.45,
    'MT': 5.58, 'MS': 5.47, 'MG': 5.42, 'PA': 4.92, 'PB': 5.65,
    'PR': 4.94, 'PE': 5.67, 'PI': 5.70, 'RJ': 5.00, 'RN': 5.88,
    'RS': 4.87, 'RO': 4.78, 'RR': 4.67, 'SC': 4.63, 'SP': 5.18,
    'SE': 5.62, 'TO': 5.48
};

// Placas solares disponíveis
const PLACAS_SOLARES = [
    {
        id: 1,
        fabricante: 'Canadian Solar',
        modelo: 'HiKu6 Mono PERC CS6W-550MS',
        potencia: 550,
        eficiencia: 21.2,
        preco_custo: 650.00,
        area_m2: 2.27,
        voc: 49.6,
        isc: 14.11,
        vmp: 41.7,
        imp: 13.19,
        garantia: 25
    },
    {
        id: 2,
        fabricante: 'Jinko Solar',
        modelo: 'Tiger Neo N-type 78HL4-BDV',
        potencia: 580,
        eficiencia: 22.3,
        preco_custo: 720.00,
        area_m2: 2.38,
        voc: 51.8,
        isc: 14.35,
        vmp: 43.4,
        imp: 13.36,
        garantia: 25
    },
    {
        id: 3,
        fabricante: 'Trina Solar',
        modelo: 'Vertex S+ TSM-DE09.08',
        potencia: 440,
        eficiencia: 20.8,
        preco_custo: 520.00,
        area_m2: 2.06,
        voc: 49.5,
        isc: 11.53,
        vmp: 41.2,
        imp: 10.68,
        garantia: 25
    },
    {
        id: 4,
        fabricante: 'DAH Solar',
        modelo: 'DHM-72X10/FS',
        potencia: 550,
        eficiencia: 21.0,
        preco_custo: 630.00,
        area_m2: 2.27,
        voc: 49.8,
        isc: 14.05,
        vmp: 41.9,
        imp: 13.13,
        garantia: 25
    },
    {
        id: 5,
        fabricante: 'BYD',
        modelo: 'PHK-36-370-1500V',
        potencia: 370,
        eficiencia: 19.1,
        preco_custo: 420.00,
        area_m2: 1.95,
        voc: 48.2,
        isc: 9.89,
        vmp: 40.1,
        imp: 9.23,
        garantia: 25
    }
];

// Inversores disponíveis
const INVERSORES = [
    { fabricante: 'Growatt', modelo: 'MID 15KTL3-X', potencia_kw: 15, preco_custo: 6500, eficiencia: 98.5, corrente_max_ac: 23.9 },
    { fabricante: 'Fronius', modelo: 'Primo 8.2-1', potencia_kw: 8.2, preco_custo: 8200, eficiencia: 98.1, corrente_max_ac: 13.1 },
    { fabricante: 'Solis', modelo: '10K-5G', potencia_kw: 10, preco_custo: 5800, eficiencia: 98.3, corrente_max_ac: 16.0 },
    { fabricante: 'Deye', modelo: 'SUN-5K-G05-P', potencia_kw: 5, preco_custo: 3200, eficiencia: 97.8, corrente_max_ac: 8.0 },
    { fabricante: 'Canadian Solar', modelo: 'CSI-3.3KTL-GS', potencia_kw: 3.3, preco_custo: 2800, eficiencia: 97.5, corrente_max_ac: 5.3 }
];

// =========================================
// 2. FATORES DE PERDAS E CORREÇÕES
// =========================================

// Perdas detalhadas do sistema (%)
const PERDAS_SISTEMA = {
    temperatura: 0.08,        // 8% - perda por aquecimento dos módulos
    inversor: 0.03,          // 3% - eficiência do inversor
    cabeamento: 0.015,       // 1.5% - perdas nos cabos
    sombreamento: 0.02,      // 2% - sombreamento parcial
    poeira: 0.02,            // 2% - acúmulo de sujeira
    mismatch: 0.015,         // 1.5% - descasamento entre módulos
    degradacao_anual: 0.005  // 0.5% ao ano - degradação dos módulos
};

// Tabela de correção por inclinação (perda % conforme desvio da inclinação ideal)
const CORRECAO_INCLINACAO = {
    0: 0.96,   // Horizontal
    5: 0.98,
    10: 0.99,
    15: 1.00,  // Ideal para maioria do Brasil
    20: 1.00,
    25: 0.99,
    30: 0.98,
    35: 0.96,
    40: 0.94,
    45: 0.92,
    90: 0.70   // Vertical
};

// Tabela de correção por azimute (0° = Norte, ±90° = Leste/Oeste, 180° = Sul)
const CORRECAO_AZIMUTE = {
    0: 1.00,    // Norte (ideal)
    15: 0.99,
    30: 0.97,
    45: 0.94,
    60: 0.90,
    75: 0.85,
    90: 0.79,   // Leste/Oeste
    105: 0.73,
    120: 0.66,
    135: 0.59,
    150: 0.52,
    165: 0.47,
    180: 0.45   // Sul (pior caso)
};

// =========================================
// 3. CUSTOS DO PROJETO
// =========================================

const CUSTOS_MATERIAIS = {
    estrutura_fixacao_por_modulo: 120.00,
    string_box: 450.00,
    disjuntor_ac_por_kw: 45.00,
    disjuntor_dc_por_string: 85.00,
    spd_ac: 280.00,
    spd_dc: 320.00,
    seccionador_ac: 180.00,
    seccionador_dc: 220.00,
    conectores_mc4_par: 15.00,
    cabo_solar_6mm_metro: 8.50,    // Cabo DC
    cabo_flexivel_4mm_metro: 6.20,  // Cabo AC
    caixa_juncao: 120.00,
    eletrodutos_por_metro: 12.00
};

const CUSTOS_SERVICOS = {
    mao_de_obra_por_kwp: 800.00,
    projeto_eletrico: 800.00,
    art_crea: 450.00,
    homologacao_concessionaria: 1500.00,
    deslocamento: 300.00,
    ferramentas_epi: 200.00
};

// Margens de lucro por segmento
const MARGENS_LUCRO = {
    residencial_pequeno: 0.40,   // até 5 kWp
    residencial_medio: 0.35,     // 5-10 kWp
    residencial_grande: 0.30,    // > 10 kWp
    empresarial_pequeno: 0.28,   // até 20 kWp
    empresarial_medio: 0.25,     // 20-50 kWp
    empresarial_grande: 0.22     // > 50 kWp
};

// =========================================
// 4. FUNÇÕES DE BUSCA DE LOCALIZAÇÃO
// =========================================

async function buscarCEP(cep) {
    try {
        const cepLimpo = cep.replace(/\D/g, '');
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        if (data.erro) return null;

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
// 5. CÁLCULOS DE CORREÇÃO E PERDAS
// =========================================

/**
 * Calcula fator de correção por inclinação
 */
function calcularCorrecaoInclinacao(inclinacao) {
    // Interpolar entre valores da tabela
    const inclinacoes = Object.keys(CORRECAO_INCLINACAO).map(Number).sort((a, b) => a - b);

    for (let i = 0; i < inclinacoes.length - 1; i++) {
        if (inclinacao >= inclinacoes[i] && inclinacao <= inclinacoes[i + 1]) {
            const inc1 = inclinacoes[i];
            const inc2 = inclinacoes[i + 1];
            const fator1 = CORRECAO_INCLINACAO[inc1];
            const fator2 = CORRECAO_INCLINACAO[inc2];

            // Interpolação linear
            return fator1 + (fator2 - fator1) * (inclinacao - inc1) / (inc2 - inc1);
        }
    }

    return CORRECAO_INCLINACAO[15]; // Default: inclinação ideal
}

/**
 * Calcula fator de correção por azimute
 */
function calcularCorrecaoAzimute(azimute) {
    const azimutAbs = Math.abs(azimute);
    const azimutes = Object.keys(CORRECAO_AZIMUTE).map(Number).sort((a, b) => a - b);

    for (let i = 0; i < azimutes.length - 1; i++) {
        if (azimutAbs >= azimutes[i] && azimutAbs <= azimutes[i + 1]) {
            const az1 = azimutes[i];
            const az2 = azimutes[i + 1];
            const fator1 = CORRECAO_AZIMUTE[az1];
            const fator2 = CORRECAO_AZIMUTE[az2];

            return fator1 + (fator2 - fator1) * (azimutAbs - az1) / (az2 - az1);
        }
    }

    return CORRECAO_AZIMUTE[0]; // Default: norte
}

/**
 * Calcula rendimento total do sistema considerando todas as perdas
 */
function calcularRendimentoSistema(perdas = PERDAS_SISTEMA) {
    let rendimento = 1.0;

    rendimento *= (1 - perdas.temperatura);
    rendimento *= (1 - perdas.inversor);
    rendimento *= (1 - perdas.cabeamento);
    rendimento *= (1 - perdas.sombreamento);
    rendimento *= (1 - perdas.poeira);
    rendimento *= (1 - perdas.mismatch);

    return rendimento;
}

// =========================================
// 6. DIMENSIONAMENTO DO SISTEMA
// =========================================

/**
 * Calcula dimensionamento completo do sistema
 */
function calcularDimensionamento(dados) {
    const {
        consumoMensalKwh,
        percentualReducao,
        irradiacao,
        inclinacao = 15,
        azimute = 0,
        perdas = PERDAS_SISTEMA
    } = dados;

    // Energia necessária
    const energiaMensalNecessaria = consumoMensalKwh * (percentualReducao / 100);
    const energiaAnualNecessaria = energiaMensalNecessaria * 12;

    // Fatores de correção
    const fatorInclinacao = calcularCorrecaoInclinacao(inclinacao);
    const fatorAzimute = calcularCorrecaoAzimute(azimute);
    const rendimentoSistema = calcularRendimentoSistema(perdas);

    // HSP anual (horas de sol pleno)
    const hspDiario = irradiacao;
    const hspAnual = hspDiario * 365;

    // Fator de performance total
    const fatorPerformance = rendimentoSistema * fatorInclinacao * fatorAzimute;

    // Potência necessária (kWp)
    const potenciaNecessariaKwp = energiaAnualNecessaria / (hspAnual * fatorPerformance);

    return {
        energiaMensalNecessaria: Math.round(energiaMensalNecessaria),
        energiaAnualNecessaria: Math.round(energiaAnualNecessaria),
        potenciaNecessariaKwp: Math.round(potenciaNecessariaKwp * 100) / 100,
        hspDiario: Math.round(hspDiario * 100) / 100,
        hspAnual: Math.round(hspAnual),
        fatorInclinacao: Math.round(fatorInclinacao * 1000) / 1000,
        fatorAzimute: Math.round(fatorAzimute * 1000) / 1000,
        rendimentoSistema: Math.round(rendimentoSistema * 1000) / 1000,
        fatorPerformance: Math.round(fatorPerformance * 1000) / 1000,
        perdas: {
            temperatura: Math.round(perdas.temperatura * 100 * 10) / 10,
            inversor: Math.round(perdas.inversor * 100 * 10) / 10,
            cabeamento: Math.round(perdas.cabeamento * 100 * 10) / 10,
            sombreamento: Math.round(perdas.sombreamento * 100 * 10) / 10,
            poeira: Math.round(perdas.poeira * 100 * 10) / 10,
            mismatch: Math.round(perdas.mismatch * 100 * 10) / 10
        }
    };
}

/**
 * Seleciona configurações de placas
 */
function selecionarMelhoresPlacas(potenciaNecessariaKwp) {
    const resultados = PLACAS_SOLARES.map(placa => {
        const numModulos = Math.ceil(potenciaNecessariaKwp * 1000 / placa.potencia);
        const potenciaRealKwp = (numModulos * placa.potencia) / 1000;
        const area = numModulos * placa.area_m2;

        return {
            placa,
            numModulos,
            potenciaRealKwp: Math.round(potenciaRealKwp * 100) / 100,
            area: Math.round(area * 10) / 10,
            custoTotal: numModulos * placa.preco_custo,
            scoreCustoBeneficio: placa.eficiencia / (placa.preco_custo / placa.potencia)
        };
    });

    return resultados.sort((a, b) => b.scoreCustoBeneficio - a.scoreCustoBeneficio).slice(0, 3);
}

/**
 * Seleciona inversor adequado
 */
function selecionarInversor(potenciaKwp) {
    const potenciaMinima = potenciaKwp * 0.85;
    const potenciaMaxima = potenciaKwp * 1.10;

    const adequados = INVERSORES.filter(inv =>
        inv.potencia_kw >= potenciaMinima && inv.potencia_kw <= potenciaMaxima
    );

    if (adequados.length === 0) {
        return INVERSORES.reduce((prev, curr) =>
            Math.abs(curr.potencia_kw - potenciaKwp) < Math.abs(prev.potencia_kw - potenciaKwp) ? curr : prev
        );
    }

    return adequados.sort((a, b) =>
        (b.eficiencia / b.preco_custo) - (a.eficiencia / a.preco_custo)
    )[0];
}

// =========================================
// 7. DIMENSIONAMENTO ELÉTRICO
// =========================================

/**
 * Dimensiona cabos DC (string → inversor)
 */
function dimensionarCabosDC(corrente, distancia) {
    // Fórmula: S = (2 × ρ × I × L) / ΔV
    // ρ = resistividade do cobre (0.0172 Ω·mm²/m)
    // I = corrente (A)
    // L = distância (m)
    // ΔV = queda de tensão máxima admissível (1% = 0.01 × Vmp)

    const quedaMaxima = 0.01; // 1%
    const resistividadeCobre = 0.0172;

    const secaoMinima = (2 * resistividadeCobre * corrente * distancia) / (quedaMaxima * 40); // Vmp ~40V

    // Seções padronizadas: 4, 6, 10, 16, 25 mm²
    const secoesPadrao = [4, 6, 10, 16, 25];
    const secaoEscolhida = secoesPadrao.find(s => s >= secaoMinima) || 25;

    return {
        secao: secaoEscolhida,
        corrente: Math.round(corrente * 10) / 10,
        distancia: distancia,
        quedaTensao: Math.round(((2 * resistividadeCobre * corrente * distancia) / secaoEscolhida) * 100) / 100
    };
}

/**
 * Dimensiona cabos AC (inversor → quadro)
 */
function dimensionarCabosAC(potenciaKw, distancia) {
    // Corrente AC trifásica: I = P / (√3 × V × cos φ)
    const tensao = 220; // Volts
    const fatorPotencia = 0.95;
    const corrente = potenciaKw * 1000 / (Math.sqrt(3) * tensao * fatorPotencia);

    // Seção mínima
    let secao;
    if (corrente <= 15) secao = 2.5;
    else if (corrente <= 20) secao = 4;
    else if (corrente <= 25) secao = 6;
    else if (corrente <= 35) secao = 10;
    else secao = 16;

    return {
        secao: secao,
        corrente: Math.round(corrente * 10) / 10,
        distancia: distancia,
        tensao: tensao
    };
}

/**
 * Dimensiona disjuntores e proteções
 */
function dimensionarProtecoes(config) {
    const { potenciaRealKwp, numModulos, placa } = config;
    const inversor = selecionarInversor(potenciaRealKwp);

    // Strings (assumindo 2 strings para sistemas > 5kWp)
    const numStrings = potenciaRealKwp > 5 ? 2 : 1;
    const modulosPorString = Math.ceil(numModulos / numStrings);

    return {
        disjuntorAC: {
            corrente: Math.ceil(inversor.corrente_max_ac * 1.25), // 125% da corrente nominal
            tipo: 'Tripolar',
            curvaMagnetotermica: 'C'
        },
        disjuntorDC: {
            corrente: Math.ceil(placa.isc * 1.25), // 125% da corrente de curto-circuito
            quantidade: numStrings,
            tipo: 'Bipolar DC',
            tensao: '1000V'
        },
        spd: {
            ac: { tensao: '275V', corrente: '20kA', tipo: 'Classe II' },
            dc: { tensao: '1000V', corrente: '40kA', tipo: 'Classe II' }
        },
        seccionadores: {
            ac: { corrente: inversor.corrente_max_ac, tipo: 'Tripolar' },
            dc: { corrente: placa.isc * numStrings, tipo: 'Bipolar' }
        }
    };
}

// =========================================
// 8. CÁLCULO DE CUSTOS COMPLETO
// =========================================

/**
 * Calcula todos os custos do projeto (para a empresa)
 */
function calcularCustosProjeto(config, tipoCliente, distanciaCabos = { dc: 15, ac: 10 }) {
    const { numModulos, potenciaRealKwp, placa } = config;
    const inversor = selecionarInversor(potenciaRealKwp);
    const protecoes = dimensionarProtecoes(config);
    const cabosDC = dimensionarCabosDC(placa.isc, distanciaCabos.dc);
    const cabosAC = dimensionarCabosAC(potenciaRealKwp, distanciaCabos.ac);

    // Custos de materiais
    const custoPlacas = numModulos * placa.preco_custo;
    const custoInversor = inversor.preco_custo;
    const custoEstrutura = numModulos * CUSTOS_MATERIAIS.estrutura_fixacao_por_modulo;
    const custoCabosDC = cabosDC.distancia * 2 * CUSTOS_MATERIAIS.cabo_solar_6mm_metro;
    const custoCabosAC = cabosAC.distancia * 3 * CUSTOS_MATERIAIS.cabo_flexivel_4mm_metro;
    const custoStringBox = CUSTOS_MATERIAIS.string_box;
    const custoDisjuntorAC = CUSTOS_MATERIAIS.disjuntor_ac_por_kw * potenciaRealKwp;
    const custoDisjuntorDC = CUSTOS_MATERIAIS.disjuntor_dc_por_string * protecoes.disjuntorDC.quantidade;
    const custoSPD = CUSTOS_MATERIAIS.spd_ac + CUSTOS_MATERIAIS.spd_dc;
    const custoSeccionadores = CUSTOS_MATERIAIS.seccionador_ac + CUSTOS_MATERIAIS.seccionador_dc;
    const custoConectores = Math.ceil(numModulos / 2) * CUSTOS_MATERIAIS.conectores_mc4_par;
    const custoEletrodutos = (distanciaCabos.dc + distanciaCabos.ac) * CUSTOS_MATERIAIS.eletrodutos_por_metro;

    const custoMateriais = custoPlacas + custoInversor + custoEstrutura + custoCabosDC +
                          custoCabosAC + custoStringBox + custoDisjuntorAC + custoDisjuntorDC +
                          custoSPD + custoSeccionadores + custoConectores + custoEletrodutos;

    // Custos de serviços
    const custoMaoObra = potenciaRealKwp * CUSTOS_SERVICOS.mao_de_obra_por_kwp;
    const custoProjeto = CUSTOS_SERVICOS.projeto_eletrico;
    const custoART = CUSTOS_SERVICOS.art_crea;
    const custoHomologacao = CUSTOS_SERVICOS.homologacao_concessionaria;
    const custoDeslocamento = CUSTOS_SERVICOS.deslocamento;
    const custoFerramentasEPI = CUSTOS_SERVICOS.ferramentas_epi;

    const custoServicos = custoMaoObra + custoProjeto + custoART +
                         custoHomologacao + custoDeslocamento + custoFerramentasEPI;

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
            cabosDC: custoCabosDC,
            cabosAC: custoCabosAC,
            stringBox: custoStringBox,
            disjuntorAC: custoDisjuntorAC,
            disjuntorDC: custoDisjuntorDC,
            spd: custoSPD,
            seccionadores: custoSeccionadores,
            conectores: custoConectores,
            eletrodutos: custoEletrodutos,
            total: custoMateriais
        },
        servicos: {
            maoObra: custoMaoObra,
            projeto: custoProjeto,
            art: custoART,
            homologacao: custoHomologacao,
            deslocamento: custoDeslocamento,
            ferramentasEPI: custoFerramentasEPI,
            total: custoServicos
        },
        equipamentos: {
            inversor: inversor,
            protecoes: protecoes,
            cabosDC: cabosDC,
            cabosAC: cabosAC
        },
        custoTotal: Math.round(custoTotal * 100) / 100,
        margemLucro: margemLucro,
        valorVenda: Math.round(valorVenda * 100) / 100,
        lucro: Math.round(lucro * 100) / 100,
        margemPercentual: (margemLucro * 100).toFixed(1)
    };
}

// =========================================
// 9. ANÁLISE FINANCEIRA AVANÇADA
// =========================================

/**
 * Calcula economia com reajuste anual da tarifa
 */
function calcularEconomiaAvancada(energiaMensalGerada, tarifaKwh, reajusteAnual = 0.08) {
    const economiaMensal = energiaMensalGerada * tarifaKwh;
    const economiaAnual = economiaMensal * 12;

    // Economia em 25 anos com reajuste
    let economia25Anos = 0;
    for (let ano = 1; ano <= 25; ano++) {
        const tarifaAno = tarifaKwh * Math.pow(1 + reajusteAnual, ano - 1);
        economia25Anos += energiaMensalGerada * 12 * tarifaAno;
    }

    return {
        economiaMensal: Math.round(economiaMensal * 100) / 100,
        economiaAnual: Math.round(economiaAnual * 100) / 100,
        economia25Anos: Math.round(economia25Anos * 100) / 100,
        tarifaKwh: tarifaKwh,
        reajusteAnual: (reajusteAnual * 100).toFixed(1)
    };
}

/**
 * Calcula payback simples e real
 */
function calcularPayback(valorInvestimento, economiaMensal, reajusteAnual = 0.08, inflacao = 0.045) {
    // Payback simples
    const paybackSimplesMeses = valorInvestimento / economiaMensal;
    const paybackSimplesAnos = paybackSimplesMeses / 12;

    // Payback real (considerando reajuste e inflação)
    let saldoDevedor = valorInvestimento;
    let mesPaybackReal = 0;
    let economiaAcumulada = 0;

    for (let mes = 1; mes <= 300; mes++) { // máximo 25 anos
        const ano = Math.floor((mes - 1) / 12) + 1;
        const economiaDoMes = economiaMensal * Math.pow(1 + reajusteAnual, ano - 1);
        economiaAcumulada += economiaDoMes;

        if (economiaAcumulada >= valorInvestimento) {
            mesPaybackReal = mes;
            break;
        }
    }

    return {
        simples: {
            meses: Math.round(paybackSimplesMeses),
            anos: Math.round(paybackSimplesAnos * 10) / 10
        },
        real: {
            meses: mesPaybackReal,
            anos: Math.round((mesPaybackReal / 12) * 10) / 10
        }
    };
}

/**
 * Calcula TIR e VPL
 */
function calcularTIR_VPL(valorInvestimento, economiaAnual, reajusteAnual = 0.08, taxaDesconto = 0.08, anos = 25) {
    // VPL - Valor Presente Líquido
    let vpl = -valorInvestimento;

    for (let ano = 1; ano <= anos; ano++) {
        const fluxoCaixa = economiaAnual * Math.pow(1 + reajusteAnual, ano - 1);
        vpl += fluxoCaixa / Math.pow(1 + taxaDesconto, ano);
    }

    // TIR - Taxa Interna de Retorno (aproximação por Newton-Raphson)
    let tir = 0.1; // Chute inicial de 10%
    const precisao = 0.0001;
    let iteracoes = 0;

    while (iteracoes < 100) {
        let f = -valorInvestimento;
        let df = 0;

        for (let ano = 1; ano <= anos; ano++) {
            const fluxoCaixa = economiaAnual * Math.pow(1 + reajusteAnual, ano - 1);
            f += fluxoCaixa / Math.pow(1 + tir, ano);
            df -= ano * fluxoCaixa / Math.pow(1 + tir, ano + 1);
        }

        if (Math.abs(f) < precisao) break;
        tir = tir - f / df;
        iteracoes++;
    }

    return {
        vpl: Math.round(vpl * 100) / 100,
        tir: Math.round(tir * 10000) / 100 // em %
    };
}

// =========================================
// 10. FUNÇÃO PRINCIPAL - PROPOSTA COMPLETA
// =========================================

async function gerarPropostaCompleta(dados) {
    const {
        cep,
        consumoMensalKwh,
        percentualReducao,
        tarifaKwh = 0.85,
        tipoCliente = 'residencial',
        inclinacao = 15,
        azimute = 0,
        distanciaCabos = { dc: 15, ac: 10 },
        reajusteAnual = 0.08,
        inflacao = 0.045
    } = dados;

    // 1. Buscar localização
    const localizacao = await buscarCEP(cep);
    if (!localizacao) throw new Error('CEP inválido');

    // 2. Dimensionamento
    const dimensionamento = calcularDimensionamento({
        consumoMensalKwh,
        percentualReducao,
        irradiacao: localizacao.irradiacao,
        inclinacao,
        azimute
    });

    // 3. Selecionar placas
    const configuracoes = selecionarMelhoresPlacas(dimensionamento.potenciaNecessariaKwp);

    // 4. Gerar propostas completas
    const propostas = configuracoes.map(config => {
        const custos = calcularCustosProjeto(config, tipoCliente, distanciaCabos);
        const economia = calcularEconomiaAvancada(
            dimensionamento.energiaMensalNecessaria,
            tarifaKwh,
            reajusteAnual
        );
        const payback = calcularPayback(
            custos.valorVenda,
            economia.economiaMensal,
            reajusteAnual,
            inflacao
        );
        const { vpl, tir } = calcularTIR_VPL(
            custos.valorVenda,
            economia.economiaAnual,
            reajusteAnual
        );

        return {
            configuracao: config,
            custos: custos,
            economia: economia,
            payback: payback,
            vpl: vpl,
            tir: tir,
            energiaGerada: dimensionamento.energiaMensalNecessaria
        };
    });

    return {
        localizacao,
        dimensionamento,
        propostas,
        parametros: {
            inclinacao,
            azimute,
            reajusteAnual: (reajusteAnual * 100).toFixed(1) + '%',
            inflacao: (inflacao * 100).toFixed(1) + '%'
        },
        dataCalculo: new Date().toISOString()
    };
}

// =========================================
// 11. GERAÇÃO DE RELATÓRIOS
// =========================================

/**
 * Gera relatório para o LEAD (sem mostrar margem/lucro)
 */
function gerarRelatorioLead(resultado, propostaIndex = 0) {
    const proposta = resultado.propostas[propostaIndex];
    const { configuracao, custos, economia, payback, vpl, tir } = proposta;

    return {
        tipo: 'PROPOSTA COMERCIAL',
        cliente: {
            localizacao: `${resultado.localizacao.cidade} - ${resultado.localizacao.estado}`,
            consumoMensal: resultado.dimensionamento.energiaMensalNecessaria + ' kWh'
        },
        sistema: {
            potencia: configuracao.potenciaRealKwp + ' kWp',
            modulos: `${configuracao.numModulos}x ${configuracao.placa.fabricante} ${configuracao.placa.modelo} (${configuracao.placa.potencia}W)`,
            inversor: `${custos.equipamentos.inversor.fabricante} ${custos.equipamentos.inversor.modelo} (${custos.equipamentos.inversor.potencia_kw}kW)`,
            area: configuracao.area + ' m²',
            garantia: configuracao.placa.garantia + ' anos'
        },
        investimento: {
            valorTotal: 'R$ ' + custos.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            formaPagamento: 'À vista ou parcelado (consultar condições)'
        },
        economia: {
            mensal: 'R$ ' + economia.economiaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            anual: 'R$ ' + economia.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            em25Anos: 'R$ ' + economia.economia25Anos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        },
        retorno: {
            payback: payback.real.anos + ' anos',
            tir: tir + '% ao ano',
            vpl: 'R$ ' + vpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        },
        itensInclusos: [
            `${configuracao.numModulos} módulos fotovoltaicos ${configuracao.placa.potencia}W`,
            `1 inversor ${custos.equipamentos.inversor.potencia_kw}kW`,
            'Estrutura de fixação completa',
            'Cabos e conectores',
            'Quadro de proteção AC/DC',
            'SPD (proteção contra surtos)',
            'Projeto elétrico + ART',
            'Instalação completa',
            'Homologação na concessionária',
            'Garantia de 25 anos nos módulos',
            'Garantia de 5 anos no inversor'
        ]
    };
}

/**
 * Gera relatório técnico para a EMPRESA (completo com custos e margem)
 */
function gerarRelatorioEmpresa(resultado, propostaIndex = 0) {
    const proposta = resultado.propostas[propostaIndex];
    const { configuracao, custos, economia, payback, vpl, tir } = proposta;

    return {
        tipo: 'MEMORIAL TÉCNICO E FINANCEIRO',
        localizacao: resultado.localizacao,
        dimensionamento: resultado.dimensionamento,
        sistema: {
            potencia: configuracao.potenciaRealKwp,
            modulos: configuracao.numModulos,
            placa: configuracao.placa,
            inversor: custos.equipamentos.inversor,
            area: configuracao.area
        },
        dimensionamentoEletrico: {
            cabosDC: custos.equipamentos.cabosDC,
            cabosAC: custos.equipamentos.cabosAC,
            protecoes: custos.equipamentos.protecoes
        },
        custosDetalhados: {
            materiais: custos.materiais,
            servicos: custos.servicos,
            custoTotal: custos.custoTotal
        },
        precificacao: {
            custoTotal: 'R$ ' + custos.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            margemLucro: custos.margemPercentual + '%',
            lucro: 'R$ ' + custos.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            valorVenda: 'R$ ' + custos.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        },
        economiaCliente: {
            mensal: economia.economiaMensal,
            anual: economia.economiaAnual,
            em25Anos: economia.economia25Anos,
            paybackSimples: payback.simples.anos,
            paybackReal: payback.real.anos
        },
        analiseFinanceira: {
            vpl: vpl,
            tir: tir + '%',
            taxaReajuste: economia.reajusteAnual + '% a.a.'
        }
    };
}

// =========================================
// EXPORTAR MÓDULO
// =========================================

if (typeof window !== 'undefined') {
    window.CalculadoraSolarCompleta = {
        // Funções principais
        gerarPropostaCompleta,
        gerarRelatorioLead,
        gerarRelatorioEmpresa,

        // Funções auxiliares
        buscarCEP,
        calcularDimensionamento,
        selecionarMelhoresPlacas,
        selecionarInversor,
        dimensionarCabosDC,
        dimensionarCabosAC,
        dimensionarProtecoes,
        calcularCustosProjeto,
        calcularEconomiaAvancada,
        calcularPayback,
        calcularTIR_VPL,

        // Dados
        PLACAS_SOLARES,
        INVERSORES,
        IRRADIACAO_POR_ESTADO,
        PERDAS_SISTEMA,
        MARGENS_LUCRO
    };
}
