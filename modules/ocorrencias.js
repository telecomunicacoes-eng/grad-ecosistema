// ═══════════════════════════════════════
// GRAD Ecossistema — OCORRÊNCIAS
// ═══════════════════════════════════════

const Ocorrencias = {
  _data: [],
  _filtros: { situacao: '', risp: '', motivo: '', busca: '' },
  _pagina: 1,
  _porPagina: 20,

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Ocorrências</div>
            <div class="page-sub">Gestão de falhas e interrupções de sites</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Ocorrencias.refresh()">↻ Atualizar</button>
            <button class="btn btn-primary btn-sm perm-grad" onclick="Ocorrencias.abrirNova()">+ Nova ocorrência</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input class="form-input" id="oc-busca" placeholder="Buscar site..." oninput="Ocorrencias._applyFilter()" style="width:200px">
          <select class="form-select" id="oc-sit" onchange="Ocorrencias._applyFilter()" style="width:170px">
            <option value="">Todas situações</option>
            <option>Inoperante</option>
            <option>Parcial/Em analise</option>
            <option>Modo Local</option>
          </select>
          <select class="form-select" id="oc-risp" onchange="Ocorrencias._applyFilter()" style="width:150px">
            <option value="">Todas RISPs</option>
          </select>
          <select class="form-select" id="oc-mot" onchange="Ocorrencias._applyFilter()" style="width:200px">
            <option value="">Todos motivos</option>
          </select>
        </div>

        <!-- Resumo rápido -->
        <div id="oc-summary" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"></div>

        <!-- Tabela -->
        <div class="card" style="padding:0">
          <div id="oc-table-wrap" class="table-wrap" style="border:none"></div>
        </div>

        <!-- Paginação -->
        <div id="oc-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Ocorrencias.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Ocorrencias.render(main);
  },

  async load() {
    try {
      // Carrega ocorrências ativas
      const data = await dbQuery(d =>
        d.from('ocorrencias')
          .select('*, site:sites(id,nome,risp:risps(id,nome)), motivo:motivos_falha(id,descricao)')
          .neq('situacao', 'Operacional')
          .order('inicio', { ascending: false })
      );
      Ocorrencias._data = data || [];

      // Popula filtros
      await Ocorrencias._popularFiltros();
      Ocorrencias._applyFilter();
    } catch {
      document.getElementById('oc-table-wrap').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Erro ao carregar ocorrências</div></div>';
    }
  },

  async _popularFiltros() {
    // RISPs
    try {
      const risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome'));
      const sel = document.getElementById('oc-risp');
      if (sel && risps) {
        risps.forEach(r => {
          const o = document.createElement('option');
          o.value = r.nome; o.textContent = r.nome;
          sel.appendChild(o);
        });
      }
    } catch {}

    // Motivos
    try {
      const mots = await dbQuery(d => d.from('motivos_falha').select('id,descricao').order('descricao'));
      const sel = document.getElementById('oc-mot');
      if (sel && mots) {
        mots.forEach(m => {
          const o = document.createElement('option');
          o.value = m.descricao; o.textContent = m.descricao;
          sel.appendChild(o);
        });
      }
    } catch {}
  },

  _applyFilter() {
    const busca  = (document.getElementById('oc-busca')?.value || '').toLowerCase();
    const sit    = document.getElementById('oc-sit')?.value || '';
    const risp   = document.getElementById('oc-risp')?.value || '';
    const motivo = document.getElementById('oc-mot')?.value || '';

    Ocorrencias._filtros = { busca, situacao: sit, risp, motivo };
    Ocorrencias._pagina  = 1;
    Ocorrencias._render();
  },

  _filtrar() {
    const { busca, situacao, risp, motivo } = Ocorrencias._filtros;
    return Ocorrencias._data.filter(o => {
      if (situacao && o.situacao !== situacao) return false;
      if (risp     && o.site?.risp?.nome !== risp) return false;
      if (motivo   && o.motivo?.descricao !== motivo) return false;
      if (busca    && !o.site?.nome?.toLowerCase().includes(busca)) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Ocorrencias._filtrar();
    const total     = filtrados.length;
    const inicio    = (Ocorrencias._pagina - 1) * Ocorrencias._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Ocorrencias._porPagina);

    // Resumo
    const inop = filtrados.filter(o => o.situacao === 'Inoperante').length;
    const parc = filtrados.filter(o => o.situacao === 'Parcial/Em analise').length;
    const ml   = filtrados.filter(o => o.situacao === 'Modo Local').length;
    const crit = filtrados.filter(o => o.situacao === 'Inoperante' && diffDays(o.inicio) > 7).length;

    const sumEl = document.getElementById('oc-summary');
    if (sumEl) sumEl.innerHTML = `
      <span class="badge badge-red">${inop} Inoperantes</span>
      <span class="badge badge-amber">${parc} Parcial/Análise</span>
      <span class="badge badge-purple">${ml} Modo Local</span>
      <span class="badge badge-gray">${crit} Críticos +7d</span>
      <span class="badge badge-blue">${total} no filtro</span>`;

    // Tabela
    const rows = pagina.map(o => {
      const dias = diffDays(o.inicio);
      const badge = Ocorrencias._situacaoBadge(o.situacao);
      return `
        <tr onclick="Ocorrencias.verDetalhes('${o.id}')" style="cursor:pointer">
          <td><span class="risp-badge">${o.site?.risp?.nome || '—'}</span></td>
          <td><strong style="color:var(--text)">${o.site?.nome || o.site_id}</strong></td>
          <td>${badge}</td>
          <td style="color:var(--text2);font-size:12px">${o.motivo?.descricao || '—'}</td>
          <td>${daysBadge(dias)}</td>
          <td style="color:var(--text3);font-size:12px">${formatDate(o.inicio)}</td>
          <td style="color:var(--text3);font-size:12px">${o.os_numero || '—'}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();Ocorrencias.verDetalhes('${o.id}')">Ver</button>
              <button class="btn btn-ghost btn-sm perm-grad" onclick="event.stopPropagation();Ocorrencias.editar('${o.id}')">✎</button>
              <button class="btn btn-ghost btn-sm perm-grad" onclick="event.stopPropagation();Ocorrencias.fechar('${o.id}')">✔ Fechar</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    document.getElementById('oc-table-wrap').innerHTML = total ? `
      <table>
        <thead>
          <tr>
            <th>RISP</th><th>Site</th><th>Situação</th><th>Motivo</th>
            <th>Dias</th><th>Início</th><th>OS</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>` :
      '<div class="empty-state"><div class="empty-state-icon">✔</div><div class="empty-state-title">Nenhuma ocorrência encontrada</div></div>';

    // Paginação
    const totalPags = Math.ceil(total / Ocorrencias._porPagina);
    const pagEl = document.getElementById('oc-pagination');
    if (pagEl) {
      if (totalPags <= 1) { pagEl.innerHTML = ''; return; }
      let html = `<span style="color:var(--text3);font-size:12px;margin-right:8px">${total} registros</span>`;
      html += `<button class="btn btn-ghost btn-sm" onclick="Ocorrencias._pg(${Ocorrencias._pagina-1})" ${Ocorrencias._pagina===1?'disabled':''}>‹</button>`;
      for (let i = 1; i <= totalPags; i++) {
        if (i === 1 || i === totalPags || Math.abs(i - Ocorrencias._pagina) <= 2) {
          html += `<button class="btn btn-sm ${i===Ocorrencias._pagina?'btn-primary':'btn-ghost'}" onclick="Ocorrencias._pg(${i})">${i}</button>`;
        } else if (Math.abs(i - Ocorrencias._pagina) === 3) {
          html += `<span style="color:var(--text3);padding:0 4px">…</span>`;
        }
      }
      html += `<button class="btn btn-ghost btn-sm" onclick="Ocorrencias._pg(${Ocorrencias._pagina+1})" ${Ocorrencias._pagina===totalPags?'disabled':''}>›</button>`;
      pagEl.innerHTML = html;
    }
  },

  _pg(n) {
    const total = Ocorrencias._filtrar().length;
    const max   = Math.ceil(total / Ocorrencias._porPagina);
    if (n < 1 || n > max) return;
    Ocorrencias._pagina = n;
    Ocorrencias._render();
  },

  _situacaoBadge(sit) {
    const map = {
      'Inoperante':          'badge-red',
      'Parcial/Em analise':  'badge-amber',
      'Modo Local':          'badge-purple',
      'Operacional':         'badge-green',
    };
    return `<span class="badge ${map[sit]||'badge-gray'}">${sit}</span>`;
  },

  // ── NOVA OCORRÊNCIA ──────────────────
  async abrirNova() {
    // Carrega selects
    let sitesOpts  = '<option value="">Selecione um site...</option>';
    let motivoOpts = '<option value="">Selecione o motivo...</option>';
    try {
      const sites  = await dbQuery(d => d.from('sites').select('id,nome').eq('ativo',true).order('nome'));
      const motivos = await dbQuery(d => d.from('motivos_falha').select('id,descricao').order('descricao'));
      sitesOpts  = '<option value="">Selecione um site...</option>' + (sites||[]).map(s=>`<option value="${s.id}">${s.nome}</option>`).join('');
      motivoOpts = '<option value="">Selecione o motivo...</option>' + (motivos||[]).map(m=>`<option value="${m.id}">${m.descricao}</option>`).join('');
    } catch {}

    Modal.open('Nova Ocorrência', `
      <div class="form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Site *</label>
          <select class="form-select" id="noc-site">${sitesOpts}</select>
        </div>
        <div>
          <label class="form-label">Situação *</label>
          <select class="form-select" id="noc-sit">
            <option>Inoperante</option>
            <option>Parcial/Em analise</option>
            <option>Modo Local</option>
          </select>
        </div>
        <div>
          <label class="form-label">Motivo *</label>
          <select class="form-select" id="noc-mot">${motivoOpts}</select>
        </div>
        <div>
          <label class="form-label">Data de início *</label>
          <input type="datetime-local" class="form-input" id="noc-inicio" value="${new Date().toISOString().slice(0,16)}">
        </div>
        <div>
          <label class="form-label">Nº da OS</label>
          <input type="text" class="form-input" id="noc-os" placeholder="OS-0000">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="noc-obs" rows="3" placeholder="Detalhes da ocorrência..."></textarea>
        </div>
      </div>`,
      [
        { label: 'Cancelar',  class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: 'Registrar', class: 'btn-primary',  onclick: 'Ocorrencias.salvarNova()' }
      ]
    );
  },

  async salvarNova() {
    const site_id   = document.getElementById('noc-site')?.value;
    const situacao  = document.getElementById('noc-sit')?.value;
    const motivo_id = document.getElementById('noc-mot')?.value || null;
    const inicio    = document.getElementById('noc-inicio')?.value;
    const os_numero = document.getElementById('noc-os')?.value?.trim() || null;
    const obs       = document.getElementById('noc-obs')?.value?.trim() || null;

    if (!site_id || !situacao || !inicio) {
      Toast.show('Preencha os campos obrigatórios', 'error'); return;
    }

    try {
      const { data, error } = await db.from('ocorrencias').insert({
        site_id, situacao, motivo_id, inicio,
        os_numero, observacoes: obs,
        criado_por: Auth.user?.id
      }).select().single();
      if (error) throw error;
      await Audit.criou('ocorrencias', data.id, data);
      Modal.close();
      Toast.show('Ocorrência registrada com sucesso', 'success');
      await Ocorrencias.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao registrar', 'error');
    }
  },

  // ── VER DETALHES ─────────────────────
  async verDetalhes(id) {
    const o = Ocorrencias._data.find(x => x.id === id);
    if (!o) return;

    const dias  = diffDays(o.inicio);
    const badge = Ocorrencias._situacaoBadge(o.situacao);

    Modal.open(`Ocorrência — ${o.site?.nome || id}`, `
      <div style="display:grid;gap:12px">
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div><label class="form-label">RISP</label><div>${o.site?.risp?.nome||'—'}</div></div>
          <div><label class="form-label">Site</label><div><strong>${o.site?.nome||'—'}</strong></div></div>
          <div><label class="form-label">Situação</label><div>${badge}</div></div>
          <div><label class="form-label">Dias</label><div>${daysBadge(dias)}</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label class="form-label">Motivo</label><div style="color:var(--text2)">${o.motivo?.descricao||'—'}</div></div>
          <div><label class="form-label">OS</label><div style="color:var(--text2)">${o.os_numero||'—'}</div></div>
          <div><label class="form-label">Início</label><div style="color:var(--text2)">${formatDateTime(o.inicio)}</div></div>
          <div><label class="form-label">Previsão</label><div style="color:var(--text2)">${formatDate(o.previsao_retorno)||'—'}</div></div>
        </div>
        ${o.observacoes ? `<div><label class="form-label">Observações</label><div style="color:var(--text2);font-size:13px;white-space:pre-wrap">${o.observacoes}</div></div>` : ''}
      </div>`,
      [
        { label: 'Fechar', class: 'btn-ghost', onclick: 'Modal.close()' },
        { label: '✎ Editar', class: 'btn-primary perm-grad', onclick: `Modal.close();Ocorrencias.editar('${id}')` }
      ]
    );
  },

  // ── EDITAR ────────────────────────────
  async editar(id) {
    const o = Ocorrencias._data.find(x => x.id === id);
    if (!o) return;

    let sitesOpts  = '';
    let motivoOpts = '';
    try {
      const sites  = await dbQuery(d => d.from('sites').select('id,nome').eq('ativo',true).order('nome'));
      const motivos = await dbQuery(d => d.from('motivos_falha').select('id,descricao').order('descricao'));
      sitesOpts  = (sites||[]).map(s=>`<option value="${s.id}" ${s.id===o.site_id?'selected':''}>${s.nome}</option>`).join('');
      motivoOpts = '<option value="">—</option>' + (motivos||[]).map(m=>`<option value="${m.id}" ${m.id===o.motivo_id?'selected':''}>${m.descricao}</option>`).join('');
    } catch {}

    const situacoes = ['Inoperante','Parcial/Em analise','Modo Local'];
    const sitOpts   = situacoes.map(s=>`<option ${s===o.situacao?'selected':''}>${s}</option>`).join('');
    const prevVal   = o.previsao_retorno ? new Date(o.previsao_retorno).toISOString().slice(0,16) : '';

    Modal.open('Editar Ocorrência', `
      <div class="form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Site</label>
          <select class="form-select" id="eoc-site">${sitesOpts}</select>
        </div>
        <div>
          <label class="form-label">Situação</label>
          <select class="form-select" id="eoc-sit">${sitOpts}</select>
        </div>
        <div>
          <label class="form-label">Motivo</label>
          <select class="form-select" id="eoc-mot">${motivoOpts}</select>
        </div>
        <div>
          <label class="form-label">Início</label>
          <input type="datetime-local" class="form-input" id="eoc-inicio" value="${o.inicio?new Date(o.inicio).toISOString().slice(0,16):''}">
        </div>
        <div>
          <label class="form-label">Previsão de retorno</label>
          <input type="datetime-local" class="form-input" id="eoc-prev" value="${prevVal}">
        </div>
        <div>
          <label class="form-label">Nº da OS</label>
          <input type="text" class="form-input" id="eoc-os" value="${o.os_numero||''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="eoc-obs" rows="3">${o.observacoes||''}</textarea>
        </div>
      </div>`,
      [
        { label: 'Cancelar',  class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: 'Salvar',    class: 'btn-primary',  onclick: `Ocorrencias.salvarEdicao('${id}')` }
      ]
    );
  },

  async salvarEdicao(id) {
    const antes = Ocorrencias._data.find(x => x.id === id);
    const payload = {
      site_id:           document.getElementById('eoc-site')?.value,
      situacao:          document.getElementById('eoc-sit')?.value,
      motivo_id:         document.getElementById('eoc-mot')?.value || null,
      inicio:            document.getElementById('eoc-inicio')?.value || null,
      previsao_retorno:  document.getElementById('eoc-prev')?.value || null,
      os_numero:         document.getElementById('eoc-os')?.value?.trim() || null,
      observacoes:       document.getElementById('eoc-obs')?.value?.trim() || null,
    };
    try {
      const { error } = await db.from('ocorrencias').update(payload).eq('id', id);
      if (error) throw error;
      await Audit.editou('ocorrencias', id, antes, payload);
      Modal.close();
      Toast.show('Ocorrência atualizada', 'success');
      await Ocorrencias.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar', 'error');
    }
  },

  // ── FECHAR OCORRÊNCIA ────────────────
  async fechar(id) {
    const o = Ocorrencias._data.find(x => x.id === id);
    Modal.open('Fechar Ocorrência', `
      <p style="color:var(--text2)">Site: <strong>${o?.site?.nome||id}</strong></p>
      <div style="margin-top:12px">
        <label class="form-label">Observação de encerramento</label>
        <textarea class="form-textarea" id="foc-obs" rows="3" placeholder="Descreva como foi resolvido..."></textarea>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: '✔ Confirmar fechamento', class: 'btn-primary', onclick: `Ocorrencias.confirmarFechamento('${id}')` }
      ]
    );
  },

  async confirmarFechamento(id) {
    const obs = document.getElementById('foc-obs')?.value?.trim() || null;
    try {
      const { error } = await db.from('ocorrencias').update({
        situacao: 'Operacional',
        fim: new Date().toISOString(),
        observacoes_fechamento: obs
      }).eq('id', id);
      if (error) throw error;
      await Audit.editou('ocorrencias', id, null, { situacao: 'Operacional', fim: new Date().toISOString() });
      Modal.close();
      Toast.show('Ocorrência encerrada com sucesso', 'success');
      await Ocorrencias.load();
    } catch (err) {
      Toast.show(err.message || 'Erro ao fechar', 'error');
    }
  }
};
