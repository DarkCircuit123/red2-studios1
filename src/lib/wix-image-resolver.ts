/**
 * WixImageResolver - Universal Wix Image URL Handler
 * 
 * CRITICAL: This is the SINGLE SHARED resolver for ALL image URLs in the app.
 * All image rendering (Image.tsx, portfolio, hero, splash, CMS, admin) routes through here.
 * 
 * Handles all Wix image URL formats and ensures compatibility:
 * - wix:image://v1/{mediaId}~{extension}/{filename}#{params} → https://static.wixstatic.com/media/{mediaId}~{extension}?params
 * - https://static.wixstatic.com/ URLs (Wix CDN format) - passed through
 * - Legacy base64 data URLs (converts to fallback)
 * - Blob URLs (temporary previews - converts to fallback)
 * 
 * CONVERSION RULES:
 * 1. Extract Wix media ID from wix:image:// URL (first segment before /)
 * 2. Convert to https://static.wixstatic.com/media/{mediaId}
 * 3. Preserve originWidth/originHeight as query parameters (not hash)
 * 4. Never use wix:image:// directly in DOM, CSS, or preload
 * 5. Validate final URL is HTTPS before rendering
 * 
 * This resolver is the single source of truth for image URL handling.
 * All image rendering should route through this utility.
 * 
 * DEBUG MODE:
 * - Production: Silently returns fallback for invalid URLs
 * - Development: console.warn with detailed context (component, record ID, URL type)
 */

export interface ResolvedImageUrl {
  /** The final URL to render (HTTPS only, never wix:image://) */
  url: string;
  /** Whether this is a valid Wix URL */
  isValid: boolean;
  /** The original format detected */
  format: 'wix-image' | 'static-wixstatic' | 'base64' | 'blob' | 'http' | 'unknown';
  /** Whether this is a fallback/placeholder */
  isFallback: boolean;
  /** Error message if resolution failed */
  error?: string;
}

const FALLBACK_IMAGE_URL = 'https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png';
const IS_DEVELOPMENT = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
const STATIC_MEDIA_URL = 'https://static.wixstatic.com/media/';

/**
 * Extract component name from stack trace for debug logging
 */
const getCallerComponent = (): string => {
  if (typeof Error === 'undefined') return 'unknown';
  const stack = new Error().stack || '';
  const lines = stack.split('\n');
  // Look for React component names in stack
  for (const line of lines) {
    if (line.includes('at ') && !line.includes('WixImageResolver')) {
      const match = line.match(/at\s+(\w+)/);
      if (match) return match[1];
    }
  }
  return 'unknown';
};

/**
 * Convert wix:image:// URLs to HTTPS static.wixstatic.com URLs
 * This is the CRITICAL conversion that prevents wix:image:// from reaching the browser
 */
function convertWixImageToHttps(url: string): string {
  const wixImagePrefix = 'wix:image://v1/';
  if (!url.startsWith(wixImagePrefix)) {
    return url; // Not a wix:image:// URL, return as-is
  }

  try {
    // Extract the URI and parameters from wix:image://v1/{uri}/{filename}#{params}
    const withoutPrefix = url.replace(wixImagePrefix, '');
    
    // Split on # to separate URI/filename from parameters
    const [uriPart, paramsString] = withoutPrefix.split('#');
    
    // Extract the media ID (first segment before /)
    // Format: {mediaId}~{extension}/{filename}
    const uriSegments = uriPart.split('/');
    const mediaId = uriSegments[0]; // e.g., "e9d727_dc338c865879444cab6ecb545a8e8d0b~mv2.png"
    
    // Validate media ID is not empty and looks like a valid Wix media ID
    if (!mediaId || mediaId.length === 0) {
      console.error('[WixImageResolver] Invalid wix:image:// URL - empty media ID:', url);
      return FALLBACK_IMAGE_URL;
    }
    
    // Parse origin dimensions if available
    const params = new URLSearchParams(paramsString || '');
    const originWidth = params.get('originWidth');
    const originHeight = params.get('originHeight');
    
    // Build HTTPS URL using Wix static CDN
    let httpsUrl = `${STATIC_MEDIA_URL}${mediaId}`;
    
    // Add origin dimensions as query parameters (not hash)
    if (originWidth && originHeight) {
      httpsUrl += `?originWidth=${originWidth}&originHeight=${originHeight}`;
    }
    
    // Validate the resulting URL is HTTPS
    if (!httpsUrl.startsWith('https://')) {
      console.error('[WixImageResolver] Conversion failed - URL is not HTTPS:', httpsUrl);
      return FALLBACK_IMAGE_URL;
    }
    
    return httpsUrl;
  } catch (error) {
    console.error('[WixImageResolver] Error converting wix:image:// URL:', url, error);
    return FALLBACK_IMAGE_URL;
  }
}

