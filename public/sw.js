const CACHE_NAME = "immerselog-shell-v2";
const APP_SHELL = [
  "/",
  "/library",
  "/log",
  "/analytics",
  "/profile",
  "/vocab",
  "/manifest.webmanifest",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === location.origin;

  if (url.pathname.startsWith("/api/search")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ results: [] }), {
      headers: { "Content-Type": "application/json" }
    })));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok && isSameOrigin) caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(url.pathname).then((cached) => cached ?? caches.match("/")))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        if (response.ok && isSameOrigin) caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/log"));
});
