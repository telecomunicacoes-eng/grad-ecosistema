// ═══════════════════════════════════════
// GRAD Ecossistema — BASE DE SITES
// Visualização + Relatório PDF e Excel
// ═══════════════════════════════════════

const Base = {
  _data:    [],
  _ocorrs:  [],
  _pagina:  1,
  _porPagina: 25,

  async render(container) {
    container.innerHTML = `
      <div class="page fade-in">
        <div class="page-header">
          <div>
            <div class="page-title">Base de Sites</div>
            <div class="page-sub">Cadastro completo de ERBs e sites monitorados</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost btn-sm" onclick="Base.exportarExcel()">↓ Excel</button>
            <button class="btn btn-ghost btn-sm" onclick="Base.exportarPDF()">↓ PDF</button>
            <button class="btn btn-ghost btn-sm" onclick="Base.refresh()">↻ Atualizar</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input class="form-input" id="bs-busca" placeholder="Buscar site, SBS, cidade..." oninput="Base._applyFilter()" style="width:220px">
          <select class="form-select" id="bs-risp" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Todas RISPs</option>
          </select>
          <select class="form-select" id="bs-sit" onchange="Base._applyFilter()" style="width:180px">
            <option value="">Todos os status</option>
            <option value="Operacional">✅ Operacional</option>
            <option value="Inoperante">🔴 Inoperante</option>
            <option value="Instável">🟡 Instável</option>
            <option value="Parcial/Em analise">🟡 Parcial/Em analise</option>
            <option value="Modo Local">🟣 Modo Local</option>
          </select>
          <select class="form-select" id="bs-prop" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Proprietário</option>
          </select>
          <select class="form-select" id="bs-tipo" onchange="Base._applyFilter()" style="width:150px">
            <option value="">Todos os tipos</option>
          </select>
        </div>

        <!-- KPIs rápidos -->
        <div id="bs-summary" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"></div>

        <!-- Tabela -->
        <div class="card" style="padding:0">
          <div id="bs-table" class="table-wrap" style="border:none"></div>
        </div>
        <div id="bs-pagination" class="pagination" style="margin-top:12px"></div>
      </div>`;

    await Base.load();
  },

  async refresh() {
    const main = document.getElementById('main-content');
    await Base.render(main);
  },

  async load() {
    try {
      const sites = await dbQuery(d =>
        d.from('sites').select('*, risp:risps(id,nome)').eq('ativo', true).order('nome')
      );
      const ocorrs = await dbQuery(d =>
        d.from('ocorrencias').select('site_id,situacao').neq('situacao', 'Operacional')
      );
      Base._data   = sites  || [];
      Base._ocorrs = ocorrs || [];
      await Base._popularFiltros();
      Base._applyFilter();
    } catch {
      const el = document.getElementById('bs-table');
      if (el) el.innerHTML = '<div class="empty-state"><div class="empty-state-title">Erro ao carregar base</div></div>';
    }
  },

  async _popularFiltros() {
    try {
      const risps = (await dbQuery(d => d.from('risps').select('id,nome')) || [])
        .sort((a,b) => (parseInt(a.nome.replace(/\D/g,''))||0) - (parseInt(b.nome.replace(/\D/g,''))||0));
      const sel = document.getElementById('bs-risp');
      if (sel && risps) risps.forEach(r => {
        const o = document.createElement('option');
        o.value = r.nome; o.textContent = r.nome; sel.appendChild(o);
      });
    } catch {}

    const props = [...new Set(Base._data.map(s => Base._getProp(s)).filter(Boolean))].sort();
    const selP  = document.getElementById('bs-prop');
    if (selP) props.forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p; selP.appendChild(o);
    });

    const tipos = [...new Set(Base._data.map(s => s.tipo).filter(Boolean))].sort();
    const selT  = document.getElementById('bs-tipo');
    if (selT) tipos.forEach(t => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t; selT.appendChild(o);
    });
  },

  // Lê proprietário — direto ou via JSON em observacoes
  _getProp(s) {
    if (s.proprietario) return s.proprietario;
    try {
      const obs = s.observacoes;
      if (obs && obs.trimStart().startsWith('{')) return JSON.parse(obs).proprietario || 'SESP';
    } catch {}
    return 'SESP';
  },

  _getSituacao(siteId) {
    const oc = Base._ocorrs.find(o => o.site_id === siteId);
    return oc ? oc.situacao : 'Operacional';
  },

  _sortRisps(arr) {
    return [...arr].sort((a,b) => (parseInt(a.replace(/\D/g,''))||99) - (parseInt(b.replace(/\D/g,''))||99));
  },

  _applyFilter() { Base._pagina = 1; Base._render(); },

  _filtrar() {
    const busca = (document.getElementById('bs-busca')?.value || '').toLowerCase();
    const risp  = document.getElementById('bs-risp')?.value  || '';
    const sit   = document.getElementById('bs-sit')?.value   || '';
    const prop  = document.getElementById('bs-prop')?.value  || '';
    const tipo  = document.getElementById('bs-tipo')?.value  || '';

    return Base._data.filter(s => {
      const situacao = Base._getSituacao(s.id);
      if (risp && s.risp?.nome !== risp)           return false;
      if (sit  && situacao !== sit)                 return false;
      if (prop && Base._getProp(s) !== prop)        return false;
      if (tipo && s.tipo !== tipo)                  return false;
      if (busca && !s.nome?.toLowerCase().includes(busca) &&
                   !s.cidade?.toLowerCase().includes(busca) &&
                   !String(s.sbs||'').includes(busca)) return false;
      return true;
    });
  },

  _render() {
    const filtrados = Base._filtrar();
    const total     = filtrados.length;
    const inicio    = (Base._pagina - 1) * Base._porPagina;
    const pagina    = filtrados.slice(inicio, inicio + Base._porPagina);

    const op   = filtrados.filter(s => Base._getSituacao(s.id) === 'Operacional').length;
    const inop = filtrados.filter(s => Base._getSituacao(s.id) === 'Inoperante').length;
    const sumEl = document.getElementById('bs-summary');
    if (sumEl) sumEl.innerHTML = `
      <span class="badge badge-blue">${total} sites</span>
      <span class="badge badge-green">${op} operacionais</span>
      <span class="badge badge-red">${inop} inoperantes</span>
      <span class="badge badge-amber">${filtrados.filter(s=>Base._getSituacao(s.id)==='Parcial/Em analise').length} parcial</span>
      <span class="badge badge-purple">${filtrados.filter(s=>Base._getSituacao(s.id)==='Modo Local').length} modo local</span>`;

    const sitCor = {
      'Operacional':        { badge:'badge-green'  },
      'Inoperante':         { badge:'badge-red'    },
      'Instável':           { badge:'badge-teal'   },
      'Parcial/Em analise': { badge:'badge-amber'  },
      'Modo Local':         { badge:'badge-purple' },
    };

    const rows = pagina.map(s => {
      const sit = Base._getSituacao(s.id);
      const cls = sitCor[sit] || { badge:'badge-gray' };
      const prop = Base._getProp(s);
      return `
        <tr onclick="Base.verSite('${s.id}')" style="cursor:pointer">
          <td><span class="risp-badge">${s.risp?.nome||'—'}</span></td>
          <td style="font-family:var(--mono);font-size:11px;color:var(--text3)">${s.sbs||'—'}</td>
          <td><strong style="color:var(--text)">${s.nome||'—'}</strong></td>
          <td style="color:var(--text2);font-size:12px">${s.cidade||'—'}</td>
          <td style="font-size:12px;color:var(--text3)">${prop}</td>
          <td><span class="badge ${cls.badge}">${sit}</span></td>
          <td style="font-size:11px;color:var(--text3)">${s.latitude!=null?`${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}`:'—'}</td>
        </tr>`;
    }).join('');

    const tableEl = document.getElementById('bs-table');
    if (tableEl) {
      tableEl.innerHTML = total ? `
        <table>
          <thead><tr>
            <th>RISP</th><th>SBS</th><th>Nome</th><th>Município</th>
            <th>Proprietário</th><th>Status</th><th>Coords</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>` :
        '<div class="empty-state"><div class="empty-state-icon">📡</div><div class="empty-state-title">Nenhum site encontrado</div></div>';
    }

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
    Base._pagina = n;
    Base._render();
  },

  verSite(id) {
    const s   = Base._data.find(x => x.id === id);
    if (!s) return;
    const sit  = Base._getSituacao(id);
    const prop = Base._getProp(s);
    const sitCor = {
      'Operacional':'badge-green','Inoperante':'badge-red',
      'Instável':'badge-teal','Parcial/Em analise':'badge-amber','Modo Local':'badge-purple',
    };
    Modal.open(`Site — ${s.nome}`, `
      <div style="display:grid;gap:12px">
        <div><span class="badge ${sitCor[sit]||'badge-gray'}">${sit}</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="form-label">RISP</label><div>${s.risp?.nome||'—'}</div></div>
          <div><label class="form-label">SBS</label><div style="font-family:var(--mono)">${s.sbs||'—'}</div></div>
          <div><label class="form-label">Município</label><div>${s.cidade||'—'}</div></div>
          <div><label class="form-label">Proprietário</label><div>${prop}</div></div>
          <div><label class="form-label">Tipo</label><div>${s.tipo||'—'}</div></div>
          <div><label class="form-label">Latitude</label><div style="font-family:var(--mono);font-size:12px">${s.latitude||'—'}</div></div>
          <div><label class="form-label">Longitude</label><div style="font-family:var(--mono);font-size:12px">${s.longitude||'—'}</div></div>
        </div>
        ${s.observacoes&&!s.observacoes.trimStart().startsWith('{') ? `<div><label class="form-label">Observações</label><div style="color:var(--text2);font-size:13px">${s.observacoes}</div></div>` : ''}
      </div>`,
      [{ label:'Fechar', class:'btn-ghost', onclick:'Modal.close()' }]
    );
  },

  // ══════════════════════════════════════════════════════════
  // EXCEL
  // ══════════════════════════════════════════════════════════
  exportarExcel() {
    const todos = Base._data;
    if (!todos.length) { Toast.show('Sem dados para exportar', 'error'); return; }

    const wb = XLSX.utils.book_new();
    const data = new Date().toLocaleDateString('pt-BR');

    // ── Aba Resumo ──
    const rispsNomes = Base._sortRisps([...new Set(todos.map(s => s.risp?.nome).filter(Boolean))]);
    const resumoRows = [
      ['GRAD Ecossistema — Relatório de Base de Sites'],
      [`Gerado em: ${data}`],
      [],
      ['RESUMO GERAL'],
      ['Total de Sites', todos.length],
      ['SESP',   todos.filter(s=>Base._getProp(s)==='SESP').length],
      ['GEFRON', todos.filter(s=>Base._getProp(s)==='GEFRON').length],
      ['PRF',    todos.filter(s=>Base._getProp(s)==='PRF').length],
      ['Com coordenadas',    todos.filter(s=>s.latitude!=null).length],
      ['Sem coordenadas',    todos.filter(s=>s.latitude==null).length],
      [],
      ['SITES POR RISP'],
      ['RISP', 'Total'],
      ...rispsNomes.map(r => [r, todos.filter(s=>s.risp?.nome===r).length]),
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);
    wsResumo['!cols'] = [{wch:30},{wch:12}];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // ── Aba Todos os Sites ──
    const header = ['RISP','SBS','Nome','Município','Proprietário','Status','Latitude','Longitude'];
    const linhas = todos
      .sort((a,b) => {
        const ra = parseInt((a.risp?.nome||'').replace(/\D/g,''))||99;
        const rb = parseInt((b.risp?.nome||'').replace(/\D/g,''))||99;
        return ra !== rb ? ra - rb : (a.nome||'').localeCompare(b.nome||'');
      })
      .map(s => [
        s.risp?.nome||'',
        s.sbs||'',
        s.nome||'',
        s.cidade||'',
        Base._getProp(s),
        Base._getSituacao(s.id),
        s.latitude||'',
        s.longitude||''
      ]);
    const wsTodos = XLSX.utils.aoa_to_sheet([header, ...linhas]);
    wsTodos['!cols'] = [{wch:10},{wch:8},{wch:35},{wch:22},{wch:12},{wch:20},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, wsTodos, 'Todos os Sites');

    // ── Uma aba por RISP ──
    rispsNomes.forEach(rNome => {
      const sitesRisp = todos.filter(s=>s.risp?.nome===rNome)
        .sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
      const rows = sitesRisp.map(s=>[
        s.sbs||'', s.nome||'', s.cidade||'',
        Base._getProp(s), Base._getSituacao(s.id),
        s.latitude||'', s.longitude||''
      ]);
      const ws = XLSX.utils.aoa_to_sheet([['SBS','Nome','Município','Proprietário','Status','Latitude','Longitude'], ...rows]);
      ws['!cols'] = [{wch:8},{wch:35},{wch:22},{wch:12},{wch:20},{wch:12},{wch:12}];
      const nomAba = rNome.replace(/\s/g,'_').slice(0,31);
      XLSX.utils.book_append_sheet(wb, ws, nomAba);
    });

    XLSX.writeFile(wb, `base_sites_${new Date().toISOString().slice(0,10)}.xlsx`);
    Toast.show(`Excel gerado — ${todos.length} sites`, 'success');
  },

  // ══════════════════════════════════════════════════════════
  // PDF
  // ══════════════════════════════════════════════════════════
  async exportarPDF() {
    Toast.show('Gerando PDF...', 'info');

    // Carregar jsPDF + autotable sob demanda
    if (typeof jspdf === 'undefined') {
      await new Promise((res,rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    if (!jspdf?.jsPDF?.prototype?.autoTable) {
      await new Promise((res,rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }

    const { jsPDF } = jspdf;
    const doc  = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    const W    = doc.internal.pageSize.getWidth();
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    const todos = Base._data;

    const rispsNomes = Base._sortRisps([...new Set(todos.map(s=>s.risp?.nome).filter(Boolean))]);

    // ── Cabeçalho ──────────────────────────────────────────
    const _header = () => {
      doc.setFillColor(10, 22, 40);
      doc.rect(0, 0, W, 18, 'F');
      doc.setFontSize(13); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
      doc.text('GRAD Ecossistema — Relatório de Base de Sites', 10, 8);
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(150,190,230);
      doc.text(`SESP-MT · CIOSP · Gerado em ${data} às ${hora}`, 10, 14);
      doc.text(`Total: ${todos.length} sites`, W-10, 14, { align:'right' });
    };

    // ── Página 1: Resumo ────────────────────────────────────
    _header();

    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(30,80,150);
    doc.text('RESUMO GERAL', 10, 26);

    doc.autoTable({
      startY: 30,
      head: [['Indicador','Quantidade']],
      body: [
        ['Total de Sites',        todos.length],
        ['SESP',                  todos.filter(s=>Base._getProp(s)==='SESP').length],
        ['GEFRON',                todos.filter(s=>Base._getProp(s)==='GEFRON').length],
        ['PRF',                   todos.filter(s=>Base._getProp(s)==='PRF').length],
        ['Com coordenadas',       todos.filter(s=>s.latitude!=null).length],
        ['Sem coordenadas',       todos.filter(s=>s.latitude==null).length],
        ['Operacionais',          todos.filter(s=>Base._getSituacao(s.id)==='Operacional').length],
        ['Inoperantes',           todos.filter(s=>Base._getSituacao(s.id)==='Inoperante').length],
        ['Parcial/Análise',       todos.filter(s=>['Parcial/Em analise','Instável'].includes(Base._getSituacao(s.id))).length],
        ['Modo Local',            todos.filter(s=>Base._getSituacao(s.id)==='Modo Local').length],
      ],
      styles:     { fontSize:9, cellPadding:3 },
      headStyles: { fillColor:[30,80,150], textColor:255, fontStyle:'bold' },
      alternateRowStyles: { fillColor:[240,245,255] },
      tableWidth: 80,
      margin: { left:10 },
    });

    // Tabela resumo por RISP (ao lado)
    doc.autoTable({
      startY: 30,
      head: [['RISP','Sites','SESP','GEFRON','PRF']],
      body: rispsNomes.map(r => {
        const ss = todos.filter(s=>s.risp?.nome===r);
        return [
          r, ss.length,
          ss.filter(s=>Base._getProp(s)==='SESP').length,
          ss.filter(s=>Base._getProp(s)==='GEFRON').length,
          ss.filter(s=>Base._getProp(s)==='PRF').length,
        ];
      }),
      styles:     { fontSize:8, cellPadding:2.5, halign:'center' },
      headStyles: { fillColor:[30,80,150], textColor:255, fontStyle:'bold' },
      columnStyles: { 0:{ halign:'left' } },
      alternateRowStyles: { fillColor:[240,245,255] },
      tableWidth: 100,
      margin: { left: 105 },
    });

    // ── Páginas por RISP ────────────────────────────────────
    const sitCor = {
      'Operacional':        [34,197,94],
      'Inoperante':         [239,68,68],
      'Instável':           [20,184,166],
      'Parcial/Em analise': [251,191,36],
      'Modo Local':         [167,139,250],
    };

    rispsNomes.forEach(rNome => {
      const sitesRisp = todos
        .filter(s=>s.risp?.nome===rNome)
        .sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
      if (!sitesRisp.length) return;

      doc.addPage();
      _header();

      doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(30,80,150);
      doc.text(`${rNome} — ${sitesRisp.length} site(s)`, 10, 26);

      doc.autoTable({
        startY: 30,
        head: [['SBS','Nome','Município','Proprietário','Status','Lat','Lon']],
        body: sitesRisp.map(s => {
          const sit = Base._getSituacao(s.id);
          return [
            s.sbs||'—',
            s.nome||'—',
            s.cidade||'—',
            Base._getProp(s),
            sit,
            s.latitude  ? parseFloat(s.latitude).toFixed(5)  : '—',
            s.longitude ? parseFloat(s.longitude).toFixed(5) : '—',
          ];
        }),
        styles:     { fontSize:8, cellPadding:2.5 },
        headStyles: { fillColor:[30,80,150], textColor:255, fontStyle:'bold' },
        alternateRowStyles: { fillColor:[245,248,255] },
        columnStyles: {
          0:{ cellWidth:14, halign:'center' },
          4:{ cellWidth:32 },
          5:{ cellWidth:20, halign:'center', font:'courier' },
          6:{ cellWidth:20, halign:'center', font:'courier' },
        },
        didDrawCell(data) {
          // Colorir coluna Status
          if (data.section==='body' && data.column.index===4) {
            const sit = data.cell.raw;
            const cor = sitCor[sit];
            if (cor) {
              doc.setTextColor(...cor);
              doc.setFont('helvetica','bold');
              doc.text(sit, data.cell.x+data.cell.width/2, data.cell.y+data.cell.height/2+1, { align:'center' });
              doc.setTextColor(0);
              doc.setFont('helvetica','normal');
            }
          }
        },
        margin: { left:10, right:10 },
      });
    });

    // Rodapé em todas as páginas
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text(`GRAD Ecossistema · SESP-MT · ${data}`, 10, doc.internal.pageSize.getHeight()-5);
      doc.text(`Página ${i} de ${total}`, W-10, doc.internal.pageSize.getHeight()-5, { align:'right' });
    }

    doc.save(`relatorio_sites_${new Date().toISOString().slice(0,10)}.pdf`);
    Toast.show(`PDF gerado — ${todos.length} sites · ${rispsNomes.length} RISPs`, 'success');
  },
};
