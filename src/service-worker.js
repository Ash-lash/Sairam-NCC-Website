/* eslint-disable no-restricted-globals */

// This service worker intercepts image requests and stores them in the Cache API (Cache Memory).
// This provides an "Amazon-like" asynchronous retrieval experience across all devices.

const CACHE_NAME = 'ncc-media-v2';
const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'avif'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept image-like requests or requests to our optimized proxy/firebase storage
  const isImage = IMAGE_TYPES.some(type => url.pathname.endsWith(`.${type}`)) || 
                  url.href.includes('firebasestorage') || 
                  url.href.includes('wsrv.nl');

  if (event.request.method === 'GET' && isImage) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from Cache Memory (Asynchronous Retrieval)
          return cachedResponse;
        }

        // Otherwise fetch and cache for next time
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});
