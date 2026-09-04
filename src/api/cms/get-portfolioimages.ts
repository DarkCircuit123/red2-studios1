import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get Portfolio Images API
 * Fetches portfolio images from the portfolioimages collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_PORTFOLIOIMAGES] Request started');

    const result = await BaseCrudService.getAll('portfolioimages', {}, { limit: 50 });

    console.log('[GET_PORTFOLIOIMAGES] Successfully fetched portfolio images', {
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
    console.error('[GET_PORTFOLIOIMAGES] Failed to fetch portfolio images', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio images',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
