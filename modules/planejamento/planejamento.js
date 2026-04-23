// ═══════════════════════════════════════
// GRAD Ecossistema — PLANEJAMENTO
// Mapa + manchas KMZ · busca por site · filtro RISP · visão macro
// ═══════════════════════════════════════

const Planejamento = {
  _map:         null,
  _sites:       [],
  _markers:     null,
  _chartsInst:  {},
  _kmzLoaded:   false,
  _kmzLoading:  false,

  // Índices de manchas organizados após parse do KMZ
  _manchas: {
    porSite:  {},   // sbs (string) → [L.imageOverlay, ...]
    porRisp:  {},   // '1','2',...  → [L.imageOverlay, ...]
    todas:    [],   // todas as manchas individuais
  },
  _manchasAtivas: new Set(), // overlays atualmente no mapa

  // ── CSS ────────────────────────────────────────────────────────────────
  _injectCSS() {
    if (document.getElementById('plan-styles')) return;
    const s = document.createElement('style');
    s.id = 'plan-styles';
    s.textContent = `
      #plan-root  { display:flex;flex-direction:column;height:calc(100vh - var(--topbar-h));overflow:hidden }
      #plan-body  { display:flex;flex:1;overflow:hidden }
      #plan-map-col { flex:0 0 63%;position:relative;min-height:0 }
      #plan-map   { width:100%;height:100% }
      #plan-side  { flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:var(--bg) }

      /* KPIs */
      #plan-kpis { display:grid;grid-template-columns:repeat(3,1fr);gap:7px }
      .pkpi { background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:10px 12px }
      .pkpi-v { font-size:24px;font-weight:700;font-family:var(--mono);color:var(--accent2);line-height:1 }
      .pkpi-l { font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-top:3px }

      /* Painel flutuante de busca/filtro — canto superior esquerdo do mapa */
      #plan-search-panel {
        position:absolute;top:10px;left:10px;z-index:999;width:260px;
        background:rgba(10,22,40,.92);backdrop-filter:blur(10px);
        border:1px solid rgba(255,255,255,.13);border-radius:10px;overflow:hidden;
      }
      #plan-search-input {
        width:100%;background:transparent;border:none;outline:none;
        color:#daeaff;font-size:13px;padding:10px 12px;box-sizing:border-box;
        border-bottom:1px solid rgba(255,255,255,.08);
      }
      #plan-search-input::placeholder { color:#5a7a9a }
      #plan-search-results { max-height:200px;overflow-y:auto }
      .psr-item { padding:8px 12px;font-size:12px;cursor:pointer;color:#9ab8d8;display:flex;align-items:center;gap:8px;transition:background .1s }
      .psr-item:hover { background:rgba(61,155,255,.15);color:#daeaff }
      .psr-item-name { flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
      .psr-item-badge { font-size:10px;font-family:monospace;background:rgba(61,155,255,.15);color:#3d9bff;padding:1px 6px;border-radius:4px;flex-shrink:0 }

      /* Filtros RISP flutuantes */
      #plan-risp-panel {
        position:absolute;top:10px;right:10px;z-index:999;
        background:rgba(10,22,40,.92);backdrop-filter:blur(10px);
        border:1px solid rgba(255,255,255,.13);border-radius:10px;padding:10px;
        max-width:180px;
      }
      #plan-risp-panel .pp-title { font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px }
      #plan-risp-btns { display:flex;flex-wrap:wrap;gap:4px }
      .prisp-btn {
        font-size:11px;font-family:monospace;padding:3px 8px;border-radius:5px;cursor:pointer;
        background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#9ab8d8;
        transition:all .15s;
      }
      .prisp-btn:hover  { background:rgba(61,155,255,.2);color:#daeaff }
      .prisp-btn.active { background:rgba(61,155,255,.3);border-color:rgba(61,155,255,.6);color:#3d9bff }

      /* Controles rodapé */
      #plan-footer-ctrl {
        position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
        display:flex;gap:6px;z-index:999;background:rgba(10,22,40,.88);
        backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);
        border-radius:10px;padding:7px 12px;align-items:center;
      }
      .pfc-btn {
        background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);
        color:#daeaff;border-radius:6px;padding:4px 11px;font-size:12px;
        cursor:pointer;transition:background .15s;white-space:nowrap
      }
      .pfc-btn:hover  { background:rgba(255,255,255,.15) }
      .pfc-btn.active { background:rgba(61,155,255,.25);border-color:rgba(61,155,255,.5);color:#3d9bff }
      .pfc-sep { width:1px;background:rgba(255,255,255,.12);margin:0 2px;align-self:stretch }

      /* Status KMZ */
      #plan-kmz-badge {
        position:absolute;bottom:58px;right:10px;z-index:999;
        background:rgba(10,22,40,.85);border:1px solid rgba(255,255,255,.12);
        border-radius:7px;padding:5px 10px;font-size:11px;color:#9ab8d8;font-family:monospace
      }

      /* RISP cards */
      #plan-risp-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:5px }
      .prc { background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:8px 9px;cursor:pointer;transition:border-color .15s }
      .prc:hover { border-color:var(--accent2) }
      .prc.active { border-color:#3d9bff;background:rgba(61,155,255,.08) }
      .prc-name { font-size:10px;font-weight:700;color:var(--accent2);font-family:monospace }
      .prc-cnt  { font-size:17px;font-weight:700;font-family:monospace;color:var(--text);line-height:1.2 }
      .prc-lbl  { font-size:10px;color:var(--text3) }

      /* Fullscreen */
      body.plan-fs #plan-map-col { position:fixed!important;inset:0;z-index:2000;width:100%!important }
      body.plan-fs #plan-side    { display:none }
    `;
    document.head.appendChild(s);
  },

  // ── RENDER ─────────────────────────────────────────────────────────────
  async render(container) {
    Planejamento._injectCSS();
    // Reset estado de manchas ao re-renderizar
    Planejamento._manchasAtivas.clear();

    container.innerHTML = `
      <div id="plan-root">
        <div class="page-header" style="padding:9px 16px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="page-title" style="font-size:16px">🗺️ Planejamento da Rede</div>
            <div class="page-sub">Distribuição geográfica · Cobertura TETRA · ERBs por RISP</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Planejamento._atualizarDados()">↺ Atualizar</button>
        </div>

        <div id="plan-body">

          <!-- ── MAPA ── -->
          <div id="plan-map-col">
            <div id="plan-map"></div>

            <!-- Busca flutuante -->
            <div id="plan-search-panel">
              <input id="plan-search-input" placeholder="🔍  Buscar site pelo nome ou SBS..."
                oninput="Planejamento._onSearch(this.value)"
                onfocus="Planejamento._onSearch(this.value)">
              <div id="plan-search-results"></div>
            </div>

            <!-- Filtro RISP -->
            <div id="plan-risp-panel">
              <div class="pp-title">Filtrar por RISP</div>
              <div id="plan-risp-btns"></div>
            </div>

            <!-- Badge KMZ -->
            <div id="plan-kmz-badge">⏳ Carregando manchas...</div>

            <!-- Controles rodapé -->
            <div id="plan-footer-ctrl">
              <span style="font-size:10px;color:var(--text3);letter-spacing:.06em">CAMADAS:</span>
              <button class="pfc-btn active" id="pfc-sites"  onclick="Planejamento._toggleSites()">📡 Sites</button>
              <button class="pfc-btn"        id="pfc-macro"  onclick="Planejamento._verMacro()">🌐 Macro</button>
              <button class="pfc-btn"        id="pfc-limpar" onclick="Planejamento._limparManchas()">✕ Limpar manchas</button>
              <div class="pfc-sep"></div>
              <span style="font-size:11px;color:var(--text3)">Opacidade</span>
              <input type="range" id="pfc-opacity" min="10" max="100" value="60"
                oninput="Planejamento._setOpacity(this.value)"
                style="width:60px;accent-color:#3d9bff;cursor:pointer">
              <div class="pfc-sep"></div>
              <button class="pfc-btn" onclick="Planejamento._toggleFS()" title="Tela cheia">⛶</button>
            </div>
          </div>

          <!-- ── PAINEL LATERAL ── -->
          <div id="plan-side">
            <div id="plan-kpis">
              <div class="pkpi"><div class="pkpi-v" id="pk-total">—</div><div class="pkpi-l">Total ERBs</div></div>
              <div class="pkpi"><div class="pkpi-v" id="pk-sesp"   style="color:#3d9bff">—</div><div class="pkpi-l">SESP</div></div>
              <div class="pkpi"><div class="pkpi-v" id="pk-gefron" style="color:#22c55e">—</div><div class="pkpi-l">GEFRON</div></div>
              <div class="pkpi"><div class="pkpi-v" id="pk-prf"    style="color:#f59e0b">—</div><div class="pkpi-l">PRF</div></div>
              <div class="pkpi"><div class="pkpi-v" id="pk-coords" style="color:#a78bfa">—</div><div class="pkpi-l">Com coords</div></div>
              <div class="pkpi"><div class="pkpi-v" id="pk-sem"    style="color:#f87171">—</div><div class="pkpi-l">Sem coords</div></div>
            </div>

            <div class="card" style="padding:11px">
              <div class="card-title" style="font-size:11px;margin-bottom:7px">Por Proprietário</div>
              <div style="position:relative;height:150px"><canvas id="plan-chart-prop"></canvas></div>
            </div>

            <div class="card" style="padding:11px">
              <div class="card-title" style="font-size:11px;margin-bottom:8px">Sites por RISP — clique para focar</div>
              <div id="plan-risp-grid"></div>
            </div>

            <div class="card" style="padding:11px">
              <div class="card-title" style="font-size:11px;margin-bottom:7px">Distribuição por RISP</div>
              <div style="position:relative;height:210px"><canvas id="plan-chart-risp"></canvas></div>
            </div>
          </div>
        </div>
      </div>`;

    await Planejamento._initMap();
    await Planejamento._atualizarDados();
    Planejamento._carregarKMZ();
  },

  // ── MAPA ───────────────────────────────────────────────────────────────
  async _initMap() {
    if (Planejamento._map) { Planejamento._map.remove(); Planejamento._map = null; }
    const map = L.map('plan-map', { center:[-13.5,-56.5], zoom:6, zoomControl:true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap © CARTO', maxZoom:19
    }).addTo(map);
    Planejamento._map     = map;
    Planejamento._markers = L.layerGroup().addTo(map);
    Planejamento._showSites = true;
  },

  // ── DADOS ──────────────────────────────────────────────────────────────
  async _atualizarDados() {
    try {
      const sites = await dbQuery(d =>
        d.from('sites').select('*,risp:risps(id,nome)').eq('ativo',true).order('nome')
      );
      Planejamento._sites = sites || [];
      Planejamento._renderKPIs();
      Planejamento._renderMarkers();
      Planejamento._renderRispCards();
      Planejamento._renderRispBtns();
      Planejamento._renderCharts();
    } catch { Toast.show('Erro ao carregar dados', 'error'); }
  },

  _getProp(s) {
    try {
      const o = s.observacoes;
      if (o && o.trimStart().startsWith('{')) return JSON.parse(o).proprietario || 'SESP';
    } catch {}
    return 'SESP';
  },

  // ── KPIs ───────────────────────────────────────────────────────────────
  _renderKPIs() {
    const ss  = Planejamento._sites;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('pk-total',  ss.length);
    set('pk-sesp',   ss.filter(s=>Planejamento._getProp(s)==='SESP').length);
    set('pk-gefron', ss.filter(s=>Planejamento._getProp(s)==='GEFRON').length);
    set('pk-prf',    ss.filter(s=>Planejamento._getProp(s)==='PRF').length);
    const coords = ss.filter(s=>s.latitude!=null&&s.longitude!=null).length;
    set('pk-coords', coords);
    set('pk-sem',    ss.length - coords);
  },

  // ── MARKERS ────────────────────────────────────────────────────────────
  _renderMarkers() {
    if (!Planejamento._markers) return;
    Planejamento._markers.clearLayers();
    const COR = { SESP:'#3d9bff', GEFRON:'#22c55e', PRF:'#f59e0b' };
    Planejamento._sites.forEach(s => {
      if (s.latitude==null||s.longitude==null) return;
      const prop = Planejamento._getProp(s);
      const cor  = COR[prop] || '#9ab8d8';
      const icon = L.divIcon({
        className:'',
        html:`<div style="width:9px;height:9px;border-radius:50%;background:${cor};border:2px solid rgba(255,255,255,.45);box-shadow:0 0 5px ${cor}88"></div>`,
        iconSize:[9,9], iconAnchor:[4,4],
      });
      L.marker([s.latitude,s.longitude],{icon})
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:170px">
            <div style="font-weight:700;margin-bottom:3px;font-size:13px">${s.nome}</div>
            <div style="font-size:11px;color:#666;margin-bottom:5px">${s.cidade||'—'} · ${s.risp?.nome||'—'}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <span style="padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;background:${cor}22;color:${cor};border:1px solid ${cor}44">${prop}</span>
              ${s.sbs ? `<span style="padding:2px 7px;border-radius:4px;font-size:11px;background:#1a2a3a;color:#9ab8d8">SBS ${s.sbs}</span>` : ''}
            </div>
            ${s.latitude ? `<div style="font-size:10px;color:#888;margin-top:4px">${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}</div>` : ''}
            <button onclick="Planejamento._verCoberturasSite('${s.sbs||''}','${s.nome.replace(/'/g,"\\'")}')"
              style="margin-top:7px;width:100%;background:#1a4a7a;color:#daeaff;border:none;border-radius:5px;padding:5px;font-size:11px;cursor:pointer">
              📶 Ver cobertura deste site
            </button>
          </div>`)
        .addTo(Planejamento._markers);
    });
  },

  // ── CARDS RISP ─────────────────────────────────────────────────────────
  _renderRispCards() {
    const grid = document.getElementById('plan-risp-grid');
    if (!grid) return;
    const rispMap = {};
    Planejamento._sites.forEach(s => {
      const n = s.risp?.nome || 'Sem RISP';
      rispMap[n] = (rispMap[n]||0)+1;
    });
    const sorted = Object.entries(rispMap).sort((a,b)=>(parseInt(a[0].replace(/\D/g,''))||99)-(parseInt(b[0].replace(/\D/g,''))||99));
    grid.innerHTML = sorted.map(([nome,cnt])=>`
      <div class="prc" id="prc-${nome.replace(/\s/g,'')}" onclick="Planejamento._focarRisp('${nome}')">
        <div class="prc-name">${nome}</div>
        <div class="prc-cnt">${cnt}</div>
        <div class="prc-lbl">sites</div>
      </div>`).join('');
  },

  // ── BOTÕES RISP (painel flutuante) ─────────────────────────────────────
  _renderRispBtns() {
    const el = document.getElementById('plan-risp-btns');
    if (!el) return;
    const risps = [...new Set(Planejamento._sites.map(s=>s.risp?.nome).filter(Boolean))]
      .sort((a,b)=>(parseInt(a.replace(/\D/g,''))||99)-(parseInt(b.replace(/\D/g,''))||99));
    el.innerHTML = risps.map(r=>`
      <button class="prisp-btn" id="rb-${r.replace(/\s/g,'')}"
        onclick="Planejamento._focarRisp('${r}')">${r}</button>`).join('');
  },

  // ── FOCAR RISP ─────────────────────────────────────────────────────────
  _activeRisp: null,
  _focarRisp(nome) {
    // Highlight card
    document.querySelectorAll('.prc').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('.prisp-btn').forEach(el=>el.classList.remove('active'));
    const key = nome.replace(/\s/g,'');
    document.getElementById(`prc-${key}`)?.classList.add('active');
    document.getElementById(`rb-${key}`)?.classList.add('active');

    // Fitbounds
    const sites = Planejamento._sites.filter(s=>s.risp?.nome===nome&&s.latitude!=null);
    if (sites.length) Planejamento._map.fitBounds(sites.map(s=>[s.latitude,s.longitude]),{padding:[40,40]});

    // Mostrar manchas globais da RISP
    const num = nome.match(/\d+/)?.[0];
    if (num) Planejamento._verCoberturaRisp(num);

    Planejamento._activeRisp = nome;
  },

  // ── BUSCA ──────────────────────────────────────────────────────────────
  _onSearch(q) {
    const res = document.getElementById('plan-search-results');
    if (!res) return;
    q = q.trim().toLowerCase();
    if (!q) { res.innerHTML=''; return; }

    const matches = Planejamento._sites.filter(s=>
      s.nome?.toLowerCase().includes(q) ||
      String(s.sbs||'').includes(q) ||
      s.cidade?.toLowerCase().includes(q)
    ).slice(0,10);

    if (!matches.length) {
      res.innerHTML = `<div class="psr-item" style="color:var(--text3);cursor:default">Nenhum site encontrado</div>`;
      return;
    }
    res.innerHTML = matches.map(s=>`
      <div class="psr-item" onclick="Planejamento._selecionarSite('${s.id}','${(s.sbs||'')}','${s.nome.replace(/'/g,"\\'")}')">
        <span class="psr-item-name">${s.nome}</span>
        ${s.sbs ? `<span class="psr-item-badge">SBS ${s.sbs}</span>` : ''}
      </div>`).join('');
  },

  _selecionarSite(id, sbs, nome) {
    // Fecha busca
    const res = document.getElementById('plan-search-results');
    if (res) res.innerHTML = '';
    const inp = document.getElementById('plan-search-input');
    if (inp) inp.value = nome;

    // Centraliza no mapa
    const site = Planejamento._sites.find(s=>s.id===id);
    if (site?.latitude) {
      Planejamento._map.setView([site.latitude,site.longitude],13,{animate:true});
    }

    // Mostra cobertura do site
    Planejamento._verCoberturasSite(sbs, nome);
  },

  // ── MANCHAS — CARREGAR KMZ ──────────────────────────────────────────────
  async _carregarKMZ() {
    if (Planejamento._kmzLoaded || Planejamento._kmzLoading) return;
    Planejamento._kmzLoading = true;
    const badge = document.getElementById('plan-kmz-badge');

    try {
      // JSZip
      if (typeof JSZip === 'undefined') {
        await new Promise((res,rej)=>{
          const s=document.createElement('script');
          s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload=res; s.onerror=rej; document.head.appendChild(s);
        });
      }

      if (badge) badge.textContent = '⏳ Lendo KMZ...';
      const resp   = await fetch('assets/kmz/cobertura.kmz');
      const buf    = await resp.arrayBuffer();
      const zip    = await JSZip.loadAsync(buf);
      const kmlTxt = await zip.file('doc.kml').async('string');
      const kmlDoc = new DOMParser().parseFromString(kmlTxt,'text/xml');
      const ovs    = kmlDoc.querySelectorAll('GroundOverlay');

      if (badge) badge.textContent = `⏳ Carregando ${ovs.length} manchas...`;

      let loaded = 0;
      for (const ov of ovs) {
        const name  = ov.querySelector('name')?.textContent || '';
        const href  = ov.querySelector('Icon href')?.textContent || '';
        const north = parseFloat(ov.querySelector('north')?.textContent);
        const south = parseFloat(ov.querySelector('south')?.textContent);
        const east  = parseFloat(ov.querySelector('east')?.textContent);
        const west  = parseFloat(ov.querySelector('west')?.textContent);
        if (!href||isNaN(north)||isNaN(south)||isNaN(east)||isNaN(west)) continue;

        const fname   = href.replace('files/','');
        const imgFile = zip.file(fname) || zip.file(`files/${fname}`);
        if (!imgFile) continue;

        const blob   = await imgFile.async('blob');
        const url    = URL.createObjectURL(blob);
        const overlay = L.imageOverlay(url, [[south,west],[north,east]], { opacity:0.6, interactive:false });

        // ── Classificar a mancha ──────────────────────────────────────
        // Global por RISP
        const rispMatch = fname.match(/RISP[\s_-]?0*(\d+)/i) || name.match(/RISP[\s_-]?0*(\d+)/i);
        if (rispMatch) {
          const num = rispMatch[1];
          if (!Planejamento._manchas.porRisp[num]) Planejamento._manchas.porRisp[num] = [];
          Planejamento._manchas.porRisp[num].push(overlay);
        }

        // Individual por site — padrão: cov\d+_SBSNUMBER
        const sbsMatch = fname.match(/cov\d+_0*(\d{4,6})/i);
        if (sbsMatch) {
          const sbs = sbsMatch[1];
          if (!Planejamento._manchas.porSite[sbs]) Planejamento._manchas.porSite[sbs] = [];
          Planejamento._manchas.porSite[sbs].push(overlay);
          Planejamento._manchas.todas.push(overlay);
        }

        loaded++;
        if (loaded % 20 === 0 && badge) badge.textContent = `⏳ ${loaded}/${ovs.length} manchas...`;
      }

      Planejamento._kmzLoaded  = true;
      Planejamento._kmzLoading = false;
      if (badge) badge.textContent = `✅ ${loaded} manchas prontas`;
      setTimeout(()=>{ if(badge) badge.style.display='none'; }, 3000);
      Toast.show(`${loaded} manchas de cobertura carregadas`, 'success');

    } catch (err) {
      Planejamento._kmzLoading = false;
      if (badge) badge.textContent = '⚠ Manchas indisponíveis';
      console.warn('[KMZ]', err.message);
    }
  },

  // ── CONTROLE DE MANCHAS ────────────────────────────────────────────────
  _limparManchas() {
    Planejamento._manchasAtivas.forEach(ov => {
      try { Planejamento._map.removeLayer(ov); } catch {}
    });
    Planejamento._manchasAtivas.clear();
  },

  _adicionarManchas(overlays) {
    overlays.forEach(ov => {
      if (!Planejamento._manchasAtivas.has(ov)) {
        ov.addTo(Planejamento._map);
        Planejamento._manchasAtivas.add(ov);
      }
    });
  },

  // Mostra manchas de um site específico pelo SBS
  _verCoberturasSite(sbs, nome) {
    if (!Planejamento._kmzLoaded) { Toast.show('Aguarde — manchas ainda carregando...','warn'); return; }
    sbs = String(sbs || '').replace(/^0+/,''); // remove zeros à esquerda
    const manchas = Planejamento._manchas.porSite[sbs] || [];

    // Tenta variações (com zeros à esquerda)
    const tentativas = [sbs, sbs.padStart(6,'0'), sbs.padStart(5,'0')];
    let found = [];
    for (const t of tentativas) {
      if (Planejamento._manchas.porSite[t]?.length) { found = Planejamento._manchas.porSite[t]; break; }
    }

    Planejamento._limparManchas();
    if (found.length) {
      Planejamento._adicionarManchas(found);
      Toast.show(`${found.length} mancha(s) de cobertura — ${nome}`, 'success');
    } else {
      Toast.show(`Sem mancha de cobertura para ${nome||'este site'}`, 'warn');
    }
  },

  // Mostra manchas globais de uma RISP
  _verCoberturaRisp(num) {
    if (!Planejamento._kmzLoaded) return;
    const manchas = Planejamento._manchas.porRisp[num] ||
                    Planejamento._manchas.porRisp[String(parseInt(num))] || [];
    Planejamento._limparManchas();
    if (manchas.length) {
      Planejamento._adicionarManchas(manchas);
      Toast.show(`Cobertura RISP ${num} — ${manchas.length} camada(s)`, 'success');
    }
  },

  // Visão macro — todas as manchas individuais
  _verMacro() {
    if (!Planejamento._kmzLoaded) { Toast.show('Aguarde — manchas ainda carregando...','warn'); return; }
    const btn = document.getElementById('pfc-macro');
    const jáAtivo = btn?.classList.contains('active');

    if (jáAtivo) {
      Planejamento._limparManchas();
      btn?.classList.remove('active');
      return;
    }

    Planejamento._limparManchas();
    // Opacidade menor pra não poluir
    Planejamento._manchas.todas.forEach(ov => ov.setOpacity(0.25));
    Planejamento._adicionarManchas(Planejamento._manchas.todas);
    btn?.classList.add('active');
    Planejamento._map.setView([-13.5,-56.5],6,{animate:true});
    Toast.show(`Visão macro — ${Planejamento._manchas.todas.length} manchas`, 'success');
  },

  // ── OPACIDADE ──────────────────────────────────────────────────────────
  _setOpacity(val) {
    const op = val / 100;
    Planejamento._manchasAtivas.forEach(ov => ov.setOpacity(op));
  },

  // ── SITES ON/OFF ───────────────────────────────────────────────────────
  _showSites: true,
  _toggleSites() {
    Planejamento._showSites = !Planejamento._showSites;
    document.getElementById('pfc-sites')?.classList.toggle('active', Planejamento._showSites);
    if (Planejamento._showSites) Planejamento._markers.addTo(Planejamento._map);
    else Planejamento._map.removeLayer(Planejamento._markers);
  },

  // ── FULLSCREEN ─────────────────────────────────────────────────────────
  _toggleFS() {
    const isFS = document.body.classList.toggle('plan-fs');
    setTimeout(()=>Planejamento._map?.invalidateSize(),200);
    const btn = document.querySelector('#plan-footer-ctrl .pfc-btn:last-child');
    if (btn) btn.textContent = isFS ? '✕' : '⛶';
    if (isFS) document.addEventListener('keydown', Planejamento._escHandler);
    else document.removeEventListener('keydown', Planejamento._escHandler);
  },
  _escHandler(e) { if(e.key==='Escape') Planejamento._toggleFS(); },

  // ── GRÁFICOS ───────────────────────────────────────────────────────────
  _destroyChart(id) {
    if (Planejamento._chartsInst[id]) { Planejamento._chartsInst[id].destroy(); delete Planejamento._chartsInst[id]; }
  },

  _renderCharts() {
    Planejamento._renderChartProp();
    Planejamento._renderChartRisp();
  },

  _renderChartProp() {
    Planejamento._destroyChart('prop');
    const ss = Planejamento._sites;
    const ctx = document.getElementById('plan-chart-prop');
    if (!ctx) return;
    Planejamento._chartsInst.prop = new Chart(ctx, {
      type:'doughnut',
      data:{
        labels:['SESP','GEFRON','PRF'],
        datasets:[{
          data:[
            ss.filter(s=>Planejamento._getProp(s)==='SESP').length,
            ss.filter(s=>Planejamento._getProp(s)==='GEFRON').length,
            ss.filter(s=>Planejamento._getProp(s)==='PRF').length,
          ],
          backgroundColor:['#3d9bff','#22c55e','#f59e0b'],
          borderWidth:0,
        }]
      },
      options:{
        cutout:'68%',
        plugins:{ legend:{ position:'right', labels:{ color:'#9ab8d8',font:{size:11},boxWidth:10 } } }
      }
    });
  },

  _renderChartRisp() {
    Planejamento._destroyChart('risp');
    const rispMap = {};
    Planejamento._sites.forEach(s=>{
      const n = s.risp?.nome||'Sem RISP';
      if (!rispMap[n]) rispMap[n]={SESP:0,GEFRON:0,PRF:0};
      rispMap[n][Planejamento._getProp(s)]++;
    });
    const labels = Object.keys(rispMap).sort((a,b)=>(parseInt(a.replace(/\D/g,''))||99)-(parseInt(b.replace(/\D/g,''))||99));
    const ctx = document.getElementById('plan-chart-risp');
    if (!ctx) return;
    Planejamento._chartsInst.risp = new Chart(ctx,{
      type:'bar',
      data:{
        labels,
        datasets:[
          {label:'SESP',   data:labels.map(l=>rispMap[l]?.SESP||0),   backgroundColor:'#3d9bff88'},
          {label:'GEFRON', data:labels.map(l=>rispMap[l]?.GEFRON||0), backgroundColor:'#22c55e88'},
          {label:'PRF',    data:labels.map(l=>rispMap[l]?.PRF||0),    backgroundColor:'#f59e0b88'},
        ]
      },
      options:{
        indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#9ab8d8',font:{size:10},boxWidth:10}}},
        scales:{
          x:{stacked:true, ticks:{color:'#9ab8d8',font:{size:9}}, grid:{color:'rgba(255,255,255,.05)'}},
          y:{stacked:true, ticks:{color:'#9ab8d8',font:{size:9}}, grid:{color:'rgba(255,255,255,.05)'}},
        }
      }
    });
  },
};
