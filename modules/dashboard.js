// ═══════════════════════════════════════
// GRAD Ecossistema — DASHBOARD
// ═══════════════════════════════════════

const Dashboard = {
  charts: {},

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Dashboard</div>
            <div class="page-sub">Visão geral da rede em tempo real</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Dashboard.refresh()">↻ Atualizar</button>
          </div>
        </div>
        <div id="dash-kpis" class="kpi-grid"></div>
        <div style="display:grid;grid-template-columns:200px 1fr;gap:12px;margin-bottom:16px">
          <div class="card" style="height:220px;display:flex;flex-direction:column">
            <div class="card-title">Status da Rede</div>
            <canvas id="chart-status" style="flex:1;min-height:0"></canvas>
          </div>
          <div class="card" style="height:220px;display:flex;flex-direction:column">
            <div class="card-title">Motivos de Falha</div>
            <canvas id="chart-motivos" style="flex:1;min-height:0"></canvas>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div id="dash-criticos"></div>
          <div id="dash-risp"></div>
        </div>
      </div>`;

    await Dashboard.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Dashboard.render(main);
  },

  async load() {
    try {
      // Busca ocorrências ativas
      const ocorrencias = await dbQuery(d =>
        d.from('ocorrencias')
          .select('*, site:sites(nome,risp:risps(nome)), motivo:motivos_falha(descricao)')
          .neq('situacao', 'Operacional')
      );

      // Busca total de sites
      const { count: totalSites } = await db
        .from('sites').select('*', { count: 'exact', head: true }).eq('ativo', true);

      Dashboard._renderKPIs(ocorrencias || [], totalSites || 0);
      Dashboard._renderCharts(ocorrencias || [], totalSites || 0);
      Dashboard._renderCriticos(ocorrencias || []);
      Dashboard._renderRisp(ocorrencias || []);
    } catch {
      // Erro já tratado no dbQuery
    }
  },

  _renderKPIs(ocorrs, total) {
    const inop  = ocorrs.filter(o => o.situacao === 'Inoperante').length;
    const parc  = ocorrs.filter(o => o.situacao === 'Parcial/Em analise').length;
    const ml    = ocorrs.filter(o => o.situacao === 'Modo Local').length;
    const op    = Math.max(0, total - inop - parc - ml);
    const pct   = total ? Math.round(op / total * 100) : 0;
    const crit  = ocorrs.filter(o => o.situacao === 'Inoperante' && diffDays(o.inicio) > 7).length;

    document.getElementById('dash-kpis').innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-label">Total NMS</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-sub">${total} sites</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Operando</div>
        <div class="kpi-value">${op}</div>
        <div class="kpi-sub">${pct}%</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Inoperantes</div>
        <div class="kpi-value">${inop}</div>
        <div class="kpi-sub">${total ? Math.round(inop/total*100) : 0}%</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Parcial/Análise</div>
        <div class="kpi-value">${parc}</div>
        <div class="kpi-sub">${total ? Math.round(parc/total*100) : 0}%</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">Modo Local</div>
        <div class="kpi-value">${ml}</div>
        <div class="kpi-sub">${total ? Math.round(ml/total*100) : 0}%</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Críticos +7d</div>
        <div class="kpi-value">${crit}</div>
        <div class="kpi-sub">&nbsp;</div>
      </div>`;
  },

  _renderCharts(ocorrs, total) {
    const inop = ocorrs.filter(o => o.situacao === 'Inoperante').length;
    const parc = ocorrs.filter(o => o.situacao === 'Parcial/Em analise').length;
    const ml   = ocorrs.filter(o => o.situacao === 'Modo Local').length;
    const op   = Math.max(0, total - inop - parc - ml);

    // Destrói charts anteriores
    Object.values(Dashboard.charts).forEach(c => { try { c.destroy(); } catch {} });
    Dashboard.charts = {};

    // Rosca status
    const c1 = document.getElementById('chart-status');
    if (c1) {
      Dashboard.charts.status = new Chart(c1, {
        type: 'doughnut',
        data: {
          labels: ['Operando','Inoperante','Parcial','Modo Local'],
          datasets: [{ data: [op, inop, parc, ml],
            backgroundColor: ['#22c55e','#ef4444','#fbbf24','#a78bfa'],
            borderWidth: 2, borderColor: 'rgba(0,0,0,0)'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 6, color: '#c4d8f0' }}}
        }
      });
    }

    // Barras motivos
    const motivoMap = {};
    ocorrs.forEach(o => {
      const m = o.motivo?.descricao || 'Sem motivo';
      motivoMap[m] = (motivoMap[m] || 0) + 1;
    });
    const motivoEntries = Object.entries(motivoMap).sort((a,b) => b[1]-a[1]).slice(0,8);

    const c2 = document.getElementById('chart-motivos');
    if (c2 && motivoEntries.length) {
      Dashboard.charts.motivos = new Chart(c2, {
        type: 'bar',
        data: {
          labels: motivoEntries.map(e => e[0]),
          datasets: [{ data: motivoEntries.map(e => e[1]),
            backgroundColor: '#3b82f6', borderRadius: 4, barThickness: 14
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          layout: { padding: { right: 40 } },
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false, grid: { display: false } },
            y: {
              afterFit: a => { a.width = 180; },
              ticks: { font: { size: 10 }, color: '#c4d8f0' },
              grid: { display: false }
            }
          }
        }
      });
    }
  },

  _renderCriticos(ocorrs) {
    const criticos = ocorrs
      .filter(o => o.situacao === 'Inoperante')
      .map(o => ({ ...o, dias: diffDays(o.inicio) }))
      .sort((a,b) => b.dias - a.dias)
      .slice(0, 8);

    const rows = criticos.map(o => `
      <tr>
        <td><span class="risp-badge">${o.site?.risp?.nome || '—'}</span></td>
        <td><strong style="color:var(--text)">${o.site?.nome || o.site_id}</strong></td>
        <td>${daysBadge(o.dias)}</td>
        <td style="color:var(--text3);font-size:12px">${o.motivo?.descricao || '—'}</td>
      </tr>`).join('');

    document.getElementById('dash-criticos').innerHTML = `
      <div class="card">
        <div class="card-title">Sites críticos (mais tempo inoperante)</div>
        ${criticos.length ? `
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>RISP</th><th>Site</th><th>Dias</th><th>Motivo</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>` : '<div class="empty-state"><div class="empty-state-title">Nenhum site crítico</div></div>'}
      </div>`;
  },

  _renderRisp(ocorrs) {
    const rispMap = {};
    ocorrs.forEach(o => {
      const r = o.site?.risp?.nome || 'Sem RISP';
      if (!rispMap[r]) rispMap[r] = { inop: 0, parc: 0, ml: 0 };
      if (o.situacao === 'Inoperante') rispMap[r].inop++;
      else if (o.situacao === 'Parcial/Em analise') rispMap[r].parc++;
      else if (o.situacao === 'Modo Local') rispMap[r].ml++;
    });

    const rows = Object.entries(rispMap)
      .sort((a,b) => (b[1].inop+b[1].parc+b[1].ml) - (a[1].inop+a[1].parc+a[1].ml))
      .map(([nome, v]) => `
        <tr>
          <td><span class="risp-badge">${nome}</span></td>
          <td style="text-align:center;color:#f87171;font-weight:700">${v.inop || '—'}</td>
          <td style="text-align:center;color:#a78bfa;font-weight:700">${v.ml || '—'}</td>
          <td style="text-align:center;color:#fbbf24;font-weight:700">${v.parc || '—'}</td>
          <td style="text-align:center;font-weight:700">${v.inop+v.parc+v.ml}</td>
        </tr>`).join('');

    document.getElementById('dash-risp').innerHTML = `
      <div class="card">
        <div class="card-title">Problemas por RISP</div>
        ${rows ? `
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>RISP</th><th style="text-align:center">Inop.</th><th style="text-align:center">M.Local</th><th style="text-align:center">Parcial</th><th style="text-align:center">Total</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>` : '<div class="empty-state"><div class="empty-state-title">Nenhum problema ativo</div></div>'}
      </div>`;
  }
};
