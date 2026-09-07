const IMAGEKIT_ENDPOINT = (process.env.REACT_APP_IMAGEKIT_URL || 'https://ik.imagekit.io/sairamncc2023').replace(/\/$/, '');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getDpr = () => {
    if (typeof window === 'undefined') return 1;
    return clamp(window.devicePixelRatio || 1, 1, 2);
};

// Responsive width tiers:
// 400px: Cards & thumbnails (~6KB - 10KB)
// 800px: Normal in-page views (~20KB - 35KB)
// 1200px: High-res desktop views (~45KB - 60KB)
// 1600px: Fullscreen lightbox / slideshows (~70KB - 95KB)
export const RESPONSIVE_TIERS = [400, 800, 1200, 1600];

const snapWidth = (w) => {
    if (w <= 450) return 400;
    if (w <= 900) return 800;
    if (w <= 1350) return 1200;
    return 1600;
};

const isProxiableUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const s = url.toLowerCase();

    if (s.startsWith('data:') || s.endsWith('.svg') || s.includes('.svg?')) {
        return false;
    }

    return (
        s.includes('firebasestorage.googleapis.com') ||
        s.includes('firebasestorage.app') ||
        s.includes('storage.googleapis.com') ||
        s.includes('ik.imagekit.io') ||
        s.startsWith('https://') ||
        s.startsWith('http://')
    );
};

/**
 * Returns an ImageKit CDN-optimized URL with:
 *  - Automatic AVIF / WebP conversion (f-auto)
 *  - Snapped responsive dimensions (400px / 800px / 1200px / 1600px)
 *  - Global CloudFront Edge caching (1 year immutable)
 *
 * @param {string} originalUrl - The raw image URL.
 * @param {number} [width=800] - Desired CSS-pixel width.
 * @param {number} [quality=80] - Image quality 1-100.
 * @returns {string}
 */
export const getOptimizedUrl = (originalUrl, width = 800, quality = 80) => {
    if (!originalUrl) return '';
    if (!isProxiableUrl(originalUrl)) return originalUrl;

    const dpr = getDpr();
    const targetWidth = snapWidth(Math.round(width * dpr));
    const targetQuality = targetWidth >= 1200 ? Math.max(quality - 10, 70) : Math.min(quality, 85);

    try {
        // Direct integration with ImageKit upstream Firebase Storage Origin
        if (originalUrl.includes('firebasestorage.googleapis.com')) {
            const urlObj = new URL(originalUrl);
            const path = urlObj.pathname + urlObj.search;
            return `${IMAGEKIT_ENDPOINT}/tr:w-${targetWidth},f-auto,q-${targetQuality}${path}`;
        }

        // Already ImageKit URL
        if (originalUrl.includes('ik.imagekit.io')) {
            if (originalUrl.includes('/tr:')) {
                return originalUrl.replace(/\/tr:[^/]+/, `/tr:w-${targetWidth},f-auto,q-${targetQuality}`);
            }
            return originalUrl.replace(IMAGEKIT_ENDPOINT, `${IMAGEKIT_ENDPOINT}/tr:w-${targetWidth},f-auto,q-${targetQuality}`);
        }

        // External non-Firebase fallback via fast edge proxy
        const params = new URLSearchParams({
            url: originalUrl,
            w: String(targetWidth),
            q: String(targetQuality),
            output: 'webp'
        });
        return `https://wsrv.nl/?${params.toString()}`;
    } catch (_) {
        return originalUrl;
    }
};

/**
 * Generates standard responsive srcSet string for modern browsers (400w, 800w, 1600w).
 */
export const getResponsiveSrcSet = (originalUrl, quality = 80) => {
    if (!originalUrl || !isProxiableUrl(originalUrl)) return '';
    return `${getOptimizedUrl(originalUrl, 400, quality)} 400w, ${getOptimizedUrl(originalUrl, 800, quality)} 800w, ${getOptimizedUrl(originalUrl, 1600, quality)} 1600w`;
};

/**
 * Returns a tiny (30px wide, blurred) placeholder for instant perception.
 */
export const getBlurUrl = (originalUrl) => {
    if (!originalUrl) return '';
    if (!isProxiableUrl(originalUrl)) return originalUrl;

    try {
        if (originalUrl.includes('firebasestorage.googleapis.com')) {
            const urlObj = new URL(originalUrl);
            const path = urlObj.pathname + urlObj.search;
            return `${IMAGEKIT_ENDPOINT}/tr:w-30,bl-6,f-auto,q-30${path}`;
        }

        const params = new URLSearchParams({
            url: originalUrl,
            w: '30',
            q: '30',
            blur: '6',
            output: 'webp'
        });
        return `https://wsrv.nl/?${params.toString()}`;
    } catch (_) {
        return originalUrl;
    }
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
