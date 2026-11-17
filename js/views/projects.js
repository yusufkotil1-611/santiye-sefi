/* Proje Takip — çoklu şantiye yönetimi */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;

  SS.css(`
  .pcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
  .pcard{padding:18px;display:flex;flex-direction:column;gap:14px;cursor:pointer;position:relative}
  .pcard h3{font-size:17px;letter-spacing:-.015em;line-height:1.25}
  .pcard .loc{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13.5px}.pcard .loc .ic{width:15px;height:15px}
  .pcard.on{border-color:var(--brand);box-shadow:0 0 0 2px color-mix(in srgb,var(--brand) 25%,transparent),var(--shadow)}
  .pstats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pstats small{display:block;color:var(--muted);font-size:12px}.pstats b{font-size:14.5px;font-variant-numeric:tabular-nums}
  .pbar-t{position:relative}.pmark{position:absolute;top:-4px;bottom:-4px;width:3px;background:var(--ink);border-radius:2px;opacity:.75}
  .pbar-l{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}.pbar-l b{font-variant-numeric:tabular-nums}
  .back{display:inline-flex;align-items:center;gap:4px;color:var(--muted);font-weight:650;font-size:14px;width:fit-content}.back:hover{color:var(--brand)}.back .ic{transform:rotate(180deg);width:16px;height:16px}
  .ph{display:flex;gap:22px;align-items:center;padding:22px;flex-wrap:wrap}.ph-t{flex:1;min-width:240px}.ph-t h2{font-size:22px;letter-spacing:-.02em;margin:8px 0 6px;line-height:1.25}
  .ph-meta{display:flex;gap:16px;flex-wrap:wrap;color:var(--muted);font-size:13.5px}.ph-meta span{display:inline-flex;align-items:center;gap:6px}.ph-meta .ic{width:15px;height:15px}
  .budrow{display:grid;grid-template-columns:130px 1fr auto;gap:12px;align-items:center;padding:7px 0;font-size:13.5px}.budrow .bar{height:10px}.budrow b{font-variant-numeric:tabular-nums;font-size:13px}.budrow .over i{background:var(--bad)}
  .blk{padding:18px}.blk-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.blk-h h3{font-size:16px}
  .frow{display:grid;grid-template-columns:96px 1fr 52px;gap:12px;align-items:center;padding:9px 0;border-top:1px solid var(--line-2)}
  .frow:first-of-type{border-top:0}.frow span{font-weight:600;font-size:14px}.frow b{text-align:right;font-variant-numeric:tabular-nums}
  .frow input[type=range]{width:100%;accent-color:var(--brand);height:28px;margin:0}
  .star{color:var(--warn);display:inline-flex;vertical-align:middle}.star .ic{width:15px;height:15px;fill:currentColor}
  @media(max-width:699px){.pcards{grid-template-columns:1fr}.budrow{grid-template-columns:1fr auto}.budrow .bar{grid-column:1/-1;order:3}.ph{padding:16px}}
  `);

  const ST = { active: ['Aktif', 'ok'], planned: ['Planlanan', 'info'], done: ['Tamamlandı', 'muted'] };
  const income = (pid) => U.sum(SS.D.units.filter((u) => u.projectId === pid), (u) => U.sum((u.plan || []).filter((p) => p.paid), (p) => p.amount)) + U.sum(SS.D.hakedis.filter((h) => h.projectId === pid && (SS.D.contracts.find((c) => c.id === h.contractId) || {}).dir === 'gelir'), (h) => h.paidAmount || 0);

  function pbar(pg, pl) {
    return `<div class="pbar"><div class="pbar-l"><span>Fiziksel ilerleme</span><b>%${U.num(pg, 1)}</b></div><div class="pbar-t">${ui.bar(pg, 'brand', 'lg')}${pl != null ? `<span class="pmark" style="left:calc(${pl}% - 1px)" data-tip="Planlanan: %${U.num(pl)}"></span>` : ''}</div></div>`;
  }

  /* ---------------- liste ---------------- */
  function listBody() {
    const st = ui.vs('projects', { q: '', status: '' });
    const rows = SS.D.projects.filter((p) => (!st.status || p.status === st.status) && U.match(st.q, p.name, p.location, p.owner));
    if (!rows.length) return ui.empty('building', 'Şantiye bulunamadı', 'Yeni bir şantiye ekleyerek başlayın.', `<button class="btn primary" data-action="proj.new">${I('plus')}Şantiye Ekle</button>`);
    return `<div class="pcards">${rows.map((p) => {
      const pg = C.progress(p), pl = C.planned(p), sp = C.spent(p.id), s = ST[p.status];
      return `<article class="card pcard link ${C.active() === p.id ? 'on' : ''}" data-action="go" data-to="projects/${p.id}" tabindex="0">
        <div class="row between"><span class="badge ${s[1]}">${s[0]}</span>${C.active() === p.id ? `<span class="badge brand">${I('check')}Seçili şantiye</span>` : ''}</div>
        <div><h3>${esc(p.name)}</h3><div class="loc">${I('pin')}${esc(p.location)}</div></div>
        ${pbar(pg, p.status === 'active' ? pl : null)}
        <div class="pstats"><div><small>Bütçe</small><b>${U.compact(p.totalBudget)}</b></div><div><small>Harcanan</small><b>${U.compact(sp)}</b></div><div><small>Bitiş</small><b>${U.fmtDate(p.end).slice(0, 5)}.${p.end.slice(2, 4)}</b></div></div>
        <div class="row"><button class="btn sm ${C.active() === p.id ? 'soft' : ''}" data-action="proj.select" data-id="${p.id}">${I('eye')}${C.active() === p.id ? 'Seçili' : 'Bu şantiyeyi seç'}</button><button class="btn sm ghost" data-action="proj.edit" data-id="${p.id}">${I('edit')}Düzenle</button></div></article>`;
    }).join('')}</div>`;
  }
  function list() {
    const cnt = (s) => SS.D.projects.filter((p) => p.status === s).length;
    return `<div class="page">${ui.head({ title: 'Projeler', sub: `${SS.D.projects.length} şantiye · ${cnt('active')} aktif, ${cnt('planned')} planlanan, ${cnt('done')} tamamlanan`, actions: `<button class="btn primary" data-action="proj.new">${I('plus')}Şantiye Ekle</button>` })}
      ${ui.toolbar({ view: 'projects', ph: 'Şantiye, konum veya işveren ara…', upd: 'projects-body', filters: [{ k: 'status', label: 'Durum', opts: [['', 'Tümü'], ['active', 'Aktif'], ['planned', 'Planlanan'], ['done', 'Tamamlanan']] }] })}
      ${ui.region('projects-body', listBody)}</div>`;
  }

  /* ---------------- detay ---------------- */
  function taskTable(p) {
    const tasks = SS.D.tasks.filter((t) => t.projectId === p.id).sort((a, b) => a.end.localeCompare(b.end));
    const stTone = { Tamam: 'ok', Devam: 'info', Gecikti: 'bad', Bekliyor: 'muted' };
    const tb = ui.table({ cols: [
      { h: 'İş kalemi', c: (t) => `<div class="t-main">${t.critical ? `<span class="star" data-tip="Kritik iş kalemi">${I('flag')}</span> ` : ''}${esc(t.name)}</div><div class="t-sub">${esc(t.assignee || '—')}</div>` },
      { h: 'Tarih aralığı', c: (t) => `${U.fmtDate(t.start).slice(0, 5)} → ${U.fmtDate(t.end).slice(0, 5)}<div class="t-sub">${C.taskStatus(t) === 'Gecikti' ? `${-U.diff(U.today(), t.end)} gün gecikti` : t.progress >= 100 ? 'tamamlandı' : U.diff(U.today(), t.end) >= 0 ? `${U.diff(U.today(), t.end)} gün kaldı` : ''}</div>` },
      { h: 'İlerleme', c: (t) => `<div class="row" style="gap:10px;min-width:130px">${ui.bar(t.progress, t.progress >= 100 ? 'ok' : C.taskStatus(t) === 'Gecikti' ? 'bad' : 'brand')}<b>%${t.progress}</b></div>` },
      { h: 'Durum', c: (t) => ui.badge(C.taskStatus(t), stTone[C.taskStatus(t)]) },
      { h: '', act: true, c: (t) => `<button class="btn sm ghost" data-action="task.edit" data-id="${t.id}">${I('edit')}Düzenle</button>` },
    ], rows: tasks, empty: 'Henüz iş kalemi yok' });
    return `<div class="card">${`<div class="card-h"><h3>Kritik İş Kalemleri</h3><button class="btn sm primary" data-action="task.new" data-pid="${p.id}">${I('plus')}İş kalemi</button></div><div class="card-b" style="padding-left:0;padding-right:0">${tb}</div>`}</div>`;
  }
  function blocksView(p) {
    if (!(p.blocks || []).length) return `<div class="card pad">${ui.empty('building', 'Blok / kat tanımı yok', 'İlerlemeyi blok ve kat bazında izlemek için blok ekleyin.', `<button class="btn primary" data-action="blk.new" data-pid="${p.id}">${I('plus')}Blok Ekle</button>`)}</div>`;
    return `<div class="grid g-2">${p.blocks.map((b) => `<div class="card blk"><div class="blk-h"><div><h3>${esc(b.name)}</h3><span class="sub">%${U.num(C.blockProgress(b), 1)} tamamlandı</span></div><div class="row"><button class="btn sm ghost" data-action="blk.floor" data-pid="${p.id}" data-bid="${b.id}">${I('plus')}Kat</button><button class="btn sm danger-ghost" data-action="blk.del" data-pid="${p.id}" data-bid="${b.id}" aria-label="Bloğu sil">${I('trash')}</button></div></div>
      ${ui.bar(C.blockProgress(b), 'brand', 'lg')}<div style="margin-top:10px">${b.floors.map((f, i) => `<div class="frow"><span>${esc(f.name)}</span><input type="range" min="0" max="100" step="5" value="${f.progress}" data-floor="${p.id}|${b.id}|${i}" aria-label="${esc(f.name)} ilerleme"><b>%${f.progress}</b></div>`).join('')}</div></div>`).join('')}
      <button class="card pad link" data-action="blk.new" data-pid="${p.id}" style="display:grid;place-items:center;min-height:120px;color:var(--muted);font-weight:650;border-style:dashed">${I('plus')} Blok ekle</button></div>`;
  }
  function overview(p) {
    const pg = C.progress(p), pl = C.planned(p), sp = C.spent(p.id), inc = income(p.id), tot = C.catTotals('', '', p.id), s = ST[p.status];
    const recent = SS.D.expenses.filter((e) => e.projectId === p.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    return `<div class="grid g-4 kpis">${ui.kpi({ label: 'Toplam bütçe', value: p.totalBudget, fmt: 'compact', icon: 'wallet', tone: 'info' })}${ui.kpi({ label: 'Harcanan', value: sp, fmt: 'compact', icon: 'receipt', tone: 'brand', sub: `bütçenin %${U.num((sp / (p.totalBudget || 1)) * 100)}'i` })}${ui.kpi({ label: 'Tahsilat / gelir', value: inc, fmt: 'compact', icon: 'trend', tone: 'ok', sub: 'satış taksiti + hakediş' })}${ui.kpi({ label: 'Kalan bütçe', value: p.totalBudget - sp, fmt: 'compact', icon: 'percent', tone: p.totalBudget - sp < 0 ? 'bad' : 'warn', sub: `${Math.max(0, U.diff(U.today(), p.end))} gün kaldı` })}</div>
    <div class="grid g-21"><div class="card"><div class="card-h"><h3>Bütçe — Gerçekleşen</h3></div><div class="card-b">${SS.C.cats.map((c) => { const b = (p.budget || {})[c] || 0, v = tot[c] || 0, r = b ? (v / b) * 100 : 0; return `<div class="budrow ${r > 100 ? 'over' : ''}"><span>${c}</span>${ui.bar(r, r > 100 ? 'bad' : 'brand')}<b>${U.compact(v)} <span class="muted">/ ${U.compact(b)}</span></b></div>`; }).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Son Harcamalar</h3><a class="btn sm ghost" href="#/expenses">Tümü</a></div><div class="card-b">${recent.length ? `<ul class="alist">${recent.map((e) => `<li><div class="a-t" style="padding:6px 8px"><b>${esc(e.desc)}</b><small>${U.fmtDate(e.date)} · ${esc(ui.firmName(e.firmId))}</small></div><b style="padding-right:8px;font-variant-numeric:tabular-nums">${U.compact(e.amount)}</b></li>`).join('')}</ul>` : '<p class="muted">Kayıt yok</p>'}</div></div></div>`;
  }
  function detail(id) {
    const p = C.proj(id); if (!p) return `<div class="page">${ui.empty('building', 'Şantiye bulunamadı', '', '<a class="btn" href="#/projects">Projelere dön</a>')}</div>`;
    const st = ui.vs('projdetail', { tab: 'genel' }), pg = C.progress(p), pl = C.planned(p), s = ST[p.status];
    const nT = SS.D.tasks.filter((t) => t.projectId === id && t.progress < 100).length;
    return `<div class="page"><a class="back" href="#/projects">${I('chevR')} Projeler</a>
      <div class="card ph"><div class="ph-t"><span class="badge ${s[1]}">${s[0]}</span><h2>${esc(p.name)}</h2><div class="ph-meta"><span>${I('pin')}${esc(p.location)}</span><span>${I('calendar')}${U.fmtDate(p.start)} → ${U.fmtDate(p.end)}</span><span>${I('building')}${U.num(p.area)} m²</span><span>${I('user')}${esc(p.owner || '—')}</span></div>
        <div class="row wrap" style="margin-top:14px"><button class="btn ${C.active() === id ? 'soft' : 'primary'}" data-action="proj.select" data-id="${id}">${I('eye')}${C.active() === id ? 'Seçili şantiye' : 'Bu şantiyeyi seç'}</button><button class="btn" data-action="proj.edit" data-id="${id}">${I('edit')}Düzenle</button></div></div>
        ${G.ring(pg, { size: 128, stroke: 13, sub: `plan %${U.num(pl)}` })}</div>
      ${ui.tabs('projdetail', 'tab', [['genel', 'Genel Bakış'], ['bloklar', 'Blok & Kat İlerlemesi'], ['isler', 'İş Kalemleri', nT]], st.tab)}
      ${st.tab === 'genel' ? overview(p) : st.tab === 'bloklar' ? blocksView(p) : taskTable(p)}</div>`;
  }

  SS.views.projects = { title: (id) => (id ? (C.proj(id) || {}).shortName || 'Proje' : 'Projeler'), render: (id) => (id ? detail(id) : list()) };

  /* ---------------- formlar ---------------- */
  function projForm(p) {
    const e = !!p, b = (p && p.budget) || {};
    const fields = [
      { name: 'name', label: 'Proje adı', required: true, placeholder: 'ör. Sakarya Vadi Konutları – 3 Blok 48 Daire' }, { name: 'shortName', label: 'Kısa ad', half: true, placeholder: 'Menülerde görünür' },
      { name: 'status', label: 'Durum', type: 'select', options: Object.entries(ST).map(([k, v]) => [k, v[0]]), required: true },
      { name: 'location', label: 'Konum', half: true, placeholder: 'İlçe / İl' }, { name: 'area', label: 'İnşaat alanı (m²)', type: 'number', min: 0 },
      { name: 'start', label: 'Başlangıç', type: 'date', required: true }, { name: 'end', label: 'Planlanan bitiş', type: 'date', required: true },
      { name: 'owner', label: 'İşveren / sahip', half: true }, { name: 'totalBudget', label: 'Toplam bütçe (₺)', type: 'money', required: true, min: 0, hint: 'Kategori bütçeleri aşağıda' },
      { type: 'html', html: '<div class="section-t" style="margin:6px 0 0">Kategori bütçeleri (₺)</div>' },
      ...SS.C.cats.map((c, i) => ({ name: 'b' + i, label: c, type: 'money', min: 0 })),
    ];
    const values = e ? Object.assign({}, p, Object.fromEntries(SS.C.cats.map((c, i) => ['b' + i, b[c]]))) : { status: 'planned', start: U.today(), end: U.addDays(U.today(), 365), location: '' };
    ui.form({
      title: e ? 'Şantiyeyi Düzenle' : 'Yeni Şantiye', fields, values, wide: true,
      validate: (v) => (v.end < v.start ? 'Bitiş tarihi başlangıçtan önce olamaz' : ''),
      danger: e ? { label: 'Şantiyeyi sil', onClick: async (api) => { if (await ui.confirm({ title: 'Şantiye silinsin mi?', text: `<b>${esc(p.name)}</b> ve bağlı tüm harcama, sözleşme, hakediş, stok, satış ve defter kayıtları kalıcı olarak silinir.` })) { SS.store.COLLS.forEach((k) => { SS.D[k] = SS.D[k].filter((x) => x.projectId !== p.id && x.id !== p.id); }); if (SS.cfg.activeProject === p.id) SS.cfg.activeProject = 'all'; SS.store.save(); api.close(); ui.fillProjSel(); ui.go('projects'); ui.toast('Şantiye silindi', 'info'); } } } : null,
      onSubmit(v) {
        const budget = Object.fromEntries(SS.C.cats.map((c, i) => [c, v['b' + i] || 0]));
        const data = { name: v.name, shortName: v.shortName || v.name.split(/[–-]/)[0].trim(), status: v.status, location: v.location, area: v.area || 0, start: v.start, end: v.end, owner: v.owner, totalBudget: v.totalBudget, budget };
        if (e) SS.store.upd('projects', p.id, data); else { const n = SS.store.add('projects', Object.assign(data, { blocks: [], progress: 0 }), 'p'); SS.cfg.activeProject = n.id; }
        ui.fillProjSel(); ui.rerender(); ui.toast(e ? 'Şantiye güncellendi' : 'Şantiye eklendi');
      },
    });
  }
  SS.actions['proj.new'] = () => projForm(null);
  SS.actions['proj.edit'] = (el) => projForm(C.proj(el.dataset.id));
  SS.actions['proj.select'] = (el) => { SS.cfg.activeProject = SS.cfg.activeProject === el.dataset.id ? 'all' : el.dataset.id; SS.store.save(); ui.fillProjSel(); ui.rerender(); ui.toast(SS.cfg.activeProject === 'all' ? 'Tüm şantiyeler gösteriliyor' : 'Şantiye seçildi: ' + esc(ui.projectName(SS.cfg.activeProject)), 'info'); };

  function taskForm(t, pid) {
    ui.form({
      title: t ? 'İş Kalemini Düzenle' : 'Yeni İş Kalemi', values: t || { start: U.today(), end: U.addDays(U.today(), 30), progress: 0, critical: false },
      fields: [{ name: 'name', label: 'İş kalemi', required: true }, { name: 'assignee', label: 'Sorumlu / taşeron', half: true }, { name: 'critical', type: 'check', label: 'Kritik', text: 'Kritik iş kalemi (kritik yol)' },
        { name: 'start', label: 'Başlangıç', type: 'date', required: true }, { name: 'end', label: 'Bitiş', type: 'date', required: true }, { name: 'progress', label: 'İlerleme', type: 'range', suffix: '%', step: 5 }],
      validate: (v) => (v.end < v.start ? 'Bitiş tarihi başlangıçtan önce olamaz' : ''),
      danger: t ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'İş kalemi silinsin mi?', text: esc(t.name) })) { SS.store.del('tasks', t.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) { const d = { name: v.name, assignee: v.assignee, critical: v.critical, start: v.start, end: v.end, progress: v.progress || 0 }; if (t) SS.store.upd('tasks', t.id, d); else SS.store.add('tasks', Object.assign(d, { projectId: pid }), 't'); ui.rerender(); ui.toast('İş kalemi kaydedildi'); },
    });
  }
  SS.actions['task.new'] = (el) => taskForm(null, el.dataset.pid);
  SS.actions['task.edit'] = (el) => taskForm(SS.store.find('tasks', el.dataset.id));

  SS.actions['blk.new'] = (el) => {
    ui.form({ title: 'Blok Ekle', fields: [{ name: 'name', label: 'Blok adı', required: true, placeholder: 'ör. D Blok' }, { name: 'floors', label: 'Kat / aşama adları', type: 'textarea', value: 'Temel\n1. Kat\n2. Kat\n3. Kat\n4. Kat\nÇatı & Cephe', hint: 'Her satıra bir kat veya aşama yazın' }],
      onSubmit(v) { const p = C.proj(el.dataset.pid); p.blocks.push({ id: U.id('b'), name: v.name, floors: v.floors.split('\n').map((s) => s.trim()).filter(Boolean).map((n) => ({ name: n, progress: 0 })) }); SS.store.save(); ui.rerender(); ui.toast('Blok eklendi'); } });
  };
  SS.actions['blk.floor'] = (el) => {
    ui.form({ title: 'Kat / Aşama Ekle', fields: [{ name: 'name', label: 'Ad', required: true, placeholder: 'ör. 5. Kat' }], onSubmit(v) { C.proj(el.dataset.pid).blocks.find((b) => b.id === el.dataset.bid).floors.push({ name: v.name, progress: 0 }); SS.store.save(); ui.rerender(); } });
  };
  SS.actions['blk.del'] = async (el) => { if (await ui.confirm({ title: 'Blok silinsin mi?', text: 'Bloğun kat ilerleme kayıtları silinir.' })) { const p = C.proj(el.dataset.pid); p.blocks = p.blocks.filter((b) => b.id !== el.dataset.bid); SS.store.save(); ui.rerender(); } };
  document.addEventListener('change', (e) => {
    const r = e.target.closest('[data-floor]'); if (!r) return; const [pid, bid, i] = r.dataset.floor.split('|');
    C.proj(pid).blocks.find((b) => b.id === bid).floors[+i].progress = +r.value; SS.store.save(); ui.rerender(); SS.sound.ok();
  });
  document.addEventListener('input', (e) => { const r = e.target.closest('[data-floor]'); if (r) r.parentElement.querySelector('b').textContent = '%' + r.value; });
})();
