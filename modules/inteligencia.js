// ═══════════════════════════════════════
// GRAD Ecossistema — INTELIGÊNCIA OPERACIONAL
// MTTR, MTBF, rankings, tendências
// ═══════════════════════════════════════

const Inteligencia = {
  _charts: {},

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Inteligência Operacional</div>
            <div class="page-sub">MTTR · MTBF · Rankings · Tendências</div>
          </div>
          <div class="page-actions">
            <select class="form-select" id="intel-periodo" onchange="Inteligencia.load()" style="width:160px">
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="180">Últimos 6 meses</option>
              <option value="365">Último ano</option>
            </select>
            <button class="btn btn-ghost btn-sm" onclick="Inteligencia.load()">↻ Atualizar</button>
          </div>
        </div>

        <!-- KPIs principais -->
        <div id="intel-kpis" class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px"></div>

        <!-- Gráficos de tendência -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="card" style="height:260px;display:flex;flex-direction:column">
            <div class="card-title">Ocorrências por semana</div>
            <canvas id="chart-tendencia" style="flex:1;min-height:0"></canvas>
          </div>
          <div class="card" style="height:260px;display:flex;flex-direction:column">
            <div class="card-title">Disponibilidade por RISP (%)</div>
            <canvas id="chart-disponib" style="flex:1;min-height:0"></canvas>
          </div>
        </div>

        <!-- Rankings -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div id="intel-ranking-sites"></div>
          <div id="intel-ranking-motivos"></div>
          <div id="intel-ranking-risp"></div>
        </div>
      </div>`;

    await Inteligencia.load();
  },

  async load() {
    const dias   = parseInt(document.getElementById('intel-periodo')?.value || '30');
    const desde  = new Date(Date.now() - dias * 86400000).toISOString();

    try {
      // Ocorrências no período (incluindo históricas já fechadas)
      const ocorrs = await dbQuery(d =>
        d.from('ocorrencias')
          .select('*, site:sites(nome,risp:risps(nome)), motivo:motivos_falha(descricao)')
          .gte('inicio', desde)
          .order('inicio', { ascending: true })
      );

      // Total de sites ativos
      const { count: totalSites } = await db
        .from('sites').select('*', { count: 'exact', head: true }).eq('ativo', true);

      const dados = ocorrs || [];
      Inteligencia._renderKPIs(dados, totalSites || 0, dias);
      Inteligencia._renderCharts(dados, dias);
      Inteligencia._renderRankings(dados, totalSites || 0);
    } catch {
      // silencioso — Toast já mostrado pelo dbQuery
    }
  },

  _calcMTTR(ocorrs) {
    // Média do tempo de recuperação (início → fim) em horas
    const comFim = ocorrs.filter(o => o.fim);
    if (!comFim.length) return null;
    const totalHoras = comFim.reduce((s, o) => {
      return s + (new Date(o.fim) - new Date(o.inicio)) / 3600000;
    }, 0);
    return totalHoras / comFim.length;
  },

  _calcMTBF(ocorrs, totalSites, dias) {
    // Tempo médio entre falhas = (período total * sites) / nº ocorrências
    if (!ocorrs.length || !totalSites) return null;
    const horasTotais = dias * 24 * totalSites;
    return horasTotais / ocorrs.length;
  },

  _renderKPIs(ocorrs, totalSites, dias) {
    const mttr = Inteligencia._calcMTTR(ocorrs);
    const mtbf = Inteligencia._calcMTBF(ocorrs, totalSites, dias);
    const inop = ocorrs.filter(o => o.situacao === 'Inoperante' || (!o.fim && o.situacao !== 'Operacional')).length;
    const disponib = totalSites
      ? Math.max(0, Math.round((1 - inop / totalSites) * 100))
      : 0;

    const fmtHoras = h => h == null ? '—' : h < 24
      ? `${h.toFixed(1)}h`
      : `${(h/24).toFixed(1)}d`;

    const el = document.getElementById('intel-kpis');
    if (!el) return;
    el.innerHTML = `
      <div class="kpi-card green">
        <div class="kpi-label">Disponibilidade</div>
        <div class="kpi-value">${disponib}%</div>
        <div class="kpi-sub">rede atual</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-label">MTTR</div>
        <div class="kpi-value">${fmtHoras(mttr)}</div>
        <div class="kpi-sub">tempo médio de reparo</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">MTBF</div>
        <div class="kpi-value">${fmtHoras(mtbf)}</div>
        <div class="kpi-sub">tempo médio entre falhas</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Total Ocorrências</div>
        <div class="kpi-value">${ocorrs.length}</div>
        <div class="kpi-sub">nos últimos ${dias}d</div>
      </div>`;
  },

  _renderCharts(ocorrs, dias) {
    // Destrói charts anteriores
    Object.values(Inteligencia._charts).forEach(c => { try { c.destroy(); } catch {} });
    Inteligencia._charts = {};

    // ── Tendência semanal ──────────────
    const semanas = {};
    const agora   = new Date();
    for (let i = Math.ceil(dias / 7) - 1; i >= 0; i--) {
      const d = new Date(agora);
      d.setDate(d.getDate() - i * 7);
      const key = `${d.getFullYear()}-S${Math.ceil(d.getDate() / 7)}`;
      semanas[key] = 0;
    }
    ocorrs.forEach(o => {
      const d   = new Date(o.inicio);
      const key = `${d.getFullYear()}-S${Math.ceil(d.getDate() / 7)}`;
      if (semanas[key] !== undefined) semanas[key]++;
    });

    const c1 = document.getElementById('chart-tendencia');
    if (c1) {
      Inteligencia._charts.tend = new Chart(c1, {
        type: 'line',
        data: {
          labels: Object.keys(semanas).map(k => k.replace(/\d{4}-/, '')),
          datasets: [{
            data: Object.values(semanas),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.15)',
            tension: 0.4, fill: true,
            borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#3b82f6'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#c4d8f0', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#c4d8f0', font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    // ── Disponibilidade por RISP ───────
    const rispMap = {};
    const rispTot = {};
    ocorrs.forEach(o => {
      const r = o.site?.risp?.nome || 'Sem RISP';
      rispMap[r] = (rispMap[r] || 0) + 1;
    });
    // Busca total de sites por RISP do cache
    const risps   = Object.keys(rispMap).sort();
    const dispPct = risps.map(r => {
      const falhas  = rispMap[r] || 0;
      // Aproximação: disponibilidade = 100 - (falhas/total_por_risp * 100)
      // Sem dados de total por RISP, usamos proporção relativa
      return Math.max(0, 100 - Math.min(100, falhas * 5));
    });

    const c2 = document.getElementById('chart-disponib');
    if (c2 && risps.length) {
      Inteligencia._charts.disp = new Chart(c2, {
        type: 'bar',
        data: {
          labels: risps,
          datasets: [{
            data: dispPct,
            backgroundColor: dispPct.map(v => v >= 90 ? '#22c55e' : v >= 70 ? '#fbbf24' : '#ef4444'),
            borderRadius: 4, barThickness: 18
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#c4d8f0', font: { size: 10 } }, grid: { display: false } },
            y: { min: 0, max: 100, ticks: { color: '#c4d8f0', font: { size: 10 }, callback: v => v+'%' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  },

  _renderRankings(ocorrs, totalSites) {
    // ── Sites mais problemáticos ───────
    const siteMap = {};
    ocorrs.forEach(o => {
      const nome = o.site?.nome || o.site_id;
      if (!siteMap[nome]) siteMap[nome] = { count: 0, horas: 0, risp: o.site?.risp?.nome || '—' };
      siteMap[nome].count++;
      if (o.fim) siteMap[nome].horas += (new Date(o.fim) - new Date(o.inicio)) / 3600000;
    });
    const topSites = Object.entries(siteMap)
      .sort((a,b) => b[1].count - a[1].count)
      .slice(0, 10);

    document.getElementById('intel-ranking-sites').innerHTML = `
      <div class="card">
        <div class="card-title">Top 10 sites com mais falhas</div>
        ${topSites.length ? topSites.map(([nome, v], i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span style="width:20px;text-align:center;font-weight:700;color:${i<3?'#fbbf24':'var(--text3)'};font-size:12px">${i+1}</span>
            <div style="flex:1;overflow:hidden">
              <div style="font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</div>
              <div style="font-size:11px;color:var(--text3)">${v.risp}</div>
            </div>
            <span class="badge badge-red" style="flex-shrink:0">${v.count}x</span>
          </div>`).join('') :
          '<div class="empty-state" style="padding:20px 0"><div class="empty-state-title" style="font-size:13px">Sem dados</div></div>'}
      </div>`;

    // ── Motivos mais frequentes ────────
    const motivoMap = {};
    ocorrs.forEach(o => {
      const m = o.motivo?.descricao || 'Sem motivo';
      motivoMap[m] = (motivoMap[m] || 0) + 1;
    });
    const topMotivos = Object.entries(motivoMap).sort((a,b) => b[1]-a[1]).slice(0,8);
    const maxMot = topMotivos[0]?.[1] || 1;

    document.getElementById('intel-ranking-motivos').innerHTML = `
      <div class="card">
        <div class="card-title">Principais causas de falha</div>
        ${topMotivos.length ? topMotivos.map(([desc, cnt]) => `
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:3px">
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80%">${desc}</span>
              <span style="color:var(--text3);flex-shrink:0;margin-left:8px">${cnt}</span>
            </div>
            <div style="height:4px;background:var(--border);border-radius:2px">
              <div style="height:100%;width:${Math.round(cnt/maxMot*100)}%;background:#3b82f6;border-radius:2px;transition:width 0.5s"></div>
            </div>
          </div>`).join('') :
          '<div class="empty-state" style="padding:20px 0"><div class="empty-state-title" style="font-size:13px">Sem dados</div></div>'}
      </div>`;

    // ── Ranking RISP por impacto ───────
    const rispImpact = {};
    ocorrs.forEach(o => {
      const r = o.site?.risp?.nome || 'Sem RISP';
      if (!rispImpact[r]) rispImpact[r] = { falhas: 0, horas: 0 };
      rispImpact[r].falhas++;
      if (o.fim) rispImpact[r].horas += (new Date(o.fim) - new Date(o.inicio)) / 3600000;
    });
    const topRisp = Object.entries(rispImpact).sort((a,b) => b[1].falhas - a[1].falhas);

    const fmtH = h => h < 24 ? `${h.toFixed(0)}h` : `${(h/24).toFixed(1)}d`;

    document.getElementById('intel-ranking-risp').innerHTML = `
      <div class="card">
        <div class="card-title">Impacto por RISP</div>
        ${topRisp.length ? `
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>RISP</th><th style="text-align:center">Falhas</th><th style="text-align:center">Horas parado</th></tr></thead>
              <tbody>${topRisp.map(([nome,v]) => `
                <tr>
                  <td><span class="risp-badge">${nome}</span></td>
                  <td style="text-align:center;color:#f87171;font-weight:700">${v.falhas}</td>
                  <td style="text-align:center;color:var(--text3);font-size:12px">${v.horas ? fmtH(v.horas) : '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>` :
          '<div class="empty-state" style="padding:20px 0"><div class="empty-state-title" style="font-size:13px">Sem dados</div></div>'}
      </div>`;
  }
};
