// ═══════════════════════════════════════
// GRAD Ecossistema — GERENCIAR
// Administração: sites, RISPs, motivos, usuários, auditoria
// ═══════════════════════════════════════

const Gerenciar = {
  _aba: 'dados',

  async render(container) {
    if (!Auth.isAdmin()) {
      container.innerHTML = `
        <div class="page fade-in">
          <div class="empty-state" style="height:300px">
            <div class="empty-state-title">🔒 Acesso restrito</div>
            <div class="empty-state-sub">Esta área é exclusiva para administradores</div>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Gerenciar dados</div>
            <div class="page-sub">Administrar sites, RISPs, importação e exportação</div>
          </div>
        </div>

        <!-- Abas -->
        <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:16px">
          ${[
            { id:'dados',    label:'⚙️ Configurações' },
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

    await Gerenciar.irAba('dados');
  },

  async irAba(aba) {
    Gerenciar._aba = aba;
    document.querySelectorAll('[id^="aba-"]').forEach(el => {
      el.style.borderBottom = '';
      el.style.color = '';
    });
    const el = document.getElementById(`aba-${aba}`);
    if (el) { el.style.borderBottom = '2px solid var(--accent2)'; el.style.color = 'var(--accent2)'; }

    const metodos = {
      dados:     Gerenciar._renderDados,
      sites:     Gerenciar._renderSites,
      risps:     Gerenciar._renderRisps,
      motivos:   Gerenciar._renderMotivos,
      usuarios:  Gerenciar._renderUsuarios,
      auditoria: Gerenciar._renderAuditoria,
    };
    if (metodos[aba]) await metodos[aba]();
  },

  // ══════════════════════════════════════
  // ABA DADOS — Total ERBs · CSV · Export
  // ══════════════════════════════════════
  async _renderDados() {
    const el = document.getElementById('gerenciar-conteudo');
    el.innerHTML = '<div style="display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>';

    let totalMonitorado = 231;
    try {
      const { data } = await db.from('config').select('valor').eq('chave', 'total_monitorado').single();
      if (data?.valor) totalMonitorado = parseInt(data.valor) || 231;
    } catch {}

    el.innerHTML = `
      <!-- Total ERBs -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-title">Total de ERBs / Sites monitorados</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:10px">
          Informe o total real da rede NMS. O dashboard calcula automaticamente: Total − Inoperantes − Modo Local − Parcial = Operando.
        </div>
        <div style="display:flex;gap:8px;align-items:center;max-width:340px">
          <input class="form-input" id="cfg-total-monitorado" type="number" value="${totalMonitorado}" min="1" max="9999"
            style="font-size:22px;font-family:var(--mono);font-weight:700;text-align:center;max-width:120px">
          <button class="btn btn-primary" onclick="Gerenciar._salvarTotalMonitorado()">Salvar</button>
          <span id="cfg-total-feedback" style="font-size:12px;color:#34d399"></span>
        </div>
      </div>

      <!-- Linha 2: RISPs + Motivos -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">

        <!-- RISPs -->
        <div class="card">
          <div class="card-title">RISPs cadastradas</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:10px">Gerencie as regiões de segurança pública.</div>
          <div style="display:flex;gap:6px;margin-bottom:10px">
            <input class="form-input" id="new-risp-input" placeholder="Ex: RISP 16" style="flex:1;font-size:13px">
            <button class="btn btn-primary btn-sm" onclick="Gerenciar._addRisp()">+ Adicionar</button>
          </div>
          <div id="risp-list-gerenciar" style="display:flex;flex-direction:column;gap:4px;max-height:220px;overflow-y:auto"></div>
        </div>

        <!-- Motivos -->
        <div class="card">
          <div class="card-title">Motivos de falha</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:10px">Catálogo padronizado para relatórios precisos.</div>
          <div style="display:flex;gap:6px;margin-bottom:10px">
            <input class="form-input" id="new-motivo-input" placeholder="Novo motivo de falha..." style="flex:1;font-size:13px">
            <button class="btn btn-primary btn-sm" onclick="Gerenciar._addMotivoDados()">+ Adicionar</button>
          </div>
          <div id="motivos-list-gerenciar" style="display:flex;flex-direction:column;gap:4px;max-height:220px;overflow-y:auto"></div>
        </div>
      </div>

      <!-- Linha 3: Importar CSV + Exportar -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">

        <!-- CSV Import -->
        <div class="card">
          <div class="card-title">Importar sites (CSV)</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:10px">
            Aceita vírgula ou ponto-e-vírgula. Colunas: <span style="font-family:var(--mono);color:var(--accent2)">SBS · NOME · CIDADE · RISP · CR · TRAFEGO · PROP · LAT · LON</span>
          </div>
          <div id="csv-drop-zone"
            ondragover="event.preventDefault();this.style.borderColor='var(--accent2)'"
            ondragleave="this.style.borderColor=''"
            ondrop="Gerenciar._handleCSVDrop(event)"
            onclick="document.getElementById('csv-file-input').click()"
            style="border:2px dashed var(--border2);border-radius:8px;padding:28px;text-align:center;cursor:pointer;transition:border-color .15s;margin-bottom:8px">
            <div style="font-size:22px;margin-bottom:6px">⬆</div>
            <div style="font-size:13px;color:var(--text2)">Clique ou arraste o arquivo CSV aqui</div>
            <div style="font-size:11px;color:var(--text3);margin-top:4px">Formato: .csv · Separador vírgula ou ponto-e-vírgula · UTF-8 ou ANSI</div>
          </div>
          <input type="file" id="csv-file-input" accept=".csv,.txt" style="display:none" onchange="Gerenciar._importCSV(this)">
          <div id="import-feedback" style="font-size:12px;min-height:16px;margin-bottom:8px"></div>
          <button class="btn btn-ghost btn-sm" onclick="Gerenciar._downloadCSVTemplate()">
            ↓ Baixar modelo de planilha (.csv)
          </button>
        </div>

        <!-- Exportar -->
        <div class="card">
          <div class="card-title">Exportar dados</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:12px">
            Exporte a base de sites ou os registros de ocorrência para CSV compatível com Google Sheets e BigQuery.
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-ghost" onclick="Gerenciar._exportBaseSites()" style="justify-content:flex-start;gap:10px">
              <span style="font-size:14px">↓</span> Exportar BASE_MESTRE (.csv)
            </button>
            <button class="btn btn-ghost" onclick="Gerenciar._exportRegistros()" style="justify-content:flex-start;gap:10px">
              <span style="font-size:14px">↓</span> Exportar REGISTROS (.csv)
            </button>
            <button class="btn btn-ghost" onclick="Gerenciar._exportJSON()" style="justify-content:flex-start;gap:10px">
              <span style="font-size:14px">↓</span> Exportar backup completo (.json)
            </button>
            <button class="btn btn-ghost" onclick="document.getElementById('json-import-input').click()" style="justify-content:flex-start;gap:10px">
              <span style="font-size:14px">↑</span> Restaurar backup (.json)
            </button>
            <input type="file" id="json-import-input" accept=".json" style="display:none" onchange="Gerenciar._doImportJSON(this)">
            <button class="btn btn-danger" onclick="Gerenciar._limparDados()" style="justify-content:flex-start;gap:10px;margin-top:6px">
              🗑 Limpar dados locais (resetar)
            </button>
          </div>
        </div>
      </div>`;

    await Gerenciar._renderRispListDados();
    await Gerenciar._renderMotivoListDados();
  },

  async _salvarTotalMonitorado() {
    const v = parseInt(document.getElementById('cfg-total-monitorado')?.value) || 0;
    const fb = document.getElementById('cfg-total-feedback');
    if (v < 1 || v > 9999) { if (fb) fb.textContent = '⚠ Valor inválido.'; return; }
    try {
      const { error } = await db.from('config').upsert({ chave: 'total_monitorado', valor: String(v) });
      if (error) throw error;
      if (fb) { fb.textContent = `✓ Total atualizado para ${v} sites.`; setTimeout(() => { if (fb) fb.textContent = ''; }, 4000); }
      Toast.show(`Total monitorado: ${v} sites salvo`, 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  async _renderRispListDados() {
    const el = document.getElementById('risp-list-gerenciar');
    if (!el) return;
    const risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome')) || [];
    el.innerHTML = risps.map(r => {
      return `<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:var(--surface2);border-radius:6px;border:1px solid var(--border)">
        <span style="flex:1;font-size:12px;color:var(--text2)">${r.nome}</span>
        <button onclick="Gerenciar._editarRispInline('${r.id}','${r.nome.replace(/'/g,"\\'")}','${el.id}')"
          style="font-size:11px;color:var(--text3);background:none;border:1px solid var(--border);border-radius:4px;padding:1px 7px;cursor:pointer">editar</button>
        <button onclick="Gerenciar._removerRisp('${r.id}')"
          style="font-size:13px;color:#f87171;background:none;border:none;cursor:pointer;line-height:1">×</button>
      </div>`;
    }).join('') || '<div style="font-size:12px;color:var(--text3);padding:8px">Nenhuma RISP cadastrada</div>';
  },

  async _addRisp() {
    const input = document.getElementById('new-risp-input');
    const nome = input?.value?.trim();
    if (!nome) { Toast.show('Digite o nome da RISP', 'error'); return; }
    try {
      const { error } = await db.from('risps').insert({ nome });
      if (error) throw error;
      if (input) input.value = '';
      Toast.show(`RISP "${nome}" adicionada`, 'success');
      await Gerenciar._renderRispListDados();
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  _editarRispInline(id, nomeAtual) {
    const novoNome = prompt('Novo nome da RISP:', nomeAtual);
    if (!novoNome || novoNome === nomeAtual) return;
    db.from('risps').update({ nome: novoNome }).eq('id', id)
      .then(({ error }) => {
        if (error) { Toast.show(error.message, 'error'); return; }
        Toast.show('RISP atualizada', 'success');
        Gerenciar._renderRispListDados();
      });
  },

  async _removerRisp(id) {
    if (!confirm('Remover esta RISP? Os sites desta RISP não serão excluídos.')) return;
    try {
      const { error } = await db.from('risps').delete().eq('id', id);
      if (error) throw error;
      Toast.show('RISP removida', 'warn');
      await Gerenciar._renderRispListDados();
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  async _renderMotivoListDados() {
    const el = document.getElementById('motivos-list-gerenciar');
    if (!el) return;
    const motivos = await dbQuery(d => d.from('motivos_falha').select('id,descricao').order('descricao')) || [];
    const regs    = await dbQuery(d => d.from('ocorrencias').select('motivo_id')) || [];
    el.innerHTML = motivos.map(m => {
      const cnt = regs.filter(r => r.motivo_id === m.id).length;
      return `<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:var(--surface2);border-radius:6px;border:1px solid var(--border)">
        <span style="flex:1;font-size:11px;color:var(--text2);line-height:1.3">${m.descricao}</span>
        <span style="font-size:10px;font-family:var(--mono);color:var(--text3)">${cnt}x</span>
        <button onclick="Gerenciar._removerMotivoDados('${m.id}')"
          style="font-size:13px;color:#f87171;background:none;border:none;cursor:pointer;line-height:1">×</button>
      </div>`;
    }).join('') || '<div style="font-size:12px;color:var(--text3);padding:8px">Nenhum motivo cadastrado</div>';
  },

  async _addMotivoDados() {
    const input = document.getElementById('new-motivo-input');
    const desc  = input?.value?.trim();
    if (!desc) { Toast.show('Digite o motivo', 'error'); return; }
    try {
      const { error } = await db.from('motivos_falha').insert({ descricao: desc });
      if (error) throw error;
      if (input) input.value = '';
      Toast.show('Motivo adicionado', 'success');
      await Gerenciar._renderMotivoListDados();
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  async _removerMotivoDados(id) {
    if (!confirm('Remover este motivo?')) return;
    try {
      const { error } = await db.from('motivos_falha').delete().eq('id', id);
      if (error) throw error;
      Toast.show('Motivo removido', 'warn');
      await Gerenciar._renderMotivoListDados();
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  // ── CSV IMPORT ──────────────────────
  _handleCSVDrop(e) {
    e.preventDefault();
    document.getElementById('csv-drop-zone').style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.match(/\.(csv|txt)$/i)) {
      document.getElementById('import-feedback').innerHTML = '<span style="color:#f87171">⚠ Selecione um arquivo .csv</span>';
      return;
    }
    Gerenciar._importCSV({ files: [file] });
  },

  _parseCSVLine(line, sep) {
    if (sep === '\t') return line.split('\t').map(c => c.replace(/^"|"$/g, '').trim());
    const result = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if ((c === ',' || c === ';') && !inQ) { result.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    result.push(cur.trim());
    return result;
  },

  async _importCSV(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
      let text = e.target.result;
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const fb = document.getElementById('import-feedback');
      if (lines.length < 2) { if (fb) fb.innerHTML = '<span style="color:#f87171">⚠ Arquivo vazio ou sem dados.</span>'; return; }

      const sep  = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
      const rawH = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g,'').replace(/[^a-z0-9]/g,'_'));

      const col = {
        nome:         rawH.findIndex(h => ['nome','nome_do_local','local','site','descricao'].some(k => h.includes(k))),
        cidade:       rawH.findIndex(h => ['cidade','municipio','city'].some(k => h.includes(k))),
        risp:         rawH.findIndex(h => h.includes('risp')),
        cr:           rawH.findIndex(h => h === 'cr' || h.includes('_cr') || h.startsWith('cr_') || h === 'cr'),
        trafego:      rawH.findIndex(h => h.includes('trafego') || h.includes('trafico') || h.includes('tipo')),
        proprietario: rawH.findIndex(h => h.includes('prop') || h.includes('proprietar') || h.includes('dono')),
        patrimonio:   rawH.findIndex(h => h.includes('patrimonio') || h.includes('patrimônio') || h.includes('pat_')),
        lat:          rawH.findIndex(h => h === 'lat' || h.includes('latit')),
        lon:          rawH.findIndex(h => h === 'lon' || h === 'lng' || h.includes('longit')),
      };

      const risps = await dbQuery(d => d.from('risps').select('id,nome')) || [];
      const getRispId = nome => {
        if (!nome) return null;
        const norm = nome.replace(/^risp\s*/i, 'RISP ').replace(/RISP(\d)/, 'RISP $1').trim();
        return risps.find(r => r.nome === norm || r.nome.toLowerCase() === norm.toLowerCase())?.id || null;
      };

      let added = 0, skipped = 0, erros = [];
      const get = (cols, key) => col[key] >= 0 ? (cols[col[key]] || '').replace(/^"|"$/g, '').trim() : '';

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = Gerenciar._parseCSVLine(lines[i], sep);
        const nome = get(cols, 'nome');
        if (!nome) { skipped++; erros.push(`Linha ${i+1}: Nome vazio`); continue; }

        const latRaw = get(cols,'lat').replace(',','.');
        const lonRaw = get(cols,'lon').replace(',','.');
        const lat    = latRaw ? parseFloat(latRaw) : null;
        const lon    = lonRaw ? parseFloat(lonRaw) : null;

        const cr           = get(cols,'cr')           || '';
        const trafego      = get(cols,'trafego')      || 'BT';
        const proprietario = get(cols,'proprietario') || 'SESP';
        const patrimonio   = get(cols,'patrimonio')   || '';

        const payload = {
          nome,
          cidade:      get(cols,'cidade') || null,
          risp_id:     getRispId(get(cols,'risp')),
          latitude:    latRaw && !isNaN(lat)  ? lat : null,
          longitude:   lonRaw && !isNaN(lon)  ? lon : null,
          ativo:       true,
          observacoes: Gerenciar._serializeSiteExtras(cr, trafego, proprietario, patrimonio),
        };

        try {
          const { error } = await db.from('sites').insert(payload);
          if (error?.code === '23505') { skipped++; continue; }
          if (error) { skipped++; erros.push(`Linha ${i+1}: ${error.message}`); continue; }
          added++;
        } catch { skipped++; }
      }

      const msg = `✓ ${added} site(s) importado(s). ${skipped} ignorado(s).${erros.length ? ' Erros: ' + erros.slice(0,3).join('; ') : ''}`;
      if (fb) fb.innerHTML = `<span style="color:${added > 0 ? '#34d399' : '#f87171'}">${msg}</span>`;
      if (added > 0) {
        Toast.show(`${added} site(s) importado(s)`, 'success');
        await Gerenciar._renderSites();
      }
      if (input.value !== undefined) input.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  },

  _downloadCSVTemplate() {
    const csv = [
      'NOME;CIDADE;RISP;CR;TRAFEGO;PROPRIETARIO;PATRIMONIO;LAT;LON',
      '9200 – Cáceres Centro;Cáceres;RISP 1;1° CR;BT;SESP;PT-2024-0001;-16.0761;-57.6811',
      '9201 – Alta Floresta;Alta Floresta;RISP 9;9° CR;BT;SESP;;-9.8754;-56.0861',
      '2010 – PRF Primavera do Leste;Primavera do Leste;RISP 11;11° CR;BT;PRF;;;',
    ].join('\n');
    Gerenciar._dlFile('data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv), 'GRAD_modelo_importacao.csv');
  },

  // ── EXPORT ────────────────────────────
  async _exportBaseSites() {
    Toast.show('Gerando BASE_MESTRE…', 'info');
    try {
      const sites = await dbQuery(d => d.from('sites').select('*,risp:risps(nome)').order('nome')) || [];
      const rows = sites.map(s => {
        const ex = Gerenciar._parseSiteExtras(s);
        return [
          s.nome, s.cidade||'', s.risp?.nome||'',
          ex.cr||'', ex.trafego||'', ex.proprietario||'', ex.patrimonio||'',
          s.latitude!=null?s.latitude:'', s.longitude!=null?s.longitude:'',
          s.ativo?'Sim':'Não'
        ].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',');
      });
      const csv = ['NOME,CIDADE,RISP,CR,TRAFEGO,PROPRIETARIO,PATRIMONIO,LAT,LON,ATIVO', ...rows].join('\n');
      Gerenciar._dlFile('data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv),
        `GRAD_BASE_MESTRE_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  async _exportRegistros() {
    Toast.show('Gerando REGISTROS…', 'info');
    try {
      const ocs = await dbQuery(d =>
        d.from('ocorrencias').select('*,site:sites(nome,cidade,risp:risps(nome)),motivo:motivos_falha(descricao)').order('inicio', { ascending: false })
      ) || [];
      const rows = ocs.map(o => [
        o.site?.nome||'', o.site?.cidade||'', o.site?.risp?.nome||'', o.situacao,
        o.motivo?.descricao||'', o.inicio, o.prazo||'', o.operador||'', o.glpi||''
      ].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(','));
      const csv = ['SITE,CIDADE,RISP,SITUAÇÃO,MOTIVO,INÍCIO,PRAZO,OPERADOR,GLPI', ...rows].join('\n');
      Gerenciar._dlFile('data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv),
        `GRAD_REGISTROS_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  async _exportJSON() {
    Toast.show('Gerando backup…', 'info');
    try {
      const [sites, ocorrs, risps, motivos] = await Promise.all([
        dbQuery(d => d.from('sites').select('*')),
        dbQuery(d => d.from('ocorrencias').select('*')),
        dbQuery(d => d.from('risps').select('*')),
        dbQuery(d => d.from('motivos_falha').select('*')),
      ]);
      const data = JSON.stringify({ sites, ocorrencias: ocorrs, risps, motivos, exportedAt: new Date().toISOString() }, null, 2);
      Gerenciar._dlFile('data:application/json;charset=utf-8,' + encodeURIComponent(data),
        `GRAD_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
      Toast.show('Backup exportado com sucesso', 'success');
    } catch (err) { Toast.show(err.message, 'error'); }
  },

  // ── IMPORTAÇÃO JSON — Modal de progresso ──────────────────────────────────
  async _doImportJSON(input) {
    const file = input.files?.[0];
    if (!file) return;
    if (input.value !== undefined) input.value = '';

    const reader = new FileReader();
    reader.onload = async e => {
      let raw;
      try { raw = JSON.parse(e.target.result); }
      catch { Toast.show('Arquivo JSON inválido', 'error'); return; }

      const isOld = !!(raw.BASE_SITES || raw.REGISTROS);
      const rispsRaw    = isOld ? (raw.RISPS    || []) : (raw.risps          || []);
      const motivosRaw  = isOld ? (raw.MOTIVOS  || []) : (raw.motivos        || []);
      const sitesRaw    = isOld ? (raw.BASE_SITES|| []) : (raw.sites         || []);
      const registrosRaw= isOld ? (raw.REGISTROS|| []) : (raw.ocorrencias    || []);
      const exportadoEm = raw.exportedAt ? raw.exportedAt.slice(0,10) : 'data desconhecida';
      const formato     = isOld ? 'NEBULA (Firebase)' : 'GRAD (Supabase)';

      // ── Abre modal de progresso ────────────────────────────────────────────
      const steps = [
        { id:'s-risp',  icon:'🗺️', label:`RISPs (${rispsRaw.length})` },
        { id:'s-motiv', icon:'⚠️', label:`Motivos (${motivosRaw.length})` },
        { id:'s-sites', icon:'📡', label:`Sites (${sitesRaw.length})` },
        { id:'s-regs',  icon:'📋', label:`Registros (${registrosRaw.length})` },
      ];

      Modal.open('📥 Importando backup', `
        <div style="margin-bottom:12px;font-size:13px;color:var(--text3)">
          Formato: <strong style="color:var(--accent2)">${formato}</strong> · Exportado em: <strong>${exportadoEm}</strong>
        </div>
        ${steps.map(s => `
          <div id="${s.id}" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:18px;width:26px;text-align:center" id="${s.id}-ico">⏳</span>
            <span style="flex:1;font-size:13px">${s.icon} ${s.label}</span>
            <span style="font-size:12px;font-family:var(--mono);color:var(--text3)" id="${s.id}-st">aguardando</span>
          </div>`).join('')}
        <div style="margin-top:16px">
          <div style="height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden">
            <div id="imp-prog-bar" style="height:100%;background:var(--accent2);border-radius:3px;width:0%;transition:width .4s"></div>
          </div>
        </div>
        <div id="imp-log" style="margin-top:10px;max-height:140px;overflow-y:auto;font-size:11px;font-family:var(--mono);line-height:1.8;color:var(--text3)"></div>
        <div id="imp-resultado" style="margin-top:10px;display:none"></div>`,
        [{ label: 'Fechar', class: 'btn-ghost', onclick: 'Modal.close()' }]
      );

      const setStep = (id, ico, txt, cor) => {
        const el = document.getElementById(id+'-ico'); if (el) el.textContent = ico;
        const st = document.getElementById(id+'-st');  if (st) { st.textContent = txt; if (cor) st.style.color = cor; }
      };
      const log = (msg, cor='var(--text3)') => {
        const el = document.getElementById('imp-log');
        if (!el) return;
        el.innerHTML += `<div style="color:${cor}">${msg}</div>`;
        el.scrollTop = el.scrollHeight;
      };
      const prog = pct => {
        const el = document.getElementById('imp-prog-bar');
        if (el) el.style.width = pct + '%';
      };

      let totalIn = 0, totalSkip = 0, totalErr = 0;

      try {
        // ══ 1. RISPs ════════════════════════════════════════════════════════
        setStep('s-risp', '🔄', 'importando…', '#f59e0b');
        let rispIn = 0, rispSkip = 0;
        if (rispsRaw.length) {
          const { data: existentes } = await db.from('risps').select('nome');
          const jaExistem = new Set((existentes||[]).map(r => r.nome.toLowerCase()));
          for (const r of rispsRaw) {
            const nome = typeof r === 'string' ? r : (r.nome || r.RISP || '');
            if (!nome) continue;
            if (jaExistem.has(nome.toLowerCase())) { rispSkip++; continue; }
            const { error } = await db.from('risps').insert({ nome });
            if (error) { log(`✗ RISP "${nome}": ${error.message}`, '#f87171'); totalErr++; }
            else { rispIn++; jaExistem.add(nome.toLowerCase()); log(`✓ RISP "${nome}"`, '#34d399'); }
          }
        }
        totalIn += rispIn; totalSkip += rispSkip;
        setStep('s-risp', rispIn > 0 ? '✅' : '⏭️', `${rispIn} inseridos, ${rispSkip} já existiam`, rispIn > 0 ? '#34d399' : 'var(--text3)');
        prog(25);

        // ══ 2. Motivos ══════════════════════════════════════════════════════
        setStep('s-motiv', '🔄', 'importando…', '#f59e0b');
        let motivIn = 0, motivSkip = 0;
        if (motivosRaw.length) {
          const { data: existentes } = await db.from('motivos_falha').select('descricao');
          const jaExistem = new Set((existentes||[]).map(m => m.descricao.toLowerCase()));
          for (const m of motivosRaw) {
            const desc = typeof m === 'string' ? m : (m.descricao || m.nome || m.MOTIVO || '');
            if (!desc) continue;
            if (jaExistem.has(desc.toLowerCase())) { motivSkip++; continue; }
            const { error } = await db.from('motivos_falha').insert({ descricao: desc });
            if (error) { log(`✗ Motivo "${desc}": ${error.message}`, '#f87171'); totalErr++; }
            else { motivIn++; jaExistem.add(desc.toLowerCase()); log(`✓ Motivo "${desc}"`, '#34d399'); }
          }
        }
        totalIn += motivIn; totalSkip += motivSkip;
        setStep('s-motiv', motivIn > 0 ? '✅' : '⏭️', `${motivIn} inseridos, ${motivSkip} já existiam`, motivIn > 0 ? '#34d399' : 'var(--text3)');
        prog(50);

        // ══ Mapa RISP nome→id e motivo desc→id ══════════════════════════════
        const { data: rispData  } = await db.from('risps').select('id,nome');
        const { data: motivData } = await db.from('motivos_falha').select('id,descricao');
        const rispMap  = Object.fromEntries((rispData||[]).map(r => [r.nome.toLowerCase(), r.id]));
        const motivMap = Object.fromEntries((motivData||[]).map(m => [m.descricao.toLowerCase(), m.id]));

        // ══ 3. Sites ════════════════════════════════════════════════════════
        setStep('s-sites', '🔄', 'importando…', '#f59e0b');
        let siteIn = 0, siteSkip = 0;
        const siteIdMap = {}; // sbs ou nome → id (para mapear registros)

        if (sitesRaw.length) {
          const { data: existentes } = await db.from('sites').select('id,nome');
          const jaExistem = new Set((existentes||[]).map(s => s.nome.toLowerCase()));
          // Preenche mapa com existentes também
          (existentes||[]).forEach(s => { siteIdMap[s.nome.toLowerCase()] = s.id; });

          const LOTE = 30;
          for (let i = 0; i < sitesRaw.length; i += LOTE) {
            const lote = sitesRaw.slice(i, i + LOTE);
            for (const s of lote) {
              const nome = isOld ? (s.nome || `SBS-${s.sbs}`) : (s.nome || '');
              if (!nome) { siteSkip++; continue; }
              if (jaExistem.has(nome.toLowerCase())) {
                siteSkip++;
                // garante que o map tem o id mesmo pra sites existentes
                continue;
              }

              let rispId = null;
              if (isOld) {
                rispId = s.risp ? (rispMap[s.risp.toLowerCase()] || null) : null;
              } else {
                rispId = s.risp_id || null;
              }

              const lat = isOld ? (parseFloat(s.lat) || null) : (s.latitude || null);
              const lon = isOld ? (parseFloat(s.lon) || null) : (s.longitude || null);

              let obs;
              if (isOld) {
                obs = Gerenciar._serializeSiteExtras(s.cr||'', s.trafego||'BT', s.prop||'SESP', s.patrimonio||'');
              } else {
                obs = s.observacoes || null;
              }

              const payload = {
                nome, cidade: s.cidade||null, risp_id: rispId,
                sbs: s.sbs || null,
                latitude: lat && Math.abs(lat)<=90  ? lat : null,
                longitude: lon && Math.abs(lon)<=180 ? lon : null,
                ativo: s.ativo !== false,
                observacoes: obs,
              };

              const { data: inserted, error } = await db.from('sites').insert(payload).select('id').single();
              if (error) {
                siteSkip++; totalErr++;
                log(`✗ Site "${nome}": ${error.message}`, '#f87171');
              } else {
                siteIn++;
                jaExistem.add(nome.toLowerCase());
                siteIdMap[nome.toLowerCase()] = inserted.id;
                if (isOld && s.sbs) siteIdMap[String(s.sbs)] = inserted.id;
              }
            }
            // Progresso parcial entre 50-75%
            prog(50 + Math.round(((i + LOTE) / sitesRaw.length) * 25));
          }
          log(`📡 ${siteIn} sites inseridos, ${siteSkip} ignorados`, '#3d9bff');
        }
        totalIn += siteIn; totalSkip += siteSkip;
        setStep('s-sites', siteIn > 0 ? '✅' : '⏭️', `${siteIn} inseridos, ${siteSkip} já existiam`, siteIn > 0 ? '#34d399' : 'var(--text3)');
        prog(75);

        // ══ 4. Registros / Ocorrências ═══════════════════════════════════════
        setStep('s-regs', '🔄', 'importando…', '#f59e0b');
        let regIn = 0, regSkip = 0;

        if (registrosRaw.length) {
          // Busca mapa SBS → site_id pelo nome (prefixo numérico)
          if (isOld) {
            const { data: todosSites } = await db.from('sites').select('id,nome');
            (todosSites||[]).forEach(s => {
              const m = s.nome?.match(/^(\d{3,5})/);
              if (m) siteIdMap[m[1]] = s.id;
              siteIdMap[s.nome.toLowerCase()] = s.id;
            });
          }

          for (const r of registrosRaw) {
            let siteId = null;
            if (isOld) {
              siteId = siteIdMap[String(r.sbs)] || null;
            } else {
              siteId = r.site_id || null;
            }
            if (!siteId) { regSkip++; continue; }

            const motivoDesc = isOld ? (r.motivo || '') : '';
            const motivoId   = isOld
              ? (motivMap[motivoDesc.toLowerCase()] || null)
              : (r.motivo_id || null);

            const payload = isOld ? {
              site_id:     siteId,
              situacao:    r.situacao || 'Inoperante',
              motivo_id:   motivoId,
              inicio:      r.inicio   || new Date().toISOString().slice(0,10),
              fim:         (r.situacao === 'Encerrada' && r.ts) ? r.ts : null,
              prazo:       r.prazo    || null,
              acao:        r.acao     || null,
              observacoes: r.obs      || null,
              operador:    r.operador || null,
              conclusao:   r.conclusao|| null,
              glpi:        r.glpi     || null,
            } : {
              site_id:     siteId,
              situacao:    r.situacao    || 'Inoperante',
              motivo_id:   motivoId,
              inicio:      r.inicio      || new Date().toISOString().slice(0,10),
              fim:         r.fim         || null,
              prazo:       r.prazo       || null,
              acao:        r.acao        || null,
              observacoes: r.observacoes || null,
              operador:    r.operador    || null,
              conclusao:   r.conclusao   || null,
              glpi:        r.glpi        || null,
            };

            const { error } = await db.from('ocorrencias').insert(payload);
            if (error) { regSkip++; totalErr++; log(`✗ Registro: ${error.message}`, '#f87171'); }
            else regIn++;
          }
          log(`📋 ${regIn} registros inseridos, ${regSkip} ignorados`, '#3d9bff');
        }
        totalIn += regIn; totalSkip += regSkip;
        setStep('s-regs', regIn > 0 ? '✅' : '⏭️', `${regIn} inseridos, ${regSkip} ignorados`, regIn > 0 ? '#34d399' : 'var(--text3)');
        prog(100);

        // ══ Resultado final ══════════════════════════════════════════════════
        const res = document.getElementById('imp-resultado');
        if (res) {
          res.style.display = '';
          res.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px">
              <div style="text-align:center;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:8px;padding:10px">
                <div style="font-size:24px;font-weight:700;font-family:var(--mono);color:#34d399">${totalIn}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">INSERIDOS</div>
              </div>
              <div style="text-align:center;background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:10px">
                <div style="font-size:24px;font-weight:700;font-family:var(--mono);color:#a5b4fc">${totalSkip}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">JÁ EXISTIAM</div>
              </div>
              <div style="text-align:center;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:8px;padding:10px">
                <div style="font-size:24px;font-weight:700;font-family:var(--mono);color:#f87171">${totalErr}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">ERROS</div>
              </div>
            </div>
            <div style="margin-top:10px;font-size:13px;color:${totalIn>0?'#34d399':'#f87171'};text-align:center">
              ${totalIn > 0 ? '✅ Importação concluída! Os dados já estão no sistema.' : '⚠️ Nenhum dado novo foi inserido.'}
            </div>`;
        }

        if (totalIn > 0) {
          Toast.show(`Importação concluída — ${totalIn} registros inseridos`, 'success');
          await Gerenciar._renderSites();
        }

      } catch (err) {
        log(`ERRO CRÍTICO: ${err.message}`, '#f87171');
        Toast.show('Erro na importação: ' + err.message, 'error');
      }
    };
    reader.readAsText(file, 'UTF-8');
  },

  async _limparDados() {
    if (!confirm('⚠️ ATENÇÃO: Isso não apaga dados do Supabase, apenas limpa o cache local. Deseja continuar?')) return;
    localStorage.clear();
    Toast.show('Cache local limpo. Recarregue a página.', 'warn');
  },

  _dlFile(href, name) {
    const a = document.createElement('a');
    a.href = href; a.download = name; a.click();
  },

  // ══════════════════════════════════════
  // SITES — Gerenciamento de Infraestrutura
  // ══════════════════════════════════════
  _editingSiteId: null,   // null = modo cadastro, uuid = modo edição

  // Lê extras (CR, Tráfego, Prop, Patrimônio) do campo observacoes (JSON)
  _parseSiteExtras(s) {
    try {
      if (s.observacoes && s.observacoes.trimStart().startsWith('{')) {
        return JSON.parse(s.observacoes);
      }
    } catch {}
    return { cr: '', trafego: 'BT', proprietario: 'SESP', patrimonio: '', obs_livre: s.observacoes || '' };
  },

  // Serializa extras de volta para observacoes
  _serializeSiteExtras(cr, trafego, proprietario, patrimonio) {
    const obj = {};
    if (cr)           obj.cr           = cr;
    if (trafego)      obj.trafego      = trafego;
    if (proprietario) obj.proprietario = proprietario;
    if (patrimonio)   obj.patrimonio   = patrimonio;
    return Object.keys(obj).length ? JSON.stringify(obj) : null;
  },

  async _renderSites() {
    const el = document.getElementById('gerenciar-conteudo');
    el.innerHTML = '<div style="display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>';
    try {
      const [sites, risps] = await Promise.all([
        dbQuery(d => d.from('sites').select('*, risp:risps(nome)').order('nome')),
        dbQuery(d => d.from('risps').select('id,nome').order('nome'))
      ]);
      Gerenciar._sites      = sites  || [];
      Gerenciar._risps      = risps  || [];
      Gerenciar._editingSiteId = null;

      const rispOpts = (risps||[]).map(r=>`<option value="${r.id}">${r.nome}</option>`).join('');

      el.innerHTML = `
        <!-- ── FORMULÁRIO INLINE ────────────── -->
        <div class="card" id="site-form-card" style="margin-bottom:14px;border-color:rgba(36,133,245,.25)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div class="card-title" id="sf-form-title">Adicionar novo site</div>
            <span id="sf-edit-badge" style="display:none;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4);border-radius:6px;padding:3px 12px;font-size:12px;font-family:var(--mono);color:#fbbf24;letter-spacing:.06em">✎ MODO EDIÇÃO</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">
            <div>
              <label class="form-label">Nome do site *</label>
              <input class="form-input" id="sf-nome" placeholder="Nome do local">
            </div>
            <div>
              <label class="form-label">Cidade</label>
              <input class="form-input" id="sf-cidade" placeholder="Cidade">
            </div>
            <div>
              <label class="form-label">RISP</label>
              <select class="form-select" id="sf-risp"><option value="">—</option>${rispOpts}</select>
            </div>
            <div>
              <label class="form-label">CR</label>
              <input class="form-input" id="sf-cr" placeholder="Ex: 7° CR">
            </div>
            <div>
              <label class="form-label">Tráfego</label>
              <select class="form-select" id="sf-trafego">
                <option>BT</option><option>MT</option><option>AT</option>
                <option>LINK</option><option>INATIVO</option><option>repetidora</option>
              </select>
            </div>
            <div>
              <label class="form-label">Proprietário</label>
              <select class="form-select" id="sf-prop">
                <option>SESP</option><option>GEFRON</option><option>PRF</option>
              </select>
            </div>
            <div>
              <label class="form-label">Latitude</label>
              <input class="form-input" id="sf-lat" placeholder="-15.6335" type="text">
            </div>
            <div>
              <label class="form-label">Longitude</label>
              <input class="form-input" id="sf-lng" placeholder="-56.0922" type="text">
            </div>
            <div class="perm-admin">
              <label class="form-label">Patrimônio <span style="color:var(--amber);font-size:10px">🔒 Admin</span></label>
              <input class="form-input" id="sf-patrimonio" placeholder="Ex: PT-2024-0001">
            </div>
            <div>
              <label class="form-label">Status</label>
              <select class="form-select" id="sf-ativo">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-primary" id="sf-submit-btn" onclick="Gerenciar.salvarSite()">+ Cadastrar site</button>
            <button class="btn btn-ghost" id="sf-cancel-btn" style="display:none" onclick="Gerenciar._cancelarEdicaoSite()">Cancelar edição</button>
            <span id="sf-feedback" style="font-size:12px;color:var(--text3);flex:1"></span>
          </div>
        </div>

        <!-- ── FILTROS + TABELA ──────────────── -->
        <div class="card" style="padding:0">
          <div style="display:flex;gap:8px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--border);flex-wrap:wrap">
            <input class="form-input" id="ger-site-busca" placeholder="Buscar nome, cidade..." oninput="Gerenciar._filtrarSites()" style="width:220px">
            <select class="form-select" id="ger-site-risp" onchange="Gerenciar._filtrarSites()" style="width:160px">
              <option value="">Todas as RISPs</option>
              ${(risps||[]).map(r=>`<option value="${r.id}">${r.nome}</option>`).join('')}
            </select>
            <select class="form-select" id="ger-site-prop" onchange="Gerenciar._filtrarSites()" style="width:130px">
              <option value="">Todos proprietários</option>
              <option>SESP</option><option>GEFRON</option><option>PRF</option>
            </select>
            <select class="form-select" id="ger-site-ativo" onchange="Gerenciar._filtrarSites()" style="width:120px">
              <option value="">Todos status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
            <div style="margin-left:auto;font-size:13px;color:var(--text3)" id="ger-site-count"></div>
          </div>
          <div class="table-wrap" style="border:none;max-height:520px;overflow-y:auto">
            <table id="ger-sites-tbl" class="table">
              <thead>
                <tr>
                  <th>Nome</th><th>Cidade</th><th>RISP</th><th>CR</th>
                  <th>Tráfego</th><th>Prop.</th><th>Patrimônio</th>
                  <th>Coords</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody id="ger-sites-body"></tbody>
            </table>
          </div>
        </div>`;

      Gerenciar._filtrarSites();
    } catch (err) {
      document.getElementById('gerenciar-conteudo').innerHTML =
        `<div class="empty-state"><div class="empty-state-title">Erro ao carregar sites</div><div class="empty-state-sub">${err.message||''}</div></div>`;
    }
  },

  _filtrarSites() {
    const busca  = (document.getElementById('ger-site-busca')?.value  || '').toLowerCase();
    const rispF  =  document.getElementById('ger-site-risp')?.value   || '';
    const propF  = (document.getElementById('ger-site-prop')?.value   || '').toLowerCase();
    const ativoF =  document.getElementById('ger-site-ativo')?.value  || '';

    const filtered = (Gerenciar._sites || []).filter(s => {
      const ex = Gerenciar._parseSiteExtras(s);
      if (rispF  && s.risp_id !== rispF) return false;
      if (propF  && (ex.proprietario||'').toLowerCase() !== propF) return false;
      if (ativoF !== '' && String(s.ativo) !== ativoF) return false;
      if (busca  && !(s.nome?.toLowerCase().includes(busca) || s.cidade?.toLowerCase().includes(busca))) return false;
      return true;
    });

    const cnt = document.getElementById('ger-site-count');
    if (cnt) cnt.textContent = `${filtered.length} site${filtered.length!==1?'s':''}`;

    const tbody = document.getElementById('ger-sites-body');
    if (!tbody) return;

    tbody.innerHTML = filtered.map(s => {
      const ex = Gerenciar._parseSiteExtras(s);
      const hasCoords = s.latitude != null && s.longitude != null;
      const coordLabel = hasCoords
        ? `<span style="font-size:11px;color:#34d399;font-family:var(--mono)" title="${s.latitude}, ${s.longitude}">✓ coord</span>`
        : `<span style="font-size:11px;color:var(--text3);font-family:var(--mono)">— sem coord</span>`;
      const patrimonioCell = ex.patrimonio
        ? `<span style="font-family:var(--mono);font-size:11px;color:#fbbf24;background:rgba(251,191,36,.1);padding:2px 7px;border-radius:4px;border:1px solid rgba(251,191,36,.3)">${ex.patrimonio}</span>`
        : `<span style="color:var(--text3);font-size:11px">—</span>`;
      const trafBadge = ex.trafego
        ? `<span style="font-size:11px;padding:2px 7px;border-radius:4px;background:rgba(99,102,241,.15);color:#a5b4fc;border:1px solid rgba(99,102,241,.2)">${ex.trafego}</span>`
        : '—';
      const isEditing = Gerenciar._editingSiteId === s.id;

      return `<tr id="ger-site-row-${s.id}" style="${isEditing?'background:rgba(245,158,11,.07)':''}">
        <td><strong style="color:var(--text)">${s.nome||'—'}</strong></td>
        <td style="color:var(--text2)">${s.cidade||'—'}</td>
        <td><span class="risp-badge">${s.risp?.nome||'—'}</span></td>
        <td style="color:var(--text3);font-size:12px">${ex.cr||'—'}</td>
        <td>${trafBadge}</td>
        <td style="color:var(--text3);font-size:12px">${ex.proprietario||'—'}</td>
        <td class="perm-admin">${patrimonioCell}</td>
        <td>${coordLabel}</td>
        <td><span class="badge ${s.ativo?'badge-green':'badge-gray'}">${s.ativo?'Ativo':'Inativo'}</span></td>
        <td style="white-space:nowrap">
          <div class="perm-edit" style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm" onclick="Gerenciar.editarSite('${s.id}')">✎ editar</button>
            <button class="btn btn-ghost btn-sm" onclick="Gerenciar.toggleSite('${s.id}',${!s.ativo})">${s.ativo?'Desativar':'Ativar'}</button>
          </div>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--text3)">Nenhum site encontrado</td></tr>';
  },

  _cancelarEdicaoSite() {
    Gerenciar._editingSiteId = null;
    // Limpa formulário
    ['sf-nome','sf-cidade','sf-cr','sf-lat','sf-lng','sf-patrimonio'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const sfRisp = document.getElementById('sf-risp'); if (sfRisp) sfRisp.value = '';
    const sfTraf = document.getElementById('sf-trafego'); if (sfTraf) sfTraf.value = 'BT';
    const sfProp = document.getElementById('sf-prop'); if (sfProp) sfProp.value = 'SESP';
    const sfAtiv = document.getElementById('sf-ativo'); if (sfAtiv) sfAtiv.value = 'true';
    document.getElementById('sf-feedback').textContent = '';
    document.getElementById('sf-form-title').textContent = 'Adicionar novo site';
    document.getElementById('sf-edit-badge').style.display = 'none';
    document.getElementById('sf-submit-btn').textContent = '+ Cadastrar site';
    document.getElementById('sf-cancel-btn').style.display = 'none';
    // Remove highlight
    document.querySelectorAll('[id^="ger-site-row-"]').forEach(r => r.style.background = '');
  },

  editarSite(id) {
    const s = (Gerenciar._sites || []).find(x => x.id === id);
    if (!s) return;
    const ex = Gerenciar._parseSiteExtras(s);

    Gerenciar._editingSiteId = id;

    // Preenche formulário
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
    set('sf-nome',       s.nome || '');
    set('sf-cidade',     s.cidade || '');
    set('sf-cr',         ex.cr || '');
    set('sf-lat',        s.latitude  != null ? s.latitude  : '');
    set('sf-lng',        s.longitude != null ? s.longitude : '');
    set('sf-patrimonio', ex.patrimonio || '');

    const sfRisp = document.getElementById('sf-risp'); if (sfRisp) sfRisp.value = s.risp_id || '';
    const sfTraf = document.getElementById('sf-trafego'); if (sfTraf) sfTraf.value = ex.trafego || 'BT';
    const sfProp = document.getElementById('sf-prop'); if (sfProp) sfProp.value = ex.proprietario || 'SESP';
    const sfAtiv = document.getElementById('sf-ativo'); if (sfAtiv) sfAtiv.value = String(s.ativo !== false);

    // Modo edição
    document.getElementById('sf-form-title').textContent = `Editando: ${s.nome}`;
    document.getElementById('sf-edit-badge').style.display = '';
    document.getElementById('sf-submit-btn').textContent = '💾 Salvar alteração';
    document.getElementById('sf-cancel-btn').style.display = '';
    document.getElementById('sf-feedback').textContent = '';

    // Highlight linha e scroll ao formulário
    document.querySelectorAll('[id^="ger-site-row-"]').forEach(r => r.style.background = '');
    const row = document.getElementById(`ger-site-row-${id}`);
    if (row) row.style.background = 'rgba(245,158,11,.07)';
    document.getElementById('site-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async salvarSite() {
    const id   = Gerenciar._editingSiteId;
    const nome = document.getElementById('sf-nome')?.value?.trim();
    const fb   = document.getElementById('sf-feedback');
    if (!nome) {
      if (fb) { fb.textContent = '⚠ Informe o nome do site.'; fb.style.color = '#f87171'; }
      Toast.show('Informe o nome do site', 'error');
      return;
    }

    const latRaw = document.getElementById('sf-lat')?.value?.trim().replace(',', '.');
    const lngRaw = document.getElementById('sf-lng')?.value?.trim().replace(',', '.');
    const lat    = latRaw  ? parseFloat(latRaw)  : null;
    const lng    = lngRaw  ? parseFloat(lngRaw)  : null;

    if (latRaw && isNaN(lat)) { if (fb) { fb.textContent = '⚠ Latitude inválida. Use decimal: -15.6335'; fb.style.color = '#f87171'; } return; }
    if (lngRaw && isNaN(lng)) { if (fb) { fb.textContent = '⚠ Longitude inválida. Use decimal: -56.0922'; fb.style.color = '#f87171'; } return; }

    const cr           = document.getElementById('sf-cr')?.value?.trim()          || '';
    const trafego      = document.getElementById('sf-trafego')?.value             || 'BT';
    const proprietario = document.getElementById('sf-prop')?.value                || 'SESP';
    const patrimonio   = document.getElementById('sf-patrimonio')?.value?.trim()   || '';

    const payload = {
      nome,
      cidade:      document.getElementById('sf-cidade')?.value?.trim()  || null,
      risp_id:     document.getElementById('sf-risp')?.value            || null,
      ativo:       document.getElementById('sf-ativo')?.value !== 'false',
      latitude:    isNaN(lat)  ? null : lat,
      longitude:   isNaN(lng)  ? null : lng,
      observacoes: Gerenciar._serializeSiteExtras(cr, trafego, proprietario, patrimonio),
    };

    try {
      if (id) {
        const { error } = await db.from('sites').update(payload).eq('id', id);
        if (error) throw error;
        await Audit.editou('sites', id, null, payload);
        Toast.show(`✓ Site "${nome}" atualizado`, 'success');
      } else {
        const { data, error } = await db.from('sites').insert(payload).select().single();
        if (error) throw error;
        await Audit.criou('sites', data.id, data);
        Toast.show(`✓ Site "${nome}" cadastrado`, 'success');
      }
      Gerenciar._cancelarEdicaoSite();
      await Gerenciar._renderSites();
    } catch (err) {
      if (fb) { fb.textContent = 'Erro: ' + (err.message || 'desconhecido'); fb.style.color = '#f87171'; }
      Toast.show(err.message || 'Erro ao salvar', 'error');
    }
  },

  async toggleSite(id, ativo) {
    try {
      const { error } = await db.from('sites').update({ ativo }).eq('id', id);
      if (error) throw error;
      await Audit.editou('sites', id, null, { ativo });
      Toast.show(`Site ${ativo ? 'ativado' : 'desativado'}`, 'success');
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
