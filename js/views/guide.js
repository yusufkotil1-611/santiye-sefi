/* Rehber & Hesaplar — metraj hesaplayıcıları, referans tabloları, İSG levhaları ve sık sorulanlar */
(function () {
  const SS = window.SS, U = SS.U, ui = SS.ui, I = ui.icon, esc = U.esc, T = SS.tools;

  SS.css(`
  .calc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
  .calc-card{display:flex;flex-direction:column;text-align:left;padding:0;overflow:hidden;cursor:pointer;border:1px solid var(--line);background:var(--surface);border-radius:var(--r);box-shadow:var(--shadow);transition:transform .18s var(--ease),border-color .15s}
  .calc-card:hover{transform:translateY(-3px);border-color:var(--brand)}
  .calc-card .calc-art{background:linear-gradient(180deg,var(--brand-soft),var(--surface-2));border-bottom:1px solid var(--line-2)}
  .calc-art{display:block;width:100%;height:112px}
  .calc-card b{display:block;padding:12px 14px 2px;font-size:14.5px;line-height:1.3}.calc-card small{display:block;padding:0 14px 14px;color:var(--muted);font-size:12.5px;line-height:1.4}
  .calc-top{display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:center;margin-bottom:14px}.calc-top .calc-art{height:96px;border-radius:12px;background:var(--brand-soft)}
  .calc-out{margin-top:14px;padding:14px 16px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)}
  .calc-main small{display:block;color:var(--muted);font-size:12.5px;font-weight:600}.calc-main b{font-size:28px;letter-spacing:-.025em;color:var(--brand-text);font-variant-numeric:tabular-nums}
  .calc-rows{margin-top:8px}.calc-rows .live-row{border-top:1px dashed var(--line);padding:6px 0}.calc-rows .live-row:first-child{border-top:0}.calc-rows span:first-child{color:var(--muted)}
  .rb-row{display:grid;grid-template-columns:1.1fr 1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px}.rb-row .input,.rb-row select{min-height:42px}
  .rb-art{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;padding:8px 4px}.rb-art figure{margin:0;text-align:center;font-size:11.5px;color:var(--muted)}.rb-art b{display:block;color:var(--ink);font-size:12.5px}
  .rb-art svg{display:block;margin:0 auto 4px}
  .sign-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
  .sign{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:14px 10px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow)}
  .sign svg{width:84px;height:84px}.sign b{font-size:13.5px;line-height:1.25}.sign small{color:var(--muted);font-size:12px;line-height:1.35}
  .kb{display:flex;flex-direction:column;gap:10px}.kb details{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:0 16px}.kb summary{cursor:pointer;padding:14px 0;font-weight:650;display:flex;gap:10px;align-items:center;list-style:none}.kb summary::-webkit-details-marker{display:none}
  .kb summary::after{content:"+";margin-left:auto;font-size:20px;color:var(--brand);font-weight:700}.kb details[open] summary::after{content:"–"}.kb details>div{padding:0 0 16px;color:var(--ink-2);line-height:1.6;font-size:14.5px}.kb a{color:var(--brand-text);font-weight:650;text-decoration:underline}
  .ref-t{width:100%;border-collapse:collapse;font-size:13.5px}.ref-t th{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);text-align:left;padding:8px 10px;border-bottom:1.5px solid var(--line)}.ref-t td{padding:8px 10px;border-bottom:1px solid var(--line-2);font-variant-numeric:tabular-nums}.ref-t .r{text-align:right}
  @media(max-width:699px){.calc-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.calc-art{height:88px}.calc-card small{display:none}.calc-card b{padding-bottom:12px}.calc-top{grid-template-columns:1fr}.rb-row{grid-template-columns:1fr 1fr;}.sign-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `);

  /* ---------- İSG levhaları (ISO 7010 benzeri, kendi çizimimiz) ---------- */
  const BLU = '#1d5fa8', RED = '#d62828', YEL = '#f5c400', GRN = '#0b7a4b', INK = '#16191d';
  const mand = (g) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${BLU}"/>${g}</svg>`;
  const warn = (g) => `<svg viewBox="0 0 100 100"><path d="M50 8 94 86H6z" fill="${YEL}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>${g}</svg>`;
  const proh = (g) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="${RED}" stroke-width="9"/>${g}<path d="M20 80 80 20" stroke="${RED}" stroke-width="9"/></svg>`;
  const safe = (g) => `<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="12" fill="${GRN}"/>${g}</svg>`;
  const fire = (g) => `<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="12" fill="${RED}"/>${g}</svg>`;
  const SIGNS = [
    ['Zorunlu', 'Baret takınız', 'Düşen cisim ve çarpma riski olan tüm alanlarda.', mand('<path d="M26 62a24 24 0 0 1 48 0z" fill="#fff"/><rect x="22" y="60" width="56" height="8" rx="3" fill="#fff"/><path d="M50 36v14" stroke="' + BLU + '" stroke-width="4"/>')],
    ['Zorunlu', 'İş ayakkabısı giyiniz', 'Çelik burunlu, delinmeye dayanıklı.', mand('<path d="M32 28h17v22l21 8c4 1.5 6 3 6 8v4H32z" fill="#fff"/>')],
    ['Zorunlu', 'Eldiven giyiniz', 'El yaralanması, kesik ve kimyasal riski.', mand('<g fill="#fff"><rect x="34" y="46" width="32" height="26" rx="10"/><rect x="34" y="28" width="7" height="24" rx="3.5"/><rect x="43" y="24" width="7" height="28" rx="3.5"/><rect x="52" y="26" width="7" height="26" rx="3.5"/><rect x="61" y="32" width="7" height="22" rx="3.5"/><rect x="25" y="50" width="7" height="18" rx="3.5" transform="rotate(-25 29 59)"/></g>')],
    ['Zorunlu', 'Koruyucu gözlük takınız', 'Kesme, taşlama, kırma işlerinde.', mand('<g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><circle cx="37" cy="52" r="12"/><circle cx="63" cy="52" r="12"/><path d="M49 50h2M25 49l-7-4M75 49l7-4"/></g>')],
    ['Zorunlu', 'Kulak koruyucu takınız', '85 dB(A) ve üzeri gürültüde zorunlu.', mand('<path d="M28 56V50a22 22 0 0 1 44 0v6" fill="none" stroke="#fff" stroke-width="5"/><rect x="22" y="52" width="12" height="20" rx="5" fill="#fff"/><rect x="66" y="52" width="12" height="20" rx="5" fill="#fff"/>')],
    ['Zorunlu', 'Reflektif yelek giyiniz', 'Araç / iş makinesi trafiği olan sahada.', mand('<path d="M36 26h10l4 8 4-8h10l8 14-8 6v28H36V46l-8-6z" fill="#fff"/><path d="M42 58h16M42 66h16" stroke="' + BLU + '" stroke-width="4"/>')],
    ['Zorunlu', 'Emniyet kemeri kullanınız', 'Yüksekte çalışmada yaşam hattına bağlanın.', mand('<circle cx="50" cy="30" r="7" fill="#fff"/><g stroke="#fff" stroke-width="6" stroke-linecap="round"><path d="M50 40v22M50 62l-8 14M50 62l8 14M50 46l-12 9M50 46l12 9"/></g><path d="M43 44l14 14M57 44 43 58" stroke="' + BLU + '" stroke-width="3"/>')],
    ['Zorunlu', 'Toz maskesi takınız', 'Sıva, kesme, zımpara ve silis tozunda.', mand('<path d="M30 46q20-12 40 0v10q0 14-20 18-20-4-20-18z" fill="#fff"/><circle cx="40" cy="58" r="5" fill="' + BLU + '"/><circle cx="60" cy="58" r="5" fill="' + BLU + '"/>')],
    ['Uyarı', 'Elektrik tehlikesi', 'Pano, kablo ve geçici tesisat çevresi.', warn('<path d="M54 40 41 62h9l-3 16 15-24h-9z" fill="' + INK + '"/>')],
    ['Uyarı', 'Düşme tehlikesi', 'Kat kenarı, boşluk ve iskele çevresi.', warn('<circle cx="42" cy="46" r="4.5" fill="' + INK + '"/><path d="M43 52l12 8-4 12M55 60l9-7" stroke="' + INK + '" stroke-width="4" stroke-linecap="round" fill="none"/>')],
    ['Uyarı', 'Yanıcı madde', 'Yakıt, boya ve çözücü depoları.', warn('<path d="M50 38c4 10 12 14 12 26a12 12 0 0 1-24 0c0-6 3-9 6-12 0 6 3 8 5 8 0-8-2-14 1-22z" fill="' + INK + '"/>')],
    ['Uyarı', 'Askıdaki yük', 'Vinç kaldırma alanı; altında durmayın.', warn('<path d="M50 38v12" stroke="' + INK + '" stroke-width="3"/><path d="M43 50h14l-3 7h-8z" fill="' + INK + '"/><rect x="38" y="60" width="24" height="14" fill="' + INK + '"/>')],
    ['Uyarı', 'Kaygan zemin', 'Yağış, çamur ve ıslak zeminlerde.', warn('<path d="M31 68q6-6 12 0t12 0t12 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><path d="M42 44q5 7 0 10-5-3 0-10zM58 48q5 7 0 10-5-3 0-10z" fill="' + INK + '"/>')],
    ['Uyarı', 'Genel tehlike', 'Dikkat edilmesi gereken genel risk.', warn('<rect x="47" y="38" width="6" height="22" rx="2" fill="' + INK + '"/><circle cx="50" cy="69" r="3.8" fill="' + INK + '"/>')],
    ['Yasak', 'Sigara içilmez', 'Depo, yakıt ve kapalı alanlarda.', proh('<rect x="26" y="52" width="40" height="7" fill="' + INK + '"/><rect x="68" y="52" width="7" height="7" fill="' + RED + '"/><path d="M62 46q-3-5 1-9" stroke="' + INK + '" stroke-width="3" fill="none"/>')],
    ['Yasak', 'Ateş yakmak yasaktır', 'Açık alev ve kıvılcım yasak.', proh('<path d="M50 28c4 10 12 14 12 26a12 12 0 0 1-24 0c0-6 3-9 6-12 0 6 3 8 5 8 0-8-2-14 1-22z" fill="' + INK + '"/>')],
    ['Yasak', 'Yetkisiz giriş yasaktır', 'Tehlikeli ve sınırlı erişimli alanlar.', '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="' + RED + '"/><rect x="20" y="42" width="60" height="16" fill="#fff"/></svg>'],
    ['Emniyet', 'İlk yardım', 'İlk yardım dolabı / istasyonu.', safe('<path d="M42 24h16v18h18v16H58v18H42V58H24V42h18z" fill="#fff"/>')],
    ['Emniyet', 'Acil çıkış', 'Acil durumda kullanılacak çıkış yönü.', safe('<g stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M64 26h10v48H64"/><path d="M24 50h32M45 38l12 12-12 12"/></g>')],
    ['Emniyet', 'Toplanma noktası', 'Tahliye sonrası toplanılacak alan.', safe('<g stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M50 22v18M42 32l8 8 8-8M50 78V60M42 68l8-8 8 8M22 50h18M32 42l8 8-8 8M78 50H60M68 42l-8 8 8 8"/></g><circle cx="50" cy="50" r="5" fill="#fff"/>')],
    ['Yangın', 'Yangın söndürücü', 'Erişilebilir, dolu ve yerinde olmalı.', fire('<rect x="40" y="42" width="20" height="38" rx="6" fill="#fff"/><path d="M46 42V30h14l9-6" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>')],
  ];

  /* ---------- hesaplayıcı penceresi ---------- */
  const fieldHtml = (i) => `<div class="fld half"><label>${i.l}${i.u ? ` <span class="muted">(${i.u})</span>` : ''}</label>${i.select ? `<select class="input" data-k="${i.k}">${ui.opts(i.select, i.v)}</select>` : `<input class="input" type="number" inputmode="decimal" step="${i.step || 'any'}" ${i.min != null ? `min="${i.min}"` : ''} value="${i.v}" data-k="${i.k}">`}</div>`;
  const resHtml = (r) => `<div class="calc-main"><small>${esc(r.main[0])}</small><b>${esc(r.main[1])}</b></div><div class="calc-rows">${r.rows.map(([a, b]) => `<div class="live-row"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`;
  const plain = (title, r) => `${title}\n${r.main[0]}: ${r.main[1]}\n${r.rows.map(([a, b]) => `${a}: ${b}`).join('\n')}`;
  const copy = (txt) => { try { navigator.clipboard.writeText(txt).then(() => ui.toast('Sonuç kopyalandı')); } catch (e) { ui.toast('Kopyalanamadı', 'bad'); } };

  function openCalc(id, preset) {
    const d = T.defs[id], vals = Object.assign(T.defaults(id), preset || {});
    d.inputs.forEach((i) => (i.v = vals[i.k]));
    let last;
    ui.sheet({ title: d.title, noFocus: true, body: `<div class="calc-top">${d.art}<p class="sub">${esc(d.hint)}</p></div><div class="fgrid">${d.inputs.map(fieldHtml).join('')}</div><div class="calc-out" data-out></div>`,
      footer: `<button class="btn" data-act="copy">${I('copy')}Sonucu kopyala</button><button class="btn" data-sheet-close>Kapat</button>`,
      mount(el, api) {
        const out = el.querySelector('[data-out]'), read = () => Object.fromEntries([...el.querySelectorAll('[data-k]')].map((x) => [x.dataset.k, x.value]));
        const calc = () => { try { last = T.run(id, read()); out.innerHTML = resHtml(last); } catch (e) { out.innerHTML = '<span class="muted">Değerleri kontrol edin.</span>'; } };
        el.addEventListener('input', calc); calc();
        api.el.querySelector('[data-act=copy]').addEventListener('click', () => last && copy(plain(d.title, last)));
      } });
  }
  function openRebar() {
    let rows = [{ d: '12', L: 12, n: 100 }];
    ui.sheet({ title: 'Donatı metraj cetveli', noFocus: true, wide: true,
      body: `<p class="sub" style="margin-bottom:10px">Çap, çubuk boyu ve adedini girin; çaplara göre toplam metre ve ağırlık hesaplanır.</p><div data-rows></div><button class="btn sm" data-add>${I('plus')}Satır ekle</button><div class="calc-out" data-out></div>`,
      footer: `<button class="btn" data-act="copy">${I('copy')}Kopyala</button><button class="btn" data-sheet-close>Kapat</button>`,
      mount(el, api) {
        const wrap = el.querySelector('[data-rows]'), out = el.querySelector('[data-out]'); let res;
        const draw = () => { wrap.innerHTML = rows.map((r, i) => `<div class="rb-row"><div class="fld"><label>Çap</label><select class="input" data-i="${i}" data-f="d">${ui.opts(T.REBAR.map((d) => [String(d), `Ø${d} mm`]), r.d)}</select></div><div class="fld"><label>Boy (m)</label><input class="input" type="number" step="any" min="0" value="${r.L}" data-i="${i}" data-f="L"></div><div class="fld"><label>Adet</label><input class="input" type="number" step="1" min="0" value="${r.n}" data-i="${i}" data-f="n"></div><button class="icon-btn" data-del="${i}" aria-label="Satırı sil">${I('trash')}</button></div>`).join(''); };
        const calc = () => { res = T.rebarList(rows); out.innerHTML = res.list.length ? `<div class="calc-main"><small>Toplam ağırlık</small><b>${U.num(res.kg)} kg</b> <span class="muted">(${U.num(res.kg / 1000, 3)} ton · ${U.num(res.m)} m)</span></div><table class="ref-t" style="margin-top:8px"><thead><tr><th>Çap</th><th class="r">Metre</th><th class="r">kg/m</th><th class="r">Ağırlık (kg)</th></tr></thead><tbody>${res.list.map((x) => `<tr><td>Ø${x.d}</td><td class="r">${U.num(x.m)}</td><td class="r">${U.num(T.kgm(x.d), 3)}</td><td class="r"><b>${U.num(x.kg)}</b></td></tr>`).join('')}</tbody></table>` : '<span class="muted">Değer girin.</span>'; };
        draw(); calc();
        el.addEventListener('input', (e) => { const t = e.target; if (t.dataset.f) { rows[+t.dataset.i][t.dataset.f] = t.value; calc(); } });
        el.addEventListener('click', (e) => { if (e.target.closest('[data-add]')) { rows.push({ d: '12', L: 12, n: 0 }); draw(); } const del = e.target.closest('[data-del]'); if (del && rows.length > 1) { rows.splice(+del.dataset.del, 1); draw(); calc(); } });
        api.el.querySelector('[data-act=copy]').addEventListener('click', () => res && copy('Donatı metrajı\n' + res.list.map((x) => `Ø${x.d}: ${U.num(x.m)} m = ${U.num(x.kg)} kg`).join('\n') + `\nToplam: ${U.num(res.kg)} kg (${U.num(res.kg / 1000, 3)} ton)`));
      } });
  }
  SS.actions['calc.open'] = (el) => { let p = null; try { p = el.dataset.preset ? JSON.parse(el.dataset.preset) : null; } catch (e) { /* */ } return el.dataset.id === 'rebar' ? openRebar() : openCalc(el.dataset.id, p); };
  SS.guide = { openCalc, openRebar };

  /* ---------- sekmeler ---------- */
  const calcTab = () => `<div class="calc-grid">${[...T.order.map((id) => ({ id, d: T.defs[id] })), { id: 'rebar', d: { title: 'Donatı metraj cetveli', hint: 'Çok satırlı: çap × boy × adet → kg / ton', art: T.art.demir } }].map(({ id, d }) => `<button class="calc-card" data-action="calc.open" data-id="${id}">${d.art}<b>${esc(d.title)}</b><small>${esc(d.hint)}</small></button>`).join('')}</div>`;

  const tablesTab = () => {
    const scale = 2.4, rb = T.REBAR.map((d) => `<figure><svg width="${d * scale + 6}" height="${d * scale + 6}" viewBox="0 0 ${d * scale + 6} ${d * scale + 6}"><circle cx="${(d * scale + 6) / 2}" cy="${(d * scale + 6) / 2}" r="${(d * scale) / 2}" fill="var(--s3)" fill-opacity=".4" stroke="var(--ink-2)" stroke-width="1.5"/></svg><b>Ø${d}</b></figure>`).join('');
    return `<div class="grid g-2"><div class="card"><div class="card-h"><h3>Nervürlü donatı çubukları</h3><span class="badge muted">ölçekli kesit</span></div><div class="card-b"><div class="rb-art">${rb}</div>
      <div class="tbl-wrap"><table class="ref-t"><thead><tr><th>Çap</th><th class="r">Kesit (cm²)</th><th class="r">kg/m</th><th class="r">12 m çubuk (kg)</th></tr></thead><tbody>${T.REBAR.map((d) => `<tr><td><b>Ø${d}</b></td><td class="r">${U.num(T.areaCm2(d), 3)}</td><td class="r">${U.num(T.kgm(d), 3)}</td><td class="r">${U.num(T.kgm(d) * 12, 1)}</td></tr>`).join('')}</tbody></table></div><p class="sub" style="margin-top:8px">Birim ağırlık = d² × 0,006165 kg/m (çelik yoğunluğu 7850 kg/m³). Sınıflar: B420C, B500C.</p></div></div>
      <div class="stack"><div class="card"><div class="card-h"><h3>Beton sınıfları (TS EN 206)</h3></div><div class="card-b"><table class="ref-t"><thead><tr><th>Sınıf</th><th class="r">Silindir (MPa)</th><th class="r">Küp (MPa)</th><th>Tipik kullanım</th></tr></thead><tbody>
        ${[['C16/20', 16, 20, 'Grobeton, temizlik betonu'], ['C20/25', 20, 25, 'Düşük gerilmeli elemanlar'], ['C25/30', 25, 30, 'Normal betonarme (TBDY min.)'], ['C30/37', 30, 37, 'Yüksek yapı, kolon-perde'], ['C35/45', 35, 45, 'Yüksek dayanım gereken elemanlar'], ['C40/50', 40, 50, 'Özel projeler, öngerilmeli']].map((r) => `<tr><td><b>${r[0]}</b></td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="card-h"><h3>Slump (çökme) sınıfları</h3></div><div class="card-b"><table class="ref-t"><thead><tr><th>Sınıf</th><th class="r">Çökme (mm)</th><th>Kullanım</th></tr></thead><tbody>${[['S1', '10–40', 'Kuru kıvam, yol/temel'], ['S2', '50–90', 'Genel'], ['S3', '100–150', 'Konut, normal dökümler'], ['S4', '160–210', 'Pompalı, sık donatılı'], ['S5', '≥ 220', 'Akıcı, özel']].map((r) => `<tr><td><b>${r[0]}</b></td><td class="r">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div></div>
      <div class="card"><div class="card-h"><h3>Birim ağırlıklar (yaklaşık)</h3></div><div class="card-b"><table class="ref-t"><tbody>${[['Betonarme', '25 kN/m³ (≈ 2500 kg/m³)'], ['Donatısız beton', '24 kN/m³'], ['Çelik', '78,5 kN/m³ (7850 kg/m³)'], ['Çimento harcı', '20 kN/m³'], ['Su', '10 kN/m³ (1000 kg/m³)'], ['Çimento torbası', '50 kg']].map((r) => `<tr><td>${r[0]}</td><td class="r"><b>${r[1]}</b></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="card-h"><h3>Acil durum numaraları</h3></div><div class="card-b"><table class="ref-t"><tbody>${[['Acil Çağrı Merkezi', '112'], ['İtfaiye', '110'], ['Polis', '155'], ['Jandarma', '156'], ['ALO 170 (Çalışma ve Sosyal Güvenlik)', '170']].map((r) => `<tr><td>${r[0]}</td><td class="r"><a href="tel:${r[1]}"><b>${r[1]}</b></a></td></tr>`).join('')}</tbody></table></div></div></div>`;
  };

  const signsTab = () => {
    const cats = ['Zorunlu', 'Uyarı', 'Yasak', 'Emniyet', 'Yangın'], desc = { Zorunlu: 'Mavi daire — yapılması zorunlu', Uyarı: 'Sarı üçgen — tehlike uyarısı', Yasak: 'Kırmızı çizgili daire — yasak', Emniyet: 'Yeşil — emniyet / acil durum', Yangın: 'Kırmızı — yangın ekipmanı' };
    return cats.map((c) => `<div class="section-t" style="margin:14px 0 4px">${c} levhaları <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">· ${desc[c]}</span></div><div class="sign-grid">${SIGNS.filter((s) => s[0] === c).map((s) => `<div class="sign">${s[3]}<b>${esc(s[1])}</b><small>${esc(s[2])}</small></div>`).join('')}</div>`).join('') + '<p class="sub" style="margin-top:14px">Levhaları basılı olarak sahada ilgili noktalara asın; renk ve biçimler ISO 7010 / İSG Yönetmeliği sınıflandırmasını izler. Resmî levha ölçüleri ve sayıları için İSG uzmanınıza danışın.</p>';
  };

  function kbBody() {
    const st = ui.vs('guide', { q: '' }), list = st.q ? T.searchKb(st.q) : T.kb;
    return list.length ? `<div class="kb">${list.map((e) => `<details><summary>${esc(e.t)}</summary><div>${e.a}</div></details>`).join('')}</div>` : ui.empty('search', 'Sonuç bulunamadı', 'Başka bir sözcük deneyin veya Şantiye AI\'ya sorun.', '<a class="btn" href="#/ai">' + I('sparkles') + 'Şantiye AI\'ya sor</a>');
  }
  const kbTab = () => `<div class="toolbar"><label class="search">${I('search')}<input type="search" data-vs="guide.q" data-upd="guide-kb" value="${esc(ui.vs('guide').q || '')}" placeholder="Beton, donatı, iskele, hakediş, KKD…" autocomplete="off" aria-label="Bilgi ara"></label></div>${ui.region('guide-kb', kbBody)}`;

  SS.views.guide = {
    title: 'Rehber & Hesaplar',
    render() {
      const st = ui.vs('guide', { tab: 'calc', q: '' });
      return `<div class="page">${ui.head({ title: 'Rehber & Hesaplar', sub: 'Metraj hesaplayıcıları, referans tabloları, İSG levhaları ve saha bilgileri', actions: `<a class="btn" href="#/ai">${I('sparkles')}Şantiye AI'ya sor</a>` })}
        ${ui.tabs('guide', 'tab', [['calc', 'Hesaplayıcılar', T.order.length + 1], ['tables', 'Referans Tabloları'], ['signs', 'İSG Levhaları', SIGNS.length], ['kb', 'Sık Sorulanlar', T.kb.length]], st.tab)}
        ${st.tab === 'calc' ? calcTab() : st.tab === 'tables' ? tablesTab() : st.tab === 'signs' ? signsTab() : kbTab()}</div>`;
    },
  };
})();
