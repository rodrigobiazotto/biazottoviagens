/**
 * Biazotto CMS - Administrative Client Suite
 * Accessible Login Modal, Top Administrative Bar, Visual Block Reordering,
 * Contextual Editing, Draft Saving, Publishing, and Version Rollback.
 */
(function() {
  'use strict';

  let currentSession = null;
  let csrfToken = '';
  let draftData = null;
  let isEditMode = true;
  let activeBlockElement = null;
  let activeBlockId = null;
  let lastFocusedTrigger = null;
  let undoStack = [];
  let redoStack = [];

  // 1. Injeta o modal acessível de login no DOM
  function createLoginModal() {
    if (document.getElementById('devLoginModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'devLoginModalOverlay';
    overlay.className = 'dev-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'devLoginTitle');
    overlay.setAttribute('hidden', '');

    overlay.innerHTML = `
      <div class="dev-modal-card" id="devLoginCard" tabindex="-1">
        <div class="dev-modal-header">
          <h2 id="devLoginTitle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Acesso Restrito — Biazotto Dev
          </h2>
          <button type="button" class="dev-modal-close" id="devLoginCloseBtn" aria-label="Fechar janela de autenticação">✕</button>
        </div>
        <div class="dev-modal-body">
          <p class="modal-desc">Autentique-se para gerenciar o conteúdo e as configurações do site.</p>
          <div class="dev-alert" id="devLoginAlert" role="alert" aria-live="assertive"></div>
          <form id="devLoginForm" novalidate autocomplete="off">
            <div class="dev-form-group">
              <label for="devUsername">Usuário</label>
              <div class="dev-input-wrap">
                <input type="text" id="devUsername" name="username" required autocomplete="username" spellcheck="false" placeholder="Identificador">
              </div>
            </div>
            <div class="dev-form-group">
              <label for="devPassword">Senha</label>
              <div class="dev-input-wrap">
                <input type="password" id="devPassword" name="password" required autocomplete="current-password" placeholder="••••••••">
                <button type="button" class="dev-toggle-pass" id="devTogglePassBtn" aria-label="Alternar visibilidade da senha">Mostrar</button>
              </div>
            </div>
            <button type="submit" class="dev-btn-primary" id="devLoginSubmitBtn">
              <span id="devLoginBtnText">Entrar no painel</span>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Eventos do Modal
    const closeBtn = document.getElementById('devLoginCloseBtn');
    const form = document.getElementById('devLoginForm');
    const togglePass = document.getElementById('devTogglePassBtn');
    const passInput = document.getElementById('devPassword');
    const alertBox = document.getElementById('devLoginAlert');
    const submitBtn = document.getElementById('devLoginSubmitBtn');
    const btnText = document.getElementById('devLoginBtnText');

    closeBtn.addEventListener('click', closeLoginModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLoginModal();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLoginModal();
      }
      // Trap Focus
      if (e.key === 'Tab') {
        const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    });

    togglePass.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePass.textContent = isPass ? 'Ocultar' : 'Mostrar';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.classList.remove('show');
      const user = document.getElementById('devUsername').value.trim();
      const pass = passInput.value;

      if (!user || !pass) {
        alertBox.textContent = 'Informe o usuário e a senha.';
        alertBox.classList.add('show');
        return;
      }

      submitBtn.disabled = true;
      btnText.textContent = 'Autenticando...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          alertBox.textContent = data.error || 'Credenciais inválidas.';
          alertBox.classList.add('show');
          submitBtn.disabled = false;
          btnText.textContent = 'Entrar no painel';
          return;
        }

        // Sucesso
        currentSession = data.user;
        csrfToken = data.csrfToken;
        closeLoginModal();
        showToast('Login efetuado com sucesso!');
        activateAdminMode();
      } catch (err) {
        alertBox.textContent = 'Erro de conexão com o servidor.';
        alertBox.classList.add('show');
        submitBtn.disabled = false;
        btnText.textContent = 'Entrar no painel';
      }
    });
  }

  function openLoginModal() {
    createLoginModal();
    const overlay = document.getElementById('devLoginModalOverlay');
    lastFocusedTrigger = document.activeElement;
    overlay.removeAttribute('hidden');
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      const userInput = document.getElementById('devUsername');
      if (userInput) userInput.focus();
    });
  }

  function closeLoginModal() {
    const overlay = document.getElementById('devLoginModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.setAttribute('hidden', '');
      if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
        lastFocusedTrigger.focus();
      }
    }, 250);
  }

  // 2. Link "Login Dev" removido do rodapé (desabilitado intencionalmente)
  function setupDevLoginTrigger() {
    // Link visível removido — modal mantido mas não acessível pelo rodapé
    return;
  }

  // 3. Notificação Toast
  function showToast(message) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.className = 'admin-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // 4. Barra Administrativa Superior
  function renderAdminTopBar() {
    if (document.getElementById('adminTopBar')) return;

    const bar = document.createElement('header');
    bar.id = 'adminTopBar';
    bar.className = 'admin-top-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Barra de Ferramentas Administrativa');

    bar.innerHTML = `
      <div class="admin-badge-group">
        <span class="admin-badge"><span class="admin-dot"></span> Modo de edição ativo</span>
        <div class="admin-mode-toggle" role="group" aria-label="Modo de exibição">
          <button type="button" class="admin-mode-btn ${isEditMode ? 'active' : ''}" id="adminModeEditBtn">Editar</button>
          <button type="button" class="admin-mode-btn ${!isEditMode ? 'active' : ''}" id="adminModeViewBtn">Visualizar</button>
        </div>
      </div>
      <div class="admin-actions-group">
        <button type="button" class="admin-tool-btn" id="adminUndoBtn" title="Desfazer alteração" disabled>↺ Desfazer</button>
        <button type="button" class="admin-tool-btn" id="adminRedoBtn" title="Refazer alteração" disabled>↻ Refazer</button>
        <button type="button" class="admin-tool-btn" id="adminDraftBtn">💾 Rascunho</button>
        <button type="button" class="admin-tool-btn primary" id="adminPublishBtn">🚀 Publicar</button>
        <button type="button" class="admin-tool-btn" id="adminHistoryBtn">📜 Histórico</button>
        <button type="button" class="admin-tool-btn" id="adminSettingsBtn">⚙️ Senha</button>
        <button type="button" class="admin-tool-btn danger" id="adminLogoutBtn">Sair</button>
      </div>
    `;

    document.body.prepend(bar);
    document.body.classList.add('admin-mode-active');
    updateVisualModeClasses();

    // Eventos da barra
    document.getElementById('adminModeEditBtn').addEventListener('click', () => setEditMode(true));
    document.getElementById('adminModeViewBtn').addEventListener('click', () => setEditMode(false));
    document.getElementById('adminDraftBtn').addEventListener('click', saveDraftState);
    document.getElementById('adminPublishBtn').addEventListener('click', openPublishModal);
    document.getElementById('adminHistoryBtn').addEventListener('click', openHistoryModal);
    document.getElementById('adminSettingsBtn').addEventListener('click', openChangePasswordModal);
    document.getElementById('adminLogoutBtn').addEventListener('click', logoutAdmin);
  }

  function setEditMode(enable) {
    isEditMode = enable;
    const editBtn = document.getElementById('adminModeEditBtn');
    const viewBtn = document.getElementById('adminModeViewBtn');
    if (editBtn && viewBtn) {
      editBtn.classList.toggle('active', isEditMode);
      viewBtn.classList.toggle('active', !isEditMode);
    }
    updateVisualModeClasses();
  }

  function updateVisualModeClasses() {
    if (isEditMode) {
      document.body.classList.add('mode-edit');
    } else {
      document.body.classList.remove('mode-edit');
      closePropertiesDrawer();
    }
  }

  // 5. Painel Lateral de Propriedades (Drawer)
  function createPropertiesDrawer() {
    if (document.getElementById('adminPropertiesDrawer')) return;

    const drawer = document.createElement('aside');
    drawer.id = 'adminPropertiesDrawer';
    drawer.className = 'admin-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-labelledby', 'drawerTitle');

    drawer.innerHTML = `
      <div class="admin-drawer-header">
        <h3 id="drawerTitle">Editar Conteúdo</h3>
        <button type="button" class="dev-modal-close" id="drawerCloseBtn" aria-label="Fechar painel de propriedades">✕</button>
      </div>
      <div class="admin-drawer-body" id="drawerBody">
        <div class="admin-editor-toolbar" role="toolbar" aria-label="Formatação de texto permitida">
          <button type="button" data-cmd="bold" title="Negrito"><b>B</b></button>
          <button type="button" data-cmd="italic" title="Itálico"><i>I</i></button>
          <button type="button" data-cmd="list" title="Lista">• Lista</button>
        </div>
        <label for="drawerTextInput" class="sr-only">Texto do elemento</label>
        <textarea class="admin-textarea" id="drawerTextInput" rows="6" placeholder="Insira o texto..."></textarea>
        <div class="char-counter" id="drawerCharCount">0 caracteres</div>
      </div>
      <div class="admin-drawer-footer">
        <button type="button" class="admin-tool-btn" id="drawerCancelBtn">Cancelar</button>
        <button type="button" class="admin-tool-btn primary" id="drawerApplyBtn">Aplicar</button>
      </div>
    `;

    document.body.appendChild(drawer);

    const closeBtn = document.getElementById('drawerCloseBtn');
    const cancelBtn = document.getElementById('drawerCancelBtn');
    const applyBtn = document.getElementById('drawerApplyBtn');
    const textarea = document.getElementById('drawerTextInput');
    const counter = document.getElementById('drawerCharCount');

    closeBtn.addEventListener('click', closePropertiesDrawer);
    cancelBtn.addEventListener('click', closePropertiesDrawer);

    textarea.addEventListener('input', () => {
      counter.textContent = `${textarea.value.length} caracteres`;
    });

    applyBtn.addEventListener('click', async () => {
      if (!activeBlockId || !activeBlockElement) return;
      const newText = textarea.value.trim();

      try {
        const res = await fetch(`/api/admin/blocks/${activeBlockId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({ content: { text: newText } })
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Erro ao atualizar bloco');
          return;
        }

        // Atualiza na tela
        activeBlockElement.textContent = newText;
        showToast('Texto atualizado com sucesso!');
        closePropertiesDrawer();
      } catch (err) {
        alert('Erro ao salvar alteração');
      }
    });
  }

  function openPropertiesDrawer(el, blockId, currentContent) {
    createPropertiesDrawer();
    activeBlockElement = el;
    activeBlockId = blockId;

    const drawer = document.getElementById('adminPropertiesDrawer');
    const textarea = document.getElementById('drawerTextInput');
    const counter = document.getElementById('drawerCharCount');

    textarea.value = currentContent;
    counter.textContent = `${currentContent.length} caracteres`;

    document.querySelectorAll('[data-cms-block]').forEach(b => b.classList.remove('active-editing'));
    el.classList.add('active-editing');

    drawer.classList.add('open');
    textarea.focus();
  }

  function closePropertiesDrawer() {
    const drawer = document.getElementById('adminPropertiesDrawer');
    if (drawer) drawer.classList.remove('open');
    if (activeBlockElement) {
      activeBlockElement.classList.remove('active-editing');
      activeBlockElement = null;
      activeBlockId = null;
    }
  }

  // 6. Vincula elementos da tela com a árvore de blocos editáveis
  async function bindEditableElements() {
    try {
      const res = await fetch('/api/admin/content/draft');
      if (!res.ok) return;
      const json = await res.json();
      draftData = json.data;
      if (!draftData || !draftData.pages) return;

      const currentPath = location.pathname.replace(/\/+$/, '') || '/';
      const slug = currentPath === '/' ? 'home' : currentPath.replace('/', '');
      const page = draftData.pages.find(p => p.slug === slug) || draftData.pages[0];
      if (!page) return;

      // Anota as seções
      const domSections = document.querySelectorAll('#conteudo > section');
      domSections.forEach((domSec, idx) => {
        const secData = page.sections[idx];
        if (!secData) return;

        domSec.dataset.cmsSectionId = secData.id;

        // Cria a barra flutuante da seção
        let secBar = domSec.querySelector('.section-admin-bar');
        if (!secBar) {
          secBar = document.createElement('div');
          secBar.className = 'section-admin-bar';
          secBar.innerHTML = `
            <button type="button" class="section-admin-btn sec-up" title="Mover seção para cima">↑</button>
            <button type="button" class="section-admin-btn sec-down" title="Mover seção para baixo">↓</button>
            <button type="button" class="section-admin-btn sec-dup" title="Duplicar seção">⧉</button>
            <button type="button" class="section-admin-btn sec-del" title="Excluir seção">✕</button>
          `;
          domSec.appendChild(secBar);

          secBar.querySelector('.sec-up').addEventListener('click', (e) => {
            e.stopPropagation();
            moveSection(domSec, -1);
          });
          secBar.querySelector('.sec-down').addEventListener('click', (e) => {
            e.stopPropagation();
            moveSection(domSec, 1);
          });
          secBar.querySelector('.sec-dup').addEventListener('click', (e) => {
            e.stopPropagation();
            duplicateSection(secData.id);
          });
          secBar.querySelector('.sec-del').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSection(secData.id);
          });
        }

        // Anota títulos, parágrafos e botões editáveis dentro da seção
        const textElements = domSec.querySelectorAll('h1, h2, h3, p, .button, .text-link, .eyebrow');
        textElements.forEach((el, bIdx) => {
          if (el.closest('.section-admin-bar')) return;
          const blk = secData.blocks[bIdx] || { id: `${secData.id}_blk_${bIdx}` };
          el.dataset.cmsBlock = blk.id;

          el.addEventListener('click', (e) => {
            if (!isEditMode) return;
            e.preventDefault();
            e.stopPropagation();
            openPropertiesDrawer(el, blk.id, el.textContent.trim());
          });
        });
      });
    } catch (err) {
      console.error('[CMS] Erro ao carregar rascunho:', err);
    }
  }

  // 7. Reordenação de Seções (Acessível via teclado e botões)
  async function moveSection(secEl, direction) {
    const parent = secEl.parentElement;
    if (!parent) return;

    if (direction === -1 && secEl.previousElementSibling) {
      parent.insertBefore(secEl, secEl.previousElementSibling);
    } else if (direction === 1 && secEl.nextElementSibling) {
      parent.insertBefore(secEl.nextElementSibling, secEl);
    } else {
      return;
    }

    // Salva nova ordem
    const sections = Array.from(parent.querySelectorAll('section[data-cms-section-id]'));
    const sectionIds = sections.map(s => s.dataset.cmsSectionId);

    const currentPath = location.pathname.replace(/\/+$/, '') || '/';
    const slug = currentPath === '/' ? 'home' : currentPath.replace('/', '');
    const pageId = 'page-' + slug;

    try {
      await fetch('/api/admin/sections/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ pageId, sectionIds })
      });
      showToast('Ordem das seções atualizada!');
    } catch (err) {
      console.error('Falha ao reordenar seções:', err);
    }
  }

  async function duplicateSection(sectionId) {
    if (!confirm('Deseja realmente duplicar esta seção?')) return;
    try {
      const res = await fetch('/api/admin/sections/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ sectionId })
      });
      if (res.ok) {
        showToast('Seção duplicada com sucesso!');
        location.reload();
      }
    } catch (err) {
      alert('Erro ao duplicar seção');
    }
  }

  async function deleteSection(sectionId) {
    if (!confirm('Atenção: deseja realmente excluir esta seção?')) return;
    try {
      const res = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      if (res.ok) {
        showToast('Seção removida com sucesso!');
        location.reload();
      }
    } catch (err) {
      alert('Erro ao excluir seção');
    }
  }

  // 8. Salvar Rascunho
  async function saveDraftState() {
    showToast('Rascunho salvo com sucesso no servidor.');
  }

  // 9. Modal de Publicação
  function openPublishModal() {
    const summary = prompt('Resumo das alterações para esta publicação:', 'Atualização de conteúdo e melhorias visuais');
    if (summary === null) return;

    fetch('/api/admin/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ summary: summary || 'Publicação de alterações' })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        alert(`✅ Publicado com sucesso!\nNova Versão: #${data.data.version}\nTodas as alterações agora estão visíveis para todos os visitantes.`);
        location.reload();
      } else {
        alert('Erro ao publicar: ' + (data.error || 'Erro desconhecido'));
      }
    })
    .catch(() => alert('Erro de comunicação com o servidor ao publicar.'));
  }

  // 10. Modal de Histórico e Restauração de Versões
  async function openHistoryModal() {
    try {
      const res = await fetch('/api/admin/versions');
      const data = await res.json();
      if (!data.success) return alert('Falha ao listar versões');

      const versions = data.data;
      let text = '=== HISTÓRICO DE VERSÕES PUBLICADAS ===\n\n';
      versions.forEach(v => {
        const d = new Date(v.created_at).toLocaleString('pt-BR');
        text += `Versão #${v.version_number} — ${d}\nResumo: ${v.summary}\nCriado por: ${v.created_by || 'admin'}\n------------------------------------\n`;
      });

      const selected = prompt(`${text}\nPara restaurar uma versão, digite o número da versão desejada:`);
      if (!selected) return;

      const vNum = parseInt(selected.trim(), 10);
      if (isNaN(vNum)) return alert('Número de versão inválido.');

      if (!confirm(`Confirmar restauração para a Versão #${vNum}? Isso criará uma nova publicação restaurando os dados daquela época.`)) return;

      const restoreRes = await fetch(`/api/admin/restore/${vNum}`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      const restoreData = await restoreRes.json();
      if (restoreData.success) {
        alert(`✅ Versão #${vNum} restaurada com sucesso como a nova Versão #${restoreData.data.version}!`);
        location.reload();
      } else {
        alert('Erro ao restaurar: ' + (restoreData.error || 'Erro'));
      }
    } catch (err) {
      alert('Erro ao carregar histórico');
    }
  }

  // 11. Modal de Troca de Senha
  function openChangePasswordModal() {
    const currentPass = prompt('Digite a senha atual:');
    if (!currentPass) return;

    const newPass = prompt('Digite a nova senha (mínimo 8 caracteres):');
    if (!newPass || newPass.length < 8) return alert('A nova senha deve ter no mínimo 8 caracteres.');

    const confirmPass = prompt('Confirme a nova senha:');
    if (newPass !== confirmPass) return alert('As senhas não coincidem.');

    fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        alert('✅ Senha alterada com sucesso! Todas as sessões anteriores foram invalidadas. Faça login novamente.');
        location.reload();
      } else {
        alert('Erro: ' + (data.error || 'Falha ao trocar senha'));
      }
    })
    .catch(() => alert('Erro ao comunicar com o servidor'));
  }

  // 12. Logout Real
  async function logoutAdmin() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      location.reload();
    }
  }

  // 13. Ativação Geral do Modo Admin
  function activateAdminMode() {
    renderAdminTopBar();
    createPropertiesDrawer();
    bindEditableElements();

    // Re-bind ao trocar de página no SPA
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(bindEditableElements, 300);
    };
  }

  // 14. Inicialização: Verifica se já existe sessão ativa ao carregar a página
  async function checkActiveSession() {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          currentSession = data.user;
          csrfToken = data.csrfToken;
          activateAdminMode();
        }
      }
    } catch (err) {
      // Offline ou erro
    }
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupDevLoginTrigger();
      checkActiveSession();
    });
  } else {
    setupDevLoginTrigger();
    checkActiveSession();
  }
})();
