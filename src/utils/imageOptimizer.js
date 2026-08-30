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
    if (!originalUrl) return originalUrl;
    if (!isProxiableUrl(originalUrl)) return originalUrl;
    
    // Only apply Firebase Extension logic if it's a Firebase Storage URL
    if (originalUrl.startsWith('https://firebasestorage.googleapis.com')) {
        try {
            const urlObj = new URL(originalUrl);
            const oIndex = urlObj.pathname.indexOf('/o/');
            if (oIndex !== -1) {
                const objectPathStr = urlObj.pathname.substring(oIndex + 3);
                const pathParts = objectPathStr.split('%2F');
                const lastPart = pathParts.pop();
                
                const dotIndex = lastPart.lastIndexOf('.');
                if (dotIndex !== -1) {
                    const name = lastPart.substring(0, dotIndex);
                    // Determine which thumbnail size to request
                    const safeWidth = Math.max(1, Math.round(width * (window.devicePixelRatio || 1)));
                    const size = safeWidth <= 400 ? '400x400' : '800x800';
                    const newLastPart = `${name}_${size}.webp`;
                    
                    pathParts.push(newLastPart);
                    const newObjectPathStr = 'thumbnails%2F' + pathParts.join('%2F');
                    
                    urlObj.pathname = urlObj.pathname.substring(0, oIndex + 3) + newObjectPathStr;
                    urlObj.searchParams.delete('token');
                    if (!urlObj.searchParams.has('alt')) {
                        urlObj.searchParams.set('alt', 'media');
                    }
                    
                    return urlObj.toString();
                }
            }
        } catch (e) {
            // Fallback to original
        }
    }

    return originalUrl;
};

/**
 * Returns a tiny (20px wide, heavily compressed) blur placeholder.
 * Use this as a CSS background while the full image loads.
 */
export const getBlurUrl = (originalUrl) => {
    if (!originalUrl) return originalUrl;
    if (!isProxiableUrl(originalUrl)) return originalUrl;

    if (originalUrl.startsWith('https://firebasestorage.googleapis.com')) {
        try {
            const urlObj = new URL(originalUrl);
            const oIndex = urlObj.pathname.indexOf('/o/');
            if (oIndex !== -1) {
                const objectPathStr = urlObj.pathname.substring(oIndex + 3);
                const pathParts = objectPathStr.split('%2F');
                const lastPart = pathParts.pop();
                
                const dotIndex = lastPart.lastIndexOf('.');
                if (dotIndex !== -1) {
                    const name = lastPart.substring(0, dotIndex);
                    // Use the smallest generated thumbnail for the blur placeholder
                    const newLastPart = `${name}_400x400.webp`;
                    
                    pathParts.push(newLastPart);
                    const newObjectPathStr = 'thumbnails%2F' + pathParts.join('%2F');
                    
                    urlObj.pathname = urlObj.pathname.substring(0, oIndex + 3) + newObjectPathStr;
                    urlObj.searchParams.delete('token');
                    if (!urlObj.searchParams.has('alt')) {
                        urlObj.searchParams.set('alt', 'media');
                    }
                    
                    return urlObj.toString();
                }
            }
        } catch (e) {}
    }

    return originalUrl;
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
