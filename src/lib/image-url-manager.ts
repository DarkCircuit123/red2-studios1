/**
 * CENTRALIZED IMAGE URL MANAGER
 * 
 * Single source of truth for all image URL handling across the application.
 * Replaces scattered implementations of URL conversion and validation.
 * 
 * Handles:
 * - wix:image://v1/ format (Wix Media Manager native)
 * - https://static.wixstatic.com/ format (Wix CDN)
 * - Legacy base64 data URLs (converts to fallback)
 * - Blob URLs (temporary previews - converts to fallback)
 * - HTTP/HTTPS URLs (validates and passes through)
 * 
 * All image rendering should route through this manager.
 */

import { STATIC_MEDIA_URL } from '@wix/image-kit';

export interface ImageUrlResolution {
  /** The final URL to render */
  url: string;
  /** Whether this is a valid Wix URL */
  isValid: boolean;
  /** The original format detected */
  format: 'wix-image' | 'static-wixstatic' | 'https' | 'base64' | 'blob' | 'unknown';
  /** Whether this is a fallback/placeholder */
  isFallback: boolean;
  /** Error message if resolution failed */
  error?: string;
  /** Original URL that was resolved */
  originalUrl?: string;
}

const FALLBACK_IMAGE_URL = 'https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png';
const IS_DEVELOPMENT = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

/**
 * ImageUrlManager - Centralized URL handling
 * 
 * Usage:
 * ```typescript
 * const resolved = ImageUrlManager.resolve(imageUrl);
 * if (resolved.isValid) {
 *   <img src={resolved.url} alt="..." />
 * } else {
 *   console.warn(`Image failed to resolve: ${resolved.error}`);
 * }
 * ```
 */
export class ImageUrlManager {
  /**
   * Resolve any image URL to a valid, renderable format
   * This is the main entry point for all image rendering
   */
  static resolve(url: string | undefined | null, context?: { recordId?: string; fieldName?: string }): ImageUrlResolution {
    const originalUrl = url;

    // Handle empty/null URLs
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return {
        url: FALLBACK_IMAGE_URL,
        isValid: false,
        format: 'unknown',
        isFallback: true,
        error: 'Empty or null URL provided',
        originalUrl,
      };
    }

    const trimmedUrl = url.trim();

    // Check for wix:image://v1/ format (Wix Media Manager native)
    if (trimmedUrl.startsWith('wix:image://v1/')) {
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'wix-image',
        isFallback: false,
        originalUrl,
      };
    }

    // Check for static.wixstatic.com format (Wix CDN)
    if (trimmedUrl.startsWith('https://static.wixstatic.com/')) {
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'static-wixstatic',
        isFallback: false,
        originalUrl,
      };
    }

    // Check for HTTPS URLs (pass through)
    if (trimmedUrl.startsWith('https://')) {
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'https',
        isFallback: false,
        originalUrl,
      };
    }

    // Check for HTTP URLs (pass through but warn)
    if (trimmedUrl.startsWith('http://')) {
      if (IS_DEVELOPMENT) {
        console.warn(`[ImageUrlManager] HTTP URL detected (should be HTTPS): ${trimmedUrl.substring(0, 100)}`);
      }
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'https',
        isFallback: false,
        originalUrl,
      };
    }

    // Check for base64 data URLs (legacy - convert to fallback)
    if (trimmedUrl.startsWith('data:')) {
      if (IS_DEVELOPMENT) {
        console.warn(`[ImageUrlManager] Base64 data URL detected (legacy format): ${trimmedUrl.substring(0, 50)}...`);
      }
      return {
        url: FALLBACK_IMAGE_URL,
        isValid: false,
        format: 'base64',
        isFallback: true,
        error: 'Base64 data URLs are not supported; using fallback',
        originalUrl,
      };
    }

    // Check for blob URLs (temporary previews - convert to fallback)
    if (trimmedUrl.startsWith('blob:')) {
      if (IS_DEVELOPMENT) {
        console.warn(`[ImageUrlManager] Blob URL detected (temporary preview): ${trimmedUrl.substring(0, 50)}...`);
      }
      return {
        url: FALLBACK_IMAGE_URL,
        isValid: false,
        format: 'blob',
        isFallback: true,
        error: 'Blob URLs are temporary; using fallback',
        originalUrl,
      };
    }

    // Unknown format
    if (IS_DEVELOPMENT) {
      console.warn(`[ImageUrlManager] Unknown URL format: ${trimmedUrl.substring(0, 100)}`);
    }
    return {
      url: FALLBACK_IMAGE_URL,
      isValid: false,
      format: 'unknown',
      isFallback: true,
      error: `Unknown URL format: ${trimmedUrl.substring(0, 50)}...`,
      originalUrl,
    };
  }

  /**
   * Convert wix:image://v1/ URLs to HTTPS URLs for browser rendering
   * This resolves the CSP issue where browsers cannot load wix:image:// directly
   * 
   * Usage:
   * ```typescript
   * const httpsUrl = ImageUrlManager.convertWixToHttps(wixImageUrl);
   * ```
   */
  static convertWixToHttps(url: string): string {
    const wixImagePrefix = 'wix:image://v1/';
    if (!url.startsWith(wixImagePrefix)) {
      return url; // Not a wix:image URL, return as-is
    }

    try {
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
    } catch (error) {
      if (IS_DEVELOPMENT) {
        console.warn(`[ImageUrlManager] Failed to convert wix:image URL: ${url}`, error);
      }
      return url; // Return original on error
    }
  }

  /**
   * Validate that a URL is in a supported format
   * Returns true if URL can be rendered
   */
  static isValidFormat(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return false;
    }

    const trimmedUrl = url.trim();
    return (
      trimmedUrl.startsWith('wix:image://v1/') ||
      trimmedUrl.startsWith('https://static.wixstatic.com/') ||
      trimmedUrl.startsWith('https://') ||
      trimmedUrl.startsWith('http://')
    );
  }

  /**
   * Check if URL is a Wix Media Manager URL (wix:image://)
   */
  static isWixImageUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    return url.trim().startsWith('wix:image://v1/');
  }

  /**
   * Check if URL is a Wix CDN URL (static.wixstatic.com)
   */
  static isWixCdnUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    return url.trim().startsWith('https://static.wixstatic.com/');
  }

  /**
   * Check if URL is an HTTPS URL
   */
  static isHttpsUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    return url.trim().startsWith('https://');
  }

  /**
   * Check if URL is a fallback/placeholder
   */
  static isFallback(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    return url.trim() === FALLBACK_IMAGE_URL;
  }

  /**
   * Get the fallback image URL
   */
  static getFallbackUrl(): string {
    return FALLBACK_IMAGE_URL;
  }

  /**
   * Normalize URL for comparison (removes trailing slashes, query params, etc.)
   */
  static normalize(url: string | undefined | null): string {
    if (!url || typeof url !== 'string') return '';
    return url.trim().split('?')[0].split('#')[0];
  }

  /**
   * Check if two URLs refer to the same image (after normalization)
   */
  static isSameUrl(url1: string | undefined | null, url2: string | undefined | null): boolean {
    return this.normalize(url1) === this.normalize(url2);
  }
}

export default ImageUrlManager;
