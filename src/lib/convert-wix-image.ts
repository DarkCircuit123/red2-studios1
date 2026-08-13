/**
 * Convert wix:image:// URLs to HTTPS URLs for browser rendering
 * This resolves the CSP issue where browsers cannot load wix:image:// directly
 * 
 * Usage:
 *   const httpsUrl = convertWixImageToHttps(wixImageUrl);
 *   // Use httpsUrl in style, src, or backgroundImage
 */

// STATIC_MEDIA_URL is a constant that can be safely used in client components
const STATIC_MEDIA_URL = 'https://static.wixstatic.com/media/';

export const convertWixImageToHttps = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const wixImagePrefix = 'wix:image://v1/';
  if (url.startsWith(wixImagePrefix)) {
    // Extract the URI and parameters from wix:image://v1/{uri}/{filename}#{params}
    const withoutPrefix = url.replace(wixImagePrefix, '');
    const [uriPart, paramsString] = withoutPrefix.split('#');
    const uri = uriPart.split('/')[0];
    
    // Parse origin dimensions if available
    const params = new URLSearchParams(paramsString || '');
    const originWidth = params.get('originWidth');
    const originHeight = params.get('originHeight');
    
    // Build HTTPS URL using Wix static CDN
    let httpsUrl = `${STATIC_MEDIA_URL}${uri}`;
    
    // Add origin dimensions if available
    if (originWidth && originHeight) {
      httpsUrl += `?originWidth=${originWidth}&originHeight=${originHeight}`;
    }
    
    return httpsUrl;
  }
  
  // If already HTTPS or other format, return as-is
  return url;
};
