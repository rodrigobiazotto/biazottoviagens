// Migração Automática e Idempotente de Conteúdo para o Banco de Dados
import { db } from './db.js';
import crypto from 'node:crypto';

export async function seedInitialContent() {
  const existingPages = await db.all('SELECT id FROM pages LIMIT 1');
  if (existingPages && existingPages.length > 0) {
    return; // Já populado, mantém idempotência
  }

  const now = Date.now();

  // 1. Configurações Globais do Site
  const settings = [
    { key: 'brand_name', value: { text: 'Biazotto Gestão de Viagens e Milhas' } },
    { key: 'tagline', value: { text: 'Estratégia e cuidado para você aproveitar melhor cada viagem.' } },
    { key: 'contact_whatsapp', value: { text: '(19) 98973-0348', raw: '19989730348' } },
    { key: 'contact_email', value: { text: 'contato@biazottoviagens.com.br' } },
    { key: 'contact_instagram', value: { text: '@biazottoviagens', url: 'https://instagram.com/biazottoviagens' } },
    { key: 'copyright', value: { text: 'Biazotto Gestão de Viagens e Milhas. Todos os direitos reservados.' } }
  ];

  for (const s of settings) {
    await db.run(
      'INSERT OR REPLACE INTO site_settings (key, value_json, updated_at, updated_by) VALUES (?, ?, ?, ?)',
      [s.key, JSON.stringify(s.value), now, 'system_seed']
    );
  }

  // 2. Itens de Navegação (Menus)
  const navItems = [
    // Header
    { id: 'nav-header-1', menu_location: 'header', label: 'Início', url: '/', target: '_self', order_index: 0, is_cta: 0, is_visible: 1 },
    { id: 'nav-header-2', menu_location: 'header', label: 'A Biazotto', url: '/sobre/', target: '_self', order_index: 1, is_cta: 0, is_visible: 1 },
    { id: 'nav-header-3', menu_location: 'header', label: 'Serviços', url: '/servicos/', target: '_self', order_index: 2, is_cta: 0, is_visible: 1 },
    { id: 'nav-header-4', menu_location: 'header', label: 'Como funciona', url: '/como-funciona/', target: '_self', order_index: 3, is_cta: 0, is_visible: 1 },
    { id: 'nav-header-5', menu_location: 'header', label: 'Insights', url: '/insights/', target: '_self', order_index: 4, is_cta: 0, is_visible: 1 },
    { id: 'nav-header-6', menu_location: 'header', label: 'Solicitar análise', url: '/contato/', target: '_self', order_index: 5, is_cta: 1, is_visible: 1 },
    // Footer Navegação
    { id: 'nav-footer-1', menu_location: 'footer_nav', label: 'A Biazotto', url: '/sobre/', target: '_self', order_index: 0, is_cta: 0, is_visible: 1 },
    { id: 'nav-footer-2', menu_location: 'footer_nav', label: 'Serviços', url: '/servicos/', target: '_self', order_index: 1, is_cta: 0, is_visible: 1 },
    { id: 'nav-footer-3', menu_location: 'footer_nav', label: 'Como funciona', url: '/como-funciona/', target: '_self', order_index: 2, is_cta: 0, is_visible: 1 },
    { id: 'nav-footer-4', menu_location: 'footer_nav', label: 'Insights', url: '/insights/', target: '_self', order_index: 3, is_cta: 0, is_visible: 1 },
    // Footer Informações
    { id: 'nav-footer-5', menu_location: 'footer_info', label: 'Contato', url: '/contato/', target: '_self', order_index: 0, is_cta: 0, is_visible: 1 },
    { id: 'nav-footer-6', menu_location: 'footer_info', label: 'Privacidade', url: '/privacidade/', target: '_self', order_index: 1, is_cta: 0, is_visible: 1 },
    { id: 'nav-footer-7', menu_location: 'footer_info', label: 'Termos de uso', url: '/termos/', target: '_self', order_index: 2, is_cta: 0, is_visible: 1 }
  ];

  for (const n of navItems) {
    await db.run(
      'INSERT INTO navigation_items (id, menu_location, label, url, target, order_index, is_cta, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [n.id, n.menu_location, n.label, n.url, n.target, n.order_index, n.is_cta, n.is_visible]
    );
  }

  // 3. Estrutura Completa de Páginas, Seções e Blocos
  const pagesData = [
    {
      id: 'page-home',
      slug: '/',
      title: 'Biazotto Gestão de Viagens e Milhas',
      meta_description: 'Gestão premium de viagens e milhas para quem valoriza tempo, conforto e praticidade.',
      order_index: 0,
      sections: [
        {
          id: 'sec-home-hero',
          section_key: 'hero',
          section_type: 'hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-h-hero-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Gestão de viagens e milhas' }, order_index: 0 },
            { id: 'blk-h-hero-title', block_key: 'title', block_type: 'heading', content: { text: 'Sua viagem começa com uma decisão bem cuidada.' }, order_index: 1 },
            { id: 'blk-h-hero-desc', block_key: 'description', block_type: 'text', content: { text: 'A Biazotto assume a estratégia, organiza os detalhes e acompanha cada etapa para que você aproveite melhor seu tempo, seus benefícios e sua viagem.' }, order_index: 2 },
            { id: 'blk-h-hero-btn1', block_key: 'cta_primary', block_type: 'button', content: { text: 'Solicitar análise', url: '/contato/', style: 'gold' }, order_index: 3 },
            { id: 'blk-h-hero-btn2', block_key: 'cta_secondary', block_type: 'button', content: { text: 'Conheça a gestão', url: '/servicos/', style: 'secondary' }, order_index: 4 },
            { id: 'blk-h-hero-note', block_key: 'hero_note', block_type: 'text', content: { text: 'Tempo · conforto · praticidade' }, order_index: 5 }
          ]
        },
        {
          id: 'sec-home-solucao',
          section_key: 'solucao',
          section_type: 'cards_grid',
          background_style: 'white',
          order_index: 1,
          blocks: [
            { id: 'blk-h-sol-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'A solução' }, order_index: 0 },
            { id: 'blk-h-sol-title', block_key: 'title', block_type: 'heading', content: { text: 'Você escolhe o destino. Nós cuidamos do caminho.' }, order_index: 1 },
            { id: 'blk-h-sol-desc', block_key: 'description', block_type: 'text', content: { text: 'Viajar bem exige decisões coordenadas. A Biazotto analisa seu perfil, considera suas prioridades e conduz a estratégia de viagens e milhas com clareza.' }, order_index: 2 },
            { id: 'blk-h-sol-card1', block_key: 'card_1', block_type: 'card', content: { num: '01 · ESTRATÉGIA', title: 'Uma visão completa antes de cada decisão', text: 'Cartões, programas, preferências e planos de viagem considerados em conjunto.' }, order_index: 3 },
            { id: 'blk-h-sol-card2', block_key: 'card_2', block_type: 'card', content: { num: '02 · EXECUÇÃO', title: 'Do planejamento à emissão', text: 'Alternativas apresentadas com condições claras para uma escolha segura.' }, order_index: 4 },
            { id: 'blk-h-sol-card3', block_key: 'card_3', block_type: 'card', content: { num: '03 · ACOMPANHAMENTO', title: 'Continuidade em cada etapa', text: 'Uma gestão organizada para você não precisar acompanhar regras e oportunidades sozinho.' }, order_index: 5 }
          ]
        },
        {
          id: 'sec-home-paraquem',
          section_key: 'paraquem',
          section_type: 'features',
          background_style: 'off',
          order_index: 2,
          blocks: [
            { id: 'blk-h-pq-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Para quem é' }, order_index: 0 },
            { id: 'blk-h-pq-title', block_key: 'title', block_type: 'heading', content: { text: 'Feita para quem prefere delegar com confiança.' }, order_index: 1 },
            { id: 'blk-h-pq-desc', block_key: 'description', block_type: 'text', content: { text: 'Uma gestão pensada para pessoas e famílias que viajam com regularidade, têm uma rotina intensa e valorizam conforto sem abrir mão de decisões responsáveis.' }, order_index: 2 },
            { id: 'blk-h-pq-f1', block_key: 'feat_1', block_type: 'feature', content: { num: '01', title: 'Agenda cheia', text: 'Você quer preservar tempo e não pesquisar cada regra ou tarifa.' }, order_index: 3 },
            { id: 'blk-h-pq-f2', block_key: 'feat_2', block_type: 'feature', content: { num: '02', title: 'Viagens recorrentes', text: 'Suas escolhas precisam considerar preferências e planos ao longo do tempo.' }, order_index: 4 },
            { id: 'blk-h-pq-f3', block_key: 'feat_3', block_type: 'feature', content: { num: '03', title: 'Pontos e benefícios', text: 'Você já possui recursos, mas quer aproveitá-los com mais clareza.' }, order_index: 5 },
            { id: 'blk-h-pq-f4', block_key: 'feat_4', block_type: 'feature', content: { num: '04', title: 'Cuidado individual', text: 'Você prefere conversar com quem conhece seu perfil e suas prioridades.' }, order_index: 6 }
          ]
        },
        {
          id: 'sec-home-split',
          section_key: 'split',
          section_type: 'split',
          background_style: 'white',
          order_index: 3,
          blocks: [
            { id: 'blk-h-sp-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'O que muda' }, order_index: 0 },
            { id: 'blk-h-sp-title', block_key: 'title', block_type: 'heading', content: { text: 'Menos decisões fragmentadas. Mais tranquilidade para viajar.' }, order_index: 1 },
            { id: 'blk-h-sp-desc', block_key: 'description', block_type: 'text', content: { text: 'Você deixa de acompanhar regras, validades e possibilidades isoladamente. A Biazotto organiza as informações e apresenta caminhos coerentes com sua realidade.' }, order_index: 2 },
            { id: 'blk-h-sp-link', block_key: 'link', block_type: 'button', content: { text: 'Ver o que está incluído', url: '/servicos/', style: 'text-link' }, order_index: 3 },
            { id: 'blk-h-sp-image', block_key: 'image', block_type: 'image', content: { src: '/assets/hero.webp', alt: 'Terminal de aeroporto com luz natural' }, order_index: 4 }
          ]
        },
        {
          id: 'sec-home-metodologia',
          section_key: 'metodologia',
          section_type: 'steps',
          background_style: 'navy',
          order_index: 4,
          blocks: [
            { id: 'blk-h-met-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Metodologia' }, order_index: 0 },
            { id: 'blk-h-met-title', block_key: 'title', block_type: 'heading', content: { text: 'Um processo claro e contínuo.' }, order_index: 1 },
            { id: 'blk-h-met-desc', block_key: 'description', block_type: 'text', content: { text: 'Cada etapa existe para transformar informações dispersas em decisões simples, com o próximo passo sempre visível.' }, order_index: 2 },
            { id: 'blk-h-met-s1', block_key: 'step_1', block_type: 'step', content: { title: 'Diagnóstico', text: 'Entendemos seu perfil, recursos e prioridades.' }, order_index: 3 },
            { id: 'blk-h-met-s2', block_key: 'step_2', block_type: 'step', content: { title: 'Estratégia', text: 'Definimos critérios e possibilidades adequadas.' }, order_index: 4 },
            { id: 'blk-h-met-s3', block_key: 'step_3', block_type: 'step', content: { title: 'Execução', text: 'Conduzimos as escolhas autorizadas com cuidado.' }, order_index: 5 },
            { id: 'blk-h-met-s4', block_key: 'step_4', block_type: 'step', content: { title: 'Acompanhamento', text: 'Mantemos a gestão organizada ao longo do tempo.' }, order_index: 6 },
            { id: 'blk-h-met-link', block_key: 'link', block_type: 'button', content: { text: 'Conhecer o processo completo', url: '/como-funciona/', style: 'text-link' }, order_index: 7 }
          ]
        },
        {
          id: 'sec-home-cta',
          section_key: 'cta',
          section_type: 'cta',
          background_style: 'off',
          order_index: 5,
          blocks: [
            { id: 'blk-h-cta-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Próximo passo' }, order_index: 0 },
            { id: 'blk-h-cta-title', block_key: 'title', block_type: 'heading', content: { text: 'Vamos entender como você viaja.' }, order_index: 1 },
            { id: 'blk-h-cta-desc', block_key: 'description', block_type: 'text', content: { text: 'Conte um pouco sobre sua rotina e suas prioridades. A conversa inicial ajuda a identificar como a gestão pode cuidar melhor das suas próximas viagens.' }, order_index: 2 },
            { id: 'blk-h-cta-btn', block_key: 'button', block_type: 'button', content: { text: 'Solicitar análise', url: '/contato/', style: 'dark' }, order_index: 3 }
          ]
        }
      ]
    },
    {
      id: 'page-sobre',
      slug: '/sobre/',
      title: 'A Biazotto | Gestão de Viagens e Milhas',
      meta_description: 'Conheça a visão, os princípios e a abordagem consultiva da Biazotto.',
      order_index: 1,
      sections: [
        {
          id: 'sec-sob-hero',
          section_key: 'hero',
          section_type: 'page_hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-sob-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'A Biazotto' }, order_index: 0 },
            { id: 'blk-sob-title', block_key: 'title', block_type: 'heading', content: { text: 'Gestão de viagens é cuidado estratégico.' }, order_index: 1 },
            { id: 'blk-sob-desc', block_key: 'description', block_type: 'text', content: { text: 'A Biazotto organiza decisões, recursos e preferências para tornar cada jornada mais simples, confortável e coerente com a vida do cliente.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-sob-quote',
          section_key: 'quote',
          section_type: 'quote',
          background_style: 'white',
          order_index: 1,
          blocks: [
            { id: 'blk-sob-q-text', block_key: 'quote_text', block_type: 'quote', content: { text: 'Não ensinamos você a acompanhar cada programa. <strong>Assumimos a estratégia</strong> para que seu tempo continue onde mais importa.' }, order_index: 0 }
          ]
        },
        {
          id: 'sec-sob-visao',
          section_key: 'visao',
          section_type: 'values',
          background_style: 'off',
          order_index: 2,
          blocks: [
            { id: 'blk-sob-vis-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Nossa visão' }, order_index: 0 },
            { id: 'blk-sob-vis-title', block_key: 'title', block_type: 'heading', content: { text: 'Viajar bem não deveria exigir improviso.' }, order_index: 1 },
            { id: 'blk-sob-vis-desc', block_key: 'description', block_type: 'text', content: { text: 'Pontos, cartões, datas, regras e preferências formam um conjunto. Quando cada decisão é tomada isoladamente, tempo e oportunidades se perdem. Nossa abordagem reúne essas informações e as transforma em um plano claro.' }, order_index: 2 },
            { id: 'blk-sob-vis-v1', block_key: 'v1', block_type: 'value', content: { title: 'Discrição', text: 'Comunicação sóbria e respeito à sua rotina.' }, order_index: 3 },
            { id: 'blk-sob-vis-v2', block_key: 'v2', block_type: 'value', content: { title: 'Precisão', text: 'Condições e próximos passos apresentados com clareza.' }, order_index: 4 },
            { id: 'blk-sob-vis-v3', block_key: 'v3', block_type: 'value', content: { title: 'Cuidado', text: 'Decisões alinhadas ao perfil de cada cliente.' }, order_index: 5 },
            { id: 'blk-sob-vis-v4', block_key: 'v4', block_type: 'value', content: { title: 'Consistência', text: 'Acompanhamento que não termina na emissão.' }, order_index: 6 }
          ]
        },
        {
          id: 'sec-sob-abordagem',
          section_key: 'abordagem',
          section_type: 'cards_grid',
          background_style: 'white',
          order_index: 3,
          blocks: [
            { id: 'blk-sob-ab-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Nossa abordagem' }, order_index: 0 },
            { id: 'blk-sob-ab-title', block_key: 'title', block_type: 'heading', content: { text: 'Consultiva no contato. Técnica na decisão.' }, order_index: 1 },
            { id: 'blk-sob-ab-desc', block_key: 'description', block_type: 'text', content: { text: 'Você não precisa dominar termos de fidelidade nem comparar dezenas de possibilidades. Explicamos o que importa, apresentamos as condições e conduzimos o que for autorizado.' }, order_index: 2 },
            { id: 'blk-sob-ab-c1', block_key: 'card_1', block_type: 'card', content: { num: '01', title: 'Entender antes de propor', text: 'Seu perfil, suas prioridades e seus planos orientam a estratégia.' }, order_index: 3 },
            { id: 'blk-sob-ab-c2', block_key: 'card_2', block_type: 'card', content: { num: '02', title: 'Explicar sem complicar', text: 'Informação suficiente para decidir, sem jargão desnecessário.' }, order_index: 4 },
            { id: 'blk-sob-ab-c3', block_key: 'card_3', block_type: 'card', content: { num: '03', title: 'Cuidar do processo', text: 'Organização e continuidade em todas as etapas combinadas.' }, order_index: 5 }
          ]
        },
        {
          id: 'sec-sob-cta',
          section_key: 'cta',
          section_type: 'cta',
          background_style: 'off',
          order_index: 4,
          blocks: [
            { id: 'blk-sob-cta-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Conversa inicial' }, order_index: 0 },
            { id: 'blk-sob-cta-title', block_key: 'title', block_type: 'heading', content: { text: 'Conheça uma gestão pensada para a sua rotina.' }, order_index: 1 },
            { id: 'blk-sob-cta-desc', block_key: 'description', block_type: 'text', content: { text: 'O primeiro passo é entender como você viaja e o que deseja delegar.' }, order_index: 2 },
            { id: 'blk-sob-cta-btn', block_key: 'button', block_type: 'button', content: { text: 'Falar com a Biazotto', url: '/contato/', style: 'dark' }, order_index: 3 }
          ]
        }
      ]
    },
    {
      id: 'page-servicos',
      slug: '/servicos/',
      title: 'Serviços | Biazotto',
      meta_description: 'Conheça a gestão consultiva de viagens, pontos, milhas e benefícios da Biazotto.',
      order_index: 2,
      sections: [
        {
          id: 'sec-srv-hero',
          section_key: 'hero',
          section_type: 'page_hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-srv-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Serviços' }, order_index: 0 },
            { id: 'blk-srv-title', block_key: 'title', block_type: 'heading', content: { text: 'Uma gestão completa, sem excesso de complexidade.' }, order_index: 1 },
            { id: 'blk-srv-desc', block_key: 'description', block_type: 'text', content: { text: 'Planejamento, análise e execução reunidos em um atendimento individual, com escopo definido de acordo com seu perfil.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-srv-blocks',
          section_key: 'services',
          section_type: 'service_blocks',
          background_style: 'white',
          order_index: 1,
          blocks: [
            {
              id: 'blk-srv-b1',
              block_key: 'serv_1',
              block_type: 'service_item',
              content: {
                eyebrow: '01 · Diagnóstico',
                title: 'Organização do seu cenário atual',
                items: [
                  'Entendimento do perfil de consumo e viagem',
                  'Mapeamento de cartões, programas, saldos e validades',
                  'Registro de destinos, preferências e prioridades',
                  'Identificação de pontos que precisam de atenção'
                ]
              },
              order_index: 0
            },
            {
              id: 'blk-srv-b2',
              block_key: 'serv_2',
              block_type: 'service_item',
              content: {
                eyebrow: '02 · Estratégia',
                title: 'Decisões alinhadas ao seu objetivo',
                items: [
                  'Direcionamento para acúmulo e uso de pontos e milhas',
                  'Comparação entre pagamento em dinheiro e resgate',
                  'Planejamento das viagens futuras informadas',
                  'Apresentação clara das condições de cada alternativa'
                ]
              },
              order_index: 1
            },
            {
              id: 'blk-srv-b3',
              block_key: 'serv_3',
              block_type: 'service_item',
              content: {
                eyebrow: '03 · Execução',
                title: 'Apoio na jornada de viagem',
                items: [
                  'Pesquisa e emissão conforme o escopo contratado',
                  'Organização das solicitações e confirmações',
                  'Apoio com itens complementares previamente combinados',
                  'Acompanhamento dos próximos passos'
                ]
              },
              order_index: 2
            }
          ]
        },
        {
          id: 'sec-srv-limites',
          section_key: 'limites',
          section_type: 'statement',
          background_style: 'navy',
          order_index: 2,
          blocks: [
            { id: 'blk-srv-lim-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'O que não prometemos' }, order_index: 0 },
            { id: 'blk-srv-lim-title', block_key: 'title', block_type: 'heading', content: { text: 'Clareza também significa reconhecer limites.' }, order_index: 1 },
            { id: 'blk-srv-lim-desc', block_key: 'description', block_type: 'text', content: { text: 'Assentos em milhas, tarifas e regras mudam. A Biazotto analisa as condições disponíveis no momento e apresenta alternativas, sem promessas de disponibilidade ou economia garantida.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-srv-cta',
          section_key: 'cta',
          section_type: 'cta',
          background_style: 'off',
          order_index: 3,
          blocks: [
            { id: 'blk-srv-cta-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Escopo personalizado' }, order_index: 0 },
            { id: 'blk-srv-cta-title', block_key: 'title', block_type: 'heading', content: { text: 'Descubra o formato adequado para você.' }, order_index: 1 },
            { id: 'blk-srv-cta-desc', block_key: 'description', block_type: 'text', content: { text: 'Na conversa inicial, identificamos suas necessidades e explicamos quais atividades podem fazer parte da gestão.' }, order_index: 2 },
            { id: 'blk-srv-cta-btn', block_key: 'button', block_type: 'button', content: { text: 'Solicitar análise', url: '/contato/', style: 'dark' }, order_index: 3 }
          ]
        }
      ]
    },
    {
      id: 'page-processo',
      slug: '/como-funciona/',
      title: 'Como funciona | Biazotto',
      meta_description: 'Entenda o processo de gestão de viagens e milhas da Biazotto.',
      order_index: 3,
      sections: [
        {
          id: 'sec-prc-hero',
          section_key: 'hero',
          section_type: 'page_hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-prc-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Como funciona' }, order_index: 0 },
            { id: 'blk-prc-title', block_key: 'title', block_type: 'heading', content: { text: 'Um processo simples de acompanhar e fácil de delegar.' }, order_index: 1 },
            { id: 'blk-prc-desc', block_key: 'description', block_type: 'text', content: { text: 'Você participa das decisões essenciais. A organização técnica e o acompanhamento ficam com a Biazotto.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-prc-timeline',
          section_key: 'timeline',
          section_type: 'timeline',
          background_style: 'white',
          order_index: 1,
          blocks: [
            { id: 'blk-prc-t1', block_key: 'step_1', block_type: 'timeline_item', content: { num: '01', title: 'Conversa inicial', text: 'Entendemos sua rotina, frequência de viagens, prioridades e o que você deseja delegar.' }, order_index: 0 },
            { id: 'blk-prc-t2', block_key: 'step_2', block_type: 'timeline_item', content: { num: '02', title: 'Diagnóstico', text: 'Organizamos as informações relevantes sobre cartões, programas, saldos, validade e preferências.' }, order_index: 1 },
            { id: 'blk-prc-t3', block_key: 'step_3', block_type: 'timeline_item', content: { num: '03', title: 'Estratégia personalizada', text: 'Definimos critérios de decisão e um plano coerente com os objetivos informados.' }, order_index: 2 },
            { id: 'blk-prc-t4', block_key: 'step_4', block_type: 'timeline_item', content: { num: '04', title: 'Solicitação de viagem', text: 'Você informa destino, datas, passageiros e necessidades específicas.' }, order_index: 3 },
            { id: 'blk-prc-t5', block_key: 'step_5', block_type: 'timeline_item', content: { num: '05', title: 'Análise de alternativas', text: 'Comparamos caminhos e apresentamos condições relevantes em linguagem clara.' }, order_index: 4 },
            { id: 'blk-prc-t6', block_key: 'step_6', block_type: 'timeline_item', content: { num: '06', title: 'Autorização e execução', text: 'Após sua escolha, conduzimos as ações previstas no escopo contratado.' }, order_index: 5 },
            { id: 'blk-prc-t7', block_key: 'step_7', block_type: 'timeline_item', content: { num: '07', title: 'Acompanhamento', text: 'Mantemos registros e próximos passos organizados para dar continuidade à gestão.' }, order_index: 6 }
          ]
        },
        {
          id: 'sec-prc-quote',
          section_key: 'quote',
          section_type: 'quote',
          background_style: 'off',
          order_index: 2,
          blocks: [
            { id: 'blk-prc-q-text', block_key: 'quote_text', block_type: 'quote', content: { text: 'Você informa o que precisa e autoriza a escolha. <strong>A Biazotto organiza o caminho.</strong>' }, order_index: 0 }
          ]
        },
        {
          id: 'sec-prc-cta',
          section_key: 'cta',
          section_type: 'cta',
          background_style: 'off',
          order_index: 3,
          blocks: [
            { id: 'blk-prc-cta-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Comece pelo diagnóstico' }, order_index: 0 },
            { id: 'blk-prc-cta-title', block_key: 'title', block_type: 'heading', content: { text: 'Conte como você viaja hoje.' }, order_index: 1 },
            { id: 'blk-prc-cta-desc', block_key: 'description', block_type: 'text', content: { text: 'Com essas informações, conseguimos orientar o próximo passo com clareza.' }, order_index: 2 },
            { id: 'blk-prc-cta-btn', block_key: 'button', block_type: 'button', content: { text: 'Iniciar conversa', url: '/contato/', style: 'dark' }, order_index: 3 }
          ]
        }
      ]
    },
    {
      id: 'page-insights',
      slug: '/insights/',
      title: 'Insights | Biazotto',
      meta_description: 'Conteúdos sobre gestão de viagens, pontos, milhas e decisões mais conscientes.',
      order_index: 4,
      sections: [
        {
          id: 'sec-ins-hero',
          section_key: 'hero',
          section_type: 'page_hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-ins-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Insights' }, order_index: 0 },
            { id: 'blk-ins-title', block_key: 'title', block_type: 'heading', content: { text: 'Informação para decisões mais conscientes.' }, order_index: 1 },
            { id: 'blk-ins-desc', block_key: 'description', block_type: 'text', content: { text: 'Conteúdos claros sobre viagens, pontos, benefícios e planejamento.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-ins-content',
          section_key: 'content',
          section_type: 'insights_empty',
          background_style: 'white',
          order_index: 1,
          blocks: [
            { id: 'blk-ins-img', block_key: 'icon', block_type: 'image', content: { src: '/assets/marca-quadrada.png', alt: 'Marca Biazotto' }, order_index: 0 },
            { id: 'blk-ins-h2', block_key: 'title', block_type: 'heading', content: { text: 'Novos conteúdos serão publicados em breve.' }, order_index: 1 },
            { id: 'blk-ins-p', block_key: 'description', block_type: 'text', content: { text: 'Estamos preparando materiais objetivos para ajudar você a compreender as decisões que realmente importam.' }, order_index: 2 },
            { id: 'blk-ins-link', block_key: 'link', block_type: 'button', content: { text: 'Falar com a Biazotto', url: '/contato/', style: 'text-link' }, order_index: 3 }
          ]
        }
      ]
    },
    {
      id: 'page-contato',
      slug: '/contato/',
      title: 'Solicitar análise | Biazotto',
      meta_description: 'Conte como você viaja e solicite uma conversa inicial com a Biazotto.',
      order_index: 5,
      sections: [
        {
          id: 'sec-cnt-hero',
          section_key: 'hero',
          section_type: 'page_hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-cnt-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Contato' }, order_index: 0 },
            { id: 'blk-cnt-title', block_key: 'title', block_type: 'heading', content: { text: 'Vamos entender como você viaja.' }, order_index: 1 },
            { id: 'blk-cnt-desc', block_key: 'description', block_type: 'text', content: { text: 'Preencha as informações iniciais. Elas ajudam a preparar uma conversa mais objetiva sobre sua rotina e suas prioridades.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-cnt-form',
          section_key: 'form_section',
          section_type: 'form_wrap',
          background_style: 'white',
          order_index: 1,
          blocks: [
            { id: 'blk-cnt-intro-eyebrow', block_key: 'intro_eyebrow', block_type: 'text', content: { text: 'Conversa inicial' }, order_index: 0 },
            { id: 'blk-cnt-intro-title', block_key: 'intro_title', block_type: 'heading', content: { text: 'Seu próximo passo começa aqui.' }, order_index: 1 },
            { id: 'blk-cnt-intro-desc', block_key: 'intro_desc', block_type: 'text', content: { text: 'Não envie senhas, dados completos de cartão, CPF ou códigos de segurança. Esses dados não são necessários neste contato.' }, order_index: 2 }
          ]
        }
      ]
    },
    {
      id: 'page-privacidade',
      slug: '/privacidade/',
      title: 'Política de Privacidade | Biazotto',
      meta_description: 'Saiba como a Biazotto trata os dados enviados pelo site.',
      order_index: 6,
      sections: [
        {
          id: 'sec-prv-hero',
          section_key: 'hero',
          section_type: 'page_hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-prv-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Informações legais' }, order_index: 0 },
            { id: 'blk-prv-title', block_key: 'title', block_type: 'heading', content: { text: 'Política de Privacidade' }, order_index: 1 },
            { id: 'blk-prv-desc', block_key: 'description', block_type: 'text', content: { text: 'Transparência sobre as informações enviadas neste site.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-prv-content',
          section_key: 'legal_content',
          section_type: 'legal_article',
          background_style: 'white',
          order_index: 1,
          blocks: [
            {
              id: 'blk-prv-body',
              block_key: 'article_body',
              block_type: 'legal_text',
              content: {
                sections: [
                  { title: '1. Dados coletados', text: 'O formulário pode coletar nome, telefone, e-mail, frequência aproximada de viagens, objetivo do contato e mensagem opcional.' },
                  { title: '2. Finalidade', text: 'As informações são usadas para responder à solicitação, entender o perfil inicial e organizar o contato comercial solicitado por você.' },
                  { title: '3. Compartilhamento', text: 'Os dados não devem ser vendidos. Fornecedores técnicos podem processá-los apenas quando necessários ao funcionamento do site e do atendimento, mediante medidas adequadas de proteção.' },
                  { title: '4. Retenção e segurança', text: 'As informações devem ser mantidas apenas pelo período necessário às finalidades informadas e protegidas por controles técnicos e organizacionais proporcionais.' },
                  { title: '5. Seus direitos', text: 'Você pode solicitar confirmação, acesso, correção, informação sobre compartilhamento, revogação de consentimento e exclusão, nos termos da LGPD.' },
                  { title: '6. Contato', text: 'Para dúvidas sobre privacidade, utilize o formulário de contato oficial da Biazotto.' }
                ]
              },
              order_index: 0
            }
          ]
        }
      ]
    },
    {
      id: 'page-termos',
      slug: '/termos/',
      title: 'Termos de Uso | Biazotto',
      meta_description: 'Condições de uso do site da Biazotto Gestão de Viagens e Milhas.',
      order_index: 7,
      sections: [
        {
          id: 'sec-trm-hero',
          section_key: 'hero',
          section_type: 'page_hero',
          background_style: 'navy',
          order_index: 0,
          blocks: [
            { id: 'blk-trm-eyebrow', block_key: 'eyebrow', block_type: 'text', content: { text: 'Informações legais' }, order_index: 0 },
            { id: 'blk-trm-title', block_key: 'title', block_type: 'heading', content: { text: 'Termos de Uso' }, order_index: 1 },
            { id: 'blk-trm-desc', block_key: 'description', block_type: 'text', content: { text: 'Condições gerais para navegação e contato por este site.' }, order_index: 2 }
          ]
        },
        {
          id: 'sec-trm-content',
          section_key: 'legal_content',
          section_type: 'legal_article',
          background_style: 'white',
          order_index: 1,
          blocks: [
            {
              id: 'blk-trm-body',
              block_key: 'article_body',
              block_type: 'legal_text',
              content: {
                sections: [
                  { title: '1. Finalidade do site', text: 'O site apresenta informações institucionais sobre a Biazotto Gestão de Viagens e Milhas e oferece um canal inicial de contato.' },
                  { title: '2. Informações e disponibilidade', text: 'Conteúdos têm caráter informativo. Tarifas, assentos, regras de programas e demais condições de viagem podem mudar e não constituem garantia de disponibilidade.' },
                  { title: '3. Uso permitido', text: 'O visitante deve usar o site de forma lícita, sem tentar prejudicar sua segurança, disponibilidade ou integridade.' },
                  { title: '4. Propriedade intelectual', text: 'A marca, o design e os conteúdos pertencem aos seus respectivos titulares e não podem ser reproduzidos sem autorização.' },
                  { title: '5. Alterações', text: 'Estes termos podem ser atualizados para refletir mudanças no site, nos serviços ou na legislação aplicável.' }
                ]
              },
              order_index: 0
            }
          ]
        }
      ]
    }
  ];

  // Inserção transacional de páginas, seções e blocos
  for (const page of pagesData) {
    await db.run(
      'INSERT INTO pages (id, slug, title, meta_description, order_index, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [page.id, page.slug, page.title, page.meta_description, page.order_index, now, now]
    );

    for (const sec of page.sections) {
      await db.run(
        'INSERT INTO sections (id, page_id, section_key, section_type, background_style, padding_preset, order_index, is_visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
        [sec.id, page.id, sec.section_key, sec.section_type, sec.background_style, sec.padding_preset || 'normal', sec.order_index, now, now]
      );

      for (const blk of sec.blocks) {
        await db.run(
          'INSERT INTO blocks (id, section_id, block_key, block_type, content_json, visual_config_json, order_index, is_visible, version, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)',
          [blk.id, sec.id, blk.block_key, blk.block_type, JSON.stringify(blk.content), JSON.stringify(blk.visual_config || {}), blk.order_index, now, 'system_seed']
        );
      }
    }
  }

  // 4. Cria Versão 1 Publicada (Snapshot Inicial)
  const initialSnapshot = {
    pages: pagesData,
    navigation: navItems,
    settings: settings
  };

  const v1Id = 'v1-' + crypto.randomUUID();
  await db.run(
    'INSERT INTO published_versions (id, version_number, snapshot_json, summary, created_at, created_by) VALUES (?, 1, ?, ?, ?, ?)',
    [v1Id, JSON.stringify(initialSnapshot), 'Versão inicial importada do site', now, 'system_seed']
  );

  await db.run(
    'INSERT INTO audit_logs (id, action, user_id, ip_address, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['log-seed-' + now, 'INITIAL_SEED', 'system', '127.0.0.1', JSON.stringify({ version: 1, pages: pagesData.length }), now]
  );

  console.log(`[Seed] ${pagesData.length} páginas, seções e blocos migrados com sucesso para o banco de dados.`);
}
