import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { CarouselImages } from '@/entities';

/**
 * Get Carousel Images API
 * Fetches carousel images from the carouselimages collection
 * Filters by isActive: true and sorts by displayOrder ascending
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_CAROUSEL_IMAGES] Request started');

    const result = await BaseCrudService.getAll<CarouselImages>('carouselimages', {}, { limit: 100 });
    
    // Filter for active items and sort by displayOrder ascending
    const activeItems = (result.items || [])
      .filter(item => item.isActive === true)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    console.log('[GET_CAROUSEL_IMAGES] Successfully fetched carousel images', {
      itemCount: activeItems.length,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: activeItems,
        totalCount: activeItems.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[GET_CAROUSEL_IMAGES] Failed to fetch carousel images', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch carousel images',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
