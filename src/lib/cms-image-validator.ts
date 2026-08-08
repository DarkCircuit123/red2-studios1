/**
 * CMS Image Validator
 * Validates images from CMS collections and provides detailed reports
 */

import { BaseCrudService } from '@/integrations';
import { isBrokenUrl } from './image-url-sanitizer';

export interface ImageValidationResult {
  collectionId: string;
  totalItems: number;
  itemsWithImages: number;
  brokenImages: number;
  validImages: number;
  brokenUrls: string[];
  percentageBroken: number;
}

export interface ValidationReport {
  timestamp: string;
  collections: ImageValidationResult[];
  totalBrokenImages: number;
  totalValidImages: number;
}

/**
 * Validate images in a specific collection
 */
export async function validateCollectionImages(
  collectionId: string,
  imageFields: string[]
): Promise<ImageValidationResult> {
  try {
    const result = await BaseCrudService.getAll(collectionId, {}, { limit: 1000 });
    const items = result.items || [];

    let itemsWithImages = 0;
    let brokenImages = 0;
    const brokenUrls: string[] = [];

    for (const item of items) {
      for (const field of imageFields) {
        const url = item[field];
        if (url && typeof url === 'string') {
          itemsWithImages++;
          if (isBrokenUrl(url)) {
            brokenImages++;
            brokenUrls.push(url);
          }
        }
      }
    }

    return {
      collectionId,
      totalItems: items.length,
      itemsWithImages,
      brokenImages,
      validImages: itemsWithImages - brokenImages,
      brokenUrls: [...new Set(brokenUrls)], // Deduplicate
      percentageBroken: itemsWithImages > 0 ? (brokenImages / itemsWithImages) * 100 : 0,
    };
  } catch (error) {
    console.error(`Failed to validate collection ${collectionId}:`, error);
    return {
      collectionId,
      totalItems: 0,
      itemsWithImages: 0,
      brokenImages: 0,
      validImages: 0,
      brokenUrls: [],
      percentageBroken: 0,
    };
  }
}

/**
 * Validate multiple collections
 */
export async function validateMultipleCollections(
  collections: Array<{ id: string; imageFields: string[] }>
): Promise<ValidationReport> {
  const results = await Promise.all(
    collections.map(({ id, imageFields }) => validateCollectionImages(id, imageFields))
  );

  const totalBrokenImages = results.reduce((sum, r) => sum + r.brokenImages, 0);
  const totalValidImages = results.reduce((sum, r) => sum + r.validImages, 0);

  return {
    timestamp: new Date().toISOString(),
    collections: results,
    totalBrokenImages,
    totalValidImages,
  };
}

/**
 * Generate a human-readable validation report
 */
export function generateValidationReportText(report: ValidationReport): string {
  let text = `Image Validation Report - ${new Date(report.timestamp).toLocaleString()}\n`;
  text += `${'='.repeat(60)}\n\n`;

  for (const collection of report.collections) {
    text += `Collection: ${collection.collectionId}\n`;
    text += `  Total Items: ${collection.totalItems}\n`;
    text += `  Items with Images: ${collection.itemsWithImages}\n`;
    text += `  Valid Images: ${collection.validImages}\n`;
    text += `  Broken Images: ${collection.brokenImages} (${collection.percentageBroken.toFixed(1)}%)\n`;

    if (collection.brokenUrls.length > 0) {
      text += `  Broken URLs:\n`;
      collection.brokenUrls.forEach(url => {
        text += `    - ${url}\n`;
      });
    }
    text += '\n';
  }

  text += `${'='.repeat(60)}\n`;
  text += `Total Valid Images: ${report.totalValidImages}\n`;
  text += `Total Broken Images: ${report.totalBrokenImages}\n`;

  return text;
}

/**
 * Collections with image fields to validate
 */
export const IMAGE_COLLECTIONS = [
  { id: 'portfolio', imageFields: ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'] },
  { id: 'portfolioimages', imageFields: ['imageUrl'] },
  { id: 'galleryphotos', imageFields: ['image', 'thumbnail'] },
  { id: 'homepageimages', imageFields: ['heroImage', 'aboutSectionImage', 'contactBackgroundImage'] },
  { id: 'homepagesettings', imageFields: ['heroBackgroundImage', 'heroForegroundImages'] },
  { id: 'behindthescenes', imageFields: ['photo'] },
  { id: 'blogposts', imageFields: ['thumbnailImage'] },
  { id: 'reels', imageFields: ['thumbnail'] },
  { id: 'storiesinsights', imageFields: ['featuredImage'] },
  { id: 'clientspress', imageFields: ['clientLogo'] },
  { id: 'clientgalleries', imageFields: ['galleryCoverImage'] },
  { id: 'prints', imageFields: ['mainImage'] },
  { id: 'services', imageFields: ['infographic'] },
  { id: 'splashpage', imageFields: ['logoImage'] },
  { id: 'watermarksettings', imageFields: ['watermarkImage'] },
  { id: 'about', imageFields: ['mainImage'] },
  { id: 'teammembers', imageFields: ['headshot'] },
];
