// ═══════════════════════════════════════
// GRAD Ecossistema — ORDENS DE SERVIÇO
// Controle de OS, energia e custos
// ═══════════════════════════════════════

const Ordens = {
  _data: [],
  _pagina: 1,
  _porPagina: 20,

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Ordens de Serviço</div>
            <div class="page-sub">Controle de OS, energia e custos operacionais</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Ordens.refresh()">↻ Atualizar</button>
            <button class="btn btn-primary btn-sm perm-grad" onclick="Ordens.nova()">+ Nova OS</button>
          </div>
        </div>

        <!-- KPIs de custo -->
        <div id="ord-kpis" class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px"></div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input class="form-input" id="ord-busca" placeholder="Nº OS ou site..." oninput="Ordens._applyFilter()" style="width:200px">
          <select class="form-select" id="ord-status" onchange="Ordens._applyFilter()" style="width:160px">
            <option value="">Todos os status</option>
            <option>Aberta</option>
            <option>Em andamento</option>
            <option>Aguardando peça</option>
            <option>Concluída</option>
            <option>Cancelada</option>
          </select>
          <select class="form-select" id="ord-tipo" onchange="Ordens._applyFilter()" style="width:160px">
            <option value="">Todos os tipos</option>
            <option>Energia</option>
            <option>Telecomunicações</option>
            <option>Civil</option>
            <option>TI/Rede</option>
            <option>Outros</option>
          </select>
        </div>

        <!-- Tabela -->
        <div class="card" style="padding:0">
          <div id="ord-table-wrap" class="table-wrap" style="border:none"></div>
        </div>
        <div id="ord-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Ordens.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Ordens.render(main);
  },

  async load() {
    try {
      const data = await dbQuery(d =>
        d.from('ordens_servico')
          .select('*, site:sites(nome,risp:risps(nome))')
          .order('criado_em', { ascending: false })
      );
      Ordens._data = data || [];
      Ordens._renderKPIs();
      Ordens._applyFilter();
    } catch {
      document.getElementById('ord-table-wrap').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Erro ao carregar ordens</div></div>';
    }
  },

  _renderKPIs() {
    const d     = Ordens._data;
    const mes   = new Date().getMonth();
    const ano   = new Date().getFullYear();
    const dMes  = d.filter(o => {
      const dt = new Date(o.criado_em);
      return dt.getMonth() === mes && dt.getFullYear() === ano;
    });
    const abertas   = d.filter(o => o.status === 'Aberta' || o.status === 'Em andamento').length;
    const concluMes = dMes.filter(o => o.status === 'Concluída').length;
    const custoMes  = dMes.reduce((s, o) => s + (parseFloat(o.custo_total) || 0), 0);
    const aguard    = d.filter(o => o.status === 'Aguardando peça').length;

    const el = document.getElementById('ord-kpis');
    if (!el) return;
    el.innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-label">OS Abertas</div>
        <div class="kpi-value">${abertas}</div>
        <div class="kpi-sub">em andamento</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Aguard. Peça</div>
        <div class="kpi-value">${aguard}</div>
        <div class="kpi-sub">bloqueadas</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Concluídas/Mês</div>
        <div class="kpi-value">${concluMes}</div>
        <div class="kpi-sub">este mês</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">Custo/Mês</div>
        <div class="kpi-value" style="font-size:20px">R$ ${custoMes.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
        <div class="kpi-sub">este mês</div>
      </div>`;
  },

  _applyFilter() {
    Ordens._pagina = 1;
    Ordens._render();
  },

  _filtrar() {
    const busca  = (document.getElementById('ord-busca')?.value || '').toLowerCase();
    const status = document.getElementById('ord-status')?.value || '';
    const tipo   = document.getElementById('ord-tipo')?.value || '';

    return Ordens._data.filter(o => {
      if (status && o.status !== status) return false;
      if (tipo   && o.tipo   !== tipo)   return false;
      if (busca  && !o.numero?.toLowerCase().includes(busca) &&
                   !o.site?.nome?.toLowerCase().includes(busca) &&
                   !o.descricao?.toLowerCase().includes(busca)) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Ordens._filtrar();
    const total     = filtrados.length;
    const inicio    = (Ordens._pagina - 1) * Ordens._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Ordens._porPagina);

    const statusMap = {
      'Aberta':          'badge-blue',
      'Em andamento':    'badge-amber',
      'Aguardando peça': 'badge-red',
      'Concluída':       'badge-green',
      'Cancelada':       'badge-gray',
    };

    const rows = pagina.map(o => `
      <tr onclick="Ordens.ver('${o.id}')" style="cursor:pointer">
        <td style="font-family:var(--mono);font-size:12px;color:var(--accent)">${o.numero||'—'}</td>
        <td><span class="risp-badge">${o.site?.risp?.nome||'—'}</span></td>
        <td><strong style="color:var(--text)">${o.site?.nome||'—'}</strong></td>
        <td><span class="badge ${statusMap[o.status]||'badge-gray'}">${o.status||'—'}</span></td>
        <td style="color:var(--text3);font-size:12px">${o.tipo||'—'}</td>
        <td style="color:var(--text2);font-size:12px">${o.custo_total ? 'R$ '+parseFloat(o.custo_total).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '—'}</td>
        <td style="color:var(--text3);font-size:12px">${formatDate(o.criado_em)}</td>
        <td style="color:var(--text3);font-size:12px">${formatDate(o.previsao_conclusao)||'—'}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();Ordens.ver('${o.id}')">Ver</button>
            <button class="btn btn-ghost btn-sm perm-grad" onclick="event.stopPropagation();Ordens.editar('${o.id}')">✎</button>
          </div>
        </td>
      </tr>`).join('');

    document.getElementById('ord-table-wrap').innerHTML = total ? `
      <table>
        <thead>
          <tr>
            <th>Nº OS</th><th>RISP</th><th>Site</th><th>Status</th>
            <th>Tipo</th><th>Custo</th><th>Abertura</th><th>Previsão</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>` :
      '<div class="empty-state"><div class="empty-state-icon">🔧</div><div class="empty-state-title">Nenhuma OS encontrada</div></div>';

    const totalPags = Math.ceil(total / Ordens._porPagina);
    const pagEl = document.getElementById('ord-pagination');
    if (pagEl && totalPags > 1) {
      let html = `<button class="btn btn-ghost btn-sm" onclick="Ordens._pg(${Ordens._pagina-1})" ${Ordens._pagina===1?'disabled':''}>‹</button>`;
      for (let i = 1; i <= totalPags; i++)
        html += `<button class="btn btn-sm ${i===Ordens._pagina?'btn-primary':'btn-ghost'}" onclick="Ordens._pg(${i})">${i}</button>`;
      html += `<button class="btn btn-ghost btn-sm" onclick="Ordens._pg(${Ordens._pagina+1})" ${Ordens._pagina===totalPags?'disabled':''}>›</button>`;
      pagEl.innerHTML = html;
    } else if (pagEl) pagEl.innerHTML = '';
  },

  _pg(n) {
    const max = Math.ceil(Ordens._filtrar().length / Ordens._porPagina);
    if (n < 1 || n > max) return;
    Ordens._pagina = n;
    Ordens._render();
  },

  // ── NOVA OS ─────────────────────────
  nova() {
    Modal.open('Nova Ordem de Serviço', Ordens._formHTML(), [
      { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
      { label: 'Criar OS', class: 'btn-primary', onclick: 'Ordens.salvar()' }
    ]);
    Ordens._carregarSitesSelect('of-site', null);
  },

  async _carregarSitesSelect(elId, valorAtual) {
    try {
      const sites = await dbQuery(d => d.from('sites').select('id,nome').eq('ativo',true).order('nome'));
      const sel   = document.getElementById(elId);
      if (!sel) return;
      sel.innerHTML = '<option value="">Selecione um site...</option>' +
        (sites||[]).map(s=>`<option value="${s.id}" ${s.id===valorAtual?'selected':''}>${s.nome}</option>`).join('');
    } catch {}
  },

  _formHTML(o = {}) {
    const tipos    = ['Energia','Telecomunicações','Civil','TI/Rede','Outros'];
    const priors   = ['Baixa','Média','Alta','Crítica'];
    const statuses = ['Aberta','Em andamento','Aguardando peça','Concluída','Cancelada'];
    const tipoOpts   = tipos.map(t    => `<option ${t===o.tipo?'selected':''}>${t}</option>`).join('');
    const priorOpts  = priors.map(p   => `<option ${p===o.prioridade?'selected':''}>${p}</option>`).join('');
    const statusOpts = statuses.map(s => `<option ${s===o.status?'selected':''}>${s}</option>`).join('');
    const prevVal    = o.previsao_conclusao ? new Date(o.previsao_conclusao).toISOString().slice(0,10) : '';

    return `
      <div class="form-grid-2">
        <div>
          <label class="form-label">Nº OS</label>
          <input class="form-input" id="of-num" placeholder="OS-0001" value="${o.numero||''}">
        </div>
        <div>
          <label class="form-label">Site *</label>
          <select class="form-select" id="of-site"><option value="">Carregando...</option></select>
        </div>
        <div>
          <label class="form-label">Tipo</label>
          <select class="form-select" id="of-tipo"><option value="">—</option>${tipoOpts}</select>
        </div>
        <div>
          <label class="form-label">Prioridade</label>
          <select class="form-select" id="of-prior"><option value="">—</option>${priorOpts}</select>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-select" id="of-status">${statusOpts}</select>
        </div>
        <div>
          <label class="form-label">Previsão conclusão</label>
          <input type="date" class="form-input" id="of-prev" value="${prevVal}">
        </div>
        <div>
          <label class="form-label">Custo estimado (R$)</label>
          <input type="number" class="form-input" id="of-custo-est" step="0.01" placeholder="0,00" value="${o.custo_estimado||''}">
        </div>
        <div>
          <label class="form-label">Custo total (R$)</label>
          <input type="number" class="form-input" id="of-custo-tot" step="0.01" placeholder="0,00" value="${o.custo_total||''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Fornecedor / Empresa</label>
          <input class="form-input" id="of-forn" placeholder="Nome do fornecedor" value="${o.fornecedor||''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Descrição *</label>
          <textarea class="form-textarea" id="of-desc" rows="3" placeholder="Descreva o serviço a ser executado...">${o.descricao||''}</textarea>
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="of-obs" rows="2">${o.observacoes||''}</textarea>
        </div>
      </div>`;
  },

  async salvar() {
    const site_id = document.getElementById('of-site')?.value;
    const descr   = document.getElementById('of-desc')?.value?.trim();
    if (!site_id || !descr) {
      Toast.show('Preencha os campos obrigatórios (site e descrição)', 'error'); return;
    }
    const payload = {
      numero:              document.getElementById('of-num')?.value?.trim() || null,
      site_id,
      tipo:                document.getElementById('of-tipo')?.value || null,
      prioridade:          document.getElementById('of-prior')?.value || null,
      status:              document.getElementById('of-status')?.value || 'Aberta',
      previsao_conclusao:  document.getElementById('of-prev')?.value || null,
      custo_estimado:      parseFloat(document.getElementById('of-custo-est')?.value) || null,
      custo_total:         parseFloat(document.getElementById('of-custo-tot')?.value) || null,
      fornecedor:          document.getElementById('of-forn')?.value?.trim() || null,
      descricao:           descr,
      observacoes:         document.getElementById('of-obs')?.value?.trim() || null,
      criado_por:          Auth.user?.id
    };
    try {
      const { data, error } = await db.from('ordens_servico').insert(payload).select().single();
      if (error) throw error;
      await Audit.criou('ordens_servico', data.id, data);
      Modal.close();
      Toast.show('OS criada com sucesso', 'success');
      await Ordens.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao criar OS', 'error');
    }
  },

  // ── VER DETALHES ─────────────────────
  ver(id) {
    const o = Ordens._data.find(x => x.id === id);
    if (!o) return;
    const priorCor = { 'Crítica':'badge-red','Alta':'badge-amber','Média':'badge-blue','Baixa':'badge-gray' };
    const statusCor = { 'Aberta':'badge-blue','Em andamento':'badge-amber','Aguardando peça':'badge-red','Concluída':'badge-green','Cancelada':'badge-gray' };

    Modal.open(`OS ${o.numero||id}`, `
      <div style="display:grid;gap:12px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge ${statusCor[o.status]||'badge-gray'}">${o.status||'—'}</span>
          ${o.prioridade ? `<span class="badge ${priorCor[o.prioridade]||'badge-gray'}">${o.prioridade}</span>` : ''}
          ${o.tipo ? `<span class="badge badge-gray">${o.tipo}</span>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label class="form-label">Site</label><div>${o.site?.nome||'—'}</div></div>
          <div><label class="form-label">RISP</label><div>${o.site?.risp?.nome||'—'}</div></div>
          <div><label class="form-label">Fornecedor</label><div>${o.fornecedor||'—'}</div></div>
          <div><label class="form-label">Previsão</label><div>${formatDate(o.previsao_conclusao)||'—'}</div></div>
          <div><label class="form-label">Custo estimado</label><div>${o.custo_estimado?'R$ '+parseFloat(o.custo_estimado).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—'}</div></div>
          <div><label class="form-label">Custo total</label><div>${o.custo_total?'R$ '+parseFloat(o.custo_total).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—'}</div></div>
        </div>
        <div><label class="form-label">Descrição</label><div style="color:var(--text2);font-size:13px;white-space:pre-wrap">${o.descricao||'—'}</div></div>
        ${o.observacoes ? `<div><label class="form-label">Observações</label><div style="color:var(--text3);font-size:12px">${o.observacoes}</div></div>` : ''}
      </div>`,
      [
        { label: 'Fechar',   class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: '✎ Editar', class: 'btn-primary perm-grad', onclick: `Modal.close();Ordens.editar('${id}')` }
      ]
    );
  },

  // ── EDITAR ────────────────────────────
  editar(id) {
    const o = Ordens._data.find(x => x.id === id);
    if (!o) return;
    Modal.open('Editar OS', Ordens._formHTML(o), [
      { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
      { label: 'Salvar',   class: 'btn-primary', onclick: `Ordens.salvarEdicao('${id}')` }
    ]);
    Ordens._carregarSitesSelect('of-site', o.site_id);
  },

  async salvarEdicao(id) {
    const antes   = Ordens._data.find(x => x.id === id);
    const site_id = document.getElementById('of-site')?.value;
    const descr   = document.getElementById('of-desc')?.value?.trim();
    if (!site_id || !descr) {
      Toast.show('Preencha os campos obrigatórios', 'error'); return;
    }
    const payload = {
      numero:             document.getElementById('of-num')?.value?.trim() || null,
      site_id,
      tipo:               document.getElementById('of-tipo')?.value || null,
      prioridade:         document.getElementById('of-prior')?.value || null,
      status:             document.getElementById('of-status')?.value,
      previsao_conclusao: document.getElementById('of-prev')?.value || null,
      custo_estimado:     parseFloat(document.getElementById('of-custo-est')?.value) || null,
      custo_total:        parseFloat(document.getElementById('of-custo-tot')?.value) || null,
      fornecedor:         document.getElementById('of-forn')?.value?.trim() || null,
      descricao:          descr,
      observacoes:        document.getElementById('of-obs')?.value?.trim() || null,
    };
    try {
      const { error } = await db.from('ordens_servico').update(payload).eq('id', id);
      if (error) throw error;
      await Audit.editou('ordens_servico', id, antes, payload);
      Modal.close();
      Toast.show('OS atualizada', 'success');
      await Ordens.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar', 'error');
    }
  }
};
