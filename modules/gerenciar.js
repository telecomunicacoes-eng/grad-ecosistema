// ═══════════════════════════════════════
// GRAD Ecossistema — GERENCIAR
// Administração: sites, RISPs, motivos, usuários, auditoria
// ═══════════════════════════════════════

const Gerenciar = {
  _aba: 'sites',

  async render(container) {
    if (!Auth.isGrad()) {
      container.innerHTML = `
        <div class="page fade-in">
          <div class="empty-state" style="height:300px">
            <div class="empty-state-icon">🔒</div>
            <div class="empty-state-title">Acesso restrito</div>
            <div class="empty-state-sub">Esta área é exclusiva para usuários GRAD</div>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Gerenciar</div>
            <div class="page-sub">Administração do sistema</div>
          </div>
        </div>

        <!-- Abas -->
        <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:16px">
          ${[
            { id:'sites',    label:'📡 Sites' },
            { id:'risps',    label:'🗺️ RISPs' },
            { id:'motivos',  label:'⚠️ Motivos' },
            { id:'usuarios', label:'👤 Usuários' },
            { id:'auditoria',label:'📋 Auditoria' },
          ].map(a => `
            <button class="btn btn-ghost btn-sm" id="aba-${a.id}"
              onclick="Gerenciar.irAba('${a.id}')"
              style="border-radius:6px 6px 0 0;border-bottom:none">
              ${a.label}
            </button>`).join('')}
        </div>

        <div id="gerenciar-conteudo"></div>
      </div>`;

    await Gerenciar.irAba('sites');
  },

  async irAba(aba) {
    Gerenciar._aba = aba;
    // Estilo das abas
    document.querySelectorAll('[id^="aba-"]').forEach(el => {
      el.style.borderBottom = '';
      el.style.color = '';
    });
    const el = document.getElementById(`aba-${aba}`);
    if (el) { el.style.borderBottom = '2px solid var(--accent)'; el.style.color = 'var(--accent)'; }

    const metodos = {
      sites:     Gerenciar._renderSites,
      risps:     Gerenciar._renderRisps,
      motivos:   Gerenciar._renderMotivos,
      usuarios:  Gerenciar._renderUsuarios,
      auditoria: Gerenciar._renderAuditoria,
    };
    if (metodos[aba]) await metodos[aba]();
  },

  // ══════════════════════════════════════
  // SITES
  // ══════════════════════════════════════
  async _renderSites() {
    const el = document.getElementById('gerenciar-conteudo');
    el.innerHTML = '<div style="display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>';
    try {
      const sites = await dbQuery(d =>
        d.from('sites').select('*, risp:risps(nome)').order('nome')
      );
      const risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome'));
      Gerenciar._sites = sites || [];
      Gerenciar._risps = risps || [];

      const rispOpts = (risps||[]).map(r=>`<option value="${r.id}">${r.nome}</option>`).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <input class="form-input" id="ger-site-busca" placeholder="Buscar site..." oninput="Gerenciar._filtrarSites()" style="width:250px">
          <button class="btn btn-primary btn-sm" onclick="Gerenciar.novoSite()">+ Novo Site</button>
        </div>
        <div class="card" style="padding:0">
          <div class="table-wrap" style="border:none">
            <table id="ger-sites-tbl">
              <thead><tr><th>Nome</th><th>RISP</th><th>Latitude</th><th>Longitude</th><th>Ativo</th><th>Ações</th></tr></thead>
              <tbody id="ger-sites-body"></tbody>
            </table>
          </div>
        </div>`;

      Gerenciar._filtrarSites();
    } catch {}
  },

  _filtrarSites() {
    const busca  = (document.getElementById('ger-site-busca')?.value || '').toLowerCase();
    const sites  = (Gerenciar._sites || []).filter(s =>
      !busca || s.nome?.toLowerCase().includes(busca) || s.risp?.nome?.toLowerCase().includes(busca)
    );
    const tbody = document.getElementById('ger-sites-body');
    if (!tbody) return;
    tbody.innerHTML = sites.map(s => `
      <tr>
        <td><strong style="color:var(--text)">${s.nome}</strong></td>
        <td><span class="risp-badge">${s.risp?.nome||'—'}</span></td>
        <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">${s.latitude||'—'}</td>
        <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">${s.longitude||'—'}</td>
        <td><span class="badge ${s.ativo?'badge-green':'badge-gray'}">${s.ativo?'Ativo':'Inativo'}</span></td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm" onclick="Gerenciar.editarSite('${s.id}')">✎</button>
            <button class="btn btn-danger btn-sm" onclick="Gerenciar.toggleSite('${s.id}',${!s.ativo})">${s.ativo?'Desativar':'Ativar'}</button>
          </div>
        </td>
      </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">Nenhum site</td></tr>';
  },

  novoSite() {
    const rispOpts = (Gerenciar._risps||[]).map(r=>`<option value="${r.id}">${r.nome}</option>`).join('');
    Modal.open('Novo Site', `
      <div class="form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Nome do site *</label>
          <input class="form-input" id="sf-nome" placeholder="Nome do site">
        </div>
        <div>
          <label class="form-label">RISP</label>
          <select class="form-select" id="sf-risp"><option value="">—</option>${rispOpts}</select>
        </div>
        <div>
          <label class="form-label">Ativo</label>
          <select class="form-select" id="sf-ativo">
            <option value="true" selected>Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
        <div>
          <label class="form-label">Latitude</label>
          <input class="form-input" id="sf-lat" placeholder="-15.6014" type="number" step="0.000001">
        </div>
        <div>
          <label class="form-label">Longitude</label>
          <input class="form-input" id="sf-lng" placeholder="-56.0979" type="number" step="0.000001">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="sf-obs" rows="2"></textarea>
        </div>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Cadastrar', class: 'btn-primary', onclick: 'Gerenciar.salvarSite()' }
      ]
    );
  },

  async salvarSite(id = null) {
    const nome = document.getElementById('sf-nome')?.value?.trim();
    if (!nome) { Toast.show('Informe o nome do site', 'error'); return; }
    const payload = {
      nome,
      risp_id:     document.getElementById('sf-risp')?.value || null,
      ativo:       document.getElementById('sf-ativo')?.value !== 'false',
      latitude:    parseFloat(document.getElementById('sf-lat')?.value) || null,
      longitude:   parseFloat(document.getElementById('sf-lng')?.value) || null,
      observacoes: document.getElementById('sf-obs')?.value?.trim() || null,
    };
    try {
      if (id) {
        const { error } = await db.from('sites').update(payload).eq('id', id);
        if (error) throw error;
        await Audit.editou('sites', id, null, payload);
      } else {
        const { data, error } = await db.from('sites').insert(payload).select().single();
        if (error) throw error;
        await Audit.criou('sites', data.id, data);
      }
      Modal.close();
      Toast.show('Site salvo', 'success');
      await Gerenciar._renderSites();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar', 'error');
    }
  },

  editarSite(id) {
    const s       = Gerenciar._sites.find(x => x.id === id);
    if (!s) return;
    const rispOpts = (Gerenciar._risps||[]).map(r=>`<option value="${r.id}" ${r.id===s.risp_id?'selected':''}>${r.nome}</option>`).join('');
    Modal.open('Editar Site', `
      <div class="form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Nome *</label>
          <input class="form-input" id="sf-nome" value="${s.nome||''}">
        </div>
        <div>
          <label class="form-label">RISP</label>
          <select class="form-select" id="sf-risp"><option value="">—</option>${rispOpts}</select>
        </div>
        <div>
          <label class="form-label">Ativo</label>
          <select class="form-select" id="sf-ativo">
            <option value="true" ${s.ativo?'selected':''}>Sim</option>
            <option value="false" ${!s.ativo?'selected':''}>Não</option>
          </select>
        </div>
        <div>
          <label class="form-label">Latitude</label>
          <input class="form-input" id="sf-lat" value="${s.latitude||''}" type="number" step="0.000001">
        </div>
        <div>
          <label class="form-label">Longitude</label>
          <input class="form-input" id="sf-lng" value="${s.longitude||''}" type="number" step="0.000001">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="sf-obs" rows="2">${s.observacoes||''}</textarea>
        </div>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Salvar',   class: 'btn-primary', onclick: `Gerenciar.salvarSite('${id}')` }
      ]
    );
  },

  async toggleSite(id, ativo) {
    try {
      const { error } = await db.from('sites').update({ ativo }).eq('id', id);
      if (error) throw error;
      await Audit.editou('sites', id, null, { ativo });
      Toast.show(`Site ${ativo?'ativado':'desativado'}`, 'success');
      await Gerenciar._renderSites();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  // ══════════════════════════════════════
  // RISPs
  // ══════════════════════════════════════
  async _renderRisps() {
    const el = document.getElementById('gerenciar-conteudo');
    try {
      const risps = await dbQuery(d => d.from('risps').select('*').order('nome'));
      el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
          <button class="btn btn-primary btn-sm" onclick="Gerenciar.novaRisp()">+ Nova RISP</button>
        </div>
        <div class="card" style="padding:0">
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>Nome</th><th>Descrição</th><th>Ações</th></tr></thead>
              <tbody>${(risps||[]).map(r => `
                <tr>
                  <td><span class="risp-badge">${r.nome}</span></td>
                  <td style="color:var(--text3);font-size:12px">${r.descricao||'—'}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="Gerenciar.editarRisp('${r.id}','${r.nome}','${r.descricao||''}')">✎ Editar</button>
                  </td>
                </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--text3)">Nenhuma RISP</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch {}
  },

  novaRisp() {
    Modal.open('Nova RISP', `
      <div class="form-grid-2">
        <div>
          <label class="form-label">Nome *</label>
          <input class="form-input" id="rf-nome" placeholder="Ex: 1ª RISP">
        </div>
        <div>
          <label class="form-label">Descrição</label>
          <input class="form-input" id="rf-desc" placeholder="Região...">
        </div>
      </div>`,
      [
        { label: 'Cancelar',   class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Cadastrar',  class: 'btn-primary', onclick: 'Gerenciar.salvarRisp()' }
      ]
    );
  },

  editarRisp(id, nome, desc) {
    Modal.open('Editar RISP', `
      <div class="form-grid-2">
        <div>
          <label class="form-label">Nome *</label>
          <input class="form-input" id="rf-nome" value="${nome}">
        </div>
        <div>
          <label class="form-label">Descrição</label>
          <input class="form-input" id="rf-desc" value="${desc}">
        </div>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Salvar',   class: 'btn-primary', onclick: `Gerenciar.salvarRisp('${id}')` }
      ]
    );
  },

  async salvarRisp(id = null) {
    const nome = document.getElementById('rf-nome')?.value?.trim();
    if (!nome) { Toast.show('Informe o nome da RISP', 'error'); return; }
    const payload = { nome, descricao: document.getElementById('rf-desc')?.value?.trim() || null };
    try {
      if (id) {
        const { error } = await db.from('risps').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await db.from('risps').insert(payload);
        if (error) throw error;
      }
      Modal.close();
      Toast.show('RISP salva', 'success');
      await Gerenciar._renderRisps();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  // ══════════════════════════════════════
  // MOTIVOS DE FALHA
  // ══════════════════════════════════════
  async _renderMotivos() {
    const el = document.getElementById('gerenciar-conteudo');
    try {
      const motivos = await dbQuery(d => d.from('motivos_falha').select('*').order('descricao'));
      el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
          <button class="btn btn-primary btn-sm" onclick="Gerenciar.novoMotivo()">+ Novo Motivo</button>
        </div>
        <div class="card" style="padding:0">
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Ações</th></tr></thead>
              <tbody>${(motivos||[]).map(m => `
                <tr>
                  <td>${m.descricao}</td>
                  <td><span class="badge badge-gray">${m.categoria||'—'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="Gerenciar.editarMotivo('${m.id}','${m.descricao.replace(/'/g,"\\'")}','${m.categoria||''}')">✎</button>
                  </td>
                </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--text3)">Nenhum motivo</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch {}
  },

  novoMotivo() {
    Modal.open('Novo Motivo de Falha', `
      <div class="form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Descrição *</label>
          <input class="form-input" id="mof-desc" placeholder="Ex: Queda de energia">
        </div>
        <div>
          <label class="form-label">Categoria</label>
          <select class="form-select" id="mof-cat">
            <option value="">—</option>
            <option>Energia</option>
            <option>Transmissão</option>
            <option>Equipamento</option>
            <option>Infraestrutura</option>
            <option>Clima</option>
            <option>Vandalismo</option>
            <option>Outros</option>
          </select>
        </div>
      </div>`,
      [
        { label: 'Cancelar',   class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Cadastrar',  class: 'btn-primary', onclick: 'Gerenciar.salvarMotivo()' }
      ]
    );
  },

  editarMotivo(id, desc, cat) {
    const cats = ['Energia','Transmissão','Equipamento','Infraestrutura','Clima','Vandalismo','Outros'];
    Modal.open('Editar Motivo', `
      <div class="form-grid-2">
        <div style="grid-column:1/-1">
          <label class="form-label">Descrição *</label>
          <input class="form-input" id="mof-desc" value="${desc}">
        </div>
        <div>
          <label class="form-label">Categoria</label>
          <select class="form-select" id="mof-cat">
            <option value="">—</option>
            ${cats.map(c=>`<option ${c===cat?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Salvar',   class: 'btn-primary', onclick: `Gerenciar.salvarMotivo('${id}')` }
      ]
    );
  },

  async salvarMotivo(id = null) {
    const desc = document.getElementById('mof-desc')?.value?.trim();
    if (!desc) { Toast.show('Informe a descrição', 'error'); return; }
    const payload = { descricao: desc, categoria: document.getElementById('mof-cat')?.value || null };
    try {
      if (id) {
        const { error } = await db.from('motivos_falha').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await db.from('motivos_falha').insert(payload);
        if (error) throw error;
      }
      Modal.close();
      Toast.show('Motivo salvo', 'success');
      await Gerenciar._renderMotivos();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  // ══════════════════════════════════════
  // USUÁRIOS
  // ══════════════════════════════════════
  async _renderUsuarios() {
    const el = document.getElementById('gerenciar-conteudo');
    try {
      const usuarios = await dbQuery(d =>
        d.from('usuarios').select('*, risp:risps(nome)').order('nome')
      );
      const risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome'));
      Gerenciar._risps = risps || [];

      el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
          <button class="btn btn-primary btn-sm" onclick="Gerenciar.novoUsuario()">+ Novo Usuário</button>
        </div>
        <div class="card" style="padding:0">
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>RISP</th><th>Ações</th></tr></thead>
              <tbody>${(usuarios||[]).map(u => `
                <tr>
                  <td><strong style="color:var(--text)">${u.nome||'—'}</strong></td>
                  <td style="color:var(--text3);font-size:12px">${u.email||'—'}</td>
                  <td><span class="badge ${u.perfil==='grad'?'badge-blue':'badge-gray'}">${u.perfil||'—'}</span></td>
                  <td><span class="risp-badge">${u.risp?.nome||'—'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="Gerenciar.editarUsuario('${u.id}')">✎</button>
                  </td>
                </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3)">Nenhum usuário</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>`;
      Gerenciar._usuarios = usuarios || [];
    } catch {}
  },

  novoUsuario() {
    const rispOpts = (Gerenciar._risps||[]).map(r=>`<option value="${r.id}">${r.nome}</option>`).join('');
    Modal.open('Novo Usuário', `
      <div class="form-grid-2">
        <div>
          <label class="form-label">Nome *</label>
          <input class="form-input" id="uf-nome" placeholder="Nome completo">
        </div>
        <div>
          <label class="form-label">E-mail *</label>
          <input class="form-input" id="uf-email" type="email" placeholder="email@sesp.mt.gov.br">
        </div>
        <div>
          <label class="form-label">Perfil</label>
          <select class="form-select" id="uf-perfil">
            <option value="fiscal">Fiscal</option>
            <option value="grad">GRAD</option>
          </select>
        </div>
        <div>
          <label class="form-label">RISP</label>
          <select class="form-select" id="uf-risp"><option value="">—</option>${rispOpts}</select>
        </div>
      </div>`,
      [
        { label: 'Cancelar',  class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Cadastrar', class: 'btn-primary', onclick: 'Gerenciar.salvarUsuario()' }
      ]
    );
  },

  editarUsuario(id) {
    const u       = (Gerenciar._usuarios||[]).find(x => x.id === id);
    if (!u) return;
    const rispOpts = (Gerenciar._risps||[]).map(r=>`<option value="${r.id}" ${r.id===u.risp_id?'selected':''}>${r.nome}</option>`).join('');
    Modal.open('Editar Usuário', `
      <div class="form-grid-2">
        <div>
          <label class="form-label">Nome *</label>
          <input class="form-input" id="uf-nome" value="${u.nome||''}">
        </div>
        <div>
          <label class="form-label">E-mail</label>
          <input class="form-input" id="uf-email" value="${u.email||''}" disabled style="opacity:0.6">
        </div>
        <div>
          <label class="form-label">Perfil</label>
          <select class="form-select" id="uf-perfil">
            <option value="fiscal" ${u.perfil==='fiscal'?'selected':''}>Fiscal</option>
            <option value="grad"   ${u.perfil==='grad'?'selected':''}>GRAD</option>
          </select>
        </div>
        <div>
          <label class="form-label">RISP</label>
          <select class="form-select" id="uf-risp"><option value="">—</option>${rispOpts}</select>
        </div>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost',  onclick: 'Modal.close()' },
        { label: 'Salvar',   class: 'btn-primary', onclick: `Gerenciar.salvarUsuario('${id}')` }
      ]
    );
  },

  async salvarUsuario(id = null) {
    const nome  = document.getElementById('uf-nome')?.value?.trim();
    const email = document.getElementById('uf-email')?.value?.trim();
    if (!nome || (!id && !email)) {
      Toast.show('Preencha nome e e-mail', 'error'); return;
    }
    const payload = {
      nome,
      perfil:  document.getElementById('uf-perfil')?.value || 'fiscal',
      risp_id: document.getElementById('uf-risp')?.value || null,
      ...(!id && { email })
    };
    try {
      if (id) {
        const { error } = await db.from('usuarios').update(payload).eq('id', id);
        if (error) throw error;
        await Audit.editou('usuarios', id, null, payload);
      } else {
        const { data, error } = await db.from('usuarios').insert(payload).select().single();
        if (error) throw error;
        await Audit.criou('usuarios', data.id, data);
      }
      Modal.close();
      Toast.show('Usuário salvo', 'success');
      await Gerenciar._renderUsuarios();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  // ══════════════════════════════════════
  // AUDITORIA
  // ══════════════════════════════════════
  async _renderAuditoria() {
    const el = document.getElementById('gerenciar-conteudo');
    el.innerHTML = '<div style="display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>';
    try {
      const logs = await dbQuery(d =>
        d.from('audit_logs')
          .select('*, usuario:usuarios(nome,email)')
          .order('criado_em', { ascending: false })
          .limit(200)
      );

      const acaoBadge = a => ({
        criou:   '<span class="badge badge-green">criou</span>',
        editou:  '<span class="badge badge-amber">editou</span>',
        deletou: '<span class="badge badge-red">deletou</span>',
        acessou: '<span class="badge badge-gray">acessou</span>',
      }[a] || `<span class="badge badge-gray">${a}</span>`);

      el.innerHTML = `
        <div class="card" style="padding:0">
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>Quando</th><th>Usuário</th><th>Ação</th><th>Tabela</th><th>Registro</th></tr></thead>
              <tbody>${(logs||[]).map(l => `
                <tr>
                  <td style="font-size:11px;color:var(--text3);white-space:nowrap">${formatDateTime(l.criado_em)}</td>
                  <td style="font-size:12px">${l.usuario?.nome||l.usuario?.email||'Sistema'}</td>
                  <td>${acaoBadge(l.acao)}</td>
                  <td style="font-family:var(--mono);font-size:11px;color:var(--accent)">${l.tabela||'—'}</td>
                  <td style="font-family:var(--mono);font-size:10px;color:var(--text3)">${l.registro_id?.slice(0,8)||'—'}…</td>
                </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3)">Nenhum log</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch {}
  }
};
