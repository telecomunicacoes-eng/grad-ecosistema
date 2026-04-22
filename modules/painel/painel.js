// ═══════════════════════════════════════
// GRAD Ecossistema — PAINEL DE APRESENTAÇÃO
// Slideshow executivo — rotação automática dos dashboards
// ═══════════════════════════════════════

// ── CSS DO PAINEL (injetado uma vez) ──
(function () {
  if (document.getElementById('painel-styles')) return;
  const s = document.createElement('style');
  s.id = 'painel-styles';
  s.textContent = `
    #painel-overlay {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9990;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    .painel-slide-label {
      background: rgba(8,18,36,.9);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 10px;
      padding: 5px 20px;
      font-size: 15px;
      font-weight: 600;
      color: #daeaff;
      letter-spacing: .03em;
      pointer-events: none;
      white-space: nowrap;
    }
    .painel-controls {
      background: rgba(8,18,36,.92);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 18px;
      padding: 8px 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: all;
      box-shadow: 0 8px 40px rgba(0,0,0,.7);
    }
    .painel-btn {
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 9px;
      color: #daeaff;
      font-size: 15px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background .15s, transform .1s;
      flex-shrink: 0;
    }
    .painel-btn:hover { background: rgba(255,255,255,.16); transform: scale(1.07); }
    .painel-btn:active { transform: scale(.95); }
    .painel-btn-exit { color: #f87171; }
    .painel-btn-exit:hover { background: rgba(248,113,113,.15); }
    .painel-btn-full { color: #60a5fa; }
    .painel-btn-full:hover { background: rgba(96,165,250,.12); }
    .painel-sep {
      width: 1px; height: 26px;
      background: rgba(255,255,255,.13);
      margin: 0 2px;
      flex-shrink: 0;
    }
    .painel-dots {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 4px;
    }
    .painel-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,.22);
      cursor: pointer;
      transition: background .2s, transform .2s, width .2s;
      flex-shrink: 0;
    }
    .painel-dot:hover { background: rgba(255,255,255,.45); }
    .painel-dot.active { background: #3b82f6; transform: scale(1.5); }
    .painel-select {
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 9px;
      color: #daeaff;
      font-size: 13px;
      padding: 0 8px;
      height: 36px;
      cursor: pointer;
      font-family: var(--mono);
    }
    /* Modo fullscreen: esconde sidebar e topbar */
    body.painel-fullscreen .sidebar,
    body.painel-fullscreen .topbar { display: none !important; }
    body.painel-fullscreen .main {
      grid-column: 1 / -1 !important;
      grid-row: 1 / -1 !important;
    }
    body.painel-fullscreen .layout {
      grid-template-columns: 1fr !important;
      grid-template-rows: 1fr !important;
    }
  `;
  document.head.appendChild(s);
})();

