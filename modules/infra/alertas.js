// ═══════════════════════════════════════
// GRAD Ecossistema — ALERTAS
// Painel de alertas operacionais
// ═══════════════════════════════════════

const Alertas = {
  _data: [],

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Alertas</div>
            <div class="page-sub">Situações que requerem atenção imediata</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Alertas.refresh()">↻ Atualizar</button>
          </div>
        </div>
        <div id="al-content">
          <div class="empty-state"><div class="spinner"></div></div>
        </div>
      </div>`;

    await Alertas.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Alertas.render(main);
  },

  async load() {
    try {
      const data = await dbQuery(d =>
        d.from('ocorrencias')
          .select('*, site:sites(id,nome,cidade,risp:risps(nome)), motivo:motivos_falha(descricao)')
          .neq('situacao', 'Operacional')
          .order('inicio', { ascending: true })
      );
      Alertas._data = data || [];
      Alertas._render();
      Alertas._atualizarBadge(Alertas._data.length);
    } catch {
      document.getElementById('al-content').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Erro ao carregar alertas</div></div>';
    }
  },

  _atualizarBadge(count) {
    const badge = document.getElementById('nav-badge-alertas');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  },

  _render() {
    const ocorrs = Alertas._data;

    // Grupos de alerta
    const criticos  = ocorrs.filter(o => o.situacao === 'Inoperante' && diffDays(o.inicio) >= 30);
    const semPrazo  = ocorrs.filter(o => !o.prazo && o.situacao !== 'Modo Local');
    const prazVenc  = ocorrs.filter(o => o.prazo && new Date(o.prazo) < new Date());
    const modoLocal = ocorrs.filter(o => o.situacao === 'Modo Local');
    const inativos7 = ocorrs.filter(o => o.situacao === 'Inoperante' && diffDays(o.inicio) >= 7 && diffDays(o.inicio) < 30);
    const semlgpi   = ocorrs.filter(o => !o.glpi && !o.os_numero && o.situacao === 'Inoperante');

    const contentEl = document.getElementById('al-content');

    if (!ocorrs.length) {
      contentEl.innerHTML = `
        <div class="card" style="text-align:center;padding:40px">
          <div style="font-size:48px;margin-bottom:12px">✅</div>
          <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:4px">Tudo operacional!</div>
          <div style="color:var(--text3)">Nenhuma ocorrência ativa no momento.</div>
        </div>`;
      return;
    }

    const renderGrupo = (titulo, icone, cor, borda, itens, btnLabel, btnAcao) => {
      if (!itens.length) return '';
      return `
        <div class="card" style="border-color:${borda};margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <span style="font-size:20px">${icone}</span>
            <div>
              <div style="font-size:14px;font-weight:700;color:${cor}">${titulo}</div>
              <div style="font-size:11px;color:var(--text3)">${itens.length} ocorrência${itens.length!==1?'s':''}</div>
            </div>
            ${btnLabel ? `<button class="btn btn-ghost btn-sm perm-edit" style="margin-left:auto" onclick="${btnAcao}">${btnLabel}</button>` : ''}
          </div>
          <div style="display:grid;gap:8px">
            ${itens.slice(0,10).map(o => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px;
                          background:rgba(255,255,255,.03);border-radius:6px;
                          border:1px solid rgba(255,255,255,.06)">
                <span class="risp-badge">${o.site?.risp?.nome||'—'}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;color:var(--text)">${o.site?.nome||'—'}</div>
                  <div style="font-size:11px;color:var(--text3)">${o.motivo?.descricao||'—'} · ${o.site?.cidade||''}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  ${daysBadge(diffDays(o.inicio))}
                  <div style="font-size:10px;color:var(--text3);margin-top:2px">${formatDate(o.inicio)}</div>
                </div>
                <button class="btn btn-ghost btn-sm perm-edit"
                        onclick="App.navigate('ocorrencias')"
                        title="Ver ocorrências">→</button>
              </div>`).join('')}
            ${itens.length > 10 ? `<div style="text-align:center;font-size:12px;color:var(--text3);padding:4px">+ ${itens.length-10} mais…</div>` : ''}
          </div>
        </div>`;
    };

    contentEl.innerHTML = `
      <!-- KPI cards de alertas -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px">
        <div class="kpi-card red" style="cursor:pointer" onclick="document.getElementById('al-sec-crit')?.scrollIntoView({behavior:'smooth'})">
          <div class="kpi-label">🚨 Críticos +30d</div>
          <div class="kpi-value">${criticos.length}</div>
          <div class="kpi-sub">inoperantes prolongados</div>
        </div>
        <div class="kpi-card orange" style="cursor:pointer" onclick="document.getElementById('al-sec-prazo')?.scrollIntoView({behavior:'smooth'})">
          <div class="kpi-label">⏰ Prazo vencido</div>
          <div class="kpi-value">${prazVenc.length}</div>
          <div class="kpi-sub">SLA expirado</div>
        </div>
        <div class="kpi-card amber" style="cursor:pointer" onclick="document.getElementById('al-sec-7d')?.scrollIntoView({behavior:'smooth'})">
          <div class="kpi-label">⚠️ Inop. +7 dias</div>
          <div class="kpi-value">${inativos7.length}</div>
          <div class="kpi-sub">atenção necessária</div>
        </div>
        <div class="kpi-card purple">
          <div class="kpi-label">🔌 Modo Local</div>
          <div class="kpi-value">${modoLocal.length}</div>
          <div class="kpi-sub">sem link central</div>
        </div>
        <div class="kpi-card" style="border-top:2px solid var(--text3)">
          <div class="kpi-label">📋 Sem GLPI</div>
          <div class="kpi-value" style="color:var(--text2)">${semlgpi.length}</div>
          <div class="kpi-sub">inop. sem protocolo</div>
        </div>
        <div class="kpi-card" style="border-top:2px solid var(--text3)">
          <div class="kpi-label">📅 Sem prazo</div>
          <div class="kpi-value" style="color:var(--text2)">${semPrazo.length}</div>
          <div class="kpi-sub">sem SLA definido</div>
        </div>
      </div>

      <!-- Seções de alerta -->
      <div id="al-sec-crit">
        ${renderGrupo('Críticos — Inoperantes há 30+ dias','🚨','#f87171','rgba(229,53,53,.35)', criticos)}
      </div>
      <div id="al-sec-prazo">
        ${renderGrupo('Prazo de resolução vencido','⏰','#fb923c','rgba(251,146,60,.35)', prazVenc)}
      </div>
      <div id="al-sec-7d">
        ${renderGrupo('Inoperantes há mais de 7 dias','⚠️','#fbbf24','rgba(251,191,36,.25)', inativos7)}
      </div>
      ${renderGrupo('Modo Local ativo','🔌','#a78bfa','rgba(167,139,250,.25)', modoLocal)}
      ${renderGrupo('Inoperantes sem protocolo GLPI/OS','📋','var(--text3)','rgba(255,255,255,.1)', semlgpi)}
      ${renderGrupo('Ocorrências sem prazo definido','📅','var(--text3)','rgba(255,255,255,.08)', semPrazo)}
    `;
  }
};

// Atualiza badge de alertas no nav ao iniciar sessão
// Chamado por App._updateAlertBadge()
