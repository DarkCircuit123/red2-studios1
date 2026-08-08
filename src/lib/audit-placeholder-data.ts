/**
 * Audit Script for Placeholder Data Detection
 * This script queries all CMS collections and identifies stale placeholder URLs
 * 
 * AUDIT PHASE ONLY - No data is deleted by this script
 */

import { BaseCrudService } from '@/integrations';
import { isBrokenUrl } from './image-url-sanitizer';

export interface AuditItem {
  _id: string;
  imageUrl?: string;
  altText?: string;
  [key: string]: any;
}

export interface CollectionAuditResult {
  collectionId: string;
  totalItems: number;
  itemsWithPlaceholders: number;
  placeholderItems: Array<{
    _id: string;
    field: string;
    url: string;
    altText?: string;
  }>;
  uniquePlaceholderUrls: string[];
}

export interface FullAuditReport {
  timestamp: string;
  collections: CollectionAuditResult[];
  summary: {
    totalCollectionsAudited: number;
    totalItemsAcrossCollections: number;
    totalItemsWithPlaceholders: number;
    totalUniquePlaceholderUrls: number;
  };
}

/**
 * Audit a single collection for placeholder URLs
 */
export async function auditCollection(
  collectionId: string,
  imageFields: string[]
): Promise<CollectionAuditResult> {
  try {
    const result = await BaseCrudService.getAll(collectionId, {}, { limit: 1000 });
    const items = result.items || [];

    const placeholderItems: CollectionAuditResult['placeholderItems'] = [];
    const uniquePlaceholderUrls = new Set<string>();

    for (const item of items) {
      for (const field of imageFields) {
        const url = item[field];
        if (url && typeof url === 'string' && isBrokenUrl(url)) {
          placeholderItems.push({
            _id: item._id,
            field,
            url,
            altText: item.altText || item.imageAltText || undefined,
          });
          uniquePlaceholderUrls.add(url);
        }
      }
    }

    return {
      collectionId,
      totalItems: items.length,
      itemsWithPlaceholders: placeholderItems.length,
      placeholderItems,
      uniquePlaceholderUrls: Array.from(uniquePlaceholderUrls),
    };
  } catch (error) {
    console.error(`Failed to audit collection ${collectionId}:`, error);
    return {
      collectionId,
      totalItems: 0,
      itemsWithPlaceholders: 0,
      placeholderItems: [],
      uniquePlaceholderUrls: [],
    };
  }
}

/**
 * Audit all collections defined in IMAGE_COLLECTIONS
 */
export async function auditAllCollections(
  collections: Array<{ id: string; imageFields: string[] }>
): Promise<FullAuditReport> {
  const results = await Promise.all(
    collections.map(({ id, imageFields }) => auditCollection(id, imageFields))
  );

  const summary = {
    totalCollectionsAudited: results.length,
    totalItemsAcrossCollections: results.reduce((sum, r) => sum + r.totalItems, 0),
    totalItemsWithPlaceholders: results.reduce((sum, r) => sum + r.itemsWithPlaceholders, 0),
    totalUniquePlaceholderUrls: new Set(
      results.flatMap(r => r.uniquePlaceholderUrls)
    ).size,
  };

  return {
    timestamp: new Date().toISOString(),
    collections: results,
    summary,
  };
}

/**
 * Query portfolioimages collection specifically for Step 1
 */
export async function queryPortfolioImagesCollection(): Promise<AuditItem[]> {
  try {
    const result = await BaseCrudService.getAll('portfolioimages', {}, { limit: 1000 });
    return result.items || [];
  } catch (error) {
    console.error('Failed to query portfolioimages collection:', error);
    return [];
  }
}

/**
 * Generate human-readable audit report
 */
export function generateAuditReportText(report: FullAuditReport): string {
  let text = `\n${'='.repeat(80)}\n`;
  text += `CMS PLACEHOLDER DATA AUDIT REPORT\n`;
  text += `Generated: ${new Date(report.timestamp).toLocaleString()}\n`;
  text += `${'='.repeat(80)}\n\n`;

  text += `SUMMARY\n`;
  text += `${'-'.repeat(80)}\n`;
  text += `Total Collections Audited: ${report.summary.totalCollectionsAudited}\n`;
  text += `Total Items Across Collections: ${report.summary.totalItemsAcrossCollections}\n`;
  text += `Total Items with Placeholder URLs: ${report.summary.totalItemsWithPlaceholders}\n`;
  text += `Total Unique Placeholder URLs: ${report.summary.totalUniquePlaceholderUrls}\n\n`;

  text += `DETAILED COLLECTION RESULTS\n`;
  text += `${'-'.repeat(80)}\n\n`;

  for (const collection of report.collections) {
    text += `Collection: ${collection.collectionId}\n`;
    text += `  Total Items: ${collection.totalItems}\n`;
    text += `  Items with Placeholders: ${collection.itemsWithPlaceholders}\n`;

    if (collection.uniquePlaceholderUrls.length > 0) {
      text += `  Unique Placeholder URLs:\n`;
      collection.uniquePlaceholderUrls.forEach(url => {
        text += `    • ${url}\n`;
      });
    }

    if (collection.placeholderItems.length > 0) {
      text += `  Placeholder Items (by _id):\n`;
      collection.placeholderItems.forEach(item => {
        text += `    • _id: ${item._id}\n`;
        text += `      Field: ${item.field}\n`;
        text += `      URL: ${item.url}\n`;
        if (item.altText) {
          text += `      Alt Text: ${item.altText}\n`;
        }
      });
    }

    text += '\n';
  }

  text += `${'='.repeat(80)}\n`;
  text += `END OF AUDIT REPORT\n`;
  text += `${'='.repeat(80)}\n\n`;

  return text;
}
