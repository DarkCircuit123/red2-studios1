import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get Carousel Images API
 * Fetches carousel images from the carouselimages collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_CAROUSEL_IMAGES] Request started');

    const result = await BaseCrudService.getAll('carouselimages', {}, { limit: 100 });

    console.log('[GET_CAROUSEL_IMAGES] Successfully fetched carousel images', {
      itemCount: result.items?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: result.items || [],
        totalCount: result.totalCount || 0,
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
