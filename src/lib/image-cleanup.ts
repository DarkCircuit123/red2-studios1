/**
 * Image Cleanup Utility - Optional Manual Cleanup
 * 
 * Use this to detect and optionally clean up oversized images in Portfolio collection
 * that may have caused WDE0009 errors
 * 
 * This is NOT required - the new upload system prevents future issues
 * Only use if you have existing problematic records
 */

import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';

export interface ImageCleanupReport {
  totalRecords: number;
  oversizedRecords: number;
  affectedFields: string[];
  records: Array<{
    id: string;
    projectName?: string;
    oversizedFields: Array<{
      field: string;
      size: number;
      sizeKB: string;
    }>;
  }>;
}

const IMAGE_FIELDS = ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'];
const SIZE_LIMIT = 1024 * 1024; // 1MB per field

/**
 * Detect oversized images in Portfolio collection
 * Returns a report of problematic records
 */
export async function detectOversizedImages(): Promise<ImageCleanupReport> {
  const report: ImageCleanupReport = {
    totalRecords: 0,
    oversizedRecords: 0,
    affectedFields: [],
    records: []
  };

  try {
    // Fetch all portfolio items
    const result = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 100 });
    const items = result?.items || [];
    
    report.totalRecords = items.length;

    for (const item of items) {
      const oversizedFields: Array<{ field: string; size: number; sizeKB: string }> = [];

      for (const field of IMAGE_FIELDS) {
        const imageUrl = (item as any)[field];
        if (imageUrl && typeof imageUrl === 'string') {
          const size = estimateDataUrlSize(imageUrl);
          if (size > SIZE_LIMIT) {
            oversizedFields.push({
              field,
              size,
              sizeKB: (size / 1024).toFixed(2)
            });

            if (!report.affectedFields.includes(field)) {
              report.affectedFields.push(field);
            }
          }
        }
      }

      if (oversizedFields.length > 0) {
        report.oversizedRecords++;
        report.records.push({
          id: item._id,
          projectName: item.projectName,
          oversizedFields
        });
      }
    }

    return report;
  } catch (error) {
    console.error('Error detecting oversized images:', error);
    throw error;
  }
}

/**
 * Estimate the size of a data URL
 * Data URLs are base64 encoded, so size ≈ (string length * 3/4)
 */
function estimateDataUrlSize(dataUrl: string): number {
  if (!dataUrl.startsWith('data:')) {
    return 0;
  }

  // Extract base64 part
  const base64Part = dataUrl.split(',')[1];
  if (!base64Part) return 0;

  // Base64 encoding increases size by ~33%, so actual size ≈ length * 3/4
  return Math.ceil(base64Part.length * 0.75);
}

/**
 * Clear oversized images from a specific record
 * This removes the problematic data, allowing the record to be saved
 * 
 * IMPORTANT: This is destructive - it deletes the image data
 * Only use if you have backups or don't need the images
 */
export async function clearOversizedImagesFromRecord(
  itemId: string,
  fieldsToClean: string[]
): Promise<void> {
  try {
    const updateData: any = { _id: itemId };
    
    for (const field of fieldsToClean) {
      updateData[field] = null;
    }

    await BaseCrudService.update('portfolio', updateData);
    console.log(`Cleared oversized images from ${itemId}:`, fieldsToClean);
  } catch (error) {
    console.error('Error clearing oversized images:', error);
    throw error;
  }
}

/**
 * Get a summary of the cleanup needed
 */
export function generateCleanupSummary(report: ImageCleanupReport): string {
  if (report.oversizedRecords === 0) {
    return 'No oversized images detected. Your Portfolio collection is clean!';
  }

  const lines = [
    `Found ${report.oversizedRecords} records with oversized images out of ${report.totalRecords} total`,
    `Affected fields: ${report.affectedFields.join(', ')}`,
    '',
    'Oversized records:'
  ];

  for (const record of report.records) {
    lines.push(`  - ${record.projectName || record.id}`);
    for (const field of record.oversizedFields) {
      lines.push(`    • ${field.field}: ${field.sizeKB}KB`);
    }
  }

  lines.push('');
  lines.push('To fix: Use clearOversizedImagesFromRecord() to remove problematic images');
  lines.push('Then re-upload using the new ImageUploadManager');

  return lines.join('\n');
}
