/* Şantiye Şefi — saha hava durumu (Open-Meteo, anahtarsız) + iş uygunluğu değerlendirmesi.
   Gizlilik: yalnızca kullanıcı etkinleştirince çalışır; internete yalnızca şantiye konumunun ADI (örn. "Serdivan, Sakarya") gönderilir.
   Sonuçlar cihazda önbelleğe alınır; internet yokken son veri gösterilir. */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, N = U.norm;
  const W = (SS.wx = {});
  const KEY = 'santiyesefi.wx.v1', TTL = 30 * 60e3;

  /* ---------- önbellek ---------- */
  let mem = null;
  const all = () => { if (!mem) { try { mem = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { mem = {}; } } return mem; };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(mem || {})); } catch (e) { /* depolama dolu olabilir */ } };
  W.cache = (key) => all()[key] || null;
  W.clear = () => { mem = {}; try { localStorage.removeItem(KEY); } catch (e) { /* */ } };
  const status = {};
  W.status = (key) => status[key] || {};

  /* ---------- hedef (hangi şantiye için?) ---------- */
  W.queryOf = (p) => (p ? p.geoName || p.location || SS.cfg.city || '' : SS.cfg.city || '');
  W.target = (pid) => {
    const a = pid || C.active(); let p = a !== 'all' ? C.proj(a) : SS.D.projects.find((x) => x.status === 'active' && W.queryOf(x)) || SS.D.projects.find((x) => W.queryOf(x)) || SS.D.projects[0];
    const q = W.queryOf(p); if (!p && !q) return null;
    return { key: p ? p.id : '_', p, q, missing: !q };
  };

  /* ---------- WMO hava kodları ---------- */
  W.desc = (c) => (c === 0 ? ['Açık', 'sun', 'sun'] : c === 1 ? ['Çoğunlukla açık', 'sun', 'sun'] : c === 2 ? ['Parçalı bulutlu', 'cloud', 'cloud'] : c === 3 ? ['Kapalı', 'cloud', 'cloud'] : c === 45 || c === 48 ? ['Sisli', 'fog', 'cloud'] : c >= 51 && c <= 57 ? ['Çiseleme', 'rain', 'rain'] : c >= 61 && c <= 67 ? ['Yağmurlu', 'rain', 'rain'] : c >= 71 && c <= 77 ? ['Karlı', 'snow', 'snow'] : c >= 80 && c <= 82 ? ['Sağanak yağış', 'rain', 'rain'] : c === 85 || c === 86 ? ['Kar sağanağı', 'snow', 'snow'] : c >= 95 ? ['Gök gürültülü fırtına', 'bolt', 'storm'] : ['—', 'cloud', 'cloud']);
  /* defter formundaki 5 seçenekten birine eşle */
  W.diaryKind = (code, wind) => (code >= 71 && code <= 77) || code === 85 || code === 86 ? 'Karlı' : (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 ? 'Yağmurlu' : wind >= 35 ? 'Rüzgarlı' : code <= 1 ? 'Güneşli' : 'Bulutlu';

  /* ---------- ağ ---------- */
  async function getJson(url) {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 12000);
    try { const r = await fetch(url, { signal: ac.signal }); if (!r.ok) throw new Error('Hava servisi yanıt vermedi (' + r.status + ')'); return await r.json(); }
    catch (e) { if (e.name === 'AbortError') throw new Error('Hava servisi zaman aşımına uğradı'); if (e instanceof TypeError) throw new Error('Hava servisine ulaşılamadı — internet bağlantısını kontrol edin'); throw e; }
    finally { clearTimeout(to); }
  }
  async function geocode(q) {
    const parts = String(q).split(/[\/,–]+/).map((s) => s.trim()).filter(Boolean), name = parts[0] || q;
    const r = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=tr&format=json&countryCode=TR`);
    const res = r.results || []; if (!res.length) throw new Error(`“${name}” konumu bulunamadı — şantiye ayarlarında yer adını (ör. Serdivan, Sakarya) düzeltin`);
    const hint = parts.slice(1).map(N), pick = res.find((x) => hint.some((h) => h && (N(x.admin1 || '').includes(h) || N(x.admin2 || '').includes(h)))) || res[0];
    return { lat: pick.latitude, lon: pick.longitude, name: [pick.name, pick.admin1].filter(Boolean).join(', ') };
  }
  async function forecast(g) {
    const r = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=auto&forecast_days=7&wind_speed_unit=kmh`);
    const c = r.current || {}, d = r.daily || {}, days = (d.time || []).map((date, i) => ({ date, code: d.weather_code[i], tmax: d.temperature_2m_max[i], tmin: d.temperature_2m_min[i], rain: d.precipitation_sum[i] || 0, pop: d.precipitation_probability_max ? d.precipitation_probability_max[i] || 0 : 0, wind: d.wind_speed_10m_max[i] || 0, gust: d.wind_gusts_10m_max ? d.wind_gusts_10m_max[i] || 0 : 0 }));
    if (!days.length) throw new Error('Hava servisi boş yanıt verdi');
    return { cur: { t: c.temperature_2m, feels: c.apparent_temperature, hum: c.relative_humidity_2m, rain: c.precipitation || 0, code: c.weather_code, wind: c.wind_speed_10m, gust: c.wind_gusts_10m, time: c.time }, days };
  }
  const paint = () => { try { ui.update('wx-card'); } catch (e) { /* */ } try { ui.updateBell && ui.updateBell(); } catch (e) { /* */ } };

  /* Veriyi (gerekirse) yeniler. force=true: süre dolmasa da yeniler. */
  W.refresh = async (t, force) => {
    t = t || W.target(); if (!t || t.missing) return; const k = t.key, s = (status[k] = status[k] || {}), c = W.cache(k);
    if (s.loading) return; if (!force && c && c.q === t.q && Date.now() - c.at < TTL) return;
    s.loading = true; s.err = ''; paint();
    try {
      if (navigator.onLine === false) throw new Error('İnternet bağlantısı yok');
      const geo = c && c.q === t.q && c.geo ? c.geo : await geocode(t.q), data = await forecast(geo);
      all()[k] = { q: t.q, geo, at: Date.now(), data }; persist();
    } catch (e) { s.err = e.message || 'Hava durumu alınamadı'; }
    s.loading = false; s.tried = Date.now(); paint();
  };
  /* Etkinse ve bayatsa arka planda yeniler (denemeler arası ≥ 3 dk) */
  W.auto = () => { if (!SS.cfg.wxOn) return; const t = W.target(); if (!t || t.missing) return; const s = W.status(t.key), c = W.cache(t.key); if (s.loading || (s.tried && Date.now() - s.tried < 180e3)) return; if (!c || c.q !== t.q || Date.now() - c.at >= TTL) W.refresh(t); };

  /* Önbellekteki günler (bugünden itibaren) */
  W.days = (c) => (c ? c.data.days.filter((d) => d.date >= U.today()) : []);

  /* ---------- iş uygunluğu ---------- */
  const THUNDER = (code) => code >= 95;
  W.suit = (d) => {
    const L = (level, why) => ({ level, why }), snow = (d.code >= 71 && d.code <= 77) || d.code === 85 || d.code === 86;
    const beton = d.tmin < 0 || d.rain >= 5 || d.tmax > 38 || THUNDER(d.code) ? L('bad', d.tmin < 0 ? 'Don riski: dökülen beton donabilir' : d.tmax > 38 ? 'Aşırı sıcak: priz ve çatlak riski' : 'Yoğun yağış / fırtına bekleniyor')
      : d.tmin < 5 || d.tmax > 30 || d.rain >= 1 || d.pop >= 60 ? L('warn', d.tmin < 5 ? `Gece ${Math.round(d.tmin)}°C: soğuk hava önlemi alın` : d.tmax > 30 ? `Sıcak (${Math.round(d.tmax)}°C): erken saatte dökün, kürü artırın` : 'Yağış ihtimali: örtü hazır bulundurun') : L('ok', `${Math.round(d.tmin)}–${Math.round(d.tmax)}°C, ${d.rain >= 0.1 ? 'hafif yağış (' + U.num(d.rain, 1) + ' mm)' : 'yağış beklenmiyor'}`);
    const vinc = d.gust >= 60 || d.wind >= 45 || THUNDER(d.code) ? L('bad', THUNDER(d.code) ? 'Fırtına / yıldırım: kaldırma yapmayın' : `Rüzgâr ${Math.round(d.gust || d.wind)} km/s: kaldırma durdurulmalı`)
      : d.gust >= 40 || d.wind >= 30 ? L('warn', `Rüzgâr ${Math.round(d.gust || d.wind)} km/s: üretici sınırını kontrol edin`) : L('ok', `Rüzgâr ${Math.round(d.wind)} km/s${d.gust ? ' (hamle ' + Math.round(d.gust) + ')' : ''}`);
    const yuksek = d.gust >= 50 || THUNDER(d.code) || snow ? L('bad', snow ? 'Kar / buzlanma: iskele ve kenarlar kaygan' : 'Sert rüzgâr / fırtına: yüksekte çalışma durdurulmalı')
      : d.wind >= 25 || d.rain >= 2 || d.tmin <= 1 ? L('warn', d.rain >= 2 ? 'Islak yüzeyler: kayma riski, iskeleyi kontrol edin' : d.tmin <= 1 ? 'Buzlanma ihtimali' : `Rüzgâr ${Math.round(d.wind)} km/s: dikkatli çalışın`) : L('ok', `Rüzgâr ${Math.round(d.wind)} km/s, yüzeyler ${d.rain >= 0.5 ? 'hafif nemli' : 'kuru'}`);
    const cephe = d.rain >= 2 || d.tmin < 2 || d.wind >= 40 || snow ? L('bad', d.rain >= 2 ? 'Yağış: dış cephe işi yapılmamalı' : d.tmin < 2 ? 'Don riski: sıva/boya uygulanmaz' : 'Sert rüzgâr')
      : d.rain >= 0.5 || d.tmax > 32 || d.tmin < 5 || d.pop >= 50 ? L('warn', d.tmax > 32 ? 'Sıcak: sıva/boya hızlı kurur, nemlendirin' : d.tmin < 5 ? 'Düşük sıcaklık: kuruma uzar' : 'Yağış ihtimali: sabah tamamlayın') : L('ok', `${Math.round(d.tmin)}–${Math.round(d.tmax)}°C, ${d.rain >= 0.1 ? 'çok az yağış' : 'kuru'}`);
    const hafriyat = d.rain >= 15 ? L('bad', 'Çok yoğun yağış: saha çamurlaşır, şev kayabilir') : d.rain >= 5 || snow ? L('warn', 'Yağış: zemin yumuşar, şevleri kontrol edin') : L('ok', d.rain >= 0.5 ? `Hafif yağış (${U.num(d.rain, 1)} mm)` : 'Yağış beklenmiyor');
    return [{ k: 'beton', t: 'Betonlama', i: 'cube', ...beton }, { k: 'vinc', t: 'Vinç / kaldırma', i: 'truck', ...vinc }, { k: 'yuksek', t: 'Yüksekte çalışma', i: 'hardhat', ...yuksek }, { k: 'cephe', t: 'Dış cephe sıva / boya', i: 'edit', ...cephe }, { k: 'hafriyat', t: 'Hafriyat', i: 'layers', ...hafriyat }];
  };
  const LV = { ok: ['Uygun', 'ok'], warn: ['Dikkat', 'warn'], bad: ['Uygun değil', 'bad'] };
  W.levelLabel = (l) => LV[l][0];

  /* Panel/şantiye seçici için kısa özet */
  W.brief = (pid) => { const t = W.target(pid), c = t && W.cache(t.key); if (!c) return null; const ds = W.days(c); if (!ds.length) return null; const d = ds[0], today = ds[0].date === U.today(), cur = c.data.cur; const code = today && cur && cur.code != null ? cur.code : d.code, tmp = today && cur && cur.t != null ? cur.t : d.tmax; const ds2 = W.desc(code); return { temp: Math.round(tmp), icon: ds2[1], label: ds2[0], tone: ds2[2], stale: Date.now() - c.at > 6 * 3600e3 }; };

  /* ---------- pano kartı ---------- */
  SS.css(`
  .wx{overflow:hidden;position:relative}.wx::before{content:"";position:absolute;inset:0;opacity:.55;pointer-events:none;background:var(--wxbg,none)}.wx>*{position:relative}
  .wx-sun{--wxbg:linear-gradient(135deg,color-mix(in srgb,#ffb347 24%,transparent),transparent 55%)}.wx-cloud{--wxbg:linear-gradient(135deg,color-mix(in srgb,#8fa3b8 22%,transparent),transparent 55%)}.wx-rain{--wxbg:linear-gradient(135deg,color-mix(in srgb,#3b82c4 24%,transparent),transparent 55%)}.wx-snow{--wxbg:linear-gradient(135deg,color-mix(in srgb,#a9c8e8 30%,transparent),transparent 55%)}.wx-storm{--wxbg:linear-gradient(135deg,color-mix(in srgb,#6a4fc7 26%,transparent),transparent 55%)}
  .wx-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:16px 18px 0}.wx-h h3{font-size:15.5px}.wx-h .sub{display:flex;gap:5px;align-items:center;margin-top:2px}.wx-h .sub .ic{width:13px;height:13px}
  .wx-b{padding:12px 18px 18px;display:grid;grid-template-columns:minmax(230px,300px) minmax(0,1fr);gap:18px;align-items:center}
  .wx-now{display:flex;gap:14px;align-items:center}.wx-ic{width:68px;height:68px;border-radius:20px;display:grid;place-items:center;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow);color:var(--brand);flex:none}.wx-ic .ic{width:38px;height:38px;stroke-width:1.6}
  .wx-t{font-size:44px;font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}.wx-d b{display:block;font-size:15px;margin-top:2px}.wx-d small{color:var(--muted);font-size:12.5px;line-height:1.5;display:block}
  .wx-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
  .wx-day{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px;border-radius:14px;border:1px solid transparent;background:var(--surface);cursor:pointer;font-size:12px;color:var(--muted);transition:transform .15s var(--ease),border-color .15s}.wx-day:hover{transform:translateY(-2px)}.wx-day.on{border-color:var(--brand);background:var(--brand-soft);color:var(--brand-text)}
  .wx-day b{font-size:13px;color:var(--ink);font-variant-numeric:tabular-nums}.wx-day .ic{width:22px;height:22px;color:var(--ink-2)}.wx-day .r{font-size:11px;color:var(--info-text);min-height:14px;display:flex;align-items:center;gap:2px}.wx-day .r .ic{width:10px;height:10px;color:currentColor}.wx-day em{font-style:normal;color:var(--muted)}
  .wx-s{padding:0 18px 18px}.wx-s .section-t{margin:0 0 8px}.wx-sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
  .ws{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:14px;background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--line)}.ws.ok{border-left-color:var(--ok)}.ws.warn{border-left-color:var(--warn)}.ws.bad{border-left-color:var(--bad)}
  .ws .kpi-ic{width:32px;height:32px;margin:0;border-radius:10px}.ws .kpi-ic .ic{width:17px;height:17px}.ws b{display:flex;gap:8px;align-items:center;font-size:13.5px;flex-wrap:wrap}.ws small{display:block;color:var(--muted);font-size:12.5px;line-height:1.35;margin-top:2px}
  .wx-foot{padding:0 18px 14px;color:var(--muted);font-size:12px}
  .wx-empty{display:flex;gap:18px;align-items:center;padding:18px;flex-wrap:wrap}.wx-empty .wx-ic{width:60px;height:60px}.wx-empty .grow{flex:1;min-width:220px}.wx-empty h3{font-size:16px}.wx-empty p{color:var(--muted);font-size:13.5px;margin-top:3px;line-height:1.45}
  .wx-sk{height:14px;border-radius:8px;background:linear-gradient(90deg,var(--track),var(--surface-2),var(--track));background-size:200% 100%;animation:wxsk 1.2s linear infinite}@keyframes wxsk{to{background-position:-200% 0}}
  .spin .ic{animation:spin .9s linear infinite}
  @media(max-width:899px){.wx-b{grid-template-columns:minmax(0,1fr)}}
  @media(max-width:560px){.wx-days{gap:3px}.wx-day{padding:7px 0}.wx-t{font-size:38px}}
  `);

  const hhmm = (ms) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const dayLabel = (date, i) => (date === U.today() ? 'Bugün' : date === U.addDays(U.today(), 1) ? 'Yarın' : ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][U.dow(date)]);
  const tmp = (x) => `${Math.round(x)}°`;

  W.cardInner = () => {
    const t = W.target(); if (!t) return '';
    const c = W.cache(t.key), s = W.status(t.key), on = SS.cfg.wxOn;
    const where = esc(t.q || '');
    if (t.missing) return `<div class="card wx wx-empty"><span class="wx-ic">${I('pin')}</span><div class="grow"><h3>Hava durumu için konum gerekli</h3><p>${t.p ? `<b>${esc(t.p.shortName || t.p.name)}</b> şantiyesinin konumu girilmemiş.` : 'Şantiye konumu girilmemiş.'} Bir yer adı (ör. Serdivan, Sakarya) ekleyin.</p></div><button class="btn primary" data-action="wx.city">${I('pin')}Konum ekle</button></div>`;
    if (!c && !on) return `<div class="card wx wx-empty"><span class="wx-ic">${I('sun')}</span><div class="grow"><h3>Saha hava durumu</h3><p>7 günlük tahmin ve <b>betonlama, vinç, iskele, sıva-boya, hafriyat</b> için iş uygunluğu. Etkinleştirince yalnızca şantiyenin yer adı (<b>${where}</b>) açık hava servisine (Open-Meteo) gönderilir; başka hiçbir veri gönderilmez. İnternet gerekir; son veri çevrimdışı da görünür.</p></div><div class="row wrap"><button class="btn primary" data-action="wx.enable">${I('sun')}Hava durumunu getir</button><button class="btn ghost" data-action="wx.city">${I('pin')}Yer adı</button></div></div>`;
    if (!c && s.loading) return `<div class="card wx"><div class="wx-h"><div><h3>Saha hava durumu</h3><span class="sub">${I('pin')}${where} · yükleniyor…</span></div></div><div class="wx-b"><div class="stack"><div class="wx-sk" style="width:70%;height:44px"></div><div class="wx-sk" style="width:90%"></div></div><div class="wx-sk" style="height:84px"></div></div></div>`;
    if (!c) return `<div class="card wx wx-empty"><span class="wx-ic">${I('cloud')}</span><div class="grow"><h3>Hava durumu alınamadı</h3><p>${esc(s.err || 'Bilinmeyen hata')}</p></div><div class="row wrap"><button class="btn primary" data-action="wx.refresh">${I('refresh')}Tekrar dene</button><button class="btn ghost" data-action="wx.city">${I('pin')}Yer adını düzelt</button></div></div>`;

    const days = W.days(c); if (!days.length) return `<div class="card wx wx-empty"><span class="wx-ic">${I('cloud')}</span><div class="grow"><h3>Hava verisi eskimiş</h3><p>Son güncelleme ${U.fmtDate(new Date(c.at).toISOString().slice(0, 10))}. İnternet bağlantısı olduğunda yenileyin.</p></div><button class="btn primary" data-action="wx.refresh">${I('refresh')}Yenile</button></div>`;
    const st = ui.vs('wx', { day: 0 }); if (st.day >= days.length) st.day = 0;
    const d = days[st.day], isToday = d.date === U.today(), cur = c.data.cur, code = isToday && cur && cur.code != null ? cur.code : d.code, ds = W.desc(code);
    const stale = Date.now() - c.at > TTL, suit = W.suit(d), label = dayLabel(d.date, st.day), long = U.fmtDateLong(d.date);
    const bigT = isToday && cur && cur.t != null ? cur.t : d.tmax;
    return `<div class="card wx wx-${ds[2]}"><div class="wx-h"><div><h3>Saha hava durumu</h3><span class="sub">${I('pin')}${esc(c.geo.name)} · ${s.loading ? 'güncelleniyor…' : `güncelleme ${hhmm(c.at)}`}${s.err ? ` · <b class="wrn" title="${esc(s.err)}">yenilenemedi</b>` : stale ? ' · <span class="wrn">eski veri</span>' : ''}</span></div>
        <div class="row"><button class="btn sm ghost ${s.loading ? 'spin' : ''}" data-action="wx.refresh" title="Yenile" aria-label="Yenile">${I('refresh')}</button><button class="btn sm ghost" data-action="wx.city" title="Yer adını değiştir" aria-label="Yer adı">${I('pin')}</button></div></div>
      <div class="wx-b"><div class="wx-now"><span class="wx-ic">${I(ds[1])}</span><div class="wx-d"><div class="wx-t">${tmp(bigT)}</div><b>${ds[0]}${isToday ? '' : ` · ${label}`}</b><small>${isToday && cur ? `Hissedilen ${tmp(cur.feels)} · ` : ''}Gün ${tmp(d.tmin)} / ${tmp(d.tmax)}<br>Rüzgâr ${Math.round(isToday && cur && cur.wind != null ? cur.wind : d.wind)} km/s${d.gust ? ` (hamle ${Math.round(d.gust)})` : ''}${isToday && cur && cur.hum != null ? ` · Nem %${Math.round(cur.hum)}` : ''}<br>Yağış ${d.rain >= 0.1 ? U.num(d.rain, 1) + ' mm' : 'yok'}${d.pop ? ` · ihtimal %${Math.round(d.pop)}` : ''}</small></div></div>
        <div class="wx-days">${days.map((x, i) => { const dd = W.desc(x.code); return `<button class="wx-day ${i === st.day ? 'on' : ''}" data-action="wx.day" data-d="${i}" aria-label="${dayLabel(x.date, i)}"><span>${dayLabel(x.date, i)}</span>${I(dd[1])}<b>${tmp(x.tmax)}</b><em>${tmp(x.tmin)}</em><span class="r">${x.rain >= 0.5 ? I('drop') + Math.round(x.rain) + ' mm' : ''}</span></button>`; }).join('')}</div></div>
      <div class="wx-s"><div class="section-t">${long} · iş uygunluğu</div><div class="wx-sg">${suit.map((x) => `<div class="ws ${x.level}"><span class="kpi-ic tone-${LV[x.level][1]}">${I(x.i)}</span><div><b>${x.t}<span class="badge ${LV[x.level][1]}">${LV[x.level][0]}</span></b><small>${esc(x.why)}</small></div></div>`).join('')}</div></div>
      <div class="wx-foot">Genel kılavuzdur; vinç rüzgâr sınırı, beton dökümü ve iş durdurma kararlarında üretici talimatı, şartname ve İSG uzmanı esastır. Veri: Open-Meteo.</div></div>`;
  };
  W.card = () => (SS.D.projects.length ? ui.region('wx-card', W.cardInner) : '');

  /* ---------- eylemler ---------- */
  SS.actions['wx.enable'] = () => { SS.cfg.wxOn = true; SS.store.save(); W.refresh(W.target(), true); ui.toast('Hava durumu etkinleştirildi', 'info'); };
  SS.actions['wx.refresh'] = () => { const t = W.target(); if (!t) return; if (!SS.cfg.wxOn) { SS.cfg.wxOn = true; SS.store.save(); } W.refresh(t, true); };
  SS.actions['wx.day'] = (el) => { ui.vs('wx', { day: 0 }).day = +el.dataset.d; ui.update('wx-card'); };
  SS.actions['wx.city'] = () => {
    const t = W.target(); if (!t) return ui.toast('Önce bir şantiye ekleyin', 'info');
    ui.form({ title: 'Hava durumu yeri', cls: 'small', values: { q: t.q }, submit: 'Kaydet ve getir',
      fields: [{ name: 'q', label: 'Yer adı', required: true, placeholder: 'ör. Serdivan, Sakarya', hint: 'İlçe, il biçiminde yazın. Yalnızca bu ad hava servisine gönderilir.' }],
      onSubmit(v) { if (t.p) SS.store.upd('projects', t.p.id, { geoName: v.q }); else { SS.cfg.city = v.q; SS.store.save(); } delete all()[t.key]; persist(); SS.cfg.wxOn = true; SS.store.save(); W.refresh(W.target(), true); ui.rerender(); } });
  };
  SS.actions['wx.off'] = () => { SS.cfg.wxOn = false; W.clear(); SS.store.save(); ui.rerender(); ui.toast('Hava durumu kapatıldı, önbellek temizlendi', 'info'); };
  /* defter formu: güncel hava bilgisini doldur */
  SS.actions['wx.fillDiary'] = async (el) => {
    const form = el.closest('form'); if (!form) return; const pid = form.elements.projectId && form.elements.projectId.value, date = form.elements.date && form.elements.date.value, t = W.target(pid);
    if (!t || t.missing) { ui.toast('Şantiyenin konumu girilmemiş', 'info'); return; }
    if (!SS.cfg.wxOn) { SS.cfg.wxOn = true; SS.store.save(); }
    el.disabled = true; await W.refresh(t, !W.cache(t.key)); el.disabled = false;
    const c = W.cache(t.key); if (!c) { ui.toast(W.status(t.key).err || 'Hava durumu alınamadı', 'bad'); return; }
    const d = c.data.days.find((x) => x.date === date); if (!d) { ui.toast('Bu tarih için tahmin yok (yalnızca bugün ve sonraki günler)', 'info'); return; }
    const today = date === U.today(), cur = c.data.cur, kind = W.diaryKind(today && cur && cur.code != null ? cur.code : d.code, d.wind), temp = Math.round(today && cur && cur.t != null ? cur.t : d.tmax);
    const r = form.querySelector(`input[name="weather"][value="${kind}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event('input', { bubbles: true })); }
    if (form.elements.temp) { form.elements.temp.value = temp; form.elements.temp.dispatchEvent(new Event('input', { bubbles: true })); }
    ui.toast(`${kind}, ${temp}°C olarak dolduruldu`);
  };

  /* ---------- uyarı kancası: yarın / bugün risk ---------- */
  C.alertHooks.push((out, today) => {
    if (!SS.cfg.wxOn) return; const t = W.target(); if (!t || t.missing) return; const c = W.cache(t.key); if (!c) return;
    const days = W.days(c).filter((d) => d.date <= U.addDays(today, 1)); const sevr = [];
    days.forEach((d) => { const bad = W.suit(d).filter((x) => x.level === 'bad'); if (bad.length) sevr.push({ d, bad }); });
    if (!sevr.length) return; const x = sevr[0], ds = W.desc(x.d.code);
    out.push({ mod: 'weather', level: 'warn', icon: ds[1], title: `${x.d.date === today ? 'Bugün' : 'Yarın'} hava riski: ${ds[0].toLowerCase()}`, text: x.bad.map((b) => b.t).join(', ') + ' için uygun değil', route: 'dashboard' });
  });
})();
