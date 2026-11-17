/* Harcama & Ödeme Yönetimi + Firmalar (cari) */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;

  SS.css(`
  .cat-dot{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;white-space:nowrap}.cat-dot i{width:10px;height:10px;border-radius:3px;flex:none}
  .rcp{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--info-soft);color:var(--info-text);border:0;cursor:pointer;vertical-align:middle}.rcp .ic{width:16px;height:16px}
  .firm-av{display:flex;gap:12px;align-items:center}.firm-av .av{width:38px;height:38px}
  .fsum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.fsum>div{background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:10px 12px}.fsum small{display:block;color:var(--muted);font-size:12px}.fsum b{font-size:16px;font-variant-numeric:tabular-nums}
  `);

  const stTone = { Ödendi: 'ok', Vadeli: 'warn', Gecikmiş: 'bad' };

  function filtered() {
    const st = ui.vs('expenses', { tab: 'list', q: '', cat: '', status: '', from: '', to: '' });
    return C.expenses({ from: st.from, to: st.to, cat: st.cat, status: st.status })
      .filter((e) => U.match(st.q, e.desc, ui.firmName(e.firmId), e.category, ui.projectName(e.projectId)))
      .sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);
  }

  function listBody() {
    const rows = filtered(), all = C.active() === 'all', today = U.today();
    const paid = U.sum(rows.filter((e) => e.status === 'Ödendi'), (e) => e.amount);
    const pend = U.sum(rows.filter((e) => C.expStatus(e) === 'Vadeli'), (e) => e.amount), over = rows.filter((e) => C.expStatus(e) === 'Gecikmiş');
    const byCat = {}; rows.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + e.amount));
    const items = SS.C.cats.map((c) => ({ label: c, value: byCat[c] || 0, color: SS.C.catVar(c) })).filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
    const months = U.monthsBack(6), scoped = C.expenses();
    const series = SS.C.cats.map((c) => ({ name: c, color: SS.C.catVar(c), data: months.map((m) => U.sum(scoped.filter((e) => e.category === c && U.monthKey(e.date) === m), (e) => e.amount)) })).filter((s) => U.sum(s.data) > 0);
    const cols = [
      { h: 'Tarih', c: (e) => `<span class="nowrap">${U.fmtDate(e.date)}</span>` },
      { h: 'Açıklama', c: (e) => `<div class="t-main">${esc(e.desc)}</div><div class="t-sub">${esc(ui.firmName(e.firmId))}${e.source === 'hakedis' ? ' · hakediş ödemesi' : ''}</div>` },
      { h: 'Kategori', c: (e) => `<span class="cat-dot"><i style="background:${SS.C.catVar(e.category)}"></i>${esc(e.category)}</span>` },
      ...(all ? [{ h: 'Şantiye', c: (e) => `<span class="sub">${esc(ui.projectName(e.projectId))}</span>` }] : []),
      { h: 'Tutar', cls: 'num', c: (e) => `<b>${U.money(e.amount)}</b>` },
      { h: 'Durum', c: (e) => { const s = C.expStatus(e); return `${ui.badge(s, stTone[s])}${e.status !== 'Ödendi' && e.dueDate ? `<div class="t-sub">Vade: ${U.fmtDate(e.dueDate)}${s === 'Gecikmiş' ? ` (${-U.diff(today, e.dueDate)} gün)` : ''}</div>` : ''}`; } },
      { h: '', act: true, c: (e) => `${e.status !== 'Ödendi' ? `<button class="btn sm ok" data-action="exp.pay" data-id="${e.id}">${I('check')}Ödendi</button>` : ''}${e.receipt ? `<button class="rcp" data-action="exp.receipt" data-id="${e.id}" aria-label="Fiş / fatura">${I('image')}</button>` : ''}<button class="btn sm ghost" data-action="exp.edit" data-id="${e.id}" aria-label="Düzenle">${I('edit')}</button>` },
    ];
    return `<div class="grid g-4 kpis">
      ${ui.kpi({ label: 'Toplam harcama', value: U.sum(rows, (e) => e.amount), fmt: 'compact', icon: 'receipt', tone: 'brand', sub: `${rows.length} kayıt` })}
      ${ui.kpi({ label: 'Ödenen', value: paid, fmt: 'compact', icon: 'check', tone: 'ok' })}
      ${ui.kpi({ label: 'Vadeli (bekleyen)', value: pend, fmt: 'compact', icon: 'clock', tone: 'warn' })}
      ${ui.kpi({ label: 'Gecikmiş', value: U.sum(over, (e) => e.amount), fmt: 'compact', icon: 'alert', tone: over.length ? 'bad' : 'ok', sub: over.length ? `${over.length} ödeme vadesi geçmiş` : 'gecikme yok' })}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Aylık Gider <span class="muted fw">kategori bazında</span></h3></div><div class="card-b">${series.length ? G.stacked(months.map((m) => ({ key: m, label: U.monthShort(m) })), series, { height: 230 }) : ui.empty('chart', 'Veri yok', '')}<div class="chart-legend" style="margin-top:8px">${SS.C.cats.map((c) => `<span><i style="background:${SS.C.catVar(c)}"></i>${c}</span>`).join('')}</div></div></div>
      <div class="card"><div class="card-h"><h3>Kategori Dağılımı</h3></div><div class="card-b">${items.length ? `<div class="stack">${G.donut(items, { size: 160, stroke: 22, center: { big: U.compact(U.sum(items, (i) => i.value)), small: 'filtrelenen' } })}${G.legend(items, U.compact)}</div>` : ui.empty('receipt', 'Kayıt yok', '')}</div></div></div>
      <div class="card">${ui.table({ cols, rows, empty: 'Harcama kaydı bulunamadı' })}</div>`;
  }

  function firmRows() {
    const st = ui.vs('expenses', { fq: '', ft: '' }), exps = C.expenses();
    return SS.D.firms.filter((f) => (!st.ft || f.type === st.ft) && U.match(st.fq, f.name, f.phone, f.contact)).map((f) => {
      const my = exps.filter((e) => e.firmId === f.id);
      return { f, total: U.sum(my, (e) => e.amount), paid: U.sum(my.filter((e) => e.status === 'Ödendi'), (e) => e.amount), due: U.sum(my.filter((e) => e.status !== 'Ödendi'), (e) => e.amount), n: my.length };
    }).sort((a, b) => b.total - a.total);
  }
  function firmBody() {
    const rows = firmRows();
    return `<div class="card">${ui.table({ rows: rows.map((r) => Object.assign(r, { _attr: `data-action="firm.open" data-id="${r.f.id}" style="cursor:pointer"` })), empty: 'Firma bulunamadı', cols: [
      { h: 'Firma', c: (r) => `<div class="firm-av">${ui.avatar(r.f.name, r.f.name.length)}<div><div class="t-main">${esc(r.f.name)}</div><div class="t-sub">${esc(r.f.phone || '—')}</div></div></div>` },
      { h: 'Tür', c: (r) => ui.badge(r.f.type, r.f.type === 'Taşeron' ? 'brand' : r.f.type === 'Kurum' ? 'info' : r.f.type === 'Müşteri' ? 'ok' : 'muted') },
      { h: 'Toplam', cls: 'num', c: (r) => (r.total ? U.money(r.total) : '—') }, { h: 'Ödenen', cls: 'num', c: (r) => (r.paid ? U.money(r.paid) : '—') },
      { h: 'Kalan borç', cls: 'num', c: (r) => (r.due ? `<b class="${r.due ? 'wrn' : ''}">${U.money(r.due)}</b>` : '—') },
      { h: '', act: true, c: (r) => `${r.f.phone && r.f.phone.length > 6 ? `<a class="btn sm ghost" href="tel:${esc(r.f.phone.replace(/\s/g, ''))}" aria-label="Ara">${I('phone')}</a>` : ''}<button class="btn sm ghost" data-action="firm.edit" data-id="${r.f.id}" aria-label="Düzenle">${I('edit')}</button>` },
    ] })}</div>`;
  }

  function page() {
    const st = ui.vs('expenses', { tab: 'list' });
    const common = ui.tabs('expenses', 'tab', [['list', 'Harcamalar'], ['firms', 'Firmalar & Cari', SS.D.firms.length]], st.tab);
    if (st.tab === 'firms') return `<div class="page">${ui.head({ title: 'Firmalar & Cari Hesaplar', sub: 'Tedarikçi, taşeron ve kurum bakiyeleri', actions: `<button class="btn primary" data-action="firm.new">${I('plus')}Firma Ekle</button>` })}${common}
      ${ui.toolbar({ view: 'expenses', ph: 'Firma, telefon veya yetkili ara…', upd: 'firms-body', right: '', filters: [{ k: 'ft', label: 'Tür', opts: [['', 'Tümü'], ...SS.C.firmTypes] }] }).replace('data-vs="expenses.q"', 'data-vs="expenses.fq"').replace(/value="[^"]*"/, `value="${esc(st.fq || '')}"`)}
      ${ui.region('firms-body', firmBody)}</div>`;
    return `<div class="page">${ui.head({ title: 'Harcama & Ödeme', sub: 'Gider girişi, vade takibi ve nakit akışı', actions: `${SS.exp.menu('expenses')}<button class="btn primary" data-action="exp.new">${I('plus')}Harcama Ekle</button>` })}${common}
      ${ui.toolbar({ view: 'expenses', ph: 'Açıklama, firma veya kategori ara…', upd: 'expenses-body', filters: [
        { k: 'cat', label: 'Kategori', opts: [['', 'Tümü'], ...SS.C.cats] }, { k: 'status', label: 'Durum', opts: [['', 'Tümü'], ...SS.C.expStatus] },
        { k: 'from', label: 'Başlangıç', type: 'date' }, { k: 'to', label: 'Bitiş', type: 'date' }] })}
      ${ui.region('expenses-body', listBody)}</div>`;
  }
  SS.views.expenses = { title: 'Harcama & Ödeme', render: page };

  /* ---------------- harcama formu ---------------- */
  function expForm(e) {
    const act = C.active(), pid = e ? e.projectId : act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0] || {}).id;
    const values = e ? Object.assign({}, e) : { projectId: pid, date: U.today(), category: SS.C.cats[0], status: 'Ödendi', dueDate: U.addDays(U.today(), 30) };
    ui.form({
      title: e ? 'Harcamayı Düzenle' : 'Yeni Harcama',
      values, fields: [
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'date', label: 'Tarih', type: 'date', required: true },
        { name: 'category', label: 'Kategori', type: 'select', options: SS.C.cats, required: true }, { name: 'amount', label: 'Tutar (₺)', type: 'money', required: true, min: 0.01 },
        { name: 'desc', label: 'Açıklama', required: true, placeholder: 'ör. Q16 nervürlü demir – 12 ton' },
        { name: 'firmId', label: 'Tedarikçi / firma', type: 'select', options: ui.firmOpts() },
        { name: 'status', label: 'Ödeme durumu', type: 'seg', options: SS.C.expStatus },
        { name: 'dueDate', label: 'Vade tarihi', type: 'date' },
        { name: 'receipt', label: 'Fatura / fiş görseli', type: 'image', value: e && e.receipt ? [e.receipt] : [], hint: 'Fotoğraf çekin veya galeriden seçin; küçültülerek saklanır.' },
      ],
      onInput(v, a) { const w = a.el.querySelector('[data-fld="dueDate"]'); if (w) w.style.display = v.status === 'Ödendi' ? 'none' : ''; },
      danger: e ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Harcama silinsin mi?', text: `${esc(e.desc)} — ${U.money(e.amount)}` })) { if (e.receipt) SS.blob.del(e.receipt.id); SS.store.del('expenses', e.id); a.close(); ui.rerender(); ui.toast('Harcama silindi', 'info'); } } } : null,
      async onSubmit(v) {
        const d = { projectId: v.projectId, date: v.date, category: v.category, amount: v.amount, desc: v.desc, firmId: v.firmId, status: v.status };
        if (v.status === 'Ödendi') d.paidDate = (e && e.paidDate) || v.date; else { d.dueDate = v.dueDate || U.addDays(v.date, 30); d.paidDate = ''; }
        if (v.receipt.length) { if (e && e.receipt) SS.blob.del(e.receipt.id); d.receipt = await SS.blob.putImage(v.receipt[0]); }
        if (e) SS.store.upd('expenses', e.id, d); else SS.store.add('expenses', d, 'e');
        ui.rerender(); ui.toast(e ? 'Harcama güncellendi' : `Harcama kaydedildi · ${U.money(v.amount)}`);
      },
    });
  }
  SS.actions['exp.new'] = () => expForm(null);
  SS.actions['exp.edit'] = (el) => expForm(SS.store.find('expenses', el.dataset.id));
  SS.actions['exp.pay'] = (el) => { SS.store.upd('expenses', el.dataset.id, { status: 'Ödendi', paidDate: U.today() }); ui.rerender(); ui.toast('Ödeme tamamlandı olarak işaretlendi'); };
  SS.actions['exp.receipt'] = (el) => { const e = SS.store.find('expenses', el.dataset.id); ui.lightbox(e.receipt.id, e.desc); };

  /* ---------------- firma ---------------- */
  function firmForm(f) {
    ui.form({
      title: f ? 'Firmayı Düzenle' : 'Yeni Firma', values: f || { type: 'Tedarikçi' },
      fields: [{ name: 'name', label: 'Firma adı', required: true }, { name: 'type', label: 'Tür', type: 'select', options: SS.C.firmTypes }, { name: 'phone', label: 'Telefon', type: 'tel' }, { name: 'contact', label: 'Yetkili kişi', half: true }, { name: 'taxNo', label: 'Vergi no', half: true }],
      danger: f ? { label: 'Sil', onClick: async (a) => { const used = SS.D.expenses.some((e) => e.firmId === f.id) || SS.D.contracts.some((c) => c.firmId === f.id); if (used) { ui.toast('Bu firmaya bağlı kayıtlar var; önce onları silin veya başka firmaya taşıyın.', 'bad'); return; } if (await ui.confirm({ title: 'Firma silinsin mi?', text: esc(f.name) })) { SS.store.del('firms', f.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) { const d = { name: v.name, type: v.type, phone: v.phone, contact: v.contact, taxNo: v.taxNo }; if (f) SS.store.upd('firms', f.id, d); else SS.store.add('firms', d, 'f'); ui.rerender(); ui.toast('Firma kaydedildi'); },
    });
  }
  SS.actions['firm.new'] = () => firmForm(null);
  SS.actions['firm.edit'] = (el, ev) => { ev.stopPropagation(); firmForm(SS.store.find('firms', el.dataset.id)); };
  SS.actions['firm.open'] = (el, ev) => {
    if (ev.target.closest('a,button') && ev.target.closest('a,button') !== el) return;
    const f = SS.store.find('firms', el.dataset.id), my = SS.D.expenses.filter((e) => e.firmId === f.id).sort((a, b) => b.date.localeCompare(a.date));
    const total = U.sum(my, (e) => e.amount), paid = U.sum(my.filter((e) => e.status === 'Ödendi'), (e) => e.amount);
    const cons = SS.D.contracts.filter((c) => c.firmId === f.id).map((c) => ({ c, s: C.contractStats(c) }));
    ui.sheet({ title: esc(f.name), side: true, noFocus: true, headExtra: ui.badge(f.type, 'brand'), body: `
      <div class="fsum"><div><small>Toplam</small><b>${U.compact(total)}</b></div><div><small>Ödenen</small><b class="pos">${U.compact(paid)}</b></div><div><small>Kalan borç</small><b class="${total - paid ? 'wrn' : ''}">${U.compact(total - paid)}</b></div></div>
      ${cons.length ? `<div class="section-t">Sözleşmeler</div>${cons.map(({ c, s }) => `<div class="ins" style="margin:8px 0"><span><b>${esc(c.title)}</b><small>Sözleşme ${U.money(c.amount)} · hakediş bakiyesi ${U.money(s.balance)}</small></span></div>`).join('')}` : ''}
      <div class="section-t" style="margin-top:12px">Son hareketler</div>
      ${my.slice(0, 12).map((e) => `<div class="row between" style="padding:9px 0;border-top:1px solid var(--line-2)"><div><b style="font-size:14px">${esc(e.desc)}</b><div class="sub">${U.fmtDate(e.date)} · ${ui.badge(C.expStatus(e), stTone[C.expStatus(e)])}</div></div><b>${U.money(e.amount)}</b></div>`).join('') || '<p class="muted">Hareket yok</p>'}
      <p class="sub" style="margin-top:10px">${f.phone ? `Tel: ${esc(f.phone)}` : ''}${f.contact ? ` · Yetkili: ${esc(f.contact)}` : ''}</p>`,
      footer: `<button class="btn" data-action="firm.statement" data-id="${f.id}">${I('printer')}Cari ekstre (PDF)</button><button class="btn" data-action="firm.edit" data-id="${f.id}">${I('edit')}Düzenle</button>` });
  };
  SS.actions['firm.statement'] = (el) => SS.exp.save(SS.reports.firmStatement(el.dataset.id), 'pdf');
})();
