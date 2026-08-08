/**
 * API endpoint to validate images across all CMS collections
 * GET /api/cms/validate-images
 */

import type { APIRoute } from 'astro';
import { validateMultipleCollections, IMAGE_COLLECTIONS, generateValidationReportText } from '@/lib/cms-image-validator';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Validate all collections
    const report = await validateMultipleCollections(IMAGE_COLLECTIONS);

    // Generate text report
    const textReport = generateValidationReportText(report);

    // Log to console for debugging
    console.log(textReport);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: report.timestamp,
        summary: {
          totalValidImages: report.totalValidImages,
          totalBrokenImages: report.totalBrokenImages,
          collections: report.collections.length,
        },
        collections: report.collections.map(c => ({
          id: c.collectionId,
          total: c.totalItems,
          withImages: c.itemsWithImages,
          valid: c.validImages,
          broken: c.brokenImages,
          percentageBroken: c.percentageBroken.toFixed(1),
          brokenUrls: c.brokenUrls.slice(0, 5), // Limit to first 5
        })),
        fullReport: textReport,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Image validation failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
