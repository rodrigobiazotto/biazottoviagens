// Biazotto Viagens - Core Client Script
(function() {
  'use strict';

  // 1. Bloqueia menu de contexto (botão direito do mouse)
  function blockContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  document.addEventListener('contextmenu', blockContextMenu, true);
  window.addEventListener('contextmenu', blockContextMenu, true);

  // 2. Bloqueia atalhos de teclado do DevTools e inspeção
  window.addEventListener('keydown', function(e) {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    const key = (e.key || '').toUpperCase();
    const keyCode = e.keyCode || e.which;

    // F12
    if (key === 'F12' || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I / Cmd+Option+I (Inspecionar / DevTools)
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    // Ctrl+Shift+C / Cmd+Option+C (Inspecionar Elemento)
    // Ctrl+Shift+K (Console Firefox)
    if (
      (isCtrlOrCmd && isShift && (key === 'I' || key === 'J' || key === 'C' || key === 'K' || keyCode === 73 || keyCode === 74 || keyCode === 67 || keyCode === 75)) ||
      (isCtrlOrCmd && isAlt && (key === 'I' || key === 'J' || key === 'C' || keyCode === 73 || keyCode === 74 || keyCode === 67))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+Option+U (Exibir Código-Fonte)
    if ((isCtrlOrCmd && (key === 'U' || keyCode === 85)) || (isCtrlOrCmd && isAlt && (key === 'U' || keyCode === 85))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Salvar página)
    if (isCtrlOrCmd && (key === 'S' || keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
})();

const routes={
home:{title:'Biazotto Gestão de Viagens e Milhas',description:'Gestão premium de viagens e milhas para quem valoriza tempo, conforto e praticidade.',html:`
<section class="hero"><div class="hero-content"><p class="eyebrow">Gestão de viagens e milhas</p><h1>Sua viagem começa com uma decisão bem cuidada.</h1><p>A Biazotto assume a estratégia, organiza os detalhes e acompanha cada etapa para que você aproveite melhor seu tempo, seus benefícios e sua viagem.</p><div class="actions"><a class="button" href="/contato/">Solicitar análise</a><a class="button secondary" href="/servicos/">Conheça a gestão</a></div></div><span class="hero-note">Tempo · conforto · praticidade</span></section>
<section class="section section-solucao"><div class="container"><div class="section-head"><div><p class="eyebrow">A solução</p><h2>Você escolhe o destino. Nós cuidamos do caminho.</h2></div><div><p>Viajar bem exige decisões coordenadas. A Biazotto analisa seu perfil, considera suas prioridades e conduz a estratégia de viagens e milhas com clareza.</p><div class="pills"><span class="pill">Gestão consultiva</span><span class="pill">Atendimento individual</span><span class="pill">Decisões com critério</span></div></div></div><div class="grid-3"><article class="card"><span class="num">01 · ESTRATÉGIA</span><h3>Uma visão completa antes de cada decisão</h3><p>Cartões, programas, preferências e planos de viagem considerados em conjunto.</p></article><article class="card"><span class="num">02 · EXECUÇÃO</span><h3>Do planejamento à emissão</h3><p>Alternativas apresentadas com condições claras para uma escolha segura.</p></article><article class="card"><span class="num">03 · ACOMPANHAMENTO</span><h3>Continuidade em cada etapa</h3><p>Uma gestão organizada para você não precisar acompanhar regras e oportunidades sozinho.</p></article></div></div></section>
<section class="section navy section-paraquem"><div class="container"><div class="section-head"><div><p class="eyebrow">Para quem é</p><h2>Feita para quem viaja muito e prefere delegar.</h2></div><p>Uma gestão pensada para quem viaja com frequência, movimenta o cartão o ano inteiro e não tem tempo (nem interesse) em acompanhar regra de programa, validade ou promoção.</p></div><div class="feature-list"><div class="feature"><b>01</b><div><h3>Volume que já existe</h3><p>Seu gasto mensal já sustentaria uma estratégia de pontos — só falta alguém cuidando dela.</p></div></div><div class="feature"><b>02</b><div><h3>Cartão parado sem estratégia</h3><p>Centurion, The One, Caixa Ícone, Aeternum, Unlimited, Altus Liv, Azul Infinite — se você carrega um desses sem um plano por trás, está deixando benefício na mesa.</p></div></div><div class="feature"><b>03</b><div><h3>Viagens recorrentes</h3><p>Suas decisões de viagem se repetem ao longo do ano — cada uma pede continuidade, não um planejamento isolado.</p></div></div><div class="feature"><b>04</b><div><h3>Quer delegar, não aprender</h3><p>Você não quer virar especialista em milhas. Quer alguém que resolva por você.</p></div></div></div></div></section>
<section class="split"><div class="split-image" role="img" aria-label="Terminal de aeroporto com luz natural"></div><div class="split-content"><p class="eyebrow">O que muda</p><h2>Menos decisões fragmentadas. Mais tranquilidade para viajar.</h2><p>Você deixa de acompanhar regras, validades e possibilidades isoladamente. A Biazotto organiza as informações e apresenta caminhos coerentes com sua realidade.</p><a class="text-link" href="/servicos/">Ver o que está incluído</a></div></section>
<section class="section off section-exemplo"><div class="container"><div class="section-head"><div><p class="eyebrow">Exemplo de aplicação</p><h2>Executiva emitida com pontos que já eram seus.</h2><p>Sem gastar do caixa, sem pesquisar tarifa manualmente.</p></div><p>Ilustrativo — condições variam conforme cartão, programa e disponibilidade no momento.</p></div></div></section>
<section class="section navy"><div class="container"><div class="section-head"><div><p class="eyebrow">Metodologia</p><h2>Um processo claro e contínuo.</h2></div><p>Cada etapa existe para transformar informações dispersas em decisões simples, com o próximo passo sempre visível.</p></div><div class="steps"><article class="step"><h3>Diagnóstico</h3><p>Entendemos seu perfil, recursos e prioridades.</p></article><article class="step"><h3>Estratégia</h3><p>Definimos critérios e possibilidades adequadas.</p></article><article class="step"><h3>Execução</h3><p>Conduzimos as escolhas autorizadas com cuidado.</p></article><article class="step"><h3>Acompanhamento</h3><p>Mantemos a gestão organizada ao longo do tempo.</p></article></div><a class="text-link" href="/como-funciona/">Conhecer o processo completo</a></div></section>
<section class="cta"><div class="cta-inner"><p class="eyebrow">Próximo passo</p><h2>Vamos entender como você viaja.</h2><p>Conte um pouco sobre sua rotina e suas prioridades. A conversa inicial ajuda a identificar como a gestão pode cuidar melhor das suas próximas viagens.</p><a class="button dark" href="/contato/">Solicitar análise</a></div></section>`},
sobre:{title:'A Biazotto | Gestão de Viagens e Milhas',description:'Conheça a visão, os princípios e a abordagem consultiva da Biazotto.',html:`<section class="page-hero"><div class="container"><p class="eyebrow">A Biazotto</p><h1>Gestão de viagens é cuidado estratégico.</h1><p>A Biazotto organiza decisões, recursos e preferências para tornar cada jornada mais simples, confortável e coerente com a vida do cliente.</p></div></section><section class="section"><div class="container"><p class="quote">Não ensinamos você a acompanhar cada programa. <strong>Assumimos a estratégia</strong> para que seu tempo continue onde mais importa.</p></div></section><section class="section navy section-sobre-visao"><div class="container"><div class="section-head"><div><p class="eyebrow">Nossa visão</p><h2>Viajar bem não deveria exigir improviso.</h2></div><p>Pontos, cartões, datas, regras e preferências formam um conjunto. Quando cada decisão é tomada isoladamente, tempo e oportunidades se perdem. Nossa abordagem reúne essas informações e as transforma em um plano claro.</p></div><div class="values"><article class="value"><h3>Discrição</h3><p>Comunicação sóbria e respeito à sua rotina.</p></article><article class="value"><h3>Precisão</h3><p>Condições e próximos passos apresentados com clareza.</p></article><article class="value"><h3>Cuidado</h3><p>Decisões alinhadas ao perfil de cada cliente.</p></article><article class="value"><h3>Consistência</h3><p>Acompanhamento que não termina na emissão.</p></article></div></div></section><section class="section section-sobre-abordagem"><div class="container"><div class="section-head"><div><p class="eyebrow">Nossa abordagem</p><h2>Consultiva no contato. Técnica na decisão.</h2></div><p>Você não precisa dominar termos de fidelidade nem comparar dezenas de possibilidades. Explicamos o que importa, apresentamos as condições e conduzimos o que for autorizado.</p></div><div class="grid-3"><article class="card"><span class="num">01</span><h3>Entender antes de propor</h3><p>Seu perfil, suas prioridades e seus planos orientam a estratégia.</p></article><article class="card"><span class="num">02</span><h3>Explicar sem complicar</h3><p>Informação suficiente para decidir, sem jargão desnecessário.</p></article><article class="card"><span class="num">03</span><h3>Cuidar do processo</h3><p>Organização e continuidade em todas as etapas combinadas.</p></article></div></div></section><section class="cta"><div class="cta-inner"><p class="eyebrow">Conversa inicial</p><h2>Conheça uma gestão pensada para a sua rotina.</h2><p>O primeiro passo é entender como você viaja e o que deseja delegar.</p><a class="button dark" href="/contato/">Falar com a Biazotto</a></div></section>`},
servicos:{title:'Serviços | Biazotto',description:'Conheça a gestão consultiva de viagens, pontos, milhas e benefícios da Biazotto.',html:`<section class="page-hero"><div class="container"><p class="eyebrow">Serviços</p><h1>Uma gestão completa, sem excesso de complexidade.</h1><p>Planejamento, análise e execução reunidos em um atendimento individual, com escopo definido de acordo com seu perfil.</p></div></section><section class="section"><div class="container"><div class="service-block"><div><p class="eyebrow">01 · Diagnóstico</p><h2>Organização do seu cenário atual</h2></div><ul><li>Entendimento do perfil de consumo e viagem</li><li>Mapeamento de cartões, programas, saldos e validades</li><li>Registro de destinos, preferências e prioridades</li><li>Identificação de pontos que precisam de atenção</li></ul></div><div class="service-block"><div><p class="eyebrow">02 · Estratégia</p><h2>Decisões alinhadas ao seu objetivo</h2></div><ul><li>Direcionamento para acúmulo e uso de pontos e milhas</li><li>Comparação entre pagamento em dinheiro e resgate</li><li>Planejamento das viagens futuras informadas</li><li>Apresentação clara das condições de cada alternativa</li></ul></div><div class="service-block"><div><p class="eyebrow">03 · Execução</p><h2>Apoio na jornada de viagem</h2></div><ul><li>Pesquisa e emissão conforme o escopo contratado</li><li>Organização das solicitações e confirmações</li><li>Apoio com itens complementares previamente combinados</li><li>Acompanhamento dos próximos passos</li></ul></div></div></section><section class="section navy section-head-center"><div class="container"><div class="section-head"><div><p class="eyebrow">O que não prometemos</p><h2>Clareza também significa reconhecer limites.</h2></div><p>Assentos em milhas, tarifas e regras mudam. A Biazotto analisa as condições disponíveis no momento e apresenta alternativas, sem promessas de disponibilidade ou economia garantida.</p></div></div></section><section class="section off section-head-center"><div class="container"><div class="section-head"><div><h2>Isso não é para quem quer aprender a fazer sozinho.</h2></div><p>Se o que você busca é entender programas de fidelidade e tomar as próprias decisões, esse não é o formato certo. A gestão existe para quem prefere que a parte técnica seja resolvida por outra pessoa.</p></div></div></section><section class="section navy section-head-center"><div class="container"><div class="section-head"><div><h2>Não somos uma agência.</h2></div><p>Uma agência resolve quando você pede. A gestão prevê, cuida e decide por você — o acompanhamento não termina na emissão, continua o ano inteiro.</p></div></div></section><section class="cta"><div class="cta-inner"><p class="eyebrow">Escopo personalizado</p><h2>Descubra o formato adequado para você.</h2><p>Na conversa inicial, identificamos suas necessidades e explicamos quais atividades podem fazer parte da gestão.</p><a class="button dark" href="/contato/">Solicitar análise</a></div></section>`},
processo:{title:'Como funciona | Biazotto',description:'Entenda o processo de gestão de viagens e milhas da Biazotto.',html:`<section class="page-hero"><div class="container"><p class="eyebrow">Como funciona</p><h1>Um processo simples de acompanhar e fácil de delegar.</h1><p>A gestão acompanha você o ano inteiro — não é um serviço pontual de emissão. Você participa das decisões essenciais; a organização técnica e o acompanhamento contínuo ficam com a Biazotto.</p></div></section><section class="section"><div class="container"><div class="timeline"><article class="timeline-item"><span class="timeline-num">01</span><div><h2>Conversa inicial</h2><p>Entendemos sua rotina, frequência de viagens, prioridades e o que você deseja delegar.</p></div></article><article class="timeline-item"><span class="timeline-num">02</span><div><h2>Diagnóstico</h2><p>Organizamos as informações relevantes sobre cartões, programas, saldos, validade e preferências.</p></div></article><article class="timeline-item"><span class="timeline-num">03</span><div><h2>Estratégia personalizada</h2><p>Definimos critérios de decisão e um plano coerente com os objetivos informados.</p></div></article><article class="timeline-item"><span class="timeline-num">04</span><div><h2>Solicitação de viagem</h2><p>Você informa destino, datas, passageiros e necessidades específicas.</p></div></article><article class="timeline-item"><span class="timeline-num">05</span><div><h2>Análise de alternativas</h2><p>Comparamos caminhos e apresentamos condições relevantes em linguagem clara.</p></div></article><article class="timeline-item"><span class="timeline-num">06</span><div><h2>Autorização e execução</h2><p>Após sua escolha, conduzimos as ações previstas no escopo contratado.</p></div></article><article class="timeline-item"><span class="timeline-num">07</span><div><h2>Acompanhamento</h2><p>Mantemos registros e próximos passos organizados para dar continuidade à gestão.</p></div></article></div></div></section><section class="section navy"><div class="container"><p class="quote">Você informa o que precisa e autoriza a escolha. <strong>A Biazotto organiza o caminho.</strong></p></div></section><section class="cta"><div class="cta-inner"><p class="eyebrow">Comece pelo diagnóstico</p><h2>Conte como você viaja hoje.</h2><p>Com essas informações, conseguimos orientar o próximo passo com clareza.</p><a class="button dark" href="/contato/">Iniciar conversa</a></div></section>`},
insights:{title:'Insights | Biazotto',description:'Conteúdos sobre gestão de viagens, pontos, milhas e decisões mais conscientes.',html:`<section class="page-hero"><div class="container"><p class="eyebrow">Insights</p><h1>Informação para decisões mais conscientes.</h1><p>Conteúdos claros sobre viagens, pontos, benefícios e planejamento.</p></div></section><section class="section"><div class="container"><div class="insights-empty"><img src="/assets/marca-quadrada.png" alt="" width="86" height="86"><h2>Novos conteúdos serão publicados em breve.</h2><p>Estamos preparando materiais objetivos para ajudar você a compreender as decisões que realmente importam.</p><a class="text-link" href="/contato/">Falar com a Biazotto</a></div></div></section>`},
privacidade:{title:'Política de Privacidade | Biazotto',description:'Saiba como a Biazotto trata os dados enviados pelo site.',html:`<section class="page-hero"><div class="container"><p class="eyebrow">Informações legais</p><h1>Política de Privacidade</h1><p>Transparência sobre as informações enviadas neste site.</p></div></section><section class="section"><article class="container legal"><h2>1. Dados coletados</h2><p>O formulário pode coletar nome, telefone, e-mail, frequência aproximada de viagens, objetivo do contato e mensagem opcional.</p><h2>2. Finalidade</h2><p>As informações são usadas para responder à solicitação, entender o perfil inicial e organizar o contato comercial solicitado por você.</p><h2>3. Compartilhamento</h2><p>Os dados não devem ser vendidos. Fornecedores técnicos podem processá-los apenas quando necessários ao funcionamento do site e do atendimento, mediante medidas adequadas de proteção.</p><h2>4. Retenção e segurança</h2><p>As informações devem ser mantidas apenas pelo período necessário às finalidades informadas e protegidas por controles técnicos e organizacionais proporcionais.</p><h2>5. Seus direitos</h2><p>Você pode solicitar confirmação, acesso, correção, informação sobre compartilhamento, revogação de consentimento e exclusão, nos termos da LGPD.</p><h2>6. Contato</h2><p>Para dúvidas sobre privacidade, utilize o formulário de contato oficial da Biazotto.</p></article></section>`},
termos:{title:'Termos de Uso | Biazotto',description:'Condições de uso do site da Biazotto Gestão de Viagens e Milhas.',html:`<section class="page-hero"><div class="container"><p class="eyebrow">Informações legais</p><h1>Termos de Uso</h1><p>Condições gerais para navegação e contato por este site.</p></div></section><section class="section"><article class="container legal"><h2>1. Finalidade do site</h2><p>O site apresenta informações institucionais sobre a Biazotto Gestão de Viagens e Milhas e oferece um canal inicial de contato.</p><h2>2. Informações e disponibilidade</h2><p>Conteúdos têm caráter informativo. Tarifas, assentos, regras de programas e demais condições de viagem podem mudar e não constituem garantia de disponibilidade.</p><h2>3. Uso permitido</h2><p>O visitante deve usar o site de forma lícita, sem tentar prejudicar sua segurança, disponibilidade ou integridade.</p><h2>4. Propriedade intelectual</h2><p>A marca, o design e os conteúdos pertencem aos seus respectivos titulares e não podem ser reproduzidos sem autorização.</p><h2>5. Alterações</h2><p>Estes termos podem ser atualizados para refletir mudanças no site, nos serviços ou na legislação aplicável.</p></article></section>`},
notFound:{title:'Página não encontrada | Biazotto',description:'A página solicitada não foi encontrada.',html:`<section class="page-hero"><div class="container"><p class="eyebrow">Erro 404</p><h1>Este caminho não foi encontrado.</h1><p>Use a navegação para continuar ou volte à página inicial.</p><div class="actions" style="margin-top:2rem"><a class="button" href="/">Voltar ao início</a></div></div></section>`}
};
function currentRoute(pathname = location.pathname){const p=pathname.replace(/\/+$/,'')||'/';return p==='/'?'home':p==='/sobre'?'sobre':p==='/servicos'?'servicos':p==='/como-funciona'?'processo':p==='/insights'?'insights':p==='/contato'?'contato':p==='/privacidade'?'privacidade':p==='/termos'?'termos':'notFound'}

const header = document.getElementById('header');
const menu = document.getElementById('mainNav');
const menuButton = document.getElementById('menuButton');
const conteudo = document.getElementById('conteudo');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Atualiza o estado do header ao rolar
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 40), { passive: true });

// Menu Mobile
menuButton.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
});
addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
});

