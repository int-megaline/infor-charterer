// 조선3사 임원 현황 & 조직도 — minimal service worker (installable PWA shell)
// Network-first for the page itself (so Jeffrey always sees the latest data refresh),
// cache-first fallback for everything else so the app still opens offline.
const CACHE = 'shipyard-org-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isNav = event.request.mode === 'navigate';
  event.respondWith(
    isNav
      ? fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
            return res;
          })
          .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
      : caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
