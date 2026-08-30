export const getOptimizedImageUrl = (originalUrl, { width = 800 } = {}) => {
  if (!originalUrl || !originalUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return originalUrl;
  }
  
  try {
    const urlObj = new URL(originalUrl);
    // Path usually looks like: /v0/b/bucket-name.appspot.com/o/folder%2Fimage.jpg
    
    // Split the pathname to find where the object path starts (after '/o/')
    const oIndex = urlObj.pathname.indexOf('/o/');
    if (oIndex === -1) return originalUrl;
    
    // Everything after '/o/' is the URL-encoded object path
    const objectPathStr = urlObj.pathname.substring(oIndex + 3);
    const pathParts = objectPathStr.split('%2F');
    const lastPart = pathParts.pop();
    
    const dotIndex = lastPart.lastIndexOf('.');
    if (dotIndex === -1) return originalUrl;
    
    const name = lastPart.substring(0, dotIndex);
    const size = width <= 400 ? '400x400' : '800x800';
    const newLastPart = `${name}_${size}.webp`;
    
    pathParts.push(newLastPart);
    
    // The extension puts the images in a "thumbnails" folder at the root
    // So we prepend 'thumbnails' to the object path
    const newObjectPathStr = 'thumbnails%2F' + pathParts.join('%2F');
    
    // Reconstruct the full pathname
    urlObj.pathname = urlObj.pathname.substring(0, oIndex + 3) + newObjectPathStr;
    
    urlObj.searchParams.delete('token');
    if (!urlObj.searchParams.has('alt')) {
      urlObj.searchParams.set('alt', 'media');
    }
    
    return urlObj.toString();
  } catch (e) {
    return originalUrl;
  }
};
