const CACHE_NAME = 'quingo-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('quingo-') && cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
  }
});

// Background sync for cart
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(
      (async () => {
        try {
          await fetch('/api/cart/sync', {
            method: 'POST'
          });
        } catch (error) {
          console.error('Failed to sync cart:', error);
          throw error;
        }
      })()
    );
  }
});
