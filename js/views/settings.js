/* Ayarlar & Yedek */
(function () {
  const SS = window.SS, U = SS.U, ui = SS.ui, I = ui.icon, esc = U.esc;

  SS.views.settings = {
    title: 'Ayarlar & Yedek',
    render() {
      const c = SS.cfg, n = SS.store.COLLS.reduce((t, k) => t + SS.D[k].length, 0), cloud = !!(SS.cloud && SS.cloud.enabled);
      const f = (label, key, type = 'text', extra = '') => `<div class="fld"><label>${label}</label><input class="input" type="${type}" data-cfg="${key}" value="${esc(c[key])}" ${extra}></div>`;
      return `<div class="page">${ui.head({ title: 'Ayarlar & Yedek', sub: 'Firma bilgileri, tercihler ve veri yönetimi' })}
      <div class="grid g-2">
        <div class="card pad stack"><h3>Firma & Kullanıcı</h3><p class="muted">Bu bilgiler rapor başlıklarında ve menüde kullanılır.</p>
          ${f('Bana şöyle hitap edin', 'user', 'text', 'maxlength="30" placeholder="Adınız veya lakabınız"')}${f('Firma adı', 'company', 'text', 'placeholder="Raporlarda görünür"')}</div>
        <div class="card pad stack"><h3>Tercihler</h3>
          <label class="check"><input type="checkbox" data-cfg="sound" ${c.sound ? 'checked' : ''}><span>Ses efektleri (tık ve onay sesleri)</span></label>
          <div class="fld"><label>Tema</label>${ui.seg('settings', 'theme', [['auto', 'Otomatik'], ['light', 'Açık'], ['dark', 'Koyu']], c.theme)}</div>
          <div class="fgrid">${`<div class="fld half"><label>Motorin birim fiyatı (₺/lt)</label><input class="input" type="number" step="0.1" data-cfg="fuelPrice" data-num value="${c.fuelPrice}"></div><div class="fld half"><label>Fazla mesai çarpanı</label><input class="input" type="number" step="0.05" min="1" data-cfg="overtime" data-num value="${c.overtime}"></div>`}</div></div>
        <div class="card pad stack"><h3>Hava Durumu</h3><p class="muted">Saha hava durumu ve iş uygunluğu için açık hava servisi (Open-Meteo) kullanılır. Etkinleştirince yalnızca şantiyenin <b>yer adı</b> gönderilir; başka veri gönderilmez. İnternet gerekir, son veri çevrimdışı da görünür.</p>
          <label class="check"><input type="checkbox" data-cfg="wxOn" ${c.wxOn ? 'checked' : ''}><span>Hava durumunu etkinleştir</span></label>
          ${f('Varsayılan yer adı (şantiyede konum yoksa)', 'city', 'text', 'placeholder="ör. Sakarya"')}
          <div class="row wrap"><button class="btn" data-action="wx.refresh">${I('refresh')}Şimdi güncelle</button>${c.wxOn ? `<button class="btn danger-ghost" data-action="wx.off">${I('trash')}Kapat ve önbelleği temizle</button>` : ''}</div></div>
        <div class="card pad stack"><h3>Yedekleme</h3><p class="muted">${cloud ? `Verileriniz firmanızın bulutunda saklanır ve cihazlarınızla eşitlenir (${U.num(n)} kayıt). Yine de dışa aktarmak için yedek indirebilirsiniz.` : `Tüm kayıtlar bu cihazın tarayıcısında saklanır (${U.num(n)} kayıt). Düzenli olarak yedek alın; yedeği başka cihaza yükleyebilirsiniz.`}</p>${c.lastBackup ? `<p class="sub">Son yedek: ${U.fmtDate(c.lastBackup)}</p>` : cloud ? '' : '<p class="sub wrn">Henüz yedek almadınız.</p>'}
          <div class="row wrap"><button class="btn primary" data-action="set.backup">${I('download')}Yedek indir (.json)</button><button class="btn" data-action="set.restore">${I('upload')}Yedekten geri yükle</button></div></div>
        <div class="card pad stack"><h3>Veri Yönetimi</h3>${cloud ? '<p class="muted">Bulut kipinde veriler firmadaki herkesle ortaktır; bu yüzden "tüm verileri sil" kapalıdır. Bu cihazdaki yerel kopyayı temizlemek için Hesap & Lisans ekranından çıkış yapın.</p>' : '<p class="muted">Tüm kayıtları silip sıfırdan başlamak için kullanın. Bu işlem geri alınamaz; önce yedek alın.</p>'}
          <div class="row wrap">${SS.store.hasDemo() ? `<button class="btn" data-action="set.cleandemo">${I('trash')}Eski örnek verileri kaldır</button>` : ''}${cloud ? `<a class="btn" href="#/account">${I('users')}Hesap & Lisans</a>` : `<button class="btn danger-ghost" data-action="set.wipe">${I('trash')}Tüm verileri sil</button>`}</div></div>
      </div>
      <div class="card pad"><div class="row"><span class="logo-sm">${ui.logoSvg()}</span><div><b>Şantiye Şefi</b><p class="muted">${cloud ? 'Sürüm 2.0 · Çevrimdışı çalışır; verileriniz firmanıza ait bulutta saklanır ve cihazlarınızla eşitlenir.' : 'Sürüm 2.0 · Çevrimdışı çalışır, verileriniz cihazınızdan çıkmaz.'}</p></div></div></div></div>`;
    },
  };

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-cfg]'); if (!el) return;
    const k = el.dataset.cfg;
    if (k === 'wxOn') { SS.cfg.wxOn = el.checked; SS.store.save(); if (el.checked && SS.wx) SS.wx.refresh(SS.wx.target(), true); ui.toast(el.checked ? 'Hava durumu etkinleştirildi' : 'Hava durumu kapatıldı', 'info'); return; }
    if (k === 'sound') { SS.sound.toggle(el.checked); const b = document.getElementById('soundBtn'); if (b) b.innerHTML = I(SS.cfg.sound ? 'volume' : 'mute'); return; }
    SS.cfg[k] = el.hasAttribute('data-num') ? parseFloat(el.value) || 0 : el.value.trim();
    SS.store.save(); if (k === 'user' && !SS.cfg.user) SS.cfg.user = 'Şef'; if (k === 'user' || k === 'company') { ui.shell(); ui.route('quiet'); } ui.toast('Ayar kaydedildi');
  });
  const prevSet = SS.actions['vs.set'];
  SS.actions['vs.set'] = (el) => {
    if (el.dataset.view === 'settings') { SS.cfg.theme = el.dataset.val; SS.store.save(); ui.applyTheme(); ui.rerender(); return; }
    prevSet(el);
  };

  SS.actions['set.backup'] = async () => {
    const blobs = await SS.blob.dump();
    ui.download(`santiye-sefi-yedek-${U.today()}.json`, new Blob([JSON.stringify({ app: 'santiye-sefi', v: 1, data: SS.D, blobs })], { type: 'application/json' }));
    SS.cfg.lastBackup = U.today(); SS.store.save(); ui.toast('Yedek dosyası indirildi'); ui.rerender();
  };
  SS.actions['set.restore'] = async () => {
    const [f] = await ui.pickFiles('.json,application/json'); if (!f) return;
    try {
      const j = JSON.parse(await f.text()); if (j.app !== 'santiye-sefi' || !j.data) throw new Error('Geçersiz yedek dosyası');
      const cl = !!(SS.cloud && SS.cloud.enabled);
      if (!(await ui.confirm({ title: 'Yedek geri yüklensin mi?', text: cl ? '<b>Dikkat:</b> yedekte olmayan kayıtlar <b>firmadaki herkesin verisinden de silinir</b>; bulut ve tüm cihazlar yedeğin durumuna döner. Emin değilseniz önce mevcut durumun yedeğini alın.' : 'Mevcut tüm kayıtların yerine yedekteki veriler gelecek.', ok: 'Geri yükle' }))) return;
      SS.store.data = j.data; SS.store.ensure(); SS.store.flush(); await SS.blob.restore(j.blobs); location.reload();
    } catch (err) { ui.toast('Yedek okunamadı: ' + err.message, 'bad'); }
  };
  SS.actions['set.cleandemo'] = () => SS.welcome.offerDemoCleanup();
  SS.actions['set.wipe'] = async () => {
    if (SS.cloud && SS.cloud.enabled) { ui.toast('Bulut kipinde tüm verileri silme kapalı (firmadaki herkesi etkiler).', 'bad'); return; }
    if (!(await ui.confirm({ title: 'Tüm veriler silinsin mi?', text: 'Projeler, harcamalar, personel, stok, çizimler dahil <b>tüm kayıtlar kalıcı olarak silinir</b>. Önce yedek almanız önerilir.', ok: 'Her şeyi sil' }))) return;
    await SS.blob.clear(); SS.store.fresh(); SS.store.flush(); location.hash = '#/dashboard'; location.reload();
  };
})();
