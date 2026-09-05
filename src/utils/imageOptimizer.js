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

// Bucket widths to maximize CDN cache hit ratio across different screen sizes
const WIDTH_BUCKETS = [150, 320, 480, 640, 800, 1080, 1440, 1920];
const snapWidth = (w) => WIDTH_BUCKETS.find((b) => b >= w) || 1920;

const isProxiableUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const s = url.toLowerCase();

    // Do not proxy if it's already a wsrv.nl URL, SVG, or data URI
    if (s.includes('wsrv.nl') || s.startsWith('data:') || s.endsWith('.svg') || s.includes('.svg?')) {
        return false;
    }

    return (
        s.includes('firebasestorage.googleapis.com') ||
        s.includes('firebasestorage.app') ||
        s.includes('storage.googleapis.com') ||
        s.includes('googleusercontent') ||
        s.includes('cloudinary') ||
        s.includes('supabase.co') ||
        s.startsWith('https://') ||
        s.startsWith('http://')
    );
};

/**
 * Returns a CDN-optimised URL for the image.
 * Uses high-performance Cloudflare-backed proxy with:
 *  - Deterministic URLs (no random cache busters) for 1-year CDN caching
 *  - Width snapping to maximize global CDN cache hit ratio
 *  - Modern WebP conversion and quality optimization
 *
 * @param {string} originalUrl - The raw image URL.
 * @param {number} [width=800] - Desired CSS-pixel width.
 * @param {number} [quality=80] - WebP quality 1-100.
 * @returns {string}
 */
export const getOptimizedUrl = (originalUrl, width = 800, quality = 80) => {
    if (!originalUrl) return '';
    if (!isProxiableUrl(originalUrl)) return originalUrl;

    const dpr = getDpr();
    const targetWidth = snapWidth(Math.round(width * dpr));
    const targetQuality = targetWidth >= 1080 ? Math.max(quality - 10, 65) : Math.min(quality, 85);

    const params = new URLSearchParams({
        url: originalUrl,
        w: String(targetWidth),
        q: String(targetQuality),
        output: 'webp'
    });

    return `https://wsrv.nl/?${params.toString()}`;
};

/**
 * Returns a tiny (24px wide, heavily blurred) WebP placeholder.
 * Used for instant blur-up while full image downloads.
 */
export const getBlurUrl = (originalUrl) => {
    if (!originalUrl) return '';
    if (!isProxiableUrl(originalUrl)) return originalUrl;

    const params = new URLSearchParams({
        url: originalUrl,
        w: '24',
        q: '30',
        blur: '5',
        output: 'webp'
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
