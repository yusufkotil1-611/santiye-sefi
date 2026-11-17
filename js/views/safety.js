/* İSG & Kalite Kontrol — günlük kontrol listesi ve eksik/kusur (punch-list) takibi */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, G = SS.charts;

  SS.css(`
  .chk-h{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:18px}.chk-h .grow{min-width:220px}
  .chk{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:14px 18px;border-top:1px solid var(--line-2)}.chk b{display:block;font-size:14.5px}.chk small{color:var(--muted);font-size:12.5px}
  .tri{display:grid;grid-template-columns:repeat(3,auto);gap:6px}
  .tb{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:0 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);font-weight:700;font-size:13.5px;cursor:pointer;color:var(--ink-2);transition:all .15s var(--ease)}
  .tb:hover{border-color:var(--ink-2)}.tb .ic{width:17px;height:17px}.tb.ok.on{background:var(--ok);border-color:var(--ok);color:#fff}.tb.bad.on{background:var(--bad);border-color:var(--bad);color:#fff}.tb.na.on{background:var(--muted);border-color:var(--muted);color:#fff}
  .chk.is-bad{background:color-mix(in srgb,var(--bad-soft) 55%,transparent)}
  .score-box{text-align:center}.score-box b{font-size:34px;letter-spacing:-.03em;line-height:1}.score-box small{display:block;color:var(--muted);font-size:12px}
  .kan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start}.kcol{background:var(--track);border-radius:18px;padding:12px;display:flex;flex-direction:column;gap:10px;min-height:120px}
  .kcol-h{display:flex;justify-content:space-between;align-items:center;font-weight:750;font-size:14px;padding:2px 4px}.kcol-h em{font-style:normal;background:var(--surface);border-radius:99px;padding:1px 9px;font-size:12px}
  .pcard2{padding:14px;display:flex;flex-direction:column;gap:9px}.pcard2 b{font-size:14.5px;line-height:1.35}.pcard2 .meta{display:flex;flex-wrap:wrap;gap:6px}.pcard2.crit{border-left:4px solid var(--bad)}.pcard2.hi{border-left:4px solid var(--warn)}.pcard2.od .dd{color:var(--bad-text);font-weight:700}
  .pcard2 img{width:100%;max-height:130px;object-fit:cover;border-radius:10px}
  @media(max-width:899px){.kan{grid-template-columns:1fr}}
  @media(max-width:560px){.chk{grid-template-columns:1fr}.tri{grid-template-columns:repeat(3,1fr)}.tb{justify-content:center;padding:0 6px}}
  `);

  const S = () => ui.vs('safety', { tab: 'check', ans: {}, note: '', loaded: '', pid: '', date: U.today(), pq: '', ptype: '', ppri: '' });
  const PRI = { Düşük: 'muted', Orta: 'info', Yüksek: 'warn', Kritik: 'bad' };
  const score = (ans) => { const v = Object.values(ans), ok = v.filter((x) => x === 'ok').length, bad = v.filter((x) => x === 'bad').length; return ok + bad ? Math.round((ok / (ok + bad)) * 100) : 0; };
  const checkPid = () => { const s = S(); return C.active() !== 'all' ? C.active() : s.pid || (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0] || {}).id; };

  function ensureLoaded() {
    const s = S(), pid = checkPid(), key = pid + '|' + s.date; if (s.loaded === key) return;
    const ex = SS.D.safety.find((x) => x.projectId === pid && x.date === s.date); s.ans = ex ? Object.assign({}, ex.answers) : {}; s.note = ex ? ex.note || '' : ''; s.loaded = key;
  }
  function checkBody() {
    ensureLoaded(); const s = S(), pid = checkPid(), items = SS.C.safetyItems, n = Object.keys(s.ans).length, sc = score(s.ans), bad = items.filter((it) => s.ans[it.k] === 'bad'), ex = SS.D.safety.find((x) => x.projectId === pid && x.date === s.date);
    return `<div class="card"><div class="chk-h"><div class="score-box"><b class="${sc >= 90 ? 'pos' : sc >= 75 ? 'wrn' : 'neg'}">${n ? '%' + sc : '—'}</b><small>uygunluk skoru</small></div>
      <div class="grow"><div class="row between" style="font-size:13.5px;margin-bottom:6px"><b>${U.fmtDateLong(s.date)}</b><span class="muted">${n}/${items.length} madde cevaplandı</span></div>${ui.bar((n / items.length) * 100, n === items.length ? 'ok' : 'brand', 'lg')}${ex ? `<small class="sub">Bu gün için kayıt mevcut — kaydetmek güncelleyecek.</small>` : ''}</div>
      ${C.active() === 'all' ? `<label class="filt"><span>Şantiye</span><select class="select" data-vs="safety.pid" data-upd="safety-check">${ui.opts(ui.projOpts(), pid)}</select></label>` : ''}
      <label class="filt"><span>Tarih</span><input class="select" type="date" max="${U.today()}" value="${s.date}" data-vs="safety.date" data-upd="safety-check"></label></div>
      ${items.map((it) => `<div class="chk ${s.ans[it.k] === 'bad' ? 'is-bad' : ''}"><div><b>${esc(it.t)}</b><small>${esc(it.d)}</small></div><div class="tri">
        <button class="tb ok ${s.ans[it.k] === 'ok' ? 'on' : ''}" data-action="chk.set" data-k="${it.k}" data-v="ok">${I('check')}Uygun</button><button class="tb bad ${s.ans[it.k] === 'bad' ? 'on' : ''}" data-action="chk.set" data-k="${it.k}" data-v="bad">${I('x')}Uygunsuz</button><button class="tb na ${s.ans[it.k] === 'na' ? 'on' : ''}" data-action="chk.set" data-k="${it.k}" data-v="na">Y.D.</button></div></div>`).join('')}
      <div style="padding:16px 18px;border-top:1px solid var(--line-2)"><div class="fld"><label style="display:block;font-weight:650;font-size:13px;margin-bottom:5px">Kontrol notu</label><textarea class="input" rows="2" data-note placeholder="Gözlemler, uyarılar, düzeltici faaliyetler…">${esc(s.note)}</textarea></div>
      <div class="row wrap" style="margin-top:14px;justify-content:flex-end"><button class="btn ghost" data-action="chk.allok">${I('check')}Tümünü uygun işaretle</button>
      <button class="btn primary" data-action="chk.save">${I('shield')}Kontrolü Kaydet${bad.length ? ` · ${bad.length} uygunsuz için kart aç` : ''}</button></div></div></div>`;
  }
  SS.actions['chk.set'] = (el) => { const s = S(); s.ans[el.dataset.k] = s.ans[el.dataset.k] === el.dataset.v ? undefined : el.dataset.v; if (!s.ans[el.dataset.k]) delete s.ans[el.dataset.k]; ui.update('safety-check'); };
  SS.actions['chk.allok'] = () => { const s = S(); SS.C.safetyItems.forEach((it) => (s.ans[it.k] = 'ok')); ui.update('safety-check'); };
  document.addEventListener('input', (e) => { if (e.target.matches('[data-note]')) S().note = e.target.value; });
  SS.actions['safety.check'] = () => { const s = S(); s.tab = 'check'; s.date = U.today(); s.loaded = ''; ui.go('safety'); ui.rerender(); };
  SS.actions['chk.save'] = () => {
    const s = S(), pid = checkPid(), items = SS.C.safetyItems;
    if (Object.keys(s.ans).length < items.length) { ui.toast('Lütfen tüm maddeleri cevaplayın', 'bad'); return; }
    const rec = { projectId: pid, date: s.date, inspector: SS.cfg.user, answers: Object.assign({}, s.ans), note: s.note, score: score(s.ans) };
    const ex = SS.D.safety.find((x) => x.projectId === pid && x.date === s.date); if (ex) Object.assign(ex, rec); else SS.store.add('safety', rec, 's');
    let made = 0; items.filter((it) => s.ans[it.k] === 'bad').forEach((it) => { const t = `${it.t} — uygunsuz`; if (!SS.D.punch.some((p) => p.projectId === pid && p.title === t && p.status !== 'Çözüldü')) { SS.store.add('punch', { projectId: pid, title: t, location: 'Saha geneli', type: 'İSG', priority: 'Yüksek', assignee: SS.cfg.user, due: U.addDays(s.date, 3), status: 'Açık', created: s.date, note: s.note, source: 'kontrol' }, 'x'); made++; } });
    SS.store.save(); ui.rerender(); ui.toast(`İSG kontrolü kaydedildi · skor %${rec.score}${made ? ` · ${made} eksik/kusur kartı açıldı` : ''}`);
  };

  /* ---------------- eksik / kusur ---------------- */
  function punchList() { const s = S(); return C.scope('punch').filter((p) => (!s.ptype || p.type === s.ptype) && (!s.ppri || p.priority === s.ppri) && U.match(s.pq, p.title, p.location, p.assignee)); }
  function kanBody() {
    const list = punchList(), cols = ['Açık', 'Devam Ediyor', 'Çözüldü'], t = U.today();
    const card = (p) => { const od = p.status !== 'Çözüldü' && p.due && p.due < t; return `<article class="card pcard2 ${p.priority === 'Kritik' ? 'crit' : p.priority === 'Yüksek' ? 'hi' : ''} ${od ? 'od' : ''}" style="box-shadow:none"><b>${esc(p.title)}</b>
      <div class="meta">${ui.badge(p.priority, PRI[p.priority])}${ui.badge(p.type, 'muted')}</div>${p.photo ? `<img data-blob="${p.photo.id}" alt="" data-action="photo.open" data-id="${p.photo.id}" data-cap="${esc(p.title)}">` : ''}
      <div class="sub">${I('pin')} ${esc(p.location || '—')} · ${esc(p.assignee || '—')}</div><div class="sub dd">${p.status === 'Çözüldü' ? 'Çözüldü' : p.due ? `Son tarih: ${U.fmtDate(p.due)} (${U.relDays(p.due)})` : ''}</div>
      <div class="row wrap" style="gap:6px">${p.status !== 'Açık' ? `<button class="btn sm ghost" data-action="punch.mv" data-id="${p.id}" data-d="-1" aria-label="Geri al">${I('chevL')}</button>` : ''}${p.status !== 'Çözüldü' ? `<button class="btn sm ${p.status === 'Devam Ediyor' ? 'ok' : 'soft'}" data-action="punch.mv" data-id="${p.id}" data-d="1">${p.status === 'Açık' ? 'Başla' : 'Çözüldü'} ${I('chevR')}</button>` : ''}<button class="btn sm ghost" data-action="punch.edit" data-id="${p.id}" aria-label="Düzenle">${I('edit')}</button></div></article>`; };
    return `<div class="kan">${cols.map((c) => { const l = list.filter((p) => p.status === c).sort((a, b) => ['Kritik', 'Yüksek', 'Orta', 'Düşük'].indexOf(a.priority) - ['Kritik', 'Yüksek', 'Orta', 'Düşük'].indexOf(b.priority)); return `<div class="kcol"><div class="kcol-h"><span>${c}</span><em>${l.length}</em></div>${l.map(card).join('') || '<p class="sub" style="padding:8px 4px">Kart yok</p>'}</div>`; }).join('')}</div>`;
  }
  function punchForm(p) {
    const act = C.active(), pid = p ? p.projectId : act !== 'all' ? act : (SS.D.projects.find((x) => x.status === 'active') || SS.D.projects[0]).id;
    ui.form({
      title: p ? 'Kartı Düzenle' : 'Yeni Eksik / Kusur Kartı', values: p || { projectId: pid, type: 'İmalat Eksiği', priority: 'Orta', status: 'Açık', created: U.today(), due: U.addDays(U.today(), 7), assignee: '' },
      fields: [{ name: 'title', label: 'Başlık', required: true, placeholder: 'ör. B Blok 2. kat korkuluk eksik' }, { name: 'type', label: 'Tür', type: 'select', options: SS.C.punchTypes }, { name: 'priority', label: 'Öncelik', type: 'select', options: SS.C.priorities },
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'location', label: 'Konum (blok / kat)', half: true }, { name: 'assignee', label: 'Sorumlu', half: true }, { name: 'due', label: 'Son tarih', type: 'date' }, { name: 'status', label: 'Durum', type: 'select', options: ['Açık', 'Devam Ediyor', 'Çözüldü'] },
        { name: 'photo', label: 'Fotoğraf', type: 'image', value: p && p.photo ? [p.photo] : [] }, { name: 'note', label: 'Açıklama', type: 'textarea', rows: 2 }],
      danger: p ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Kart silinsin mi?', text: esc(p.title) })) { if (p.photo) SS.blob.del(p.photo.id); SS.store.del('punch', p.id); a.close(); ui.rerender(); } } } : null,
      async onSubmit(v) { const d = { title: v.title, type: v.type, priority: v.priority, projectId: v.projectId, location: v.location, assignee: v.assignee, due: v.due, status: v.status, note: v.note }; if (v.photo.length) { if (p && p.photo) SS.blob.del(p.photo.id); d.photo = await SS.blob.putImage(v.photo[0]); } if (p) SS.store.upd('punch', p.id, d); else SS.store.add('punch', Object.assign(d, { created: U.today() }), 'x'); ui.rerender(); ui.toast('Kart kaydedildi'); },
    });
  }
  SS.actions['punch.new'] = () => punchForm(null);
  SS.actions['punch.edit'] = (el) => punchForm(SS.store.find('punch', el.dataset.id));
  SS.actions['punch.mv'] = (el) => { const p = SS.store.find('punch', el.dataset.id), o = ['Açık', 'Devam Ediyor', 'Çözüldü']; p.status = o[U.clamp(o.indexOf(p.status) + +el.dataset.d, 0, 2)]; SS.store.save(); ui.rerender(); if (p.status === 'Çözüldü') ui.toast('Kart çözüldü olarak kapatıldı'); };

  /* ---------------- geçmiş ---------------- */
  function histBody() {
    const list = C.scope('safety').slice().sort((a, b) => b.date.localeCompare(a.date)), trend = list.slice(0, 14).reverse().map((x) => x.score);
    const avg = list.length ? U.sum(list.slice(0, 14), (x) => x.score) / Math.min(14, list.length) : 0;
    return `<div class="grid g-3 kpis">${ui.kpi({ label: 'Son kontrol skoru', value: list[0] ? list[0].score : 0, fmt: 'pct', icon: 'shield', tone: !list[0] || list[0].score >= 90 ? 'ok' : 'warn', sub: list[0] ? U.fmtDate(list[0].date) : '—' })}${ui.kpi({ label: '14 günlük ortalama', value: avg, fmt: 'pct', icon: 'trend', tone: 'info' })}${ui.kpi({ label: 'Açık eksik / kusur', value: C.scope('punch').filter((p) => p.status !== 'Çözüldü').length, fmt: 'num', icon: 'flag', tone: 'warn' })}</div>
      ${trend.length > 1 ? `<div class="card pad"><div class="row between"><h3>Skor Eğilimi</h3><span class="sub">son ${trend.length} kontrol</span></div><div style="margin-top:10px">${G.spark(trend, { w: 640, h: 70, color: 'var(--ok)' })}</div></div>` : ''}
      <div class="card">${ui.table({ rows: list.slice(0, 40), empty: 'Kontrol kaydı yok', cols: [{ h: 'Tarih', c: (x) => `<b>${U.fmtDate(x.date)}</b><div class="t-sub">${U.dayName(x.date)}</div>` }, { h: 'Denetleyen', c: (x) => esc(x.inspector) }, { h: 'Skor', c: (x) => `<div class="row" style="min-width:140px">${ui.bar(x.score, x.score >= 90 ? 'ok' : x.score >= 75 ? 'warn' : 'bad')}<b>%${x.score}</b></div>` },
        { h: 'Uygunsuz', c: (x) => { const b = SS.C.safetyItems.filter((it) => x.answers[it.k] === 'bad'); return b.length ? `<span class="wrn">${b.map((it) => esc(it.t)).join(', ')}</span>` : '<span class="muted">—</span>'; } }, { h: '', act: true, c: (x) => `<button class="btn sm ghost" data-action="chk.open" data-id="${x.id}">${I('eye')}Aç</button>` }] })}</div>`;
  }
  SS.actions['chk.open'] = (el) => { const x = SS.store.find('safety', el.dataset.id), s = S(); s.tab = 'check'; s.date = x.date; if (C.active() === 'all') s.pid = x.projectId; s.loaded = ''; ui.rerender(); window.scrollTo(0, 0); };

  SS.views.safety = {
    title: 'İSG & Kalite',
    render() {
      const s = S(), open = C.scope('punch').filter((p) => p.status !== 'Çözüldü').length;
      const head = ui.head({ title: 'İSG & Kalite Kontrol', sub: 'Günlük saha güvenlik listesi · eksik / kusurlu imalat takibi', actions: `<button class="btn primary" data-action="punch.new">${I('plus')}Eksik / Kusur Ekle</button>` });
      const tabs = ui.tabs('safety', 'tab', [['check', 'Günlük Kontrol'], ['punch', 'Eksik / Kusur Takibi', open || null], ['hist', 'Kontrol Geçmişi']], s.tab);
      if (s.tab === 'punch') return `<div class="page">${head}${tabs}${ui.toolbar({ view: 'safety', ph: 'Kart, konum veya sorumlu ara…', upd: 'punch-body', filters: [{ k: 'ptype', label: 'Tür', opts: [['', 'Tümü'], ...SS.C.punchTypes] }, { k: 'ppri', label: 'Öncelik', opts: [['', 'Tümü'], ...SS.C.priorities] }] }).replace('data-vs="safety.q"', 'data-vs="safety.pq"').replace(/value="[^"]*"/, `value="${esc(s.pq || '')}"`)}${ui.region('punch-body', kanBody)}</div>`;
      if (s.tab === 'hist') return `<div class="page">${head}${tabs}${ui.region('safety-hist', histBody)}</div>`;
      return `<div class="page">${head}${tabs}${ui.region('safety-check', checkBody)}</div>`;
    },
  };
})();
