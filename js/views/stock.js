/* Stok & Malzeme Takibi */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;

  SS.css(`
  .lvl{min-width:120px}.lvl .bar{height:8px}.lvl small{display:block;margin-top:4px;color:var(--muted);font-size:12px}
  .mname{display:flex;gap:10px;align-items:center}.mname .kpi-ic{width:34px;height:34px;margin:0;border-radius:10px}
  .crit-row td:first-child{box-shadow:inset 3px 0 0 var(--bad)}
  `);

  const qty = (n, unit) => `${U.num(n, Math.abs(n % 1) > 0.001 ? 1 : 0)} ${unit}`;
  const stockInfo = (m) => { const s = C.stock(m), d = C.daysLeft(m), crit = m.critical > 0 && s <= m.critical, low = m.critical > 0 && s <= m.critical * 1.5; return { s, d, crit, low, use: C.usage(m) }; };
  const mat = (id) => SS.D.materials.find((m) => m.id === id);

  function stockRows() {
    const st = ui.vs('stock', { q: '', mcat: '', lvl: '' });
    return C.scope('materials').map((m) => Object.assign({ m }, stockInfo(m))).filter((r) => (!st.mcat || r.m.category === st.mcat) && (!st.lvl || (st.lvl === 'crit' ? r.crit : st.lvl === 'low' ? r.low && !r.crit : !r.low)) && U.match(st.q, r.m.name, r.m.category))
      .sort((a, b) => (b.crit - a.crit) || (b.low - a.low) || a.m.name.localeCompare(b.m.name, 'tr'));
  }
  function statusBody() {
    const rows = stockRows(), all = C.scope('materials').map((m) => Object.assign({ m }, stockInfo(m))), crit = all.filter((r) => r.crit);
    const mk = U.monthKey(U.today()), mv = C.scope('movements').filter((x) => U.monthKey(x.date) === mk);
    const val = U.sum(all, (r) => r.s * (r.m.price || 0));
    return `${crit.length ? `<div class="banner bad"><span class="pulse-dot"></span>${I('alert')}<span><b>${crit.length} malzeme kritik seviyenin altında:</b> ${crit.map((r) => `${esc(r.m.name)} (${qty(r.s, r.m.unit)})`).join(' · ')}</span></div>` : ''}
      <div class="grid g-4 kpis">${ui.kpi({ label: 'Malzeme kalemi', value: all.length, fmt: 'num', icon: 'box', tone: 'info', sub: 'takip edilen' })}${ui.kpi({ label: 'Kritik stok', value: crit.length, fmt: 'num', icon: 'alert', tone: crit.length ? 'bad' : 'ok', sub: crit.length ? 'acil sipariş gerekli' : 'tüm stoklar yeterli' })}
      ${ui.kpi({ label: 'Stok değeri', value: val, fmt: 'compact', icon: 'wallet', tone: 'brand', sub: 'birim fiyat × mevcut' })}${ui.kpi({ label: 'Bu ay hareket', value: mv.length, fmt: 'num', icon: 'trend', tone: 'info', sub: `${mv.filter((x) => x.type === 'giris').length} giriş · ${mv.filter((x) => x.type === 'cikis').length} çıkış` })}</div>
      <div class="card">${ui.table({ rows: rows.map((r) => Object.assign(r, { _attr: r.crit ? 'class="crit-row"' : '' })), empty: 'Malzeme bulunamadı', cols: [
        { h: 'Malzeme', c: (r) => `<div class="mname"><span class="kpi-ic tone-${r.crit ? 'bad' : r.low ? 'warn' : 'info'}">${I('box')}</span><div><div class="t-main">${esc(r.m.name)}</div><div class="t-sub">${esc(r.m.category)}${C.active() === 'all' ? ' · ' + esc(ui.projectName(r.m.projectId)) : ''}</div></div></div>` },
        { h: 'Mevcut stok', cls: 'num', c: (r) => `<b class="${r.crit ? 'neg' : ''}">${qty(r.s, r.m.unit)}</b>` },
        { h: 'Seviye', c: (r) => (r.m.critical > 0 ? `<div class="lvl">${ui.bar((r.s / (r.m.critical * 2.5)) * 100, r.crit ? 'bad' : r.low ? 'warn' : 'ok')}<small>kritik: ${qty(r.m.critical, r.m.unit)}</small></div>` : '<span class="sub">anlık kullanım</span>') },
        { h: 'Günlük tüketim', cls: 'num', c: (r) => (r.use ? qty(r.use, r.m.unit) : '—') },
        { h: 'Tahmini bitiş', cls: 'num', c: (r) => (isFinite(r.d) ? `<span class="${r.d <= 3 ? 'neg strong' : r.d <= 7 ? 'wrn strong' : ''}">${r.d < 1 ? '< 1' : Math.ceil(r.d)} gün</span>` : '—') },
        { h: 'Durum', c: (r) => (r.crit ? ui.badge('Kritik', 'bad', 'alert') : r.low ? ui.badge('Azalıyor', 'warn') : ui.badge('Yeterli', 'ok')) },
        { h: '', act: true, c: (r) => `<button class="btn sm ok" data-action="stock.in" data-mid="${r.m.id}">${I('plus')}Giriş</button><button class="btn sm" data-action="stock.out" data-mid="${r.m.id}">${I('minus')}Çıkış</button><button class="btn sm ghost" data-action="mat.edit" data-id="${r.m.id}" aria-label="Düzenle">${I('edit')}</button>` },
      ] })}</div>`;
  }

  function movRows() {
    const st = ui.vs('stock', { mq: '', mtype: '', mmat: '', mfrom: '', mto: '' }), ids = new Set(C.scope('materials').map((m) => m.id));
    return SS.D.movements.filter((x) => ids.has(x.materialId) && (!st.mtype || x.type === st.mtype) && (!st.mmat || x.materialId === st.mmat) && C.inRange(x.date, st.mfrom, st.mto) && U.match(st.mq, (mat(x.materialId) || {}).name, x.waybill, x.area, ui.firmName(x.firmId)))
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 150);
  }
  function movBody() {
    const rows = movRows(), tin = U.sum(rows.filter((x) => x.type === 'giris'), (x) => x.qty * (x.price || 0)), tout = U.sum(rows.filter((x) => x.type === 'cikis'), (x) => x.qty * (x.price || 0));
    return `<div class="grid g-3 kpis">${ui.kpi({ label: 'Listelenen hareket', value: rows.length, fmt: 'num', icon: 'list', tone: 'info' })}${ui.kpi({ label: 'Giriş değeri', value: tin, fmt: 'compact', icon: 'arrowDown', tone: 'ok' })}${ui.kpi({ label: 'Çıkış (kullanım) değeri', value: tout, fmt: 'compact', icon: 'arrowUp', tone: 'warn' })}</div>
      <div class="card">${ui.table({ rows, empty: 'Hareket bulunamadı', cols: [
        { h: 'Tarih', c: (x) => U.fmtDate(x.date) }, { h: 'Tür', c: (x) => (x.type === 'giris' ? ui.badge('Giriş', 'ok', 'arrowDown') : ui.badge('Çıkış', 'warn', 'arrowUp')) },
        { h: 'Malzeme', c: (x) => { const m = mat(x.materialId) || {}; return `<div class="t-main">${esc(m.name || '—')}</div><div class="t-sub">${x.type === 'giris' ? 'İrsaliye: ' + esc(x.waybill || '—') : 'Kullanım: ' + esc(x.area || '—')}</div>`; } },
        { h: 'Miktar', cls: 'num', c: (x) => `<b>${x.type === 'giris' ? '+' : '−'}${qty(x.qty, (mat(x.materialId) || {}).unit || '')}</b>` },
        { h: 'Firma', c: (x) => `<span class="sub">${esc(x.type === 'giris' ? ui.firmName(x.firmId) : '')}</span>` }, { h: 'Tutar', cls: 'num', c: (x) => (x.price ? U.money(x.qty * x.price) : '—') },
        { h: '', act: true, c: (x) => `<button class="btn sm ghost" data-action="mov.edit" data-id="${x.id}" aria-label="Düzenle">${I('edit')}</button>` }] })}</div>`;
  }

  SS.views.stock = {
    title: 'Stok & Malzeme',
    render() {
      const s = ui.vs('stock', { tab: 'status' }), mats = C.scope('materials');
      const tabs = ui.tabs('stock', 'tab', [['status', 'Stok Durumu', C.criticalMats().length || null], ['moves', 'İrsaliye & Hareketler']], s.tab);
      const head = ui.head({ title: 'Stok & Malzeme Takibi', sub: 'Depo ve saha malzemeleri · irsaliyeli giriş, kullanım alanına göre çıkış · kritik stok uyarısı', actions: `${SS.exp.menu('stock')}<button class="btn" data-action="mat.new">${I('plus')}Yeni Malzeme</button><button class="btn" data-action="stock.out">${I('arrowUp')}Çıkış</button><button class="btn primary" data-action="stock.in">${I('arrowDown')}Malzeme Girişi</button>` });
      if (s.tab === 'moves') return `<div class="page">${head}${tabs}${ui.toolbar({ view: 'stock', ph: 'Malzeme, irsaliye no veya alan ara…', upd: 'mov-body', filters: [{ k: 'mtype', label: 'Tür', opts: [['', 'Tümü'], ['giris', 'Giriş'], ['cikis', 'Çıkış']] }, { k: 'mmat', label: 'Malzeme', opts: [['', 'Tümü'], ...mats.map((m) => [m.id, m.name])] }, { k: 'mfrom', label: 'Başlangıç', type: 'date' }, { k: 'mto', label: 'Bitiş', type: 'date' }] }).replace('data-vs="stock.q"', 'data-vs="stock.mq"').replace(/value="[^"]*"/, `value="${esc(s.mq || '')}"`)}${ui.region('mov-body', movBody)}</div>`;
      return `<div class="page">${head}${tabs}${ui.toolbar({ view: 'stock', ph: 'Malzeme ara…', upd: 'stock-body', filters: [{ k: 'mcat', label: 'Kategori', opts: [['', 'Tümü'], ...SS.C.matCats] }, { k: 'lvl', label: 'Seviye', opts: [['', 'Tümü'], ['crit', 'Kritik'], ['low', 'Azalıyor'], ['ok', 'Yeterli']] }] })}${ui.region('stock-body', statusBody)}</div>`;
    },
  };

  /* ---------------- formlar ---------------- */
  function matOpts() { return [['', '— Malzeme seçiniz —'], ...C.scope('materials').map((m) => [m.id, `${m.name} (${m.unit})`])]; }
  function moveForm(type, presetMat, mv) {
    const giris = type === 'giris', mats = C.scope('materials');
    if (!mats.length) { ui.toast('Önce bir malzeme tanımlayın', 'bad'); SS.actions['mat.new'](); return; }
    const m0 = mv ? mat(mv.materialId) : mat(presetMat);
    const values = mv ? Object.assign({}, mv) : { materialId: m0 ? m0.id : '', date: U.today(), price: m0 ? m0.price : 0, area: SS.C.areas[0], alsoExp: false };
    ui.form({
      title: mv ? (giris ? 'Girişi Düzenle' : 'Çıkışı Düzenle') : giris ? 'Malzeme Girişi (İrsaliye)' : 'Malzeme Çıkışı', values,
      fields: [
        { name: 'materialId', label: 'Malzeme', type: 'select', options: matOpts(), required: true }, { name: 'date', label: 'Tarih', type: 'date', required: true },
        { name: 'qty', label: 'Miktar', type: 'number', required: true, min: 0.001, step: 'any', hint: '<span data-unit-hint></span>' },
        ...(giris ? [{ name: 'waybill', label: 'İrsaliye no', half: true, placeholder: 'İRS-0000' }, { name: 'firmId', label: 'Tedarikçi', type: 'select', options: ui.firmOpts(['Tedarikçi', 'Taşeron']) }, { name: 'price', label: 'Birim fiyat (₺)', type: 'money', min: 0 }]
          : [{ name: 'area', label: 'Kullanım alanı', type: 'select', options: SS.C.areas }, { name: 'note', label: 'Not', placeholder: 'ör. B Blok 3. kat döşeme' }]),
        ...(giris && !mv ? [{ name: 'alsoExp', type: 'check', label: 'Harcama', text: 'Harcamalara da işle (vadeli, 30 gün)' }] : []),
      ],
      onInput(v, a) {
        const m = mat(v.materialId), h = a.el.querySelector('[data-unit-hint]'); if (!m || !h) return;
        const s = C.stock(m) + (mv && mv.materialId === m.id ? (mv.type === 'giris' ? -mv.qty : mv.qty) : 0);
        h.textContent = `Birim: ${m.unit} · mevcut stok: ${qty(s, m.unit)}`;
        const form = a.el.querySelector('form'); if (giris && !mv && v.materialId !== a._last) { a._last = v.materialId; form.elements.price.value = m.price || 0; }
      },
      validate(v) { const m = mat(v.materialId); if (!giris && m) { const s = C.stock(m) + (mv && mv.materialId === m.id ? mv.qty : 0); if (v.qty > s + 1e-9) return `Stok yetersiz — mevcut ${qty(s, m.unit)}`; } return ''; },
      danger: mv ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Hareket silinsin mi?', text: 'Stok miktarı buna göre yeniden hesaplanır.' })) { SS.store.del('movements', mv.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) {
        const m = mat(v.materialId), d = { materialId: m.id, projectId: m.projectId, type, qty: v.qty, date: v.date, price: v.price != null ? v.price : m.price };
        if (giris) Object.assign(d, { waybill: v.waybill, firmId: v.firmId, area: '' }); else Object.assign(d, { area: v.area, note: v.note });
        if (mv) SS.store.upd('movements', mv.id, d); else SS.store.add('movements', d, 'm');
        if (giris && v.price != null && v.price > 0) m.price = v.price;
        if (giris && !mv && v.alsoExp && d.price) SS.store.add('expenses', { projectId: m.projectId, date: v.date, category: ({ Demir: 'Demir / Beton', Beton: 'Demir / Beton', 'Kaba Malzeme': 'Kaba Malzeme' })[m.category] || 'İnce Malzeme', desc: `${m.name} – ${qty(v.qty, m.unit)} (${v.waybill || 'irsaliye'})`, firmId: v.firmId, amount: Math.round(v.qty * d.price * 100) / 100, status: 'Vadeli', dueDate: U.addDays(v.date, 30), source: 'stok' }, 'e');
        SS.store.save(); ui.rerender();
        const s = C.stock(m); ui.toast(giris ? `${esc(m.name)} girişi kaydedildi · stok ${qty(s, m.unit)}` : `${esc(m.name)} çıkışı kaydedildi · kalan ${qty(s, m.unit)}`);
        if (m.critical > 0 && s <= m.critical) setTimeout(() => ui.toast(`${esc(m.name)} kritik seviyenin altında!`, 'bad'), 700);
      },
    });
  }
  SS.actions['stock.in'] = (el) => moveForm('giris', el && el.dataset && el.dataset.mid);
  SS.actions['stock.out'] = (el) => moveForm('cikis', el && el.dataset && el.dataset.mid);
  SS.actions['mov.edit'] = (el) => { const x = SS.store.find('movements', el.dataset.id); moveForm(x.type, null, x); };

  function matForm(m) {
    const act = C.active(), pid = m ? m.projectId : act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0]).id;
    ui.form({
      title: m ? 'Malzemeyi Düzenle' : 'Yeni Malzeme', values: m || { projectId: pid, unit: 'adet', category: 'Kaba Malzeme', critical: 0, opening: 0, price: 0 },
      fields: [{ name: 'name', label: 'Malzeme adı', required: true, placeholder: 'ör. Nervürlü İnşaat Demiri Ø14' }, { name: 'unit', label: 'Birim', type: 'select', options: SS.C.units }, { name: 'category', label: 'Kategori', type: 'select', options: SS.C.matCats },
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'critical', label: 'Kritik stok seviyesi', type: 'number', min: 0, step: 'any', hint: 'Stok bu seviyenin altına inince kırmızı uyarı verilir (0 = uyarı yok)' },
        { name: 'price', label: 'Birim fiyat (₺)', type: 'money', min: 0 }, { name: 'opening', label: 'Açılış stoğu', type: 'number', min: 0, step: 'any' }],
      danger: m ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Malzeme silinsin mi?', text: `${esc(m.name)} ve tüm giriş/çıkış hareketleri silinir.` })) { SS.D.movements = SS.D.movements.filter((x) => x.materialId !== m.id); SS.store.del('materials', m.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) { const d = { name: v.name, unit: v.unit, category: v.category, projectId: v.projectId, critical: v.critical || 0, price: v.price || 0, opening: v.opening || 0 }; if (m) SS.store.upd('materials', m.id, d); else SS.store.add('materials', d, 'g'); ui.rerender(); ui.toast('Malzeme kaydedildi'); },
    });
  }
  SS.actions['mat.new'] = () => matForm(null);
  SS.actions['mat.edit'] = (el) => matForm(mat(el.dataset.id));
})();
