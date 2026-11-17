/* Personel & Puantaj */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;
  const ATT = SS.C.att;

  SS.css(`
  .datebar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.datebar .dlabel{min-width:190px;text-align:center;font-weight:750;font-size:16px;letter-spacing:-.01em}.datebar .dlabel small{display:block;font-weight:600;color:var(--muted);font-size:12.5px}
  .wgroup{padding:6px 0}.wgroup-h{display:flex;align-items:center;justify-content:space-between;padding:12px 18px 6px;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
  .wrow{display:grid;grid-template-columns:minmax(200px,1fr) minmax(300px,420px);gap:14px;align-items:center;padding:10px 18px;border-top:1px solid var(--line-2)}
  .wrow .wi{display:flex;gap:12px;align-items:center;min-width:0}.wrow .wi b{display:block;font-size:14.5px}.wrow .wi small{color:var(--muted);font-size:12.5px}
  .att{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
  .ab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:46px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink-2);font-weight:800;font-size:15px;cursor:pointer;transition:all .15s var(--ease);padding:2px}
  .ab span{font-size:10.5px;font-weight:600;color:var(--muted)}.ab:hover{border-color:var(--ink-2)}
  .ab.on{color:#fff;transform:scale(1.03);box-shadow:0 4px 12px rgba(0,0,0,.2)}.ab.on span{color:rgba(255,255,255,.88)}
  .ab-T.on{background:var(--ok);border-color:var(--ok)}.ab-Y.on{background:var(--info);border-color:var(--info)}.ab-FM.on{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}.ab-I.on{background:#b26a00;border-color:#b26a00}.ab-D.on{background:var(--bad);border-color:var(--bad)}
  .wsum{display:flex;gap:18px;flex-wrap:wrap;align-items:center;padding:14px 18px}.wsum>div small{display:block;color:var(--muted);font-size:12px}.wsum>div b{font-size:19px;letter-spacing:-.02em}
  .sheetg{overflow:auto;max-height:70vh;border-radius:var(--r)}.cetvel{border-collapse:separate;border-spacing:0;font-size:12.5px;min-width:100%}
  .cetvel th,.cetvel td{padding:0;border-bottom:1px solid var(--line-2);border-right:1px solid var(--line-2);text-align:center;min-width:30px;height:34px}
  .cetvel thead th{position:sticky;top:0;background:var(--surface-2);z-index:2;font-size:11px;color:var(--muted);font-weight:700}
  .cetvel .nm{position:sticky;left:0;z-index:1;background:var(--surface);text-align:left;padding:0 12px;min-width:170px;max-width:190px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cetvel thead .nm{z-index:3;background:var(--surface-2)}.cetvel .sun{background:var(--surface-2)}.cetvel td.tot{min-width:54px;font-weight:700;font-variant-numeric:tabular-nums;background:var(--surface-2)}
  .c-T{background:var(--ok-soft);color:var(--ok-text);font-weight:800}.c-Y{background:var(--info-soft);color:var(--info-text);font-weight:800}.c-FM{background:var(--brand-soft);color:var(--brand-text);font-weight:800}.c-I{background:var(--warn-soft);color:var(--warn-text);font-weight:800}.c-D{background:var(--bad-soft);color:var(--bad-text);font-weight:800}
  .rolebar{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.rolebar>div{background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:12px}.rolebar small{display:block;color:var(--muted);font-size:12px}.rolebar b{font-size:16px;font-variant-numeric:tabular-nums}
  @media(max-width:899px){.wrow{grid-template-columns:1fr;gap:10px;padding:12px 14px}.ab{min-height:50px}}
  @media(max-width:480px){.ab span{display:none}.ab{min-height:52px;font-size:16px}.datebar .dlabel{min-width:0;flex:1}}
  `);

  const S = () => ui.vs('workforce', { tab: 'day', date: U.today(), month: U.monthKey(U.today()), q: '', role: '', mview: 'sum' });
  const dow = (d) => U.dayName(d);

  /* ---------------- günlük puantaj ---------------- */
  function dayBody() {
    const s = S(), day = SS.D.attendance[s.date] || {}, all = C.workers();
    const ws = all.filter((w) => (!s.role || w.role === s.role) && U.match(s.q, w.name, w.role, w.note));
    const marked = all.filter((w) => day[w.id]).length, heads = U.sum(all.filter((w) => ['T', 'Y', 'FM'].includes(day[w.id])), (w) => w.headcount || 1);
    const cost = U.sum(all, (w) => w.wage * C.attMult(day[w.id]));
    const counts = Object.fromEntries(SS.C.attOrder.map((c) => [c, all.filter((w) => day[w.id] === c).length]));
    const groups = SS.C.roles.map((r) => [r, ws.filter((w) => w.role === r)]).filter(([, l]) => l.length);
    return `<div class="card"><div class="wsum"><div><small>Sahada</small><b>${heads} kişi</b></div><div><small>İşaretlenen</small><b>${marked}/${all.length}</b></div><div><small>Günlük maliyet</small><b>${U.money(cost)}</b></div>
      ${SS.C.attOrder.map((c) => `<div><small>${ATT[c].label}</small><b>${counts[c]}</b></div>`).join('')}<span class="grow"></span>
      <button class="btn sm" data-action="att.fill">${I('check')}Boşları Tam Gün yap</button><button class="btn sm ghost" data-action="att.clear">${I('trash')}Günü temizle</button></div>
      <div class="bar" style="margin:0 18px 8px"><i class="${marked === all.length ? 'ok' : 'brand'}" style="width:${all.length ? (marked / all.length) * 100 : 0}%"></i></div>
      ${groups.length ? groups.map(([r, list]) => `<div class="wgroup"><div class="wgroup-h"><span>${r} (${list.length})</span><span>${U.money(U.sum(list, (w) => w.wage * C.attMult(day[w.id])))}</span></div>
        ${list.map((w) => `<div class="wrow"><div class="wi">${ui.avatar(w.name, w.name.length)}<div><b>${esc(w.name)}</b><small>${w.role === 'Taşeron Ekibi' ? `${w.headcount} kişilik ekip · ` : ''}${U.money(w.wage)}/gün${w.note ? ' · ' + esc(w.note) : ''}</small></div></div>
          <div class="att">${SS.C.attOrder.map((c) => `<button class="ab ab-${c} ${day[w.id] === c ? 'on' : ''}" data-action="att.set" data-w="${w.id}" data-code="${c}" aria-pressed="${day[w.id] === c}" aria-label="${esc(w.name)} ${ATT[c].label}">${ATT[c].short}<span>${ATT[c].label.replace(' Gün', '').replace('Fazla Mesai', 'F.Mesai')}</span></button>`).join('')}</div></div>`).join('')}</div>`).join('') : ui.empty('users', 'Personel bulunamadı', 'Personel listesine çalışan ekleyin.', `<button class="btn primary" data-action="wk.new">${I('plus')}Personel Ekle</button>`)}</div>`;
  }
  function dayView() {
    const s = S(), isToday = s.date === U.today();
    return `<div class="card pad"><div class="datebar"><button class="icon-btn" data-action="att.nav" data-d="-1" aria-label="Önceki gün">${I('chevL')}</button>
      <div class="dlabel">${U.fmtDateLong(s.date).split(',')[0]}<small>${dow(s.date)}${isToday ? ' · bugün' : ''}</small></div><button class="icon-btn" data-action="att.nav" data-d="1" aria-label="Sonraki gün">${I('chevR')}</button>
      <input class="input" type="date" style="width:auto" value="${s.date}" max="${U.today()}" data-vs="workforce.date" data-upd="wf-day" aria-label="Tarih seç">${isToday ? '' : `<button class="btn sm" data-action="att.today">Bugün</button>`}</div></div>
      ${ui.toolbar({ view: 'workforce', ph: 'Personel ara…', upd: 'wf-day', filters: [{ k: 'role', label: 'Görev', opts: [['', 'Tümü'], ...SS.C.roles] }] })}${ui.region('wf-day', dayBody)}`;
  }
  SS.actions['att.set'] = (el) => {
    const s = S(); if (s.date > U.today()) { ui.toast('Gelecek tarih için puantaj girilemez', 'bad'); return; }
    const d = (SS.D.attendance[s.date] = SS.D.attendance[s.date] || {}), w = el.dataset.w, code = el.dataset.code;
    if (d[w] === code) delete d[w]; else d[w] = code; if (!Object.keys(d).length) delete SS.D.attendance[s.date];
    SS.store.save(); ui.update('wf-day'); ui.refreshBadges();
  };
  SS.actions['att.nav'] = (el) => { const s = S(); const n = U.addDays(s.date, +el.dataset.d); if (n > U.today()) return; s.date = n; ui.rerender(); };
  SS.actions['att.today'] = () => { S().date = U.today(); ui.rerender(); };
  SS.actions['att.fill'] = () => { const s = S(); if (s.date > U.today()) return; const d = (SS.D.attendance[s.date] = SS.D.attendance[s.date] || {}); let n = 0; C.workers().forEach((w) => { if (!d[w.id]) { d[w.id] = 'T'; n++; } }); SS.store.save(); ui.update('wf-day'); ui.refreshBadges(); ui.toast(`${n} kişi Tam Gün işaretlendi`); };
  SS.actions['att.clear'] = async () => { const s = S(); if (await ui.confirm({ title: 'Gün temizlensin mi?', text: `${U.fmtDate(s.date)} tarihli tüm puantaj işaretleri silinir.`, ok: 'Temizle' })) { delete SS.D.attendance[s.date]; SS.store.save(); ui.update('wf-day'); ui.refreshBadges(); } };
  SS.actions['wf.today'] = () => { const s = S(); s.tab = 'day'; s.date = U.today(); ui.go('workforce'); ui.rerender(); };

  /* ---------------- aylık cetvel & hakediş ---------------- */
  function monthView() {
    const s = S(), mk = s.month, rows = C.payroll(mk), dates = U.dates(U.monthStart(mk), U.monthEnd(mk));
    const gross = U.sum(rows, (r) => r.gross), adv = U.sum(rows, (r) => r.advance), unpaid = rows.filter((r) => !r.paid);
    const byRole = {}; rows.forEach((r) => { const b = (byRole[r.w.role] = byRole[r.w.role] || { days: 0, gross: 0, n: 0 }); b.days += r.days * (r.w.headcount || 1); b.gross += r.gross; b.n++; });
    const nav = `<div class="card pad"><div class="datebar"><button class="icon-btn" data-action="wf.month" data-d="-1" aria-label="Önceki ay">${I('chevL')}</button><div class="dlabel">${U.monthLabel(mk)}<small>${rows.length} personel</small></div><button class="icon-btn" data-action="wf.month" data-d="1" aria-label="Sonraki ay">${I('chevR')}</button><span class="grow"></span>
      ${ui.seg('workforce', 'mview', [['sum', 'Hakediş özeti'], ['grid', 'Puantaj cetveli']], s.mview)}<button class="btn" data-action="adv.new">${I('plus')}Avans</button>${unpaid.length ? `<button class="btn primary" data-action="pay.all">${I('wallet')}Tümünü öde</button>` : ''}</div></div>`;
    const kp = `<div class="grid g-4 kpis">${ui.kpi({ label: 'Adam-gün', value: U.sum(rows, (r) => r.days * (r.w.headcount || 1)), fmt: 'num', icon: 'hardhat', tone: 'info', sub: 'ekipler dahil' })}${ui.kpi({ label: 'Brüt yevmiye', value: gross, fmt: 'compact', icon: 'receipt', tone: 'brand' })}${ui.kpi({ label: 'Verilen avans', value: adv, fmt: 'compact', icon: 'arrowUp', tone: 'warn' })}${ui.kpi({ label: 'Ödenecek net', value: U.sum(unpaid, (r) => r.net), fmt: 'compact', icon: 'wallet', tone: unpaid.length ? 'bad' : 'ok', sub: unpaid.length ? `${unpaid.length} kişi ödeme bekliyor` : 'tümü ödendi' })}</div>`;
    if (s.mview === 'grid') {
      return nav + `<div class="card sheetg"><table class="cetvel"><thead><tr><th class="nm">Personel</th>${dates.map((d) => `<th class="${U.dow(d) === 0 ? 'sun' : ''}" title="${dow(d)}">${+d.slice(8)}<br><span style="font-weight:500">${dow(d).slice(0, 2)}</span></th>`).join('')}<th>Gün</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="nm" title="${esc(r.w.name)}">${esc(r.w.name)}</td>${dates.map((d) => { const c = (SS.D.attendance[d] || {})[r.w.id]; return `<td class="${c ? 'c-' + c : U.dow(d) === 0 ? 'sun' : ''}" ${c ? `data-tip="${esc(r.w.name)}\n${U.fmtDate(d)} · ${ATT[c].label}"` : ''}>${c ? ATT[c].short : ''}</td>`; }).join('')}<td class="tot">${U.num(r.days, 1)}</td></tr>`).join('')}</tbody></table></div>
        <div class="chart-legend">${SS.C.attOrder.map((c) => `<span><i class="c-${c}" style="border:1px solid var(--line)"></i>${ATT[c].short} = ${ATT[c].label}${c === 'FM' ? ` (×${SS.cfg.overtime})` : ''}</span>`).join('')}</div>`;
    }
    const advs = SS.D.advances.filter((a) => U.monthKey(a.date) === mk && rows.some((r) => r.w.id === a.workerId)).sort((a, b) => b.date.localeCompare(a.date));
    return nav + kp + `<div class="card"><div class="card-h"><h3>Ekip Bazlı Özet</h3></div><div class="card-b"><div class="rolebar">${SS.C.roles.filter((r) => byRole[r]).map((r) => `<div><small>${r} · ${byRole[r].n} kayıt</small><b>${U.compact(byRole[r].gross)}</b><div class="sub">${U.num(byRole[r].days, 1)} adam-gün</div></div>`).join('')}</div></div></div>
      <div class="card">${ui.table({ rows, empty: 'Personel yok', foot: `<tr><td>Toplam</td><td></td><td class="num"></td><td></td><td class="num">${U.num(U.sum(rows, (r) => r.days), 1)}</td><td class="num">${U.money(gross)}</td><td class="num">${U.money(adv)}</td><td class="num">${U.money(gross - adv)}</td><td></td><td></td></tr>`, cols: [
        { h: 'Personel', c: (r) => `<div class="t-main">${esc(r.w.name)}</div><div class="t-sub">${r.w.role}</div>` }, { h: 'Günlük', cls: 'num', c: (r) => U.money(r.w.wage) },
        { h: 'T / Y / FM', cls: 'num', c: (r) => `${r.counts.T} / ${r.counts.Y} / ${r.counts.FM}` }, { h: 'İzin / Yok', cls: 'num', c: (r) => `${r.counts.I} / ${r.counts.D}` },
        { h: 'Çalışılan gün', cls: 'num', c: (r) => U.num(r.days, 1) }, { h: 'Brüt', cls: 'num', c: (r) => U.money(r.gross) }, { h: 'Avans', cls: 'num', c: (r) => (r.advance ? `<span class="neg">−${U.money(r.advance)}</span>` : '—') },
        { h: 'Net ödenecek', cls: 'num', c: (r) => `<b>${U.money(r.net)}</b>` }, { h: 'Durum', c: (r) => (r.paid ? ui.badge('Ödendi', 'ok') : r.net > 0 ? ui.badge('Bekliyor', 'warn') : ui.badge('—', 'muted')) },
        { h: '', act: true, c: (r) => (r.paid ? `<button class="btn sm ghost" data-action="pay.undo" data-id="${r.paid.id}">${I('undo')}</button>` : r.net > 0 ? `<button class="btn sm ok" data-action="pay.one" data-w="${r.w.id}">${I('check')}Öde</button>` : '') },
      ] })}</div>
      ${advs.length ? `<div class="card"><div class="card-h"><h3>${U.monthLabel(mk)} Avansları</h3></div><div class="card-b"><ul class="alist">${advs.map((a) => { const w = SS.store.find('workers', a.workerId); return `<li><div class="a-t" style="padding:6px 8px"><b>${esc(w ? w.name : '—')}</b><small>${U.fmtDate(a.date)} · ${esc(a.note || 'Avans')}</small></div><b style="padding-right:4px">${U.money(a.amount)}</b><button class="btn sm danger-ghost" data-action="adv.del" data-id="${a.id}" aria-label="Sil">${I('trash')}</button></li>`; }).join('')}</ul></div></div>` : ''}`;
  }
  SS.actions['wf.month'] = (el) => { const s = S(); s.month = U.monthKey(U.addMonths(U.monthStart(s.month), +el.dataset.d)); ui.rerender(); };
  function payRows(rows) {
    const mk = S().month, byP = U.groupBy(rows, (r) => r.w.projectId);
    Object.entries(byP).forEach(([pid, list]) => {
      const total = U.sum(list, (r) => r.net), ex = SS.store.add('expenses', { projectId: pid, date: U.today(), category: 'İşçilik', desc: list.length === 1 ? `${U.monthLabel(mk)} yevmiye ödemesi – ${list[0].w.name}` : `${U.monthLabel(mk)} aylık puantaj ödemesi (${list.length} kişi)`, firmId: '', amount: total, status: 'Ödendi', paidDate: U.today(), source: 'puantaj' }, 'e');
      list.forEach((r) => SS.store.add('payrolls', { workerId: r.w.id, month: mk, days: r.days, gross: r.gross, advance: r.advance, net: r.net, paidDate: U.today(), expenseId: ex.id }, 'y'));
    });
  }
  SS.actions['pay.one'] = (el) => { const r = C.payroll(S().month).find((x) => x.w.id === el.dataset.w); payRows([r]); ui.rerender(); ui.toast(`${r.w.name} için ${U.money(r.net)} ödeme gideri işlendi`); };
  SS.actions['pay.all'] = async () => { const rows = C.payroll(S().month).filter((r) => !r.paid && r.net > 0); if (!rows.length) return; if (await ui.confirm({ title: 'Tüm ödemeler işlensin mi?', text: `${rows.length} kişi için toplam <b>${U.money(U.sum(rows, (r) => r.net))}</b> İşçilik gideri olarak kaydedilir.`, ok: 'Ödemeleri işle', danger: false })) { payRows(rows); ui.rerender(); ui.toast('Aylık ödemeler gider olarak işlendi'); } };
  SS.actions['pay.undo'] = async (el) => { const p = SS.store.find('payrolls', el.dataset.id); SS.D.payrolls = SS.D.payrolls.filter((x) => x.id !== p.id); if (!SS.D.payrolls.some((x) => x.expenseId === p.expenseId)) SS.D.expenses = SS.D.expenses.filter((e) => e.id !== p.expenseId); else { const ex = SS.store.find('expenses', p.expenseId); if (ex) ex.amount = Math.max(0, ex.amount - p.net); } SS.store.save(); ui.rerender(); ui.toast('Ödeme geri alındı', 'info'); };
  SS.actions['adv.new'] = () => {
    ui.form({ title: 'Avans Ver', cls: 'small', values: { date: U.today() }, fields: [{ name: 'workerId', label: 'Personel', type: 'select', required: true, options: [['', '— Seçiniz —'], ...C.workers().map((w) => [w.id, `${w.name} (${w.role})`])] }, { name: 'amount', label: 'Tutar (₺)', type: 'money', required: true, min: 1 }, { name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'note', label: 'Not', placeholder: 'Maaş avansı' }],
      onSubmit(v) { SS.store.add('advances', { workerId: v.workerId, date: v.date, amount: v.amount, note: v.note }, 'a'); S().month = U.monthKey(v.date); ui.rerender(); ui.toast('Avans kaydedildi'); } });
  };
  SS.actions['adv.del'] = (el) => { SS.store.del('advances', el.dataset.id); ui.rerender(); };

  /* ---------------- personel listesi ---------------- */
  function listView() {
    const s = ui.vs('workforce', { wq: '', wrole: '' });
    const rows = C.scope('workers').filter((w) => (!s.wrole || w.role === s.wrole) && U.match(s.wq, w.name, w.role, w.phone)).sort((a, b) => SS.C.roles.indexOf(a.role) - SS.C.roles.indexOf(b.role));
    return `${ui.toolbar({ view: 'workforce', ph: 'Ad, görev veya telefon ara…', upd: 'wk-body', filters: [{ k: 'wrole', label: 'Görev', opts: [['', 'Tümü'], ...SS.C.roles] }] }).replace('data-vs="workforce.q"', 'data-vs="workforce.wq"').replace(/value="[^"]*"/, `value="${esc(s.wq || '')}"`)}
      ${ui.region('wk-body', () => `<div class="card">${ui.table({ rows: C.scope('workers').filter((w) => (!ui.vs('workforce').wrole || w.role === ui.vs('workforce').wrole) && U.match(ui.vs('workforce').wq, w.name, w.role, w.phone)).sort((a, b) => SS.C.roles.indexOf(a.role) - SS.C.roles.indexOf(b.role)), empty: 'Personel bulunamadı', cols: [
        { h: 'Personel', c: (w) => `<div class="firm-av" style="display:flex;gap:12px;align-items:center">${ui.avatar(w.name, w.name.length)}<div><div class="t-main">${esc(w.name)}</div><div class="t-sub">${esc(w.phone || '—')}</div></div></div>` },
        { h: 'Görev', c: (w) => `${ui.badge(w.role, w.role === 'Taşeron Ekibi' ? 'brand' : w.role === 'Usta' ? 'info' : 'muted')}${w.headcount > 1 ? ` <span class="sub">${w.headcount} kişi</span>` : ''}` },
        { h: 'Günlük yevmiye', cls: 'num', c: (w) => U.money(w.wage) }, { h: 'Şantiye', c: (w) => `<span class="sub">${esc(ui.projectName(w.projectId))}</span>` },
        { h: 'Başlangıç', c: (w) => U.fmtDate(w.start) }, { h: 'Durum', c: (w) => (w.active === false ? ui.badge('Pasif', 'muted') : ui.badge('Aktif', 'ok')) },
        { h: '', act: true, c: (w) => `<button class="btn sm ghost" data-action="wk.edit" data-id="${w.id}">${I('edit')}Düzenle</button>` }] })}</div>`)}`;
  }
  function wkForm(w) {
    const act = C.active(), pid = w ? w.projectId : act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0]).id;
    ui.form({
      title: w ? 'Personeli Düzenle' : 'Yeni Personel', values: w || { role: 'Düz İşçi', projectId: pid, headcount: 1, active: true, start: U.today(), wage: 2200 },
      fields: [{ name: 'name', label: 'Ad soyad / ekip adı', required: true }, { name: 'role', label: 'Görev', type: 'select', options: SS.C.roles }, { name: 'wage', label: 'Günlük yevmiye (₺)', type: 'money', required: true, min: 1 },
        { name: 'headcount', label: 'Kişi sayısı', type: 'number', min: 1, step: 1, hint: 'Ekipler için ekipteki kişi sayısı' }, { name: 'phone', label: 'Telefon', type: 'tel' },
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'start', label: 'İşe başlama', type: 'date' }, { name: 'note', label: 'Not / uzmanlık', half: true }, { name: 'active', type: 'check', label: 'Aktif', text: 'Aktif çalışan (puantaja dahil)' }],
      danger: w ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Personel silinsin mi?', text: `${esc(w.name)} listeden kaldırılır. Geçmiş puantaj kayıtları arşivde kalır; kişiyi puantajdan çıkarmak için "Aktif" kutusunu kaldırmanız yeterlidir.` })) { SS.store.del('workers', w.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) { const d = { name: v.name, role: v.role, wage: v.wage, headcount: v.headcount || 1, phone: v.phone, projectId: v.projectId, start: v.start, note: v.note, active: v.active }; if (w) SS.store.upd('workers', w.id, d); else SS.store.add('workers', d, 'w'); ui.rerender(); ui.toast('Personel kaydedildi'); },
    });
  }
  SS.actions['wk.new'] = () => wkForm(null);
  SS.actions['wk.edit'] = (el) => wkForm(SS.store.find('workers', el.dataset.id));

  SS.views.workforce = {
    title: 'Personel & Puantaj',
    render() {
      const s = S();
      return `<div class="page">${ui.head({ title: 'Personel & Puantaj', sub: 'Tek dokunuşla günlük puantaj · ay sonunda otomatik hakediş-maaş hesabı', actions: `${SS.exp.menu('payroll', 'Puantaj Cetveli')}<button class="btn primary" data-action="wk.new">${I('plus')}Personel Ekle</button>` })}
        ${ui.tabs('workforce', 'tab', [['day', 'Günlük Puantaj'], ['month', 'Aylık Cetvel & Hakediş'], ['list', 'Personel Listesi', C.scope('workers').length]], s.tab)}
        ${s.tab === 'month' ? monthView() : s.tab === 'list' ? listView() : dayView()}</div>`;
    },
  };
})();
