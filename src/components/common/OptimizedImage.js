import React, { memo, useState, useEffect, useRef } from 'react';
import { getOptimizedUrl, getBlurUrl } from '../../utils/imageOptimizer';

// Check if proxy is enabled (it is ON by default unless 'off')
const IMAGE_PROXY_ENABLED = process.env.REACT_APP_IMAGE_PROXY !== 'off';

/**
 * 1. SIMPLE MODE COMPONENT
 * Renders a standard HTML <img> tag. Used when optimization is disabled.
 * Zero overhead, guaranteed visibility.
 */
const SimpleImage = memo(({
    src,
    width,
    quality,
    alt = '',
    style = {},
    className = '',
    onLoad,
    objectFit = 'cover',
    objectPosition = 'center',
    aspectRatio,
    ...rest
}) => {
    if (!src) return null;

    return (
        <img
            src={src}
            alt={alt}
            style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                objectPosition: objectPosition,
                ...style
            }}
            className={className}
            onLoad={onLoad}
            {...rest}
            loading="lazy"
        />
    );
});
SimpleImage.displayName = 'SimpleImage';

/**
 * 2. OPTIMIZED MODE COMPONENT
 * Renders with blur-up placeholder, intersection observer, and fade-in transition.
 * Only used if REACT_APP_IMAGE_PROXY=on.
 */
const ComplexImage = memo(({
    src,
    width = 800,
    quality = 80,
    alt = '',
    style = {},
    className = '',
    onLoad,
    objectFit = 'cover',
    objectPosition = 'center',
    aspectRatio,
    ...rest
}) => {
    const optimizedSrc = getOptimizedUrl(src, width, quality);
    const blurSrc = getBlurUrl(src);

    // Generate a simple srcset for basic responsive support
    const srcSet = [
        `${getOptimizedUrl(src, 300, quality)} 300w`,
        `${getOptimizedUrl(src, 600, quality)} 600w`,
        `${getOptimizedUrl(src, 1200, quality)} 1200w`,
    ].join(', ');

    const [loaded, setLoaded] = useState(false);
    const [proxyError, setProxyError] = useState(false);

    const containerStyle = {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        borderRadius: style.borderRadius || 'inherit',
        ...(aspectRatio ? { aspectRatio } : {}),
        ...style // Important: allow external styles to define primary container behavior
    };

    const handleLoad = () => {
        setLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        if (!proxyError) {
            setProxyError(true);
        }
    };

    return (
        <div style={containerStyle} className={className}>
            {/* Real Image */}
            <img
                src={proxyError ? src : optimizedSrc}
                srcSet={proxyError ? undefined : srcSet}
                sizes={proxyError ? undefined : (rest.sizes || `(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px`)}
                alt={alt}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit,
                    objectPosition,
                    position: 'relative',
                    zIndex: 2,
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onLoad={handleLoad}
                onError={handleError}
                {...rest}
                loading="lazy"
                fetchpriority="auto"
            />

            {/* Blur placeholder */}
            {!proxyError && blurSrc && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${blurSrc})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(10px)',
                    opacity: loaded ? 0 : 0.8,
                    transition: 'opacity 0.8s ease-in-out',
                    zIndex: 1
                }} />
            )}
        </div>
    );
});
ComplexImage.displayName = 'ComplexImage';

/**
 * EXPORT: Choose implementation based on config.
 */
const OptimizedImage = IMAGE_PROXY_ENABLED ? ComplexImage : SimpleImage;

export default OptimizedImage;
