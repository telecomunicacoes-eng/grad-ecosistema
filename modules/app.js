// ═══════════════════════════════════════
// GRAD Ecossistema — APP CORE
// Roteamento, busca global, utilitários
// ═══════════════════════════════════════

const App = {
  currentPage: 'dashboard',

  async init() {
    App._updateClock();
    setInterval(App._updateClock, 60000);
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
    App._setupSearch();
    App._updateAlertBadge();
    App.navigate('dashboard');
  },

  navigate(page) {
    App.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    const main = document.getElementById('main-content');
    main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';

    const modulos = {
      dashboard:    () => Dashboard.render(main),
      mapa:         () => Mapa.render(main),
      ocorrencias:  () => Ocorrencias.render(main),
      historico:    () => Historico.render(main),
      alertas:      () => Alertas.render(main),
      base:         () => Base.render(main),
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
  },

  // ── BADGE DE ALERTAS ──────────────────
  async _updateAlertBadge() {
    try {
      const { count } = await db
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .neq('situacao', 'Operacional');

      const badge = document.getElementById('nav-badge-alertas');
      if (badge) {
        badge.textContent = count || 0;
        badge.style.display = (count > 0) ? 'inline-flex' : 'none';
      }

      // Badge de inoperantes no nav de ocorrências
      const { count: inop } = await db
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 'Inoperante');

      const badgeOc = document.getElementById('nav-badge-ocorrencias');
      if (badgeOc) {
        badgeOc.textContent = inop || 0;
        badgeOc.style.display = (inop > 0) ? 'inline-flex' : 'none';
      }
    } catch {}
  },

  // ── BUSCA GLOBAL (Ctrl+K) ─────────────
  _setupSearch() {
    // Abre com Ctrl+K
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        App.toggleSearch();
      }
      if (e.key === 'Escape') App.closeSearch();
    });
  },

  toggleSearch() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    const isOpen = overlay.classList.contains('open');
    if (isOpen) App.closeSearch();
    else App.openSearch();
  },

  openSearch() {
    const overlay = document.getElementById('search-overlay');
    const input   = document.getElementById('search-input');
    if (!overlay) return;
    overlay.classList.add('open');
    setTimeout(() => input?.focus(), 50);
    document.getElementById('search-results').innerHTML =
      '<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px">Digite para buscar sites, ocorrências ou módulos...</div>';
  },

  closeSearch() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  async _doSearch(q) {
    if (!q || q.length < 2) {
      document.getElementById('search-results').innerHTML =
        '<div style="text-align:center;color:var(--text3);padding:16px;font-size:13px">Digite ao menos 2 caracteres...</div>';
      return;
    }

    const resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = '<div style="text-align:center;padding:20px"><div class="spinner"></div></div>';

    const resultados = [];
    const ql = q.toLowerCase();

    try {
      // Busca sites
      const sites = await dbQuery(d =>
        d.from('sites')
          .select('id,nome,cidade,risp:risps(nome)')
          .ilike('nome', `%${q}%`)
          .eq('ativo', true)
          .limit(8)
      );
      (sites||[]).forEach(s => resultados.push({
        tipo: 'site', icone: '📡',
        label: s.nome, sub: `${s.cidade||''} · ${s.risp?.nome||''}`,
        acao: `App.closeSearch();App.navigate('base')`
      }));

      // Busca ocorrências ativas
      const ocorrs = await dbQuery(d =>
        d.from('ocorrencias')
          .select('id,situacao,site:sites(nome,risp:risps(nome))')
          .ilike('sites.nome', `%${q}%`)
          .neq('situacao', 'Operacional')
          .limit(6)
      );
      (ocorrs||[]).filter(o=>o.site?.nome?.toLowerCase().includes(ql)).forEach(o => resultados.push({
        tipo: 'ocorrencia', icone: '⚠️',
        label: o.site?.nome || '—',
        sub: `${o.situacao} · ${o.site?.risp?.nome||''}`,
        acao: `App.closeSearch();App.navigate('ocorrencias')`
      }));
    } catch {}

    // Módulos
    const modulos = [
      { nome: 'dashboard', label: 'Dashboard', sub: 'Visão geral', icone: '📊' },
      { nome: 'mapa', label: 'Mapa de ERBs', sub: 'Mapa interativo', icone: '🗺️' },
      { nome: 'ocorrencias', label: 'Ocorrências', sub: 'Falhas ativas', icone: '⚠️' },
      { nome: 'historico', label: 'Histórico', sub: 'Timeline de ocorrências', icone: '📋' },
      { nome: 'alertas', label: 'Alertas', sub: 'Situações críticas', icone: '🚨' },
      { nome: 'base', label: 'Base de Sites', sub: 'Cadastro de ERBs', icone: '📡' },
      { nome: 'missoes', label: 'Missões', sub: 'Operações de campo', icone: '🎯' },
      { nome: 'ordens', label: 'Ordens de Serviço', sub: 'OS e manutenções', icone: '📝' },
      { nome: 'issi', label: 'ISSI / GSSI', sub: 'Terminais rádio', icone: '📻' },
      { nome: 'inteligencia', label: 'Inteligência', sub: 'Métricas e análises', icone: '📈' },
      { nome: 'relatorio', label: 'Relatórios', sub: 'PDF e CSV', icone: '📄' },
      { nome: 'gerenciar', label: 'Gerenciar', sub: 'Administração', icone: '⚙️' },
    ];
    modulos.filter(m => m.label.toLowerCase().includes(ql) || m.sub.toLowerCase().includes(ql))
      .forEach(m => resultados.push({
        tipo: 'modulo', icone: m.icone,
        label: m.label, sub: m.sub,
        acao: `App.closeSearch();App.navigate('${m.nome}')`
      }));

    if (!resultados.length) {
      resultsEl.innerHTML = `<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px">Nenhum resultado para "<strong>${q}</strong>"</div>`;
      return;
    }

    resultsEl.innerHTML = resultados.map((r,i) => `
      <div class="search-result-item" onclick="${r.acao}" tabindex="${i}">
        <span style="font-size:18px;flex-shrink:0">${r.icone}</span>
        <div style="flex:1;min-width:0">
          <div style="color:var(--text);font-weight:600;font-size:13px">${r.label}</div>
          <div style="color:var(--text3);font-size:11px">${r.sub}</div>
        </div>
        <span style="font-size:10px;color:var(--text3);font-family:var(--mono);background:rgba(255,255,255,.06);padding:2px 6px;border-radius:4px">${r.tipo}</span>
      </div>`).join('');
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
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
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
function diffDays(dataStr, dataFim) {
  if (!dataStr) return 0;
  const d    = new Date(dataStr);
  const ref  = dataFim ? new Date(dataFim) : new Date();
  return Math.floor((ref - d) / 86400000);
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
  const cls = dias >= 30 ? 'crit' : dias > 7 ? 'crit' : dias > 3 ? 'warn' : 'ok';
  return `<span class="days-chip ${cls}">${dias}d</span>`;
}

// ── INICIALIZA ──────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
