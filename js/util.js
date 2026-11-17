/* Şantiye Şefi — yardımcı fonksiyonlar ve sabitler */
(function () {
  const SS = (window.SS = { views: {}, actions: {}, regions: {}, vs: {} });
  const U = (SS.U = {});
  SS.css = (text) => { const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); };

  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.id = (p = 'x') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- tarih ---------- */
  U.iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  U.parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  U.today = () => U.iso(new Date());
  U.addDays = (s, n) => { const d = U.parse(s); d.setDate(d.getDate() + n); return U.iso(d); };
  U.diff = (a, b) => Math.round((U.parse(b) - U.parse(a)) / 864e5); // b - a (gün)
  U.addMonths = (s, n) => {
    const d = U.parse(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return U.iso(d);
  };
  U.monthKey = (s) => s.slice(0, 7);
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  U.monthLabel = (k) => `${MONTHS[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
  U.monthShort = (k) => MONTHS[+k.slice(5, 7) - 1].slice(0, 3);
  U.dayName = (s) => DAYS[U.parse(s).getDay()];
  U.dow = (s) => U.parse(s).getDay();
  U.fmtDate = (s) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : '—');
  U.fmtDateLong = (s) => `${+s.slice(8, 10)} ${MONTHS[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}, ${U.dayName(s)}`;
  U.fmtDateShort = (s) => `${+s.slice(8, 10)} ${MONTHS[+s.slice(5, 7) - 1].slice(0, 3)}`;
  U.monthStart = (k) => k + '-01';
  U.monthEnd = (k) => U.iso(new Date(+k.slice(0, 4), +k.slice(5, 7), 0, 12));
  U.dates = (from, to) => { const out = []; for (let d = from; d <= to; d = U.addDays(d, 1)) out.push(d); return out; };
  U.monthsBack = (n, from = U.today()) => { const out = []; let k = U.monthKey(from); for (let i = 0; i < n; i++) { out.unshift(k); k = U.monthKey(U.addMonths(U.monthStart(k), -1)); } return out; };
  U.relDays = (s) => {
    const d = U.diff(U.today(), s);
    if (d === 0) return 'bugün'; if (d === 1) return 'yarın'; if (d === -1) return 'dün';
    return d > 0 ? `${d} gün sonra` : `${-d} gün önce`;
  };

  /* ---------- sayı / para ---------- */
  const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  U.num = (n, d = 0) => (d === 0 ? nf0.format(n || 0) : new Intl.NumberFormat('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0));
  U.money = (n) => '₺' + nf0.format(Math.round(n || 0));
  U.money2 = (n) => '₺' + nf2.format(n || 0);
  U.compact = (n) => {
    const a = Math.abs(n || 0), s = n < 0 ? '-' : '';
    if (a >= 1e9) return `${s}₺${U.num(a / 1e9, 2)} Mr`;
    if (a >= 1e6) return `${s}₺${U.num(a / 1e6, a >= 1e8 ? 0 : 1)} Mn`;
    if (a >= 1e4) return `${s}₺${U.num(a / 1e3, 0)} bin`;
    return U.money(n);
  };
  U.pct = (n, d = 0) => '%' + U.num(n, d);
  U.round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  U.clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---------- koleksiyon yardımcıları ---------- */
  U.sum = (arr, f = (x) => x) => arr.reduce((t, x) => t + (+f(x) || 0), 0);
  U.groupBy = (arr, f) => arr.reduce((m, x) => { const k = f(x); (m[k] = m[k] || []).push(x); return m; }, {});
  U.uniq = (arr) => [...new Set(arr)];
  U.debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.norm = (s) => String(s || '').toLocaleLowerCase('tr').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9+ /.-]/g, ' ').replace(/\s+/g, ' ').trim();
  U.match = (q, ...fields) => { if (!q) return true; const n = U.norm(q); return fields.some((f) => U.norm(f).includes(n)); };
  U.rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  U.initials = (name) => String(name || '?').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toLocaleUpperCase('tr');

  /* ---------- sabitler ---------- */
  SS.C = {
    cats: ['Demir / Beton', 'Kaba Malzeme', 'İnce Malzeme', 'İşçilik', 'Nakliye', 'Resmi Harçlar', 'Genel Giderler'],
    catVar: (c) => `var(--s${Math.max(0, SS.C.cats.indexOf(c)) + 1})`,
    roles: ['Usta', 'Kalfa', 'Düz İşçi', 'Operatör', 'Taşeron Ekibi'],
    units: ['ton', 'm³', 'torba', 'adet', 'm²', 'm', 'kg', 'lt', 'kova'],
    matCats: ['Demir', 'Beton', 'Kaba Malzeme', 'İnce Malzeme', 'Tesisat', 'Elektrik', 'Kalıp / İskele', 'Sarf'],
    areas: ['Temel', 'Kolon-Perde', 'Döşeme', 'Duvar', 'Sıva', 'Şap', 'Tesisat', 'Elektrik', 'Cephe', 'Genel'],
    weather: [
      { k: 'Güneşli', icon: 'sun' }, { k: 'Bulutlu', icon: 'cloud' }, { k: 'Yağmurlu', icon: 'rain' },
      { k: 'Rüzgarlı', icon: 'wind' }, { k: 'Karlı', icon: 'snow' },
    ],
    att: {
      T: { label: 'Tam Gün', short: 'T', mult: 1, tone: 'ok' },
      Y: { label: 'Yarım Gün', short: 'Y', mult: 0.5, tone: 'info' },
      FM: { label: 'Fazla Mesai', short: 'FM', mult: null, tone: 'brand' },
      I: { label: 'İzinli', short: 'İ', mult: 0, tone: 'warn' },
      D: { label: 'Devamsız', short: 'D', mult: 0, tone: 'bad' },
    },
    attOrder: ['T', 'Y', 'FM', 'I', 'D'],
    projStatus: { active: 'Aktif', planned: 'Planlanan', done: 'Tamamlanan' },
    expStatus: ['Ödendi', 'Vadeli', 'Gecikmiş'],
    unitStatus: ['Müsait', 'Rezerve', 'Satıldı'],
    firmTypes: ['Tedarikçi', 'Taşeron', 'Kurum', 'Müşteri'],
    contractKinds: ['Taşeron', 'Tedarikçi', 'Müşteri', 'Ana Sözleşme'],
    machineTypes: ['Kule Vinç', 'Ekskavatör', 'Jeneratör', 'Beton Pompası', 'Mikser', 'Forklift', 'Kompresör', 'Diğer'],
    priorities: ['Düşük', 'Orta', 'Yüksek', 'Kritik'],
    punchTypes: ['İSG', 'Kalite', 'İmalat Eksiği'],
    safetyItems: [
      { k: 'baret', t: 'Baret ve KKD kullanımı', d: 'Tüm çalışanlarda baret, yelek, iş ayakkabısı' },
      { k: 'kemer', t: 'Emniyet kemeri / yüksekte çalışma', d: 'Yaşam hattı ve kemer bağlantıları' },
      { k: 'iskele', t: 'İskele kontrolü', d: 'Ayak, çapraz, tabla ve etiket (yeşil kart)' },
      { k: 'korkuluk', t: 'Korkuluk ve boşluk kapamaları', d: 'Kat kenarı, asansör ve merdiven boşlukları' },
      { k: 'elektrik', t: 'Elektrik panoları ve kablolar', d: 'Topraklama, kaçak akım rölesi, kablo yalıtımı' },
      { k: 'yangin', t: 'Yangın söndürücüler', d: 'Yerinde, dolu ve erişilebilir' },
      { k: 'ilkyardim', t: 'İlk yardım dolabı', d: 'Malzemeler tam, son kullanma tarihleri geçmemiş' },
      { k: 'kazi', t: 'Kazı / şev güvenliği', d: 'Şev eğimi, destek ve uyarı bantları' },
      { k: 'duzen', t: 'Saha düzeni ve temizlik', d: 'Yürüme yolları açık, malzemeler istiflenmiş' },
      { k: 'vinc', t: 'Vinç ve kaldırma ekipmanı', d: 'Halat, kanca, işaretçi ve operatör belgesi' },
    ],
  };
})();
