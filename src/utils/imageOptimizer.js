/**
 * Image delivery helper.
 *
 * Proxy is OFF by default (images load directly from Firebase).
 * Set REACT_APP_IMAGE_PROXY=on to enable wsrv.nl CDN proxy for
 * resize + WebP conversion.
 *
 * Even without the proxy, the OptimizedImage component still provides:
 *  - IntersectionObserver lazy loading
 *  - Smooth fade-in transitions
 *  - In-memory caching
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getDpr = () => {
    if (typeof window === 'undefined') return 1;
    return clamp(window.devicePixelRatio || 1, 1, 2);
};

// Proxy is ON by default.
const IMAGE_PROXY_ENABLED = process.env.REACT_APP_IMAGE_PROXY !== 'off';

const isProxiableUrl = (url) => {
    if (!url) return false;
    const s = url.toLowerCase();

    // Do not proxy if it's already a wsrv.nl URL or a data URI
    if (s.includes('wsrv.nl') || s.startsWith('data:')) return false;

    return (
        s.includes('firebasestorage') ||
        s.includes('googleapis.com') ||
        s.includes('googleusercontent') ||
        s.includes('imgur.com') ||
        s.includes('cloudinary') ||
        s.startsWith('https://')
    );
};

/**
 * Returns a CDN-optimised URL for the image.
 * @param {string} originalUrl - The raw image URL (usually Firebase Storage).
 * @param {number} [width=800] - Desired CSS-pixel width (auto-multiplied by DPR).
 * @param {number} [quality=80] - JPEG/WebP quality 1-100.
 * @returns {string}
 */
export const getOptimizedUrl = (originalUrl, width = 800, quality = 80) => {
    if (!originalUrl) return '';
    if (!IMAGE_PROXY_ENABLED) return originalUrl;
    if (!isProxiableUrl(originalUrl)) return originalUrl;

    // Use AVIF if possible (smaller than WebP, same quality)
    // Reduce quality slightly for very large images to save bandwidth
    const safeWidth = Math.max(1, Math.round(width * getDpr()));
    const adjustedQuality = safeWidth > 1200 ? clamp(quality - 10, 60, 90) : clamp(quality, 60, 100);

    const params = new URLSearchParams({
        url: originalUrl,
        w: String(safeWidth),
        q: String(adjustedQuality),
        output: 'webp',     // Switch back to WebP for maximum compatibility
    });

    return `https://wsrv.nl/?${params.toString()}`;
};

/**
 * Returns a tiny (20px wide, heavily compressed) blur placeholder.
 * Use this as a CSS background while the full image loads.
 */
export const getBlurUrl = (originalUrl) => {
    if (!originalUrl) return '';
    if (!IMAGE_PROXY_ENABLED) return '';
    if (!isProxiableUrl(originalUrl)) return '';

    const params = new URLSearchParams({
        url: originalUrl,
        w: '20',
        q: '20',
        output: 'webp',
        blur: '5',
    });

    return `https://wsrv.nl/?${params.toString()}`;
};


// --------------- In-memory image cache ---------------

const _imageCache = new Map();
const MAX_CACHE_SIZE = 150;

/**
 * Preload an image into the browser cache (and our in-memory Map).
 * Returns a promise that resolves with the src once loaded.
 */
export const preloadImage = (src) => {
    if (!src) return Promise.resolve('');
    if (_imageCache.has(src)) return Promise.resolve(src);

    return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            if (_imageCache.size >= MAX_CACHE_SIZE) {
                // Evict oldest entry
                const firstKey = _imageCache.keys().next().value;
                _imageCache.delete(firstKey);
            }
            _imageCache.set(src, true);
            resolve(src);
        };
        img.onerror = () => resolve(src); // still resolve so UI doesn't break
        img.src = src;
    });
};

/**
 * Check if an image is already cached.
 */
export const isImageCached = (src) => _imageCache.has(src);

/**
 * Preload an array of images (e.g. next slideshow slides).
 */
export const preloadImages = (urls) => {
    return Promise.allSettled(urls.filter(Boolean).map(preloadImage));
};
