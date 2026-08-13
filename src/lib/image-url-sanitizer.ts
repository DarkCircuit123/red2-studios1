/**
 * Image URL Sanitizer
 * Validates, cleans, and replaces broken image URLs with valid placeholders
 */

const BROKEN_URL_PATTERNS = [
  'example.com', // Primary trigger for deletion
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
 * Extract file extension from URL, ignoring query parameters
 */
function getFileExtension(url: string): string {
  try {
    // Remove query parameters first
    const urlWithoutQuery = url.split('?')[0];
    const lastDot = urlWithoutQuery.lastIndexOf('.');
    if (lastDot === -1) return '';
    return urlWithoutQuery.substring(lastDot).toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Check if a URL is empty (null, undefined, or empty string)
 */
export function isEmpty(url: string | null | undefined): boolean {
  return !url || (typeof url === 'string' && url.trim().length === 0);
}

/**
 * Check if a URL is broken or a placeholder
 * NOTE: Empty URLs are NOT considered broken - they are simply unpopulated slots
 */
export function isBrokenUrl(url: string | null | undefined): boolean {
  // Empty fields are NOT broken - they are unpopulated slots
  if (isEmpty(url)) return false;
  
  if (typeof url !== 'string') return true;
  
  const lowerUrl = url.toLowerCase().trim();
  
  // Check for known broken patterns (example.com is the primary trigger)
  if (BROKEN_URL_PATTERNS.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }
  
  // Check if URL is too short (but not empty - that's handled above)
  if (lowerUrl.length < 10) return true;
  
  // Accept wix:image:// URLs (Wix Media Manager format - valid for CMS storage)
  if (url.startsWith('wix:image://v1/')) {
    return false;
  }
  
  // Check if it's a valid URL format (for http/https URLs)
  try {
    new URL(url);
    return false;
  } catch {
    return true;
  }
}

/**
 * Check if URL has a valid image extension (ignoring query parameters)
 */
export function hasValidImageExtension(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
  const extension = getFileExtension(url);
  
  return validExtensions.includes(extension);
}

/**
 * Sanitize a single image URL
 * Returns the URL if valid, null if broken
 * Allows external URLs for specific collections (e.g., storiesinsights)
 */
export function sanitizeImageUrl(url: string | null | undefined, collectionId?: string): string | null {
  if (!url) return null;
  
  if (isBrokenUrl(url)) {
    console.warn(`[ImageSanitizer] Broken URL detected and filtered: ${url}`);
    return null;
  }
  
  // Allow external URLs for storiesinsights collection (legitimate external news links)
  if (collectionId === 'storiesinsights') {
    return url;
  }
  
  // For other collections, validate Wix format or allow external URLs
  const isWixUrl = url.includes('wixstatic.com') || url.includes('wix:image://');
  const isExternalUrl = url.startsWith('http://') || url.startsWith('https://');
  
  if (isWixUrl || isExternalUrl) {
    return url;
  }
  
  return null;
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
 * Allows external URLs for specific collections
 */
export function sanitizeImageFields<T extends Record<string, any>>(
  obj: T,
  imageFields: (keyof T)[],
  collectionId?: string
): T {
  const sanitized = { ...obj };
  
  for (const field of imageFields) {
    const value = sanitized[field];
    if (value && typeof value === 'string') {
      if (isBrokenUrl(value)) {
        sanitized[field] = null as any;
        console.warn(`[ImageSanitizer] Sanitized field "${String(field)}": removed broken URL`);
      } else if (collectionId !== 'storiesinsights') {
        // For non-storiesinsights collections, validate URL format
        const sanitized_url = sanitizeImageUrl(value, collectionId);
        if (!sanitized_url) {
          sanitized[field] = null as any;
        }
      }
    }
  }
  
  return sanitized;
}

/**
 * Filter array of items, removing those with broken image URLs
 * NOTE: Empty image fields are NOT filtered out - they are valid unpopulated slots
 * Only items with actual broken/invalid URLs are filtered
 */
export function filterValidImages<T extends Record<string, any>>(
  items: T[],
  imageField: keyof T = 'imageUrl' as keyof T
): T[] {
  return items.filter(item => {
    const imageUrl = item[imageField];
    // Empty fields are valid (unpopulated slots) - keep them
    if (isEmpty(imageUrl)) return true;
    // Filter out only broken URLs
    return !isBrokenUrl(imageUrl);
  });
}

/**
 * Batch sanitize multiple items
 */
export function sanitizeBatch<T extends Record<string, any>>(
  items: T[],
  imageFields: (keyof T)[],
  collectionId?: string
): T[] {
  return items.map(item => sanitizeImageFields(item, imageFields, collectionId));
}

/**
 * Get sanitization report with distinction between empty slots and invalid images
 * Empty slots are unpopulated fields (intentional)
 * Invalid images are broken/corrupt URLs (errors)
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

/**
 * Get portfolio-specific diagnostic report
 * Distinguishes between empty slots and invalid images
 */
export function generatePortfolioDiagnosticReport(
  allItems: any[],
  validImages: any[],
  imageField: string = 'image'
): {
  totalSlots: number;
  validImages: number;
  emptySlots: number;
  invalidImages: number;
} {
  const emptySlots = allItems.filter(item => isEmpty(item[imageField])).length;
  const invalidImages = allItems.filter(item => {
    const url = item[imageField];
    return !isEmpty(url) && isBrokenUrl(url);
  }).length;
  
  return {
    totalSlots: allItems.length,
    validImages: validImages.length,
    emptySlots,
    invalidImages,
  };
}
