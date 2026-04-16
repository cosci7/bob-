// JARVIS OS Service Worker - Offline Support
const CACHE_NAME = 'jarvis-os-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  let isApiRequest = false;
  try {
    const url = new URL(event.request.url);
    isApiRequest = url.hostname === 'generativelanguage.googleapis.com' || url.hostname.endsWith('.esm.sh') || url.hostname === 'esm.sh';
  } catch {
    // Invalid URL - treat as static asset
  }

  if (isApiRequest) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) =>
        response || fetch(event.request).then((fetchResponse) => {
          if (fetchResponse.ok) {
            const clone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return fetchResponse;
        }).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
      )
    );
  }
});
