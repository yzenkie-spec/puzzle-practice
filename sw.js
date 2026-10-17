/* Offline support: network first (so updates arrive automatically), saved copy when there is no connection. */
const CACHE = 'pp-offline';
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try {
      const html = await (await fetch('./index.html', { cache: 'no-store' })).text();
      const urls = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
      (html.match(/src="([^"]+\.js[^"]*)"/g) || []).forEach(m => urls.push(m.slice(5, -1)));
      await Promise.all(urls.map(u => c.add(new Request(u, { cache: 'no-store' })).catch(() => {})));
    } catch (err) {}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await fetch(r);
      if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(r, { ignoreSearch: false }) || (r.mode === 'navigate' ? await c.match('./index.html') : null);
      if (hit) return hit;
      return Response.error();
    }
  })());
});
