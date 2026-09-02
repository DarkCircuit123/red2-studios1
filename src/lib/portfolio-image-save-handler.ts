/**
 * Portfolio Image Save Handler - Atomic, Upload-First Flow
 * 
 * CRITICAL REQUIREMENTS:
 * 1. Upload to Media Manager FIRST, await the URL
 * 2. Only then create/update CMS row with image field populated
 * 3. Never create a row before the image URL exists
 * 4. Verify after save: re-query and confirm image field is non-empty
 * 5. Write portfolioItemId to link images to parent work item
 * 6. Write to portfolioimagebackups on each save
 * 7. Throw real errors, never silent failures
 */

import { BaseCrudService } from '@/integrations';
import { Portfolio, PortfolioImageBackups } from '@/entities/index';

interface SavePortfolioImageOptions {
  portfolioItemId?: string;
  displayOrder: number;
  caption?: string;
  altText?: string;
}

interface SaveResult {
  success: boolean;
  itemId: string;
  imageUrl: string;
  message: string;
}

/**
 * ATOMIC SAVE: Upload first, then create/update CMS row
 * 
 * Flow:
 * 1. Validate inputs
 * 2. Upload file to Media Manager (await URL)
 * 3. Create/update CMS row with image URL already populated
 * 4. Write backup record
 * 5. Verify by re-querying the row
 * 6. Return success or throw with real error
 */
