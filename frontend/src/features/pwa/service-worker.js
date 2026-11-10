/* Generated with the current public build asset list. Never store account/API data here. */
const VERSION = __FORGE_VERSION__;
const BASE = __FORGE_BASE__;
const FILES = __FORGE_FILES__;
const CACHE = `forge-shell-${VERSION}`;
const root = new URL(BASE, self.location.origin);
const shell = new URL("index.html", root).href;
const assets = new Set(FILES.map((file) => new URL(file, root).href));
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([...assets])),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("forge-shell-") && name !== CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== root.origin ||
    !url.pathname.startsWith(root.pathname)
  )
    return;
  // Never intercept auth, API responses, photos, uploads or unrelated requests.
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/api/"))
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches
          .open(CACHE)
          .then((cache) => cache.match(shell));
        return cached || Response.error();
      }),
    );
    return;
  }
  url.search = "";
  if (!assets.has(url.href)) return;
  event.respondWith(
    caches
      .open(CACHE)
      .then(async (cache) => (await cache.match(url.href)) || fetch(request)),
  );
});
