// ═══════════════════════════════════════
// GRAD Ecossistema — ISSI / GSSI
// Inventário de rádios (~5.000 unidades)
// ═══════════════════════════════════════

const Issi = {
  _data: [],
  _pagina: 1,
  _porPagina: 25,

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">ISSI / GSSI</div>
            <div class="page-sub">Inventário de rádios e terminais da rede</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Issi.exportar()">↓ Exportar CSV</button>
            <button class="btn btn-ghost btn-sm" onclick="Issi.refresh()">↻ Atualizar</button>
            <button class="btn btn-primary btn-sm perm-grad" onclick="Issi.novo()">+ Novo rádio</button>
          </div>
        </div>

        <!-- KPIs -->
        <div id="issi-kpis" class="kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:16px"></div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input class="form-input" id="issi-busca" placeholder="ISSI, TEI, serial, nome..." oninput="Issi._applyFilter()" style="width:250px">
          <select class="form-select" id="issi-status" onchange="Issi._applyFilter()" style="width:150px">
            <option value="">Todos os status</option>
            <option>Ativo</option>
            <option>Inativo</option>
            <option>Em manutenção</option>
            <option>Extraviado</option>
            <option>Baixado</option>
          </select>
          <select class="form-select" id="issi-tipo" onchange="Issi._applyFilter()" style="width:140px">
            <option value="">Todos os tipos</option>
            <option>Portátil</option>
            <option>Veicular</option>
            <option>Desktop</option>
            <option>Gateway</option>
          </select>
          <select class="form-select" id="issi-risp" onchange="Issi._applyFilter()" style="width:150px">
            <option value="">Todas RISPs</option>
          </select>
        </div>

        <!-- Tabela -->
        <div class="card" style="padding:0">
          <div id="issi-table-wrap" class="table-wrap" style="border:none"></div>
        </div>
        <div id="issi-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Issi.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Issi.render(main);
  },

  async load() {
    try {
      const data = await dbQuery(d =>
        d.from('issi_radios')
          .select('*, risp:risps(nome), site:sites(nome), usuario_atual:usuarios(nome)')
          .order('issi', { ascending: true })
      );
      Issi._data = data || [];
      Issi._renderKPIs();
      await Issi._popularFiltros();
      Issi._applyFilter();
    } catch {
      document.getElementById('issi-table-wrap').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Erro ao carregar inventário</div></div>';
    }
  },

  _renderKPIs() {
    const d      = Issi._data;
    const total  = d.length;
    const ativo  = d.filter(r => r.status === 'Ativo').length;
    const manut  = d.filter(r => r.status === 'Em manutenção').length;
    const extrav = d.filter(r => r.status === 'Extraviado').length;
    const baixado = d.filter(r => r.status === 'Baixado').length;

    const el = document.getElementById('issi-kpis');
    if (!el) return;
    el.innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-label">Total Inventário</div>
        <div class="kpi-value">${total.toLocaleString('pt-BR')}</div>
        <div class="kpi-sub">rádios</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Ativos</div>
        <div class="kpi-value">${ativo.toLocaleString('pt-BR')}</div>
        <div class="kpi-sub">${total ? Math.round(ativo/total*100) : 0}%</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Em Manutenção</div>
        <div class="kpi-value">${manut}</div>
        <div class="kpi-sub">&nbsp;</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Extraviados</div>
        <div class="kpi-value">${extrav}</div>
        <div class="kpi-sub">&nbsp;</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">Baixados</div>
        <div class="kpi-value">${baixado}</div>
        <div class="kpi-sub">&nbsp;</div>
      </div>`;
  },

  async _popularFiltros() {
    const risps = [...new Set(Issi._data.map(r => r.risp?.nome).filter(Boolean))].sort();
    const sel   = document.getElementById('issi-risp');
    if (sel) {
      sel.innerHTML = '<option value="">Todas RISPs</option>' +
        risps.map(r => `<option>${r}</option>`).join('');
    }
  },

  _applyFilter() {
    Issi._pagina = 1;
    Issi._render();
  },

  _filtrar() {
    const busca  = (document.getElementById('issi-busca')?.value || '').toLowerCase();
    const status = document.getElementById('issi-status')?.value || '';
    const tipo   = document.getElementById('issi-tipo')?.value || '';
    const risp   = document.getElementById('issi-risp')?.value || '';

    return Issi._data.filter(r => {
      if (status && r.status !== status) return false;
      if (tipo   && r.tipo   !== tipo)   return false;
      if (risp   && r.risp?.nome !== risp) return false;
      if (busca  &&
          !r.issi?.toString().includes(busca) &&
          !r.tei?.toString().includes(busca) &&
          !r.serial?.toLowerCase().includes(busca) &&
          !r.usuario_atual?.nome?.toLowerCase().includes(busca) &&
          !r.patrimonio?.toLowerCase().includes(busca) &&
          !r.modelo?.toLowerCase().includes(busca)) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Issi._filtrar();
    const total     = filtrados.length;
    const inicio    = (Issi._pagina - 1) * Issi._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Issi._porPagina);

    const statusMap = {
      'Ativo':          'badge-green',
      'Inativo':        'badge-gray',
      'Em manutenção':  'badge-amber',
      'Extraviado':     'badge-red',
      'Baixado':        'badge-gray',
    };
    const tipoMap = {
      'Portátil':  '📱',
      'Veicular':  '🚗',
      'Desktop':   '🖥️',
      'Gateway':   '📡',
    };

    const rows = pagina.map(r => `
      <tr onclick="Issi.ver('${r.id}')" style="cursor:pointer">
        <td style="font-family:var(--mono);font-size:13px;color:var(--accent);font-weight:700">${r.issi||'—'}</td>
        <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">${r.tei||'—'}</td>
        <td style="font-size:12px;color:var(--text2)">${r.modelo||'—'}</td>
        <td style="font-size:12px">${r.tipo ? `${tipoMap[r.tipo]||''} ${r.tipo}` : '—'}</td>
        <td><span class="badge ${statusMap[r.status]||'badge-gray'}">${r.status||'—'}</span></td>
        <td><span class="risp-badge">${r.risp?.nome||'—'}</span></td>
        <td style="font-size:12px;color:var(--text2)">${r.usuario_atual?.nome||r.site?.nome||'—'}</td>
        <td style="font-family:var(--mono);font-size:11px;color:var(--text3)">${r.serial||'—'}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm perm-grad" onclick="event.stopPropagation();Issi.editar('${r.id}')">✎</button>
          </div>
        </td>
      </tr>`).join('');

    document.getElementById('issi-table-wrap').innerHTML = total ? `
      <div style="padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px;color:var(--text3)">
        Exibindo ${inicio+1}–${Math.min(inicio+Issi._porPagina,total)} de ${total.toLocaleString('pt-BR')} registros
      </div>
      <table>
        <thead>
          <tr>
            <th>ISSI</th><th>TEI</th><th>Modelo</th><th>Tipo</th>
            <th>Status</th><th>RISP</th><th>Usuário / Site</th><th>Serial</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>` :
      '<div class="empty-state"><div class="empty-state-icon">📻</div><div class="empty-state-title">Nenhum rádio encontrado</div></div>';

    // Paginação
    const totalPags = Math.ceil(total / Issi._porPagina);
    const pagEl = document.getElementById('issi-pagination');
    if (pagEl) {
      if (totalPags <= 1) { pagEl.innerHTML = ''; return; }
      let html = `<button class="btn btn-ghost btn-sm" onclick="Issi._pg(${Issi._pagina-1})" ${Issi._pagina===1?'disabled':''}>‹ Anterior</button>`;
      // Para grandes conjuntos, mostrar apenas faixa de páginas
      const range = 3;
      let startP = Math.max(1, Issi._pagina - range);
      let endP   = Math.min(totalPags, Issi._pagina + range);
      if (startP > 1) html += `<button class="btn btn-ghost btn-sm" onclick="Issi._pg(1)">1</button><span style="color:var(--text3);padding:0 4px">…</span>`;
      for (let i = startP; i <= endP; i++)
        html += `<button class="btn btn-sm ${i===Issi._pagina?'btn-primary':'btn-ghost'}" onclick="Issi._pg(${i})">${i}</button>`;
      if (endP < totalPags) html += `<span style="color:var(--text3);padding:0 4px">…</span><button class="btn btn-ghost btn-sm" onclick="Issi._pg(${totalPags})">${totalPags}</button>`;
      html += `<button class="btn btn-ghost btn-sm" onclick="Issi._pg(${Issi._pagina+1})" ${Issi._pagina===totalPags?'disabled':''}>Próxima ›</button>`;
      pagEl.innerHTML = html;
    }
  },

  _pg(n) {
    const max = Math.ceil(Issi._filtrar().length / Issi._porPagina);
    if (n < 1 || n > max) return;
    Issi._pagina = n;
    Issi._render();
  },

  // ── VER DETALHES ─────────────────────
  ver(id) {
    const r = Issi._data.find(x => x.id === id);
    if (!r) return;
    const statusMap = {
      'Ativo':'badge-green','Inativo':'badge-gray','Em manutenção':'badge-amber',
      'Extraviado':'badge-red','Baixado':'badge-gray'
    };
    Modal.open(`Rádio ISSI ${r.issi||id}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label class="form-label">ISSI</label><div style="font-family:var(--mono);font-size:16px;color:var(--accent);font-weight:700">${r.issi||'—'}</div></div>
        <div><label class="form-label">TEI</label><div style="font-family:var(--mono)">${r.tei||'—'}</div></div>
        <div><label class="form-label">Status</label><div><span class="badge ${statusMap[r.status]||'badge-gray'}">${r.status||'—'}</span></div></div>
        <div><label class="form-label">Tipo</label><div>${r.tipo||'—'}</div></div>
        <div><label class="form-label">Modelo</label><div>${r.modelo||'—'}</div></div>
        <div><label class="form-label">Fabricante</label><div>${r.fabricante||'—'}</div></div>
        <div><label class="form-label">N° Serial</label><div style="font-family:var(--mono);font-size:12px">${r.serial||'—'}</div></div>
        <div><label class="form-label">Patrimônio</label><div style="font-family:var(--mono);font-size:12px">${r.patrimonio||'—'}</div></div>
        <div><label class="form-label">RISP</label><div>${r.risp?.nome||'—'}</div></div>
        <div><label class="form-label">Site</label><div>${r.site?.nome||'—'}</div></div>
        <div><label class="form-label">Usuário atual</label><div>${r.usuario_atual?.nome||'—'}</div></div>
        <div><label class="form-label">Unidade</label><div>${r.unidade||'—'}</div></div>
        ${r.observacoes ? `<div style="grid-column:1/-1"><label class="form-label">Observações</label><div style="font-size:13px;color:var(--text2)">${r.observacoes}</div></div>` : ''}
      </div>`,
      [
        { label: 'Fechar',   class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: '✎ Editar', class: 'btn-primary perm-grad', onclick: `Modal.close();Issi.editar('${id}')` }
      ]
    );
  },

  // ── NOVO RÁDIO ───────────────────────
  async novo() {
    Modal.open('Novo Rádio', Issi._formHTML(), [
      { label: 'Cancelar',  class: 'btn-ghost',  onclick: 'Modal.close()' },
      { label: 'Cadastrar', class: 'btn-primary', onclick: 'Issi.salvar()' }
    ]);
    await Issi._carregarSelectRisps('if-risp', null);
  },

  async _carregarSelectRisps(elId, valorAtual) {
    try {
      const risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome'));
      const el    = document.getElementById(elId);
      if (!el) return;
      el.innerHTML = '<option value="">—</option>' +
        (risps||[]).map(r=>`<option value="${r.id}" ${r.id===valorAtual?'selected':''}>${r.nome}</option>`).join('');
    } catch {}
  },

  _formHTML(r = {}) {
    const tipos    = ['Portátil','Veicular','Desktop','Gateway'];
    const statuses = ['Ativo','Inativo','Em manutenção','Extraviado','Baixado'];
    const tipoOpts   = tipos.map(t    => `<option ${t===r.tipo?'selected':''}>${t}</option>`).join('');
    const statusOpts = statuses.map(s => `<option ${s===r.status?'selected':''}>${s}</option>`).join('');

    return `
      <div class="form-grid-2">
        <div>
          <label class="form-label">ISSI *</label>
          <input class="form-input" id="if-issi" placeholder="000000" value="${r.issi||''}">
        </div>
        <div>
          <label class="form-label">TEI</label>
          <input class="form-input" id="if-tei" placeholder="TEI do rádio" value="${r.tei||''}">
        </div>
        <div>
          <label class="form-label">Tipo</label>
          <select class="form-select" id="if-tipo"><option value="">—</option>${tipoOpts}</select>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-select" id="if-status">${statusOpts}</select>
        </div>
        <div>
          <label class="form-label">Fabricante</label>
          <input class="form-input" id="if-fab" placeholder="Motorola, Hytera..." value="${r.fabricante||''}">
        </div>
        <div>
          <label class="form-label">Modelo</label>
          <input class="form-input" id="if-modelo" placeholder="MTP850, PD785..." value="${r.modelo||''}">
        </div>
        <div>
          <label class="form-label">N° Serial</label>
          <input class="form-input" id="if-serial" placeholder="Serial do equipamento" value="${r.serial||''}">
        </div>
        <div>
          <label class="form-label">Patrimônio</label>
          <input class="form-input" id="if-pat" placeholder="Nº patrimônio" value="${r.patrimonio||''}">
        </div>
        <div>
          <label class="form-label">RISP</label>
          <select class="form-select" id="if-risp"><option value="">Carregando...</option></select>
        </div>
        <div>
          <label class="form-label">Unidade</label>
          <input class="form-input" id="if-unidade" placeholder="Batalhão, delegacia..." value="${r.unidade||''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="if-obs" rows="2">${r.observacoes||''}</textarea>
        </div>
      </div>`;
  },

  async salvar() {
    const issi = document.getElementById('if-issi')?.value?.trim();
    if (!issi) { Toast.show('Informe o ISSI do rádio', 'error'); return; }

    const payload = {
      issi,
      tei:         document.getElementById('if-tei')?.value?.trim() || null,
      tipo:        document.getElementById('if-tipo')?.value || null,
      status:      document.getElementById('if-status')?.value || 'Ativo',
      fabricante:  document.getElementById('if-fab')?.value?.trim() || null,
      modelo:      document.getElementById('if-modelo')?.value?.trim() || null,
      serial:      document.getElementById('if-serial')?.value?.trim() || null,
      patrimonio:  document.getElementById('if-pat')?.value?.trim() || null,
      risp_id:     document.getElementById('if-risp')?.value || null,
      unidade:     document.getElementById('if-unidade')?.value?.trim() || null,
      observacoes: document.getElementById('if-obs')?.value?.trim() || null,
      criado_por:  Auth.user?.id
    };
    try {
      const { data, error } = await db.from('issi_radios').insert(payload).select().single();
      if (error) throw error;
      await Audit.criou('issi_radios', data.id, data);
      Modal.close();
      Toast.show('Rádio cadastrado', 'success');
      await Issi.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao cadastrar', 'error');
    }
  },

  // ── EDITAR ────────────────────────────
  async editar(id) {
    const r = Issi._data.find(x => x.id === id);
    if (!r) return;
    Modal.open('Editar Rádio', Issi._formHTML(r), [
      { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
      { label: 'Salvar',   class: 'btn-primary', onclick: `Issi.salvarEdicao('${id}')` }
    ]);
    await Issi._carregarSelectRisps('if-risp', r.risp_id);
    // Reaplicar valor do tipo após render
    const tipoEl = document.getElementById('if-tipo');
    if (tipoEl && r.tipo) tipoEl.value = r.tipo;
  },

  async salvarEdicao(id) {
    const antes = Issi._data.find(x => x.id === id);
    const issi  = document.getElementById('if-issi')?.value?.trim();
    if (!issi) { Toast.show('Informe o ISSI', 'error'); return; }

    const payload = {
      issi,
      tei:         document.getElementById('if-tei')?.value?.trim() || null,
      tipo:        document.getElementById('if-tipo')?.value || null,
      status:      document.getElementById('if-status')?.value,
      fabricante:  document.getElementById('if-fab')?.value?.trim() || null,
      modelo:      document.getElementById('if-modelo')?.value?.trim() || null,
      serial:      document.getElementById('if-serial')?.value?.trim() || null,
      patrimonio:  document.getElementById('if-pat')?.value?.trim() || null,
      risp_id:     document.getElementById('if-risp')?.value || null,
      unidade:     document.getElementById('if-unidade')?.value?.trim() || null,
      observacoes: document.getElementById('if-obs')?.value?.trim() || null,
    };
    try {
      const { error } = await db.from('issi_radios').update(payload).eq('id', id);
      if (error) throw error;
      await Audit.editou('issi_radios', id, antes, payload);
      Modal.close();
      Toast.show('Rádio atualizado', 'success');
      await Issi.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar', 'error');
    }
  },

  // ── EXPORTAR CSV ─────────────────────
  exportar() {
    const filtrados = Issi._filtrar();
    if (!filtrados.length) { Toast.show('Nenhum dado para exportar', 'error'); return; }

    const headers = ['ISSI','TEI','Tipo','Status','Fabricante','Modelo','Serial','Patrimônio','RISP','Unidade','Usuário'];
    const linhas  = filtrados.map(r => [
      r.issi||'',r.tei||'',r.tipo||'',r.status||'',
      r.fabricante||'',r.modelo||'',r.serial||'',r.patrimonio||'',
      r.risp?.nome||'',r.unidade||'',r.usuario_atual?.nome||''
    ].map(v => `"${v}"`).join(','));

    const csv  = [headers.join(','), ...linhas].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `issi_inventario_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show(`${filtrados.length} registros exportados`, 'success');
  }
};
