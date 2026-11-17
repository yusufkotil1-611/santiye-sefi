/* DWG / DXF / PDF / görsel çizim görüntüleyici — pan & zoom, katman, kalibrasyonlu uzunluk ve alan ölçümü */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;

  SS.css(`
  .dwg{display:grid;grid-template-columns:290px minmax(0,1fr);gap:16px;align-items:start}
  .dwg-side{display:flex;flex-direction:column;gap:14px;position:sticky;top:76px}
  .dwg-list{display:flex;flex-direction:column;gap:6px;padding:10px}
  .dwg-item{display:flex;gap:10px;align-items:center;padding:10px;border-radius:12px;border:1.5px solid transparent;cursor:pointer;text-align:left;background:transparent;width:100%}
  .dwg-item:hover{background:var(--surface-2)}.dwg-item.on{border-color:var(--brand);background:var(--brand-soft)}.dwg-item .kpi-ic{width:36px;height:36px;margin:0}.dwg-item b{display:block;font-size:13.5px;line-height:1.3}.dwg-item small{color:var(--muted);font-size:12px}
  .layers{padding:6px 14px 12px;display:flex;flex-direction:column;gap:2px;max-height:300px;overflow:auto}.layers label{display:flex;align-items:center;gap:10px;padding:7px 4px;font-size:13.5px;font-weight:600;cursor:pointer;border-radius:8px}.layers label:hover{background:var(--surface-2)}
  .layers input{width:18px;height:18px;accent-color:var(--brand)}.layers i{width:12px;height:12px;border-radius:4px;flex:none}.layers small{margin-left:auto;color:var(--muted);font-weight:500}
  .dwg-stage{overflow:hidden;display:flex;flex-direction:column}
  .dwg-tools{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:10px;border-bottom:1px solid var(--line-2);background:var(--surface)}
  .dtool{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 12px;border-radius:11px;border:1.5px solid var(--line);background:var(--surface);font-weight:650;font-size:13.5px;cursor:pointer;transition:all .15s}
  .dtool:hover{border-color:var(--ink-2)}.dtool.on{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}.dtool .ic{width:18px;height:18px}
  .dsep{width:1px;height:26px;background:var(--line);margin:0 4px}
  .dwg-canvas-wrap{position:relative;height:calc(100vh - 290px);min-height:440px;background:#161b22;touch-action:none;overflow:hidden}.dwg-canvas-wrap.light{background:#f7f7f5}
  .dwg-canvas-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}.dwg-canvas-wrap.tool-dist canvas,.dwg-canvas-wrap.tool-area canvas,.dwg-canvas-wrap.tool-calib canvas,.dwg-canvas-wrap.tool-note canvas{cursor:crosshair}
  .dwg-hud{position:absolute;left:10px;bottom:10px;background:rgba(15,19,23,.78);color:#e8eaed;font-size:12px;padding:6px 11px;border-radius:10px;pointer-events:none;font-variant-numeric:tabular-nums;backdrop-filter:blur(4px)}
  .dwg-hint{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:var(--brand);color:var(--brand-ink);font-weight:650;font-size:13px;padding:7px 14px;border-radius:99px;pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.3);max-width:92%;text-align:center}
  .dwg-meas{position:absolute;right:10px;top:10px;width:230px;max-height:60%;overflow:auto;background:rgba(15,19,23,.86);color:#e8eaed;border-radius:14px;padding:10px 12px;font-size:12.5px;backdrop-filter:blur(6px)}
  .dwg-meas h4{margin:0 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#9aa4af;display:flex;justify-content:space-between;align-items:center}.dwg-meas h4 button{background:none;border:0;color:#ffb27a;font-weight:700;cursor:pointer;font-size:12px}
  .dwg-meas div{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-top:1px solid rgba(255,255,255,.08)}.dwg-meas b{color:#ffb27a;font-variant-numeric:tabular-nums}
  .dwg-embed{width:100%;height:calc(100vh - 290px);min-height:440px;border:0;background:#fff}
  .dwg-note{padding:12px 14px;font-size:13px;color:var(--muted);border-top:1px solid var(--line-2)}
  .dwg>*{min-width:0}.dwg-side .card{min-width:0}
  @media(max-width:1099px){.dwg{grid-template-columns:minmax(0,1fr)}.dwg-stage{order:-1}.dwg-side{position:static}.dwg-canvas-wrap,.dwg-embed{height:64vh;min-height:360px}.dwg-meas{width:190px}}
  @media(max-width:699px){.dwg-tools .dtool span{display:none}.dtool{padding:0 11px}.dwg-list{flex-direction:row;overflow-x:auto}.dwg-item{min-width:230px}.dwg-meas{display:none}}
  `);

  /* ---------------- katman stilleri ---------------- */
  const LS = {
    DUVAR: { n: 'Duvarlar', c: '#e8e8e8', c2: '#1f2328', w: 2.2 }, KAPI: { n: 'Kapılar', c: '#4fd1c5', c2: '#0f766e', w: 1.2 }, PENCERE: { n: 'Pencereler', c: '#63b3ed', c2: '#1d4ed8', w: 1.6 },
    KOLON: { n: 'Kolonlar (statik)', c: '#f6ad55', c2: '#b45309', w: 1.2 }, PERDE: { n: 'Perdeler (statik)', c: '#f6ad55', c2: '#92400e', w: 1.2 }, 'KİRİŞ': { n: 'Kirişler', c: '#ed8936', c2: '#9a3412', w: 1.5 },
    AKS: { n: 'Akslar', c: '#fc8181', c2: '#b91c1c', w: 0.9, dash: [14, 5, 3, 5] }, 'ÖLÇÜ': { n: 'Ölçülendirme', c: '#9ae6b4', c2: '#15803d', w: 0.9 }, YAZI: { n: 'Yazılar', c: '#e2e8f0', c2: '#1f2328', w: 1 },
    'TESİSAT': { n: 'Mekanik tesisat', c: '#4299e1', c2: '#1d4ed8', w: 1.9 }, 'ELEKTRİK': { n: 'Elektrik', c: '#ecc94b', c2: '#a16207', w: 1.3 }, BALKON: { n: 'Balkon / çıkma', c: '#a0aec0', c2: '#52525b', w: 1.2, dash: [7, 4] }, 'DÖŞEME': { n: 'Döşeme', c: '#a0aec0', c2: '#52525b', w: 1 },
  };

  /* ---------------- örnek çizimler (vektör) ---------------- */
  function builder() {
    const E = [];
    return { E,
      L: (l, x1, y1, x2, y2) => E.push({ t: 'l', l, p: [x1, y1, x2, y2] }),
      P: (l, p, c = false, f = false) => E.push({ t: 'p', l, p, c, f }),
      R: (l, x0, y0, x1, y1, f = false) => E.push({ t: 'p', l, p: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], c: true, f }),
      O: (l, x, y, r, f = false) => E.push({ t: 'c', l, x, y, r, f }),
      T: (l, x, y, h, s, a = 'c') => E.push({ t: 't', l, x, y, h, s, a }) };
  }
  function arcPts(cx, cy, r, a0, a1, n = 10) { const o = []; for (let i = 0; i <= n; i++) { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
  function axesAndDims(b, W, H, withDims) {
    const xs = [0, 1300, 1700, 3000], ys = [0, 850, 1700], A = ['A', 'B', 'C', 'D'];
    xs.forEach((x, i) => { b.L('AKS', x, -260, x, H + 260); b.O('AKS', x, -330, 70); b.T('AKS', x, -330, 62, A[i]); b.O('AKS', x, H + 330, 70); b.T('AKS', x, H + 330, 62, A[i]); });
    ys.forEach((y, i) => { b.L('AKS', -260, y, W + 260, y); b.O('AKS', -330, y, 70); b.T('AKS', -330, y, 62, String(i + 1)); b.O('AKS', W + 330, y, 70); b.T('AKS', W + 330, y, 62, String(i + 1)); });
    if (!withDims) return;
    const dH = (x1, x2, y, s) => { b.L('ÖLÇÜ', x1, y, x2, y); b.L('ÖLÇÜ', x1 - 14, y - 14, x1 + 14, y + 14); b.L('ÖLÇÜ', x2 - 14, y - 14, x2 + 14, y + 14); b.L('ÖLÇÜ', x1, y + 20, x1, y + 60); b.L('ÖLÇÜ', x2, y + 20, x2, y + 60); b.T('ÖLÇÜ', (x1 + x2) / 2, y - 34, 28, s); };
    const dV = (y1, y2, x, s) => { b.L('ÖLÇÜ', x, y1, x, y2); b.L('ÖLÇÜ', x - 14, y1 - 14, x + 14, y1 + 14); b.L('ÖLÇÜ', x - 14, y2 - 14, x + 14, y2 + 14); b.L('ÖLÇÜ', x + 20, y1, x + 60, y1); b.L('ÖLÇÜ', x + 20, y2, x + 60, y2); b.T('ÖLÇÜ', x - 34, (y1 + y2) / 2, 28, s, 'r'); };
    dH(0, 1300, -440, '13.00'); dH(1300, 1700, -440, '4.00'); dH(1700, 3000, -440, '13.00'); dH(0, 3000, -540, '30.00');
    dV(0, 850, -440, '8.50'); dV(850, 1700, -440, '8.50'); dV(0, 1700, -540, '17.00');
  }
  function buildArch() {
    const b = builder(), W = 3000, H = 1700;
    b.P('DUVAR', [[0, 0], [W, 0], [W, H], [0, H]], true); b.P('DUVAR', [[25, 25], [W - 25, 25], [W - 25, H - 25], [25, H - 25]], true);
    [1300, 1700].forEach((x) => { b.L('DUVAR', x - 12, 0, x - 12, H); b.L('DUVAR', x + 12, 0, x + 12, H); });
    /* çekirdek: giriş holü, merdiven, asansör, şaft */
    b.R('DUVAR', 1312, 500, 1688, 1000); for (let y = 520; y < 1000; y += 25) b.L('DUVAR', 1330, y, 1670, y); b.L('DUVAR', 1500, 500, 1500, 1000); b.T('YAZI', 1500, 1030, 26, 'MERDİVEN (↑)');
    b.R('DUVAR', 1312, 1060, 1688, 1450); b.L('DUVAR', 1312, 1060, 1688, 1450); b.L('DUVAR', 1312, 1450, 1688, 1060); b.T('YAZI', 1500, 1255, 28, 'ASANSÖR');
    b.T('YAZI', 1500, 1580, 26, 'ŞAFT'); b.T('YAZI', 1500, 250, 30, 'GİRİŞ HOLÜ');
    /* daire ünitesi */
    const rooms = [[0, 0, 700, 380, 'SALON'], [700, 0, 1000, 300, 'MUTFAK'], [1000, 0, 1300, 380, 'BANYO / WC'], [0, 380, 1300, 500, 'HOL'], [0, 500, 470, 850, 'YATAK 1'], [470, 500, 860, 850, 'YATAK 2'], [860, 500, 1300, 850, 'YATAK 3']];
    const doors = [[1300, 485, 0, 270, 180], [330, 500, 0, 360, 270], [560, 500, 0, 360, 270], [960, 500, 0, 360, 270], [560, 380, 0, 90, 0], [1190, 380, 0, 180, 90]];
    const wins = [[0, 100, 0, 300], [100, 0, 560, 0], [0, 580, 0, 780], [770, 0, 940, 0], [1090, 0, 1210, 0]];
    const lights = [[350, 190], [850, 150], [1150, 190], [650, 440], [1100, 440], [235, 675], [665, 675], [1080, 675]], sockets = [[30, 100], [30, 300], [300, 30], [1270, 700], [700, 840], [30, 740], [1000, 30]];
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([mx, my], ui_) => {
      const tf = (x, y) => [mx < 0 ? W - x : x, my < 0 ? H - y : y];
      rooms.forEach(([x0, y0, x1, y1, n]) => { const p = [tf(x0, y0), tf(x1, y0), tf(x1, y1), tf(x0, y1)]; b.P('DUVAR', p, true); const c = tf((x0 + x1) / 2, (y0 + y1) / 2 + (n === 'HOL' ? 0 : 20)); b.T('YAZI', c[0], c[1], 26, n); if (n !== 'HOL') { const ct = tf((x0 + x1) / 2, (y0 + y1) / 2 - 24); b.T('YAZI', ct[0], ct[1], 20, `${U.num(((x1 - x0) * (y1 - y0)) / 1e4, 1)} m²`); } });
      doors.forEach(([hx, hy, , a0, a1]) => { const h = tf(hx, hy); const pts = arcPts(hx, hy, 90, a0, a1).map(([x, y]) => tf(x, y)); b.P('KAPI', pts); b.L('KAPI', h[0], h[1], pts[pts.length - 1][0], pts[pts.length - 1][1]); });
      wins.forEach(([x1, y1, x2, y2]) => { const o = 12; const horiz = y1 === y2; const q = horiz ? [tf(x1, -o), tf(x2, -o), tf(x2, o), tf(x1, o)] : [tf(-o, y1), tf(o, y1), tf(o, y2), tf(-o, y2)]; b.P('PENCERE', q, true); const m = horiz ? [tf(x1, 0), tf(x2, 0)] : [tf(0, y1), tf(0, y2)]; b.L('PENCERE', m[0][0], m[0][1], m[1][0], m[1][1]); });
      lights.forEach(([x, y]) => { const c = tf(x, y); b.O('ELEKTRİK', c[0], c[1], 16); b.L('ELEKTRİK', c[0] - 24, c[1], c[0] + 24, c[1]); b.L('ELEKTRİK', c[0], c[1] - 24, c[0], c[1] + 24); });
      sockets.forEach(([x, y]) => { const c = tf(x, y); b.R('ELEKTRİK', c[0] - 8, c[1] - 8, c[0] + 8, c[1] + 8); });
      const pn = tf(1270, 410); b.R('ELEKTRİK', pn[0] - 8, pn[1] - 20, pn[0] + 8, pn[1] + 20, true);
      const rs = tf(1010, 60); b.O('TESİSAT', rs[0], rs[1], 14, true); [[[1010, 60], [1010, 200], [1180, 200]], [[1010, 60], [850, 60], [850, 25]], [[1010, 60], [1010, 330], [1250, 330]]].forEach((pl) => b.P('TESİSAT', pl.map(([x, y]) => tf(x, y))));
      const tt = tf(1010, 100); b.T('TESİSAT', tt[0] + (mx < 0 ? -30 : 30), tt[1], 18, 'Ø32', mx < 0 ? 'r' : 'l');
    });
    [0, 1300, 1700, 3000].forEach((x) => [0, 850, 1700].forEach((y) => b.R('KOLON', x - 20, y - 20, x + 20, y + 20, true)));
    axesAndDims(b, W, H, true);
    b.T('YAZI', 0, -760, 78, 'A BLOK — TİP KAT PLANI (MİMARİ)', 'l'); b.T('YAZI', 0, -870, 38, 'Sakarya Vadi Konutları · 3 Blok 48 Daire · Ölçek 1/100 · Kat kotu +3.00 m', 'l');
    b.O('YAZI', 3350, 1400, 90); b.L('YAZI', 3350, 1330, 3350, 1480); b.L('YAZI', 3350, 1480, 3310, 1400); b.L('YAZI', 3350, 1480, 3390, 1400); b.T('YAZI', 3350, 1530, 40, 'K');
    return finishScene(b.E, 0.01);
  }
  function buildStruct() {
    const b = builder(), W = 3000, H = 1700, xs = [0, 1300, 1700, 3000], ys = [0, 850, 1700];
    ys.forEach((y, j) => { b.L('KİRİŞ', 0, y - 15, W, y - 15); b.L('KİRİŞ', 0, y + 15, W, y + 15); b.T('YAZI', 650, y + 45, 24, `K${j + 1}01  30/60`); b.T('YAZI', 2350, y + 45, 24, `K${j + 1}02  30/60`); });
    xs.forEach((x, i) => { b.L('KİRİŞ', x - 15, 0, x - 15, H); b.L('KİRİŞ', x + 15, 0, x + 15, H); b.T('YAZI', x + 40, 420, 22, `K${i + 4}01  25/60`, 'l'); });
    let n = 1; xs.forEach((x) => ys.forEach((y) => { b.R('KOLON', x - 35, y - 35, x + 35, y + 35, true); b.T('YAZI', x + 55, y - 60, 22, `S${n++}  70x70`, 'l'); }));
    b.R('PERDE', 1280, 400, 1305, 1300, true); b.R('PERDE', 1695, 400, 1720, 1300, true); b.R('PERDE', 1280, 400, 1720, 425, true); b.R('PERDE', 1280, 1275, 1720, 1300, true); b.T('YAZI', 1500, 1340, 26, 'P1 — ÇEKİRDEK PERDESİ  t=25');
    [[0, 0, 1300, 850], [1700, 0, 3000, 850], [0, 850, 1300, 1700], [1700, 850, 3000, 1700]].forEach(([x0, y0, x1, y1], i) => { b.T('DÖŞEME', (x0 + x1) / 2, (y0 + y1) / 2, 44, `D${101 + i}`); b.T('DÖŞEME', (x0 + x1) / 2, (y0 + y1) / 2 - 56, 26, 'h = 16 cm  (Ø10/15 çift hasır)'); });
    b.R('DÖŞEME', 1320, 520, 1680, 980); b.L('DÖŞEME', 1320, 520, 1680, 980); b.L('DÖŞEME', 1320, 980, 1680, 520); b.T('DÖŞEME', 1500, 1010, 24, 'MERDİVEN BOŞLUĞU');
    b.R('DÖŞEME', 1320, 1080, 1680, 1430); b.L('DÖŞEME', 1320, 1080, 1680, 1430); b.L('DÖŞEME', 1320, 1430, 1680, 1080); b.T('DÖŞEME', 1500, 1460, 24, 'ASANSÖR BOŞLUĞU');
    [[300, -140, 900, 0], [2100, -140, 2700, 0], [300, H, 900, H + 140], [2100, H, 2700, H + 140]].forEach(([x0, y0, x1, y1], i) => { b.R('BALKON', x0, y0, x1, y1); b.T('BALKON', (x0 + x1) / 2, (y0 + y1) / 2, 24, `BALKON PLAĞI B${i + 1}  h=14`); });
    axesAndDims(b, W, H, true);
    b.T('YAZI', 0, -760, 78, 'A BLOK — KOLON / KİRİŞ KALIP PLANI (STATİK)', 'l'); b.T('YAZI', 0, -870, 38, 'Sakarya Vadi Konutları · Beton C30/37 · Donatı B500C · Ölçek 1/100', 'l');
    return finishScene(b.E, 0.01);
  }
  function finishScene(ents, unitToM, layersMeta) {
    const layers = {}; let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18; const snap = [];
    const ex = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
    ents.forEach((e) => {
      const ly = (layers[e.l] = layers[e.l] || Object.assign({ n: e.l, c: '#cbd5e1', c2: '#222', w: 1 }, (layersMeta || LS)[e.l], { count: 0, vis: true })); ly.count++;
      if (e.t === 'l') { ex(e.p[0], e.p[1]); ex(e.p[2], e.p[3]); snap.push([e.p[0], e.p[1]], [e.p[2], e.p[3]]); }
      else if (e.t === 'p') e.p.forEach((q) => { ex(q[0], q[1]); snap.push(q); });
      else if (e.t === 'c' || e.t === 'a') { ex(e.x - e.r, e.y - e.r); ex(e.x + e.r, e.y + e.r); snap.push([e.x, e.y]); }
      else if (e.t === 't') ex(e.x, e.y);
    });
    return { ents, layers, bbox: [x0, y0, x1, y1], snap, unitToM };
  }

  /* ---------------- DXF ayrıştırıcı (LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, TEXT, MTEXT) ---------------- */
  const ACI = { 1: ['#ff4d4d', '#c00000'], 2: ['#ffe14d', '#9a7d00'], 3: ['#4dff88', '#008a3e'], 4: ['#4dffff', '#007f8a'], 5: ['#4d79ff', '#1f3fbf'], 6: ['#ff4dff', '#a000a0'], 7: ['#ffffff', '#111111'], 8: ['#9a9a9a', '#666666'], 9: ['#c0c0c0', '#888888'] };
  function parseDXF(text) {
    const ln = text.split(/\r?\n/), pr = []; for (let i = 0; i + 1 < ln.length; i += 2) pr.push([parseInt(ln[i], 10), ln[i + 1].trim()]);
    const ents = [], layerMeta = {}, skipped = {}; let units = 0, sec = '', i = 0;
    while (i < pr.length) {
      const [c, v] = pr[i];
      if (c === 0 && v === 'SECTION') { sec = pr[i + 1][1]; i += 2; continue; }
      if (c === 0 && v === 'ENDSEC') { sec = ''; i++; continue; }
      if (sec === 'HEADER' && c === 9 && v === '$INSUNITS') { units = parseInt(pr[i + 1][1], 10) || 0; i += 2; continue; }
      if (sec === 'TABLES' && c === 0 && v === 'LAYER') { let j = i + 1, name = '', col = 7; for (; j < pr.length && pr[j][0] !== 0; j++) { if (pr[j][0] === 2) name = pr[j][1]; if (pr[j][0] === 62) col = Math.abs(parseInt(pr[j][1], 10)); } const a = ACI[col] || ['#cbd5e1', '#333']; layerMeta[name] = { n: name, c: a[0], c2: a[1], w: 1 }; i = j; continue; }
      if (sec === 'ENTITIES' && c === 0) {
        let j = i + 1; const g = []; for (; j < pr.length && pr[j][0] !== 0; j++) g.push(pr[j]);
        const get = (code, d) => { const f = g.find((x) => x[0] === code); return f ? f[1] : d; }, num = (code, d = 0) => parseFloat(get(code, d)), layer = get(8, '0');
        const col = get(62, null) ? (ACI[Math.abs(parseInt(get(62), 10))] || null) : null; const base = (o) => { if (col) o.col = col; o.l = layer; return o; };
        if (v === 'LINE') ents.push(base({ t: 'l', p: [num(10), num(20), num(11), num(21)] }));
        else if (v === 'LWPOLYLINE') { const pts = []; let cx = null; g.forEach(([code, val]) => { if (code === 10) cx = parseFloat(val); else if (code === 20 && cx != null) { pts.push([cx, parseFloat(val)]); cx = null; } }); ents.push(base({ t: 'p', p: pts, c: (parseInt(get(70, 0), 10) & 1) === 1 })); }
        else if (v === 'POLYLINE') { const closed = (parseInt(get(70, 0), 10) & 1) === 1, pts = []; let k = j; while (k < pr.length && !(pr[k][0] === 0 && pr[k][1] === 'SEQEND')) { if (pr[k][0] === 0 && pr[k][1] === 'VERTEX') { let x = 0, y = 0, m = k + 1; for (; m < pr.length && pr[m][0] !== 0; m++) { if (pr[m][0] === 10) x = parseFloat(pr[m][1]); if (pr[m][0] === 20) y = parseFloat(pr[m][1]); } pts.push([x, y]); k = m; } else k++; } ents.push(base({ t: 'p', p: pts, c: closed })); j = k; }
        else if (v === 'CIRCLE') ents.push(base({ t: 'c', x: num(10), y: num(20), r: num(40) }));
        else if (v === 'ARC') { let a0 = num(50), a1 = num(51); if (a1 < a0) a1 += 360; ents.push(base({ t: 'a', x: num(10), y: num(20), r: num(40), a0: (a0 * Math.PI) / 180, a1: (a1 * Math.PI) / 180 })); }
        else if (v === 'TEXT' || v === 'MTEXT') { const s = get(1, '').replace(/\\P/g, ' ').replace(/\{?\\[A-Za-z][^;]*;/g, '').replace(/[{}]/g, ''); if (s) ents.push(base({ t: 't', x: num(10), y: num(20), h: num(40, 10) || 10, s, a: 'l' })); }
        else if (!['VERTEX', 'SEQEND', 'ATTRIB'].includes(v)) skipped[v] = (skipped[v] || 0) + 1;
        i = j; continue;
      }
      i++;
    }
    const sc = finishScene(ents, null, layerMeta); const w = sc.bbox[2] - sc.bbox[0];
    const known = { 4: 0.001, 5: 0.01, 6: 1, 1: 0.0254, 2: 0.3048, 3: 1609.344, 14: 10, 13: 1e-6, 12: 1e-9 };
    sc.unitToM = known[units] || (w > 8000 ? 0.001 : w > 300 ? 0.01 : 1); sc.skipped = skipped; sc.unitsGuessed = !known[units];
    return sc;
  }

  SS.dwg = { parseDXF };

  /* ---------------- görüntüleyici durumu ---------------- */
  const cache = {}; let V = null;
  const ID = () => ui.vs('dwg', { id: '', hidden: {}, light: false });
  const drawings = () => C.scope('drawings');
  const curDrawing = () => { const s = ID(); const l = drawings(); return l.find((d) => d.id === s.id) || l[0]; };
  async function loadScene(d) {
    if (cache[d.id]) return cache[d.id];
    let sc;
    if (d.kind === 'builtin') sc = d.builtin === 'arch' ? buildArch() : buildStruct();
    else if (d.kind === 'dxf') { const r = await SS.blob.get(d.blobId); sc = r && r.value; }
    else if (d.kind === 'image') {
      const u = await SS.blob.url(d.blobId); const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
      sc = { img, ents: [], layers: {}, bbox: [0, 0, img.naturalWidth, img.naturalHeight], snap: [], unitToM: d.unitToM || null };
    }
    if (sc) cache[d.id] = sc; return sc;
  }
  const fmtLen = (wd, d) => { const k = d.unitToM; if (!k) return U.num(wd, 0) + ' px'; const m = wd * k; return m < 1 ? U.num(m * 100, 1) + ' cm' : U.num(m, 2) + ' m'; };
  const fmtArea = (wa, d) => { const k = d.unitToM; return k ? U.num(wa * k * k, 2) + ' m²' : U.num(wa, 0) + ' px²'; };
  const polyArea = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i].x * q.y - q.x * p[i].y; } return Math.abs(a) / 2; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function mountViewer(el) {
    const d = curDrawing(); if (!d) return;
    if (d.kind === 'pdf') { SS.blob.url(d.blobId).then((u) => { const w = el.querySelector('.dwg-stage-body'); if (w) w.innerHTML = `<iframe class="dwg-embed" src="${u}" title="${esc(d.name)}"></iframe>`; }); return; }
    const wrap = el.querySelector('.dwg-canvas-wrap'), cv = el.querySelector('#dwgCanvas'); if (!cv) return; const ctx = cv.getContext('2d');
    V = { d, sc: null, k: 1, tx: 0, ty: 0, tool: 'pan', cur: null, list: [], hover: null, snapP: null, ptrs: new Map(), W: 0, H: 0, dpr: window.devicePixelRatio || 1, raf: 0 };
    const st = ID();
    const w2s = (x, y) => [x * V.k + V.tx, V.ty - y * V.k], s2w = (sx, sy) => ({ x: (sx - V.tx) / V.k, y: (V.ty - sy) / V.k });
    const hud = el.querySelector('.dwg-hud'), hint = el.querySelector('.dwg-hint'), meas = el.querySelector('.dwg-meas');
    const light = () => ID().light;
    const request = () => { if (!V.raf) V.raf = requestAnimationFrame(() => { V.raf = 0; paint(); }); };
    V.request = request;

    function fit() {
      const sc = V.sc; if (!sc) return; const [x0, y0, x1, y1] = sc.bbox, bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
      V.k = Math.min(V.W / (bw * 1.08), V.H / (bh * 1.08)); V.tx = V.W / 2 - ((x0 + x1) / 2) * V.k; V.ty = V.H / 2 + ((y0 + y1) / 2) * V.k; request();
    }
    V.fit = fit;
    function resize() { const r = wrap.getBoundingClientRect(); V.W = r.width; V.H = r.height; cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr); if (V.sc && !V.fitted) { fit(); V.fitted = true; } request(); }
    const ro = new ResizeObserver(resize); ro.observe(wrap); V.ro = ro;

    function paint() {
      const sc = V.sc; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); if (!sc) return;
      const L = light(), hidden = ID().hidden[d.id] || {}; const k = V.k;
      ctx.setTransform(k * V.dpr, 0, 0, -k * V.dpr, V.tx * V.dpr, V.ty * V.dpr); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (sc.img) { ctx.save(); ctx.translate(0, sc.img.naturalHeight); ctx.scale(1, -1); ctx.drawImage(sc.img, 0, 0); ctx.restore(); }
      const vx0 = -V.tx / k, vx1 = (V.W - V.tx) / k, vy0 = (V.ty - V.H) / k, vy1 = V.ty / k;
      for (const e of sc.ents) {
        const ly = sc.layers[e.l]; if (hidden[e.l]) continue; const col = e.col ? (L ? e.col[1] : e.col[0]) : L ? ly.c2 : ly.c;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = (ly.w || 1) / k; ctx.setLineDash(ly.dash ? ly.dash.map((x) => x / k) : []);
        if (e.t === 'l') { const [a, b, c, dd] = e.p; if ((a < vx0 && c < vx0) || (a > vx1 && c > vx1) || (b < vy0 && dd < vy0) || (b > vy1 && dd > vy1)) continue; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, dd); ctx.stroke(); }
        else if (e.t === 'p') { ctx.beginPath(); e.p.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); if (e.c) ctx.closePath(); if (e.f) { ctx.globalAlpha = 0.92; ctx.fill(); ctx.globalAlpha = 1; } ctx.stroke(); }
        else if (e.t === 'c') { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.2832); if (e.f) ctx.fill(); ctx.stroke(); }
        else if (e.t === 'a') { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, e.a0, e.a1); ctx.stroke(); }
        else if (e.t === 't') { if (e.h * k < 4 || e.x < vx0 - 500 || e.x > vx1 + 500) continue; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1, -1); ctx.font = `${e.h}px "Segoe UI",Arial,sans-serif`; ctx.textAlign = e.a === 'r' ? 'right' : e.a === 'l' ? 'left' : 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.s, 0, 0); ctx.restore(); }
      }
      /* bindirme: ölçümler, notlar */
      ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); ctx.setLineDash([]); ctx.font = '600 12.5px "Segoe UI",Arial'; ctx.textBaseline = 'middle';
      const accent = '#ff8a3d', pill = (x, y, s) => { const w = ctx.measureText(s).width + 14; ctx.fillStyle = 'rgba(20,24,30,.92)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 12, w, 24, 8) : ctx.rect(x - w / 2, y - 12, w, 24); ctx.fill(); ctx.fillStyle = '#ffd2b0'; ctx.textAlign = 'center'; ctx.fillText(s, x, y + 0.5); };
      const dot = (x, y, f = accent) => { ctx.fillStyle = f; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill(); ctx.stroke(); };
      const seg = (a, b) => { const A = w2s(a.x, a.y), B = w2s(b.x, b.y); ctx.strokeStyle = accent; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); return [A, B]; };
      const drawM = (m, live) => {
        if (m.type === 'dist') { const [A, B] = seg(m.a, m.b); dot(...A); dot(...B); pill((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 18, fmtLen(dist(m.a, m.b), d)); }
        else if (m.type === 'area') { const pts = m.pts.map((p) => w2s(p.x, p.y)); if (pts.length > 1) { ctx.fillStyle = 'rgba(255,138,61,.2)'; ctx.strokeStyle = accent; ctx.lineWidth = 2.2; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (!live) ctx.closePath(); if (pts.length > 2) ctx.fill(); ctx.stroke(); } pts.forEach((p) => dot(p[0], p[1])); if (m.pts.length > 2) { const cx = U.sum(pts, (p) => p[0]) / pts.length, cy = U.sum(pts, (p) => p[1]) / pts.length; pill(cx, cy, fmtArea(polyArea(m.pts), d)); } }
      };
      V.list.forEach((m) => drawM(m, false));
      if (V.cur) {
        const c = V.cur, hp = V.snapP;
        if (c.type === 'dist' || c.type === 'calib') { const a = c.pts[0]; dot(...w2s(a.x, a.y)); if (hp) { seg(a, hp); pill(w2s(hp.x, hp.y)[0], w2s(hp.x, hp.y)[1] - 18, fmtLen(dist(a, hp), d)); } }
        else if (c.type === 'area') { drawM({ type: 'area', pts: hp ? c.pts.concat(hp) : c.pts }, true); }
      }
      if (V.snapP && V.tool !== 'pan') { const [x, y] = w2s(V.snapP.x, V.snapP.y); ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.strokeRect(x - 6, y - 6, 12, 12); }
      (d.notes || []).forEach((n) => { const [x, y] = w2s(n.x, n.y); ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#1f2328'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 11, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1f2328'; ctx.textAlign = 'center'; ctx.font = '800 13px "Segoe UI"'; ctx.fillText('!', x, y + 1); });
      /* hud */
      if (hud && V.mouse) { const w = s2w(V.mouse.x, V.mouse.y), u = d.unitToM; hud.textContent = `${u ? `X ${U.num(w.x * u, 2)} m   Y ${U.num(w.y * u, 2)} m` : `X ${U.num(w.x, 0)}   Y ${U.num(w.y, 0)} px`}   ·   %${U.num((V.k / (V.k0 || V.k)) * 100)}`; }
    }
    V.paint = paint;
    const setHud = () => { if (hud) hud.textContent = `Yakınlaştırma %${U.num((V.k / (V.k0 || V.k)) * 100)}`; };

    /* sahneyi yükle */
    loadScene(d).then((sc) => {
      V.sc = sc; if (!sc) { wrap.insertAdjacentHTML('beforeend', '<div class="dwg-hint">Çizim yüklenemedi</div>'); return; }
      resize(); V.fit(); V.k0 = V.k; V.fitted = true; setHud(); renderLayers(sc, d);
      if (sc.unitsGuessed || (d.kind === 'image' && !d.unitToM)) setHint('Ölçüm için önce "Ölçek" aracıyla bilinen bir mesafeyi kalibre edin.');
    });
    resize();

    const setHint = (t) => { if (!hint) return; hint.style.display = t ? '' : 'none'; hint.textContent = t || ''; };
    V.setHint = setHint; setHint('');
    const HINTS = { dist: 'Uzunluk: iki nokta seçin (uç noktalara yapışır)', area: 'Alan: köşeleri tıklayın · ilk noktaya tıklayın veya "Bitir"', calib: 'Kalibrasyon: uzunluğu bilinen iki noktayı seçin', note: 'Not: çizim üzerinde bir noktaya dokunun', pan: '' };
    V.setTool = (t) => { V.tool = t; V.cur = null; V.snapP = null; wrap.className = wrap.className.replace(/tool-\w+/g, '') + ' tool-' + t; el.querySelectorAll('[data-dtool]').forEach((b) => b.classList.toggle('on', b.dataset.dtool === t)); setHint(HINTS[t]); request(); };
    V.setTool('pan');

    const updMeas = () => { if (!meas) return; meas.style.display = V.list.length ? '' : 'none'; meas.innerHTML = `<h4>Ölçümler <button data-action="dwg.clear">Temizle</button></h4>${V.list.map((m, i) => `<div><span>${i + 1}. ${m.type === 'dist' ? 'Uzunluk' : 'Alan'}</span><b>${m.type === 'dist' ? fmtLen(dist(m.a, m.b), d) : fmtArea(polyArea(m.pts), d)}</b></div>`).join('')}`; };
    V.updMeas = updMeas; updMeas();

    const snapTo = (w) => {
      const sc = V.sc; if (!sc) return w; const tol = 13 / V.k; let best = null, bd = tol;
      const pts = sc.snap; for (let i = 0; i < pts.length; i++) { const q = pts[i], dd = Math.hypot(q[0] - w.x, q[1] - w.y); if (dd < bd) { bd = dd; best = { x: q[0], y: q[1] }; } }
      return best || w;
    };
    const finishArea = () => { if (V.cur && V.cur.type === 'area' && V.cur.pts.length >= 3) { V.list.push({ type: 'area', pts: V.cur.pts }); V.cur = null; updMeas(); SS.sound.ok(); request(); } };
    V.finishArea = finishArea;

    function click(sx, sy) {
      const w0 = s2w(sx, sy), w = V.tool === 'pan' || V.tool === 'note' ? w0 : snapTo(w0);
      if (V.tool === 'pan') { const n = (d.notes || []).find((q) => Math.hypot(w2s(q.x, q.y)[0] - sx, w2s(q.x, q.y)[1] - sy) < 14); if (n) { ui.sheet({ title: 'Çizim Notu', cls: 'small', noFocus: true, body: `<p>${esc(n.text)}</p>`, footer: `<button class="btn danger-ghost" id="nDel">${I('trash')}Notu sil</button>` , mount: (b, a) => a.el.querySelector('#nDel').addEventListener('click', () => { d.notes = d.notes.filter((x) => x.id !== n.id); SS.store.save(); a.close(); request(); }) }); } return; }
      if (V.tool === 'dist') { if (!V.cur) V.cur = { type: 'dist', pts: [w] }; else { V.list.push({ type: 'dist', a: V.cur.pts[0], b: w }); V.cur = null; updMeas(); SS.sound.ok(); } }
      else if (V.tool === 'area') { V.cur = V.cur || { type: 'area', pts: [] }; const f = V.cur.pts[0]; if (f && V.cur.pts.length >= 3 && Math.hypot(w2s(f.x, f.y)[0] - sx, w2s(f.x, f.y)[1] - sy) < 14) { finishArea(); return; } V.cur.pts.push(w); }
      else if (V.tool === 'calib') {
        if (!V.cur) V.cur = { type: 'calib', pts: [w] };
        else { const a = V.cur.pts[0], wd = dist(a, w); V.cur = null; request(); ui.form({ title: 'Ölçek Kalibrasyonu', cls: 'small', values: { len: '' }, fields: [{ type: 'html', html: `<p class="sub">Seçilen iki nokta arasındaki gerçek mesafeyi girin. Mevcut ölçüm: <b>${fmtLen(wd, d)}</b></p>` }, { name: 'len', label: 'Gerçek mesafe (metre)', type: 'number', required: true, min: 0.001, step: 'any' }], onSubmit(v) { d.unitToM = v.len / wd; if (V.sc) V.sc.unitToM = d.unitToM; SS.store.save(); if (d.kind === 'dxf' || d.kind === 'builtin') { cache[d.id] && (cache[d.id].unitToM = d.unitToM); } setHint(''); updMeas(); request(); ui.toast(`Ölçek ayarlandı · 1 birim = ${U.num(d.unitToM * 100, 3)} cm`); } }); }
      } else if (V.tool === 'note') { ui.form({ title: 'Çizime Not Ekle', cls: 'small', fields: [{ name: 'text', label: 'Not', type: 'textarea', required: true, rows: 3, placeholder: 'ör. Bu aksta kolon kesiti değişti' }], onSubmit(v) { (d.notes = d.notes || []).push({ id: U.id('n'), x: w.x, y: w.y, text: v.text }); SS.store.save(); request(); ui.toast('Not eklendi'); } }); V.setTool('pan'); }
      request();
    }

    /* işaretçi olayları: kaydırma, çimdik-yakınlaştırma, tıklama */
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    let pinch = null;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); const p = pos(e); V.ptrs.set(e.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now(), moved: false }); if (V.ptrs.size === 2) { const [a, b] = [...V.ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: V.k, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, tx: V.tx, ty: V.ty }; V.ptrs.forEach((q) => (q.moved = true)); } });
    cv.addEventListener('pointermove', (e) => {
      const p = pos(e); V.mouse = p; const q = V.ptrs.get(e.pointerId);
      if (q) {
        if (V.ptrs.size === 2 && pinch) { q.x = p.x; q.y = p.y; const [a, b] = [...V.ptrs.values()], dd = Math.hypot(a.x - b.x, a.y - b.y), f = dd / pinch.d, nk = U.clamp(pinch.k * f, V.k0 * 0.05, V.k0 * 400), wx = (pinch.mx - pinch.tx) / pinch.k, wy = (pinch.ty - pinch.my) / pinch.k, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; V.k = nk; V.tx = mx - wx * nk; V.ty = my + wy * nk; request(); return; }
        if (!q.moved && Math.hypot(p.x - q.sx, p.y - q.sy) > 6) q.moved = true;
        if (q.moved) { V.tx += p.x - q.x; V.ty += p.y - q.y; q.x = p.x; q.y = p.y; request(); setHud(); return; }
      }
      if (V.tool !== 'pan' && V.tool !== 'note') { V.snapP = snapTo(s2w(p.x, p.y)); request(); } else if (hud) request();
    });
    const up = (e) => { const q = V.ptrs.get(e.pointerId); V.ptrs.delete(e.pointerId); if (V.ptrs.size < 2) pinch = null; if (q && !q.moved && performance.now() - q.t < 600) click(q.sx, q.sy); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', (e) => { V.ptrs.delete(e.pointerId); pinch = null; });
    cv.addEventListener('pointerleave', () => { V.mouse = null; V.snapP = null; setHud(); request(); });
    cv.addEventListener('dblclick', () => { if (V.tool === 'area') finishArea(); });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const p = pos(e), f = Math.exp(-e.deltaY * 0.0016), w = s2w(p.x, p.y), nk = U.clamp(V.k * f, V.k0 * 0.05, V.k0 * 400); V.k = nk; V.tx = p.x - w.x * nk; V.ty = p.y + w.y * nk; request(); setHud(); }, { passive: false });
    V.keyh = (e) => { if (e.key === 'Escape') { V.cur = null; V.setTool('pan'); } else if (e.key === 'Enter') finishArea(); else if (e.key === '+' || e.key === '=') zoomBy(1.25); else if (e.key === '-') zoomBy(0.8); else if (e.key === '0') { V.fit(); } };
    document.addEventListener('keydown', V.keyh);
    const zoomBy = (f) => { const cx = V.W / 2, cy = V.H / 2, w = s2w(cx, cy), nk = U.clamp(V.k * f, V.k0 * 0.05, V.k0 * 400); V.k = nk; V.tx = cx - w.x * nk; V.ty = cy + w.y * nk; request(); setHud(); };
    V.zoomBy = zoomBy;
  }
  function renderLayers(sc, d) {
    const box = document.getElementById('dwgLayers'); if (!box) return; const hidden = ID().hidden[d.id] || {};
    const names = Object.keys(sc.layers); if (!names.length) { box.innerHTML = '<p class="sub" style="padding:8px 4px">Bu çizim tek katmanlı görüntüdür.</p>'; return; }
    box.innerHTML = names.map((n) => { const l = sc.layers[n]; return `<label><input type="checkbox" data-action="dwg.layer" data-l="${esc(n)}" ${hidden[n] ? '' : 'checked'}><i style="background:${l.c}"></i>${esc(l.n)}<small>${l.count}</small></label>`; }).join('');
  }

  /* ---------------- sayfa ---------------- */
  const KI = { builtin: 'layers', dxf: 'ruler', image: 'image', pdf: 'file' };
  SS.views.dwg = {
    title: 'Çizim Görüntüleyici',
    cleanup() { if (V) { V.ro && V.ro.disconnect(); V.keyh && document.removeEventListener('keydown', V.keyh); cancelAnimationFrame(V.raf); V = null; } },
    render() {
      const list = drawings(), d = curDrawing(), light = ID().light;
      if (!list.length) return `<div class="page">${ui.head({ title: 'Çizim Görüntüleyici', sub: 'Mimari, statik ve tesisat çizimleri', actions: `<button class="btn primary" data-action="dwg.upload">${I('upload')}Çizim Yükle</button>` })}<div class="card">${ui.empty('layers', 'Çizim yok', 'DXF, PDF veya görsel (PNG/JPG) dosyası yükleyerek başlayın.')}</div></div>`;
      const tools = d.kind === 'pdf' ? '' : `<div class="dwg-tools"><button class="dtool on" data-action="dwg.tool" data-dtool="pan">${I('hand')}<span>Kaydır</span></button><button class="dtool" data-action="dwg.tool" data-dtool="dist">${I('ruler')}<span>Uzunluk</span></button><button class="dtool" data-action="dwg.tool" data-dtool="area">${I('area')}<span>Alan</span></button><button class="dtool" data-action="dwg.tool" data-dtool="calib">${I('percent')}<span>Ölçek</span></button><button class="dtool" data-action="dwg.tool" data-dtool="note">${I('note')}<span>Not</span></button><span class="dsep"></span>
        <button class="dtool" data-action="dwg.finish" aria-label="Alanı bitir">${I('check')}<span>Bitir</span></button><button class="dtool" data-action="dwg.zoom" data-f="0.8" aria-label="Uzaklaş">${I('zoomOut')}</button><button class="dtool" data-action="dwg.zoom" data-f="1.25" aria-label="Yakınlaş">${I('zoomIn')}</button><button class="dtool" data-action="dwg.zoom" data-f="0" aria-label="Sığdır">${I('maximize')}</button><span class="grow"></span><button class="dtool" data-action="dwg.bg" aria-label="Zemin rengi">${I(light ? 'moon' : 'sun')}<span>${light ? 'Koyu zemin' : 'Açık zemin'}</span></button></div>`;
      return `<div class="page">${ui.head({ title: 'Çizim Görüntüleyici', sub: 'Yakınlaştır, kaydır, katman aç/kapat; kalibrasyonlu uzunluk ve alan ölç · mimari, statik, tesisat', actions: `<button class="btn primary" data-action="dwg.upload">${I('upload')}Çizim Yükle</button>` })}
        <div class="dwg"><aside class="dwg-side"><div class="card"><div class="card-h"><h3>Çizimler</h3><span class="badge muted">${list.length}</span></div><div class="dwg-list">${list.map((x) => `<button class="dwg-item ${x.id === d.id ? 'on' : ''}" data-action="dwg.pick" data-id="${x.id}"><span class="kpi-ic tone-${x.discipline === 'Statik' ? 'warn' : x.discipline === 'Tesisat' ? 'info' : 'brand'}">${I(KI[x.kind] || 'file')}</span><span><b>${esc(x.name)}</b><small>${esc(x.discipline || 'Genel')} · ${x.kind === 'builtin' ? 'vektör' : x.kind.toUpperCase()} · ${U.fmtDate(x.date)}</small></span></button>`).join('')}</div></div>
        ${d.kind !== 'pdf' ? `<div class="card"><div class="card-h"><h3>Katmanlar</h3></div><div class="layers" id="dwgLayers"></div></div>` : ''}
        <button class="btn danger-ghost" data-action="dwg.del" data-id="${d.id}">${I('trash')}Bu çizimi sil</button></aside>
        <div class="card dwg-stage">${tools}<div class="dwg-stage-body">${d.kind === 'pdf' ? '' : `<div class="dwg-canvas-wrap ${light ? 'light' : ''}"><canvas id="dwgCanvas"></canvas><div class="dwg-hint" style="display:none"></div><div class="dwg-meas" style="display:none"></div><div class="dwg-hud">Yükleniyor…</div></div>`}</div>
        <div class="dwg-note">${d.kind === 'pdf' ? 'PDF tarayıcının yerleşik görüntüleyicisinde açılır; ölçüm için görsel veya DXF kullanın.' : `Ölçek: ${d.unitToM ? `1 birim = ${U.num(d.unitToM * 100, 2)} cm` : 'kalibre edilmedi (piksel)'} · Fare tekeri / çimdik ile yakınlaştırın, sürükleyerek kaydırın · ESC iptal, Enter alanı bitirir.`}</div></div></div></div>`;
    },
    mount(el) { mountViewer(el); },
  };

  SS.actions['dwg.pick'] = (el) => { ID().id = el.dataset.id; ui.rerender(); };
  SS.actions['dwg.tool'] = (el) => V && V.setTool(el.dataset.dtool);
  SS.actions['dwg.zoom'] = (el) => { if (!V) return; +el.dataset.f ? V.zoomBy(+el.dataset.f) : V.fit(); };
  SS.actions['dwg.finish'] = () => V && V.finishArea();
  SS.actions['dwg.clear'] = () => { if (V) { V.list = []; V.cur = null; V.updMeas(); V.request(); } };
  SS.actions['dwg.bg'] = () => { const s = ID(); s.light = !s.light; ui.rerender(); };
  SS.actions['dwg.layer'] = (el) => { const s = ID(), d = curDrawing(); (s.hidden[d.id] = s.hidden[d.id] || {})[el.dataset.l] = !el.checked; V && V.request(); };
  SS.actions['dwg.del'] = async (el) => { const d = SS.store.find('drawings', el.dataset.id); if (await ui.confirm({ title: 'Çizim silinsin mi?', text: esc(d.name) })) { if (d.blobId) SS.blob.del(d.blobId); delete cache[d.id]; SS.store.del('drawings', d.id); ID().id = ''; ui.rerender(); ui.toast('Çizim silindi', 'info'); } };
  SS.actions['dwg.upload'] = async () => {
    const [f] = await ui.pickFiles('.dxf,.dwg,.pdf,image/*'); if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext === 'dwg') { ui.sheet({ title: 'DWG dosyası', cls: 'small', noFocus: true, body: `<p><b>${esc(f.name)}</b> ikili (kapalı) DWG biçiminde olduğu için tarayıcıda doğrudan okunamıyor.</p><p class="sub" style="margin-top:8px">AutoCAD, BricsCAD veya ücretsiz <i>DWG TrueView</i> ile <b>DXF</b> (ASCII) olarak "Farklı kaydet" yapıp yükleyin; ya da çizimin PDF / PNG çıktısını ekleyin.</p>` }); return; }
    const act = C.active(), pid = act !== 'all' ? act : (SS.D.projects.find((p) => p.status === 'active') || SS.D.projects[0]).id;
    ui.form({
      title: 'Çizimi Kaydet', cls: 'small', values: { name: f.name.replace(/\.[^.]+$/, ''), discipline: 'Mimari', projectId: pid },
      fields: [{ name: 'name', label: 'Çizim adı', required: true }, { name: 'discipline', label: 'Disiplin', type: 'select', options: ['Mimari', 'Statik', 'Tesisat', 'Elektrik', 'Vaziyet', 'Genel'] }, { name: 'projectId', label: 'Şantiye', type: 'select', options: ui.projOpts(), required: true }],
      async onSubmit(v) {
        const rec = { projectId: v.projectId, name: v.name, discipline: v.discipline, date: U.today(), notes: [], unitToM: null };
        try {
          if (ext === 'dxf') { const sc = parseDXF(await f.text()); if (!sc.ents.length) throw new Error('DXF içinde çizilebilir varlık bulunamadı (LINE, POLYLINE, CIRCLE, ARC, TEXT desteklenir)'); const id = U.id('dxf'); await SS.blob.put(id, sc, { name: f.name, type: 'application/json' }); Object.assign(rec, { kind: 'dxf', blobId: id, unitToM: sc.unitToM }); }
          else if (ext === 'pdf') { const m = await SS.blob.putFile(f); Object.assign(rec, { kind: 'pdf', blobId: m.id }); }
          else { const m = await SS.blob.putImage(f, 3600, 0.86); Object.assign(rec, { kind: 'image', blobId: m.id }); }
        } catch (e) { ui.toast('Çizim okunamadı: ' + e.message, 'bad'); return false; }
        const n = SS.store.add('drawings', rec, 'd'); ID().id = n.id; ui.rerender(); ui.toast('Çizim eklendi');
      },
    });
  };
})();
