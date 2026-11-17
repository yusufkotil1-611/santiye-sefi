/* Makine & Ekipman Parkı */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;

  SS.css(`
  .mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
  .mcard{padding:18px;display:flex;flex-direction:column;gap:13px}.mcard.due{border-color:color-mix(in srgb,var(--warn) 60%,var(--line))}
  .mhead{display:flex;gap:12px;align-items:flex-start}.mhead .kpi-ic{margin:0;flex:none}.mhead h3{font-size:16px;line-height:1.25;letter-spacing:-.01em}.mhead small{color:var(--muted)}
  .mst{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mst small{display:block;color:var(--muted);font-size:12px}.mst b{font-size:14.5px;font-variant-numeric:tabular-nums}
  .svc-l{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}
  @media(max-width:699px){.mgrid{grid-template-columns:1fr}}
  `);

  const ST = { 'Çalışıyor': 'ok', 'Boşta': 'muted', 'Bakımda': 'warn' };
  const icon = (t) => ({ 'Kule Vinç': 'building', 'Ekskavatör': 'wrench', 'Jeneratör': 'fuel', 'Beton Pompası': 'truck', 'Mikser': 'truck', 'Forklift': 'truck', 'Kompresör': 'gear' })[t] || 'truck';
  const logs = (m, days = 30) => SS.D.machineLogs.filter((l) => l.machineId === m.id && l.date >= U.addDays(U.today(), -days + 1));
  const stats = (m) => { const l = logs(m), fuel = U.sum(l, (x) => x.fuel); const mk = U.monthKey(U.today()); return { hours: U.sum(l, (x) => x.hours), fuel, fuelCost: fuel * SS.cfg.fuelPrice, rentDays: new Set(SS.D.machineLogs.filter((x) => x.machineId === m.id && U.monthKey(x.date) === mk).map((x) => x.date)).size }; };

  function rows() { const s = ui.vs('machines', { q: '', mtype: '', mst: '' }); return C.scope('machines').filter((m) => (!s.mtype || m.type === s.mtype) && (!s.mst || m.status === s.mst) && U.match(s.q, m.name, m.type, m.plate, m.own)); }
  function body() {
    const list = rows(), all = C.scope('machines'), due = all.filter(C.machineDue);
    const fuelAll = U.sum(all, (m) => stats(m).fuel), rent = U.sum(all.filter((m) => m.own === 'Kiralık'), (m) => stats(m).rentDays * (m.rent || 0));
    const top = all.map((m) => ({ label: m.name.split('–')[0].trim(), value: stats(m).fuel, color: 'var(--s2)' })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
    return `<div class="grid g-4 kpis">${ui.kpi({ label: 'Toplam makine', value: all.length, fmt: 'num', icon: 'truck', tone: 'info', sub: `${all.filter((m) => m.status === 'Çalışıyor').length} çalışıyor · ${all.filter((m) => m.own === 'Kiralık').length} kiralık` })}${ui.kpi({ label: 'Bakım zamanı', value: due.length, fmt: 'num', icon: 'wrench', tone: due.length ? 'warn' : 'ok', sub: due.length ? due.map((m) => m.name.split('–')[0].trim()).join(', ') : 'yaklaşan bakım yok' })}
      ${ui.kpi({ label: 'Yakıt (30 gün)', value: fuelAll, fmt: 'num', icon: 'fuel', tone: 'brand', sub: `${U.money(fuelAll * SS.cfg.fuelPrice)} · ₺${SS.cfg.fuelPrice}/lt` })}${ui.kpi({ label: 'Kira maliyeti (bu ay)', value: rent, fmt: 'compact', icon: 'wallet', tone: 'warn', sub: 'çalışılan gün × günlük kira' })}</div>
      ${top.length ? `<div class="card"><div class="card-h"><h3>Yakıt Tüketimi <span class="muted fw">son 30 gün · litre</span></h3></div><div class="card-b">${G.hbars(top, { fmt: (v) => U.num(v) + ' lt' })}</div></div>` : ''}
      ${list.length ? `<div class="mgrid">${list.map((m) => {
        const s = stats(m), rem = C.machineRemain(m), next = C.machineNext(m), isDue = C.machineDue(m), pct = m.serviceEvery ? U.clamp(((m.hours - (m.lastService || 0)) / m.serviceEvery) * 100, 0, 100) : 0;
        return `<article class="card mcard ${isDue ? 'due' : ''}"><div class="mhead"><span class="kpi-ic tone-${isDue ? 'warn' : 'info'}">${I(icon(m.type))}</span><div class="grow"><h3>${esc(m.name)}</h3><small>${esc(m.plate || m.type)}</small></div>${ui.badge(m.status, ST[m.status])}</div>
          <div class="row wrap" style="gap:6px">${ui.badge(m.own, m.own === 'Kiralık' ? 'brand' : 'muted')}${m.own === 'Kiralık' ? ui.badge(`${U.money(m.rent)}/gün`, 'muted') : ''}${m.firmId ? `<span class="sub">${esc(ui.firmName(m.firmId))}</span>` : ''}</div>
          <div class="mst"><div><small>Sayaç</small><b>${U.num(m.hours)} sa</b></div><div><small>30 gün çalışma</small><b>${U.num(s.hours)} sa</b></div><div><small>Yakıt</small><b>${s.fuel ? U.num(s.fuel) + ' lt' : '—'}</b></div></div>
          ${m.serviceEvery ? `<div><div class="svc-l"><span class="muted">Sonraki bakım: ${U.num(next)} sa</span><b class="${rem <= 0 ? 'neg' : rem <= 30 ? 'wrn' : ''}">${rem <= 0 ? U.num(-rem) + ' sa gecikti' : U.num(rem) + ' sa kaldı'}</b></div>${ui.bar(pct, rem <= 0 ? 'bad' : rem <= 30 ? 'warn' : 'ok')}</div>` : ''}${m.nextServiceDate ? `<div class="sub">${I('calendar')} Tarihli bakım: ${U.fmtDate(m.nextServiceDate)} (${U.relDays(m.nextServiceDate)})</div>` : ''}
          <div class="row wrap" style="gap:6px"><button class="btn sm primary" data-action="mach.log" data-id="${m.id}">${I('clock')}Çalışma kaydı</button><button class="btn sm" data-action="mach.svc" data-id="${m.id}">${I('wrench')}Bakım yapıldı</button><button class="btn sm ghost" data-action="mach.hist" data-id="${m.id}">${I('history')}</button><button class="btn sm ghost" data-action="mach.edit" data-id="${m.id}" aria-label="Düzenle">${I('edit')}</button></div></article>`;
      }).join('')}</div>` : ui.empty('truck', 'Makine bulunamadı', 'Vinç, kepçe, jeneratör gibi ekipmanlarınızı ekleyin.', `<button class="btn primary" data-action="mach.new">${I('plus')}Makine Ekle</button>`)}`;
  }
  SS.views.machines = {
    title: 'Makine Parkı',
    render() {
      return `<div class="page">${ui.head({ title: 'Makine & Ekipman Parkı', sub: 'Çalışma saati, yakıt tüketimi, kira maliyeti ve bakım hatırlatıcıları', actions: `${SS.exp.menu('machines')}<button class="btn" data-action="mach.log">${I('clock')}Çalışma Kaydı</button><button class="btn primary" data-action="mach.new">${I('plus')}Makine Ekle</button>` })}
      ${ui.toolbar({ view: 'machines', ph: 'Makine, plaka veya tür ara…', upd: 'mach-body', filters: [{ k: 'mtype', label: 'Tür', opts: [['', 'Tümü'], ...SS.C.machineTypes] }, { k: 'mst', label: 'Durum', opts: [['', 'Tümü'], 'Çalışıyor', 'Boşta', 'Bakımda'] }] })}${ui.region('mach-body', body)}</div>`;
    },
  };

  function logForm(mid) {
    const ms = C.scope('machines'); if (!ms.length) { ui.toast('Önce makine ekleyin', 'bad'); return; }
    ui.form({
      title: 'Çalışma / Yakıt Kaydı', cls: 'small', values: { machineId: mid || ms[0].id, date: U.today(), hours: 8, fuel: 0, operator: '' },
      fields: [{ name: 'machineId', label: 'Makine', type: 'select', options: ms.map((m) => [m.id, m.name]), required: true }, { name: 'date', label: 'Tarih', type: 'date', required: true, max: U.today() }, { name: 'hours', label: 'Çalışma saati', type: 'number', required: true, min: 0, step: 0.5 }, { name: 'fuel', label: 'Yakıt (lt)', type: 'number', min: 0, step: 1 }, { name: 'operator', label: 'Operatör' }, { name: 'note', label: 'Not' }],
      onSubmit(v) { const m = SS.store.find('machines', v.machineId); SS.store.add('machineLogs', { machineId: m.id, date: v.date, hours: v.hours, fuel: v.fuel || 0, operator: v.operator, note: v.note }, 'l'); m.hours += v.hours; SS.store.save(); ui.rerender(); ui.toast(`${esc(m.name)} · ${v.hours} saat kaydedildi`); },
    });
  }
  SS.actions['mach.log'] = (el) => logForm(el && el.dataset && el.dataset.id);
  SS.actions['mach.svc'] = (el) => {
    const m = SS.store.find('machines', el.dataset.id);
    ui.form({
      title: `Bakım Yapıldı — ${m.name}`, cls: 'small', values: { date: U.today(), cost: 0 },
      fields: [{ name: 'date', label: 'Bakım tarihi', type: 'date', required: true }, { type: 'html', html: `<p class="sub">Bakım sayacı <b>${U.num(m.hours)} saat</b> olarak kaydedilir; sonraki bakım ${U.num(m.hours + (m.serviceEvery || 0))} saatte olacak.</p>` }, { name: 'cost', label: 'Bakım maliyeti (₺)', type: 'money', min: 0, hint: 'Girerseniz Genel Giderler\'e işlenir' }, { name: 'note', label: 'Yapılan işlemler' }],
      onSubmit(v) { m.lastService = m.hours; m.nextServiceDate = ''; if (m.status === 'Bakımda') m.status = 'Çalışıyor'; if (v.cost > 0) SS.store.add('expenses', { projectId: m.projectId, date: v.date, category: 'Genel Giderler', desc: `Bakım: ${m.name}${v.note ? ' – ' + v.note : ''}`, firmId: '', amount: v.cost, status: 'Ödendi', paidDate: v.date, source: 'makine' }, 'e'); SS.store.save(); ui.rerender(); ui.toast('Bakım kaydedildi, hatırlatıcı sıfırlandı'); },
    });
  };
  SS.actions['mach.hist'] = (el) => {
    const m = SS.store.find('machines', el.dataset.id), l = SS.D.machineLogs.filter((x) => x.machineId === m.id).sort((a, b) => b.date.localeCompare(a.date));
    const weeks = [4, 3, 2, 1, 0].map((w) => { const to = U.addDays(U.today(), -w * 7), from = U.addDays(to, -6); return { label: U.fmtDateShort(from), v: U.sum(l.filter((x) => x.date >= from && x.date <= to), (x) => x.fuel) }; });
    ui.sheet({ title: esc(m.name), side: true, noFocus: true, body: `<div class="section-t">Haftalık yakıt (lt)</div><div style="margin:8px 0 14px">${G.hbars(weeks.map((w) => ({ label: w.label, value: w.v, color: 'var(--s2)' })), { fmt: (v) => U.num(v) + ' lt' })}</div><div class="section-t">Son kayıtlar</div>
      ${l.slice(0, 25).map((x) => `<div class="row between" style="padding:9px 0;border-top:1px solid var(--line-2)"><div><b style="font-size:14px">${U.fmtDate(x.date)}</b><div class="sub">${esc(x.operator || 'Operatör —')}${x.note ? ' · ' + esc(x.note) : ''}</div></div><div style="text-align:right"><b>${x.hours} sa</b><div class="sub">${x.fuel ? x.fuel + ' lt · ' + U.money(x.fuel * SS.cfg.fuelPrice) : 'yakıtsız'}</div></div></div>`).join('') || '<p class="muted">Kayıt yok</p>'}` });
  };
  function mForm(m) {
    const act = C.active(), pid = m ? m.projectId : act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0]).id;
    ui.form({
      title: m ? 'Makineyi Düzenle' : 'Yeni Makine', wide: true, values: m || { projectId: pid, type: 'Ekskavatör', own: 'Özmal', status: 'Çalışıyor', hours: 0, serviceEvery: 250, lastService: 0, rent: 0 },
      fields: [{ name: 'name', label: 'Makine adı / model', required: true, placeholder: 'ör. Kule Vinç – Potain MC 85' }, { name: 'type', label: 'Tür', type: 'select', options: SS.C.machineTypes }, { name: 'plate', label: 'Plaka / seri no', half: true }, { name: 'own', label: 'Mülkiyet', type: 'select', options: ['Özmal', 'Kiralık'] }, { name: 'firmId', label: 'Kiralayan firma', type: 'select', options: ui.firmOpts() }, { name: 'rent', label: 'Günlük kira (₺)', type: 'money', min: 0 },
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'status', label: 'Durum', type: 'select', options: ['Çalışıyor', 'Boşta', 'Bakımda'] }, { name: 'hours', label: 'Güncel sayaç (saat)', type: 'number', min: 0, step: 1 }, { name: 'serviceEvery', label: 'Bakım aralığı (saat)', type: 'number', min: 0, step: 1 }, { name: 'lastService', label: 'Son bakım sayacı', type: 'number', min: 0, step: 1 }, { name: 'nextServiceDate', label: 'Tarihli bakım (isteğe bağlı)', type: 'date' }],
      danger: m ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Makine silinsin mi?', text: `${esc(m.name)} ve çalışma kayıtları silinir.` })) { SS.D.machineLogs = SS.D.machineLogs.filter((l) => l.machineId !== m.id); SS.store.del('machines', m.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) { const d = { name: v.name, type: v.type, plate: v.plate, own: v.own, firmId: v.firmId, rent: v.rent || 0, projectId: v.projectId, status: v.status, hours: v.hours || 0, serviceEvery: v.serviceEvery || 0, lastService: v.lastService || 0, nextServiceDate: v.nextServiceDate }; if (m) SS.store.upd('machines', m.id, d); else SS.store.add('machines', d, 'k'); ui.rerender(); ui.toast('Makine kaydedildi'); },
    });
  }
  SS.actions['mach.new'] = () => mForm(null);
  SS.actions['mach.edit'] = (el) => mForm(SS.store.find('machines', el.dataset.id));
})();
