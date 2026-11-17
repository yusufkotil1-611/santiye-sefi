/* Hakediş Takibi — fiziki ilerlemeye göre otomatik hakediş hesaplama motoru */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;

  const contractOf = (h) => SS.D.contracts.find((c) => c.id === h.contractId) || {};
  const stTone = { Taslak: 'muted', Onaylandı: 'info', Ödendi: 'ok' };
  function status(h) { const c = contractOf(h), left = h.total - (h.paidAmount || 0); if (h.status === 'Ödendi') return ['Ödendi', 'ok']; if (h.status === 'Onaylandı' && h.paidAmount > 0) return [c.dir === 'gelir' ? 'Kısmi tahsil' : 'Kısmi ödendi', 'warn']; return [h.status, stTone[h.status]]; }

  function rows() {
    const st = ui.vs('hakedis', { q: '', dir: '', status: '', from: '', to: '' });
    return C.scope('hakedis').filter((h) => { const c = contractOf(h); return (!st.dir || c.dir === st.dir) && (!st.status || h.status === st.status) && C.inRange(h.date, st.from, st.to) && U.match(st.q, c.title, ui.firmName(c.firmId), 'no' + h.no, ui.projectName(h.projectId)); })
      .sort((a, b) => b.date.localeCompare(a.date) || b.no - a.no);
  }

  function body() {
    const list = rows(), all = C.active() === 'all';
    const apr = list.filter((h) => h.status !== 'Taslak');
    const gider = apr.filter((h) => contractOf(h).dir !== 'gelir'), gelir = apr.filter((h) => contractOf(h).dir === 'gelir');
    const cols = [
      { h: 'No', c: (h) => `<b>#${h.no}</b>` },
      { h: 'Sözleşme / Firma', c: (h) => { const c = contractOf(h); return `<div style="min-width:210px"><div class="t-main">${esc(c.title || '—')}</div><div class="t-sub">${esc(ui.firmName(c.firmId))}${all ? ' · ' + esc(ui.projectName(h.projectId)) : ''} · ${U.fmtDate(h.date)}</div></div>`; } },
      { h: 'Yön', c: (h) => (contractOf(h).dir === 'gelir' ? ui.badge('Tahsilat', 'ok', 'arrowDown') : ui.badge('Ödeme', 'warn', 'arrowUp')) },
      { h: 'Kümülatif', c: (h) => `<div style="min-width:96px"><b>%${U.num(h.cumPct, 1)}</b>${ui.bar(h.cumPct, 'brand', 'sm')}</div>` },
      { h: 'Brüt', cls: 'num', c: (h) => U.money(h.gross) },
      { h: 'Kesinti', cls: 'num', c: (h) => `<span class="neg">−${U.money(h.retention + h.stamp + h.advance + h.other)}</span>` },
      { h: 'KDV', cls: 'num', c: (h) => U.money(h.kdv) },
      { h: 'Net tutar', cls: 'num', c: (h) => `<b>${U.money(h.total)}</b>${h.paidAmount ? `<div class="t-sub">${contractOf(h).dir === 'gelir' ? 'tahsil' : 'ödenen'}: ${U.money(h.paidAmount)}</div>` : ''}` },
      { h: 'Durum', c: (h) => ui.badge(...status(h)) },
      { h: '', act: true, c: (h) => { const c = contractOf(h), left = h.total - (h.paidAmount || 0); return `${h.status === 'Taslak' ? `<button class="btn sm primary" data-action="hk.approve" data-id="${h.id}">${I('check')}Onayla</button>` : left > 0.5 ? `<button class="btn sm ok" data-action="hk.pay" data-id="${h.id}">${I('wallet')}${c.dir === 'gelir' ? 'Tahsil et' : 'Öde'}</button>` : ''}<button class="btn sm ghost" data-action="hk.print" data-id="${h.id}" aria-label="Hakediş raporu">${I('printer')}</button><button class="btn sm ghost" data-action="hk.edit" data-id="${h.id}" aria-label="Düzenle">${I('edit')}</button>`; } },
    ];
    return `<div class="grid g-4 kpis">
      ${ui.kpi({ label: 'Onaylanan hakediş', value: U.sum(apr, (h) => h.total), fmt: 'compact', icon: 'clipboard', tone: 'brand', sub: `${apr.length} onaylı kayıt` })}
      ${ui.kpi({ label: 'Ödenen / tahsil edilen', value: U.sum(apr, (h) => h.paidAmount || 0), fmt: 'compact', icon: 'check', tone: 'ok' })}
      ${ui.kpi({ label: 'Kalan borç (taşeron)', value: U.sum(gider, (h) => h.total - (h.paidAmount || 0)), fmt: 'compact', icon: 'arrowUp', tone: 'warn', sub: 'ödenecek hakediş' })}
      ${ui.kpi({ label: 'Kalan alacak (işveren)', value: U.sum(gelir, (h) => h.total - (h.paidAmount || 0)), fmt: 'compact', icon: 'arrowDown', tone: 'info', sub: 'tahsil edilecek hakediş' })}</div>
      <div class="card">${ui.table({ cols, rows: list, empty: 'Hakediş kaydı bulunamadı' })}</div>`;
  }

  SS.views.hakedis = {
    title: 'Hakediş Takibi',
    render() {
      return `<div class="page">${ui.head({ title: 'Hakediş Takibi', sub: 'Fiziki ilerlemeye göre hakediş hesabı, kesintiler ve ödeme / tahsilat durumu', actions: `${SS.exp.menu('hakedis')}<button class="btn primary" data-action="hk.new">${I('plus')}Yeni Hakediş</button>` })}
      ${ui.toolbar({ view: 'hakedis', ph: 'Sözleşme, firma veya hakediş no ara…', upd: 'hakedis-body', filters: [{ k: 'dir', label: 'Yön', opts: [['', 'Tümü'], ['gider', 'Ödeme (taşeron/tedarikçi)'], ['gelir', 'Tahsilat (işveren)']] }, { k: 'status', label: 'Durum', opts: [['', 'Tümü'], 'Taslak', 'Onaylandı', 'Ödendi'] }, { k: 'from', label: 'Başlangıç', type: 'date' }, { k: 'to', label: 'Bitiş', type: 'date' }] })}
      ${ui.region('hakedis-body', body)}</div>`;
    },
  };

  /* ---------------- hesaplayıcı formu ---------------- */
  function syncContract(cid) {
    const c = SS.store.find('contracts', cid); if (!c) return;
    const ap = SS.D.hakedis.filter((h) => h.contractId === cid && h.status !== 'Taslak'); c.progress = ap.length ? Math.max(...ap.map((h) => h.cumPct)) : 0; SS.store.save();
  }
  function hkForm(h, presetContract) {
    const cons = C.scope('contracts').filter((c) => c.status !== 'Feshedildi');
    if (!cons.length) { ui.toast('Önce bir sözleşme ekleyin', 'bad'); ui.go('contracts'); return; }
    const first = (h && contractOf(h)) || cons.find((c) => c.id === presetContract) || cons[0];
    const prevOf = (cid) => { const l = SS.D.hakedis.filter((x) => x.contractId === cid && (!h || x.id !== h.id)); return l.length ? Math.max(...l.map((x) => x.cumPct)) : 0; };
    const nextNo = (cid) => { const l = SS.D.hakedis.filter((x) => x.contractId === cid); return l.length ? Math.max(...l.map((x) => x.no)) + 1 : 1; };
    const sugg = (c) => (c.dir === 'gelir' ? C.progress(C.proj(c.projectId) || {}) : c.progress || 0);
    const values = h ? Object.assign({}, h) : { contractId: first.id, no: nextNo(first.id), date: U.today(), cumPct: Math.min(100, Math.max(prevOf(first.id), Math.round(sugg(first)))), retentionPct: first.retention, kdvPct: 20, stampOn: first.dir === 'gider', advance: 0, other: 0, status: 'Taslak' };
    let lastC = values.contractId;
    const live = (v, a) => {
      const c = SS.store.find('contracts', v.contractId); if (!c) return;
      const form = a.el.querySelector('form'); const prev = h && v.contractId === h.contractId ? h.prevPct : prevOf(v.contractId);
      if (v.contractId !== lastC) { lastC = v.contractId; form.elements.no.value = nextNo(v.contractId); form.elements.retentionPct.value = c.retention; form.elements.stampOn.checked = c.dir === 'gider'; form.elements.cumPct.value = Math.max(prev, Math.round(sugg(c))); form.elements.cumPct.dispatchEvent(new Event('input', { bubbles: true })); return; }
      const calc = C.hakedisCalc(c, { cumPct: v.cumPct || 0, prevPct: prev, retentionPct: v.retentionPct || 0, advance: v.advance || 0, stampOn: v.stampOn, other: v.other || 0, kdvPct: +v.kdvPct });
      const box = a.el.querySelector('[data-live]'); if (!box) return;
      const R = (l, val, neg, cls = '') => `<div class="live-row ${cls}"><span>${l}</span><span class="${neg ? 'neg' : ''}">${neg ? '−' : ''}${U.money2(val)}</span></div>`;
      box.innerHTML = `<div class="live-row"><span>Sözleşme tutarı</span><span>${U.money2(c.amount)}</span></div><div class="live-row"><span>Önceki kümülatif → bu hakediş</span><span>%${U.num(prev, 1)} → %${U.num(v.cumPct || 0, 1)}</span></div>
        ${R(`Bu dönem hakediş (%${U.num((v.cumPct || 0) - prev, 1)})`, calc.gross)}${R('Teminat kesintisi', calc.retention, true)}${calc.stamp ? R('Damga vergisi (‰9,48)', calc.stamp, true) : ''}${calc.advance ? R('Avans mahsubu', calc.advance, true) : ''}${calc.other ? R('Diğer kesinti', calc.other, true) : ''}${R(`KDV (%${v.kdvPct})`, calc.kdv)}${R(c.dir === 'gelir' ? 'Tahsil edilecek net tutar' : 'Ödenecek net tutar', calc.total, false, 'total')}`;
    };
    ui.form({
      title: h ? `Hakediş #${h.no} — Düzenle` : 'Yeni Hakediş', wide: true, values,
      fields: [
        { name: 'contractId', label: 'Sözleşme', type: 'select', required: true, options: cons.map((c) => [c.id, `${ui.firmName(c.firmId)} — ${c.title}`]) },
        { name: 'no', label: 'Hakediş no', type: 'number', required: true, min: 1, step: 1 }, { name: 'date', label: 'Tarih', type: 'date', required: true },
        { name: 'cumPct', label: 'Kümülatif fiziki ilerleme (%)', type: 'number', required: true, min: 0, max: 100, step: 0.5, hint: 'Sahadaki fiziksel ilerlemeye göre; önceki hakedişlerin üzerinde olmalı.' },
        { type: 'html', html: `<button type="button" class="btn sm soft" data-action="hk.useProg" style="margin-top:22px">${I('building')}Sahadaki ilerlemeyi kullan</button>` },
        { name: 'retentionPct', label: 'Teminat kesintisi (%)', type: 'number', min: 0, max: 100, step: 0.5 }, { name: 'kdvPct', label: 'KDV oranı', type: 'select', options: [['0', '%0'], ['10', '%10'], ['20', '%20']] },
        { name: 'advance', label: 'Avans mahsubu (₺)', type: 'money', min: 0 }, { name: 'other', label: 'Diğer kesintiler (₺)', type: 'money', min: 0 },
        { name: 'stampOn', type: 'check', label: 'Damga vergisi', text: 'Damga vergisi kes (‰9,48)' },
        { name: 'status', label: 'Durum', type: 'select', options: ['Taslak', 'Onaylandı'].concat(h && h.status === 'Ödendi' ? ['Ödendi'] : []) },
        { name: 'note', label: 'Not', type: 'textarea', rows: 2 },
      ],
      extra: '<div class="live-box" data-live></div>', onInput: live,
      validate(v) { const prev = h && v.contractId === h.contractId ? h.prevPct : prevOf(v.contractId); return v.cumPct <= prev ? `Kümülatif ilerleme önceki hakedişin (%${U.num(prev, 1)}) üzerinde olmalı` : ''; },
      danger: h ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Hakediş silinsin mi?', text: `#${h.no} numaralı hakediş ve bağlı ödeme kayıtları silinir.` })) { SS.D.expenses = SS.D.expenses.filter((e) => e.hakedisId !== h.id); SS.store.del('hakedis', h.id); syncContract(h.contractId); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) {
        const c = SS.store.find('contracts', v.contractId), prev = h && v.contractId === h.contractId ? h.prevPct : prevOf(v.contractId);
        const calc = C.hakedisCalc(c, { cumPct: v.cumPct, prevPct: prev, retentionPct: v.retentionPct || 0, advance: v.advance || 0, stampOn: v.stampOn, other: v.other || 0, kdvPct: +v.kdvPct });
        const d = Object.assign({ projectId: c.projectId, contractId: c.id, no: v.no, date: v.date, cumPct: v.cumPct, prevPct: prev, retentionPct: v.retentionPct || 0, kdvPct: +v.kdvPct, stampOn: v.stampOn, status: v.status, note: v.note }, calc);
        if (h) { if (h.status === 'Ödendi') d.status = 'Ödendi'; SS.store.upd('hakedis', h.id, d); } else SS.store.add('hakedis', Object.assign(d, { paidAmount: 0, payments: [] }), 'h');
        syncContract(c.id); ui.rerender(); ui.toast(`Hakediş #${v.no} kaydedildi · ${U.money(calc.total)}`);
      },
    });
  }
  SS.actions['hk.new'] = (el) => hkForm(null, el && el.dataset && el.dataset.cid);
  SS.actions['hk.edit'] = (el) => hkForm(SS.store.find('hakedis', el.dataset.id));
  SS.actions['hk.useProg'] = (el) => {
    const form = el.closest('form'), c = SS.store.find('contracts', form.elements.contractId.value); const v = c.dir === 'gelir' ? C.progress(C.proj(c.projectId)) : c.progress || 0;
    form.elements.cumPct.value = Math.round(v * 2) / 2; form.elements.cumPct.dispatchEvent(new Event('input', { bubbles: true })); ui.toast(`İlerleme %${U.num(v, 1)} olarak uygulandı`, 'info');
  };
  SS.actions['hk.approve'] = (el) => { SS.store.upd('hakedis', el.dataset.id, { status: 'Onaylandı' }); syncContract(SS.store.find('hakedis', el.dataset.id).contractId); ui.rerender(); ui.toast('Hakediş onaylandı'); };
  SS.actions['hk.print'] = (el) => SS.exp.save(SS.reports.hakedisSlip(el.dataset.id), 'pdf');

  SS.actions['hk.pay'] = (el) => {
    const h = SS.store.find('hakedis', el.dataset.id), c = contractOf(h), left = U.round2(h.total - (h.paidAmount || 0)), gelir = c.dir === 'gelir';
    ui.form({
      title: gelir ? 'Tahsilat Kaydet' : 'Ödeme Kaydet', cls: 'small', values: { amount: left, date: U.today() },
      fields: [{ type: 'html', html: `<div class="ins"><span><b>${esc(c.title)}</b><small>Hakediş #${h.no} · kalan ${U.money2(left)}</small></span></div>` }, { name: 'amount', label: 'Tutar (₺)', type: 'money', required: true, min: 0.01, max: left }, { name: 'date', label: 'Tarih', type: 'date', required: true }],
      onSubmit(v) {
        h.payments = (h.payments || []).concat({ date: v.date, amount: v.amount }); h.paidAmount = U.round2((h.paidAmount || 0) + v.amount);
        if (h.paidAmount >= h.total - 0.5) h.status = 'Ödendi';
        if (!gelir) SS.store.add('expenses', { projectId: h.projectId, date: v.date, category: c.cat || 'İşçilik', desc: `Hakediş No:${h.no} ödemesi – ${c.title}`, firmId: c.firmId, amount: v.amount, status: 'Ödendi', paidDate: v.date, source: 'hakedis', hakedisId: h.id }, 'e');
        SS.store.save(); ui.rerender(); ui.toast(gelir ? `Tahsilat kaydedildi · ${U.money(v.amount)}` : `Ödeme kaydedildi · ${U.money(v.amount)}`);
      },
    });
  };
})();
