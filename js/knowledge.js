/* Şantiye Şefi — hesap motoru (metraj / malzeme) ve şantiye bilgi bankası. Hem "Rehber & Hesaplar" sayfası hem Şantiye AI kullanır. */
(function () {
  const SS = window.SS, U = SS.U;
  const T = (SS.tools = {});
  const n1 = (x, d = 1) => U.num(x, d), n0 = (x) => U.num(Math.round(x));
  const pos = (x) => (isFinite(x) && x > 0 ? x : 0);

  /* ---------- donatı ---------- */
  T.REBAR = [8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32];
  T.kgm = (d) => d * d * 0.006165;                  // kg/m  (π/4·d²·7850)
  T.areaCm2 = (d) => (Math.PI * d * d) / 4 / 100;   // kesit alanı (cm²)

  /* ---------- diyagram yardımcıları (referans görseller) ---------- */
  const S = 'var(--ink-2)', B = 'var(--brand)';
  const svg = (inner, vb = '0 0 200 120') => `<svg class="calc-art" viewBox="${vb}" role="img" aria-hidden="true">${inner}</svg>`;
  const box = (x, y, w, h, dx, dy, c = B) => `<g stroke="${S}" stroke-width="1.3" stroke-linejoin="round"><path d="M${x} ${y}h${w}v${h}h-${w}z" fill="${c}" fill-opacity=".3"/><path d="M${x} ${y}l${dx} -${dy}h${w}l-${dx} ${dy}z" fill="${c}" fill-opacity=".55"/><path d="M${x + w} ${y}l${dx} -${dy}v${h}l-${dx} ${dy}z" fill="${c}" fill-opacity=".15"/></g>`;
  const tx = (x, y, s, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="10" font-weight="700" fill="var(--ink)" font-family="inherit">${s}</text>`;
  const dim = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="var(--brand-text)" stroke-width="1.2" stroke-dasharray="3 2" fill="none"/>`;
  const ART = {
    plak: svg(`${box(34, 74, 104, 14, 40, 26)}${dim(34, 100, 138, 100)}${tx(86, 112, 'L (m)')}${dim(182, 70, 142, 96)}${tx(184, 84, 'W (m)', 'start')}${dim(24, 74, 24, 88)}${tx(22, 84, 't', 'end')}`),
    kolon: svg(`${box(84, 98, 30, 82, 18, 12)}${dim(76, 18, 76, 98)}${tx(72, 62, 'h', 'end')}${dim(84, 108, 114, 108)}${tx(99, 118, 'a')}${dim(118, 106, 132, 96)}${tx(138, 104, 'b', 'start')}`, '0 0 200 124'),
    kiris: svg(`${box(26, 66, 124, 18, 22, 14)}${dim(26, 96, 150, 96)}${tx(88, 110, 'L (m)')}${dim(18, 66, 18, 84)}${tx(14, 78, 'h', 'end')}${dim(150, 62, 172, 48)}${tx(176, 52, 'b', 'start')}`),
    demir: svg(`<g stroke="${S}" stroke-width="1.2"><rect x="14" y="48" width="172" height="14" rx="7" fill="var(--s3)" fill-opacity=".35"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${24 + i * 12} 48l6 14"/>`).join('')}<path d="M14 55h172" opacity=".5"/></g>${dim(14, 80, 186, 80)}${tx(100, 96, 'L (m)')}${tx(100, 38, 'Ø (mm) nervürlü donatı')}`),
    duvar: svg(`<g stroke="${S}" stroke-width="1.2" fill="${B}" fill-opacity=".28">${[0, 1, 2, 3, 4].map((r) => Array.from({ length: 6 }, (_, c) => `<rect x="${24 + c * 26 - (r % 2 ? 13 : 0)}" y="${16 + r * 14}" width="24" height="12" ${c === 0 && r % 2 ? 'display="none"' : ''}/>`).join('')).join('')}</g><path d="M24 14v74M180 14v74" stroke="none"/>${dim(24, 96, 180, 96)}${tx(102, 112, 'L (m)')}${dim(190, 16, 190, 86)}${tx(194, 54, 'H', 'start')}`),
    siva: svg(`<g stroke="${S}" stroke-width="1.2"><rect x="30" y="20" width="60" height="80" fill="var(--s4)" fill-opacity=".4"/><rect x="90" y="20" width="22" height="80" fill="var(--s1)" fill-opacity=".35"/><rect x="112" y="20" width="8" height="80" fill="${B}" fill-opacity=".6"/></g>${tx(60, 64, 'duvar')}${tx(101, 14, 'harç', 'middle')}${tx(116, 114, 'kaplama')}${dim(90, 108, 112, 108)}${tx(101, 120, 't (cm)')}`, '0 0 200 124'),
    boya: svg(`<g stroke="${S}" stroke-width="1.3"><rect x="40" y="26" width="100" height="26" rx="6" fill="${B}" fill-opacity=".55"/><path d="M140 39h22v28H100v18" fill="none"/><rect x="94" y="85" width="12" height="22" rx="3" fill="var(--s1)" fill-opacity=".5"/></g>${tx(100, 14, 'alan (m²) × kat sayısı')}`),
    seramik: svg(`<g stroke="${S}" stroke-width="1.2" fill="var(--s1)" fill-opacity=".22">${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${34 + c * 28}" y="${14 + r * 24}" width="26" height="22" rx="2"/>`).join('')).join('')}</g>${tx(100, 118, 'ölçü + fire payı')}`),
    hafriyat: svg(`<path d="M20 30h160l-28 50H48z" fill="var(--s4)" fill-opacity=".35" stroke="${S}" stroke-width="1.3"/><path d="M12 30h176" stroke="${S}" stroke-width="2"/>${dim(48, 92, 152, 92)}${tx(100, 108, 'taban', 'middle')}${dim(196, 30, 196, 80)}${tx(198, 58, 'd', 'start')}<g fill="${B}" stroke="${S}" stroke-width="1"><rect x="64" y="12" width="40" height="14" rx="2"/><rect x="104" y="18" width="14" height="8" rx="1"/><circle cx="74" cy="28" r="3.5"/><circle cx="108" cy="28" r="3.5"/></g>`, '0 0 204 120'),
    ekip: svg(`<g fill="${B}" fill-opacity=".7" stroke="${S}" stroke-width="1.2">${[50, 100, 150].map((x) => `<circle cx="${x}" cy="40" r="11"/><path d="M${x - 18} 90a18 22 0 0 1 36 0z"/><path d="M${x - 11} 36h22" stroke-width="3"/>`).join('')}</g>${tx(100, 112, 'kişi × verim × gün')}`),
    kdv: svg(`<circle cx="100" cy="58" r="40" fill="${B}" fill-opacity=".2" stroke="${S}" stroke-width="1.4"/><path d="M78 80 122 36" stroke="${S}" stroke-width="3" stroke-linecap="round"/><circle cx="82" cy="42" r="7" fill="none" stroke="${S}" stroke-width="3"/><circle cx="118" cy="74" r="7" fill="none" stroke="${S}" stroke-width="3"/>`),
    egim: svg(`<path d="M24 92h150V40z" fill="${B}" fill-opacity=".25" stroke="${S}" stroke-width="1.4" stroke-linejoin="round"/>${dim(24, 104, 174, 104)}${tx(100, 118, 'mesafe (m)')}${dim(184, 40, 184, 92)}${tx(188, 70, 'Δh', 'start')}`),
  };
  T.art = ART;

  const F = (k, l, u, v, extra = {}) => Object.assign({ k, l, u, v }, extra);
  const SEL = (k, l, options, v) => ({ k, l, select: options, v });

  /* ---------- hesaplayıcı tanımları ---------- */
  const BRICKS = [['t135', 'Yatay delikli tuğla 13,5 cm (19×19 yüz)', 19, 19, 13.5], ['t85', 'Yatay delikli tuğla 8,5 cm (19×19 yüz)', 19, 19, 8.5], ['t19', 'Yatay delikli tuğla 19 cm (19×19 yüz)', 19, 19, 19], ['g10', 'Gazbeton 10 cm (60×25 yüz)', 60, 25, 10], ['g135', 'Gazbeton 13,5 cm (60×25 yüz)', 60, 25, 13.5], ['g20', 'Gazbeton 20 cm (60×25 yüz)', 60, 25, 20], ['b', 'Bims briket 19×39 yüz, 19 cm kalın', 39, 19, 19]];
  const SOILS = [['1.12', 'Kum / çakıl (≈ %12 kabarma)'], ['1.25', 'Normal toprak (≈ %25 kabarma)'], ['1.35', 'Killi toprak (≈ %35 kabarma)'], ['1.5', 'Kaya / patlatma (≈ %50 kabarma)']];
  const TILES = [['30x30', '30×30 cm'], ['33x33', '33×33 cm'], ['45x45', '45×45 cm'], ['60x60', '60×60 cm'], ['30x60', '30×60 cm'], ['60x120', '60×120 cm']];
  const mortar = (m3, doz) => `${n0((m3 * doz) / 50)} torba`;

  T.defs = {
    plak: { title: 'Plak betonu (döşeme / radye / temel)', icon: 'layers', art: ART.plak, hint: 'Hazır beton siparişi için net hacim ve fireli hacim.',
      inputs: [F('L', 'Uzunluk', 'm', 12, { min: 0 }), F('W', 'Genişlik', 'm', 8, { min: 0 }), F('t', 'Kalınlık', 'cm', 20, { min: 0 }), F('n', 'Adet / kat sayısı', '', 1, { min: 1, step: 1 }), F('fire', 'Fire / emniyet payı', '%', 3, { min: 0 })],
      run(v) { const net = v.L * v.W * (v.t / 100) * (v.n || 1), tot = net * (1 + v.fire / 100), kalip = v.L * v.W * (v.n || 1) + 2 * (v.L + v.W) * (v.t / 100) * (v.n || 1);
        return { main: ['Sipariş edilecek beton', `${n1(tot, 2)} m³`], rows: [['Net hacim', `${n1(net, 2)} m³`], ['Fire dahil hacim', `${n1(tot, 2)} m³`], ['Yaklaşık ağırlık (betonarme 2,5 t/m³)', `${n1(tot * 2.5)} ton`], ['Transmikser (8 m³)', `≈ ${Math.ceil(tot / 8)} araç`], ['Kalıp alanı (alt + kenar)', `${n1(kalip)} m²`]] }; } },
    kolon: { title: 'Kolon / perde betonu', icon: 'building', art: ART.kolon, hint: 'Dikdörtgen kesit; dairesel kolon için a = b yerine eşdeğer alan girin.',
      inputs: [F('a', 'Kesit eni (a)', 'cm', 50, { min: 0 }), F('b', 'Kesit boyu (b)', 'cm', 50, { min: 0 }), F('h', 'Yükseklik', 'm', 2.8, { min: 0 }), F('n', 'Adet', '', 12, { min: 1, step: 1 }), F('fire', 'Fire payı', '%', 3, { min: 0 })],
      run(v) { const net = (v.a / 100) * (v.b / 100) * v.h * v.n, tot = net * (1 + v.fire / 100), kalip = 2 * (v.a / 100 + v.b / 100) * v.h * v.n;
        return { main: ['Sipariş edilecek beton', `${n1(tot, 2)} m³`], rows: [['Net hacim', `${n1(net, 2)} m³`], ['Fire dahil hacim', `${n1(tot, 2)} m³`], ['Kalıp alanı', `${n1(kalip)} m²`], ['Yaklaşık ağırlık', `${n1(tot * 2.5)} ton`]] }; } },
    kiris: { title: 'Kiriş betonu', icon: 'ruler', art: ART.kiris, hint: 'Döşeme kalınlığını girerseniz kiriş yüksekliğinden düşülür (çift sayım olmaz).',
      inputs: [F('b', 'Kiriş eni (b)', 'cm', 25, { min: 0 }), F('h', 'Kiriş yüksekliği (h)', 'cm', 50, { min: 0 }), F('ds', 'Döşeme kalınlığı', 'cm', 15, { min: 0 }), F('L', 'Toplam kiriş boyu', 'm', 60, { min: 0 }), F('fire', 'Fire payı', '%', 3, { min: 0 })],
      run(v) { const hn = Math.max(0, v.h - v.ds), net = (v.b / 100) * (hn / 100) * v.L, tot = net * (1 + v.fire / 100), kalip = (v.b / 100 + 2 * (hn / 100)) * v.L;
        return { main: ['Sipariş edilecek beton', `${n1(tot, 2)} m³`], rows: [['Net kiriş hacmi (döşeme altı)', `${n1(net, 2)} m³`], ['Fire dahil', `${n1(tot, 2)} m³`], ['Kalıp alanı (alt + 2 yan)', `${n1(kalip)} m²`]] }; } },
    demir: { title: 'Donatı (demir) ağırlığı', icon: 'ruler', art: ART.demir, hint: 'Nervürlü donatı birim ağırlığı: d² × 0,006165 kg/m.',
      inputs: [SEL('d', 'Çap (Ø)', T.REBAR.map((d) => [String(d), `Ø${d} mm`]), '12'), F('L', 'Çubuk boyu', 'm', 12, { min: 0 }), F('n', 'Adet', '', 100, { min: 0, step: 1 }), F('fire', 'Bindirme / fire', '%', 5, { min: 0 })],
      run(v) { const d = +v.d, m = v.L * v.n, kg = m * T.kgm(d), tot = kg * (1 + v.fire / 100);
        return { main: ['Toplam ağırlık (fire dahil)', `${n0(tot)} kg`], rows: [['Birim ağırlık', `${n1(T.kgm(d), 3)} kg/m`], ['Toplam boy', `${n0(m)} m`], ['Net ağırlık', `${n0(kg)} kg`], ['Fire dahil', `${n1(tot / 1000, 3)} ton`], ['12 m\'lik çubuk adedi', `≈ ${Math.ceil((m * (1 + v.fire / 100)) / 12)} adet`]] }; } },
    duvar: { title: 'Duvar malzemesi (tuğla / briket / gazbeton)', icon: 'grid', art: ART.duvar, hint: 'Adet, derz boşluğuna göre hesaplanır; harç hacmi duvar hacminden birim hacimleri çıkararak bulunur.',
      inputs: [F('L', 'Duvar uzunluğu', 'm', 20, { min: 0 }), F('H', 'Duvar yüksekliği', 'm', 2.7, { min: 0 }), F('bos', 'Boşluk (kapı + pencere)', 'm²', 6, { min: 0 }), SEL('tip', 'Duvar malzemesi', BRICKS.map((b) => [b[0], b[1]]), 't135'), F('derz', 'Derz kalınlığı', 'cm', 1, { min: 0, step: 0.1 }), F('fire', 'Kırık / fire', '%', 5, { min: 0 }), F('doz', 'Harç çimento dozajı', 'kg/m³', 350, { min: 0 })],
      run(v) { const b = BRICKS.find((x) => x[0] === v.tip) || BRICKS[0], A = pos(v.L * v.H - v.bos), j = v.derz / 100, w = b[2] / 100, h = b[3] / 100, th = b[4] / 100;
        const per = 1 / ((w + j) * (h + j)), N = A * per, Nf = N * (1 + v.fire / 100), vol = A * th, mort = pos(vol - N * w * h * th), kum = mort * 1.1;
        return { main: ['Gerekli birim (fire dahil)', `${n0(Nf)} adet`], rows: [['Net duvar alanı', `${n1(A)} m²`], ['m² başına adet', `${n1(per)} adet`], ['Net adet', `${n0(N)} adet`], ['Harç hacmi', `${n1(mort, 2)} m³`], ['Çimento (harç)', `≈ ${mortar(mort, v.doz)} (50 kg)`], ['Kum (yaklaşık 1,1 m³/m³ harç)', `≈ ${n1(kum, 1)} m³`]] }; } },
    siva: { title: 'Sıva / şap / harçlı işler', icon: 'layers', art: ART.siva, hint: 'Alan × kalınlık = harç hacmi; çimento ve kum yaklaşık dozaj varsayımıyla bulunur.',
      inputs: [F('A', 'Uygulama alanı', 'm²', 200, { min: 0 }), F('t', 'Kalınlık', 'cm', 2, { min: 0, step: 0.5 }), F('doz', 'Çimento dozajı', 'kg/m³', 350, { min: 0 }), F('fire', 'Fire / dökülme', '%', 10, { min: 0 })],
      run(v) { const m3 = v.A * (v.t / 100) * (1 + v.fire / 100);
        return { main: ['Harç hacmi (fire dahil)', `${n1(m3, 2)} m³`], rows: [['Net harç hacmi', `${n1(v.A * (v.t / 100), 2)} m³`], ['Çimento', `≈ ${mortar(m3, v.doz)} (50 kg)`], ['Çimento ağırlığı', `≈ ${n0(m3 * v.doz)} kg`], ['Kum (yaklaşık 1,1 m³/m³ harç)', `≈ ${n1(m3 * 1.1, 1)} m³`]] }; } },
    boya: { title: 'Boya & astar', icon: 'edit', art: ART.boya, hint: 'Verim ürün etiketindeki m²/L değeridir (genelde 8–12 m²/L/kat).',
      inputs: [F('A', 'Boyanacak alan', 'm²', 400, { min: 0 }), F('kat', 'Kat sayısı', '', 2, { min: 1, step: 1 }), F('ver', 'Verim', 'm²/L', 9, { min: 0.1, step: 0.5 }), F('kova', 'Kova hacmi', 'L', 15, { min: 1 })],
      run(v) { const L = (v.A * v.kat) / v.ver;
        return { main: ['Gerekli boya', `${n1(L, 1)} L`], rows: [['Toplam uygulama alanı', `${n0(v.A * v.kat)} m²`], ['Kova sayısı', `${Math.ceil(L / v.kova)} adet (${v.kova} L)`]] }; } },
    seramik: { title: 'Seramik / fayans / kaplama', icon: 'grid', art: ART.seramik, hint: 'Düz döşemede %5–10, çapraz / desenli döşemede %12–15 fire payı yaygındır.',
      inputs: [F('A', 'Kaplanacak alan', 'm²', 80, { min: 0 }), SEL('s', 'Ürün ölçüsü', TILES, '60x60'), F('fire', 'Fire payı', '%', 10, { min: 0 }), F('kutu', 'Kutudaki alan', 'm²', 1.44, { min: 0.1, step: 0.01 })],
      run(v) { const [a, b] = v.s.split('x').map(Number), per = (a / 100) * (b / 100), A = v.A * (1 + v.fire / 100);
        return { main: ['Sipariş alanı (fire dahil)', `${n1(A, 1)} m²`], rows: [['Adet', `≈ ${n0(A / per)} adet`], ['Kutu', `≈ ${Math.ceil(A / v.kutu)} kutu`], ['Fire miktarı', `${n1(A - v.A, 1)} m²`]] }; } },
    hafriyat: { title: 'Hafriyat & nakliye', icon: 'truck', art: ART.hafriyat, hint: 'Kazılan zemin kabarır; kamyon sayısı kabarmış hacme göre hesaplanır.',
      inputs: [F('L', 'Kazı uzunluğu', 'm', 30, { min: 0 }), F('W', 'Kazı genişliği', 'm', 20, { min: 0 }), F('d', 'Kazı derinliği', 'm', 3.5, { min: 0 }), SEL('k', 'Zemin cinsi', SOILS, '1.25'), F('kap', 'Kamyon kapasitesi', 'm³', 15, { min: 1 })],
      run(v) { const vol = v.L * v.W * v.d, loose = vol * +v.k;
        return { main: ['Kamyon seferi', `≈ ${Math.ceil(loose / v.kap)} sefer`], rows: [['Yerinde (sıkışık) hacim', `${n0(vol)} m³`], ['Kabarmış hacim', `${n0(loose)} m³`], ['Yaklaşık ağırlık (1,8 t/m³ yerinde)', `${n0(vol * 1.8)} ton`]] }; } },
    ekip: { title: 'Süre & işçilik planı', icon: 'users', art: ART.ekip, hint: 'İş miktarı ve ekip verimine göre süre ve işçilik maliyeti.',
      inputs: [F('q', 'İş miktarı', 'birim', 800, { min: 0 }), F('v', 'Günlük verim (kişi başı)', 'birim/gün', 12, { min: 0.1, step: 0.5 }), F('n', 'Çalışan sayısı', 'kişi', 6, { min: 1, step: 1 }), F('w', 'Günlük yevmiye', '₺', 1500, { min: 0 })],
      run(v) { const days = v.q / (v.v * v.n), cost = Math.ceil(days) * v.n * v.w;
        return { main: ['Tahmini süre', `${Math.ceil(days)} iş günü`], rows: [['Hesaplanan süre', `${n1(days, 1)} gün`], ['Haftalık takvim (6 gün)', `≈ ${n1(days / 6, 1)} hafta`], ['İşçilik maliyeti', U.money(cost)], ['Birim işçilik maliyeti', U.money2(cost / (v.q || 1))]] }; } },
    kdv: { title: 'KDV & tevkifat', icon: 'percent', art: ART.kdv, hint: 'Yapım işlerinde tevkifat uygulanıyorsa genellikle 4/10 oranındadır; durumunuza göre mali müşavire danışın.',
      inputs: [F('tutar', 'Tutar', '₺', 100000, { min: 0 }), SEL('oran', 'KDV oranı', [['1', '%1'], ['10', '%10'], ['20', '%20']], '20'), SEL('yon', 'Tutar nedir?', [['hariç', 'KDV hariç tutar'], ['dahil', 'KDV dahil tutar']], 'hariç'), SEL('tev', 'KDV tevkifatı', [['0', 'Yok'], ['0.2', '2/10'], ['0.4', '4/10'], ['0.5', '5/10'], ['0.7', '7/10'], ['0.9', '9/10']], '0')],
      run(v) { const r = +v.oran / 100, mat = v.yon === 'dahil' ? v.tutar / (1 + r) : v.tutar, kdv = mat * r, tev = kdv * +v.tev;
        return { main: ['Toplam (KDV dahil)', U.money2(mat + kdv)], rows: [['Matrah (KDV hariç)', U.money2(mat)], [`KDV (%${v.oran})`, U.money2(kdv)], ['Tevkifat edilen KDV', U.money2(tev)], ['Satıcıya ödenecek', U.money2(mat + kdv - tev)]] }; } },
    egim: { title: 'Eğim & kot farkı', icon: 'trend', art: ART.egim, hint: 'Kanalizasyon, drenaj ve rampa eğimleri için.',
      inputs: [F('dh', 'Kot farkı (Δh)', 'cm', 30, { min: 0 }), F('L', 'Yatay mesafe', 'm', 20, { min: 0.01 })],
      run(v) { const e = v.dh / 100 / v.L;
        return { main: ['Eğim', `%${n1(e * 100, 2)}`], rows: [['Binde', `‰${n1(e * 1000, 1)}`], ['Açı', `${n1((Math.atan(e) * 180) / Math.PI, 2)}°`], ['1 m\'de düşüş', `${n1(e * 100, 2)} cm`]] }; } },
  };
  T.order = ['plak', 'kolon', 'kiris', 'demir', 'duvar', 'siva', 'seramik', 'boya', 'hafriyat', 'ekip', 'kdv', 'egim'];
  T.defaults = (id) => Object.fromEntries(T.defs[id].inputs.map((i) => [i.k, i.v]));
  T.run = (id, vals) => { const d = T.defs[id], v = Object.assign(T.defaults(id), vals); d.inputs.forEach((i) => { if (!i.select) v[i.k] = +v[i.k] || 0; }); return d.run(v); };

  /* Donatı metraj cetveli (çok satırlı) */
  T.rebarList = (rows) => {
    const by = {}; rows.forEach((r) => { const d = +r.d, m = (+r.L || 0) * (+r.n || 0); if (!d || !m) return; by[d] = (by[d] || 0) + m; });
    const list = Object.entries(by).map(([d, m]) => ({ d: +d, m, kg: m * T.kgm(+d) })).sort((a, b) => a.d - b.d);
    return { list, kg: U.sum(list, (x) => x.kg), m: U.sum(list, (x) => x.m) };
  };

  /* ---------- bilgi bankası (genel uygulama bilgisi; proje şartnamesi esastır) ---------- */
  const NOTE = '<br><span class="sub">Genel uygulama bilgisidir; projenizin statik raporu, şartname ve yapı denetim kararları esastır.</span>';
  T.kb = [
    { t: 'Beton sınıfı (C25/30) ne demek?', kw: 'beton sinif c25 c30 c20 c35 dayanim mpa silindir kup', a: '<b>C25/30</b> gösteriminde ilk sayı 28 günlük karakteristik <b>silindir</b> dayanımını (25 MPa), ikinci sayı <b>küp</b> dayanımını (30 MPa) verir. Yaygın sınıflar: C16/20 (grobeton/temizlik betonu), C25/30 (normal betonarme), C30/37 ve üzeri (yüksek yapı, ön gerilmeli). TBDY 2018, deprem etkisindeki betonarme taşıyıcı elemanlarda en az C25/30 öngörür.' + NOTE },
    { t: 'Beton kürü / bakımı nasıl yapılır?', kw: 'kur bakim sulama nemli beton priz catlak', a: 'Taze beton dökümden sonra en az <b>7 gün</b> nemli tutulmalı (sulama, ıslak bez/jüt, kür malzemesi veya plastik örtü); sıcak ve rüzgârlı havada ilk saatlerden itibaren yüzey kurumamalı. Soğukta (yaklaşık 5 °C altı) betonu donmaya karşı koruyun; sıcakta (yaklaşık 30 °C üstü) buharlaşma ve priz hızlanmasına dikkat edin.' + NOTE },
    { t: 'Beton numunesi nasıl alınır, ne zaman kırılır?', kw: 'numune kirim kup 7 gun 28 gun laboratuvar beton test', a: 'Döküm sırasında 15×15×15 cm küp numuneler (genelde 3\'lü set) hazır beton kamyonundan, boşaltmanın ortasında alınır; kalıpta 24 saat bekletilip kür havuzuna alınır. <b>7. gün</b> erken dayanım, <b>28. gün</b> esas dayanım için kırılır. Sıklık (günlük döküm, sınıf ve 100 m³ gibi) için yapı denetim ve şartname esastır. <a href="#/concrete">Beton & Numune takibi</a> modülünden tarihleri otomatik izleyebilirsiniz.' + NOTE },
    { t: 'Slump (çökme) değeri nedir?', kw: 'slump cokme kivam s3 s4 su ilave pompa', a: 'Taze betonun işlenebilirliğidir. TS EN 206 sınıfları: S1 10–40 mm, S2 50–90, <b>S3 100–150</b>, <b>S4 160–210</b>, S5 ≥ 220 mm. Konut betonunda genellikle S3–S4, pompalı dökümde S4 tercih edilir. Şantiyede <b>suyla kıvam artırmayın</b>: dayanımı ve dayanıklılığı düşürür.' + NOTE },
    { t: 'Donatı çapına göre metre ağırlığı', kw: 'demir donati cap agirlik kg metre nervurlu b420c b500c', a: 'Nervürlü donatı birim ağırlığı <b>d² × 0,006165 kg/m</b>: Ø8 0,395 · Ø10 0,617 · Ø12 0,888 · Ø14 1,208 · Ø16 1,578 · Ø18 1,998 · Ø20 2,466 · Ø22 2,984 · Ø25 3,853 · Ø28 4,834 · Ø32 6,313 kg/m. Boylar genelde 12 m\'dir; sınıflar B420C ve B500C. Ayrıntılı tablo için <a href="#/guide">Rehber & Hesaplar</a>.' },
    { t: 'Hakediş nasıl hesaplanır, kesintiler nelerdir?', kw: 'hakedis kesinti teminat damga vergisi avans kdv tevkifat', a: 'Brüt hakediş = sözleşme bedeli × (kümülatif % − önceki kümülatif %). Kesintiler: <b>teminat</b> (sözleşmedeki oran), <b>damga vergisi</b> (binde 9,48), <b>avans mahsubu</b> ve diğer kesintiler; ardından KDV eklenir (tevkifat varsa ayrıca düşülür). Uygulamadaki <a href="#/hakedis">Hakediş</a> modülü bunları otomatik hesaplar.' + NOTE },
    { t: 'İş kazası kime, ne zaman bildirilir?', kw: 'is kazasi bildirim sgk 3 is gunu 112 olumlu yaralanma', a: 'İş kazası, işveren tarafından kazadan sonraki <b>3 iş günü içinde SGK\'ya</b> bildirilmelidir. Ölümlü veya ağır yaralanmalı kazalar <b>derhal</b> ilgili mercilere (kolluk, SGK/Çalışma ve Sosyal Güvenlik il müdürlüğü) bildirilir. Acil durumda <b>112</b>; yangında 110. Kaza sonrası tutanak, tanık ve fotoğraf kaydı tutun.' + NOTE },
    { t: 'Hangi KKD zorunlu? (baret, ayakkabı, gözlük…)', kw: 'kkd baret ayakkabi eldiven gozluk kulaklik yelek maske kisisel koruyucu', a: 'Şantiyede asgari KKD: <b>baret</b> (TS EN 397), <b>çelik burunlu iş ayakkabısı</b>, <b>reflektif yelek</b>, eldiven. İşe göre: koruyucu gözlük (kesme/taşlama), toz maskesi (sıva, kesme), <b>kulak koruyucu</b> (85 dB(A) ve üzerinde zorunlu, 80 dB(A) üzerinde işveren sağlar), emniyet kemeri (yüksekte çalışma). Levha görselleri için <a href="#/guide">Rehber & Hesaplar → İSG Levhaları</a>.' + NOTE },
    { t: 'Yüksekte çalışma ve iskele güvenliği', kw: 'iskele yuksekte calisma korkuluk dusme emniyet kemeri yasam hatti', a: 'Düşme riski olan kenar ve boşluklarda standart <b>korkuluk, ara korkuluk ve topuk tahtası</b> bulunmalı; asansör/merdiven boşlukları kapatılmalı. İskele kurulduktan sonra ve kullanımdan önce yetkili kişice kontrol edilir (etiketleme: kullanıma uygun / uygun değil). Korkuluk yapılamıyorsa <b>yaşam hattı + emniyet kemeri</b> kullanın. Her gün <a href="#/safety">İSG kontrol listesini</a> doldurun.' + NOTE },
    { t: 'Kule vinç / kaldırma güvenliği', kw: 'vinc kule vinc operator rüzgar ruzgar halat kanca isaretci kaldirma', a: 'Vinç operatörü ve işaretçinin belgeli olması, periyodik kontrol raporunun güncel olması, halat-kanca-sapan kontrolü ve <b>üreticinin rüzgâr hızı sınırı</b> aşıldığında çalışmanın durdurulması gerekir. Yükün altında kimse bulunmamalı, kaldırma sahası bariyerlenmelidir.' + NOTE },
    { t: 'Soğuk / sıcak havada betonlama', kw: 'soguk hava sicak hava donma betonlama sicaklik yagmur don antifriz', a: 'Soğukta: karışım suyu/agrega ısıtma, kalıp ve donatıdan buz-kar temizliği, dökümden sonra yalıtımlı örtü; beton donmamalı. Sıcakta: serin agrega/su, geç saat veya gece dökümü, sunî gölge, erken ve yoğun kür. Yağmurda döküm yapmayın; dökülmüş yüzeyi örtün. Hava durumunu <a href="#/dashboard">panoda</a> takip edin.' + NOTE },
    { t: 'Kalıp ve iksa/kazı güvenliği', kw: 'kalip sokum kazi sev iksa hafriyat cokme', a: 'Kalıp, beton yeterli dayanıma ulaşmadan sökülmemelidir (söküm zamanını statik proje/şartname ve numune sonuçları belirler). Derin kazılarda şev eğimi veya iksa kullanın, kazı kenarına malzeme ve araç yığmayın, kazıya güvenli iniş/çıkış (merdiven) sağlayın, yağış sonrası şevi yeniden kontrol edin.' + NOTE },
    { t: 'EAC / tahmini bitiş maliyeti nedir?', kw: 'eac tahmini bitis maliyet butce asimi projeksiyon cpi', a: 'Mevcut harcama hızı ve fiziksel ilerleme ile projenin <b>tamamlandığında ne kadara mal olacağının</b> tahminidir: <b>EAC ≈ harcanan ÷ ilerleme %</b>. Bütçeden büyükse aşım riski vardır. Şantiye AI\'ya "bütçe aşar mıyız?" diye sorarak şantiyeniz için hesaplatabilirsiniz.' },
    { t: 'Şantiye defteri ne işe yarar?', kw: 'santiye defteri gunluk rapor defter kayit tutanak', a: 'Günlük defter; hava, çalışan sayısı, yapılan işler, iş durmaları ve fotoğrafları kayda geçirir; gecikme/uzatma taleplerinde ve anlaşmazlıklarda <b>delil</b> niteliği taşır. Uygulamadaki defter dahili günlüğünüzdür; resmî defterlerin (yapı denetim vb.) yerini tutmaz.' },
    { t: 'Çimento ve malzeme depolama', kw: 'cimento depolama nem torba palet istif malzeme depo', a: 'Çimento nemden korunaklı, zeminle temas etmeyen (paletli) kapalı alanda ve geliş sırasına göre (ilk gelen ilk çıkar) kullanılmalı; topaklanmış çimento kullanılmaz. Standart torba <b>50 kg</b>\'dır. Demir toprağa ve suya temas etmeyecek şekilde takozlarla istiflenmeli, kum/mıcır birbirine karışmamalıdır.' },
  ];
  const norm = U.norm;
  T.searchKb = (q) => {
    const KS = ['nasil', 'nedir', 'nelerdir', 'demek', 'hangi', 'icin', 'gore', 'gibi', 'kadar', 'neden', 'zaman', 'olarak', 'yapilir', 'yapilmali', 'nelere', 'dikkat', 'durum', 'durumu', 'onumuzdeki', 'bugun', 'daha', 'cok', 'var', 'yok', 'bana', 'bize', 'olur', 'olan', 'tum', 'kac', 'ise', 'yarar', 'neler', 'ben', 'sen', 'bir', 'ile', 'mi', 'mu', 'gidiyor', 'toplam', 'maliyet', 'maliyetimiz', 'gunluk', 'son', 'bekleyen', 'ver', 'verir', 'soyle'];
    const words = norm(q).split(' ').filter((w) => w.length > 2 && !KS.includes(w)), res = [];
    res.score = 0; if (!words.length) return res;
    const list = T.kb.map((e) => { const hay = norm(e.t + ' ' + e.kw), title = norm(e.t); let s = 0; words.forEach((w) => { const st = w.length > 5 ? w.slice(0, w.length - 2) : w; if (hay.includes(st)) s += st.length > 4 ? 2 : 1; if (title.includes(st)) s += 1; }); return { e, s }; }).filter((x) => x.s >= 2).sort((a, b) => b.s - a.s);
    list.forEach((x) => res.push(x.e)); res.score = list.length ? list[0].s : 0; return res;
  };
})();
