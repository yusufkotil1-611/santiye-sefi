/* Ayarlar & Yedek */
(function () {
  const SS = window.SS, U = SS.U, ui = SS.ui, I = ui.icon, esc = U.esc;

  SS.views.settings = {
    title: 'Ayarlar & Yedek',
    render() {
      const c = SS.cfg, n = SS.store.COLLS.reduce((t, k) => t + SS.D[k].length, 0);
      const f = (label, key, type = 'text', extra = '') => `<div class="fld"><label>${label}</label><input class="input" type="${type}" data-cfg="${key}" value="${esc(c[key])}" ${extra}></div>`;
      return `<div class="page">${ui.head({ title: 'Ayarlar & Yedek', sub: 'Firma bilgileri, tercihler ve veri yönetimi' })}
      <div class="grid g-2">
        <div class="card pad stack"><h3>Firma & Kullanıcı</h3><p class="muted">Bu bilgiler rapor başlıklarında ve menüde kullanılır.</p>
          ${f('Firma adı', 'company')}${f('Kullanıcı adı / unvan', 'user')}</div>
        <div class="card pad stack"><h3>Tercihler</h3>
          <label class="check"><input type="checkbox" data-cfg="sound" ${c.sound ? 'checked' : ''}><span>Ses efektleri (tık ve onay sesleri)</span></label>
          <div class="fld"><label>Tema</label>${ui.seg('settings', 'theme', [['auto', 'Otomatik'], ['light', 'Açık'], ['dark', 'Koyu']], c.theme)}</div>
          <div class="fgrid">${`<div class="fld half"><label>Motorin birim fiyatı (₺/lt)</label><input class="input" type="number" step="0.1" data-cfg="fuelPrice" data-num value="${c.fuelPrice}"></div><div class="fld half"><label>Fazla mesai çarpanı</label><input class="input" type="number" step="0.05" min="1" data-cfg="overtime" data-num value="${c.overtime}"></div>`}</div></div>
        <div class="card pad stack"><h3>Yedekleme</h3><p class="muted">Tüm kayıtlar bu cihazın tarayıcısında saklanır (${U.num(n)} kayıt). Düzenli olarak yedek alın; yedeği başka cihaza yükleyebilirsiniz.</p>
          <div class="row wrap"><button class="btn primary" data-action="set.backup">${I('download')}Yedek indir (.json)</button><button class="btn" data-action="set.restore">${I('upload')}Yedekten geri yükle</button></div></div>
        <div class="card pad stack"><h3>Veri Yönetimi</h3><p class="muted">Örnek verilerle başlamak veya tüm kayıtları silmek için kullanın. Bu işlem geri alınamaz.</p>
          <div class="row wrap"><button class="btn" data-action="set.demo">${I('undo')}Demo verisini yeniden yükle</button><button class="btn danger-ghost" data-action="set.wipe">${I('trash')}Tüm verileri sil</button></div></div>
      </div>
      <div class="card pad"><div class="row"><span class="logo-sm">${ui.logoSvg()}</span><div><b>Şantiye Şefi</b><p class="muted">Sürüm 1.0 · Çevrimdışı çalışır, verileriniz cihazınızdan çıkmaz.</p></div></div></div></div>`;
    },
  };

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-cfg]'); if (!el) return;
    const k = el.dataset.cfg;
    if (k === 'sound') { SS.sound.toggle(el.checked); const b = document.getElementById('soundBtn'); if (b) b.innerHTML = I(SS.cfg.sound ? 'volume' : 'mute'); return; }
    SS.cfg[k] = el.hasAttribute('data-num') ? parseFloat(el.value) || 0 : el.value.trim();
    SS.store.save(); if (k === 'user' || k === 'company') { ui.shell(); ui.route('quiet'); } ui.toast('Ayar kaydedildi');
  });
  const prevSet = SS.actions['vs.set'];
  SS.actions['vs.set'] = (el) => {
    if (el.dataset.view === 'settings') { SS.cfg.theme = el.dataset.val; SS.store.save(); ui.applyTheme(); ui.rerender(); return; }
    prevSet(el);
  };

  SS.actions['set.backup'] = async () => {
    const blobs = await SS.blob.dump();
    ui.download(`santiye-sefi-yedek-${U.today()}.json`, new Blob([JSON.stringify({ app: 'santiye-sefi', v: 1, data: SS.D, blobs })], { type: 'application/json' }));
    ui.toast('Yedek dosyası indirildi');
  };
  SS.actions['set.restore'] = async () => {
    const [f] = await ui.pickFiles('.json,application/json'); if (!f) return;
    try {
      const j = JSON.parse(await f.text()); if (j.app !== 'santiye-sefi' || !j.data) throw new Error('Geçersiz yedek dosyası');
      if (!(await ui.confirm({ title: 'Yedek geri yüklensin mi?', text: 'Mevcut tüm kayıtların yerine yedekteki veriler gelecek.', ok: 'Geri yükle' }))) return;
      SS.store.data = j.data; SS.store.ensure(); SS.store.flush(); await SS.blob.restore(j.blobs); location.reload();
    } catch (err) { ui.toast('Yedek okunamadı: ' + err.message, 'bad'); }
  };
  SS.actions['set.demo'] = async () => {
    if (!(await ui.confirm({ title: 'Demo verisi yüklensin mi?', text: 'Mevcut kayıtlarınız silinir ve örnek şantiye verileri yüklenir.', ok: 'Yeniden yükle' }))) return;
    await SS.blob.clear(); await SS.seed.run(); location.hash = '#/dashboard'; location.reload();
  };
  SS.actions['set.wipe'] = async () => {
    if (!(await ui.confirm({ title: 'Tüm veriler silinsin mi?', text: 'Projeler, harcamalar, personel, stok, çizimler dahil <b>tüm kayıtlar kalıcı olarak silinir</b>. Önce yedek almanız önerilir.', ok: 'Her şeyi sil' }))) return;
    await SS.blob.clear(); SS.store.fresh(); SS.store.flush(); location.hash = '#/dashboard'; location.reload();
  };
})();
