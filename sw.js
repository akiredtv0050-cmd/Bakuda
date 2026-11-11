/* ==========================================================
   sw.js  ―  PWA（ホーム画面に追加・オフライン対応）
   ★ 更新を出すときは CACHE_NAME の番号を config.js の version と合わせて変える
   ========================================================== */
const CACHE_NAME = 'bakuda-craft-v1.0.0';
const CORE = ['./', './index.html', './manifest.json', './css/base.css', './css/screens.css', './css/forge.css', './css/zukan.css'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => { })))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// コード（html/css/js/json）はネット優先＝更新がすぐ反映。画像・音はキャッシュ優先＝2000枚でも2回目から速い
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isCode = req.mode === 'navigate' || /\.(html|css|js|json)$/.test(url.pathname);
  const save = (res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); } return res; };
  if (isCode) e.respondWith(fetch(req).then(save).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  else e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(save)));
});
