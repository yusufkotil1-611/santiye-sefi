/* Ana Sayfa — komuta paneli */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;
  const tone = (l) => (l === 'bad' ? 'bad' : l === 'warn' ? 'warn' : l === 'ok' ? 'ok' : 'info');

  function hero() {
    const ps = C.projects();
    if (ps.length === 1) {
      const p = ps[0], pg = C.progress(p), pl = C.planned(p), spent = C.spent(p.id), delta = pg - pl;
      const st = p.status === 'active' ? ['Aktif', 'ok'] : p.status === 'planned' ? ['Planlanan', 'info'] : ['Tamamlandı', 'muted'];
      return `<div class="card hero"><div class="hero-main"><div class="hero-t"><span class="badge ${st[1]}">${st[0]}</span><h2>${esc(p.name)}</h2>
        <p>${I('pin')}${esc(p.location)} <span class="dot">•</span> ${U.fmtDate(p.start)} → ${U.fmtDate(p.end)}</p></div>
        ${G.ring(pg, { size: 132, stroke: 13, tone: '#ff9e57', sub: 'fiziksel ilerleme' })}</div>
        <div class="hero-stats"><div><small>Bütçe</small><b>${U.compact(p.totalBudget)}</b></div><div><small>Harcanan</small><b>${U.compact(spent)}</b><i>%${U.num((spent / (p.totalBudget || 1)) * 100)}</i></div>
        <div><small>Plana göre</small><b class="${delta >= -2 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${U.num(delta, 1)} puan</b><i>planlanan %${U.num(pl)}</i></div>
        <div><small>Kalan süre</small><b>${Math.max(0, U.diff(U.today(), p.end))} gün</b><i>${U.fmtDate(p.end)}</i></div></div>
        ${(p.blocks || []).length ? `<div class="hero-blocks">${p.blocks.map((b) => { const bp = C.blockProgress(b); return `<div><span>${esc(b.name)}</span><div class="bar sm hero-bar"><i style="width:${bp}%"></i></div><em>%${U.num(bp)}</em></div>`; }).join('')}</div>` : ''}
        <a class="hero-link" href="#/projects/${p.id}">Proje detayı ${I('chevR')}</a></div>`;
    }
    const act = ps.filter((p) => p.status === 'active');
    return `<div class="card hero"><div class="hero-main"><div class="hero-t"><span class="badge ok">${act.length} aktif şantiye</span><h2>Tüm Şantiyeler</h2><p>${ps.length} proje · ortalama ilerleme</p></div>
      ${G.ring(C.avgProgress(), { size: 132, stroke: 13, tone: '#ff9e57', sub: 'ortalama' })}</div>
      <div class="hero-blocks tall">${act.map((p) => { const pg = C.progress(p); return `<a href="#/projects/${p.id}"><span>${esc(p.shortName)}</span><div class="bar sm hero-bar"><i style="width:${pg}%"></i></div><em>%${U.num(pg)}</em></a>`; }).join('')}</div>
      <a class="hero-link" href="#/projects">Tüm projeler ${I('chevR')}</a></div>`;
  }

  function quick() {
    const q = [['exp.new', 'receipt', 'Harcama Gir', 'brand'], ['stock.in', 'box', 'Malzeme Girişi', 'ok'], ['stock.out', 'arrowUp', 'Malzeme Çıkışı', 'warn'], ['wf.today', 'users', 'Puantaj Al', 'info'], ['diary.new', 'book', 'Defter Yaz', 'brand'], ['safety.check', 'shield', 'İSG Kontrolü', 'ok'], ['punch.new', 'flag', 'Eksik / Kusur', 'bad'], ['mach.log', 'truck', 'Makine Kaydı', 'info']];
    return `<div class="card pad"><div class="card-h flush"><h3>Hızlı İşlemler</h3></div><div class="qgrid">${q.map(([a, i, t, tn]) => `<button class="qbtn" data-action="${a}"><span class="kpi-ic tone-${tn}">${I(i)}</span><span>${t}</span></button>`).join('')}</div></div>`;
  }

  function alertsCard(alerts) {
    const items = alerts.slice(0, 7);
    return `<div class="card"><div class="card-h"><h3>Uyarılar & Hatırlatmalar</h3>${alerts.length ? `<span class="badge ${alerts.some((a) => a.level === 'bad') ? 'bad' : 'warn'}">${alerts.length}</span>` : ''}</div>
      <div class="card-b">${items.length ? `<ul class="alist">${items.map((a) => `<li><a href="#/${a.route}" class="a-${tone(a.level)}"><span class="kpi-ic tone-${tone(a.level)}">${I(a.icon)}</span><span class="a-t"><b>${esc(a.title)}</b><small>${esc(a.text)}</small></span>${I('chevR')}</a></li>`).join('')}</ul>` : ui.empty('check', 'Her şey yolunda', 'Bekleyen uyarı veya hatırlatma yok.')}</div></div>`;
  }

  function cashCard() {
    const cf = C.cashflow(6), last = cf[cf.length - 1], tin = U.sum(cf, (x) => x.in), tout = U.sum(cf, (x) => x.out);
    return `<div class="card"><div class="card-h"><h3>Nakit Akışı <span class="muted fw">son 6 ay</span></h3>
      <div class="chart-legend"><span><i style="background:var(--s3)"></i>Tahsilat</span><span><i style="background:var(--s2)"></i>Ödeme</span></div></div>
      <div class="card-b">${G.bars([{ name: 'Tahsilat', color: 'var(--s3)', data: cf.map((x) => x.in) }, { name: 'Ödeme', color: 'var(--s2)', data: cf.map((x) => x.out) }], cf.map((x) => x.label), { height: 220, net: (i) => `Net: ${U.money(cf[i].net)}` })}
      <div class="cf-sum"><div><small>Toplam tahsilat</small><b class="pos">${U.compact(tin)}</b></div><div><small>Toplam ödeme</small><b>${U.compact(tout)}</b></div><div><small>Bu ay net</small><b class="${last.net >= 0 ? 'pos' : 'neg'}">${U.compact(last.net)}</b></div></div></div></div>`;
  }

  function expenseCard() {
    const st = ui.vs('dashboard', { period: 'month' }), today = U.today();
    const from = st.period === 'month' ? U.monthStart(U.monthKey(today)) : '', tot = C.catTotals(from, today);
    const items = SS.C.cats.map((c) => ({ label: c, value: tot[c] || 0, color: SS.C.catVar(c) })).filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
    return `<div class="card"><div class="card-h"><h3>Gider Dağılımı</h3>${ui.seg('dashboard', 'period', [['month', 'Bu ay'], ['all', 'Toplam']], st.period)}</div>
      <div class="card-b">${items.length ? `<div class="donut-row v">${G.donut(items, { size: 170, stroke: 24, center: { big: U.compact(U.sum(items, (i) => i.value)), small: st.period === 'month' ? 'bu ay' : 'toplam' } })}${G.legend(items, U.compact)}</div>` : ui.empty('receipt', 'Harcama yok', 'Seçili dönemde kayıt bulunamadı.')}</div></div>`;
  }

  function salesCard() {
    const us = C.unitStats();
    if (!us.total) return `<div class="card"><div class="card-h"><h3>Satış Durumu</h3></div><div class="card-b">${ui.empty('tag', 'Satış birimi yok', 'Bu şantiye için daire/ünite tanımlı değil.')}</div></div>`;
    const pct = (us.sold / us.total) * 100;
    return `<a class="card link" href="#/sales"><div class="card-h"><h3>Satış Durumu</h3>${I('chevR')}</div><div class="card-b"><div class="row" style="gap:18px">${G.ring(pct, { size: 112, stroke: 12, tone: 'var(--s3)', sub: 'satıldı' })}
      <div class="stack" style="gap:8px;flex:1"><div class="row between"><span class="badge ok">Satıldı</span><b>${us.sold}</b></div><div class="row between"><span class="badge warn">Rezerve</span><b>${us.reserved}</b></div><div class="row between"><span class="badge info">Müsait</span><b>${us.free}</b></div></div></div>
      <div class="divider"></div><div class="row between"><small class="muted">Tahsil edilen</small><b>${U.compact(us.collected)}</b></div><div class="bar sm" style="margin:6px 0 8px">${`<i class="ok" style="width:${(us.collected / ((us.collected + us.receivable) || 1)) * 100}%"></i>`}</div><div class="row between"><small class="muted">Kalan alacak</small><b>${U.compact(us.receivable)}</b></div></div></a>`;
  }

  function aiCard() {
    const ins = C.insights().slice(0, 3);
    return `<div class="card ai-mini"><div class="card-h"><h3>${I('sparkles')} Şantiye AI Önerileri</h3></div><div class="card-b stack">${ins.length ? ins.map((i) => `<a class="ins ins-${tone(i.level)}" href="#/${i.route}"><span class="kpi-ic tone-${tone(i.level)}">${I(i.icon)}</span><span><b>${esc(i.title)}</b><small>${esc(i.text)}</small></span></a>`).join('') : '<p class="muted">Şu an dikkat gerektiren bir durum görünmüyor.</p>'}
      <a class="btn soft block" href="#/ai">${I('bot')} Asistana soru sor</a></div></div>`;
  }

  function todayCard() {
    const pr = C.presentToday(), t = U.today(), dir = C.scope('diary').find((d) => d.date === t), sf = C.scope('safety').find((d) => d.date === t);
    const lastD = C.scope('diary').sort((a, b) => b.date.localeCompare(a.date))[0];
    const wi = lastD ? SS.C.weather.find((w) => w.k === lastD.weather) : null;
    const row = (ok, label, sub, action) => `<div class="trow ${ok ? 'done' : ''}"><span class="tick">${ok ? I('check') : ''}</span><span class="grow"><b>${label}</b><small>${sub}</small></span>${ok ? '' : `<button class="btn sm soft" data-action="${action}">Yap</button>`}</div>`;
    return `<div class="card"><div class="card-h"><h3>Bugün Sahada</h3>${wi ? `<span class="badge info">${I(wi.icon)}${lastD.weather} ${lastD.temp}°</span>` : ''}</div><div class="card-b stack" style="gap:6px">
      <div class="row between"><span class="muted">Sahadaki kişi</span><b class="big">${pr.heads}</b></div>
      ${pr.total ? `<div class="bar" title="Puantaj"><i class="${pr.marked === pr.total ? 'ok' : 'brand'}" style="width:${(pr.marked / pr.total) * 100}%"></i></div><small class="muted">Puantaj: ${pr.marked}/${pr.total} kişi işaretlendi</small>` : ''}
      <div class="divider" style="margin:8px 0"></div>
      ${row(pr.total && pr.marked === pr.total, 'Puantaj', `${pr.marked}/${pr.total} kişi`, 'wf.today')}${row(!!dir, 'Günlük defter', dir ? 'Yazıldı' : 'Henüz yazılmadı', 'diary.new')}${row(!!sf, 'İSG kontrolü', sf ? `Skor %${sf.score}` : 'Yapılmadı', 'safety.check')}</div></div>`;
  }

  function projectsCard() {
    const ps = C.projects();
    return `<div class="card"><div class="card-h"><h3>Şantiyeler</h3><a class="btn sm ghost" href="#/projects">Tümü ${I('chevR')}</a></div><div class="card-b stack">${ps.map((p) => { const pg = C.progress(p), st = p.status === 'active' ? ['Aktif', 'ok'] : p.status === 'planned' ? ['Planlanan', 'info'] : ['Tamamlandı', 'muted']; return `<a class="prow" href="#/projects/${p.id}"><div class="row between"><b>${esc(p.shortName)}</b><span class="badge ${st[1]}">${st[0]}</span></div><div class="row" style="gap:12px">${ui.bar(pg, st[1] === 'muted' ? 'muted' : 'brand')}<b class="pp">%${U.num(pg)}</b></div></a>`; }).join('')}</div></div>`;
  }

  SS.views.dashboard = {
    title: 'Ana Sayfa',
    render() {
      const h = new Date().getHours(), g = h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi çalışmalar' : 'İyi akşamlar';
      const t = C.totals(), alerts = C.alerts(), crit = C.criticalMats(), pr = C.presentToday();
      const mk = U.monthKey(U.today()), mtd = U.sum(C.expenses({ from: U.monthStart(mk), to: U.today() }), (e) => e.amount);
      const prev = U.sum(C.expenses({ from: U.monthStart(U.monthKey(U.addMonths(U.monthStart(mk), -1))), to: U.addDays(U.monthStart(mk), -1) }), (e) => e.amount);
      const od = C.expenses().filter((e) => C.expStatus(e) === 'Gecikmiş');
      return `<div class="page">
        ${ui.head({ title: `${g}, ${esc(SS.cfg.user)}`, sub: U.fmtDateLong(U.today()), actions: `<a class="btn" href="#/reports">${I('chart')}Rapor Al</a><a class="btn primary" href="#/ai">${I('sparkles')}Şantiye AI</a>` })}
        ${crit.length ? `<a class="banner bad" href="#/stock"><span class="pulse-dot"></span>${I('alert')}<span><b>${crit.length} malzeme kritik stok seviyesinin altında</b> — ${crit.slice(0, 3).map((m) => esc(m.name)).join(', ')}${crit.length > 3 ? '…' : ''}</span><em>Stoğa git ${I('chevR')}</em></a>` : ''}
        <div class="grid g-21">${hero()}${quick()}</div>
        <div class="grid g-4 kpis">
          ${ui.kpi({ label: 'Bu ay gider', value: mtd, fmt: 'compact', icon: 'receipt', tone: 'brand', sub: prev ? `${mtd >= prev ? '↑' : '↓'} geçen ay ${U.compact(prev)}` : 'ay başından beri', href: '#/expenses' })}
          ${ui.kpi({ label: 'Ödenecek borç', value: t.payable + t.hakBorc, fmt: 'compact', icon: 'wallet', tone: od.length ? 'bad' : 'warn', sub: od.length ? `${od.length} ödeme gecikmiş` : 'vadeli ödemeler', href: '#/expenses' })}
          ${ui.kpi({ label: 'Tahsil edilecek', value: t.receivable, fmt: 'compact', icon: 'trend', tone: 'ok', sub: t.us.overdueN ? `${t.us.overdueN} taksit gecikmiş` : 'satış + hakediş alacağı', href: '#/sales' })}
          ${ui.kpi({ label: 'Bugün sahada', value: pr.heads, fmt: 'num', icon: 'hardhat', tone: 'info', sub: `${pr.marked}/${pr.total} puantaj girildi`, href: '#/workforce' })}
        </div>
        <div class="grid g-21">${cashCard()}${alertsCard(alerts)}</div>
        <div class="grid g-3">${expenseCard()}${salesCard()}${aiCard()}</div>
        <div class="grid g-2">${projectsCard()}${todayCard()}</div></div>`;
    },
  };
})();