// Scroll Reveal com IntersectionObserver
let revealObserver = null;
function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined') return;
  if (revealObserver) revealObserver.disconnect();

  const elements = conteudo.querySelectorAll(
    '.card, .step, .feature, .timeline-item, .service-block, .value, .section-head, .quote, .split-content, .split-image'
  );

  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  elements.forEach(el => {
    el.classList.add('reveal-item');
    const parent = el.closest('.grid-3, .steps, .feature-list, .values');
    if (parent) {
      const idx = Array.from(parent.children).indexOf(el);
      if (idx > 0) {
        el.style.transitionDelay = `${idx * 0.08}s`;
      }
    }
    revealObserver.observe(el);
  });
}

// ===================================================
// Modal de Qualificação em 2 Etapas (substitui /contato/)
// ===================================================
const CONTACT_WA = '5519989730348';
let contactModalReady = false;
const contactData = { nome: '', fone: '', gasto: '', viagens: '' };

function maskPhone(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!d.length) return '';
  if (d.length <= 2) return '(' + d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function cmShow(step) {
  document.querySelectorAll('#cmodalOverlay .cmodal-step').forEach(el => {
    el.hidden = Number(el.dataset.step) !== step;
  });
}

function cmClose() {
  const overlay = document.getElementById('cmodalOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cmodal-open');
  document.documentElement.style.overflow = '';
}