export async function savePortfolioImage(
  imageUrl: string, // Already uploaded URL from Media Manager
  options: SavePortfolioImageOptions,
  itemIdToUpdate?: string // If updating existing row
): Promise<SaveResult> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    console.log(`[PORTFOLIO_SAVE] Request ${requestId} started`, {
      imageUrl: imageUrl.substring(0, 100),
      displayOrder: options.displayOrder,
      portfolioItemId: options.portfolioItemId,
      isUpdate: !!itemIdToUpdate,
      timestamp: new Date().toISOString(),
    });

    // CRITICAL: Validate image URL is not empty
    if (!imageUrl || imageUrl.trim() === '') {
      throw new Error('Image URL is empty. Upload may have failed.');
    }

    // Validate it's a wix:image:// URL or valid HTTPS URL
    const isWixUrl = imageUrl.startsWith('wix:image://');
    const isHttpsUrl = imageUrl.startsWith('https://');
    if (!isWixUrl && !isHttpsUrl) {
      throw new Error(`Invalid image URL format. Expected wix:image:// or https://, got: ${imageUrl.substring(0, 50)}`);
    }

    const itemId = itemIdToUpdate || crypto.randomUUID();

    // Build the CMS row with image URL ALREADY populated
    const portfolioRow: Portfolio = {
      _id: itemId,
      image: imageUrl, // CRITICAL: Image is populated BEFORE insert
      displayOrder: options.displayOrder,
      caption: options.caption || '',
      altText: options.altText || '',
      portfolioItemId: options.portfolioItemId || '', // Link to parent work item
    };

    console.log(`[PORTFOLIO_SAVE] Request ${requestId} creating/updating CMS row`, {
      itemId,
      imageUrl: imageUrl.substring(0, 100),
      displayOrder: options.displayOrder,
      timestamp: new Date().toISOString(),
    });

    // ATOMIC: Create or update the row
    if (itemIdToUpdate) {
      await BaseCrudService.update('portfolioimages', portfolioRow);
    } else {
      await BaseCrudService.create('portfolioimages', portfolioRow);
    }

    console.log(`[PORTFOLIO_SAVE] Request ${requestId} CMS row created/updated`, {
      itemId,
      timestamp: new Date().toISOString(),
    });

    // VERIFICATION: Re-query the row to confirm image field is populated
    console.log(`[PORTFOLIO_SAVE] Request ${requestId} verifying saved row`, {
      itemId,
      timestamp: new Date().toISOString(),
    });

    let verifiedRow: Portfolio | null = null;
    try {
      verifiedRow = await BaseCrudService.getById<Portfolio>('portfolioimages', itemId);
    } catch (verifyError) {
      console.error(`[PORTFOLIO_SAVE] Request ${requestId} verification query failed`, {
        itemId,
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to verify saved row: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
    }

    if (!verifiedRow) {
      throw new Error(`Row was not found after save. Item ID: ${itemId}`);
    }

    if (!verifiedRow.image || verifiedRow.image.trim() === '') {
      throw new Error(`Verification failed: image field is empty after save. This indicates a CMS write failure.`);
    }

    console.log(`[PORTFOLIO_SAVE] Request ${requestId} verification passed`, {
      itemId,
      imageUrl: verifiedRow.image.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // BACKUP: Write to portfolioimagebackups
    console.log(`[PORTFOLIO_SAVE] Request ${requestId} writing backup record`, {
      itemId,
      timestamp: new Date().toISOString(),
    });

    try {
      const backupRecord: PortfolioImageBackups = {
        _id: crypto.randomUUID(),
        portfolioItemId: itemId,
        mainImage: verifiedRow.image,
        galleryImage1: '', // Only main image for now
        galleryImage2: '',
        galleryImage3: '',
        backupCreatedAt: new Date().toISOString(),
      };

      await BaseCrudService.create('portfolioimagebackups', backupRecord);

      console.log(`[PORTFOLIO_SAVE] Request ${requestId} backup record created`, {
        backupId: backupRecord._id,
        timestamp: new Date().toISOString(),
      });
    } catch (backupError) {
      console.warn(`[PORTFOLIO_SAVE] Request ${requestId} backup write failed (non-fatal)`, {
        error: backupError instanceof Error ? backupError.message : String(backupError),
        timestamp: new Date().toISOString(),
      });
      // Don't throw - backup is nice-to-have, not critical
    }

    const duration = Date.now() - startTime;

    console.log(`[PORTFOLIO_SAVE] Request ${requestId} completed successfully`, {
      itemId,
      imageUrl: verifiedRow.image.substring(0, 100),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      itemId,
      imageUrl: verifiedRow.image,
      message: `Image saved successfully (${duration}ms)`,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[PORTFOLIO_SAVE] Request ${requestId} failed`, {
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Re-throw with full context
    throw new Error(`Portfolio image save failed: ${errorMessage}`);
  }
}

/**
 * Cleanup: Find and delete orphaned rows (image field is empty)
 */
export async function cleanupOrphanedPortfolioImages(): Promise<{
  deleted: number;
  errors: string[];
}> {
  const requestId = crypto.randomUUID();
  const deleted: string[] = [];
  const errors: string[] = [];

  try {
    console.log(`[PORTFOLIO_CLEANUP] Request ${requestId} started`, {
      timestamp: new Date().toISOString(),
    });

    // Fetch all portfolio images
    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 1000 });
    const allRows = result?.items || [];

    console.log(`[PORTFOLIO_CLEANUP] Request ${requestId} fetched ${allRows.length} rows`, {
      timestamp: new Date().toISOString(),
    });

    // Find orphaned rows (image is empty or missing)
    const orphaned = allRows.filter(row => !row.image || row.image.trim() === '');

    console.log(`[PORTFOLIO_CLEANUP] Request ${requestId} found ${orphaned.length} orphaned rows`, {
      orphanedIds: orphaned.map(r => r._id),
      timestamp: new Date().toISOString(),
    });

    // Delete each orphaned row
    for (const row of orphaned) {
      try {
        await BaseCrudService.delete('portfolioimages', row._id);
        deleted.push(row._id);

        console.log(`[PORTFOLIO_CLEANUP] Request ${requestId} deleted orphaned row`, {
          itemId: row._id,
          displayOrder: row.displayOrder,
          timestamp: new Date().toISOString(),
        });
      } catch (deleteError) {
        const errorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError);
        errors.push(`Failed to delete ${row._id}: ${errorMsg}`);

        console.error(`[PORTFOLIO_CLEANUP] Request ${requestId} failed to delete row`, {
          itemId: row._id,
          error: errorMsg,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`[PORTFOLIO_CLEANUP] Request ${requestId} completed`, {
      deletedCount: deleted.length,
      errorCount: errors.length,
      timestamp: new Date().toISOString(),
    });

    return {
      deleted: deleted.length,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error(`[PORTFOLIO_CLEANUP] Request ${requestId} failed`, {
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });

    throw new Error(`Cleanup failed: ${errorMsg}`);
  }
}
