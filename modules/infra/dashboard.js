// ═══════════════════════════════════════
// GRAD Ecossistema — DASHBOARD
// Versão completa com MTTR, banner crítico
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
            <span id="dash-atualizado" style="font-size:11px;color:var(--text3);font-family:var(--mono)"></span>
            <button class="btn btn-ghost btn-sm" onclick="Dashboard.refresh()">↻ Atualizar</button>
          </div>
        </div>

        <!-- Banner crítico -->
        <div id="dash-banner" style="display:none"></div>

        <!-- KPIs -->
        <div id="dash-kpis" class="kpi-grid"></div>

        <!-- Charts -->
        <div style="display:grid;grid-template-columns:220px 1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="card" style="height:240px;display:flex;flex-direction:column">
            <div class="card-title">Status da Rede</div>
            <canvas id="chart-status" style="flex:1;min-height:0"></canvas>
          </div>
          <div class="card" style="height:240px;display:flex;flex-direction:column">
            <div class="card-title">Motivos de Falha</div>
            <canvas id="chart-motivos" style="flex:1;min-height:0"></canvas>
          </div>
          <div class="card" style="height:240px;display:flex;flex-direction:column">
            <div class="card-title">Ocorrências — Últimos 7 dias</div>
            <canvas id="chart-historico" style="flex:1;min-height:0"></canvas>
          </div>
        </div>

        <!-- Painel de operacionalidade + tabelas -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div id="dash-criticos"></div>
          <div id="dash-risp"></div>
        </div>

        <!-- Cálculo operacional detalhado -->
        <div id="dash-calculo"></div>
      </div>`;

    await Dashboard.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Dashboard.render(main);
  },

  async load() {
    try {
      // Ocorrências ativas
      const ocorrencias = await dbQuery(d =>
        d.from('ocorrencias')
          .select('*, site:sites(nome,risp:risps(nome)), motivo:motivos_falha(descricao)')
          .neq('situacao', 'Operacional')
      );

      // Total de sites
      const { count: totalSites } = await db
        .from('sites').select('*', { count: 'exact', head: true }).eq('ativo', true);

      // Ocorrências fechadas nos últimos 30 dias (para MTTR)
      const desde30 = new Date(Date.now() - 30*86400000).toISOString();
      const fechadas = await dbQuery(d =>
        d.from('ocorrencias')
          .select('inicio,fim')
          .not('fim', 'is', null)
          .gte('fim', desde30)
      );

      // Ocorrências dos últimos 7 dias (para gráfico histórico)
      const desde7 = new Date(Date.now() - 7*86400000).toISOString();
      const historico7d = await dbQuery(d =>
        d.from('ocorrencias')
          .select('inicio,fim,situacao')
          .gte('inicio', desde7)
          .order('inicio', { ascending: true })
      );

      // RISPs (para cálculo operacional) — ordem numérica
      const _rispsRaw = await dbQuery(d =>
        d.from('risps').select('id,nome')
      );
      const risps = (_rispsRaw || []).sort((a,b) =>
        (parseInt(a.nome.replace(/\D/g,''))||0) - (parseInt(b.nome.replace(/\D/g,''))||0)
      );

      // Sites com situação (para cálculo por RISP)
      const sitesComRisp = await dbQuery(d =>
        d.from('sites').select('id,risp_id,risp:risps(nome)').eq('ativo',true)
      );

      const ocorrs = ocorrencias || [];
      const total  = totalSites || 0;

      Dashboard._renderBanner(ocorrs);
      Dashboard._renderKPIs(ocorrs, total, fechadas || []);
      Dashboard._renderCharts(ocorrs, total, historico7d || []);
      Dashboard._renderCriticos(ocorrs);
      Dashboard._renderRisp(ocorrs);
      Dashboard._renderCalculo(ocorrs, total, risps || [], sitesComRisp || []);

      const atEl = document.getElementById('dash-atualizado');
      if (atEl) atEl.textContent = 'Atualizado: ' + new Date().toLocaleTimeString('pt-BR');
    } catch(e) {
      console.error('Dashboard load error', e);
    }
  },

  _renderBanner(ocorrs) {
    const bannerEl = document.getElementById('dash-banner');
    if (!bannerEl) return;

    const crit30 = ocorrs.filter(o => o.situacao === 'Inoperante' && diffDays(o.inicio) >= 30);
    if (!crit30.length) { bannerEl.style.display = 'none'; return; }

    bannerEl.style.display = 'block';
    bannerEl.innerHTML = `
      <div style="background:rgba(229,53,53,.12);border:1px solid rgba(229,53,53,.35);border-radius:8px;
                  padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
        <span style="font-size:18px">🚨</span>
        <div>
          <div style="color:#f87171;font-weight:700;font-size:13px">ALERTA CRÍTICO</div>
          <div style="color:var(--text2);font-size:12px;margin-top:2px">
            ${crit30.length} site(s) inoperante(s) há mais de 30 dias:
            ${crit30.slice(0,3).map(o=>`<strong>${o.site?.nome||'?'}</strong>`).join(', ')}${crit30.length>3?` e mais ${crit30.length-3}`:''}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-left:auto;color:#f87171" onclick="App.navigate('ocorrencias')">Ver →</button>
      </div>`;
  },

  _renderKPIs(ocorrs, total, fechadas) {
    const inop  = ocorrs.filter(o => o.situacao === 'Inoperante').length;
    const inst  = ocorrs.filter(o => o.situacao === 'Instável').length;
    const parc  = ocorrs.filter(o => o.situacao === 'Parcial/Em analise').length;
    const ml    = ocorrs.filter(o => o.situacao === 'Modo Local').length;
    const op    = Math.max(0, total - inop - inst - parc - ml);
    const pct   = total ? Math.round(op / total * 100) : 0;
    const crit  = ocorrs.filter(o => o.situacao === 'Inoperante' && diffDays(o.inicio) > 7).length;

    // MTTR — média dos dias entre inicio e fim das fechadas
    let mttr = 0;
    if (fechadas.length) {
      const somas = fechadas
        .filter(o => o.inicio && o.fim)
        .map(o => Math.max(0, (new Date(o.fim) - new Date(o.inicio)) / 86400000));
      mttr = somas.length ? Math.round(somas.reduce((a,b)=>a+b,0) / somas.length * 10) / 10 : 0;
    }

    document.getElementById('dash-kpis').innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-label">Total NMS</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-sub">sites monitorados</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Operando</div>
        <div class="kpi-value">${pct}%</div>
        <div class="kpi-sub">${op} sites OK</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Inoperantes</div>
        <div class="kpi-value">${inop}</div>
        <div class="kpi-sub">${total ? Math.round(inop/total*100) : 0}% da rede</div>
      </div>
      <div class="kpi-card teal">
        <div class="kpi-label">Instáveis</div>
        <div class="kpi-value">${inst}</div>
        <div class="kpi-sub">sinal degradado</div>
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
        <div class="kpi-sub">inoperante prolongado</div>
      </div>
      <div class="kpi-card" style="border-top:2px solid #14b8a6">
        <div class="kpi-label">MTTR (30d)</div>
        <div class="kpi-value" style="color:#14b8a6;font-size:24px">${mttr}d</div>
        <div class="kpi-sub">${fechadas.length} resoluções</div>
      </div>`;
  },

  _renderCharts(ocorrs, total, historico) {
    const inop = ocorrs.filter(o => o.situacao === 'Inoperante').length;
    const inst = ocorrs.filter(o => o.situacao === 'Instável').length;
    const parc = ocorrs.filter(o => o.situacao === 'Parcial/Em analise').length;
    const ml   = ocorrs.filter(o => o.situacao === 'Modo Local').length;
    const op   = Math.max(0, total - inop - inst - parc - ml);

    Object.values(Dashboard.charts).forEach(c => { try { c.destroy(); } catch {} });
    Dashboard.charts = {};

    // Rosca status
    const c1 = document.getElementById('chart-status');
    if (c1) {
      Dashboard.charts.status = new Chart(c1, {
        type: 'doughnut',
        data: {
          labels: ['Operando','Inoperante','Instável','Parcial','Modo Local'],
          datasets: [{ data: [op, inop, inst, parc, ml],
            backgroundColor: ['#22c55e','#ef4444','#14b8a6','#fbbf24','#a78bfa'],
            borderWidth: 2, borderColor: 'rgba(0,0,0,0)'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 6, color: '#c4d8f0' }}
          }
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
    if (c2) {
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
              afterFit: a => { a.width = 160; },
              ticks: { font: { size: 10 }, color: '#c4d8f0' },
              grid: { display: false }
            }
          }
        }
      });
    }

    // Gráfico histórico 7 dias
    const c3 = document.getElementById('chart-historico');
    if (c3) {
      const labels = [];
      const abertas = [];
      const fechadas = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i*86400000);
        const label = d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
        const dStr  = d.toISOString().slice(0,10);
        labels.push(label);
        abertas.push(historico.filter(o => o.inicio?.slice(0,10) === dStr).length);
        fechadas.push(historico.filter(o => o.fim?.slice(0,10) === dStr).length);
      }
      Dashboard.charts.historico = new Chart(c3, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Abertas',    data: abertas,   borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,.12)', fill: true, tension: .35, pointRadius: 3 },
            { label: 'Resolvidas', data: fechadas,  borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.08)',  fill: true, tension: .35, pointRadius: 3 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 6, color: '#c4d8f0' }}},
          scales: {
            x: { ticks: { font: { size: 10 }, color: '#c4d8f0' }, grid: { color: 'rgba(255,255,255,.05)' }},
            y: { ticks: { font: { size: 10 }, color: '#c4d8f0' }, grid: { color: 'rgba(255,255,255,.05)' }, min: 0 }
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
        <td style="color:var(--text3);font-size:11px">${o.motivo?.descricao || '—'}</td>
      </tr>`).join('');

    document.getElementById('dash-criticos').innerHTML = `
      <div class="card">
        <div class="card-title">Sites críticos — mais tempo inoperante</div>
        ${criticos.length ? `
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>RISP</th><th>Site</th><th>Dias</th><th>Motivo</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>` : '<div class="empty-state" style="padding:20px"><div class="empty-state-title">Nenhum site crítico 🎉</div></div>'}
      </div>`;
  },

  _renderRisp(ocorrs) {
    const rispMap = {};
    ocorrs.forEach(o => {
      const r = o.site?.risp?.nome || 'Sem RISP';
      if (!rispMap[r]) rispMap[r] = { inop: 0, inst: 0, parc: 0, ml: 0 };
      if (o.situacao === 'Inoperante')         rispMap[r].inop++;
      else if (o.situacao === 'Instável')       rispMap[r].inst++;
      else if (o.situacao === 'Parcial/Em analise') rispMap[r].parc++;
      else if (o.situacao === 'Modo Local')     rispMap[r].ml++;
    });

    const rows = Object.entries(rispMap)
      .sort((a,b) => (b[1].inop+b[1].inst+b[1].parc+b[1].ml) - (a[1].inop+a[1].inst+a[1].parc+a[1].ml))
      .map(([nome, v]) => `
        <tr>
          <td><span class="risp-badge">${nome}</span></td>
          <td style="text-align:center;color:#f87171;font-weight:700">${v.inop||'—'}</td>
          <td style="text-align:center;color:#14b8a6;font-weight:700">${v.inst||'—'}</td>
          <td style="text-align:center;color:#a78bfa;font-weight:700">${v.ml||'—'}</td>
          <td style="text-align:center;color:#fbbf24;font-weight:700">${v.parc||'—'}</td>
          <td style="text-align:center;font-weight:700">${v.inop+v.inst+v.parc+v.ml}</td>
        </tr>`).join('');

    document.getElementById('dash-risp').innerHTML = `
      <div class="card">
        <div class="card-title">Problemas por RISP</div>
        ${rows ? `
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr>
                <th>RISP</th>
                <th style="text-align:center">Inop.</th>
                <th style="text-align:center">Inst.</th>
                <th style="text-align:center">M.Local</th>
                <th style="text-align:center">Parcial</th>
                <th style="text-align:center">Total</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>` : '<div class="empty-state" style="padding:20px"><div class="empty-state-title">Tudo operacional!</div></div>'}
      </div>`;
  },

  _renderCalculo(ocorrs, total, risps, sitesComRisp) {
    if (!total) return;

    const inop  = ocorrs.filter(o => o.situacao === 'Inoperante').length;
    const inst  = ocorrs.filter(o => o.situacao === 'Instável').length;
    const parc  = ocorrs.filter(o => o.situacao === 'Parcial/Em analise').length;
    const ml    = ocorrs.filter(o => o.situacao === 'Modo Local').length;
    const op    = Math.max(0, total - inop - inst - parc - ml);
    const pct   = (op / total * 100).toFixed(1);

    // Barra de operacionalidade
    const barW = parseFloat(pct);
    const barColor = barW >= 90 ? '#22c55e' : barW >= 75 ? '#fbbf24' : '#ef4444';

    // Cards por RISP
    const rispCards = risps.map(r => {
      const sitesRisp = sitesComRisp.filter(s => s.risp_id === r.id).length;
      const probsRisp = ocorrs.filter(o => {
        const site = sitesComRisp.find(s => s.id === o.site_id);
        return site?.risp_id === r.id;
      });
      const inopR = probsRisp.filter(o => o.situacao === 'Inoperante').length;
      const opR   = Math.max(0, sitesRisp - probsRisp.length);
      const pctR  = sitesRisp ? (opR / sitesRisp * 100).toFixed(0) : null;
      const cor   = pctR === null ? '#6b7280' : parseInt(pctR) >= 90 ? '#22c55e' : parseInt(pctR) >= 75 ? '#fbbf24' : '#ef4444';
      const pctW  = pctR ?? 0;

      return `
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:10px 12px;min-width:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span class="risp-badge">${r.nome}</span>
            <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">${sitesRisp} sites</span>
          </div>
          <div style="display:flex;gap:16px;margin-bottom:8px">
            <div>
              <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">OK</div>
              <div style="font-size:20px;font-weight:700;font-family:var(--mono);color:#34d399;line-height:1.1">${opR}</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">INOP</div>
              <div style="font-size:20px;font-weight:700;font-family:var(--mono);color:${inopR?'#f87171':'var(--text3)'};line-height:1.1">${inopR||'—'}</div>
            </div>
            <div style="margin-left:auto;text-align:right">
              <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Disp.</div>
              <div style="font-size:20px;font-weight:700;font-family:var(--mono);color:${cor};line-height:1.1">${pctR !== null ? pctR+'%' : '—'}</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:4px;height:5px">
            <div style="background:${cor};height:5px;border-radius:4px;width:${pctW}%;transition:width .5s"></div>
          </div>
        </div>`;
    }).join('');

    document.getElementById('dash-calculo').innerHTML = `
      <div class="card">
        <div class="card-title">Cálculo Operacional</div>
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
            <span style="font-size:13px;color:var(--text2)">Disponibilidade geral da rede</span>
            <span style="font-size:28px;font-weight:700;font-family:var(--mono);color:${barColor}">${pct}%</span>
          </div>
          <div style="background:rgba(255,255,255,.1);border-radius:8px;height:10px">
            <div style="background:${barColor};height:10px;border-radius:8px;width:${barW}%;transition:width .5s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:var(--text3)">
            <span>${op} operando</span>
            <span>${inop} inoperante${inop!==1?'s':''}</span>
            <span>${inst} instáv${inst!==1?'eis':'el'}</span>
            <span>${parc} parcial</span>
            <span>${ml} modo local</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
          ${rispCards}
        </div>
      </div>`;
  }
};
