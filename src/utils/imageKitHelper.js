export const getOptimizedImageUrl = (originalUrl, { width = 800, blur, quality = 80 } = {}) => {
  if (!originalUrl) return originalUrl;
  
  // Cache buster ensures service worker fetches a fresh copy
  const separator = originalUrl.includes('?') ? '&' : '?';
  const bustedUrl = `${originalUrl}${separator}_bust=${Date.now()}`;

  const params = new URLSearchParams({
    url: bustedUrl,
    w: String(width),
    q: String(quality),
    output: 'webp',
  });
  if (blur) params.append('blur', String(blur));
  
  return `https://wsrv.nl/?${params.toString()}`;
};
