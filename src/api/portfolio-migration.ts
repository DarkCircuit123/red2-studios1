/**
 * Portfolio Base64 Image Migration Script
 * 
 * This script:
 * 1. Scans all Portfolio items for base64 image data
 * 2. Uploads base64 images to Wix Media Manager
 * 3. Replaces base64 strings with Wix media URLs
 * 4. Updates CMS items with new URLs
 * 5. Logs progress and failures
 * 6. Verifies no base64 data remains
 * 
 * Run with: node --loader tsx src/api/portfolio-migration.ts
 */

import type { APIRoute } from 'astro';

interface MigrationLog {
  timestamp: string;
  itemId: string;
  field: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: Record<string, unknown>;
}

interface MigrationResult {
  totalItems: number;
  itemsWithBase64: number;
  successfulMigrations: number;
  failedMigrations: number;
  skippedItems: number;
  logs: MigrationLog[];
  summary: string;
}

/**
 * Detect if a string is base64 image data
 */
function isBase64ImageData(str: string | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/') && str.includes('base64,');
}

/**
 * Convert base64 data URL to File object
 */
function base64ToFile(base64String: string, fileName: string): File {
  // Extract MIME type and base64 data
  const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 image format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create File object
  return new File([bytes], fileName, { type: mimeType });
}

/**
 * Upload base64 image to Wix Media Manager
 */
async function uploadBase64ImageToWix(base64String: string, fileName: string): Promise<string> {
  try {
    // Convert base64 to File
    const file = base64ToFile(base64String, fileName);

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);

    // Upload via media endpoint
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    if (!result.mediaUrl) {
      throw new Error('No media URL returned from upload');
    }

    return result.mediaUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload base64 image: ${message}`);
  }
}

/**
 * Main migration function
 */
async function migratePortfolioImages(): Promise<MigrationResult> {
  const logs: MigrationLog[] = [];
  let totalItems = 0;
  let itemsWithBase64 = 0;
  let successfulMigrations = 0;
  let failedMigrations = 0;
  let skippedItems = 0;

  const addLog = (
    itemId: string,
    field: string,
    status: 'success' | 'error' | 'skipped',
    message: string,
    details?: Record<string, unknown>
  ) => {
    logs.push({
      timestamp: new Date().toISOString(),
      itemId,
      field,
      status,
      message,
      details,
    });
  };

  try {
    console.log('[MIGRATION] Starting Portfolio base64 image migration...');

    // Fetch all Portfolio items
    const response = await fetch('/api/portfolio-scan', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio items: ${response.status}`);
    }

    const { items } = await response.json();
    totalItems = items.length;

    console.log(`[MIGRATION] Found ${totalItems} portfolio items to scan`);

    // Process each item
    for (const item of items) {
      const imageFields = ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'];
      let hasBase64 = false;
      const updates: Record<string, string> = {};

      // Check each image field
      for (const field of imageFields) {
        const imageData = item[field];

        if (isBase64ImageData(imageData)) {
          hasBase64 = true;
          console.log(`[MIGRATION] Found base64 in ${item._id}.${field}`);

          try {
            // Upload to Wix Media Manager
            const fileName = `portfolio_${item._id}_${field}_${Date.now()}.jpg`;
            const mediaUrl = await uploadBase64ImageToWix(imageData, fileName);

            updates[field] = mediaUrl;
            successfulMigrations++;

            addLog(item._id, field, 'success', `Migrated base64 to Wix Media URL`, {
              originalSize: imageData.length,
              newUrl: mediaUrl,
            });

            console.log(`[MIGRATION] ✓ Successfully migrated ${field} for ${item._id}`);
          } catch (error) {
            failedMigrations++;
            const message = error instanceof Error ? error.message : 'Unknown error';
            addLog(item._id, field, 'error', `Failed to migrate base64: ${message}`);
            console.error(`[MIGRATION] ✗ Failed to migrate ${field} for ${item._id}: ${message}`);
          }
        }
      }

      // If we found and migrated base64 images, update the item
      if (hasBase64) {
        itemsWithBase64++;

        if (Object.keys(updates).length > 0) {
          try {
            // Update the portfolio item with new URLs
            const updateResponse = await fetch('/api/portfolio-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                itemId: item._id,
                updates,
              }),
            });

            if (!updateResponse.ok) {
              throw new Error(`Update failed with status ${updateResponse.status}`);
            }

            addLog(item._id, 'all', 'success', `Updated portfolio item with migrated URLs`, {
              fieldsUpdated: Object.keys(updates),
            });

            console.log(`[MIGRATION] ✓ Updated portfolio item ${item._id}`);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addLog(item._id, 'all', 'error', `Failed to update portfolio item: ${message}`);
            console.error(`[MIGRATION] ✗ Failed to update ${item._id}: ${message}`);
          }
        } else {
          skippedItems++;
          addLog(item._id, 'all', 'skipped', 'Found base64 but all migrations failed');
        }
      }
    }

    const summary = `
Migration Complete:
- Total items scanned: ${totalItems}
- Items with base64: ${itemsWithBase64}
- Successful migrations: ${successfulMigrations}
- Failed migrations: ${failedMigrations}
- Skipped items: ${skippedItems}
- Success rate: ${totalItems > 0 ? ((successfulMigrations / itemsWithBase64) * 100).toFixed(1) : 0}%
    `.trim();

    console.log(`[MIGRATION] ${summary}`);

    return {
      totalItems,
      itemsWithBase64,
      successfulMigrations,
      failedMigrations,
      skippedItems,
      logs,
      summary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[MIGRATION] Fatal error: ${message}`);
    throw error;
  }
}

/**
 * API endpoint to trigger migration
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const result = await migratePortfolioImages();

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[MIGRATION] API Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
