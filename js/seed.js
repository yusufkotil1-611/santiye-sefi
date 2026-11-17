/* Şantiye Şefi — gerçekçi örnek veri (Sakarya Vadi Konutları – 3 Blok 48 Daire ve diğer şantiyeler) */
(function () {
  const SS = window.SS, U = SS.U;

  function sitePhoto(k) {
    const floors = 3 + (k % 3), sky = ['#9ec9ec', '#c9d6e2', '#a9bfd1'][k % 3];
    let b = '';
    for (let i = 0; i <= floors; i++) b += `<rect x="190" y="${400 - i * 52}" width="360" height="9" fill="#9aa0a6"/>`;
    for (let i = 0; i < floors; i++) for (let j = 0; j < 5; j++) b += `<rect x="${196 + j * 88}" y="${352 - i * 52}" width="9" height="48" fill="#b7bcc2"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#eef2f5"/></linearGradient></defs>
    <rect width="800" height="520" fill="url(#s)"/><circle cx="660" cy="90" r="34" fill="#fff6d6" opacity=".9"/><rect y="409" width="800" height="111" fill="#8d8270"/><rect y="409" width="800" height="6" fill="#6f6556"/>${b}
    <rect x="620" y="60" width="8" height="350" fill="#e8892b"/><rect x="420" y="60" width="300" height="7" fill="#e8892b"/><path d="M620 60 520 67M620 60l60 7" stroke="#c2500a" stroke-width="2"/><rect x="500" y="67" width="2" height="${70 + k * 18}" fill="#333"/><rect x="490" y="${137 + k * 18}" width="22" height="14" fill="#c2500a"/>
    <rect x="60" y="360" width="90" height="49" fill="#d9dde1"/><rect x="72" y="372" width="22" height="22" fill="#7aa6c9"/><rect x="600" y="385" width="120" height="24" fill="#e5b84a"/></svg>`;
  }

  SS.seed = {
    async run() {
      SS.store.fresh(); const D = SS.D;
      const rnd = U.rng(20260117), r = () => rnd(), ri = (a, b) => Math.floor(a + r() * (b - a + 1)), pick = (a) => a[Math.floor(r() * a.length)];
      let n = 0; const id = (p) => p + (++n).toString(36);
      const T = U.today(), ago = (k) => U.addDays(T, -k), fwd = (k) => U.addDays(T, k), round = (v, s = 100) => Math.round(v / s) * s;
      const add = (c, o) => { o.id = o.id || id(c[0]); D[c].push(o); return o; };

      /* ---------------- firmalar ---------------- */
      const F = {};
      const firm = (k, name, type, phone) => (F[k] = add('firms', { id: 'f_' + k, name, type, phone, contact: '' }).id);
      firm('beton', 'Sakarya Hazır Beton A.Ş.', 'Tedarikçi', '0264 276 40 10'); firm('demir', 'Marmara Demir Çelik Tic. Ltd.', 'Tedarikçi', '0264 291 12 45');
      firm('market', 'Adapazarı Yapı Market', 'Tedarikçi', '0264 274 33 21'); firm('nakliye', 'Serdivan Nakliyat Ltd. Şti.', 'Tedarikçi', '0532 411 22 08');
      firm('cimento', 'Özkan Yapı – Çimento Bayii', 'Tedarikçi', '0264 281 90 14'); firm('kereste', 'Gürsoy Kereste & Kalıp', 'Tedarikçi', '0264 295 77 30');
      firm('seramik', 'Seramik Dünyası', 'Tedarikçi', '0264 278 61 02'); firm('tesisatm', 'Aydın Tesisat Malzemeleri', 'Tedarikçi', '0264 272 18 56');
      firm('elektrikm', 'Başaran Elektrik Malzeme', 'Tedarikçi', '0264 273 44 90'); firm('boya', 'Kardelen Boya & Alçı', 'Tedarikçi', '0264 283 02 71');
      firm('tas', 'Hendek Taş Ocağı (Kum-Mıcır)', 'Tedarikçi', '0264 614 20 03'); firm('akaryakit', 'Sakarya Akaryakıt Petrol', 'Tedarikçi', '0264 270 55 12');
      firm('yilmaz', 'Yılmaz Yapı Taşeron (Kaba İnşaat)', 'Taşeron', '0533 622 17 45'); firm('aydin', 'Aydın Tesisat Taahhüt', 'Taşeron', '0535 710 22 36');
      firm('basaran', 'Başaran Elektrik Taahhüt', 'Taşeron', '0536 344 18 20'); firm('karaman', 'Karaman Sıva & Boya', 'Taşeron', '0537 902 61 14');
      firm('demirel', 'Demirel Çelik Doğrama', 'Taşeron', '0538 455 09 73'); firm('asansor', 'Yükseliş Asansör A.Ş.', 'Taşeron', '0264 502 19 88');
      firm('belediye', 'Serdivan Belediyesi', 'Kurum', '0264 295 00 00'); firm('sgk', 'SGK Sakarya İl Müdürlüğü', 'Kurum', '0264 274 30 40');
      firm('sedas', 'SEDAŞ Elektrik Dağıtım', 'Kurum', '186'); firm('vergi', 'Sakarya Vergi Dairesi', 'Kurum', '0264 274 18 00');
      firm('lojistik', 'Hendek Lojistik A.Ş. (İşveren)', 'Müşteri', '0264 614 77 00');

      /* ---------------- projeler ---------------- */
      const bud = (a) => Object.fromEntries(SS.C.cats.map((c, i) => [c, a[i]]));
      const blocks = (list) => list.map((b) => ({ id: id('b'), name: b[0], floors: b[1].map((p, i) => ({ name: b[2][i], progress: p })) }));
      const fl = ['Temel', '1. Kat', '2. Kat', '3. Kat', '4. Kat', 'Çatı & Cephe'];
      const P1 = 'p_vadi', P2 = 'p_depo', P3 = 'p_sosyal', P4 = 'p_villa';
      add('projects', { id: P1, name: 'Sakarya Vadi Konutları – 3 Blok 48 Daire', shortName: 'Sakarya Vadi Konutları', location: 'Serdivan / Sakarya', status: 'active', start: ago(420), end: fwd(250), area: 7800, owner: 'Vadi Yapı İnşaat A.Ş. (kendi projemiz)', manager: 'Şantiye Şefi', totalBudget: 167e6,
        budget: bud([52e6, 21e6, 34e6, 42e6, 4e6, 6e6, 8e6]), blocks: blocks([['A Blok', [100, 100, 100, 85, 60, 25], fl], ['B Blok', [100, 100, 80, 50, 20, 0], fl], ['C Blok', [100, 90, 45, 15, 0, 0], fl]]) });
      add('projects', { id: P2, name: 'Hendek Lojistik Deposu', shortName: 'Hendek Depo Projesi', location: 'Hendek / Sakarya', status: 'active', start: ago(210), end: fwd(130), area: 6400, owner: 'Hendek Lojistik A.Ş.', manager: 'Şantiye Şefi', totalBudget: 58e6,
        budget: bud([19e6, 9e6, 8e6, 12e6, 2.5e6, 3e6, 4.5e6]), blocks: blocks([['Ana Bina', [100, 85, 60, 25, 5], ['Temel', 'Çelik Karkas', 'Çatı', 'Cephe', 'İç Mekân']]]) });
      add('projects', { id: P3, name: 'Akyazı Sosyal Tesis ve Spor Salonu', shortName: 'Akyazı Sosyal Tesis', location: 'Akyazı / Sakarya', status: 'planned', start: fwd(40), end: fwd(400), area: 3200, owner: 'Akyazı Belediyesi', manager: 'Şantiye Şefi', totalBudget: 24e6, budget: bud([7.5e6, 3.5e6, 4e6, 5e6, 1e6, 1.2e6, 1.8e6]), progress: 0, blocks: [] });
      add('projects', { id: P4, name: 'Karasu Sahil Villaları (12 Villa)', shortName: 'Karasu Sahil Villaları', location: 'Karasu / Sakarya', status: 'done', start: ago(700), end: ago(60), area: 3900, owner: 'Karasu Turizm Yatırım', manager: 'Şantiye Şefi', totalBudget: 41e6, budget: bud([12e6, 6e6, 9e6, 8e6, 1.5e6, 1.8e6, 2.7e6]), progress: 100, blocks: [] });

      /* ---------------- iş kalemleri ---------------- */
      const task = (pid, name, s, e, pr, crit, who) => add('tasks', { projectId: pid, name, start: s, end: e, progress: pr, critical: crit, assignee: who });
      task(P1, 'B Blok 3. kat kalıp-demir-beton', ago(20), fwd(5), 80, true, 'Yılmaz Yapı');
      task(P1, 'C Blok 2. kat perde duvar kalıbı', ago(30), ago(3), 90, true, 'Yılmaz Yapı');
      task(P1, 'A Blok 4. kat tuğla duvar örgüsü', ago(25), fwd(10), 70, false, 'Usta İbrahim Y.');
      task(P1, 'A Blok mekanik tesisat kaba montaj', ago(50), fwd(18), 75, false, 'Aydın Tesisat');
      task(P1, 'A Blok elektrik kablo çekimi', ago(35), fwd(22), 55, false, 'Başaran Elektrik');
      task(P1, 'A Blok çatı yalıtım ve kaplama', ago(8), fwd(30), 25, true, 'Yılmaz Yapı');
      task(P1, 'A Blok dış cephe mantolama', fwd(14), fwd(80), 0, false, 'Taşeron seçimi');
      task(P1, 'Asansör montajı (3 adet)', fwd(45), fwd(120), 0, true, 'Yükseliş Asansör');
      task(P1, 'Yangın tesisatı projesi onayı', ago(40), fwd(9), 85, true, 'İtfaiye / Belediye');
      task(P1, 'Peyzaj ve çevre düzenlemesi', fwd(150), fwd(235), 0, false, '—');
      task(P2, 'Çelik karkas montajı – 3. aks grubu', ago(25), fwd(12), 60, true, 'Çelik Ekibi');
      task(P2, 'Çatı sandviç panel kaplaması', ago(5), fwd(35), 20, true, 'Demirel Doğrama');
      task(P2, 'Zemin betonu (silim) – B bölgesi', ago(12), ago(2), 75, false, 'Kendi ekip');
      task(P3, 'İmar durumu ve ruhsat başvurusu', ago(20), fwd(30), 55, true, 'Mimar / Belediye');
      task(P3, 'Zemin etüdü ve sondaj', fwd(10), fwd(40), 0, false, 'Jeoteknik firma');

      /* ---------------- sözleşmeler & hakediş ---------------- */
      const CT = {};
      const contract = (k, o) => (CT[k] = add('contracts', Object.assign({ id: 'c_' + k, status: 'Aktif', docs: [], advance: 0, retention: 5, terms: '' }, o)));
      contract('kaba', { projectId: P1, firmId: F.yilmaz, title: 'A-B-C Blok Kaba İnşaat Taşeron Sözleşmesi', kind: 'Taşeron', dir: 'gider', amount: 30e6, start: ago(400), end: fwd(120), cat: 'İşçilik', terms: 'Aylık hakediş, 30 gün vade. %5 teminat kesintisi, avans iki hakedişte mahsup.', advance: 3e6 });
      contract('mekanik', { projectId: P1, firmId: F.aydin, title: 'Mekanik Tesisat Taahhüt Sözleşmesi', kind: 'Taşeron', dir: 'gider', amount: 9.8e6, start: ago(200), end: fwd(150), cat: 'İşçilik', terms: 'Fiziki ilerlemeye göre hakediş, 45 gün vade.' });
      contract('elektrik', { projectId: P1, firmId: F.basaran, title: 'Elektrik Tesisatı Taahhüt Sözleşmesi', kind: 'Taşeron', dir: 'gider', amount: 6.4e6, start: ago(150), end: fwd(170), cat: 'İşçilik', terms: 'Fiziki ilerlemeye göre hakediş, 30 gün vade.' });
      contract('siva', { projectId: P1, firmId: F.karaman, title: 'Sıva & Boya İşleri Sözleşmesi', kind: 'Taşeron', dir: 'gider', amount: 7.2e6, start: ago(60), end: fwd(200), cat: 'İşçilik', terms: 'm² birim fiyat, ayda bir hakediş.' });
      contract('beton', { projectId: P1, firmId: F.beton, title: 'Hazır Beton Tedarik Sözleşmesi (C30/37)', kind: 'Tedarikçi', dir: 'gider', amount: 14.5e6, start: ago(380), end: fwd(12), cat: 'Demir / Beton', terms: 'Teslimat bazlı hakediş, 30 gün vade. Fiyat farkı uygulanmaz.' });
      contract('demir', { projectId: P1, firmId: F.demir, title: 'İnşaat Demiri Tedarik Sözleşmesi', kind: 'Tedarikçi', dir: 'gider', amount: 12e6, start: ago(300), end: fwd(45), cat: 'Demir / Beton', terms: 'Sevkiyat bazlı, 45 gün vadeli çek.' });
      contract('asansor', { projectId: P1, firmId: F.asansor, title: 'Asansör Tedarik ve Montaj Sözleşmesi', kind: 'Taşeron', dir: 'gider', amount: 4.6e6, start: fwd(30), end: fwd(160), status: 'Aktif', cat: 'İnce Malzeme', terms: '%30 avans, kalan montaj sonrası.' });
      contract('depo', { projectId: P2, firmId: F.lojistik, title: 'Hendek Depo Anahtar Teslim Yapım Sözleşmesi', kind: 'Ana Sözleşme', dir: 'gelir', amount: 54e6, start: ago(215), end: fwd(135), retention: 10, terms: 'İşveren ilerlemeye göre aylık hakediş öder, %10 teminat kesintisi.' });
      contract('depoCelik', { projectId: P2, firmId: F.demirel, title: 'Çelik Karkas ve Doğrama Taşeron Sözleşmesi', kind: 'Taşeron', dir: 'gider', amount: 11e6, start: ago(150), end: fwd(40), cat: 'İşçilik', terms: 'Aylık hakediş, 30 gün vade.' });

      const hak = (ck, no, ago_, cum, prev, status, paidFrac, ad = 0) => {
        const c = CT[ck], calc = SS.calc.hakedisCalc(c, { cumPct: cum, prevPct: prev, retentionPct: c.retention, advance: ad, stampOn: c.dir === 'gider', kdvPct: 20 });
        const paid = U.round2(calc.total * paidFrac);
        const h = add('hakedis', Object.assign({ projectId: c.projectId, contractId: c.id, no, date: ago(ago_), cumPct: cum, prevPct: prev, retentionPct: c.retention, kdvPct: 20, stampOn: c.dir === 'gider', status, paidAmount: paid, payments: paid ? [{ date: ago(Math.max(0, ago_ - 22)), amount: paid }] : [], note: '' }, calc));
        if (paid && c.dir === 'gider') add('expenses', { projectId: c.projectId, date: ago(Math.max(0, ago_ - 22)), category: c.cat, desc: `Hakediş No:${no} ödemesi – ${c.title.split(' ').slice(0, 4).join(' ')}`, firmId: c.firmId, amount: paid, status: 'Ödendi', paidDate: ago(Math.max(0, ago_ - 22)), source: 'hakedis', hakedisId: h.id });
        return h;
      };
      const seq = (ck, list) => { let prev = 0; list.forEach((x, i) => { hak(ck, i + 1, x[0], x[1], prev, x[2], x[3], x[4] || 0); prev = x[1]; }); };
      seq('kaba', [[330, 10, 'Ödendi', 1, 1.5e5 * 10], [270, 24, 'Ödendi', 1, 1.5e6], [205, 37, 'Ödendi', 1], [140, 49, 'Ödendi', 1], [75, 59, 'Onaylandı', 0.6], [12, 66, 'Taslak', 0]]);
      seq('mekanik', [[110, 15, 'Ödendi', 1], [38, 32, 'Onaylandı', 0]]);
      seq('elektrik', [[62, 22, 'Ödendi', 1], [9, 38, 'Taslak', 0]]);
      seq('siva', [[6, 8, 'Taslak', 0]]);
      seq('beton', [[330, 18, 'Ödendi', 1], [255, 41, 'Ödendi', 1], [170, 63, 'Ödendi', 1], [95, 78, 'Ödendi', 1], [28, 86, 'Onaylandı', 0.5]]);
      seq('demir', [[240, 28, 'Ödendi', 1], [165, 52, 'Ödendi', 1], [80, 71, 'Ödendi', 1], [20, 83, 'Onaylandı', 0]]);
      seq('depo', [[175, 9, 'Ödendi', 1], [135, 22, 'Ödendi', 1], [90, 36, 'Ödendi', 1], [45, 49, 'Onaylandı', 0], [4, 55, 'Taslak', 0]]);
      seq('depoCelik', [[100, 22, 'Ödendi', 1], [40, 55, 'Ödendi', 1]]);
      CT.kaba.progress = 66; CT.mekanik.progress = 32; CT.elektrik.progress = 38; CT.siva.progress = 8; CT.beton.progress = 86; CT.demir.progress = 83; CT.depo.progress = 55; CT.depoCelik.progress = 55; CT.asansor.progress = 0;

      /* ---------------- harcamalar ---------------- */
      const paidByCat = {};
      D.expenses.filter((e) => e.projectId === P1).forEach((e) => (paidByCat[e.category] = (paidByCat[e.category] || 0) + e.amount));
      const spec = {
        'Demir / Beton': [30.5e6, 14, ['Nervürlü inşaat demiri Ø12-Ø16 sevkiyatı', 'Hasır çelik (Q257)', 'Beton pompa kirası ve operatör', 'Beton katkı malzemesi', 'Demir bağlama teli', 'C35/45 hazır beton – perde'], ['demir', 'beton']],
        'Kaba Malzeme': [11.6e6, 22, ['Çimento (CEM II 42,5) 50 kg', 'Bims blok 20\'lik', 'Gazbeton 20 cm', 'Yıkanmış kum', 'Mıcır (1-2)', 'Kalıp kerestesi', 'Tel çivi', 'Şap kumu'], ['cimento', 'market', 'kereste', 'tas']],
        'İnce Malzeme': [6.9e6, 14, ['Seramik 60x60 (zemin)', 'PVC doğrama sipariş avansı', 'Alçı ve alçıpan levha', 'İç cephe boyası', 'Banyo armatür seti', 'NYY kablo ve priz-anahtar', 'PPR boru ve fittings'], ['seramik', 'boya', 'tesisatm', 'elektrikm']],
        'İşçilik': [29.5e6, 18, ['Haftalık işçi yevmiyeleri', 'Kalıp ekibi avans ödemesi', 'Vinç operatörü maaş', 'Fazla mesai ödemesi', 'Hafriyat ekibi', 'Çelik doğrama ekibi avans'], ['yilmaz', 'demirel', 'karaman']],
        'Nakliye': [2.1e6, 12, ['Hafriyat kamyon nakliyesi', 'Demir nakliye (TIR)', 'Tuğla-blok nakliyesi', 'Beton mikseri ek mesafe', 'Vinçli kamyon kirası'], ['nakliye']],
        'Resmi Harçlar': [4.8e6, 6, ['Yapı ruhsat harcı', 'Yapı denetim hizmet bedeli', 'SGK işveren primi', 'İSG uzmanı hizmet bedeli', 'Katılım payı ve altyapı harcı', 'Yangın yönetmeliği inceleme bedeli'], ['belediye', 'sgk', 'vergi']],
        'Genel Giderler': [4.2e6, 16, ['Şantiye elektrik faturası', 'Akaryakıt (dizel)', 'Şantiye ofisi kirası', 'Kırtasiye ve ofis giderleri', 'Personel yemek hizmeti', 'Özel güvenlik hizmeti', 'Su ve atık giderleri'], ['sedas', 'akaryakit']],
      };
      function genExp(pid, cat, target, count, descs, firms, from) {
        const w = Array.from({ length: count }, () => 0.4 + r() * 1.2), sw = U.sum(w);
        w.forEach((x) => {
          const date = U.addDays(from, Math.floor(U.diff(from, T) * Math.pow(r(), 0.62))), age = U.diff(date, T);
          const e = { projectId: pid, date, category: cat, desc: pick(descs), firmId: F[pick(firms)], amount: round((target * x) / sw, 250), status: 'Ödendi', receipt: null };
          if (age <= 50 && r() > 0.58) { e.status = 'Vadeli'; e.dueDate = U.addDays(date, ri(20, 45)); if (e.dueDate < T && r() < 0.82) { e.status = 'Ödendi'; e.paidDate = e.dueDate; delete e.dueDate; } }
          else e.paidDate = U.addDays(date, ri(0, 5));
          add('expenses', e);
        });
      }
      Object.entries(spec).forEach(([cat, [target, count, descs, firms]]) => genExp(P1, cat, Math.max(target - (paidByCat[cat] || 0), target * 0.12), count, descs, firms, ago(405)));
      /* kontrollü kayıtlar: yaklaşan ve geciken ödemeler */
      const sx = (cat, desc, f, amount, dateAgo, due, st = 'Vadeli') => add('expenses', { projectId: P1, date: ago(dateAgo), category: cat, desc, firmId: F[f], amount, status: st, dueDate: due, receipt: null });
      sx('Demir / Beton', 'Q16 nervürlü demir – irsaliye İRS-4821', 'demir', 1840000, 9, fwd(3));
      sx('Demir / Beton', 'C30/37 hazır beton – B Blok 3. kat döşeme', 'beton', 960000, 6, fwd(6));
      sx('Kaba Malzeme', 'Kalıp kerestesi ve OSB levha', 'kereste', 245000, 44, ago(5));
      sx('Nakliye', 'Hafriyat nakliye – 2 aylık hesap', 'nakliye', 128000, 58, ago(11));
      sx('Kaba Malzeme', 'Çimento 50 kg – 1.200 torba', 'cimento', 412000, 14, fwd(12));
      sx('Genel Giderler', 'Şantiye elektrik faturası (Ekim)', 'sedas', 86500, 20, fwd(2));
      sx('İnce Malzeme', 'PVC doğrama avans faturası', 'seramik', 640000, 31, ago(1));
      /* bu ay demir/beton: aylık bütçe payının ~%12 üstü olacak şekilde ölçekle */
      {
        const p = D.projects[0], mk = U.monthKey(T), al = SS.calc.monthlyAllowance(p, 'Demir / Beton');
        const cur = D.expenses.filter((e) => e.projectId === P1 && e.category === 'Demir / Beton' && U.monthKey(e.date) === mk && e.source !== 'hakedis');
        const sum = U.sum(cur, (e) => e.amount);
        const hk = U.sum(D.expenses.filter((e) => e.projectId === P1 && e.category === 'Demir / Beton' && U.monthKey(e.date) === mk && e.source === 'hakedis'), (e) => e.amount);
        const goal = Math.max(al * 1.12 - hk, al * 0.25);
        if (sum > 0) cur.forEach((e) => (e.amount = round((e.amount * goal) / sum, 100)));
      }
      /* diğer kategorilerde bu ayki harcama aylık payın %55–%95'i civarında kalsın */
      {
        const p = D.projects[0], mk = U.monthKey(T);
        SS.C.cats.filter((c) => c !== 'Demir / Beton').forEach((cat) => {
          const al = SS.calc.monthlyAllowance(p, cat), cur = D.expenses.filter((e) => e.projectId === P1 && e.category === cat && U.monthKey(e.date) === mk && e.source !== 'hakedis'), sum = U.sum(cur, (e) => e.amount);
          const hk = U.sum(D.expenses.filter((e) => e.projectId === P1 && e.category === cat && U.monthKey(e.date) === mk && e.source === 'hakedis'), (e) => e.amount);
          const goal = Math.max(al * (0.55 + r() * 0.4) - hk, al * 0.12);
          if (sum > goal) cur.forEach((e) => (e.amount = round((e.amount * goal) / sum, 100)));
        });
      }
      Object.entries(spec).forEach(([cat, [target, count, descs, firms]]) => genExp(P2, cat, target * 0.5 * (cat === 'İşçilik' ? 0.5 : 1), Math.ceil(count / 2), descs, firms, ago(200)));
      Object.entries(spec).forEach(([cat, [target, , descs, firms]]) => { for (let i = 0; i < 2; i++) add('expenses', { projectId: P4, date: ago(ri(120, 650)), category: cat, desc: pick(descs), firmId: F[pick(firms)], amount: round((target * 0.12) / 2, 500), status: 'Ödendi', paidDate: ago(ri(70, 600)) }); });
      D.expenses.forEach((e) => { if (e.status === 'Ödendi' && !e.paidDate) e.paidDate = e.date; });

      /* ---------------- müşteriler & daireler ---------------- */
      const names = ['Ahmet Yılmaz', 'Fatma Demir', 'Mehmet Kaya', 'Ayşe Çelik', 'Mustafa Şahin', 'Emine Yıldız', 'Ali Öztürk', 'Hatice Aydın', 'Hüseyin Arslan', 'Zeynep Doğan', 'İbrahim Kılıç', 'Elif Aslan', 'Ömer Çetin', 'Merve Koç', 'Yusuf Kurt', 'Selin Özdemir', 'Burak Polat', 'Derya Erdoğan', 'Emre Güneş', 'Gül Tunç', 'Kemal Aksoy', 'Sibel Bulut', 'Murat Karaca', 'Nur Yavuz', 'Serkan Taş', 'Büşra Acar', 'Cem Uçar', 'Pınar Soylu'];
      const phone = () => `05${pick(['32', '33', '34', '35', '36', '37', '38', '39', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '53', '54', '55'])} ${ri(100, 999)} ${ri(10, 99)} ${ri(10, 99)}`;
      const custs = names.map((nm) => add('customers', { name: nm, phone: phone(), email: U.norm(nm).replace(/ /g, '.') + '@mail.com', note: '' }));
      const soldPlan = { A: 13, B: 10, C: 3 }, resPlan = { A: 1, B: 3, C: 3 };
      let ci = 0;
      ['A', 'B', 'C'].forEach((blk) => {
        const order = Array.from({ length: 16 }, (_, i) => i + 1).sort(() => r() - 0.5);
        order.forEach((no, idx) => {
          const floor = Math.ceil(no / 4), pos = (no - 1) % 4, big = pos === 0 || pos === 3, m2 = big ? 135 : 105;
          const list = round(m2 * (56000 + floor * 1400 + (blk === 'A' ? 1800 : blk === 'B' ? 800 : 0) + (pos === 0 ? 1500 : 0)), 1000);
          const u = add('units', { projectId: P1, block: blk, floor, no: `${blk}-${no}`, type: big ? '3+1' : '2+1', m2, listPrice: list, status: 'Müsait', plan: [] });
          if (idx < soldPlan[blk]) {
            const cust = custs[ci++ % custs.length], saleDate = ago(ri(8, 390)), price = round(list * (0.93 + r() * 0.07), 5000), down = round(price * (0.28 + r() * 0.14), 5000);
            const cnt = pick([6, 12, 12, 18, 24]), per = round((price - down) / cnt, 100);
            const plan = [{ id: id('i'), kind: 'Peşinat', due: saleDate, amount: down, paid: true, paidDate: saleDate }];
            for (let k = 1; k <= cnt; k++) plan.push({ id: id('i'), kind: `${k}. Taksit`, due: U.addMonths(saleDate, k), amount: k === cnt ? price - down - per * (cnt - 1) : per, paid: false });
            const lag = r() < 0.12;
            const past = plan.filter((p) => p.due <= T && p.kind !== 'Peşinat');
            past.forEach((p, k) => { if (lag && k >= past.length - ri(1, 2)) return; p.paid = true; p.paidDate = U.addDays(p.due, ri(0, 4)); });
            Object.assign(u, { status: 'Satıldı', customerId: cust.id, salePrice: price, downPayment: down, saleDate, plan });
          } else if (idx < soldPlan[blk] + resPlan[blk]) Object.assign(u, { status: 'Rezerve', customerId: custs[ci++ % custs.length].id, reservedUntil: fwd(ri(3, 20)), note: 'Kapora alındı' });
        });
      });
      D.units.sort((a, b) => a.block.localeCompare(b.block) || parseInt(a.no.slice(2)) - parseInt(b.no.slice(2)));

      /* ---------------- personel & puantaj ---------------- */
      const W = (name, role, wage, pid, hc = 1, extra = {}) => add('workers', Object.assign({ name, role, wage, phone: phone(), projectId: pid, headcount: hc, active: true, start: ago(ri(60, 380)) }, extra));
      const ws1 = [
        W('Hasan Çelik', 'Usta', 4200, P1, 1, { note: 'Kalıp ustası' }), W('Mehmet Aksoy', 'Usta', 4000, P1, 1, { note: 'Demirci ustası' }), W('İbrahim Yıldız', 'Usta', 4100, P1, 1, { note: 'Duvar ustası' }), W('Cemal Kara', 'Usta', 3900, P1, 1, { note: 'Sıva ustası' }),
        W('Recep Duran', 'Kalfa', 3000, P1), W('Osman Tekin', 'Kalfa', 3000, P1), W('Yasin Bozkurt', 'Kalfa', 3100, P1), W('Kadir Önal', 'Kalfa', 2950, P1),
        W('Ramazan Ay', 'Düz İşçi', 2100, P1), W('Süleyman Işık', 'Düz İşçi', 2100, P1), W('Hakan Avcı', 'Düz İşçi', 2200, P1), W('Bilal Sarı', 'Düz İşçi', 2100, P1), W('Eren Aktaş', 'Düz İşçi', 2250, P1), W('Furkan Gür', 'Düz İşçi', 2100, P1), W('Tuncay Er', 'Düz İşçi', 2200, P1), W('Volkan Bal', 'Düz İşçi', 2150, P1),
        W('Nuri Sönmez', 'Operatör', 4600, P1, 1, { note: 'Kule vinç operatörü' }), W('Adem Koçak', 'Operatör', 4000, P1, 1, { note: 'Ekskavatör operatörü' }), W('Savaş Eren', 'Operatör', 4200, P1, 1, { note: 'Beton pompa operatörü' }),
        W('Demirel Doğrama Ekibi', 'Taşeron Ekibi', 16500, P1, 6), W('Alçıpan Ekibi (Karaman)', 'Taşeron Ekibi', 11000, P1, 4),
      ];
      const ws2 = [W('Orhan Tuna', 'Usta', 4200, P2), W('Kenan Ak', 'Kalfa', 3000, P2), W('Tarık Uysal', 'Düz İşçi', 2150, P2), W('Mesut Aral', 'Düz İşçi', 2150, P2), W('Rıfat Dinç', 'Operatör', 4100, P2)];
      [...ws1, ...ws2].forEach((w) => {
        for (let k = 75; k >= 0; k--) {
          const d = ago(k), dw = U.dow(d); if (dw === 0) continue;
          if (k === 0 && ws1.indexOf(w) >= 17) continue; // bugünün puantajı eksik kalsın
          const x = r(); let code;
          if (dw === 6) code = x < 0.7 ? 'T' : x < 0.82 ? 'Y' : null;
          else code = x < 0.84 ? 'T' : x < 0.9 ? 'Y' : x < 0.95 ? 'FM' : x < 0.975 ? 'I' : 'D';
          if (code) (D.attendance[d] = D.attendance[d] || {})[w.id] = code;
        }
      });
      [ago(9), ago(22), ago(35)].forEach((d) => { const pool = ws1.filter((_, i) => i < 16); for (let i = 0; i < 4; i++) { const w = pick(pool); add('advances', { workerId: w.id, date: d, amount: pick([2000, 3000, 4000, 5000, 8000]), note: 'Maaş avansı' }); } });

      /* ---------------- stok ---------------- */
      const MT = (pid, name, unit, cat, target, crit, price, perDay, sup, areas) => {
        const m = add('materials', { projectId: pid, name, unit, category: cat, critical: crit, price, opening: 0 });
        let out = 0; const mv = [];
        for (let k = 44; k >= 0; k--) {
          const d = ago(k); if (U.dow(d) === 0) continue; const q = perDay * (0.6 + r() * 0.8) * (k < 14 ? 1 : 0.75);
          if (r() < 0.88) { const qty = unit === 'adet' || unit === 'torba' || unit === 'kova' || unit === 'm' || unit === 'kg' ? Math.round(q) : Math.round(q * 10) / 10; out += qty; mv.push({ materialId: m.id, projectId: pid, type: 'cikis', qty, date: d, area: pick(areas), price, note: '' }); }
        }
        const k = 6, tot = out * (0.96 + r() * 0.08);
        for (let i = 0; i < k; i++) { const d = ago(ri(1, 44)); const qty = unit === 'ton' || unit === 'm³' || unit === 'm²' ? Math.round((tot / k) * (0.6 + r() * 0.8) * 10) / 10 : Math.round((tot / k) * (0.6 + r() * 0.8)); mv.push({ materialId: m.id, projectId: pid, type: 'giris', qty, date: d, waybill: `İRS-${ri(4100, 4999)}`, firmId: F[sup], price, area: '', note: '' }); }
        const net = mv.reduce((t, x) => t + (x.type === 'giris' ? x.qty : -x.qty), 0);
        m.opening = Math.max(0, Math.round((target - net) * 10) / 10);
        mv.forEach((x) => add('movements', x));
      };
      MT(P1, 'Nervürlü İnşaat Demiri Ø16', 'ton', 'Demir', 38.4, 15, 28400, 3.2, 'demir', ['Kolon-Perde', 'Döşeme', 'Temel']);
      MT(P1, 'Nervürlü İnşaat Demiri Ø12', 'ton', 'Demir', 8.6, 10, 28900, 1.1, 'demir', ['Döşeme', 'Kolon-Perde']);
      MT(P1, 'Hazır Beton C30/37', 'm³', 'Beton', 18, 0, 3150, 38, 'beton', ['Döşeme', 'Kolon-Perde']);
      MT(P1, 'Çimento CEM II 42,5 (50 kg)', 'torba', 'Kaba Malzeme', 340, 400, 285, 170, 'cimento', ['Duvar', 'Sıva', 'Şap']);
      MT(P1, 'Bims Blok 20\'lik', 'adet', 'Kaba Malzeme', 14200, 5000, 38, 650, 'market', ['Duvar']);
      MT(P1, 'Gazbeton 20 cm', 'adet', 'Kaba Malzeme', 2800, 1500, 142, 120, 'market', ['Duvar']);
      MT(P1, 'Seramik 60x60 (zemin)', 'm²', 'İnce Malzeme', 880, 300, 520, 22, 'seramik', ['Şap', 'Genel']);
      MT(P1, 'Yıkanmış Kum', 'm³', 'Kaba Malzeme', 46, 20, 780, 5.5, 'tas', ['Sıva', 'Şap']);
      MT(P1, 'Mıcır (1-2)', 'm³', 'Kaba Malzeme', 38, 20, 820, 4.2, 'tas', ['Temel', 'Şap']);
      MT(P1, 'Kalıp Kerestesi', 'm³', 'Kalıp / İskele', 6.4, 8, 17800, 0.7, 'kereste', ['Kolon-Perde', 'Döşeme']);
      MT(P1, 'Tel Çivi (karışık)', 'kg', 'Sarf', 480, 150, 62, 14, 'market', ['Kolon-Perde', 'Döşeme']);
      MT(P1, 'Bağlama Teli', 'kg', 'Sarf', 210, 100, 58, 7, 'demir', ['Kolon-Perde', 'Döşeme']);
      MT(P1, 'Sıva Alçısı (30 kg)', 'torba', 'İnce Malzeme', 640, 250, 118, 24, 'boya', ['Sıva']);
      MT(P1, 'NYY Kablo 3x2,5 mm²', 'm', 'Elektrik', 1800, 800, 46, 60, 'elektrikm', ['Elektrik']);
      MT(P1, 'İç Cephe Boyası (15 L)', 'kova', 'İnce Malzeme', 36, 20, 1450, 1.4, 'boya', ['Genel']);
      MT(P2, 'IPE 300 Çelik Profil', 'ton', 'Demir', 22, 8, 36500, 1.6, 'demir', ['Genel']);
      MT(P2, 'Sandviç Çatı Paneli', 'm²', 'İnce Malzeme', 1480, 400, 640, 60, 'market', ['Cephe']);
      MT(P2, 'Hazır Beton C25/30', 'm³', 'Beton', 12, 0, 2850, 24, 'beton', ['Döşeme']);

      /* ---------------- şantiye defteri ---------------- */
      const works = ['B Blok 3. kat döşeme kalıbı ve demir montajı sürdü.', 'C Blok 2. kat perde betonu döküldü (84 m³).', 'A Blok 4. kat tuğla duvar örgüsü devam ediyor.', 'Mekanik tesisat kaba montajı A Blok 2-3. katlarda yapıldı.', 'Elektrik boruları ve kutu montajı tamamlandı.', 'A Blok çatı tahtalama ve yalıtım işleri başladı.', 'Saha temizliği, malzeme istifleme ve vinç bakımı yapıldı.', 'İş güvenliği toplantısı yapıldı; iskele kontrolleri tamamlandı.'];
      const wset = ['Güneşli', 'Güneşli', 'Bulutlu', 'Bulutlu', 'Yağmurlu', 'Rüzgarlı', 'Güneşli', 'Yağmurlu'];
      const photoIds = [];
      for (let i = 0; i < 4; i++) { const pid = id('img'); await SS.blob.put(pid, new Blob([sitePhoto(i)], { type: 'image/svg+xml' }), { name: `saha-${i + 1}.svg`, type: 'image/svg+xml' }); photoIds.push({ id: pid, name: `Saha fotoğrafı ${i + 1}`, type: 'image/svg+xml' }); }
      let pi = 0;
      for (let k = 26; k >= 0; k--) {
        const d = ago(k); if (U.dow(d) === 0) continue;
        const w = wset[(k * 3 + ri(0, 2)) % wset.length], heavy = w === 'Yağmurlu' && r() < 0.6;
        const present = ws1.filter((x) => ['T', 'Y', 'FM'].includes((D.attendance[d] || {})[x.id]));
        add('diary', { projectId: P1, date: d, weather: w, temp: ri(6, 15), work: pick(works) + ' ' + pick(works), workers: present.reduce((t, x) => t + (x.headcount || 1), 0), stopped: heavy, stopHours: heavy ? ri(2, 6) : 0, stopReason: heavy ? 'Yoğun yağış nedeniyle beton ve cephe işleri durduruldu.' : '', photos: k % 6 === 0 && pi < 4 ? [photoIds[pi++]] : [], note: '', author: 'Şantiye Şefi' });
      }

      /* ---------------- İSG & kalite ---------------- */
      for (let k = 14; k >= 0; k--) {
        const d = ago(k); if (U.dow(d) === 0 || (k === 0 && false)) continue; if (k === 0) continue;
        const ans = {}; SS.C.safetyItems.forEach((it) => { const x = r(); ans[it.k] = x < 0.9 ? 'ok' : x < 0.97 ? 'bad' : 'na'; });
        const ok = Object.values(ans).filter((v) => v === 'ok').length, bad = Object.values(ans).filter((v) => v === 'bad').length;
        add('safety', { projectId: P1, date: d, inspector: 'Şantiye Şefi', answers: ans, note: '', score: Math.round((ok / Math.max(1, ok + bad)) * 100) });
      }
      const pu = (title, loc, type, pr, who, due, st, createdAgo) => add('punch', { projectId: P1, title, location: loc, type, priority: pr, assignee: who, due, status: st, created: ago(createdAgo), note: '' });
      pu('C Blok 2. kat balkon korkuluğu eksik', 'C Blok / 2. Kat', 'İSG', 'Kritik', 'Yılmaz Yapı', fwd(1), 'Açık', 2);
      pu('Asansör boşluğu kapaması yetersiz', 'B Blok / Zemin', 'İSG', 'Yüksek', 'Yılmaz Yapı', fwd(2), 'Devam Ediyor', 4);
      pu('A Blok 2. kat kolon yüzeylerinde petek (segregasyon)', 'A Blok / 2. Kat', 'Kalite', 'Yüksek', 'Yılmaz Yapı', fwd(5), 'Devam Ediyor', 9);
      pu('Şantiye girişi yaya yolu işaretlemesi', 'Saha Girişi', 'İSG', 'Orta', 'Şantiye Şefi', fwd(7), 'Açık', 3);
      pu('B Blok 1. kat tesisat sleeve eksikleri', 'B Blok / 1. Kat', 'İmalat Eksiği', 'Orta', 'Aydın Tesisat', fwd(6), 'Açık', 6);
      pu('Elektrik panosu kapağı kilitlenmemiş', 'Ana Pano', 'İSG', 'Yüksek', 'Başaran Elektrik', ago(1), 'Açık', 5);
      pu('A Blok merdiven basamak kotları', 'A Blok / Merdiven', 'Kalite', 'Düşük', 'Yılmaz Yapı', fwd(14), 'Açık', 12);
      pu('Kalıp iskele ayaklarında pas', 'B Blok / 3. Kat', 'İSG', 'Orta', 'Yılmaz Yapı', ago(6), 'Çözüldü', 16);
      pu('Yangın söndürücü etiketleri güncellendi', 'Saha geneli', 'İSG', 'Düşük', 'Şantiye Şefi', ago(8), 'Çözüldü', 18);

      /* ---------------- makine parkı ---------------- */
      const MC = (name, type, plate, own, firmKey, rent, hours, every, last, status, fuelPerH) => {
        const m = add('machines', { projectId: P1, name, type, plate, own, firmId: firmKey ? F[firmKey] : '', rent, hours, serviceEvery: every, lastService: last, status, nextServiceDate: '' });
        for (let k = 29; k >= 0; k--) { const d = ago(k); if (U.dow(d) === 0 || r() < 0.18 || status === 'Bakımda') continue; const h = ri(4, 9); add('machineLogs', { machineId: m.id, date: d, hours: h, fuel: Math.round(h * fuelPerH * (0.85 + r() * 0.3)), operator: pick(['Nuri Sönmez', 'Adem Koçak', 'Savaş Eren']), note: '' }); }
        return m;
      };
      MC('Kule Vinç – Potain MC 85', 'Kule Vinç', 'Seri: 85B-2291', 'Kiralık', 'nakliye', 14500, 1840, 250, 1700, 'Çalışıyor', 0);
      MC('Ekskavatör – CAT 320', 'Ekskavatör', '54 SK 320', 'Özmal', '', 0, 3410, 500, 3000, 'Çalışıyor', 11);
      MC('Beton Pompası – Putzmeister 36 m', 'Beton Pompası', 'Seri: P36-1180', 'Kiralık', 'beton', 22000, 640, 300, 450, 'Çalışıyor', 14);
      MC('Jeneratör 100 kVA – Aksa', 'Jeneratör', 'Seri: AK100-77', 'Özmal', '', 0, 1262, 250, 1030, 'Çalışıyor', 8);
      MC('Forklift – Manitou 3 ton', 'Forklift', '54 FK 118', 'Özmal', '', 0, 2120, 250, 1950, 'Çalışıyor', 3);
      MC('Beton Mikseri 350 lt', 'Mikser', 'Seri: MX-350-22', 'Özmal', '', 0, 980, 400, 700, 'Boşta', 2);
      MC('Kompresör – Atlas Copco', 'Kompresör', 'Seri: AC-18-441', 'Kiralık', 'tesisatm', 2800, 520, 300, 300, 'Bakımda', 5);

      /* ---------------- çizimler ---------------- */
      add('drawings', { id: 'd_arch', projectId: P1, name: 'A Blok – Tip Kat Planı (Mimari)', discipline: 'Mimari', kind: 'builtin', builtin: 'arch', unitToM: 0.01, date: ago(120), notes: [{ id: id('n'), x: 1200, y: 650, text: 'Asansör boşluğu: kabin 1,10 × 1,40 m — korkuluk kontrolü yapıldı' }, { id: id('n'), x: 420, y: 1010, text: 'Salon pencereleri PVC, 4+16+4 ısı camı' }] });
      add('drawings', { id: 'd_str', projectId: P1, name: 'A Blok – Kolon / Kiriş Kalıp Planı (Statik)', discipline: 'Statik', kind: 'builtin', builtin: 'struct', unitToM: 0.01, date: ago(150), notes: [] });
      add('reports', { title: 'Aylık Puantaj Cetveli', project: 'Sakarya Vadi Konutları', fmt: 'pdf', date: ago(17) });
      add('reports', { title: 'Harcama Dökümü', project: 'Sakarya Vadi Konutları', fmt: 'xlsx', date: ago(9) });
      add('reports', { title: 'Stok Durumu', project: 'Tüm şantiyeler', fmt: 'csv', date: ago(4) });
      D.reports.forEach((x, i) => (x.id = 'r_seed' + i));

      D.settings.activeProject = P1;
      SS.store.flush();
    },
  };
})();
