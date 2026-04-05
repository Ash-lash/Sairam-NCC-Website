import React, { useState, useEffect } from 'react';
import { prefetchAndCache } from '../../utils/mediaCache';

/**
 * AsyncCachedImage Component
 * Uses asynchronous processes to load an image, storing it in cache memory.
 * For React applications, JavaScript natively handles these async processes.
 * This guarantees fast retrieval similar to big e-commerce platforms.
 */
const AsyncCachedImage = ({ src, alt, className, style, ...props }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadMediaAsync = async () => {
      setLoading(true);
      const url = await prefetchAndCache(src);
      if (isMounted) {
        setObjectUrl(url);
        setLoading(false);
      }
    };

    if (src) {
      loadMediaAsync();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (loading) {
    return (
      <div 
        className={`skeleton-loader ${className || ''}`} 
        style={{ 
          minHeight: '100px', 
          backgroundColor: '#e0e0e0', 
          animation: 'pulse 1.5s infinite', 
          ...style 
        }} 
      />
    );
  }

  return (
    <img 
      src={objectUrl || src} 
      alt={alt || "Media Image"} 
      className={className} 
      style={style} 
      loading="lazy" 
      {...props} 
    />
  );
};

export default AsyncCachedImage;
