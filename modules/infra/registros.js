// ═══════════════════════════════════════
// GRAD Ecossistema — OCORRÊNCIAS
// Versão completa com todos os campos
// ═══════════════════════════════════════
//
// SQL necessário no Supabase (executar uma vez):
// ALTER TABLE ocorrencias
//   ADD COLUMN IF NOT EXISTS prazo DATE,
//   ADD COLUMN IF NOT EXISTS glpi VARCHAR,
//   ADD COLUMN IF NOT EXISTS consideracoes TEXT,
//   ADD COLUMN IF NOT EXISTS acao TEXT,
//   ADD COLUMN IF NOT EXISTS conclusao TIMESTAMPTZ,
//   ADD COLUMN IF NOT EXISTS operador VARCHAR;

const Ocorrencias = {
  _data: [],
  _filtros: { situacao: '', risp: '', motivo: '', busca: '', proprietario: '' },
  _pagina: 1,
  _porPagina: 20,

  // Lê proprietário do JSON armazenado em observacoes do site
  _getSiteProp(o) {
    try {
      const obs = o.site?.observacoes;
      if (obs && obs.trimStart().startsWith('{')) {
        return JSON.parse(obs).proprietario || null;
      }
    } catch {}
    return null;
  },

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
            <button class="btn btn-primary btn-sm perm-edit" onclick="Ocorrencias.abrirNova()">+ Nova ocorrência</button>
          </div>
        </div>

        <!-- Filtros principais -->
        <div class="filter-bar">
          <input class="form-input" id="oc-busca" placeholder="Buscar site..." oninput="Ocorrencias._applyFilter()" style="width:200px">
          <select class="form-select" id="oc-sit" onchange="Ocorrencias._applyFilter()" style="width:170px">
            <option value="">Todas situações</option>
            <option>Inoperante</option>
            <option>Instável</option>
            <option>Parcial/Em analise</option>
            <option>Modo Local</option>
          </select>
          <select class="form-select" id="oc-risp" onchange="Ocorrencias._applyFilter()" style="width:150px">
            <option value="">Todas RISPs</option>
          </select>
          <select class="form-select" id="oc-mot" onchange="Ocorrencias._applyFilter()" style="width:200px">
            <option value="">Todos motivos</option>
          </select>
          <select class="form-select" id="oc-prop" onchange="Ocorrencias._applyFilter()" style="width:150px">
            <option value="">Proprietário</option>
          </select>
        </div>

        <!-- Chips rápidos de motivos -->
        <div id="oc-motivo-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"></div>

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
      const data = await dbQuery(d =>
        d.from('ocorrencias')
          .select('*, site:sites(id,nome,cidade,observacoes,risp:risps(id,nome)), motivo:motivos_falha(id,descricao)')
          .neq('situacao', 'Operacional')
          .order('inicio', { ascending: false })
      );
      Ocorrencias._data = data || [];
      await Ocorrencias._popularFiltros();
      Ocorrencias._renderChips();
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
      const mots = await dbQuery(d => d.from('motivos_falha').select('id,descricao').eq('nicho','infra').order('descricao'));
      const sel = document.getElementById('oc-mot');
      if (sel && mots) {
        mots.forEach(m => {
          const o = document.createElement('option');
          o.value = m.descricao; o.textContent = m.descricao;
          sel.appendChild(o);
        });
      }
    } catch {}

    // Proprietários (dos sites nas ocorrências ativas — lê do JSON de observacoes)
    try {
      const props = [...new Set(Ocorrencias._data
        .map(o => Ocorrencias._getSiteProp(o))
        .filter(Boolean)
      )].sort();
      const sel = document.getElementById('oc-prop');
      if (sel && props.length) {
        props.forEach(p => {
          const o = document.createElement('option');
          o.value = p; o.textContent = p;
          sel.appendChild(o);
        });
      }
    } catch {}
  },

  _renderChips() {
    // Chips rápidos com contagem por motivo
    const motivoMap = {};
    Ocorrencias._data.forEach(o => {
      const m = o.motivo?.descricao || 'Sem motivo';
      motivoMap[m] = (motivoMap[m] || 0) + 1;
    });

    const chipsEl = document.getElementById('oc-motivo-chips');
    if (!chipsEl) return;

    const topMotivos = Object.entries(motivoMap)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 8);

    if (!topMotivos.length) { chipsEl.innerHTML = ''; return; }

    chipsEl.innerHTML = `
      <span style="font-size:11px;color:var(--text3);font-family:var(--mono);align-self:center">FILTRAR:</span>
      <span class="badge badge-gray" style="cursor:pointer" onclick="Ocorrencias._filtrarMotivo('')">Todos</span>
      ${topMotivos.map(([m, c]) => `
        <span class="badge badge-blue" style="cursor:pointer" onclick="Ocorrencias._filtrarMotivo('${m.replace(/'/g,"\\'")}')">
          ${m} <span style="opacity:.7">(${c})</span>
        </span>`).join('')}`;
  },

  _filtrarMotivo(motivo) {
    const sel = document.getElementById('oc-mot');
    if (sel) sel.value = motivo;
    Ocorrencias._applyFilter();
  },

  _applyFilter() {
    const busca  = (document.getElementById('oc-busca')?.value || '').toLowerCase();
    const sit    = document.getElementById('oc-sit')?.value || '';
    const risp   = document.getElementById('oc-risp')?.value || '';
    const motivo = document.getElementById('oc-mot')?.value || '';
    const prop   = document.getElementById('oc-prop')?.value || '';

    Ocorrencias._filtros = { busca, situacao: sit, risp, motivo, proprietario: prop };
    Ocorrencias._pagina  = 1;
    Ocorrencias._render();
  },

  _filtrar() {
    const { busca, situacao, risp, motivo, proprietario } = Ocorrencias._filtros;
    return Ocorrencias._data.filter(o => {
      if (situacao    && o.situacao !== situacao) return false;
      if (risp        && o.site?.risp?.nome !== risp) return false;
      if (motivo      && o.motivo?.descricao !== motivo) return false;
      if (proprietario && Ocorrencias._getSiteProp(o) !== proprietario) return false;
      if (busca       && !o.site?.nome?.toLowerCase().includes(busca) &&
                         !o.site?.cidade?.toLowerCase().includes(busca)) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Ocorrencias._filtrar();
    const total     = filtrados.length;
    const inicio    = (Ocorrencias._pagina - 1) * Ocorrencias._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Ocorrencias._porPagina);

    // Resumo
    const inop  = filtrados.filter(o => o.situacao === 'Inoperante').length;
    const inst  = filtrados.filter(o => o.situacao === 'Instável').length;
    const parc  = filtrados.filter(o => o.situacao === 'Parcial/Em analise').length;
    const ml    = filtrados.filter(o => o.situacao === 'Modo Local').length;
    const crit  = filtrados.filter(o => o.situacao === 'Inoperante' && diffDays(o.inicio) > 7).length;

    const sumEl = document.getElementById('oc-summary');
    if (sumEl) sumEl.innerHTML = `
      <span class="badge badge-red">${inop} Inoperantes</span>
      ${inst ? `<span class="badge badge-teal">${inst} Instáveis</span>` : ''}
      <span class="badge badge-amber">${parc} Parcial/Análise</span>
      <span class="badge badge-purple">${ml} Modo Local</span>
      <span class="badge badge-gray">${crit} Críticos +7d</span>
      <span class="badge badge-blue" style="margin-left:auto">${total} no filtro</span>`;

    // Tabela
    const rows = pagina.map(o => {
      const dias  = diffDays(o.inicio);
      const badge = Ocorrencias._situacaoBadge(o.situacao);
      const prazoFlag = o.prazo
        ? (new Date(o.prazo) < new Date()
          ? `<span class="days-chip crit" title="Prazo vencido">${formatDate(o.prazo)}</span>`
          : `<span style="font-size:11px;color:var(--text3)">${formatDate(o.prazo)}</span>`)
        : '<span style="color:var(--text3);font-size:11px">—</span>';

      return `
        <tr onclick="Ocorrencias.verDetalhes('${o.id}')" style="cursor:pointer">
          <td><span class="risp-badge">${o.site?.risp?.nome || '—'}</span></td>
          <td>
            <strong style="color:var(--text)">${o.site?.nome || o.site_id}</strong>
            ${o.site?.cidade ? `<div style="font-size:10px;color:var(--text3)">${o.site.cidade}</div>` : ''}
          </td>
          <td>${badge}</td>
          <td style="color:var(--text2);font-size:12px">${o.motivo?.descricao || '—'}</td>
          <td>${daysBadge(dias)}</td>
          <td style="color:var(--text3);font-size:12px">${formatDate(o.inicio)}</td>
          <td>${prazoFlag}</td>
          <td style="color:var(--text3);font-size:12px">${o.glpi || '—'}</td>
          <td>
            <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-sm perm-edit" title="Editar" onclick="Ocorrencias.editar('${o.id}')">✎</button>
              <button class="btn btn-success btn-sm perm-edit" title="Dar baixa" onclick="Ocorrencias.darBaixa('${o.id}')">✔ Baixa</button>
              <button class="btn btn-ghost btn-sm perm-admin" title="Apagar" onclick="Ocorrencias.apagar('${o.id}')" style="color:#f87171;border-color:rgba(248,113,113,.3)">🗑</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    document.getElementById('oc-table-wrap').innerHTML = total ? `
      <table>
        <thead>
          <tr>
            <th>RISP</th><th>Site / Município</th><th>Situação</th><th>Motivo</th>
            <th>Dias</th><th>Início</th><th>Prazo</th><th>GLPI</th><th>Ações</th>
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
      'Instável':            'badge-teal',
      'Parcial/Em analise':  'badge-amber',
      'Modo Local':          'badge-purple',
      'Operacional':         'badge-green',
    };
    return `<span class="badge ${map[sit]||'badge-gray'}">${sit}</span>`;
  },

  // ── NOVA OCORRÊNCIA ──────────────────
  async abrirNova() {
    let motivoOpts = '<option value="">Selecione o motivo...</option>';
    try {
      const sites   = await dbQuery(d => d.from('sites').select('id,nome,sbs').eq('ativo',true).order('nome'));
      const motivos = await dbQuery(d => d.from('motivos_falha').select('id,descricao').eq('nicho','infra').order('descricao'));
      Ocorrencias._sitesCache = sites || [];
      motivoOpts = '<option value="">Selecione o motivo...</option>' + (motivos||[]).map(m=>`<option value="${m.id}">${m.descricao}</option>`).join('');
    } catch {}

    Modal.open('Nova Ocorrência', `
      <div class="form-grid form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Site *</label>
          <div style="position:relative">
            <input class="form-input" id="noc-site-busca" placeholder="Digite nome ou SBS do site..."
              autocomplete="off" oninput="Ocorrencias._filtrarSiteAC(this.value,'noc')"
              onblur="setTimeout(()=>{const l=document.getElementById('noc-site-lista');if(l)l.style.display='none'},200)">
            <input type="hidden" id="noc-site">
            <div id="noc-site-lista" style="position:absolute;top:100%;left:0;right:0;z-index:9999;
              background:var(--surface2);border:1px solid var(--border2);border-radius:8px;margin-top:2px;
              max-height:220px;overflow-y:auto;display:none;box-shadow:0 8px 24px rgba(0,0,0,.5)"></div>
          </div>
        </div>
        <div>
          <label class="form-label">Situação *</label>
          <select class="form-select" id="noc-sit">
            <option>Inoperante</option>
            <option>Instável</option>
            <option>Parcial/Em analise</option>
            <option>Modo Local</option>
          </select>
        </div>
        <div>
          <label class="form-label">Motivo</label>
          <select class="form-select" id="noc-mot">${motivoOpts}</select>
        </div>
        <div>
          <label class="form-label">Data de início *</label>
          <input type="datetime-local" class="form-input" id="noc-inicio" value="${new Date().toISOString().slice(0,16)}">
        </div>
        <div>
          <label class="form-label">Prazo de resolução</label>
          <input type="date" class="form-input" id="noc-prazo">
        </div>
        <div>
          <label class="form-label">GLPI / Protocolo</label>
          <input type="text" class="form-input" id="noc-glpi" placeholder="Ex: #12345">
        </div>
        <div>
          <label class="form-label">Operador</label>
          <input type="text" class="form-input" id="noc-operador"
            placeholder="Nome do técnico"
            value="${Auth.perfil?.nome || Auth.user?.email || ''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="noc-obs" rows="2" placeholder="Detalhes da ocorrência..."></textarea>
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Ação tomada</label>
          <textarea class="form-textarea" id="noc-acao" rows="2" placeholder="Ações em andamento..."></textarea>
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
    const prazo     = document.getElementById('noc-prazo')?.value || null;
    const glpi      = document.getElementById('noc-glpi')?.value?.trim() || null;
    const operador  = document.getElementById('noc-operador')?.value?.trim() || null;
    const obs       = document.getElementById('noc-obs')?.value?.trim() || null;
    const acao      = document.getElementById('noc-acao')?.value?.trim() || null;

    if (!site_id || !situacao || !inicio) {
      Toast.show('Preencha os campos obrigatórios', 'error'); return;
    }

    try {
      const { data, error } = await db.from('ocorrencias').insert({
        site_id, situacao, motivo_id, inicio, prazo, glpi, operador,
        observacoes: obs, acao
      }).select().single();
      if (error) throw error;
      await Audit.criou('ocorrencias', data.id, data);
      Modal.close();
      Toast.show('Ocorrência registrada com sucesso', 'success');
      await Ocorrencias.load();
      App._updateAlertBadge && App._updateAlertBadge();
    } catch (err) {
      Toast.show(err.message || 'Erro ao registrar', 'error');
    }
  },

  // ── AUTOCOMPLETE DE SITE ─────────────
  _filtrarSiteAC(busca, prefix) {
    const lista  = document.getElementById(`${prefix}-site-lista`);
    const hidden = document.getElementById(`${prefix}-site`);
    if (!lista) return;
    if (!busca?.trim()) {
      lista.style.display = 'none';
      if (hidden) hidden.value = '';
      return;
    }
    const q = busca.toLowerCase();
    const matches = (Ocorrencias._sitesCache || [])
      .filter(s => s.nome?.toLowerCase().includes(q) || (s.sbs||'').toLowerCase().includes(q))
      .slice(0, 12);
    if (!matches.length) { lista.style.display = 'none'; return; }
    lista.innerHTML = matches.map(s => `
      <div onclick="Ocorrencias._selecionarSiteAC('${s.id}','${(s.nome||'').replace(/'/g,"\\'")}','${s.sbs||''}','${prefix}')"
        style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px"
        onmouseover="this.style.background='var(--surface3)'" onmouseout="this.style.background=''">
        ${s.sbs ? `<span style="font-family:var(--mono);font-size:11px;color:#67e8f9;background:rgba(103,232,249,.08);padding:1px 6px;border-radius:4px;border:1px solid rgba(103,232,249,.2);white-space:nowrap">${s.sbs}</span>` : ''}
        <span>${s.nome||'—'}</span>
      </div>`).join('');
    lista.style.display = 'block';
  },

  _selecionarSiteAC(id, nome, sbs, prefix) {
    const hidden = document.getElementById(`${prefix}-site`);
    const input  = document.getElementById(`${prefix}-site-busca`);
    const lista  = document.getElementById(`${prefix}-site-lista`);
    if (hidden) hidden.value = id;
    if (input)  input.value  = sbs ? `${sbs} — ${nome}` : nome;
    if (lista)  lista.style.display = 'none';
  },

  // ── VER DETALHES ─────────────────────
  async verDetalhes(id) {
    const o = Ocorrencias._data.find(x => x.id === id);
    if (!o) return;

    const dias  = diffDays(o.inicio);
    const badge = Ocorrencias._situacaoBadge(o.situacao);

    Modal.open(`Ocorrência — ${o.site?.nome || id}`, `
      <div style="display:grid;gap:14px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${badge}
          ${o.motivo?.descricao ? `<span class="badge badge-gray">${o.motivo.descricao}</span>` : ''}
          ${daysBadge(dias)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label class="form-label">RISP</label><div>${o.site?.risp?.nome||'—'}</div></div>
          <div><label class="form-label">Município</label><div>${o.site?.cidade||'—'}</div></div>
          <div><label class="form-label">Início</label><div style="color:var(--text2)">${formatDateTime(o.inicio)}</div></div>
          <div><label class="form-label">Prazo</label><div style="color:${o.prazo&&new Date(o.prazo)<new Date()?'#f87171':'var(--text2)'}">
            ${o.prazo ? formatDate(o.prazo) : '—'}
          </div></div>
          <div><label class="form-label">GLPI / Protocolo</label><div style="color:var(--accent2)">${o.glpi||'—'}</div></div>
          <div><label class="form-label">Operador</label><div style="color:var(--text2)">${o.operador||'—'}</div></div>
          <div><label class="form-label">Proprietário</label><div style="color:var(--text2)">${Ocorrencias._getSiteProp(o)||'—'}</div></div>
          <div><label class="form-label">OS</label><div style="color:var(--text2)">${o.os_numero||'—'}</div></div>
        </div>
        ${o.observacoes ? `<div><label class="form-label">Observações</label><div style="color:var(--text2);font-size:13px;white-space:pre-wrap;background:rgba(255,255,255,.03);padding:8px;border-radius:6px">${o.observacoes}</div></div>` : ''}
        ${o.acao ? `<div><label class="form-label">Ação tomada</label><div style="color:var(--text2);font-size:13px;white-space:pre-wrap;background:rgba(255,255,255,.03);padding:8px;border-radius:6px">${o.acao}</div></div>` : ''}
        ${o.consideracoes ? `<div><label class="form-label">Considerações</label><div style="color:var(--text2);font-size:13px;white-space:pre-wrap;background:rgba(255,255,255,.03);padding:8px;border-radius:6px">${o.consideracoes}</div></div>` : ''}
      </div>`,
      [
        { label: 'Fechar',      class: 'btn-ghost',                      onclick: 'Modal.close()' },
        { label: '✎ Editar',   class: 'btn-primary perm-edit',           onclick: `Modal.close();Ocorrencias.editar('${id}')` },
        { label: '✔ Dar Baixa',class: 'btn-success perm-edit',           onclick: `Modal.close();Ocorrencias.darBaixa('${id}')` },
        { label: '🗑 Apagar',  class: 'btn-ghost perm-admin',            onclick: `Modal.close();Ocorrencias.apagar('${id}')`, style:'color:#f87171' }
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
      const motivos = await dbQuery(d => d.from('motivos_falha').select('id,descricao').eq('nicho','infra').order('descricao'));
      sitesOpts  = (sites||[]).map(s=>`<option value="${s.id}" ${s.id===o.site_id?'selected':''}>${s.nome}</option>`).join('');
      motivoOpts = '<option value="">—</option>' + (motivos||[]).map(m=>`<option value="${m.id}" ${m.id===o.motivo_id?'selected':''}>${m.descricao}</option>`).join('');
    } catch {}

    const situacoes = ['Inoperante','Instável','Parcial/Em analise','Modo Local'];
    const sitOpts   = situacoes.map(s=>`<option ${s===o.situacao?'selected':''}>${s}</option>`).join('');
    const prazoVal  = o.prazo ? new Date(o.prazo).toISOString().slice(0,10) : '';

    Modal.open('Editar Ocorrência', `
      <div class="form-grid form-grid-2">
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
          <label class="form-label">Prazo de resolução</label>
          <input type="date" class="form-input" id="eoc-prazo" value="${prazoVal}">
        </div>
        <div>
          <label class="form-label">GLPI / Protocolo</label>
          <input type="text" class="form-input" id="eoc-glpi" value="${o.glpi||''}">
        </div>
        <div>
          <label class="form-label">Operador</label>
          <input type="text" class="form-input" id="eoc-operador" value="${o.operador||''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="eoc-obs" rows="2">${o.observacoes||''}</textarea>
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Ação tomada</label>
          <textarea class="form-textarea" id="eoc-acao" rows="2">${o.acao||''}</textarea>
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Considerações</label>
          <textarea class="form-textarea" id="eoc-cons" rows="2">${o.consideracoes||''}</textarea>
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
      site_id:      document.getElementById('eoc-site')?.value,
      situacao:     document.getElementById('eoc-sit')?.value,
      motivo_id:    document.getElementById('eoc-mot')?.value || null,
      inicio:       document.getElementById('eoc-inicio')?.value || null,
      prazo:        document.getElementById('eoc-prazo')?.value || null,
      glpi:         document.getElementById('eoc-glpi')?.value?.trim() || null,
      operador:     document.getElementById('eoc-operador')?.value?.trim() || null,
      observacoes:  document.getElementById('eoc-obs')?.value?.trim() || null,
      acao:         document.getElementById('eoc-acao')?.value?.trim() || null,
      consideracoes:document.getElementById('eoc-cons')?.value?.trim() || null,
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

  // ── DAR BAIXA ────────────────────────
  async darBaixa(id) {
    const o = Ocorrencias._data.find(x => x.id === id);
    if (!o) return;

    const hoje = new Date().toISOString().slice(0,10);

    Modal.open('Dar Baixa — Encerrar Ocorrência', `
      <div style="display:grid;gap:12px">
        <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:12px">
          <div style="font-size:13px;color:var(--text2)">Site: <strong style="color:var(--text)">${o?.site?.nome||id}</strong></div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px">
            RISP: ${o?.site?.risp?.nome||'—'} · Motivo: ${o?.motivo?.descricao||'—'} · ${diffDays(o.inicio)} dias
          </div>
        </div>
        <div>
          <label class="form-label">Data de conclusão *</label>
          <input type="date" class="form-input" id="bx-conclusao" value="${hoje}">
        </div>
        <div>
          <label class="form-label">Considerações finais *</label>
          <textarea class="form-textarea" id="bx-cons" rows="3" placeholder="Descreva como o problema foi resolvido..."></textarea>
        </div>
        <div>
          <label class="form-label">Ação final realizada</label>
          <textarea class="form-textarea" id="bx-acao" rows="2" placeholder="Substituição, reset, configuração..."></textarea>
        </div>
        <div>
          <label class="form-label">Operador que deu baixa</label>
          <input type="text" class="form-input" id="bx-op" placeholder="Nome do técnico"
            value="${o.operador || Auth.perfil?.nome || Auth.user?.email || ''}">
        </div>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost', onclick: 'Modal.close()' },
        { label: '✔ Confirmar Baixa', class: 'btn-success', onclick: `Ocorrencias.confirmarBaixa('${id}')` }
      ]
    );
  },

  async confirmarBaixa(id) {
    const conclusaoVal = document.getElementById('bx-conclusao')?.value;
    const consVal      = document.getElementById('bx-cons')?.value?.trim();
    const acaoVal      = document.getElementById('bx-acao')?.value?.trim() || null;
    const opVal        = document.getElementById('bx-op')?.value?.trim() || null;

    if (!conclusaoVal) { Toast.show('Informe a data de conclusão', 'error'); return; }
    if (!consVal)       { Toast.show('Informe as considerações finais (obrigatório)', 'error'); return; }

    try {
      const conclusao = new Date(conclusaoVal).toISOString();
      const { error } = await db.from('ocorrencias').update({
        situacao:       'Operacional',
        fim:            new Date().toISOString(),
        conclusao,
        consideracoes:  consVal,
        acao:           acaoVal,
        operador:       opVal,
      }).eq('id', id);
      if (error) throw error;
      await Audit.editou('ocorrencias', id, null, {
        situacao: 'Operacional', conclusao, consideracoes: consVal
      });
      Modal.close();
      Toast.show('Ocorrência encerrada com sucesso', 'success');
      await Ocorrencias.load();
      App._updateAlertBadge && App._updateAlertBadge();
    } catch (err) {
      Toast.show(err.message || 'Erro ao dar baixa', 'error');
    }
  },

  // ── APAGAR ───────────────────────────────────────────────────────────────
  apagar(id) {
    const o = Ocorrencias._data.find(x => x.id === id);
    Modal.open('Apagar Ocorrência', `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:8px;padding:12px;display:flex;gap:10px;align-items:flex-start">
          <span style="font-size:20px">⚠️</span>
          <div>
            <div style="color:#f87171;font-weight:700;font-size:13px;margin-bottom:3px">Ação irreversível</div>
            <div style="color:var(--text2);font-size:12px">Esta ocorrência será permanentemente removida do sistema.</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--text2)">
          <strong style="color:var(--text)">${o?.site?.nome || id}</strong><br>
          <span style="font-size:11px;color:var(--text3)">${o?.site?.risp?.nome||'—'} · ${o?.motivo?.descricao||'Sem motivo'} · ${diffDays(o?.inicio)} dias</span>
        </div>
        <div style="font-size:13px;color:var(--text3)">Tem certeza que deseja apagar?</div>
      </div>`,
      [
        { label: 'Cancelar',       class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: '🗑 Sim, apagar', class: 'btn-danger',  onclick: `Ocorrencias.confirmarApagar('${id}')` }
      ]
    );
  },

  async confirmarApagar(id) {
    try {
      const { error } = await db.from('ocorrencias').delete().eq('id', id);
      if (error) throw error;
      Modal.close();
      Toast.show('Ocorrência apagada', 'success');
      await Ocorrencias.load();
      App._updateAlertBadge && App._updateAlertBadge();
    } catch (err) {
      Toast.show(err.message || 'Erro ao apagar', 'error');
    }
  }
};
