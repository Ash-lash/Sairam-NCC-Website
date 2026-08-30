import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageKitHelper';

/**
 * AsyncCachedImage Component
 * Uses ImageKit and progressive "blur-up" loading to load images seamlessly
 * just like Instagram or Amazon.
 */
const AsyncCachedImage = ({ src, alt, className, style, width = 800, ...props }) => {
  const [isPlaceholderLoaded, setIsPlaceholderLoaded] = useState(false);
  const [isMainLoaded, setIsMainLoaded] = useState(false);

  // Generate the tiny, heavily blurred placeholder URL
  const placeholderSrc = getOptimizedImageUrl(src, { width: 50, blur: 10, quality: 10 });
  // Generate the high-resolution, WebP optimized URL
  const mainSrc = getOptimizedImageUrl(src, { width });

  useEffect(() => {
    setIsPlaceholderLoaded(false);
    setIsMainLoaded(false);
  }, [src]);

  return (
    <div
      className={`skeleton-loader ${className || ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100px',
        backgroundColor: '#e0e0e0',
        animation: (!isPlaceholderLoaded && !isMainLoaded) ? 'pulse 1.5s infinite' : 'none',
        ...style
      }}
    >
      {/* 1. The Blurry Placeholder Image */}
      {placeholderSrc && (
        <img
          src={placeholderSrc}
          alt="blur placeholder"
          onLoad={() => setIsPlaceholderLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: style?.objectFit || 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)', // Prevent white edges from blur
            opacity: isMainLoaded ? 0 : (isPlaceholderLoaded ? 1 : 0),
            transition: 'opacity 0.5s ease-in-out',
            zIndex: 1,
          }}
          aria-hidden="true"
        />
      )}

      {/* 2. The Main High-Res Image */}
      {mainSrc && (
        <img
          src={mainSrc}
          alt={alt || "Media Image"}
          loading="lazy"
          onLoad={() => setIsMainLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: style?.objectFit || 'cover',
            opacity: isMainLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 2,
          }}
          {...props}
        />
      )}
      
      {/* 3. Static layout element to preserve aspect ratio if needed (fallback) */}
      <img
        src={placeholderSrc || mainSrc}
        alt={alt || "Layout"}
        style={{
          width: '100%',
          height: '100%',
          objectFit: style?.objectFit || 'cover',
          visibility: 'hidden',
          display: 'block'
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default AsyncCachedImage;
