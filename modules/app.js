// ═══════════════════════════════════════
// GRAD Ecossistema — APP CORE
// Roteamento, inicialização, utilitários
// ═══════════════════════════════════════

const App = {
  currentPage: 'dashboard',

  async init() {
    // Atualiza data na topbar
    App._updateClock();
    setInterval(App._updateClock, 60000);

    // Inicializa auth
    await Auth.init();
  },

  _updateClock() {
    const el = document.getElementById('topbar-date');
    if (el) el.textContent = new Date().toLocaleString('pt-BR', {
      weekday: 'short', day: '2-digit',
      month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  show() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'grid';
    App.navigate('dashboard');
  },

  navigate(page) {
    App.currentPage = page;

    // Atualiza nav ativo
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Carrega módulo
    const main = document.getElementById('main-content');
    main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';

    const modulos = {
      dashboard:    () => Dashboard.render(main),
      mapa:         () => Mapa.render(main),
      ocorrencias:  () => Ocorrencias.render(main),
      missoes:      () => Missoes.render(main),
      ordens:       () => Ordens.render(main),
      issi:         () => Issi.render(main),
      inteligencia: () => Inteligencia.render(main),
      relatorio:    () => Relatorio.render(main),
      gerenciar:    () => Gerenciar.render(main),
    };

    setTimeout(() => {
      if (modulos[page]) modulos[page]();
      else main.innerHTML = '<div class="page"><p class="muted">Módulo em desenvolvimento.</p></div>';
    }, 80);
  }
};

// ── TOAST ──────────────────────────────
const Toast = {
  show(msg, tipo = 'info', duracao = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<span class="toast-icon">${icons[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duracao);
  }
};

// ── MODAL ──────────────────────────────
const Modal = {
  open(titulo, conteudoHTML, botoes = []) {
    Modal.close();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Modal.close(); };

    const botoesHTML = botoes.map(b =>
      `<button class="btn ${b.class||'btn-ghost'}" onclick="${b.onclick}">${b.label}</button>`
    ).join('');

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${titulo}</div>
          <button class="modal-close" onclick="Modal.close()">✕</button>
        </div>
        <div class="modal-body">${conteudoHTML}</div>
        ${botoes.length ? `<div class="modal-footer">${botoesHTML}</div>` : ''}
      </div>`;
    document.body.appendChild(overlay);
  },
  close() {
    document.getElementById('modal-overlay')?.remove();
  }
};

// ── UTILITÁRIOS ──────────────────────
function diffDays(dataStr) {
  if (!dataStr) return 0;
  const d = new Date(dataStr);
  const hoje = new Date();
  return Math.floor((hoje - d) / 86400000);
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR');
}

function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('pt-BR');
}

function daysBadge(dias) {
  const cls = dias > 7 ? 'crit' : dias > 3 ? 'warn' : 'ok';
  return `<span class="days-chip ${cls}">${dias}d</span>`;
}

// ── INICIALIZA ──────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