class WixImageResolver {
  /**
   * Resolve any image URL to a valid, renderable HTTPS format
   * CRITICAL: This converts wix:image:// to HTTPS before returning
   * This is the main entry point for all image rendering
   */
  static resolve(url: string | undefined | null, context?: { recordId?: string; fieldName?: string }): ResolvedImageUrl {
    // Handle empty/null URLs
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return {
        url: FALLBACK_IMAGE_URL,
        isValid: false,
        format: 'unknown',
        isFallback: true,
        error: 'Empty or null URL provided'
      };
    }

    const trimmedUrl = url.trim();

    // Check for wix:image://v1/ format (Wix Media Manager native)
    // CRITICAL: Convert to HTTPS immediately
    if (trimmedUrl.startsWith('wix:image://v1/')) {
      const httpsUrl = convertWixImageToHttps(trimmedUrl);
      // If conversion failed, httpsUrl will be FALLBACK_IMAGE_URL
      if (httpsUrl === FALLBACK_IMAGE_URL) {
        return {
          url: FALLBACK_IMAGE_URL,
          isValid: false,
          format: 'wix-image',
          isFallback: true,
          error: 'Failed to convert wix:image:// URL to HTTPS'
        };
      }
      return {
        url: httpsUrl,
        isValid: true,
        format: 'wix-image',
        isFallback: false
      };
    }

