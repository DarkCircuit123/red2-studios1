/**
 * Image Storage Validator - FINAL HARDENING PASS
 * 
 * This module provides a final guard to prevent base64 images from entering the CMS.
 * It validates that all image fields use proper Wix media URLs, not data URLs.
 * 
 * This is the last line of defense against WDE0009 "Document is too large" errors.
 */

/**
 * ACCEPTED URL FORMATS:
 * ✅ https://static.wixstatic.com/media/abc123.jpg
 * ✅ wix:image://v1/abc123_100_100/filename.jpg
 * 
 * REJECTED FORMATS:
 * ❌ data:image/jpeg;base64,/9j/...
 * ❌ blob:https://example.com/...
 * ❌ Any other data: URLs
 */

export interface ImageStorageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single image URL/value
 * Throws error if base64 data URL is detected
 * 
 * Accepts both Wix URL formats:
 * - https://static.wixstatic.com/media/...
 * - wix:image://v1/...
 * 
 * @param value - The image URL or value to validate
 * @param fieldName - The field name (for error messages)
 * @throws Error if value is a base64 data URL or other invalid format
 */
export function validateImageStorage(value: string | null | undefined, fieldName: string = 'image'): void {
  if (!value) {
    return; // null/undefined is OK
  }

  if (typeof value !== 'string') {
    throw new Error(`[ImageStorageValidator] ${fieldName} must be a string, got ${typeof value}`);
  }

  // CRITICAL: Block any base64 data URLs
  if (value.startsWith('data:image')) {
    throw new Error(
      `[ImageStorageValidator] Blocked: Base64 image storage is not allowed in ${fieldName}. ` +
      `Use Wix Media Manager URLs instead (wix:image://v1/... or https://static.wixstatic.com/media/...). ` +
      `This prevents WDE0009 "Document is too large" errors.`
    );
  }

  // Also block other data URL types that might slip through
  if (value.startsWith('data:')) {
    throw new Error(
      `[ImageStorageValidator] Blocked: Data URL storage is not allowed in ${fieldName}. ` +
      `Use Wix Media Manager URLs instead (wix:image://v1/... or https://static.wixstatic.com/media/...).`
    );
  }

  // Warn about blob URLs (should only be used for previews, not storage)
  if (value.startsWith('blob:')) {
    console.warn(
      `[ImageStorageValidator] Warning: Blob URL detected in ${fieldName}. ` +
      `Blob URLs are temporary and should only be used for previews, not CMS storage. ` +
      `Expected: https://static.wixstatic.com/media/... or wix:image://v1/...`
    );
  }

  // Validate that it's a proper Wix URL format
  const isValidWixUrl = value.startsWith('https://static.wixstatic.com/media/') || 
                        value.startsWith('wix:image://');
  
  if (!isValidWixUrl && !value.startsWith('http')) {
    throw new Error(
      `[ImageStorageValidator] Invalid URL format in ${fieldName}. ` +
      `Expected Wix Media Manager URL: https://static.wixstatic.com/media/... or wix:image://v1/... ` +
      `Got: ${value.substring(0, 50)}...`
    );
  }
}

/**
 * Validates all image fields in a Portfolio item
 * 
 * @param item - The Portfolio item to validate
 * @returns Validation result with any errors or warnings
 */
export function validatePortfolioImageStorage(item: {
  mainImage?: string | null;
  galleryImage1?: string | null;
  galleryImage2?: string | null;
  galleryImage3?: string | null;
}): ImageStorageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const imageFields = [
    { name: 'mainImage', value: item.mainImage },
    { name: 'galleryImage1', value: item.galleryImage1 },
    { name: 'galleryImage2', value: item.galleryImage2 },
    { name: 'galleryImage3', value: item.galleryImage3 },
  ];

  for (const field of imageFields) {
    try {
      validateImageStorage(field.value, field.name);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    // Check for blob URLs
    if (field.value?.startsWith('blob:')) {
      warnings.push(
        `${field.name} contains a blob URL. This should only be used for previews.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates CMS update payload before sending to BaseCrudService
 * This is the critical guard point
 * 
 * @param collectionId - The collection being updated
 * @param updateData - The data being saved to CMS
 * @throws Error if any image field contains base64 data
 */
export function validateCMSUpdatePayload(
  collectionId: string,
  updateData: Record<string, any>
): void {
  // Image field names by collection
  const imageFieldsByCollection: Record<string, string[]> = {
    portfolio: ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'],
    prints: ['mainImage'],
    services: ['infographic'],
    about: ['mainImage'],
    homepageimages: ['heroImage', 'aboutSectionImage', 'contactBackgroundImage'],
    clientgalleries: ['galleryCoverImage'],
    clientspress: ['clientLogo'],
    reels: ['thumbnail'],
    storiesinsights: ['featuredImage'],
    blogposts: ['thumbnailImage'],
    watermarksettings: ['watermarkImage'],
    teammembers: ['headshot'],
  };

  const imageFields = imageFieldsByCollection[collectionId] || [];

  for (const fieldName of imageFields) {
    if (fieldName in updateData) {
      try {
        validateImageStorage(updateData[fieldName], fieldName);
      } catch (error) {
        throw new Error(
          `[CMS Update Validation] ${collectionId}/${fieldName}: ` +
          (error instanceof Error ? error.message : String(error))
        );
      }
    }
  }
}

/**
 * Detects if a value is a base64 data URL
 * Useful for conditional logic
 * 
 * @param value - The value to check
 * @returns true if value is a base64 data URL
 */
export function isBase64DataUrl(value: any): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('data:image') || value.startsWith('data:');
}

/**
 * Detects if a value is a valid Wix media URL
 * 
 * Accepts both formats:
 * - https://static.wixstatic.com/media/...
 * - wix:image://v1/...
 * 
 * @param value - The value to check
 * @returns true if value is a Wix media URL
 */
export function isWixMediaUrl(value: any): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('wix:image://') || value.startsWith('https://static.wixstatic.com/media/');
}

/**
 * Sanitizes image URLs for CMS storage
 * Removes any base64 data and ensures proper URL format
 * 
 * @param value - The image URL to sanitize
 * @returns Sanitized URL or null if invalid
 * @throws Error if value is base64 (cannot be sanitized)
 */
export function sanitizeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  if (isBase64DataUrl(value)) {
    throw new Error(
      `Cannot sanitize base64 data URL. Use Wix Media Manager URLs instead.`
    );
  }

  // Trim whitespace
  const trimmed = value.trim();

  // Validate it's a proper URL
  if (!trimmed.startsWith('http') && !trimmed.startsWith('wix:') && !trimmed.startsWith('blob:')) {
    throw new Error(`Invalid image URL format: ${trimmed}`);
  }

  return trimmed;
}

export default {
  validateImageStorage,
  validatePortfolioImageStorage,
  validateCMSUpdatePayload,
  isBase64DataUrl,
  isWixMediaUrl,
  sanitizeImageUrl,
};
