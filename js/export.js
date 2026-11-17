/* Şantiye Şefi — rapor motoru: PDF (yazdır), Excel (.xlsx), CSV */
(function () {
  const SS = window.SS, U = SS.U, esc = U.esc;
  const X = (SS.exp = {});

  /* def: {title, subtitle, project, meta:[[k,v]], sections:[{heading, cols:[{h, num?, money?}], rows:[[...]], totals?:[...]}] } */

  const cell = (v, col) => (v == null ? '' : typeof v === 'number' ? (col && col.money ? U.money2(v) : U.num(v, Number.isInteger(v) ? 0 : 2)) : v);

  X.html = (def) => `
  <div class="rp">
    <div class="rp-h"><div class="rp-brand"><svg viewBox="0 0 32 32" width="34" height="34"><rect width="32" height="32" rx="9" fill="#c2500a"/><path d="M6 24h20M9 24V15l7-6 7 6v9M13 24v-5h6v5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div><b>${esc(SS.cfg.company)}</b><small>Şantiye Şefi · Saha Yönetim Raporu</small></div></div>
      <div class="rp-date"><b>${esc(def.title)}</b><small>Düzenlenme: ${U.fmtDate(U.today())}</small></div></div>
    <div class="rp-meta">${[['Şantiye', def.project || 'Tüm şantiyeler']].concat(def.meta || []).map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
    ${def.sections.map((s) => `<section class="rp-s">${s.heading ? `<h3>${esc(s.heading)}</h3>` : ''}
      ${s.kpis ? `<div class="rp-kpis">${s.kpis.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      ${s.cols ? `<table><thead><tr>${s.cols.map((c) => `<th class="${c.num || c.money ? 'r' : ''}">${esc(c.h)}</th>`).join('')}</tr></thead>
      <tbody>${s.rows.length ? s.rows.map((r) => `<tr>${r.map((v, i) => `<td class="${s.cols[i].num || s.cols[i].money ? 'r' : ''}">${esc(cell(v, s.cols[i]))}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${s.cols.length}" class="c">Kayıt yok</td></tr>`}</tbody>
      ${s.totals ? `<tfoot><tr>${s.totals.map((v, i) => `<td class="${s.cols[i].num || s.cols[i].money ? 'r' : ''}">${esc(cell(v, s.cols[i]))}</td>`).join('')}</tr></tfoot>` : ''}</table>` : ''}
      ${s.note ? `<p class="rp-note">${esc(s.note)}</p>` : ''}</section>`).join('')}
    <div class="rp-f"><span>Bu rapor Şantiye Şefi tarafından ${U.fmtDate(U.today())} tarihinde oluşturulmuştur.</span><span class="sign">Şantiye Şefi İmza: ____________________</span></div>
  </div>`;

  const PRINT_CSS = `*{box-sizing:border-box}body{margin:0;font:12px/1.45 "Segoe UI",system-ui,Arial,sans-serif;color:#16191d;background:#fff}
  .rp{padding:22px 26px}.rp-h{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #c2500a;padding-bottom:12px}
  .rp-brand{display:flex;gap:10px;align-items:center}.rp-brand b{display:block;font-size:15px}.rp-brand small,.rp-date small{display:block;color:#5b6470;font-size:10.5px}
  .rp-date{text-align:right}.rp-date b{font-size:17px}
  .rp-meta{display:flex;gap:26px;flex-wrap:wrap;margin:14px 0 6px}.rp-meta small{display:block;color:#5b6470;font-size:10px;text-transform:uppercase;letter-spacing:.04em}.rp-meta b{font-size:12.5px}
  .rp-s{margin-top:16px;break-inside:avoid-page}.rp-s h3{margin:0 0 8px;font-size:13px;border-left:4px solid #c2500a;padding-left:8px}
  .rp-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}.rp-kpis div{border:1px solid #e4e1da;border-radius:8px;padding:8px 10px}.rp-kpis small{display:block;color:#5b6470;font-size:10px}.rp-kpis b{font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:11px}th{background:#f4f3ef;text-align:left;padding:6px 8px;border-bottom:1.5px solid #cfcac0;font-weight:700}td{padding:5px 8px;border-bottom:1px solid #eceae4}
  .r{text-align:right;font-variant-numeric:tabular-nums}.c{text-align:center;color:#888}tfoot td{font-weight:700;border-top:1.5px solid #16191d;background:#faf9f6}
  tr{break-inside:avoid}.rp-note{color:#5b6470;font-size:10.5px}.rp-f{display:flex;justify-content:space-between;margin-top:28px;padding-top:10px;border-top:1px solid #e4e1da;color:#5b6470;font-size:10px}
  @page{size:A4;margin:12mm}@media print{.rp{padding:0}}`;

  const TB_CSS = '.tb{position:sticky;top:0;display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:10px 16px;background:#16191d;color:#fff;font:600 13px system-ui,sans-serif}.tb button{background:#c2500a;color:#fff;border:0;border-radius:10px;padding:10px 16px;font:700 14px system-ui,sans-serif}@media print{.tb{display:none}}';
  X.doc = (def, o = {}) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(def.title)}</title><style>${PRINT_CSS}${TB_CSS}</style></head><body>${o.toolbar ? '<div class="tb"><button onclick="window.print()">PDF / Yazdır</button><span>iPhone: Paylaş → Yazdır → PDF olarak kaydet</span></div>' : ''}${X.html(def)}</body></html>`;

  /* PDF: gizli iframe ile yazdırma penceresi (PDF olarak kaydet seçilebilir) */
  X.print = (def) => {
    if (window.AndroidBridge) { try { window.AndroidBridge.printHtml(def.title || 'Rapor', X.doc(def)); } catch (e) { SS.ui.toast('Yazdırma açılamadı', 'bad'); } return; }
    if (SS.ui.isIOS()) return X.preview(def); // iOS: gizli iframe yazdırması güvenilmez; rapor sayfası açılır, Paylaş → Yazdır → PDF
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f); const d = f.contentWindow.document; d.open(); d.write(X.doc(def)); d.close();
    setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { SS.ui.toast('Yazdırma açılamadı', 'bad'); } setTimeout(() => f.remove(), 4000); }, 350);
  };
  X.preview = (def) => { if (window.AndroidBridge) return X.print(def); const w = window.open('', '_blank'); if (!w) { SS.ui.toast('Açılır pencere engellendi', 'bad'); return; } w.document.write(X.doc(def, { toolbar: true })); w.document.close(); };

  /* CSV (Excel TR için ; ayracı + BOM) */
  X.csv = (def) => {
    const q = (v) => { const s = v == null ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [[def.title], [`${SS.cfg.company} · ${def.project || 'Tüm şantiyeler'} · ${U.fmtDate(U.today())}`], []];
    def.sections.forEach((s) => {
      if (s.heading) lines.push([s.heading]);
      if (s.kpis) s.kpis.forEach(([k, v]) => lines.push([k, v]));
      if (s.cols) { lines.push(s.cols.map((c) => c.h)); s.rows.forEach((r) => lines.push(r.map((v) => (typeof v === 'number' ? String(v).replace('.', ',') : v)))); if (s.totals) lines.push(s.totals.map((v) => (typeof v === 'number' ? String(v).replace('.', ',') : v))); }
      lines.push([]);
    });
    return new Blob(['﻿' + lines.map((l) => l.map(q).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  };

  /* ---------- minimal .xlsx (depolu ZIP, bağımlılık yok) ---------- */
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), chunks = [], central = []; let off = 0;
    const u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    files.forEach(({ name, data }) => {
      const nb = enc.encode(name), db = typeof data === 'string' ? enc.encode(data) : data, crc = crc32(db);
      const head = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0x21), ...u16(0x0021), ...u32(crc), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0)]);
      chunks.push(head, nb, db);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0x21), ...u16(0x0021), ...u32(crc), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
      off += head.length + nb.length + db.length;
    });
    const csz = central.reduce((t, c) => t + c.length, 0);
    const end = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(csz), ...u32(off), ...u16(0)]);
    return new Blob([...chunks, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  const colName = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const xe = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

  X.xlsx = (def) => {
    const rowsXml = []; let r = 0; const widths = [];
    const addRow = (vals, style) => {
      r++; const cs = vals.map((v, i) => {
        const ref = colName(i) + r; widths[i] = Math.max(widths[i] || 8, Math.min(48, String(v ?? '').length + 3));
        if (v == null || v === '') return '';
        if (typeof v === 'number') return `<c r="${ref}" s="${style === 1 ? 1 : 2}"><v>${v}</v></c>`;
        return `<c r="${ref}" t="inlineStr" s="${style || 0}"><is><t xml:space="preserve">${xe(v)}</t></is></c>`;
      }).join('');
      rowsXml.push(`<row r="${r}">${cs}</row>`);
    };
    addRow([def.title], 3); addRow([`${SS.cfg.company} · ${def.project || 'Tüm şantiyeler'} · ${U.fmtDate(U.today())}`]); r++;
    def.sections.forEach((s) => {
      if (s.heading) addRow([s.heading], 3);
      if (s.kpis) s.kpis.forEach(([k, v]) => addRow([k, v]));
      if (s.cols) { addRow(s.cols.map((c) => c.h), 1); s.rows.forEach((row) => addRow(row)); if (s.totals) addRow(s.totals, 3); }
      r++;
    });
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${rowsXml.join('')}</sheetData></worksheet>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF4E3D6"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const name = xe((def.title || 'Rapor').slice(0, 28).replace(/[\\/?*[\]:]/g, ' '));
    return zip([
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: styles },
      { name: 'xl/worksheets/sheet1.xml', data: sheet },
    ]);
  };

  const slug = (s) => U.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rapor';
  X.save = (def, fmt) => {
    const base = `${slug(def.title)}-${U.today()}`;
    if (fmt === 'pdf') X.print(def);
    else if (fmt === 'xlsx') SS.ui.download(base + '.xlsx', X.xlsx(def));
    else SS.ui.download(base + '.csv', X.csv(def));
    SS.D.reports.unshift({ id: U.id('r'), title: def.title, project: def.project, fmt, date: U.today(), at: new Date().toISOString() });
    SS.D.reports.length = Math.min(SS.D.reports.length, 40); SS.store.save();
    if (!window.AndroidBridge) SS.ui.toast(fmt === 'pdf' ? 'PDF için yazdırma penceresi açıldı — "PDF olarak kaydet"i seçin' : `${fmt.toUpperCase()} dosyası indirildi`, 'ok');
  };

  /* Herhangi bir tablo için hızlı dışa aktarma menüsü */
  /* key: SS.reports.build(key) ile rapor tanımı üretilir (güncel filtrelerle) */
  X.menu = (key, label = 'Dışa Aktar') => `<span class="xmenu"><button class="btn" data-action="xm.toggle">${SS.ui.icon('download')}${label}</button><div class="xmenu-p">
      <button data-action="xm.go" data-key="${key}" data-fmt="pdf">${SS.ui.icon('printer')}PDF / Yazdır</button>
      <button data-action="xm.go" data-key="${key}" data-fmt="xlsx">${SS.ui.icon('sheet')}Excel (.xlsx)</button>
      <button data-action="xm.go" data-key="${key}" data-fmt="csv">${SS.ui.icon('file')}CSV</button></div></span>`;
  SS.actions['xm.toggle'] = (el) => { const p = el.nextElementSibling; const open = !p.classList.contains('on'); document.querySelectorAll('.xmenu-p.on').forEach((x) => x.classList.remove('on')); p.classList.toggle('on', open); };
  SS.actions['xm.go'] = (el) => { document.querySelectorAll('.xmenu-p.on').forEach((x) => x.classList.remove('on')); X.save(SS.reports.build(el.dataset.key), el.dataset.fmt); };
  document.addEventListener('click', (e) => { if (!e.target.closest('.xmenu')) document.querySelectorAll('.xmenu-p.on').forEach((x) => x.classList.remove('on')); });
})();
