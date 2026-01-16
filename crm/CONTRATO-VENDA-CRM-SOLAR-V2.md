# CONTRATO DE COMPRA E VENDA DE SOFTWARE
## Com Transferência de Propriedade Intelectual

---

**Contrato nº:** [CAMPO_NUMERO_CONTRATO]
**Data:** [CAMPO_DATA]

---

## PARTES CONTRATANTES

### VENDEDORA

**Razão Social:** [CAMPO_RAZAO_SOCIAL_VENDEDORA]
**CNPJ:** [CAMPO_CNPJ_VENDEDORA]
**Endereço:** [CAMPO_ENDERECO_VENDEDORA]
**Representante Legal:** [CAMPO_REPRESENTANTE_VENDEDORA]
**E-mail:** [CAMPO_EMAIL_VENDEDORA]

### COMPRADORA

**Razão Social:** [CAMPO_RAZAO_SOCIAL_COMPRADORA]
**CNPJ:** [CAMPO_CNPJ_COMPRADORA]
**Endereço:** [CAMPO_ENDERECO_COMPRADORA]
**Representante Legal:** [CAMPO_REPRESENTANTE_COMPRADORA]
**E-mail:** [CAMPO_EMAIL_COMPRADORA]

---

## CLÁUSULA 1ª - DO OBJETO

1.1. O presente contrato tem por objeto a **venda e transferência total de propriedade intelectual** do software denominado **"CRM Solar - Sistema de Gestão para Empresas de Energia Solar"**, incluindo:

a) Código-fonte completo (frontend e backend);
b) Banco de dados e estrutura (PostgreSQL/Supabase);
c) Documentação técnica e de usuário;
d) Direitos autorais e de exploração comercial;
e) Marca e identidade visual do sistema (se aplicável);
f) Chatbot de qualificação de leads;
g) Integrações com WhatsApp (Twilio) e demais APIs.

1.2. **Funcionalidades incluídas no sistema base:**

| Módulo | Funcionalidades |
|--------|-----------------|
| **Gestão de Leads** | Captação via chatbot, lead scoring, qualificação automática |
| **Kanban** | Visualização de oportunidades com movimentação semi-automática |
| **Propostas** | Geração automática de PDF, memorial técnico, ROI |
| **Comunicação** | WhatsApp Business API, histórico de conversas |
| **Automações** | Nutrição de leads, alertas de follow-up, distribuição |
| **Multi-tenant** | Isolamento por empresa (SaaS), planos configuráveis |
| **Download de Dados** | Exportação de dados e documentos do cliente |
| **Relatórios** | Dashboard, KPIs, projeção de receita |

1.3. **Funcionalidades de movimentação semi-automática do Kanban:**

| Tipo | Regra | Ação |
|------|-------|------|
| Progressão | Proposta enviada | Move para "Em Negociação" |
| Progressão | Proposta aceita | Move para "Contrato" |
| Retrocesso | 14 dias sem interação | Retorna para etapa anterior |
| Retrocesso | 3 tentativas + 7 dias | Move para "Em Nutrição" |

---

## CLÁUSULA 2ª - DOS MÓDULOS ADICIONAIS (OPCIONAIS)

2.1. A COMPRADORA poderá adquirir os seguintes módulos adicionais:

| Módulo | Descrição | Valor |
|--------|-----------|-------|
| **Tradução Espanhol** | Interface, chatbot, propostas e emails em espanhol | R$ 5.000,00 |
| **Eletromobilidade** | Módulo completo para carregadores de veículos elétricos | R$ 15.000,00 |
| **Combo (ambos)** | Tradução + Eletromobilidade com 10% de desconto | R$ 18.000,00 |

2.2. **Escopo do Módulo de Tradução Espanhol:**
- Sistema i18n com seletor de idioma
- Tradução de toda interface do CRM
- Tradução do chatbot de qualificação
- Templates de propostas em espanhol
- Prazo de entrega: 15 dias úteis

2.3. **Escopo do Módulo de Eletromobilidade:**
- Chatbot específico para qualificação EV
- Campos técnicos: garagem, veículos, kVA, distância ao quadro
- Dimensionamento de carregadores (7kW a 150kW)
- Propostas para venda, locação e EV as a Service
- Checklist de vistoria para instalação
- Prazo de entrega: 30 dias úteis

---

## CLÁUSULA 3ª - DO PREÇO E FORMA DE PAGAMENTO

3.1. O valor total acordado para a aquisição do software é:

| Item | Valor |
|------|-------|
| Sistema Base CRM Solar | R$ [CAMPO_VALOR_BASE] |
| Módulos Adicionais (se contratados) | R$ [CAMPO_VALOR_ADICIONAIS] |
| **VALOR TOTAL** | **R$ [CAMPO_VALOR_TOTAL]** |

