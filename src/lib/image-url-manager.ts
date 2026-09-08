/**
 * CENTRALIZED IMAGE URL MANAGER
 *
 * Single source of truth for image URL handling across the application.
 * Browser rendering always receives a normal HTTP(S) URL.
 */

import { STATIC_MEDIA_URL } from '@wix/image-kit';

export interface ImageUrlResolution {
  url: string;
  isValid: boolean;
  format: 'wix-image' | 'static-wixstatic' | 'https' | 'base64' | 'blob' | 'unknown';
  isFallback: boolean;
  error?: string;
  originalUrl?: string;
}

const FALLBACK_IMAGE_URL = 'https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png';
const IS_DEVELOPMENT = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export class ImageUrlManager {
  /**
   * Resolve any supported image value to a browser-renderable URL.
   * wix:image:// URLs are converted to the Wix static CDN here rather than
   * being returned directly to <img src>, which avoids browser/CSP failures.
   */
  static resolve(url: string | undefined | null, context?: { recordId?: string; fieldName?: string }): ImageUrlResolution {
    const originalUrl = url;

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

    if (trimmedUrl.startsWith('wix:image://v1/')) {
      const resolvedUrl = this.convertWixToHttps(trimmedUrl);
      const conversionSucceeded = resolvedUrl.startsWith('https://');

      return {
        url: conversionSucceeded ? resolvedUrl : FALLBACK_IMAGE_URL,
        isValid: conversionSucceeded,
        format: 'wix-image',
        isFallback: !conversionSucceeded,
        error: conversionSucceeded ? undefined : 'Unable to convert Wix image URL',
        originalUrl,
      };
    }

    if (trimmedUrl.startsWith('https://static.wixstatic.com/')) {
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'static-wixstatic',
        isFallback: false,
        originalUrl,
      };
    }

    if (trimmedUrl.startsWith('https://')) {
      return {
        url: trimmedUrl,
        isValid: true,
        format: 'https',
        isFallback: false,
        originalUrl,
      };
    }

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

    if (trimmedUrl.startsWith('data:')) {
      if (IS_DEVELOPMENT) {
        console.warn('[ImageUrlManager] Base64 data URL detected; using fallback');
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

    if (trimmedUrl.startsWith('blob:')) {
      if (IS_DEVELOPMENT) {
        console.warn('[ImageUrlManager] Blob URL detected; using fallback');
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

  /** Convert wix:image://v1/{mediaId}/... to a Wix static CDN URL. */
  static convertWixToHttps(url: string): string {
    const prefix = 'wix:image://v1/';
    if (!url.startsWith(prefix)) return url;

    try {
      const withoutPrefix = url.slice(prefix.length);
      const [uriPart, paramsString] = withoutPrefix.split('#', 2);
      const uri = uriPart.split('/')[0];

      if (!uri) return FALLBACK_IMAGE_URL;

      const params = new URLSearchParams(paramsString || '');
      const originWidth = params.get('originWidth');
      const originHeight = params.get('originHeight');

      let httpsUrl = `${STATIC_MEDIA_URL}${uri}`;
      if (originWidth && originHeight) {
        httpsUrl += `?originWidth=${encodeURIComponent(originWidth)}&originHeight=${encodeURIComponent(originHeight)}`;
      }

      return httpsUrl;
    } catch (error) {
      if (IS_DEVELOPMENT) {
        console.warn('[ImageUrlManager] Failed to convert wix:image URL', error);
      }
      return FALLBACK_IMAGE_URL;
    }
  }

  static isValidFormat(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    const trimmedUrl = url.trim();
    return (
      trimmedUrl.startsWith('wix:image://v1/') ||
      trimmedUrl.startsWith('https://static.wixstatic.com/') ||
      trimmedUrl.startsWith('https://') ||
      trimmedUrl.startsWith('http://')
    );
  }

  static isWixImageUrl(url: string | undefined | null): boolean {
    return typeof url === 'string' && url.trim().startsWith('wix:image://v1/');
  }

  static isWixCdnUrl(url: string | undefined | null): boolean {
    return typeof url === 'string' && url.trim().startsWith('https://static.wixstatic.com/');
  }

  static isHttpsUrl(url: string | undefined | null): boolean {
    return typeof url === 'string' && url.trim().startsWith('https://');
  }

  static isFallback(url: string | undefined | null): boolean {
    return typeof url === 'string' && url.trim() === FALLBACK_IMAGE_URL;
  }

  static getFallbackUrl(): string {
    return FALLBACK_IMAGE_URL;
  }

  static normalize(url: string | undefined | null): string {
    if (!url || typeof url !== 'string') return '';
    return url.trim().split('?')[0].split('#')[0];
  }

  static isSameUrl(url1: string | undefined | null, url2: string | undefined | null): boolean {
    return this.normalize(url1) === this.normalize(url2);
  }
}

export default ImageUrlManager;