// ── MÓDULO PAINEL ──
const Painel = {
  _slides: [
    { nicho: 'infra',        secao: 'dashboard', label: 'Infraestrutura', icon: '📡' },
    { nicho: 'missoes',      secao: 'dashboard', label: 'Missões',        icon: '🎯' },
    { nicho: 'financeiro',   secao: 'dashboard', label: 'Financeiro',     icon: '💰' },
    { nicho: 'equipamentos', secao: 'dashboard', label: 'Equipamentos',   icon: '🔧' },
    { nicho: 'comunicacoes', secao: 'dashboard', label: 'Comunicações',   icon: '📻' },
    { nicho: 'bi',           secao: 'dashboard', label: 'Inteligência',   icon: '🧠' },
  ],
  _current:    0,
  _timer:      null,
  _interval:   12000,
  _active:     false,
  _playing:    false,
  _fullscreen: false,
  _escHandler: null,

  // ── TELA DE LANÇAMENTO ────────────────
  render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">🖥️ Painel de Apresentação</div>
            <div class="page-sub">Slideshow executivo com rotação automática dos dashboards</div>
          </div>
        </div>

        <div style="display:flex;justify-content:center;margin-top:40px">
          <div class="card" style="max-width:560px;width:100%;text-align:center;padding:48px 40px">
            <div style="font-size:72px;margin-bottom:16px;line-height:1">🖥️</div>
            <div style="font-size:24px;font-weight:700;color:var(--text);margin-bottom:10px">
              Painel Executivo
            </div>
            <div style="color:var(--text3);font-size:16px;line-height:1.6;margin-bottom:28px">
              Rotação automática pelos dashboards de todos os nichos:<br>
              📡 Infra · 🎯 Missões · 💰 Financeiro · 🔧 Equipamentos · 📻 Comunicações · 🧠 BI
            </div>

            <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:28px">
              <label class="form-label" style="margin:0;white-space:nowrap">Intervalo por slide:</label>
              <select class="form-select" id="painel-launch-interval" style="width:140px">
                <option value="8000">8 segundos</option>
                <option value="12000" selected>12 segundos</option>
                <option value="20000">20 segundos</option>
                <option value="30000">30 segundos</option>
                <option value="60000">1 minuto</option>
                <option value="120000">2 minutos</option>
              </select>
            </div>

            <button class="btn btn-primary" style="font-size:18px;padding:14px 44px;border-radius:12px" onclick="Painel.iniciar()">
              ▶&nbsp;&nbsp;Iniciar Apresentação
            </button>

            <div style="margin-top:20px;font-size:13px;color:var(--text3)">
              Pressione <kbd style="background:rgba(255,255,255,.08);padding:2px 8px;border-radius:5px;font-family:var(--mono)">ESC</kbd>
              para encerrar durante a apresentação
            </div>
          </div>
        </div>
      </div>`;
  },

  // ── INICIAR APRESENTAÇÃO ──────────────
  iniciar() {
    const sel = document.getElementById('painel-launch-interval');
    if (sel) Painel._interval = parseInt(sel.value) || 12000;

    Painel._current = 0;
    Painel._active  = true;
    Painel._playing = true;
    Painel._createOverlay();
    Painel._goTo(0);
    Painel._startTimer();

    // ESC para sair
    if (Painel._escHandler) document.removeEventListener('keydown', Painel._escHandler);
    Painel._escHandler = (e) => { if (e.key === 'Escape') Painel.sair(); };
    document.addEventListener('keydown', Painel._escHandler);
  },

  // ── OVERLAY DE CONTROLES ─────────────
  _createOverlay() {
    Painel._removeOverlay();

    const dotsHTML = Painel._slides.map((s, i) =>
      `<span class="painel-dot${i === 0 ? ' active' : ''}" onclick="Painel._goTo(${i})" title="${s.label}"></span>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.id = 'painel-overlay';
    overlay.innerHTML = `
      <div class="painel-slide-label" id="painel-slide-label">
        ${Painel._slides[0].icon} ${Painel._slides[0].label}
      </div>
      <div class="painel-controls">
        <button class="painel-btn" onclick="Painel.prev()" title="Anterior (◀)">◀</button>
        <div class="painel-dots" id="painel-dots">${dotsHTML}</div>
        <button class="painel-btn" onclick="Painel.next()" title="Próximo (▶)">▶</button>
        <div class="painel-sep"></div>
        <button class="painel-btn" id="painel-play-btn" onclick="Painel.togglePlay()" title="Play / Pause">⏸</button>
        <select class="painel-select" id="painel-interval-sel" onchange="Painel._changeInterval(this.value)" title="Intervalo de rotação">
          <option value="8000">8s</option>
          <option value="12000" selected>12s</option>
          <option value="20000">20s</option>
          <option value="30000">30s</option>
          <option value="60000">1min</option>
          <option value="120000">2min</option>
        </select>
        <div class="painel-sep"></div>
        <button class="painel-btn painel-btn-full" onclick="Painel.toggleFullscreen()" title="Tela cheia">⛶</button>
        <button class="painel-btn painel-btn-exit" onclick="Painel.sair()" title="Encerrar apresentação">✕</button>
      </div>`;

    document.body.appendChild(overlay);

    // Sincroniza seletor com intervalo atual
    const selEl = overlay.querySelector('#painel-interval-sel');
    if (selEl) selEl.value = String(Painel._interval);
  },

  _removeOverlay() {
    document.getElementById('painel-overlay')?.remove();
  },

  // ── NAVEGAR ENTRE SLIDES ──────────────
  _goTo(index) {
    Painel._current = ((index % Painel._slides.length) + Painel._slides.length) % Painel._slides.length;
    const slide = Painel._slides[Painel._current];

    // Atualiza label
    const label = document.getElementById('painel-slide-label');
    if (label) label.textContent = `${slide.icon}  ${slide.label}`;

    // Atualiza dots
    document.querySelectorAll('.painel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === Painel._current);
    });

    // Renderiza o módulo
    App.navigate(slide.nicho, slide.secao);
  },

  next() {
    Painel._goTo(Painel._current + 1);
    if (Painel._playing) { Painel._stopTimer(); Painel._startTimer(); }
  },

  prev() {
    Painel._goTo(Painel._current - 1);
    if (Painel._playing) { Painel._stopTimer(); Painel._startTimer(); }
  },

  // ── PLAY / PAUSE ─────────────────────
  togglePlay() {
    Painel._playing ? Painel.pause() : Painel.play();
  },

  play() {
    Painel._playing = true;
    const btn = document.getElementById('painel-play-btn');
    if (btn) btn.textContent = '⏸';
    Painel._startTimer();
  },

  pause() {
    Painel._playing = false;
    const btn = document.getElementById('painel-play-btn');
    if (btn) btn.textContent = '▶';
    Painel._stopTimer();
  },

  _startTimer() {
    Painel._stopTimer();
    Painel._timer = setInterval(() => Painel.next(), Painel._interval);
  },

  _stopTimer() {
    if (Painel._timer) { clearInterval(Painel._timer); Painel._timer = null; }
  },

  _changeInterval(val) {
    Painel._interval = parseInt(val) || 12000;
    if (Painel._playing) { Painel._stopTimer(); Painel._startTimer(); }
  },

  // ── FULLSCREEN ───────────────────────
  toggleFullscreen() {
    Painel._fullscreen ? Painel._exitFullscreen() : Painel._enterFullscreen();
  },

  _enterFullscreen() {
    Painel._fullscreen = true;
    document.body.classList.add('painel-fullscreen');
    const btn = document.querySelector('.painel-btn-full');
    if (btn) btn.textContent = '⊡';
  },

  _exitFullscreen() {
    Painel._fullscreen = false;
    document.body.classList.remove('painel-fullscreen');
    const btn = document.querySelector('.painel-btn-full');
    if (btn) btn.textContent = '⛶';
  },

  // ── ENCERRAR ─────────────────────────
  sair() {
    Painel._stopTimer();
    Painel._active     = false;
    Painel._playing    = false;
    Painel._fullscreen = false;
    document.body.classList.remove('painel-fullscreen');

    if (Painel._escHandler) {
      document.removeEventListener('keydown', Painel._escHandler);
      Painel._escHandler = null;
    }

    Painel._removeOverlay();
    App.navigate('painel', 'apresentacao');
  }
};
