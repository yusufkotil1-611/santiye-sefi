/* Şantiye Şefi — hesaplama motorları, uyarılar ve içgörüler */
(function () {
  const SS = window.SS, U = SS.U;
  const C = (SS.calc = {});

  C.active = () => SS.cfg.activeProject;
  C.scope = (coll) => { const a = C.active(); const r = SS.D[coll]; return a === 'all' ? r : r.filter((x) => x.projectId === a); };
  C.projects = () => { const a = C.active(); return a === 'all' ? SS.D.projects : SS.D.projects.filter((p) => p.id === a); };
  C.proj = (id) => SS.D.projects.find((p) => p.id === id);
  C.firm = (id) => SS.D.firms.find((f) => f.id === id);
  C.inRange = (d, from, to) => (!from || d >= from) && (!to || d <= to);

  /* ---------- proje ilerleme ---------- */
  C.progress = (p) => {
    const fl = (p.blocks || []).flatMap((b) => b.floors);
    if (fl.length) return U.sum(fl, (f) => f.progress) / fl.length;
    return p.progress || 0;
  };
  C.blockProgress = (b) => (b.floors.length ? U.sum(b.floors, (f) => f.progress) / b.floors.length : 0);
  C.planned = (p) => {
    const tot = U.diff(p.start, p.end); if (tot <= 0) return 100;
    return U.clamp((U.diff(p.start, U.today()) / tot) * 100, 0, 100);
  };
  C.avgProgress = () => { const ps = C.projects().filter((p) => p.status === 'active'); return ps.length ? U.sum(ps, C.progress) / ps.length : 0; };
  C.taskStatus = (t) => (t.progress >= 100 ? 'Tamam' : t.end < U.today() ? 'Gecikti' : t.progress > 0 ? 'Devam' : 'Bekliyor');

  /* ---------- harcama ---------- */
  C.expStatus = (e) => (e.status === 'Vadeli' && e.dueDate && e.dueDate < U.today() ? 'Gecikmiş' : e.status);
  C.cashDate = (e) => (e.status === 'Ödendi' ? e.paidDate || e.date : e.date);
  C.expenses = ({ from, to, cat, status, pid } = {}) => {
    const a = pid || C.active();
    return SS.D.expenses.filter((e) => (a === 'all' || e.projectId === a) && (!cat || e.category === cat) && (!status || C.expStatus(e) === status) && C.inRange(e.date, from, to));
  };
  C.spent = (pid) => U.sum(SS.D.expenses.filter((e) => e.projectId === pid), (e) => e.amount);
  C.catTotals = (from, to, pid) => { const m = {}; SS.C.cats.forEach((c) => (m[c] = 0)); C.expenses({ from, to, pid }).forEach((e) => { m[e.category] = (m[e.category] || 0) + e.amount; }); return m; };
  C.monthlyAllowance = (p, cat) => { const months = Math.max(1, U.diff(p.start, p.end) / 30.4); return ((p.budget || {})[cat] || 0) / months; };

  /* ---------- stok ---------- */
  C.stock = (m) => m.opening + U.sum(SS.D.movements.filter((x) => x.materialId === m.id), (x) => (x.type === 'giris' ? x.qty : -x.qty));
  C.usage = (m, days = 14) => {
    const from = U.addDays(U.today(), -days + 1);
    return U.sum(SS.D.movements.filter((x) => x.materialId === m.id && x.type === 'cikis' && x.date >= from), (x) => x.qty) / days;
  };
  C.daysLeft = (m) => { const u = C.usage(m); return u > 0 ? C.stock(m) / u : Infinity; };
  C.criticalMats = () => C.scope('materials').filter((m) => m.critical > 0 && C.stock(m) <= m.critical);

  /* ---------- personel ---------- */
  C.attMult = (code) => (code === 'FM' ? SS.cfg.overtime : (SS.C.att[code] || {}).mult || 0);
  C.workers = () => C.scope('workers').filter((w) => w.active !== false);
  C.attOf = (date, wid) => (SS.D.attendance[date] || {})[wid];
  C.laborCost = (from, to) => {
    const ws = C.workers(); let total = 0, days = 0; const byRole = {};
    U.dates(from, to).forEach((d) => {
      const day = SS.D.attendance[d]; if (!day) return;
      ws.forEach((w) => { const m = C.attMult(day[w.id]); if (m) { const cost = w.wage * m; total += cost; days += m * (w.headcount || 1); byRole[w.role] = (byRole[w.role] || 0) + cost; } });
    });
    return { total, days, byRole };
  };
  C.payroll = (month) => {
    const from = U.monthStart(month), to = U.monthEnd(month), dates = U.dates(from, to);
    return C.workers().map((w) => {
      const counts = { T: 0, Y: 0, FM: 0, I: 0, D: 0 }; let days = 0;
      dates.forEach((d) => { const c = (SS.D.attendance[d] || {})[w.id]; if (c) { counts[c]++; days += C.attMult(c); } });
      const advance = U.sum(SS.D.advances.filter((a) => a.workerId === w.id && U.monthKey(a.date) === month), (a) => a.amount);
      const gross = days * w.wage;
      const paid = SS.D.payrolls.find((p) => p.workerId === w.id && p.month === month);
      return { w, counts, days, gross, advance, net: gross - advance, paid };
    });
  };
  C.presentToday = (date = U.today()) => {
    const day = SS.D.attendance[date] || {}; const ws = C.workers();
    const marked = ws.filter((w) => day[w.id]); const present = ws.filter((w) => ['T', 'Y', 'FM'].includes(day[w.id]));
    return { total: ws.length, marked: marked.length, present: present.length, heads: U.sum(present, (w) => w.headcount || 1) };
  };

  /* ---------- hakediş motoru ---------- */
  C.hakedisCalc = (contract, o) => {
    const gross = U.round2((contract.amount * (o.cumPct - o.prevPct)) / 100);
    const retention = U.round2((gross * (o.retentionPct || 0)) / 100);
    const stamp = o.stampOn ? U.round2(gross * 0.00948) : 0;
    const advance = Math.min(o.advance || 0, gross);
    const other = o.other || 0;
    const kdv = U.round2((gross * (o.kdvPct || 0)) / 100);
    const total = U.round2(gross - retention - stamp - advance - other + kdv);
    return { gross, retention, stamp, advance, other, kdv, total };
  };
  C.contractHakedis = (c) => SS.D.hakedis.filter((h) => h.contractId === c.id).sort((a, b) => a.no - b.no);
  C.contractStats = (c) => {
    const hs = C.contractHakedis(c).filter((h) => h.status !== 'Taslak');
    const billed = U.sum(hs, (h) => h.total), paid = U.sum(hs, (h) => h.paidAmount || 0);
    const cumPct = hs.length ? Math.max(...hs.map((h) => h.cumPct)) : 0;
    return { billed, paid, balance: billed - paid, cumPct, cumGross: (c.amount * cumPct) / 100, remainingWork: c.amount - (c.amount * cumPct) / 100, count: hs.length };
  };
  C.contractDays = (c) => (c.end ? U.diff(U.today(), c.end) : null);

  /* ---------- satış / tahsilat ---------- */
  C.unitStats = (units = C.scope('units')) => {
    const sold = units.filter((u) => u.status === 'Satıldı'), today = U.today();
    const plan = sold.flatMap((u) => u.plan || []);
    return {
      total: units.length, sold: sold.length, reserved: units.filter((u) => u.status === 'Rezerve').length, free: units.filter((u) => u.status === 'Müsait').length,
      revenue: U.sum(sold, (u) => u.salePrice), collected: U.sum(plan.filter((p) => p.paid), (p) => p.amount), receivable: U.sum(plan.filter((p) => !p.paid), (p) => p.amount),
      overdue: U.sum(plan.filter((p) => !p.paid && p.due < today), (p) => p.amount), overdueN: plan.filter((p) => !p.paid && p.due < today).length,
      listValue: U.sum(units, (u) => u.listPrice),
    };
  };
  C.installments = () => C.scope('units').filter((u) => u.status === 'Satıldı').flatMap((u) => (u.plan || []).map((p) => Object.assign({ unit: u, customer: SS.D.customers.find((c) => c.id === u.customerId) }, p)));

  /* ---------- nakit akışı ---------- */
  C.cashflow = (n = 6) => {
    const months = U.monthsBack(n); const a = C.active();
    const out = Object.fromEntries(months.map((m) => [m, 0])), inn = Object.fromEntries(months.map((m) => [m, 0]));
    SS.D.expenses.forEach((e) => { if (e.status !== 'Ödendi' || (a !== 'all' && e.projectId !== a)) return; const k = U.monthKey(C.cashDate(e)); if (k in out) out[k] += e.amount; });
    SS.D.units.forEach((u) => { if (a !== 'all' && u.projectId !== a) return; (u.plan || []).forEach((p) => { if (p.paid) { const k = U.monthKey(p.paidDate || p.due); if (k in inn) inn[k] += p.amount; } }); });
    SS.D.hakedis.forEach((h) => { const c = SS.D.contracts.find((x) => x.id === h.contractId); if (!c || c.dir !== 'gelir' || (a !== 'all' && h.projectId !== a)) return; (h.payments || []).forEach((p) => { const k = U.monthKey(p.date); if (k in inn) inn[k] += p.amount; }); });
    return months.map((k) => ({ key: k, label: U.monthShort(k), in: inn[k], out: out[k], net: inn[k] - out[k] }));
  };
  C.totals = () => {
    const a = C.active(); const exp = C.expenses();
    const incl = U.sum(exp, (e) => e.amount);
    const payable = U.sum(exp.filter((e) => e.status !== 'Ödendi'), (e) => e.amount);
    const us = C.unitStats();
    const hakAl = U.sum(SS.D.hakedis.filter((h) => (a === 'all' || h.projectId === a) && h.status !== 'Taslak' && (SS.D.contracts.find((c) => c.id === h.contractId) || {}).dir === 'gelir'), (h) => h.total - (h.paidAmount || 0));
    const hakBorc = U.sum(SS.D.hakedis.filter((h) => (a === 'all' || h.projectId === a) && h.status === 'Onaylandı' && (SS.D.contracts.find((c) => c.id === h.contractId) || {}).dir !== 'gelir'), (h) => h.total - (h.paidAmount || 0));
    return { spent: incl, payable, hakBorc, receivable: us.receivable + hakAl, hakAl, us };
  };

  /* ---------- makine ---------- */
  C.machineNext = (m) => (m.serviceEvery ? (m.lastService || 0) + m.serviceEvery : null);
  C.machineRemain = (m) => { const n = C.machineNext(m); return n == null ? null : n - m.hours; };
  C.machineDue = (m) => { const r = C.machineRemain(m); const dd = m.nextServiceDate ? U.diff(U.today(), m.nextServiceDate) : null; return (r != null && r <= 30) || (dd != null && dd <= 7); };

  /* ---------- uyarılar ---------- */
  C.alerts = () => {
    const out = [], today = U.today();
    C.criticalMats().forEach((m) => { const s = C.stock(m); out.push({ mod: 'stock', level: 'bad', icon: 'box', title: `Kritik stok: ${m.name}`, text: `Kalan ${U.num(s, s % 1 ? 1 : 0)} ${m.unit} · kritik seviye ${U.num(m.critical)} ${m.unit}`, route: 'stock' }); });
    const exp = C.expenses();
    const od = exp.filter((e) => C.expStatus(e) === 'Gecikmiş');
    if (od.length) out.push({ mod: 'expenses', level: 'bad', icon: 'alert', title: `${od.length} gecikmiş ödeme`, text: `Toplam ${U.money(U.sum(od, (e) => e.amount))} vadesi geçmiş borç`, route: 'expenses' });
    const soon = exp.filter((e) => e.status === 'Vadeli' && e.dueDate && e.dueDate >= today && e.dueDate <= U.addDays(today, 7));
    if (soon.length) out.push({ mod: 'expenses', level: 'warn', icon: 'clock', title: `${soon.length} ödeme 7 gün içinde`, text: `${U.money(U.sum(soon, (e) => e.amount))} · ilk vade ${U.fmtDate(soon.map((e) => e.dueDate).sort()[0])}`, route: 'expenses' });
    const us = C.unitStats();
    if (us.overdueN) out.push({ mod: 'sales', level: 'warn', icon: 'tag', title: `${us.overdueN} geciken taksit`, text: `${U.money(us.overdue)} tahsilat bekliyor`, route: 'sales' });
    C.scope('contracts').filter((c) => c.status === 'Aktif' && c.end).forEach((c) => {
      const d = U.diff(today, c.end);
      if (d <= 30) out.push({ mod: 'contracts', level: d <= 7 ? 'bad' : 'warn', icon: 'file', title: d < 0 ? `Süresi dolmuş sözleşme` : `Sözleşme süresi yaklaşıyor`, text: `${c.title} · ${d < 0 ? -d + ' gün önce bitti' : d === 0 ? 'bugün bitiyor' : d + ' gün kaldı'}`, route: 'contracts' });
    });
    C.scope('machines').filter(C.machineDue).forEach((m) => { const r = C.machineRemain(m); out.push({ mod: 'machines', level: 'warn', icon: 'wrench', title: `Bakım zamanı: ${m.name}`, text: r != null ? (r <= 0 ? `Bakım ${U.num(-r)} saat gecikti` : `Bakıma ${U.num(r)} saat kaldı`) : 'Tarihli bakım yaklaşıyor', route: 'machines' }); });
    const crit = C.scope('punch').filter((p) => p.status !== 'Çözüldü' && (p.priority === 'Kritik' || p.priority === 'Yüksek'));
    if (crit.length) out.push({ mod: 'safety', level: 'bad', icon: 'flag', title: `${crit.length} yüksek öncelikli eksik/kusur`, text: crit.slice(0, 2).map((p) => p.title).join(' · '), route: 'safety' });
    const hd = SS.D.hakedis.filter((h) => h.status === 'Taslak' && (C.active() === 'all' || h.projectId === C.active()));
    if (hd.length) out.push({ mod: 'hakedis', level: 'info', icon: 'clipboard', title: `${hd.length} hakediş taslağı onay bekliyor`, text: 'Taslakları gözden geçirip onaylayın', route: 'hakedis' });
    const pr = C.presentToday();
    if (pr.total && pr.marked < pr.total && U.dow(today) !== 0) out.push({ mod: 'workforce', level: 'info', icon: 'users', title: 'Bugünün puantajı eksik', text: `${pr.marked}/${pr.total} kişi işaretlendi`, route: 'workforce' });
    const sc = C.scope('safety'); if (C.active() !== 'all' || C.projects().length) { if (!sc.some((s) => s.date === today) && U.dow(today) !== 0) out.push({ mod: 'safety', level: 'info', icon: 'shield', title: 'Günlük İSG kontrolü yapılmadı', text: 'Baret, iskele, korkuluk kontrol listesini doldurun', route: 'safety' }); }
    const lv = { bad: 0, warn: 1, info: 2 };
    return out.sort((a, b) => lv[a.level] - lv[b.level]);
  };
  C.badges = () => {
    const b = {};
    C.alerts().forEach((a) => { if (a.level === 'info') return; const x = (b[a.mod] = b[a.mod] || { n: 0, level: 'warn' }); x.n++; if (a.level === 'bad') x.level = 'bad'; });
    return b;
  };

  /* ---------- içgörüler (Şantiye AI) ---------- */
  C.insights = () => {
    const out = [], today = U.today(), mk = U.monthKey(today);
    const push = (o) => out.push(o);
    C.projects().filter((p) => p.status === 'active').forEach((p) => {
      const tag = C.projects().length > 1 ? `${p.shortName}: ` : '';
      const mtd = C.catTotals(U.monthStart(mk), today, p.id);
      SS.C.cats.forEach((cat) => {
        const al = C.monthlyAllowance(p, cat); if (al <= 0) return;
        const over = (mtd[cat] / al - 1) * 100;
        if (over > 8 && mtd[cat] > 0) push({ level: over > 15 ? 'bad' : 'warn', icon: 'trend', title: `${tag}Bu ay ${cat.toLowerCase()} maliyeti bütçeyi %${Math.round(over)} aştı`, text: `Ay başından beri ${U.money(mtd[cat])} harcandı; aylık bütçe payı ${U.money(al)}.`, route: 'expenses', score: 80 + over / 5 });
      });
      const spentPct = (C.spent(p.id) / (p.totalBudget || 1)) * 100, prog = C.progress(p), pl = C.planned(p);
      if (spentPct - prog > 8) push({ level: 'warn', icon: 'wallet', title: `${tag}Harcama ilerlemenin %${Math.round(spentPct - prog)} önünde`, text: `Bütçenin %${Math.round(spentPct)}'i harcandı, fiziksel ilerleme %${Math.round(prog)}.`, route: 'projects/' + p.id, score: 70 });
      else if (prog - spentPct > 3) push({ level: 'ok', icon: 'check', title: `${tag}Bütçe kontrol altında`, text: `Fiziksel ilerleme %${Math.round(prog)} iken bütçenin %${Math.round(spentPct)}'i kullanıldı.`, route: 'projects/' + p.id, score: 20 });
      if (prog - pl < -5) push({ level: prog - pl < -12 ? 'bad' : 'warn', icon: 'clock', title: `${tag}Takvime göre %${Math.round(pl - prog)} geride`, text: `Planlanan ilerleme %${Math.round(pl)}, gerçekleşen %${Math.round(prog)}.`, route: 'projects/' + p.id, score: 75 });
    });
    C.scope('materials').filter((m) => m.critical > 0).forEach((m) => {
      const d = C.daysLeft(m); const s = C.stock(m);
      if (isFinite(d) && d <= 7) push({ level: d <= 3 ? 'bad' : 'warn', icon: 'box', title: `${m.name} stoğu ${d < 1 ? '1 günden az' : Math.ceil(d) + ' gün'} içinde tükenecek`, text: `Mevcut ${U.num(s, 1)} ${m.unit}, son 14 gün ortalama tüketim ${U.num(C.usage(m), 1)} ${m.unit}/gün.`, route: 'stock', score: 90 - d });
    });
    const a = C.active();
    const od = C.expenses().filter((e) => C.expStatus(e) === 'Gecikmiş');
    if (od.length) push({ level: 'bad', icon: 'alert', title: `${od.length} gecikmiş ödeme · ${U.money(U.sum(od, (e) => e.amount))}`, text: 'Vadesi geçen borçlar tedarikçi ilişkilerini ve nakit planını riske atıyor.', route: 'expenses', score: 85 });
    const us = C.unitStats();
    if (us.overdueN) push({ level: 'warn', icon: 'tag', title: `${us.overdueN} taksit gecikti · ${U.money(us.overdue)}`, text: 'Geciken müşterileri arayarak tahsilat takvimini güncelleyin.', route: 'sales', score: 72 });
    const from7 = U.addDays(today, -6); const days = U.dates(from7, today).filter((d) => SS.D.attendance[d] && U.dow(d) !== 0);
    if (days.length) { let t = 0, ab = 0; days.forEach((d) => C.workers().forEach((w) => { const c = SS.D.attendance[d][w.id]; if (c) { t++; if (c === 'D') ab++; } })); if (t && ab / t > 0.06) push({ level: 'warn', icon: 'users', title: `Son 7 günde devamsızlık oranı %${Math.round((ab / t) * 100)}`, text: `${ab} devamsızlık kaydı var; ekip planlamasını gözden geçirin.`, route: 'workforce', score: 60 }); }
    const rain = C.scope('diary').filter((d) => d.date >= U.addDays(today, -14) && d.stopped);
    if (rain.length) push({ level: 'info', icon: 'rain', title: `Son 14 günde ${rain.length} gün hava nedeniyle iş durdu`, text: `Toplam ${U.sum(rain, (d) => d.stopHours || 0)} saat kayıp. Program revizyonu gerekebilir.`, route: 'diary', score: 50 });
    const cf = C.cashflow(2); const last = cf[cf.length - 1];
    if (last && last.in + last.out > 0) push({ level: last.net >= 0 ? 'ok' : 'info', icon: 'wallet', title: `Bu ay net nakit ${last.net >= 0 ? 'girişi' : 'çıkışı'} ${U.money(Math.abs(last.net))}`, text: `Tahsilat ${U.money(last.in)}, ödeme ${U.money(last.out)}.`, route: 'expenses', score: 30 });
    const sf = C.scope('safety').sort((x, y) => y.date.localeCompare(x.date))[0];
    if (sf && sf.score < 85) push({ level: 'warn', icon: 'shield', title: `Son İSG kontrol skoru %${sf.score}`, text: 'Uygunsuz maddeleri kapatmak için eksik/kusur kartı açın.', route: 'safety', score: 65 });
    C.scope('machines').filter(C.machineDue).forEach((m) => push({ level: 'warn', icon: 'wrench', title: `${m.name} bakım zamanı yaklaşıyor`, text: `Kalan çalışma: ${U.num(C.machineRemain(m) ?? 0)} saat.`, route: 'machines', score: 55 }));
    const lv = { bad: 0, warn: 1, info: 2, ok: 3 };
    return out.sort((x, y) => lv[x.level] - lv[y.level] || (y.score || 0) - (x.score || 0));
  };
})();
