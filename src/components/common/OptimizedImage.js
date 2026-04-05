import React, { memo, useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { prefetchAndCache } from '../../utils/mediaCache';

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  overflow: hidden;
  background-color: ${(props) => props.theme?.colors?.backgroundAlt || '#f3f4f6'};
  border-radius: ${(props) => props.$borderRadius || 'inherit'};
  aspect-ratio: ${(props) => props.$aspectRatio || 'auto'};
  
  /* Skeleton Loading Effect */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite linear;
    z-index: 1;
    opacity: ${(props) => (props.$isLoaded ? 0 : 1)};
    transition: opacity 0.5s ease;
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
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
  will-change: opacity;
`;

/**
 * OptimizedImage Component
 * 
 * Provides native lazy-loading with a beautiful skeleton shimmer effect.
 * Uses Asynchronous processes and Cache Memory for fast retrieval,
 * matching premium e-commerce experiences.
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
    loading = 'lazy', // Native lazy loading enabled by default
    fetchpriority = 'auto',
    ...rest
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [displayUrl, setDisplayUrl] = useState(src);

    useEffect(() => {
        let isMounted = true;
        
        const loadMediaAsync = async () => {
            // Using Asynchronous process logic for fast retrieval
            const url = await prefetchAndCache(src);
            if (isMounted) {
                setDisplayUrl(url);
            }
        };

        if (src) {
            loadMediaAsync();
        }

        return () => { isMounted = false; };
    }, [src]);

    if (!src) return null;

    const handleLoad = () => {
        setIsLoaded(true);
        if (onLoad) onLoad();
    };

    return (
        <ImageContainer
            style={style}
            className={className}
            $isLoaded={isLoaded}
            $borderRadius={style.borderRadius}
            $aspectRatio={aspectRatio}
        >
            <StyledImage
                src={displayUrl || src}
                alt={alt || "Image"}
                $isLoaded={isLoaded}
                $objectFit={objectFit}
                $objectPosition={objectPosition}
                onLoad={handleLoad}
                loading={loading}
                fetchpriority={fetchpriority}
                {...rest}
            />
        </ImageContainer>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;


