/* Şantiye Şefi — açılış */
(async function () {
  const SS = window.SS;
  try {
    if (!SS.store.load()) await SS.seed.run();
    SS.ui.shell();
    if (!location.hash || location.hash === '#') history.replaceState(null, '', '#/dashboard');
    SS.ui.route();
    /* Çevrimdışı çalışma: yalnızca web olarak yayınlandığında (http/https) ve Android uygulamasının dışında */
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.AndroidBridge) {
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
