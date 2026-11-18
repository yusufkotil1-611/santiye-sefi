/* Satın Alma & Talepler — talep → onay → sipariş → teslim akışı, stoğa giriş ve tedarikçiye WhatsApp */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;
  const FLOW = ['Talep', 'Onaylandı', 'Sipariş', 'Teslim'], TONE = { Talep: 'info', Onaylandı: 'brand', Sipariş: 'warn', Teslim: 'ok', İptal: 'muted' };
  const NEXT = { Talep: ['Onayla', 'check'], Onaylandı: ['Sipariş ver', 'send'], Sipariş: ['Teslim al', 'box'] };
  const PRI = { Düşük: 'muted', Orta: 'info', Yüksek: 'warn', Kritik: 'bad' };

  SS.css(`
  .flow{display:flex;align-items:center;gap:0;flex-wrap:wrap}.flow span{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:650;color:var(--muted);padding:6px 12px;border-radius:99px;background:var(--surface-2);border:1px solid var(--line-2)}
  .flow i{width:18px;height:2px;background:var(--line);display:block}.flow span.on{background:var(--brand-soft);color:var(--brand-text);border-color:transparent}.flow span.done{color:var(--ok-text);background:var(--ok-soft);border-color:transparent}
  `);

  const total = (o) => (o.qty || 0) * (o.price || 0);
  function rows() {
    const st = ui.vs('orders', { q: '', tab: 'open' });
    return C.scope('orders').filter((o) => (st.tab === 'all' ? true : st.tab === 'open' ? C.orderOpen(o) : o.status === st.tab) && U.match(st.q, o.item, o.no, ui.firmName(o.firmId), o.requestedBy)).sort((a, b) => (C.orderOpen(b) - C.orderOpen(a)) || (a.needBy || '9').localeCompare(b.needBy || '9'));
  }
  function body() {
    const list = rows();
    if (!C.scope('orders').length) return `<div class="card pad">${ui.empty('receipt', 'Henüz talep yok', 'Eksik malzemeler için talep açın; onay, sipariş ve teslim aşamalarını takip edin. Teslim aldığınızda stoğa tek dokunuşla girebilirsiniz.', `<div class="row wrap" style="justify-content:center"><button class="btn primary" data-action="order.new">${I('plus')}İlk Talebi Oluştur</button><button class="btn" data-action="order.fromStock">${I('box')}Kritik stoklardan oluştur</button></div>`)}</div>`;
    return `<div class="card">${ui.table({ cols: [
      { h: 'Talep', c: (o) => `<div class="t-main">${esc(o.item)}</div><div class="t-sub">${esc(o.no || '')} · ${U.num(o.qty, 1)} ${esc(o.unit || '')}${o.requestedBy ? ' · ' + esc(o.requestedBy) : ''}</div>` },
      { h: 'Tedarikçi', c: (o) => esc(ui.firmName(o.firmId)) },
      { h: 'İhtiyaç', c: (o) => { const d = o.needBy ? U.diff(U.today(), o.needBy) : null; return o.needBy ? `${U.fmtDate(o.needBy)}<div class="t-sub ${C.orderOpen(o) && d < 0 ? 'neg' : ''}">${C.orderOpen(o) ? (d < 0 ? -d + ' gün gecikti' : d === 0 ? 'bugün' : d + ' gün kaldı') : ''}</div>` : '—'; } },
      { h: 'Tutar', cls: 'num', c: (o) => (total(o) ? U.money(total(o)) : '—') },
      { h: 'Öncelik', c: (o) => ui.badge(o.priority || 'Orta', PRI[o.priority || 'Orta']) },
      { h: 'Durum', c: (o) => ui.badge(o.status, TONE[o.status]) },
      { h: '', act: true, c: (o) => `${NEXT[o.status] ? `<button class="btn sm soft" data-action="order.next" data-id="${o.id}">${I(NEXT[o.status][1])}${NEXT[o.status][0]}</button>` : ''}${C.orderOpen(o) ? `<button class="btn sm ghost" data-action="order.send" data-id="${o.id}" aria-label="Tedarikçiye gönder" title="Tedarikçiye mesaj">${I('phone')}</button>` : ''}<button class="btn sm ghost" data-action="order.edit" data-id="${o.id}">${I('edit')}</button>` },
    ], rows: list, empty: 'Bu görünümde talep yok' })}</div>`;
  }

  SS.views.orders = {
    title: 'Satın Alma',
    render() {
      const st = ui.vs('orders', { q: '', tab: 'open' }), all = C.scope('orders'), open = all.filter(C.orderOpen), late = open.filter((o) => o.needBy && o.needBy < U.today()), mk = U.monthKey(U.today());
      const cnt = (s) => all.filter((o) => o.status === s).length;
      return `<div class="page">${ui.head({ title: 'Satın Alma & Talepler', sub: 'Malzeme talebinden teslimata kadar tüm süreç tek yerde', actions: `${SS.exp.menu('orders')}<button class="btn" data-action="order.fromStock">${I('box')}Kritik stoklardan</button><button class="btn primary" data-action="order.new">${I('plus')}Talep Oluştur</button>` })}
        <div class="grid g-4 kpis">${ui.kpi({ label: 'Açık talep', value: open.length, fmt: 'num', icon: 'receipt', tone: 'info', sub: 'onay / sipariş / teslim bekleyen' })}
          ${ui.kpi({ label: 'Tarihi geçen', value: late.length, fmt: 'num', icon: 'alert', tone: late.length ? 'bad' : 'ok', sub: 'ihtiyaç tarihi geçmiş' })}
          ${ui.kpi({ label: 'Açık sipariş bedeli', value: U.sum(open, total), fmt: 'compact', icon: 'wallet', tone: 'warn', sub: 'birim fiyatı girilenler' })}
          ${ui.kpi({ label: 'Bu ay teslim', value: all.filter((o) => o.status === 'Teslim' && U.monthKey(o.deliveredDate || o.date || '') === mk).length, fmt: 'num', icon: 'box', tone: 'ok', sub: 'teslim alınan talep' })}</div>
        <div class="card pad"><div class="flow">${FLOW.map((s, i) => `${i ? '<i></i>' : ''}<span class="${cnt(s) ? 'on' : ''}">${s}${cnt(s) ? ` · ${cnt(s)}` : ''}</span>`).join('')}</div></div>
        ${ui.tabs('orders', 'tab', [['open', 'Açık', open.length], ['all', 'Tümü', all.length], ['Teslim', 'Teslim edilen', cnt('Teslim')], ['İptal', 'İptal', cnt('İptal')]], st.tab)}
        ${ui.toolbar({ view: 'orders', ph: 'Kalem, firma veya talep no ara…', upd: 'orders-body' })}${ui.region('orders-body', body)}</div>`;
    },
  };

  function form(o) {
    const e = !!o, pid = C.active() !== 'all' ? C.active() : (SS.D.projects[0] || {}).id, mats = C.scope('materials');
    const values = e ? Object.assign({}, o, { itemName: o.item }) : { projectId: pid, needBy: U.addDays(U.today(), 5), priority: 'Orta', status: 'Talep', unit: 'adet', requestedBy: SS.cfg.user };
    ui.form({
      title: e ? `Talebi Düzenle · ${o.no || ''}` : 'Yeni Satın Alma Talebi', values, wide: true,
      fields: [
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true },
        { name: 'materialId', label: 'Stok kartından seç (isteğe bağlı)', type: 'select', options: [['', '— Serbest giriş —'], ...mats.map((m) => [m.id, `${m.name} (${m.unit})`])] },
        { name: 'itemName', label: 'Malzeme / hizmet', required: true, placeholder: 'ör. CEM II 32,5 çimento' },
        { name: 'qty', label: 'Miktar', type: 'number', required: true, min: 0.001, step: 'any' }, { name: 'unit', label: 'Birim', type: 'select', options: SS.C.units },
        { name: 'firmId', label: 'Tedarikçi', type: 'select', options: ui.firmOpts(['Tedarikçi', 'Taşeron']) }, { name: 'price', label: 'Birim fiyat (₺)', type: 'money', min: 0 },
        { name: 'needBy', label: 'İhtiyaç tarihi', type: 'date' }, { name: 'priority', label: 'Öncelik', type: 'select', options: SS.C.priorities },
        ...(e ? [{ name: 'status', label: 'Durum', type: 'select', options: [...FLOW, 'İptal'] }] : []), { name: 'requestedBy', label: 'Talep eden', half: true },
        { name: 'note', label: 'Not', type: 'textarea', rows: 2 },
      ],
      onInput(v, a, f) { const m = mats.find((x) => x.id === v.materialId); if (m && v.materialId !== a._last) { a._last = v.materialId; f.elements.itemName.value = m.name; f.elements.unit.value = m.unit; if (m.price && !f.elements.price.value) f.elements.price.value = m.price; } },
      danger: e ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Talep silinsin mi?', text: esc(o.item) })) { SS.store.del('orders', o.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) {
        const d = { projectId: v.projectId, materialId: v.materialId, item: v.itemName, qty: v.qty, unit: v.unit, firmId: v.firmId, price: v.price || 0, needBy: v.needBy, priority: v.priority, requestedBy: v.requestedBy, note: v.note };
        if (e) { d.status = v.status; if (v.status === 'Teslim' && !o.deliveredDate) d.deliveredDate = U.today(); SS.store.upd('orders', o.id, d); } else SS.store.add('orders', Object.assign(d, { no: C.nextOrderNo(), status: 'Talep', date: U.today() }), 'o');
        ui.rerender(); ui.toast(e ? 'Talep güncellendi' : 'Talep oluşturuldu');
      },
    });
  }
  SS.actions['order.new'] = () => form(null);
  SS.actions['order.edit'] = (el) => form(SS.store.find('orders', el.dataset.id));
  SS.actions['order.next'] = async (el) => {
    const o = SS.store.find('orders', el.dataset.id), i = FLOW.indexOf(o.status), nx = FLOW[i + 1]; if (!nx) return;
    if (nx === 'Teslim') {
      SS.store.upd('orders', o.id, { status: 'Teslim', deliveredDate: U.today() }); ui.rerender(); ui.toast('Teslim alındı olarak işaretlendi');
      if (o.materialId && SS.store.find('materials', o.materialId) && (await ui.confirm({ title: 'Stoğa giriş yapılsın mı?', text: `<b>${esc(o.item)}</b> — ${U.num(o.qty, 1)} ${esc(o.unit)} için malzeme girişi formunu açayım mı?`, ok: 'Evet, aç', danger: false }))) SS.actions['stock.in']({ dataset: { mid: o.materialId } });
      return;
    }
    SS.store.upd('orders', o.id, { status: nx }); ui.rerender(); ui.toast(`Durum: ${nx}`);
  };
  const orderText = (o) => `Merhaba, ${SS.cfg.company ? SS.cfg.company + ' şantiyesi için ' : ''}aşağıdaki malzemeyi temin edebilir misiniz?\n\n• ${o.item}: ${U.num(o.qty, 1)} ${o.unit || ''}\n${o.needBy ? `• İstenen teslim tarihi: ${U.fmtDate(o.needBy)}\n` : ''}${ui.projectName(o.projectId) !== '—' ? `• Şantiye: ${ui.projectName(o.projectId)}\n` : ''}\nFiyat ve teslim süresi bilgisi rica ederim. ${SS.cfg.user}`;
  SS.actions['order.send'] = (el) => { const o = SS.store.find('orders', el.dataset.id), f = SS.store.find('firms', o.firmId); ui.share(orderText(o), f && f.phone); };
  SS.actions['order.fromStock'] = () => { if (!SS.D.projects.length) return SS.actions['proj.new'](); SS.actions['ai.mkOrders'](); };

  SS.reports.orders = () => { const l = C.scope('orders').slice().sort((a, b) => (a.no || '').localeCompare(b.no || '')); return { title: 'Satın Alma Talepleri', project: C.active() === 'all' ? 'Tüm şantiyeler' : ui.projectName(C.active()), meta: [['Talep', String(l.length)], ['Açık', String(l.filter(C.orderOpen).length)]], sections: [{ heading: 'Talepler', cols: [{ h: 'No' }, { h: 'Kalem' }, { h: 'Miktar', num: true }, { h: 'Birim' }, { h: 'Tedarikçi' }, { h: 'İhtiyaç' }, { h: 'Tutar', money: true }, { h: 'Durum' }], rows: l.map((o) => [o.no, o.item, o.qty, o.unit, ui.firmName(o.firmId), o.needBy ? U.fmtDate(o.needBy) : '', total(o), o.status]), totals: ['', 'Toplam', '', '', '', '', U.sum(l, total), ''] }] }; };
})();
