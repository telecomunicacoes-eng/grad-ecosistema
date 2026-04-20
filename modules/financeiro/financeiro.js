// ═══════════════════════════════════════
// GRAD Ecossistema — FINANCEIRO
// Contratos · Faturas de energia · Custos por site
// ═══════════════════════════════════════

const Financeiro = {
  _charts: {},

  // ── MOCK DATA ──────────────────────────────────────────────────────────────

  _faturas: [
    { id:1,  site:'SBS-001 Cuiabá',        risp:1,  competencia:'2025-03', valor:4820.50,  vencimento:'2025-03-10', status:'Pago',     comprovante:'COMP-2025-0301', obs:'Pago via TED' },
    { id:2,  site:'SBS-012 Rondonópolis',   risp:5,  competencia:'2025-03', valor:3240.00,  vencimento:'2025-03-10', status:'Pago',     comprovante:'COMP-2025-0312', obs:'' },
    { id:3,  site:'SBS-027 Sinop',          risp:8,  competencia:'2025-03', valor:5100.75,  vencimento:'2025-03-10', status:'Pago',     comprovante:'COMP-2025-0327', obs:'Fatura corrigida' },
    { id:4,  site:'SBS-034 Tangará da Serra',risp:9, competencia:'2025-03', valor:2980.00,  vencimento:'2025-03-10', status:'Pago',     comprovante:'COMP-2025-0334', obs:'' },
    { id:5,  site:'SBS-048 Barra do Garças',risp:12, competencia:'2025-03', valor:3760.25,  vencimento:'2025-03-10', status:'Pago',     comprovante:'COMP-2025-0348', obs:'' },
    { id:6,  site:'SBS-056 Alta Floresta',  risp:11, competencia:'2025-03', valor:4200.00,  vencimento:'2025-03-15', status:'Pago',     comprovante:'COMP-2025-0356', obs:'' },
    { id:7,  site:'SBS-063 Cáceres',        risp:2,  competencia:'2025-04', valor:3150.00,  vencimento:'2025-04-10', status:'Pendente', comprovante:'',               obs:'Aguardando empenho' },
    { id:8,  site:'SBS-071 Colíder',        risp:10, competencia:'2025-04', valor:2700.50,  vencimento:'2025-04-10', status:'Pendente', comprovante:'',               obs:'' },
    { id:9,  site:'SBS-001 Cuiabá',         risp:1,  competencia:'2025-04', valor:4820.50,  vencimento:'2025-04-10', status:'Pendente', comprovante:'',               obs:'' },
    { id:10, site:'SBS-012 Rondonópolis',   risp:5,  competencia:'2025-04', valor:3240.00,  vencimento:'2025-04-10', status:'Atraso',   comprovante:'',               obs:'Venceu em 10/04' },
    { id:11, site:'SBS-027 Sinop',          risp:8,  competencia:'2025-04', valor:5100.75,  vencimento:'2025-04-10', status:'Atraso',   comprovante:'',               obs:'Aguardando liberação' },
    { id:12, site:'SBS-082 Nova Mutum',     risp:7,  competencia:'2025-04', valor:3890.00,  vencimento:'2025-04-12', status:'Pendente', comprovante:'',               obs:'' },
    { id:13, site:'SBS-091 Primavera do Leste',risp:6,competencia:'2025-04',valor:4450.00, vencimento:'2025-04-15', status:'Pendente', comprovante:'',               obs:'' },
    { id:14, site:'SBS-048 Barra do Garças',risp:12, competencia:'2025-02', valor:3760.25,  vencimento:'2025-02-10', status:'Pago',     comprovante:'COMP-2025-0202', obs:'' },
    { id:15, site:'SBS-056 Alta Floresta',  risp:11, competencia:'2025-02', valor:4200.00,  vencimento:'2025-02-15', status:'Pago',     comprovante:'COMP-2025-0203', obs:'' },
  ],

  _contratos: [
    {
      id:1, numero:'CT-SESP-2023-001', objeto:'Fornecimento de energia elétrica — Cuiabá e Região Metropolitana',
      fornecedor:'ENERGISA MATO GROSSO', cnpj:'03.781.316/0001-03',
      ini:'2023-01-01', fim:'2025-12-31', valor:680000.00, status:'Ativo',
      obs:'Renovação automática mediante saldo. Inclui SBS-001 ao SBS-020.'
    },
    {
      id:2, numero:'CT-SESP-2023-002', objeto:'Fornecimento de energia elétrica — Interior Norte/Nordeste',
      fornecedor:'ENERGISA MATO GROSSO', cnpj:'03.781.316/0001-03',
      ini:'2023-03-01', fim:'2025-05-31', valor:520000.00, status:'Próx. Vencimento',
      obs:'Vencimento em 31/05/2025. Iniciar processo de renovação.'
    },
    {
      id:3, numero:'CT-SESP-2024-001', objeto:'Fornecimento de energia elétrica — Região Sul e Leste',
      fornecedor:'EQUATORIAL ENERGIA MT', cnpj:'05.878.023/0001-39',
      ini:'2024-01-01', fim:'2026-12-31', valor:430000.00, status:'Ativo',
      obs:'Inclui SBS-040 ao SBS-060. Medição bimestral.'
    },
    {
      id:4, numero:'CT-SESP-2021-003', objeto:'Fornecimento de energia elétrica — Região Oeste/Pantanal',
      fornecedor:'ENERGISA MATO GROSSO', cnpj:'03.781.316/0001-03',
      ini:'2021-06-01', fim:'2024-05-31', valor:280000.00, status:'Encerrado',
      obs:'Contrato encerrado. Substituído por CT-SESP-2024-001.'
    },
    {
      id:5, numero:'CT-SESP-2024-002', objeto:'Serviços de gestão e auditoria de faturas de energia',
      fornecedor:'GEOTEK CONSULTORIA ENERGÉTICA LTDA', cnpj:'24.891.765/0001-44',
      ini:'2024-07-01', fim:'2026-06-30', valor:96000.00, status:'Ativo',
      obs:'Auditoria mensal e relatórios de eficiência energética.'
    },
  ],

  _custosPorRisp: [
    { risp:1,  nome:'1ª RISP', total:57840.00 },
    { risp:2,  nome:'2ª RISP', total:37800.00 },
    { risp:3,  nome:'3ª RISP', total:24500.00 },
    { risp:4,  nome:'4ª RISP', total:18200.00 },
    { risp:5,  nome:'5ª RISP', total:38880.00 },
    { risp:6,  nome:'6ª RISP', total:53400.00 },
    { risp:7,  nome:'7ª RISP', total:46680.00 },
    { risp:8,  nome:'8ª RISP', total:61209.00 },
    { risp:9,  nome:'9ª RISP', total:35760.00 },
    { risp:10, nome:'10ª RISP', total:32406.00 },
    { risp:11, nome:'11ª RISP', total:50400.00 },
    { risp:12, nome:'12ª RISP', total:45123.00 },
  ],

  _evolucaoMensal: [
    { mes:'Out/24', total:38200.00 },
    { mes:'Nov/24', total:40100.00 },
    { mes:'Dez/24', total:44500.00 },
    { mes:'Jan/25', total:41800.00 },
    { mes:'Fev/25', total:43200.00 },
    { mes:'Mar/25', total:46500.00 },
    { mes:'Abr/25', total:47300.00 },
  ],

  // ── HELPERS ────────────────────────────────────────────────────────────────

  _badgeStatus(status) {
    const map = {
      'Pago':     'badge-green',
      'Pendente': 'badge-amber',
      'Atraso':   'badge-red',
      'Ativo':             'badge-green',
      'Encerrado':         'badge-blue',
      'Próx. Vencimento':  'badge-amber',
    };
    return `<span class="${map[status] || 'badge-blue'}">${status}</span>`;
  },

  _destroyCharts() {
    Object.values(Financeiro._charts).forEach(c => { try { c.destroy(); } catch {} });
    Financeiro._charts = {};
  },

  _fmtComp(ym) {
    if (!ym) return '—';
    const [y, m] = ym.split('-');
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${meses[parseInt(m,10)-1]}/${y}`;
  },

  // ── renderDashboard ────────────────────────────────────────────────────────

  renderDashboard(el) {
    Financeiro._destroyCharts();

    const faturas    = Financeiro._faturas;
    const totalGasto = faturas.filter(f => f.status === 'Pago').reduce((a,f) => a+f.valor, 0);
    const pendentes  = faturas.filter(f => f.status === 'Pendente' || f.status === 'Atraso').length;
    const pagas      = faturas.filter(f => f.status === 'Pago');
    const mediaMensal= pagas.length ? totalGasto / [...new Set(pagas.map(f=>f.competencia))].length : 0;
    const contratos  = Financeiro._contratos;
    const ativos     = contratos.filter(c => c.status === 'Ativo' || c.status === 'Próx. Vencimento').length;
    const aVencer    = contratos.filter(c => c.status === 'Próx. Vencimento').length;
    const siteCustos = {};
    faturas.forEach(f => { siteCustos[f.site] = (siteCustos[f.site]||0) + f.valor; });
    const maiorCusto = Math.max(...Object.values(siteCustos));

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Financeiro — Dashboard</div>
            <div class="page-sub">Contratos · Faturas de energia · Custos por site</div>
          </div>
          <div class="page-actions">
            <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">
              Atualizado: ${new Date().toLocaleTimeString('pt-BR')}
            </span>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('financeiro','dashboard')">↻ Atualizar</button>
          </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid" style="margin-bottom:16px">
          <div class="kpi-card blue">
            <div class="kpi-label">Total Gasto (R$)</div>
            <div class="kpi-value">${formatCurrency(totalGasto)}</div>
            <div class="kpi-sub">faturas pagas</div>
          </div>
          <div class="kpi-card" style="border-top:2px solid var(--accent2)">
            <div class="kpi-label">Média Mensal (R$)</div>
            <div class="kpi-value" style="color:var(--accent2)">${formatCurrency(mediaMensal)}</div>
            <div class="kpi-sub">por competência</div>
          </div>
          <div class="kpi-card amber">
            <div class="kpi-label">Faturas Pendentes</div>
            <div class="kpi-value">${pendentes}</div>
            <div class="kpi-sub">aguardando pagamento</div>
          </div>
          <div class="kpi-card blue">
            <div class="kpi-label">Contratos Ativos</div>
            <div class="kpi-value">${ativos}</div>
            <div class="kpi-sub">vigentes</div>
          </div>
          <div class="kpi-card red">
            <div class="kpi-label">Contratos a Vencer</div>
            <div class="kpi-value">${aVencer}</div>
            <div class="kpi-sub">próximos 90 dias</div>
          </div>
          <div class="kpi-card" style="border-top:2px solid var(--purple)">
            <div class="kpi-label">Maior Custo/Site</div>
            <div class="kpi-value" style="color:var(--purple);font-size:18px">${formatCurrency(maiorCusto)}</div>
            <div class="kpi-sub">pico mensal</div>
          </div>
        </div>

        <!-- Charts -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="card" style="height:260px;display:flex;flex-direction:column">
            <div class="card-title">Custo por RISP (R$)</div>
            <canvas id="fin-chart-risp" style="flex:1;min-height:0"></canvas>
          </div>
          <div class="card" style="height:260px;display:flex;flex-direction:column">
            <div class="card-title">Evolução Mensal de Gastos</div>
            <canvas id="fin-chart-evolucao" style="flex:1;min-height:0"></canvas>
          </div>
        </div>

        <!-- Últimas Faturas -->
        <div class="card">
          <div class="card-title">Últimas Faturas</div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>RISP</th>
                  <th>Competência</th>
                  <th style="text-align:right">Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${faturas.slice().sort((a,b)=>b.competencia.localeCompare(a.competencia)).slice(0,10).map(f => `
                  <tr>
                    <td><strong style="color:var(--text)">${f.site}</strong></td>
                    <td><span style="font-size:11px;color:var(--text2)">${f.risp}ª RISP</span></td>
                    <td style="font-family:var(--mono);font-size:12px">${Financeiro._fmtComp(f.competencia)}</td>
                    <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text)">${formatCurrency(f.valor)}</td>
                    <td>${Financeiro._badgeStatus(f.status)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    // Chart RISP
    const risps   = Financeiro._custosPorRisp;
    const c1 = document.getElementById('fin-chart-risp');
    if (c1) {
      Financeiro._charts.risp = new Chart(c1, {
        type: 'bar',
        data: {
          labels: risps.map(r => r.nome),
          datasets: [{
            data: risps.map(r => r.total),
            backgroundColor: risps.map((_, i) => `hsl(${210 + i*8},70%,${55-i*1.5}%)`),
            borderRadius: 4,
            barThickness: 16,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 9 }, color: '#c4d8f0' }, grid: { color: 'rgba(255,255,255,.04)' }},
            y: {
              ticks: {
                font: { size: 9 }, color: '#c4d8f0',
                callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k'
              },
              grid: { color: 'rgba(255,255,255,.06)' }
            }
          }
        }
      });
    }

    // Chart Evolução
    const evolucao = Financeiro._evolucaoMensal;
    const c2 = document.getElementById('fin-chart-evolucao');
    if (c2) {
      Financeiro._charts.evolucao = new Chart(c2, {
        type: 'line',
        data: {
          labels: evolucao.map(e => e.mes),
          datasets: [{
            label: 'Gasto total',
            data: evolucao.map(e => e.total),
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
            x: { ticks: { font: { size: 9 }, color: '#c4d8f0' }, grid: { color: 'rgba(255,255,255,.04)' }},
            y: {
              ticks: {
                font: { size: 9 }, color: '#c4d8f0',
                callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k'
              },
              grid: { color: 'rgba(255,255,255,.06)' }
            }
          }
        }
      });
    }
  },

  // ── renderRegistros ────────────────────────────────────────────────────────

  renderRegistros(el) {
    let filtroRisp   = '';
    let filtroStatus = '';
    let filtroComp   = '';

    const render = () => {
      let dados = Financeiro._faturas.slice();
      if (filtroRisp)   dados = dados.filter(f => String(f.risp) === filtroRisp);
      if (filtroStatus) dados = dados.filter(f => f.status === filtroStatus);
      if (filtroComp)   dados = dados.filter(f => f.competencia === filtroComp);

      const tbody = document.getElementById('fin-reg-tbody');
      if (!tbody) return;
      tbody.innerHTML = dados.length ? dados.map(f => `
        <tr>
          <td><strong style="color:var(--text)">${f.site}</strong></td>
          <td style="font-size:11px;color:var(--text2)">${f.risp}ª RISP</td>
          <td style="font-family:var(--mono);font-size:12px">${Financeiro._fmtComp(f.competencia)}</td>
          <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text)">${formatCurrency(f.valor)}</td>
          <td style="font-size:11px;color:var(--text3)">${formatDate ? formatDate(f.vencimento) : f.vencimento}</td>
          <td>${Financeiro._badgeStatus(f.status)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="Financeiro._abrirModalFatura(${f.id})">Editar</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--red)"
                onclick="Financeiro._encerrarFatura(${f.id})">Encerrar</button>
            </div>
          </td>
        </tr>`).join('') :
        '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text3)">Nenhuma fatura encontrada</td></tr>';
    };

    const rispOpts = Array.from({length:15},(_,i)=>i+1)
      .map(n=>`<option value="${n}">${n}ª RISP</option>`).join('');

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Faturas de Energia</div>
            <div class="page-sub">Lançamento e controle de faturas por site</div>
          </div>
        </div>

        <div class="filter-bar" style="margin-bottom:16px">
          <select class="form-select" id="fin-f-risp" style="width:140px" onchange="Financeiro._regFiltro()">
            <option value="">Todas as RISPs</option>${rispOpts}
          </select>
          <select class="form-select" id="fin-f-status" style="width:140px" onchange="Financeiro._regFiltro()">
            <option value="">Todos os Status</option>
            <option>Pago</option>
            <option>Pendente</option>
            <option>Atraso</option>
          </select>
          <input type="month" class="form-input" id="fin-f-comp" style="width:160px"
            placeholder="Competência" onchange="Financeiro._regFiltro()">
          <button class="btn btn-primary" onclick="Financeiro._abrirModalFatura(null)">+ Nova Fatura</button>
        </div>

        <div class="card">
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>RISP</th>
                  <th>Competência</th>
                  <th style="text-align:right">Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="fin-reg-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    Financeiro._regFiltroFn = () => {
      filtroRisp   = document.getElementById('fin-f-risp')?.value   || '';
      filtroStatus = document.getElementById('fin-f-status')?.value || '';
      filtroComp   = document.getElementById('fin-f-comp')?.value   || '';
      render();
    };
    Financeiro._regFiltro = Financeiro._regFiltroFn;

    render();
  },

  _regFiltro() {},

  _abrirModalFatura(id) {
    const fatura = id ? Financeiro._faturas.find(f => f.id === id) : null;
    const titulo = fatura ? 'Editar Fatura' : 'Nova Fatura';

    const rispOpts = Array.from({length:15},(_,i)=>i+1)
      .map(n=>`<option value="${n}" ${fatura?.risp===n?'selected':''}>${n}ª RISP</option>`).join('');

    const siteOpts = [
      'SBS-001 Cuiabá','SBS-012 Rondonópolis','SBS-027 Sinop','SBS-034 Tangará da Serra',
      'SBS-048 Barra do Garças','SBS-056 Alta Floresta','SBS-063 Cáceres','SBS-071 Colíder',
      'SBS-082 Nova Mutum','SBS-091 Primavera do Leste','SBS-104 Juína','SBS-118 Guarantã do Norte',
      'SBS-125 Pontes e Lacerda','SBS-137 Lucas do Rio Verde','SBS-149 Sorriso',
    ].map(s=>`<option value="${s}" ${fatura?.site===s?'selected':''}>${s}</option>`).join('');

    const html = `
      <div class="form-grid form-grid-2" style="gap:14px">
        <div>
          <label class="form-label">Site</label>
          <select class="form-select" id="mf-site"><option value="">Selecione…</option>${siteOpts}</select>
        </div>
        <div>
          <label class="form-label">RISP</label>
          <select class="form-select" id="mf-risp">${rispOpts}</select>
        </div>
        <div>
          <label class="form-label">Competência</label>
          <input type="month" class="form-input" id="mf-comp" value="${fatura?.competencia||''}">
        </div>
        <div>
          <label class="form-label">Valor (R$)</label>
          <input type="number" class="form-input" id="mf-valor" min="0" step="0.01"
            value="${fatura?.valor||''}" placeholder="0,00">
        </div>
        <div>
          <label class="form-label">Vencimento</label>
          <input type="date" class="form-input" id="mf-venc" value="${fatura?.vencimento||''}">
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-select" id="mf-status">
            ${['Pendente','Pago','Atraso'].map(s=>`<option ${fatura?.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Nº Comprovante</label>
          <input type="text" class="form-input" id="mf-comp-num" value="${fatura?.comprovante||''}"
            placeholder="COMP-AAAA-NNNN">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-input" id="mf-obs" rows="2"
            style="resize:vertical">${fatura?.obs||''}</textarea>
        </div>
      </div>`;

    Modal.open(titulo, html, [
      { label: 'Cancelar', class: 'btn-ghost', action: () => {} },
      {
        label: fatura ? 'Salvar' : 'Cadastrar',
        class: 'btn-primary',
        action: () => Financeiro._salvarFatura(id)
      }
    ]);
  },

  _salvarFatura(id) {
    const site  = document.getElementById('mf-site')?.value;
    const risp  = parseInt(document.getElementById('mf-risp')?.value || '0', 10);
    const comp  = document.getElementById('mf-comp')?.value;
    const valor = parseFloat(document.getElementById('mf-valor')?.value || '0');
    const venc  = document.getElementById('mf-venc')?.value;
    const status= document.getElementById('mf-status')?.value;
    const compN = document.getElementById('mf-comp-num')?.value;
    const obs   = document.getElementById('mf-obs')?.value;

    if (!site || !comp || !valor || !venc) {
      Toast.show('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    if (id) {
      const idx = Financeiro._faturas.findIndex(f => f.id === id);
      if (idx >= 0) {
        Financeiro._faturas[idx] = { ...Financeiro._faturas[idx], site, risp, competencia:comp, valor, vencimento:venc, status, comprovante:compN, obs };
        Toast.show('Fatura atualizada com sucesso', 'success');
      }
    } else {
      const novoId = Math.max(...Financeiro._faturas.map(f=>f.id)) + 1;
      Financeiro._faturas.push({ id:novoId, site, risp, competencia:comp, valor, vencimento:venc, status, comprovante:compN, obs });
      Toast.show('Fatura cadastrada com sucesso', 'success');
    }

    const el = document.getElementById('main-content');
    Financeiro.renderRegistros(el);
  },

  _encerrarFatura(id) {
    const fatura = Financeiro._faturas.find(f => f.id === id);
    if (!fatura) return;
    Modal.open('Encerrar Fatura', `
      <div style="padding:8px 0">
        <p style="color:var(--text2);margin-bottom:12px">Confirma o encerramento da fatura abaixo?</p>
        <div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:13px">
          <div><strong>Site:</strong> ${fatura.site}</div>
          <div><strong>Competência:</strong> ${Financeiro._fmtComp(fatura.competencia)}</div>
          <div><strong>Valor:</strong> ${formatCurrency(fatura.valor)}</div>
        </div>
        <p style="color:var(--red);font-size:12px;margin-top:10px">Esta ação não pode ser desfeita.</p>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost', action: () => {} },
        {
          label: 'Encerrar', class: 'btn-primary',
          action: () => {
            Financeiro._faturas = Financeiro._faturas.filter(f => f.id !== id);
            Toast.show('Fatura encerrada', 'success');
            const el = document.getElementById('main-content');
            Financeiro.renderRegistros(el);
          }
        }
      ]
    );
  },

  // ── renderHistorico ────────────────────────────────────────────────────────

  renderHistorico(el) {
    const historico = [
      { site:'SBS-001 Cuiabá',            risp:1,  comp:'2025-02', valorPago:4820.50,  dataPag:'2025-02-08', contrato:'CT-SESP-2023-001' },
      { site:'SBS-012 Rondonópolis',       risp:5,  comp:'2025-02', valorPago:3240.00,  dataPag:'2025-02-08', contrato:'CT-SESP-2023-001' },
      { site:'SBS-027 Sinop',              risp:8,  comp:'2025-02', valorPago:5100.75,  dataPag:'2025-02-09', contrato:'CT-SESP-2024-001' },
      { site:'SBS-048 Barra do Garças',    risp:12, comp:'2025-02', valorPago:3760.25,  dataPag:'2025-02-10', contrato:'CT-SESP-2024-001' },
      { site:'SBS-056 Alta Floresta',      risp:11, comp:'2025-02', valorPago:4200.00,  dataPag:'2025-02-12', contrato:'CT-SESP-2023-002' },
      { site:'SBS-034 Tangará da Serra',   risp:9,  comp:'2025-02', valorPago:2980.00,  dataPag:'2025-02-12', contrato:'CT-SESP-2023-001' },
      { site:'SBS-063 Cáceres',            risp:2,  comp:'2025-01', valorPago:3150.00,  dataPag:'2025-01-09', contrato:'CT-SESP-2023-001' },
      { site:'SBS-071 Colíder',            risp:10, comp:'2025-01', valorPago:2700.50,  dataPag:'2025-01-09', contrato:'CT-SESP-2023-002' },
      { site:'SBS-082 Nova Mutum',         risp:7,  comp:'2025-01', valorPago:3890.00,  dataPag:'2025-01-10', contrato:'CT-SESP-2024-001' },
      { site:'SBS-091 Primavera do Leste', risp:6,  comp:'2025-01', valorPago:4450.00,  dataPag:'2025-01-11', contrato:'CT-SESP-2024-001' },
    ];

    let dados = historico.slice();

    const renderTabela = () => {
      const filtRisp = document.getElementById('fin-h-risp')?.value || '';
      const filtSite = document.getElementById('fin-h-site')?.value?.toLowerCase() || '';
      const filtIni  = document.getElementById('fin-h-ini')?.value || '';
      const filtFim  = document.getElementById('fin-h-fim')?.value || '';

      let filtrado = historico.slice();
      if (filtRisp) filtrado = filtrado.filter(f => String(f.risp) === filtRisp);
      if (filtSite) filtrado = filtrado.filter(f => f.site.toLowerCase().includes(filtSite));
      if (filtIni)  filtrado = filtrado.filter(f => f.comp >= filtIni.slice(0,7));
      if (filtFim)  filtrado = filtrado.filter(f => f.comp <= filtFim.slice(0,7));

      const tbody = document.getElementById('fin-h-tbody');
      if (!tbody) return;
      tbody.innerHTML = filtrado.length ? filtrado.map(f => `
        <tr>
          <td><strong style="color:var(--text)">${f.site}</strong></td>
          <td style="font-size:11px;color:var(--text2)">${f.risp}ª RISP</td>
          <td style="font-family:var(--mono);font-size:12px">${Financeiro._fmtComp(f.comp)}</td>
          <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green)">${formatCurrency(f.valorPago)}</td>
          <td style="font-size:12px;color:var(--text2)">${formatDate ? formatDate(f.dataPag) : f.dataPag}</td>
          <td style="font-size:11px;font-family:var(--mono);color:var(--text3)">${f.contrato}</td>
        </tr>`).join('') :
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">Nenhum registro encontrado</td></tr>';
    };

    const rispOpts = Array.from({length:15},(_,i)=>i+1)
      .map(n=>`<option value="${n}">${n}ª RISP</option>`).join('');

    const hoje  = new Date().toISOString().slice(0,10);
    const ha90  = new Date(Date.now()-90*86400000).toISOString().slice(0,10);

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Histórico Financeiro</div>
            <div class="page-sub">Registro de faturas pagas por período</div>
          </div>
        </div>

        <div class="filter-bar" style="margin-bottom:16px">
          <input type="date" class="form-input" id="fin-h-ini" value="${ha90}" style="width:150px"
            onchange="document.getElementById('fin-h-tbody') && (${renderTabela.toString()})()">
          <span style="color:var(--text3);font-size:12px">até</span>
          <input type="date" class="form-input" id="fin-h-fim" value="${hoje}" style="width:150px"
            onchange="document.getElementById('fin-h-tbody') && (${renderTabela.toString()})()">
          <select class="form-select" id="fin-h-risp" style="width:140px"
            onchange="Financeiro._histFiltro()">
            <option value="">Todas as RISPs</option>${rispOpts}
          </select>
          <input type="text" class="form-input" id="fin-h-site" style="width:200px"
            placeholder="Buscar site…" oninput="Financeiro._histFiltro()">
        </div>

        <div class="card">
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>RISP</th>
                  <th>Competência</th>
                  <th style="text-align:right">Valor Pago</th>
                  <th>Data Pagamento</th>
                  <th>Contrato</th>
                </tr>
              </thead>
              <tbody id="fin-h-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    Financeiro._histFiltroFn = renderTabela;
    Financeiro._histFiltro   = renderTabela;
    renderTabela();
  },

  _histFiltro() {},

  // ── renderAlertas ──────────────────────────────────────────────────────────

  renderAlertas(el) {
    const atraso = [
      { site:'SBS-012 Rondonópolis',   risp:5,  valor:3240.00, diasAtraso:7,  comp:'2025-04' },
      { site:'SBS-027 Sinop',          risp:8,  valor:5100.75, diasAtraso:7,  comp:'2025-04' },
      { site:'SBS-104 Juína',          risp:13, valor:2850.00, diasAtraso:15, comp:'2025-03' },
      { site:'SBS-118 Guarantã do Norte',risp:10,valor:3120.50,diasAtraso:22, comp:'2025-03' },
    ];

    const ausentes = [
      { site:'SBS-063 Cáceres',          risp:2  },
      { site:'SBS-091 Primavera do Leste',risp:6 },
      { site:'SBS-125 Pontes e Lacerda', risp:14 },
    ];

    const contratosVencer = [
      { numero:'CT-SESP-2023-002', fornecedor:'ENERGISA MATO GROSSO',             fim:'2025-05-31', diasRestantes:44 },
      { numero:'CT-SESP-2021-004', fornecedor:'EQUATORIAL ENERGIA MT',            fim:'2025-06-15', diasRestantes:59 },
      { numero:'CT-SESP-2022-007', fornecedor:'GEOTEK CONSULTORIA ENERGÉTICA LTDA',fim:'2025-07-01', diasRestantes:75 },
    ];

    const renderSecao = (cor, titulo, count, conteudo) => `
      <div class="card" style="border-left:4px solid ${cor};margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="font-size:14px;font-weight:700;color:${cor};flex:1">${titulo}</div>
          <span class="kpi-card" style="padding:2px 12px;border-top:2px solid ${cor};font-size:18px;font-weight:700;color:${cor};min-width:48px;text-align:center">
            ${count}
          </span>
        </div>
        ${conteudo}
      </div>`;

    const atrasoHtml = atraso.map(f => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;
                  background:rgba(255,255,255,.03);border-radius:6px;
                  border:1px solid rgba(255,255,255,.06);margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--text)">${f.site}</div>
          <div style="font-size:11px;color:var(--text3)">${f.risp}ª RISP · Comp. ${Financeiro._fmtComp(f.comp)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--mono);font-size:13px;color:var(--text)">${formatCurrency(f.valor)}</div>
          <div style="font-size:11px;color:var(--red);font-weight:600">${f.diasAtraso} dia(s) em atraso</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.navigate('financeiro','registros')">Ver →</button>
      </div>`).join('');

    const ausentesHtml = ausentes.map(f => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;
                  background:rgba(255,255,255,.03);border-radius:6px;
                  border:1px solid rgba(255,255,255,.06);margin-bottom:6px">
        <div style="flex:1">
          <div style="font-weight:600;color:var(--text)">${f.site}</div>
          <div style="font-size:11px;color:var(--text3)">${f.risp}ª RISP</div>
        </div>
        <span class="badge-amber">Sem lançamento</span>
        <button class="btn btn-ghost btn-sm" onclick="Financeiro._abrirModalFatura(null)">Lançar</button>
      </div>`).join('');

    const contratosHtml = contratosVencer.map(c => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;
                  background:rgba(255,255,255,.03);border-radius:6px;
                  border:1px solid rgba(255,255,255,.06);margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--text);font-family:var(--mono);font-size:12px">${c.numero}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">${c.fornecedor}</div>
          <div style="font-size:11px;color:var(--text3)">Vigência até ${formatDate ? formatDate(c.fim) : c.fim}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:20px;font-weight:700;color:var(--orange)">${c.diasRestantes}</div>
          <div style="font-size:10px;color:var(--text3)">dias restantes</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.navigate('financeiro','contratos')">Ver →</button>
      </div>`).join('');

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Alertas Financeiros</div>
            <div class="page-sub">Faturas em atraso · Ausências · Contratos a vencer</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('financeiro','alertas')">↻ Atualizar</button>
          </div>
        </div>

        <!-- KPI resumo -->
        <div class="kpi-grid" style="margin-bottom:20px">
          <div class="kpi-card red">
            <div class="kpi-label">Faturas em Atraso</div>
            <div class="kpi-value">${atraso.length}</div>
            <div class="kpi-sub">requerem ação imediata</div>
          </div>
          <div class="kpi-card amber">
            <div class="kpi-label">Faturas Ausentes</div>
            <div class="kpi-value">${ausentes.length}</div>
            <div class="kpi-sub">sites sem lançamento</div>
          </div>
          <div class="kpi-card" style="border-top:2px solid var(--orange)">
            <div class="kpi-label">Contratos a Vencer</div>
            <div class="kpi-value" style="color:var(--orange)">${contratosVencer.length}</div>
            <div class="kpi-sub">nos próximos 90 dias</div>
          </div>
        </div>

        ${renderSecao('var(--red)', 'Faturas em Atraso', atraso.length, atrasoHtml)}
        ${renderSecao('var(--amber)', 'Faturas Ausentes no Mês Atual', ausentes.length, ausentesHtml)}
        ${renderSecao('var(--orange)', 'Contratos Próximos ao Vencimento', contratosVencer.length, contratosHtml)}
      </div>`;
  },

  // ── renderRelatorio ────────────────────────────────────────────────────────

  renderRelatorio(el) {
    const hoje = new Date().toISOString().slice(0,10);
    const ha30 = new Date(Date.now()-30*86400000).toISOString().slice(0,10);

    const rispOpts = Array.from({length:15},(_,i)=>i+1)
      .map(n=>`<option value="${n}">${n}ª RISP</option>`).join('');

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Relatório Financeiro</div>
            <div class="page-sub">Exportação e análise de custos por período</div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-title">Filtros do Relatório</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
            <div>
              <label class="form-label">Período — De</label>
              <input type="date" class="form-input" id="fin-r-ini" value="${ha30}" style="width:160px">
            </div>
            <div>
              <label class="form-label">Até</label>
              <input type="date" class="form-input" id="fin-r-fim" value="${hoje}" style="width:160px">
            </div>
            <div>
              <label class="form-label">RISP</label>
              <select class="form-select" id="fin-r-risp" style="width:140px">
                <option value="">Todas</option>${rispOpts}
              </select>
            </div>
            <div>
              <label class="form-label">Tipo</label>
              <select class="form-select" id="fin-r-tipo" style="width:150px">
                <option>Todos</option>
                <option>Faturas</option>
                <option>Contratos</option>
              </select>
            </div>
            <button class="btn btn-primary" onclick="Financeiro._gerarPreviewRelatorio()">Visualizar</button>
          </div>
        </div>

        <!-- Botões de exportação -->
        <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
          <button class="btn btn-ghost" onclick="Financeiro._exportarPDFGeral()">
            📄 PDF Geral
          </button>
          <button class="btn btn-ghost" onclick="Financeiro._exportarPDFSite()">
            📄 PDF por Site
          </button>
          <button class="btn btn-ghost" onclick="Financeiro._exportarExcel()">
            📊 Excel
          </button>
        </div>

        <!-- Preview -->
        <div id="fin-r-preview"></div>
      </div>`;

    Financeiro._gerarPreviewRelatorio();
  },

  _gerarPreviewRelatorio() {
    const faturas    = Financeiro._faturas;
    const contratos  = Financeiro._contratos;
    const totalFat   = faturas.reduce((a,f)=>a+f.valor, 0);
    const totalCont  = contratos.reduce((a,c)=>a+c.valor, 0);
    const sites      = [...new Set(faturas.map(f=>f.site))];
    const mediaSite  = sites.length ? totalFat / sites.length : 0;

    const siteTotais = {};
    faturas.forEach(f => { siteTotais[f.site] = (siteTotais[f.site]||0) + f.valor; });
    const topSites   = Object.entries(siteTotais).sort((a,b)=>b[1]-a[1]).slice(0,5);

    const preview = document.getElementById('fin-r-preview');
    if (!preview) return;

    preview.innerHTML = `
      <div class="card" style="margin-bottom:12px">
        <div class="card-title">Resumo Geral</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead>
              <tr>
                <th>Total Faturas</th>
                <th>Total Contratos</th>
                <th style="text-align:right">Valor Total (Faturas)</th>
                <th style="text-align:right">Valor Total (Contratos)</th>
                <th style="text-align:right">Média por Site</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-family:var(--mono);font-weight:700;color:var(--text)">${faturas.length}</td>
                <td style="font-family:var(--mono);font-weight:700;color:var(--text)">${contratos.length}</td>
                <td style="text-align:right;font-family:var(--mono);color:var(--text)">${formatCurrency(totalFat)}</td>
                <td style="text-align:right;font-family:var(--mono);color:var(--text)">${formatCurrency(totalCont)}</td>
                <td style="text-align:right;font-family:var(--mono);color:var(--text2)">${formatCurrency(mediaSite)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Top 5 Sites por Gasto Acumulado</div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead>
              <tr><th>Site</th><th style="text-align:right">Gasto Acumulado</th><th>Participação</th></tr>
            </thead>
            <tbody>
              ${topSites.map(([site, val]) => `
                <tr>
                  <td><strong style="color:var(--text)">${site}</strong></td>
                  <td style="text-align:right;font-family:var(--mono)">${formatCurrency(val)}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="flex:1;background:rgba(255,255,255,.08);border-radius:4px;height:6px">
                        <div style="background:var(--accent);height:6px;border-radius:4px;width:${(val/totalFat*100).toFixed(0)}%"></div>
                      </div>
                      <span style="font-size:11px;color:var(--text3);font-family:var(--mono);width:36px;text-align:right">
                        ${(val/totalFat*100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  _exportarPDFGeral() {
    const faturas   = Financeiro._faturas;
    const emitidoEm = new Date().toLocaleString('pt-BR');
    const total     = faturas.reduce((a,f)=>a+f.valor,0);

    const linhas = faturas.map(f => `
      <tr>
        <td>${f.site}</td>
        <td style="text-align:center">${f.risp}ª</td>
        <td>${Financeiro._fmtComp(f.competencia)}</td>
        <td style="text-align:right">R$ ${f.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
        <td>${f.vencimento}</td>
        <td style="color:${f.status==='Pago'?'#22c55e':f.status==='Atraso'?'#ef4444':'#fbbf24'};font-weight:600">${f.status}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>Relatório Financeiro — GRAD/SESP</title>
      <style>
        @page{size:A4;margin:1.5cm 1.8cm}
        body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a}
        .header{display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:2px solid #1e3a5f;margin-bottom:12px}
        h2{font-size:15px;color:#1e3a5f;margin-bottom:4px}
        table{width:100%;border-collapse:collapse;font-size:10px}
        th{background:#1e3a5f;color:#fff;padding:5px;text-align:left}
        td{padding:4px 5px;border-bottom:1px solid #e2e8f0}
        tr:nth-child(even) td{background:#f8fafc}
        .total{font-weight:700;font-size:13px;margin-top:10px;text-align:right;color:#1e3a5f}
        .footer{margin-top:14px;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:6px;display:flex;justify-content:space-between}
      </style></head><body>
      <div class="header">
        <div>
          <div style="font-weight:800;font-size:13px;color:#1e3a5f">Governo do Estado de Mato Grosso — SESP/MT</div>
          <div style="font-size:9px;color:#475569">GRAD Ecossistema · Módulo Financeiro</div>
        </div>
        <div style="text-align:right;font-size:9px;color:#64748b">Emitido em: ${emitidoEm}</div>
      </div>
      <h2>Relatório Financeiro Geral — Faturas de Energia</h2>
      <p style="font-size:10px;color:#64748b;margin-bottom:10px">${faturas.length} faturas registradas</p>
      <table>
        <thead><tr><th>Site</th><th>RISP</th><th>Competência</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
      <div class="total">Total: R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      <div class="footer">
        <span>GRAD Ecossistema · SESP/MT</span>
        <span>Relatório Financeiro Geral · ${emitidoEm}</span>
      </div>
      <script>window.onload=function(){window.print()}<\/script>
      </body></html>`;

    const w = window.open('','_blank','width=950,height=750,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Popup bloqueado — permita popups', 'error');
  },

  _exportarPDFSite() {
    const faturas   = Financeiro._faturas;
    const emitidoEm = new Date().toLocaleString('pt-BR');

    const porSite = {};
    faturas.forEach(f => {
      if (!porSite[f.site]) porSite[f.site] = { risp: f.risp, itens: [] };
      porSite[f.site].itens.push(f);
    });

    const blocos = Object.entries(porSite).map(([site, dados]) => {
      const totalSite = dados.itens.reduce((a,f)=>a+f.valor,0);
      const linhas = dados.itens.map(f => `
        <tr>
          <td>${Financeiro._fmtComp(f.competencia)}</td>
          <td style="text-align:right">R$ ${f.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
          <td>${f.vencimento}</td>
          <td style="color:${f.status==='Pago'?'#22c55e':f.status==='Atraso'?'#ef4444':'#fbbf24'}">${f.status}</td>
        </tr>`).join('');
      return `
        <div style="margin-bottom:18px;page-break-inside:avoid">
          <h3 style="font-size:12px;color:#1e3a5f;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:6px">
            ${site} — ${dados.risp}ª RISP
          </h3>
          <table>
            <thead><tr><th>Competência</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
          <div style="text-align:right;font-size:10px;font-weight:700;color:#1e3a5f;margin-top:4px">
            Total: R$ ${totalSite.toLocaleString('pt-BR',{minimumFractionDigits:2})}
          </div>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>Relatório Financeiro por Site — GRAD/SESP</title>
      <style>
        @page{size:A4;margin:1.5cm 1.8cm}
        body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a}
        .header{display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:2px solid #1e3a5f;margin-bottom:14px}
        h2{font-size:15px;color:#1e3a5f;margin-bottom:10px}
        table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:4px}
        th{background:#1e3a5f;color:#fff;padding:4px 5px;text-align:left}
        td{padding:3px 5px;border-bottom:1px solid #e2e8f0}
        tr:nth-child(even) td{background:#f8fafc}
        .footer{margin-top:14px;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:6px;display:flex;justify-content:space-between}
      </style></head><body>
      <div class="header">
        <div>
          <div style="font-weight:800;font-size:13px;color:#1e3a5f">Governo do Estado de Mato Grosso — SESP/MT</div>
          <div style="font-size:9px;color:#475569">GRAD Ecossistema · Módulo Financeiro</div>
        </div>
        <div style="text-align:right;font-size:9px;color:#64748b">Emitido em: ${emitidoEm}</div>
      </div>
      <h2>Relatório Financeiro por Site</h2>
      ${blocos}
      <div class="footer">
        <span>GRAD Ecossistema · SESP/MT</span>
        <span>Relatório por Site · ${emitidoEm}</span>
      </div>
      <script>window.onload=function(){window.print()}<\/script>
      </body></html>`;

    const w = window.open('','_blank','width=950,height=750,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Popup bloqueado — permita popups', 'error');
  },

  _exportarExcel() {
    const faturas = Financeiro._faturas;
    const headers = ['Site','RISP','Competência','Valor (R$)','Vencimento','Status','Comprovante','Observações'];
    const linhas  = faturas.map(f => [
      f.site,
      f.risp + 'ª RISP',
      Financeiro._fmtComp(f.competencia),
      f.valor.toFixed(2).replace('.',','),
      f.vencimento,
      f.status,
      f.comprovante,
      f.obs,
    ].map(v=>`"${String(v).replace(/"/g,"'")}"`).join(','));

    const csv     = [headers.join(','), ...linhas].join('\n');
    const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = `financeiro_faturas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show(`${faturas.length} registros exportados (CSV/Excel)`, 'success');
  },

  // ── renderContratos ────────────────────────────────────────────────────────

  renderContratos(el) {
    let filtroStatus = '';
    let filtroBusca  = '';

    const render = () => {
      let dados = Financeiro._contratos.slice();
      if (filtroStatus) dados = dados.filter(c => c.status === filtroStatus);
      if (filtroBusca)  dados = dados.filter(c =>
        c.numero.toLowerCase().includes(filtroBusca) ||
        c.fornecedor.toLowerCase().includes(filtroBusca) ||
        c.objeto.toLowerCase().includes(filtroBusca)
      );

      const tbody = document.getElementById('fin-ct-tbody');
      if (!tbody) return;

      tbody.innerHTML = dados.length ? dados.map(c => `
        <tr>
          <td style="font-family:var(--mono);font-size:11px;font-weight:600;color:var(--accent)">${c.numero}</td>
          <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)" title="${c.objeto}">${c.objeto}</td>
          <td style="font-size:12px;color:var(--text2)">${c.fornecedor}</td>
          <td style="font-size:11px;font-family:var(--mono);color:var(--text3)">${formatDate ? formatDate(c.ini) : c.ini}</td>
          <td style="font-size:11px;font-family:var(--mono);color:${c.status==='Próx. Vencimento'?'var(--amber)':'var(--text3)'}">${formatDate ? formatDate(c.fim) : c.fim}</td>
          <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text)">${formatCurrency(c.valor)}</td>
          <td>${Financeiro._badgeStatus(c.status)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="Financeiro._abrirModalContrato(${c.id})">Editar</button>
              ${c.status !== 'Encerrado' ? `
              <button class="btn btn-ghost btn-sm" style="color:var(--red)"
                onclick="Financeiro._encerrarContrato(${c.id})">Encerrar</button>` : ''}
            </div>
          </td>
        </tr>`).join('') :
        '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text3)">Nenhum contrato encontrado</td></tr>';
    };

    el.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Contratos</div>
            <div class="page-sub">Gestão de contratos de fornecimento de energia e serviços</div>
          </div>
        </div>

        <div class="filter-bar" style="margin-bottom:16px">
          <input type="text" class="form-input" id="fin-ct-busca" style="width:250px"
            placeholder="Buscar por nº, objeto ou fornecedor…"
            oninput="Financeiro._ctFiltro()">
          <select class="form-select" id="fin-ct-status" style="width:180px"
            onchange="Financeiro._ctFiltro()">
            <option value="">Todos os Status</option>
            <option>Ativo</option>
            <option>Próx. Vencimento</option>
            <option>Encerrado</option>
          </select>
          <button class="btn btn-primary" onclick="Financeiro._abrirModalContrato(null)">+ Novo Contrato</button>
        </div>

        <div class="card">
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Nº Contrato</th>
                  <th>Objeto</th>
                  <th>Fornecedor</th>
                  <th>Vigência Início</th>
                  <th>Vigência Fim</th>
                  <th style="text-align:right">Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="fin-ct-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    Financeiro._ctFiltroFn = () => {
      filtroStatus = document.getElementById('fin-ct-status')?.value || '';
      filtroBusca  = (document.getElementById('fin-ct-busca')?.value || '').toLowerCase();
      render();
    };
    Financeiro._ctFiltro = Financeiro._ctFiltroFn;

    render();
  },

  _ctFiltro() {},

  _abrirModalContrato(id) {
    const contrato = id ? Financeiro._contratos.find(c => c.id === id) : null;
    const titulo   = contrato ? 'Editar Contrato' : 'Cadastrar Contrato';

    const html = `
      <div class="form-grid form-grid-2" style="gap:14px">
        <div>
          <label class="form-label">Nº do Contrato</label>
          <input type="text" class="form-input" id="mc-numero" value="${contrato?.numero||''}"
            placeholder="CT-SESP-AAAA-NNN">
        </div>
        <div>
          <label class="form-label">Fornecedor</label>
          <input type="text" class="form-input" id="mc-fornecedor" value="${contrato?.fornecedor||''}"
            placeholder="Razão social">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Objeto</label>
          <input type="text" class="form-input" id="mc-objeto" value="${contrato?.objeto||''}"
            placeholder="Descrição do objeto contratual">
        </div>
        <div>
          <label class="form-label">CNPJ do Fornecedor</label>
          <input type="text" class="form-input" id="mc-cnpj" value="${contrato?.cnpj||''}"
            placeholder="00.000.000/0001-00">
        </div>
        <div>
          <label class="form-label">Valor Global (R$)</label>
          <input type="number" class="form-input" id="mc-valor" min="0" step="0.01"
            value="${contrato?.valor||''}" placeholder="0,00">
        </div>
        <div>
          <label class="form-label">Vigência Início</label>
          <input type="date" class="form-input" id="mc-ini" value="${contrato?.ini||''}">
        </div>
        <div>
          <label class="form-label">Vigência Fim</label>
          <input type="date" class="form-input" id="mc-fim" value="${contrato?.fim||''}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">Observações</label>
          <textarea class="form-input" id="mc-obs" rows="3"
            style="resize:vertical">${contrato?.obs||''}</textarea>
        </div>
      </div>`;

    Modal.open(titulo, html, [
      { label: 'Cancelar', class: 'btn-ghost', action: () => {} },
      {
        label: contrato ? 'Salvar' : 'Cadastrar',
        class: 'btn-primary',
        action: () => Financeiro._salvarContrato(id)
      }
    ]);
  },

  _salvarContrato(id) {
    const numero     = document.getElementById('mc-numero')?.value?.trim();
    const fornecedor = document.getElementById('mc-fornecedor')?.value?.trim();
    const objeto     = document.getElementById('mc-objeto')?.value?.trim();
    const cnpj       = document.getElementById('mc-cnpj')?.value?.trim();
    const valor      = parseFloat(document.getElementById('mc-valor')?.value || '0');
    const ini        = document.getElementById('mc-ini')?.value;
    const fim        = document.getElementById('mc-fim')?.value;
    const obs        = document.getElementById('mc-obs')?.value?.trim();

    if (!numero || !fornecedor || !objeto || !valor || !ini || !fim) {
      Toast.show('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const hoje = new Date().toISOString().slice(0,10);
    const d90  = new Date(Date.now() + 90*86400000).toISOString().slice(0,10);
    let status = 'Ativo';
    if (fim < hoje) status = 'Encerrado';
    else if (fim <= d90) status = 'Próx. Vencimento';

    if (id) {
      const idx = Financeiro._contratos.findIndex(c => c.id === id);
      if (idx >= 0) {
        Financeiro._contratos[idx] = { ...Financeiro._contratos[idx], numero, fornecedor, objeto, cnpj, valor, ini, fim, obs, status };
        Toast.show('Contrato atualizado com sucesso', 'success');
      }
    } else {
      const novoId = Math.max(...Financeiro._contratos.map(c=>c.id)) + 1;
      Financeiro._contratos.push({ id:novoId, numero, fornecedor, objeto, cnpj, valor, ini, fim, obs, status });
      Toast.show('Contrato cadastrado com sucesso', 'success');
    }

    const el = document.getElementById('main-content');
    Financeiro.renderContratos(el);
  },

  _encerrarContrato(id) {
    const contrato = Financeiro._contratos.find(c => c.id === id);
    if (!contrato) return;
    Modal.open('Encerrar Contrato', `
      <div style="padding:8px 0">
        <p style="color:var(--text2);margin-bottom:12px">Confirma o encerramento do contrato?</p>
        <div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:13px">
          <div><strong>Nº:</strong> ${contrato.numero}</div>
          <div style="margin-top:4px"><strong>Fornecedor:</strong> ${contrato.fornecedor}</div>
          <div style="margin-top:4px"><strong>Objeto:</strong> ${contrato.objeto}</div>
        </div>
        <p style="color:var(--red);font-size:12px;margin-top:10px">O status será alterado para "Encerrado".</p>
      </div>`,
      [
        { label: 'Cancelar', class: 'btn-ghost', action: () => {} },
        {
          label: 'Encerrar', class: 'btn-primary',
          action: () => {
            const idx = Financeiro._contratos.findIndex(c => c.id === id);
            if (idx >= 0) Financeiro._contratos[idx].status = 'Encerrado';
            Toast.show('Contrato encerrado', 'success');
            const el = document.getElementById('main-content');
            Financeiro.renderContratos(el);
          }
        }
      ]
    );
  },
};
