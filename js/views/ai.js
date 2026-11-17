/* Şantiye AI — uygulama verilerini analiz eden yerel sohbet asistanı (kural + niyet çözümleme motoru) */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, N = U.norm;

  SS.css(`
  .ai-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr);gap:16px;align-items:start}
  .chat{display:flex;flex-direction:column;height:calc(100vh - 230px);min-height:520px;overflow:hidden}
  .chat>.region{flex:1;min-height:0;overflow:hidden}
  .chat-scroll{flex:1;min-height:0;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth;overscroll-behavior:contain}
  .msg{display:flex;gap:10px;max-width:92%;animation:rise .35s var(--ease) both}.msg.me{align-self:flex-end;flex-direction:row-reverse}
  .msg .bub{padding:11px 14px;border-radius:16px;line-height:1.55;font-size:14.5px;min-width:0}.msg.bot .bub{background:var(--surface-2);border:1px solid var(--line);border-top-left-radius:5px}
  .msg.me .bub{background:var(--brand);color:var(--brand-ink);border-top-right-radius:5px;font-weight:550}
  .msg .av{width:34px;height:34px;border-radius:11px;flex:none;background:var(--ink);color:var(--surface)}.msg .av .ic{width:18px;height:18px}
  .bub b{font-weight:700}.bub .big-n{font-size:22px;font-weight:800;letter-spacing:-.02em;display:block;margin:2px 0}
  .ai-t{width:100%;border-collapse:collapse;margin:8px 0 2px;font-size:13px}.ai-t td,.ai-t th{padding:6px 4px;border-top:1px solid var(--line);text-align:left}.ai-t th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-top:0}.ai-t .r{text-align:right;font-variant-numeric:tabular-nums}
  .bub ul{margin:6px 0 2px;padding-left:18px}.bub li{margin:3px 0}
  .ai-links{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  .chips{display:flex;gap:8px;flex-wrap:wrap;padding:0 18px 12px}.chips .chip{font-size:13px;padding:7px 12px}
  .chat-in{display:flex;gap:10px;padding:12px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--line-2);background:var(--surface)}
  .chat-in input{flex:1;min-height:46px;border:1.5px solid var(--line);border-radius:14px;padding:0 14px;background:var(--surface-2);font:inherit;color:var(--ink);outline:none;min-width:0}.chat-in input:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 18%,transparent)}
  .chat-in .btn{min-width:46px;padding:0 14px}
  .typing{display:inline-flex;gap:4px;padding:4px 2px}.typing i{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:dots 1.1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
  @keyframes dots{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
  .ins-list{display:flex;flex-direction:column;gap:10px}.ins-card{padding:14px;display:flex;gap:12px;align-items:flex-start;border-left:4px solid var(--line)}.ins-card.bad{border-left-color:var(--bad)}.ins-card.warn{border-left-color:var(--warn)}.ins-card.ok{border-left-color:var(--ok)}.ins-card.info{border-left-color:var(--info)}
  .ins-card .kpi-ic{width:36px;height:36px;margin:0}.ins-card b{font-size:14px;line-height:1.35;display:block}.ins-card p{font-size:13px;color:var(--muted);margin-top:3px;line-height:1.4}.ins-card a{font-size:13px;font-weight:650;color:var(--brand-text);display:inline-flex;gap:2px;align-items:center;margin-top:6px}
  .priv{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--muted);padding:2px 4px}.priv .ic{width:15px;height:15px}
  @media(max-width:1099px){.ai-grid{grid-template-columns:minmax(0,1fr)}.chat{height:calc(100vh - 190px);min-height:480px}}
  @media(max-width:699px){.chips{flex-wrap:nowrap;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}.chips .chip{flex:none}}
  `);

  /* ---------- çözümleme yardımcıları ---------- */
  const M = (n) => U.money(n), has = (n, re) => re.test(n);
  function parseRange(n) {
    const t = U.today(), mk = U.monthKey(t); let m;
    if (/\bbugun\b/.test(n)) return { from: t, to: t, label: 'bugün' };
    if (/\bdun\b/.test(n)) { const d = U.addDays(t, -1); return { from: d, to: d, label: 'dün' }; }
    if ((m = n.match(/son (\d+) gun/))) return { from: U.addDays(t, -(+m[1]) + 1), to: t, label: `son ${m[1]} gün` };
    if ((m = n.match(/son (\d+) hafta/))) return { from: U.addDays(t, -7 * +m[1] + 1), to: t, label: `son ${m[1]} hafta` };
    if ((m = n.match(/son (\d+) ay/))) return { from: U.addDays(t, -30 * +m[1] + 1), to: t, label: `son ${m[1]} ay` };
    if (/son hafta|haftalik|bu hafta/.test(n)) return { from: U.addDays(t, -6), to: t, label: 'son 7 gün' };
    if (/gecen ay/.test(n)) { const p = U.monthKey(U.addMonths(U.monthStart(mk), -1)); return { from: U.monthStart(p), to: U.monthEnd(p), label: U.monthLabel(p) }; }
    if (/bu ay|aylik|son ay/.test(n)) return { from: U.monthStart(mk), to: t, label: 'bu ay' };
    if (/bu yil|yillik/.test(n)) return { from: t.slice(0, 4) + '-01-01', to: t, label: 'bu yıl' };
    return null;
  }
  const CATS = [[/demir|beton/, 'Demir / Beton'], [/kaba/, 'Kaba Malzeme'], [/ince/, 'İnce Malzeme'], [/iscilik|yevmiye/, 'İşçilik'], [/nakliye|tasima/, 'Nakliye'], [/harc|resmi|ruhsat/, 'Resmi Harçlar'], [/genel gider|genel/, 'Genel Giderler']];
  const findCat = (n) => (CATS.find(([re]) => re.test(n)) || [])[1];
  const findProj = (n) => SS.D.projects.find((p) => N(p.shortName).split(' ').filter((w) => w.length > 3 && !['konutlari', 'projesi', 'sosyal', 'tesis'].includes(w)).some((w) => n.includes(w)) || (/sosyal|akyazi/.test(n) && p.id === 'p_sosyal'));
  const findMats = (n) => C.scope('materials').filter((m) => N(m.name).split(/[ ()\/,.-]+/).filter((w) => w.length >= 4 && !['insaat', 'nervurlu', 'blok', 'yikanmis', 'karisik', 'zemin', 'cephe', 'ic'].includes(w)).some((w) => n.includes(w.slice(0, Math.max(4, w.length - 2)))));
  const tbl = (head, rows) => `<table class="ai-t"><thead><tr>${head.map((h, i) => `<th class="${i ? 'r' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const L = (label, route) => ({ label, route });
  const scoped = (pid, fn) => { if (!pid) return fn(); const old = SS.cfg.activeProject; SS.cfg.activeProject = pid; try { return fn(); } finally { SS.cfg.activeProject = old; } };
  const delta = (cur, prev) => (prev ? `${cur >= prev ? '▲' : '▼'} %${U.num(Math.abs((cur / prev - 1) * 100))} ${cur >= prev ? 'artış' : 'düşüş'}` : '');

  /* ---------- cevap üreticiler ---------- */
  const A = {
    labor(n, r) {
      r = r || { from: U.addDays(U.today(), -29), to: U.today(), label: 'son 30 gün' };
      const len = U.diff(r.from, r.to) + 1, pf = U.addDays(r.from, -len), pt = U.addDays(r.from, -1), cur = C.laborCost(r.from, r.to), prev = C.laborCost(pf, pt);
      return { html: `<b>${r.label}</b> toplam işçilik (yevmiye) maliyeti:<span class="big-n">${M(cur.total)}</span>${U.num(cur.days, 1)} adam-gün · günlük ortalama ${M(cur.total / len)}${prev.total ? `<br><span class="sub">Önceki ${len} gün: ${M(prev.total)} (${delta(cur.total, prev.total)})</span>` : ''}
        ${Object.keys(cur.byRole).length ? tbl(['Görev', 'Maliyet'], Object.entries(cur.byRole).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, M(v)])) : ''}<span class="sub">Hesap puantaj kayıtlarındaki tam/yarım/fazla mesai günleri × günlük yevmiyeye dayanır.</span>`, links: [L('Puantaj & hakediş', 'workforce'), L('Puantaj raporu', 'reports')] };
    },
    attendance(n) {
      const r = parseRange(n), d = r && r.from === U.addDays(U.today(), -1) ? r.from : U.today(), pr = C.presentToday(d), day = SS.D.attendance[d] || {};
      const ab = C.workers().filter((w) => day[w.id] === 'D' || day[w.id] === 'I').map((w) => `${esc(w.name)} (${day[w.id] === 'D' ? 'devamsız' : 'izinli'})`);
      return { html: `<b>${d === U.today() ? 'Bugün' : U.fmtDate(d)}</b> sahada <b>${pr.heads} kişi</b> çalışıyor (${pr.present} personel/ekip kaydı). Puantaj: ${pr.marked}/${pr.total} işaretlendi.${ab.length ? `<br>Yok/izinli: ${ab.join(', ')}.` : ''}`, links: [L('Günlük puantaj', 'workforce')] };
    },
    stock(n) {
      const ms = findMats(n);
      if (ms.length && !/kritik/.test(n)) return { html: `Stok durumu:${tbl(['Malzeme', 'Mevcut', 'Kalan süre'], ms.map((m) => { const s = C.stock(m), d = C.daysLeft(m); return [esc(m.name), `<b>${U.num(s, 1)}</b> ${m.unit}`, isFinite(d) ? (d < 1 ? '1 günden az' : `~${Math.ceil(d)} gün`) : '—']; }))}${ms.map((m) => { const s = C.stock(m), d = C.daysLeft(m); return m.critical > 0 && s <= m.critical ? `<li><b>${esc(m.name)}</b> kritik seviyenin (${U.num(m.critical)} ${m.unit}) altında — sipariş verin.</li>` : isFinite(d) && d <= 7 ? `<li>${esc(m.name)} günlük ${U.num(C.usage(m), 1)} ${m.unit} tüketimle ~${Math.ceil(d)} günde biter.</li>` : ''; }).join('')}`, links: [L('Stok & malzeme', 'stock')] };
      const cr = C.criticalMats(), soon = C.scope('materials').filter((m) => !cr.includes(m) && C.daysLeft(m) <= 7);
      return { html: cr.length ? `<b>${cr.length} malzeme kritik seviyenin altında:</b>${tbl(['Malzeme', 'Mevcut', 'Kritik'], cr.map((m) => [esc(m.name), `${U.num(C.stock(m), 1)} ${m.unit}`, `${U.num(m.critical)} ${m.unit}`]))}${soon.length ? `7 gün içinde tükenebilecekler: ${soon.map((m) => esc(m.name)).join(', ')}.` : ''}` : `Kritik seviyenin altında malzeme yok. ${soon.length ? `7 gün içinde tükenebilecekler: ${soon.map((m) => esc(m.name)).join(', ')}.` : 'Tüm stoklar yeterli görünüyor.'}`, links: [L('Stok durumu', 'stock')] };
    },
    debt() {
      const ex = C.expenses().filter((e) => e.status !== 'Ödendi'), od = ex.filter((e) => C.expStatus(e) === 'Gecikmiş'), by = {}; ex.forEach((e) => (by[e.firmId] = (by[e.firmId] || 0) + e.amount));
      const soon = ex.filter((e) => C.expStatus(e) === 'Vadeli' && e.dueDate <= U.addDays(U.today(), 14)), hak = SS.D.hakedis.filter((h) => h.status === 'Onaylandı' && (SS.D.contracts.find((c) => c.id === h.contractId) || {}).dir !== 'gelir' && (C.active() === 'all' || h.projectId === C.active()));
      const hb = {}; hak.forEach((h) => { const c = SS.D.contracts.find((x) => x.id === h.contractId); hb[c.firmId] = (hb[c.firmId] || 0) + h.total - (h.paidAmount || 0); }); Object.entries(hb).forEach(([k, v]) => (by[k] = (by[k] || 0) + v));
      const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6);
      return { html: `Toplam ödenecek borç: <span class="big-n">${M(U.sum(ex, (e) => e.amount) + U.sum(Object.values(hb)))}</span>${od.length ? `<b class="neg">${od.length} ödeme gecikmiş (${M(U.sum(od, (e) => e.amount))})</b>. ` : ''}${soon.length ? `14 gün içinde vadesi gelen: ${soon.length} ödeme, ${M(U.sum(soon, (e) => e.amount))}.` : ''}
        ${top.length ? tbl(['Firma', 'Borç'], top.map(([f, v]) => [esc(ui.firmName(f)), M(v)])) : ''}<span class="sub">Vadeli harcamalar + onaylı taşeron hakediş bakiyeleri dahildir.</span>`, links: [L('Harcama & ödeme', 'expenses'), L('Hakediş', 'hakedis')] };
    },
    recv() {
      const t = U.today(), all = C.installments().filter((p) => !p.paid), od = all.filter((p) => p.due < t), nx = all.filter((p) => p.due >= t && p.due <= U.addDays(t, 30)), us = C.unitStats(), tot = C.totals();
      return { html: `Toplam tahsil edilecek alacak: <span class="big-n">${M(tot.receivable)}</span>Geciken taksit: <b class="${od.length ? 'neg' : ''}">${od.length} adet, ${M(U.sum(od, (p) => p.amount))}</b> · önümüzdeki 30 gün: ${nx.length} taksit, ${M(U.sum(nx, (p) => p.amount))}.
        ${od.length ? tbl(['Müşteri', 'Daire · vade', 'Tutar'], od.sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6).map((p) => [esc((p.customer || {}).name || '—'), `${p.unit.no} · ${U.fmtDate(p.due)}`, M(p.amount)])) : ''}${tot.hakAl ? `<span class="sub">İşveren hakediş alacağı: ${M(tot.hakAl)}</span>` : ''}`, links: [L('Tahsilat takvimi', 'sales')] };
    },
    sales() {
      const us = C.unitStats(); if (!us.total) return { html: 'Seçili şantiyede satış birimi tanımlı değil.', links: [L('Satış', 'sales')] };
      return { html: `<b>${us.sold}</b> daire satıldı (%${U.num((us.sold / us.total) * 100)}), <b>${us.reserved}</b> rezerve, <b>${us.free}</b> müsait — toplam ${us.total} daire.<br>Satış cirosu <b>${M(us.revenue)}</b>; tahsil edilen ${M(us.collected)}, kalan ${M(us.receivable)}.`, links: [L('Daire matrisi', 'sales')] };
    },
    progress() {
      const ps = C.projects().filter((p) => p.status === 'active'); if (!ps.length) return { html: 'Seçili kapsamda aktif şantiye yok.', links: [L('Projeler', 'projects')] };
      return { html: ps.map((p) => { const pg = C.progress(p), pl = C.planned(p), el = Math.max(1, U.diff(p.start, U.today())), rate = pg / el, fin = rate > 0 ? U.addDays(U.today(), Math.ceil((100 - pg) / rate)) : null, dev = fin ? U.diff(p.end, fin) : 0; return `<b>${esc(p.shortName)}</b>: fiziksel ilerleme <b>%${U.num(pg, 1)}</b> (planlanan %${U.num(pl)}) — ${pg - pl >= -2 ? 'takvimle uyumlu' : `<b class="neg">%${U.num(pl - pg)} geride</b>`}.${fin ? `<br><span class="sub">Bu hızla tahmini bitiş ${U.fmtDate(fin)} (planlanan ${U.fmtDate(p.end)}${dev > 3 ? `, ${dev} gün gecikme` : dev < -3 ? `, ${-dev} gün erken` : ''}).</span>` : ''}`; }).join('<br><br>'), links: [L('Proje detayı', 'projects')] };
    },
    profit(n, r) {
      r = r || { from: U.monthStart(U.monthKey(U.today())), to: U.today(), label: 'bu ay' }; const a = C.active();
      const out = U.sum(SS.D.expenses.filter((e) => e.status === 'Ödendi' && (a === 'all' || e.projectId === a) && C.inRange(C.cashDate(e), r.from, r.to)), (e) => e.amount);
      const inn = U.sum(SS.D.units.filter((u) => a === 'all' || u.projectId === a), (u) => U.sum((u.plan || []).filter((p) => p.paid && C.inRange(p.paidDate || p.due, r.from, r.to)), (p) => p.amount)) + U.sum(SS.D.hakedis.filter((h) => (a === 'all' || h.projectId === a) && (SS.D.contracts.find((c) => c.id === h.contractId) || {}).dir === 'gelir'), (h) => U.sum((h.payments || []).filter((p) => C.inRange(p.date, r.from, r.to)), (p) => p.amount));
      return { html: `<b>${r.label}</b> nakit durumu:${tbl(['Kalem', 'Tutar'], [['Tahsilat (satış + hakediş)', `<b class="pos">${M(inn)}</b>`], ['Ödeme (gider)', M(out)], ['Net nakit', `<b class="${inn - out >= 0 ? 'pos' : 'neg'}">${M(inn - out)}</b>`]])}<span class="sub">Yalnızca fiilen ödenen/tahsil edilen tutarlar; tahakkuk eden ve bekleyen kalemler dahil değildir.</span>`, links: [L('Nakit akışı', 'dashboard')] };
    },
    expense(n, r) {
      r = r || { from: U.monthStart(U.monthKey(U.today())), to: U.today(), label: 'bu ay' }; const cat = findCat(n), pid = C.active();
      const rows = C.expenses({ from: r.from, to: r.to, cat }), tot = U.sum(rows, (e) => e.amount), len = U.diff(r.from, r.to) + 1, prev = U.sum(C.expenses({ from: U.addDays(r.from, -len), to: U.addDays(r.from, -1), cat }), (e) => e.amount);
      const byC = {}; rows.forEach((e) => (byC[e.category] = (byC[e.category] || 0) + e.amount)); const byF = {}; rows.forEach((e) => (byF[e.firmId] = (byF[e.firmId] || 0) + e.amount));
      let extra = ''; if (cat && C.projects().length === 1) { const p = C.projects()[0], al = C.monthlyAllowance(p, cat); if (al && r.label === 'bu ay') extra = `<br>Aylık bütçe payı ${M(al)} — ${tot > al ? `<b class="neg">%${U.num((tot / al - 1) * 100)} aşıldı</b>` : `%${U.num((tot / al) * 100)} kullanıldı`}.`; }
      return { html: `<b>${r.label}</b>${cat ? ' · ' + cat : ''} toplam gider:<span class="big-n">${M(tot)}</span>${rows.length} kayıt${prev ? ` · önceki dönem ${M(prev)} (${delta(tot, prev)})` : ''}.${extra}
        ${!cat && Object.keys(byC).length ? tbl(['Kategori', 'Tutar'], Object.entries(byC).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => [k, M(v)])) : Object.keys(byF).length ? tbl(['Firma', 'Tutar'], Object.entries(byF).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => [esc(ui.firmName(k)), M(v)])) : ''}`, links: [L('Harcamalar', 'expenses'), L('Harcama dökümü (PDF/Excel)', 'reports')] };
    },
    contracts() {
      const l = C.scope('contracts').filter((c) => c.status === 'Aktif' && c.end).map((c) => ({ c, d: C.contractDays(c) })).sort((a, b) => a.d - b.d).slice(0, 6);
      return { html: l.length ? `Süresi en yakın sözleşmeler:${tbl(['Sözleşme', 'Bitiş', 'Kalan'], l.map(({ c, d }) => [esc(c.title), U.fmtDate(c.end), `<b class="${d <= 7 ? 'neg' : d <= 30 ? 'wrn' : ''}">${d < 0 ? -d + ' gün geçti' : d + ' gün'}</b>`]))}` : 'Aktif sözleşme bulunmuyor.', links: [L('Sözleşme kasası', 'contracts')] };
    },
    machines(n, r) {
      const ms = C.scope('machines'), due = ms.filter(C.machineDue), from = r ? r.from : U.addDays(U.today(), -29), fuel = U.sum(SS.D.machineLogs.filter((l) => ms.some((m) => m.id === l.machineId) && l.date >= from), (l) => l.fuel);
      return { html: `${ms.length} makineden ${ms.filter((m) => m.status === 'Çalışıyor').length} tanesi çalışıyor. ${r ? r.label : 'Son 30 gün'} yakıt tüketimi <b>${U.num(fuel)} lt</b> (≈ ${M(fuel * SS.cfg.fuelPrice)}).${due.length ? `<br><b class="wrn">Bakım zamanı yaklaşan:</b> ${due.map((m) => `${esc(m.name)} (${C.machineRemain(m) <= 0 ? 'gecikti' : U.num(C.machineRemain(m)) + ' sa kaldı'})`).join(', ')}.` : '<br>Yaklaşan bakım yok.'}`, links: [L('Makine parkı', 'machines')] };
    },
    safety() {
      const l = C.scope('safety').sort((a, b) => b.date.localeCompare(a.date)), op = C.scope('punch').filter((p) => p.status !== 'Çözüldü'), by = {}; op.forEach((p) => (by[p.priority] = (by[p.priority] || 0) + 1));
      return { html: `${l[0] ? `Son İSG kontrol skoru <b>%${l[0].score}</b> (${U.fmtDate(l[0].date)}); son ${Math.min(14, l.length)} kontrol ortalaması %${U.num(U.sum(l.slice(0, 14), (x) => x.score) / Math.min(14, l.length))}.` : 'Henüz İSG kontrolü yapılmamış.'}<br><b>${op.length}</b> açık eksik/kusur kartı var${op.length ? ': ' + ['Kritik', 'Yüksek', 'Orta', 'Düşük'].filter((k) => by[k]).map((k) => `${by[k]} ${k.toLowerCase()}`).join(', ') : ''}.${op.filter((p) => p.priority === 'Kritik').map((p) => `<br>• <b>${esc(p.title)}</b> — ${esc(p.assignee || '—')}`).join('')}`, links: [L('İSG & kalite', 'safety')] };
    },
    weather(n, r) {
      r = r || { from: U.addDays(U.today(), -29), to: U.today(), label: 'son 30 gün' }; const l = C.scope('diary').filter((d) => C.inRange(d.date, r.from, r.to)), st = l.filter((d) => d.stopped);
      return { html: `<b>${r.label}</b>: ${l.length} defter kaydında <b>${st.length} gün</b> iş durmuş (toplam ${U.sum(st, (d) => d.stopHours)} saat). Yağmurlu gün sayısı ${l.filter((d) => d.weather === 'Yağmurlu').length}.${st.length ? tbl(['Tarih', 'Süre', 'Neden'], st.slice(0, 5).map((d) => [U.fmtDate(d.date), d.stopHours + ' sa', esc(d.stopReason || d.weather)])) : ''}`, links: [L('Şantiye defteri', 'diary')] };
    },
    diary(n) {
      const l = C.scope('diary').sort((a, b) => b.date.localeCompare(a.date)), d = /dun/.test(n) ? l.find((x) => x.date === U.addDays(U.today(), -1)) : l[0];
      return { html: d ? `<b>${U.fmtDate(d.date)}</b> defteri — ${d.weather}, ${d.workers} kişi çalışmış:<br>${esc(d.work)}${d.stopped ? `<br><span class="wrn">İş durması: ${d.stopHours} saat — ${esc(d.stopReason)}</span>` : ''}` : 'Defter kaydı bulunamadı.', links: [L('Şantiye defteri', 'diary')] };
    },
    summary() {
      const t = C.totals(), ps = C.projects().filter((p) => p.status === 'active'), al = C.alerts().filter((a) => a.level !== 'info'), ins = C.insights().filter((i) => i.level === 'bad' || i.level === 'warn').slice(0, 3), mk = U.monthKey(U.today());
      return { html: `<b>Genel durum özeti</b>${tbl(['Gösterge', 'Değer'], [['Aktif şantiye / ort. ilerleme', `${ps.length} · %${U.num(C.avgProgress(), 1)}`], ['Bu ay gider', M(U.sum(C.expenses({ from: U.monthStart(mk), to: U.today() }), (e) => e.amount))], ['Ödenecek borç', M(t.payable + t.hakBorc)], ['Tahsil edilecek', M(t.receivable)], ['Kritik stok', `${C.criticalMats().length} kalem`], ['Bugün sahada', `${C.presentToday().heads} kişi`]])}${ins.length ? '<b>Dikkat edilmesi gerekenler:</b><ul>' + ins.map((i) => `<li>${esc(i.title)}</li>`).join('') + '</ul>' : 'Kritik bir uyarı görünmüyor.'}`, links: [L('Ana panel', 'dashboard')] };
    },
  };

  const SUGGEST = ['Son 15 günlük toplam işçilik maliyetimiz nedir?', 'Çimento stoğu ne kadar kaldı?', 'Kritik stoklar hangileri?', 'Bu ay en çok nereye harcadık?', 'Kime ne kadar borcumuz var?', 'Geciken taksitler neler?', 'Şantiye takvime göre nasıl gidiyor?', 'Kaç daire satıldı?', 'Bu ay demir maliyeti ne kadar?', 'Genel durum özeti ver'];

  function answer(q) {
    const n = N(q), r = parseRange(n), proj = findProj(n);
    const run = (fn, ...a) => scoped(proj && proj.id, () => fn(...a));
    if (/^(merhaba|selam|gunaydin|iyi gunler|hey)\b/.test(n) && n.split(' ').length < 4) return { html: `Merhaba! Şantiyenizin gerçek verilerini analiz edebilirim. Harcama, stok, puantaj, borç/alacak, satış, ilerleme ve İSG hakkında soru sorabilirsiniz.` };
    if (/(kac|kimse|kim).*(kisi|isci|personel)|sahada|devamsiz|bugun.*calis/.test(n) && !/maliyet|tutar/.test(n)) return run(A.attendance, n);
    if (/isci|iscilik|yevmiye|puantaj|maas|calisan/.test(n) && /maliyet|tutar|ne kadar|toplam|harca|odeme|gider|para/.test(n)) return run(A.labor, n, r);
    if (/stok|kritik|tukenecek|tukeniyor|kaldi|depo|malzeme/.test(n) || (findMats(n).length && /kac|ne kadar|kalan|var/.test(n) && !/harca|maliyet/.test(n))) return run(A.stock, n);
    if (/borc|odeyecegiz|odenecek|vadesi|gecikmis odeme|kime/.test(n)) return run(A.debt);
    if (/alacak|tahsilat|taksit|musteri.*(gecik|borc)|tahsil/.test(n)) return run(A.recv);
    if (/satis|satildi|daire|musait|rezerve|ciro/.test(n)) return run(A.sales);
    if (/ilerleme|yuzde kac|ne kadar bitti|tamamlan|takvim|gerid|ne zaman bit|bitis/.test(n)) return run(A.progress);
    if (/kar\b|zarar|nakit|gelir|net/.test(n) && !/ilerleme/.test(n)) return run(A.profit, n, r);
    if (/sozlesme|sure|bitiyor|biten/.test(n)) return run(A.contracts);
    if (/makine|vinc|bakim|yakit|jenerator|ekskavator|pompa|forklift/.test(n)) return run(A.machines, n, r);
    if (/isg|guvenlik|kusur|eksik|kaza|baret|kalite/.test(n)) return run(A.safety);
    if (/hava|yagmur|yagis|kar yagis|durdu|durma/.test(n)) return run(A.weather, n, r);
    if (/defter|yapilan is|bugun ne|dun ne/.test(n)) return run(A.diary, n);
    if (/harcama|gider|maliyet|masraf|demir|beton|nakliye|harc|ince|kaba|toplam|ne kadar|nereye/.test(n)) return run(A.expense, n, r);
    if (/ozet|durum|genel|nasil|rapor|ne var/.test(n)) return run(A.summary);
    return { html: `Bu soruyu tam anlayamadım. Şunlardan birini deneyebilirsiniz: <ul>${SUGGEST.slice(0, 5).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`, chips: true };
  }
  SS.ai = { answer };

  /* ---------- arayüz ---------- */
  const S = () => ui.vs('ai', { msgs: [], busy: false });
  const lnk = (l) => `<a class="btn sm" href="#/${l.route}">${I('chevR')}${esc(l.label)}</a>`;
  function chatHtml() {
    const s = S();
    return `<div class="chat-scroll" id="chatScroll">${s.msgs.map((m) => m.me ? `<div class="msg me"><div class="bub">${esc(m.text)}</div></div>` : `<div class="msg bot"><span class="av kpi-ic">${I('sparkles')}</span><div class="bub">${m.html}${(m.links || []).length ? `<div class="ai-links">${m.links.map(lnk).join('')}</div>` : ''}</div></div>`).join('')}${s.busy ? `<div class="msg bot"><span class="av kpi-ic">${I('sparkles')}</span><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>` : ''}</div>`;
  }
  function send(text) {
    text = String(text || '').trim(); if (!text) return; const s = S(); if (s.busy) return;
    s.msgs.push({ me: true, text }); s.busy = true; ui.update('ai-chat'); scrollDown();
    setTimeout(() => { let a; try { a = answer(text); } catch (e) { console.error(e); a = { html: 'Bu analiz sırasında bir hata oluştu: ' + esc(e.message) }; } s.msgs.push(Object.assign({ me: false }, a)); s.busy = false; ui.update('ai-chat'); scrollDown(); SS.sound.pop(); }, 420 + Math.random() * 380);
  }
  const scrollDown = () => setTimeout(() => { const el = document.getElementById('chatScroll'); if (el) el.scrollTop = el.scrollHeight; }, 30);

  SS.views.ai = {
    title: 'Şantiye AI',
    render() {
      const s = S(); if (!s.msgs.length) s.msgs.push({ me: false, html: `Merhaba <b>${esc(SS.cfg.user)}</b>! Ben Şantiye AI. Harcamalarınızı, stoklarınızı, puantajınızı, borç-alacağınızı, satışlarınızı ve ilerlemenizi <b>uygulamadaki gerçek verilerle</b> analiz ederim. Aşağıdaki önerilerden birini seçin veya kendi sorunuzu yazın.`, links: [] });
      const ins = C.insights();
      const chips = U.uniq(SUGGEST).sort(() => 0.5 - Math.random()).slice(0, 5);
      return `<div class="page">${ui.head({ title: 'Şantiye AI', sub: 'Verilerinizi analiz eden akıllı saha asistanı', actions: `<span class="badge ok">${I('shield')}Yerel analiz · veriler cihazınızdan çıkmaz</span>` })}
        <div class="ai-grid"><div class="card chat">${ui.region('ai-chat', chatHtml)}<div class="chips">${chips.map((c) => `<button class="chip" data-action="ai.ask" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
          <form class="chat-in" data-ai-form><input type="text" name="q" placeholder="Örn: Son 15 günlük toplam işçilik maliyetimiz nedir?" autocomplete="off" aria-label="Soru"><button class="btn primary" type="submit" aria-label="Gönder">${I('send')}</button></form></div>
        <div class="ai-side stack"><div class="row between"><h3>Akıllı Öneriler</h3><span class="badge muted">${ins.length}</span></div><div class="ins-list">${ins.length ? ins.slice(0, 9).map((i) => `<div class="card ins-card ${i.level}"><span class="kpi-ic tone-${i.level === 'ok' ? 'ok' : i.level}">${I(i.icon)}</span><div><b>${esc(i.title)}</b><p>${esc(i.text)}</p><a href="#/${i.route}">İlgili modüle git ${I('chevR')}</a></div></div>`).join('') : '<div class="card pad">' + ui.empty('check', 'Her şey yolunda', 'Şu an dikkat çeken bir durum yok.') + '</div>'}</div></div></div></div>`;
    },
    mount() { scrollDown(); },
  };
  SS.actions['ai.ask'] = (el) => send(el.dataset.q);
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-ai-form]'); if (!f) return; e.preventDefault(); const i = f.elements.q; send(i.value); i.value = ''; });
})();
