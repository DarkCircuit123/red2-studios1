/**
 * Image URL Sanitizer
 * Validates, cleans, and replaces broken image URLs with valid placeholders
 */

const BROKEN_URL_PATTERNS = [
  'example.com',
  'placeholder',
  'localhost',
  '127.0.0.1',
  'mock',
  'data:',
  'undefined',
  'null',
  'blob:',
];

const VALID_WIX_PLACEHOLDER = 'https://static.wixstatic.com/media/12d367_71ebdd7141d041e4be3d91d80d4578dd~mv2.png';

/**
 * Check if a URL is broken or a placeholder
 */
export function isBrokenUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  
  const lowerUrl = url.toLowerCase().trim();
  
  // Check for known broken patterns
  if (BROKEN_URL_PATTERNS.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }
  
  // Check if URL is empty or too short
  if (lowerUrl.length < 10) return true;
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    return false;
  } catch {
    return true;
  }
}

/**
 * Sanitize a single image URL
 * Returns the URL if valid, null if broken
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  if (isBrokenUrl(url)) {
    console.warn(`[ImageSanitizer] Broken URL detected and filtered: ${url}`);
    return null;
  }
  
  return url;
}

/**
 * Get a valid placeholder for broken images
 */
export function getImagePlaceholder(): string {
  return VALID_WIX_PLACEHOLDER;
}

/**
 * Sanitize an object with image fields
 * Replaces broken URLs with null
 */
export function sanitizeImageFields<T extends Record<string, any>>(
  obj: T,
  imageFields: (keyof T)[]
): T {
  const sanitized = { ...obj };
  
  for (const field of imageFields) {
    const value = sanitized[field];
    if (value && typeof value === 'string') {
      if (isBrokenUrl(value)) {
        sanitized[field] = null as any;
        console.warn(`[ImageSanitizer] Sanitized field "${String(field)}": removed broken URL`);
      }
    }
  }
  
  return sanitized;
}

/**
 * Filter array of items, removing those with broken image URLs
 */
export function filterValidImages<T extends Record<string, any>>(
  items: T[],
  imageField: keyof T = 'imageUrl' as keyof T
): T[] {
  return items.filter(item => {
    const imageUrl = item[imageField];
    if (!imageUrl || typeof imageUrl !== 'string') return false;
    return !isBrokenUrl(imageUrl);
  });
}

/**
 * Batch sanitize multiple items
 */
export function sanitizeBatch<T extends Record<string, any>>(
  items: T[],
  imageFields: (keyof T)[]
): T[] {
  return items.map(item => sanitizeImageFields(item, imageFields));
}

/**
 * Get sanitization report
 */
export function generateSanitizationReport(
  originalCount: number,
  sanitizedCount: number,
  brokenUrls: string[]
): {
  originalCount: number;
  sanitizedCount: number;
  removed: number;
  brokenUrls: string[];
  percentageRemoved: number;
} {
  return {
    originalCount,
    sanitizedCount,
    removed: originalCount - sanitizedCount,
    brokenUrls,
    percentageRemoved: originalCount > 0 ? ((originalCount - sanitizedCount) / originalCount) * 100 : 0,
  };
}
