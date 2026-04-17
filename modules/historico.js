// ═══════════════════════════════════════
// GRAD Ecossistema — HISTÓRICO
// Timeline de todas as ocorrências
// ═══════════════════════════════════════

const Historico = {
  _data: [],
  _pagina: 1,
  _porPagina: 30,

  async render(container) {
    const hoje   = new Date().toISOString().slice(0,10);
    const ha30   = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);

    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Histórico</div>
            <div class="page-sub">Timeline de todas as ocorrências registradas</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Historico.refresh()">↻ Atualizar</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input type="date" class="form-input" id="hi-ini" value="${ha30}" onchange="Historico._applyFilter()" style="width:150px">
          <input type="date" class="form-input" id="hi-fim" value="${hoje}" onchange="Historico._applyFilter()" style="width:150px">
          <select class="form-select" id="hi-sit" onchange="Historico._applyFilter()" style="width:170px">
            <option value="">Todas situações</option>
            <option>Inoperante</option>
            <option>Instável</option>
            <option>Parcial/Em analise</option>
            <option>Modo Local</option>
            <option>Operacional</option>
          </select>
          <select class="form-select" id="hi-risp" onchange="Historico._applyFilter()" style="width:150px">
            <option value="">Todas RISPs</option>
          </select>
          <input class="form-input" id="hi-busca" placeholder="Buscar site..." oninput="Historico._applyFilter()" style="width:180px">
          <select class="form-select" id="hi-tipo" onchange="Historico._applyFilter()" style="width:160px">
            <option value="">Abertas + Fechadas</option>
            <option value="ativo">Somente ativas</option>
            <option value="fechado">Somente fechadas</option>
          </select>
        </div>

        <!-- Resumo -->
        <div id="hi-summary" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"></div>

        <!-- Tabela / Timeline -->
        <div class="card" style="padding:0">
          <div id="hi-table" class="table-wrap" style="border:none"></div>
        </div>
        <div id="hi-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Historico._carregarRisps();
    await Historico.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Historico.render(main);
  },

  async _carregarRisps() {
    try {
      const risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome'));
      const sel = document.getElementById('hi-risp');
      if (sel && risps) {
        risps.forEach(r => {
          const o = document.createElement('option');
          o.value = r.nome; o.textContent = r.nome;
          sel.appendChild(o);
        });
      }
    } catch {}
  },

  async load() {
    const ini = document.getElementById('hi-ini')?.value;
    const fim = document.getElementById('hi-fim')?.value;

    const tableEl = document.getElementById('hi-table');
    if (tableEl) tableEl.innerHTML = '<div class="empty-state"><div class="spinner"></div></div>';

    try {
      let query = db.from('ocorrencias')
        .select('*, site:sites(id,nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)')
        .order('inicio', { ascending: false });

      if (ini) query = query.gte('inicio', ini);
      if (fim) query = query.lte('inicio', fim + 'T23:59:59');

      const { data, error } = await query.limit(500);
      if (error) throw error;

      Historico._data = data || [];
      Historico._applyFilter();
    } catch (e) {
      document.getElementById('hi-table').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Erro ao carregar histórico</div></div>';
    }
  },

  _applyFilter() {
    Historico._pagina = 1;
    Historico._render();
  },

  _filtrar() {
    const sit   = document.getElementById('hi-sit')?.value || '';
    const risp  = document.getElementById('hi-risp')?.value || '';
    const busca = (document.getElementById('hi-busca')?.value || '').toLowerCase();
    const tipo  = document.getElementById('hi-tipo')?.value || '';

    return Historico._data.filter(o => {
      if (sit   && o.situacao !== sit) return false;
      if (risp  && o.site?.risp?.nome !== risp) return false;
      if (busca && !o.site?.nome?.toLowerCase().includes(busca) &&
                   !o.site?.cidade?.toLowerCase().includes(busca)) return false;
      if (tipo === 'ativo'   && o.fim) return false;
      if (tipo === 'fechado' && !o.fim) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Historico._filtrar();
    const total     = filtrados.length;
    const inicio    = (Historico._pagina - 1) * Historico._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Historico._porPagina);

    // Resumo
    const ativos   = filtrados.filter(o => !o.fim).length;
    const fechados = filtrados.filter(o => !!o.fim).length;
    const sumEl = document.getElementById('hi-summary');
    if (sumEl) sumEl.innerHTML = `
      <span class="badge badge-red">${filtrados.filter(o=>o.situacao==='Inoperante'&&!o.fim).length} inop. ativos</span>
      <span class="badge badge-amber">${filtrados.filter(o=>o.situacao==='Parcial/Em analise'&&!o.fim).length} parcial ativos</span>
      <span class="badge badge-green">${fechados} resolvidos</span>
      <span class="badge badge-blue" style="margin-left:auto">${total} registros</span>`;

    // Tabela
    const rows = pagina.map(o => {
      const isAtivo = !o.fim;
      const dias = o.fim
        ? Math.floor((new Date(o.fim) - new Date(o.inicio)) / 86400000)
        : diffDays(o.inicio);

      const sitCor = {
        'Inoperante':         '#f87171',
        'Instável':           '#14b8a6',
        'Parcial/Em analise': '#fbbf24',
        'Modo Local':         '#a78bfa',
        'Operacional':        '#34d399',
      };

      return `
        <tr style="opacity:${isAtivo?'1':'.7'}">
          <td style="width:4px;padding:0">
            <div style="width:3px;height:100%;min-height:40px;background:${sitCor[o.situacao]||'#6b7280'};border-radius:2px"></div>
          </td>
          <td style="font-size:11px;color:var(--text3);font-family:var(--mono);white-space:nowrap">
            ${formatDateTime(o.inicio)}
          </td>
          <td><span class="risp-badge">${o.site?.risp?.nome||'—'}</span></td>
          <td>
            <strong style="color:var(--text)">${o.site?.nome||o.site_id||'—'}</strong>
            ${o.site?.cidade?`<div style="font-size:10px;color:var(--text3)">${o.site.cidade}</div>`:''}
          </td>
          <td>
            <span style="color:${sitCor[o.situacao]||'#6b7280'};font-size:12px;font-weight:600">${o.situacao||'—'}</span>
          </td>
          <td style="font-size:12px;color:var(--text2)">${o.motivo?.descricao||'—'}</td>
          <td>${isAtivo ? daysBadge(dias) : `<span style="font-size:11px;color:var(--text3)">${dias}d</span>`}</td>
          <td style="font-size:11px;color:var(--text3)">
            ${o.fim
              ? `<span class="badge badge-green">✔ ${formatDate(o.fim)}</span>`
              : '<span class="badge badge-gray">Em aberto</span>'}
          </td>
          <td style="font-size:11px;color:var(--text3)">${o.glpi||o.os_numero||'—'}</td>
        </tr>`;
    }).join('');

    const tableEl = document.getElementById('hi-table');
    if (tableEl) {
      tableEl.innerHTML = total ? `
        <table>
          <thead>
            <tr>
              <th style="width:4px"></th>
              <th>Data/Hora</th><th>RISP</th><th>Site</th><th>Situação</th>
              <th>Motivo</th><th>Duração</th><th>Status</th><th>GLPI/OS</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` :
        '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">Nenhum registro no período</div></div>';
    }

    // Paginação
    const totalPags = Math.ceil(total / Historico._porPagina);
    const pagEl = document.getElementById('hi-pagination');
    if (pagEl) {
      if (totalPags <= 1) { pagEl.innerHTML = ''; return; }
      let html = `<span style="color:var(--text3);font-size:12px;margin-right:8px">${total} registros</span>`;
      html += `<button class="btn btn-ghost btn-sm" onclick="Historico._pg(${Historico._pagina-1})" ${Historico._pagina===1?'disabled':''}>‹</button>`;
      for (let i = 1; i <= totalPags; i++) {
        if (i===1||i===totalPags||Math.abs(i-Historico._pagina)<=2) {
          html += `<button class="btn btn-sm ${i===Historico._pagina?'btn-primary':'btn-ghost'}" onclick="Historico._pg(${i})">${i}</button>`;
        } else if (Math.abs(i-Historico._pagina)===3) {
          html += `<span style="color:var(--text3);padding:0 4px">…</span>`;
        }
      }
      html += `<button class="btn btn-ghost btn-sm" onclick="Historico._pg(${Historico._pagina+1})" ${Historico._pagina===totalPags?'disabled':''}>›</button>`;
      pagEl.innerHTML = html;
    }
  },

  _pg(n) {
    const max = Math.ceil(Historico._filtrar().length / Historico._porPagina);
    if (n < 1 || n > max) return;
    Historico._pagina = n;
    Historico._render();
  }
};
