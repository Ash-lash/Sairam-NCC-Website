import { getOptimizedUrl, getBlurUrl, getResponsiveSrcSet } from './imageOptimizer';

/**
 * Returns a high-speed ImageKit CDN URL with automatic WebP/AVIF formatting,
 * responsive width tier snapping, and 1-year CloudFront edge caching.
 */
export const getOptimizedImageUrl = (originalUrl, { width = 800, quality = 80, blur } = {}) => {
  if (blur) {
    return getBlurUrl(originalUrl);
  }
  return getOptimizedUrl(originalUrl, width, quality);
};

export { getOptimizedUrl, getBlurUrl, getResponsiveSrcSet };
