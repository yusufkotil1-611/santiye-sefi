/* Şantiye Şefi — arayüz çekirdeği: ikonlar, kabuk, yönlendirme, sheet/form/tablo bileşenleri */
(function () {
  const SS = window.SS, U = SS.U, esc = U.esc;
  const ui = (SS.ui = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  ui.$ = $; ui.$$ = $$;

  /* ---------------- ikonlar ---------------- */
  const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0-${2 * r} 0`;
  const ICONS = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    building: 'M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M15 9h3a1 1 0 0 1 1 1v11M3 21h18M9 7h2M9 11h2M9 15h2',
    receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
    clipboard: 'M9 4h6v3H9zM7 5.5H6a1 1 0 0 0-1 1V21h14V6.5a1 1 0 0 0-1-1h-1M9 14l2 2 4-4',
    file: 'M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 12h6M9 16h6',
    tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM8 8h.01',
    users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.2a3.2 3.2 0 0 0-2.4-3.1M15.5 4.7a3.5 3.5 0 0 1 0 6.6',
    user: c(12, 8, 4) + 'M4 20a8 8 0 0 1 16 0',
    box: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
    layers: 'M12 3 3 7.5l9 4.5 9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
    sparkles: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
    chart: 'M4 4v16h16M8 16v-4M12 16V8M16 16v-6',
    book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
    shield: 'M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6zM9 12l2 2 4-4',
    truck: 'M2 7h11v9H2zM13 10h4.5l3.5 3.5V16h-8' + c(6.5, 18.5, 1.8) + c(17, 18.5, 1.8),
    sun: c(12, 12, 4) + 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    cloud: 'M7.5 18.5a4.5 4.5 0 0 1-.4-8.98 6 6 0 0 1 11.4 1.48 3.8 3.8 0 0 1-1 7.5z',
    rain: 'M7.5 15a4.5 4.5 0 0 1-.4-8.98 6 6 0 0 1 11.4 1.48A3.8 3.8 0 0 1 17.5 15M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5',
    wind: 'M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h7a2 2 0 1 1-2 2',
    snow: 'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    search: c(11, 11, 6.5) + 'M16 16l4.5 4.5',
    x: 'M6 6l12 12M18 6 6 18',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    chevR: 'M9 5l7 7-7 7', chevL: 'M15 5l-7 7 7 7', chevD: 'M5 9l7 7 7-7', chevU: 'M5 15l7-7 7 7',
    menu: 'M4 6h16M4 12h16M4 18h16',
    volume: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
    mute: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9.5l5 5M21 9.5l-5 5',
    moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',
    download: 'M12 4v11M7.5 11 12 15.5 16.5 11M4 20h16',
    upload: 'M12 16V5M7.5 9 12 4.5 16.5 9M4 20h16',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    filter: 'M4 5h16l-6 7.5V19l-4 1.5v-8z',
    alert: 'M12 3.5 2.5 20h19zM12 10v4.5M12 17.5h.01',
    bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z',
    pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z' + c(12, 9.5, 2.5),
    camera: 'M4 8h3l1.5-2.5h7L17 8h3v11H4z' + c(12, 13, 3.5),
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01',
    printer: 'M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z',
    sheet: 'M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 11h6M9 15h6M12 11v8',
    gear: c(12, 12, 3) + 'M19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.3 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4z',
    zoomIn: c(11, 11, 6.5) + 'M16 16l4.5 4.5M8.5 11h5M11 8.5v5',
    zoomOut: c(11, 11, 6.5) + 'M16 16l4.5 4.5M8.5 11h5',
    maximize: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
    ruler: 'M3 16 16 3l5 5L8 21zM7 12l2 2M10 9l2 2M13 6l2 2',
    area: 'M4 6l12-2 4 9-6 7-9-3z',
    hand: 'M8 12V6a1.5 1.5 0 0 1 3 0v5M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.5 1.5 0 0 1 2.5-1.5L8 14',
    send: 'M4 12 20 4l-4 16-4.5-6.5zM11.5 13.5 20 4',
    bot: 'M5 8h14v10H5zM12 8V4.5M9 13h.01M15 13h.01M2.5 12v3M21.5 12v3',
    clock: c(12, 12, 9) + 'M12 7v5l3 2',
    fuel: 'M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3.5 20h12M14 10h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8l-3-3M7.5 8h4',
    wrench: 'M14 7a4 4 0 0 1 5.5-3.7l-2.5 2.5 1 2.2 2.2 1A4 4 0 0 1 14 11L6 19a1.8 1.8 0 0 1-2.5-2.5z',
    hardhat: 'M2.5 18h19M4.5 18v-2a7.5 7.5 0 0 1 15 0v2M10 8.5V6h4v2.5',
    arrowUp: 'M7 17 17 7M8 7h9v9', arrowDown: 'M7 7l10 10M17 8v9H8',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' + c(12, 12, 3),
    eyeOff: 'M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.7C3.7 9.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4-.9',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    wallet: 'M4 7h15a1 1 0 0 1 1 1v11H5a1 1 0 0 1-1-1zM4 7V6a2 2 0 0 1 2-2h11M16 13.5h.01',
    trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    key: c(8, 15, 4) + 'M11 12l9-9M16 7l3 3M14 9l2 2',
    info: c(12, 12, 9) + 'M12 11v5M12 8h.01',
    undo: 'M4 12a8 8 0 1 0 3-6.2M4 4v4h4',
    note: 'M5 4h14v11l-5 5H5zM14 20v-5h5',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    history: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4M12 8v4l3 2',
    percent: 'M6 18 18 6' + c(7.5, 7.5, 2) + c(16.5, 16.5, 2),
    cursor: 'M5 3l14 7-6 2-2 6z',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
    cube: 'M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9',
    mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M9 21h6',
    bolt: 'M13 3 5 14h6l-1 7 8-11h-6z',
    thermo: 'M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z',
    drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    refresh: 'M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5',
    fog: 'M5 8h14M3 12h18M6 16h12M9 20h6',
    calculator: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01',
    cart: 'M3 4h2.2l2.3 11h11L20.5 7H6.2M9.5 20h.01M17 20h.01',
  };
  ui.icon = (n, cls = '') => `<svg class="ic ic-${n} ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ICONS.info}"/></svg>`;
  const I = ui.icon;

  /* ---------------- navigasyon ---------------- */
  const NAV = [
    { g: 'Genel', items: [{ id: 'dashboard', t: 'Ana Sayfa', i: 'home' }, { id: 'projects', t: 'Projeler', i: 'building' }, { id: 'todos', t: 'Görevler', i: 'check' }] },
    { g: 'Finans & Satış', items: [
      { id: 'expenses', t: 'Harcama & Ödeme', i: 'receipt' }, { id: 'hakedis', t: 'Hakediş', i: 'clipboard' },
      { id: 'contracts', t: 'Sözleşmeler', i: 'file' }, { id: 'sales', t: 'Satış & Tahsilat', i: 'tag' }] },
    { g: 'Saha Operasyonu', items: [
      { id: 'workforce', t: 'Personel & Puantaj', i: 'users' }, { id: 'stock', t: 'Stok & Malzeme', i: 'box' }, { id: 'orders', t: 'Satın Alma', i: 'cart' },
      { id: 'concrete', t: 'Beton & Numune', i: 'cube' }, { id: 'diary', t: 'Şantiye Defteri', i: 'book' }, { id: 'safety', t: 'İSG & Kalite', i: 'shield' }, { id: 'machines', t: 'Makine Parkı', i: 'truck' }] },
    { g: 'Analiz & Araçlar', items: [
      { id: 'ai', t: 'Şantiye AI', i: 'sparkles' }, { id: 'guide', t: 'Rehber & Hesaplar', i: 'calculator' }, { id: 'forms', t: 'Form & Tutanaklar', i: 'note' },
      { id: 'dwg', t: 'Çizim Görüntüleyici', i: 'layers' }, { id: 'reports', t: 'Raporlar', i: 'chart' }] },
  ];
  ui.NAV = NAV;
  const flatNav = NAV.flatMap((g) => g.items);
  const BOTTOM = ['dashboard', 'expenses', 'workforce', 'stock'];

  function navItem(it, badges) {
    const b = badges[it.id];
    return `<a class="nav-i" href="#/${it.id}" data-route="${it.id}" title="${esc(it.t)}">${I(it.i)}<span class="nav-t">${esc(it.t)}</span>${b ? `<em class="nav-b ${b.level}">${b.n}</em>` : ''}</a>`;
  }

  ui.shell = function () {
    const badges = SS.calc.badges();
    const CLOUD = !!(SS.cloud && SS.cloud.enabled);
    $('#app').innerHTML = `
    <div class="app ${SS.cfg.sidebar ? 'collapsed' : ''}" id="appRoot">
      <aside class="sidebar" id="sidebar" aria-label="Ana menü">
        <div class="brand"><span class="logo">${logoSvg()}</span><span class="brand-t"><b>Şantiye Şefi</b><small>Saha yönetim merkezi</small></span>
          <button class="icon-btn side-collapse" data-action="side.collapse" title="Menüyü daralt">${I('chevL')}</button></div>
        <nav class="nav" id="navList">${NAV.map((g) => `<div class="nav-g"><div class="nav-gt">${g.g}</div>${g.items.map((it) => navItem(it, badges)).join('')}</div>`).join('')}</nav>
        <div class="side-foot">${CLOUD ? `<a class="nav-i" href="#/account" data-route="account">${I('users')}<span class="nav-t">Hesap & Lisans</span></a>` : ''}<a class="nav-i" href="#/settings" data-route="settings">${I('gear')}<span class="nav-t">Ayarlar & Yedek</span></a>
          <div class="me"><span class="av">${U.initials(SS.cfg.user)}</span><span class="me-t"><b>${esc(SS.cfg.user)}</b><small>${esc(SS.cfg.company)}</small></span></div></div>
      </aside>
      <div class="scrim nav-scrim" data-action="side.close"></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn hamb" data-action="side.open" aria-label="Menü">${I('menu')}</button>
          <div class="tb-title"><h1 id="tbTitle">Ana Sayfa</h1></div>
          <div class="tb-right">
            <button class="proj-btn" id="projBtn" data-action="proj.panel" aria-haspopup="dialog" aria-expanded="false" title="Şantiye seç"><span class="pb-ic">${I('building')}<i class="pb-st"></i></span><span class="pb-t"><small>Şantiye</small><b id="projBtnName">Tüm Şantiyeler</b></span>${I('chevD')}</button>
            ${CLOUD ? `<button class="icon-btn sync-btn" id="syncBtn" data-action="acct.open" data-state="idle" title="Eşitleme durumu" aria-label="Eşitleme durumu">${I('refresh')}<em class="sync-n"></em></button>` : ''}
            <button class="icon-btn" data-action="pal.open" title="Ara (Ctrl+K)" aria-label="Ara">${I('search')}</button>
            <button class="icon-btn bell" id="bellBtn" data-action="bell.open" title="Uyarılar" aria-label="Uyarılar">${I('bell')}<em class="bell-n"></em></button>
            <button class="icon-btn" id="soundBtn" data-action="sound.toggle" title="Ses efektleri">${I(SS.cfg.sound ? 'volume' : 'mute')}</button>
            <button class="icon-btn" id="themeBtn" data-action="theme.toggle" title="Tema">${I('moon')}</button>
            <button class="btn primary quick" data-action="quick.open">${I('plus')}<span>Hızlı Ekle</span></button>
          </div>
        </header>
        <main id="view" class="view" tabindex="-1"></main>
      </div>
      <nav class="bottomnav" id="bottomNav" aria-label="Alt menü">
        ${BOTTOM.map((id) => { const it = flatNav.find((x) => x.id === id); return `<a class="bn-i" href="#/${id}" data-route="${id}">${I(it.i)}<span>${esc(it.t.split(' ')[0] === 'Ana' ? 'Panel' : it.t.split(' ')[0])}</span></a>`; }).join('')}
        <button class="bn-i bn-more" data-action="more.open">${I('grid')}${CLOUD ? '<i class="sync-dot"></i>' : ''}<span>Menü</span></button>
      </nav>
    </div>
    <div id="layers"></div><div id="toasts" aria-live="polite"></div><div id="tip" role="tooltip"></div>`;
    ui.fillProjSel();
    ui.applyTheme();
    if (ui.updateBell) ui.updateBell();
    if (CLOUD && SS.cloud.onStatus) SS.cloud.onStatus(SS.cloud.status);   // yeniden çizilen kabukta eşitleme düğmesini güncel durumla doldur
  };

  function logoSvg() {
    return `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--brand)"/><path d="M6 24h20M9 24V15l7-6 7 6v9M13 24v-5h6v5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  ui.logoSvg = logoSvg;

  ui.fillProjSel = function () {
    const sel = $('#projSel'); if (!sel) return;
    sel.innerHTML = `<option value="all">Tüm Şantiyeler</option>` + SS.D.projects.map((p) => `<option value="${p.id}">${esc(p.shortName || p.name)}</option>`).join('');
    if (!SS.D.projects.find((p) => p.id === SS.cfg.activeProject)) SS.cfg.activeProject = 'all';
    sel.value = SS.cfg.activeProject;
  };

  ui.refreshBadges = function () {
    const badges = SS.calc.badges();
    $$('#navList .nav-i').forEach((a) => {
      const id = a.dataset.route; const old = $('.nav-b', a); if (old) old.remove();
      const b = badges[id]; if (b) a.insertAdjacentHTML('beforeend', `<em class="nav-b ${b.level}">${b.n}</em>`);
    });
  };

  /* ---------------- tema ---------------- */
  ui.applyTheme = function () {
    const t = SS.cfg.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : SS.cfg.theme;
    document.documentElement.dataset.theme = t;
    const b = $('#themeBtn'); if (b) b.innerHTML = I(t === 'dark' ? 'sun' : 'moon');
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#0f1317' : '#f4f3ef';
    try { if (window.AndroidBridge) window.AndroidBridge.setTheme(t === 'dark'); } catch (e) { /* */ }
  };

  /* ---------------- yönlendirme ---------------- */
  ui.current = { name: 'dashboard', params: [] };
  ui.route = function (animate = true) {
    const h = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [name, ...params] = h.split('/').map(decodeURIComponent);
    const v = SS.views[name] || SS.views.dashboard;
    const changed = ui.current.name !== name || animate === true;
    ui.current = { name: SS.views[name] ? name : 'dashboard', params };
    const el = $('#view'); if (!el) return;
    if (v.cleanup) { try { SS.views[ui._last]?.cleanup?.(); } catch (e) { /* */ } }
    ui._last = ui.current.name;
    const y = window.scrollY;
    try { el.innerHTML = v.render(...params); }
    catch (e) { console.error(e); el.innerHTML = `<div class="page"><div class="card pad"><h3>Bu sayfa yüklenemedi</h3><p class="muted">${esc(e.message)}</p></div></div>`; }
    el.classList.toggle('enter', changed && animate !== 'quiet');
    el.classList.toggle('no-anim', animate === 'quiet');
    ui.hydrate(el);
    try { v.mount && v.mount(el, ...params); } catch (e) { console.error(e); }
    const title = v.title || 'Şantiye Şefi';
    $('#tbTitle').textContent = typeof title === 'function' ? title(...params) : title;
    document.title = `${$('#tbTitle').textContent} · Şantiye Şefi`;
    const rid = ui.current.name;
    $$('[data-route]').forEach((a) => a.classList.toggle('on', a.dataset.route === rid || (rid === 'projects' && a.dataset.route === 'projects')));
    $('#appRoot').classList.remove('nav-open');
    if (animate === 'quiet') window.scrollTo(0, y); else if (changed) window.scrollTo(0, 0);
  };
  ui.rerender = () => { ui.route('quiet'); ui.refreshBadges(); };
  ui.go = (path) => { if (location.hash === '#/' + path) ui.route(); else location.hash = '#/' + path; };

  /* bölgeler: sayfanın bir kısmını yeniden çiz (arama kutusu odağı korunur) */
  ui.region = (name, fn) => { SS.regions[name] = fn; return `<div class="region" data-region="${name}">${fn()}</div>`; };
  ui.update = (name) => {
    const el = $(`[data-region="${name}"]`); if (!el || !SS.regions[name]) return;
    el.innerHTML = SS.regions[name](); el.classList.add('no-anim'); ui.hydrate(el);
  };

  /* ---------------- küçük bileşenler ---------------- */
  ui.head = ({ title, sub, actions = '' }) => `<div class="page-head"><div><h2 class="page-t">${title}</h2>${sub ? `<p class="page-s">${sub}</p>` : ''}</div><div class="page-a">${actions}</div></div>`;
  ui.badge = (t, tone = 'muted', icon) => `<span class="badge ${tone}">${icon ? I(icon) : ''}${esc(t)}</span>`;
  ui.bar = (pct, tone = 'brand', cls = '') => `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i class="${tone}" style="width:${U.clamp(pct, 0, 100)}%"></i></div>`;
  ui.avatar = (name, tone = 0) => `<span class="av t${tone % 6}">${esc(U.initials(name))}</span>`;
  ui.empty = (icon, title, text, action = '') => `<div class="empty">${I(icon)}<h4>${esc(title)}</h4><p>${text || ''}</p>${action}</div>`;
  ui.kpi = ({ label, value, fmt = 'money', sub = '', icon = 'wallet', tone = 'brand', href, raw }) => {
    const shown = raw != null ? raw : fmt === 'money' ? U.money(value) : fmt === 'compact' ? U.compact(value) : fmt === 'pct' ? U.pct(value) : U.num(value);
    const attr = raw != null ? '' : ` data-count="${value}" data-fmt="${fmt}"`;
    const inner = `<div class="kpi-ic tone-${tone}">${I(icon)}</div><div class="kpi-l">${label}</div><div class="kpi-v"${attr}>${shown}</div>${sub ? `<div class="kpi-s">${sub}</div>` : ''}`;
    return href ? `<a class="kpi card link" href="${href}">${inner}</a>` : `<div class="kpi card">${inner}</div>`;
  };
  ui.tabs = (view, key, items, cur) => `<div class="tabs" role="tablist">${items.map(([v, l, n]) => `<button role="tab" class="tab ${v === cur ? 'on' : ''}" aria-selected="${v === cur}" data-action="vs.set" data-view="${view}" data-key="${key}" data-val="${v}">${l}${n != null ? `<em>${n}</em>` : ''}</button>`).join('')}</div>`;
  ui.seg = (view, key, items, cur) => `<div class="seg" role="group">${items.map(([v, l]) => `<button class="${v === cur ? 'on' : ''}" aria-pressed="${v === cur}" data-action="vs.set" data-view="${view}" data-key="${key}" data-val="${v}">${l}</button>`).join('')}</div>`;
  /* Görünüm durumu: AYNI nesneyi döndürür (eskiden her çağrıda kopyalanıyordu; bu yüzden eski referanslar üzerinde yapılan
     değişiklikler — örn. AI sohbetindeki "busy" bayrağı — kayboluyordu). Eksik varsayılanlar yerinde tamamlanır. */
  ui.vs = (view, def = {}) => { const cur = SS.vs[view] || (SS.vs[view] = {}); for (const k in def) if (!(k in cur)) cur[k] = def[k]; return cur; };
  ui.projectName = (id) => (SS.D.projects.find((p) => p.id === id) || {}).shortName || '—';
  ui.firmName = (id) => (SS.D.firms.find((f) => f.id === id) || {}).name || '—';
  ui.opts = (arr, cur) => arr.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
  ui.projOpts = (all = false) => (all ? [['', 'Tüm şantiyeler']] : []).concat(SS.D.projects.map((p) => [p.id, p.shortName || p.name]));
  ui.firmOpts = (types) => [['', '— Seçiniz —']].concat(SS.D.firms.filter((f) => !types || types.includes(f.type)).map((f) => [f.id, f.name]));

  ui.toolbar = ({ view, q = true, ph = 'Ara…', filters = [], upd, right = '' }) => {
    const st = ui.vs(view);
    return `<div class="toolbar">${q ? `<label class="search">${I('search')}<input type="search" data-vs="${view}.q" data-upd="${upd}" value="${esc(st.q || '')}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" autocomplete="off"></label>` : ''}
    ${filters.map((f) => f.type === 'date'
      ? `<label class="filt"><span>${f.label}</span><input class="select" type="date" data-vs="${view}.${f.k}" data-upd="${upd}" value="${esc(st[f.k] || '')}"></label>`
      : `<label class="filt"><span>${f.label}</span><select class="select" data-vs="${view}.${f.k}" data-upd="${upd}">${ui.opts(f.opts, st[f.k] ?? '')}</select></label>`).join('')}
    <span class="grow"></span>${right}</div>`;
  };

  ui.table = ({ cols, rows, empty = 'Kayıt bulunamadı', foot = '' }) => {
    if (!rows.length) return ui.empty('search', empty, 'Filtreleri değiştirmeyi veya yeni kayıt eklemeyi deneyin.');
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map((c) => `<th class="${c.cls || ''}">${c.h || ''}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr${r._attr ? ' ' + r._attr : ''}>${cols.map((c, i) => `<td class="${c.cls || ''} ${c.act ? 'act' : ''} ${i === 0 ? 'main' : ''}" data-label="${esc(c.h || '')}">${c.c(r)}</td>`).join('')}</tr>`).join('')}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ''}</table></div>`;
  };

  /* ---------------- sayaç / görsel / animasyon hidrasyonu ---------------- */
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FMT = { money: U.money, compact: U.compact, pct: (n) => U.pct(n), num: (n) => U.num(n), money2: U.money2 };
  ui.hydrate = function (root = document) {
    $$('[data-count]', root).forEach((el) => {
      const target = +el.dataset.count, f = FMT[el.dataset.fmt] || FMT.num;
      if (reduce() || !isFinite(target) || Math.abs(target) < 2) { el.textContent = f(target); return; }
      const t0 = performance.now(), dur = 850;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = f(target * e); if (k < 1) requestAnimationFrame(step); else el.textContent = f(target); };
      requestAnimationFrame(step);
    });
    $$('img[data-blob]', root).forEach(async (img) => { const u = await SS.blob.url(img.dataset.blob); if (u) img.src = u; });
    $$('.ring-fg[data-off]', root).forEach((el) => { requestAnimationFrame(() => requestAnimationFrame(() => { el.style.strokeDashoffset = el.dataset.off; })); });
  };

  /* ---------------- sheet / modal ---------------- */
  const stack = [];
  ui.sheet = function (o) {
    const wrap = document.createElement('div');
    wrap.className = 'layer';
    wrap.innerHTML = `<div class="scrim" data-sheet-close></div>
      <section class="sheet ${o.side ? 'side' : ''} ${o.wide ? 'wide' : ''} ${o.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title || '')}">
        <header class="sheet-h"><h3>${o.title || ''}</h3>${o.headExtra || ''}<button class="icon-btn" data-sheet-close aria-label="Kapat">${I('x')}</button></header>
        <div class="sheet-b">${o.body || ''}</div>${o.footer ? `<footer class="sheet-f">${o.footer}</footer>` : ''}
      </section>`;
    $('#layers').appendChild(wrap);
    document.body.classList.add('lock');
    const api = {
      el: wrap, body: $('.sheet-b', wrap), sheet: $('.sheet', wrap),
      set(html) { this.body.innerHTML = html; ui.hydrate(this.body); },
      close(result) {
        if (api.closed) return; api.closed = true;
        const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
        wrap.classList.remove('open'); wrap.classList.add('closing');
        setTimeout(() => { wrap.remove(); if (!stack.length) document.body.classList.remove('lock'); }, 230);
        o.onClose && o.onClose(result);
      },
    };
    wrap._api = api; stack.push(api);
    requestAnimationFrame(() => wrap.classList.add('open'));
    ui.hydrate(wrap);
    SS.sound.pop();
    if (o.mount) o.mount(api.body, api);
    if (matchMedia('(pointer:fine)').matches) { const f = $('input:not([type=hidden]):not([type=file]),select,textarea', api.body); f && !o.noFocus && setTimeout(() => f.focus(), 120); }
    return api;
  };
  ui.closeAll = () => [...stack].forEach((a) => a.close());

  ui.confirm = ({ title = 'Emin misiniz?', text = '', ok = 'Evet, sil', danger = true }) =>
    new Promise((res) => {
      let done = false;
      const api = ui.sheet({
        title, cls: 'small', noFocus: true, body: `<p class="confirm-p">${text}</p>`,
        footer: `<button class="btn ghost" data-sheet-close>Vazgeç</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cfOk">${ok}</button>`,
        onClose: () => { if (!done) res(false); },
      });
      $('#cfOk', api.el).addEventListener('click', () => { done = true; res(true); api.close(); });
      if (danger) SS.sound.warn();
    });

  ui.toast = function (msg, tone = 'ok') {
    const t = document.createElement('div'); t.className = 'toast ' + tone; t.setAttribute('role', 'status');
    t.innerHTML = `${I(tone === 'bad' ? 'alert' : tone === 'info' ? 'info' : 'check')}<span>${msg}</span>`;
    $('#toasts').appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
    tone === 'bad' ? SS.sound.warn() : tone === 'ok' && SS.sound.ok();
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 3200);
  };

  /* ---------------- form oluşturucu ---------------- */
  const HALF = ['number', 'money', 'date', 'select', 'tel', 'time'];
  function fieldHtml(f, val) {
    const id = 'f_' + f.name, req = f.required ? '<i class="req" title="Zorunlu">*</i>' : '';
    const half = f.full ? false : f.half != null ? f.half : HALF.includes(f.type);
    let inp = '';
    const common = `id="${id}" name="${f.name}" ${f.required ? 'required' : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}`;
    switch (f.type) {
      case 'select': inp = `<select class="input" ${common}>${f.noEmpty ? '' : ''}${ui.opts(f.options, val ?? '')}</select>`; break;
      case 'textarea': inp = `<textarea class="input" rows="${f.rows || 3}" ${common}>${esc(val ?? '')}</textarea>`; break;
      case 'check': inp = `<label class="check"><input type="checkbox" name="${f.name}" ${val ? 'checked' : ''}><span>${f.text || f.label}</span></label>`; break;
      case 'range': inp = `<div class="range-row"><input type="range" ${common} min="${f.min ?? 0}" max="${f.max ?? 100}" step="${f.step ?? 1}" value="${val ?? 0}"><output>${val ?? 0}${f.suffix || ''}</output></div>`; break;
      case 'seg': inp = `<div class="seg wide">${f.options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<label><input type="radio" name="${f.name}" value="${esc(v)}" ${String(val ?? f.options[0]) === String(v) ? 'checked' : ''}><span>${esc(l)}</span></label>`; }).join('')}</div>`; break;
      case 'image': case 'file': inp = `<div class="filebox"><input type="file" ${common.replace('required', '')} accept="${f.accept || (f.type === 'image' ? 'image/*' : '*/*')}" ${f.multiple ? 'multiple' : ''}><div class="thumbs" data-thumbs="${f.name}">${(Array.isArray(val) ? val : val ? [val] : []).map((b) => `<img data-blob="${esc(b.id || b)}" alt="">`).join('')}</div></div>`; break;
      case 'money': case 'number': inp = `<input class="input" type="number" inputmode="decimal" step="${f.step || (f.type === 'money' ? '0.01' : 'any')}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} value="${val ?? ''}" ${common}>`; break;
      default: inp = `<input class="input" type="${f.type || 'text'}" value="${esc(val ?? '')}" ${common} ${f.type === 'date' ? '' : 'autocomplete="off"'}>`;
    }
    if (f.type === 'check') return `<div class="fld ${half ? 'half' : ''}">${inp}${f.hint ? `<small class="hint">${f.hint}</small>` : ''}</div>`;
    if (f.type === 'html') return `<div class="fld">${f.html}</div>`;
    return `<div class="fld ${half ? 'half' : ''}" data-fld="${f.name}"><label for="${id}">${f.label}${req}</label>${inp}${f.hint ? `<small class="hint">${f.hint}</small>` : ''}<small class="ferr-t"></small></div>`;
  }

  function readForm(form, fields) {
    const out = {};
    fields.forEach((f) => {
      if (f.type === 'html') return;
      const el = form.elements[f.name];
      if (!el) return;
      if (f.type === 'check') out[f.name] = !!el.checked;
      else if (f.type === 'seg') out[f.name] = form.querySelector(`input[name="${f.name}"]:checked`)?.value;
      else if (f.type === 'image' || f.type === 'file') out[f.name] = [...el.files];
      else if (f.type === 'number' || f.type === 'money' || f.type === 'range') out[f.name] = el.value === '' ? null : parseFloat(el.value);
      else out[f.name] = typeof el.value === 'string' ? el.value.trim() : el.value;
    });
    return out;
  }
  ui.readForm = readForm;

  ui.form = function (o) {
    const fid = U.id('frm'); const vals = o.values || {};
    const body = `<form id="${fid}" class="form" novalidate><div class="fgrid">${o.fields.map((f) => fieldHtml(f, vals[f.name] ?? f.value)).join('')}</div>${o.extra || ''}</form>`;
    const footer = `${o.danger ? `<button type="button" class="btn danger-ghost left" data-form-danger>${I('trash')}${o.danger.label || 'Sil'}</button>` : ''}<button type="button" class="btn ghost" data-sheet-close>Vazgeç</button><button class="btn primary" type="submit" form="${fid}">${o.submit || 'Kaydet'}</button>`;
    const api = ui.sheet({
      title: o.title, body, footer, side: o.side, wide: o.wide, cls: o.cls, onClose: o.onClose,
      mount(el, a) {
        const form = $('form', el);
        const live = () => { if (o.onInput) o.onInput(readForm(form, o.fields), a, form); };
        form.addEventListener('input', (e) => {
          const t = e.target; if (t.type === 'range') { const out = t.parentElement.querySelector('output'); if (out) out.textContent = t.value + (o.fields.find((f) => f.name === t.name)?.suffix || ''); }
          if (t.type === 'file') {
            const box = $(`[data-thumbs="${t.name}"]`, form); box.innerHTML = '';
            [...t.files].forEach((f) => { if (f.type.startsWith('image/')) { const im = document.createElement('img'); im.src = URL.createObjectURL(f); box.appendChild(im); } else box.insertAdjacentHTML('beforeend', `<span class="badge muted">${esc(f.name)}</span>`); });
          }
          live();
        });
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const vv = readForm(form, o.fields); let bad = false;
          $$('.fld.err', form).forEach((x) => x.classList.remove('err'));
          o.fields.forEach((f) => {
            if (!f.required) return; const v = vv[f.name];
            if (v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'number' && isNaN(v))) { bad = true; const w = $(`[data-fld="${f.name}"]`, form); if (w) { w.classList.add('err'); $('.ferr-t', w).textContent = 'Bu alan zorunludur'; } }
          });
          if (o.validate) { const msg = o.validate(vv); if (msg) { bad = true; ui.toast(msg, 'bad'); } }
          if (bad) { SS.sound.warn(); const first = $('.fld.err input,.fld.err select,.fld.err textarea', form); first && first.focus(); return; }
          const btn = $('button[type=submit][form]', a.el); btn.disabled = true;
          try { const r = await o.onSubmit(vv, a, form); if (r !== false) a.close(true); }
          catch (err) { console.error(err); ui.toast('Kayıt sırasında hata: ' + err.message, 'bad'); }
          btn.disabled = false;
        });
        const dg = $('[data-form-danger]', a.el); if (dg) dg.addEventListener('click', () => o.danger.onClick(a));
        live();
        o.mount && o.mount(el, a, form);
      },
    });
    return api;
  };

  /* ---------------- yardımcılar ---------------- */
  /* Android uygulamasında (WebView) indirme: dosya köprü üzerinden İndirilenler klasörüne yazılır */
  ui.isApp = () => !!window.AndroidBridge;
  ui.isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  ui.download = (name, blob) => {
    if (window.AndroidBridge) {
      const fr = new FileReader();
      fr.onload = () => { try { window.AndroidBridge.saveFile(name, blob.type || 'application/octet-stream', String(fr.result).split(',')[1] || ''); } catch (e) { ui.toast('Dosya kaydedilemedi: ' + e.message, 'bad'); } };
      fr.readAsDataURL(blob); return;
    }
    /* iPhone/iPad ve dokunmatik ana ekran uygulamasında: dosyayı paylaşım menüsüne ver (Dosyalar'a kaydet, WhatsApp, e-posta…) */
    if (ui.isIOS() || (matchMedia('(display-mode: standalone)').matches && matchMedia('(pointer: coarse)').matches)) {
      try {
        const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
      } catch (e) { /* normal indirmeye düş */ }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  ui.pickFiles = (accept = '*/*', multiple = false) => new Promise((res) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple; i.style.display = 'none';
    i.addEventListener('change', () => { res([...i.files]); i.remove(); }); document.body.appendChild(i); i.click();
  });
  ui.lightbox = async (blobId, caption = '') => {
    const u = await SS.blob.url(blobId); if (!u) return;
    ui.sheet({ title: esc(caption || 'Görsel'), wide: true, noFocus: true, body: `<img class="lightbox-img" src="${u}" alt="">` });
  };

  ui.NEEDS_PROJECT = new Set(['exp.new', 'stock.in', 'stock.out', 'mat.new', 'wf.today', 'wk.new', 'diary.new', 'safety.check', 'punch.new', 'mach.log', 'mach.new', 'ct.new', 'hk.new', 'unit.new', 'dwg.upload', 'concrete.new', 'order.new']);

  /* ---------------- paylaşım yardımcıları ---------------- */
  ui.copy = (text, msg = 'Kopyalandı') => { try { navigator.clipboard.writeText(text).then(() => ui.toast(msg), () => ui.toast('Kopyalanamadı', 'bad')); } catch (e) { ui.toast('Kopyalanamadı', 'bad'); } };
  /* Türkiye telefon numarasını WhatsApp biçimine (90…) çevirir */
  ui.waNumber = (ph) => { let d = String(ph || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '90' + d.slice(1); else if (d.length === 10) d = '90' + d; return d.length >= 11 ? d : ''; };
  ui.share = (text, phone) => {
    if (phone && ui.waNumber(phone) && !ui.isApp()) { window.open(`https://wa.me/${ui.waNumber(phone)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); return; }
    if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
    if (!ui.isApp()) { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); return; }
    ui.copy(text, 'Metin kopyalandı — istediğiniz uygulamaya yapıştırın');
  };

  /* ---------------- genel olay yönlendirme ---------------- */
  SS.actions['vs.set'] = (el) => { const d = el.dataset; ui.vs(d.view)[d.key] = d.val; ui.rerender(); };
  SS.actions['side.open'] = () => $('#appRoot').classList.add('nav-open');
  SS.actions['side.close'] = () => $('#appRoot').classList.remove('nav-open');
  SS.actions['side.collapse'] = () => { SS.cfg.sidebar = !SS.cfg.sidebar; SS.store.save(); $('#appRoot').classList.toggle('collapsed', SS.cfg.sidebar); };
  SS.actions['sound.toggle'] = () => { SS.sound.toggle(!SS.cfg.sound); $('#soundBtn').innerHTML = I(SS.cfg.sound ? 'volume' : 'mute'); ui.toast(SS.cfg.sound ? 'Ses efektleri açıldı' : 'Ses efektleri kapatıldı', 'info'); };
  SS.actions['theme.toggle'] = () => { const cur = document.documentElement.dataset.theme; SS.cfg.theme = cur === 'dark' ? 'light' : 'dark'; SS.store.save(); ui.applyTheme(); ui.rerender(); };
  SS.actions.go = (el) => ui.go(el.dataset.to);
  SS.actions['more.open'] = () => {
    ui.sheet({ title: 'Tüm Modüller', cls: 'menu-sheet', noFocus: true, body: `<div class="more-grid">${flatNav.concat(SS.cloud && SS.cloud.enabled ? [{ id: 'account', t: 'Hesap & Lisans', i: 'users' }] : [], [{ id: 'settings', t: 'Ayarlar', i: 'gear' }]).map((it) => `<a class="more-i" href="#/${it.id}" data-sheet-close>${I(it.i)}<span>${esc(it.t)}</span></a>`).join('')}</div>` });
  };
  SS.actions['quick.open'] = () => {
    const q = [
      ['exp.new', 'receipt', 'Harcama Gir', 'tone-brand'], ['stock.in', 'box', 'Malzeme Girişi', 'tone-ok'], ['stock.out', 'arrowUp', 'Malzeme Çıkışı', 'tone-warn'],
      ['wf.today', 'users', 'Puantaj Al', 'tone-info'], ['diary.new', 'book', 'Defter Yaz', 'tone-brand'], ['safety.check', 'shield', 'İSG Kontrolü', 'tone-ok'],
      ['punch.new', 'flag', 'Eksik / Kusur', 'tone-bad'], ['mach.log', 'truck', 'Makine Kaydı', 'tone-info'],
    ];
    ui.sheet({ title: 'Hızlı Ekle', cls: 'menu-sheet', noFocus: true, body: `<div class="more-grid">${q.map(([a, i, t, tn]) => `<button class="more-i" data-action="${a}" data-sheet-close><span class="kpi-ic ${tn}">${I(i)}</span><span>${t}</span></button>`).join('')}</div>` });
  };

  document.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-sheet-close]');
    if (sc) { const w = sc.closest('.layer'); if (w && w._api) { SS.sound.click(); w._api.close(); } }
    const el = e.target.closest('[data-action]');
    if (el) {
      const fn = SS.actions[el.dataset.action];
      if (!fn) { console.warn('Eylem yok:', el.dataset.action); return; }
      /* Şantiye tanımlı değilken kayıt ekleme eylemleri: önce şantiye eklemeye yönlendir */
      if (ui.NEEDS_PROJECT.has(el.dataset.action) && !SS.D.projects.length) { e.preventDefault(); ui.toast('Önce ilk şantiyenizi ekleyin', 'info'); SS.actions['proj.new'](); return; }
      if (el.tagName === 'A' && !el.getAttribute('href')?.startsWith('#/')) e.preventDefault();
      SS.sound.click(); fn(el, e); return;
    }
    if (e.target.closest('button, a[href^="#/"], summary, .tab, .seg label')) SS.sound.click();
  });
  const vsApply = (el) => {
    const [v, k] = el.dataset.vs.split('.'); const st = ui.vs(v);
    st[k] = el.type === 'checkbox' ? el.checked : el.value;
    el.dataset.upd ? ui.update(el.dataset.upd) : ui.rerender();
  };
  const vsDeb = U.debounce(vsApply, 110);
  document.addEventListener('input', (e) => { const el = e.target.closest('[data-vs]'); if (el && (el.type === 'search' || el.type === 'text')) vsDeb(el); });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-vs]'); if (el && el.type !== 'search' && el.type !== 'text') vsApply(el);
    if (e.target.id === 'projSel') { SS.cfg.activeProject = e.target.value; SS.store.save(); ui.rerender(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close(); });
  window.addEventListener('hashchange', () => ui.route(true));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (SS.cfg.theme === 'auto') ui.applyTheme(); });

  /* ---------------- ipucu (tooltip) ---------------- */
  let tipT;
  const tipEl = () => $('#tip');
  function showTip(t, x, y) {
    const tp = tipEl(); if (!tp) return; tp.textContent = t.dataset.tip; tp.classList.add('on');
    const r = tp.getBoundingClientRect(); let L = x + 14, T = y + 16;
    if (L + r.width > innerWidth - 8) L = x - r.width - 14; if (T + r.height > innerHeight - 8) T = y - r.height - 14;
    tp.style.transform = `translate(${Math.max(8, L)}px,${Math.max(8, T)}px)`;
  }
  document.addEventListener('pointermove', (e) => { const t = e.target.closest?.('[data-tip]'); if (t) showTip(t, e.clientX, e.clientY); else tipEl()?.classList.remove('on'); });
  document.addEventListener('pointerdown', (e) => { const t = e.target.closest?.('[data-tip]'); if (t && e.pointerType === 'touch') { showTip(t, e.clientX, e.clientY); clearTimeout(tipT); tipT = setTimeout(() => tipEl()?.classList.remove('on'), 2200); } });
  document.addEventListener('pointerleave', () => tipEl()?.classList.remove('on'), true);
})();
