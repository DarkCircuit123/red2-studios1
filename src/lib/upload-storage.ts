/**
 * Upload Storage - CMS Integration
 *
 * Handles storing and removing media URLs in CMS collections
 * Provides type-safe operations for media management
 */

import { UploadResult } from './upload-service';

export interface StorageOptions {
  collectionId: string;
  itemId: string;
  fieldName: string;
}

export interface StorageResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Store a media URL in a CMS collection
 */
export async function storeMediaUrl(
  result: UploadResult,
  options: StorageOptions
): Promise<StorageResult> {
  try {
    const { collectionId, itemId, fieldName } = options;

    // Validate inputs
    if (!collectionId || !itemId || !fieldName) {
      return {
        success: false,
        error: 'Missing required storage options: collectionId, itemId, or fieldName',
      };
    }

    if (!result.mediaUrl) {
      return {
        success: false,
        error: 'No media URL to store',
      };
    }

    // Call the CMS update endpoint
    const response = await fetch('/api/cms/mutate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        collectionId,
        itemId,
        data: {
          [fieldName]: result.mediaUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to store media URL: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error storing media URL';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Remove a media URL from a CMS collection
 */
export async function removeMediaUrl(
  mediaUrl: string,
  options: StorageOptions
): Promise<boolean> {
  try {
    const { collectionId, itemId, fieldName } = options;

    // Validate inputs
    if (!collectionId || !itemId || !fieldName) {
      console.error('Missing required storage options for removal');
      return false;
    }

    if (!mediaUrl) {
      return false;
    }

    // Call the CMS update endpoint to clear the field
    const response = await fetch('/api/cms/mutate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        collectionId,
        itemId,
        data: {
          [fieldName]: null,
        },
      }),
    });

    return response.ok;
  } catch (err) {
    console.error('Error removing media URL:', err);
    return false;
  }
}

/**
 * Get a media URL from a CMS collection
 */
export async function getMediaUrl(
  options: StorageOptions
): Promise<string | null> {
  try {
    const { collectionId, itemId, fieldName } = options;

    // Validate inputs
    if (!collectionId || !itemId || !fieldName) {
      return null;
    }

    // Call the CMS get endpoint
    const response = await fetch(
      `/api/cms/get-item?collectionId=${collectionId}&itemId=${itemId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data[fieldName] || null;
  } catch (err) {
    console.error('Error getting media URL:', err);
    return null;
  }
}
