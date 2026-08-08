/**
 * Data Cleanup Verification
 * Verifies that remaining data is clean and contains no placeholder items
 */

import { BaseCrudService } from '@/integrations';

interface VerificationResult {
  collectionId: string;
  collectionName: string;
  totalItems: number;
  itemsWithPlaceholders: number;
  placeholderItems: Array<{ id: string; reason: string }>;
  status: 'clean' | 'contaminated' | 'error';
  error?: string;
}

const PLACEHOLDER_PATTERNS = [
  'example.com',
  'placeholder',
  'test@example.com',
  'sample',
  'demo',
  'https://example.com',
  'http://example.com',
  'example',
  'test-',
  'temp-',
  'tmp-',
];

function checkForPlaceholders(item: any): string | null {
  if (!item) return null;

  const itemStr = JSON.stringify(item).toLowerCase();

  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (itemStr.includes(pattern.toLowerCase())) {
      return pattern;
    }
  }

  return null;
}

async function verifyCollection(
  collectionId: string,
  collectionName: string
): Promise<VerificationResult> {
  try {
    const result = await BaseCrudService.getAll(collectionId, {}, { limit: 1000 });
    const items = result.items;

    const placeholderItems: Array<{ id: string; reason: string }> = [];

    for (const item of items) {
      const placeholderReason = checkForPlaceholders(item);
      if (placeholderReason) {
        placeholderItems.push({
          id: item._id,
          reason: `Contains pattern: "${placeholderReason}"`,
        });
      }
    }

    return {
      collectionId,
      collectionName,
      totalItems: items.length,
      itemsWithPlaceholders: placeholderItems.length,
      placeholderItems,
      status: placeholderItems.length === 0 ? 'clean' : 'contaminated',
    };
  } catch (error) {
    return {
      collectionId,
      collectionName,
      totalItems: 0,
      itemsWithPlaceholders: 0,
      placeholderItems: [],
      status: 'error',
      error: `Failed to verify collection: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function verifyDataCleanup(): Promise<VerificationResult[]> {
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

  const results: VerificationResult[] = [];

  for (const collection of collections) {
    console.log(`🔍 Verifying ${collection.name}...`);
    const result = await verifyCollection(collection.id, collection.name);
    results.push(result);
  }

  return results;
}

export function generateVerificationReport(results: VerificationResult[]): string {
  const cleanCount = results.filter(r => r.status === 'clean').length;
  const contaminatedCount = results.filter(r => r.status === 'contaminated').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalPlaceholders = results.reduce((sum, r) => sum + r.itemsWithPlaceholders, 0);

  let report = `
✅ DATA CLEANUP VERIFICATION REPORT
═══════════════════════════════════════════════════════════════

📊 SUMMARY:
   ✓ Clean Collections: ${cleanCount}
   ⚠ Contaminated Collections: ${contaminatedCount}
   ✗ Error Collections: ${errorCount}
   🗑️  Total Remaining Placeholders: ${totalPlaceholders}

DETAILED VERIFICATION:
───────────────────────────────────────────────────────────────
`;

  results.forEach(result => {
    const statusIcon = result.status === 'clean' ? '✓' : result.status === 'contaminated' ? '⚠' : '✗';
    report += `
${statusIcon} ${result.collectionName}
   Collection ID: ${result.collectionId}
   Total Items: ${result.totalItems}
   Items with Placeholders: ${result.itemsWithPlaceholders}
   Status: ${result.status}`;

    if (result.error) {
      report += `\n   Error: ${result.error}`;
    }

    if (result.placeholderItems.length > 0) {
      report += `\n   Contaminated Items:`;
      result.placeholderItems.slice(0, 3).forEach(item => {
        report += `\n     - ${item.id}: ${item.reason}`;
      });
      if (result.placeholderItems.length > 3) {
        report += `\n     ... and ${result.placeholderItems.length - 3} more`;
      }
    }
  });

  report += `
───────────────────────────────────────────────────────────────

${totalPlaceholders === 0 ? '✅ ALL DATA IS CLEAN - NO PLACEHOLDERS FOUND' : '⚠️  WARNING: Placeholders still present in data'}
`;

  return report;
}
