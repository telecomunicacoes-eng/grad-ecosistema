// ═══════════════════════════════════════
// GRAD Ecossistema — MAPA
// Visualização geoespacial dos sites
// ═══════════════════════════════════════

const Mapa = {
  _map: null,
  _markers: [],
  _camada: null,

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in" style="display:flex;flex-direction:column;height:calc(100vh - var(--topbar-h) - 32px)">
        <div class="page-header" style="flex-shrink:0">
          <div>
            <div class="page-title">Mapa Operacional</div>
            <div class="page-sub">Distribuição geográfica dos sites</div>
          </div>
          <div class="page-actions">
            <select class="form-select" id="mapa-filtro-sit" onchange="Mapa.filtrar()" style="width:170px">
              <option value="">Todos os status</option>
              <option value="Operacional">Operacional</option>
              <option value="Inoperante">Inoperante</option>
              <option value="Parcial/Em analise">Parcial/Análise</option>
              <option value="Modo Local">Modo Local</option>
            </select>
            <select class="form-select" id="mapa-filtro-risp" onchange="Mapa.filtrar()" style="width:150px">
              <option value="">Todas RISPs</option>
            </select>
          </div>
        </div>
        <!-- Legenda -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;flex-shrink:0">
          <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)"><span style="width:12px;height:12px;border-radius:50%;background:#22c55e;display:inline-block"></span>Operacional</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)"><span style="width:12px;height:12px;border-radius:50%;background:#ef4444;display:inline-block"></span>Inoperante</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)"><span style="width:12px;height:12px;border-radius:50%;background:#fbbf24;display:inline-block"></span>Parcial/Análise</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)"><span style="width:12px;height:12px;border-radius:50%;background:#a78bfa;display:inline-block"></span>Modo Local</span>
          <span id="mapa-count" style="margin-left:auto;font-size:12px;color:var(--text3)"></span>
        </div>
        <!-- Mapa -->
        <div id="mapa-container" style="flex:1;border-radius:10px;overflow:hidden;border:1px solid var(--border)"></div>
      </div>`;

    await Mapa._initMap();
    await Mapa._loadSites();
  },

  async _initMap() {
    // Aguarda container estar no DOM
    await new Promise(r => setTimeout(r, 100));

    // Verifica se Leaflet está disponível
    if (typeof L === 'undefined') {
      document.getElementById('mapa-container').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Leaflet não carregado</div><div class="empty-state-sub">Adicione o Leaflet no index.html</div></div>';
      return;
    }

    // Destrói mapa anterior se existir
    if (Mapa._map) {
      Mapa._map.remove();
      Mapa._map = null;
    }

    // Centro padrão: Mato Grosso
    Mapa._map = L.map('mapa-container', {
      center: [-13.5, -56.0],
      zoom: 6,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(Mapa._map);
  },

  async _loadSites() {
    if (!Mapa._map) return;

    try {
      // Busca sites com última ocorrência ativa
      const sites = await dbQuery(d =>
        d.from('sites')
          .select('*, risp:risps(nome), ocorrencias!left(situacao,motivo:motivos_falha(descricao))')
          .eq('ativo', true)
          .neq('ocorrencias.situacao', 'Operacional')
      );

      Mapa._sites = sites || [];

      // Popula filtro RISP
      const risps = [...new Set((sites||[]).map(s => s.risp?.nome).filter(Boolean))].sort();
      const sel   = document.getElementById('mapa-filtro-risp');
      if (sel) risps.forEach(r => {
        const o = document.createElement('option');
        o.value = r; o.textContent = r;
        sel.appendChild(o);
      });

      Mapa.filtrar();
    } catch {
      Toast.show('Erro ao carregar sites no mapa', 'error');
    }
  },

  filtrar() {
    if (!Mapa._map || !Mapa._sites) return;

    const filtroSit  = document.getElementById('mapa-filtro-sit')?.value || '';
    const filtroRisp = document.getElementById('mapa-filtro-risp')?.value || '';

    // Remove marcadores anteriores
    Mapa._markers.forEach(m => Mapa._map.removeLayer(m));
    Mapa._markers = [];

    let count = 0;
    Mapa._sites.forEach(site => {
      if (!site.latitude || !site.longitude) return;

      // Determina status do site
      const ocAtiva = site.ocorrencias?.find(o => o.situacao && o.situacao !== 'Operacional');
      const status  = ocAtiva ? ocAtiva.situacao : 'Operacional';

      // Aplica filtros
      if (filtroSit && status !== filtroSit) return;
      if (filtroRisp && site.risp?.nome !== filtroRisp) return;

      const cor = Mapa._corStatus(status);
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${cor};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 6px ${cor}"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([site.latitude, site.longitude], { icon });
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:180px">
          <div style="font-weight:700;margin-bottom:4px">${site.nome}</div>
          <div style="color:#666;font-size:12px">RISP: ${site.risp?.nome || '—'}</div>
          <div style="margin-top:6px">
            <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;background:${cor};color:#fff">
              ${status}
            </span>
          </div>
          ${ocAtiva ? `<div style="font-size:12px;color:#666;margin-top:4px">Motivo: ${ocAtiva.motivo?.descricao||'—'}</div>` : ''}
        </div>`, { maxWidth: 220 }
      );

      marker.addTo(Mapa._map);
      Mapa._markers.push(marker);
      count++;
    });

    const countEl = document.getElementById('mapa-count');
    if (countEl) countEl.textContent = `${count} sites visíveis`;
  },

  _corStatus(status) {
    const cores = {
      'Operacional':        '#22c55e',
      'Inoperante':         '#ef4444',
      'Parcial/Em analise': '#fbbf24',
      'Modo Local':         '#a78bfa',
    };
    return cores[status] || '#6b7280';
  }
};
