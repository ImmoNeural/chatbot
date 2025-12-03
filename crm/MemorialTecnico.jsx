import React from 'react';

const MemorialTecnico = ({ resultado, propostaIndex }) => {
    const proposta = resultado.propostas[propostaIndex];
    const { configuracao, custos, economia, payback, vpl, tir } = proposta;
    const inversor = custos.equipamentos?.inversor || custos.inversor;
    const cabosDC = custos.equipamentos?.cabosDC || {};
    const cabosAC = custos.equipamentos?.cabosAC || {};
    const protecoes = custos.equipamentos?.protecoes || {};
    const tipoSistema = resultado.tipoSistema || 'on-grid';
    const paybackAnos = payback.real?.anos || payback.anos;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        window.close();
    };

    const tipoSistemaLabel = {
        'on-grid': 'On-Grid (Conectado à Rede)',
        'off-grid': 'Off-Grid (Isolado)',
        'hibrido': 'Híbrido (Grid + Baterias)'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8 relative">
            {/* Imagem de fundo com transparência */}
            <div
                className="fixed inset-0 z-0 opacity-50"
                style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* Overlay adicional para suavizar */}
            <div className="fixed inset-0 z-0 bg-white opacity-40" />

            {/* Conteúdo principal */}
            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-slate-200">

                    {/* Cabeçalho */}
                    <div className="text-center mb-12 pb-8 border-b-2 border-slate-300">
                        <h1 className="text-5xl font-bold text-slate-800 mb-3">
                            ⚡ Memorial Técnico de Cálculo
                        </h1>
                        <h2 className="text-2xl text-slate-600 mb-2">Sistema de Energia Solar Fotovoltaica</h2>
                        <p className="text-slate-500">Sunbotic Energia Solar | {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>

                    {/* Seção 1: Localização e Dados Climáticos */}
                    <section className="mb-10 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 p-8 rounded-xl border border-blue-200/50">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            1. Localização e Dados Climáticos
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                                <span className="text-slate-600 text-sm block mb-1">Cidade</span>
                                <strong className="text-lg text-slate-800">{resultado.localizacao.cidade}</strong>
                            </div>
                            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                                <span className="text-slate-600 text-sm block mb-1">Estado</span>
                                <strong className="text-lg text-slate-800">{resultado.localizacao.estado}</strong>
                            </div>
                            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                                <span className="text-slate-600 text-sm block mb-1">Bairro</span>
                                <strong className="text-lg text-slate-800">{resultado.localizacao.bairro || 'N/A'}</strong>
                            </div>
                            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                                <span className="text-slate-600 text-sm block mb-1">☀️ Irradiação Solar (HSP)</span>
                                <strong className="text-lg text-orange-600">{resultado.localizacao.irradiacao} kWh/m²/dia</strong>
                            </div>
                            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                                <span className="text-slate-600 text-sm block mb-1">📐 Inclinação Telhado</span>
                                <strong className="text-lg text-slate-800">{resultado.dimensionamento.inclinacao || 15}°</strong>
                            </div>
                            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                                <span className="text-slate-600 text-sm block mb-1">🧭 Azimute</span>
                                <strong className="text-lg text-slate-800">{resultado.dimensionamento.azimute || 0}° (Norte)</strong>
                            </div>
                            <div className="bg-white/90 p-4 rounded-lg shadow-sm col-span-3">
                                <span className="text-slate-600 text-sm block mb-1">⚙️ Tipo de Sistema</span>
                                <strong className="text-lg text-green-700">{tipoSistemaLabel[tipoSistema]}</strong>
                            </div>
                        </div>
                    </section>

                    {/* Seção 2: Dimensionamento */}
                    <section className="mb-10 bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-8 rounded-xl border border-green-200/50">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                            </svg>
                            2. Dimensionamento do Sistema
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                                <span className="text-slate-600 block mb-1">Consumo Mensal Desejado</span>
                                <strong className="text-3xl text-green-700">{resultado.dimensionamento.energiaMensalNecessaria} kWh</strong>
                            </div>
                            <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                                <span className="text-slate-600 block mb-1">Potência Instalada</span>
                                <strong className="text-3xl text-blue-700">{configuracao.potenciaRealKwp} kWp</strong>
                            </div>
                            <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                                <span className="text-slate-600 block mb-1">Número de Módulos</span>
                                <strong className="text-3xl text-slate-800">{configuracao.numModulos} placas</strong>
                            </div>
                            <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                                <span className="text-slate-600 block mb-1">Área Total</span>
                                <strong className="text-3xl text-slate-800">{configuracao.area.toFixed(1)} m²</strong>
                            </div>
                        </div>

                        <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                            <h4 className="font-bold text-green-800 mb-3">📋 Equipamentos Selecionados</h4>
                            <ul className="space-y-2 text-sm text-slate-700">
                                <li><strong>Módulos:</strong> {configuracao.numModulos}x {configuracao.placa.fabricante} {configuracao.placa.modelo} ({configuracao.placa.potencia}W cada)</li>
                                <li><strong>Eficiência dos Módulos:</strong> {configuracao.placa.eficiencia}%</li>
                                <li><strong>Inversor:</strong> {inversor.fabricante} {inversor.modelo} ({inversor.potencia_kw}kW)</li>
                                <li><strong>Eficiência do Inversor:</strong> {inversor.eficiencia}%</li>
                                <li><strong>Garantia Módulos:</strong> 5 anos (produto) | 25 anos (performance ≥80%)</li>
                                <li><strong>Garantia Inversor:</strong> 5 anos</li>
                            </ul>
                        </div>
                    </section>

                    {/* Seção 3: Perdas do Sistema */}
                    <section className="mb-10 bg-gradient-to-r from-orange-50/80 to-amber-50/80 p-8 rounded-xl border border-orange-200/50">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            3. Perdas do Sistema
                        </h3>
                        <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-orange-200">
                                        <th className="text-left py-3 text-slate-700">Tipo de Perda</th>
                                        <th className="text-right py-3 text-slate-700">Percentual</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr className="border-b border-slate-200"><td className="py-2">🌡️ Temperatura dos módulos</td><td className="text-right">8%</td></tr>
                                    <tr className="border-b border-slate-200"><td className="py-2">⚡ Inversor (conversão DC/AC)</td><td className="text-right">3%</td></tr>
                                    <tr className="border-b border-slate-200"><td className="py-2">🔌 Cabeamento (DC + AC)</td><td className="text-right">1.5%</td></tr>
                                    <tr className="border-b border-slate-200"><td className="py-2">🌳 Sombreamento</td><td className="text-right">2%</td></tr>
                                    <tr className="border-b border-slate-200"><td className="py-2">💨 Poeira e sujeira</td><td className="text-right">2%</td></tr>
                                    <tr className="border-b border-slate-200"><td className="py-2">⚠️ Mismatch</td><td className="text-right">1.5%</td></tr>
                                    <tr className="bg-orange-100/80 font-bold text-slate-800">
                                        <td className="py-3">TOTAL DE PERDAS</td>
                                        <td className="text-right">≈ 18%</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-slate-500 mt-3">* Perdas consideradas no dimensionamento</p>
                        </div>
                    </section>

                    {/* Seção 4: Dimensionamento Elétrico */}
                    <section className="mb-10 bg-gradient-to-r from-purple-50/80 to-pink-50/80 p-8 rounded-xl border border-purple-200/50">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                            </svg>
                            4. Dimensionamento Elétrico
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                                <h4 className="font-bold text-purple-800 mb-3">Lado DC (Corrente Contínua)</h4>
                                <ul className="text-sm space-y-2 text-slate-700">
                                    <li><strong>Cabo DC:</strong> {cabosDC.secao || 6}mm² ({cabosDC.distancia || 15}m)</li>
                                    <li><strong>Corrente DC:</strong> {cabosDC.corrente || 'N/A'}A</li>
                                    <li><strong>Queda de Tensão:</strong> {cabosDC.quedaTensao || '<1'}%</li>
                                    <li><strong>String Box:</strong> Incluso</li>
                                    <li><strong>Disjuntor DC:</strong> {protecoes.disjuntorDC || '63A'}</li>
                                    <li><strong>Seccionador DC:</strong> Incluso</li>
                                </ul>
                            </div>
                            <div className="bg-white/90 p-5 rounded-lg shadow-sm">
                                <h4 className="font-bold text-purple-800 mb-3">Lado AC (Corrente Alternada)</h4>
                                <ul className="text-sm space-y-2 text-slate-700">
                                    <li><strong>Cabo AC:</strong> {cabosAC.secao || 6}mm² ({cabosAC.distancia || 10}m)</li>
                                    <li><strong>Corrente AC:</strong> {cabosAC.corrente || inversor.corrente_max_ac || 'N/A'}A</li>
                                    <li><strong>Queda de Tensão:</strong> {cabosAC.quedaTensao || '<1'}%</li>
                                    <li><strong>Disjuntor AC:</strong> {protecoes.disjuntorAC || '40A'} tripolar</li>
                                    <li><strong>SPD:</strong> Classe II - DC e AC</li>
                                    <li><strong>Aterramento:</strong> NBR 5410</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Seção 5-8: Custos, Composição, Análise (versão compacta para economizar espaço) */}
                    <section className="mb-10">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Custos */}
                            <div className="bg-gradient-to-br from-slate-50/80 to-gray-50/80 p-6 rounded-xl border border-slate-200/50">
                                <h3 className="text-xl font-bold text-slate-800 mb-4">💰 Custos Totais</h3>
                                <div className="space-y-2 text-sm text-slate-700">
                                    <div className="flex justify-between pb-2 border-b border-slate-200">
                                        <span>Materiais:</span>
                                        <strong>{formatCurrency(custos.materiais.total)}</strong>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-slate-200">
                                        <span>Serviços:</span>
                                        <strong>{formatCurrency(custos.servicos.total)}</strong>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b-2 border-slate-300 font-semibold text-base">
                                        <span>Custo Total:</span>
                                        <strong className="text-blue-700">{formatCurrency(custos.custoTotal)}</strong>
                                    </div>
                                    <div className="flex justify-between pb-2 text-green-700">
                                        <span>Margem ({custos.margemPercentual}%):</span>
                                        <strong>+ {formatCurrency(custos.lucro)}</strong>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t-2 border-green-300 text-lg font-bold">
                                        <span className="text-slate-800">Valor Venda:</span>
                                        <strong className="text-green-700">{formatCurrency(custos.valorVenda)}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Análise Financeira */}
                            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 rounded-xl border border-blue-200/50">
                                <h3 className="text-xl font-bold text-slate-800 mb-4">📊 Análise Financeira</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="bg-white/90 p-3 rounded-lg">
                                        <span className="text-slate-600 block text-xs mb-1">Economia Mensal</span>
                                        <strong className="text-green-700 text-lg">{formatCurrency(economia.economiaMensal)}</strong>
                                    </div>
                                    <div className="bg-white/90 p-3 rounded-lg">
                                        <span className="text-slate-600 block text-xs mb-1">Payback</span>
                                        <strong className="text-blue-700 text-xl">{paybackAnos} anos</strong>
                                    </div>
                                    {tir > 0 && (
                                        <div className="bg-white/90 p-3 rounded-lg">
                                            <span className="text-slate-600 block text-xs mb-1">TIR</span>
                                            <strong className="text-purple-700 text-lg">{tir}% a.a.</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Rodapé */}
                    <div className="text-center text-sm text-slate-600 pt-8 border-t-2 border-slate-200">
                        <p className="font-bold text-lg mb-2">Sunbotic Energia Solar</p>
                        <p>Memorial Técnico gerado em: {new Date().toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-slate-500 mt-2">Documento interno - Uso exclusivo da empresa integradora</p>
                        <p className="text-xs text-slate-500">Sistema dimensionado conforme NBR 16690 e NBR 5410</p>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-center gap-4 mt-8 no-print">
                    <button
                        onClick={handlePrint}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Imprimir / Salvar PDF
                        </span>
                    </button>

                    <button
                        onClick={handleClose}
                        className="group relative px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Fechar
                        </span>
                    </button>
                </div>
            </div>

            <style jsx>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
};

export default MemorialTecnico;
