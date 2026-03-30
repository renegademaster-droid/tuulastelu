const CACHE = 'tuulastelu-v1';
const SHELL = ['./index.html', './'];

// Install: cache app shell
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting(); // activate new SW immediately without waiting for tabs to close
});

// Activate: delete old caches, take control of all open tabs
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch strategy:
// - External APIs & map tiles: always network (never cache live data)
// - App shell (index.html): network-first → always gets latest on deploy, falls back offline
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Pass through all external requests uncached
  if (url.origin !== location.origin) return;

  // App shell: network-first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
