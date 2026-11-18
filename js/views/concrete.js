/* Beton & Numune Takibi — döküm kaydı, 7/28 gün küp kırım takibi ve uygunluk değerlendirmesi */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;
  const CLASSES = ['C16/20', 'C20/25', 'C25/30', 'C30/37', 'C35/45', 'C40/50', 'C45/55'];

  SS.css(`
  .cc-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;counter-reset:s}
  .cc-step{position:relative;padding:12px 10px 10px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line-2);text-align:center;font-size:12.5px;color:var(--ink-2);line-height:1.35}
  .cc-step svg{display:block;margin:0 auto 6px;width:52px;height:46px}.cc-step b{display:block;font-size:13px;color:var(--ink);margin-bottom:2px}
  .cc-test{display:inline-flex;flex-direction:column;gap:2px;font-size:12.5px;min-width:96px}.cc-test small{color:var(--muted);font-size:11.5px}
  .cc-photos{display:inline-flex;align-items:center;gap:4px;color:var(--muted);font-size:12.5px}.cc-photos .ic{width:14px;height:14px}
  @media(max-width:899px){.cc-steps{grid-template-columns:repeat(2,1fr)}}
  `);

  const parseRes = (t) => String(t || '').split(/[\s;]+/).map((x) => parseFloat(x.replace(',', '.'))).filter((x) => isFinite(x) && x > 0);
  const fmtRes = (a) => (a || []).map((x) => String(x).replace('.', ',')).join(' ');
  const avg = (a) => U.sum(a) / (a.length || 1);

  const testCell = (c, t) => {
    const today = U.today(), left = U.diff(today, t.due);
    if (t.done) { const v = t.day === 28 ? C.concreteVerdict(c) : null; return `<span class="cc-test"><b class="${v === 'bad' ? 'neg' : v === 'ok' ? 'pos' : ''}">${U.num(avg(t.res), 1)} MPa</b><small>${t.res.length} numune${v ? (v === 'ok' ? ' · uygun ✓' : ' · uygun değil ⚠') : ''}</small></span>`; }
    return `<span class="cc-test"><b class="${left < 0 ? 'neg' : left <= 3 ? 'wrn' : ''}">${U.fmtDate(t.due)}</b><small>${left < 0 ? -left + ' gün gecikti' : left === 0 ? 'bugün kırılacak' : left + ' gün sonra'}</small></span>`;
  };

  function rows() {
    const st = ui.vs('concrete', { q: '', cls: '', status: '' });
    return C.scope('concrete').filter((c) => (!st.cls || c.cls === st.cls) && U.match(st.q, c.element, c.cls, ui.firmName(c.firmId), c.waybill) && (!st.status || (st.status === 'pending' ? C.concreteTests(c).some((t) => !t.done) : st.status === 'bad' ? C.concreteVerdict(c) === 'bad' : C.concreteTests(c).every((t) => t.done)))).sort((a, b) => b.date.localeCompare(a.date));
  }
  function listBody() {
    const list = rows();
    if (!C.scope('concrete').length) return `<div class="card pad">${ui.empty('layers', 'Henüz beton dökümü kaydı yok', 'Her dökümü kaydedin; 7. ve 28. gün küp kırım tarihlerini otomatik hesaplayıp yaklaşınca uyarırım.', `<button class="btn primary" data-action="concrete.new">${I('plus')}İlk Dökümü Ekle</button>`)}</div>`;
    return `<div class="card">${ui.table({ cols: [
      { h: 'Döküm', c: (c) => `<div class="t-main">${esc(c.element)}</div><div class="t-sub">${U.fmtDate(c.date)} · ${esc(ui.firmName(c.firmId))}${c.waybill ? ' · ' + esc(c.waybill) : ''}</div>` },
      { h: 'Sınıf / Hacim', c: (c) => `<span class="badge brand">${esc(c.cls)}</span> <b>${U.num(c.qty, 1)} m³</b>${c.slump ? `<div class="t-sub">çökme ${c.slump} mm${c.temp != null && c.temp !== '' ? ' · ' + c.temp + '°C' : ''}</div>` : ''}` },
      { h: '7. gün', c: (c) => testCell(c, C.concreteTests(c)[0]) },
      { h: '28. gün', c: (c) => testCell(c, C.concreteTests(c)[1]) },
      { h: '', act: true, c: (c) => `${(c.photos || []).length ? `<span class="cc-photos">${I('camera')}${c.photos.length}</span> ` : ''}${C.concreteTests(c).some((t) => !t.done) ? `<button class="btn sm soft" data-action="concrete.res" data-id="${c.id}">${I('check')}Sonuç gir</button>` : ''}<button class="btn sm ghost" data-action="concrete.edit" data-id="${c.id}">${I('edit')}Düzenle</button>` },
    ], rows: list, empty: 'Filtreye uyan döküm bulunamadı' })}</div>`;
  }

  const cubeSvg = (n) => `<svg viewBox="0 0 52 46" aria-hidden="true"><g stroke="var(--ink-2)" stroke-width="1.5" stroke-linejoin="round"><path d="M8 18h24v24H8z" fill="var(--s1)" fill-opacity=".28"/><path d="M8 18l10-10h24L32 18z" fill="var(--s1)" fill-opacity=".5"/><path d="M32 18l10-10v24L32 42z" fill="var(--s1)" fill-opacity=".14"/></g>${n}</svg>`;
  const steps = () => `<div class="card"><div class="card-h"><h3>Numune süreci</h3><span class="badge muted">15×15×15 cm küp</span></div><div class="card-b"><div class="cc-steps">
    <div class="cc-step">${cubeSvg('<circle cx="20" cy="30" r="3" fill="var(--brand)"/>')}<b>1. Al</b>Dökümde kamyondan, 3'lü set</div>
    <div class="cc-step">${cubeSvg('<path d="M12 8v8" stroke="var(--ink-2)" stroke-width="2"/>')}<b>2. Bekle</b>24 saat kalıpta, gölgede</div>
    <div class="cc-step">${cubeSvg('<path d="M4 38q6-4 12 0t12 0t12 0" stroke="var(--info)" stroke-width="2" fill="none"/>')}<b>3. Kür</b>Kür havuzunda (su içinde)</div>
    <div class="cc-step">${cubeSvg('<text x="14" y="34" font-size="11" font-weight="800" fill="var(--ink)">7</text>')}<b>4. 7. gün</b>Erken dayanım kırımı</div>
    <div class="cc-step">${cubeSvg('<text x="11" y="34" font-size="11" font-weight="800" fill="var(--ink)">28</text>')}<b>5. 28. gün</b>Esas dayanım, uygunluk</div></div>
    <p class="sub" style="margin-top:10px">Değerlendirme (3 numune, ilk üretim): ortalama ≥ fck,küp + 4 MPa ve her numune ≥ fck,küp − 4 MPa. Bu uygulama göstergedir; resmî sonuç için akredite laboratuvar raporu ve yapı denetim esastır.</p></div></div>`;

  function monthChart() {
    const ms = U.monthsBack(6), data = ms.map((m) => U.sum(C.scope('concrete').filter((c) => U.monthKey(c.date) === m), (c) => c.qty));
    return `<div class="card"><div class="card-h"><h3>Aylık beton dökümü <span class="muted fw">m³</span></h3></div><div class="card-b">${G.bars([{ name: 'm³', color: 'var(--s1)', data }], ms.map(U.monthShort), { height: 190, fmt: (v) => U.num(v) })}</div></div>`;
  }

  SS.views.concrete = {
    title: 'Beton & Numune',
    render() {
      const all = C.scope('concrete'), mk = U.monthKey(U.today()), pend = all.flatMap((c) => C.concreteTests(c).filter((t) => !t.done).map((t) => ({ c, t }))), soon = pend.filter((x) => x.t.due <= U.addDays(U.today(), 3));
      return `<div class="page">${ui.head({ title: 'Beton & Numune Takibi', sub: 'Döküm kayıtları, 7 ve 28 günlük küp kırım takvimi, uygunluk değerlendirmesi', actions: `${SS.exp.menu('concrete')}<button class="btn primary" data-action="concrete.new">${I('plus')}Döküm Ekle</button>` })}
        <div class="grid g-4 kpis">${ui.kpi({ label: 'Toplam beton', value: U.sum(all, (c) => c.qty), fmt: 'num', icon: 'layers', tone: 'info', sub: `${all.length} döküm` })}
          ${ui.kpi({ label: 'Bu ay döküm', value: U.sum(all.filter((c) => U.monthKey(c.date) === mk), (c) => c.qty), fmt: 'num', icon: 'calendar', tone: 'brand', sub: 'm³' })}
          ${ui.kpi({ label: 'Bekleyen kırım', value: pend.length, fmt: 'num', icon: 'clock', tone: soon.length ? 'warn' : 'info', sub: soon.length ? `${soon.length} tanesi 3 gün içinde` : 'numune sonucu bekleniyor' })}
          ${ui.kpi({ label: 'Uygun değil', value: all.filter((c) => C.concreteVerdict(c) === 'bad').length, fmt: 'num', icon: 'alert', tone: all.some((c) => C.concreteVerdict(c) === 'bad') ? 'bad' : 'ok', sub: '28 gün sonucu kriterin altında' })}</div>
        ${ui.toolbar({ view: 'concrete', ph: 'Döküm yeri, firma veya irsaliye ara…', upd: 'concrete-body', filters: [{ k: 'cls', label: 'Sınıf', opts: [['', 'Tümü'], ...CLASSES] }, { k: 'status', label: 'Durum', opts: [['', 'Tümü'], ['pending', 'Kırım bekleyen'], ['done', 'Tamamlanan'], ['bad', 'Uygun değil']] }] })}
        ${ui.region('concrete-body', listBody)}
        <div class="grid g-2">${steps()}${monthChart()}</div></div>`;
    },
  };

  /* ---------- formlar ---------- */
  function form(c) {
    const e = !!c, pid = C.active() !== 'all' ? C.active() : (SS.D.projects[0] || {}).id;
    const values = e ? Object.assign({}, c, { res7: fmtRes(c.res7), res28: fmtRes(c.res28) }) : { projectId: pid, date: U.today(), cls: 'C25/30', sets: 3, element: '' };
    ui.form({
      title: e ? 'Beton Dökümünü Düzenle' : 'Yeni Beton Dökümü', values, wide: true,
      fields: [
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'date', label: 'Döküm tarihi', type: 'date', required: true },
        { name: 'element', label: 'Döküm yeri / eleman', required: true, placeholder: 'ör. A Blok 3. kat kolon-perde' },
        { name: 'cls', label: 'Beton sınıfı', type: 'select', options: CLASSES, required: true }, { name: 'qty', label: 'Miktar (m³)', type: 'number', required: true, min: 0.1, step: 'any' },
        { name: 'firmId', label: 'Hazır beton firması', type: 'select', options: ui.firmOpts(['Tedarikçi', 'Taşeron']) }, { name: 'waybill', label: 'İrsaliye no', half: true },
        { name: 'slump', label: 'Çökme / slump (mm)', type: 'number', min: 0, hint: 'S3: 100–150 · S4: 160–210' }, { name: 'temp', label: 'Hava sıcaklığı (°C)', type: 'number', step: 'any' },
        { name: 'sets', label: 'Alınan numune (adet)', type: 'number', min: 0, step: 1 },
        { type: 'html', html: '<div class="section-t" style="margin:6px 0 0">Kırım sonuçları (küp dayanımı, MPa)</div>' },
        { name: 'res7', label: '7. gün sonuçları', half: true, placeholder: 'ör. 18,5 19,2 18,9', hint: 'Boşlukla ayırın' }, { name: 'res28', label: '28. gün sonuçları', half: true, placeholder: 'ör. 31,4 32,0 30,8' },
        { name: 'photos', label: 'Fotoğraflar (numune, döküm, irsaliye)', type: 'image', multiple: true, value: e ? c.photos : [], hint: e && c.photos && c.photos.length ? `${c.photos.length} fotoğraf ekli · yeni seçilenler eklenir` : 'İsteğe bağlı' },
        { name: 'note', label: 'Not', type: 'textarea', rows: 2 },
      ],
      danger: e ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Döküm kaydı silinsin mi?', text: `${esc(c.element)} — ${U.num(c.qty, 1)} m³` })) { (c.photos || []).forEach((p) => SS.blob.del(p.id)); SS.store.del('concrete', c.id); a.close(); ui.rerender(); } } } : null,
      async onSubmit(v) {
        const photos = c && c.photos ? c.photos.slice() : []; for (const f of v.photos) photos.push(await SS.blob.putImage(f));
        const d = { projectId: v.projectId, date: v.date, element: v.element, cls: v.cls, qty: v.qty, firmId: v.firmId, waybill: v.waybill, slump: v.slump, temp: v.temp, sets: v.sets, res7: parseRes(v.res7), res28: parseRes(v.res28), photos, note: v.note };
        if (e) SS.store.upd('concrete', c.id, d); else SS.store.add('concrete', d, 'c');
        ui.rerender(); ui.toast(e ? 'Döküm güncellendi' : 'Döküm kaydedildi — 7. ve 28. gün kırım tarihleri takvime eklendi');
      },
    });
  }
  SS.actions['concrete.new'] = () => form(null);
  SS.actions['concrete.edit'] = (el) => form(SS.store.find('concrete', el.dataset.id));
  SS.actions['concrete.res'] = (el) => {
    const c = SS.store.find('concrete', el.dataset.id), t = C.concreteTests(c).find((x) => !x.done) || C.concreteTests(c)[1];
    ui.form({ title: `${c.element} — ${t.day}. gün sonucu`, cls: 'small', values: { res: '' }, fields: [{ name: 'res', label: 'Küp dayanımları (MPa)', required: true, placeholder: 'ör. 24,5 25,1 23,9', hint: 'Numune değerlerini boşlukla ayırın' }],
      onSubmit(v) { const r = parseRes(v.res); if (!r.length) { ui.toast('Geçerli bir değer girin', 'bad'); return false; } SS.store.upd('concrete', c.id, { ['res' + t.day]: r }); ui.rerender(); const vd = t.day === 28 ? C.concreteVerdict(SS.store.find('concrete', c.id)) : null; ui.toast(vd === 'bad' ? 'Sonuç kaydedildi — kriterin altında!' : 'Sonuç kaydedildi', vd === 'bad' ? 'bad' : 'ok'); } });
  };

  /* dışa aktarım */
  SS.reports.concrete = () => { const l = C.scope('concrete').slice().sort((a, b) => a.date.localeCompare(b.date)); return { title: 'Beton Döküm & Numune Raporu', project: C.active() === 'all' ? 'Tüm şantiyeler' : ui.projectName(C.active()), meta: [['Döküm', String(l.length)], ['Toplam', U.num(U.sum(l, (c) => c.qty), 1) + ' m³']], sections: [{ heading: 'Döküm kayıtları', cols: [{ h: 'Tarih' }, { h: 'Döküm yeri' }, { h: 'Sınıf' }, { h: 'm³', num: true }, { h: 'Firma' }, { h: 'Çökme (mm)', num: true }, { h: '7. gün (MPa)' }, { h: '28. gün (MPa)' }, { h: 'Değerlendirme' }], rows: l.map((c) => [U.fmtDate(c.date), c.element, c.cls, c.qty, ui.firmName(c.firmId), c.slump || '', (c.res7 || []).length ? fmtRes(c.res7) : 'bekliyor ' + U.fmtDate(U.addDays(c.date, 7)), (c.res28 || []).length ? fmtRes(c.res28) : 'bekliyor ' + U.fmtDate(U.addDays(c.date, 28)), ({ ok: 'Uygun', bad: 'Uygun değil' })[C.concreteVerdict(c)] || '—']), totals: ['', 'Toplam', '', U.sum(l, (c) => c.qty), '', '', '', '', ''] }], note: 'Değerlendirme göstergedir (3 numune: ortalama ≥ fck,küp+4, tek tek ≥ fck,küp−4). Resmî sonuç için akredite laboratuvar raporu esastır.' }; };
})();
