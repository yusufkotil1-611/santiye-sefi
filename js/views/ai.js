/* Şantiye AI — uygulama verilerini analiz eden yerel akıllı asistan.
   Not: Bu bir büyük dil modeli değildir; Türkçe niyet çözümleme + varlık tanıma + saha bilgi bankası + hesap motoru kullanan,
   tamamen cihaz içinde çalışan bir asistandır (veriler cihazdan çıkmaz). */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, N = U.norm, T = SS.tools;

  SS.css(`
  .ai-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr);gap:16px;align-items:start}
  .chat{display:flex;flex-direction:column;height:calc(100vh - 215px);min-height:540px;overflow:hidden}
  .chat-head{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--line-2)}
  .chat-head .av{width:38px;height:38px;border-radius:12px;background:var(--ink);color:var(--surface);display:grid;place-items:center}.chat-head .av .ic{width:20px;height:20px}
  .chat-head b{display:block;font-size:15px}.chat-head small{color:var(--muted);font-size:12px;display:flex;align-items:center;gap:6px}.chat-head small i{width:7px;height:7px;border-radius:50%;background:var(--ok);display:inline-block}
  .chat-head .grow{flex:1}
  .chat>.region{flex:1;min-height:0;overflow:hidden}
  .chat-scroll{flex:1;min-height:0;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain;height:100%}
  .msg{display:flex;gap:10px;max-width:94%}.msg.new{animation:rise .3s var(--ease) both}.msg.me{align-self:flex-end;flex-direction:row-reverse}
  .msg .bub{padding:11px 14px;border-radius:16px;line-height:1.55;font-size:14.5px;min-width:0;overflow-wrap:anywhere}.msg.bot .bub{background:var(--surface-2);border:1px solid var(--line);border-top-left-radius:5px}
  .msg.me .bub{background:var(--brand);color:var(--brand-ink);border-top-right-radius:5px;font-weight:550}
  .msg .av{width:34px;height:34px;border-radius:11px;flex:none;background:var(--ink);color:var(--surface)}.msg .av .ic{width:18px;height:18px}
  .bub b{font-weight:700}.bub .big-n{font-size:22px;font-weight:800;letter-spacing:-.02em;display:block;margin:2px 0}
  .bub a:not(.btn){color:var(--brand-text);font-weight:650;text-decoration:underline}
  .ai-t{width:100%;border-collapse:collapse;margin:8px 0 2px;font-size:13px}.ai-t td,.ai-t th{padding:6px 4px;border-top:1px solid var(--line);text-align:left}.ai-t th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-top:0}.ai-t .r{text-align:right;font-variant-numeric:tabular-nums}
  .bub ul{margin:6px 0 2px;padding-left:18px}.bub li{margin:3px 0}
  .ai-links{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  .ai-tools{display:flex;gap:2px;margin-top:8px;margin-left:-6px}.ai-tools button{border:0;background:none;color:var(--muted);width:30px;height:28px;border-radius:8px;display:grid;place-items:center;cursor:pointer}.ai-tools button:hover{background:var(--track);color:var(--ink)}.ai-tools .ic{width:15px;height:15px}
  .chips{display:flex;gap:8px;flex-wrap:wrap;padding:0 18px 12px}.chips .chip{font-size:13px;padding:7px 12px}
  .chat-in{display:flex;gap:8px;padding:12px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--line-2);background:var(--surface)}
  .chat-in input{flex:1;min-height:46px;border:1.5px solid var(--line);border-radius:14px;padding:0 14px;background:var(--surface-2);font:inherit;color:var(--ink);outline:none;min-width:0}.chat-in input:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 18%,transparent)}
  .chat-in .btn{min-width:46px;padding:0 14px}
  .chat-in .mic.on{background:var(--bad);border-color:var(--bad);color:#fff;animation:pulse 1.2s infinite}
  .typing{display:inline-flex;gap:4px;padding:4px 2px}.typing i{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:dots 1.1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
  @keyframes dots{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
  .ins-list{display:flex;flex-direction:column;gap:10px}.ins-card{padding:14px;display:flex;gap:12px;align-items:flex-start;border-left:4px solid var(--line)}.ins-card.bad{border-left-color:var(--bad)}.ins-card.warn{border-left-color:var(--warn)}.ins-card.ok{border-left-color:var(--ok)}.ins-card.info{border-left-color:var(--info)}
  .ins-card .kpi-ic{width:36px;height:36px;margin:0}.ins-card b{font-size:14px;line-height:1.35;display:block}.ins-card p{font-size:13px;color:var(--muted);margin-top:3px;line-height:1.4}.ins-card a{font-size:13px;font-weight:650;color:var(--brand-text);display:inline-flex;gap:2px;align-items:center;margin-top:6px}
  .topics{display:flex;flex-direction:column;gap:14px}.topics h4{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:8px}.topics .chips{padding:0}
  .priv{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--muted);padding:2px 4px}.priv .ic{width:15px;height:15px}
  @media(max-width:1099px){.ai-grid{grid-template-columns:minmax(0,1fr)}.chat{height:calc(100vh - 190px);min-height:500px}}
  @media(max-width:699px){.ai-page>.page-head{display:none}.ai-page .chat{height:calc(100vh - 172px - env(safe-area-inset-bottom));height:calc(100dvh - 172px - env(safe-area-inset-bottom));min-height:360px}.chat-head{padding:10px 12px}.chat-head .btn span{display:none}.chat-head b{white-space:nowrap}.chips{flex-wrap:nowrap;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}.chips .chip{flex:none}.chat-head small{display:none}.msg{max-width:100%}}
  `);

  /* ---------- sayı / tarih çözümleme ---------- */
  const M = (n) => U.money(n);
  const num = (s) => { s = String(s).trim(); if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(',', '.'); return parseFloat(s); };
  const nums = (n) => (n.match(/\d+(?:[.,]\d+)*/g) || []).map(num).filter((x) => isFinite(x));
  const money = (n) => { const m = n.match(/(\d+(?:[.,]\d+)*)\s*(bin|milyon|mn|k)?\s*(?:tl|lira|₺)?/); if (!m) return null; let v = num(m[1]); if (m[2] === 'bin' || m[2] === 'k') v *= 1e3; if (m[2] === 'milyon' || m[2] === 'mn') v *= 1e6; return v; };
  const WD = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
  function parseDate(n) {
    const t = U.today(); let m;
    if (/\bbugun\b/.test(n)) return t; if (/\byarin\b/.test(n)) return U.addDays(t, 1); if (/obur gun|ertesi gun/.test(n)) return U.addDays(t, 2);
    if ((m = n.match(/(\d+) gun sonra/))) return U.addDays(t, +m[1]); if ((m = n.match(/(\d+) hafta sonra/))) return U.addDays(t, 7 * +m[1]);
    if (/haftaya/.test(n)) return U.addDays(t, 7);
    if ((m = n.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/))) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    for (let i = 0; i < 7; i++) if (new RegExp('\\b' + WD[i] + '\\b').test(n)) { const d = (i - U.dow(t) + 7) % 7 || 7; return U.addDays(t, d); }
    return null;
  }
  function parseRange(n) {
    const t = U.today(), mk = U.monthKey(t); let m;
    if (/\bbugun\b/.test(n)) return { from: t, to: t, label: 'bugün' };
    if (/\bdun\b/.test(n)) { const d = U.addDays(t, -1); return { from: d, to: d, label: 'dün' }; }
    if ((m = n.match(/son (\d+) gun/))) return { from: U.addDays(t, -(+m[1]) + 1), to: t, label: `son ${m[1]} gün` };
    if ((m = n.match(/son (\d+) hafta/))) return { from: U.addDays(t, -7 * +m[1] + 1), to: t, label: `son ${m[1]} hafta` };
    if ((m = n.match(/son (\d+) ay/))) return { from: U.addDays(t, -30 * +m[1] + 1), to: t, label: `son ${m[1]} ay` };
    if (/gecen hafta/.test(n)) return { from: U.addDays(t, -13), to: U.addDays(t, -7), label: 'geçen hafta' };
    if (/son hafta|haftalik|bu hafta/.test(n)) return { from: U.addDays(t, -6), to: t, label: 'son 7 gün' };
    if (/gecen ay/.test(n)) { const p = U.monthKey(U.addMonths(U.monthStart(mk), -1)); return { from: U.monthStart(p), to: U.monthEnd(p), label: U.monthLabel(p) }; }
    if (/bu ay|aylik|son ay/.test(n)) return { from: U.monthStart(mk), to: t, label: 'bu ay' };
    if (/bu yil|yillik/.test(n)) return { from: t.slice(0, 4) + '-01-01', to: t, label: 'bu yıl' };
    return null;
  }
  const CATS = [[/demir|beton/, 'Demir / Beton'], [/kaba/, 'Kaba Malzeme'], [/ince/, 'İnce Malzeme'], [/iscilik|yevmiye/, 'İşçilik'], [/nakliye|tasima/, 'Nakliye'], [/resmi|ruhsat|harclar/, 'Resmi Harçlar'], [/genel gider|genel/, 'Genel Giderler']];
  const findCat = (n) => (CATS.find(([re]) => re.test(n)) || [])[1];

  /* ---------- varlık tanıma (şantiye, malzeme, firma, personel) ---------- */
  const STOP = ['konutlari', 'projesi', 'sosyal', 'tesis', 'insaat', 'ticaret', 'limited', 'sirketi', 'anonim', 'sanayi', 'taahhut', 'yapi', 'proje', 'malzeme', 'malzemeleri', 'ltd', 'sti', 'blok', 'kaba', 'ince', 'taseron', 'market', 'nakliyat'];
  const wordsOf = (s, min = 4) => N(s).split(/[ ()\/,.\-–]+/).filter((w) => w.length >= min && !STOP.includes(w));
  const hit = (n, w) => new RegExp('(^| )' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-z]{0,6}( |$)').test(n);
  const findProj = (n) => SS.D.projects.find((p) => wordsOf(p.shortName + ' ' + p.location).some((w) => hit(n, w)));
  const FSTOP = ['cimento', 'demir', 'celik', 'beton', 'kereste', 'kalip', 'seramik', 'tesisat', 'elektrik', 'boya', 'alci', 'akaryakit', 'petrol', 'micir', 'lojistik', 'asansor', 'dograma', 'hazir', 'dunyasi', 'bayii', 'sakarya', 'serdivan', 'hendek', 'akyazi', 'karasu', 'adapazari', 'kum', 'sivasi', 'sosyal'];
  const findFirm = (n) => { let best = null, bs = 0; SS.D.firms.forEach((f) => { const s = wordsOf(f.name).filter((w) => !FSTOP.includes(w) && hit(n, w)).length; if (s > bs) { bs = s; best = f; } }); return best; };
  const findWorker = (n) => C.workers().find((w) => wordsOf(w.name, 3).slice(0, 2).some((x) => hit(n, x) && !['usta', 'kalfa', 'duz', 'isci', 'ekip', 'ekibi'].includes(x)));
  const findMats = (n) => C.scope('materials').filter((m) => N(m.name).split(/[ ()\/,.-]+/).filter((w) => w.length >= 4 && !['insaat', 'nervurlu', 'blok', 'yikanmis', 'karisik', 'zemin', 'cephe'].includes(w)).some((w) => n.includes(w.slice(0, Math.max(4, w.length - 2)))));
  const tbl = (head, rows) => `<table class="ai-t"><thead><tr>${head.map((h, i) => `<th class="${i ? 'r' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const L = (label, route) => ({ label, route });
  const scoped = (pid, fn) => { if (!pid) return fn(); const old = SS.cfg.activeProject; SS.cfg.activeProject = pid; try { return fn(); } finally { SS.cfg.activeProject = old; } };
  const delta = (cur, prev) => (prev ? `${cur >= prev ? '▲' : '▼'} %${U.num(Math.abs((cur / prev - 1) * 100))} ${cur >= prev ? 'artış' : 'düşüş'}` : '');
  const ul = (a) => (a.length ? `<ul>${a.map((x) => `<li>${x}</li>`).join('')}</ul>` : '');
  const act = (label, action, data = {}, icon = 'plus') => ({ label, action, data, icon });
  const noProject = () => ({ html: `Henüz kayıtlı bir <b>şantiyeniz yok</b>; bu yüzden analiz edecek veri bulunmuyor. Önce şantiyenizi ekleyin, ardından harcama, stok ve puantaj girdikçe size gerçek rakamlarla cevap vereceğim.<br><span class="sub">Bu arada hesap ve bilgi sorularını hemen yanıtlayabilirim; örn. “12x8 m 20 cm döşeme kaç m³ beton?”</span>`, actions: [act('İlk şantiyemi ekle', 'proj.new', {}, 'building')], chips: ['Beton kürü nasıl yapılır?', '12x8 m 20 cm döşeme kaç m³ beton?', 'KKD nelerdir?'] });

  /* ---------- cevap üreticiler ---------- */
  const A = {
    greet() { const h = new Date().getHours(); return { html: `${h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi çalışmalar' : 'İyi akşamlar'} <b>${esc(SS.cfg.user)}</b>! Size nasıl yardımcı olabilirim? Günlük özet, borç-alacak, stok, puantaj, beton numuneleri, hesaplamalar ve saha bilgileri hakkında sorabilirsiniz.`, chips: ['Bugün ne yapmalıyım?', 'Genel durum özeti ver', 'Kritik stoklar hangileri?'] }; },
    thanks() { return { html: 'Rica ederim! Başka bir konuda yardımcı olabilirsem söyleyin. 👷' }; },
    who() { return { html: `Ben <b>Şantiye AI</b>; <b>${esc(SS.cfg.user)}</b> için çalışan saha asistanıyım. Uygulamadaki gerçek verilerinizi (harcama, stok, puantaj, hakediş, satış, beton, sipariş, görev…) analiz eder, metraj hesabı yapar ve şantiye bilgisi veririm. Bir yapay zekâ servisine bağlı değilim; her şey bu cihazda çalışır ve verileriniz dışarı çıkmaz.` }; },
    help() { return { html: `<b>Şunları yapabilirim:</b>${ul(['<b>Günlük brifing:</b> “Bugün ne yapmalıyım?”', '<b>Finans:</b> borç, alacak, nakit tahmini, bütçe aşımı, firma bakiyesi', '<b>Stok & satın alma:</b> kritik stok, tükenme tahmini, sipariş önerisi', '<b>Personel:</b> sahadaki kişi, işçilik maliyeti, kişi bazlı maaş', '<b>Saha:</b> ilerleme, İSG, makine bakımı, beton numuneleri, görevler', '<b>Hesap:</b> beton m³, demir kg, tuğla adedi, boya litresi, hafriyat sefer, KDV…', '<b>Bilgi:</b> beton, donatı, İSG, hakediş, iş kazası gibi konular', '<b>Komut:</b> “yarın için görev ekle: …”, “harcama ekle”, “puantaj al”'])}Aşağıdaki “Neler sorabilirim?” düğmesinden örnekleri görebilirsiniz.`, chips: ['Bugün ne yapmalıyım?', '12x8 m 20 cm döşeme kaç m³ beton?', 'Beton kürü nasıl yapılır?'] }; },

    briefing() {
      const al = C.alerts(), todos = openTodos().filter((t) => t.due && t.due <= U.today()), out = [];
      const bad = al.filter((a) => a.level === 'bad'), warn = al.filter((a) => a.level === 'warn'), inf = al.filter((a) => a.level === 'info');
      const li = (a) => `<a href="#/${a.route}"><b>${esc(a.title)}</b></a> — ${esc(a.text)}`;
      if (bad.length) out.push(`<b class="neg">Acil (${bad.length})</b>${ul(bad.slice(0, 5).map(li))}`);
      if (warn.length) out.push(`<b class="wrn">Yaklaşan / dikkat (${warn.length})</b>${ul(warn.slice(0, 5).map(li))}`);
      if (todos.length) out.push(`<b>Bugün ve geciken görevler (${todos.length})</b>${ul(todos.slice(0, 5).map((t) => `${esc(t.title)} <span class="sub">${t.due < U.today() ? '· ' + -U.diff(U.today(), t.due) + ' gün gecikti' : '· bugün'}</span>`))}`);
      if (inf.length) out.push(`<b>Hatırlatmalar</b>${ul(inf.slice(0, 4).map(li))}`);
      const pr = C.presentToday();
      return { html: `<b>${U.fmtDateLong(U.today())}</b> — günlük brifing<br>${pr.total ? `Sahada bugün <b>${pr.heads} kişi</b> görünüyor (puantaj ${pr.marked}/${pr.total}).` : ''}${out.length ? '<br><br>' + out.join('<br>') : '<br><br>Bugün için acil bir uyarı veya hatırlatma görünmüyor. Güzel bir gün! ✅'}`,
        links: [L('Ana panel', 'dashboard')], actions: [act('Puantaj al', 'wf.today', {}, 'users'), act('Defter yaz', 'diary.new', {}, 'book'), act('İSG kontrolü', 'safety.check', {}, 'shield')], chips: ['Kritik stoklar hangileri?', 'Kime ne kadar borcumuz var?', 'Açık görevlerim neler?'] };
    },
    labor(n, r) {
      r = r || { from: U.addDays(U.today(), -29), to: U.today(), label: 'son 30 gün' };
      const len = U.diff(r.from, r.to) + 1, pf = U.addDays(r.from, -len), pt = U.addDays(r.from, -1), cur = C.laborCost(r.from, r.to), prev = C.laborCost(pf, pt);
      if (!cur.total) return { html: `<b>${r.label}</b> için puantaj kaydı bulunamadı; işçilik maliyeti hesaplanamadı. Puantaj girdikçe burada görürsünüz.`, actions: [act('Puantaj al', 'wf.today', {}, 'users')] };
      return { html: `<b>${r.label}</b> toplam işçilik (yevmiye) maliyeti:<span class="big-n">${M(cur.total)}</span>${U.num(cur.days, 1)} adam-gün · günlük ortalama ${M(cur.total / len)}${prev.total ? `<br><span class="sub">Önceki ${len} gün: ${M(prev.total)} (${delta(cur.total, prev.total)})</span>` : ''}
        ${Object.keys(cur.byRole).length ? tbl(['Görev', 'Maliyet'], Object.entries(cur.byRole).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, M(v)])) : ''}<span class="sub">Hesap puantaj kayıtlarındaki tam/yarım/fazla mesai günleri × günlük yevmiyeye dayanır.</span>`, links: [L('Puantaj & hakediş', 'workforce'), L('Puantaj raporu', 'reports')], chips: ['Bu ay maaş toplamı ne kadar?', 'Geçen ay işçilik maliyeti', 'Bugün sahada kaç kişi var?'] };
    },
    attendance(n) {
      const r = parseRange(n), d = r && r.from === U.addDays(U.today(), -1) ? r.from : U.today(), pr = C.presentToday(d), day = SS.D.attendance[d] || {};
      const ab = C.workers().filter((w) => day[w.id] === 'D' || day[w.id] === 'I').map((w) => `${esc(w.name)} (${day[w.id] === 'D' ? 'devamsız' : 'izinli'})`);
      const un = C.workers().filter((w) => !day[w.id]).map((w) => esc(w.name));
      if (!pr.total) return { html: 'Henüz kayıtlı personeliniz yok. Personel ekleyip puantaj almaya başlayabilirsiniz.', actions: [act('Personel ekle', 'wk.new', {}, 'users')] };
      return { html: `<b>${d === U.today() ? 'Bugün' : U.fmtDate(d)}</b> sahada <b>${pr.heads} kişi</b> ${d === U.today() ? 'çalışıyor' : 'çalışmış'} (${pr.present} personel/ekip kaydı). Puantaj: ${pr.marked}/${pr.total} işaretlendi.${ab.length ? `<br>Yok/izinli: ${ab.join(', ')}.` : ''}${un.length && un.length <= 8 ? `<br><span class="wrn">İşaretlenmemiş:</span> ${un.join(', ')}.` : ''}`, links: [L('Günlük puantaj', 'workforce')], actions: un.length ? [act('Puantaj al', 'wf.today', {}, 'users')] : [] };
    },
    worker(n, r, w) {
      const mk = r && r.from ? U.monthKey(r.from) : U.monthKey(U.today()), p = C.payroll(mk).find((x) => x.w.id === w.id), adv = U.sum(SS.D.advances.filter((a) => a.workerId === w.id), (a) => a.amount);
      if (!p) return { html: 'Bu personel için hesap bulunamadı.' };
      return { html: `<b>${esc(w.name)}</b> (${esc(w.role)}${w.headcount > 1 ? ` · ${w.headcount} kişilik ekip` : ''}) — <b>${U.monthLabel(mk)}</b>${tbl(['Kalem', 'Değer'], [['Tam / Yarım / F.Mesai', `${p.counts.T} / ${p.counts.Y} / ${p.counts.FM}`], ['İzinli / Devamsız', `${p.counts.I} / ${p.counts.D}`], ['Çalışılan gün (çarpanlı)', U.num(p.days, 1)], ['Günlük yevmiye', M(w.wage)], ['Brüt hakediş', M(p.gross)], ['Bu ay avans', M(p.advance)], ['Net ödenecek', `<b>${M(p.net)}</b>`]])}<span class="sub">Toplam avans (tüm zamanlar): ${M(adv)}.</span>`, links: [L('Puantaj & maaş', 'workforce')], actions: w.phone && w.phone.length > 6 ? [act('Ara', 'ai.tel', { tel: w.phone }, 'phone')] : [] };
    },
    payroll(n, r) {
      const mk = r && r.from ? U.monthKey(r.from) : U.monthKey(U.today()), rows = C.payroll(mk);
      if (!rows.length) return { html: 'Kayıtlı personel bulunamadı.', actions: [act('Personel ekle', 'wk.new', {}, 'users')] };
      return { html: `<b>${U.monthLabel(mk)}</b> maaş/yevmiye özeti:<span class="big-n">${M(U.sum(rows, (x) => x.net))}</span>net ödenecek (brüt ${M(U.sum(rows, (x) => x.gross))} − avans ${M(U.sum(rows, (x) => x.advance))}).${tbl(['Personel', 'Net'], rows.filter((x) => x.net > 0).sort((a, b) => b.net - a.net).slice(0, 8).map((x) => [esc(x.w.name), M(x.net)]))}`, links: [L('Puantaj & maaş', 'workforce'), L('Puantaj raporu', 'reports')] };
    },
    stock(n) {
      const ms = findMats(n);
      if (!C.scope('materials').length) return { html: 'Henüz tanımlı malzemeniz yok. Malzeme ekleyip irsaliyeli giriş/çıkış yaptıkça stoklarınızı burada takip ederim.', actions: [act('Malzeme ekle', 'mat.new', {}, 'box')] };
      if (ms.length && !/kritik/.test(n)) return { html: `Stok durumu:${tbl(['Malzeme', 'Mevcut', 'Kalan süre'], ms.map((m) => { const s = C.stock(m), d = C.daysLeft(m); return [esc(m.name), `<b>${U.num(s, 1)}</b> ${m.unit}`, isFinite(d) ? (d < 1 ? '1 günden az' : `~${Math.ceil(d)} gün`) : '—']; }))}${ul(ms.map((m) => { const s = C.stock(m), d = C.daysLeft(m); return m.critical > 0 && s <= m.critical ? `<b>${esc(m.name)}</b> kritik seviyenin (${U.num(m.critical)} ${m.unit}) altında — sipariş verin.` : isFinite(d) && d <= 7 ? `${esc(m.name)} günlük ${U.num(C.usage(m), 1)} ${m.unit} tüketimle ~${Math.ceil(d)} günde biter.` : ''; }).filter(Boolean))}`, links: [L('Stok & malzeme', 'stock')], actions: [act('Malzeme girişi', 'stock.in', { mid: ms[0].id }, 'box'), act('Malzeme çıkışı', 'stock.out', { mid: ms[0].id }, 'arrowUp')] };
      const cr = C.criticalMats(), soon = C.scope('materials').filter((m) => !cr.includes(m) && C.daysLeft(m) <= 7);
      return { html: cr.length ? `<b>${cr.length} malzeme kritik seviyenin altında:</b>${tbl(['Malzeme', 'Mevcut', 'Kritik'], cr.map((m) => [esc(m.name), `${U.num(C.stock(m), 1)} ${m.unit}`, `${U.num(m.critical)} ${m.unit}`]))}${soon.length ? `7 gün içinde tükenebilecekler: ${soon.map((m) => esc(m.name)).join(', ')}.` : ''}` : `Kritik seviyenin altında malzeme yok. ${soon.length ? `7 gün içinde tükenebilecekler: ${soon.map((m) => esc(m.name)).join(', ')}.` : 'Tüm stoklar yeterli görünüyor.'}`, links: [L('Stok durumu', 'stock')], chips: cr.length ? ['Ne sipariş vermeliyim?'] : [], actions: cr.length ? [act('Siparişe dönüştür', 'ai.mkOrders', {}, 'receipt')] : [] };
    },
    reorder() {
      const list = C.scope('materials').map((m) => { const s = C.stock(m), u = C.usage(m), need = Math.max(0, Math.ceil(u * 14 + (m.critical || 0) - s)); return { m, s, u, need, d: C.daysLeft(m) }; }).filter((x) => x.need > 0 && ((x.m.critical > 0 && x.s <= x.m.critical) || x.d <= 10)).sort((a, b) => a.d - b.d);
      if (!list.length) return { html: 'Şu an acil sipariş gerektiren malzeme görünmüyor; stoklar önümüzdeki ~10 gün için yeterli.', links: [L('Stok', 'stock')] };
      return { html: `<b>Sipariş önerisi</b> (14 günlük tüketim + kritik seviye hedefiyle):${tbl(['Malzeme', 'Mevcut', 'Önerilen sipariş'], list.map((x) => [esc(x.m.name), `${U.num(x.s, 1)} ${x.m.unit}${isFinite(x.d) ? ` · ~${Math.max(0, Math.ceil(x.d))} gün` : ''}`, `<b>${U.num(x.need)} ${x.m.unit}</b>`]))}<span class="sub">Hesap son 14 günlük çıkış hızına dayanır. Talep oluşturduğunuzda Satın Alma sayfasında “Talep” durumunda görünür.</span>`, actions: [act('Talepleri oluştur', 'ai.mkOrders', {}, 'receipt')], links: [L('Satın alma', 'orders')] };
    },
    debt() {
      if (!SS.D.expenses.length && !SS.D.hakedis.length) return { html: 'Henüz kayıtlı harcama veya hakediş bulunmuyor; borç hesabı için önce harcamalarınızı girin.', actions: [act('Harcama ekle', 'exp.new', {}, 'receipt')] };
      const ex = C.expenses().filter((e) => e.status !== 'Ödendi'), od = ex.filter((e) => C.expStatus(e) === 'Gecikmiş'), by = {}; ex.forEach((e) => (by[e.firmId] = (by[e.firmId] || 0) + e.amount));
      const soon = ex.filter((e) => C.expStatus(e) === 'Vadeli' && e.dueDate <= U.addDays(U.today(), 14)), hak = SS.D.hakedis.filter((h) => h.status === 'Onaylandı' && (SS.D.contracts.find((c) => c.id === h.contractId) || {}).dir !== 'gelir' && (C.active() === 'all' || h.projectId === C.active()));
      const hb = {}; hak.forEach((h) => { const c = SS.D.contracts.find((x) => x.id === h.contractId); hb[c.firmId] = (hb[c.firmId] || 0) + h.total - (h.paidAmount || 0); }); Object.entries(hb).forEach(([k, v]) => (by[k] = (by[k] || 0) + v));
      const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6), tot = U.sum(ex, (e) => e.amount) + U.sum(Object.values(hb));
      return { html: `Toplam ödenecek borç: <span class="big-n">${M(tot)}</span>${od.length ? `<b class="neg">${od.length} ödeme gecikmiş (${M(U.sum(od, (e) => e.amount))})</b>. ` : ''}${soon.length ? `14 gün içinde vadesi gelen: ${soon.length} ödeme, ${M(U.sum(soon, (e) => e.amount))}.` : ''}
        ${top.length ? tbl(['Firma', 'Borç'], top.map(([f, v]) => [esc(ui.firmName(f)), M(v)])) : ''}<span class="sub">Vadeli harcamalar + onaylı taşeron hakediş bakiyeleri dahildir.</span>`, links: [L('Harcama & ödeme', 'expenses'), L('Hakediş', 'hakedis')], chips: ['Önümüzdeki 30 günde nakit durumu nasıl?'] };
    },
    firm(n, r, f) {
      const my = SS.D.expenses.filter((e) => e.firmId === f.id), open = my.filter((e) => e.status !== 'Ödendi'), cons = SS.D.contracts.filter((c) => c.firmId === f.id).map((c) => ({ c, s: C.contractStats(c) }));
      return { html: `<b>${esc(f.name)}</b> (${esc(f.type)})${tbl(['Kalem', 'Tutar'], [['Toplam işlem', M(U.sum(my, (e) => e.amount))], ['Ödenen', M(U.sum(my.filter((e) => e.status === 'Ödendi'), (e) => e.amount))], ['Kalan borç (harcama)', `<b>${M(U.sum(open, (e) => e.amount))}</b>`], ...cons.map(({ c, s }) => [`Hakediş bakiyesi · ${esc(c.title)}`, M(s.balance)])])}${open.filter((e) => C.expStatus(e) === 'Gecikmiş').length ? `<b class="neg">${open.filter((e) => C.expStatus(e) === 'Gecikmiş').length} ödemesi gecikmiş.</b>` : ''}`, links: [L('Firmalar & cari', 'expenses')], actions: [...(f.phone && f.phone.length > 6 ? [act('Ara', 'ai.tel', { tel: f.phone }, 'phone')] : []), act('Cari ekstre (PDF)', 'firm.statement', { id: f.id }, 'printer')] };
    },
    recv() {
      const t = U.today(), all = C.installments().filter((p) => !p.paid), od = all.filter((p) => p.due < t), nx = all.filter((p) => p.due >= t && p.due <= U.addDays(t, 30)), tot = C.totals();
      if (!SS.D.units.length && !SS.D.hakedis.length) return { html: 'Satış birimi veya işveren hakedişi tanımlı değil; alacak takibi için Satış & Tahsilat modülünü kullanabilirsiniz.', links: [L('Satış & tahsilat', 'sales')] };
      return { html: `Toplam tahsil edilecek alacak: <span class="big-n">${M(tot.receivable)}</span>Geciken taksit: <b class="${od.length ? 'neg' : ''}">${od.length} adet, ${M(U.sum(od, (p) => p.amount))}</b> · önümüzdeki 30 gün: ${nx.length} taksit, ${M(U.sum(nx, (p) => p.amount))}.
        ${od.length ? tbl(['Müşteri', 'Daire · vade', 'Tutar'], od.sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6).map((p) => [esc((p.customer || {}).name || '—'), `${p.unit.no} · ${U.fmtDate(p.due)}`, M(p.amount)])) : ''}${tot.hakAl ? `<span class="sub">İşveren hakediş alacağı: ${M(tot.hakAl)}</span>` : ''}`, links: [L('Tahsilat takvimi', 'sales')] };
    },
    sales() {
      const us = C.unitStats(); if (!us.total) return { html: 'Seçili şantiyede satış birimi tanımlı değil.', links: [L('Satış', 'sales')] };
      return { html: `<b>${us.sold}</b> daire satıldı (%${U.num((us.sold / us.total) * 100)}), <b>${us.reserved}</b> rezerve, <b>${us.free}</b> müsait — toplam ${us.total} daire.<br>Satış cirosu <b>${M(us.revenue)}</b>; tahsil edilen ${M(us.collected)}, kalan ${M(us.receivable)}.`, links: [L('Daire matrisi', 'sales')] };
    },
    progress() {
      const ps = C.projects().filter((p) => p.status === 'active'); if (!ps.length) return { html: 'Seçili kapsamda aktif şantiye yok.', links: [L('Projeler', 'projects')] };
      return { html: ps.map((p) => { const pg = C.progress(p), pl = C.planned(p), el = Math.max(1, U.diff(p.start, U.today())), rate = pg / el, fin = rate > 0 ? U.addDays(U.today(), Math.ceil((100 - pg) / rate)) : null, dev = fin ? U.diff(p.end, fin) : 0; return `<b>${esc(p.shortName)}</b>: fiziksel ilerleme <b>%${U.num(pg, 1)}</b> (planlanan %${U.num(pl)}) — ${pg - pl >= -2 ? 'takvimle uyumlu' : `<b class="neg">%${U.num(pl - pg)} geride</b>`}.${fin ? `<br><span class="sub">Bu hızla tahmini bitiş ${U.fmtDate(fin)} (planlanan ${U.fmtDate(p.end)}${dev > 3 ? `, ${dev} gün gecikme` : dev < -3 ? `, ${-dev} gün erken` : ''}).</span>` : ''}`; }).join('<br><br>'), links: [L('Proje detayı', 'projects')], chips: ['Bütçeyi aşar mıyız?'] };
    },
    forecast() {
      const ps = C.projects().filter((p) => p.status === 'active' && p.totalBudget); if (!ps.length) return { html: 'Bütçe tahmini için bütçesi tanımlı aktif bir şantiye gerekir.', links: [L('Projeler', 'projects')] };
      return { html: '<b>Bütçe projeksiyonu</b> (EAC ≈ harcanan ÷ fiziksel ilerleme):' + ps.map((p) => { const f = C.forecast(p); if (!f) return `<br><br><b>${esc(p.shortName)}</b>: ilerleme çok düşük (%${U.num(C.progress(p), 1)}); sağlıklı tahmin için biraz veri bekleyin.`; return `<br><br><b>${esc(p.shortName)}</b>: bütçe ${M(p.totalBudget)}, harcanan ${M(f.spent)} (%${U.num(f.spent / p.totalBudget * 100)}), ilerleme %${U.num(f.prog, 1)}.<br>Tahmini bitiş maliyeti: <b>${M(f.eac)}</b> — ${f.over > 0 ? `<b class="neg">${M(f.over)} (%${U.num(f.pct)}) bütçe aşımı riski</b>` : `<b class="pos">bütçe içinde (${M(-f.over)} marj)</b>`}.`; }).join('') + '<br><span class="sub">Harcama hızının bugünkü gibi süreceği varsayımına dayanan kaba bir tahmindir.</span>', links: [L('Projeler', 'projects')] };
    },
    profit(n, r) {
      r = r || { from: U.monthStart(U.monthKey(U.today())), to: U.today(), label: 'bu ay' }; const a = C.active();
      const out = U.sum(SS.D.expenses.filter((e) => e.status === 'Ödendi' && (a === 'all' || e.projectId === a) && C.inRange(C.cashDate(e), r.from, r.to)), (e) => e.amount);
      const inn = U.sum(SS.D.units.filter((u) => a === 'all' || u.projectId === a), (u) => U.sum((u.plan || []).filter((p) => p.paid && C.inRange(p.paidDate || p.due, r.from, r.to)), (p) => p.amount)) + U.sum(SS.D.hakedis.filter((h) => (a === 'all' || h.projectId === a) && (SS.D.contracts.find((c) => c.id === h.contractId) || {}).dir === 'gelir'), (h) => U.sum((h.payments || []).filter((p) => C.inRange(p.date, r.from, r.to)), (p) => p.amount));
      return { html: `<b>${r.label}</b> nakit durumu:${tbl(['Kalem', 'Tutar'], [['Tahsilat (satış + hakediş)', `<b class="pos">${M(inn)}</b>`], ['Ödeme (gider)', M(out)], ['Net nakit', `<b class="${inn - out >= 0 ? 'pos' : 'neg'}">${M(inn - out)}</b>`]])}<span class="sub">Yalnızca fiilen ödenen/tahsil edilen tutarlar; tahakkuk eden ve bekleyen kalemler dahil değildir.</span>`, links: [L('Nakit akışı', 'dashboard')], chips: ['Önümüzdeki 30 günde nakit durumu nasıl?'] };
    },
    cashfc() {
      const t = U.today(), to = U.addDays(t, 30), inst = C.installments().filter((p) => !p.paid && p.due <= to), ex = C.expenses().filter((e) => e.status !== 'Ödendi' && e.dueDate && e.dueDate <= to);
      const inn = U.sum(inst, (p) => p.amount), out = U.sum(ex, (e) => e.amount), net = inn - out, odI = inst.filter((p) => p.due < t), odE = ex.filter((e) => e.dueDate < t);
      return { html: `<b>Önümüzdeki 30 gün</b> nakit projeksiyonu:${tbl(['Kalem', 'Tutar'], [['Beklenen tahsilat (taksit)', `<span class="pos">${M(inn)}</span>`], ['Ödenecek (vadesi gelenler)', M(out)], ['Net', `<b class="${net >= 0 ? 'pos' : 'neg'}">${M(net)}</b>`]])}${odE.length ? `<span class="wrn">Bunun ${M(U.sum(odE, (e) => e.amount))} tutarı şimdiden gecikmiş.</span> ` : ''}${odI.length ? `Geciken tahsilat: ${M(U.sum(odI, (p) => p.amount))}.` : ''}<br><span class="sub">Vadesi bu aralıkta olan, ödenmemiş harcama ve taksitlerle hesaplanır; yeni harcamalar ve hakediş ödemeleri dahil değildir.</span>`, links: [L('Harcamalar', 'expenses'), L('Tahsilat', 'sales')] };
    },
    expense(n, r) {
      r = r || { from: U.monthStart(U.monthKey(U.today())), to: U.today(), label: 'bu ay' }; const cat = findCat(n);
      const rows = C.expenses({ from: r.from, to: r.to, cat }), tot = U.sum(rows, (e) => e.amount), len = U.diff(r.from, r.to) + 1, prev = U.sum(C.expenses({ from: U.addDays(r.from, -len), to: U.addDays(r.from, -1), cat }), (e) => e.amount);
      if (!SS.D.expenses.length) return { html: 'Henüz harcama kaydı yok. İlk harcamanızı girdiğinizde kategori, firma ve dönem bazında analiz edebilirim.', actions: [act('Harcama ekle', 'exp.new', {}, 'receipt')] };
      const byC = {}; rows.forEach((e) => (byC[e.category] = (byC[e.category] || 0) + e.amount)); const byF = {}; rows.forEach((e) => (byF[e.firmId] = (byF[e.firmId] || 0) + e.amount));
      let extra = ''; if (cat && C.projects().length === 1) { const p = C.projects()[0], al = C.monthlyAllowance(p, cat); if (al && r.label === 'bu ay') extra = `<br>Aylık bütçe payı ${M(al)} — ${tot > al ? `<b class="neg">%${U.num((tot / al - 1) * 100)} aşıldı</b>` : `%${U.num((tot / al) * 100)} kullanıldı`}.`; }
      const big = rows.slice().sort((a, b) => b.amount - a.amount)[0];
      return { html: `<b>${r.label}</b>${cat ? ' · ' + cat : ''} toplam gider:<span class="big-n">${M(tot)}</span>${rows.length} kayıt${prev ? ` · önceki dönem ${M(prev)} (${delta(tot, prev)})` : ''}.${extra}${big ? `<br><span class="sub">En büyük kalem: ${esc(big.desc)} — ${M(big.amount)}.</span>` : ''}
        ${!cat && Object.keys(byC).length ? tbl(['Kategori', 'Tutar'], Object.entries(byC).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => [k, M(v)])) : Object.keys(byF).length ? tbl(['Firma', 'Tutar'], Object.entries(byF).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => [esc(ui.firmName(k)), M(v)])) : ''}`, links: [L('Harcamalar', 'expenses'), L('Harcama dökümü (PDF/Excel)', 'reports')], chips: ['Geçen ay ne kadar harcadık?', 'Bu ay en çok hangi firmaya ödeme yaptık?'] };
    },
    contracts() {
      const l = C.scope('contracts').filter((c) => c.status === 'Aktif' && c.end).map((c) => ({ c, d: C.contractDays(c) })).sort((a, b) => a.d - b.d).slice(0, 6);
      return { html: l.length ? `Süresi en yakın sözleşmeler:${tbl(['Sözleşme', 'Bitiş', 'Kalan'], l.map(({ c, d }) => [esc(c.title), U.fmtDate(c.end), `<b class="${d <= 7 ? 'neg' : d <= 30 ? 'wrn' : ''}">${d < 0 ? -d + ' gün geçti' : d + ' gün'}</b>`]))}` : 'Aktif sözleşme bulunmuyor.', links: [L('Sözleşme kasası', 'contracts')] };
    },
    machines(n, r) {
      const ms = C.scope('machines'); if (!ms.length) return { html: 'Henüz makine kaydı yok.', actions: [act('Makine ekle', 'mach.new', {}, 'truck')] };
      const due = ms.filter(C.machineDue), from = r ? r.from : U.addDays(U.today(), -29), fuel = U.sum(SS.D.machineLogs.filter((l) => ms.some((m) => m.id === l.machineId) && l.date >= from), (l) => l.fuel);
      return { html: `${ms.length} makineden ${ms.filter((m) => m.status === 'Çalışıyor').length} tanesi çalışıyor. ${r ? r.label : 'Son 30 gün'} yakıt tüketimi <b>${U.num(fuel)} lt</b> (≈ ${M(fuel * SS.cfg.fuelPrice)}).${due.length ? `<br><b class="wrn">Bakım zamanı yaklaşan:</b> ${due.map((m) => `${esc(m.name)} (${C.machineRemain(m) <= 0 ? 'gecikti' : U.num(C.machineRemain(m)) + ' sa kaldı'})`).join(', ')}.` : '<br>Yaklaşan bakım yok.'}`, links: [L('Makine parkı', 'machines')] };
    },
    safety() {
      const l = C.scope('safety').sort((a, b) => b.date.localeCompare(a.date)), op = C.scope('punch').filter((p) => p.status !== 'Çözüldü'), by = {}; op.forEach((p) => (by[p.priority] = (by[p.priority] || 0) + 1));
      return { html: `${l[0] ? `Son İSG kontrol skoru <b>%${l[0].score}</b> (${U.fmtDate(l[0].date)}); son ${Math.min(14, l.length)} kontrol ortalaması %${U.num(U.sum(l.slice(0, 14), (x) => x.score) / Math.min(14, l.length))}.` : 'Henüz İSG kontrolü yapılmamış.'}<br><b>${op.length}</b> açık eksik/kusur kartı var${op.length ? ': ' + ['Kritik', 'Yüksek', 'Orta', 'Düşük'].filter((k) => by[k]).map((k) => `${by[k]} ${k.toLowerCase()}`).join(', ') : ''}.${op.filter((p) => p.priority === 'Kritik').map((p) => `<br>• <b>${esc(p.title)}</b> — ${esc(p.assignee || '—')}`).join('')}`, links: [L('İSG & kalite', 'safety'), L('İSG levhaları', 'guide')], actions: l[0] && l[0].date === U.today() ? [] : [act('İSG kontrolü yap', 'safety.check', {}, 'shield')] };
    },
    weather(n, r) {
      r = r || { from: U.addDays(U.today(), -29), to: U.today(), label: 'son 30 gün' }; const l = C.scope('diary').filter((d) => C.inRange(d.date, r.from, r.to)), st = l.filter((d) => d.stopped);
      if (!l.length) return { html: `<b>${r.label}</b> için şantiye defteri kaydı yok.`, actions: [act('Defter yaz', 'diary.new', {}, 'book')] };
      return { html: `<b>${r.label}</b>: ${l.length} defter kaydında <b>${st.length} gün</b> iş durmuş (toplam ${U.sum(st, (d) => d.stopHours)} saat). Yağmurlu gün sayısı ${l.filter((d) => d.weather === 'Yağmurlu').length}.${st.length ? tbl(['Tarih', 'Süre', 'Neden'], st.slice(0, 5).map((d) => [U.fmtDate(d.date), d.stopHours + ' sa', esc(d.stopReason || d.weather)])) : ''}`, links: [L('Şantiye defteri', 'diary')] };
    },
    diary(n) {
      const l = C.scope('diary').sort((a, b) => b.date.localeCompare(a.date)), d = /dun/.test(n) ? l.find((x) => x.date === U.addDays(U.today(), -1)) : l[0];
      return { html: d ? `<b>${U.fmtDate(d.date)}</b> defteri — ${d.weather}, ${d.workers} kişi çalışmış:<br>${esc(d.work)}${d.stopped ? `<br><span class="wrn">İş durması: ${d.stopHours} saat — ${esc(d.stopReason)}</span>` : ''}` : 'Defter kaydı bulunamadı.', links: [L('Şantiye defteri', 'diary')], actions: d && d.date === U.today() ? [] : [act('Defter yaz', 'diary.new', {}, 'book')] };
    },
    concrete() {
      const rows = C.scope('concrete'); if (!rows.length) return { html: 'Henüz beton döküm kaydı yok. Döküm girdikçe 7 ve 28 günlük numune kırım tarihlerini otomatik takip eder, yaklaşınca uyarırım.', actions: [act('Beton dökümü ekle', 'concrete.new', {}, 'layers')], links: [L('Beton & numune', 'concrete')] };
      const pend = []; rows.forEach((c) => C.concreteTests(c).filter((t) => !t.done).forEach((t) => pend.push({ c, t })));
      pend.sort((a, b) => a.t.due.localeCompare(b.t.due));
      const bad = rows.filter((c) => C.concreteVerdict(c) === 'bad');
      return { html: `<b>${U.num(U.sum(rows, (c) => c.qty), 1)} m³</b> beton dökümü kayıtlı (${rows.length} döküm).${pend.length ? `<br><b>${pend.length} kırım bekliyor:</b>${tbl(['Döküm', 'Kırım', 'Tarih'], pend.slice(0, 6).map(({ c, t }) => [esc(c.element), `${t.day}. gün`, `<b class="${t.due < U.today() ? 'neg' : t.due <= U.addDays(U.today(), 3) ? 'wrn' : ''}">${U.fmtDate(t.due)}${t.due < U.today() ? ' (gecikti)' : ''}</b>`]))}` : '<br>Bekleyen numune kırımı yok.'}${bad.length ? `<br><b class="neg">${bad.length} dökümün sonucu uygunluk kriterinin altında:</b> ${bad.map((c) => esc(c.element)).join(', ')}.` : ''}`, links: [L('Beton & numune', 'concrete')], actions: [act('Beton dökümü ekle', 'concrete.new', {}, 'layers')] };
    },
    orders() {
      const rows = C.scope('orders').filter((o) => !['Teslim', 'İptal'].includes(o.status)); if (!C.scope('orders').length) return { html: 'Henüz talep/sipariş kaydı yok. Eksik malzemeler için talep açıp teslimatı takip edebilirsiniz.', actions: [act('Talep oluştur', 'order.new', {}, 'receipt')], links: [L('Satın alma', 'orders')] };
      const late = rows.filter((o) => o.needBy && o.needBy < U.today());
      return { html: `<b>${rows.length} açık talep/sipariş</b>${late.length ? ` — <b class="neg">${late.length} tanesi ihtiyaç tarihini geçti</b>` : ''}.${rows.length ? tbl(['Kalem', 'Durum', 'İhtiyaç'], rows.sort((a, b) => (a.needBy || 'z').localeCompare(b.needBy || 'z')).slice(0, 7).map((o) => [esc(o.item), o.status, o.needBy ? U.fmtDate(o.needBy) : '—'])) : ''}`, links: [L('Satın alma', 'orders')], actions: [act('Talep oluştur', 'order.new', {}, 'receipt')] };
    },
    todo() {
      const rows = openTodos(), late = rows.filter((t) => t.due && t.due < U.today()), tod = rows.filter((t) => t.due === U.today());
      if (!SS.D.todos.length) return { html: 'Henüz görev eklemediniz. Bana “yarın için görev ekle: iskele kontrolü” gibi yazarak da ekleyebilirsiniz.', actions: [act('Görev ekle', 'todo.new', {}, 'plus')], links: [L('Görevler', 'todos')] };
      return { html: `<b>${rows.length} açık görev</b>${late.length ? ` — <b class="neg">${late.length} gecikmiş</b>` : ''}${tod.length ? `, bugün ${tod.length} görev` : ''}.${rows.length ? tbl(['Görev', 'Tarih'], rows.slice(0, 8).map((t) => [esc(t.title), t.due ? `<span class="${t.due < U.today() ? 'neg' : ''}">${U.fmtDate(t.due)}</span>` : '—'])) : ''}`, links: [L('Görevler', 'todos')], actions: [act('Görev ekle', 'todo.new', {}, 'plus')] };
    },
    todoadd(raw) {
      const m = String(raw).match(/[:：]\s*(.+)$/), DROP = ['yarın', 'bugün', 'haftaya', 'bana', 'için', 'görev', 'görevi', 'hatırlatma', 'not', 'ekle', 'oluştur', 'yaz', 'al', 'hatırlat', 'günü', 'lütfen', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
      let t = m ? m[1].trim() : String(raw).split(/\s+/).filter((w) => !DROP.includes(w.toLocaleLowerCase('tr'))).join(' ').trim();
      t = t.replace(/\s*hatırlat\s*$/i, '').trim();
      if (!t || t.length < 3) return { html: 'Hangi görevi ekleyeyim? Örn: <i>“yarın için görev ekle: B blok iskele kontrolü”</i>.' };
      const due = parseDate(N(raw)); t = t.charAt(0).toLocaleUpperCase('tr') + t.slice(1);
      return { html: `Şu görevi ekleyeyim mi?<br><b>${esc(t)}</b>${due ? `<br><span class="sub">Tarih: ${U.fmtDateLong(due)}</span>` : '<br><span class="sub">Tarih belirtilmedi.</span>'}`, actions: [{ label: 'Görevi ekle', action: 'ai.addTodo', data: { title: t, due: due || '' }, icon: 'check' }], links: [L('Görevler', 'todos')] };
    },
    cmd(n) {
      const map = [[/harcama|gider|odeme/, 'Harcama ekle', 'exp.new', 'receipt'], [/stok giris|malzeme giris|irsaliye/, 'Malzeme girişi', 'stock.in', 'box'], [/stok cikis|malzeme cikis/, 'Malzeme çıkışı', 'stock.out', 'arrowUp'], [/puantaj/, 'Puantaj al', 'wf.today', 'users'], [/defter/, 'Defter yaz', 'diary.new', 'book'], [/isg|kontrol/, 'İSG kontrolü', 'safety.check', 'shield'], [/kusur|eksik/, 'Eksik / kusur ekle', 'punch.new', 'flag'], [/makine/, 'Makine kaydı', 'mach.log', 'truck'], [/siparis|talep/, 'Talep oluştur', 'order.new', 'receipt'], [/numune|beton/, 'Beton dökümü ekle', 'concrete.new', 'layers']];
      const m = map.filter(([re]) => re.test(n)); const use = m.length ? m : map.slice(0, 4);
      return { html: m.length ? 'Tamamdır, formu açabilirim:' : 'Hangisini yapmak istersiniz?', actions: use.map(([, l, a, i]) => act(l, a, {}, i)) };
    },
    summary() {
      const t = C.totals(), ps = C.projects().filter((p) => p.status === 'active'), al = C.alerts().filter((a) => a.level !== 'info'), ins = C.insights().filter((i) => i.level === 'bad' || i.level === 'warn').slice(0, 3), mk = U.monthKey(U.today());
      return { html: `<b>Genel durum özeti</b>${tbl(['Gösterge', 'Değer'], [['Aktif şantiye / ort. ilerleme', `${ps.length} · %${U.num(C.avgProgress(), 1)}`], ['Bu ay gider', M(U.sum(C.expenses({ from: U.monthStart(mk), to: U.today() }), (e) => e.amount))], ['Ödenecek borç', M(t.payable + t.hakBorc)], ['Tahsil edilecek', M(t.receivable)], ['Kritik stok', `${C.criticalMats().length} kalem`], ['Bugün sahada', `${C.presentToday().heads} kişi`], ['Açık uyarı', `${al.length}`]])}${ins.length ? '<b>Dikkat edilmesi gerekenler:</b><ul>' + ins.map((i) => `<li>${esc(i.title)}</li>`).join('') + '</ul>' : 'Kritik bir uyarı görünmüyor.'}`, links: [L('Ana panel', 'dashboard')], chips: ['Bugün ne yapmalıyım?', 'Bütçeyi aşar mıyız?'] };
    },
    calc(res) {
      const d = T.defs[res.id], r = T.run(res.id, res.vals);
      return { html: `<b>${esc(d.title)}</b> hesabı<br><span class="sub">Kullanılan değerler: ${res.used.join(' · ')}${res.assumed.length ? `<br>Varsayılan: ${res.assumed.join(' · ')}` : ''}</span><span class="big-n">${esc(r.main[1])}</span><span class="sub">${esc(r.main[0])}</span>${tbl(['Kalem', 'Değer'], r.rows.map(([a, b]) => [esc(a), esc(b)]))}`, actions: [{ label: 'Hesaplayıcıda aç', action: 'calc.open', data: { id: res.id, preset: JSON.stringify(res.vals) }, icon: 'ruler' }], links: [L('Tüm hesaplayıcılar', 'guide')] };
    },
    wx(n) {
      const X = SS.wx, t = X && X.target();
      if (!X || !t) return { html: 'Hava durumu için önce şantiyenizi ekleyip konumunu girmeniz gerekiyor.', actions: [act('İlk şantiyemi ekle', 'proj.new', {}, 'building')] };
      if (t.missing) return { html: `<b>${esc(t.p ? t.p.shortName || t.p.name : 'Şantiye')}</b> için konum girilmemiş; hava durumunu alabilmem için bir yer adı (ör. Serdivan, Sakarya) gerekiyor.`, actions: [act('Konum ekle', 'wx.city', {}, 'pin')] };
      const c = X.cache(t.key);
      if (!c) { if (SS.cfg.wxOn) X.auto(); return { html: SS.cfg.wxOn ? 'Hava durumunu şimdi alıyorum; birkaç saniye sonra aynı soruyu tekrar sorun.' : `Hava durumu henüz etkin değil. Etkinleştirirseniz yalnızca şantiyenin yer adı (<b>${esc(t.q)}</b>) açık hava servisine (Open-Meteo) gönderilir.`, actions: [act(SS.cfg.wxOn ? 'Yeniden dene' : 'Hava durumunu getir', 'wx.enable', {}, 'sun')] }; }
      if (SS.cfg.wxOn) X.auto();
      const days = X.days(c); if (!days.length) return { html: 'Kayıtlı hava verisi eskimiş; internet bağlantısı olduğunda yenileyin.', actions: [act('Yenile', 'wx.refresh', {}, 'refresh')] };
      const where = esc(c.geo.name), age = `<span class="sub">Son güncelleme ${new Date(c.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · ${where}</span>`;
      if (/hafta|onumuzdeki|7 gun|gelecek gun|haftalik/.test(n)) {
        const risky = days.filter((d) => X.suit(d).some((x) => x.level === 'bad'));
        return { html: `<b>7 günlük saha tahmini</b>${tbl(['Gün', 'Hava', 'Min / Maks', 'Yağış'], days.map((d, i) => { const ds = X.desc(d.code); return [i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : U.fmtDateShort(d.date), ds[0], `${Math.round(d.tmin)}° / ${Math.round(d.tmax)}°`, d.rain >= 0.5 ? `${U.num(d.rain, 1)} mm` : '—']; }))}${risky.length ? `<span class="wrn">Riskli günler:</span> ${risky.map((d) => `${U.fmtDateShort(d.date)} (${X.suit(d).filter((x) => x.level === 'bad').map((x) => x.t.toLowerCase()).join(', ')} uygun değil)`).join('; ')}.` : 'Önümüzdeki günlerde engelleyici bir hava riski görünmüyor.'}<br>${age}`, links: [L('Ana panel', 'dashboard')], chips: ['Yarın beton dökülür mü?', 'Yarın hava nasıl?'] };
      }
      const idx = /obur gun|ertesi/.test(n) ? 2 : /yarin/.test(n) ? 1 : 0, d = days[Math.min(idx, days.length - 1)], ds = X.desc(d.code), suit = X.suit(d), lab = d.date === U.today() ? 'Bugün' : d.date === U.addDays(U.today(), 1) ? 'Yarın' : U.fmtDateLong(d.date);
      const FOC = [[/beton/, 'beton'], [/vinc|kaldirma/, 'vinc'], [/iskele|yuksek/, 'yuksek'], [/siva|boya|cephe/, 'cephe'], [/hafriyat|kazi/, 'hafriyat']], foc = (FOC.find(([re]) => re.test(n)) || [])[1];
      const badge = (x) => `<span class="badge ${({ ok: 'ok', warn: 'warn', bad: 'bad' })[x.level]}">${X.levelLabel(x.level)}</span>`;
      const head = `<b>${lab}</b> · ${esc(ds[0])}: <b>${Math.round(d.tmin)}° / ${Math.round(d.tmax)}°C</b>, rüzgâr ${Math.round(d.wind)} km/s${d.gust ? ` (hamle ${Math.round(d.gust)})` : ''}, yağış ${d.rain >= 0.1 ? U.num(d.rain, 1) + ' mm' : 'yok'}${d.pop ? ` (ihtimal %${Math.round(d.pop)})` : ''}.`;
      const one = foc && suit.find((x) => x.k === foc);
      return { html: `${head}<br>${one ? `<b>${esc(one.t)}:</b> ${badge(one)} ${esc(one.why)}.<br><br><span class="sub">Diğer işler:</span>` : '<br><b>İş uygunluğu:</b>'}${ul(suit.filter((x) => x !== one).map((x) => `${esc(x.t)}: ${badge(x)} <span class="sub">${esc(x.why)}</span>`))}<span class="sub">Genel kılavuzdur; üretici talimatı, şartname ve İSG uzmanı esastır.</span><br>${age}`, links: [L('Ana panel', 'dashboard')], chips: ['Bu hafta hava nasıl?', idx === 0 ? 'Yarın hava nasıl?' : 'Bugün hava nasıl?'] };
    },
    rebarRev(n) {
      const w = n.match(/(\d+(?:[.,]\d+)*)\s*(ton|kg)\b/), dm = n.match(/\b(8|10|12|14|16|18|20|22|25|28|32)\s*(?:mm|lik|luk|li|lu)?\s*(?:nervurlu\s*)?(?:demir|donati|cubuk)|(?:demir|donati)\w*\s*(\d{1,2})\s*mm|cap\s*(\d{1,2})/), d = dm ? +(dm[1] || dm[2] || dm[3]) : 0;
      if (!w || !T.REBAR.includes(d)) return null;
      const kg = num(w[1]) * (w[2] === 'ton' ? 1000 : 1), m = kg / T.kgm(d);
      return { html: `<b>Ø${d}</b> nervürlü donatıdan <b>${U.num(kg)} kg</b> yaklaşık:<span class="big-n">${U.num(m)} metre</span>${tbl(['Kalem', 'Değer'], [['Birim ağırlık', `${U.num(T.kgm(d), 3)} kg/m`], ['12 m\'lik çubuk', `≈ ${Math.ceil(m / 12)} adet`], ['Çubuk başına ağırlık', `${U.num(T.kgm(d) * 12, 1)} kg`]])}`, links: [L('Donatı tabloları', 'guide')] };
    },
    kb(list) {
      const e = list[0]; return { html: `<b>${esc(e.t)}</b><br>${e.a}${list.length > 1 ? `<br><br><span class="sub">İlgili diğer başlıklar:</span>${ul(list.slice(1, 4).map((x) => esc(x.t)))}` : ''}`, links: [L('Tüm bilgi bankası', 'guide')], chips: list.slice(1, 3).map((x) => x.t) };
    },
    entity(n) {
      const f = findFirm(n), w = findWorker(n), ms = findMats(n); if (f) return A.firm(n, null, f); if (w) return A.worker(n, parseRange(n), w); if (ms.length) return A.stock(n); return null;
    },
    unknown(q, n) {
      const words = n.split(' ').filter((w) => w.length > 2);
      const sug = TOPICS.flatMap((t) => t.q).map((s) => ({ s, k: words.filter((w) => N(s).includes(w.slice(0, Math.max(3, w.length - 2)))).length })).filter((x) => x.k > 0).sort((a, b) => b.k - a.k).slice(0, 4).map((x) => x.s);
      const pick = sug.length ? sug : ['Bugün ne yapmalıyım?', 'Genel durum özeti ver', 'Kime ne kadar borcumuz var?', 'Kritik stoklar hangileri?'];
      return { html: `Bunu tam anlayamadım. ${sug.length ? 'Şunu mu demek istediniz?' : 'Şunlardan birini deneyebilirsiniz:'}${ul(pick.map((s) => esc(s)))}Dilerseniz “Neler sorabilirim?” düğmesine de bakabilirsiniz.`, chips: pick };
    },
  };

  /* ---------- hesap sorularını metinden çöz ---------- */
  function calcFromText(raw) {
    const n = N(raw), ns = nums(n), g = (re) => { const m = n.match(re); return m ? num(m[1]) : null; };
    const dimM = n.match(/(\d+(?:[.,]\d+)*)\s*(?:m\b|metre|mt)?\s*[x*×]\s*(\d+(?:[.,]\d+)*)(?:\s*(?:m\b|metre|mt)?\s*[x*×]\s*(\d+(?:[.,]\d+)*))?/);
    const area = g(/(\d+(?:[.,]\d+)*)\s*(?:m2|m²|metrekare|metre kare)/), vol = g(/(\d+(?:[.,]\d+)*)\s*(?:m3|m³|metrekup|metre kup)/), cm = g(/(\d+(?:[.,]\d+)*)\s*(?:cm|santim)/), len = g(/(\d+(?:[.,]\d+)*)\s*(?:m\b|metre|mt\b)/), cnt = g(/(\d+)\s*adet/);
    const ask = /kac|ne kadar|hesapla|lazim|gerek|ihtiyac/.test(n);
    const r = (id, vals, used, assumed = []) => ({ id, vals, used, assumed });
    if (/kdv/.test(n) && ns.length && /\d/.test(n)) { const oran = g(/%\s*(\d+)|yuzde\s*(\d+)|kdv\s*(?:orani)?\s*(\d{1,2})\b/) || 20; return r('kdv', { tutar: money(n.replace(/%\s*\d+|kdv|yuzde\s*\d+/g, '')) || ns[0], oran: String([1, 10, 20].includes(oran) ? oran : 20), yon: /dahil/.test(n) ? 'dahil' : 'hariç' }, [`tutar ${U.num(money(n.replace(/%\s*\d+|kdv|yuzde\s*\d+/g, '')) || ns[0])} ₺`, `KDV %${[1, 10, 20].includes(oran) ? oran : 20}`, /dahil/.test(n) ? 'tutar KDV dahil' : 'tutar KDV hariç']); }
    if (/demir|donati|nervurlu|cubuk/.test(n) && (ask || /kg|ton|agirlik/.test(n))) {
      const dm = n.match(/(?:fi\b|cap\s*)\s*(\d{1,2})|\b(8|10|12|14|16|18|20|22|25|28|32)\s*(?:mm|lik|luk|li|lu)?\s*(?:nervurlu\s*)?(?:demir|donati|cubuk)|(?:demir|donati)\w*\s*(\d{1,2})\s*mm/), d = dm ? +(dm[1] || dm[2] || dm[3]) : null;
      if (d && T.REBAR.includes(d)) { const L2 = len || null, nn = cnt || 1; if (L2) return r('demir', { d: String(d), L: L2, n: nn }, [`Ø${d}`, `${U.num(L2)} m`, `${nn} adet`], ['fire %5']); }
    }
    const dep = g(/(\d+(?:[.,]\d+)*)\s*(?:m\b|metre|mt)?\s*derin/);
    if (/hafriyat|kazi|kamyon|sefer/.test(n) && (dimM || vol)) { if (dimM && !dimM[3] && dep) return r('hafriyat', { L: num(dimM[1]), W: num(dimM[2]), d: dep }, [`${dimM[1]}×${dimM[2]} m`, `derinlik ${dep} m`], ['normal toprak (%25 kabarma)', '15 m³ kamyon']); if (dimM && dimM[3]) return r('hafriyat', { L: num(dimM[1]), W: num(dimM[2]), d: num(dimM[3]) }, [`${dimM[1]}×${dimM[2]} m`, `derinlik ${dimM[3]} m`], ['normal toprak (%25 kabarma)', '15 m³ kamyon']); if (vol) return r('hafriyat', { L: vol, W: 1, d: 1 }, [`${U.num(vol)} m³ kazı`], ['normal toprak (%25 kabarma)', '15 m³ kamyon']); }
    if (/boya|astar|badana/.test(n) && area) { const kat = g(/(\d+)\s*kat/) || (/iki kat/.test(n) ? 2 : /uc kat/.test(n) ? 3 : 2); return r('boya', { A: area, kat }, [`${U.num(area)} m²`, `${kat} kat`], ['verim 9 m²/L']); }
    if (/seramik|fayans|porselen|kaplama/.test(n) && area) return r('seramik', { A: area }, [`${U.num(area)} m²`], ['60×60 cm', 'fire %10']);
    if (/tugla|briket|gazbeton|bims|duvar/.test(n) && (area || dimM)) { const A = area || num(dimM[1]) * num(dimM[2]); const tip = /gaz/.test(n) ? 'g135' : /bims|briket/.test(n) ? 'b' : /\b8 5\b|8\.5/.test(n) ? 't85' : /\b19\s*(?:luk|lik|cm)/.test(n) ? 't19' : 't135'; return r('duvar', { L: A / 2.7, H: 2.7, bos: 0, tip }, [`${U.num(A)} m² duvar`], ['boşluk düşülmedi', 'derz 1 cm', 'fire %5']); }
    if (/siva|sap\b|harc/.test(n) && area) return r('siva', { A: area, t: cm || (/sap/.test(n) ? 5 : 2) }, [`${U.num(area)} m²`, `${cm || (/sap/.test(n) ? 5 : 2)} cm`], ['350 kg/m³ dozaj', 'fire %10']);
    if (/kolon|perde/.test(n) && /beton/.test(n) && dimM) { const h = len || 2.8; return r('kolon', { a: num(dimM[1]), b: num(dimM[2]), h, n: cnt || 1 }, [`${dimM[1]}×${dimM[2]} cm`, `h=${h} m`, `${cnt || 1} adet`]); }
    if (/kiris/.test(n) && /beton/.test(n) && dimM && len) return r('kiris', { b: num(dimM[1]), h: num(dimM[2]), L: len }, [`${dimM[1]}×${dimM[2]} cm`, `${len} m`], ['döşeme kalınlığı 15 cm düşüldü']);
    if (/beton|dosem|radye|temel|plak/.test(n) && dimM && (cm || ask)) { const t = cm || 20; return r('plak', { L: num(dimM[1]), W: num(dimM[2]), t, n: cnt || 1 }, [`${dimM[1]}×${dimM[2]} m`, `${t} cm kalınlık`], cm ? [] : ['kalınlık 20 cm varsayıldı']); }
    if (/egim/.test(n) && cm && len) return r('egim', { dh: cm, L: len }, [`${U.num(cm)} cm fark`, `${U.num(len)} m`]);
    return null;
  }

  const openTodos = () => SS.D.todos.filter((t) => t.status !== 'Bitti').sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));

  /* ---------- niyet puanlama ---------- */
  const W = (n, list) => list.reduce((t, [re, w]) => t + (re.test(n) ? w : 0), 0);
  const D = true; // veri gerektirir
  const INTENTS = [
    { id: 'greet', s: (n) => (/^(merhaba|selam|gunaydin|iyi gunler|iyi aksamlar|iyi calismalar|hey|slm|mrb|naber)\b/.test(n) && n.split(' ').length < 5 ? 30 : 0), run: () => A.greet() },
    { id: 'thanks', s: (n) => (/tesekkur|sag ol|saol|eyvallah|harikasin/.test(n) && n.split(' ').length < 6 ? 30 : 0), run: () => A.thanks() },
    { id: 'who', s: (n) => W(n, [[/sen kimsin|adin ne|kimsin|nesin/, 20]]), run: () => A.who() },
    { id: 'help', s: (n) => W(n, [[/yardim|neler yapabil|ne yapabil|ne sorabil|nasil kullan|ozelliklerin|komutlar/, 15]]), run: () => A.help() },
    { id: 'todoadd', s: (n) => W(n, [[/(gorev|hatirlatma|not)\b.{0,25}\b(ekle|olustur|yaz|al)\b/, 25], [/\bhatirlat\b/, 20], [/\bgorev\s*:/, 25]]), run: (n, r, q, orig) => A.todoadd(orig || q) },
    { id: 'cmd', s: (n) => (/\b(ekle|gir|kaydet|yap|al|ac|baslat|olustur)\b/.test(n) && /(harcama|gider|odeme|stok giris|malzeme giris|stok cikis|malzeme cikis|puantaj|defter|isg kontrol|kusur|makine kaydi|siparis|talep|numune|beton dokum)/.test(n) && !/ne kadar|kac |kim |hangi|nedir|neler/.test(n) ? 22 : 0), run: (n) => A.cmd(n) },
    { id: 'calc', s: (n, q) => (calcFromText(q) ? 24 : 0), run: (n, r, q) => A.calc(calcFromText(q)) },
    { id: 'wx', s: (n) => W(n, [[/hava (durumu|nasil|tahmin|raporu)|havada|hava nasil/, 12], [/yagmur|yagis|kar yag|ruzgar|firtina|sicaklik|kac derece|don olay|dolu\b/, 7], [/(beton|vinc|iskele|siva|boya|hafriyat|kazi|cephe).{0,30}(uygun|olur mu|yapilir mi|yapabilir|dokulur|dokebilir|calisir mi|calisabilir|calisilir|kurulur mu|kurulabilir)/, 14], [/yarin|onumuzdeki|bu hafta|haftalik/, 1], [/kac gun|durduk|durma|nedeniyle|gecen|son \d+/, -14], [/nasil (yapilir|dokulur|olmali|yapmali|kurulur)|nedir|ne demek|neden|onlemleri|nelere dikkat/, -16]]), run: (n) => A.wx(n) },
    { id: 'briefing', d: D, s: (n) => W(n, [[/bugun (ne|neler)|ne yapmaliyim|ne yapacagiz|yapilacak|gundem|oncelik|brifing|sabah|gunluk (ozet|plan|rapor)|bugunku/, 13], [/yapmal|yapacak/, 2]]), run: () => A.briefing() },
    { id: 'concrete', d: D, s: (n) => W(n, [[/numune|kirim|slump|\bkup\b|beton dokum|dokum kayit|beton sonuc|beton takip/, 14], [/beton/, 2], [/bekleyen|kirilacak|sonuc/, 2]]), run: () => A.concrete() },
    { id: 'orders', d: D, s: (n) => W(n, [[/siparis|satin alma|talep|teslimat|teslim/, 8], [/bekleyen|acik|geciken|durum/, 2]]) - (/ne siparis|siparis (ver|onerisi)|ne almaliyim/.test(n) ? 20 : 0), run: () => A.orders() },
    { id: 'reorder', d: D, s: (n) => W(n, [[/ne siparis|siparis (ver|onerisi)|ne almaliyim|ne temin|eksik malzeme|satin almam|tedarik et/, 16]]), run: () => A.reorder() },
    { id: 'todo', d: D, s: (n) => W(n, [[/gorev|yapilacak(lar)? liste|is listesi|hatirlatma|toplanti/, 9], [/acik|bekleyen|geciken|benim|neler/, 2]]), run: () => A.todo() },
    { id: 'forecast', d: D, s: (n) => W(n, [[/butce.{0,20}(as|yet|kal|tahmin)|asar mi|asiyor mu|tahmini (maliyet|bitis maliyet)|\beac\b|projeksiyon|kalan butce/, 16]]), run: () => A.forecast() },
    { id: 'cashfc', d: D, s: (n) => W(n, [[/(onumuzdeki|gelecek|sonraki).{0,15}(gun|hafta|ay).{0,20}(nakit|odeme|tahsilat|para)|nakit (tahmin|akis|durum)|likidite|nakit yeter/, 15]]), run: () => A.cashfc() },
    { id: 'attendance', d: D, s: (n) => (/(kac|kimse|kim|kimler).*(kisi|isci|personel|calisan)|sahada|devamsiz|bugun.*calis|puantaj durumu|kim gelmedi|yoklama|gelmeyen/.test(n) && !/maliyet|tutar|maas|para/.test(n) ? 12 : 0), run: (n) => A.attendance(n) },
    { id: 'payroll', d: D, s: (n) => W(n, [[/maas|bordro|ucret|net odenecek/, 8], [/toplam|ne kadar/, 3]]), run: (n, r) => A.payroll(n, r) },
    { id: 'labor', d: D, s: (n) => (/isci|iscilik|yevmiye|puantaj|calisan|kalfa/.test(n) ? W(n, [[/isci|iscilik|yevmiye|puantaj|calisan|kalfa/, 5], [/maliyet|tutar|ne kadar|toplam|odeme|gider|para/, 4]]) : 0), run: (n, r) => A.labor(n, r) },
    { id: 'stock', d: D, s: (n) => W(n, [[/stok|kritik|tukenecek|tukeniyor|kaldi|depo|malzeme/, 5], [/kac (torba|ton|adet|m3|kg|metre)|ne kadar kaldi/, 4]]) + (findMats(n).length && /kac|ne kadar|kalan|var\b/.test(n) && !/harca|maliyet/.test(n) ? 8 : 0), run: (n) => A.stock(n) },
    { id: 'debt', d: D, s: (n) => W(n, [[/borc|odeyecegiz|odenecek|vadesi|gecikmis odeme|kime|cari/, 7]]), run: () => A.debt() },
    { id: 'recv', d: D, s: (n) => W(n, [[/alacak|tahsilat|taksit|musteri.*(gecik|borc)|tahsil/, 7]]), run: () => A.recv() },
    { id: 'sales', d: D, s: (n) => W(n, [[/satis|satildi|daire|musait|rezerve|ciro/, 6]]), run: () => A.sales() },
    { id: 'progress', d: D, s: (n) => W(n, [[/ilerleme|yuzde kac|ne kadar bitti|tamamlan|takvim|gerid|ne zaman bit|bitis|nasil gidiyor/, 6]]), run: () => A.progress() },
    { id: 'profit', d: D, s: (n) => W(n, [[/\bkar\b|zarar|nakit|gelir|\bnet\b|kasa/, 5]]) - (/ilerleme/.test(n) ? 6 : 0), run: (n, r) => A.profit(n, r) },
    { id: 'contracts', d: D, s: (n) => W(n, [[/sozlesme|bitiyor|biten/, 6], [/sozlesme/, 4]]), run: () => A.contracts() },
    { id: 'machines', d: D, s: (n) => W(n, [[/makine|vinc|bakim|yakit|jenerator|ekskavator|pompa|forklift/, 7]]), run: (n, r) => A.machines(n, r) },
    { id: 'safety', d: D, s: (n) => W(n, [[/isg|guvenlik|kusur|eksik kart|kaza|baret|kalite|punch/, 7]]), run: () => A.safety() },
    { id: 'weather', d: D, s: (n) => W(n, [[/hava|yagmur|yagis|durdu|durma|is durma/, 6]]), run: (n, r) => A.weather(n, r) },
    { id: 'diary', d: D, s: (n) => W(n, [[/defter|yapilan is|bugun ne yap|dun ne yap/, 6]]), run: (n) => A.diary(n) },
    { id: 'expense', d: D, s: (n) => W(n, [[/harcama|gider|masraf|harcad|nereye/, 5], [/maliyet|demir|beton|nakliye|harc\b|ince|kaba/, 3], [/toplam|ne kadar/, 2]]), run: (n, r) => A.expense(n, r) },
    { id: 'summary', d: D, s: (n) => W(n, [[/ozet|durum|genel|nasil|rapor|ne var/, 4]]), run: () => A.summary() },
  ];

  function answer(q, ctx) {
    const orig = String(q || ''), raw = orig.replace(/²/g, '2').replace(/³/g, '3').replace(/(\d),(\d)/g, '$1.$2'), n = N(raw), r = parseRange(n), proj = findProj(n), out = (a, id) => Object.assign({ intent: id, range: r }, a);
    const needsData = !SS.D.projects.length;
    const rev = /kac (metre|m\b|cubuk|boy|adet)/.test(n) && /demir|donati|cubuk/.test(n) ? A.rebarRev(n) : null; if (rev) return out(rev, 'calc');
    /* varlık odaklı kısa sorular (firma / personel adı) */
    const ent = !/^(merhaba|selam)/.test(n) && n.split(' ').length <= 10 ? (findFirm(n) || findWorker(n)) : null;
    const scored = INTENTS.map((it) => ({ it, s: it.s(n, raw) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    const kb = T.searchKb(raw), kbS = kb.score || 0, info = /\b(nedir|ne demek|nasil|neden|nelerdir|ne ise yarar|hangisi|nelere dikkat|ne zaman kirilir)\b/.test(n) && !/\b(bugun|bu ay|bizim|bizde|bizim|stoklar|harcadik|kalan)\b/.test(n);
    if (ent && !(scored[0] && scored[0].s >= 20)) { if (needsData) return out(noProject(), 'noproj'); return out(findFirm(n) && ent === findFirm(n) ? A.firm(n, r, ent) : A.worker(n, r, ent), 'entity'); }
    const top = scored[0];
    if (info && kbS >= 4 && !(top && (['calc', 'todoadd', 'cmd'].includes(top.it.id) || top.s >= 14))) return out(A.kb(kb), 'kb');
    if (!top || top.s < 3) {
      if (kbS >= 2) return out(A.kb(kb), 'kb');
      if (ctx && ctx.intent && (r || proj)) { const it = INTENTS.find((x) => x.id === ctx.intent); if (it) return out(scoped(proj && proj.id, () => it.run(ctx.n || n, r || ctx.range, raw, orig)), ctx.intent); }
      const e = !needsData && A.entity(n); if (e) return out(e, 'entity');
      return out(A.unknown(raw, n), 'unknown');
    }
    if (kbS >= 5 && top.s < 14 && !['calc', 'cmd', 'todoadd'].includes(top.it.id)) return out(A.kb(kb), 'kb');
    if (top.it.d && needsData) return out(noProject(), 'noproj');
    return out(scoped(proj && proj.id, () => top.it.run(n, r, raw, orig)), top.it.id);
  }
  SS.ai = { answer, calcFromText };

  const TOPICS = [
    { g: 'Günlük', q: ['Bugün ne yapmalıyım?', 'Genel durum özeti ver', 'Bugün sahada kaç kişi var?', 'Açık görevlerim neler?'] },
    { g: 'Finans', q: ['Kime ne kadar borcumuz var?', 'Bu ay en çok nereye harcadık?', 'Geciken taksitler neler?', 'Önümüzdeki 30 günde nakit durumu nasıl?', 'Bütçeyi aşar mıyız?', 'Bu ay maaş toplamı ne kadar?'] },
    { g: 'Stok & satın alma', q: ['Kritik stoklar hangileri?', 'Çimento stoğu ne kadar kaldı?', 'Ne sipariş vermeliyim?', 'Bekleyen siparişler neler?'] },
    { g: 'Saha', q: ['Şantiye takvime göre nasıl gidiyor?', 'İSG durumu nasıl?', 'Bekleyen beton numuneleri', 'Bakım zamanı gelen makineler', 'Yarın hava nasıl, beton dökülür mü?', 'Son 15 günlük toplam işçilik maliyetimiz nedir?'] },
    { g: 'Hesaplama', q: ['12x8 m 20 cm döşeme kaç m³ beton?', 'Ø16 demirden 500 metre kaç kg?', '120 m² 13,5\'luk tuğla duvar kaç adet?', '400 m² iki kat boya kaç litre?', '30x20 m 3 m derinlik hafriyat kaç sefer?', 'KDV hariç 85000 TL'] },
    { g: 'Bilgi', q: ['Beton kürü nasıl yapılır?', 'C25/30 ne demek?', 'İş kazası nasıl bildirilir?', 'Hangi KKD zorunlu?', 'Hakediş kesintileri nelerdir?'] },
    { g: 'Komut', q: ['Harcama ekle', 'Puantaj al', 'Yarın için görev ekle: iskele kontrolü', 'Beton dökümü ekle'] },
  ];

  /* ---------- sohbet durumu ve kalıcılık ---------- */
  const KEY = 'santiyesefi.ai.v1';
  let mid = 0; const newId = () => 'm' + Date.now().toString(36) + (++mid);
  const load = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const persist = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s.msgs.slice(-40))); } catch (e) { /* depolama dolu olabilir */ } };
  const S = () => { const s = ui.vs('ai', { msgs: null, pending: 0, ctx: null, chain: Promise.resolve(), chips: null }); if (!s.msgs) s.msgs = load(); return s; };
  SS.ai.clearHistory = () => { try { localStorage.removeItem(KEY); } catch (e) { /* */ } if (SS.vs.ai) { SS.vs.ai.msgs = null; SS.vs.ai.ctx = null; SS.vs.ai.chips = null; } };

  const welcome = () => {
    const nm = esc(SS.cfg.user || 'Şef'); const has = SS.D.projects.length;
    return { id: newId(), me: false, html: has ? `Merhaba <b>${nm}</b>! Ben Şantiye AI. Harcamalarınızı, stoklarınızı, puantajınızı, borç-alacağınızı, satışlarınızı, beton numunelerinizi ve ilerlemenizi <b>uygulamadaki gerçek verilerle</b> analiz ederim; ayrıca metraj hesabı yapar, saha sorularınızı yanıtlarım. Önerilerden birini seçin veya yazın; mikrofon düğmesiyle sesli de sorabilirsiniz.` : `Merhaba <b>${nm}</b>, tanıştığımıza memnun oldum! Ben Şantiye AI. Şantiyenizi ekleyip veri girmeye başladığınızda harcama, stok, puantaj ve borç-alacak durumunuzu gerçek rakamlarla yorumlarım. Şimdilik hesap ve saha bilgisi sorularını hemen yanıtlayabilirim.`, links: [], actions: has ? [] : [act('İlk şantiyemi ekle', 'proj.new', {}, 'building')], chips: has ? null : ['12x8 m 20 cm döşeme kaç m³ beton?', 'Beton kürü nasıl yapılır?', 'Hangi KKD zorunlu?'] };
  };

  /* ---------- işleme ve çizim ---------- */
  const btn = (a) => `<button class="btn sm soft" data-action="ai.act" data-act="${esc(a.action)}" ${Object.entries(a.data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${I(a.icon || 'plus')}${esc(a.label)}</button>`;
  const lnk = (l) => `<a class="btn sm" href="#/${l.route}">${I('chevR')}${esc(l.label)}</a>`;
  const msgHtml = (m, fresh) => m.me ? `<div class="msg me ${fresh ? 'new' : ''}"><div class="bub">${esc(m.text)}</div></div>`
    : `<div class="msg bot ${fresh ? 'new' : ''}"><span class="av kpi-ic">${I('sparkles')}</span><div class="bub">${m.html}${(m.actions || []).length || (m.links || []).length ? `<div class="ai-links">${(m.actions || []).map(btn).join('')}${(m.links || []).map(lnk).join('')}</div>` : ''}<div class="ai-tools"><button data-action="ai.copy" data-mid="${m.id}" title="Kopyala" aria-label="Kopyala">${I('copy')}</button><button data-action="ai.share" data-mid="${m.id}" title="Paylaş" aria-label="Paylaş">${I('send')}</button></div></div></div>`;
  const typingHtml = `<div class="msg bot" id="aiTyping"><span class="av kpi-ic">${I('sparkles')}</span><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>`;
  const scrollEl = () => document.getElementById('chatScroll');
  const scrollDown = () => requestAnimationFrame(() => { const el = scrollEl(); if (el) el.scrollTop = el.scrollHeight; });
  function chatHtml() { const s = S(); if (!s.msgs.length) { s.msgs.push(welcome()); persist(s); } return `<div class="chat-scroll" id="chatScroll">${s.msgs.map((m) => msgHtml(m, false)).join('')}${s.pending > 0 ? typingHtml : ''}</div>`; }
  function setTyping(on) { const el = scrollEl(); if (!el) return; const t = document.getElementById('aiTyping'); if (on && !t) el.insertAdjacentHTML('beforeend', typingHtml); if (!on && t) t.remove(); }
  function pushMsg(m) { const s = S(); m.id = m.id || newId(); s.msgs.push(m); persist(s); const el = scrollEl(); if (el) { const t = document.getElementById('aiTyping'); if (t) t.remove(); el.insertAdjacentHTML('beforeend', msgHtml(m, true) + (s.pending > 0 ? typingHtml : '')); scrollDown(); } }
  function chipsHtml() { const s = S(), list = s.chips && s.chips.length ? s.chips : U.uniq(TOPICS.flatMap((t) => t.q.slice(0, 2))).sort(() => 0.5 - Math.random()).slice(0, 5); s.chips = list; return list.slice(0, 5).map((c) => `<button class="chip" data-action="ai.ask" data-q="${esc(c)}">${esc(c)}</button>`).join(''); }
  function setChips(list) { const s = S(); s.chips = list && list.length ? list : null; const el = document.getElementById('aiChips'); if (el) el.innerHTML = chipsHtml(); }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  /* Mesaj gönderme: hiçbir zaman "meşgul" kilidi yoktur; cevaplar sıraya girer, sayaç try/finally ile garanti sıfırlanır. */
  function send(text) {
    text = String(text || '').trim().slice(0, 500); if (!text) return;
    const s = S(); pushMsg({ me: true, text }); s.pending++; setTyping(true); scrollDown();
    s.chain = s.chain.then(async () => {
      try {
        await delay(260 + Math.min(340, text.length * 6));
        let a; try { a = answer(text, s.ctx); } catch (e) { console.error(e); a = { html: 'Bu analiz sırasında bir hata oluştu, tekrar dener misiniz? <span class="sub">(' + esc(e.message) + ')</span>', intent: 'error' }; }
        s.ctx = { intent: a.intent, n: N(text), range: a.range };
        s.pending = Math.max(0, s.pending - 1);
        pushMsg(Object.assign({ me: false }, a)); setChips(a.chips); SS.sound.pop();
      } catch (e) { console.error(e); s.pending = 0; setTyping(false); }
    });
  }
  SS.ai.send = send;

  const htmlToText = (h) => { const d = document.createElement('div'); d.innerHTML = String(h).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(tr|li|p|div)>/gi, '\n').replace(/<\/t[dh]>/gi, '  '); return d.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); };
  const getMsg = (id) => S().msgs.find((m) => m.id === id);
  SS.actions['ai.ask'] = (el) => { send(el.dataset.q); const f = document.querySelector('[data-ai-form] input'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); };
  SS.actions['ai.act'] = (el) => { const a = el.dataset.act, fn = SS.actions[a]; if (!fn) return; if (ui.NEEDS_PROJECT.has(a) && !SS.D.projects.length) { ui.toast('Önce ilk şantiyenizi ekleyin', 'info'); return SS.actions['proj.new'](); } fn(el); };
  SS.actions['ai.copy'] = (el) => { const m = getMsg(el.dataset.mid); if (!m) return; try { navigator.clipboard.writeText(htmlToText(m.html)).then(() => ui.toast('Cevap kopyalandı')); } catch (e) { ui.toast('Kopyalanamadı', 'bad'); } };
  SS.actions['ai.share'] = (el) => { const m = getMsg(el.dataset.mid); if (!m) return; const t = `Şantiye Şefi · ${U.fmtDate(U.today())}\n\n` + htmlToText(m.html); if (navigator.share) navigator.share({ text: t }).catch(() => {}); else if (!ui.isApp()) window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); else { try { navigator.clipboard.writeText(t); ui.toast('Cevap kopyalandı'); } catch (e) { /* */ } } };
  SS.actions['ai.tel'] = (el) => { location.href = 'tel:' + String(el.dataset.tel).replace(/\s/g, ''); };
  SS.actions['ai.clear'] = () => { SS.ai.clearHistory(); ui.rerender(); ui.toast('Sohbet temizlendi', 'info'); };
  SS.actions['ai.topics'] = () => ui.sheet({ title: 'Neler sorabilirim?', noFocus: true, body: `<div class="topics">${TOPICS.map((t) => `<div><h4>${t.g}</h4><div class="chips">${t.q.map((q) => `<button class="chip" data-action="ai.ask" data-q="${esc(q)}" data-sheet-close>${esc(q)}</button>`).join('')}</div></div>`).join('')}</div>` });
  SS.actions['ai.addTodo'] = (el) => {
    if (el.dataset.done) return; const p = C.active() !== 'all' ? C.active() : (SS.D.projects[0] || {}).id || '';
    SS.store.add('todos', { projectId: p, title: el.dataset.title, due: el.dataset.due || '', priority: 'Orta', status: 'Açık', created: U.today(), note: '', assignee: '' }, 'k'); el.dataset.done = '1'; el.disabled = true; el.innerHTML = I('check') + 'Eklendi'; ui.toast('Görev eklendi'); ui.refreshBadges();
  };
  SS.actions['ai.mkOrders'] = () => {
    const list = C.scope('materials').map((m) => { const s = C.stock(m), u = C.usage(m); return { m, need: Math.max(0, Math.ceil(u * 14 + (m.critical || 0) - s)), s }; }).filter((x) => x.need > 0 && ((x.m.critical > 0 && x.s <= x.m.critical) || C.daysLeft(x.m) <= 10)); let n = 0;
    list.forEach((x) => { if (SS.D.orders.some((o) => o.materialId === x.m.id && !['Teslim', 'İptal'].includes(o.status))) return; SS.store.add('orders', { projectId: x.m.projectId, no: C.nextOrderNo(), item: x.m.name, materialId: x.m.id, qty: x.need, unit: x.m.unit, firmId: '', price: x.m.price || 0, needBy: U.addDays(U.today(), 3), status: 'Talep', priority: x.m.critical > 0 && x.s <= x.m.critical ? 'Yüksek' : 'Orta', requestedBy: SS.cfg.user, date: U.today(), note: 'Şantiye AI önerisi' }, 'o'); n++; });
    ui.toast(n ? `${n} talep oluşturuldu` : 'Bekleyen siparişleri olmayan acil kalem yok', n ? 'ok' : 'info'); if (n) ui.go('orders');
  };

  /* ---------- sesli giriş ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; let rec = null;
  SS.actions['ai.mic'] = (el) => {
    const inp = document.querySelector('[data-ai-form] input'); if (!SR) { ui.toast('Bu tarayıcı sesli girişi desteklemiyor', 'info'); return; }
    if (rec) { try { rec.stop(); } catch (e) { /* */ } return; }
    try { rec = new SR(); rec.lang = 'tr-TR'; rec.interimResults = true; rec.maxAlternatives = 1; } catch (e) { ui.toast('Mikrofon başlatılamadı', 'bad'); rec = null; return; }
    let final = ''; el.classList.add('on');
    rec.onresult = (ev) => { let t = ''; for (let i = 0; i < ev.results.length; i++) { t += ev.results[i][0].transcript; if (ev.results[i].isFinal) final = t; } if (inp) inp.value = t; };
    rec.onerror = (ev) => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') ui.toast('Mikrofon izni verilmedi', 'bad'); else if (ev.error !== 'aborted' && ev.error !== 'no-speech') ui.toast('Ses algılanamadı', 'info'); };
    rec.onend = () => { el.classList.remove('on'); rec = null; const v = (inp && inp.value.trim()) || final; if (v) { send(v); if (inp) inp.value = ''; } };
    try { rec.start(); } catch (e) { el.classList.remove('on'); rec = null; }
  };

  /* ---------- arayüz ---------- */
  SS.views.ai = {
    title: 'Şantiye AI',
    render() {
      S(); const ins = C.insights();
      return `<div class="page ai-page">${ui.head({ title: 'Şantiye AI', sub: 'Verilerinizi analiz eden, hesap yapan ve saha sorularını yanıtlayan asistan', actions: `<span class="badge ok">${I('shield')}Yerel analiz · veriler cihazınızdan çıkmaz</span>` })}
        <div class="ai-grid"><div class="card chat"><div class="chat-head"><span class="av">${I('sparkles')}</span><div><b>Şantiye AI</b><small><i></i>Çevrimdışı çalışır</small></div><span class="grow"></span><button class="btn sm ghost" data-action="ai.topics">${I('list')}<span>Neler sorabilirim?</span></button><button class="icon-btn" data-action="ai.clear" title="Sohbeti temizle" aria-label="Sohbeti temizle">${I('trash')}</button></div>
          ${ui.region('ai-chat', chatHtml)}<div class="chips" id="aiChips">${chipsHtml()}</div>
          <form class="chat-in" data-ai-form autocomplete="off"><input type="text" name="q" maxlength="500" placeholder="Örn: Bugün ne yapmalıyım? / 12x8 m 20 cm döşeme kaç m³?" autocomplete="off" aria-label="Soru">${SR ? `<button class="btn" type="button" data-action="ai.mic" aria-label="Sesli soru" title="Sesli soru">${I('mic')}</button>` : ''}<button class="btn primary" type="submit" aria-label="Gönder">${I('send')}</button></form></div>
        <div class="ai-side stack"><div class="row between"><h3>Akıllı Öneriler</h3><span class="badge muted">${ins.length}</span></div><div class="ins-list">${ins.length ? ins.slice(0, 9).map((i) => `<div class="card ins-card ${i.level}"><span class="kpi-ic tone-${i.level === 'ok' ? 'ok' : i.level}">${I(i.icon)}</span><div><b>${esc(i.title)}</b><p>${esc(i.text)}</p><a href="#/${i.route}">İlgili modüle git ${I('chevR')}</a></div></div>`).join('') : '<div class="card pad">' + ui.empty('check', 'Her şey yolunda', SS.D.projects.length ? 'Şu an dikkat çeken bir durum yok.' : 'Şantiyenizi ekleyip veri girdikçe önerilerim burada görünür.') + '</div>'}</div></div></div></div>`;
    },
    mount() { scrollDown(); },
  };
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-ai-form]'); if (!f) return; e.preventDefault(); const i = f.elements.q, v = i.value; i.value = ''; send(v); i.focus(); });
})();