function cmSetError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  if (msg) { el.textContent = msg; el.hidden = false; }
  else { el.hidden = true; }
}

function initContactModal() {
  if (contactModalReady) return;
  contactModalReady = true;

  const overlay = document.createElement('div');
  overlay.className = 'cmodal-overlay';
  overlay.id = 'cmodalOverlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="cmodal" role="dialog" aria-modal="true" aria-labelledby="cmodalTitle">
      <button type="button" class="cmodal-close" id="cmCloseBtn" aria-label="Fechar">✕</button>
      <div class="cmodal-step" data-step="1">
        <p class="eyebrow">Análise estratégica</p>
        <h3 id="cmodalTitle">Solicite sua análise estratégica</h3>
        <div class="cfield">
          <label for="cmNome">Nome completo</label>
          <input type="text" id="cmNome" autocomplete="name" placeholder="Seu nome completo">
        </div>
        <div class="cfield">
          <label for="cmFone">WhatsApp</label>
          <input type="tel" id="cmFone" inputmode="numeric" autocomplete="tel" placeholder="(00) 00000-0000" maxlength="15">
        </div>
        <p class="cfield-error" id="cmErr1" hidden></p>
        <button type="button" class="button cmodal-cta" id="cmNext">Continuar →</button>
        <p class="cmodal-foot">Sem compromisso • Análise personalizada • Resposta em até 24h</p>
      </div>
      <div class="cmodal-step" data-step="2" hidden>
        <button type="button" class="cmodal-back" id="cmBack">← Voltar</button>
        <h3>Seu perfil de viagens</h3>
        <p class="cgroup-label">Gasto mensal no cartão de crédito</p>
        <div class="coptions" id="cmGasto">
          <button type="button" class="copt">Até R$ 15.000</button>
          <button type="button" class="copt">R$ 15.000 a R$ 30.000</button>
          <button type="button" class="copt">R$ 30.000 a R$ 50.000</button>
          <button type="button" class="copt">Acima de R$ 50.000</button>
        </div>
        <p class="cgroup-label">Quantidade de viagens por ano</p>
        <div class="coptions" id="cmViagens">
          <button type="button" class="copt">No máximo 3 viagens</button>
          <button type="button" class="copt">4 a 6 viagens</button>
          <button type="button" class="copt">Mais de 6 viagens</button>
        </div>
        <p class="cfield-error" id="cmErr2" hidden></p>
        <button type="button" class="button cmodal-cta" id="cmSubmit">Solicitar análise →</button>
      </div>
      <div class="cmodal-step" data-step="3" hidden>
        <div class="cmodal-done-icon">✓</div>
        <h3>Quase lá!</h3>
        <p class="cmodal-done-text">Abrindo o WhatsApp para você confirmar o envio. Se a janela não abrir, verifique o bloqueador de pop-ups do navegador.</p>
        <button type="button" class="button secondary cmodal-cta" id="cmDone">Fechar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const foneInput = document.getElementById('cmFone');
  foneInput.addEventListener('input', () => { foneInput.value = maskPhone(foneInput.value); });

  document.getElementById('cmCloseBtn').addEventListener('click', cmClose);
  document.getElementById('cmDone').addEventListener('click', cmClose);
  overlay.addEventListener('click', e => { if (e.target === overlay) cmClose(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) cmClose();
  });

  document.getElementById('cmBack').addEventListener('click', () => cmShow(1));

  document.getElementById('cmNext').addEventListener('click', () => {
    const nome = document.getElementById('cmNome').value.trim();
    const foneDigits = foneInput.value.replace(/\D/g, '');
    if (nome.length < 3) {
      cmSetError('cmErr1', 'Informe seu nome completo.');
      return;
    }
    if (foneDigits.length < 10 || foneDigits.length > 11) {
      cmSetError('cmErr1', 'Informe um WhatsApp válido com DDD.');
      return;
    }
    cmSetError('cmErr1', null);
    contactData.nome = nome;
    contactData.fone = foneInput.value;
    cmShow(2);
  });

  overlay.querySelectorAll('.coptions').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.copt');
      if (!btn) return;
      group.querySelectorAll('.copt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      contactData[group.id === 'cmGasto' ? 'gasto' : 'viagens'] = btn.textContent.trim();
      cmSetError('cmErr2', null);
    });
  });

  document.getElementById('cmSubmit').addEventListener('click', () => {
    if (!contactData.gasto) {
      cmSetError('cmErr2', 'Selecione o gasto mensal no cartão.');
      return;
    }
    if (!contactData.viagens) {
      cmSetError('cmErr2', 'Selecione a quantidade de viagens por ano.');
      return;
    }
    cmSetError('cmErr2', null);
    const msg = [
      'Olá! Vim pelo site da Biazotto e quero solicitar uma análise.',
      '',
      `Nome: ${contactData.nome}`,
      `WhatsApp: ${contactData.fone}`,
      `Gasto mensal no cartão: ${contactData.gasto}`,
      `Viagens por ano: ${contactData.viagens}`
    ].join('\n');
    window.open(`https://wa.me/${CONTACT_WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    cmShow(3);
    contactData.gasto = '';
    contactData.viagens = '';
    overlay.querySelectorAll('.copt.selected').forEach(b => b.classList.remove('selected'));
  });
}

function openContactModal() {
  initContactModal();
  cmShow(1);
  const overlay = document.getElementById('cmodalOverlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cmodal-open');
  document.documentElement.style.overflow = 'hidden';
  setTimeout(() => { document.getElementById('cmNome')?.focus(); }, 80);
}

// Renderizador com Transição Suave entre Páginas (SPA)
function renderPage(pathname, updateHistory = true) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const key = currentRoute(cleanPath);
  const page = routes[key] || routes.notFound;

  if (updateHistory && location.pathname.replace(/\/+$/, '') !== cleanPath) {
    history.pushState({ path: pathname }, page.title, pathname);
  }

  conteudo.classList.add('page-transitioning');

  setTimeout(() => {
    document.title = page.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = page.description;

    conteudo.innerHTML = page.html;

    if (key !== 'home') {
      header.classList.add('inner');
    } else {
      header.classList.remove('inner');
    }

    // Atualiza links ativos
    document.querySelectorAll('.main-nav a').forEach(a => {
      try {
        const aPath = new URL(a.href, location.origin).pathname.replace(/\/+$/, '') || '/';
        if (aPath === cleanPath) {
          a.setAttribute('aria-current', 'page');
        } else {
          a.removeAttribute('aria-current');
        }
      } catch (err) {}
    });

    initContactModal();
    window.scrollTo({ top: 0, behavior: 'instant' });
    initScrollReveal();

    requestAnimationFrame(() => {
      conteudo.classList.remove('page-transitioning');
    });
  }, 140);
}

// Intercepta cliques para navegação SPA instantânea e suave
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href) return;

  // Trata apenas links internos do site
  if (href.startsWith('/') && !href.startsWith('//') && !link.hasAttribute('download') && link.target !== '_blank') {
    e.preventDefault();
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');

    // Página /contato/ foi substituída pelo modal de qualificação
    if (href === '/contato/' || href === '/contato') {
      openContactModal();
      return;
    }

    renderPage(href, true);
  }
});

// Suporte aos botões Voltar / Avançar do navegador
window.addEventListener('popstate', () => {
  renderPage(location.pathname, false);
});

// Carga inicial
const initialKey = currentRoute();
const initialPage = routes[initialKey];
document.title = initialPage.title;
const initialMeta = document.querySelector('meta[name="description"]');
if (initialMeta) initialMeta.content = initialPage.description;
conteudo.innerHTML = initialPage.html;
if (initialKey !== 'home') header.classList.add('inner');
document.querySelectorAll('.main-nav a').forEach(a => {
  try {
    if (new URL(a.href, location.origin).pathname.replace(/\/+$/, '') === location.pathname.replace(/\/+$/, '')) {
      a.setAttribute('aria-current', 'page');
    }
  } catch (err) {}
});
initContactModal();
initScrollReveal();

// Carregamento dinâmico e sincronização de conteúdo publicado pelo CMS no servidor
async function syncPublishedContent() {
  try {
    const res = await fetch('/api/content/published');
    if (!res.ok) return;
    const json = await res.json();
    if (!json.success || !json.data || !json.data.pages) return;

    const pageMap = {
      '/': 'home',
      '/sobre/': 'sobre',
      '/servicos/': 'servicos',
      '/como-funciona/': 'processo',
      '/insights/': 'insights',
      '/privacidade/': 'privacidade',
      '/termos/': 'termos'
    };

    for (const p of json.data.pages) {
      const rKey = pageMap[p.slug] || (p.slug === '/' ? 'home' : p.slug.replace(/\//g, ''));
      if (routes[rKey]) {
        if (p.title) routes[rKey].title = p.title;
        if (p.meta_description) routes[rKey].description = p.meta_description;
        if (currentRoute() === rKey) {
          document.title = routes[rKey].title;
          const m = document.querySelector('meta[name="description"]');
          if (m) m.content = routes[rKey].description;
        }
      }
    }
  } catch (err) {
    // Resiliente a offline / fallback local
  }
}
syncPublishedContent();

// Progressive Web App Setup
(function initPWA() {
  // 1. Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then(function(reg) {
          console.log('[PWA] Service Worker registrado no escopo:', reg.scope);
        })
        .catch(function(err) {
          console.error('[PWA] Erro ao registrar Service Worker:', err);
        });
    });
  }

  // 2. Estado de instalação
  let deferredPrompt = null;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // 3. Captura do evento de instalação (Chrome, Edge, Android, Desktop)
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;

    // Se já instalado ou descartado na sessão atual, não exibe banner automático
    if (isStandalone || sessionStorage.getItem('pwa_prompt_dismissed')) {
      return;
    }

    showInstallBanner();
  });

  // Função para criar o banner elegante de instalação
  function showInstallBanner(forIos = false) {
    if (document.getElementById('pwa-install-banner') || isStandalone) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Instalar aplicativo');

    let actionContent = '';
    if (forIos) {
      actionContent = `
        <div class="pwa-ios-instructions">
          Para instalar no iPhone/iPad: toque em <strong>Compartilhar</strong> (ícone com seta para cima) e selecione <strong>"Adicionar à Tela de Início"</strong>.
        </div>
        <div class="pwa-banner-actions" style="margin-top:.5rem;">
          <button class="pwa-btn-dismiss" id="pwa-dismiss-btn">Entendi</button>
        </div>
      `;
    } else {
      actionContent = `
        <div class="pwa-banner-actions">
          <button class="pwa-btn-dismiss" id="pwa-dismiss-btn">Depois</button>
          <button class="pwa-btn-install" id="pwa-install-btn">Instalar App</button>
        </div>
      `;
    }

    banner.innerHTML = `
      <div class="pwa-banner-content">
        <img src="/assets/icon-192.png" alt="Biazotto" class="pwa-banner-icon" width="48" height="48">
        <div class="pwa-banner-text">
          <strong>Instalar Biazotto</strong>
          <p>Tenha acesso rápido, exclusivo e offline em qualquer dispositivo.</p>
        </div>
      </div>
      ${actionContent}
    `;

    document.body.appendChild(banner);

    if (!forIos) {
      document.getElementById('pwa-install-btn')?.addEventListener('click', async function() {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            console.log('[PWA] Aplicativo instalado pelo usuário');
          }
          deferredPrompt = null;
        }
        banner.remove();
      });
    }

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', function() {
      sessionStorage.setItem('pwa_prompt_dismissed', 'true');
      banner.remove();
    });
  }

  // 4. Adiciona link "Instalar App" no rodapé de informações
  window.addEventListener('DOMContentLoaded', function() {
    const footerInfo = document.querySelector('.footer div:nth-child(3)');
    if (footerInfo && !isStandalone) {
      const installLink = document.createElement('a');
      installLink.href = '#install';
      installLink.textContent = '📱 Instalar Aplicativo';
      installLink.style.cursor = 'pointer';
      installLink.style.color = 'var(--gold)';
      installLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (deferredPrompt) {
          deferredPrompt.prompt();
        } else if (isIos) {
          showInstallBanner(true);
        } else {
          showInstallBanner(false);
          // Se o navegador ainda não disparou beforeinstallprompt (ou não suporta)
          if (!deferredPrompt) {
            alert('Para instalar, use a opção "Instalar aplicativo" ou "Adicionar à tela inicial" no menu do seu navegador (três pontos ou menu superior).');
          }
        }
      });
      footerInfo.appendChild(installLink);
    }
  });

  // Notificação de instalação bem-sucedida
  window.addEventListener('appinstalled', function() {
    console.log('[PWA] Biazotto instalado com sucesso no dispositivo!');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  });
})();

