/**
 * Canonical Image URL Resolver
 * Centralized, deterministic handling of all Wix image formats
 * Ensures consistency across admin and public galleries
 */

import { STATIC_MEDIA_URL } from '@wix/image-kit';

export interface ResolvedImage {
  canonical: string; // The resolved HTTPS URL
  format: 'wix-image' | 'https' | 'http' | 'unknown';
  isValid: boolean;
  originalUrl: string;
}

/**
 * Parse wix:image:// URLs to extract URI and parameters
 */
function parseWixImageUrl(url: string): { uri: string; params: URLSearchParams } | null {
  const wixImagePrefix = 'wix:image://v1/';
  
  if (!url.startsWith(wixImagePrefix)) {
    return null;
  }
  
  try {
    // Extract the URI and parameters from wix:image://v1/{uri}/{filename}#{params}
    const withoutPrefix = url.replace(wixImagePrefix, '');
    const [uriPart, paramsString] = withoutPrefix.split('#');
    
    // Extract URI (first part before /)
    const uri = uriPart.split('/')[0];
    
    if (!uri) {
      return null;
    }
    
    // Parse parameters
    const params = new URLSearchParams(paramsString || '');
    
    return { uri, params };
  } catch (error) {
    console.warn('Failed to parse wix:image URL:', url, error);
    return null;
  }
}

/**
 * Convert wix:image:// URL to HTTPS
 * CRITICAL: This is the canonical resolver used everywhere
 */
function convertWixImageToHttps(url: string): string {
  const parsed = parseWixImageUrl(url);
  
  if (!parsed) {
    return url; // Return as-is if not a wix:image URL
  }
  
  const { uri, params } = parsed;
  
  // Build HTTPS URL using Wix static CDN
  let httpsUrl = `${STATIC_MEDIA_URL}${uri}`;
  
  // Add origin dimensions if available (helps with image fitting)
  const originWidth = params.get('originWidth');
  const originHeight = params.get('originHeight');
  
  if (originWidth && originHeight) {
    httpsUrl += `?originWidth=${originWidth}&originHeight=${originHeight}`;
  }
  
  return httpsUrl;
}

/**
 * Resolve any image URL to canonical HTTPS format
 * CRITICAL: Single source of truth for all image URL handling
 */
export function resolveImageUrl(url: string | undefined): ResolvedImage {
  const originalUrl = url || '';
  
  // Handle empty/undefined
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      canonical: '',
      format: 'unknown',
      isValid: false,
      originalUrl,
    };
  }
  
  const trimmedUrl = url.trim();
  
  // Handle wix:image:// format
  if (trimmedUrl.startsWith('wix:image://')) {
    try {
      const canonical = convertWixImageToHttps(trimmedUrl);
      return {
        canonical,
        format: 'wix-image',
        isValid: canonical.length > 0,
        originalUrl: trimmedUrl,
      };
    } catch (error) {
      console.warn('Failed to convert wix:image URL:', trimmedUrl, error);
      return {
        canonical: '',
        format: 'wix-image',
        isValid: false,
        originalUrl: trimmedUrl,
      };
    }
  }
  
  // Handle HTTPS URLs
  if (trimmedUrl.startsWith('https://')) {
    return {
      canonical: trimmedUrl,
      format: 'https',
      isValid: true,
      originalUrl: trimmedUrl,
    };
  }
  
  // Handle HTTP URLs (legacy)
  if (trimmedUrl.startsWith('http://')) {
    return {
      canonical: trimmedUrl,
      format: 'http',
      isValid: true,
      originalUrl: trimmedUrl,
    };
  }
  
  // Unknown format
  return {
    canonical: '',
    format: 'unknown',
    isValid: false,
    originalUrl: trimmedUrl,
  };
}

/**
 * Batch resolve multiple image URLs
 */
export function resolveImageUrls(urls: (string | undefined)[]): ResolvedImage[] {
  return urls.map(url => resolveImageUrl(url));
}

/**
 * Check if an image URL is valid and resolvable
 */
export function isValidImageUrl(url: string | undefined): boolean {
  const resolved = resolveImageUrl(url);
  return resolved.isValid && resolved.canonical.length > 0;
}

/**
 * Get canonical URL for display (with fallback)
 */
export function getCanonicalImageUrl(url: string | undefined, fallback = ''): string {
  const resolved = resolveImageUrl(url);
  return resolved.canonical || fallback;
}

/**
 * Validate and sanitize image URL for storage
 * Returns the original URL if valid, empty string if invalid
 */
export function sanitizeImageUrl(url: string | undefined): string {
  if (!url) return '';
  
  const resolved = resolveImageUrl(url);
  
  // For storage, we prefer wix:image:// format if available
  if (resolved.format === 'wix-image' && resolved.isValid) {
    return resolved.originalUrl;
  }
  
  // Otherwise use the canonical HTTPS URL
  if (resolved.isValid) {
    return resolved.canonical;
  }
  
  // Invalid URL
  return '';
}

/**
 * Compare two image URLs for equality
 * Handles different formats of the same image
 */
export function imageUrlsEqual(url1: string | undefined, url2: string | undefined): boolean {
  const resolved1 = resolveImageUrl(url1);
  const resolved2 = resolveImageUrl(url2);
  
  // Both invalid
  if (!resolved1.isValid && !resolved2.isValid) {
    return true;
  }
  
  // One valid, one invalid
  if (resolved1.isValid !== resolved2.isValid) {
    return false;
  }
  
  // Both valid - compare canonical URLs
  return resolved1.canonical === resolved2.canonical;
}

/**
 * Extract image dimensions from URL if available
 */
export function getImageDimensions(url: string | undefined): { width?: number; height?: number } | null {
  if (!url) return null;
  
  const parsed = parseWixImageUrl(url);
  if (!parsed) return null;
  
  const { params } = parsed;
  const width = params.get('originWidth');
  const height = params.get('originHeight');
  
  if (!width || !height) return null;
  
  return {
    width: parseInt(width, 10),
    height: parseInt(height, 10),
  };
}

/**
 * Calculate aspect ratio from image URL
 */
export function getImageAspectRatio(url: string | undefined): number | null {
  const dimensions = getImageDimensions(url);
  if (!dimensions || !dimensions.width || !dimensions.height) return null;
  
  return dimensions.width / dimensions.height;
}

/**
 * Batch validate image URLs
 */
export function validateImageUrls(urls: (string | undefined)[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const url of urls) {
    if (isValidImageUrl(url)) {
      valid.push(url || '');
    } else {
      invalid.push(url || '');
    }
  }
  
  return { valid, invalid };
}

/**
 * Generate image URL report for diagnostics
 */
export function generateImageUrlReport(urls: (string | undefined)[]): {
  total: number;
  valid: number;
  invalid: number;
  byFormat: Record<string, number>;
  details: ResolvedImage[];
} {
  const details = resolveImageUrls(urls);
  const byFormat: Record<string, number> = {};
  
  for (const resolved of details) {
    byFormat[resolved.format] = (byFormat[resolved.format] || 0) + 1;
  }
  
  return {
    total: urls.length,
    valid: details.filter(r => r.isValid).length,
    invalid: details.filter(r => !r.isValid).length,
    byFormat,
    details,
  };
}
