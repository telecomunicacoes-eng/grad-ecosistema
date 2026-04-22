// ═══════════════════════════════════════
// GRAD Ecossistema — MISSÕES OPERACIONAIS
// ═══════════════════════════════════════

const Missoes = {
  _data: [],
  _pagina: 1,
  _porPagina: 20,
  _filtro: '',

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Missões Operacionais</div>
            <div class="page-sub">Controle e acompanhamento de missões de campo</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Missoes.refresh()">↻ Atualizar</button>
            <button class="btn btn-primary btn-sm perm-edit" onclick="Missoes.nova()">+ Nova missão</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input class="form-input" id="mis-busca" placeholder="Buscar missão..." oninput="Missoes._applyFilter()" style="width:220px">
          <select class="form-select" id="mis-status" onchange="Missoes._applyFilter()" style="width:160px">
            <option value="">Todos os status</option>
            <option>Planejada</option>
            <option>Em andamento</option>
            <option>Concluída</option>
            <option>Cancelada</option>
          </select>
          <select class="form-select" id="mis-tipo" onchange="Missoes._applyFilter()" style="width:160px">
            <option value="">Todos os tipos</option>
            <option>Manutenção preventiva</option>
            <option>Manutenção corretiva</option>
            <option>Instalação</option>
            <option>Inspeção</option>
            <option>Emergência</option>
          </select>
        </div>

        <!-- Sumário -->
        <div id="mis-summary" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"></div>

        <!-- Cards de missões -->
        <div id="mis-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px"></div>
        <div id="mis-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Missoes.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Missoes.render(main);
  },

  async load() {
    try {
      const data = await dbQuery(d =>
        d.from('missoes')
          .select('*, sites:missoes_sites(site:sites(nome,risp:risps(nome)))')
          .order('criado_em', { ascending: false })
      );
      Missoes._data = data || [];
      Missoes._applyFilter();
    } catch {
      document.getElementById('mis-grid').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Erro ao carregar missões</div></div>';
    }
  },

  _applyFilter() {
    Missoes._pagina = 1;
    Missoes._render();
  },

  _filtrar() {
    const busca  = (document.getElementById('mis-busca')?.value || '').toLowerCase();
    const status = document.getElementById('mis-status')?.value || '';
    const tipo   = document.getElementById('mis-tipo')?.value || '';

    return Missoes._data.filter(m => {
      if (status && m.status !== status) return false;
      if (tipo   && m.tipo   !== tipo)   return false;
      if (busca  && !m.titulo?.toLowerCase().includes(busca) &&
                   !m.descricao?.toLowerCase().includes(busca)) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Missoes._filtrar();
    const total     = filtrados.length;

    // Sumário
    const counts = { 'Planejada': 0, 'Em andamento': 0, 'Concluída': 0, 'Cancelada': 0 };
    filtrados.forEach(m => { if (counts[m.status] !== undefined) counts[m.status]++; });
    const sumEl = document.getElementById('mis-summary');
    if (sumEl) sumEl.innerHTML = `
      <span class="badge badge-blue">${counts['Planejada']} Planejadas</span>
      <span class="badge badge-amber">${counts['Em andamento']} Em andamento</span>
      <span class="badge badge-green">${counts['Concluída']} Concluídas</span>
      <span class="badge badge-gray">${counts['Cancelada']} Canceladas</span>`;

    const inicio  = (Missoes._pagina - 1) * Missoes._porPagina;
    const pagina  = filtrados.slice(inicio, inicio + Missoes._porPagina);

    const grid = document.getElementById('mis-grid');
    if (!pagina.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🎯</div><div class="empty-state-title">Nenhuma missão encontrada</div></div>';
    } else {
      grid.innerHTML = pagina.map(m => Missoes._card(m)).join('');
    }

    // Paginação
    const totalPags = Math.ceil(total / Missoes._porPagina);
    const pagEl = document.getElementById('mis-pagination');
    if (pagEl) pagEl.innerHTML = totalPags > 1 ? Missoes._paginacaoHTML(totalPags) : '';
  },

  _card(m) {
    const sitesNomes = (m.sites||[]).map(s => s.site?.nome).filter(Boolean);
    const statusCor  = { 'Planejada':'badge-blue','Em andamento':'badge-amber','Concluída':'badge-green','Cancelada':'badge-gray' };
    const tipoCor    = { 'Emergência':'badge-red','Manutenção corretiva':'badge-amber' };

    return `
      <div class="card" style="cursor:pointer" onclick="Missoes.ver('${m.id}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <span class="badge ${statusCor[m.status]||'badge-gray'}">${m.status||'—'}</span>
            ${m.tipo ? `<span class="badge ${tipoCor[m.tipo]||'badge-gray'}" style="margin-left:4px">${m.tipo}</span>` : ''}
          </div>
          <div class="perm-edit" style="display:flex;gap:4px" onclick="event.stopPropagation()">
            <button class="btn btn-ghost btn-sm" onclick="Missoes.editar('${m.id}')">✎</button>
          </div>
        </div>
        <div style="font-weight:700;color:var(--text);margin-bottom:4px">${m.titulo||'Sem título'}</div>
        ${m.descricao ? `<div style="font-size:12px;color:var(--text3);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${m.descricao}</div>` : ''}
        ${sitesNomes.length ? `
          <div style="font-size:11px;color:var(--text3);margin-bottom:6px">
            📍 ${sitesNomes.slice(0,3).join(', ')}${sitesNomes.length>3?` +${sitesNomes.length-3}`:''}
          </div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11px;color:var(--text3)">
          <span>Início: ${formatDate(m.data_inicio)||'—'}</span>
          <span>Fim: ${formatDate(m.data_fim)||'—'}</span>
        </div>
        ${m.responsavel ? `<div style="font-size:11px;color:var(--text3);margin-top:4px">👤 ${m.responsavel}</div>` : ''}
      </div>`;
  },

  _paginacaoHTML(totalPags) {
    let html = `<button class="btn btn-ghost btn-sm" onclick="Missoes._pg(${Missoes._pagina-1})" ${Missoes._pagina===1?'disabled':''}>‹</button>`;
    for (let i = 1; i <= totalPags; i++) {
      html += `<button class="btn btn-sm ${i===Missoes._pagina?'btn-primary':'btn-ghost'}" onclick="Missoes._pg(${i})">${i}</button>`;
    }
    html += `<button class="btn btn-ghost btn-sm" onclick="Missoes._pg(${Missoes._pagina+1})" ${Missoes._pagina===totalPags?'disabled':''}>›</button>`;
    return html;
  },

  _pg(n) {
    const max = Math.ceil(Missoes._filtrar().length / Missoes._porPagina);
    if (n < 1 || n > max) return;
    Missoes._pagina = n;
    Missoes._render();
  },

  // ── NOVA MISSÃO ─────────────────────
  nova() {
    Modal.open('Nova Missão', Missoes._formHTML(), [
      { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
      { label: 'Criar',    class: 'btn-primary', onclick: 'Missoes.salvar()' }
    ]);
  },

  _formHTML(m = {}) {
    const tipos    = ['Manutenção preventiva','Manutenção corretiva','Instalação','Inspeção','Emergência'];
    const statuses = ['Planejada','Em andamento','Concluída','Cancelada'];
    const tipoOpts    = tipos.map(t    => `<option ${t===m.tipo?'selected':''}>${t}</option>`).join('');
    const statusOpts  = statuses.map(s => `<option ${s===m.status?'selected':''}>${s}</option>`).join('');
    const dataIni = m.data_inicio ? new Date(m.data_inicio).toISOString().slice(0,10) : '';
    const dataFim = m.data_fim    ? new Date(m.data_fim).toISOString().slice(0,10)    : '';

    return `
      <div class="form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Título *</label>
          <input class="form-input" id="mf-titulo" placeholder="Nome da missão" value="${m.titulo||''}">
        </div>
        <div>
          <label class="form-label">Tipo</label>
          <select class="form-select" id="mf-tipo"><option value="">—</option>${tipoOpts}</select>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-select" id="mf-status">${statusOpts}</select>
        </div>
        <div>
          <label class="form-label">Data início</label>
          <input type="date" class="form-input" id="mf-ini" value="${dataIni}">
        </div>
        <div>
          <label class="form-label">Data fim</label>
          <input type="date" class="form-input" id="mf-fim" value="${dataFim}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Responsável</label>
          <input class="form-input" id="mf-resp" placeholder="Nome do responsável" value="${m.responsavel||''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Descrição</label>
          <textarea class="form-textarea" id="mf-desc" rows="3" placeholder="Objetivo, escopo, equipe...">${m.descricao||''}</textarea>
        </div>
      </div>`;
  },

  async salvar() {
    const titulo = document.getElementById('mf-titulo')?.value?.trim();
    if (!titulo) { Toast.show('Informe o título da missão', 'error'); return; }

    const payload = {
      titulo,
      tipo:           document.getElementById('mf-tipo')?.value || null,
      status:         document.getElementById('mf-status')?.value || 'Planejada',
      data_inicio:    document.getElementById('mf-ini')?.value || null,
      data_fim:       document.getElementById('mf-fim')?.value || null,
      responsavel:    document.getElementById('mf-resp')?.value?.trim() || null,
      descricao:      document.getElementById('mf-desc')?.value?.trim() || null,
      criado_por:     Auth.user?.id
    };
    try {
      const { data, error } = await db.from('missoes').insert(payload).select().single();
      if (error) throw error;
      await Audit.criou('missoes', data.id, data);
      Modal.close();
      Toast.show('Missão criada', 'success');
      await Missoes.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao criar missão', 'error');
    }
  },

  // ── VER DETALHES ─────────────────────
  ver(id) {
    const m = Missoes._data.find(x => x.id === id);
    if (!m) return;
    const sitesNomes = (m.sites||[]).map(s => s.site?.nome).filter(Boolean);
    const statusCor  = { 'Planejada':'badge-blue','Em andamento':'badge-amber','Concluída':'badge-green','Cancelada':'badge-gray' };

    Modal.open(`Missão — ${m.titulo}`, `
      <div style="display:grid;gap:12px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge ${statusCor[m.status]||'badge-gray'}">${m.status||'—'}</span>
          ${m.tipo ? `<span class="badge badge-gray">${m.tipo}</span>` : ''}
        </div>
        ${m.descricao ? `<div style="color:var(--text2);font-size:13px;white-space:pre-wrap">${m.descricao}</div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label class="form-label">Início</label><div>${formatDate(m.data_inicio)||'—'}</div></div>
          <div><label class="form-label">Fim</label><div>${formatDate(m.data_fim)||'—'}</div></div>
          <div><label class="form-label">Responsável</label><div>${m.responsavel||'—'}</div></div>
          <div><label class="form-label">Criada em</label><div>${formatDate(m.criado_em)||'—'}</div></div>
        </div>
        ${sitesNomes.length ? `<div><label class="form-label">Sites envolvidos</label><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${sitesNomes.map(n=>`<span class="badge badge-gray">${n}</span>`).join('')}</div></div>` : ''}
      </div>`,
      [
        { label: 'Fechar',  class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: '✎ Editar', class: 'btn-primary perm-edit', onclick: `Modal.close();Missoes.editar('${id}')` }
      ]
    );
  },

  // ── EDITAR ────────────────────────────
  editar(id) {
    const m = Missoes._data.find(x => x.id === id);
    if (!m) return;
    Modal.open('Editar Missão', Missoes._formHTML(m), [
      { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
      { label: 'Salvar',   class: 'btn-primary', onclick: `Missoes.salvarEdicao('${id}')` }
    ]);
  },

  async salvarEdicao(id) {
    const antes = Missoes._data.find(x => x.id === id);
    const titulo = document.getElementById('mf-titulo')?.value?.trim();
    if (!titulo) { Toast.show('Informe o título', 'error'); return; }

    const payload = {
      titulo,
      tipo:        document.getElementById('mf-tipo')?.value || null,
      status:      document.getElementById('mf-status')?.value,
      data_inicio: document.getElementById('mf-ini')?.value || null,
      data_fim:    document.getElementById('mf-fim')?.value || null,
      responsavel: document.getElementById('mf-resp')?.value?.trim() || null,
      descricao:   document.getElementById('mf-desc')?.value?.trim() || null,
    };
    try {
      const { error } = await db.from('missoes').update(payload).eq('id', id);
      if (error) throw error;
      await Audit.editou('missoes', id, antes, payload);
      Modal.close();
      Toast.show('Missão atualizada', 'success');
      await Missoes.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar', 'error');
    }
  },

  // ── DASHBOARD ────────────────────────
  async renderDashboard(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">🎯 Missões — Dashboard</div>
            <div class="page-sub">Visão geral das operações de campo</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('missoes','lista')">Ver todas →</button>
          </div>
        </div>
        <div id="mis-dash-kpis" class="kpi-grid" style="margin-bottom:20px">
          <div style="grid-column:1/-1;display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div class="card">
            <div class="card-title">Por Status</div>
            <canvas id="mis-dash-status" height="200"></canvas>
          </div>
          <div class="card">
            <div class="card-title">Por Tipo</div>
            <canvas id="mis-dash-tipo" height="200"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Missões Recentes</div>
          <div id="mis-dash-recentes"></div>
        </div>
      </div>`;

    try {
      const data = await dbQuery(d =>
        d.from('missoes').select('*').order('criado_em', { ascending: false }).limit(200)
      );
      const missoes = data || [];
      const hoje = new Date();
      hoje.setHours(0,0,0,0);

      const total      = missoes.length;
      const andamento  = missoes.filter(m => m.status === 'Em andamento').length;
      const planejadas = missoes.filter(m => m.status === 'Planejada').length;
      const concluidas = missoes.filter(m => m.status === 'Concluída').length;
      const canceladas = missoes.filter(m => m.status === 'Cancelada').length;
      const atrasadas  = missoes.filter(m =>
        m.data_fim && new Date(m.data_fim) < hoje &&
        m.status !== 'Concluída' && m.status !== 'Cancelada'
      ).length;

      document.getElementById('mis-dash-kpis').innerHTML = `
        <div class="kpi-card blue">
          <div class="kpi-label">Total de Missões</div>
          <div class="kpi-value">${total}</div>
        </div>
        <div class="kpi-card amber">
          <div class="kpi-label">Em Andamento</div>
          <div class="kpi-value">${andamento}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Planejadas</div>
          <div class="kpi-value">${planejadas}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">Concluídas</div>
          <div class="kpi-value">${concluidas}</div>
        </div>
        <div class="kpi-card red">
          <div class="kpi-label">Atrasadas</div>
          <div class="kpi-value">${atrasadas}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Canceladas</div>
          <div class="kpi-value">${canceladas}</div>
        </div>`;

      // Gráfico de status (doughnut)
      new Chart(document.getElementById('mis-dash-status'), {
        type: 'doughnut',
        data: {
          labels: ['Planejada', 'Em andamento', 'Concluída', 'Cancelada'],
          datasets: [{
            data: [planejadas, andamento, concluidas, canceladas],
            backgroundColor: ['#3b82f6','#f59e0b','#22c55e','#6b7280'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#9ab8d8', font: { size: 13 } } } }
        }
      });

      // Gráfico de tipo (barras horizontais)
      const tipoMap = {};
      missoes.forEach(m => { if (m.tipo) tipoMap[m.tipo] = (tipoMap[m.tipo] || 0) + 1; });
      const tipoLabels = Object.keys(tipoMap);
      const tipoValues = tipoLabels.map(k => tipoMap[k]);

      new Chart(document.getElementById('mis-dash-tipo'), {
        type: 'bar',
        data: {
          labels: tipoLabels.length ? tipoLabels : ['Sem dados'],
          datasets: [{
            data: tipoValues.length ? tipoValues : [0],
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#9ab8d8', font: { size: 12 } }, grid: { color: 'rgba(255,255,255,.05)' } },
            y: { ticks: { color: '#daeaff', font: { size: 13 } }, grid: { display: false } }
          }
        }
      });

      // Tabela de recentes
      const recentes = missoes.slice(0, 10);
      const statusCor = { 'Planejada':'badge-blue','Em andamento':'badge-amber','Concluída':'badge-green','Cancelada':'badge-gray' };
      document.getElementById('mis-dash-recentes').innerHTML = recentes.length ? `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Missão</th><th>Tipo</th><th>Status</th>
                <th>Responsável</th><th>Início</th><th>Fim</th>
              </tr>
            </thead>
            <tbody>${recentes.map(m => `
              <tr>
                <td>${m.titulo||'—'}</td>
                <td>${m.tipo||'—'}</td>
                <td><span class="badge ${statusCor[m.status]||'badge-gray'}">${m.status||'—'}</span></td>
                <td>${m.responsavel||'—'}</td>
                <td>${formatDate(m.data_inicio)}</td>
                <td>${formatDate(m.data_fim)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` :
        '<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-title">Nenhuma missão registrada</div></div>';

    } catch (err) {
      document.getElementById('mis-dash-kpis').innerHTML =
        `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-title">Erro ao carregar dashboard</div><div class="empty-state-sub">${err.message||''}</div></div>`;
    }
  }
};
