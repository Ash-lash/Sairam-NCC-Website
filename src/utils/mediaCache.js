/**
 * MediaCache Utility
 * Asynchronously fetches and stores images and PDFs in browser Cache API (Cache Memory).
 * This ensures fast, Amazon-like retrieval experiences for returning media.
 * 
 * Note: While the project uses JavaScript, we implement the "asynchronous processes" 
 * logic requested (often referred to as Java/JavaScript async patterns) using 
 * native browser Promises and the Cache API for maximum performance.
 */

const CACHE_NAME = 'ncc-media-cache-v1';

export const prefetchAndCache = async (url) => {
  if (!url) return null;

  try {
    const cache = await window.caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    // If present in cache memory, return it instantly
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    // Asynchronously fetch if not in cache (JavaScript/Java Async Logic)
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      // Put a clone into the cache while we use the original
      await cache.put(url, response.clone());
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    return url; // fallback to generic URL
  } catch (err) {
    console.warn("Async fetching error, falling back to original URL.", err);
    return url;
  }
};

/**
 * Bulk Prefetch Utility
 * Fetches multiple URLs asynchronously to warm up the cache memory.
 */
export const prefetchList = async (urls) => {
  if (!urls || !Array.isArray(urls)) return;
  
  const cache = await window.caches.open(CACHE_NAME);
  
  // Process all URLs in parallel for maximum speed
  return Promise.allSettled(urls.map(async (url) => {
    try {
      const match = await cache.match(url);
      if (!match) {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    } catch (e) {
      // Silent fail for individual prefetch
    }
  }));
};

