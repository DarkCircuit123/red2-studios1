/**
 * Shared admin helper functions for consistent logic across panels
 */

/**
 * Get active homepage images with unified selection logic
 * - Limit to 100 items
 * - Filter for isActive: true
 * - Sort by _createdDate descending (newest first)
 */
export async function getActiveHomepageImagesHelper() {
  const { BaseCrudService } = await import('@/integrations');
  const { HomepageImages } = await import('@/entities');
  
  const result = await BaseCrudService.getAll<HomepageImages>(
    'homepageimages',
    {},
    { limit: 100 }
  );

  const active = (result.items || [])
    .filter(item => item.isActive === true)
    .sort((a, b) => {
      const dateA = new Date(a._createdDate || 0).getTime();
      const dateB = new Date(b._createdDate || 0).getTime();
      return dateB - dateA; // Newest first
    });

  return active.length > 0 ? active[0] : null;
}

/**
 * Compute dynamic slot count for work gallery
 * - Minimum 90 slots
 * - Expand based on highest displayOrder
 * - Add 12 more slots beyond current count
 */
export function computeSlotCount(items: any[]): number {
  if (!items || items.length === 0) {
    return 90;
  }

  const highestDisplayOrder = Math.max(
    ...items.map(item => item.displayOrder || 0)
  );
  const filledCount = items.length;
  
  // max(90, highestDisplayOrder, filledCount + 12)
  return Math.max(90, highestDisplayOrder, filledCount + 12);
}

/**
 * Validate hex color
 */
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Convert hex to RGB for contrast calculation
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance for WCAG contrast
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(x => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard (4.5:1)
 */
export function meetsWCAGAA(hex1: string, hex2: string): boolean {
  return getContrastRatio(hex1, hex2) >= 4.5;
}
