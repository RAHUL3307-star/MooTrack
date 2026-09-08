// MooTracker PWA Service Worker v6
const CACHE_NAME = 'mootracker-v6';
const OFFLINE_URL = 'mobile.html';

// Core assets to cache on install
const PRECACHE_URLS = [
  'mobile.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'assets/icon-192x192.png',
  'assets/icon-512x512.png',
  'assets/icon-144x144.png',
  'assets/icon-96x96.png',
  'assets/icon-72x72.png',
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return the offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Background sync support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alerts') {
    console.log('[SW] Background sync triggered');
  }
});

// Push notification support (ready for future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'MooTracker Alert', {
        body: data.body || 'Check your cattle health status',
        icon: 'assets/icon-192x192.png',
        badge: 'assets/icon-72x72.png',
        tag: 'mootracker-alert',
        renotify: true,
      })
    );
  }
});
