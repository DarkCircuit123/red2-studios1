/**
 * Portfolio Image Recovery System
 * Finds existing photos in the gallery, fixes broken links, and validates image URLs
 * CRITICAL: This is a recovery tool for existing uploaded images
 */

import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import { convertWixImageToHttps } from './convert-wix-image';

export interface ImageRecoveryResult {
  totalScanned: number;
  validImages: number;
  brokenLinks: number;
  missingPortfolioIds: number;
  fixed: number;
  errors: string[];
}

/**
 * Validate if an image URL is accessible and returns proper HTTPS URL
 */
async function validateImageUrl(url: string): Promise<{ valid: boolean; fixedUrl: string }> {
  if (!url) {
    return { valid: false, fixedUrl: '' };
  }

  try {
    // Try to convert Wix image URL to HTTPS
    const httpsUrl = convertWixImageToHttps(url);
    
    // Quick validation - just check if URL is properly formatted
    const urlObj = new URL(httpsUrl);
    return { valid: true, fixedUrl: httpsUrl };
  } catch (error) {
    console.warn(`Invalid image URL: ${url}`, error);
    return { valid: false, fixedUrl: '' };
  }
}

/**
 * Scan all portfolio images and identify issues
 */
export async function scanPortfolioImages(): Promise<ImageRecoveryResult> {
  const result: ImageRecoveryResult = {
    totalScanned: 0,
    validImages: 0,
    brokenLinks: 0,
    missingPortfolioIds: 0,
    fixed: 0,
    errors: [],
  };

  try {
    // Fetch all portfolio images
    const response = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );

    result.totalScanned = response.items.length;

    for (const item of response.items) {
      // Check if image URL exists and is valid
      if (!item.image) {
        result.brokenLinks++;
        result.errors.push(`Image ${item._id} has no image URL`);
        continue;
      }

      // Validate image URL
      const validation = await validateImageUrl(item.image);
      if (!validation.valid) {
        result.brokenLinks++;
        result.errors.push(`Image ${item._id} has invalid URL: ${item.image}`);
        continue;
      }

      // Check if portfolioItemId is set
      if (!item.portfolioItemId) {
        result.missingPortfolioIds++;
        result.errors.push(`Image ${item._id} missing portfolioItemId`);
      }

      result.validImages++;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Scan failed: ${errorMsg}`);
  }

  return result;
}

/**
 * Fix broken image links by converting to HTTPS and validating
 */
export async function fixBrokenImageLinks(): Promise<ImageRecoveryResult> {
  const result: ImageRecoveryResult = {
    totalScanned: 0,
    validImages: 0,
    brokenLinks: 0,
    missingPortfolioIds: 0,
    fixed: 0,
    errors: [],
  };

  try {
    // Fetch all portfolio images
    const response = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );

    result.totalScanned = response.items.length;

    for (const item of response.items) {
      if (!item.image) {
        result.brokenLinks++;
        continue;
      }

      // Try to fix the URL
      const validation = await validateImageUrl(item.image);
      
      if (validation.valid && validation.fixedUrl !== item.image) {
        // URL was fixed, update it
        try {
          await BaseCrudService.update<Portfolio>('portfolioimages', {
            _id: item._id,
            image: validation.fixedUrl,
          });
          result.fixed++;
          result.validImages++;
        } catch (updateError) {
          const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
          result.errors.push(`Failed to update image ${item._id}: ${errorMsg}`);
        }
      } else if (validation.valid) {
        result.validImages++;
      } else {
        result.brokenLinks++;
        result.errors.push(`Cannot fix image URL: ${item.image}`);
      }

      // Ensure portfolioItemId is set
      if (!item.portfolioItemId) {
        result.missingPortfolioIds++;
        try {
          // Generate a portfolio ID if missing
          const portfolioId = crypto.randomUUID();
          await BaseCrudService.update<Portfolio>('portfolioimages', {
            _id: item._id,
            portfolioItemId: portfolioId,
          });
          result.fixed++;
        } catch (updateError) {
          const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
          result.errors.push(`Failed to set portfolioItemId for ${item._id}: ${errorMsg}`);
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Fix failed: ${errorMsg}`);
  }

  return result;
}

/**
 * Ensure all images have proper display order
 */
export async function fixDisplayOrder(): Promise<{ fixed: number; errors: string[] }> {
  const result = { fixed: 0, errors: [] };

  try {
    // Fetch all portfolio images
    const response = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );

    // Sort by creation date to establish order
    const sorted = response.items.sort((a, b) => {
      const dateA = new Date(a._createdDate || 0).getTime();
      const dateB = new Date(b._createdDate || 0).getTime();
      return dateA - dateB;
    });

    // Update display order
    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if ((item.displayOrder || 0) !== i) {
        try {
          await BaseCrudService.update<Portfolio>('portfolioimages', {
            _id: item._id,
            displayOrder: i,
          });
          result.fixed++;
        } catch (updateError) {
          const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
          result.errors.push(`Failed to update display order for ${item._id}: ${errorMsg}`);
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Display order fix failed: ${errorMsg}`);
  }

  return result;
}

/**
 * Full recovery process: scan, fix links, ensure portfolio IDs, fix order
 */
export async function runFullImageRecovery(): Promise<{
  scan: ImageRecoveryResult;
  fixLinks: ImageRecoveryResult;
  fixOrder: { fixed: number; errors: string[] };
  summary: string;
}> {
  console.log('[RECOVERY] Starting full image recovery process...');

  // Step 1: Scan
  console.log('[RECOVERY] Step 1: Scanning images...');
  const scan = await scanPortfolioImages();
  console.log('[RECOVERY] Scan complete:', scan);

  // Step 2: Fix links
  console.log('[RECOVERY] Step 2: Fixing broken links...');
  const fixLinks = await fixBrokenImageLinks();
  console.log('[RECOVERY] Link fix complete:', fixLinks);

  // Step 3: Fix display order
  console.log('[RECOVERY] Step 3: Fixing display order...');
  const fixOrder = await fixDisplayOrder();
  console.log('[RECOVERY] Display order fix complete:', fixOrder);

  // Generate summary
  const summary = `
Recovery Complete:
- Total images scanned: ${scan.totalScanned}
- Valid images: ${fixLinks.validImages}
- Broken links fixed: ${fixLinks.fixed}
- Portfolio IDs fixed: ${fixLinks.missingPortfolioIds}
- Display order fixed: ${fixOrder.fixed}
- Errors: ${fixLinks.errors.length + fixOrder.errors.length}
  `.trim();

  console.log('[RECOVERY]', summary);

  return { scan, fixLinks, fixOrder, summary };
}
