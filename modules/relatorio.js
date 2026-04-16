// ═══════════════════════════════════════
// GRAD Ecossistema — RELATÓRIOS
// Geração de relatórios PDF e CSV
// ═══════════════════════════════════════

const Relatorio = {
  _charts: {},

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Relatórios</div>
            <div class="page-sub">Geração de relatórios operacionais</div>
          </div>
        </div>

        <!-- Seletor de tipo -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
          ${[
            { id:'sit', icon:'📊', titulo:'Situação da Rede', sub:'Status atual de todos os sites' },
            { id:'oc',  icon:'⚠️', titulo:'Ocorrências do Período', sub:'Falhas abertas e encerradas' },
            { id:'risp',icon:'🗺️', titulo:'Relatório por RISP', sub:'Desempenho por região' },
          ].map(t => `
            <div class="card" style="cursor:pointer;transition:border-color .2s" id="rel-card-${t.id}"
                 onclick="Relatorio.selecionarTipo('${t.id}')">
              <div style="font-size:28px;margin-bottom:8px">${t.icon}</div>
              <div style="font-weight:700;color:var(--text)">${t.titulo}</div>
              <div style="font-size:12px;color:var(--text3);margin-top:4px">${t.sub}</div>
            </div>`).join('')}
        </div>

        <!-- Configuração do relatório -->
        <div class="card" id="rel-config" style="display:none">
          <div class="card-title" id="rel-config-title">Configurar Relatório</div>
          <div id="rel-config-body"></div>
          <div style="display:flex;gap:8px;margin-top:16px">
            <button class="btn btn-ghost" onclick="Relatorio.cancelar()">Cancelar</button>
            <button class="btn btn-primary" onclick="Relatorio.gerar()">📄 Gerar PDF</button>
            <button class="btn btn-ghost" onclick="Relatorio.exportarCSV()">↓ CSV</button>
          </div>
        </div>

        <!-- Preview / resultado -->
        <div id="rel-preview"></div>
      </div>`;

    await Relatorio._carregarFiltros();
  },

  async _carregarFiltros() {
    try {
      Relatorio._risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome')) || [];
    } catch {
      Relatorio._risps = [];
    }
  },

  selecionarTipo(tipo) {
    Relatorio._tipoAtual = tipo;

    // Destaca card selecionado
    document.querySelectorAll('[id^="rel-card-"]').forEach(el => {
      el.style.borderColor = '';
      el.style.background  = '';
    });
    const card = document.getElementById(`rel-card-${tipo}`);
    if (card) { card.style.borderColor = 'var(--accent)'; card.style.background = 'rgba(59,130,246,0.08)'; }

    const cfg = document.getElementById('rel-config');
    if (!cfg) return;
    cfg.style.display = 'block';

    const titulos = { sit: 'Situação da Rede', oc: 'Ocorrências do Período', risp: 'Relatório por RISP' };
    document.getElementById('rel-config-title').textContent = titulos[tipo] || 'Configurar';

    const rispOpts = Relatorio._risps.map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
    const hoje     = new Date().toISOString().slice(0,10);
    const ha30     = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);

    const corpos = {
      sit: `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Data de referência</label>
            <input type="date" class="form-input" id="rc-data" value="${hoje}">
          </div>
          <div>
            <label class="form-label">Filtrar por RISP</label>
            <select class="form-select" id="rc-risp">
              <option value="">Todas as RISPs</option>${rispOpts}
            </select>
          </div>
        </div>`,
      oc: `
        <div class="form-grid-2">
          <div>
            <label class="form-label">Data início</label>
            <input type="date" class="form-input" id="rc-ini" value="${ha30}">
          </div>
          <div>
            <label class="form-label">Data fim</label>
            <input type="date" class="form-input" id="rc-fim" value="${hoje}">
          </div>
          <div>
            <label class="form-label">Situação</label>
            <select class="form-select" id="rc-sit">
              <option value="">Todas</option>
              <option>Inoperante</option>
              <option>Parcial/Em analise</option>
              <option>Modo Local</option>
              <option>Operacional</option>
            </select>
          </div>
          <div>
            <label class="form-label">RISP</label>
            <select class="form-select" id="rc-risp">
              <option value="">Todas</option>${rispOpts}
            </select>
          </div>
        </div>`,
      risp: `
        <div class="form-grid-2">
          <div>
            <label class="form-label">RISP</label>
            <select class="form-select" id="rc-risp">
              <option value="">Todas as RISPs</option>${rispOpts}
            </select>
          </div>
          <div>
            <label class="form-label">Período (dias)</label>
            <select class="form-select" id="rc-dias">
              <option value="7">7 dias</option>
              <option value="30" selected>30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </div>
        </div>`
    };

    document.getElementById('rel-config-body').innerHTML = corpos[tipo] || '';
  },

  cancelar() {
    document.getElementById('rel-config').style.display = 'none';
    document.getElementById('rel-preview').innerHTML = '';
    document.querySelectorAll('[id^="rel-card-"]').forEach(el => {
      el.style.borderColor = '';
      el.style.background  = '';
    });
    Relatorio._tipoAtual = null;
  },

  async gerar() {
    const tipo = Relatorio._tipoAtual;
    if (!tipo) return;

    const btn = document.querySelector('#rel-config .btn-primary');
    if (btn) { btn.textContent = '⏳ Gerando...'; btn.disabled = true; }

    try {
      let dados;
      if (tipo === 'sit')  dados = await Relatorio._dadosSituacao();
      if (tipo === 'oc')   dados = await Relatorio._dadosOcorrencias();
      if (tipo === 'risp') dados = await Relatorio._dadosRisp();

      Relatorio._abrirPDF(tipo, dados);
    } catch {
      Toast.show('Erro ao gerar relatório', 'error');
    } finally {
      if (btn) { btn.textContent = '📄 Gerar PDF'; btn.disabled = false; }
    }
  },

  async _dadosSituacao() {
    const rispId = document.getElementById('rc-risp')?.value;
    let query = db.from('ocorrencias')
      .select('*, site:sites(nome,risp:risps(nome)), motivo:motivos_falha(descricao)')
      .neq('situacao', 'Operacional');
    if (rispId) query = query.eq('sites.risp_id', rispId);
    const { data, error } = await query.order('sites(nome)');
    if (error) throw error;

    const { count: totalSites } = await db.from('sites').select('*', { count:'exact', head:true }).eq('ativo', true);
    return { ocorrencias: data || [], totalSites: totalSites || 0 };
  },

  async _dadosOcorrencias() {
    const ini  = document.getElementById('rc-ini')?.value;
    const fim  = document.getElementById('rc-fim')?.value;
    const sit  = document.getElementById('rc-sit')?.value;
    const rispId = document.getElementById('rc-risp')?.value;

    let query = db.from('ocorrencias')
      .select('*, site:sites(nome,risp:risps(nome)), motivo:motivos_falha(descricao)');
    if (ini)  query = query.gte('inicio', ini);
    if (fim)  query = query.lte('inicio', fim + 'T23:59:59');
    if (sit)  query = query.eq('situacao', sit);
    query = query.order('inicio', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return { ocorrencias: data || [], ini, fim };
  },

  async _dadosRisp() {
    const rispId = document.getElementById('rc-risp')?.value;
    const dias   = parseInt(document.getElementById('rc-dias')?.value || '30');
    const desde  = new Date(Date.now() - dias * 86400000).toISOString();

    let query = db.from('ocorrencias')
      .select('*, site:sites(nome,risp:risps(nome)), motivo:motivos_falha(descricao)')
      .gte('inicio', desde);
    const { data, error } = await query.order('inicio', { ascending: false });
    if (error) throw error;
    return { ocorrencias: data || [], dias };
  },

  _abrirPDF(tipo, dados) {
    const titulos = {
      sit:  'Relatório de Situação da Rede',
      oc:   'Relatório de Ocorrências',
      risp: 'Relatório por RISP'
    };
    const titulo = titulos[tipo];
    const emitidoEm = new Date().toLocaleString('pt-BR');
    const ocorrs    = dados.ocorrencias || [];

    const corSit = s => ({
      'Inoperante':        '#ef4444',
      'Parcial/Em analise':'#fbbf24',
      'Modo Local':        '#a78bfa',
      'Operacional':       '#22c55e',
    }[s] || '#6b7280');

    const linhas = ocorrs.map(o => {
      const dias = o.fim
        ? Math.floor((new Date(o.fim)-new Date(o.inicio))/86400000)
        : diffDays(o.inicio);
      return `
        <tr>
          <td>${o.site?.risp?.nome||'—'}</td>
          <td><strong>${o.site?.nome||'—'}</strong></td>
          <td><span style="color:${corSit(o.situacao)};font-weight:600">${o.situacao||'—'}</span></td>
          <td style="font-size:11px">${o.motivo?.descricao||'—'}</td>
          <td style="text-align:center">${dias}d</td>
          <td style="font-size:11px">${formatDate(o.inicio)}</td>
          <td style="font-size:11px">${o.fim?formatDate(o.fim):'Ativo'}</td>
          <td style="font-size:11px">${o.os_numero||'—'}</td>
        </tr>`;
    }).join('');

    const inop = ocorrs.filter(o=>o.situacao==='Inoperante').length;
    const parc = ocorrs.filter(o=>o.situacao==='Parcial/Em analise').length;
    const ml   = ocorrs.filter(o=>o.situacao==='Modo Local').length;
    const tot  = dados.totalSites || ocorrs.length;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  @page{size:A4 portrait;margin:1.8cm 2cm 2cm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Arial',sans-serif;font-size:11px;color:#0f172a;background:#f0f4f8}
  .page{width:174mm;min-height:257mm;background:#fff;margin:0 auto;padding:14mm 12mm}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #1e3a5f}
  .gov-logo{display:flex;align-items:center;gap:10px}
  .gov-escudo{width:36px;height:36px;background:#1e3a5f;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px}
  .gov-text .gov-title{font-size:11px;font-weight:700;color:#1e3a5f}
  .gov-text .gov-sub{font-size:9px;color:#475569}
  .doc-info{text-align:right;font-size:9px;color:#64748b}
  .rel-title{font-size:16px;font-weight:800;color:#1e3a5f;margin-bottom:4px;text-align:center}
  .rel-sub{font-size:10px;color:#64748b;text-align:center;margin-bottom:14px}
  .kpi-row{display:flex;gap:8px;margin-bottom:14px}
  .kpi{flex:1;background:#f1f5f9;border-radius:6px;padding:8px;text-align:center;border-top:3px solid #1e3a5f}
  .kpi.red{border-top-color:#ef4444}.kpi.green{border-top-color:#22c55e}.kpi.amber{border-top-color:#fbbf24}.kpi.purple{border-top-color:#a78bfa}
  .kpi-label{font-size:9px;color:#64748b;margin-bottom:2px}
  .kpi-value{font-size:18px;font-weight:800;color:#0f172a}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th{background:#1e3a5f;color:#fff;padding:5px 6px;text-align:left;font-weight:600}
  td{padding:4px 6px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
  tr:nth-child(even) td{background:#f8fafc}
  .footer{margin-top:16px;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
  @media print{body{background:#fff}.page{margin:0}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="gov-logo">
      <div class="gov-escudo">G</div>
      <div class="gov-text">
        <div class="gov-title">Governo do Estado de Mato Grosso</div>
        <div class="gov-sub">SESP — Telecomunicação · GRAD</div>
      </div>
    </div>
    <div class="doc-info">
      <div>Emitido em: ${emitidoEm}</div>
      <div>Usuário: ${Auth.perfil?.nome || '—'}</div>
    </div>
  </div>

  <div class="rel-title">${titulo}</div>
  <div class="rel-sub">${ocorrs.length} registro(s) · Gerado em ${emitidoEm}</div>

  <div class="kpi-row">
    ${tipo === 'sit' ? `
      <div class="kpi"><div class="kpi-label">Total NMS</div><div class="kpi-value">${tot}</div></div>
      <div class="kpi red"><div class="kpi-label">Inoperantes</div><div class="kpi-value">${inop}</div></div>
      <div class="kpi amber"><div class="kpi-label">Parcial/Análise</div><div class="kpi-value">${parc}</div></div>
      <div class="kpi purple"><div class="kpi-label">Modo Local</div><div class="kpi-value">${ml}</div></div>
      <div class="kpi green"><div class="kpi-label">Disponibilidade</div><div class="kpi-value">${tot?Math.round((tot-inop-parc-ml)/tot*100):0}%</div></div>
    ` : `
      <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value">${ocorrs.length}</div></div>
      <div class="kpi red"><div class="kpi-label">Inoperantes</div><div class="kpi-value">${inop}</div></div>
      <div class="kpi amber"><div class="kpi-label">Parcial</div><div class="kpi-value">${parc}</div></div>
      <div class="kpi purple"><div class="kpi-label">Modo Local</div><div class="kpi-value">${ml}</div></div>
    `}
  </div>

  <table>
    <thead>
      <tr>
        <th>RISP</th><th>Site</th><th>Situação</th><th>Motivo</th>
        <th>Dias</th><th>Início</th><th>Fim</th><th>OS</th>
      </tr>
    </thead>
    <tbody>
      ${linhas || '<tr><td colspan="8" style="text-align:center;padding:12px;color:#94a3b8">Nenhum registro encontrado</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <span>GRAD Ecossistema · Sistema de Gestão Operacional</span>
    <span>${titulo} · ${emitidoEm}</span>
  </div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Popup bloqueado — permita popups para gerar PDF', 'error');
  },

  async exportarCSV() {
    const tipo = Relatorio._tipoAtual;
    if (!tipo) { Toast.show('Selecione um tipo de relatório', 'error'); return; }

    try {
      let dados;
      if (tipo === 'sit')  dados = await Relatorio._dadosSituacao();
      if (tipo === 'oc')   dados = await Relatorio._dadosOcorrencias();
      if (tipo === 'risp') dados = await Relatorio._dadosRisp();

      const ocorrs = dados.ocorrencias || [];
      const headers = ['RISP','Site','Situação','Motivo','Dias','Início','Fim','OS'];
      const linhas  = ocorrs.map(o => {
        const dias = o.fim
          ? Math.floor((new Date(o.fim)-new Date(o.inicio))/86400000)
          : diffDays(o.inicio);
        return [
          o.site?.risp?.nome||'',
          o.site?.nome||'',
          o.situacao||'',
          o.motivo?.descricao||'',
          dias,
          formatDate(o.inicio),
          o.fim ? formatDate(o.fim) : 'Ativo',
          o.os_numero||''
        ].map(v=>`"${v}"`).join(',');
      });

      const csv  = [headers.join(','), ...linhas].join('\n');
      const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.show(`${ocorrs.length} registros exportados`, 'success');
    } catch {
      Toast.show('Erro ao exportar CSV', 'error');
    }
  }
};
