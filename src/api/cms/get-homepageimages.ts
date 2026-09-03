import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get Homepage Images API
 * Fetches hero and about section images from the homepageimages collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_HOMEPAGE_IMAGES] Request started');

    const result = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });

    console.log('[GET_HOMEPAGE_IMAGES] Successfully fetched homepage images', {
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
    console.error('[GET_HOMEPAGE_IMAGES] Failed to fetch homepage images', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch homepage images',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
