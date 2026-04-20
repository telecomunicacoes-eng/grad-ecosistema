// ═══════════════════════════════════════
// GRAD Ecossistema — COMUNICAÇÕES / RÁDIO
// Frotas TETRA · GSSI · Chamadas por força
// SESP-MT — Mato Grosso
// ═══════════════════════════════════════

const Comunicacoes = {
  _charts: {},

  // ── MOCK DATA ─────────────────────────
  _frotas: [
    { id: 1, gssi: 1001, nome: 'ALFA-1',              forca: 'PM-MT',  risp: 'RISP 1 — Cuiabá',      radios: 24, status: 'Ativo', ultima_atividade: '2026-04-16' },
    { id: 2, gssi: 1002, nome: 'BRAVO-2',             forca: 'PM-MT',  risp: 'RISP 2 — Rondonópolis', radios: 18, status: 'Ativo', ultima_atividade: '2026-04-16' },
    { id: 3, gssi: 2001, nome: 'PATRULHA NORTE',      forca: 'PRF',    risp: 'RISP 3 — Sinop',        radios: 12, status: 'Ativo', ultima_atividade: '2026-04-15' },
    { id: 4, gssi: 3001, nome: 'FRONTEIRA SUL',       forca: 'GEFRON', risp: 'RISP 4 — Cáceres',      radios: 20, status: 'Ativo', ultima_atividade: '2026-04-14' },
    { id: 5, gssi: 4001, nome: 'OPERAÇÕES ESPECIAIS', forca: 'BOPE',   risp: 'RISP 1 — Cuiabá',       radios: 8,  status: 'Ativo', ultima_atividade: '2026-04-13' },
    { id: 6, gssi: 5001, nome: 'DELTA-CIVIL',         forca: 'PCMT',   risp: 'RISP 2 — Rondonópolis', radios: 15, status: 'Ativo', ultima_atividade: '2026-04-16' },
    { id: 7, gssi: 6001, nome: 'RESGATE CENTRO',      forca: 'CBMMT',  risp: 'RISP 1 — Cuiabá',       radios: 0,  status: 'Inativo', ultima_atividade: '2026-03-01' },
    { id: 8, gssi: 7001, nome: 'FISCAL LESTE',        forca: 'SEFAZ',  risp: 'RISP 3 — Sinop',        radios: 6,  status: 'Ativo', ultima_atividade: '2026-04-10' },
  ],

  _chamadas: [
    // gssi, forca, periodo, total, operador, lancado_em
    { gssi: 1001, forca: 'PM-MT',  periodo: '2026-04', total: 4820, operador: 'Sgt. Marcos Lima',    lancado_em: '2026-04-17' },
    { gssi: 1002, forca: 'PM-MT',  periodo: '2026-04', total: 3750, operador: 'Sgt. Marcos Lima',    lancado_em: '2026-04-17' },
    { gssi: 2001, forca: 'PRF',    periodo: '2026-04', total: 2140, operador: 'Insp. Ana Souza',     lancado_em: '2026-04-16' },
    { gssi: 3001, forca: 'GEFRON', periodo: '2026-04', total: 1870, operador: 'Ten. Carlos Neves',   lancado_em: '2026-04-16' },
    { gssi: 4001, forca: 'BOPE',   periodo: '2026-04', total: 980,  operador: 'Cap. Bruno Alves',    lancado_em: '2026-04-15' },
    { gssi: 5001, forca: 'PCMT',   periodo: '2026-04', total: 2310, operador: 'Del. Fernanda Ramos', lancado_em: '2026-04-16' },
    { gssi: 7001, forca: 'SEFAZ',  periodo: '2026-04', total: 430,  operador: 'Aud. José Correia',   lancado_em: '2026-04-10' },
    // Meses anteriores
    { gssi: 1001, forca: 'PM-MT',  periodo: '2026-03', total: 4500, operador: 'Sgt. Marcos Lima',    lancado_em: '2026-03-31' },
    { gssi: 1002, forca: 'PM-MT',  periodo: '2026-03', total: 3600, operador: 'Sgt. Marcos Lima',    lancado_em: '2026-03-31' },
    { gssi: 2001, forca: 'PRF',    periodo: '2026-03', total: 2050, operador: 'Insp. Ana Souza',     lancado_em: '2026-03-31' },
    { gssi: 3001, forca: 'GEFRON', periodo: '2026-03', total: 1920, operador: 'Ten. Carlos Neves',   lancado_em: '2026-03-31' },
    { gssi: 4001, forca: 'BOPE',   periodo: '2026-03', total: 1100, operador: 'Cap. Bruno Alves',    lancado_em: '2026-03-31' },
    { gssi: 5001, forca: 'PCMT',   periodo: '2026-03', total: 2200, operador: 'Del. Fernanda Ramos', lancado_em: '2026-03-31' },
    { gssi: 6001, forca: 'CBMMT', periodo: '2026-03', total: 890,  operador: 'Ten. Ricardo Faria',  lancado_em: '2026-03-31' },
    { gssi: 7001, forca: 'SEFAZ',  periodo: '2026-03', total: 510,  operador: 'Aud. José Correia',   lancado_em: '2026-03-31' },
    { gssi: 1001, forca: 'PM-MT',  periodo: '2026-02', total: 4100, operador: 'Sgt. Marcos Lima',    lancado_em: '2026-02-28' },
    { gssi: 1002, forca: 'PM-MT',  periodo: '2026-02', total: 3200, operador: 'Sgt. Marcos Lima',    lancado_em: '2026-02-28' },
    { gssi: 2001, forca: 'PRF',    periodo: '2026-02', total: 1900, operador: 'Insp. Ana Souza',     lancado_em: '2026-02-28' },
    { gssi: 3001, forca: 'GEFRON', periodo: '2026-02', total: 2100, operador: 'Ten. Carlos Neves',   lancado_em: '2026-02-28' },
    { gssi: 4001, forca: 'BOPE',   periodo: '2026-02', total: 750,  operador: 'Cap. Bruno Alves',    lancado_em: '2026-02-28' },
    { gssi: 5001, forca: 'PCMT',   periodo: '2026-02', total: 1980, operador: 'Del. Fernanda Ramos', lancado_em: '2026-02-28' },
    { gssi: 6001, forca: 'CBMMT', periodo: '2026-02', total: 920,  operador: 'Ten. Ricardo Faria',  lancado_em: '2026-02-28' },
    { gssi: 7001, forca: 'SEFAZ',  periodo: '2026-02', total: 480,  operador: 'Aud. José Correia',   lancado_em: '2026-02-28' },
    { gssi: 1001, forca: 'PM-MT',  periodo: '2026-01', total: 5200, operador: 'Sgt. Marcos Lima',    lancado_em: '2026-01-31' },
    { gssi: 2001, forca: 'PRF',    periodo: '2026-01', total: 2300, operador: 'Insp. Ana Souza',     lancado_em: '2026-01-31' },
    { gssi: 3001, forca: 'GEFRON', periodo: '2026-01', total: 1750, operador: 'Ten. Carlos Neves',   lancado_em: '2026-01-31' },
    { gssi: 5001, forca: 'PCMT',   periodo: '2026-01', total: 2450, operador: 'Del. Fernanda Ramos', lancado_em: '2026-01-31' },
    { gssi: 1001, forca: 'PM-MT',  periodo: '2025-12', total: 4900, operador: 'Sgt. Marcos Lima',    lancado_em: '2025-12-31' },
    { gssi: 2001, forca: 'PRF',    periodo: '2025-12', total: 1800, operador: 'Insp. Ana Souza',     lancado_em: '2025-12-31' },
    { gssi: 3001, forca: 'GEFRON', periodo: '2025-12', total: 2000, operador: 'Ten. Carlos Neves',   lancado_em: '2025-12-31' },
    { gssi: 5001, forca: 'PCMT',   periodo: '2025-12', total: 2100, operador: 'Del. Fernanda Ramos', lancado_em: '2025-12-31' },
    { gssi: 1001, forca: 'PM-MT',  periodo: '2025-11', total: 4600, operador: 'Sgt. Marcos Lima',    lancado_em: '2025-11-30' },
    { gssi: 2001, forca: 'PRF',    periodo: '2025-11', total: 1950, operador: 'Insp. Ana Souza',     lancado_em: '2025-11-30' },
    { gssi: 3001, forca: 'GEFRON', periodo: '2025-11', total: 1680, operador: 'Ten. Carlos Neves',   lancado_em: '2025-11-30' },
    { gssi: 5001, forca: 'PCMT',   periodo: '2025-11', total: 1900, operador: 'Del. Fernanda Ramos', lancado_em: '2025-11-30' },
  ],

  // ── HELPERS ───────────────────────────
  _forcaBadge(forca) {
    const map = {
      'PM-MT':  'badge-blue',
      'PRF':    'badge-amber',
      'GEFRON': 'badge-orange',
      'BOPE':   'badge-purple',
      'PCMT':   'badge-green',
      'CBMMT':  'badge-red',
      'SEFAZ':  'badge-gray',
      'CISP':   'badge-blue',
      'Outros': 'badge-gray',
    };
    return `<span class="badge ${map[forca] || 'badge-gray'}">${forca}</span>`;
  },

  _statusBadge(status) {
    return status === 'Ativo'
      ? '<span class="badge badge-green">Ativo</span>'
      : '<span class="badge badge-gray">Inativo</span>';
  },

  _periodoLabel(p) {
    const [ano, mes] = p.split('-');
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${nomes[parseInt(mes,10)-1]}/${ano}`;
  },

  _forcaSelectOptions(selected = '') {
    const forces = ['PM-MT','PRF','GEFRON','BOPE','PCMT','CBMMT','SEFAZ','CISP','Outros'];
    return forces.map(f => `<option value="${f}" ${f === selected ? 'selected' : ''}>${f}</option>`).join('');
  },

  _frotaSelectOptions(selected = '') {
    return Comunicacoes._frotas.map(f =>
      `<option value="${f.gssi}" ${f.gssi == selected ? 'selected' : ''}>${f.gssi} — ${f.nome} (${f.forca})</option>`
    ).join('');
  },

  // ══════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════
  renderDashboard(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Comunicações / Rádio</div>
            <div class="page-sub">Frotas TETRA · Chamadas por força · GSSI · Período</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Comunicacoes.renderDashboard(document.getElementById('main-content'))">↻ Atualizar</button>
          </div>
        </div>

        <!-- KPIs -->
        <div id="com-kpis" class="kpi-grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:16px"></div>

        <!-- Gráficos -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="card" style="height:280px;display:flex;flex-direction:column">
            <div class="card-title">Chamadas por Força — Abril/2026</div>
            <canvas id="chart-com-forca" style="flex:1;min-height:0"></canvas>
          </div>
          <div class="card" style="height:280px;display:flex;flex-direction:column">
            <div class="card-title">Evolução de Chamadas — Últimos 6 meses</div>
            <canvas id="chart-com-evolucao" style="flex:1;min-height:0"></canvas>
          </div>
        </div>

        <!-- Tabela top frotas -->
        <div class="card" style="padding:0">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
            <div class="card-title" style="margin:0">Top Frotas por Volume — Abril/2026</div>
          </div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>GSSI</th>
                  <th>Nome da Frota</th>
                  <th>Força</th>
                  <th style="text-align:right">Total Chamadas</th>
                  <th>Período</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="com-top-frotas"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    Comunicacoes._renderDashKPIs();
    Comunicacoes._renderDashCharts();
    Comunicacoes._renderTopFrotas();
  },

  _renderDashKPIs() {
    const abril = Comunicacoes._chamadas.filter(c => c.periodo === '2026-04');
    const totalChamadas = abril.reduce((s, c) => s + c.total, 0);
    const frotasAtivas  = Comunicacoes._frotas.filter(f => f.status === 'Ativo').length;
    const porPM         = abril.filter(c => c.forca === 'PM-MT').reduce((s,c) => s + c.total, 0);
    const porPRF        = abril.filter(c => c.forca === 'PRF').reduce((s,c) => s + c.total, 0);
    const porGEFRON     = abril.filter(c => c.forca === 'GEFRON').reduce((s,c) => s + c.total, 0);
    const gssiAtivos    = Comunicacoes._frotas.filter(f => f.status === 'Ativo').map(f => f.gssi);
    const semRegistro   = gssiAtivos.filter(g => !abril.find(c => c.gssi === g)).length;

    const el = document.getElementById('com-kpis');
    if (!el) return;
    el.innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-label">Total Chamadas</div>
        <div class="kpi-value">${totalChamadas.toLocaleString('pt-BR')}</div>
        <div class="kpi-sub">Abril/2026</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Frotas Ativas</div>
        <div class="kpi-value">${frotasAtivas}</div>
        <div class="kpi-sub">de ${Comunicacoes._frotas.length} cadastradas</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">Chamadas PM-MT</div>
        <div class="kpi-value">${porPM.toLocaleString('pt-BR')}</div>
        <div class="kpi-sub">${totalChamadas ? Math.round(porPM/totalChamadas*100) : 0}% do total</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Chamadas PRF</div>
        <div class="kpi-value">${porPRF.toLocaleString('pt-BR')}</div>
        <div class="kpi-sub">${totalChamadas ? Math.round(porPRF/totalChamadas*100) : 0}% do total</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Chamadas GEFRON</div>
        <div class="kpi-value">${porGEFRON.toLocaleString('pt-BR')}</div>
        <div class="kpi-sub">${totalChamadas ? Math.round(porGEFRON/totalChamadas*100) : 0}% do total</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Sem Registro no Mês</div>
        <div class="kpi-value">${semRegistro}</div>
        <div class="kpi-sub">frota(s) ativa(s) sem lançamento</div>
      </div>`;
  },

  _renderDashCharts() {
    Object.values(Comunicacoes._charts).forEach(c => { try { c.destroy(); } catch {} });
    Comunicacoes._charts = {};

    // ── Bar: Chamadas por Força ───────────
    const forcas   = ['PM-MT','PRF','GEFRON','BOPE','PCMT','CBMMT','SEFAZ'];
    const abril    = Comunicacoes._chamadas.filter(c => c.periodo === '2026-04');
    const totPorForca = forcas.map(f => abril.filter(c => c.forca === f).reduce((s,c) => s + c.total, 0));
    const colors   = ['#6366f1','#fbbf24','#f97316','#a78bfa','#22c55e','#ef4444','#94a3b8'];

    const c1 = document.getElementById('chart-com-forca');
    if (c1) {
      Comunicacoes._charts.forca = new Chart(c1, {
        type: 'bar',
        data: {
          labels: forcas,
          datasets: [{
            data: totPorForca,
            backgroundColor: colors,
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 }, color: '#c4d8f0' }, grid: { display: false } },
            y: { ticks: { font: { size: 11 }, color: '#c4d8f0' }, grid: { color: 'rgba(255,255,255,.05)' }, min: 0 }
          }
        }
      });
    }

    // ── Line: Evolução 6 meses ────────────
    const periodos = ['2025-11','2025-12','2026-01','2026-02','2026-03','2026-04'];
    const labels   = periodos.map(p => Comunicacoes._periodoLabel(p));
    const totais   = periodos.map(p =>
      Comunicacoes._chamadas.filter(c => c.periodo === p).reduce((s,c) => s + c.total, 0)
    );

    const c2 = document.getElementById('chart-com-evolucao');
    if (c2) {
      Comunicacoes._charts.evolucao = new Chart(c2, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Total de Chamadas',
            data: totais,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 }, color: '#c4d8f0' }, grid: { color: 'rgba(255,255,255,.05)' } },
            y: { ticks: { font: { size: 11 }, color: '#c4d8f0' }, grid: { color: 'rgba(255,255,255,.05)' }, min: 0 }
          }
        }
      });
    }
  },

  _renderTopFrotas() {
    const abril = Comunicacoes._chamadas.filter(c => c.periodo === '2026-04');
    const linhas = Comunicacoes._frotas
      .map(f => {
        const reg = abril.find(c => c.gssi === f.gssi);
        return { ...f, totalChamadas: reg ? reg.total : 0 };
      })
      .sort((a, b) => b.totalChamadas - a.totalChamadas);

    const tbody = document.getElementById('com-top-frotas');
    if (!tbody) return;
    tbody.innerHTML = linhas.map(f => `
      <tr>
        <td style="font-family:var(--mono);font-size:13px;color:var(--accent);font-weight:700">${f.gssi}</td>
        <td style="font-weight:600">${f.nome}</td>
        <td>${Comunicacoes._forcaBadge(f.forca)}</td>
        <td style="text-align:right;font-family:var(--mono);font-size:13px;font-weight:700;color:var(--text)">
          ${f.totalChamadas ? f.totalChamadas.toLocaleString('pt-BR') : '<span style="color:var(--text3)">—</span>'}
        </td>
        <td style="font-size:12px;color:var(--text2)">${Comunicacoes._periodoLabel('2026-04')}</td>
        <td>${Comunicacoes._statusBadge(f.status)}</td>
      </tr>`).join('');
  },

  // ══════════════════════════════════════
  // REGISTROS — Frotas + Lançar Chamadas
  // ══════════════════════════════════════
  _abaAtiva: 'frotas',

  renderRegistros(el) {
    Comunicacoes._abaAtiva = 'frotas';
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Frotas e Lançamento de Chamadas</div>
            <div class="page-sub">Cadastro de frotas TETRA e registro de volumes de chamadas</div>
          </div>
        </div>

        <!-- Tabs -->
        <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:1px solid var(--border)">
          <button id="tab-btn-frotas" class="btn btn-ghost" onclick="Comunicacoes._trocarAba('frotas')"
            style="border-radius:6px 6px 0 0;border-bottom:2px solid var(--accent);color:var(--accent);font-weight:600">
            Frotas Cadastradas
          </button>
          <button id="tab-btn-lancamentos" class="btn btn-ghost" onclick="Comunicacoes._trocarAba('lancamentos')"
            style="border-radius:6px 6px 0 0;border-bottom:2px solid transparent;color:var(--text2)">
            Lançar Chamadas
          </button>
        </div>

        <div id="com-aba-content"></div>
      </div>`;

    Comunicacoes._renderAbaFrotas();
  },

  _trocarAba(aba) {
    Comunicacoes._abaAtiva = aba;
    const btnFrotas      = document.getElementById('tab-btn-frotas');
    const btnLancamentos = document.getElementById('tab-btn-lancamentos');
    if (btnFrotas) {
      btnFrotas.style.borderBottom      = aba === 'frotas'      ? '2px solid var(--accent)' : '2px solid transparent';
      btnFrotas.style.color             = aba === 'frotas'      ? 'var(--accent)' : 'var(--text2)';
      btnFrotas.style.fontWeight        = aba === 'frotas'      ? '600' : '400';
    }
    if (btnLancamentos) {
      btnLancamentos.style.borderBottom = aba === 'lancamentos' ? '2px solid var(--accent)' : '2px solid transparent';
      btnLancamentos.style.color        = aba === 'lancamentos' ? 'var(--accent)' : 'var(--text2)';
      btnLancamentos.style.fontWeight   = aba === 'lancamentos' ? '600' : '400';
    }
    if (aba === 'frotas') {
      Comunicacoes._renderAbaFrotas();
    } else {
      Comunicacoes._renderAbaLancamentos();
    }
  },

  // ── ABA: FROTAS ───────────────────────
  _filtroFrotas: '',

  _renderAbaFrotas() {
    const content = document.getElementById('com-aba-content');
    if (!content) return;
    content.innerHTML = `
      <div class="filter-bar">
        <input class="form-input" id="com-busca-frota" placeholder="Buscar GSSI, nome, força..."
          oninput="Comunicacoes._filtrarFrotas()" style="width:280px" value="${Comunicacoes._filtroFrotas}">
        <select class="form-select" id="com-filtro-forca" onchange="Comunicacoes._filtrarFrotas()" style="width:160px">
          <option value="">Todas as forças</option>
          ${Comunicacoes._forcaSelectOptions()}
        </select>
        <select class="form-select" id="com-filtro-status-frota" onchange="Comunicacoes._filtrarFrotas()" style="width:140px">
          <option value="">Todos os status</option>
          <option>Ativo</option>
          <option>Inativo</option>
        </select>
        <button class="btn btn-primary btn-sm perm-edit" onclick="Comunicacoes.novaFrota()">+ Nova Frota</button>
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrap" style="border:none">
          <table>
            <thead>
              <tr>
                <th>GSSI</th>
                <th>Nome da Frota</th>
                <th>Força</th>
                <th style="text-align:center">Rádios Vinculados</th>
                <th>Última Atividade</th>
                <th>Status</th>
                <th style="text-align:center">Ações</th>
              </tr>
            </thead>
            <tbody id="com-frotas-tbody"></tbody>
          </table>
        </div>
      </div>`;
    Comunicacoes._filtrarFrotas();
  },

  _filtrarFrotas() {
    const busca  = (document.getElementById('com-busca-frota')?.value || '').toLowerCase();
    const forca  = document.getElementById('com-filtro-forca')?.value || '';
    const status = document.getElementById('com-filtro-status-frota')?.value || '';
    Comunicacoes._filtroFrotas = busca;

    const filtradas = Comunicacoes._frotas.filter(f => {
      if (forca  && f.forca  !== forca)  return false;
      if (status && f.status !== status) return false;
      if (busca  &&
          !f.gssi.toString().includes(busca) &&
          !f.nome.toLowerCase().includes(busca) &&
          !f.forca.toLowerCase().includes(busca) &&
          !f.risp.toLowerCase().includes(busca)) return false;
      return true;
    });

    const tbody = document.getElementById('com-frotas-tbody');
    if (!tbody) return;
    if (!filtradas.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">Nenhuma frota encontrada</td></tr>`;
      return;
    }
    tbody.innerHTML = filtradas.map(f => `
      <tr>
        <td style="font-family:var(--mono);font-size:13px;color:var(--accent);font-weight:700">${f.gssi}</td>
        <td style="font-weight:600">${f.nome}</td>
        <td>${Comunicacoes._forcaBadge(f.forca)}</td>
        <td style="text-align:center">
          ${f.radios > 0
            ? `<span style="font-family:var(--mono);font-weight:700;color:var(--text)">${f.radios}</span>`
            : `<span class="badge badge-red">0 — sem rádios</span>`}
        </td>
        <td style="font-size:12px;color:var(--text2);font-family:var(--mono)">${f.ultima_atividade || '—'}</td>
        <td>${Comunicacoes._statusBadge(f.status)}</td>
        <td style="text-align:center">
          <div style="display:flex;gap:4px;justify-content:center">
            <button class="btn btn-ghost btn-sm perm-edit" title="Editar" onclick="Comunicacoes.editarFrota(${f.id})">✎ Editar</button>
            <button class="btn btn-ghost btn-sm" title="Lançar Chamadas" onclick="Comunicacoes._trocarAbaComFrota(${f.gssi})">↗ Chamadas</button>
          </div>
        </td>
      </tr>`).join('');
  },

  _trocarAbaComFrota(gssi) {
    Comunicacoes._trocarAba('lancamentos');
    setTimeout(() => {
      const sel = document.getElementById('com-lanc-gssi');
      if (sel) {
        sel.value = gssi;
        Comunicacoes._preencherForcaFrota();
      }
    }, 50);
  },

  // Modal Nova Frota
  novaFrota() {
    Modal.open('Cadastrar Frota', Comunicacoes._formFrotaHTML(), [
      { label: 'Cancelar',   class: 'btn-ghost',   onclick: 'Modal.close()' },
      { label: 'Cadastrar',  class: 'btn-primary',  onclick: 'Comunicacoes.salvarFrota()' }
    ]);
  },

  editarFrota(id) {
    const f = Comunicacoes._frotas.find(x => x.id === id);
    if (!f) return;
    Modal.open('Editar Frota', Comunicacoes._formFrotaHTML(f), [
      { label: 'Cancelar', class: 'btn-ghost',   onclick: 'Modal.close()' },
      { label: 'Salvar',   class: 'btn-primary',  onclick: `Comunicacoes.salvarEdicaoFrota(${id})` }
    ]);
  },

  _formFrotaHTML(f = {}) {
    return `
      <div class="form-grid-2">
        <div>
          <label class="form-label">GSSI (número da frota) *</label>
          <input class="form-input" id="ff-gssi" type="number" placeholder="Ex: 1001" value="${f.gssi || ''}">
        </div>
        <div>
          <label class="form-label">Nome da Frota *</label>
          <input class="form-input" id="ff-nome" placeholder="Ex: ALFA-1, FRONTEIRA SUL..." value="${f.nome || ''}">
        </div>
        <div>
          <label class="form-label">Força *</label>
          <select class="form-select" id="ff-forca">
            <option value="">— Selecione —</option>
            ${Comunicacoes._forcaSelectOptions(f.forca || '')}
          </select>
        </div>
        <div>
          <label class="form-label">RISP de Operação</label>
          <select class="form-select" id="ff-risp">
            <option value="">— Selecione —</option>
            ${['RISP 1 — Cuiabá','RISP 2 — Rondonópolis','RISP 3 — Sinop','RISP 4 — Cáceres','RISP 5 — Barra do Garças']
              .map(r => `<option value="${r}" ${r === f.risp ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Total de Rádios Vinculados</label>
          <input class="form-input" id="ff-radios" type="number" placeholder="0" value="${f.radios ?? ''}">
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-select" id="ff-status">
            <option value="Ativo"   ${f.status === 'Ativo'   || !f.status ? 'selected' : ''}>Ativo</option>
            <option value="Inativo" ${f.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="ff-obs" rows="2" placeholder="Informações adicionais sobre a frota...">${f.observacoes || ''}</textarea>
        </div>
      </div>`;
  },

  salvarFrota() {
    const gssi  = parseInt(document.getElementById('ff-gssi')?.value);
    const nome  = document.getElementById('ff-nome')?.value?.trim();
    const forca = document.getElementById('ff-forca')?.value;
    if (!gssi || !nome || !forca) {
      Toast.show('Preencha GSSI, Nome e Força', 'error');
      return;
    }
    if (Comunicacoes._frotas.find(f => f.gssi === gssi)) {
      Toast.show('Já existe uma frota com este GSSI', 'error');
      return;
    }
    const novaFrota = {
      id: Math.max(...Comunicacoes._frotas.map(f => f.id)) + 1,
      gssi,
      nome,
      forca,
      risp:             document.getElementById('ff-risp')?.value || '',
      radios:           parseInt(document.getElementById('ff-radios')?.value) || 0,
      status:           document.getElementById('ff-status')?.value || 'Ativo',
      observacoes:      document.getElementById('ff-obs')?.value?.trim() || '',
      ultima_atividade: new Date().toISOString().slice(0, 10),
    };
    Comunicacoes._frotas.push(novaFrota);
    Modal.close();
    Toast.show('Frota cadastrada com sucesso', 'success');
    Comunicacoes._filtrarFrotas();
  },

  salvarEdicaoFrota(id) {
    const idx   = Comunicacoes._frotas.findIndex(f => f.id === id);
    if (idx === -1) return;
    const gssi  = parseInt(document.getElementById('ff-gssi')?.value);
    const nome  = document.getElementById('ff-nome')?.value?.trim();
    const forca = document.getElementById('ff-forca')?.value;
    if (!gssi || !nome || !forca) {
      Toast.show('Preencha GSSI, Nome e Força', 'error');
      return;
    }
    Object.assign(Comunicacoes._frotas[idx], {
      gssi,
      nome,
      forca,
      risp:        document.getElementById('ff-risp')?.value || '',
      radios:      parseInt(document.getElementById('ff-radios')?.value) || 0,
      status:      document.getElementById('ff-status')?.value || 'Ativo',
      observacoes: document.getElementById('ff-obs')?.value?.trim() || '',
    });
    Modal.close();
    Toast.show('Frota atualizada', 'success');
    Comunicacoes._filtrarFrotas();
  },

  // ── ABA: LANÇAR CHAMADAS ─────────────
  _renderAbaLancamentos() {
    const content = document.getElementById('com-aba-content');
    if (!content) return;

    const agora  = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}`;
    const recentes = [...Comunicacoes._chamadas]
      .sort((a, b) => b.lancado_em.localeCompare(a.lancado_em))
      .slice(0, 10);

    content.innerHTML = `
      <!-- Formulário de lançamento -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">Registrar Volume de Chamadas</div>
        <div class="form-grid-2">
          <div>
            <label class="form-label">Frota (GSSI) *</label>
            <select class="form-select" id="com-lanc-gssi" onchange="Comunicacoes._preencherForcaFrota()">
              <option value="">— Selecione uma frota —</option>
              ${Comunicacoes._frotaSelectOptions()}
            </select>
          </div>
          <div>
            <label class="form-label">Força</label>
            <input class="form-input" id="com-lanc-forca" placeholder="Preenchido automaticamente" readonly
              style="background:var(--surface2);color:var(--text2)">
          </div>
          <div>
            <label class="form-label">Período (Mês/Ano) *</label>
            <input class="form-input" id="com-lanc-periodo" type="month" value="${mesAtual}">
          </div>
          <div>
            <label class="form-label">Total de Chamadas *</label>
            <input class="form-input" id="com-lanc-total" type="number" placeholder="Ex: 4820" min="0">
          </div>
          <div style="grid-column:1/-1">
            <label class="form-label">Observações</label>
            <textarea class="form-textarea" id="com-lanc-obs" rows="2" placeholder="Informações adicionais, intercorrências..."></textarea>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
          <button class="btn btn-ghost" onclick="Comunicacoes._limparFormLancamento()">Limpar</button>
          <button class="btn btn-primary perm-edit" onclick="Comunicacoes.lancarChamadas()">↗ Registrar Chamadas</button>
        </div>
      </div>

      <!-- Registros recentes -->
      <div class="card" style="padding:0">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
          <div class="card-title" style="margin:0">Últimos Lançamentos</div>
        </div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead>
              <tr>
                <th>Frota (GSSI)</th>
                <th>Força</th>
                <th>Período</th>
                <th style="text-align:right">Chamadas</th>
                <th>Lançado em</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              ${recentes.map(c => {
                const frota = Comunicacoes._frotas.find(f => f.gssi === c.gssi);
                return `
                  <tr>
                    <td>
                      <span style="font-family:var(--mono);font-size:12px;color:var(--accent);font-weight:700">${c.gssi}</span>
                      <span style="color:var(--text2);font-size:12px;margin-left:6px">${frota ? frota.nome : '—'}</span>
                    </td>
                    <td>${Comunicacoes._forcaBadge(c.forca)}</td>
                    <td style="font-family:var(--mono);font-size:12px">${Comunicacoes._periodoLabel(c.periodo)}</td>
                    <td style="text-align:right;font-family:var(--mono);font-weight:700">${c.total.toLocaleString('pt-BR')}</td>
                    <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">${c.lancado_em}</td>
                    <td style="font-size:12px;color:var(--text2)">${c.operador}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  _preencherForcaFrota() {
    const gssi  = parseInt(document.getElementById('com-lanc-gssi')?.value);
    const frota = Comunicacoes._frotas.find(f => f.gssi === gssi);
    const el    = document.getElementById('com-lanc-forca');
    if (el) el.value = frota ? frota.forca : '';
  },

  _limparFormLancamento() {
    const ids = ['com-lanc-gssi','com-lanc-forca','com-lanc-total','com-lanc-obs'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  },

  lancarChamadas() {
    const gssi    = parseInt(document.getElementById('com-lanc-gssi')?.value);
    const periodo = document.getElementById('com-lanc-periodo')?.value;
    const total   = parseInt(document.getElementById('com-lanc-total')?.value);
    const obs     = document.getElementById('com-lanc-obs')?.value?.trim();

    if (!gssi)    { Toast.show('Selecione uma frota', 'error'); return; }
    if (!periodo) { Toast.show('Informe o período', 'error'); return; }
    if (!total && total !== 0) { Toast.show('Informe o total de chamadas', 'error'); return; }

    const frota = Comunicacoes._frotas.find(f => f.gssi === gssi);
    if (!frota) { Toast.show('Frota não encontrada', 'error'); return; }

    // Verifica duplicata
    const existe = Comunicacoes._chamadas.find(c => c.gssi === gssi && c.periodo === periodo);
    if (existe) {
      Toast.show(`Já existe lançamento para GSSI ${gssi} em ${Comunicacoes._periodoLabel(periodo)}`, 'error');
      return;
    }

    Comunicacoes._chamadas.push({
      gssi,
      forca:      frota.forca,
      periodo,
      total,
      operador:   'Usuário Atual',
      lancado_em: new Date().toISOString().slice(0,10),
      obs,
    });

    Toast.show(`Chamadas registradas para frota ${gssi} — ${Comunicacoes._periodoLabel(periodo)}`, 'success');
    Comunicacoes._limparFormLancamento();
    Comunicacoes._renderAbaLancamentos();
  },

  // ══════════════════════════════════════
  // HISTÓRICO
  // ══════════════════════════════════════
  renderHistorico(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Histórico de Chamadas</div>
            <div class="page-sub">Consulta por força, frota, GSSI e período</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Comunicacoes.renderHistorico(document.getElementById('main-content'))">↻ Atualizar</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <select class="form-select" id="hist-forca" onchange="Comunicacoes._filtrarHistorico()" style="width:160px">
            <option value="">Todas as forças</option>
            ${Comunicacoes._forcaSelectOptions()}
          </select>
          <input class="form-input" id="hist-busca" placeholder="Frota ou GSSI..."
            oninput="Comunicacoes._filtrarHistorico()" style="width:200px">
          <select class="form-select" id="hist-periodo" onchange="Comunicacoes._filtrarHistorico()" style="width:160px">
            <option value="">Todos os períodos</option>
            ${['2026-04','2026-03','2026-02','2026-01','2025-12','2025-11']
              .map(p => `<option value="${p}">${Comunicacoes._periodoLabel(p)}</option>`).join('')}
          </select>
          <select class="form-select" id="hist-risp" onchange="Comunicacoes._filtrarHistorico()" style="width:190px">
            <option value="">Todas as RISPs</option>
            ${['RISP 1 — Cuiabá','RISP 2 — Rondonópolis','RISP 3 — Sinop','RISP 4 — Cáceres','RISP 5 — Barra do Garças']
              .map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>

        <div class="card" style="padding:0">
          <div id="hist-info" style="padding:8px 16px;border-bottom:1px solid var(--border);font-size:12px;color:var(--text3)"></div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>GSSI</th>
                  <th>Frota</th>
                  <th>Força</th>
                  <th>Período</th>
                  <th style="text-align:right">Total Chamadas</th>
                  <th style="text-align:right">Média/Dia</th>
                  <th>Registrado por</th>
                  <th>Data Lançamento</th>
                </tr>
              </thead>
              <tbody id="hist-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    Comunicacoes._filtrarHistorico();
  },

  _filtrarHistorico() {
    const forca   = document.getElementById('hist-forca')?.value || '';
    const busca   = (document.getElementById('hist-busca')?.value || '').toLowerCase();
    const periodo = document.getElementById('hist-periodo')?.value || '';
    const risp    = document.getElementById('hist-risp')?.value || '';

    const filtrados = Comunicacoes._chamadas.filter(c => {
      const frota = Comunicacoes._frotas.find(f => f.gssi === c.gssi);
      if (forca   && c.forca !== forca) return false;
      if (periodo && c.periodo !== periodo) return false;
      if (risp    && frota?.risp !== risp) return false;
      if (busca   &&
          !c.gssi.toString().includes(busca) &&
          !(frota?.nome || '').toLowerCase().includes(busca)) return false;
      return true;
    }).sort((a, b) => b.periodo.localeCompare(a.periodo) || b.lancado_em.localeCompare(a.lancado_em));

    const infoEl = document.getElementById('hist-info');
    if (infoEl) infoEl.textContent = `${filtrados.length} registro(s) encontrado(s)`;

    const tbody = document.getElementById('hist-tbody');
    if (!tbody) return;
    if (!filtrados.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">Nenhum registro encontrado</td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map(c => {
      const frota = Comunicacoes._frotas.find(f => f.gssi === c.gssi);
      const diasMes = new Date(parseInt(c.periodo.split('-')[0]), parseInt(c.periodo.split('-')[1]), 0).getDate();
      const mediaDia = (c.total / diasMes).toFixed(1);
      return `
        <tr>
          <td style="font-family:var(--mono);font-size:13px;color:var(--accent);font-weight:700">${c.gssi}</td>
          <td style="font-weight:600">${frota ? frota.nome : '—'}</td>
          <td>${Comunicacoes._forcaBadge(c.forca)}</td>
          <td style="font-family:var(--mono);font-size:12px">${Comunicacoes._periodoLabel(c.periodo)}</td>
          <td style="text-align:right;font-family:var(--mono);font-weight:700">${c.total.toLocaleString('pt-BR')}</td>
          <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text2)">${mediaDia}</td>
          <td style="font-size:12px;color:var(--text2)">${c.operador}</td>
          <td style="font-family:var(--mono);font-size:11px;color:var(--text3)">${c.lancado_em}</td>
        </tr>`;
    }).join('');
  },

  // ══════════════════════════════════════
  // ALERTAS
  // ══════════════════════════════════════
  renderAlertas(el) {
    const abril = Comunicacoes._chamadas.filter(c => c.periodo === '2026-04');
    const gssiComRegistro = new Set(abril.map(c => c.gssi));

    // 1. Frotas ativas sem lançamento no mês
    const semComunicacao = Comunicacoes._frotas.filter(f =>
      f.status === 'Ativo' && !gssiComRegistro.has(f.gssi)
    );

    // 2. Frotas sem rádios vinculados
    const semRadio = Comunicacoes._frotas.filter(f => f.radios === 0);

    // 3. Variação atípica (queda ou pico > 50% vs média)
    const variacoes = [];
    Comunicacoes._frotas.forEach(f => {
      const historico = Comunicacoes._chamadas
        .filter(c => c.gssi === f.gssi && c.periodo !== '2026-04')
        .map(c => c.total);
      if (historico.length < 2) return;
      const media = historico.reduce((s, v) => s + v, 0) / historico.length;
      const atual = Comunicacoes._chamadas.find(c => c.gssi === f.gssi && c.periodo === '2026-04');
      if (!atual) return;
      const delta = ((atual.total - media) / media) * 100;
      if (Math.abs(delta) > 50) {
        variacoes.push({ frota: f, media: Math.round(media), atual: atual.total, delta: Math.round(delta) });
      }
    });

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Alertas — Comunicações</div>
            <div class="page-sub">Frotas sem comunicação · GSSI sem rádio · Variações atípicas</div>
          </div>
        </div>

        <!-- Alerta 1: Frotas sem comunicação -->
        <div class="card" style="margin-bottom:16px;border-left:3px solid var(--red)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <span style="font-size:20px">🔴</span>
            <div>
              <div style="font-weight:700;color:var(--red);font-size:14px">Frotas sem Comunicação Registrada no Mês</div>
              <div style="font-size:12px;color:var(--text3)">GSSIs ativos sem lançamento em Abril/2026</div>
            </div>
            <span class="badge badge-red" style="margin-left:auto">${semComunicacao.length} frota(s)</span>
          </div>
          ${semComunicacao.length ? `
            <div class="table-wrap" style="border:none">
              <table>
                <thead><tr><th>GSSI</th><th>Nome</th><th>Força</th><th>RISP</th><th>Última Atividade</th><th>Rádios</th></tr></thead>
                <tbody>
                  ${semComunicacao.map(f => `
                    <tr>
                      <td style="font-family:var(--mono);color:var(--accent);font-weight:700">${f.gssi}</td>
                      <td style="font-weight:600">${f.nome}</td>
                      <td>${Comunicacoes._forcaBadge(f.forca)}</td>
                      <td style="font-size:12px;color:var(--text2)">${f.risp}</td>
                      <td style="font-family:var(--mono);font-size:12px;color:var(--red)">${f.ultima_atividade || '—'}</td>
                      <td style="text-align:center">${f.radios}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>` :
            `<div style="color:var(--text3);font-size:13px;padding:8px 0">Nenhuma frota ativa sem registro no mês atual.</div>`}
        </div>

        <!-- Alerta 2: GSSI sem rádio -->
        <div class="card" style="margin-bottom:16px;border-left:3px solid var(--amber)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <span style="font-size:20px">🟡</span>
            <div>
              <div style="font-weight:700;color:var(--amber);font-size:14px">GSSI sem Rádio Vinculado</div>
              <div style="font-size:12px;color:var(--text3)">Frotas sem equipamentos associados na rede TETRA</div>
            </div>
            <span class="badge badge-amber" style="margin-left:auto">${semRadio.length} frota(s)</span>
          </div>
          ${semRadio.length ? `
            <div class="table-wrap" style="border:none">
              <table>
                <thead><tr><th>GSSI</th><th>Nome</th><th>Força</th><th>Status</th><th>RISP</th></tr></thead>
                <tbody>
                  ${semRadio.map(f => `
                    <tr>
                      <td style="font-family:var(--mono);color:var(--accent);font-weight:700">${f.gssi}</td>
                      <td style="font-weight:600">${f.nome}</td>
                      <td>${Comunicacoes._forcaBadge(f.forca)}</td>
                      <td>${Comunicacoes._statusBadge(f.status)}</td>
                      <td style="font-size:12px;color:var(--text2)">${f.risp}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>` :
            `<div style="color:var(--text3);font-size:13px;padding:8px 0">Todas as frotas possuem rádios vinculados.</div>`}
        </div>

        <!-- Alerta 3: Variação atípica -->
        <div class="card" style="border-left:3px solid var(--accent)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <span style="font-size:20px">🔵</span>
            <div>
              <div style="font-weight:700;color:var(--accent);font-size:14px">Variação Atípica de Chamadas</div>
              <div style="font-size:12px;color:var(--text3)">Frotas com queda ou pico superior a 50% em relação à média histórica</div>
            </div>
            <span class="badge badge-blue" style="margin-left:auto">${variacoes.length} frota(s)</span>
          </div>
          ${variacoes.length ? `
            <div class="table-wrap" style="border:none">
              <table>
                <thead>
                  <tr>
                    <th>GSSI</th><th>Nome</th><th>Força</th>
                    <th style="text-align:right">Média Histórica</th>
                    <th style="text-align:right">Atual (Abr/26)</th>
                    <th style="text-align:right">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  ${variacoes.map(v => {
                    const cor    = v.delta > 0 ? 'var(--green)' : 'var(--red)';
                    const sinal  = v.delta > 0 ? '+' : '';
                    return `
                      <tr>
                        <td style="font-family:var(--mono);color:var(--accent);font-weight:700">${v.frota.gssi}</td>
                        <td style="font-weight:600">${v.frota.nome}</td>
                        <td>${Comunicacoes._forcaBadge(v.frota.forca)}</td>
                        <td style="text-align:right;font-family:var(--mono)">${v.media.toLocaleString('pt-BR')}</td>
                        <td style="text-align:right;font-family:var(--mono);font-weight:700">${v.atual.toLocaleString('pt-BR')}</td>
                        <td style="text-align:right;font-family:var(--mono);font-weight:700;color:${cor}">${sinal}${v.delta}%</td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>` :
            `<div style="color:var(--text3);font-size:13px;padding:8px 0">Nenhuma variação atípica detectada no período.</div>`}
        </div>
      </div>`;
  },

  // ══════════════════════════════════════
  // RELATÓRIO
  // ══════════════════════════════════════
  renderRelatorio(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Relatório de Comunicações</div>
            <div class="page-sub">Análise por força, frota e período — SESP-MT</div>
          </div>
        </div>

        <!-- Filtros e exportação -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-title">Filtros do Relatório</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
            <div>
              <label class="form-label">Força</label>
              <select class="form-select" id="rel-forca" onchange="Comunicacoes._renderRelatorioTabela()" style="width:160px">
                <option value="">Todas as forças</option>
                ${Comunicacoes._forcaSelectOptions()}
              </select>
            </div>
            <div>
              <label class="form-label">Frota / GSSI</label>
              <select class="form-select" id="rel-frota" onchange="Comunicacoes._renderRelatorioTabela()" style="width:220px">
                <option value="">Todas as frotas</option>
                ${Comunicacoes._frotas.map(f => `<option value="${f.gssi}">${f.gssi} — ${f.nome}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label">Período — De</label>
              <input class="form-input" id="rel-de" type="month" value="2025-11" onchange="Comunicacoes._renderRelatorioTabela()" style="width:160px">
            </div>
            <div>
              <label class="form-label">Até</label>
              <input class="form-input" id="rel-ate" type="month" value="2026-04" onchange="Comunicacoes._renderRelatorioTabela()" style="width:160px">
            </div>
          </div>
          <!-- Botões de exportação -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
            <span style="font-size:12px;color:var(--text3);align-self:center;margin-right:4px">Exportar:</span>
            <button class="btn btn-ghost btn-sm" onclick="Comunicacoes._exportar('pdf-frota')">↓ PDF por Frota</button>
            <button class="btn btn-ghost btn-sm" onclick="Comunicacoes._exportar('pdf-forca')">↓ PDF por Força</button>
            <button class="btn btn-ghost btn-sm" onclick="Comunicacoes._exportar('pdf-periodo')">↓ PDF por Período</button>
            <button class="btn btn-ghost btn-sm" onclick="Comunicacoes._exportar('excel')">↓ Excel</button>
          </div>
        </div>

        <!-- Tabela sumário por força -->
        <div class="card" style="padding:0;margin-bottom:16px">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
            <div class="card-title" style="margin:0">Resumo por Força</div>
          </div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Força</th>
                  <th style="text-align:center">Total Frotas</th>
                  <th style="text-align:right">Total Chamadas</th>
                  <th style="text-align:right">Média Mensal</th>
                  <th>Período</th>
                </tr>
              </thead>
              <tbody id="rel-summary-tbody"></tbody>
            </table>
          </div>
        </div>

        <!-- Tabela detalhe por lançamento -->
        <div class="card" style="padding:0">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
            <div class="card-title" style="margin:0">Detalhamento de Lançamentos</div>
          </div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>GSSI</th><th>Frota</th><th>Força</th>
                  <th>Período</th>
                  <th style="text-align:right">Chamadas</th>
                  <th>Operador</th>
                </tr>
              </thead>
              <tbody id="rel-detail-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    Comunicacoes._renderRelatorioTabela();
  },

  _renderRelatorioTabela() {
    const forca  = document.getElementById('rel-forca')?.value || '';
    const gssi   = parseInt(document.getElementById('rel-frota')?.value) || 0;
    const de     = document.getElementById('rel-de')?.value || '';
    const ate    = document.getElementById('rel-ate')?.value || '';

    const filtrados = Comunicacoes._chamadas.filter(c => {
      if (forca && c.forca !== forca)  return false;
      if (gssi  && c.gssi  !== gssi)   return false;
      if (de    && c.periodo < de)     return false;
      if (ate   && c.periodo > ate)    return false;
      return true;
    });

    // ── Sumário por força ─────────────────
    const forcaMap = {};
    filtrados.forEach(c => {
      if (!forcaMap[c.forca]) forcaMap[c.forca] = { frotas: new Set(), total: 0, periodos: new Set() };
      const frota = Comunicacoes._frotas.find(f => f.gssi === c.gssi);
      if (frota) forcaMap[c.forca].frotas.add(frota.id);
      forcaMap[c.forca].total += c.total;
      forcaMap[c.forca].periodos.add(c.periodo);
    });

    const summaryTbody = document.getElementById('rel-summary-tbody');
    if (summaryTbody) {
      const forcasOrdenadas = Object.entries(forcaMap).sort((a, b) => b[1].total - a[1].total);
      if (!forcasOrdenadas.length) {
        summaryTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text3)">Nenhum dado no período selecionado</td></tr>`;
      } else {
        summaryTbody.innerHTML = forcasOrdenadas.map(([f, v]) => {
          const meses     = v.periodos.size || 1;
          const media     = Math.round(v.total / meses);
          const periodStr = [...v.periodos].sort();
          const periodoLabel = periodStr.length === 1
            ? Comunicacoes._periodoLabel(periodStr[0])
            : `${Comunicacoes._periodoLabel(periodStr[0])} – ${Comunicacoes._periodoLabel(periodStr[periodStr.length-1])}`;
          return `
            <tr>
              <td>${Comunicacoes._forcaBadge(f)}</td>
              <td style="text-align:center;font-family:var(--mono);font-weight:700">${v.frotas.size}</td>
              <td style="text-align:right;font-family:var(--mono);font-weight:700">${v.total.toLocaleString('pt-BR')}</td>
              <td style="text-align:right;font-family:var(--mono);color:var(--text2)">${media.toLocaleString('pt-BR')}/mês</td>
              <td style="font-size:12px;color:var(--text2)">${periodoLabel}</td>
            </tr>`;
        }).join('');
      }
    }

    // ── Detalhe ───────────────────────────
    const detailTbody = document.getElementById('rel-detail-tbody');
    if (detailTbody) {
      const ordenados = [...filtrados].sort((a,b) => b.periodo.localeCompare(a.periodo) || b.total - a.total);
      if (!ordenados.length) {
        detailTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">Nenhum lançamento no filtro selecionado</td></tr>`;
      } else {
        detailTbody.innerHTML = ordenados.map(c => {
          const frota = Comunicacoes._frotas.find(f => f.gssi === c.gssi);
          return `
            <tr>
              <td style="font-family:var(--mono);color:var(--accent);font-weight:700">${c.gssi}</td>
              <td style="font-weight:600">${frota ? frota.nome : '—'}</td>
              <td>${Comunicacoes._forcaBadge(c.forca)}</td>
              <td style="font-family:var(--mono);font-size:12px">${Comunicacoes._periodoLabel(c.periodo)}</td>
              <td style="text-align:right;font-family:var(--mono);font-weight:700">${c.total.toLocaleString('pt-BR')}</td>
              <td style="font-size:12px;color:var(--text2)">${c.operador}</td>
            </tr>`;
        }).join('');
      }
    }
  },

  _exportar(tipo) {
    const labels = {
      'pdf-frota':   'PDF por Frota',
      'pdf-forca':   'PDF por Força',
      'pdf-periodo': 'PDF por Período',
      'excel':       'Excel',
    };
    Toast.show(`Gerando ${labels[tipo] || tipo}... (funcionalidade integrada ao backend)`, 'success');
  },
};
