export function renderSection(sec) {
  const bgClass = sec.background_style === 'navy' ? ' navy' : sec.background_style === 'off' ? ' off' : '';
  const blocks = sec.blocks || [];
  const getBlock = (key) => blocks.find(b => b.block_key === key)?.content || {};

  switch (sec.section_type) {
    case 'hero': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const b1 = getBlock('cta_primary');
      const b2 = getBlock('cta_secondary');
      const note = getBlock('hero_note').text || '';
      return `<section class="hero"><div class="hero-content"><p class="eyebrow">${eb}</p><h1>${title}</h1><p>${desc}</p><div class="actions"><a class="button" href="${b1.url || '/contato/'}">${b1.text || 'Solicitar análise'}</a><a class="button secondary" href="${b2.url || '/servicos/'}">${b2.text || 'Conheça a gestão'}</a></div></div><span class="hero-note">${note}</span></section>`;
    }

    case 'cards_grid': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const cards = blocks.filter(b => b.block_type === 'card').map(c => {
        const d = c.content || {};
        return `<article class="card"><span class="num">${d.num || ''}</span><h3>${d.title || ''}</h3><p>${d.text || ''}</p></article>`;
      }).join('');
      return `<section class="section${bgClass}"><div class="container"><div class="section-head"><div><p class="eyebrow">${eb}</p><h2>${title}</h2></div><div><p>${desc}</p><div class="pills"><span class="pill">Gestão consultiva</span><span class="pill">Atendimento individual</span><span class="pill">Decisões com critério</span></div></div></div><div class="grid-3">${cards}</div></div></section>`;
    }

    case 'features': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const feats = blocks.filter(b => b.block_type === 'feature').map(f => {
        const d = f.content || {};
        return `<div class="feature"><b>${d.num || ''}</b><div><h3>${d.title || ''}</h3><p>${d.text || ''}</p></div></div>`;
      }).join('');
      return `<section class="section${bgClass}"><div class="container"><div class="section-head"><div><p class="eyebrow">${eb}</p><h2>${title}</h2></div><p>${desc}</p></div><div class="feature-list">${feats}</div></div></section>`;
    }

    case 'split': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const link = getBlock('link');
      const img = getBlock('image');
      return `<section class="split"><div class="split-image" role="img" aria-label="${img.alt || 'Terminal de aeroporto'}"></div><div class="split-content"><p class="eyebrow">${eb}</p><h2>${title}</h2><p>${desc}</p><a class="text-link" href="${link.url || '/servicos/'}">${link.text || 'Ver o que está incluído'}</a></div></section>`;
    }

    case 'steps': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const link = getBlock('link');
      const steps = blocks.filter(b => b.block_type === 'step').map(s => {
        const d = s.content || {};
        return `<article class="step"><h3>${d.title || ''}</h3><p>${d.text || ''}</p></article>`;
      }).join('');
      return `<section class="section${bgClass}"><div class="container"><div class="section-head"><div><p class="eyebrow">${eb}</p><h2>${title}</h2></div><p>${desc}</p></div><div class="steps">${steps}</div><a class="text-link" href="${link.url || '/como-funciona/'}">${link.text || 'Conhecer o processo completo'}</a></div></section>`;
    }

    case 'cta': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const btn = getBlock('button');
      return `<section class="cta"><div class="cta-inner"><p class="eyebrow">${eb}</p><h2>${title}</h2><p>${desc}</p><a class="button dark" href="${btn.url || '/contato/'}">${btn.text || 'Solicitar análise'}</a></div></section>`;
    }

    case 'page_hero': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      return `<section class="page-hero"><div class="container"><p class="eyebrow">${eb}</p><h1>${title}</h1><p>${desc}</p></div></section>`;
    }

    case 'quote': {
      const q = getBlock('quote').html || getBlock('quote').text || '';
      return `<section class="section${bgClass}"><div class="container"><p class="quote">${q}</p></div></section>`;
    }

    case 'values': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const vals = blocks.filter(b => b.block_type === 'value').map(v => {
        const d = v.content || {};
        return `<article class="value"><h3>${d.title || ''}</h3><p>${d.text || ''}</p></article>`;
      }).join('');
      return `<section class="section${bgClass}"><div class="container"><div class="section-head"><div><p class="eyebrow">${eb}</p><h2>${title}</h2></div><p>${desc}</p></div><div class="values">${vals}</div></div></section>`;
    }

    case 'service_block': {
      const items = blocks.filter(b => b.block_type === 'service').map(s => {
        const d = s.content || {};
        const lis = (d.items || []).map(it => `<li>${it}</li>`).join('');
        return `<div class="service-block"><div><p class="eyebrow">${d.eyebrow || ''}</p><h2>${d.title || ''}</h2></div><ul>${lis}</ul></div>`;
      }).join('');
      return `<section class="section${bgClass}"><div class="container">${items}</div></section>`;
    }

    case 'disclaimer': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      return `<section class="section${bgClass}"><div class="container"><div class="section-head"><div><p class="eyebrow">${eb}</p><h2>${title}</h2></div><p>${desc}</p></div></div></section>`;
    }

    case 'timeline': {
      const items = blocks.filter(b => b.block_type === 'timeline_item').map(t => {
        const d = t.content || {};
        return `<article class="timeline-item"><span class="timeline-num">${d.num || ''}</span><div><h2>${d.title || ''}</h2><p>${d.text || ''}</p></div></article>`;
      }).join('');
      return `<section class="section${bgClass}"><div class="container"><div class="timeline">${items}</div></div></section>`;
    }

    case 'insights_empty': {
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      const link = getBlock('link');
      return `<section class="section"><div class="container"><div class="insights-empty"><img src="/assets/marca-quadrada.png" alt="" width="86" height="86"><h2>${title}</h2><p>${desc}</p><a class="text-link" href="${link.url || '/contato/'}">${link.text || 'Falar com a Biazotto'}</a></div></div></section>`;
    }

    case 'contact_form': {
      const eb = getBlock('eyebrow').text || '';
      const title = getBlock('title').text || '';
      const desc = getBlock('description').text || '';
      return `<section class="section"><div class="container form-wrap"><div class="form-intro"><p class="eyebrow">${eb}</p><h2>${title}</h2><p>${desc}</p><div class="pills"><span class="pill">Informações protegidas</span><span class="pill">Atendimento individual</span></div></div><form class="form" id="contactForm"><div class="field"><label for="name">Nome</label><input id="name" name="name" autocomplete="name" required></div><div class="field"><label for="phone">WhatsApp com DDD</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" required></div><div class="field full"><label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="email" required></div><div class="field"><label for="frequency">Frequência de viagens</label><select id="frequency" name="frequency" required><option value="">Selecione</option><option>1 a 2 por ano</option><option>3 a 5 por ano</option><option>6 ou mais por ano</option></select></div><div class="field"><label for="goal">Objetivo principal</label><select id="goal" name="goal" required><option value="">Selecione</option><option>Organizar pontos e milhas</option><option>Planejar próximas viagens</option><option>Delegar a gestão completa</option><option>Entender possibilidades</option></select></div><div class="field full"><label for="message">Mensagem opcional</label><textarea id="message" name="message" placeholder="Conte brevemente o que você precisa."></textarea></div><label class="check field full"><input type="checkbox" required> <span>Concordo com o uso dos dados para retorno deste contato, conforme a <a href="/privacidade/"><u>Política de Privacidade</u></a>.</span></label><div class="field full"><button class="button dark" type="submit">Preparar solicitação</button></div><p class="form-status" id="formStatus" role="status" aria-live="polite"></p></form></div></section>`;
    }

    case 'legal_doc': {
      const title = getBlock('title').text || '';
      const intro = getBlock('intro').text || '';
      let articles = '';
      for (const b of blocks) {
        if (b.block_type === 'section_item') {
          const d = b.content || {};
          articles += `<h2>${d.heading || ''}</h2><p>${d.body || ''}</p>`;
        }
      }
      return `<section class="section"><article class="container legal">${articles}</article></section>`;
    }

    default: {
      // Generic fallback
      const inner = blocks.map(b => `<p>${b.content?.text || ''}</p>`).join('');
      return `<section class="section${bgClass}"><div class="container">${inner}</div></section>`;
    }
  }
}

export function renderPageSections(sections) {
  return (sections || []).map(renderSection).join('\n');
}