3.2. **Forma de pagamento:**

| Parcela | Percentual | Valor | Vencimento |
|---------|------------|-------|------------|
| Sinal | 15% | R$ [CAMPO_VALOR_SINAL] | Na assinatura |
| 2ª Parcela | 35% | R$ [CAMPO_VALOR_PARCELA2] | Na entrega |
| 3ª Parcela | 50% | R$ [CAMPO_VALOR_PARCELA3] | 30 dias após entrega |

3.3. O pagamento será realizado mediante emissão de **Nota Fiscal** pela VENDEDORA.

3.4. Em caso de atraso no pagamento, incidirão juros de 1% ao mês e multa de 2%, além de correção monetária pelo IPCA.

---

## CLÁUSULA 4ª - DOS CUSTOS OPERACIONAIS

4.1. A COMPRADORA será responsável pelos custos operacionais de infraestrutura e APIs, estimados em **menos de US$ 60,00 mensais** (aproximadamente R$ 300,00):

| Serviço | Provedor | Custo Estimado |
|---------|----------|----------------|
| Banco de Dados + Auth | Supabase | ~US$ 25/mês |
| WhatsApp API | Twilio | ~US$ 20/mês* |
| Domínio | Registro.br ou similar | ~US$ 3/mês |
| Hospedagem | Vercel/Netlify | US$ 0-10/mês |
| **Total** | | **< US$ 60/mês** |

*Custo Twilio varia conforme volume. Estimativa para ~500 mensagens/mês.

4.2. **Detalhamento de custos Twilio WhatsApp (Brasil):**

| Tipo de Mensagem | Custo Unitário |
|------------------|----------------|
| Marketing | ~R$ 0,35 |
| Utilidade | ~R$ 0,05 |
| Autenticação | ~R$ 0,02 |
| Serviço (resposta em 24h) | Gratuito |

4.3. A VENDEDORA não se responsabiliza por aumentos de preços praticados pelos provedores de infraestrutura.

---

## CLÁUSULA 5ª - DA ENTREGA E TRANSFERÊNCIA

5.1. A entrega do software será realizada no prazo de **48 (quarenta e oito) horas** após a confirmação do pagamento do sinal.

5.2. A entrega dos módulos adicionais seguirá os prazos especificados na Cláusula 2ª.

5.3. A transferência incluirá:

a) Acesso completo ao repositório Git com código-fonte;
b) Credenciais de acesso a todos os serviços (Supabase, Twilio);
c) Documentação técnica e manual do usuário;
d) Sessão de transferência de conhecimento (8 horas);
e) Arquivo com todas as senhas e configurações.

5.4. Após a entrega, a COMPRADORA terá **total autonomia** para modificar, comercializar e distribuir o software.

---

## CLÁUSULA 6ª - DO TREINAMENTO

6.1. A VENDEDORA fornecerá **8 (oito) horas de treinamento**, incluindo:

| Tópico | Duração |
|--------|---------|
| Visão geral e navegação | 1 hora |
| Gestão de leads e chatbot | 2 horas |
| Kanban e automações | 2 horas |
| Propostas e relatórios | 1,5 horas |
| Configurações e multi-tenant | 1,5 horas |

6.2. O treinamento será realizado de forma remota (videoconferência) em datas acordadas entre as partes.

6.3. Treinamentos adicionais poderão ser contratados separadamente.

---

## CLÁUSULA 7ª - DA GARANTIA E SUPORTE

7.1. A VENDEDORA oferece garantia de **90 (noventa) dias** para correção de bugs, contados a partir da data de entrega.

7.2. **Está incluído na garantia:**
- Correção de erros de funcionamento (bugs)
- Ajustes de comportamento não conforme especificação
- Suporte técnico via WhatsApp/Email em horário comercial

7.3. **Não está incluído na garantia:**
- Novas funcionalidades
- Alterações de layout ou design
- Integrações com sistemas não especificados
- Problemas causados por modificações feitas pela COMPRADORA

7.4. Após o período de garantia, serviços de manutenção poderão ser contratados mediante acordo específico.

---

## CLÁUSULA 8ª - DO SUPORTE TÉCNICO (SLA)

8.1. Durante o período de garantia, a VENDEDORA se compromete a atender chamados conforme a tabela abaixo:

| Prioridade | Descrição | Tempo de Resposta | Tempo de Solução |
|------------|-----------|-------------------|------------------|
| **Crítica** | Sistema inoperante | 4 horas | 24 horas |
| **Média** | Funcionalidade comprometida | 12 horas | 48 horas |
| **Baixa** | Dúvidas e ajustes menores | 24 horas | 72 horas |

8.2. Os prazos são contados em horário comercial (8h às 18h, dias úteis).

