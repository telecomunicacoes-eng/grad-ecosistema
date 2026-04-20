// ═══════════════════════════════════════
// GRAD Ecossistema — MAPA DE ERBs
// Layout 3 painéis: lista · mapa · info
// Portado do NEBULA com adaptação Supabase
// ═══════════════════════════════════════

const Mapa = {
  _map:            null,
  _markers:        {},
  _sites:          [],
  _ocorrencias:    [],
  _initialized:    false,
  _selectedSite:   null,
  _activeStatuses: new Set(['operando','inoperante','parcial','instavel','fallback','inativo']),
  _activeRisps:    new Set(),
  _searchTerm:     '',

  _STATUS_COLORS: {
    operando:   '#10b981',
    inoperante: '#ef4444',
    parcial:    '#f59e0b',
    instavel:   '#fb923c',
    fallback:   '#a78bfa',
    inativo:    '#4b5563',
  },

  _STATUS_LABELS: {
    operando:   'Operando',
    inoperante: 'Inoperante',
    parcial:    'Parcial/Em análise',
    instavel:   'Instável',
    fallback:   'Modo Local',
    inativo:    'Inativo',
  },

  _SIT_TO_STATUS: {
    'Operacional':        'operando',
    'Inoperante':         'inoperante',
    'Parcial/Em análise': 'parcial',
    'Parcial/Em analise': 'parcial',
    'Instável':           'instavel',
    'Modo Local':         'fallback',
  },

  async render(container) {
    container.innerHTML = `
      <div style="display:flex;height:calc(100vh - var(--topbar-h));overflow:hidden">

        <!-- ── PAINEL ESQUERDO ── -->
        <div id="mlp" style="width:270px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">

          <!-- Header -->
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0">
            <div style="font-size:11px;font-family:var(--mono);color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Mapa de ERBs</div>
            <input class="form-input" id="mlp-search" placeholder="Buscar site, RISP, cidade..."
              oninput="Mapa._onSearch(this.value)" style="font-size:12px;padding:6px 10px">
          </div>

          <!-- Filtros de status -->
          <div style="padding:8px 12px;border-bottom:1px solid var(--border);flex-shrink:0">
            <div style="font-size:9px;font-family:var(--mono);color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Status</div>
            <div id="mlp-status-filters" style="display:flex;flex-wrap:wrap;gap:4px"></div>
          </div>

          <!-- Filtros RISP -->
          <div style="padding:8px 12px;border-bottom:1px solid var(--border);flex-shrink:0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <div style="font-size:9px;font-family:var(--mono);color:var(--text3);text-transform:uppercase;letter-spacing:.1em">RISP</div>
              <button style="font-size:9px;color:var(--text3);background:none;border:none;cursor:pointer;font-family:var(--mono)"
                onclick="Mapa._clearRisps()">limpar</button>
            </div>
            <div id="mlp-risp-filters" style="display:flex;flex-wrap:wrap;gap:3px"></div>
          </div>

          <!-- Lista ERBs -->
          <div style="flex:1;overflow-y:auto">
            <div id="mlp-erb-count" style="padding:6px 14px;font-size:10px;font-family:var(--mono);color:var(--text3);border-bottom:1px solid var(--border)"></div>
            <div id="mlp-erb-list"></div>
          </div>
        </div>

        <!-- ── MAPA ── -->
        <div style="flex:1;position:relative;overflow:hidden">
          <div id="mapa-container" style="width:100%;height:100%"></div>
          <!-- Stats overlay -->
          <div id="mapa-stats" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(10,22,40,.85);backdrop-filter:blur(4px);border:1px solid var(--border);border-radius:8px;padding:6px 16px;display:flex;gap:16px;z-index:1000;pointer-events:none"></div>
        </div>

        <!-- ── PAINEL INFO (direita) ── -->
        <div id="mep" style="width:0;flex-shrink:0;background:var(--surface);border-left:1px solid var(--border);overflow:hidden;transition:width .25s ease;display:flex;flex-direction:column">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
            <div style="font-size:11px;font-family:var(--mono);color:var(--text3);text-transform:uppercase;letter-spacing:.08em">Info do site</div>
            <button onclick="Mapa._closePanel()" style="background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:4px;color:var(--text3);padding:2px 8px;cursor:pointer;font-size:12px">✕</button>
          </div>
          <div id="mep-body" style="padding:16px;flex:1;overflow-y:auto;min-width:240px"></div>
        </div>

      </div>`;

    await Mapa._initMap();
    await Mapa._loadData();
  },

  async _initMap() {
    await new Promise(r => setTimeout(r, 80));
    if (typeof L === 'undefined') return;

    if (Mapa._map) { Mapa._map.remove(); Mapa._map = null; }

    Mapa._map = L.map('mapa-container', {
      center: [-13.0, -55.5],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(Mapa._map);

    Mapa._initialized = true;
  },

  async _loadData() {
    try {
      const [sites, ocorrs, risps] = await Promise.all([
        dbQuery(d => d.from('sites').select('id,nome,cidade,latitude,longitude,ativo,risp:risps(id,nome)').eq('ativo', true)),
        dbQuery(d => d.from('ocorrencias').select('site_id,situacao').neq('situacao', 'Operacional')),
        dbQuery(d => d.from('risps').select('id,nome').order('nome')),
      ]);

      Mapa._sites      = sites      || [];
      Mapa._ocorrencias = ocorrs    || [];
      Mapa._risps       = risps     || [];

      Mapa._buildStatusFilters();
      Mapa._buildRispFilters();
      Mapa._buildMarkers();
      Mapa._buildList();
      Mapa._updateStats();
    } catch (err) {
      Toast.show('Erro ao carregar dados do mapa', 'error');
    }
  },

  _getStatus(site) {
    if (!site.ativo) return 'inativo';
    const oc = Mapa._ocorrencias.find(o => o.site_id === site.id);
    if (!oc) return 'operando';
    return Mapa._SIT_TO_STATUS[oc.situacao] || 'operando';
  },

  _makeIcon(status, selected = false) {
    const cor  = Mapa._STATUS_COLORS[status] || '#6b7280';
    const size = selected ? 16 : 10;
    const bord = selected ? 3 : 2;
    const glow = selected ? `0 0 10px ${cor}` : `0 0 4px ${cor}99`;
    return L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${cor};border:${bord}px solid rgba(255,255,255,0.8);border-radius:50%;box-shadow:${glow};transition:all .2s"></div>`,
      iconSize:   [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  },

  _visible(site) {
    const status = Mapa._getStatus(site);
    const risp   = site.risp?.nome || '';
    const term   = Mapa._searchTerm.toLowerCase();
    const matchSearch = !term ||
      site.nome?.toLowerCase().includes(term) ||
      risp.toLowerCase().includes(term) ||
      site.cidade?.toLowerCase().includes(term);
    return Mapa._activeStatuses.has(status) &&
           (Mapa._activeRisps.size === 0 || Mapa._activeRisps.has(risp)) &&
           matchSearch;
  },

  _buildMarkers() {
    if (!Mapa._map) return;
    Mapa._sites.forEach(site => {
      if (!site.latitude || !site.longitude) return;
      const status = Mapa._getStatus(site);
      const cor    = Mapa._STATUS_COLORS[status];
      const marker = L.marker([site.latitude, site.longitude], { icon: Mapa._makeIcon(status) });
      marker.bindTooltip(
        `<div style="font-family:var(--sans,sans-serif);font-size:12px">
          <strong>${site.nome}</strong><br>
          <span style="color:${cor};font-size:10px">${Mapa._STATUS_LABELS[status]?.toUpperCase()}</span>
          ${site.risp?.nome ? ` · ${site.risp.nome}` : ''}
        </div>`,
        { direction: 'top', offset: [0, -6], opacity: 1 }
      );
      marker.on('click', () => Mapa._selectSite(site));
      mapMarkers: marker.addTo(Mapa._map);
      Mapa._markers[site.id] = marker;
    });
    Mapa._refreshMarkers();
  },

  _refreshMarkers() {
    if (!Mapa._map) return;
    Mapa._sites.forEach(site => {
      const m = Mapa._markers[site.id];
      if (!m) return;
      const status   = Mapa._getStatus(site);
      const isSelected = Mapa._selectedSite?.id === site.id;
      if (Mapa._visible(site)) {
        m.setIcon(Mapa._makeIcon(status, isSelected));
        if (!Mapa._map.hasLayer(m)) m.addTo(Mapa._map);
      } else {
        if (Mapa._map.hasLayer(m)) Mapa._map.removeLayer(m);
      }
    });
  },

  _buildStatusFilters() {
    const el = document.getElementById('mlp-status-filters');
    if (!el) return;
    el.innerHTML = '';
    const statuses = ['operando','inoperante','parcial','instavel','fallback','inativo'];
    statuses.forEach(s => {
      const count = Mapa._sites.filter(site => Mapa._getStatus(site) === s).length;
      if (count === 0) return;
      const div = document.createElement('div');
      div.style.cssText = `display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:20px;cursor:pointer;font-size:10px;font-family:var(--mono);border:1px solid ${Mapa._STATUS_COLORS[s]}44;background:${Mapa._STATUS_COLORS[s]}22;color:${Mapa._STATUS_COLORS[s]};transition:opacity .15s`;
      div.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${Mapa._STATUS_COLORS[s]};display:inline-block;flex-shrink:0"></span>${Mapa._STATUS_LABELS[s]?.split('/')[0]} <span style="opacity:.7;margin-left:2px">${count}</span>`;
      div.dataset.active = '1';
      div.onclick = () => {
        const active = div.dataset.active === '1';
        div.dataset.active = active ? '0' : '1';
        div.style.opacity  = active ? '.35' : '1';
        if (active) Mapa._activeStatuses.delete(s);
        else        Mapa._activeStatuses.add(s);
        Mapa._refreshMarkers();
        Mapa._buildList();
        Mapa._updateStats();
      };
      el.appendChild(div);
    });
  },

  _buildRispFilters() {
    const el = document.getElementById('mlp-risp-filters');
    if (!el) return;
    el.innerHTML = '';
    const lista = (Mapa._risps.length > 0 ? Mapa._risps : []).map(r => r.nome);
    lista.forEach(nome => {
      const btn = document.createElement('button');
      btn.style.cssText = `padding:2px 7px;border-radius:4px;border:1px solid var(--border);background:var(--surface2);color:var(--text3);font-size:10px;font-family:var(--mono);cursor:pointer;transition:all .15s`;
      btn.textContent   = nome.replace('RISP ', 'R');
      btn.title         = nome;
      btn.dataset.risp  = nome;
      btn.onclick = () => {
        const active = Mapa._activeRisps.has(nome);
        if (active) {
          Mapa._activeRisps.delete(nome);
          btn.style.background   = 'var(--surface2)';
          btn.style.color        = 'var(--text3)';
          btn.style.borderColor  = 'var(--border)';
        } else {
          Mapa._activeRisps.add(nome);
          btn.style.background   = 'rgba(26,111,212,.2)';
          btn.style.color        = 'var(--accent2)';
          btn.style.borderColor  = 'rgba(61,155,255,.4)';
        }
        Mapa._refreshMarkers();
        Mapa._buildList();
        Mapa._updateStats();
      };
      el.appendChild(btn);
    });
  },

  _clearRisps() {
    Mapa._activeRisps.clear();
    document.querySelectorAll('#mlp-risp-filters button').forEach(b => {
      b.style.background  = 'var(--surface2)';
      b.style.color       = 'var(--text3)';
      b.style.borderColor = 'var(--border)';
    });
    Mapa._refreshMarkers();
    Mapa._buildList();
    Mapa._updateStats();
  },

  _onSearch(val) {
    Mapa._searchTerm = val;
    Mapa._refreshMarkers();
    Mapa._buildList();
    Mapa._updateStats();
  },

  _buildList() {
    const el = document.getElementById('mlp-erb-list');
    if (!el) return;
    const filtered = Mapa._sites.filter(s => Mapa._visible(s));
    const countEl  = document.getElementById('mlp-erb-count');
    if (countEl) countEl.textContent = `${filtered.length} de ${Mapa._sites.length} sites`;

    if (!filtered.length) {
      el.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text3);font-size:12px">Nenhum site encontrado</div>`;
      return;
    }

    const orderSt = { inoperante:0, instavel:1, parcial:2, fallback:3, operando:4, inativo:5 };
    filtered.sort((a, b) => {
      const sa = Mapa._getStatus(a), sb = Mapa._getStatus(b);
      if ((orderSt[sa]||9) !== (orderSt[sb]||9)) return (orderSt[sa]||9) - (orderSt[sb]||9);
      return (a.risp?.nome||'').localeCompare(b.risp?.nome||'');
    });

    el.innerHTML = filtered.map(site => {
      const status = Mapa._getStatus(site);
      const cor    = Mapa._STATUS_COLORS[status];
      const isSel  = Mapa._selectedSite?.id === site.id;
      return `
        <div class="mlp-erb-row" onclick="Mapa._selectSite(${JSON.stringify(site).replace(/"/g,'&quot;')})"
          style="display:flex;align-items:center;gap:8px;padding:8px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s;${isSel ? 'background:rgba(26,111,212,.12)' : ''}">
          <div style="width:9px;height:9px;border-radius:50%;background:${cor};flex-shrink:0;box-shadow:0 0 4px ${cor}"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${site.nome}</div>
            <div style="font-size:10px;color:var(--text3);font-family:var(--mono)">${site.risp?.nome||'—'} · ${site.cidade||'—'}</div>
          </div>
        </div>`;
    }).join('');
  },

  _updateStats() {
    const el = document.getElementById('mapa-stats');
    if (!el) return;
    const counts = {};
    Mapa._sites.filter(s => Mapa._visible(s)).forEach(s => {
      const st = Mapa._getStatus(s);
      counts[st] = (counts[st] || 0) + 1;
    });
    const parts = ['inoperante','parcial','fallback','operando']
      .filter(s => counts[s])
      .map(s => `<span style="font-size:11px;font-family:var(--mono);color:${Mapa._STATUS_COLORS[s]}">${counts[s]} ${Mapa._STATUS_LABELS[s]?.split('/')[0]}</span>`);
    el.innerHTML = parts.join('<span style="color:var(--border2);margin:0 2px">·</span>') ||
      `<span style="font-size:11px;font-family:var(--mono);color:var(--text3)">Nenhum site visível</span>`;
  },

  _selectSite(site) {
    Mapa._selectedSite = site;
    Mapa._refreshMarkers();

    // Centraliza mapa
    if (Mapa._map && site.latitude && site.longitude) {
      Mapa._map.setView([site.latitude, site.longitude], 12, { animate: true });
    }

    // Abre painel direito
    const panel = document.getElementById('mep');
    if (panel) panel.style.width = '260px';

    // Destaca na lista
    Mapa._buildList();

    // Preenche painel
    const status  = Mapa._getStatus(site);
    const cor     = Mapa._STATUS_COLORS[status];
    const oc      = Mapa._ocorrencias.find(o => o.site_id === site.id);
    const body    = document.getElementById('mep-body');
    if (!body) return;

    body.innerHTML = `
      <div style="margin-bottom:14px">
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px;line-height:1.3">${site.nome}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:9px;height:9px;border-radius:50%;background:${cor};display:inline-block;flex-shrink:0"></span>
          <span style="font-size:12px;font-family:var(--mono);color:${cor}">${Mapa._STATUS_LABELS[status]}</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:6px">
          <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">RISP</span>
          <span class="risp-badge">${site.risp?.nome || '—'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:6px">
          <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">Cidade</span>
          <span style="font-size:12px;color:var(--text2)">${site.cidade || '—'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:6px">
          <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">Coords</span>
          <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">${site.latitude ? `${Number(site.latitude).toFixed(4)}, ${Number(site.longitude).toFixed(4)}` : '—'}</span>
        </div>
      </div>

      ${oc ? `
        <div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:6px;padding:10px;margin-bottom:12px">
          <div style="font-size:10px;font-family:var(--mono);color:#f87171;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Ocorrência ativa</div>
          <div style="font-size:12px;color:var(--text2)">${oc.situacao}</div>
        </div>` : ''}

      <div style="margin-bottom:12px">
        <div style="font-size:10px;font-family:var(--mono);color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Alterar status</div>
        <select class="form-select" id="mep-status-sel" style="font-size:12px" onchange="Mapa._changeStatus(this.value)">
          <option value="operando"   ${status==='operando'?'selected':''}>Operando</option>
          <option value="inoperante" ${status==='inoperante'?'selected':''}>Inoperante</option>
          <option value="parcial"    ${status==='parcial'?'selected':''}>Parcial/Em análise</option>
          <option value="instavel"   ${status==='instavel'?'selected':''}>Instável</option>
          <option value="fallback"   ${status==='fallback'?'selected':''}>Modo Local</option>
        </select>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn btn-ghost btn-sm" style="justify-content:center"
          onclick="App.navigate('infra','registros')">
          Ver ocorrências →
        </button>
        ${site.latitude && site.longitude ? `
          <button class="btn btn-ghost btn-sm" style="justify-content:center"
            onclick="window.open('https://maps.google.com/?q=${site.latitude},${site.longitude}','_blank')">
            Abrir no Google Maps
          </button>` : ''}
      </div>`;
  },

  _closePanel() {
    const panel = document.getElementById('mep');
    if (panel) panel.style.width = '0';
    Mapa._selectedSite = null;
    Mapa._refreshMarkers();
    Mapa._buildList();
  },

  async _changeStatus(newStatus) {
    if (!Mapa._selectedSite) return;
    const site = Mapa._selectedSite;
    const sitMap = {
      operando:   'Operacional',
      inoperante: 'Inoperante',
      parcial:    'Parcial/Em análise',
      instavel:   'Instável',
      fallback:   'Modo Local',
    };
    const novaSit = sitMap[newStatus];
    if (!novaSit) return;

    const ocAtiva = Mapa._ocorrencias.find(o => o.site_id === site.id);

    try {
      if (novaSit === 'Operacional') {
        if (ocAtiva) {
          await db.from('ocorrencias').update({ situacao: 'Operacional', fim: new Date().toISOString() })
            .eq('site_id', site.id).neq('situacao', 'Operacional');
          Mapa._ocorrencias = Mapa._ocorrencias.filter(o => o.site_id !== site.id);
          Toast.show('Site marcado como Operacional', 'success');
        } else {
          Toast.show('Site já está operando', 'info');
        }
      } else if (ocAtiva) {
        const { error } = await db.from('ocorrencias')
          .update({ situacao: novaSit })
          .eq('site_id', site.id)
          .neq('situacao', 'Operacional');
        if (error) throw error;
        ocAtiva.situacao = novaSit;
        Toast.show(`Status atualizado: ${novaSit}`, 'success');
      } else {
        const { data, error } = await db.from('ocorrencias').insert({
          site_id:  site.id,
          situacao: novaSit,
          motivo:   'Informado via mapa',
          inicio:   new Date().toISOString().split('T')[0],
          prazo:    'Em análise (GRAD)',
          operador: Auth.user()?.email || 'GRAD',
        }).select().single();
        if (error) throw error;
        Mapa._ocorrencias.push({ site_id: site.id, situacao: novaSit });
        Toast.show(`Ocorrência registrada: ${novaSit}`, 'warn');
      }
    } catch (err) {
      Toast.show(err.message || 'Erro ao alterar status', 'error');
    }

    Mapa._refreshMarkers();
    Mapa._buildStatusFilters();
    Mapa._buildList();
    Mapa._updateStats();
    Mapa._selectSite(site);
  },
};
