// ═══════════════════════════════════════
// GRAD Ecossistema — EQUIPAMENTOS
// Inventário de Rádios TETRA · Patrimônio
// ═══════════════════════════════════════

const Equipamentos = {
  _charts: {},
  _filteredData: [],

  // ── MOCK DATA ────────────────────────────────────────────────────────────────
  _equipamentos: [
    {
      id: 1,
      patrimonio: 'MT-2024-00142',
      tei: '0240001',
      tipo: 'Rádio Portátil',
      modelo: 'Sepura SRH3800',
      fabricante: 'Sepura',
      serie: 'SRH3800-A2847691',
      local: 'SBS-001 Cuiabá Central',
      risp: 'RISP 1',
      status: 'Ativo',
      aquisicao: '2024-03-15',
      obs: 'Rádio em uso pela equipe de operações táticas.',
    },
    {
      id: 2,
      patrimonio: 'MT-2024-00143',
      tei: '0240002',
      tipo: 'Rádio Portátil',
      modelo: 'Motorola MTP3550',
      fabricante: 'Motorola Solutions',
      serie: 'MTP3550-T9182736',
      local: 'SBS-001 Cuiabá Central',
      risp: 'RISP 1',
      status: 'Manutenção',
      aquisicao: '2024-03-15',
      obs: 'Bateria com falha de carga. Aguardando substituição desde 15/02/2025.',
    },
    {
      id: 3,
      patrimonio: 'MT-2023-00087',
      tei: '0230087',
      tipo: 'Rádio Veicular',
      modelo: 'Hytera VM685',
      fabricante: 'Hytera',
      serie: 'VM685-H3374829',
      local: 'SBS-012 Rondonópolis',
      risp: 'RISP 2',
      status: 'Ativo',
      aquisicao: '2023-07-20',
      obs: 'Instalado em viatura RO-1423. Funcionamento normal.',
    },
    {
      id: 4,
      patrimonio: 'MT-2023-00088',
      tei: '0230088',
      tipo: 'Gateway',
      modelo: 'Motorola MTP6750',
      fabricante: 'Motorola Solutions',
      serie: 'MTP6750-G8821047',
      local: 'SBS-023 Várzea Grande',
      risp: 'RISP 1',
      status: 'Ativo',
      aquisicao: '2023-07-20',
      obs: 'Gateway de interligação analógico/TETRA.',
    },
    {
      id: 5,
      patrimonio: 'MT-2022-00031',
      tei: '0220031',
      tipo: 'Repetidor',
      modelo: 'Hytera RD985',
      fabricante: 'Hytera',
      serie: 'RD985-H1192847',
      local: 'SBS-034 Sinop',
      risp: 'RISP 3',
      status: 'Manutenção',
      aquisicao: '2022-11-10',
      obs: 'Módulo de RF com defeito. Aguardando importação de peça desde 05/01/2025.',
    },
    {
      id: 6,
      patrimonio: 'MT-2022-00032',
      tei: '0220032',
      tipo: 'Rádio Portátil',
      modelo: 'Sepura STP9000',
      fabricante: 'Sepura',
      serie: 'STP9000-A0928374',
      local: 'SBS-045 Tangará da Serra',
      risp: 'RISP 4',
      status: 'Ativo',
      aquisicao: '2022-11-10',
      obs: '',
    },
    {
      id: 7,
      patrimonio: 'MT-2021-00009',
      tei: '0210009',
      tipo: 'Controlador',
      modelo: 'Zetron Acom 4000',
      fabricante: 'Zetron',
      serie: 'ACOM4000-Z0098271',
      local: 'SBS-001 Cuiabá Central',
      risp: 'RISP 1',
      status: 'Ativo',
      aquisicao: '2021-04-22',
      obs: 'Controlador principal do cluster Cuiabá.',
    },
    {
      id: 8,
      patrimonio: 'MT-2020-00003',
      tei: '0200003',
      tipo: 'Rádio Veicular',
      modelo: 'Sepura SRG3900',
      fabricante: 'Sepura',
      serie: 'SRG3900-A7712903',
      local: null,
      risp: null,
      status: 'Baixado',
      aquisicao: '2020-06-01',
      obs: 'Equipamento danificado em acidente de viatura. Baixado em 12/03/2025.',
    },
    {
      id: 9,
      patrimonio: 'MT-2024-00201',
      tei: '0240201',
      tipo: 'Rádio Portátil',
      modelo: 'Hytera PD785',
      fabricante: 'Hytera',
      serie: 'PD785-H5537621',
      local: null,
      risp: null,
      status: 'Ativo',
      aquisicao: '2024-09-10',
      obs: 'Rádio recebido sem atribuição de local. Aguarda alocação.',
    },
    {
      id: 10,
      patrimonio: 'MT-2024-00202',
      tei: '0240002',
      tipo: 'Rádio Portátil',
      modelo: 'Hytera PD785',
      fabricante: 'Hytera',
      serie: 'PD785-H5537622',
      local: 'SBS-056 Alta Floresta',
      risp: 'RISP 5',
      status: 'Ativo',
      aquisicao: '2024-09-10',
      obs: 'TEI duplicado detectado — verificar cadastro.',
    },
  ],

  _movimentacoes: [
    {
      id: 1,
      equip_id: 2,
      patrimonio: 'MT-2024-00143',
      tipo_evento: 'Manutenção',
      de: 'SBS-001 Cuiabá Central',
      para: 'Oficina SESP — Cuiabá',
      data: '2025-02-15T09:30:00',
      operador: 'Ten. Marcos Oliveira',
      obs: 'Encaminhado para manutenção corretiva. Falha na bateria.',
    },
    {
      id: 2,
      equip_id: 3,
      patrimonio: 'MT-2023-00087',
      tipo_evento: 'Transferência',
      de: 'SBS-001 Cuiabá Central',
      para: 'SBS-012 Rondonópolis',
      data: '2025-01-10T14:00:00',
      operador: 'Sgt. Ana Paula Souza',
      obs: 'Transferência para reforço do efetivo de Rondonópolis.',
    },
    {
      id: 3,
      equip_id: 8,
      patrimonio: 'MT-2020-00003',
      tipo_evento: 'Baixa',
      de: 'SBS-012 Rondonópolis',
      para: '—',
      data: '2025-03-12T11:00:00',
      operador: 'Cap. Rodrigo Fonseca',
      obs: 'Baixa por sinistro. Rádio destruído em acidente de viatura.',
    },
    {
      id: 4,
      equip_id: 1,
      patrimonio: 'MT-2024-00142',
      tipo_evento: 'Entrada',
      de: 'Depósito Central SESP',
      para: 'SBS-001 Cuiabá Central',
      data: '2024-03-20T08:00:00',
      operador: 'Ten. Marcos Oliveira',
      obs: 'Entrada de novo equipamento adquirido no pregão 2024.',
    },
    {
      id: 5,
      equip_id: 5,
      patrimonio: 'MT-2022-00031',
      tipo_evento: 'Manutenção',
      de: 'SBS-034 Sinop',
      para: 'Assistência Hytera — São Paulo',
      data: '2025-01-05T16:30:00',
      operador: 'Sgt. Carlos Mendes',
      obs: 'Módulo de RF com defeito crítico. Enviado para assistência técnica autorizada.',
    },
    {
      id: 6,
      equip_id: 6,
      patrimonio: 'MT-2022-00032',
      tipo_evento: 'Transferência',
      de: 'SBS-023 Várzea Grande',
      para: 'SBS-045 Tangará da Serra',
      data: '2024-11-18T10:00:00',
      operador: 'Ten. Fernanda Lima',
      obs: 'Redistribuição de equipamentos pela RISP 4.',
    },
    {
      id: 7,
      equip_id: 9,
      patrimonio: 'MT-2024-00201',
      tipo_evento: 'Entrada',
      de: 'Depósito Central SESP',
      para: 'Sem localização',
      data: '2024-09-12T09:00:00',
      operador: 'Sgt. Ana Paula Souza',
      obs: 'Equipamento recebido sem designação de local. Aguarda alocação.',
    },
    {
      id: 8,
      equip_id: 4,
      patrimonio: 'MT-2023-00088',
      tipo_evento: 'Entrada',
      de: 'Depósito Central SESP',
      para: 'SBS-023 Várzea Grande',
      data: '2023-08-01T13:00:00',
      operador: 'Cap. Rodrigo Fonseca',
      obs: 'Gateway instalado no site de Várzea Grande.',
    },
  ],

  _locais: [
    'SBS-001 Cuiabá Central',
    'SBS-012 Rondonópolis',
    'SBS-023 Várzea Grande',
    'SBS-034 Sinop',
    'SBS-045 Tangará da Serra',
    'SBS-056 Alta Floresta',
    'SBS-067 Barra do Garças',
    'SBS-078 Juína',
    'Depósito Central SESP',
    'Oficina SESP — Cuiabá',
  ],

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  renderDashboard(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Equipamentos / Patrimônio</div>
            <div class="page-sub">Inventário individual · Rádios TETRA · Por localização</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Equipamentos.renderDashboard(document.getElementById('main-content'))">↻ Atualizar</button>
          </div>
        </div>

        <!-- KPIs -->
        <div id="eq-kpis" class="kpi-grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:16px"></div>

        <!-- Charts -->
        <div style="display:grid;grid-template-columns:240px 1fr;gap:12px;margin-bottom:16px">
          <div class="card" style="height:260px;display:flex;flex-direction:column">
            <div class="card-title">Por Status</div>
            <canvas id="chart-eq-status" style="flex:1;min-height:0"></canvas>
          </div>
          <div class="card" style="height:260px;display:flex;flex-direction:column">
            <div class="card-title">Por Tipo de Equipamento</div>
            <canvas id="chart-eq-tipo" style="flex:1;min-height:0"></canvas>
          </div>
        </div>

        <!-- Tabela de movimentações recentes -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px 10px;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="font-weight:700;font-size:13px;color:var(--text)">Últimas Movimentações</span>
          </div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Tipo</th>
                  <th>De → Para</th>
                  <th>Data</th>
                  <th>Operador</th>
                </tr>
              </thead>
              <tbody id="eq-mov-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    Equipamentos._renderDashboardKPIs();
    Equipamentos._renderDashboardCharts();
    Equipamentos._renderDashboardMovs();
  },

  _renderDashboardKPIs() {
    const eq = Equipamentos._equipamentos;
    const total      = eq.length;
    const ativos     = eq.filter(e => e.status === 'Ativo').length;
    const manutencao = eq.filter(e => e.status === 'Manutenção').length;
    const baixados   = eq.filter(e => e.status === 'Baixado').length;
    const semLocal   = eq.filter(e => !e.local).length;
    const tipos      = [...new Set(eq.map(e => e.tipo))].length;

    const el = document.getElementById('eq-kpis');
    if (!el) return;
    el.innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-label">Total Equipamentos</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-sub">no inventário</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Ativos</div>
        <div class="kpi-value">${ativos}</div>
        <div class="kpi-sub">${Math.round(ativos/total*100)}% do total</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Em Manutenção</div>
        <div class="kpi-value">${manutencao}</div>
        <div class="kpi-sub">aguardando reparo</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Baixados</div>
        <div class="kpi-value">${baixados}</div>
        <div class="kpi-sub">fora de uso</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Sem Localização</div>
        <div class="kpi-value">${semLocal}</div>
        <div class="kpi-sub">aguardando alocação</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">Tipos Cadastrados</div>
        <div class="kpi-value">${tipos}</div>
        <div class="kpi-sub">categorias distintas</div>
      </div>`;
  },

  _renderDashboardCharts() {
    // Destroi charts anteriores
    Object.values(Equipamentos._charts).forEach(c => { try { c.destroy(); } catch {} });
    Equipamentos._charts = {};

    const eq = Equipamentos._equipamentos;

    // Donut — Por Status
    const statusMap = {};
    eq.forEach(e => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });
    const statusColors = { 'Ativo': '#22c55e', 'Manutenção': '#fbbf24', 'Baixado': '#ef4444' };

    const c1 = document.getElementById('chart-eq-status');
    if (c1) {
      Equipamentos._charts.status = new Chart(c1, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusMap),
          datasets: [{
            data: Object.values(statusMap),
            backgroundColor: Object.keys(statusMap).map(k => statusColors[k] || '#64748b'),
            borderWidth: 0,
            hoverOffset: 6,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#c4d8f0', font: { size: 10 }, padding: 10, boxWidth: 10 }
            }
          },
          cutout: '65%',
        }
      });
    }

    // Bar — Por Tipo
    const tipoMap = {};
    eq.forEach(e => { tipoMap[e.tipo] = (tipoMap[e.tipo] || 0) + 1; });
    const tipoColors = [
      '#3b82f6', '#22c55e', '#fbbf24', '#a855f7', '#f97316', '#06b6d4'
    ];

    const c2 = document.getElementById('chart-eq-tipo');
    if (c2) {
      Equipamentos._charts.tipo = new Chart(c2, {
        type: 'bar',
        data: {
          labels: Object.keys(tipoMap),
          datasets: [{
            data: Object.values(tipoMap),
            backgroundColor: Object.keys(tipoMap).map((_, i) => tipoColors[i % tipoColors.length]),
            borderRadius: 4,
            barThickness: 26,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: '#c4d8f0', font: { size: 11 } },
              grid: { display: false }
            },
            y: {
              ticks: { color: '#c4d8f0', font: { size: 11 }, stepSize: 1 },
              grid: { color: 'rgba(255,255,255,0.05)' },
              beginAtZero: true,
            }
          }
        }
      });
    }
  },

  _renderDashboardMovs() {
    const tbody = document.getElementById('eq-mov-tbody');
    if (!tbody) return;

    const movs = [...Equipamentos._movimentacoes]
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 8);

    const tipoEventoBadge = {
      'Manutenção':   '<span class="badge-amber">Manutenção</span>',
      'Transferência': '<span class="badge-blue">Transferência</span>',
      'Baixa':        '<span class="badge-red">Baixa</span>',
      'Entrada':      '<span class="badge-green">Entrada</span>',
    };

    const equip = Equipamentos._equipamentos;

    tbody.innerHTML = movs.map(m => {
      const eq = equip.find(e => e.id === m.equip_id);
      const nome = eq ? `${m.patrimonio} — ${eq.modelo}` : m.patrimonio;
      const tipo = eq ? eq.tipo : '—';
      return `
        <tr>
          <td style="font-family:var(--mono);font-size:11px">${nome}</td>
          <td>${tipo}</td>
          <td style="color:var(--text2);font-size:12px">
            <span style="color:var(--text3)">${m.de}</span>
            <span style="color:var(--accent);margin:0 4px">→</span>
            <span>${m.para}</span>
          </td>
          <td style="font-family:var(--mono);font-size:11px">${formatDateTime(m.data)}</td>
          <td style="color:var(--text2)">${m.operador}</td>
        </tr>`;
    }).join('');
  },

  // ── REGISTROS ────────────────────────────────────────────────────────────────
  renderRegistros(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Registro de Equipamentos</div>
            <div class="page-sub">Inventário individual de rádios TETRA e acessórios</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm perm-edit" onclick="Equipamentos._modalCadastrar()">+ Novo Equipamento</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <select class="form-select" id="eqr-tipo" onchange="Equipamentos._applyFilter()" style="width:160px">
            <option value="">Todos os tipos</option>
            <option>Rádio Portátil</option>
            <option>Rádio Veicular</option>
            <option>Gateway</option>
            <option>Repetidor</option>
            <option>Controlador</option>
          </select>
          <select class="form-select" id="eqr-status" onchange="Equipamentos._applyFilter()" style="width:150px">
            <option value="">Todos os status</option>
            <option>Ativo</option>
            <option>Manutenção</option>
            <option>Baixado</option>
          </select>
          <select class="form-select" id="eqr-risp" onchange="Equipamentos._applyFilter()" style="width:140px">
            <option value="">Todas RISPs</option>
            <option>RISP 1</option>
            <option>RISP 2</option>
            <option>RISP 3</option>
            <option>RISP 4</option>
            <option>RISP 5</option>
          </select>
          <input class="form-input" id="eqr-busca" placeholder="Buscar TEI, série, patrimônio..." oninput="Equipamentos._applyFilter()" style="width:240px">
        </div>

        <!-- Contagem -->
        <div id="eqr-summary" style="margin-bottom:10px;font-size:12px;color:var(--text3)"></div>

        <!-- Tabela -->
        <div class="card" style="padding:0">
          <div id="eqr-table" class="table-wrap" style="border:none"></div>
        </div>
      </div>`;

    Equipamentos._filteredData = [...Equipamentos._equipamentos];
    Equipamentos._renderTable();
  },

  _applyFilter() {
    const tipo   = document.getElementById('eqr-tipo')?.value || '';
    const status = document.getElementById('eqr-status')?.value || '';
    const risp   = document.getElementById('eqr-risp')?.value || '';
    const busca  = (document.getElementById('eqr-busca')?.value || '').toLowerCase();

    Equipamentos._filteredData = Equipamentos._equipamentos.filter(e => {
      if (tipo   && e.tipo !== tipo)     return false;
      if (status && e.status !== status) return false;
      if (risp   && e.risp !== risp)     return false;
      if (busca  && ![e.tei, e.serie, e.patrimonio, e.modelo, e.local].join(' ').toLowerCase().includes(busca)) return false;
      return true;
    });

    Equipamentos._renderTable();
  },

  _renderTable() {
    const wrap = document.getElementById('eqr-table');
    if (!wrap) return;

    const summary = document.getElementById('eqr-summary');
    if (summary) summary.textContent = `${Equipamentos._filteredData.length} equipamento(s) encontrado(s)`;

    if (!Equipamentos._filteredData.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-title">Nenhum equipamento encontrado</div><div class="empty-state-sub">Ajuste os filtros ou cadastre um novo equipamento.</div></div>`;
      return;
    }

    const statusBadge = {
      'Ativo':       '<span class="badge-green">Ativo</span>',
      'Manutenção':  '<span class="badge-amber">Manutenção</span>',
      'Baixado':     '<span class="badge-red">Baixado</span>',
    };

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nº Patrimônio</th>
            <th>TEI</th>
            <th>Tipo</th>
            <th>Modelo</th>
            <th>Fabricante</th>
            <th>Nº Série</th>
            <th>Local / Site</th>
            <th>Status</th>
            <th style="text-align:center">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${Equipamentos._filteredData.map(e => `
            <tr>
              <td style="font-family:var(--mono);font-size:11px">${e.patrimonio}</td>
              <td style="font-family:var(--mono);font-size:11px;color:var(--accent)">${e.tei}</td>
              <td style="font-size:12px">${e.tipo}</td>
              <td style="font-weight:600">${e.modelo}</td>
              <td style="color:var(--text2);font-size:12px">${e.fabricante}</td>
              <td style="font-family:var(--mono);font-size:10px;color:var(--text3)">${e.serie}</td>
              <td style="font-size:12px">${e.local || '<span style="color:var(--orange)">Sem localização</span>'}</td>
              <td>${statusBadge[e.status] || e.status}</td>
              <td style="text-align:center;white-space:nowrap">
                <button class="btn btn-ghost btn-sm" onclick="Equipamentos._modalFicha(${e.id})" style="font-size:11px;padding:3px 8px;margin-right:4px">📋 Ficha</button>
                <button class="btn btn-ghost btn-sm perm-edit" onclick="Equipamentos._modalEditar(${e.id})" style="font-size:11px;padding:3px 8px">✏️ Editar</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  // Modal Cadastrar
  _modalCadastrar() {
    Equipamentos._modalForm(null);
  },

  // Modal Editar
  _modalEditar(id) {
    const eq = Equipamentos._equipamentos.find(e => e.id === id);
    if (!eq) return;
    Equipamentos._modalForm(eq);
  },

  _modalForm(eq) {
    const isEdit = !!eq;
    const locaisOpts = Equipamentos._locais.map(l =>
      `<option value="${l}" ${eq?.local === l ? 'selected' : ''}>${l}</option>`
    ).join('');

    const html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Tipo *</label>
          <select class="form-select" id="mf-tipo" style="width:100%">
            ${['Rádio Portátil','Rádio Veicular','Gateway','Repetidor','Controlador'].map(t =>
              `<option ${eq?.tipo === t ? 'selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Modelo *</label>
          <input class="form-input" id="mf-modelo" value="${eq?.modelo || ''}" placeholder="Ex: Sepura SRH3800" style="width:100%">
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Fabricante *</label>
          <input class="form-input" id="mf-fabricante" value="${eq?.fabricante || ''}" placeholder="Ex: Sepura" style="width:100%">
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Nº Série *</label>
          <input class="form-input" id="mf-serie" value="${eq?.serie || ''}" placeholder="Ex: SRH3800-A2847691" style="width:100%">
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">TEI</label>
          <input class="form-input" id="mf-tei" value="${eq?.tei || ''}" placeholder="Ex: 0240001" style="width:100%" maxlength="15">
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Nº Patrimônio *</label>
          <input class="form-input" id="mf-patrimonio" value="${eq?.patrimonio || ''}" placeholder="Ex: MT-2024-00142" style="width:100%">
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Local / Site</label>
          <select class="form-select" id="mf-local" style="width:100%">
            <option value="">— Sem localização —</option>
            ${locaisOpts}
          </select>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Status *</label>
          <select class="form-select" id="mf-status" style="width:100%">
            ${['Ativo','Manutenção','Baixado'].map(s =>
              `<option ${eq?.status === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Data Aquisição</label>
          <input type="date" class="form-input" id="mf-aquisicao" value="${eq?.aquisicao || ''}" style="width:100%">
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">RISP</label>
          <select class="form-select" id="mf-risp" style="width:100%">
            <option value="">— Sem RISP —</option>
            ${['RISP 1','RISP 2','RISP 3','RISP 4','RISP 5'].map(r =>
              `<option ${eq?.risp === r ? 'selected' : ''}>${r}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div style="margin-top:12px">
        <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--text2)">Observações</label>
        <textarea class="form-input" id="mf-obs" rows="3" style="width:100%;resize:vertical">${eq?.obs || ''}</textarea>
      </div>`;

    Modal.open(
      isEdit ? `Editar Equipamento — ${eq.patrimonio}` : 'Cadastrar Novo Equipamento',
      html,
      [
        { label: 'Cancelar', class: 'btn-ghost', action: () => {} },
        {
          label: isEdit ? 'Salvar Alterações' : 'Cadastrar',
          class: 'btn-primary',
          action: () => Equipamentos._salvarForm(eq?.id || null)
        }
      ]
    );
  },

  _salvarForm(id) {
    const get = sel => document.getElementById(sel)?.value?.trim() || '';
    const modelo = get('mf-modelo');
    const patrimonio = get('mf-patrimonio');
    if (!modelo || !patrimonio) {
      Toast.show('Preencha os campos obrigatórios (Modelo e Nº Patrimônio).', 'erro');
      return;
    }

    if (id) {
      const eq = Equipamentos._equipamentos.find(e => e.id === id);
      if (eq) {
        eq.tipo        = get('mf-tipo');
        eq.modelo      = modelo;
        eq.fabricante  = get('mf-fabricante');
        eq.serie       = get('mf-serie');
        eq.tei         = get('mf-tei');
        eq.patrimonio  = patrimonio;
        eq.local       = get('mf-local') || null;
        eq.status      = get('mf-status');
        eq.aquisicao   = get('mf-aquisicao');
        eq.risp        = get('mf-risp') || null;
        eq.obs         = get('mf-obs');
        Toast.show('Equipamento atualizado com sucesso.', 'sucesso');
      }
    } else {
      const newId = Math.max(...Equipamentos._equipamentos.map(e => e.id)) + 1;
      Equipamentos._equipamentos.push({
        id: newId,
        patrimonio,
        tei:        get('mf-tei'),
        tipo:       get('mf-tipo'),
        modelo,
        fabricante: get('mf-fabricante'),
        serie:      get('mf-serie'),
        local:      get('mf-local') || null,
        risp:       get('mf-risp') || null,
        status:     get('mf-status'),
        aquisicao:  get('mf-aquisicao'),
        obs:        get('mf-obs'),
      });
      Toast.show('Equipamento cadastrado com sucesso.', 'sucesso');
    }

    Equipamentos._filteredData = [...Equipamentos._equipamentos];
    Equipamentos._renderTable();
  },

  // Modal Ficha Completa
  _modalFicha(id) {
    const eq = Equipamentos._equipamentos.find(e => e.id === id);
    if (!eq) return;

    const statusBadge = {
      'Ativo':       '<span class="badge-green">Ativo</span>',
      'Manutenção':  '<span class="badge-amber">Manutenção</span>',
      'Baixado':     '<span class="badge-red">Baixado</span>',
    };

    const movs = Equipamentos._movimentacoes
      .filter(m => m.equip_id === id)
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    const tipoEventoStyle = {
      'Manutenção':   { color: 'var(--amber)',  icon: '🔧' },
      'Transferência':{ color: 'var(--accent)',  icon: '🔀' },
      'Baixa':        { color: 'var(--red)',     icon: '⛔' },
      'Entrada':      { color: 'var(--green)',   icon: '✅' },
    };

    const timeline = movs.length
      ? movs.map(m => {
          const s = tipoEventoStyle[m.tipo_evento] || { color: 'var(--text3)', icon: '📝' };
          return `
            <div style="display:flex;gap:12px;margin-bottom:12px">
              <div style="display:flex;flex-direction:column;align-items:center">
                <div style="width:32px;height:32px;border-radius:50%;background:${s.color}22;border:2px solid ${s.color};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${s.icon}</div>
                <div style="width:2px;flex:1;background:rgba(255,255,255,.08);margin-top:4px"></div>
              </div>
              <div style="flex:1;padding-bottom:4px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
                  <span style="font-weight:700;color:${s.color};font-size:12px">${m.tipo_evento}</span>
                  <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">${formatDateTime(m.data)}</span>
                </div>
                <div style="font-size:12px;color:var(--text2);margin-bottom:2px">
                  <span style="color:var(--text3)">${m.de}</span>
                  <span style="color:var(--accent);margin:0 6px">→</span>
                  <span>${m.para}</span>
                </div>
                <div style="font-size:11px;color:var(--text3)">${m.obs}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">Operador: ${m.operador}</div>
              </div>
            </div>`;
        }).join('')
      : `<div class="empty-state" style="padding:24px"><div class="empty-state-title">Nenhuma movimentação registrada</div></div>`;

    const html = `
      <!-- Cabeçalho do equipamento -->
      <div style="background:var(--surface2);border-radius:8px;padding:16px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Nº Patrimônio</div>
          <div style="font-family:var(--mono);font-weight:700;color:var(--accent)">${eq.patrimonio}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">TEI</div>
          <div style="font-family:var(--mono);font-weight:700">${eq.tei}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Tipo</div>
          <div style="font-weight:600">${eq.tipo}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Modelo</div>
          <div style="font-weight:600">${eq.modelo}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Fabricante</div>
          <div>${eq.fabricante}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Nº Série</div>
          <div style="font-family:var(--mono);font-size:11px">${eq.serie}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Local / Site</div>
          <div>${eq.local || '<span style="color:var(--orange)">Sem localização</span>'}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Status</div>
          <div>${statusBadge[eq.status] || eq.status}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">RISP</div>
          <div>${eq.risp || '—'}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Data Aquisição</div>
          <div>${eq.aquisicao ? formatDate(eq.aquisicao) : '—'}</div>
        </div>
        ${eq.obs ? `<div style="grid-column:1/-1">
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Observações</div>
          <div style="font-size:12px;color:var(--text2)">${eq.obs}</div>
        </div>` : ''}
      </div>

      <!-- Timeline -->
      <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:12px">Histórico de Movimentações</div>
      <div style="max-height:340px;overflow-y:auto;padding-right:4px">${timeline}</div>`;

    Modal.open(`Ficha — ${eq.modelo}`, html, [
      { label: 'Fechar', class: 'btn-ghost', action: () => {} },
      { label: '✏️ Editar', class: 'btn-primary perm-edit', action: () => Equipamentos._modalEditar(id) }
    ]);
  },

  // ── HISTÓRICO ────────────────────────────────────────────────────────────────
  renderHistorico(el) {
    const hoje  = new Date().toISOString().slice(0, 10);
    const ha90  = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Histórico de Movimentações</div>
            <div class="page-sub">Timeline de transferências, manutenções, entradas e baixas</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Equipamentos.renderHistorico(document.getElementById('main-content'))">↻ Atualizar</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <select class="form-select" id="eqh-tipo" onchange="Equipamentos._applyHistFilter()" style="width:170px">
            <option value="">Todos os eventos</option>
            <option>Manutenção</option>
            <option>Transferência</option>
            <option>Baixa</option>
            <option>Entrada</option>
          </select>
          <input type="date" class="form-input" id="eqh-ini" value="${ha90}" onchange="Equipamentos._applyHistFilter()" style="width:150px">
          <input type="date" class="form-input" id="eqh-fim" value="${hoje}" onchange="Equipamentos._applyHistFilter()" style="width:150px">
          <input class="form-input" id="eqh-busca" placeholder="Buscar equipamento, TEI..." oninput="Equipamentos._applyHistFilter()" style="width:220px">
        </div>

        <!-- Timeline -->
        <div id="eqh-timeline"></div>
      </div>`;

    Equipamentos._applyHistFilter();
  },

  _applyHistFilter() {
    const tipo  = document.getElementById('eqh-tipo')?.value || '';
    const ini   = document.getElementById('eqh-ini')?.value || '';
    const fim   = document.getElementById('eqh-fim')?.value || '';
    const busca = (document.getElementById('eqh-busca')?.value || '').toLowerCase();

    let movs = [...Equipamentos._movimentacoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    if (tipo)  movs = movs.filter(m => m.tipo_evento === tipo);
    if (ini)   movs = movs.filter(m => m.data >= ini);
    if (fim)   movs = movs.filter(m => m.data.slice(0,10) <= fim);
    if (busca) {
      movs = movs.filter(m => {
        const eq = Equipamentos._equipamentos.find(e => e.id === m.equip_id);
        return [m.patrimonio, eq?.tei || '', eq?.modelo || '', m.de, m.para, m.operador]
          .join(' ').toLowerCase().includes(busca);
      });
    }

    Equipamentos._renderHistTimeline(movs);
  },

  _renderHistTimeline(movs) {
    const wrap = document.getElementById('eqh-timeline');
    if (!wrap) return;

    if (!movs.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-title">Nenhuma movimentação encontrada</div><div class="empty-state-sub">Ajuste os filtros para ampliar a busca.</div></div>`;
      return;
    }

    const tipoStyle = {
      'Manutenção':    { borderColor: 'var(--amber)',  bg: 'rgba(251,191,36,.08)',  icon: '🔧', label: 'Manutenção' },
      'Transferência': { borderColor: 'var(--accent)', bg: 'rgba(59,130,246,.08)',  icon: '🔀', label: 'Transferência' },
      'Baixa':         { borderColor: 'var(--red)',    bg: 'rgba(239,68,68,.08)',   icon: '⛔', label: 'Baixa' },
      'Entrada':       { borderColor: 'var(--green)',  bg: 'rgba(34,197,94,.08)',   icon: '✅', label: 'Entrada' },
    };

    wrap.innerHTML = movs.map(m => {
      const s  = tipoStyle[m.tipo_evento] || { borderColor: 'var(--text3)', bg: 'transparent', icon: '📝', label: m.tipo_evento };
      const eq = Equipamentos._equipamentos.find(e => e.id === m.equip_id);
      return `
        <div style="display:flex;gap:14px;margin-bottom:12px">
          <!-- Ícone + linha -->
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
            <div style="width:36px;height:36px;border-radius:50%;background:${s.bg};border:2px solid ${s.borderColor};display:flex;align-items:center;justify-content:center;font-size:16px">${s.icon}</div>
            <div style="width:2px;flex:1;background:rgba(255,255,255,.06);margin-top:4px"></div>
          </div>
          <!-- Conteúdo -->
          <div style="flex:1;background:var(--surface);border:1px solid rgba(255,255,255,.07);border-left:3px solid ${s.borderColor};border-radius:8px;padding:12px 14px;margin-bottom:4px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px;margin-bottom:6px">
              <div>
                <span style="font-weight:700;color:${s.borderColor};font-size:12px;margin-right:8px">${s.label}</span>
                <span style="font-weight:700;color:var(--text);font-size:13px">${eq?.modelo || '—'}</span>
                <span style="font-family:var(--mono);font-size:11px;color:var(--accent);margin-left:8px">${m.patrimonio}</span>
                ${eq ? `<span style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-left:4px">TEI: ${eq.tei}</span>` : ''}
              </div>
              <span style="font-size:11px;color:var(--text3);font-family:var(--mono);white-space:nowrap">${formatDateTime(m.data)}</span>
            </div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:4px">
              <span style="color:var(--text3)">${m.de}</span>
              <span style="color:var(--accent);margin:0 8px">→</span>
              <span>${m.para}</span>
            </div>
            ${m.obs ? `<div style="font-size:11px;color:var(--text3);margin-bottom:4px">${m.obs}</div>` : ''}
            <div style="font-size:11px;color:var(--text3)">Operador: <strong style="color:var(--text2)">${m.operador}</strong></div>
          </div>
        </div>`;
    }).join('');
  },

  // ── ALERTAS ──────────────────────────────────────────────────────────────────
  renderAlertas(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Alertas — Equipamentos</div>
            <div class="page-sub">Situações que requerem ação imediata no inventário</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Equipamentos.renderAlertas(document.getElementById('main-content'))">↻ Atualizar</button>
          </div>
        </div>
        <div id="eq-alertas-content"></div>
      </div>`;

    Equipamentos._renderAlertasContent();
  },

  _renderAlertasContent() {
    const wrap = document.getElementById('eq-alertas-content');
    if (!wrap) return;

    const eq   = Equipamentos._equipamentos;
    const movs = Equipamentos._movimentacoes;

    // ① Sem Localização
    const semLocal = eq.filter(e => !e.local && e.status !== 'Baixado');

    // ② Em Manutenção > 30 dias
    const hoje = new Date();
    const emManut30 = eq.filter(e => {
      if (e.status !== 'Manutenção') return false;
      const mov = movs
        .filter(m => m.equip_id === e.id && m.tipo_evento === 'Manutenção')
        .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
      if (!mov) return false;
      const dias = (hoje - new Date(mov.data)) / 86400000;
      return dias > 30;
    });

    // ③ TEI Duplicado
    const teiCount = {};
    eq.forEach(e => { teiCount[e.tei] = (teiCount[e.tei] || 0) + 1; });
    const teiDupl = Object.entries(teiCount)
      .filter(([, cnt]) => cnt > 1)
      .map(([tei]) => eq.filter(e => e.tei === tei))
      .flat();

    wrap.innerHTML = `
      <!-- Seção 1: Sem Localização -->
      <div class="card" style="border-left:4px solid var(--red);margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <span style="font-size:20px">📍</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px;color:var(--red)">Sem Localização Definida</div>
            <div style="font-size:12px;color:var(--text3)">Equipamentos ativos sem local/site atribuído</div>
          </div>
          <span class="badge-red">${semLocal.length}</span>
        </div>
        ${semLocal.length ? `
          <div class="table-wrap" style="border:none;padding:0">
            <table>
              <thead><tr><th>Patrimônio</th><th>TEI</th><th>Tipo</th><th>Modelo</th><th>Status</th><th>Ação</th></tr></thead>
              <tbody>
                ${semLocal.map(e => `
                  <tr>
                    <td style="font-family:var(--mono);font-size:11px">${e.patrimonio}</td>
                    <td style="font-family:var(--mono);font-size:11px;color:var(--accent)">${e.tei}</td>
                    <td style="font-size:12px">${e.tipo}</td>
                    <td style="font-weight:600">${e.modelo}</td>
                    <td><span class="badge-green">${e.status}</span></td>
                    <td><button class="btn btn-ghost btn-sm perm-edit" onclick="Equipamentos._modalEditar(${e.id})" style="font-size:11px;padding:3px 8px">Alocar</button></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `<div style="color:var(--green);font-size:13px;font-weight:600">✅ Todos os equipamentos ativos possuem localização definida.</div>`}
      </div>

      <!-- Seção 2: Manutenção > 30 dias -->
      <div class="card" style="border-left:4px solid var(--amber);margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <span style="font-size:20px">🔧</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px;color:var(--amber)">Em Manutenção há mais de 30 dias</div>
            <div style="font-size:12px;color:var(--text3)">Equipamentos parados por longo período</div>
          </div>
          <span class="badge-amber">${emManut30.length}</span>
        </div>
        ${emManut30.length ? `
          <div class="table-wrap" style="border:none;padding:0">
            <table>
              <thead><tr><th>Patrimônio</th><th>TEI</th><th>Modelo</th><th>Último Evento</th><th>Dias Parado</th><th>Ação</th></tr></thead>
              <tbody>
                ${emManut30.map(e => {
                  const mov = movs
                    .filter(m => m.equip_id === e.id && m.tipo_evento === 'Manutenção')
                    .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
                  const dias = mov ? Math.floor((hoje - new Date(mov.data)) / 86400000) : '?';
                  return `
                    <tr>
                      <td style="font-family:var(--mono);font-size:11px">${e.patrimonio}</td>
                      <td style="font-family:var(--mono);font-size:11px;color:var(--accent)">${e.tei}</td>
                      <td style="font-weight:600">${e.modelo}</td>
                      <td style="font-size:11px;color:var(--text3)">${mov ? formatDate(mov.data) : '—'}</td>
                      <td><span style="font-weight:700;color:var(--amber)">${dias}d</span></td>
                      <td><button class="btn btn-ghost btn-sm" onclick="Equipamentos._modalFicha(${e.id})" style="font-size:11px;padding:3px 8px">📋 Ficha</button></td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>` : `<div style="color:var(--green);font-size:13px;font-weight:600">✅ Nenhum equipamento em manutenção por mais de 30 dias.</div>`}
      </div>

      <!-- Seção 3: TEI Duplicado -->
      <div class="card" style="border-left:4px solid var(--orange)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <span style="font-size:20px">⚠️</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px;color:var(--orange)">TEI Duplicado Detectado</div>
            <div style="font-size:12px;color:var(--text3)">TEIs que aparecem em mais de um registro — requer correção urgente</div>
          </div>
          <span style="background:var(--orange);color:#fff;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700">${teiDupl.length}</span>
        </div>
        ${teiDupl.length ? `
          <div class="table-wrap" style="border:none;padding:0">
            <table>
              <thead><tr><th>TEI</th><th>Patrimônio</th><th>Modelo</th><th>Local</th><th>Status</th><th>Ação</th></tr></thead>
              <tbody>
                ${teiDupl.map(e => `
                  <tr>
                    <td style="font-family:var(--mono);font-size:11px;color:var(--orange);font-weight:700">${e.tei}</td>
                    <td style="font-family:var(--mono);font-size:11px">${e.patrimonio}</td>
                    <td style="font-weight:600">${e.modelo}</td>
                    <td style="font-size:12px">${e.local || '<span style="color:var(--orange)">Sem local</span>'}</td>
                    <td><span class="badge-${e.status === 'Ativo' ? 'green' : e.status === 'Manutenção' ? 'amber' : 'red'}">${e.status}</span></td>
                    <td><button class="btn btn-ghost btn-sm perm-edit" onclick="Equipamentos._modalEditar(${e.id})" style="font-size:11px;padding:3px 8px">✏️ Corrigir</button></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `<div style="color:var(--green);font-size:13px;font-weight:600">✅ Nenhum TEI duplicado encontrado.</div>`}
      </div>`;
  },

  // ── RELATÓRIO ────────────────────────────────────────────────────────────────
  renderRelatorio(el) {
    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Relatório de Inventário</div>
            <div class="page-sub">Geração de relatórios de inventário de equipamentos TETRA</div>
          </div>
        </div>

        <!-- Filtros de relatório -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-title" style="margin-bottom:12px">Parâmetros do Relatório</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
            <div>
              <label style="display:block;font-size:12px;color:var(--text3);margin-bottom:4px">Tipo</label>
              <select class="form-select" id="eqrel-tipo" onchange="Equipamentos._renderRelatorio()" style="width:160px">
                <option value="">Todos os tipos</option>
                <option>Rádio Portátil</option>
                <option>Rádio Veicular</option>
                <option>Gateway</option>
                <option>Repetidor</option>
                <option>Controlador</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:12px;color:var(--text3);margin-bottom:4px">Status</label>
              <select class="form-select" id="eqrel-status" onchange="Equipamentos._renderRelatorio()" style="width:150px">
                <option value="">Todos</option>
                <option>Ativo</option>
                <option>Manutenção</option>
                <option>Baixado</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:12px;color:var(--text3);margin-bottom:4px">RISP / Local</label>
              <select class="form-select" id="eqrel-risp" onchange="Equipamentos._renderRelatorio()" style="width:150px">
                <option value="">Todos</option>
                <option>RISP 1</option>
                <option>RISP 2</option>
                <option>RISP 3</option>
                <option>RISP 4</option>
                <option>RISP 5</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:12px;color:var(--text3);margin-bottom:4px">Data Aq. Início</label>
              <input type="date" class="form-input" id="eqrel-ini" onchange="Equipamentos._renderRelatorio()" style="width:150px">
            </div>
            <div>
              <label style="display:block;font-size:12px;color:var(--text3);margin-bottom:4px">Data Aq. Fim</label>
              <input type="date" class="form-input" id="eqrel-fim" value="${new Date().toISOString().slice(0,10)}" onchange="Equipamentos._renderRelatorio()" style="width:150px">
            </div>
          </div>
        </div>

        <!-- Botões de exportação -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
          <button class="btn btn-primary btn-sm" onclick="Equipamentos._exportar('pdf-completo')">📄 PDF Inventário Completo</button>
          <button class="btn btn-ghost btn-sm" onclick="Equipamentos._exportar('pdf-tipo')">📄 PDF por Tipo</button>
          <button class="btn btn-ghost btn-sm" onclick="Equipamentos._exportar('pdf-local')">📄 PDF por Local</button>
          <button class="btn btn-ghost btn-sm" onclick="Equipamentos._exportar('excel')">📊 Excel</button>
        </div>

        <!-- Tabela resumo por tipo -->
        <div class="card" style="padding:0;margin-bottom:16px">
          <div style="padding:14px 18px 10px;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="font-weight:700;font-size:13px;color:var(--text)">Resumo por Tipo de Equipamento</span>
          </div>
          <div id="eqrel-resumo" class="table-wrap" style="border:none"></div>
        </div>

        <!-- Tabela detalhada -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px 10px;border-bottom:1px solid rgba(255,255,255,.06)">
            <span id="eqrel-detail-title" style="font-weight:700;font-size:13px;color:var(--text)">Listagem Detalhada</span>
          </div>
          <div id="eqrel-detail" class="table-wrap" style="border:none"></div>
        </div>
      </div>`;

    Equipamentos._renderRelatorio();
  },

  _renderRelatorio() {
    const tipo   = document.getElementById('eqrel-tipo')?.value || '';
    const status = document.getElementById('eqrel-status')?.value || '';
    const risp   = document.getElementById('eqrel-risp')?.value || '';
    const ini    = document.getElementById('eqrel-ini')?.value || '';
    const fim    = document.getElementById('eqrel-fim')?.value || '';

    let data = Equipamentos._equipamentos.filter(e => {
      if (tipo   && e.tipo !== tipo)     return false;
      if (status && e.status !== status) return false;
      if (risp   && e.risp !== risp)     return false;
      if (ini    && e.aquisicao < ini)   return false;
      if (fim    && e.aquisicao > fim)   return false;
      return true;
    });

    // Resumo por tipo
    const tiposUniq = [...new Set(Equipamentos._equipamentos.map(e => e.tipo))];
    const resumoWrap = document.getElementById('eqrel-resumo');
    if (resumoWrap) {
      resumoWrap.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Tipo de Equipamento</th>
              <th style="text-align:center">Total</th>
              <th style="text-align:center">Ativos</th>
              <th style="text-align:center">Manutenção</th>
              <th style="text-align:center">Baixados</th>
              <th style="text-align:center">% Ativo</th>
            </tr>
          </thead>
          <tbody>
            ${tiposUniq.map(t => {
              const grupo = Equipamentos._equipamentos.filter(e => e.tipo === t);
              const ativos = grupo.filter(e => e.status === 'Ativo').length;
              const manut  = grupo.filter(e => e.status === 'Manutenção').length;
              const baixos = grupo.filter(e => e.status === 'Baixado').length;
              const pct    = grupo.length ? Math.round(ativos / grupo.length * 100) : 0;
              return `
                <tr>
                  <td style="font-weight:600">${t}</td>
                  <td style="text-align:center">${grupo.length}</td>
                  <td style="text-align:center"><span class="badge-green">${ativos}</span></td>
                  <td style="text-align:center"><span class="badge-amber">${manut}</span></td>
                  <td style="text-align:center"><span class="badge-red">${baixos}</span></td>
                  <td style="text-align:center">
                    <span style="font-weight:700;color:${pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'}">${pct}%</span>
                  </td>
                </tr>`;
            }).join('')}
            <!-- Totais -->
            <tr style="border-top:2px solid rgba(255,255,255,.12);font-weight:700">
              <td>TOTAL GERAL</td>
              <td style="text-align:center">${Equipamentos._equipamentos.length}</td>
              <td style="text-align:center">${Equipamentos._equipamentos.filter(e => e.status === 'Ativo').length}</td>
              <td style="text-align:center">${Equipamentos._equipamentos.filter(e => e.status === 'Manutenção').length}</td>
              <td style="text-align:center">${Equipamentos._equipamentos.filter(e => e.status === 'Baixado').length}</td>
              <td style="text-align:center">
                <span style="font-weight:700;color:var(--green)">
                  ${Math.round(Equipamentos._equipamentos.filter(e => e.status === 'Ativo').length / Equipamentos._equipamentos.length * 100)}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>`;
    }

    // Detalhe filtrado
    const detailTitle = document.getElementById('eqrel-detail-title');
    if (detailTitle) detailTitle.textContent = `Listagem Detalhada (${data.length} equipamento(s))`;

    const statusBadge = {
      'Ativo':       '<span class="badge-green">Ativo</span>',
      'Manutenção':  '<span class="badge-amber">Manutenção</span>',
      'Baixado':     '<span class="badge-red">Baixado</span>',
    };

    const detailWrap = document.getElementById('eqrel-detail');
    if (!detailWrap) return;

    if (!data.length) {
      detailWrap.innerHTML = `<div class="empty-state"><div class="empty-state-title">Nenhum equipamento para os filtros selecionados</div></div>`;
      return;
    }

    detailWrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nº Patrimônio</th>
            <th>TEI</th>
            <th>Tipo</th>
            <th>Modelo</th>
            <th>Fabricante</th>
            <th>Nº Série</th>
            <th>RISP</th>
            <th>Local / Site</th>
            <th>Status</th>
            <th>Aquisição</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(e => `
            <tr>
              <td style="font-family:var(--mono);font-size:11px">${e.patrimonio}</td>
              <td style="font-family:var(--mono);font-size:11px;color:var(--accent)">${e.tei}</td>
              <td style="font-size:12px">${e.tipo}</td>
              <td style="font-weight:600">${e.modelo}</td>
              <td style="color:var(--text2);font-size:12px">${e.fabricante}</td>
              <td style="font-family:var(--mono);font-size:10px;color:var(--text3)">${e.serie}</td>
              <td style="font-size:12px">${e.risp || '—'}</td>
              <td style="font-size:12px">${e.local || '<span style="color:var(--orange)">Sem local</span>'}</td>
              <td>${statusBadge[e.status] || e.status}</td>
              <td style="font-family:var(--mono);font-size:11px">${e.aquisicao ? formatDate(e.aquisicao) : '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  _exportar(tipo) {
    const nomes = {
      'pdf-completo': 'PDF Inventário Completo',
      'pdf-tipo':     'PDF por Tipo',
      'pdf-local':    'PDF por Local',
      'excel':        'Excel',
    };
    Toast.show(`Exportação ${nomes[tipo] || tipo} iniciada. O arquivo será gerado em instantes.`, 'info');
  },
};
