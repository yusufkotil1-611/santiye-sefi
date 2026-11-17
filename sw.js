/* Åantiye Åefi â€” Ã§evrimdÄ±ÅŸÄ± Ã§alÄ±ÅŸma iÃ§in servis Ã§alÄ±ÅŸanÄ± (service worker)
   Strateji: Ã¶nce Ã¶nbellek, arkadan gÃ¼ncelle (stale-while-revalidate). Ä°lk aÃ§Ä±lÄ±ÅŸtan sonra internetsiz Ã§alÄ±ÅŸÄ±r. */
const VERSION = 'santiye-sefi-20261117-130909';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css', 'css/modules.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png',
  'js/util.js', 'js/db.js', 'js/sound.js', 'js/calc.js', 'js/ui.js', 'js/charts.js', 'js/export.js', 'js/seed.js',
  'js/views/dashboard.js', 'js/views/projects.js', 'js/views/expenses.js', 'js/views/hakedis.js', 'js/views/contracts.js',
  'js/views/sales.js', 'js/views/workforce.js', 'js/views/stock.js', 'js/views/diary.js', 'js/views/safety.js',
  'js/views/machines.js', 'js/views/dwg.js', 'js/views/ai.js', 'js/views/reports.js', 'js/views/settings.js', 'js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return hit || net;
    })
  );
});
