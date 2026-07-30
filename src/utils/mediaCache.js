/**
 * mediaCache — thin front-end for the service-worker image cache.
 *
 * The actual caching happens in /public/service-worker.js using the Cache
 * Storage API. That cache lives with the website (not Firebase), and every
 * image request passes through it automatically via the SW fetch handler.
 *
 * This module exposes two helpers so the rest of the app can:
 *   1. Ask the SW to warm the cache in the background (prefetchList)
 *   2. Keep backward compatibility with the old prefetchAndCache() signature
 *      (just returns the URL — the SW handles the rest transparently).
 *
 * IMPORTANT: do NOT create blob: object URLs from fetched responses. Blob
 * URLs bypass the service worker on subsequent loads and prevent the browser
 * from streaming/decoding images progressively, which makes pages feel
 * *slower*, not faster. Returning the original URL lets the SW + browser
 * cache layers do their jobs optimally.
 */

const canUseSW = () =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

const getController = async () => {
  if (!canUseSW()) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  // On a fresh install the SW claims clients a tick after activation;
  // wait for readiness so the first prefetch isn't dropped.
  try {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller;
  } catch (_) {
    return null;
  }
};

/**
 * Backward-compatible shim. Historically this returned a blob: URL, which
 * turned out to be the main cause of slow first paint. It now simply returns
 * the original URL — the service worker caches the response transparently.
 */
export const prefetchAndCache = async (url) => url || null;

/**
 * Tell the service worker to warm its cache with these URLs in the
 * background. Returns immediately; the SW does the work off the main thread.
 */
export const prefetchList = async (urls) => {
  if (!urls || !Array.isArray(urls)) return;
  const list = urls.filter(Boolean);
  if (list.length === 0) return;

  const controller = await getController();
  if (controller) {
    controller.postMessage({ type: 'PREFETCH_IMAGES', urls: list });
    return;
  }

  // Fallback (SW unsupported / not yet active): quietly warm the HTTP cache
  // using <img> preloads. No blobs, no blocking.
  list.forEach((u) => {
    try {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = u;
    } catch (_) { /* ignore */ }
  });
};

/** Manually flush the SW image cache (useful after a deploy). */
export const clearImageCache = async () => {
  const controller = await getController();
  if (controller) controller.postMessage({ type: 'CLEAR_IMAGE_CACHE' });
};
