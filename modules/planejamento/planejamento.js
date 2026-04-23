// ═══════════════════════════════════════
// GRAD Ecossistema — PLANEJAMENTO
// Dashboard de estrutura da rede (sem status operacional)
// Mapa com manchas KMZ · KPIs · Gráficos · Base por RISP
// ═══════════════════════════════════════

const Planejamento = {
  _map:        null,
  _sites:      [],
  _markers:    null,
  _kmzLayers:  { global: [], individual: [] },
  _kmzLoaded:  false,
  _chartsInst: {},

  // ── CSS injetado uma vez ────────────────────────────────────────────────
  _injectCSS() {
    if (document.getElementById('plan-styles')) return;
    const s = document.createElement('style');
    s.id = 'plan-styles';
    s.textContent = `
      #plan-root { display:flex; flex-direction:column; height:calc(100vh - var(--topbar-h)); overflow:hidden; }
      #plan-body  { display:flex; flex:1; overflow:hidden; }
      #plan-map-col { flex:0 0 62%; position:relative; }
      #plan-map   { width:100%; height:100%; }
      #plan-side  { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:12px; background:var(--bg); }

      /* KPIs */
      #plan-kpis  { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .plan-kpi   { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:12px 14px; }
      .plan-kpi-val { font-size:26px; font-weight:700; font-family:var(--mono); color:var(--accent2); line-height:1; }
      .plan-kpi-lbl { font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.06em; margin-top:4px; }

      /* Controles mapa */
      #plan-map-controls {
        position:absolute; bottom:16px; left:50%; transform:translateX(-50%);
        display:flex; gap:6px; z-index:999; background:rgba(10,22,40,.85);
        backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.12);
        border-radius:10px; padding:8px 12px;
      }
      .plan-ctrl-btn {
        background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.15);
        color:#daeaff; border-radius:6px; padding:5px 12px; font-size:12px;
        cursor:pointer; transition:background .15s; white-space:nowrap;
      }
      .plan-ctrl-btn:hover  { background:rgba(255,255,255,.15); }
      .plan-ctrl-btn.active { background:rgba(61,155,255,.25); border-color:rgba(61,155,255,.5); color:#3d9bff; }
      .plan-ctrl-sep { width:1px; background:rgba(255,255,255,.12); margin:0 2px; }

      /* Fullscreen */
      body.plan-fullscreen #plan-map-col { position:fixed!important; inset:0; z-index:2000; flex:none; width:100%!important; }
      body.plan-fullscreen #plan-side    { display:none; }
      body.plan-fullscreen #plan-map-controls { bottom:24px; }

      /* RISP cards */
      #plan-risps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
      .plan-risp-card  { background:var(--surface2); border:1px solid var(--border); border-radius:8px;
        padding:9px 10px; cursor:pointer; transition:border-color .15s; }
      .plan-risp-card:hover { border-color:var(--accent2); }
      .plan-risp-name  { font-size:11px; font-weight:700; color:var(--accent2); font-family:var(--mono); }
      .plan-risp-cnt   { font-size:18px; font-weight:700; font-family:var(--mono); color:var(--text); line-height:1.2; }
      .plan-risp-lbl   { font-size:10px; color:var(--text3); }

      /* KMZ loading */
      #plan-kmz-status { position:absolute; top:10px; right:10px; z-index:999;
        background:rgba(10,22,40,.85); border:1px solid rgba(255,255,255,.12);
        border-radius:8px; padding:6px 12px; font-size:11px; color:#9ab8d8; font-family:var(--mono); }
    `;
    document.head.appendChild(s);
  },

  // ── RENDER PRINCIPAL ────────────────────────────────────────────────────
  async render(container) {
    Planejamento._injectCSS();
    container.innerHTML = `
      <div id="plan-root">
        <!-- Barra de título -->
        <div class="page-header" style="padding:10px 16px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="page-title">🗺️ Planejamento</div>
            <div class="page-sub">Estrutura geográfica da rede TETRA — cobertura e distribuição de ERBs</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Planejamento._atualizarDados()">↺ Atualizar</button>
        </div>

        <div id="plan-body">
          <!-- Mapa -->
          <div id="plan-map-col">
            <div id="plan-map"></div>
            <div id="plan-kmz-status" style="display:none">⏳ Carregando manchas...</div>

            <!-- Controles flutuantes -->
            <div id="plan-map-controls">
              <span style="font-size:11px;color:var(--text3);align-self:center;margin-right:4px">CAMADAS:</span>
              <button class="plan-ctrl-btn active" id="ctrl-sites"    onclick="Planejamento._toggleLayer('sites')">📡 Sites</button>
              <button class="plan-ctrl-btn"         id="ctrl-global"  onclick="Planejamento._toggleLayer('global')">🌐 Cobertura Global</button>
              <button class="plan-ctrl-btn"         id="ctrl-indiv"   onclick="Planejamento._toggleLayer('individual')">📶 Cobertura por Site</button>
              <div class="plan-ctrl-sep"></div>
              <input type="range" id="ctrl-opacity" min="10" max="100" value="60" title="Opacidade das manchas"
                oninput="Planejamento._setOpacity(this.value)"
                style="width:70px;accent-color:#3d9bff;cursor:pointer">
              <div class="plan-ctrl-sep"></div>
              <button class="plan-ctrl-btn" onclick="Planejamento._toggleFullscreen()" title="Tela cheia">⛶</button>
            </div>
          </div>

          <!-- Painel lateral -->
          <div id="plan-side">
            <!-- KPIs -->
            <div id="plan-kpis">
              <div class="plan-kpi"><div class="plan-kpi-val" id="pk-total">—</div><div class="plan-kpi-lbl">Total ERBs</div></div>
              <div class="plan-kpi"><div class="plan-kpi-val" id="pk-sesp" style="color:#3d9bff">—</div><div class="plan-kpi-lbl">SESP</div></div>
              <div class="plan-kpi"><div class="plan-kpi-val" id="pk-gefron" style="color:#22c55e">—</div><div class="plan-kpi-lbl">GEFRON</div></div>
              <div class="plan-kpi"><div class="plan-kpi-val" id="pk-prf" style="color:#f59e0b">—</div><div class="plan-kpi-lbl">PRF</div></div>
              <div class="plan-kpi"><div class="plan-kpi-val" id="pk-coords" style="color:#a78bfa">—</div><div class="plan-kpi-lbl">Com coordenadas</div></div>
              <div class="plan-kpi"><div class="plan-kpi-val" id="pk-sem" style="color:#f87171">—</div><div class="plan-kpi-lbl">Sem coordenadas</div></div>
            </div>

            <!-- Gráfico proprietário -->
            <div class="card" style="padding:12px">
              <div class="card-title" style="font-size:12px;margin-bottom:8px">Distribuição por Proprietário</div>
              <div style="position:relative;height:160px"><canvas id="plan-chart-prop"></canvas></div>
            </div>

            <!-- Cards RISP -->
            <div class="card" style="padding:12px">
              <div class="card-title" style="font-size:12px;margin-bottom:8px">Sites por RISP</div>
              <div id="plan-risps-grid"></div>
            </div>

            <!-- Gráfico barras RISP -->
            <div class="card" style="padding:12px">
              <div class="card-title" style="font-size:12px;margin-bottom:8px">Sites por RISP — Proprietário</div>
              <div style="position:relative;height:220px"><canvas id="plan-chart-risp"></canvas></div>
            </div>
          </div>
        </div>
      </div>`;

    await Planejamento._initMap();
    await Planejamento._atualizarDados();
    Planejamento._carregarKMZ();
  },

  // ── MAPA ────────────────────────────────────────────────────────────────
  async _initMap() {
    if (Planejamento._map) {
      Planejamento._map.remove();
      Planejamento._map = null;
    }

    const map = L.map('plan-map', {
      center: [-13.5, -56.5],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 18,
    }).addTo(map);

    Planejamento._map       = map;
    Planejamento._markers   = L.layerGroup().addTo(map);
    Planejamento._layerGlobal = L.layerGroup();
    Planejamento._layerIndiv  = L.layerGroup();
  },

  // ── DADOS ───────────────────────────────────────────────────────────────
  async _atualizarDados() {
    try {
      const sites = await dbQuery(d =>
        d.from('sites').select('*, risp:risps(id,nome)').eq('ativo', true).order('nome')
      );
      Planejamento._sites = sites || [];
      Planejamento._renderKPIs();
      Planejamento._renderMarkers();
      Planejamento._renderRisps();
      Planejamento._renderCharts();
    } catch (err) {
      Toast.show('Erro ao carregar dados de planejamento', 'error');
    }
  },

  _getProp(s) {
    try {
      const obs = s.observacoes;
      if (obs && obs.trimStart().startsWith('{')) {
        return JSON.parse(obs).proprietario || 'SESP';
      }
    } catch {}
    return 'SESP';
  },

  // ── KPIs ────────────────────────────────────────────────────────────────
  _renderKPIs() {
    const sites  = Planejamento._sites;
    const sesp   = sites.filter(s => Planejamento._getProp(s) === 'SESP').length;
    const gefron = sites.filter(s => Planejamento._getProp(s) === 'GEFRON').length;
    const prf    = sites.filter(s => Planejamento._getProp(s) === 'PRF').length;
    const coords = sites.filter(s => s.latitude != null && s.longitude != null).length;
    const sem    = sites.length - coords;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('pk-total',  sites.length);
    set('pk-sesp',   sesp);
    set('pk-gefron', gefron);
    set('pk-prf',    prf);
    set('pk-coords', coords);
    set('pk-sem',    sem);
  },

  // ── MARKERS ─────────────────────────────────────────────────────────────
  _renderMarkers() {
    if (!Planejamento._markers) return;
    Planejamento._markers.clearLayers();

    const COR = { SESP: '#3d9bff', GEFRON: '#22c55e', PRF: '#f59e0b' };

    Planejamento._sites.forEach(s => {
      if (s.latitude == null || s.longitude == null) return;
      const prop  = Planejamento._getProp(s);
      const cor   = COR[prop] || '#9ab8d8';
      const icon  = L.divIcon({
        className: '',
        html: `<div style="
          width:10px;height:10px;border-radius:50%;
          background:${cor};border:2px solid rgba(255,255,255,.5);
          box-shadow:0 0 6px ${cor}88;
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const mk = L.marker([s.latitude, s.longitude], { icon })
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px">
            <div style="font-weight:700;margin-bottom:4px">${s.nome}</div>
            <div style="font-size:12px;color:#666">${s.cidade || '—'} · ${s.risp?.nome || '—'}</div>
            <div style="margin-top:4px">
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;
                background:${cor}22;color:${cor};border:1px solid ${cor}44">${prop}</span>
            </div>
          </div>`);

      Planejamento._markers.addLayer(mk);
    });
  },

  // ── CARDS RISP ──────────────────────────────────────────────────────────
  _renderRisps() {
    const grid = document.getElementById('plan-risps-grid');
    if (!grid) return;

    const rispMap = {};
    Planejamento._sites.forEach(s => {
      const nome = s.risp?.nome || 'Sem RISP';
      rispMap[nome] = (rispMap[nome] || 0) + 1;
    });

    const sorted = Object.entries(rispMap).sort((a, b) => {
      const na = parseInt(a[0].replace(/\D/g,'')) || 99;
      const nb = parseInt(b[0].replace(/\D/g,'')) || 99;
      return na - nb;
    });

    grid.innerHTML = sorted.map(([nome, cnt]) => `
      <div class="plan-risp-card" onclick="Planejamento._focarRisp('${nome}')">
        <div class="plan-risp-name">${nome}</div>
        <div class="plan-risp-cnt">${cnt}</div>
        <div class="plan-risp-lbl">sites</div>
      </div>`).join('');
  },

  _focarRisp(nome) {
    const sites = Planejamento._sites.filter(s => s.risp?.nome === nome && s.latitude != null);
    if (!sites.length) { Toast.show(`Nenhum site com coordenadas em ${nome}`, 'warn'); return; }
    const latlngs = sites.map(s => [s.latitude, s.longitude]);
    Planejamento._map.fitBounds(latlngs, { padding: [40, 40] });
  },

  // ── GRÁFICOS ─────────────────────────────────────────────────────────────
  _renderCharts() {
    Planejamento._renderChartProp();
    Planejamento._renderChartRisp();
  },

  _destroyChart(id) {
    if (Planejamento._chartsInst[id]) {
      Planejamento._chartsInst[id].destroy();
      delete Planejamento._chartsInst[id];
    }
  },

  _renderChartProp() {
    Planejamento._destroyChart('prop');
    const sites  = Planejamento._sites;
    const sesp   = sites.filter(s => Planejamento._getProp(s) === 'SESP').length;
    const gefron = sites.filter(s => Planejamento._getProp(s) === 'GEFRON').length;
    const prf    = sites.filter(s => Planejamento._getProp(s) === 'PRF').length;
    const ctx = document.getElementById('plan-chart-prop');
    if (!ctx) return;
    Planejamento._chartsInst.prop = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['SESP', 'GEFRON', 'PRF'],
        datasets: [{
          data: [sesp, gefron, prf],
          backgroundColor: ['#3d9bff', '#22c55e', '#f59e0b'],
          borderWidth: 0,
        }]
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { position:'right', labels:{ color:'#9ab8d8', font:{size:11}, boxWidth:10 } },
        }
      }
    });
  },

  _renderChartRisp() {
    Planejamento._destroyChart('risp');
    const rispMap = {};
    Planejamento._sites.forEach(s => {
      const nome = s.risp?.nome || 'Sem RISP';
      const prop = Planejamento._getProp(s);
      if (!rispMap[nome]) rispMap[nome] = { SESP:0, GEFRON:0, PRF:0 };
      rispMap[nome][prop] = (rispMap[nome][prop] || 0) + 1;
    });

    const labels = Object.keys(rispMap).sort((a,b) => {
      return (parseInt(a.replace(/\D/g,''))||99) - (parseInt(b.replace(/\D/g,''))||99);
    });

    const ctx = document.getElementById('plan-chart-risp');
    if (!ctx) return;
    Planejamento._chartsInst.risp = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label:'SESP',   data: labels.map(l => rispMap[l]?.SESP||0),   backgroundColor:'#3d9bff88' },
          { label:'GEFRON', data: labels.map(l => rispMap[l]?.GEFRON||0), backgroundColor:'#22c55e88' },
          { label:'PRF',    data: labels.map(l => rispMap[l]?.PRF||0),    backgroundColor:'#f59e0b88' },
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels:{ color:'#9ab8d8', font:{size:10}, boxWidth:10 } } },
        scales: {
          x: { stacked:true, ticks:{color:'#9ab8d8',font:{size:9}}, grid:{color:'rgba(255,255,255,.05)'} },
          y: { stacked:true, ticks:{color:'#9ab8d8',font:{size:9}}, grid:{color:'rgba(255,255,255,.05)'} },
        }
      }
    });
  },

  // ── KMZ — carrega e exibe manchas ────────────────────────────────────────
  async _carregarKMZ() {
    if (Planejamento._kmzLoaded) return;
    const statusEl = document.getElementById('plan-kmz-status');
    if (statusEl) statusEl.style.display = '';

    try {
      // Carrega JSZip se não tiver
      if (typeof JSZip === 'undefined') {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      const resp = await fetch('assets/kmz/cobertura.kmz');
      const buf  = await resp.arrayBuffer();
      const zip  = await JSZip.loadAsync(buf);

      // Lê KML
      const kmlText = await zip.file('doc.kml').async('string');
      const parser  = new DOMParser();
      const kmlDoc  = parser.parseFromString(kmlText, 'text/xml');

      // Coleta todos os GroundOverlays
      const overlays = kmlDoc.querySelectorAll('GroundOverlay');
      let   loaded   = 0;

      for (const ov of overlays) {
        const name  = ov.querySelector('name')?.textContent || '';
        const href  = ov.querySelector('Icon href')?.textContent || '';
        const north = parseFloat(ov.querySelector('north')?.textContent);
        const south = parseFloat(ov.querySelector('south')?.textContent);
        const east  = parseFloat(ov.querySelector('east')?.textContent);
        const west  = parseFloat(ov.querySelector('west')?.textContent);

        if (!href || isNaN(north) || isNaN(south)) continue;

        // Extrai o nome do arquivo (sem "files/")
        const fname = href.replace('files/', '');
        const imgFile = zip.file(fname) || zip.file(`files/${fname}`);
        if (!imgFile) continue;

        const blob   = await imgFile.async('blob');
        const imgUrl = URL.createObjectURL(blob);
        const bounds = [[south, west], [north, east]];

        const overlay = L.imageOverlay(imgUrl, bounds, { opacity: 0.6, interactive: false });

        // Classifica: global (por RISP) ou individual (por site)
        const isGlobal = /RISP|global|Cobertura/i.test(name) || /RISP|global/i.test(fname);
        if (isGlobal) {
          Planejamento._kmzLayers.global.push(overlay);
        } else {
          Planejamento._kmzLayers.individual.push(overlay);
        }
        loaded++;
      }

      Planejamento._kmzLoaded = true;
      if (statusEl) statusEl.style.display = 'none';
      Toast.show(`${loaded} manchas de cobertura carregadas`, 'success');

    } catch (err) {
      if (statusEl) { statusEl.textContent = '⚠ Manchas não carregadas'; }
      console.warn('[KMZ]', err.message);
    }
  },

  // ── CONTROLES DE CAMADA ─────────────────────────────────────────────────
  _layerState: { sites: true, global: false, individual: false },

  _toggleLayer(layer) {
    const state = Planejamento._layerState;
    state[layer] = !state[layer];

    const btn = document.getElementById(`ctrl-${layer}`);
    if (btn) btn.classList.toggle('active', state[layer]);

    const map = Planejamento._map;
    if (!map) return;

    if (layer === 'sites') {
      if (state.sites) Planejamento._markers.addTo(map);
      else map.removeLayer(Planejamento._markers);
    }

    if (layer === 'global') {
      if (!Planejamento._kmzLoaded) {
        Toast.show('Aguarde — carregando manchas...', 'info');
        return;
      }
      Planejamento._kmzLayers.global.forEach(l => {
        if (state.global) l.addTo(map); else map.removeLayer(l);
      });
    }

    if (layer === 'individual') {
      if (!Planejamento._kmzLoaded) {
        Toast.show('Aguarde — carregando manchas...', 'info');
        return;
      }
      Planejamento._kmzLayers.individual.forEach(l => {
        if (state.individual) l.addTo(map); else map.removeLayer(l);
      });
    }
  },

  _setOpacity(val) {
    const op = val / 100;
    Planejamento._kmzLayers.global.forEach(l => l.setOpacity(op));
    Planejamento._kmzLayers.individual.forEach(l => l.setOpacity(op));
  },

  // ── FULLSCREEN ──────────────────────────────────────────────────────────
  _toggleFullscreen() {
    const isFS = document.body.classList.toggle('plan-fullscreen');
    setTimeout(() => Planejamento._map?.invalidateSize(), 200);
    const btn = document.querySelector('#plan-map-controls .plan-ctrl-btn:last-child');
    if (btn) btn.textContent = isFS ? '✕' : '⛶';

    if (isFS) {
      document.addEventListener('keydown', Planejamento._escHandler);
    } else {
      document.removeEventListener('keydown', Planejamento._escHandler);
    }
  },

  _escHandler(e) {
    if (e.key === 'Escape') Planejamento._toggleFullscreen();
  },
};