    // Check for static.wixstatic.com format (Wix CDN) - already HTTPS
    if (trimmedUrl.startsWith('https://static.wixstatic.com/')) {
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'static-wixstatic',
        isFallback: false
      };
    }

    // Check for http/https URLs (other CDNs or external)
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'http',
        isFallback: false
      };
    }

    // Check for base64 data URLs (NOT SUPPORTED - causes WDE0009)
    if (trimmedUrl.startsWith('data:image/') || trimmedUrl.startsWith('data:application/')) {
      if (IS_DEVELOPMENT) {
        const component = getCallerComponent();
        console.warn(
          `[WixImageResolver] Base64 image detected (development debug)\n` +
          `  Component: ${component}\n` +
          `  Record ID: ${context?.recordId || 'unknown'}\n` +
          `  Field: ${context?.fieldName || 'unknown'}\n` +
          `  URL Type: base64 data URL\n` +
          `  Action: Using fallback image\n` +
          `  Fix: Upload image to Wix Media Manager instead of storing base64`
        );
      }
      return {
        url: FALLBACK_IMAGE_URL,
        isValid: false,
        format: 'base64',
        isFallback: true,
        error: 'Base64 data URLs are not supported. Use Wix Media Manager URLs instead.'
      };
    }

    // Check for blob URLs (temporary previews - NOT SUPPORTED for storage)
    if (trimmedUrl.startsWith('blob:')) {
      if (IS_DEVELOPMENT) {
        const component = getCallerComponent();
        console.warn(
          `[WixImageResolver] Blob URL detected (development debug)\n` +
          `  Component: ${component}\n` +
          `  Record ID: ${context?.recordId || 'unknown'}\n` +
          `  Field: ${context?.fieldName || 'unknown'}\n` +
          `  URL Type: blob URL (temporary preview)\n` +
          `  Action: Using fallback image\n` +
          `  Fix: Upload image to Wix Media Manager before storing`
        );
      }
      return {
        url: FALLBACK_IMAGE_URL,
        isValid: false,
        format: 'blob',
        isFallback: true,
        error: 'Blob URLs are temporary and cannot be stored. Upload to Wix Media Manager instead.'
      };
    }

    // Unknown format
    if (IS_DEVELOPMENT) {
      const component = getCallerComponent();
      console.warn(
        `[WixImageResolver] Unknown URL format detected (development debug)\n` +
        `  Component: ${component}\n` +
        `  Record ID: ${context?.recordId || 'unknown'}\n` +
        `  Field: ${context?.fieldName || 'unknown'}\n` +
        `  URL Type: unknown\n` +
        `  URL Value: ${trimmedUrl.substring(0, 100)}${trimmedUrl.length > 100 ? '...' : ''}\n` +
        `  Action: Using fallback image`
      );
    }
    return {
      url: FALLBACK_IMAGE_URL,
      isValid: false,
      format: 'unknown',
      isFallback: true,
      error: `Unknown URL format: ${trimmedUrl.substring(0, 50)}...`
    };
  }

  /**
   * Check if a URL is a valid Wix media URL (can be stored in CMS)
   */
  static isValidWixMediaUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith('wix:image://v1/') ||
      trimmed.startsWith('https://static.wixstatic.com/')
    );
  }

  /**
   * Check if a URL is a data URL (base64 or blob)
   * These should NOT be stored in CMS
   */
  static isDataUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('data:') || trimmed.startsWith('blob:');
  }

  /**
   * Check if a URL is a temporary preview URL (blob)
   */
  static isBlobUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    return url.trim().startsWith('blob:');
  }

  /**
   * Check if a URL is a base64 data URL
   */
  static isBase64Url(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/');
  }

  /**
   * Get the format type of a URL
   */
  static getFormat(url: string | undefined | null): ResolvedImageUrl['format'] {
    if (!url || typeof url !== 'string') return 'unknown';
    const trimmed = url.trim();

    if (trimmed.startsWith('wix:image://v1/')) return 'wix-image';
    if (trimmed.startsWith('https://static.wixstatic.com/')) return 'static-wixstatic';
    if (trimmed.startsWith('data:')) return 'base64';
    if (trimmed.startsWith('blob:')) return 'blob';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'http';
    return 'unknown';
  }

  /**
   * Validate a URL for CMS storage
   * Returns error message if invalid, undefined if valid
   */
  static validateForCMSStorage(url: string | undefined | null): string | undefined {
    if (!url || typeof url !== 'string') {
      return 'URL is required';
    }

    const trimmed = url.trim();

    // Base64 URLs are NOT allowed in CMS
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/')) {
      return 'Base64 data URLs cannot be stored in CMS. Upload to Wix Media Manager first.';
    }

    // Blob URLs are NOT allowed in CMS
    if (trimmed.startsWith('blob:')) {
      return 'Blob URLs are temporary and cannot be stored in CMS. Upload to Wix Media Manager first.';
    }

    // Only Wix URLs or other HTTPS URLs are allowed
    if (!this.isValidWixMediaUrl(trimmed) && !trimmed.startsWith('https://')) {
      return 'Only Wix Media Manager URLs or HTTPS URLs are supported.';
    }

    return undefined;
  }

  /**
   * Get fallback URL
   */
  static getFallbackUrl(): string {
    return FALLBACK_IMAGE_URL;
  }

  /**
   * Batch resolve multiple URLs
   */
  static resolveBatch(urls: (string | undefined | null)[]): ResolvedImageUrl[] {
    return urls.map(url => this.resolve(url));
  }

  /**
   * Filter out invalid URLs from an array
   */
  static filterValidUrls(urls: (string | undefined | null)[]): string[] {
    return urls
      .map(url => this.resolve(url))
      .filter(resolved => resolved.isValid)
      .map(resolved => resolved.url);
  }

  /**
   * Debug helper - get detailed info about a URL
   */
  static debug(url: string | undefined | null): {
    original: string | undefined | null;
    resolved: ResolvedImageUrl;
    isStorable: boolean;
    storageError?: string;
  } {
    const resolved = this.resolve(url);
    const storageError = this.validateForCMSStorage(url);

    return {
      original: url,
      resolved,
      isStorable: !storageError,
      storageError
    };
  }
}

export default WixImageResolver;
