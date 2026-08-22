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
    objectFit = 'cover',
    objectPosition = 'center',
    aspectRatio,
    width = 800,
    quality = 80,
    loading = 'lazy',
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
        // By removing retina and hiDpi srcSet, we reduce concurrent requests to wsrv.nl by 66%
        // which prevents rate-limiting and massive slowdowns.
        return {
            primaryUrl: base,
            srcSet: '',
        };
    }, [src, width, quality]);

    // If the image is already decoded in cache (common for local imports and
    // repeat views), mark it loaded BEFORE the browser paints so the skeleton
    // fill never flashes behind transparent PNGs / SVG logos.
    useIsomorphicLayoutEffect(() => {
        const node = imgRef.current;
        if (node && node.complete && node.naturalWidth > 0) {
            setIsLoaded(true);
        }
    }, [primaryUrl]);

    // Delay showing the skeleton by 120ms — fast loads never paint it at all,
    // matching how Apple / Amazon avoid skeleton flicker on cached assets.
    useEffect(() => {
        if (isLoaded) { setShowSkeleton(false); return; }
        const t = setTimeout(() => setShowSkeleton(true), 120);
        return () => clearTimeout(t);
    }, [isLoaded, primaryUrl]);

    if (!src) return null;

    const handleLoad = () => {
        setIsLoaded(true);
        if (onLoad) onLoad();
    };

    return (
        <ImageContainer
            style={style}
            className={className}
            $isLoaded={isLoaded || !showSkeleton}
            $borderRadius={style.borderRadius}
            $aspectRatio={aspectRatio}
        >
            <StyledImage
                ref={imgRef}
                src={primaryUrl || src}
                srcSet={srcSet || undefined}
                sizes={sizes}
                alt={alt || 'Image'}
                $isLoaded={isLoaded}
                $objectFit={objectFit}
                $objectPosition={objectPosition}
                onLoad={handleLoad}
                onError={handleLoad}
                loading={loading}
                decoding="async"
                fetchpriority={fetchpriority}
                {...rest}
            />
        </ImageContainer>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
