// ═══════════════════════════════════════
// GRAD Ecossistema — BASE DE SITES
// Visualização e gestão da base de ERBs
// ═══════════════════════════════════════

const Base = {
  _data: [],
  _ocorrs: [],
  _pagina: 1,
  _porPagina: 25,

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Base de Sites</div>
            <div class="page-sub">Cadastro completo de ERBs e sites monitorados</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Base.exportarCSV()">↓ CSV</button>
            <button class="btn btn-ghost btn-sm" onclick="Base.refresh()">↻ Atualizar</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input class="form-input" id="bs-busca" placeholder="Buscar site, SBS, cidade..." oninput="Base._applyFilter()" style="width:220px">
          <select class="form-select" id="bs-risp" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Todas RISPs</option>
          </select>
          <select class="form-select" id="bs-sit" onchange="Base._applyFilter()" style="width:180px">
            <option value="">Todos os status</option>
            <option value="Operacional">✅ Operacional</option>
            <option value="Inoperante">🔴 Inoperante</option>
            <option value="Instável">🟢 Instável</option>
            <option value="Parcial/Em analise">🟡 Parcial/Em analise</option>
            <option value="Modo Local">🟣 Modo Local</option>
          </select>
          <select class="form-select" id="bs-prop" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Proprietário</option>
          </select>
          <select class="form-select" id="bs-tipo" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Todos os tipos</option>
          </select>
        </div>

        <!-- KPIs rápidos -->
        <div id="bs-summary" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"></div>

        <!-- Tabela -->
        <div class="card" style="padding:0">
          <div id="bs-table" class="table-wrap" style="border:none"></div>
        </div>
        <div id="bs-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Base.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Base.render(main);
  },

  async load() {
    try {
      // Sites
      const sites = await dbQuery(d =>
        d.from('sites')
          .select('*, risp:risps(id,nome)')
          .eq('ativo', true)
          .order('nome')
      );

      // Ocorrências ativas (para status atual)
      const ocorrs = await dbQuery(d =>
        d.from('ocorrencias')
          .select('site_id,situacao')
          .neq('situacao', 'Operacional')
      );

      Base._data   = sites  || [];
      Base._ocorrs = ocorrs || [];

      // Popula filtros
      await Base._popularFiltros();
      Base._applyFilter();
    } catch {
      document.getElementById('bs-table').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Erro ao carregar base</div></div>';
    }
  },

  async _popularFiltros() {
    // RISPs
    try {
      const risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome'));
      const sel = document.getElementById('bs-risp');
      if (sel && risps) {
        risps.forEach(r => {
          const o = document.createElement('option');
          o.value = r.nome; o.textContent = r.nome; sel.appendChild(o);
        });
      }
    } catch {}

    // Proprietários
    const props = [...new Set(Base._data.map(s => s.proprietario).filter(Boolean))].sort();
    const selP = document.getElementById('bs-prop');
    if (selP) props.forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p; selP.appendChild(o);
    });

    // Tipos
    const tipos = [...new Set(Base._data.map(s => s.tipo).filter(Boolean))].sort();
    const selT = document.getElementById('bs-tipo');
    if (selT) tipos.forEach(t => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t; selT.appendChild(o);
    });
  },

  _getSituacao(siteId) {
    const oc = Base._ocorrs.find(o => o.site_id === siteId);
    return oc ? oc.situacao : 'Operacional';
  },

  _applyFilter() {
    Base._pagina = 1;
    Base._render();
  },

  _filtrar() {
    const busca = (document.getElementById('bs-busca')?.value || '').toLowerCase();
    const risp  = document.getElementById('bs-risp')?.value  || '';
    const sit   = document.getElementById('bs-sit')?.value   || '';
    const prop  = document.getElementById('bs-prop')?.value  || '';
    const tipo  = document.getElementById('bs-tipo')?.value  || '';

    return Base._data.filter(s => {
      const situacao = Base._getSituacao(s.id);
      if (risp && s.risp?.nome !== risp)    return false;
      if (sit  && situacao !== sit)          return false;
      if (prop && s.proprietario !== prop)   return false;
      if (tipo && s.tipo !== tipo)           return false;
      if (busca && !s.nome?.toLowerCase().includes(busca) &&
                   !s.cidade?.toLowerCase().includes(busca) &&
                   !s.observacoes?.toLowerCase().includes(busca)) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Base._filtrar();
    const total     = filtrados.length;
    const inicio    = (Base._pagina - 1) * Base._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Base._porPagina);

    // Resumo
    const op   = filtrados.filter(s => Base._getSituacao(s.id) === 'Operacional').length;
    const inop = filtrados.filter(s => Base._getSituacao(s.id) === 'Inoperante').length;
    const sumEl = document.getElementById('bs-summary');
    if (sumEl) sumEl.innerHTML = `
      <span class="badge badge-blue">${total} sites</span>
      <span class="badge badge-green">${op} operacionais</span>
      <span class="badge badge-red">${inop} inoperantes</span>
      <span class="badge badge-amber">${filtrados.filter(s=>Base._getSituacao(s.id)==='Parcial/Em analise').length} parcial</span>
      <span class="badge badge-purple">${filtrados.filter(s=>Base._getSituacao(s.id)==='Modo Local').length} modo local</span>`;

    const sitCor = {
      'Operacional':         { badge: 'badge-green',  dot: '#22c55e' },
      'Inoperante':          { badge: 'badge-red',    dot: '#ef4444' },
      'Instável':            { badge: 'badge-teal',   dot: '#14b8a6' },
      'Parcial/Em analise':  { badge: 'badge-amber',  dot: '#fbbf24' },
      'Modo Local':          { badge: 'badge-purple', dot: '#a78bfa' },
    };

    const rows = pagina.map(s => {
      const sit = Base._getSituacao(s.id);
      const cls = sitCor[sit] || { badge: 'badge-gray', dot: '#6b7280' };
      return `
        <tr onclick="Base.verSite('${s.id}')" style="cursor:pointer">
          <td><span class="risp-badge">${s.risp?.nome||'—'}</span></td>
          <td><strong style="color:var(--text)">${s.nome||'—'}</strong></td>
          <td style="color:var(--text2);font-size:12px">${s.cidade||'—'}</td>
          <td style="font-size:12px;color:var(--text3)">${s.tipo||'—'}</td>
          <td style="font-size:12px;color:var(--text3)">${s.proprietario||'—'}</td>
          <td><span class="badge ${cls.badge}">${sit}</span></td>
          <td style="font-size:11px;color:var(--text3)">${s.lat&&s.lon?`${parseFloat(s.lat).toFixed(4)}, ${parseFloat(s.lon).toFixed(4)}`:'—'}</td>
        </tr>`;
    }).join('');

    const tableEl = document.getElementById('bs-table');
    if (tableEl) {
      tableEl.innerHTML = total ? `
        <table>
          <thead>
            <tr>
              <th>RISP</th><th>Nome</th><th>Município</th>
              <th>Tipo</th><th>Proprietário</th><th>Status</th><th>Coords</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` :
        '<div class="empty-state"><div class="empty-state-icon">📡</div><div class="empty-state-title">Nenhum site encontrado</div></div>';
    }

    // Paginação
    const totalPags = Math.ceil(total / Base._porPagina);
    const pagEl = document.getElementById('bs-pagination');
    if (pagEl) {
      if (totalPags <= 1) { pagEl.innerHTML = ''; return; }
      let html = `<span style="color:var(--text3);font-size:12px;margin-right:8px">${total} sites</span>`;
      html += `<button class="btn btn-ghost btn-sm" onclick="Base._pg(${Base._pagina-1})" ${Base._pagina===1?'disabled':''}>‹</button>`;
      for (let i = 1; i <= totalPags; i++) {
        if (i===1||i===totalPags||Math.abs(i-Base._pagina)<=2) {
          html += `<button class="btn btn-sm ${i===Base._pagina?'btn-primary':'btn-ghost'}" onclick="Base._pg(${i})">${i}</button>`;
        } else if (Math.abs(i-Base._pagina)===3) {
          html += `<span style="color:var(--text3);padding:0 4px">…</span>`;
        }
      }
      html += `<button class="btn btn-ghost btn-sm" onclick="Base._pg(${Base._pagina+1})" ${Base._pagina===totalPags?'disabled':''}>›</button>`;
      pagEl.innerHTML = html;
    }
  },

  _pg(n) {
    const max = Math.ceil(Base._filtrar().length / Base._porPagina);
    if (n < 1 || n > max) return;
    Base._pagina = n;
    Base._render();
  },

  verSite(id) {
    const s   = Base._data.find(x => x.id === id);
    if (!s) return;
    const sit = Base._getSituacao(id);

    const sitCor = {
      'Operacional':        'badge-green',
      'Inoperante':         'badge-red',
      'Instável':           'badge-teal',
      'Parcial/Em analise': 'badge-amber',
      'Modo Local':         'badge-purple',
    };

    Modal.open(`Site — ${s.nome}`, `
      <div style="display:grid;gap:12px">
        <div><span class="badge ${sitCor[sit]||'badge-gray'}">${sit}</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="form-label">RISP</label><div>${s.risp?.nome||'—'}</div></div>
          <div><label class="form-label">Município</label><div>${s.cidade||'—'}</div></div>
          <div><label class="form-label">Tipo</label><div>${s.tipo||'—'}</div></div>
          <div><label class="form-label">Proprietário</label><div>${s.proprietario||'—'}</div></div>
          <div><label class="form-label">Latitude</label><div style="font-family:var(--mono);font-size:12px">${s.lat||'—'}</div></div>
          <div><label class="form-label">Longitude</label><div style="font-family:var(--mono);font-size:12px">${s.lon||'—'}</div></div>
        </div>
        ${s.observacoes ? `<div><label class="form-label">Observações</label><div style="color:var(--text2);font-size:13px">${s.observacoes}</div></div>` : ''}
      </div>`,
      [
        { label: 'Fechar', class: 'btn-ghost', onclick: 'Modal.close()' },
        { label: '🗺️ Ver no Mapa', class: 'btn-primary', onclick: `Modal.close();App.navigate('mapa')` }
      ]
    );
  },

  exportarCSV() {
    const filtrados = Base._filtrar();
    if (!filtrados.length) { Toast.show('Nenhum dado para exportar', 'error'); return; }

    const headers = ['RISP','Nome','Município','Tipo','Proprietário','Status','Latitude','Longitude'];
    const linhas  = filtrados.map(s => [
      s.risp?.nome||'',
      s.nome||'',
      s.cidade||'',
      s.tipo||'',
      s.proprietario||'',
      Base._getSituacao(s.id),
      s.lat||'',
      s.lon||''
    ].map(v=>`"${v}"`).join(','));

    const csv  = [headers.join(','), ...linhas].join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `base_sites_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show(`${filtrados.length} sites exportados`, 'success');
  }
};
