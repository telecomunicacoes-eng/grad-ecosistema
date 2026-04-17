// ═══════════════════════════════════════
// GRAD Ecossistema — RELATÓRIOS
// 5 tipos, 8 períodos, PDF + CSV
// ═══════════════════════════════════════

const Relatorio = {
  _tipoAtual: null,
  _risps: [],

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Relatórios</div>
            <div class="page-sub">Geração de relatórios operacionais</div>
          </div>
        </div>

        <!-- Seletor de tipo (5 cards) -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:20px">
          ${[
            { id:'geral',    icon:'📊', titulo:'Situação Geral',      sub:'Status atual de toda a rede' },
            { id:'ativos',   icon:'🔴', titulo:'Problemas Ativos',     sub:'Ocorrências em aberto' },
            { id:'resolv',   icon:'✅', titulo:'Resolvidos',           sub:'Ocorrências encerradas no período' },
            { id:'risp',     icon:'🗺️', titulo:'Por RISP',            sub:'Desempenho por região' },
            { id:'metricas', icon:'📈', titulo:'Métricas',             sub:'MTTR, MTBF e análise de falhas' },
          ].map(t => `
            <div class="card" style="cursor:pointer;transition:all .2s" id="rel-card-${t.id}"
                 onclick="Relatorio.selecionarTipo('${t.id}')">
              <div style="font-size:26px;margin-bottom:8px">${t.icon}</div>
              <div style="font-weight:700;color:var(--text);font-size:13px">${t.titulo}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:3px">${t.sub}</div>
            </div>`).join('')}
        </div>

        <!-- Configuração -->
        <div class="card" id="rel-config" style="display:none">
          <div class="card-title" id="rel-config-title">Configurar Relatório</div>
          <div id="rel-config-body"></div>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            <button class="btn btn-ghost" onclick="Relatorio.cancelar()">Cancelar</button>
            <button class="btn btn-primary" onclick="Relatorio.gerar()">📄 Gerar PDF</button>
            <button class="btn btn-ghost" onclick="Relatorio.exportarCSV()">↓ CSV</button>
          </div>
        </div>

        <div id="rel-preview"></div>
      </div>`;

    await Relatorio._carregarFiltros();
  },

  async _carregarFiltros() {
    try {
      Relatorio._risps = await dbQuery(d => d.from('risps').select('id,nome').order('nome')) || [];
    } catch { Relatorio._risps = []; }
  },

  selecionarTipo(tipo) {
    Relatorio._tipoAtual = tipo;

    document.querySelectorAll('[id^="rel-card-"]').forEach(el => {
      el.style.borderColor = '';
      el.style.background  = '';
    });
    const card = document.getElementById(`rel-card-${tipo}`);
    if (card) { card.style.borderColor = 'var(--accent)'; card.style.background = 'rgba(59,130,246,.08)'; }

    const cfg = document.getElementById('rel-config');
    if (!cfg) return;
    cfg.style.display = 'block';

    const titulos = {
      geral:    'Situação Geral da Rede',
      ativos:   'Problemas Ativos',
      resolv:   'Ocorrências Resolvidas',
      risp:     'Relatório por RISP',
      metricas: 'Métricas Operacionais'
    };
    document.getElementById('rel-config-title').textContent = titulos[tipo] || 'Configurar';

    const rispOpts = Relatorio._risps.map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
    const hoje     = new Date().toISOString().slice(0,10);
    const ha30     = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);

    const periodoSelect = `
      <select class="form-select" id="rc-periodo" onchange="Relatorio._onPeriodo()" style="width:160px">
        <option value="7">Últimos 7 dias</option>
        <option value="15">Últimos 15 dias</option>
        <option value="30" selected>Últimos 30 dias</option>
        <option value="60">Últimos 60 dias</option>
        <option value="90">Últimos 90 dias</option>
        <option value="180">Últimos 6 meses</option>
        <option value="365">Último ano</option>
        <option value="custom">Personalizado</option>
      </select>`;

    const datesPersonalizadas = `
      <div id="rc-custom-dates" style="display:none;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label class="form-label">Data início</label>
          <input type="date" class="form-input" id="rc-ini" value="${ha30}"></div>
        <div><label class="form-label">Data fim</label>
          <input type="date" class="form-input" id="rc-fim" value="${hoje}"></div>
      </div>`;

    const corpos = {
      geral: `
        <div class="form-grid form-grid-2">
          <div>
            <label class="form-label">Data de referência</label>
            <input type="date" class="form-input" id="rc-data" value="${hoje}">
          </div>
          <div>
            <label class="form-label">Filtrar por RISP</label>
            <select class="form-select" id="rc-risp"><option value="">Todas as RISPs</option>${rispOpts}</select>
          </div>
        </div>`,
      ativos: `
        <div class="form-grid form-grid-2">
          <div>
            <label class="form-label">Situação</label>
            <select class="form-select" id="rc-sit">
              <option value="">Todas</option>
              <option>Inoperante</option>
              <option>Instável</option>
              <option>Parcial/Em analise</option>
              <option>Modo Local</option>
            </select>
          </div>
          <div>
            <label class="form-label">RISP</label>
            <select class="form-select" id="rc-risp"><option value="">Todas</option>${rispOpts}</select>
          </div>
        </div>`,
      resolv: `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <div>
            <label class="form-label">Período</label>
            ${periodoSelect}
          </div>
          <div>
            <label class="form-label">RISP</label>
            <select class="form-select" id="rc-risp"><option value="">Todas</option>${rispOpts}</select>
          </div>
        </div>
        ${datesPersonalizadas}`,
      risp: `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <div>
            <label class="form-label">RISP</label>
            <select class="form-select" id="rc-risp"><option value="">Todas as RISPs</option>${rispOpts}</select>
          </div>
          <div>
            <label class="form-label">Período</label>
            ${periodoSelect}
          </div>
        </div>
        ${datesPersonalizadas}`,
      metricas: `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <div>
            <label class="form-label">Período</label>
            ${periodoSelect}
          </div>
          <div>
            <label class="form-label">RISP (opcional)</label>
            <select class="form-select" id="rc-risp"><option value="">Todas as RISPs</option>${rispOpts}</select>
          </div>
        </div>
        ${datesPersonalizadas}`
    };

    document.getElementById('rel-config-body').innerHTML = corpos[tipo] || '';
  },

  _onPeriodo() {
    const v   = document.getElementById('rc-periodo')?.value;
    const div = document.getElementById('rc-custom-dates');
    if (div) div.style.display = v === 'custom' ? 'grid' : 'none';
  },

  _getPeriodoDates() {
    const periodo = document.getElementById('rc-periodo')?.value;
    if (periodo === 'custom') {
      return {
        ini: document.getElementById('rc-ini')?.value,
        fim: document.getElementById('rc-fim')?.value
      };
    }
    const dias = parseInt(periodo || '30');
    return {
      ini: new Date(Date.now() - dias*86400000).toISOString().slice(0,10),
      fim: new Date().toISOString().slice(0,10)
    };
  },

  cancelar() {
    document.getElementById('rel-config').style.display = 'none';
    document.getElementById('rel-preview').innerHTML    = '';
    document.querySelectorAll('[id^="rel-card-"]').forEach(el => {
      el.style.borderColor = ''; el.style.background = '';
    });
    Relatorio._tipoAtual = null;
  },

  async gerar() {
    const tipo = Relatorio._tipoAtual;
    if (!tipo) return;

    const btn = document.querySelector('#rel-config .btn-primary');
    if (btn) { btn.textContent = '⏳ Gerando...'; btn.disabled = true; }

    try {
      const dados = await Relatorio._buscarDados(tipo);
      Relatorio._abrirPDF(tipo, dados);
    } catch(e) {
      Toast.show('Erro ao gerar relatório: ' + (e.message||''), 'error');
    } finally {
      if (btn) { btn.textContent = '📄 Gerar PDF'; btn.disabled = false; }
    }
  },

  async _buscarDados(tipo) {
    const rispId = document.getElementById('rc-risp')?.value || null;
    const { ini, fim } = Relatorio._getPeriodoDates();
    const sit = document.getElementById('rc-sit')?.value || null;

    if (tipo === 'geral') {
      let q = db.from('ocorrencias')
        .select('*, site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)')
        .neq('situacao', 'Operacional');
      const { data, error } = await q.order('inicio');
      if (error) throw error;
      const { count: total } = await db.from('sites').select('*',{count:'exact',head:true}).eq('ativo',true);
      return { ocorrencias: data||[], totalSites: total||0, tipo };
    }

    if (tipo === 'ativos') {
      let q = db.from('ocorrencias')
        .select('*, site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)')
        .neq('situacao', 'Operacional');
      if (sit)    q = q.eq('situacao', sit);
      const { data, error } = await q.order('inicio');
      if (error) throw error;
      const { count: total } = await db.from('sites').select('*',{count:'exact',head:true}).eq('ativo',true);
      return { ocorrencias: data||[], totalSites: total||0, tipo };
    }

    if (tipo === 'resolv') {
      let q = db.from('ocorrencias')
        .select('*, site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)')
        .not('fim', 'is', null);
      if (ini) q = q.gte('fim', ini);
      if (fim) q = q.lte('fim', fim + 'T23:59:59');
      const { data, error } = await q.order('fim', { ascending: false });
      if (error) throw error;
      return { ocorrencias: data||[], ini, fim, tipo };
    }

    if (tipo === 'risp') {
      let q = db.from('ocorrencias')
        .select('*, site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)');
      if (ini) q = q.gte('inicio', ini);
      if (fim) q = q.lte('inicio', fim + 'T23:59:59');
      const { data, error } = await q.order('inicio', { ascending: false });
      if (error) throw error;
      const { count: total } = await db.from('sites').select('*',{count:'exact',head:true}).eq('ativo',true);
      return { ocorrencias: data||[], ini, fim, totalSites: total||0, tipo };
    }

    if (tipo === 'metricas') {
      let q = db.from('ocorrencias')
        .select('id,inicio,fim,situacao,site:sites(nome,risp:risps(nome)), motivo:motivos_falha(descricao)');
      if (ini) q = q.gte('inicio', ini);
      if (fim) q = q.lte('inicio', fim + 'T23:59:59');
      const { data, error } = await q.order('inicio');
      if (error) throw error;
      const { count: total } = await db.from('sites').select('*',{count:'exact',head:true}).eq('ativo',true);
      return { ocorrencias: data||[], ini, fim, totalSites: total||0, tipo };
    }

    return { ocorrencias: [], tipo };
  },

  _abrirPDF(tipo, dados) {
    const titulos = {
      geral:    'Relatório de Situação da Rede',
      ativos:   'Relatório de Problemas Ativos',
      resolv:   'Relatório de Ocorrências Resolvidas',
      risp:     'Relatório por RISP',
      metricas: 'Relatório de Métricas Operacionais'
    };
    const titulo     = titulos[tipo];
    const emitidoEm  = new Date().toLocaleString('pt-BR');
    const ocorrs     = dados.ocorrencias || [];

    const corSit = s => ({
      'Inoperante':        '#ef4444',
      'Instável':          '#14b8a6',
      'Parcial/Em analise':'#fbbf24',
      'Modo Local':        '#a78bfa',
      'Operacional':       '#22c55e',
    }[s] || '#6b7280');

    // Cálculo de métricas
    const fechadas = ocorrs.filter(o => o.fim);
    let mttr = 0;
    if (fechadas.length) {
      const somas = fechadas.map(o => Math.max(0,(new Date(o.fim)-new Date(o.inicio))/86400000));
      mttr = (somas.reduce((a,b)=>a+b,0) / somas.length).toFixed(1);
    }

    const inop = ocorrs.filter(o=>o.situacao==='Inoperante').length;
    const parc = ocorrs.filter(o=>o.situacao==='Parcial/Em analise').length;
    const ml   = ocorrs.filter(o=>o.situacao==='Modo Local').length;
    const inst = ocorrs.filter(o=>o.situacao==='Instável').length;
    const tot  = dados.totalSites || 0;
    const op   = Math.max(0, tot - inop - inst - parc - ml);
    const disp = tot ? Math.round(op/tot*100) : 0;

    // Tabela principal
    const linhas = ocorrs.map(o => {
      const dias = o.fim
        ? Math.floor((new Date(o.fim)-new Date(o.inicio))/86400000)
        : diffDays(o.inicio);
      return `
        <tr>
          <td>${o.site?.risp?.nome||'—'}</td>
          <td><strong>${o.site?.nome||'—'}</strong></td>
          <td style="font-size:10px">${o.site?.cidade||'—'}</td>
          <td><span style="color:${corSit(o.situacao)};font-weight:600">${o.situacao||'—'}</span></td>
          <td style="font-size:10px">${o.motivo?.descricao||'—'}</td>
          <td style="text-align:center">${dias}d</td>
          <td style="font-size:10px">${formatDate(o.inicio)}</td>
          <td style="font-size:10px">${o.fim?formatDate(o.fim):'<span style="color:#fbbf24">Ativo</span>'}</td>
          <td style="font-size:10px">${o.glpi||o.os_numero||'—'}</td>
          <td style="font-size:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis">${o.consideracoes||o.observacoes||'—'}</td>
        </tr>`;
    }).join('');

    // Tabela por RISP (para tipo risp/métricas)
    let tabelaRisp = '';
    if (['risp','metricas','geral'].includes(tipo)) {
      const rispMap = {};
      ocorrs.forEach(o => {
        const r = o.site?.risp?.nome || 'Sem RISP';
        if (!rispMap[r]) rispMap[r] = { total: 0, inop: 0, fechado: 0, durTotal: 0 };
        rispMap[r].total++;
        if (o.situacao==='Inoperante') rispMap[r].inop++;
        if (o.fim) {
          rispMap[r].fechado++;
          rispMap[r].durTotal += (new Date(o.fim)-new Date(o.inicio))/86400000;
        }
      });
      const rispLinhas = Object.entries(rispMap)
        .sort((a,b)=>b[1].inop-a[1].inop)
        .map(([nome,v]) => `
          <tr>
            <td><strong>${nome}</strong></td>
            <td style="text-align:center">${v.total}</td>
            <td style="text-align:center;color:#ef4444">${v.inop}</td>
            <td style="text-align:center;color:#22c55e">${v.fechado}</td>
            <td style="text-align:center">${v.fechado?( v.durTotal/v.fechado).toFixed(1)+'d':'—'}</td>
          </tr>`).join('');
      if (rispLinhas) {
        tabelaRisp = `
          <h3 style="margin:16px 0 8px;font-size:12px;color:#1e3a5f;border-bottom:1px solid #e2e8f0;padding-bottom:4px">RESUMO POR RISP</h3>
          <table>
            <thead><tr>
              <th>RISP</th><th style="text-align:center">Total</th>
              <th style="text-align:center">Inop.</th><th style="text-align:center">Resolvidos</th>
              <th style="text-align:center">MTTR médio</th>
            </tr></thead>
            <tbody>${rispLinhas}</tbody>
          </table>`;
      }
    }

    // Bloco de métricas (só para tipo=metricas)
    let blocoMetricas = '';
    if (tipo === 'metricas') {
      const motivoMap = {};
      ocorrs.forEach(o => {
        const m = o.motivo?.descricao || 'Sem motivo';
        motivoMap[m] = (motivoMap[m]||0)+1;
      });
      const topMotivos = Object.entries(motivoMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
      blocoMetricas = `
        <h3 style="margin:16px 0 8px;font-size:12px;color:#1e3a5f;border-bottom:1px solid #e2e8f0;padding-bottom:4px">TOP MOTIVOS DE FALHA</h3>
        <table>
          <thead><tr><th>Motivo</th><th style="text-align:center">Ocorrências</th><th style="text-align:center">%</th></tr></thead>
          <tbody>
            ${topMotivos.map(([m,c])=>`
              <tr><td>${m}</td><td style="text-align:center">${c}</td>
              <td style="text-align:center">${ocorrs.length?(c/ocorrs.length*100).toFixed(0):0}%</td></tr>`).join('')}
          </tbody>
        </table>`;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  @page{size:A4 portrait;margin:1.5cm 1.8cm 1.8cm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Arial',sans-serif;font-size:11px;color:#0f172a;background:#f0f4f8}
  .page{width:174mm;min-height:257mm;background:#fff;margin:0 auto;padding:12mm 10mm}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #1e3a5f}
  .gov-logo{display:flex;align-items:center;gap:10px}
  .gov-escudo{width:34px;height:34px;background:#1e3a5f;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px}
  .gov-text .gov-title{font-size:11px;font-weight:700;color:#1e3a5f}
  .gov-text .gov-sub{font-size:9px;color:#475569}
  .doc-info{text-align:right;font-size:9px;color:#64748b}
  .rel-title{font-size:15px;font-weight:800;color:#1e3a5f;margin-bottom:2px;text-align:center}
  .rel-sub{font-size:9px;color:#64748b;text-align:center;margin-bottom:10px}
  .kpi-row{display:flex;gap:6px;margin-bottom:12px}
  .kpi{flex:1;background:#f1f5f9;border-radius:5px;padding:6px 8px;text-align:center;border-top:3px solid #1e3a5f}
  .kpi.red{border-top-color:#ef4444}.kpi.green{border-top-color:#22c55e}
  .kpi.amber{border-top-color:#fbbf24}.kpi.purple{border-top-color:#a78bfa}
  .kpi.teal{border-top-color:#14b8a6}.kpi.blue{border-top-color:#3b82f6}
  .kpi-label{font-size:8px;color:#64748b;margin-bottom:1px}
  .kpi-value{font-size:16px;font-weight:800;color:#0f172a}
  h3{font-size:11px;font-weight:700;color:#1e3a5f;margin:12px 0 6px;border-bottom:1px solid #e2e8f0;padding-bottom:3px}
  table{width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:8px}
  th{background:#1e3a5f;color:#fff;padding:4px 5px;text-align:left;font-weight:600;font-size:8.5px}
  td{padding:3px 5px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
  tr:nth-child(even) td{background:#f8fafc}
  .disp-bar{background:#e2e8f0;border-radius:4px;height:6px;margin-top:4px}
  .disp-fill{height:6px;border-radius:4px;background:#22c55e}
  .footer{margin-top:12px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}
  @media print{body{background:#fff}.page{margin:0;box-shadow:none}}
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
      ${dados.ini ? `<div>Período: ${formatDate(dados.ini)} a ${formatDate(dados.fim)}</div>` : ''}
    </div>
  </div>

  <div class="rel-title">${titulo}</div>
  <div class="rel-sub">${ocorrs.length} registro(s) · Gerado em ${emitidoEm}</div>

  <div class="kpi-row">
    ${tot ? `<div class="kpi blue"><div class="kpi-label">Total NMS</div><div class="kpi-value">${tot}</div></div>` : ''}
    ${tot ? `<div class="kpi green"><div class="kpi-label">Disponibilidade</div><div class="kpi-value">${disp}%</div></div>` : ''}
    <div class="kpi red"><div class="kpi-label">Inoperantes</div><div class="kpi-value">${inop}</div></div>
    <div class="kpi teal"><div class="kpi-label">Instáveis</div><div class="kpi-value">${inst}</div></div>
    <div class="kpi amber"><div class="kpi-label">Parcial</div><div class="kpi-value">${parc}</div></div>
    <div class="kpi purple"><div class="kpi-label">Modo Local</div><div class="kpi-value">${ml}</div></div>
    ${fechadas.length ? `<div class="kpi"><div class="kpi-label">MTTR</div><div class="kpi-value">${mttr}d</div></div>` : ''}
    <div class="kpi"><div class="kpi-label">Resolvidos</div><div class="kpi-value">${fechadas.length}</div></div>
  </div>

  ${tot ? `
  <div style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#475569;margin-bottom:2px">
      <span>Disponibilidade da rede</span><span>${disp}%</span>
    </div>
    <div class="disp-bar"><div class="disp-fill" style="width:${disp}%;background:${disp>=90?'#22c55e':disp>=75?'#fbbf24':'#ef4444'}"></div></div>
  </div>` : ''}

  ${tabelaRisp}

  <h3>DETALHAMENTO DAS OCORRÊNCIAS</h3>
  <table>
    <thead>
      <tr>
        <th>RISP</th><th>Site</th><th>Município</th><th>Situação</th><th>Motivo</th>
        <th>Dias</th><th>Início</th><th>Fim</th><th>GLPI/OS</th><th>Considerações</th>
      </tr>
    </thead>
    <tbody>
      ${linhas || '<tr><td colspan="10" style="text-align:center;padding:10px;color:#94a3b8">Nenhum registro</td></tr>'}
    </tbody>
  </table>

  ${blocoMetricas}

  <div class="footer">
    <span>GRAD Ecossistema · Sistema de Gestão Operacional · SESP/MT</span>
    <span>${titulo} · ${emitidoEm}</span>
  </div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=950,height=750,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Popup bloqueado — permita popups', 'error');
  },

  async exportarCSV() {
    const tipo = Relatorio._tipoAtual;
    if (!tipo) { Toast.show('Selecione um tipo de relatório', 'error'); return; }

    try {
      const dados  = await Relatorio._buscarDados(tipo);
      const ocorrs = dados.ocorrencias || [];

      const headers = ['RISP','Site','Município','Situação','Motivo','Dias','Início','Fim','GLPI/OS','Operador','Considerações'];
      const linhas  = ocorrs.map(o => {
        const dias = o.fim
          ? Math.floor((new Date(o.fim)-new Date(o.inicio))/86400000)
          : diffDays(o.inicio);
        return [
          o.site?.risp?.nome||'',
          o.site?.nome||'',
          o.site?.cidade||'',
          o.situacao||'',
          o.motivo?.descricao||'',
          dias,
          formatDate(o.inicio),
          o.fim ? formatDate(o.fim) : 'Ativo',
          o.glpi||o.os_numero||'',
          o.operador||'',
          (o.consideracoes||o.observacoes||'').replace(/"/g,"'")
        ].map(v=>`"${v}"`).join(',');
      });

      const csv  = [headers.join(','), ...linhas].join('\n');
      const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `relatorio_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.show(`${ocorrs.length} registros exportados`, 'success');
    } catch(e) {
      Toast.show('Erro ao exportar: ' + (e.message||''), 'error');
    }
  }
};
