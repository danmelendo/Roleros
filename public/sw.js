/* Roleros · service worker (solo la web; en el APK no se registra).
   Que la app abra sin cobertura. A Supabase NUNCA se le cachea nada:
   verías una ficha vieja después de que el máster revele algo. */
const VERSION = "roleros-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: primero la red (versiones nuevas), y sin red la copia guardada.
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        // no-cache: revalida con el servidor. Sin esto la caché HTTP (GitHub Pages
        // manda max-age=600) servía un index.html viejo que apuntaba al JS anterior.
        const red = await fetch(req.url, { cache: "no-cache", credentials: "same-origin" });
        cache.put(req, red.clone());
        return red;
      } catch {
        return (await cache.match(req)) || (await cache.match("index.html")) || Response.error();
      }
    })());
    return;
  }

  // Estáticos: lo guardado al instante y de fondo se trae lo nuevo.
  if (/\.(js|css|woff2?|png|svg|ico|webmanifest)$/i.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const guardada = await cache.match(req);
      const traer = fetch(req).then((red) => { if (red.ok) cache.put(req, red.clone()); return red; }).catch(() => null);
      return guardada || (await traer) || Response.error();
    })());
  }
});
