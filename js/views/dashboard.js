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


  /* ---------- ilk kullanım: boş pano ve başlangıç rehberi ---------- */
  SS.css(`
  .start{overflow:hidden}.start-body{padding:22px;display:flex;flex-direction:column;gap:14px;align-items:flex-start}.start-body h2{font-size:23px;letter-spacing:-.02em;line-height:1.25}.start-body p{color:var(--muted);max-width:560px}
  .start .wl-art{max-height:210px;object-fit:cover;object-position:center bottom}
  .gstep{display:flex;align-items:center;gap:12px;padding:10px 4px;border-top:1px solid var(--line-2)}.gstep:first-of-type{border-top:0}.gstep .tick{width:26px;height:26px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;flex:none;color:transparent}.gstep.done .tick{background:var(--ok);border-color:var(--ok);color:#fff}.gstep .tick .ic{width:15px;height:15px;stroke-width:3}
  .gstep b{display:block;font-size:14.5px}.gstep small{color:var(--muted);font-size:12.5px}.gstep.done b{text-decoration:line-through;color:var(--muted)}.gstep .grow{min-width:0}
  .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}.feat{display:flex;gap:12px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);align-items:flex-start;transition:transform .18s var(--ease),border-color .15s}.feat:hover{transform:translateY(-2px);border-color:var(--brand)}.feat .kpi-ic{margin:0;flex:none}.feat b{display:block;font-size:14px}.feat small{color:var(--muted);font-size:12.5px;line-height:1.35}
  `);
  const guideSteps = () => [
    ['proj', 'İlk şantiyenizi ekleyin', 'Ad, konum, süre ve bütçe', SS.D.projects.length > 0, 'proj.new', 'building'],
    ['firm', 'Tedarikçi / taşeron ekleyin', 'Harcama ve hakediş için firmalar', SS.D.firms.length > 0, 'firm.new', 'users'],
    ['mat', 'Malzemelerinizi tanımlayın', 'Çimento, demir, tuğla… stok takibi için', SS.D.materials.length > 0, 'mat.new', 'box'],
    ['wk', 'Personel ekleyin', 'Puantaj ve yevmiye hesabı için', SS.D.workers.length > 0, 'wk.new', 'hardhat'],
    ['exp', 'İlk harcamanızı girin', 'Kategori, firma ve vade ile', SS.D.expenses.length > 0, 'exp.new', 'receipt'],
    ['att', 'İlk puantajı alın', 'Tek dokunuşla tam / yarım / mesai', Object.keys(SS.D.attendance).length > 0, 'wf.today', 'check'],
    ['bk', 'Verilerinizi yedekleyin', 'Veriler bu cihazda saklanır; yedek güvence verir', !!SS.cfg.lastBackup, 'set.backup', 'download'],
  ];
  function guideCard() {
    const st = guideSteps(), done = st.filter((s) => s[3]).length;
    if (SS.cfg.guideHidden || done === st.length) return '';
    return `<div class="card"><div class="card-h"><h3>Başlangıç Rehberi <span class="muted fw">${done}/${st.length}</span></h3><button class="btn sm ghost" data-action="dash.hideGuide">Gizle</button></div><div class="card-b">${ui.bar((done / st.length) * 100, 'ok', 'sm')}<div style="margin-top:8px">${st.filter((x) => !x[3] || done < 3).map(([k, t, d, ok, a, ic]) => `<div class="gstep ${ok ? 'done' : ''}"><span class="tick">${I('check')}</span><div class="grow"><b>${t}</b><small>${d}</small></div>${ok ? '' : `<button class="btn sm soft" data-action="${a}">${I(ic)}Yap</button>`}</div>`).join('')}</div></div></div>`;
  }
  function emptyDash(g) {
    return `<div class="page">${ui.head({ title: `${g}, ${esc(SS.cfg.user)}`, sub: U.fmtDateLong(U.today()) })}
      <div class="card start">${SS.welcome.art()}<div class="start-body"><h2>Şantiyenizi birlikte kuralım</h2><p>Henüz kayıtlı şantiyeniz yok. İlk şantiyenizi ekleyin; ardından harcama, stok, personel ve hakedişlerinizi girdikçe bu pano gerçek rakamlarla dolacak ve Şantiye AI size yorum yapmaya başlayacak.</p>
        <div class="row wrap"><button class="btn primary" data-action="proj.new">${I('building')}İlk şantiyemi ekle</button><a class="btn" href="#/ai">${I('sparkles')}Şantiye AI ile tanış</a><a class="btn ghost" href="#/guide">${I('calculator')}Hesaplayıcılar</a></div></div></div>
      ${guideCard()}
      <div><div class="section-t" style="margin-bottom:10px">Neler yapabilirsiniz?</div><div class="feat-grid">${[['receipt', 'brand', 'Harcama & ödeme', 'Vade, gecikme, firma cari hesapları', 'expenses'], ['box', 'ok', 'Stok & satın alma', 'Kritik seviye ve tükenme tahmini', 'stock'], ['users', 'info', 'Puantaj & maaş', 'Tek dokunuşla yevmiye hesabı', 'workforce'], ['cube', 'info', 'Beton & numune', '7/28 gün kırım takvimi', 'concrete'], ['calculator', 'warn', 'Rehber & hesaplar', 'Beton, demir, tuğla metrajı', 'guide'], ['note', 'brand', 'Form & tutanaklar', 'İSG, kaza, kabul formları (PDF)', 'forms']].map(([ic, tn, t, d, r]) => `<a class="feat" href="#/${r}"><span class="kpi-ic tone-${tn}">${I(ic)}</span><span><b>${t}</b><small>${d}</small></span></a>`).join('')}</div></div></div>`;
  }
  /* WhatsApp / paylaşım için günlük özet metni */
  function dailyText() {
    const t = U.today(), pid = C.active(), name = pid === 'all' ? 'Tüm şantiyeler' : ui.projectName(pid), pr = C.presentToday(), dr = C.scope('diary').find((d) => d.date === t), sf = C.scope('safety').find((d) => d.date === t);
    const exp = C.expenses({ from: t, to: t }), mv = SS.D.movements.filter((m) => m.date === t && (pid === 'all' || m.projectId === pid)), al = C.alerts().filter((a) => a.level !== 'info').slice(0, 4);
    return [`🏗️ ${SS.cfg.company || 'Şantiye'} — ${name}`, `📅 ${U.fmtDateLong(t)}`, '',
      `👷 Sahada: ${pr.heads} kişi${pr.total ? ` (puantaj ${pr.marked}/${pr.total})` : ''}`, dr ? `🌤️ Hava: ${dr.weather}${dr.temp != null && dr.temp !== '' ? ' ' + dr.temp + '°C' : ''}${dr.stopped ? ` · iş durması ${dr.stopHours} sa` : ''}` : '', dr && dr.work ? `🔨 Yapılan işler: ${dr.work}` : '',
      mv.length ? `📦 Malzeme: ${mv.map((m) => { const x = SS.D.materials.find((y) => y.id === m.materialId) || {}; return `${m.type === 'giris' ? '+' : '-'}${U.num(m.qty, 1)} ${x.unit || ''} ${x.name || ''}`; }).join(', ')}` : '', exp.length ? `💸 Bugünkü harcama: ${U.money(U.sum(exp, (e) => e.amount))} (${exp.length} kalem)` : '', sf ? `🦺 İSG skoru: %${sf.score}` : '',
      al.length ? '\n⚠️ Dikkat:\n' + al.map((a) => `• ${a.title}`).join('\n') : '', `\n— ${SS.cfg.user} · Şantiye Şefi`].filter((x) => x !== '').join('\n');
  }
  SS.actions['dash.share'] = () => ui.share(dailyText());
  SS.actions['dash.hideGuide'] = () => { SS.cfg.guideHidden = true; SS.store.save(); ui.rerender(); };

  SS.views.dashboard = {
    title: 'Ana Sayfa',
    mount() { if (SS.wx) SS.wx.auto(); },
    render() {
      const h = new Date().getHours(), g = h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi çalışmalar' : 'İyi akşamlar';
      if (!SS.D.projects.length) return emptyDash(g);
      const t = C.totals(), alerts = C.alerts(), crit = C.criticalMats(), pr = C.presentToday();
      const mk = U.monthKey(U.today()), mtd = U.sum(C.expenses({ from: U.monthStart(mk), to: U.today() }), (e) => e.amount);
      const prev = U.sum(C.expenses({ from: U.monthStart(U.monthKey(U.addMonths(U.monthStart(mk), -1))), to: U.addDays(U.monthStart(mk), -1) }), (e) => e.amount);
      const od = C.expenses().filter((e) => C.expStatus(e) === 'Gecikmiş');
      return `<div class="page">
        ${ui.head({ title: `${g}, ${esc(SS.cfg.user)}`, sub: U.fmtDateLong(U.today()), actions: `<button class="btn" data-action="dash.share" title="Günün özetini WhatsApp veya başka uygulamayla paylaş">${I('send')}Günü Paylaş</button><a class="btn" href="#/reports">${I('chart')}Rapor Al</a><a class="btn primary" href="#/ai">${I('sparkles')}Şantiye AI</a>` })}
        ${guideCard()}
        ${crit.length ? `<a class="banner bad" href="#/stock"><span class="pulse-dot"></span>${I('alert')}<span><b>${crit.length} malzeme kritik stok seviyesinin altında</b> — ${crit.slice(0, 3).map((m) => esc(m.name)).join(', ')}${crit.length > 3 ? '…' : ''}</span><em>Stoğa git ${I('chevR')}</em></a>` : ''}
        <div class="grid g-21">${hero()}${quick()}</div>
        ${SS.wx ? SS.wx.card() : ''}
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
