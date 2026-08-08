/**
 * Data Cleanup Executor
 * Identifies and deletes placeholder items from CMS collections
 * Verifies deletion counts and reports final status
 * 
 * RESTRICTED: Only matches example.com in image fields to avoid false positives
 */

import { BaseCrudService } from '@/integrations';

interface CleanupReport {
  collectionId: string;
  collectionName: string;
  beforeCount: number;
  deletedCount: number;
  afterCount: number;
  deletedItems: string[];
  status: 'success' | 'error' | 'no-placeholders';
  error?: string;
}

// Image field names to check for placeholders
const IMAGE_FIELDS = [
  'imageUrl',
  'image',
  'photo',
  'mainImage',
  'heroImage',
  'aboutSectionImage',
  'contactBackgroundImage',
  'galleryImage1',
  'galleryImage2',
  'galleryImage3',
  'thumbnail',
  'thumbnailImage',
  'galleryCoverImage',
  'clientLogo',
  'headshot',
  'watermarkImage',
  'logoImage',
  'featuredImage',
  'infographic',
  'arPreviewModelUrl',
];

// Only match example.com exactly in image URLs
const EXAMPLE_COM_PATTERN = /example\.com/i;

function isPlaceholder(item: any): boolean {
  if (!item) return false;

  // Check only image fields for example.com pattern
  for (const field of IMAGE_FIELDS) {
    const value = item[field];
    if (value && typeof value === 'string' && EXAMPLE_COM_PATTERN.test(value)) {
      return true;
    }
  }

  return false;
}

async function cleanupCollection(
  collectionId: string,
  collectionName: string
): Promise<CleanupReport> {
  try {
    // Get all items before cleanup
    const beforeResult = await BaseCrudService.getAll(collectionId, {}, { limit: 1000 });
    const beforeCount = beforeResult.items.length;

    // Identify placeholder items
    const placeholderItems = beforeResult.items.filter(isPlaceholder);
    const deletedIds: string[] = [];

    // Delete placeholder items
    for (const item of placeholderItems) {
      try {
        await BaseCrudService.delete(collectionId, item._id);
        deletedIds.push(item._id);
      } catch (error) {
        console.error(`Failed to delete item ${item._id} from ${collectionId}:`, error);
      }
    }

    // Verify deletion by re-querying
    const afterResult = await BaseCrudService.getAll(collectionId, {}, { limit: 1000 });
    const afterCount = afterResult.items.length;

    const expectedAfterCount = beforeCount - deletedIds.length;
    const status =
      afterCount === expectedAfterCount
        ? deletedIds.length > 0
          ? 'success'
          : 'no-placeholders'
        : 'error';

    return {
      collectionId,
      collectionName,
      beforeCount,
      deletedCount: deletedIds.length,
      afterCount,
      deletedItems: deletedIds,
      status,
      error:
        status === 'error'
          ? `Count mismatch: expected ${expectedAfterCount}, got ${afterCount}`
          : undefined,
    };
  } catch (error) {
    return {
      collectionId,
      collectionName,
      beforeCount: 0,
      deletedCount: 0,
      afterCount: 0,
      deletedItems: [],
      status: 'error',
      error: `Failed to cleanup collection: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function executeDataCleanup(): Promise<CleanupReport[]> {
  const collections = [
    { id: 'portfolio', name: 'Portfolio' },
    { id: 'portfolioimages', name: 'Portfolio Images' },
    { id: 'galleryphotos', name: 'Gallery Photos' },
    { id: 'homepageimages', name: 'Homepage Images' },
    { id: 'homepagesettings', name: 'Homepage Settings' },
    { id: 'behindthescenes', name: 'Behind The Scenes' },
    { id: 'blogposts', name: 'Blog Posts' },
    { id: 'reels', name: 'Reels' },
    { id: 'storiesinsights', name: 'Stories Insights' },
    { id: 'clientspress', name: 'Clients & Press' },
    { id: 'clientgalleries', name: 'Client Galleries' },
    { id: 'prints', name: 'Prints' },
    { id: 'services', name: 'Services' },
    { id: 'splashpage', name: 'Splashpage' },
    { id: 'watermarksettings', name: 'Watermark Settings' },
    { id: 'about', name: 'About Section' },
    { id: 'teammembers', name: 'Team Members' },
  ];

  const reports: CleanupReport[] = [];

  for (const collection of collections) {
    console.log(`🧹 Cleaning up ${collection.name}...`);
    const report = await cleanupCollection(collection.id, collection.name);
    reports.push(report);
    console.log(`  ✓ ${collection.name}: ${report.deletedCount} items deleted`);
  }

  return reports;
}

export function generateCleanupSummary(reports: CleanupReport[]): string {
  const successCount = reports.filter(r => r.status === 'success').length;
  const noPlaceholdersCount = reports.filter(r => r.status === 'no-placeholders').length;
  const errorCount = reports.filter(r => r.status === 'error').length;
  const totalDeleted = reports.reduce((sum, r) => sum + r.deletedCount, 0);

  let summary = `
📊 DATA CLEANUP SUMMARY
═══════════════════════════════════════════════════════════════

✅ Collections Cleaned: ${successCount}
⚪ Collections with No Placeholders: ${noPlaceholdersCount}
❌ Collections with Errors: ${errorCount}
🗑️  Total Items Deleted: ${totalDeleted}

DETAILED REPORT:
───────────────────────────────────────────────────────────────
`;

  reports.forEach(report => {
    const statusIcon =
      report.status === 'success' ? '✅' : report.status === 'no-placeholders' ? '⚪' : '❌';
    summary += `
${statusIcon} ${report.collectionName}
   Collection ID: ${report.collectionId}
   Before: ${report.beforeCount} items
   Deleted: ${report.deletedCount} items
   After: ${report.afterCount} items
   Status: ${report.status}`;

    if (report.error) {
      summary += `\n   Error: ${report.error}`;
    }

    if (report.deletedItems.length > 0) {
      summary += `\n   Deleted IDs: ${report.deletedItems.slice(0, 3).join(', ')}${report.deletedItems.length > 3 ? `... (+${report.deletedItems.length - 3} more)` : ''}`;
    }
  });

  summary += `
───────────────────────────────────────────────────────────────
`;

  return summary;
}
