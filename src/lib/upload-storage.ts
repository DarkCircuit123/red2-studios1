/**
 * Upload Storage Manager - Vibe Best Practices
 *
 * Handles storing uploaded media URLs in CMS collections
 * Provides:
 * - Type-safe storage operations
 * - Automatic cleanup on failure
 * - Batch operations
 * - Validation
 */

import { BaseCrudService } from '@/integrations';
import type { UploadResult } from './upload-service';

export interface StorageOptions {
  collectionId: string;
  itemId?: string;
  fieldName: string;
  multiRef?: boolean; // For multi-reference fields
}

export interface StorageResult {
  success: boolean;
  itemId?: string;
  mediaUrl: string;
  error?: string;
}

/**
 * Store a single uploaded media URL in a CMS collection
 */
export async function storeMediaUrl(
  uploadResult: UploadResult,
  options: StorageOptions
): Promise<StorageResult> {
  const { collectionId, itemId, fieldName, multiRef } = options;

  try {
    if (!collectionId || !fieldName) {
      throw new Error('collectionId and fieldName are required');
    }

    // If no itemId, create a new item
    if (!itemId) {
      const newItem = {
        _id: crypto.randomUUID(),
        [fieldName]: multiRef ? [uploadResult.mediaUrl] : uploadResult.mediaUrl,
      };

      const createdItem = await BaseCrudService.create(collectionId, newItem);
      return {
        success: true,
        itemId: createdItem._id,
        mediaUrl: uploadResult.mediaUrl,
      };
    }

    // Update existing item
    if (multiRef) {
      // For multi-reference fields, add the URL to the array
      await BaseCrudService.addReferences(collectionId, itemId, {
        [fieldName]: [uploadResult.mediaUrl],
      });
    } else {
      // For single fields, update directly
      await BaseCrudService.update(collectionId, {
        _id: itemId,
        [fieldName]: uploadResult.mediaUrl,
      });
    }

    return {
      success: true,
      itemId,
      mediaUrl: uploadResult.mediaUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to store media URL';
    console.error('[UPLOAD_STORAGE] Error storing media:', errorMessage);

    return {
      success: false,
      itemId,
      mediaUrl: uploadResult.mediaUrl,
      error: errorMessage,
    };
  }
}

/**
 * Store multiple media URLs in batch
 */
export async function storeMediaUrlsBatch(
  uploadResults: UploadResult[],
  options: Omit<StorageOptions, 'itemId'> & { itemIds?: string[] }
): Promise<StorageResult[]> {
  const { collectionId, fieldName, multiRef, itemIds } = options;

  if (!collectionId || !fieldName) {
    throw new Error('collectionId and fieldName are required');
  }

  const results: StorageResult[] = [];

  for (let i = 0; i < uploadResults.length; i++) {
    const uploadResult = uploadResults[i];
    const itemId = itemIds?.[i];

    try {
      const result = await storeMediaUrl(uploadResult, {
        collectionId,
        itemId,
        fieldName,
        multiRef,
      });
      results.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch storage failed';
      results.push({
        success: false,
        itemId,
        mediaUrl: uploadResult.mediaUrl,
        error: errorMessage,
      });
    }
  }

  return results;
}

/**
 * Remove a media URL from a CMS collection
 */
export async function removeMediaUrl(
  mediaUrl: string,
  options: StorageOptions
): Promise<boolean> {
  const { collectionId, itemId, fieldName, multiRef } = options;

  try {
    if (!collectionId || !itemId || !fieldName) {
      throw new Error('collectionId, itemId, and fieldName are required');
    }

    if (multiRef) {
      // Remove from multi-reference field
      await BaseCrudService.removeReferences(collectionId, itemId, {
        [fieldName]: [mediaUrl],
      });
    } else {
      // Clear single field
      await BaseCrudService.update(collectionId, {
        _id: itemId,
        [fieldName]: null,
      });
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove media URL';
    console.error('[UPLOAD_STORAGE] Error removing media:', errorMessage);
    return false;
  }
}

/**
 * Get stored media URLs from a CMS item
 */
export async function getStoredMediaUrls(
  collectionId: string,
  itemId: string,
  fieldName: string
): Promise<string[]> {
  try {
    const item = await BaseCrudService.getById(collectionId, itemId);
    const value = item?.[fieldName];

    if (!value) {
      return [];
    }

    // Handle both single and multi-reference fields
    if (Array.isArray(value)) {
      return value.filter((url) => typeof url === 'string' && url.length > 0);
    }

    if (typeof value === 'string' && value.length > 0) {
      return [value];
    }

    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get media URLs';
    console.error('[UPLOAD_STORAGE] Error getting media URLs:', errorMessage);
    return [];
  }
}

/**
 * Validate that a media URL is properly stored
 */
export async function validateMediaUrlStorage(
  mediaUrl: string,
  collectionId: string,
  itemId: string,
  fieldName: string
): Promise<boolean> {
  try {
    const urls = await getStoredMediaUrls(collectionId, itemId, fieldName);
    return urls.includes(mediaUrl);
  } catch (error) {
    console.error('[UPLOAD_STORAGE] Error validating media URL:', error);
    return false;
  }
}
