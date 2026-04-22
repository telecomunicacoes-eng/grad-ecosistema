// ═══════════════════════════════════════
// GRAD Ecossistema — RELATÓRIOS
// PDF com gráficos · Excel · Filtros completos
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
            <div class="page-sub">Geração de relatórios operacionais · PDF com gráficos · Excel · CSV</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:20px">
          ${[
            { id:'geral',    icon:'📊', titulo:'Situação Geral',   sub:'Status atual de toda a rede' },
            { id:'ativos',   icon:'🔴', titulo:'Problemas Ativos', sub:'Ocorrências em aberto' },
            { id:'resolv',   icon:'✅', titulo:'Resolvidos',        sub:'Ocorrências encerradas no período' },
            { id:'risp',     icon:'🗺️', titulo:'Por RISP',         sub:'Desempenho por região' },
            { id:'metricas', icon:'📈', titulo:'Métricas',          sub:'MTTR e análise de falhas' },
          ].map(t => `
            <div class="card" style="cursor:pointer;transition:all .2s" id="rel-card-${t.id}"
                 onclick="Relatorio.selecionarTipo('${t.id}')">
              <div style="font-size:28px;margin-bottom:8px">${t.icon}</div>
              <div style="font-weight:700;color:var(--text);font-size:14px">${t.titulo}</div>
              <div style="font-size:12px;color:var(--text3);margin-top:4px">${t.sub}</div>
            </div>`).join('')}
        </div>

        <div class="card" id="rel-config" style="display:none">
          <div class="card-title" id="rel-config-title">Configurar Relatório</div>
          <div id="rel-config-body"></div>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-ghost" onclick="Relatorio.cancelar()">Cancelar</button>
            <button class="btn btn-primary" onclick="Relatorio.gerar()">📄 Gerar PDF</button>
            <button class="btn btn-ghost" onclick="Relatorio.exportarExcel()">📊 Excel</button>
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

  _periodoSelectHTML() {
    return `
      <select class="form-select" id="rc-periodo" onchange="Relatorio._onPeriodo()" style="width:190px">
        <option value="0">Hoje</option>
        <option value="3">Últimos 3 dias</option>
        <option value="7">Últimos 7 dias</option>
        <option value="15">Últimos 15 dias</option>
        <option value="30" selected>Últimos 30 dias</option>
        <option value="60">Últimos 60 dias</option>
        <option value="90">Últimos 90 dias</option>
        <option value="180">Últimos 6 meses</option>
        <option value="365">Último ano</option>
        <option value="custom">Personalizado</option>
      </select>`;
  },

  _datesPersonalizadasHTML() {
    const hoje  = new Date().toISOString().slice(0,10);
    const ha30  = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    return `
      <div id="rc-custom-dates" style="display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <div><label class="form-label">Data início</label>
          <input type="date" class="form-input" id="rc-ini" value="${ha30}"></div>
        <div><label class="form-label">Data fim</label>
          <input type="date" class="form-input" id="rc-fim" value="${hoje}"></div>
      </div>`;
  },

  selecionarTipo(tipo) {
    Relatorio._tipoAtual = tipo;
    document.querySelectorAll('[id^="rel-card-"]').forEach(el => {
      el.style.borderColor = ''; el.style.background = '';
    });
    const card = document.getElementById(`rel-card-${tipo}`);
    if (card) { card.style.borderColor = 'var(--accent2)'; card.style.background = 'rgba(61,155,255,.08)'; }

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
    const periodo  = Relatorio._periodoSelectHTML();
    const dates    = Relatorio._datesPersonalizadasHTML();

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
          <div><label class="form-label">Período</label>${periodo}</div>
          <div><label class="form-label">RISP</label>
            <select class="form-select" id="rc-risp"><option value="">Todas</option>${rispOpts}</select>
          </div>
        </div>${dates}`,
      risp: `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <div><label class="form-label">RISP</label>
            <select class="form-select" id="rc-risp"><option value="">Todas as RISPs</option>${rispOpts}</select>
          </div>
          <div><label class="form-label">Período</label>${periodo}</div>
        </div>${dates}`,
      metricas: `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <div><label class="form-label">Período</label>${periodo}</div>
          <div><label class="form-label">RISP (opcional)</label>
            <select class="form-select" id="rc-risp"><option value="">Todas as RISPs</option>${rispOpts}</select>
          </div>
        </div>${dates}`,
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
    const dias  = parseInt(periodo ?? '30');
    const hoje  = new Date().toISOString().slice(0,10);
    if (dias === 0) return { ini: hoje, fim: hoje };
    return {
      ini: new Date(Date.now() - dias*86400000).toISOString().slice(0,10),
      fim: hoje
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

    if (tipo === 'geral' || tipo === 'ativos') {
      let q = db.from('ocorrencias')
        .select('*, site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)')
        .neq('situacao', 'Operacional');
      if (sit)    q = q.eq('situacao', sit);
      if (rispId) q = q.eq('site.risp_id', rispId);
      const { data, error } = await q.order('inicio');
      if (error) throw error;
      const { count: total } = await db.from('sites').select('*',{count:'exact',head:true}).eq('ativo',true);
      return { ocorrencias: data||[], totalSites: total||0, tipo };
    }

    if (tipo === 'resolv') {
      let q = db.from('ocorrencias')
        .select('*, site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)')
        .not('fim', 'is', null);
      if (ini)    q = q.gte('fim', ini);
      if (fim)    q = q.lte('fim', fim + 'T23:59:59');
      if (rispId) q = q.eq('site.risp_id', rispId);
      const { data, error } = await q.order('fim', { ascending: false });
      if (error) throw error;
      return { ocorrencias: data||[], ini, fim, tipo };
    }

    if (tipo === 'risp') {
      let q = db.from('ocorrencias')
        .select('*, site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)');
      if (ini)    q = q.gte('inicio', ini);
      if (fim)    q = q.lte('inicio', fim + 'T23:59:59');
      if (rispId) q = q.eq('site.risp_id', rispId);
      const { data, error } = await q.order('inicio', { ascending: false });
      if (error) throw error;
      const { count: total } = await db.from('sites').select('*',{count:'exact',head:true}).eq('ativo',true);
      return { ocorrencias: data||[], ini, fim, totalSites: total||0, tipo };
    }

    if (tipo === 'metricas') {
      let q = db.from('ocorrencias')
        .select('id,inicio,fim,situacao,prazo,site:sites(nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)');
      if (ini)    q = q.gte('inicio', ini);
      if (fim)    q = q.lte('inicio', fim + 'T23:59:59');
      if (rispId) q = q.eq('site.risp_id', rispId);
      const { data, error } = await q.order('inicio');
      if (error) throw error;
      const { count: total } = await db.from('sites').select('*',{count:'exact',head:true}).eq('ativo',true);
      return { ocorrencias: data||[], ini, fim, totalSites: total||0, tipo };
    }

    return { ocorrencias: [], tipo };
  },

  // ══════════════════════════════════════
  // PDF — visual bonito com gráficos
  // ══════════════════════════════════════
  _abrirPDF(tipo, dados) {
    const titulos = {
      geral:    'Relatório de Situação da Rede',
      ativos:   'Relatório de Problemas Ativos',
      resolv:   'Relatório de Ocorrências Resolvidas',
      risp:     'Relatório por RISP',
      metricas: 'Relatório de Métricas Operacionais'
    };
    const titulo    = titulos[tipo] || 'Relatório';
    const emitidoEm = new Date().toLocaleString('pt-BR');
    const ocorrs    = dados.ocorrencias || [];

    // ── Métricas ─────────────────────────
    const inop = ocorrs.filter(o => o.situacao === 'Inoperante').length;
    const parc = ocorrs.filter(o => o.situacao?.includes('Parcial')).length;
    const inst = ocorrs.filter(o => o.situacao === 'Instável').length;
    const ml   = ocorrs.filter(o => o.situacao === 'Modo Local').length;
    const tot  = dados.totalSites || 0;
    const op   = Math.max(0, tot - inop - parc - inst - ml);
    const disp = tot ? Math.round(op / tot * 100) : 0;
    const fech = ocorrs.filter(o => o.fim);
    const mttr = fech.length
      ? (fech.map(o => (new Date(o.fim) - new Date(o.inicio)) / 86400000).reduce((a, b) => a + b, 0) / fech.length).toFixed(1)
      : null;

    // ── Dados para gráfico de status ─────
    const statusChart = { labels: [], values: [], colors: [] };
    if (inop > 0) { statusChart.labels.push('Inoperante'); statusChart.values.push(inop); statusChart.colors.push('#ef4444'); }
    if (parc > 0) { statusChart.labels.push('Parcial');    statusChart.values.push(parc); statusChart.colors.push('#f59e0b'); }
    if (inst > 0) { statusChart.labels.push('Instável');   statusChart.values.push(inst); statusChart.colors.push('#14b8a6'); }
    if (ml   > 0) { statusChart.labels.push('Modo Local'); statusChart.values.push(ml);   statusChart.colors.push('#a78bfa'); }
    if (op > 0 && tot > 0) { statusChart.labels.push('Operando'); statusChart.values.push(op); statusChart.colors.push('#22c55e'); }

    // ── Dados para gráfico de motivos ────
    const motivoCount = {};
    ocorrs.forEach(o => {
      const m = o.motivo?.descricao || 'Sem motivo';
      motivoCount[m] = (motivoCount[m] || 0) + 1;
    });
    const topMotivos = Object.entries(motivoCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const motivosChart = {
      labels: topMotivos.map(([l]) => l.length > 32 ? l.slice(0, 30) + '…' : l),
      values: topMotivos.map(([, v]) => v),
    };

    // ── RISP breakdown ───────────────────
    const rispMap = {};
    ocorrs.forEach(o => {
      const r = o.site?.risp?.nome || 'Sem RISP';
      if (!rispMap[r]) rispMap[r] = { total: 0, inop: 0, fech: 0, durTotal: 0 };
      rispMap[r].total++;
      if (o.situacao === 'Inoperante') rispMap[r].inop++;
      if (o.fim) { rispMap[r].fech++; rispMap[r].durTotal += (new Date(o.fim) - new Date(o.inicio)) / 86400000; }
    });
    const rispEntries = Object.entries(rispMap).sort((a, b) => b[1].inop - a[1].inop);
    const maxInop = Math.max(...rispEntries.map(([, v]) => v.inop), 1);

    // ── Linhas da tabela de detalhe ──────
    const corSit = s => ({ 'Inoperante':'#ef4444','Instável':'#14b8a6','Parcial/Em analise':'#f59e0b','Modo Local':'#a78bfa','Operacional':'#22c55e' }[s] || '#6b7280');
    const linhas = ocorrs.map(o => {
      const dias    = o.fim ? Math.floor((new Date(o.fim) - new Date(o.inicio)) / 86400000) : diffDays(o.inicio);
      const diasCor = dias > 30 ? '#ef4444' : dias > 7 ? '#f59e0b' : '#22c55e';
      return `<tr>
        <td>${o.site?.risp?.nome||'—'}</td>
        <td><strong style="color:#1e3a5f">${o.site?.nome||'—'}</strong></td>
        <td style="color:#64748b;font-size:8.5px">${o.site?.cidade||'—'}</td>
        <td><span style="color:${corSit(o.situacao)};font-weight:700">${o.situacao||'—'}</span></td>
        <td style="color:#475569;font-size:8.5px">${o.motivo?.descricao||'—'}</td>
        <td style="text-align:center;font-weight:700;color:${diasCor}">${dias}d</td>
        <td style="color:#475569">${formatDate(o.inicio)}</td>
        <td>${o.fim?formatDate(o.fim):'<span style="color:#f59e0b;font-weight:600">Ativo</span>'}</td>
        <td style="color:#64748b;font-size:8.5px">${o.glpi||o.os_numero||'—'}</td>
      </tr>`;
    }).join('');

    const periodoTexto = dados.ini
      ? `Período: ${formatDate(dados.ini)} a ${formatDate(dados.fim)}`
      : 'Situação atual';

    // Número de gráficos a renderizar (para sincronizar o print)
    let numCharts = 0;
    if (statusChart.labels.length  > 0) numCharts++;
    if (motivosChart.labels.length > 0) numCharts++;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><\/script>
<style>
  @page { size:A4 portrait; margin:1.2cm 1.5cm }
  *{ box-sizing:border-box; margin:0; padding:0 }
  body{ font-family:Arial,Helvetica,sans-serif; font-size:10px; color:#0f172a; background:#f0f4f8 }
  .page{ width:180mm; background:#fff; margin:0 auto; padding:8mm 8mm; min-height:277mm }

  .header{ background:linear-gradient(135deg,#1e3a5f 0%,#1a6fd4 100%); padding:10px 14px; border-radius:8px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:#fff }
  .header-org{ font-size:8px; opacity:.8; margin-bottom:3px; text-transform:uppercase; letter-spacing:.08em }
  .header-title{ font-size:16px; font-weight:800 }
  .header-period{ font-size:8.5px; opacity:.8; margin-top:3px }
  .header-meta{ text-align:right; font-size:8.5px; opacity:.9; line-height:1.7 }

  .kpi-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(60px,1fr)); gap:6px; margin-bottom:10px }
  .kpi{ background:#f8fafc; border-radius:6px; padding:6px 8px; text-align:center; border:1px solid #e2e8f0; border-top:3px solid #cbd5e1 }
  .kpi.navy  { border-top-color:#1e3a5f }
  .kpi.blue  { border-top-color:#3b82f6 }
  .kpi.green { border-top-color:#22c55e }
  .kpi.red   { border-top-color:#ef4444 }
  .kpi.teal  { border-top-color:#14b8a6 }
  .kpi.amber { border-top-color:#f59e0b }
  .kpi.purple{ border-top-color:#a78bfa }
  .kpi-label { font-size:7px; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px }
  .kpi-value { font-size:22px; font-weight:800; line-height:1; color:#0f172a }
  .kpi.blue .kpi-value   { color:#3b82f6 }
  .kpi.green .kpi-value  { color:#22c55e }
  .kpi.red .kpi-value    { color:#ef4444 }
  .kpi.teal .kpi-value   { color:#14b8a6 }
  .kpi.amber .kpi-value  { color:#f59e0b }
  .kpi.purple .kpi-value { color:#a78bfa }

  .avail-wrap{ margin-bottom:12px }
  .avail-label{ display:flex; justify-content:space-between; font-size:8.5px; color:#64748b; margin-bottom:3px }
  .avail-bar{ background:#e2e8f0; border-radius:4px; height:9px }
  .avail-fill{ height:9px; border-radius:4px }

  .charts-row{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px }
  .chart-card{ background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px }
  .chart-card-title{ font-size:8px; font-weight:700; color:#1e3a5f; text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid #e2e8f0 }
  .chart-card canvas,.chart-card img{ max-width:100%; display:block }

  .section-title{ font-size:9px; font-weight:700; color:#1e3a5f; text-transform:uppercase; letter-spacing:.08em; margin:12px 0 6px; padding-bottom:4px; border-bottom:2px solid #1e3a5f }
  table{ width:100%; border-collapse:collapse; margin-bottom:10px }
  thead th{ background:#1e3a5f; color:#fff; padding:5px 6px; text-align:left; font-size:8px; font-weight:600; letter-spacing:.04em }
  tbody td{ padding:4px 6px; border-bottom:1px solid #e2e8f0; vertical-align:middle; font-size:9px }
  tbody tr:nth-child(even) td{ background:#f8fafc }
  tbody tr:last-child td{ border-bottom:none }

  .mini-bar{ background:#fee2e2; border-radius:2px; height:4px; margin-top:3px; overflow:hidden }
  .mini-fill{ height:4px; border-radius:2px; background:#ef4444 }

  .footer{ margin-top:14px; padding-top:8px; border-top:2px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center }
  .footer-brand{ font-size:9px; font-weight:700; color:#1e3a5f }
  .footer-meta{ font-size:8px; color:#94a3b8; text-align:right; line-height:1.6 }

  @media print{ body{ background:#fff } .page{ margin:0 } }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="header-org">Secretaria de Estado de Segurança Pública — SESP/MT · Gerência de Radiocomunicação · GRAD</div>
      <div class="header-title">${titulo}</div>
      <div class="header-period">${periodoTexto}</div>
    </div>
    <div class="header-meta">
      <div>Emitido em</div>
      <div><strong>${emitidoEm}</strong></div>
      <div>Por: ${Auth.perfil?.nome || '—'}</div>
    </div>
  </div>

  <div class="kpi-grid">
    ${tot ? `<div class="kpi navy"><div class="kpi-label">Total NMS</div><div class="kpi-value">${tot}</div></div>` : ''}
    ${tot ? `<div class="kpi green"><div class="kpi-label">Disponível</div><div class="kpi-value">${disp}%</div></div>` : ''}
    <div class="kpi red"><div class="kpi-label">Inoperante</div><div class="kpi-value">${inop}</div></div>
    <div class="kpi teal"><div class="kpi-label">Instável</div><div class="kpi-value">${inst}</div></div>
    <div class="kpi amber"><div class="kpi-label">Parcial</div><div class="kpi-value">${parc}</div></div>
    <div class="kpi purple"><div class="kpi-label">Modo Local</div><div class="kpi-value">${ml}</div></div>
    ${mttr ? `<div class="kpi blue"><div class="kpi-label">MTTR (dias)</div><div class="kpi-value">${mttr}</div></div>` : ''}
    <div class="kpi"><div class="kpi-label">Resolvidos</div><div class="kpi-value">${fech.length}</div></div>
  </div>

  ${tot ? `
  <div class="avail-wrap">
    <div class="avail-label">
      <span>Disponibilidade da rede</span>
      <span style="font-weight:700;color:${disp>=90?'#22c55e':disp>=75?'#f59e0b':'#ef4444'}">${disp}%</span>
    </div>
    <div class="avail-bar">
      <div class="avail-fill" style="width:${disp}%;background:${disp>=90?'#22c55e':disp>=75?'#f59e0b':'#ef4444'}"></div>
    </div>
  </div>` : ''}

  ${statusChart.labels.length || motivosChart.labels.length ? `
  <div class="charts-row">
    ${statusChart.labels.length ? `
    <div class="chart-card">
      <div class="chart-card-title">Status da Rede</div>
      <canvas id="chart-status" width="240" height="160"></canvas>
    </div>` : ''}
    ${motivosChart.labels.length ? `
    <div class="chart-card">
      <div class="chart-card-title">Motivos de Falha</div>
      <canvas id="chart-motivos" width="240" height="160"></canvas>
    </div>` : ''}
  </div>` : ''}

  ${rispEntries.length ? `
  <div class="section-title">Resumo por RISP</div>
  <table>
    <thead><tr>
      <th>RISP</th>
      <th style="text-align:center">Total</th>
      <th style="text-align:center">Inop.</th>
      <th style="text-align:center">Resolvidos</th>
      <th style="text-align:center">MTTR</th>
    </tr></thead>
    <tbody>
      ${rispEntries.map(([nome, v]) => `
      <tr>
        <td><strong>${nome}</strong></td>
        <td style="text-align:center">${v.total}</td>
        <td style="text-align:center">
          <span style="color:#ef4444;font-weight:700">${v.inop}</span>
          <div class="mini-bar"><div class="mini-fill" style="width:${Math.round(v.inop/maxInop*100)}%"></div></div>
        </td>
        <td style="text-align:center;color:#22c55e;font-weight:600">${v.fech}</td>
        <td style="text-align:center">${v.fech ? (v.durTotal/v.fech).toFixed(1)+'d' : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}

  <div class="section-title">Detalhamento das Ocorrências (${ocorrs.length})</div>
  <table>
    <thead><tr>
      <th>RISP</th><th>Site</th><th>Município</th><th>Situação</th>
      <th>Motivo</th><th style="text-align:center">Dias</th>
      <th>Início</th><th>Fim</th><th>GLPI/OS</th>
    </tr></thead>
    <tbody>
      ${linhas || '<tr><td colspan="9" style="text-align:center;padding:14px;color:#94a3b8">Nenhum registro no período selecionado</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <div class="footer-brand">GRAD Ecossistema · SESP/MT</div>
    <div class="footer-meta">
      <div>${titulo}</div>
      <div>${emitidoEm}</div>
    </div>
  </div>
</div>

<script>
(function(){
  var _total = ${numCharts};
  var _done  = 0;
  function checkPrint(){
    _done++;
    if(_done >= _total) setTimeout(function(){ window.print(); }, 400);
  }
  if(_total === 0){ setTimeout(function(){ window.print(); }, 200); return; }

  ${statusChart.labels.length ? `
  (function(){
    var d = ${JSON.stringify(statusChart)};
    var el = document.getElementById('chart-status');
    if(!el){ checkPrint(); return; }
    new Chart(el.getContext('2d'),{
      type:'doughnut',
      data:{ labels:d.labels, datasets:[{ data:d.values, backgroundColor:d.colors, borderWidth:2, borderColor:'#fff', hoverOffset:0 }] },
      options:{
        responsive:false,
        plugins:{ legend:{ position:'right', labels:{ font:{size:8}, padding:6, boxWidth:10 } } },
        animation:{ onComplete:function(){
          var img=new Image(); img.src=this.toBase64Image(); img.style.cssText='max-width:100%;display:block';
          this.canvas.parentNode.replaceChild(img,this.canvas); checkPrint();
        }}
      }
    });
  })();` : ''}

  ${motivosChart.labels.length ? `
  (function(){
    var d = ${JSON.stringify(motivosChart)};
    var el = document.getElementById('chart-motivos');
    if(!el){ checkPrint(); return; }
    new Chart(el.getContext('2d'),{
      type:'bar',
      data:{ labels:d.labels, datasets:[{ data:d.values, backgroundColor:'#1a6fd4', borderRadius:3 }] },
      options:{
        indexAxis:'y',
        responsive:false,
        plugins:{ legend:{ display:false } },
        scales:{
          x:{ grid:{color:'#f1f5f9'}, ticks:{font:{size:8},color:'#64748b'}, border:{display:false} },
          y:{ grid:{display:false}, ticks:{font:{size:8},color:'#374151'}, border:{display:false} }
        },
        animation:{ onComplete:function(){
          var img=new Image(); img.src=this.toBase64Image(); img.style.cssText='max-width:100%;display:block';
          this.canvas.parentNode.replaceChild(img,this.canvas); checkPrint();
        }}
      }
    });
  })();` : ''}
})();
<\/script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=980,height=800,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Popup bloqueado — permita popups no navegador', 'error');
  },

  // ══════════════════════════════════════
  // EXCEL — SheetJS, múltiplas abas
  // ══════════════════════════════════════
  async exportarExcel() {
    const tipo = Relatorio._tipoAtual;
    if (!tipo) { Toast.show('Selecione um tipo de relatório', 'error'); return; }
    if (typeof XLSX === 'undefined') { Toast.show('Biblioteca Excel não carregada. Recarregue a página.', 'error'); return; }

    const btns = document.querySelectorAll('#rel-config .btn-ghost');
    const btn  = btns[1]; // botão Excel
    if (btn) { btn.textContent = '⏳ Gerando...'; btn.disabled = true; }

    try {
      const dados  = await Relatorio._buscarDados(tipo);
      const ocorrs = dados.ocorrencias || [];

      // ── Resumo ──────────────────────────
      const inop  = ocorrs.filter(o => o.situacao === 'Inoperante').length;
      const parc  = ocorrs.filter(o => o.situacao?.includes('Parcial')).length;
      const inst  = ocorrs.filter(o => o.situacao === 'Instável').length;
      const ml    = ocorrs.filter(o => o.situacao === 'Modo Local').length;
      const fech  = ocorrs.filter(o => o.fim);
      const tot   = dados.totalSites || 0;
      const op    = Math.max(0, tot - inop - parc - inst - ml);
      const disp  = tot ? Math.round(op/tot*100) : 0;
      const mttr  = fech.length
        ? (fech.map(o => (new Date(o.fim)-new Date(o.inicio))/86400000).reduce((a,b)=>a+b,0) / fech.length).toFixed(1)
        : '—';

      const wbResumo = [
        { 'Métrica': 'Relatório',           'Valor': ({ geral:'Situação Geral',ativos:'Problemas Ativos',resolv:'Resolvidos',risp:'Por RISP',metricas:'Métricas' }[tipo] || tipo) },
        { 'Métrica': 'Período',             'Valor': dados.ini ? `${formatDate(dados.ini)} a ${formatDate(dados.fim)}` : 'Situação atual' },
        { 'Métrica': 'Emitido em',          'Valor': new Date().toLocaleString('pt-BR') },
        { 'Métrica': 'Por',                 'Valor': Auth.perfil?.nome || '—' },
        { 'Métrica': '',                    'Valor': '' },
        { 'Métrica': 'Total NMS',           'Valor': tot || '—' },
        { 'Métrica': 'Disponibilidade',     'Valor': tot ? disp + '%' : '—' },
        { 'Métrica': 'Operando',            'Valor': tot ? op : '—' },
        { 'Métrica': 'Inoperantes',         'Valor': inop },
        { 'Métrica': 'Instáveis',           'Valor': inst },
        { 'Métrica': 'Parcial/Em Análise',  'Valor': parc },
        { 'Métrica': 'Modo Local',          'Valor': ml },
        { 'Métrica': 'Resolvidos',          'Valor': fech.length },
        { 'Métrica': 'MTTR (dias)',         'Valor': mttr },
        { 'Métrica': 'Total Ocorrências',   'Valor': ocorrs.length },
      ];

      // ── Ocorrências detalhadas ──────────
      const wbOcorrs = ocorrs.length ? ocorrs.map(o => {
        const dias = o.fim
          ? Math.floor((new Date(o.fim)-new Date(o.inicio))/86400000)
          : diffDays(o.inicio);
        return {
          'RISP':        o.site?.risp?.nome || '—',
          'Site':        o.site?.nome || '—',
          'Município':   o.site?.cidade || '—',
          'Situação':    o.situacao || '—',
          'Motivo':      o.motivo?.descricao || '—',
          'Dias':        dias,
          'Início':      formatDate(o.inicio),
          'Fim':         o.fim ? formatDate(o.fim) : 'Ativo',
          'Prazo':       o.prazo || '—',
          'GLPI/OS':     o.glpi || o.os_numero || '—',
          'Operador':    o.operador || '—',
          'Ação':        o.acao || '—',
          'Observações': o.consideracoes || o.observacoes || '—',
        };
      }) : [{ 'Info': 'Nenhum registro no período selecionado' }];

      // ── Por RISP ────────────────────────
      const rispMap = {};
      ocorrs.forEach(o => {
        const r = o.site?.risp?.nome || 'Sem RISP';
        if (!rispMap[r]) rispMap[r] = { total:0, inop:0, parc:0, inst:0, ml:0, fech:0, durTotal:0 };
        rispMap[r].total++;
        if (o.situacao === 'Inoperante')           rispMap[r].inop++;
        if (o.situacao?.includes('Parcial'))       rispMap[r].parc++;
        if (o.situacao === 'Instável')             rispMap[r].inst++;
        if (o.situacao === 'Modo Local')           rispMap[r].ml++;
        if (o.fim) { rispMap[r].fech++; rispMap[r].durTotal += (new Date(o.fim)-new Date(o.inicio))/86400000; }
      });
      const wbRisp = Object.entries(rispMap).sort((a,b) => b[1].inop - a[1].inop).map(([nome, v]) => ({
        'RISP':          nome,
        'Total':         v.total,
        'Inoperantes':   v.inop,
        'Parcial':       v.parc,
        'Instáveis':     v.inst,
        'Modo Local':    v.ml,
        'Resolvidos':    v.fech,
        'MTTR (dias)':   v.fech ? (v.durTotal/v.fech).toFixed(1) : '—',
      }));

      // ── Motivos ─────────────────────────
      const motivoMap = {};
      ocorrs.forEach(o => {
        const m = o.motivo?.descricao || 'Sem motivo';
        motivoMap[m] = (motivoMap[m]||0)+1;
      });
      const wbMotivos = Object.entries(motivoMap).sort((a,b) => b[1]-a[1]).map(([motivo, count]) => ({
        'Motivo':       motivo,
        'Ocorrências':  count,
        '%':            ocorrs.length ? ((count/ocorrs.length)*100).toFixed(1)+'%' : '0%',
      }));

      // ── Montar workbook ─────────────────
      const wb  = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(wbResumo);
      const ws2 = XLSX.utils.json_to_sheet(wbOcorrs);
      const ws3 = XLSX.utils.json_to_sheet(wbRisp.length   ? wbRisp   : [{ 'Info': 'Sem dados' }]);
      const ws4 = XLSX.utils.json_to_sheet(wbMotivos.length ? wbMotivos : [{ 'Info': 'Sem dados' }]);

      // Largura das colunas
      ws1['!cols'] = [{ wch: 22 }, { wch: 40 }];
      ws2['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 16 }, { wch: 18 }, { wch: 35 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 35 }, { wch: 40 }];
      ws3['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
      ws4['!cols'] = [{ wch: 40 }, { wch: 14 }, { wch: 8 }];

      XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
      XLSX.utils.book_append_sheet(wb, ws2, 'Ocorrências');
      XLSX.utils.book_append_sheet(wb, ws3, 'Por RISP');
      XLSX.utils.book_append_sheet(wb, ws4, 'Motivos');

      const nomes = { geral:'situacao_geral', ativos:'problemas_ativos', resolv:'resolvidos', risp:'por_risp', metricas:'metricas' };
      XLSX.writeFile(wb, `GRAD_${nomes[tipo]||tipo}_${new Date().toISOString().slice(0,10)}.xlsx`);
      Toast.show('Excel gerado com sucesso!', 'success');

    } catch(e) {
      Toast.show('Erro ao gerar Excel: ' + (e.message||''), 'error');
    } finally {
      if (btn) { btn.textContent = '📊 Excel'; btn.disabled = false; }
    }
  },

  // ══════════════════════════════════════
  // CSV
  // ══════════════════════════════════════
  async exportarCSV() {
    const tipo = Relatorio._tipoAtual;
    if (!tipo) { Toast.show('Selecione um tipo de relatório', 'error'); return; }
    try {
      const dados  = await Relatorio._buscarDados(tipo);
      const ocorrs = dados.ocorrencias || [];
      const headers = ['RISP','Site','Município','Situação','Motivo','Dias','Início','Fim','GLPI/OS','Operador','Ação','Observações'];
      const linhas  = ocorrs.map(o => {
        const dias = o.fim
          ? Math.floor((new Date(o.fim)-new Date(o.inicio))/86400000)
          : diffDays(o.inicio);
        return [
          o.site?.risp?.nome||'', o.site?.nome||'', o.site?.cidade||'',
          o.situacao||'', o.motivo?.descricao||'', dias,
          formatDate(o.inicio), o.fim ? formatDate(o.fim) : 'Ativo',
          o.glpi||o.os_numero||'', o.operador||'', o.acao||'',
          (o.consideracoes||o.observacoes||'').replace(/"/g,"'")
        ].map(v => `"${v}"`).join(',');
      });
      const csv  = [headers.join(','), ...linhas].join('\n');
      const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `GRAD_${tipo}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      Toast.show(`${ocorrs.length} registros exportados`, 'success');
    } catch(e) {
      Toast.show('Erro ao exportar: ' + (e.message||''), 'error');
    }
  }
};
