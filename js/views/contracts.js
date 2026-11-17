/* Sözleşme Yönetimi — dijital sözleşme kasası */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;

  SS.css(`
  .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
  .ccard{padding:18px;display:flex;flex-direction:column;gap:12px;position:relative}
  .ccard h3{font-size:16px;line-height:1.3;letter-spacing:-.01em}
  .ccard.exp{border-color:color-mix(in srgb,var(--warn) 55%,var(--line))}.ccard.exp.red{border-color:color-mix(in srgb,var(--bad) 60%,var(--line))}
  .cnums{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cnums small{display:block;color:var(--muted);font-size:12px}.cnums b{font-size:14px;font-variant-numeric:tabular-nums}
  .ribbon{position:absolute;top:14px;right:14px}
  .doc-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line);font-size:12.5px;font-weight:600;cursor:pointer;max-width:100%}.doc-chip:hover{border-color:var(--brand)}.doc-chip .ic{width:15px;height:15px;color:var(--brand)}.doc-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px}
  .cdate{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)}.cdate .ic{width:15px;height:15px}
  .pdf-frame{width:100%;height:62vh;border:1px solid var(--line);border-radius:14px;background:#fff}
  .paper{background:#fff;color:#16191d;border-radius:12px;padding:28px 30px;border:1px solid var(--line);font-family:Georgia,'Times New Roman',serif;line-height:1.6;font-size:14px}.paper h2{text-align:center;font-size:18px;margin-bottom:14px;font-family:inherit}.paper p{margin:8px 0}.paper table{width:100%;border-collapse:collapse;margin:10px 0}.paper td{padding:5px 8px;border:1px solid #d9d6cf;font-family:var(--font);font-size:13px}.paper td:first-child{background:#f6f4ef;width:34%;font-weight:600}
  @media(max-width:699px){.cgrid{grid-template-columns:1fr}.paper{padding:18px}}
  `);

  const KIND = { 'Taşeron': 'brand', 'Tedarikçi': 'info', 'Müşteri': 'ok', 'Ana Sözleşme': 'warn' };

  function rows() {
    const st = ui.vs('contracts', { q: '', kind: '', status: '', from: '', to: '' });
    return C.scope('contracts').filter((c) => (!st.kind || c.kind === st.kind) && (!st.status || c.status === st.status) && C.inRange(c.end, st.from, st.to) && U.match(st.q, c.title, ui.firmName(c.firmId), c.kind, ui.projectName(c.projectId), c.terms))
      .sort((a, b) => (C.contractDays(a) ?? 9999) - (C.contractDays(b) ?? 9999));
  }
  function dayBadge(c) {
    if (c.status !== 'Aktif') return ui.badge(c.status, c.status === 'Tamamlandı' ? 'ok' : 'muted');
    const d = C.contractDays(c); if (d == null) return '';
    if (d < 0) return ui.badge(`${-d} gün önce bitti`, 'bad', 'alert'); if (d <= 7) return ui.badge(`${d} gün kaldı`, 'bad', 'clock'); if (d <= 30) return ui.badge(`${d} gün kaldı`, 'warn', 'clock'); return ui.badge('Aktif', 'ok');
  }
  function body() {
    const list = rows(), all = C.active() === 'all';
    const act = list.filter((c) => c.status === 'Aktif'), soon = act.filter((c) => { const d = C.contractDays(c); return d != null && d <= 30; });
    const gider = act.filter((c) => c.dir !== 'gelir');
    const k = `<div class="grid g-4 kpis">${ui.kpi({ label: 'Aktif sözleşme', value: act.length, fmt: 'num', icon: 'file', tone: 'brand', sub: `${list.length} toplam kayıt` })}
      ${ui.kpi({ label: 'Gider sözleşmeleri', value: U.sum(gider, (c) => c.amount), fmt: 'compact', icon: 'arrowUp', tone: 'warn', sub: 'taşeron + tedarikçi' })}
      ${ui.kpi({ label: 'Gelir sözleşmeleri', value: U.sum(act.filter((c) => c.dir === 'gelir'), (c) => c.amount), fmt: 'compact', icon: 'arrowDown', tone: 'ok', sub: 'işveren / müşteri' })}
      ${ui.kpi({ label: 'Süresi yaklaşan', value: soon.length, fmt: 'num', icon: 'clock', tone: soon.length ? 'bad' : 'ok', sub: '30 gün içinde bitiyor' })}</div>`;
    if (!list.length) return k + ui.empty('file', 'Sözleşme bulunamadı', 'Taşeron, tedarikçi veya işveren sözleşmesi ekleyin.', `<button class="btn primary" data-action="ct.new">${I('plus')}Sözleşme Ekle</button>`);
    return k + `<div class="cgrid">${list.map((c) => {
      const s = C.contractStats(c), d = C.contractDays(c), gelir = c.dir === 'gelir';
      return `<article class="card ccard ${c.status === 'Aktif' && d != null && d <= 30 ? 'exp' : ''} ${c.status === 'Aktif' && d != null && d <= 7 ? 'red' : ''}">
        <div class="row between wrap"><span class="row" style="gap:6px">${ui.badge(c.kind, KIND[c.kind])}${ui.badge(gelir ? 'Gelir' : 'Gider', gelir ? 'ok' : 'muted')}</span>${dayBadge(c)}</div>
        <div><h3>${esc(c.title)}</h3><div class="sub">${esc(ui.firmName(c.firmId))}${all ? ' · ' + esc(ui.projectName(c.projectId)) : ''}</div></div>
        <div class="cdate">${I('calendar')}${U.fmtDate(c.start)} → ${U.fmtDate(c.end)}</div>
        <div><div class="row between" style="font-size:13px;margin-bottom:6px"><span class="muted">Gerçekleşen ilerleme</span><b>%${U.num(s.cumPct || c.progress || 0, 1)}</b></div>${ui.bar(s.cumPct || c.progress || 0, 'brand')}</div>
        <div class="cnums"><div><small>Sözleşme</small><b>${U.compact(c.amount)}</b></div><div><small>Hakediş</small><b>${U.compact(s.billed)}</b></div><div><small>${gelir ? 'Alacak' : 'Bakiye (borç)'}</small><b class="${s.balance > 0 ? 'wrn' : ''}">${U.compact(s.balance)}</b></div></div>
        ${c.terms ? `<p class="sub">${esc(c.terms)}</p>` : ''}
        ${(c.docs || []).length ? `<div class="row wrap" style="gap:6px">${c.docs.map((f, i) => `<button class="doc-chip" data-action="ct.doc" data-id="${c.id}" data-i="${i}">${I(f.type && f.type.startsWith('image/') ? 'image' : 'file')}<span>${esc(f.name)}</span></button>`).join('')}</div>` : ''}
        <div class="row wrap" style="gap:6px;margin-top:2px"><button class="btn sm" data-action="ct.view" data-id="${c.id}">${I('eye')}Özet</button><button class="btn sm" data-action="hk.new" data-cid="${c.id}">${I('clipboard')}Hakediş</button><button class="btn sm ghost" data-action="ct.edit" data-id="${c.id}">${I('edit')}Düzenle</button></div></article>`;
    }).join('')}</div>`;
  }

  SS.views.contracts = {
    title: 'Sözleşmeler',
    render() {
      return `<div class="page">${ui.head({ title: 'Sözleşme Kasası', sub: 'Taşeron, tedarikçi ve işveren sözleşmeleri · süre uyarıları', actions: `${SS.exp.menu('contracts')}<button class="btn primary" data-action="ct.new">${I('plus')}Sözleşme Ekle</button>` })}
      ${ui.toolbar({ view: 'contracts', ph: 'Sözleşme, firma veya şart ara…', upd: 'contracts-body', filters: [{ k: 'kind', label: 'Tür', opts: [['', 'Tümü'], ...SS.C.contractKinds] }, { k: 'status', label: 'Durum', opts: [['', 'Tümü'], 'Aktif', 'Tamamlandı', 'Askıda'] }, { k: 'from', label: 'Bitiş ≥', type: 'date' }, { k: 'to', label: 'Bitiş ≤', type: 'date' }] })}
      ${ui.region('contracts-body', body)}</div>`;
    },
  };

  function form(c) {
    const act = C.active(), pid = c ? c.projectId : act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0]).id;
    const values = c ? Object.assign({}, c) : { projectId: pid, kind: 'Taşeron', dir: 'gider', start: U.today(), end: U.addMonths(U.today(), 6), retention: 5, status: 'Aktif', cat: 'İşçilik', advance: 0 };
    ui.form({
      title: c ? 'Sözleşmeyi Düzenle' : 'Yeni Sözleşme', wide: true, values,
      fields: [
        { name: 'title', label: 'Sözleşme başlığı', required: true, placeholder: 'ör. Mekanik Tesisat Taahhüt Sözleşmesi' },
        { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }, { name: 'firmId', label: 'Firma / karşı taraf', type: 'select', options: ui.firmOpts(), required: true },
        { name: 'kind', label: 'Sözleşme türü', type: 'select', options: SS.C.contractKinds }, { name: 'dir', label: 'Yön', type: 'select', options: [['gider', 'Gider (biz öderiz)'], ['gelir', 'Gelir (biz tahsil ederiz)']] },
        { name: 'amount', label: 'Sözleşme tutarı (₺)', type: 'money', required: true, min: 1 }, { name: 'retention', label: 'Teminat kesintisi (%)', type: 'number', min: 0, max: 100, step: 0.5 },
        { name: 'start', label: 'Başlangıç', type: 'date', required: true }, { name: 'end', label: 'Bitiş', type: 'date', required: true },
        { name: 'cat', label: 'Ödemelerin gider kategorisi', type: 'select', options: SS.C.cats }, { name: 'status', label: 'Durum', type: 'select', options: ['Aktif', 'Tamamlandı', 'Askıda'] },
        { name: 'terms', label: 'Ödeme koşulları / özel şartlar', type: 'textarea', rows: 3 },
        { name: 'docs', label: 'Sözleşme belgeleri (PDF / görsel)', type: 'file', multiple: true, accept: 'application/pdf,image/*', hint: `${(c && c.docs && c.docs.length) || 0} belge ekli · yeni dosyalar mevcutlara eklenir` },
      ],
      validate: (v) => (v.end < v.start ? 'Bitiş tarihi başlangıçtan önce olamaz' : ''),
      danger: c ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Sözleşme silinsin mi?', text: `<b>${esc(c.title)}</b> ve bağlı hakedişler silinir.` })) { (c.docs || []).forEach((d) => SS.blob.del(d.id)); SS.D.hakedis = SS.D.hakedis.filter((h) => h.contractId !== c.id); SS.store.del('contracts', c.id); a.close(); ui.rerender(); ui.toast('Sözleşme silindi', 'info'); } } } : null,
      async onSubmit(v) {
        const d = { title: v.title, projectId: v.projectId, firmId: v.firmId, kind: v.kind, dir: v.dir, amount: v.amount, retention: v.retention || 0, start: v.start, end: v.end, cat: v.cat, status: v.status, terms: v.terms };
        const docs = (c && c.docs ? c.docs.slice() : []); for (const f of v.docs) docs.push(await SS.blob.putFile(f)); d.docs = docs;
        if (c) SS.store.upd('contracts', c.id, d); else SS.store.add('contracts', Object.assign(d, { progress: 0, advance: 0 }), 'c');
        ui.rerender(); ui.toast('Sözleşme kaydedildi');
      },
    });
  }
  SS.actions['ct.new'] = () => form(null);
  SS.actions['ct.edit'] = (el) => form(SS.store.find('contracts', el.dataset.id));

  SS.actions['ct.doc'] = async (el) => {
    const c = SS.store.find('contracts', el.dataset.id), f = c.docs[+el.dataset.i], u = await SS.blob.url(f.id);
    if (!u) { ui.toast('Belge bulunamadı', 'bad'); return; }
    const isImg = f.type && f.type.startsWith('image/'), isPdf = f.type === 'application/pdf';
    ui.sheet({ title: esc(f.name), wide: true, noFocus: true, body: isImg ? `<img class="lightbox-img" src="${u}" alt="">` : isPdf ? `<iframe class="pdf-frame" src="${u}" title="${esc(f.name)}"></iframe>` : `<p class="muted">Bu dosya türü önizlenemiyor.</p>`,
      footer: `<button class="btn" data-action="ct.dl" data-id="${c.id}" data-i="${el.dataset.i}">${I('download')}İndir</button>` });
  };
  SS.actions['ct.dl'] = async (el) => { const c = SS.store.find('contracts', el.dataset.id), f = c.docs[+el.dataset.i], r = await SS.blob.get(f.id); if (r && r.value instanceof Blob) ui.download(f.name, r.value); };

  SS.actions['ct.view'] = (el) => {
    const c = SS.store.find('contracts', el.dataset.id), s = C.contractStats(c), p = C.proj(c.projectId) || {};
    const r = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
    ui.sheet({ title: 'Dijital Sözleşme Özeti', wide: true, noFocus: true, body: `<div class="paper"><h2>${esc(c.title.toLocaleUpperCase('tr'))}</h2>
      <p>İşbu sözleşme <b>${esc(SS.cfg.company)}</b> ile <b>${esc(ui.firmName(c.firmId))}</b> arasında <b>${esc(p.name || '')}</b> şantiyesinde uygulanmak üzere ${U.fmtDate(c.start)} tarihinde başlayıp ${U.fmtDate(c.end)} tarihinde sona erecek şekilde düzenlenmiştir.</p>
      <table>${r('Sözleşme türü', esc(c.kind) + (c.dir === 'gelir' ? ' (gelir)' : ' (gider)'))}${r('Sözleşme bedeli', U.money2(c.amount))}${r('Teminat kesintisi', '%' + U.num(c.retention, 1))}${r('Süre', `${U.fmtDate(c.start)} – ${U.fmtDate(c.end)} (${U.diff(c.start, c.end)} gün)`)}${r('Ödeme koşulları', esc(c.terms || '—'))}${r('Gerçekleşen ilerleme', '%' + U.num(s.cumPct || c.progress || 0, 1))}${r('Onaylı hakediş toplamı', U.money2(s.billed))}${r(c.dir === 'gelir' ? 'Tahsil edilen' : 'Ödenen', U.money2(s.paid))}${r('Kalan bakiye', U.money2(s.balance))}</table>
      <p style="font-size:12px;color:#6b737d">Bu sayfa kayıtlı verilerden otomatik üretilen bir özettir; imzalı asıl sözleşme ekli belgelerdedir.</p></div>`,
      footer: `<button class="btn" data-action="ct.print" data-id="${c.id}">${I('printer')}PDF / Yazdır</button>` });
  };
  SS.actions['ct.print'] = (el) => SS.exp.save(SS.reports.contractSummary(el.dataset.id), 'pdf');
})();
