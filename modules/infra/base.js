// ═══════════════════════════════════════
// GRAD Ecossistema — BASE DE SITES
// Planejamento · inventário · fases
// ═══════════════════════════════════════

const Base = {
  _data:    [],
  _pagina:  1,
  _porPagina: 25,

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Base de Sites</div>
            <div class="page-sub">Inventário completo de ERBs · distribuição por fase e RISP</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Base.exportarExcel()">↓ Excel</button>
            <button class="btn btn-ghost btn-sm" onclick="Base.exportarPDF()">↓ PDF</button>
            <button class="btn btn-ghost btn-sm" onclick="Base.refresh()">↻ Atualizar</button>
          </div>
        </div>

        <div class="filter-bar">
          <input class="form-input" id="bs-busca" placeholder="Buscar site, SBS, cidade..." oninput="Base._applyFilter()" style="width:220px">
          <select class="form-select" id="bs-risp" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Todas RISPs</option>
          </select>
          <select class="form-select" id="bs-prop" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Proprietário</option>
          </select>
          <select class="form-select" id="bs-fase" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Todas as fases</option>
          </select>
        </div>

        <div id="bs-summary" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"></div>

        <div class="card" style="padding:0">
          <div id="bs-table" class="table-wrap" style="border:none"></div>
        </div>
        <div id="bs-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Base.load();
  },

  async refresh() {
    await Base.render(document.getElementById('main-content'));
  },

  async load() {
    try {
      const sites = await dbQuery(d =>
        d.from('sites').select('*, risp:risps(id,nome)').eq('ativo', true).order('nome')
      );
      Base._data = sites || [];
      await Base._popularFiltros();
      Base._applyFilter();
    } catch {
      const el = document.getElementById('bs-table');
      if (el) el.innerHTML = '<div class="empty-state"><div class="empty-state-title">Erro ao carregar base</div></div>';
    }
  },

  async _popularFiltros() {
    // RISPs em ordem numérica
    try {
      const risps = (await dbQuery(d => d.from('risps').select('id,nome')) || [])
        .sort((a,b) => (parseInt(a.nome.replace(/\D/g,''))||0) - (parseInt(b.nome.replace(/\D/g,''))||0));
      const sel = document.getElementById('bs-risp');
      if (sel) risps.forEach(r => {
        const o = document.createElement('option');
        o.value = r.nome; o.textContent = r.nome; sel.appendChild(o);
      });
    } catch {}

    // Proprietários
    const props = [...new Set(Base._data.map(s => Base._getProp(s)).filter(Boolean))].sort();
    const selP  = document.getElementById('bs-prop');
    if (selP) props.forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p; selP.appendChild(o);
    });

    // Fases
    const fases = [...new Set(Base._data.map(s => s.fase).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
    const selF = document.getElementById('bs-fase');
    if (selF) fases.forEach(f => {
      const o = document.createElement('option');
      o.value = f; o.textContent = f; selF.appendChild(o);
    });
  },

  _getProp(s) {
    if (s.proprietario) return s.proprietario;
    try {
      const obs = s.observacoes;
      if (obs && obs.trimStart().startsWith('{')) return JSON.parse(obs).proprietario || 'SESP';
    } catch {}
    return 'SESP';
  },

  _sortRisps(arr) {
    return [...arr].sort((a,b) => (parseInt(a.replace(/\D/g,''))||99) - (parseInt(b.replace(/\D/g,''))||99));
  },

  _applyFilter() { Base._pagina = 1; Base._render(); },

  _filtrar() {
    const busca = (document.getElementById('bs-busca')?.value || '').toLowerCase();
    const risp  = document.getElementById('bs-risp')?.value  || '';
    const prop  = document.getElementById('bs-prop')?.value  || '';
    const fase  = document.getElementById('bs-fase')?.value  || '';

    return Base._data.filter(s => {
      if (risp && s.risp?.nome !== risp)    return false;
      if (prop && Base._getProp(s) !== prop) return false;
      if (fase && s.fase !== fase)           return false;
      if (busca && !s.nome?.toLowerCase().includes(busca) &&
                   !s.cidade?.toLowerCase().includes(busca) &&
                   !String(s.sbs||'').includes(busca))       return false;
      return true;
    });
  },

  _render() {
    const filtrados = Base._filtrar();
    const total     = filtrados.length;
    const inicio    = (Base._pagina - 1) * Base._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Base._porPagina);

    // Resumo
    const comFase = filtrados.filter(s => s.fase).length;
    const semFase = filtrados.filter(s => !s.fase).length;
    const sumEl   = document.getElementById('bs-summary');
    if (sumEl) sumEl.innerHTML = `
      <span class="badge badge-blue">${total} sites</span>
      <span class="badge badge-green">${comFase} com fase</span>
      <span class="badge badge-gray">${semFase} sem fase</span>
      <span class="badge badge-blue">${Base._data.filter(s=>s.latitude!=null).length} com coords</span>`;

    const rows = pagina.map(s => {
      const prop = Base._getProp(s);
      const propCor = prop === 'GEFRON' ? '#22c55e' : prop === 'PRF' ? '#f59e0b' : '#3d9bff';
      return `
        <tr onclick="Base.verSite('${s.id}')" style="cursor:pointer">
          <td><span class="risp-badge">${s.risp?.nome||'—'}</span></td>
          <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">${s.sbs||'—'}</td>
          <td><strong style="color:var(--text)">${s.nome||'—'}</strong></td>
          <td style="color:var(--text2);font-size:12px">${s.cidade||'—'}</td>
          <td style="font-size:12px"><span style="color:${propCor};font-weight:600">${prop}</span></td>
          <td style="font-size:12px">
            ${s.fase
              ? `<span style="background:rgba(61,155,255,.15);color:#3d9bff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${s.fase}</span>`
              : `<span style="color:var(--text3);font-size:11px">—</span>`}
          </td>
          <td style="font-size:11px;color:var(--text3)">${s.latitude!=null?`${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}`:'—'}</td>
        </tr>`;
    }).join('');

    const tableEl = document.getElementById('bs-table');
    if (tableEl) {
      tableEl.innerHTML = total ? `
        <table>
          <thead><tr>
            <th>RISP</th><th>SBS</th><th>Nome</th><th>Município</th>
            <th>Proprietário</th><th>Fase</th><th>Coords</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>` :
        '<div class="empty-state"><div class="empty-state-icon">📡</div><div class="empty-state-title">Nenhum site encontrado</div></div>';
    }

    // Paginação
    const totalPags = Math.ceil(total / Base._porPagina);
    const pagEl = document.getElementById('bs-pagination');
    if (pagEl) {
      if (totalPags <= 1) { pagEl.innerHTML = ''; return; }
      let html = `<span style="color:var(--text3);font-size:12px;margin-right:8px">${total} sites</span>`;
      html += `<button class="btn btn-ghost btn-sm" onclick="Base._pg(${Base._pagina-1})" ${Base._pagina===1?'disabled':''}>‹</button>`;
      for (let i = 1; i <= totalPags; i++) {
        if (i===1||i===totalPags||Math.abs(i-Base._pagina)<=2)
          html += `<button class="btn btn-sm ${i===Base._pagina?'btn-primary':'btn-ghost'}" onclick="Base._pg(${i})">${i}</button>`;
        else if (Math.abs(i-Base._pagina)===3)
          html += `<span style="color:var(--text3);padding:0 4px">…</span>`;
      }
      html += `<button class="btn btn-ghost btn-sm" onclick="Base._pg(${Base._pagina+1})" ${Base._pagina===totalPags?'disabled':''}>›</button>`;
      pagEl.innerHTML = html;
    }
  },

  _pg(n) {
    const max = Math.ceil(Base._filtrar().length / Base._porPagina);
    if (n < 1 || n > max) return;
    Base._pagina = n; Base._render();
  },

  // ── VER / EDITAR SITE ──────────────────────────────────────────────────
  verSite(id) {
    const s    = Base._data.find(x => x.id === id);
    if (!s) return;
    const prop = Base._getProp(s);

    Modal.open(`📡 ${s.nome}`, `
      <div style="display:grid;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="form-label">RISP</label><div style="color:var(--text)">${s.risp?.nome||'—'}</div></div>
          <div><label class="form-label">SBS</label><div style="font-family:var(--mono);color:var(--text)">${s.sbs||'—'}</div></div>
          <div><label class="form-label">Município</label><div style="color:var(--text)">${s.cidade||'—'}</div></div>
          <div><label class="form-label">Proprietário</label><div style="color:var(--text)">${prop}</div></div>
          <div><label class="form-label">Latitude</label><div style="font-family:var(--mono);font-size:12px;color:var(--text2)">${s.latitude||'—'}</div></div>
          <div><label class="form-label">Longitude</label><div style="font-family:var(--mono);font-size:12px;color:var(--text2)">${s.longitude||'—'}</div></div>
        </div>
        <div>
          <label class="form-label">Fase <span style="color:var(--text3);font-size:10px">(edite e salve)</span></label>
          <input class="form-input" id="bs-fase-input" value="${s.fase||''}"
            placeholder="Ex: Fase 1, Fase 2, Expansão 2026..."
            style="width:100%">
        </div>
      </div>`,
      [
        { label: 'Fechar',      class: 'btn-ghost',   onclick: 'Modal.close()' },
        { label: '💾 Salvar Fase', class: 'btn-primary', onclick: `Base.salvarFase('${id}')` },
      ]
    );
  },

  async salvarFase(id) {
    const fase = document.getElementById('bs-fase-input')?.value?.trim() || null;
    try {
      const { error } = await db.from('sites').update({ fase }).eq('id', id);
      if (error) throw error;
      // Atualiza local
      const s = Base._data.find(x => x.id === id);
      if (s) s.fase = fase;
      Modal.close();
      Toast.show('Fase salva com sucesso', 'success');
      Base._render();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar fase', 'error');
    }
  },

  // ══════════════════════════════════════════════════════════
  // EXCEL
  // ══════════════════════════════════════════════════════════
  exportarExcel() {
    const todos = Base._data;
    if (!todos.length) { Toast.show('Sem dados para exportar', 'error'); return; }

    const wb   = XLSX.utils.book_new();
    const data = new Date().toLocaleDateString('pt-BR');
    const rispsNomes = Base._sortRisps([...new Set(todos.map(s => s.risp?.nome).filter(Boolean))]);

    // Aba Resumo
    const resumoRows = [
      ['GRAD Ecossistema — Base de Sites'],
      [`Gerado em: ${data}`],
      [],
      ['RESUMO GERAL'],
      ['Total de Sites',      todos.length],
      ['Com fase definida',   todos.filter(s=>s.fase).length],
      ['Sem fase definida',   todos.filter(s=>!s.fase).length],
      ['SESP',                todos.filter(s=>Base._getProp(s)==='SESP').length],
      ['GEFRON',              todos.filter(s=>Base._getProp(s)==='GEFRON').length],
      ['PRF',                 todos.filter(s=>Base._getProp(s)==='PRF').length],
      ['Com coordenadas',     todos.filter(s=>s.latitude!=null).length],
      ['Sem coordenadas',     todos.filter(s=>s.latitude==null).length],
      [],
      ['SITES POR RISP'],
      ['RISP','Total','Com Fase'],
      ...rispsNomes.map(r => {
        const ss = todos.filter(s=>s.risp?.nome===r);
        return [r, ss.length, ss.filter(s=>s.fase).length];
      }),
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);
    wsResumo['!cols'] = [{wch:30},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Aba Todos os Sites
    const header = ['RISP','SBS','Nome','Município','Proprietário','Fase','Latitude','Longitude'];
    const linhas = todos
      .sort((a,b) => {
        const ra = parseInt((a.risp?.nome||'').replace(/\D/g,''))||99;
        const rb = parseInt((b.risp?.nome||'').replace(/\D/g,''))||99;
        return ra !== rb ? ra - rb : (a.nome||'').localeCompare(b.nome||'');
      })
      .map(s => [
        s.risp?.nome||'', s.sbs||'', s.nome||'', s.cidade||'',
        Base._getProp(s), s.fase||'', s.latitude||'', s.longitude||''
      ]);
    const wsTodos = XLSX.utils.aoa_to_sheet([header, ...linhas]);
    wsTodos['!cols'] = [{wch:10},{wch:8},{wch:35},{wch:22},{wch:12},{wch:16},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, wsTodos, 'Todos os Sites');

    // Uma aba por RISP
    rispsNomes.forEach(rNome => {
      const ss = todos.filter(s=>s.risp?.nome===rNome)
        .sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
      const ws = XLSX.utils.aoa_to_sheet([
        ['SBS','Nome','Município','Proprietário','Fase','Latitude','Longitude'],
        ...ss.map(s=>[s.sbs||'',s.nome||'',s.cidade||'',Base._getProp(s),s.fase||'',s.latitude||'',s.longitude||''])
      ]);
      ws['!cols'] = [{wch:8},{wch:35},{wch:22},{wch:12},{wch:16},{wch:12},{wch:12}];
      XLSX.utils.book_append_sheet(wb, ws, rNome.replace(/\s/g,'_').slice(0,31));
    });

    XLSX.writeFile(wb, `base_sites_${new Date().toISOString().slice(0,10)}.xlsx`);
    Toast.show(`Excel gerado — ${todos.length} sites`, 'success');
  },

  // ══════════════════════════════════════════════════════════
  // PDF
  // ══════════════════════════════════════════════════════════
  async exportarPDF() {
    Toast.show('Gerando PDF...', 'info');

    if (typeof jspdf === 'undefined') {
      await new Promise((res,rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    if (!window._autotableLoaded) {
      await new Promise((res,rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
        s.onload = () => { window._autotableLoaded = true; res(); };
        s.onerror = rej; document.head.appendChild(s);
      });
    }

    const { jsPDF }  = jspdf;
    const doc        = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    const W          = doc.internal.pageSize.getWidth();
    const data       = new Date().toLocaleDateString('pt-BR');
    const hora       = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    const todos      = Base._data;
    const rispsNomes = Base._sortRisps([...new Set(todos.map(s=>s.risp?.nome).filter(Boolean))]);

    const _header = (titulo = '') => {
      doc.setFillColor(10, 22, 40);
      doc.rect(0, 0, W, 18, 'F');
      doc.setFontSize(13); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
      doc.text('GRAD Ecossistema — Base de Sites', 10, 8);
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(150,190,230);
      doc.text(`SESP-MT · CIOSP · Gerado em ${data} às ${hora}`, 10, 14);
      doc.text(`Total: ${todos.length} sites`, W-10, 14, { align:'right' });
      if (titulo) {
        doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(61,155,255);
        doc.text(titulo, 10, 26);
      }
    };

    // ── Página 1: Resumo ──
    _header();
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(30,80,150);
    doc.text('RESUMO GERAL', 10, 26);

    doc.autoTable({
      startY: 30,
      head: [['Indicador','Qtd']],
      body: [
        ['Total de Sites',     todos.length],
        ['Com fase definida',  todos.filter(s=>s.fase).length],
        ['Sem fase definida',  todos.filter(s=>!s.fase).length],
        ['SESP',               todos.filter(s=>Base._getProp(s)==='SESP').length],
        ['GEFRON',             todos.filter(s=>Base._getProp(s)==='GEFRON').length],
        ['PRF',                todos.filter(s=>Base._getProp(s)==='PRF').length],
        ['Com coordenadas',    todos.filter(s=>s.latitude!=null).length],
        ['Sem coordenadas',    todos.filter(s=>s.latitude==null).length],
      ],
      styles:     { fontSize:9, cellPadding:3 },
      headStyles: { fillColor:[30,80,150], textColor:255, fontStyle:'bold' },
      alternateRowStyles: { fillColor:[240,245,255] },
      tableWidth: 75, margin: { left:10 },
    });

    doc.autoTable({
      startY: 30,
      head: [['RISP','Sites','Com Fase','SESP','GEFRON','PRF']],
      body: rispsNomes.map(r => {
        const ss = todos.filter(s=>s.risp?.nome===r);
        return [
          r, ss.length, ss.filter(s=>s.fase).length,
          ss.filter(s=>Base._getProp(s)==='SESP').length,
          ss.filter(s=>Base._getProp(s)==='GEFRON').length,
          ss.filter(s=>Base._getProp(s)==='PRF').length,
        ];
      }),
      styles:     { fontSize:8, cellPadding:2.5, halign:'center' },
      headStyles: { fillColor:[30,80,150], textColor:255, fontStyle:'bold' },
      columnStyles: { 0:{ halign:'left' } },
      alternateRowStyles: { fillColor:[240,245,255] },
      tableWidth: 110, margin: { left:100 },
    });

    // ── Uma página por RISP ──
    rispsNomes.forEach(rNome => {
      const ss = todos.filter(s=>s.risp?.nome===rNome)
        .sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
      if (!ss.length) return;

      doc.addPage();
      _header(`${rNome} — ${ss.length} site(s)`);

      doc.autoTable({
        startY: 32,
        head: [['SBS','Nome','Município','Proprietário','Fase','Lat','Lon']],
        body: ss.map(s => [
          s.sbs||'—', s.nome||'—', s.cidade||'—',
          Base._getProp(s), s.fase||'—',
          s.latitude  ? parseFloat(s.latitude).toFixed(5)  : '—',
          s.longitude ? parseFloat(s.longitude).toFixed(5) : '—',
        ]),
        styles:     { fontSize:8, cellPadding:2.5 },
        headStyles: { fillColor:[30,80,150], textColor:255, fontStyle:'bold' },
        alternateRowStyles: { fillColor:[245,248,255] },
        columnStyles: {
          0:{ cellWidth:14, halign:'center' },
          3:{ cellWidth:22 },
          4:{ cellWidth:22 },
          5:{ cellWidth:22, halign:'center', font:'courier' },
          6:{ cellWidth:22, halign:'center', font:'courier' },
        },
        didParseCell(data) {
          if (data.section==='body' && data.column.index===4 && data.cell.raw && data.cell.raw!=='—') {
            data.cell.styles.textColor = [61,155,255];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left:10, right:10 },
      });
    });

    // Rodapé paginado
    const nPags = doc.internal.getNumberOfPages();
    for (let i = 1; i <= nPags; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text(`GRAD Ecossistema · SESP-MT · ${data}`, 10, doc.internal.pageSize.getHeight()-5);
      doc.text(`Página ${i} de ${nPags}`, W-10, doc.internal.pageSize.getHeight()-5, { align:'right' });
    }

    doc.save(`base_sites_${new Date().toISOString().slice(0,10)}.pdf`);
    Toast.show(`PDF gerado — ${todos.length} sites · ${rispsNomes.length} RISPs`, 'success');
  },
};
