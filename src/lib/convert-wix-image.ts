/**
 * Convert wix:image:// URLs to HTTPS URLs for browser rendering
 * This resolves the CSP issue where browsers cannot load wix:image:// directly
 * CRITICAL: Preserves originWidth/originHeight metadata
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
    try {
      // Extract the URI and parameters from wix:image://v1/{uri}/{filename}#{params}
      const withoutPrefix = url.replace(wixImagePrefix, '');
      const [uriPart, paramsString] = withoutPrefix.split('#');
      
      // Extract URI (first segment before /)
      const uriSegments = uriPart.split('/');
      const uri = uriSegments[0];
      
      // Validate URI is not empty
      if (!uri || uri.length === 0) {
        console.error('[convertWixImageToHttps] Invalid wix:image:// URL - empty URI:', url);
        return null;
      }
      
      // Parse origin dimensions if available (preserve metadata)
      const params = new URLSearchParams(paramsString || '');
      const originWidth = params.get('originWidth');
      const originHeight = params.get('originHeight');
      
      // Build HTTPS URL using Wix static CDN
      let httpsUrl = `${STATIC_MEDIA_URL}${uri}`;
      
      // Add origin dimensions if available
      if (originWidth && originHeight) {
        httpsUrl += `?originWidth=${originWidth}&originHeight=${originHeight}`;
      }
      
      // Validate the resulting URL is HTTPS
      if (!httpsUrl.startsWith('https://')) {
        console.error('[convertWixImageToHttps] Conversion failed - URL is not HTTPS:', httpsUrl);
        return null;
      }
      
      return httpsUrl;
    } catch (error) {
      console.error('[convertWixImageToHttps] Error converting wix:image:// URL:', url, error);
      return null;
    }
  }
  
  // If already HTTPS or other format, return as-is
  return url;
};
