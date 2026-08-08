/**
 * Image URL Validation and Sanitization Utility
 * Helps identify and filter out broken placeholder URLs
 */

/**
 * List of known placeholder/broken URL patterns to filter out
 */
const BROKEN_URL_PATTERNS = [
  'example.com',
  'placeholder',
  'mock',
  'test.com',
  'dummy',
  'fake',
];

/**
 * Check if a URL is a valid, non-placeholder image URL
 * @param url - The URL to validate
 * @returns true if the URL appears to be valid, false if it's a placeholder or broken
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check against known broken patterns
  const lowerUrl = url.toLowerCase();
  for (const pattern of BROKEN_URL_PATTERNS) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }

  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a fallback placeholder image URL
 * @returns A valid Wix CDN placeholder image URL
 */
export function getFallbackImageUrl(): string {
  return 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384';
}

/**
 * Sanitize an image URL, returning the URL if valid or a fallback if not
 * @param url - The URL to sanitize
 * @returns A valid image URL or fallback
 */
export function sanitizeImageUrl(url: string | undefined | null): string {
  if (isValidImageUrl(url)) {
    return url!;
  }
  return getFallbackImageUrl();
}

/**
 * Filter an array of items with imageUrl fields, removing broken URLs
 * @param items - Array of items with imageUrl property
 * @returns Filtered array with only valid image URLs
 */
export function filterValidImages<T extends { imageUrl?: string }>(items: T[]): T[] {
  return items.filter(item => isValidImageUrl(item.imageUrl));
}

/**
 * Log warning for broken image URLs
 * @param url - The broken URL
 * @param context - Optional context about where the URL was found
 */
export function logBrokenImageUrl(url: string, context?: string): void {
  const contextStr = context ? ` (${context})` : '';
  console.warn(`[Image URL Validator] Broken/placeholder image URL detected${contextStr}:`, url);
}
