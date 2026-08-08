/**
 * WixImageResolver - Universal Wix Image URL Handler
 * 
 * Handles all Wix image URL formats and ensures compatibility across the app:
 * - wix:image://v1/ URLs (Wix Media Manager native format)
 * - https://static.wixstatic.com/ URLs (Wix CDN format)
 * - Legacy base64 data URLs (converts to fallback)
 * - Blob URLs (temporary previews - converts to fallback)
 * 
 * This resolver is the single source of truth for image URL handling.
 * All image rendering should route through this utility.
 * 
 * DEBUG MODE:
 * - Production: Silently returns fallback for invalid URLs
 * - Development: console.warn with detailed context (component, record ID, URL type)
 */

export interface ResolvedImageUrl {
  /** The final URL to render */
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

class WixImageResolver {
  /**
   * Resolve any image URL to a valid, renderable format
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
    // Convert to static.wixstatic.com URL for CSP compliance
    if (trimmedUrl.startsWith('wix:image://v1/')) {
      try {
        // Extract the media ID and filename from wix:image://v1/{id}/{filename}#{params}
        const urlWithoutProtocol = trimmedUrl.replace('wix:image://v1/', '');
        const [pathPart, hashPart] = urlWithoutProtocol.split('#');
        const [mediaId, ...filenameParts] = pathPart.split('/');
        const filename = filenameParts.join('/');
        
        // Build static.wixstatic.com URL
        // Format: https://static.wixstatic.com/media/{mediaId}~mv2/{filename}#{params}
        let staticUrl = `https://static.wixstatic.com/media/${mediaId}~mv2/${filename}`;
        if (hashPart) {
          staticUrl += `#${hashPart}`;
        }
        
        return {
          url: staticUrl,
          isValid: true,
          format: 'static-wixstatic',
          isFallback: false
        };
      } catch (error) {
        // If conversion fails, return fallback
        if (IS_DEVELOPMENT) {
          console.warn(`[WixImageResolver] Failed to convert wix:image:// URL: ${trimmedUrl}`, error);
        }
        return {
          url: FALLBACK_IMAGE_URL,
          isValid: false,
          format: 'wix-image',
          isFallback: true,
          error: 'Failed to convert wix:image:// URL'
        };
      }
    }

    // Check for static.wixstatic.com format (Wix CDN)
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
