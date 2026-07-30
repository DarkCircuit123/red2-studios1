/**
 * Portfolio Scan Endpoint
 * Fetches all portfolio items to identify base64 image data
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('[PORTFOLIO_SCAN] Starting portfolio scan...');

    // Dynamically import BaseCrudService to avoid circular dependencies
    const { BaseCrudService } = await import('@/integrations');
    const { Portfolio } = await import('@/entities/index');

    // Fetch all portfolio items
    const result = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 1000 });

    const items = result.items || [];
    console.log(`[PORTFOLIO_SCAN] Found ${items.length} portfolio items`);

    // Analyze items for base64 data
    const analysis = items.map((item) => ({
      _id: item._id,
      projectName: item.projectName,
      mainImage: item.mainImage,
      galleryImage1: item.galleryImage1,
      galleryImage2: item.galleryImage2,
      galleryImage3: item.galleryImage3,
      hasBase64: {
        mainImage: item.mainImage?.startsWith('data:image/') ?? false,
        galleryImage1: item.galleryImage1?.startsWith('data:image/') ?? false,
        galleryImage2: item.galleryImage2?.startsWith('data:image/') ?? false,
        galleryImage3: item.galleryImage3?.startsWith('data:image/') ?? false,
      },
    }));

    // Count items with base64
    const itemsWithBase64 = analysis.filter(
      (item) =>
        item.hasBase64.mainImage ||
        item.hasBase64.galleryImage1 ||
        item.hasBase64.galleryImage2 ||
        item.hasBase64.galleryImage3
    );

    console.log(`[PORTFOLIO_SCAN] Items with base64: ${itemsWithBase64.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalItems: items.length,
        itemsWithBase64: itemsWithBase64.length,
        items: items,
        analysis: analysis,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PORTFOLIO_SCAN] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
