/* eslint-disable no-restricted-globals */

/**
 * NCC Website Service Worker — image cache layer.
 *
 * Runs asynchronously between the page and the network. All image requests
 * (Firebase Storage, wsrv.nl CDN, local assets) are intercepted and served
 * with a stale-while-revalidate strategy:
 *   - If the image is already in the cache, return it immediately (instant).
 *   - In parallel, fetch a fresh copy in the background and update the cache
 *     for the next visit. The user never waits for the revalidation.
 *
 * This is the same pattern Amazon / Flipkart / Apple use to make repeat
 * views feel instantaneous, and the cache lives with the website itself
 * (browser Cache Storage), not in Firebase.
 */

const SW_VERSION = 'v6-2026-fast';
const IMAGE_CACHE = `ncc-images-${SW_VERSION}`;
const MAX_IMAGE_ENTRIES = 300;

const IMAGE_EXT_RE = /\.(png|jpe?g|svg|webp|gif|avif|bmp|ico)(\?.*)?$/i;

const isImageRequest = (request, url) => {
  if (request.destination === 'image') return true;
  const href = url.href;
  if (
    href.includes('wsrv.nl') ||
    href.includes('firebasestorage') ||
    href.includes('googleusercontent') ||
    href.includes('cloudinary') ||
    href.includes('imagekit.io')
  ) {
    return true;
  }
  return IMAGE_EXT_RE.test(url.pathname);
};

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== IMAGE_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Keep the image cache bounded — oldest entries get evicted first.
const trimCache = async (cacheName, maxEntries) => {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    const overflow = keys.length - maxEntries;
    for (let i = 0; i < overflow; i++) {
      await cache.delete(keys[i]);
    }
  } catch (_) { /* best-effort */ }
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && (response.status === 200 || response.type === 'opaque')) {
        // Clone before the response body gets consumed by the return path.
        const clone = response.clone();
        cache.put(request, clone)
          .then(() => trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES))
          .catch(() => {});
      }
      return response;
    })
    .catch(() => cached);

  // Return cached immediately if available, otherwise wait on network.
  return cached || networkFetch;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// The app can ask the SW to warm the cache in the background.
// The page never blocks on this — it's pure fire-and-forget.
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'PREFETCH_IMAGES' && Array.isArray(event.data.urls)) {
    const urls = event.data.urls.filter(Boolean);
    event.waitUntil(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE);
        await Promise.allSettled(
          urls.map(async (u) => {
            try {
              const hit = await cache.match(u);
              if (hit) return;
              try {
                const resp = await fetch(u, { mode: 'cors', credentials: 'omit' });
                if (resp && (resp.status === 200 || resp.type === 'opaque')) {
                  await cache.put(u, resp);
                  return;
                }
              } catch (_) {
                // Fallback to no-cors for origins without explicit CORS headers
                const respNoCors = await fetch(u, { mode: 'no-cors', credentials: 'omit' });
                if (respNoCors) await cache.put(u, respNoCors);
              }
            } catch (_) { /* ignore */ }
          })
        );
        await trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
      })()
    );
  }

  if (event.data.type === 'CLEAR_IMAGE_CACHE') {
    event.waitUntil(caches.delete(IMAGE_CACHE));
  }
});
