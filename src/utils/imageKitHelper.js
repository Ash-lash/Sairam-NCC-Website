import { getOptimizedUrl, getBlurUrl } from './imageOptimizer';

/**
 * Returns a high-speed CDN-optimized URL with modern WebP formatting,
 * responsive width snapping, and 1-year edge caching.
 */
export const getOptimizedImageUrl = (originalUrl, { width = 800, quality = 80, blur } = {}) => {
  if (blur) {
    return getBlurUrl(originalUrl);
  }
  return getOptimizedUrl(originalUrl, width, quality);
};
