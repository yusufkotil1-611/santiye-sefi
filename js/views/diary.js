/* Günlük Şantiye Defteri, hava durumu ve fotoğraf galerisi */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;

  SS.css(`
  .wstrip{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:6px}
  .wday{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px 6px;border-radius:11px;border:1.5px solid var(--line);background:var(--surface);font-size:11px;color:var(--muted);position:relative;cursor:default;min-width:0}
  .wday b{font-size:13px;color:var(--ink)}.wday .ic{width:19px;height:19px}
  .wday.w-Güneşli .ic{color:#e0a100}.wday.w-Bulutlu .ic{color:#7d8793}.wday.w-Yağmurlu .ic{color:var(--s1)}.wday.w-Rüzgarlı .ic{color:var(--s3)}.wday.w-Karlı .ic{color:#6fb3e8}
  .wday.none{border-style:dashed;opacity:.55}.wday.stop::after{content:"";position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:var(--bad)}.wday.today{border-color:var(--brand)}
  .tl{display:flex;flex-direction:column;gap:14px}.entry{padding:16px 18px;display:grid;grid-template-columns:78px 1fr;gap:16px}
  .edate{text-align:center;border-right:1px solid var(--line-2);padding-right:14px}.edate b{display:block;font-size:30px;line-height:1;letter-spacing:-.03em}.edate small{display:block;color:var(--muted);font-size:12px;margin-top:4px}.edate .ic{width:24px;height:24px;margin-top:10px}
  .echips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}.entry p{line-height:1.55;color:var(--ink-2)}
  .estop{display:flex;gap:10px;align-items:flex-start;margin-top:10px;padding:10px 12px;border-radius:12px;background:var(--warn-soft);color:var(--warn-text);font-size:13.5px}.estop .ic{margin-top:2px}
  .ephotos{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.ephotos img,.gal img{width:92px;height:68px;object-fit:cover;border-radius:10px;border:1px solid var(--line);cursor:zoom-in;background:var(--surface-2)}
  .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}.gal figure{margin:0;position:relative;cursor:zoom-in}.gal img{width:100%;height:140px}.gal figcaption{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.62);color:#fff;font-size:12px;font-weight:600;padding:3px 9px;border-radius:99px}
  @media(max-width:699px){.entry{grid-template-columns:1fr}.edate{display:flex;align-items:center;gap:12px;text-align:left;border-right:0;border-bottom:1px solid var(--line-2);padding:0 0 10px}.edate b{font-size:24px}.edate small,.edate .ic{margin:0}.wstrip{grid-template-columns:repeat(7,minmax(0,1fr))}}
  `);

  const S = () => ui.vs('diary', { tab: 'log', q: '', from: '', to: '' });
  const wIcon = (k) => (SS.C.weather.find((w) => w.k === k) || { icon: 'cloud' }).icon;
  const entries = () => C.scope('diary').slice().sort((a, b) => b.date.localeCompare(a.date));

  function stripHtml(list) {
    const days = U.dates(U.addDays(U.today(), -27), U.today());
    return `<div class="wstrip">${days.map((d) => { const e = list.find((x) => x.date === d); return `<div class="wday ${e ? 'w-' + e.weather : 'none'} ${e && e.stopped ? 'stop' : ''} ${d === U.today() ? 'today' : ''}" data-tip="${U.fmtDate(d)} · ${U.dayName(d)}\n${e ? e.weather + ' ' + e.temp + '°C' + (e.stopped ? '\nİş durdu: ' + e.stopHours + ' saat' : '') : 'Kayıt yok'}"><span>${U.dayName(d).slice(0, 3)}</span><b>${+d.slice(8)}</b>${e ? I(wIcon(e.weather)) : '<span style="height:19px"></span>'}</div>`; }).join('')}</div>`;
  }
  function logBody() {
    const s = S(), list = entries().filter((e) => C.inRange(e.date, s.from, s.to) && U.match(s.q, e.work, e.note, e.weather, e.stopReason));
    if (!list.length) return ui.empty('book', 'Defter kaydı yok', 'Bugünün sahada yapılan işlerini kaydedin.', `<button class="btn primary" data-action="diary.new">${I('plus')}Defter Yaz</button>`);
    return `<div class="tl">${list.slice(0, 60).map((e) => `<article class="card entry"><div class="edate"><b>${+e.date.slice(8)}</b><small>${U.monthShort(U.monthKey(e.date))} · ${U.dayName(e.date).slice(0, 3)}</small>${I(wIcon(e.weather))}</div>
      <div><div class="echips"><span class="badge info">${I(wIcon(e.weather))}${e.weather}${e.temp != null && e.temp !== '' ? ' ' + e.temp + '°C' : ''}</span><span class="badge muted">${I('users')}${e.workers || 0} kişi çalıştı</span>${C.active() === 'all' ? `<span class="badge brand">${esc(ui.projectName(e.projectId))}</span>` : ''}${e.stopped ? `<span class="badge warn">${I('alert')}${e.stopHours} saat iş durdu</span>` : ''}</div>
      <p>${esc(e.work)}</p>${e.stopped && e.stopReason ? `<div class="estop">${I('rain')}<span>${esc(e.stopReason)}</span></div>` : ''}${e.note ? `<p class="sub" style="margin-top:8px">Not: ${esc(e.note)}</p>` : ''}
      ${(e.photos || []).length ? `<div class="ephotos">${e.photos.map((p) => `<img data-blob="${p.id}" alt="${esc(p.name)}" data-action="photo.open" data-id="${p.id}" data-cap="${esc(U.fmtDate(e.date) + ' · ' + (p.name || ''))}">`).join('')}</div>` : ''}
      <div class="row wrap" style="margin-top:12px"><button class="btn sm" data-action="diary.edit" data-id="${e.id}">${I('edit')}Düzenle</button><button class="btn sm ghost" data-action="diary.print" data-id="${e.id}">${I('printer')}Günlük rapor (PDF)</button></div></div></article>`).join('')}</div>`;
  }
  function galBody() {
    const ph = entries().flatMap((e) => (e.photos || []).map((p) => ({ p, e })));
    if (!ph.length) return ui.empty('camera', 'Henüz fotoğraf yok', 'Günlük defter kayıtlarına saha ilerleme fotoğrafı ekleyin.', `<button class="btn primary" data-action="diary.new">${I('camera')}Fotoğraflı kayıt ekle</button>`);
    return `<div class="gal">${ph.map(({ p, e }) => `<figure data-action="photo.open" data-id="${p.id}" data-cap="${esc(U.fmtDate(e.date) + ' · ' + ui.projectName(e.projectId))}"><img data-blob="${p.id}" alt="${esc(p.name)}"><figcaption>${U.fmtDateShort(e.date)}</figcaption></figure>`).join('')}</div>`;
  }

  SS.views.diary = {
    title: 'Şantiye Defteri',
    render() {
      const s = S(), list = entries(), t = U.today(), last30 = list.filter((e) => e.date >= U.addDays(t, -29)), stopped = last30.filter((e) => e.stopped);
      const photos = U.sum(list, (e) => (e.photos || []).length), avg = last30.length ? U.sum(last30, (e) => e.workers) / last30.length : 0;
      return `<div class="page">${ui.head({ title: 'Günlük Şantiye Defteri', sub: 'Yapılan işler, hava durumu, çalışan sayısı ve ilerleme fotoğrafları', actions: `<button class="btn primary" data-action="diary.new">${I('plus')}Defter Yaz</button>` })}
        <div class="grid g-4 kpis">${ui.kpi({ label: 'Son 30 gün kayıt', value: last30.length, fmt: 'num', icon: 'book', tone: 'brand', sub: list.some((e) => e.date === t) ? 'bugünün defteri yazıldı' : 'bugün henüz yazılmadı' })}
        ${ui.kpi({ label: 'Hava nedeniyle durma', value: stopped.length, fmt: 'num', icon: 'rain', tone: stopped.length ? 'warn' : 'ok', sub: `${U.sum(stopped, (e) => e.stopHours)} saat kayıp (30 gün)` })}
        ${ui.kpi({ label: 'Ortalama çalışan', value: Math.round(avg), fmt: 'num', icon: 'hardhat', tone: 'info', sub: 'günlük kişi sayısı' })}${ui.kpi({ label: 'Saha fotoğrafı', value: photos, fmt: 'num', icon: 'camera', tone: 'ok', sub: 'galeride' })}</div>
        <div class="card"><div class="card-h"><h3>Son 28 Gün — Hava Durumu</h3><div class="chart-legend"><span><i style="background:var(--bad);border-radius:50%"></i>iş durdu</span></div></div><div class="card-b">${stripHtml(list)}</div></div>
        ${ui.tabs('diary', 'tab', [['log', 'Defter Kayıtları'], ['gal', 'Fotoğraf Galerisi', photos]], s.tab)}
        ${s.tab === 'gal' ? ui.region('diary-gal', galBody) : `${ui.toolbar({ view: 'diary', ph: 'Defterde ara…', upd: 'diary-log', filters: [{ k: 'from', label: 'Başlangıç', type: 'date' }, { k: 'to', label: 'Bitiş', type: 'date' }] })}${ui.region('diary-log', logBody)}`}</div>`;
    },
  };

  function form(e) {
    const act = C.active(), pid = e ? e.projectId : act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0]).id;
    const heads = (date, p) => { const ws = SS.D.workers.filter((w) => w.projectId === p && w.active !== false); const d = SS.D.attendance[date] || {}; return U.sum(ws.filter((w) => ['T', 'Y', 'FM'].includes(d[w.id])), (w) => w.headcount || 1); };
    const values = e ? Object.assign({}, e, { photos: e.photos }) : { projectId: pid, date: U.today(), weather: 'Güneşli', temp: 12, workers: heads(U.today(), pid), stopped: false, stopHours: 0, author: SS.cfg.user };
    let lastKey = values.date + values.projectId;
    ui.form({
      title: e ? 'Defteri Düzenle' : 'Bugünün Defteri', wide: true, values,
      fields: [{ name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'date', label: 'Tarih', type: 'date', required: true, max: U.today() },
        { name: 'weather', label: 'Hava durumu', type: 'seg', options: SS.C.weather.map((w) => w.k) }, ...(SS.wx ? [{ type: 'html', html: `<button type="button" class="btn sm" data-action="wx.fillDiary">${I('sun')}Hava durumunu otomatik doldur</button><small class="hint">İnternetten alır (bugün ve sonraki günler). Yalnızca şantiye yer adı gönderilir.</small>` }] : []), { name: 'temp', label: 'Sıcaklık (°C)', type: 'number', step: 1 }, { name: 'workers', label: 'Çalışan sayısı', type: 'number', min: 0, step: 1, hint: 'Puantajdan otomatik doldurulur' },
        { name: 'work', label: 'Yapılan işler', type: 'textarea', rows: 4, required: true, placeholder: 'Bugün sahada yapılan imalatları, teslimatları ve önemli olayları yazın…' },
        { name: 'stopped', type: 'check', label: 'İş durması', text: 'Hava / başka nedenle iş durdu' }, { name: 'stopHours', label: 'Durma süresi (saat)', type: 'number', min: 0, step: 0.5 }, { name: 'stopReason', label: 'Durma nedeni', placeholder: 'ör. Yoğun yağış, beton dökümü ertelendi' },
        { name: 'photos', label: 'İlerleme fotoğrafları', type: 'image', multiple: true, value: e ? e.photos : [], hint: e && e.photos && e.photos.length ? `${e.photos.length} fotoğraf ekli · yeni seçilenler eklenir` : 'Birden fazla fotoğraf seçebilirsiniz' }, { name: 'note', label: 'Ek not', half: false }],
      onInput(v, a) {
        const set = (n, show) => { const w = a.el.querySelector(`[data-fld="${n}"]`); if (w) w.style.display = show ? '' : 'none'; };
        set('stopHours', v.stopped); set('stopReason', v.stopped);
        const k = v.date + v.projectId; if (k !== lastKey && !e) { lastKey = k; a.el.querySelector('form').elements.workers.value = heads(v.date, v.projectId); }
      },
      validate(v) { return !e && SS.D.diary.some((x) => x.projectId === v.projectId && x.date === v.date) ? 'Bu şantiye için o tarihte zaten defter yazılmış; mevcut kaydı düzenleyin.' : ''; },
      danger: e ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Defter kaydı silinsin mi?', text: U.fmtDate(e.date) })) { (e.photos || []).forEach((p) => SS.blob.del(p.id)); SS.store.del('diary', e.id); a.close(); ui.rerender(); } } } : null,
      async onSubmit(v) {
        const d = { projectId: v.projectId, date: v.date, weather: v.weather, temp: v.temp, workers: v.workers || 0, work: v.work, stopped: v.stopped, stopHours: v.stopped ? v.stopHours || 0 : 0, stopReason: v.stopped ? v.stopReason : '', note: v.note, author: SS.cfg.user };
        const photos = e && e.photos ? e.photos.slice() : []; for (const f of v.photos) photos.push(await SS.blob.putImage(f)); d.photos = photos;
        if (e) SS.store.upd('diary', e.id, d); else SS.store.add('diary', d, 'd');
        ui.rerender(); ui.toast('Defter kaydedildi');
      },
    });
  }
  SS.actions['diary.new'] = () => { const ex = C.scope('diary').find((x) => x.date === U.today() && (C.active() === 'all' || x.projectId === C.active())); form(C.active() !== 'all' && ex ? ex : null); };
  SS.actions['diary.edit'] = (el) => form(SS.store.find('diary', el.dataset.id));
  SS.actions['diary.print'] = (el) => { const e = SS.store.find('diary', el.dataset.id); SS.exp.save(SS.reports.dailyReport(e.date, e.projectId), 'pdf'); };
  SS.actions['photo.open'] = (el) => ui.lightbox(el.dataset.id, el.dataset.cap);
})();
