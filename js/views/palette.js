/* Hızlı Ara (komut paleti, Ctrl+K) ve uyarı çanı */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, N = U.norm;

  SS.css(`
  .layer:has(.sheet.pal){align-items:flex-start;padding-top:10vh}
  .sheet.pal{width:min(640px,calc(100vw - 24px));max-height:78vh}.sheet.pal .sheet-h{display:none}.sheet.pal .sheet-b{padding:0;display:flex;flex-direction:column;min-height:0}
  .pal-in{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--line-2)}.pal-in .ic{color:var(--muted)}.pal-in input{flex:1;border:0;background:none;outline:none;font:600 17px var(--font);color:var(--ink);min-width:0}
  .pal-in kbd{font:600 11.5px var(--font);color:var(--muted);border:1px solid var(--line);border-radius:6px;padding:2px 6px}
  .pal-list{overflow-y:auto;padding:8px;flex:1;min-height:60px}.pal-g{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);padding:10px 10px 4px}
  .pal-i{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;cursor:pointer}.pal-i .kpi-ic{width:32px;height:32px;margin:0;border-radius:10px}.pal-i .kpi-ic .ic{width:17px;height:17px}.pal-i b{display:block;font-size:14.5px}.pal-i small{color:var(--muted);font-size:12.5px}.pal-i.on,.pal-i:hover{background:var(--brand-soft)}
  .pal-i .grow{min-width:0}.pal-i .grow>*{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pal-f{padding:8px 16px;border-top:1px solid var(--line-2);font-size:12px;color:var(--muted);display:flex;gap:14px;flex-wrap:wrap}
  .bell{position:relative}.bell-n{position:absolute;top:3px;right:2px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--bad);color:#fff;font:700 10.5px/17px var(--font);text-align:center;font-style:normal;display:none}.bell-n.on{display:block}.bell-n.warn{background:#d99a1d;color:#1a1205}
  .bell-list{display:flex;flex-direction:column;gap:8px}.bell-list a{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line-2)}.bell-list a:hover{border-color:var(--brand)}.bell-list .kpi-ic{width:36px;height:36px;margin:0}.bell-list b{display:block;font-size:14px;line-height:1.3}.bell-list small{color:var(--muted);font-size:12.5px}
  @media(max-width:699px){#soundBtn{display:none}.layer:has(.sheet.pal){padding-top:0}.sheet.pal{width:100%;max-height:100vh;height:100vh;border-radius:0}}
  `);

  const ACTIONS = [['exp.new', 'Harcama gir', 'receipt', 'brand'], ['stock.in', 'Malzeme girişi', 'box', 'ok'], ['stock.out', 'Malzeme çıkışı', 'arrowUp', 'warn'], ['wf.today', 'Puantaj al', 'users', 'info'], ['diary.new', 'Defter yaz', 'book', 'brand'], ['safety.check', 'İSG kontrolü', 'shield', 'ok'], ['punch.new', 'Eksik / kusur ekle', 'flag', 'bad'], ['mach.log', 'Makine kaydı', 'truck', 'info'], ['concrete.new', 'Beton dökümü ekle', 'layers', 'info'], ['order.new', 'Satın alma talebi', 'receipt', 'warn'], ['todo.new', 'Görev ekle', 'check', 'ok'], ['meet.new', 'Toplantı tutanağı yaz', 'note', 'info'], ['proj.new', 'Yeni şantiye ekle', 'building', 'brand']];
  const flat = () => ui.NAV.flatMap((g) => g.items).concat([{ id: 'settings', t: 'Ayarlar & Yedek', i: 'gear' }]);

  function results(q) {
    const n = N(q), out = [], sc = (s) => (!n ? 1 : N(s).startsWith(n) ? 3 : N(s).split(' ').some((w) => w.startsWith(n)) ? 2.5 : N(s).includes(n) ? 2 : 0);
    const add = (g, label, sub, icon, tone, run, extra = '') => { const s = Math.max(sc(label), sc(extra) * 0.8, sub ? sc(sub) * 0.6 : 0); if (s > 0) out.push({ g, label, sub, icon, tone, run, s }); };
    flat().forEach((it) => add('Sayfalar', it.t, '', it.i, 'brand', () => ui.go(it.id)));
    ACTIONS.forEach(([a, l, i, tn]) => add('İşlemler', l, '', i, tn, () => { if (ui.NEEDS_PROJECT.has(a) && !SS.D.projects.length) { ui.toast('Önce ilk şantiyenizi ekleyin', 'info'); return SS.actions['proj.new'](); } SS.actions[a]({ dataset: {} }); }));
    if (n.length >= 2) {
      const D = SS.D, lim = (a) => a.slice(0, 5);
      lim(D.projects.filter((p) => N(p.name + ' ' + p.location).includes(n))).forEach((p) => add('Kayıtlar', p.shortName || p.name, 'Şantiye · ' + p.location, 'building', 'info', () => ui.go('projects/' + p.id), p.name));
      lim(D.firms.filter((f) => N(f.name + ' ' + (f.contact || '')).includes(n))).forEach((f) => add('Kayıtlar', f.name, 'Firma · ' + f.type + (f.phone ? ' · ' + f.phone : ''), 'users', 'info', () => SS.actions['firm.open']({ dataset: { id: f.id } }, { stopPropagation() {} }), f.name));
      lim(D.workers.filter((w) => N(w.name).includes(n))).forEach((w) => add('Kayıtlar', w.name, 'Personel · ' + w.role, 'hardhat', 'ok', () => ui.go('workforce'), w.name));
      lim(D.materials.filter((m) => N(m.name).includes(n))).forEach((m) => add('Kayıtlar', m.name, `Stok · ${U.num(C.stock(m), 1)} ${m.unit}`, 'box', 'warn', () => ui.go('stock'), m.name));
      D.expenses.filter((e) => N(e.desc).includes(n)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).forEach((e) => add('Kayıtlar', e.desc, `Harcama · ${U.money(e.amount)} · ${U.fmtDate(e.date)}`, 'receipt', 'brand', () => SS.actions['exp.edit']({ dataset: { id: e.id } }), e.desc));
      lim(D.todos.filter((t) => N(t.title).includes(n))).forEach((t) => add('Kayıtlar', t.title, 'Görev · ' + t.status, 'check', 'ok', () => SS.actions['todo.edit']({ dataset: { id: t.id } }), t.title));
      lim(D.concrete.filter((c) => N(c.element + ' ' + c.cls).includes(n))).forEach((c) => add('Kayıtlar', c.element, `Beton · ${c.cls} · ${U.num(c.qty, 1)} m³`, 'layers', 'info', () => SS.actions['concrete.edit']({ dataset: { id: c.id } }), c.element));
      lim(D.orders.filter((o) => N(o.item).includes(n))).forEach((o) => add('Kayıtlar', o.item, 'Talep · ' + o.status, 'receipt', 'warn', () => SS.actions['order.edit']({ dataset: { id: o.id } }), o.item));
      SS.tools.kb.filter((k) => N(k.t + ' ' + k.kw).includes(n)).slice(0, 3).forEach((k) => add('Bilgi', k.t, 'Rehber', 'info', 'info', () => { ui.vs('guide').tab = 'kb'; ui.vs('guide').q = q; ui.go('guide'); }, k.t));
    }
    const order = ['İşlemler', 'Sayfalar', 'Kayıtlar', 'Bilgi'];
    out.sort((a, b) => order.indexOf(a.g) - order.indexOf(b.g) || b.s - a.s);
    const lim = n ? 14 : 12; const list = out.slice(0, lim);
    if (n.length >= 2) list.push({ g: 'Şantiye AI', label: `Şantiye AI'ya sor: “${q.trim()}”`, sub: 'Verilerinizi analiz eder, hesap yapar, saha sorularını yanıtlar', icon: 'sparkles', tone: 'brand', run: () => { ui.go('ai'); setTimeout(() => SS.ai.send(q.trim()), 350); } });
    return list;
  }

  function open() {
    let list = [], sel = 0;
    ui.sheet({ cls: 'pal', noFocus: true, body: `<div class="pal-in">${I('search')}<input type="text" placeholder="Sayfa, işlem, firma, personel, malzeme ara…" autocomplete="off" aria-label="Ara"><kbd>Esc</kbd></div><div class="pal-list" role="listbox"></div><div class="pal-f"><span>↑↓ gezin</span><span>Enter seç</span><span>Esc kapat</span></div>`,
      mount(el, api) {
        const inp = el.querySelector('input'), box = el.querySelector('.pal-list');
        const draw = () => { let g = ''; box.innerHTML = list.length ? list.map((r, i) => { const h = r.g !== g ? `<div class="pal-g">${r.g}</div>` : ''; g = r.g; return `${h}<div class="pal-i ${i === sel ? 'on' : ''}" data-i="${i}" role="option"><span class="kpi-ic tone-${r.tone}">${I(r.icon)}</span><span class="grow"><b>${esc(r.label)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>${I('chevR')}</div>`; }).join('') : `<div class="empty small" style="padding:24px"><p>Sonuç bulunamadı</p></div>`; const on = box.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' }); };
        const run = (i) => { const r = list[i]; if (!r) return; api.close(); setTimeout(r.run, 120); };
        const upd = () => { list = results(inp.value); sel = 0; draw(); };
        inp.addEventListener('input', upd);
        inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); draw(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); } else if (e.key === 'Enter') { e.preventDefault(); run(sel); } });
        box.addEventListener('click', (e) => { const r = e.target.closest('[data-i]'); if (r) run(+r.dataset.i); });
        box.addEventListener('mousemove', (e) => { const r = e.target.closest('[data-i]'); if (r && +r.dataset.i !== sel) { sel = +r.dataset.i; box.querySelectorAll('.pal-i').forEach((x) => x.classList.toggle('on', +x.dataset.i === sel)); } });
        upd(); setTimeout(() => inp.focus(), 60);
      } });
  }
  SS.actions['pal.open'] = open;
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!document.querySelector('.sheet.pal')) open(); }
    else if (e.key === '/' && !typing && !document.querySelector('.layer')) { e.preventDefault(); open(); }
  });

  /* ---------- uyarı çanı ---------- */
  function bellCount() { const al = C.alerts().filter((a) => a.level !== 'info'); return { n: al.length, bad: al.some((a) => a.level === 'bad') }; }
  ui.updateBell = () => { const b = document.querySelector('#bellBtn .bell-n'); if (!b) return; const { n, bad } = bellCount(); b.textContent = n > 9 ? '9+' : n; b.classList.toggle('on', n > 0); b.classList.toggle('warn', !bad); };
  SS.actions['bell.open'] = () => {
    const al = C.alerts(), tone = (l) => (l === 'bad' ? 'bad' : l === 'warn' ? 'warn' : 'info');
    ui.sheet({ title: 'Uyarılar & Hatırlatmalar', side: true, noFocus: true, body: al.length ? `<div class="bell-list">${al.map((a) => `<a href="#/${a.route}" data-sheet-close><span class="kpi-ic tone-${tone(a.level)}">${I(a.icon)}</span><span><b>${esc(a.title)}</b><small>${esc(a.text)}</small></span></a>`).join('')}</div>` : ui.empty('check', 'Her şey yolunda', 'Bekleyen uyarı veya hatırlatma yok.'),
      footer: `<a class="btn" href="#/ai" data-sheet-close>${I('sparkles')}Şantiye AI'dan brifing al</a>` });
  };
  const route = ui.route; ui.route = function () { const r = route.apply(this, arguments); try { ui.updateBell(); } catch (e) { /* */ } return r; };
})();
