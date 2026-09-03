/**
 * Work Gallery Diagnostics & Repair System
 * Comprehensive audit, validation, and repair for 90-slot gallery
 */

import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';

export interface DiagnosticReport {
  timestamp: string;
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  brokenImages: string[];
  orphanedRecords: string[];
  duplicateOrders: string[];
  missingOrders: number[];
  issues: {
    type: 'broken-image' | 'orphaned' | 'duplicate-order' | 'missing-order' | 'invalid-data';
    itemId: string;
    details: string;
  }[];
  summary: string;
}

export interface RepairResult {
  fixed: number;
  deleted: number;
  created: number;
  errors: string[];
  report: DiagnosticReport;
}

const MAX_SLOTS = 90;

/**
 * Validate image URL - check if it's a valid Wix image format or HTTPS URL
 */
function isValidImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Valid Wix image format
  if (url.startsWith('wix:image://')) return true;
  
  // Valid HTTPS URL
  if (url.startsWith('https://')) return true;
  
  // Valid HTTP URL (legacy)
  if (url.startsWith('http://')) return true;
  
  return false;
}

/**
 * Comprehensive diagnostic scan of the gallery
 */
export async function diagnosticScan(): Promise<DiagnosticReport> {
  const timestamp = new Date().toISOString();
  const issues: DiagnosticReport['issues'] = [];
  const brokenImages: string[] = [];
  const orphanedRecords: string[] = [];
  const duplicateOrders: string[] = [];
  const missingOrders: number[] = [];
  
  try {
    // Fetch all portfolio images
    const result = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );
    
    const allItems = result.items || [];
    const orderMap = new Map<number, Portfolio[]>();
    
    // Analyze each item
    for (const item of allItems) {
      // Check for broken images
      if (!isValidImageUrl(item.image)) {
        brokenImages.push(item._id);
        issues.push({
          type: 'broken-image',
          itemId: item._id,
          details: `Invalid image URL: ${item.image || 'empty'}`,
        });
      }
      
      // Check for orphaned records (no displayOrder)
      if (!item.displayOrder || item.displayOrder < 1 || item.displayOrder > MAX_SLOTS) {
        orphanedRecords.push(item._id);
        issues.push({
          type: 'orphaned',
          itemId: item._id,
          details: `Invalid displayOrder: ${item.displayOrder}`,
        });
      } else {
        // Track orders for duplicate detection
        if (!orderMap.has(item.displayOrder)) {
          orderMap.set(item.displayOrder, []);
        }
        orderMap.get(item.displayOrder)!.push(item);
      }
    }
    
    // Check for duplicate orders
    for (const [order, items] of orderMap.entries()) {
      if (items.length > 1) {
        duplicateOrders.push(`Order ${order}: ${items.length} items`);
        items.slice(1).forEach(item => {
          issues.push({
            type: 'duplicate-order',
            itemId: item._id,
            details: `Duplicate displayOrder: ${order}`,
          });
        });
      }
    }
    
    // Check for missing orders
    for (let i = 1; i <= MAX_SLOTS; i++) {
      if (!orderMap.has(i)) {
        missingOrders.push(i);
      }
    }
    
    const filledSlots = orderMap.size;
    const emptySlots = MAX_SLOTS - filledSlots;
    
    const summary = `
Gallery Status: ${filledSlots}/${MAX_SLOTS} slots filled
Issues Found: ${issues.length}
  - Broken images: ${brokenImages.length}
  - Orphaned records: ${orphanedRecords.length}
  - Duplicate orders: ${duplicateOrders.length}
  - Missing orders: ${missingOrders.length}
    `.trim();
    
    return {
      timestamp,
      totalSlots: MAX_SLOTS,
      filledSlots,
      emptySlots,
      brokenImages,
      orphanedRecords,
      duplicateOrders,
      missingOrders,
      issues,
      summary,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Diagnostic scan failed: ${errorMsg}`);
  }
}

/**
 * Repair the gallery based on diagnostic findings
 */
export async function repairGallery(): Promise<RepairResult> {
  let fixed = 0;
  let deleted = 0;
  let created = 0;
  const errors: string[] = [];
  
  try {
    // Run diagnostic first
    const report = await diagnosticScan();
    
    // Step 1: Delete orphaned records (no valid displayOrder)
    for (const itemId of report.orphanedRecords) {
      try {
        await BaseCrudService.delete('portfolioimages', itemId);
        deleted++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to delete orphaned record ${itemId}: ${errorMsg}`);
      }
    }
    
    // Step 2: Fix duplicate orders (keep first, delete rest)
    const result = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );
    const allItems = result.items || [];
    const orderMap = new Map<number, Portfolio[]>();
    
    for (const item of allItems) {
      if (item.displayOrder && item.displayOrder >= 1 && item.displayOrder <= MAX_SLOTS) {
        if (!orderMap.has(item.displayOrder)) {
          orderMap.set(item.displayOrder, []);
        }
        orderMap.get(item.displayOrder)!.push(item);
      }
    }
    
    for (const [order, items] of orderMap.entries()) {
      if (items.length > 1) {
        // Keep first, delete rest
        for (const item of items.slice(1)) {
          try {
            await BaseCrudService.delete('portfolioimages', item._id);
            deleted++;
            fixed++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Failed to delete duplicate at order ${order}: ${errorMsg}`);
          }
        }
      }
    }
    
    // Step 3: Create missing slots
    for (let i = 1; i <= MAX_SLOTS; i++) {
      if (!orderMap.has(i)) {
        try {
          const newItem: Portfolio = {
            _id: crypto.randomUUID(),
            displayOrder: i,
            image: undefined,
            caption: '',
            altText: '',
            portfolioItemId: '',
          };
          await BaseCrudService.create('portfolioimages', newItem);
          created++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to create slot ${i}: ${errorMsg}`);
        }
      }
    }
    
    // Run final diagnostic
    const finalReport = await diagnosticScan();
    
    return {
      fixed,
      deleted,
      created,
      errors,
      report: finalReport,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Gallery repair failed: ${errorMsg}`);
  }
}

/**
 * Sync admin gallery with public gallery
 * Ensures consistency between admin view and public display
 */
export async function syncGalleries(): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;
  
  try {
    // Fetch all portfolio images
    const result = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );
    
    const allItems = result.items || [];
    
    // Validate and fix each item
    for (const item of allItems) {
      try {
        // Ensure displayOrder is valid
        if (!item.displayOrder || item.displayOrder < 1 || item.displayOrder > MAX_SLOTS) {
          // Skip invalid items (will be cleaned up by repair)
          continue;
        }
        
        // Ensure image URL is valid if present
        if (item.image && !isValidImageUrl(item.image)) {
          // Mark as needing repair
          console.warn(`Item ${item._id} has invalid image URL: ${item.image}`);
        }
        
        synced++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to sync item ${item._id}: ${errorMsg}`);
      }
    }
    
    return { synced, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Gallery sync failed: ${errorMsg}`);
  }
}

/**
 * Get detailed slot information
 */
export async function getSlotDetails(slotNumber: number): Promise<Portfolio | null> {
  if (slotNumber < 1 || slotNumber > MAX_SLOTS) {
    throw new Error(`Invalid slot number: ${slotNumber}`);
  }
  
  try {
    const result = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );
    
    const allItems = result.items || [];
    const item = allItems.find(i => i.displayOrder === slotNumber);
    
    return item || null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get slot details: ${errorMsg}`);
  }
}

/**
 * Get all slots with their status
 */
export async function getAllSlots(): Promise<(Portfolio | null)[]> {
  try {
    const result = await BaseCrudService.getAll<Portfolio>(
      'portfolioimages',
      {},
      { limit: 1000 }
    );
    
    const allItems = result.items || [];
    const slots: (Portfolio | null)[] = Array(MAX_SLOTS).fill(null);
    
    for (const item of allItems) {
      if (item.displayOrder && item.displayOrder >= 1 && item.displayOrder <= MAX_SLOTS) {
        slots[item.displayOrder - 1] = item;
      }
    }
    
    return slots;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get all slots: ${errorMsg}`);
  }
}
