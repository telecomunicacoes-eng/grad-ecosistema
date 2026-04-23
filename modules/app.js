// ═══════════════════════════════════════
// GRAD Ecossistema — APP CORE v2
// Roteamento por nicho · busca global · utilitários
// ═══════════════════════════════════════

const App = {
  currentNiche:   'infra',
  currentSection: 'dashboard',

  // ── MAPA DE MÓDULOS ──────────────────
  _modulos: {
    painel: {
      apresentacao: el => Painel.render(el),
    },
    infra: {
      dashboard:  el => Dashboard.render(el),
      registros:  el => Ocorrencias.render(el),
      historico:  el => Historico.render(el),
      alertas:    el => Alertas.render(el),
      relatorio:  el => Relatorio.render(el),
      mapa:       el => Mapa.render(el),
      base:       el => Base.render(el),
      ordens:     el => Ordens.render(el),
    },
    missoes: {
      dashboard:  el => Missoes.renderDashboard(el),
      lista:      el => Missoes.render(el),
    },
    bi: {
      dashboard:  el => Inteligencia.render(el),
      registros:  el => Inteligencia.renderRegistros(el),
      historico:  el => Inteligencia.renderHistorico(el),
      alertas:    el => Inteligencia.renderAlertas(el),
      relatorio:  el => Inteligencia.renderRelatorio(el),
    },
    financeiro: {
      dashboard:  el => Financeiro.renderDashboard(el),
      registros:  el => Financeiro.renderRegistros(el),
      historico:  el => Financeiro.renderHistorico(el),
      alertas:    el => Financeiro.renderAlertas(el),
      relatorio:  el => Financeiro.renderRelatorio(el),
      contratos:  el => Financeiro.renderContratos(el),
    },
    equipamentos: {
      dashboard:  el => Equipamentos.renderDashboard(el),
      registros:  el => Equipamentos.renderRegistros(el),
      historico:  el => Equipamentos.renderHistorico(el),
      alertas:    el => Equipamentos.renderAlertas(el),
      relatorio:  el => Equipamentos.renderRelatorio(el),
    },
    comunicacoes: {
      dashboard:  el => Comunicacoes.renderDashboard(el),
      registros:  el => Comunicacoes.renderRegistros(el),
      historico:  el => Comunicacoes.renderHistorico(el),
      alertas:    el => Comunicacoes.renderAlertas(el),
      relatorio:  el => Comunicacoes.renderRelatorio(el),
      issi:       el => Issi.render(el),
    },
    system: {
      gerenciar:  el => Gerenciar.render(el),
    },
  },

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

    // Acorda o banco em segundo plano imediatamente após login.
    // Enquanto o usuário vê o dashboard inicial carregando, o banco já está
    // sendo "despertado" — reduz o risco de timeout na primeira navegação.
    dbPing();

    App._updateBadges();
    App.navigate('infra', 'dashboard');
  },

  // ── NAVIGATE (nicho + secao) ──────────
  navigate(nicho, secao) {
    App.currentNiche   = nicho;
    App.currentSection = secao;

    // Abre o niche correto no accordion
    document.querySelectorAll('.niche-group').forEach(g => {
      g.classList.toggle('open', g.id === `niche-${nicho}`);
    });

    // Marca item ativo
    const route = `${nicho}.${secao}`;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });

    // Spinner + render
    const main = document.getElementById('main-content');
    main.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>`;

    // Guarda qual nicho/secao estamos carregando para o retry funcionar
    const _nicho = nicho, _secao = secao;

    setTimeout(async () => {
      const fn = App._modulos[_nicho]?.[_secao];

      if (!fn) {
        main.innerHTML = `
          <div class="page">
            <div class="empty-state">
              <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <div class="empty-state-title">Módulo em desenvolvimento</div>
              <div class="empty-state-sub">${_nicho} · ${_secao}</div>
            </div>
          </div>`;
        return;
      }

      try {
        await fn(main);
      } catch (err) {
        // Só mostra tela de erro se o módulo não renderizou nada ainda
        // (spinner ainda visível = módulo não chegou a montar a UI)
        const aindaSpinner = !!main.querySelector('.spinner');
        if (aindaSpinner || main.children.length === 0) {
          const msg = err?.message || 'Erro desconhecido';
          const isSlow = msg.includes('demorou') || msg.includes('timeout') || msg.includes('Timeout');
          main.innerHTML = `
            <div class="page fade-in">
              <div class="empty-state" style="height:340px">
                <div style="font-size:48px;margin-bottom:8px">${isSlow ? '⏱' : '⚠️'}</div>
                <div class="empty-state-title" style="color:#f87171">
                  ${isSlow ? 'Banco demorou para responder' : 'Erro ao carregar'}
                </div>
                <div class="empty-state-sub" style="margin-bottom:20px;max-width:360px">
                  ${isSlow
                    ? 'O Supabase estava dormindo e não respondeu a tempo. O banco já foi acordado — tente novamente.'
                    : msg}
                </div>
                <button class="btn btn-primary"
                  onclick="App.navigate('${_nicho}','${_secao}')">
                  ↺ Tentar novamente
                </button>
              </div>
            </div>`;
        }
      }
    }, 80);
  },

  // ── TOGGLE NICHE ACCORDION ────────────
  toggleNiche(nicho) {
    const group = document.getElementById(`niche-${nicho}`);
    if (!group) return;
    const isOpen = group.classList.contains('open');

    // Fecha todos
    document.querySelectorAll('.niche-group').forEach(g => g.classList.remove('open'));

    // Abre clicado (se estava fechado) OU mantém se era o ativo
    if (!isOpen || nicho === App.currentNiche) {
      group.classList.add('open');
    }

    // Se clicar no niche ativo (que ficou aberto), navega para o dashboard dele
    if (nicho !== App.currentNiche && !isOpen) {
      const firstSection = Object.keys(App._modulos[nicho] || {})[0] || 'dashboard';
      App.navigate(nicho, firstSection);
    }
  },

  // ── BADGES ───────────────────────────
  async _updateBadges() {
    try {
      const { count: inop } = await db
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .neq('situacao', 'Operacional');

      const bReg = document.getElementById('badge-infra-registros');
      if (bReg) {
        bReg.textContent = inop || 0;
        bReg.style.display = (inop > 0) ? 'inline-flex' : 'none';
      }

      const { count: crit } = await db
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 'Inoperante');

      const bAlt = document.getElementById('badge-infra-alertas');
      if (bAlt) {
        bAlt.textContent = crit || 0;
        bAlt.style.display = (crit > 0) ? 'inline-flex' : 'none';
      }
    } catch {}
  },

  // ── BUSCA GLOBAL (Ctrl+K) ─────────────
  _setupSearch() {
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
    overlay.classList.contains('open') ? App.closeSearch() : App.openSearch();
  },

  openSearch() {
    const overlay = document.getElementById('search-overlay');
    const input   = document.getElementById('search-input');
    if (!overlay) return;
    overlay.classList.add('open');
    setTimeout(() => input?.focus(), 50);
    document.getElementById('search-results').innerHTML =
      '<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px">Digite para buscar sites, módulos, ocorrências...</div>';
  },

  closeSearch() {
    document.getElementById('search-overlay')?.classList.remove('open');
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
      const sites = await dbQuery(d =>
        d.from('sites').select('id,nome,cidade,risp:risps(nome)')
          .ilike('nome', `%${q}%`).eq('ativo', true).limit(8)
      );
      (sites||[]).forEach(s => resultados.push({
        tipo: 'site', icone: '📡',
        label: s.nome, sub: `${s.cidade||''} · ${s.risp?.nome||''}`,
        acao: `App.closeSearch();App.navigate('infra','base')`
      }));

      const ocorrs = await dbQuery(d =>
        d.from('ocorrencias').select('id,situacao,site:sites(nome,risp:risps(nome))')
          .ilike('sites.nome', `%${q}%`).neq('situacao', 'Operacional').limit(6)
      );
      (ocorrs||[]).filter(o => o.site?.nome?.toLowerCase().includes(ql)).forEach(o => resultados.push({
        tipo: 'ocorrência', icone: '⚠️',
        label: o.site?.nome || '—',
        sub: `${o.situacao} · ${o.site?.risp?.nome||''}`,
        acao: `App.closeSearch();App.navigate('infra','registros')`
      }));
    } catch {}

    // Módulos pesquisáveis
    const modulos = [
      { nicho:'infra',        secao:'dashboard',   label:'Dashboard Infra',       sub:'Indicadores NMS · TETRA',         icone:'📡' },
      { nicho:'infra',        secao:'registros',   label:'Registros de Falhas',   sub:'Ocorrências em aberto',           icone:'⚠️' },
      { nicho:'infra',        secao:'alertas',     label:'Alertas Infra',         sub:'Sites inoperantes · críticos',    icone:'🚨' },
      { nicho:'infra',        secao:'historico',   label:'Histórico Infra',       sub:'Falhas encerradas · timeline',    icone:'📋' },
      { nicho:'infra',        secao:'relatorio',   label:'Relatório Infra',       sub:'PDF · Excel · métricas',          icone:'📄' },
      { nicho:'infra',        secao:'mapa',        label:'Mapa de ERBs',          sub:'Mapa interativo por RISP',        icone:'🗺️' },
      { nicho:'infra',        secao:'base',        label:'Base de Sites',         sub:'Cadastro de ERBs · CSV',          icone:'📡' },
      { nicho:'painel',       secao:'apresentacao', label:'Painel de Apresentação', sub:'Slideshow executivo dos dashboards', icone:'🖥️' },
      { nicho:'missoes',      secao:'dashboard',   label:'Dashboard Missões',     sub:'KPIs · status · tipos · campo',   icone:'🎯' },
      { nicho:'missoes',      secao:'lista',       label:'Missões',               sub:'Operações de campo',              icone:'🎯' },
      { nicho:'infra',        secao:'ordens',      label:'Ordens de Serviço',     sub:'OS e manutenções',                icone:'📝' },
      { nicho:'bi',           secao:'dashboard',   label:'Dashboard BI',          sub:'KPIs consolidados · todos nichos',icone:'🧠' },
      { nicho:'bi',           secao:'registros',   label:'Análises BI',           sub:'Cruzamentos · correlações',       icone:'📊' },
      { nicho:'financeiro',   secao:'dashboard',   label:'Dashboard Financeiro',  sub:'Custos · faturas · contratos',    icone:'💰' },
      { nicho:'financeiro',   secao:'registros',   label:'Faturas / Contratos',   sub:'Energia · vigência · valores',    icone:'🧾' },
      { nicho:'financeiro',   secao:'contratos',   label:'Contratos',             sub:'Fornecedores · vigência',         icone:'📑' },
      { nicho:'equipamentos', secao:'dashboard',   label:'Dashboard Equipamentos',sub:'Inventário · totais · status',    icone:'🔧' },
      { nicho:'equipamentos', secao:'registros',   label:'Registros Equipamentos',sub:'Ficha individual · TEI · série',  icone:'📟' },
      { nicho:'comunicacoes', secao:'dashboard',   label:'Dashboard Comunicações',sub:'Frotas · chamadas · por força',   icone:'📻' },
      { nicho:'comunicacoes', secao:'registros',   label:'Frotas / Chamadas',     sub:'GSSI · PM · PRF · GEFRON',        icone:'📡' },
      { nicho:'comunicacoes', secao:'issi',        label:'ISSI / GSSI',           sub:'Terminais e identificadores',     icone:'📟' },
      { nicho:'system',       secao:'gerenciar',   label:'Gerenciar',             sub:'Administração do sistema',        icone:'⚙️' },
    ];

    modulos
      .filter(m => m.label.toLowerCase().includes(ql) || m.sub.toLowerCase().includes(ql))
      .forEach(m => resultados.push({
        tipo: 'módulo', icone: m.icone,
        label: m.label, sub: m.sub,
        acao: `App.closeSearch();App.navigate('${m.nicho}','${m.secao}')`
      }));

    if (!resultados.length) {
      resultsEl.innerHTML = `<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px">Nenhum resultado para "<strong>${q}</strong>"</div>`;
      return;
    }

    resultsEl.innerHTML = resultados.map((r, i) => `
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
    overlay.onclick = e => { if (e.target === overlay) Modal.close(); };

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
  const d   = new Date(dataStr);
  const ref = dataFim ? new Date(dataFim) : new Date();
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

function formatCurrency(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function daysBadge(dias) {
  const cls = dias >= 30 ? 'crit' : dias > 7 ? 'crit' : dias > 3 ? 'warn' : 'ok';
  return `<span class="days-chip ${cls}">${dias}d</span>`;
}

// ── INICIALIZA ──────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
