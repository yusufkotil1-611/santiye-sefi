/* Şantiye Şefi — açılış */
(async function () {
  const SS = window.SS;
  try {
    if (SS.cloud && SS.cloud.enabled) {
      /* Bulut kipi: giriş → firma → (varsa) eski yerel veriyi aktar → eşitleme. Yerel veri firmaya özel anahtarla yüklenir. */
      const t = (() => { try { return JSON.parse(localStorage.getItem(SS.store.LEGACY_KEY) || '{}').settings || {}; } catch (e) { return {}; } })();
      SS.store.key = 'santiyesefi.pending.v1';        // firma seçilene kadar geçici anahtar: eski yerel veri (LEGACY_KEY) yanlışlıkla ezilmesin
      SS.store.fresh(); Object.assign(SS.cfg, { theme: t.theme || 'auto', sound: t.sound !== false });   // giriş ekranları için tema/ses tercihi
      SS.ui.applyTheme();
      await SS.account.boot();
    } else if (!SS.store.load()) SS.store.fresh();    // örnek veri yok: temiz başlangıç
    SS.ui.applyTheme();
    if (!SS.cfg.onboarded) await SS.welcome.run();    // ilk giriş: "Bana ne ile hitap etmek istersiniz?" (bulut kipinde hesap açılışında sorulur)
    SS.ui.shell();
    if (!location.hash || location.hash === '#') history.replaceState(null, '', '#/dashboard');
    SS.ui.route();
    if (SS.account && SS.account.afterShell) SS.account.afterShell();
    if (SS.welcome.wantsProject) { SS.welcome.wantsProject = false; setTimeout(() => SS.actions['proj.new'](), 450); }
    else if (SS.store.hasDemo() && !SS.cfg.demoAsked) setTimeout(() => SS.welcome.offerDemoCleanup(), 700);
    /* Çevrimdışı çalışma: yalnızca web olarak yayınlandığında (http/https) ve Android uygulamasının dışında */
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.AndroidBridge && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const w = reg.installing; if (!w) return;
          w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) SS.ui.toast('Yeni sürüm indirildi — uygulamayı kapatıp açınca devreye girer', 'info'); });
        });
      }).catch(() => {});
    }
  } catch (e) {
    console.error(e);
    document.getElementById('app').innerHTML = `<div class="boot"><b>Uygulama başlatılamadı</b><small>${SS.U.esc(e.message)}</small><button class="btn primary" onclick="localStorage.removeItem('santiyesefi.v1');location.reload()">Verileri sıfırla ve yeniden dene</button></div>`;
  }
})();
