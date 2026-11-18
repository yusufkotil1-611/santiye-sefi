/* PDF & Excel Raporlama Motoru — rapor tanımları ve rapor merkezi */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;
  const R = (SS.reports = {});
  const M = (n) => ({ h: n, money: true }), N = (n) => ({ h: n, num: true }), T = (n) => ({ h: n });
  const scopeName = (pid) => { const a = pid || C.active(); return a === 'all' ? 'Tüm şantiyeler' : ui.projectName(a); };
  const firm = (id) => ui.firmName(id);

  /* ---------- rapor tanımları ---------- */
  R.expenses = () => {
    const st = ui.vs('expenses', { q: '', cat: '', status: '', from: '', to: '' });
    const rows = C.expenses({ from: st.from, to: st.to, cat: st.cat, status: st.status }).filter((e) => U.match(st.q, e.desc, firm(e.firmId), e.category, ui.projectName(e.projectId))).sort((a, b) => a.date.localeCompare(b.date));
    const byCat = {}; rows.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + e.amount));
    const paid = U.sum(rows.filter((e) => e.status === 'Ödendi'), (e) => e.amount), over = rows.filter((e) => C.expStatus(e) === 'Gecikmiş');
    return { title: 'Harcama Dökümü', project: scopeName(), meta: [['Dönem', st.from || st.to ? `${st.from ? U.fmtDate(st.from) : '…'} – ${st.to ? U.fmtDate(st.to) : '…'}` : 'Tüm zamanlar'], ['Kayıt', String(rows.length)]],
      sections: [{ heading: 'Özet', kpis: [['Toplam harcama', U.money(U.sum(rows, (e) => e.amount))], ['Ödenen', U.money(paid)], ['Vadeli bekleyen', U.money(U.sum(rows.filter((e) => C.expStatus(e) === 'Vadeli'), (e) => e.amount))], ['Gecikmiş', U.money(U.sum(over, (e) => e.amount))]] },
        { heading: 'Kategori bazında', cols: [T('Kategori'), M('Tutar'), N('Pay %')], rows: SS.C.cats.filter((c) => byCat[c]).map((c) => [c, byCat[c], Math.round((byCat[c] / (U.sum(rows, (e) => e.amount) || 1)) * 1000) / 10]), totals: ['Toplam', U.sum(rows, (e) => e.amount), 100] },
        { heading: 'Harcama detayı', cols: [T('Tarih'), T('Açıklama'), T('Firma'), T('Kategori'), T('Şantiye'), M('Tutar'), T('Durum')], rows: rows.map((e) => [U.fmtDate(e.date), e.desc, firm(e.firmId), e.category, ui.projectName(e.projectId), e.amount, C.expStatus(e)]), totals: ['', '', '', '', 'Toplam', U.sum(rows, (e) => e.amount), ''] }] };
  };
  R.payroll = () => {
    const mk = ui.vs('workforce', { month: U.monthKey(U.today()) }).month, rows = C.payroll(mk);
    const byRole = {}; rows.forEach((r) => { const b = (byRole[r.w.role] = byRole[r.w.role] || { n: 0, days: 0, gross: 0 }); b.n++; b.days += r.days * (r.w.headcount || 1); b.gross += r.gross; });
    return { title: 'Aylık Puantaj Cetveli', project: scopeName(), meta: [['Dönem', U.monthLabel(mk)], ['Personel', String(rows.length)]],
      sections: [{ heading: 'Özet', kpis: [['Adam-gün', U.num(U.sum(rows, (r) => r.days * (r.w.headcount || 1)), 1)], ['Brüt yevmiye', U.money(U.sum(rows, (r) => r.gross))], ['Avans', U.money(U.sum(rows, (r) => r.advance))], ['Net ödenecek', U.money(U.sum(rows, (r) => r.net))]] },
        { heading: 'Kişi / ekip bazında puantaj ve hakediş', cols: [T('Personel'), T('Görev'), N('Tam'), N('Yarım'), N('F.Mesai'), N('İzinli'), N('Devamsız'), N('Gün'), M('Yevmiye'), M('Brüt'), M('Avans'), M('Net')],
          rows: rows.map((r) => [r.w.name, r.w.role, r.counts.T, r.counts.Y, r.counts.FM, r.counts.I, r.counts.D, Math.round(r.days * 10) / 10, r.w.wage, r.gross, r.advance, r.net]), totals: ['Toplam', '', '', '', '', '', '', Math.round(U.sum(rows, (r) => r.days) * 10) / 10, '', U.sum(rows, (r) => r.gross), U.sum(rows, (r) => r.advance), U.sum(rows, (r) => r.net)] },
        { heading: 'Ekip bazlı özet', cols: [T('Görev'), N('Kayıt'), N('Adam-gün'), M('Brüt')], rows: Object.entries(byRole).map(([k, v]) => [k, v.n, Math.round(v.days * 10) / 10, v.gross]) }], note: 'Fazla mesai çarpanı: ×' + SS.cfg.overtime + ' · T: Tam gün, Y: Yarım gün, FM: Fazla mesai.' };
  };
  R.stock = () => {
    const rows = C.scope('materials').map((m) => ({ m, s: C.stock(m), use: C.usage(m), d: C.daysLeft(m) })).sort((a, b) => (b.m.critical > 0 && b.s <= b.m.critical) - (a.m.critical > 0 && a.s <= a.m.critical) || a.m.name.localeCompare(b.m.name, 'tr'));
    const crit = rows.filter((r) => r.m.critical > 0 && r.s <= r.m.critical);
    return { title: 'Stok Durumu', project: scopeName(), meta: [['Kalem', String(rows.length)]],
      sections: [{ heading: 'Özet', kpis: [['Malzeme kalemi', String(rows.length)], ['Kritik stok', String(crit.length)], ['Stok değeri', U.money(U.sum(rows, (r) => r.s * (r.m.price || 0)))], ['Rapor tarihi', U.fmtDate(U.today())]] },
        { heading: 'Stok listesi', cols: [T('Malzeme'), T('Kategori'), T('Birim'), N('Mevcut'), N('Kritik seviye'), N('Günlük tüketim'), N('Tahmini bitiş (gün)'), T('Durum'), M('Stok değeri')],
          rows: rows.map((r) => [r.m.name, r.m.category, r.m.unit, Math.round(r.s * 10) / 10, r.m.critical, Math.round(r.use * 10) / 10, isFinite(r.d) ? Math.ceil(r.d) : '—', r.m.critical > 0 && r.s <= r.m.critical ? 'KRİTİK' : 'Yeterli', r.s * (r.m.price || 0)]) }] };
  };
  R.hakedis = () => {
    const rows = C.scope('hakedis').slice().sort((a, b) => a.date.localeCompare(b.date)), con = (h) => SS.D.contracts.find((c) => c.id === h.contractId) || {};
    const ap = rows.filter((h) => h.status !== 'Taslak');
    return { title: 'Hakediş Özeti', project: scopeName(), meta: [['Hakediş', String(rows.length)]],
      sections: [{ heading: 'Özet', kpis: [['Onaylı hakediş', U.money(U.sum(ap, (h) => h.total))], ['Ödenen / tahsil edilen', U.money(U.sum(ap, (h) => h.paidAmount || 0))], ['Kalan borç', U.money(U.sum(ap.filter((h) => con(h).dir !== 'gelir'), (h) => h.total - (h.paidAmount || 0)))], ['Kalan alacak', U.money(U.sum(ap.filter((h) => con(h).dir === 'gelir'), (h) => h.total - (h.paidAmount || 0)))]] },
        { heading: 'Hakediş listesi', cols: [N('No'), T('Sözleşme'), T('Firma'), T('Yön'), T('Tarih'), N('Küm. %'), M('Brüt'), M('Kesinti'), M('KDV'), M('Net'), M('Ödenen'), T('Durum')],
          rows: rows.map((h) => [h.no, con(h).title || '—', firm(con(h).firmId), con(h).dir === 'gelir' ? 'Tahsilat' : 'Ödeme', U.fmtDate(h.date), h.cumPct, h.gross, h.retention + h.stamp + h.advance + h.other, h.kdv, h.total, h.paidAmount || 0, h.status]) }] };
  };
  R.sales = () => {
    const units = C.scope('units'), us = C.unitStats(units), sold = units.filter((u) => u.status === 'Satıldı'), t = U.today();
    const od = C.installments().filter((p) => !p.paid && p.due < t);
    return { title: 'Satış & Tahsilat Raporu', project: scopeName(), meta: [['Toplam daire', String(us.total)], ['Satılan', String(us.sold)]],
      sections: [{ heading: 'Özet', kpis: [['Satış cirosu', U.money(us.revenue)], ['Tahsil edilen', U.money(us.collected)], ['Kalan alacak', U.money(us.receivable)], ['Geciken', U.money(us.overdue)]] },
        { heading: 'Satılan daireler', cols: [T('Daire'), T('Müşteri'), T('Tip'), N('m²'), M('Satış fiyatı'), M('Peşinat'), M('Tahsil edilen'), M('Kalan'), T('Satış tarihi')], rows: sold.map((u) => { const paid = U.sum((u.plan || []).filter((p) => p.paid), (p) => p.amount); return [u.no, (SS.D.customers.find((c) => c.id === u.customerId) || {}).name || '—', u.type, u.m2, u.salePrice, u.downPayment, paid, u.salePrice - paid, U.fmtDate(u.saleDate)]; }) },
        { heading: 'Geciken taksitler', cols: [T('Vade'), T('Müşteri'), T('Daire'), T('Taksit'), M('Tutar'), N('Gecikme (gün)')], rows: od.map((p) => [U.fmtDate(p.due), (p.customer || {}).name || '—', p.unit.no, p.kind, p.amount, -U.diff(t, p.due)]) }] };
  };
  R.contracts = () => {
    const rows = C.scope('contracts');
    return { title: 'Sözleşme Listesi', project: scopeName(), meta: [['Sözleşme', String(rows.length)]],
      sections: [{ heading: 'Sözleşmeler', cols: [T('Sözleşme'), T('Firma'), T('Tür'), M('Tutar'), T('Başlangıç'), T('Bitiş'), N('Kalan gün'), N('İlerleme %'), M('Hakediş'), M('Bakiye'), T('Durum')], rows: rows.map((c) => { const s = C.contractStats(c); return [c.title, firm(c.firmId), c.kind, c.amount, U.fmtDate(c.start), U.fmtDate(c.end), C.contractDays(c), Math.round(s.cumPct || c.progress || 0), s.billed, s.balance, c.status]; }) }] };
  };
  R.machines = () => {
    const rows = C.scope('machines'), from = U.addDays(U.today(), -29);
    return { title: 'Makine Parkı Raporu', project: scopeName(), meta: [['Makine', String(rows.length)], ['Yakıt birim fiyatı', U.money2(SS.cfg.fuelPrice) + '/lt']],
      sections: [{ heading: 'Makine durumu (son 30 gün)', cols: [T('Makine'), T('Tür'), T('Mülkiyet'), N('Sayaç (sa)'), N('30 gün çalışma (sa)'), N('Yakıt (lt)'), M('Yakıt tutarı'), N('Sonraki bakım (sa)'), N('Kalan (sa)'), T('Durum')], rows: rows.map((m) => { const l = SS.D.machineLogs.filter((x) => x.machineId === m.id && x.date >= from), fuel = U.sum(l, (x) => x.fuel); return [m.name, m.type, m.own, m.hours, U.sum(l, (x) => x.hours), fuel, fuel * SS.cfg.fuelPrice, C.machineNext(m) ?? '—', C.machineRemain(m) ?? '—', m.status]; }) }] };
  };
  R.dailyReport = (date, pid) => {
    const p = pid || (C.active() !== 'all' ? C.active() : ((SS.D.projects.find((x) => x.status === 'active') || SS.D.projects[0] || {}).id || '')), dr = SS.D.diary.find((d) => d.date === date && d.projectId === p);
    const ws = SS.D.workers.filter((w) => w.projectId === p && w.active !== false), day = SS.D.attendance[date] || {}, mats = SS.D.movements.filter((m) => m.projectId === p && m.date === date), exp = SS.D.expenses.filter((e) => e.projectId === p && e.date === date), sf = SS.D.safety.find((s) => s.projectId === p && s.date === date);
    const present = ws.filter((w) => ['T', 'Y', 'FM'].includes(day[w.id]));
    return { title: 'Günlük Şantiye Raporu', project: ui.projectName(p), meta: [['Tarih', `${U.fmtDate(date)} ${U.dayName(date)}`], ['Hazırlayan', SS.cfg.user]],
      sections: [{ heading: 'Genel durum', kpis: [['Hava', dr ? `${dr.weather} ${dr.temp ?? ''}°C` : '—'], ['Sahadaki kişi', String(U.sum(present, (w) => w.headcount || 1))], ['İş durması', dr && dr.stopped ? `${dr.stopHours} saat` : 'Yok'], ['İSG skoru', sf ? '%' + sf.score : '—']] },
        { heading: 'Yapılan işler', cols: [T('Özet')], rows: [[dr ? dr.work : 'Bu tarih için defter kaydı bulunmuyor.']], note: dr && dr.stopped ? 'İş durma nedeni: ' + dr.stopReason : '' },
        { heading: 'Puantaj', cols: [T('Personel'), T('Görev'), T('Durum')], rows: ws.filter((w) => day[w.id]).map((w) => [w.name, w.role, SS.C.att[day[w.id]].label]) },
        { heading: 'Malzeme hareketleri', cols: [T('Tür'), T('Malzeme'), N('Miktar'), T('Detay')], rows: mats.map((m) => { const x = SS.D.materials.find((y) => y.id === m.materialId) || {}; return [m.type === 'giris' ? 'Giriş' : 'Çıkış', x.name, m.qty, m.type === 'giris' ? `İrsaliye ${m.waybill || '—'} · ${firm(m.firmId)}` : 'Alan: ' + (m.area || '—')]; }) },
        { heading: 'Harcamalar', cols: [T('Açıklama'), T('Kategori'), M('Tutar')], rows: exp.map((e) => [e.desc, e.category, e.amount]), totals: ['Toplam', '', U.sum(exp, (e) => e.amount)] }] };
  };
  R.firmStatement = (fid) => {
    const f = C.firm(fid), my = SS.D.expenses.filter((e) => e.firmId === fid).sort((a, b) => a.date.localeCompare(b.date)), tot = U.sum(my, (e) => e.amount), paid = U.sum(my.filter((e) => e.status === 'Ödendi'), (e) => e.amount);
    return { title: 'Cari Hesap Ekstresi', project: f.name, meta: [['Firma türü', f.type], ['Telefon', f.phone || '—']], sections: [{ heading: 'Bakiye özeti', kpis: [['Toplam işlem', U.money(tot)], ['Ödenen', U.money(paid)], ['Kalan borç', U.money(tot - paid)], ['Kayıt', String(my.length)]] },
      { heading: 'Hareketler', cols: [T('Tarih'), T('Açıklama'), T('Şantiye'), M('Tutar'), T('Durum'), T('Vade')], rows: my.map((e) => [U.fmtDate(e.date), e.desc, ui.projectName(e.projectId), e.amount, C.expStatus(e), e.dueDate && e.status !== 'Ödendi' ? U.fmtDate(e.dueDate) : '']), totals: ['', 'Toplam', '', tot, '', ''] }] };
  };
  R.hakedisSlip = (hid) => {
    const h = SS.store.find('hakedis', hid), c = SS.D.contracts.find((x) => x.id === h.contractId), gelir = c.dir === 'gelir';
    return { title: `Hakediş Raporu No: ${h.no}`, project: ui.projectName(h.projectId), meta: [['Sözleşme', c.title], ['Firma', firm(c.firmId)], ['Tarih', U.fmtDate(h.date)], ['Durum', h.status]],
      sections: [{ heading: 'İlerleme', kpis: [['Sözleşme tutarı', U.money(c.amount)], ['Önceki kümülatif', '%' + U.num(h.prevPct, 1)], ['Bu hakediş kümülatif', '%' + U.num(h.cumPct, 1)], ['Bu dönem', '%' + U.num(h.cumPct - h.prevPct, 1)]] },
        { heading: 'Hesaplama', cols: [T('Kalem'), M('Tutar')], rows: [['Bu dönem hakediş tutarı', h.gross], [`Teminat kesintisi (%${h.retentionPct})`, -h.retention], ['Damga vergisi (‰9,48)', -h.stamp], ['Avans mahsubu', -h.advance], ['Diğer kesintiler', -h.other], [`KDV (%${h.kdvPct})`, h.kdv]], totals: [gelir ? 'Tahsil edilecek net tutar' : 'Ödenecek net tutar', h.total] },
        { heading: gelir ? 'Tahsilat durumu' : 'Ödeme durumu', cols: [T('Tarih'), M('Tutar')], rows: (h.payments || []).map((p) => [U.fmtDate(p.date), p.amount]), totals: ['Kalan', h.total - (h.paidAmount || 0)] }], note: h.note || '' };
  };
  R.contractSummary = (cid) => {
    const c = SS.store.find('contracts', cid), s = C.contractStats(c);
    return { title: 'Sözleşme Özeti', project: ui.projectName(c.projectId), meta: [['Firma', firm(c.firmId)], ['Tür', c.kind]], sections: [{ heading: c.title, cols: [T('Madde'), T('Bilgi')], rows: [['Sözleşme bedeli', U.money2(c.amount)], ['Süre', `${U.fmtDate(c.start)} – ${U.fmtDate(c.end)}`], ['Teminat kesintisi', '%' + c.retention], ['Ödeme koşulları', c.terms || '—'], ['Gerçekleşen ilerleme', '%' + U.num(s.cumPct || c.progress || 0, 1)], ['Onaylı hakediş', U.money2(s.billed)], [gelirLabel(c, 'paid'), U.money2(s.paid)], ['Kalan bakiye', U.money2(s.balance)], ['Ekli belge', String((c.docs || []).length)]] }] };
  };
  const gelirLabel = (c) => (c.dir === 'gelir' ? 'Tahsil edilen' : 'Ödenen');
  R.saleContract = (uid) => {
    const u = SS.store.find('units', uid), c = SS.D.customers.find((x) => x.id === u.customerId) || {}, p = C.proj(u.projectId) || {};
    return { title: 'Konut Satış Sözleşmesi (Özet)', project: p.name, meta: [['Daire', u.no], ['Satış tarihi', U.fmtDate(u.saleDate)]],
      sections: [{ heading: 'Taraflar', cols: [T('Taraf'), T('Bilgi')], rows: [['Satıcı', SS.cfg.company], ['Alıcı', c.name || '—'], ['Alıcı telefon', c.phone || '—']] },
        { heading: 'Taşınmaz', cols: [T('Özellik'), T('Bilgi')], rows: [['Proje', p.name], ['Blok / kat / daire', `${u.block} Blok · ${u.floor}. kat · ${u.no}`], ['Tip / brüt alan', `${u.type} · ${u.m2} m²`], ['Liste fiyatı', U.money2(u.listPrice)], ['Satış bedeli', U.money2(u.salePrice)]] },
        { heading: 'Ödeme planı', cols: [T('Vade'), T('Taksit'), M('Tutar'), T('Durum')], rows: (u.plan || []).map((i) => [U.fmtDate(i.due), i.kind, i.amount, i.paid ? 'Tahsil edildi ' + U.fmtDate(i.paidDate) : 'Bekliyor']), totals: ['', 'Toplam', U.sum(u.plan || [], (i) => i.amount), ''] }], note: 'Bu belge sistem kayıtlarından üretilmiş bir özettir; hukuki bağlayıcılığı için noter onaylı asıl sözleşme esas alınmalıdır.' };
  };
  R.build = (key) => (key === 'daily' ? R.dailyReport(ui.vs('reports', { date: U.today() }).date) : R[key]());

  /* ---------- rapor merkezi ---------- */
  SS.css(`
  .rcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
  .rcard{padding:16px;display:flex;flex-direction:column;gap:10px;text-align:left;cursor:pointer;border:1.5px solid var(--line);background:var(--surface);border-radius:var(--r);transition:all .18s var(--ease);box-shadow:var(--shadow)}
  .rcard:hover{transform:translateY(-2px)}.rcard.on{border-color:var(--brand);background:var(--brand-soft)}.rcard .kpi-ic{margin:0}.rcard b{font-size:15px}.rcard small{color:var(--muted);font-size:12.5px;line-height:1.4}
  .rframe{width:100%;height:72vh;min-height:420px;border:1px solid var(--line);border-radius:14px;background:#fff}
  @media(max-width:699px){.rcards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.rcard{padding:12px;gap:8px}.rcard small{display:none}.rcard b{font-size:14px}.rframe{height:60vh}}
  .rhist{display:flex;flex-direction:column}.rh{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line-2)}.rh:first-child{border-top:0}.rh .kpi-ic{width:36px;height:36px;margin:0}
  `);
  const CARDS = [
    { k: 'daily', t: 'Günlük Şantiye Raporu', d: 'Hava, çalışan sayısı, yapılan işler, puantaj, malzeme hareketleri ve harcamalar', i: 'book' },
    { k: 'payroll', t: 'Aylık Puantaj Cetveli', d: 'Kişi / ekip bazlı gün sayıları, avans ve net hakediş-maaş hesabı', i: 'users' },
    { k: 'expenses', t: 'Harcama Dökümü', d: 'Kategori özeti ve tüm harcama kalemleri (Harcama sayfasındaki filtrelerle)', i: 'receipt' },
    { k: 'stock', t: 'Stok Durumu', d: 'Mevcut miktar, kritik seviye, tüketim hızı ve tahmini bitiş süresi', i: 'box' },
    { k: 'hakedis', t: 'Hakediş Özeti', d: 'Taşeron ve işveren hakedişleri, kesintiler, ödenen ve kalan tutarlar', i: 'clipboard' },
    { k: 'sales', t: 'Satış & Tahsilat', d: 'Satılan daireler, tahsilat durumu ve geciken taksitler', i: 'tag' },
    { k: 'contracts', t: 'Sözleşme Listesi', d: 'Tüm sözleşmeler, süreler, ilerleme ve bakiyeler', i: 'file' },
    { k: 'machines', t: 'Makine Parkı', d: 'Çalışma saati, yakıt tüketimi ve bakım durumu', i: 'truck' },
  ];
  function previewBody() {
    const s = ui.vs('reports', { type: 'daily', date: U.today() }), def = R.build(s.type), card = CARDS.find((c) => c.k === s.type);
    return `<div class="card pad stack"><div class="row between wrap"><div><h3>${esc(def.title)}</h3><p class="sub">Önizleme · ${esc(def.project)}</p></div><div class="row wrap">
      <button class="btn primary" data-action="rep.out" data-fmt="pdf">${I('printer')}PDF / Yazdır</button><button class="btn" data-action="rep.out" data-fmt="xlsx">${I('sheet')}Excel (.xlsx)</button><button class="btn" data-action="rep.out" data-fmt="csv">${I('file')}CSV</button>${ui.isApp() ? '' : `<button class="btn ghost" data-action="rep.tab">${I('eye')}Yeni sekmede aç</button>`}</div></div>
      <iframe class="rframe" title="${esc(def.title)}" srcdoc="${esc(SS.exp.doc(def))}"></iframe></div>`;
  }
  SS.views.reports = {
    title: 'Raporlar',
    render() {
      const s = ui.vs('reports', { type: 'daily', date: U.today() }), wf = ui.vs('workforce', { month: U.monthKey(U.today()) }), ex = ui.vs('expenses', { from: '', to: '' });
      const hist = SS.D.reports.slice(0, 8);
      const param = s.type === 'daily' ? `<label class="filt"><span>Rapor tarihi</span><input class="select" type="date" value="${s.date}" max="${U.today()}" data-vs="reports.date" data-upd="rep-prev"></label>`
        : s.type === 'payroll' ? `<label class="filt"><span>Dönem</span><select class="select" data-vs="workforce.month" data-upd="rep-prev">${ui.opts(U.monthsBack(12).reverse().map((m) => [m, U.monthLabel(m)]), wf.month)}</select></label>`
        : s.type === 'expenses' ? `<label class="filt"><span>Başlangıç</span><input class="select" type="date" value="${ex.from || ''}" data-vs="expenses.from" data-upd="rep-prev"></label><label class="filt"><span>Bitiş</span><input class="select" type="date" value="${ex.to || ''}" data-vs="expenses.to" data-upd="rep-prev"></label>` : '';
      return `<div class="page">${ui.head({ title: 'Raporlar', sub: 'Kurumsal başlıklı PDF ve Excel çıktıları · şantiye filtresi üst menüdeki seçime göre uygulanır' })}
        <div class="rcards">${CARDS.map((c) => `<button class="rcard ${c.k === s.type ? 'on' : ''}" data-action="rep.pick" data-k="${c.k}"><span class="kpi-ic tone-brand">${I(c.i)}</span><b>${c.t}</b><small>${c.d}</small></button>`).join('')}</div>
        ${param ? `<div class="toolbar">${param}</div>` : ''}${ui.region('rep-prev', previewBody)}
        <div class="card"><div class="card-h"><h3>Rapor Geçmişi</h3></div><div class="card-b rhist">${hist.length ? hist.map((h) => `<div class="rh"><span class="kpi-ic tone-info">${I(h.fmt === 'pdf' ? 'printer' : 'sheet')}</span><div class="grow"><b style="font-size:14px">${esc(h.title)}</b><div class="sub">${esc(h.project || '')} · ${U.fmtDate(h.date)}</div></div>${ui.badge(h.fmt.toUpperCase(), 'muted')}</div>`).join('') : '<p class="muted">Henüz rapor alınmadı</p>'}</div></div></div>`;
    },
  };
  SS.actions['rep.pick'] = (el) => { ui.vs('reports').type = el.dataset.k; ui.rerender(); };
  SS.actions['rep.out'] = (el) => { SS.exp.save(R.build(ui.vs('reports').type), el.dataset.fmt); ui.rerender(); };
  SS.actions['rep.tab'] = () => SS.exp.preview(R.build(ui.vs('reports').type));
})();
