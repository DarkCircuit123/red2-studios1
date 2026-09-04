import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get About Section API
 * Fetches about section data from the about collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_ABOUT] Request started');

    const result = await BaseCrudService.getAll('about', {}, { limit: 50 });

    console.log('[GET_ABOUT] Successfully fetched about data', {
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
    console.error('[GET_ABOUT] Failed to fetch about data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch about data',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
