/* Phone shell cache. Mirrors lib/sw-policy.ts (bandcamp-shell-v1). */
const CACHE_NAME = "bandcamp-shell-v1";
const PRECACHE = [
  "/phone",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

function mode(pathname, method) {
  if (method !== "GET") return "ignore";
  if (pathname.startsWith("/_next/static/")) return "static";
  if (pathname.startsWith("/api/")) return "api";
  if (
    pathname === "/phone" ||
    pathname.startsWith("/phone/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon.svg" ||
    pathname.startsWith("/icon-") ||
    pathname === "/apple-touch-icon.png"
  ) {
    return "shell";
  }
  return "ignore";
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      const shell = await cache.match("/phone");
      if (shell) return shell;
    }
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.all(PRECACHE.map((path) => cache.add(path).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const kind = mode(url.pathname, event.request.method);
  if (kind === "ignore") return;
  if (kind === "static") {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  event.respondWith(networkFirst(event.request));
});