---

## CLÁUSULA 9ª - DA PROPRIEDADE INTELECTUAL

9.1. Com o pagamento integral, a **propriedade intelectual total** do software será transferida à COMPRADORA, incluindo:

a) Direitos autorais patrimoniais;
b) Direito de uso, modificação e distribuição;
c) Direito de comercialização (venda, licenciamento, SaaS);
d) Direito de criar obras derivadas.

9.2. A VENDEDORA **não poderá** comercializar, licenciar ou distribuir cópias do software após a transferência.

9.3. A COMPRADORA poderá registrar o software em seu nome junto aos órgãos competentes.

---

## CLÁUSULA 10ª - DA CONFIDENCIALIDADE E LGPD

10.1. As partes se comprometem a manter sigilo sobre informações confidenciais trocadas durante e após a vigência deste contrato.

10.2. **Em relação à LGPD (Lei 13.709/2018):**

| Papel | Responsável |
|-------|-------------|
| **Controlador** | COMPRADORA (após transferência) |
| **Operador** | VENDEDORA (durante desenvolvimento e suporte) |

10.3. A COMPRADORA será responsável por:
- Obter consentimento dos titulares de dados
- Implementar política de privacidade
- Atender solicitações de titulares

10.4. A VENDEDORA garante que o software possui recursos para:
- Exportação de dados pessoais
- Exclusão de dados (direito ao esquecimento)
- Logs de acesso e modificações

10.5. A obrigação de confidencialidade sobre segredos comerciais é **perpétua**.

---

## CLÁUSULA 11ª - DAS GARANTIAS TÉCNICAS

11.1. A VENDEDORA garante que:

a) O software está livre de vírus, malware ou código malicioso;
b) O código-fonte é original e não infringe direitos de terceiros;
c) As funcionalidades descritas estão operacionais na data de entrega;
d) A documentação corresponde à versão entregue.

11.2. **Cláusula "AS IS":** Após o período de garantia, o software é fornecido "no estado em que se encontra", sem garantias adicionais de adequação a finalidades específicas.

---

## CLÁUSULA 12ª - DO DIREITO DE ARREPENDIMENTO

12.1. A COMPRADORA poderá exercer o direito de arrependimento no prazo de **14 (quatorze) dias corridos** contados da data de **entrega do software**.

12.2. Para exercer o arrependimento, a COMPRADORA deverá:
- Notificar por escrito a VENDEDORA;
- Devolver todos os acessos, códigos e documentação;
- Comprovar a exclusão de todas as cópias em seu poder.

12.3. Em caso de arrependimento:
- O sinal (15%) será retido como taxa administrativa;
- Demais valores pagos serão devolvidos em até 10 dias úteis.

---

## CLÁUSULA 13ª - DA RESOLUÇÃO DE CONFLITOS

13.1. As partes se comprometem a resolver eventuais divergências de **boa-fé**, buscando solução amigável.

13.2. Persistindo o conflito, será utilizada **mediação** antes do recurso judicial.

13.3. Fica eleito o foro da comarca de **[CAMPO_CIDADE_FORO]/[CAMPO_ESTADO_FORO]** para dirimir questões não resolvidas amigavelmente.

---

## CLÁUSULA 14ª - DAS DISPOSIÇÕES FINAIS

14.1. Este contrato representa o acordo integral entre as partes, substituindo entendimentos anteriores.

14.2. Alterações só serão válidas mediante termo aditivo assinado por ambas as partes.

14.3. A tolerância de uma parte quanto ao descumprimento de qualquer cláusula não implica renúncia ao direito de exigir seu cumprimento.

14.4. Se qualquer cláusula for considerada inválida, as demais permanecerão em vigor.

---

## ASSINATURAS

E por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.

**Local:** [CAMPO_LOCAL], [CAMPO_DATA_EXTENSO]

---

**VENDEDORA:**

_______________________________________________
**Nome:** [CAMPO_REPRESENTANTE_VENDEDORA]
**CPF:** [CAMPO_CPF_VENDEDORA]
**Cargo:** [CAMPO_CARGO_VENDEDORA]

---

**COMPRADORA:**

_______________________________________________
**Nome:** [CAMPO_REPRESENTANTE_COMPRADORA]
**CPF:** [CAMPO_CPF_COMPRADORA]
**Cargo:** [CAMPO_CARGO_COMPRADORA]

---

**TESTEMUNHAS:**

1. _______________________________________________
   **Nome:** [CAMPO_TESTEMUNHA1]
   **CPF:** [CAMPO_CPF_TESTEMUNHA1]

2. _______________________________________________
   **Nome:** [CAMPO_TESTEMUNHA2]
   **CPF:** [CAMPO_CPF_TESTEMUNHA2]
