/* Satış Yönetimi — daire matrisi, müşteriler ve tahsilat takibi */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;

  SS.css(`
  .legend-row{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--ink-2)}.legend-row span{display:inline-flex;align-items:center;gap:7px}.legend-row i{width:14px;height:14px;border-radius:5px;border:1.5px solid}
  .lg-free{background:var(--ok-soft);border-color:var(--ok)!important}.lg-res{background:var(--warn-soft);border-color:var(--warn)!important;border-style:dashed!important}.lg-sold{background:#2b343e;border-color:#2b343e!important}
  .bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
  .block{padding:16px 16px 14px}.block-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px}.block-h h3{font-size:16px;letter-spacing:-.01em}
  .facade{display:flex;flex-direction:column;gap:6px;position:relative;padding-top:12px}
  .facade::before{content:"";position:absolute;top:0;left:34px;right:0;height:5px;border-radius:4px;background:var(--track)}
  .floor{display:grid;grid-template-columns:28px 1fr;gap:6px;align-items:center}.floor>b{font-size:11.5px;color:var(--muted);font-weight:700}
  .units{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  .unit{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:62px;padding:6px 2px;border-radius:11px;border:1.5px solid;cursor:pointer;transition:transform .15s var(--ease),box-shadow .15s,opacity .2s;font-size:11px;line-height:1.2;text-align:center}
  .unit:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.18);z-index:2}.unit.dim{opacity:.22}
  .u-no{font-weight:800;font-size:13.5px;letter-spacing:-.01em}.u-type{opacity:.85;font-size:10.5px}.u-p{font-weight:700;font-size:11px;font-variant-numeric:tabular-nums}
  .unit.s-free{background:var(--ok-soft);border-color:color-mix(in srgb,var(--ok) 55%,transparent);color:var(--ok-text)}
  .unit.s-res{background:var(--warn-soft);border-color:var(--warn);border-style:dashed;color:var(--warn-text)}
  .unit.s-sold{background:#2b343e;border-color:#2b343e;color:#fff}[data-theme=dark] .unit.s-sold{background:#3a4654;border-color:#4a5868}
  .u-od{position:absolute;top:4px;right:4px;width:8px;height:8px;border-radius:50%;background:#ff5a5f;box-shadow:0 0 0 2px #2b343e;animation:pulse 1.8s infinite}
  .cust-card{display:flex;gap:12px;align-items:center;padding:12px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)}.cust-card .av{width:42px;height:42px}
  .inst{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--line-2);font-size:14px}.inst:first-child{border-top:0}.inst .sub{display:block}
  .inst.od b.dt{color:var(--bad-text)}
  .gr-h{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;margin:6px 0 -4px}.gr-h em{font-style:normal}
  @media(max-width:699px){.bgrid{grid-template-columns:1fr}.block{padding:14px 12px}.inst{grid-template-columns:1fr auto}.inst .btn{grid-column:1/-1}}
  `);

  const today = () => U.today();
  const key = (s) => (s === 'Müsait' ? 'free' : s === 'Rezerve' ? 'res' : 'sold');
  const cust = (id) => SS.D.customers.find((c) => c.id === id);
  const overdue = (u) => (u.plan || []).some((p) => !p.paid && p.due < today());
  const custOf = (u) => (u.customerId ? (cust(u.customerId) || {}).name || '' : '');

  /* ---------------- daire matrisi ---------------- */
  function matrix() {
    const st = ui.vs('sales', { q: '', ustatus: '', utype: '' });
    const units = C.scope('units'); if (!units.length) return ui.empty('tag', 'Satış birimi tanımlı değil', 'Şantiyeniz için blok ve daireleri toplu olarak oluşturabilirsiniz.', `<button class="btn primary" data-action="unit.new">${I('plus')}Daireleri Oluştur</button>`);
    const match = (u) => (!st.ustatus || u.status === st.ustatus) && (!st.utype || u.type === st.utype) && U.match(st.q, u.no, custOf(u), u.type);
    const byProj = U.groupBy(units, (u) => u.projectId);
    return Object.entries(byProj).map(([pid, us]) => {
      const blocks = U.groupBy(us, (u) => u.block);
      return `${Object.keys(byProj).length > 1 ? `<div class="section-t">${esc(ui.projectName(pid))}</div>` : ''}<div class="bgrid">${Object.entries(blocks).map(([b, bu]) => {
        const floors = U.uniq(bu.map((u) => u.floor)).sort((a, c) => c - a), sold = bu.filter((u) => u.status === 'Satıldı').length;
        return `<div class="card block"><div class="block-h"><h3>${esc(b)} Blok</h3><span class="badge ${sold === bu.length ? 'ok' : 'muted'}">${sold}/${bu.length} satıldı</span></div>
          <div class="facade">${floors.map((f) => `<div class="floor"><b>${f}.K</b><div class="units">${bu.filter((u) => u.floor === f).sort((x, y) => parseInt(x.no.split('-')[1]) - parseInt(y.no.split('-')[1])).map((u) => `<button class="unit s-${key(u.status)} ${match(u) ? '' : 'dim'}" data-action="unit.open" data-id="${u.id}" aria-label="${esc(u.no)} ${u.status}"><span class="u-no">${esc(u.no)}</span><span class="u-type">${u.type} · ${u.m2}m²</span><span class="u-p">${U.compact(u.status === 'Satıldı' ? u.salePrice : u.listPrice).replace('₺', '')}</span>${overdue(u) ? '<i class="u-od" data-tip="Geciken taksit var"></i>' : ''}</button>`).join('')}</div></div>`).join('')}</div></div>`;
      }).join('')}</div>`;
    }).join('');
  }

  /* ---------------- müşteriler ---------------- */
  function custRows() {
    const q = (ui.vs('sales').cq || ''), units = C.scope('units'), all = C.active() === 'all';
    return SS.D.customers.map((c) => {
      const my = units.filter((u) => u.customerId === c.id), sold = my.filter((u) => u.status === 'Satıldı'), plan = sold.flatMap((u) => u.plan || []);
      return { c, my, sold, total: U.sum(sold, (u) => u.salePrice), paid: U.sum(plan.filter((p) => p.paid), (p) => p.amount), left: U.sum(plan.filter((p) => !p.paid), (p) => p.amount), od: U.sum(plan.filter((p) => !p.paid && p.due < today()), (p) => p.amount) };
    }).filter((r) => (all || r.my.length) && U.match(q, r.c.name, r.c.phone, r.my.map((u) => u.no).join(' '))).sort((a, b) => b.total - a.total);
  }
  function custBody() {
    const rows = custRows();
    return `<div class="card">${ui.table({ rows: rows.map((r) => Object.assign(r, { _attr: `data-action="cust.open" data-id="${r.c.id}" style="cursor:pointer"` })), empty: 'Müşteri bulunamadı', cols: [
      { h: 'Müşteri', c: (r) => `<div class="firm-av" style="display:flex;gap:12px;align-items:center">${ui.avatar(r.c.name, r.c.name.length)}<div><div class="t-main">${esc(r.c.name)}</div><div class="t-sub">${esc(r.c.phone || '—')}</div></div></div>` },
      { h: 'Daireler', c: (r) => (r.my.length ? r.my.map((u) => `<span class="badge ${u.status === 'Satıldı' ? 'ok' : 'warn'}">${esc(u.no)}</span>`).join(' ') : '<span class="muted">—</span>') },
      { h: 'Satış tutarı', cls: 'num', c: (r) => (r.total ? U.money(r.total) : '—') }, { h: 'Tahsil edilen', cls: 'num', c: (r) => (r.paid ? U.money(r.paid) : '—') },
      { h: 'Kalan', cls: 'num', c: (r) => (r.left ? U.money(r.left) : '—') }, { h: 'Geciken', cls: 'num', c: (r) => (r.od ? `<b class="neg">${U.money(r.od)}</b>` : '—') },
      { h: '', act: true, c: (r) => `${r.c.phone ? `<a class="btn sm ghost" href="tel:${esc(r.c.phone.replace(/\s/g, ''))}" aria-label="Ara">${I('phone')}</a>` : ''}<button class="btn sm ghost" data-action="cust.edit" data-id="${r.c.id}" aria-label="Düzenle">${I('edit')}</button>` },
    ] })}</div>`;
  }

  /* ---------------- tahsilat ---------------- */
  function collBody() {
    const st = ui.vs('sales', { cf: 'open' }), t = today(), all = C.installments();
    const mk = U.monthKey(t), months = [-2, -1, 0, 1, 2, 3, 4].map((n) => U.monthKey(U.addMonths(U.monthStart(mk), n)));
    const exp = months.map((m) => U.sum(all.filter((p) => U.monthKey(p.due) === m), (p) => p.amount)), col = months.map((m) => U.sum(all.filter((p) => p.paid && U.monthKey(p.paidDate || p.due) === m), (p) => p.amount));
    let rows = all.filter((p) => (st.cf === 'paid' ? p.paid : st.cf === 'late' ? !p.paid && p.due < t : !p.paid));
    rows = rows.sort((a, b) => (st.cf === 'paid' ? b.due.localeCompare(a.due) : a.due.localeCompare(b.due))).slice(0, 80);
    const week = U.sum(all.filter((p) => !p.paid && p.due >= t && p.due <= U.addDays(t, 7)), (p) => p.amount), month = U.sum(all.filter((p) => !p.paid && p.due >= t && p.due <= U.addDays(t, 30)), (p) => p.amount);
    return `<div class="grid g-4 kpis">${ui.kpi({ label: 'Geciken tahsilat', value: U.sum(all.filter((p) => !p.paid && p.due < t), (p) => p.amount), fmt: 'compact', icon: 'alert', tone: 'bad', sub: `${all.filter((p) => !p.paid && p.due < t).length} taksit` })}
      ${ui.kpi({ label: 'Önümüzdeki 7 gün', value: week, fmt: 'compact', icon: 'calendar', tone: 'warn' })}${ui.kpi({ label: 'Önümüzdeki 30 gün', value: month, fmt: 'compact', icon: 'clock', tone: 'info' })}
      ${ui.kpi({ label: 'Toplam kalan alacak', value: U.sum(all.filter((p) => !p.paid), (p) => p.amount), fmt: 'compact', icon: 'wallet', tone: 'brand' })}</div>
      <div class="card"><div class="card-h"><h3>Aylık Tahsilat <span class="muted fw">beklenen ve gerçekleşen</span></h3><div class="chart-legend"><span><i style="background:var(--s1)"></i>Beklenen</span><span><i style="background:var(--s3)"></i>Tahsil edilen</span></div></div><div class="card-b">${G.bars([{ name: 'Beklenen', color: 'var(--s1)', data: exp }, { name: 'Tahsil edilen', color: 'var(--s3)', data: col }], months.map(U.monthShort), { height: 210 })}</div></div>
      <div class="row between wrap">${ui.seg('sales', 'cf', [['open', 'Bekleyen'], ['late', 'Geciken'], ['paid', 'Tahsil edilen']], st.cf)}</div>
      <div class="card">${ui.table({ rows, empty: 'Bu görünümde taksit yok', cols: [
        { h: 'Vade', c: (p) => `<b class="${!p.paid && p.due < t ? 'neg' : ''}">${U.fmtDate(p.due)}</b><div class="t-sub">${p.paid ? 'tahsil: ' + U.fmtDate(p.paidDate) : U.relDays(p.due)}</div>` },
        { h: 'Müşteri', c: (p) => `<div class="t-main">${esc((p.customer || {}).name || '—')}</div><div class="t-sub">${esc((p.customer || {}).phone || '')}</div>` },
        { h: 'Daire', c: (p) => `<span class="badge brand">${esc(p.unit.no)}</span> <span class="t-sub">${esc(p.kind)}</span>` },
        { h: 'Tutar', cls: 'num', c: (p) => `<b>${U.money(p.amount)}</b>` },
        { h: 'Durum', c: (p) => (p.paid ? ui.badge('Tahsil edildi', 'ok') : p.due < t ? ui.badge('Gecikti', 'bad') : ui.badge('Bekliyor', 'muted')) },
        { h: '', act: true, c: (p) => (p.paid ? `<button class="btn sm ghost" data-action="inst.undo" data-uid="${p.unit.id}" data-iid="${p.id}">${I('undo')}Geri al</button>` : `<button class="btn sm ok" data-action="inst.pay" data-uid="${p.unit.id}" data-iid="${p.id}">${I('check')}Tahsil et</button>`) },
      ] })}</div>`;
  }

  /* ---------------- sayfa ---------------- */
  SS.views.sales = {
    title: 'Satış & Tahsilat',
    render() {
      const st = ui.vs('sales', { tab: 'matrix' }), us = C.unitStats();
      const tabs = ui.tabs('sales', 'tab', [['matrix', 'Daire Matrisi'], ['cust', 'Müşteriler'], ['coll', 'Tahsilat Takvimi', us.overdueN || null]], st.tab);
      const head = ui.head({ title: 'Satış & Tahsilat', sub: 'Blok-kat bazlı daire durumu, müşteri kartları ve taksit takibi', actions: `${SS.exp.menu('sales')}<button class="btn" data-action="unit.new">${I('building')}Daire Oluştur</button><button class="btn primary" data-action="cust.new">${I('plus')}Müşteri Ekle</button>` });
      const kpis = `<div class="grid g-4 kpis">${ui.kpi({ label: 'Satılan daire', value: us.sold, fmt: 'num', icon: 'tag', tone: 'ok', sub: `${us.total} daireden %${us.total ? U.num((us.sold / us.total) * 100) : 0} · ${us.reserved} rezerve · ${us.free} müsait` })}
        ${ui.kpi({ label: 'Satış cirosu', value: us.revenue, fmt: 'compact', icon: 'wallet', tone: 'brand', sub: 'satılan dairelerin toplamı' })}
        ${ui.kpi({ label: 'Tahsil edilen', value: us.collected, fmt: 'compact', icon: 'check', tone: 'ok', sub: `ciro'nun %${us.revenue ? U.num((us.collected / us.revenue) * 100) : 0}'i` })}
        ${ui.kpi({ label: 'Kalan alacak', value: us.receivable, fmt: 'compact', icon: 'clock', tone: us.overdueN ? 'warn' : 'info', sub: us.overdueN ? `${U.compact(us.overdue)} gecikmiş` : 'gecikme yok' })}</div>`;
      if (st.tab === 'cust') return `<div class="page">${head}${tabs}${ui.toolbar({ view: 'sales', ph: 'Müşteri, telefon veya daire no ara…', upd: 'cust-body' }).replace('data-vs="sales.q"', 'data-vs="sales.cq"').replace(/value="[^"]*"/, `value="${esc(st.cq || '')}"`)}${ui.region('cust-body', custBody)}</div>`;
      if (st.tab === 'coll') return `<div class="page">${head}${tabs}${ui.region('coll-body', collBody)}</div>`;
      return `<div class="page">${head}${kpis}${tabs}${ui.toolbar({ view: 'sales', ph: 'Daire no veya müşteri ara…', upd: 'sales-body', filters: [{ k: 'ustatus', label: 'Durum', opts: [['', 'Tümü'], ...SS.C.unitStatus] }, { k: 'utype', label: 'Tip', opts: [['', 'Tümü'], ...U.uniq(SS.D.units.map((u) => u.type)).sort()] }] })}
        <div class="legend-row"><span><i class="lg-free"></i>Müsait</span><span><i class="lg-res"></i>Rezerve</span><span><i class="lg-sold"></i>Satıldı</span><span><i style="background:#ff5a5f;border-radius:50%;border:0;width:9px;height:9px"></i>Geciken taksit</span></div>
        ${ui.region('sales-body', matrix)}</div>`;
    },
  };

  /* ---------------- daire çekmecesi ---------------- */
  let drawer = null;
  const unitHtml = (u) => {
    const c = cust(u.customerId), plan = u.plan || [], paid = U.sum(plan.filter((p) => p.paid), (p) => p.amount), t = today();
    let h = `<div class="row between wrap"><div><span class="badge ${u.status === 'Satıldı' ? 'ok' : u.status === 'Rezerve' ? 'warn' : 'info'}">${u.status}</span> <span class="muted" style="margin-left:6px">${esc(ui.projectName(u.projectId))} · ${esc(u.block)} Blok · ${u.floor}. kat</span></div></div>
      <dl class="kv" style="margin:14px 0"><dt>Tip / alan</dt><dd>${u.type} · ${u.m2} m²</dd><dt>Liste fiyatı</dt><dd>${U.money(u.listPrice)}</dd><dt>m² birim fiyatı</dt><dd>${U.money(u.listPrice / (u.m2 || 1))}</dd>${u.status === 'Satıldı' ? `<dt>Satış fiyatı</dt><dd>${U.money(u.salePrice)}</dd><dt>Satış tarihi</dt><dd>${U.fmtDate(u.saleDate)}</dd>` : ''}</dl>`;
    if (c) h += `<div class="cust-card">${ui.avatar(c.name, c.name.length)}<div class="grow"><b>${esc(c.name)}</b><div class="sub">${esc(c.phone || '')}${c.email ? ' · ' + esc(c.email) : ''}</div></div>${c.phone ? `<a class="btn sm" href="tel:${esc(c.phone.replace(/\s/g, ''))}">${I('phone')}Ara</a>` : ''}</div>`;
    if (u.status === 'Rezerve') h += `<p class="sub" style="margin-top:10px">Rezerve süresi: <b>${U.fmtDate(u.reservedUntil)}</b> ${u.note ? '· ' + esc(u.note) : ''}</p>`;
    if (u.status === 'Satıldı') {
      h += `<div style="margin:16px 0 8px"><div class="row between" style="font-size:13.5px;margin-bottom:6px"><span class="muted">Tahsilat</span><b>${U.money(paid)} / ${U.money(u.salePrice)}</b></div>${ui.bar((paid / (u.salePrice || 1)) * 100, 'ok', 'lg')}</div>
        <div class="section-t" style="margin:16px 0 4px">Taksit planı</div>${plan.map((p) => { const od = !p.paid && p.due < t; return `<div class="inst ${od ? 'od' : ''}"><div><b class="dt">${U.fmtDate(p.due)}</b><span class="sub">${esc(p.kind)}${p.paid ? ' · tahsil ' + U.fmtDate(p.paidDate) : od ? ' · ' + -U.diff(t, p.due) + ' gün gecikti' : ''}</span></div><b>${U.money(p.amount)}</b>${p.paid ? `<button class="btn sm ghost" data-action="inst.undo" data-uid="${u.id}" data-iid="${p.id}">${I('undo')}</button>` : `<button class="btn sm ok" data-action="inst.pay" data-uid="${u.id}" data-iid="${p.id}">${I('check')}Tahsil et</button>`}</div>`; }).join('')}`;
    }
    return h;
  };
  const unitFoot = (u) => `${u.status === 'Müsait' ? `<button class="btn" data-action="unit.reserve" data-id="${u.id}">${I('clock')}Rezerve Et</button><button class="btn primary" data-action="unit.sell" data-id="${u.id}">${I('tag')}Sat</button>` : ''}
    ${u.status === 'Rezerve' ? `<button class="btn danger-ghost" data-action="unit.free" data-id="${u.id}">Rezervi iptal et</button><button class="btn primary" data-action="unit.sell" data-id="${u.id}">${I('tag')}Satışa çevir</button>` : ''}
    ${u.status === 'Satıldı' ? `<button class="btn danger-ghost" data-action="unit.free" data-id="${u.id}">Satışı iptal et</button><button class="btn" data-action="unit.contract" data-id="${u.id}">${I('printer')}Satış sözleşmesi</button>` : ''}<button class="btn ghost" data-action="unit.edit" data-id="${u.id}">${I('edit')}Düzenle</button>`;
  function openUnit(id) {
    const u = SS.store.find('units', id); if (!u) return;
    if (drawer && !drawer.closed) { drawer.set(unitHtml(u)); drawer.el.querySelector('h3').textContent = `${u.no} · ${u.type}`; drawer.el.querySelector('.sheet-f').innerHTML = unitFoot(u); drawer.uid = id; return; }
    drawer = ui.sheet({ title: `${esc(u.no)} · ${u.type}`, side: true, noFocus: true, body: unitHtml(u), footer: unitFoot(u) }); drawer.uid = id;
  }
  const refresh = (id) => { ui.rerender(); if (drawer && !drawer.closed && drawer.uid === id) openUnit(id); };
  SS.actions['unit.open'] = (el) => openUnit(el.dataset.id);

  SS.actions['inst.pay'] = (el) => { const u = SS.store.find('units', el.dataset.uid), p = u.plan.find((x) => x.id === el.dataset.iid); p.paid = true; p.paidDate = today(); SS.store.save(); refresh(u.id); ui.toast(`Tahsilat kaydedildi · ${U.money(p.amount)}`); };
  SS.actions['inst.undo'] = (el) => { const u = SS.store.find('units', el.dataset.uid), p = u.plan.find((x) => x.id === el.dataset.iid); p.paid = false; p.paidDate = ''; SS.store.save(); refresh(u.id); ui.toast('Tahsilat geri alındı', 'info'); };
  SS.actions['unit.free'] = async (el) => {
    const u = SS.store.find('units', el.dataset.id);
    if (await ui.confirm({ title: u.status === 'Satıldı' ? 'Satış iptal edilsin mi?' : 'Rezerv iptal edilsin mi?', text: u.status === 'Satıldı' ? 'Taksit planı ve tahsilat kayıtları silinir; daire tekrar müsait olur.' : 'Daire tekrar müsait olur.', ok: 'İptal et' })) {
      Object.assign(u, { status: 'Müsait', customerId: '', salePrice: 0, downPayment: 0, saleDate: '', plan: [], reservedUntil: '' }); SS.store.save(); refresh(u.id); ui.toast('Daire müsait duruma alındı', 'info');
    }
  };

  /* müşteri seçici alanları */
  const custFields = () => [
    { name: 'customerId', label: 'Müşteri', type: 'select', options: [['', '+ Yeni müşteri oluştur'], ...SS.D.customers.map((c) => [c.id, `${c.name}${c.phone ? ' · ' + c.phone : ''}`])] },
    { name: 'custName', label: 'Yeni müşteri adı soyadı', half: true }, { name: 'custPhone', label: 'Telefon', type: 'tel', half: true },
  ];
  const custToggle = (v, a) => a.el.querySelectorAll('[data-fld="custName"],[data-fld="custPhone"]').forEach((w) => (w.style.display = v.customerId ? 'none' : ''));
  const resolveCust = (v) => v.customerId || SS.store.add('customers', { name: v.custName, phone: v.custPhone || '', email: '', note: '' }, 'k').id;
  const custValid = (v) => (!v.customerId && !v.custName ? 'Mevcut müşteriyi seçin veya yeni müşteri adı girin' : '');

  function genPlan(price, down, n, firstDue, period, saleDate, downPaid) {
    const plan = [], id = () => U.id('i');
    if (down > 0) plan.push({ id: id(), kind: 'Peşinat', due: saleDate, amount: down, paid: !!downPaid, paidDate: downPaid ? saleDate : '' });
    const rest = Math.max(0, price - down), per = Math.floor(rest / Math.max(1, n) / 100) * 100;
    for (let k = 1; k <= n; k++) plan.push({ id: id(), kind: `${k}. Taksit`, due: U.addMonths(firstDue, (k - 1) * period), amount: k === n ? U.round2(rest - per * (n - 1)) : per, paid: false, paidDate: '' });
    return plan;
  }
  SS.actions['unit.sell'] = (el) => {
    const u = SS.store.find('units', el.dataset.id), resv = u.status === 'Rezerve';
    const values = { customerId: resv ? u.customerId : '', salePrice: u.salePrice || u.listPrice, saleDate: today(), downPayment: Math.round((u.listPrice * 0.3) / 5000) * 5000, n: 12, period: '1', firstDue: U.addMonths(today(), 1), downPaid: true };
    ui.form({
      title: `Satış — ${u.no}`, wide: true, values, validate: custValid,
      fields: [...custFields(),
        { name: 'salePrice', label: 'Satış fiyatı (₺)', type: 'money', required: true, min: 1 }, { name: 'saleDate', label: 'Satış tarihi', type: 'date', required: true },
        { name: 'downPayment', label: 'Peşinat (₺)', type: 'money', min: 0 }, { name: 'downPaid', type: 'check', label: 'Peşinat', text: 'Peşinat tahsil edildi' },
        { name: 'n', label: 'Taksit sayısı', type: 'number', min: 1, max: 60, step: 1, required: true }, { name: 'period', label: 'Taksit aralığı', type: 'select', options: [['1', 'Aylık'], ['2', '2 aylık'], ['3', '3 aylık']] },
        { name: 'firstDue', label: 'İlk taksit tarihi', type: 'date', required: true }],
      extra: '<div class="live-box" data-live></div>',
      onInput(v, a) {
        custToggle(v, a); const box = a.el.querySelector('[data-live]'); if (!box) return;
        const plan = genPlan(v.salePrice || 0, v.downPayment || 0, v.n || 1, v.firstDue || today(), +v.period, v.saleDate || today(), v.downPaid), ins = plan.filter((p) => p.kind !== 'Peşinat');
        box.innerHTML = `<div class="live-row"><span>Peşinat</span><span>${U.money(v.downPayment || 0)}</span></div><div class="live-row"><span>Kalan tutar</span><span>${U.money((v.salePrice || 0) - (v.downPayment || 0))}</span></div><div class="live-row"><span>Taksit tutarı</span><span>${ins.length ? U.money(ins[0].amount) : '—'} × ${ins.length}</span></div><div class="live-row"><span>Plan sonu</span><span>${ins.length ? U.fmtDate(ins[ins.length - 1].due) : '—'}</span></div><div class="live-row total"><span>Toplam</span><span>${U.money(v.salePrice || 0)}</span></div>`;
      },
      onSubmit(v) {
        if (v.downPayment > v.salePrice) { ui.toast('Peşinat satış fiyatından büyük olamaz', 'bad'); return false; }
        const cid = resolveCust(v);
        Object.assign(u, { status: 'Satıldı', customerId: cid, salePrice: v.salePrice, downPayment: v.downPayment || 0, saleDate: v.saleDate, reservedUntil: '', plan: genPlan(v.salePrice, v.downPayment || 0, v.n, v.firstDue, +v.period, v.saleDate, v.downPaid) });
        SS.store.save(); refresh(u.id); ui.toast(`${u.no} satıldı · ${U.money(v.salePrice)}`);
      },
    });
  };
  SS.actions['unit.reserve'] = (el) => {
    const u = SS.store.find('units', el.dataset.id);
    ui.form({
      title: `Rezerve — ${u.no}`, values: { reservedUntil: U.addDays(today(), 7) }, validate: custValid, onInput: custToggle,
      fields: [...custFields(), { name: 'reservedUntil', label: 'Rezerve bitiş tarihi', type: 'date', required: true }, { name: 'note', label: 'Not', placeholder: 'ör. kapora alındı' }],
      onSubmit(v) { Object.assign(u, { status: 'Rezerve', customerId: resolveCust(v), reservedUntil: v.reservedUntil, note: v.note }); SS.store.save(); refresh(u.id); ui.toast(`${u.no} rezerve edildi`); },
    });
  };
  SS.actions['unit.edit'] = (el) => {
    const u = SS.store.find('units', el.dataset.id);
    ui.form({
      title: `Daire Bilgileri — ${u.no}`, values: u, cls: 'small',
      fields: [{ name: 'no', label: 'Daire no', required: true, half: true }, { name: 'type', label: 'Tip', half: true, placeholder: '3+1' }, { name: 'm2', label: 'Brüt alan (m²)', type: 'number', min: 1 }, { name: 'listPrice', label: 'Liste fiyatı (₺)', type: 'money', min: 0 }, { name: 'floor', label: 'Kat', type: 'number', step: 1 }],
      danger: { label: 'Daireyi sil', onClick: async (a) => { if (u.status === 'Satıldı') { ui.toast('Satılmış daire silinemez; önce satışı iptal edin', 'bad'); return; } if (await ui.confirm({ title: 'Daire silinsin mi?', text: esc(u.no) })) { SS.store.del('units', u.id); a.close(); if (drawer) drawer.close(); ui.rerender(); } } },
      onSubmit(v) { Object.assign(u, { no: v.no, type: v.type, m2: v.m2, listPrice: v.listPrice, floor: v.floor }); SS.store.save(); refresh(u.id); ui.toast('Daire güncellendi'); },
    });
  };
  SS.actions['unit.contract'] = (el) => SS.exp.save(SS.reports.saleContract(el.dataset.id), 'pdf');

  /* toplu daire oluşturucu */
  SS.actions['unit.new'] = () => {
    const act = C.active(), pid = act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0]).id;
    ui.form({
      title: 'Daireleri Toplu Oluştur', values: { projectId: pid, block: 'D', floors: 4, perFloor: 4, m2: 120, type: '3+1', ppm: 60000 },
      fields: [{ name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'block', label: 'Blok adı', required: true, half: true, placeholder: 'D' },
        { name: 'floors', label: 'Kat sayısı', type: 'number', min: 1, max: 40, step: 1, required: true }, { name: 'perFloor', label: 'Kat başına daire', type: 'number', min: 1, max: 12, step: 1, required: true },
        { name: 'type', label: 'Daire tipi', half: true }, { name: 'm2', label: 'Brüt alan (m²)', type: 'number', min: 1, required: true }, { name: 'ppm', label: 'm² birim fiyatı (₺)', type: 'money', min: 0, required: true }],
      onSubmit(v) {
        let n = 0; for (let f = 1; f <= v.floors; f++) for (let k = 1; k <= v.perFloor; k++) { n++; SS.store.add('units', { projectId: v.projectId, block: v.block, floor: f, no: `${v.block}-${(f - 1) * v.perFloor + k}`, type: v.type, m2: v.m2, listPrice: Math.round((v.m2 * v.ppm) / 1000) * 1000, status: 'Müsait', plan: [] }, 'u'); }
        ui.rerender(); ui.toast(`${n} daire oluşturuldu`);
      },
    });
  };

  /* müşteri */
  function custForm(c) {
    ui.form({
      title: c ? 'Müşteriyi Düzenle' : 'Yeni Müşteri', values: c || {}, cls: 'small',
      fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', half: true }, { name: 'email', label: 'E-posta', type: 'email', half: true }, { name: 'note', label: 'Not', type: 'textarea', rows: 2 }],
      danger: c ? { label: 'Sil', onClick: async (a) => { if (SS.D.units.some((u) => u.customerId === c.id)) { ui.toast('Bu müşterinin daire kaydı var; önce satışı/rezervi iptal edin', 'bad'); return; } if (await ui.confirm({ title: 'Müşteri silinsin mi?', text: esc(c.name) })) { SS.store.del('customers', c.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) { const d = { name: v.name, phone: v.phone, email: v.email, note: v.note }; if (c) SS.store.upd('customers', c.id, d); else SS.store.add('customers', d, 'k'); ui.rerender(); ui.toast('Müşteri kaydedildi'); },
    });
  }
  SS.actions['cust.new'] = () => custForm(null);
  SS.actions['cust.edit'] = (el, ev) => { ev.stopPropagation(); custForm(cust(el.dataset.id)); };
  SS.actions['cust.open'] = (el, ev) => {
    if (ev.target.closest('a,button') && ev.target.closest('a,button') !== el) return;
    const c = cust(el.dataset.id), my = SS.D.units.filter((u) => u.customerId === c.id), t = today();
    ui.sheet({ title: esc(c.name), side: true, noFocus: true, body: `<div class="cust-card">${ui.avatar(c.name, c.name.length)}<div class="grow"><b>${esc(c.name)}</b><div class="sub">${esc(c.phone || '—')}${c.email ? ' · ' + esc(c.email) : ''}</div></div></div>
      ${my.length ? my.map((u) => { const plan = u.plan || [], paid = U.sum(plan.filter((p) => p.paid), (p) => p.amount), od = plan.filter((p) => !p.paid && p.due < t); return `<div class="card pad" style="margin-top:12px;box-shadow:none"><div class="row between"><b>${esc(u.no)} · ${u.type}</b><span class="badge ${u.status === 'Satıldı' ? 'ok' : 'warn'}">${u.status}</span></div>${u.status === 'Satıldı' ? `<div class="sub" style="margin:6px 0">Satış ${U.money(u.salePrice)} · tahsil ${U.money(paid)}${od.length ? ` · <b class="neg">${od.length} taksit gecikmiş</b>` : ''}</div>${ui.bar((paid / (u.salePrice || 1)) * 100, 'ok')}` : ''}<button class="btn sm" style="margin-top:10px" data-action="unit.open" data-id="${u.id}" data-sheet-close>${I('eye')}Daireyi aç</button></div>`; }).join('') : '<p class="muted" style="margin-top:14px">Bu müşteriye bağlı daire kaydı yok.</p>'}` });
  };
})();
