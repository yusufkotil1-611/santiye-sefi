/* Şantiye Şefi — bağımlılıksız SVG grafikler (donut, çubuk, halka, çizgi) */
(function () {
  const SS = window.SS, U = SS.U, esc = U.esc;
  const G = (SS.charts = {});
  const tip = (s) => `data-tip="${esc(s)}"`;

  /* Halka ilerleme göstergesi */
  G.ring = (pct, { size = 120, stroke = 12, label = true, tone = 'var(--brand)', sub = '' } = {}) => {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, off = circ * (1 - U.clamp(pct, 0, 100) / 100);
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="%${Math.round(pct)}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
      <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${tone}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${circ}" style="stroke-dashoffset:${circ}" data-off="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
      ${label ? `<div class="ring-l"><b>%${Math.round(pct)}</b>${sub ? `<small>${sub}</small>` : ''}</div>` : ''}</div>`;
  };

  /* Donut: items [{label,value,color}] — 2px yüzey boşluğu, merkez etiketi */
  G.donut = (items, { size = 190, stroke = 26, center = {}, fmt = U.money } = {}) => {
    const tot = U.sum(items, (i) => i.value);
    if (!tot) return `<div class="empty small">Veri yok</div>`;
    const r = (size - stroke) / 2, cx = size / 2, circ = 2 * Math.PI * r; let acc = 0;
    const segs = items.filter((i) => i.value > 0).map((i) => {
      const len = (i.value / tot) * circ, gap = items.length > 1 ? 2.5 : 0;
      const s = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" style="stroke:${i.color}" stroke-width="${stroke}" stroke-dasharray="${Math.max(0, len - gap)} ${circ}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${cx} ${cx})" class="dn-seg" ${tip(`${i.label}\n${fmt(i.value)} · %${U.num((i.value / tot) * 100, 1)}`)}/>`;
      acc += len; return s;
    }).join('');
    return `<div class="donut" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(center.small || 'Dağılım')}">${segs}</svg>
      <div class="donut-c"><b>${center.big ?? fmt(tot)}</b><small>${center.small || 'Toplam'}</small></div></div>`;
  };
  G.legend = (items, fmt = U.money, total) => {
    const tot = total ?? U.sum(items, (i) => i.value);
    return `<ul class="legend">${items.map((i) => `<li><i style="background:${i.color}"></i><span class="lg-n">${esc(i.label)}</span><span class="lg-v">${fmt(i.value)}</span><span class="lg-p">%${tot ? U.num((i.value / tot) * 100, 0) : 0}</span></li>`).join('')}</ul>`;
  };

  /* Gruplu dikey çubuk: series [{name,color,data[]}], labels[] */
  G.bars = (series, labels, { height = 210, fmt = U.compact, net = null } = {}) => {
    const W = 560, H = height, padL = 46, padB = 26, padT = 10, innerW = W - padL - 8, innerH = H - padB - padT;
    const max = Math.max(1, ...series.flatMap((s) => s.data)); const nice = niceMax(max);
    const gw = innerW / labels.length, bw = Math.min(26, (gw - 14) / series.length - 2);
    let g = '';
    for (let i = 0; i <= 4; i++) { const y = padT + innerH - (innerH * i) / 4; g += `<line x1="${padL}" x2="${W - 8}" y1="${y}" y2="${y}" class="gl"/><text x="${padL - 6}" y="${y + 3.5}" text-anchor="end" class="ax">${i ? fmt((nice * i) / 4) : '0'}</text>`; }
    labels.forEach((l, i) => {
      const x0 = padL + gw * i + (gw - (bw + 2) * series.length + 2) / 2;
      series.forEach((s, j) => {
        const v = s.data[i], h = (v / nice) * innerH, x = x0 + j * (bw + 2), y = padT + innerH - h;
        if (v > 0) g += `<path class="bar-m" d="M${x} ${padT + innerH}V${y + 4}a4 4 0 0 1 4-4h${bw - 8}a4 4 0 0 1 4 4V${padT + innerH}z" style="fill:${s.color};animation-delay:${i * 50 + j * 25}ms" ${tip(`${l} · ${s.name}\n${U.money(v)}`)}/>`;
      });
      g += `<text x="${padL + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle" class="ax">${esc(l)}</text>`;
      if (net) g += `<rect x="${padL + gw * i}" y="${padT}" width="${gw}" height="${innerH}" fill="transparent" ${tip(`${l}\n` + net(i))}/>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
  };
  function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return ([1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((s) => m <= s) || 10) * p; }

  /* Yığılmış çubuk (ay x kategori) */
  G.stacked = (labels, series, { height = 220 } = {}) => {
    const W = 560, H = height, padL = 46, padB = 26, padT = 10, innerW = W - padL - 8, innerH = H - padB - padT;
    const totals = labels.map((_, i) => U.sum(series, (s) => s.data[i])); const nice = niceMax(Math.max(1, ...totals));
    const gw = innerW / labels.length, bw = Math.min(46, gw - 16); let g = '';
    for (let i = 0; i <= 4; i++) { const y = padT + innerH - (innerH * i) / 4; g += `<line x1="${padL}" x2="${W - 8}" y1="${y}" y2="${y}" class="gl"/><text x="${padL - 6}" y="${y + 3.5}" text-anchor="end" class="ax">${i ? U.compact((nice * i) / 4) : '0'}</text>`; }
    labels.forEach((l, i) => {
      let y = padT + innerH; const x = padL + gw * i + (gw - bw) / 2; const top = series.map((s) => s.data[i]).findLastIndex((v) => v > 0);
      series.forEach((s, j) => {
        const v = s.data[i]; if (v <= 0) return; const h = Math.max(0, (v / nice) * innerH - 2); y -= (v / nice) * innerH;
        const r = j === top ? `M${x} ${y + h}V${y + 4}a4 4 0 0 1 4-4h${bw - 8}a4 4 0 0 1 4 4V${y + h}z` : `M${x} ${y}h${bw}v${h}h-${bw}z`;
        g += `<path d="${r}" style="fill:${s.color}" class="bar-m" ${tip(`${U.monthLabel(l.key || l)} · ${s.name}\n${U.money(v)}`)}/>`;
      });
      g += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" class="ax">${esc(l.label || l)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
  };

  /* Mini çizgi / alan grafiği */
  G.spark = (data, { w = 120, h = 36, color = 'var(--brand)' } = {}) => {
    if (data.length < 2) return '';
    const max = Math.max(...data), min = Math.min(...data), rg = max - min || 1;
    const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / rg) * (h - 6)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${d}L${w} ${h}L0 ${h}z" style="fill:${color};opacity:.12"/><path d="${d}" fill="none" style="stroke:${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };

  /* Yatay çubuklar (HTML) */
  G.hbars = (items, { fmt = U.money, max } = {}) => {
    const m = max ?? Math.max(1, ...items.map((i) => i.value));
    return `<div class="hbars">${items.map((i) => `<div class="hb" ${tip(`${i.label}\n${fmt(i.value)}`)}><span class="hb-l">${esc(i.label)}</span><span class="hb-t"><i style="width:${(i.value / m) * 100}%;background:${i.color || 'var(--brand)'}"></i></span><span class="hb-v">${fmt(i.value)}</span></div>`).join('')}</div>`;
  };
})();
