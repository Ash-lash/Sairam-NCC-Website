import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageKitHelper';

/**
 * AsyncCachedImage Component
 * Uses ImageKit and progressive "blur-up" loading to load images seamlessly
 * just like Instagram or Amazon.
 */
const AsyncCachedImage = ({
  src,
  alt,
  className,
  style,
  width = 800,
  priority = false,
  aspectRatio,
  ...props
}) => {
  const [isPlaceholderLoaded, setIsPlaceholderLoaded] = useState(false);
  const [isMainLoaded, setIsMainLoaded] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);

  // Generate tiny blurred placeholder URL
  const placeholderSrc = getOptimizedImageUrl(src, { width: 40, blur: 5, quality: 20 });
  
  // High-speed CDN WebP URL with fallback
  const mainSrc = mainImageError ? src : getOptimizedImageUrl(src, { width });

  useEffect(() => {
    setIsPlaceholderLoaded(false);
    setIsMainLoaded(false);
    setMainImageError(false);
  }, [src]);

  if (!src) return null;

  return (
    <div
      className={`skeleton-loader ${className || ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: style?.height || (aspectRatio ? 'auto' : '120px'),
        aspectRatio: aspectRatio || style?.aspectRatio || 'auto',
        backgroundColor: '#e2e8f0',
        ...style
      }}
    >
      {/* 1. The Blurry Placeholder Image */}
      {placeholderSrc && !isMainLoaded && (
        <img
          src={placeholderSrc}
          alt="loading placeholder"
          onLoad={() => setIsPlaceholderLoaded(true)}
          decoding="async"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: style?.objectFit || 'cover',
            filter: 'blur(8px)',
            transform: 'scale(1.08)',
            opacity: isPlaceholderLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      )}

      {/* 2. The Main High-Res WebP Image */}
      {mainSrc && (
        <img
          src={mainSrc}
          alt={alt || "Media"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setIsMainLoaded(true)}
          onError={() => {
            if (!mainImageError) {
              setMainImageError(true); // Fallback to raw Firebase Storage URL
            }
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: style?.objectFit || 'cover',
            opacity: isMainLoaded ? 1 : 0,
            transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 2,
            display: 'block'
          }}
          {...props}
        />
      )}
    </div>
  );
};

export default AsyncCachedImage;
