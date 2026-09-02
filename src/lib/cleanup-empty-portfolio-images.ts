/**
 * Cleanup script to remove empty portfolio image rows
 * 
 * This script identifies and deletes rows in the 'portfolioimages' collection
 * where the 'image' field is empty or missing.
 * 
 * These rows were created during failed uploads where the image URL was never
 * populated before the row was inserted.
 * 
 * Usage:
 * import { cleanupEmptyPortfolioImages } from '@/lib/cleanup-empty-portfolio-images';
 * await cleanupEmptyPortfolioImages();
 */

import { BaseCrudService } from '@/integrations';
import type { Portfolio } from '@/entities';

export async function cleanupEmptyPortfolioImages(): Promise<{
  success: boolean;
  deletedCount: number;
  deletedIds: string[];
  error?: string;
}> {
  try {
    console.log('[CLEANUP] Starting cleanup of empty portfolio images...');

    // Fetch all portfolio images
    const result = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );

    if (!result.items || result.items.length === 0) {
      console.log('[CLEANUP] No portfolio images found');
      return {
        success: true,
        deletedCount: 0,
        deletedIds: [],
      };
    }

    // Identify rows with empty or missing image field
    const emptyRows = result.items.filter(item => !item.image || item.image.trim() === '');

    console.log(`[CLEANUP] Found ${emptyRows.length} rows with empty image field out of ${result.items.length} total`);

    if (emptyRows.length === 0) {
      console.log('[CLEANUP] No empty rows to delete');
      return {
        success: true,
        deletedCount: 0,
        deletedIds: [],
      };
    }

    // Delete each empty row
    const deletedIds: string[] = [];
    for (const row of emptyRows) {
      try {
        await BaseCrudService.delete('portfolioimages', row._id);
        deletedIds.push(row._id);
        console.log(`[CLEANUP] Deleted row ${row._id} (displayOrder: ${row.displayOrder})`);
      } catch (deleteError) {
        console.error(`[CLEANUP] Failed to delete row ${row._id}:`, deleteError);
      }
    }

    console.log(`[CLEANUP] Cleanup complete. Deleted ${deletedIds.length} rows`);

    return {
      success: true,
      deletedCount: deletedIds.length,
      deletedIds,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[CLEANUP] Cleanup failed:', errorMsg);
    return {
      success: false,
      deletedCount: 0,
      deletedIds: [],
      error: errorMsg,
    };
  }
}
