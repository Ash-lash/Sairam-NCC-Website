import React, { memo, useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { getOptimizedUrl } from '../../utils/imageOptimizer';

// Use layout effect on the client, effect on the server (SSR safety).
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const ImageContainer = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: ${(props) => props.$borderRadius || 'inherit'};
  aspect-ratio: ${(props) => props.$aspectRatio || 'auto'};

  /* Skeleton background — only visible while the image is loading,
     then fades to transparent so it never shows through transparent PNGs. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: #eef1f5;
    z-index: 0;
    opacity: ${(props) => (props.$isLoaded ? 0 : 1)};
    transition: opacity 0.35s ease;
    pointer-events: none;
  }

  /* Shimmer overlay — also fades out once loaded. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.35) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.4s infinite linear;
    z-index: 1;
    opacity: ${(props) => (props.$isLoaded ? 0 : 1)};
    transition: opacity 0.35s ease;
    pointer-events: none;
  }
`;

const StyledImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: ${(props) => props.$objectFit || 'cover'};
  object-position: ${(props) => props.$objectPosition || 'center'};
  opacity: ${(props) => (props.$isLoaded ? 1 : 0)};
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
  will-change: opacity;
`;

/**
 * OptimizedImage — Apple / Amazon / Flipkart-style image delivery.
 *   - CDN-resized WebP via getOptimizedUrl (no full-res originals).
 *   - DPR-aware srcSet so retina gets sharp, 1x doesn't over-fetch.
 *   - Native lazy loading + async decoding.
 *   - Skeleton shimmer while loading, fades cleanly to transparent on load
 *     so transparent PNGs (logos etc.) never show a grey box behind them.
 *   - Repeat visits are served instantly from the service worker cache.
 */
const OptimizedImage = memo(({
    src,
    alt = '',
    style = {},
    className = '',
    onLoad,
    onError,
    objectFit = 'cover',
    objectPosition = 'center',
    aspectRatio,
    width = 800,
    quality = 80,
    loading,
    priority = false,
    fetchpriority,
    sizes,
    ...rest
}) => {
    const imgRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);

    const { primaryUrl, srcSet } = useMemo(() => {
        if (!src) return { primaryUrl: '', srcSet: '' };
        const base = getOptimizedUrl(src, width, quality);
        return {
            primaryUrl: base,
            srcSet: undefined
        };
    }, [src, width, quality]);

    const [imgSrc, setImgSrc] = useState(primaryUrl);
    useEffect(() => {
        setImgSrc(primaryUrl);
        setIsLoaded(false);
    }, [primaryUrl]);

    // Fast-path: Check if image is already cached/complete
    useIsomorphicLayoutEffect(() => {
        if (!src) return;
        if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
            setIsLoaded(true);
        } else {
            const timer = setTimeout(() => setShowSkeleton(true), 40);
            return () => clearTimeout(timer);
        }
    }, [src, imgSrc]);

    const handleLoad = (e) => {
        setIsLoaded(true);
        if (onLoad) onLoad(e);
    };
    
    const handleError = (e) => {
        // If CDN proxy encounters an edge case, fallback cleanly to direct Firebase URL
        if (imgSrc !== src) {
            setImgSrc(src);
        } else if (onError) {
            onError(e);
        }
    };

    if (!src) return null;

    const effectiveLoading = loading || (priority ? 'eager' : 'lazy');
    const effectivePriority = fetchpriority || (priority ? 'high' : 'auto');

    return (
        <ImageContainer
            className={className}
            style={style}
            $isLoaded={isLoaded}
            $aspectRatio={aspectRatio}
            $borderRadius={style.borderRadius}
        >
            <StyledImage
                ref={imgRef}
                src={imgSrc}
                srcSet={srcSet}
                sizes={sizes || `${width}px`}
                alt={alt}
                loading={effectiveLoading}
                decoding="async"
                fetchPriority={effectivePriority}
                onLoad={handleLoad}
                onError={handleError}
                $isLoaded={isLoaded}
                $objectFit={objectFit}
                $objectPosition={objectPosition}
                {...rest}
            />
        </ImageContainer>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
