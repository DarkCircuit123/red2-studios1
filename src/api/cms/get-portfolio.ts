import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';

/**
 * Get Portfolio API
 * Fetches portfolio items from the portfolioimages collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('[GET_PORTFOLIO] Request started');

    // Get limit from query params, default to 50
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 1000);

    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit });

    console.log('[GET_PORTFOLIO] Successfully fetched portfolio items', {
      itemCount: result.items?.length || 0,
      totalCount: result.totalCount || 0,
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
    console.error('[GET_PORTFOLIO] Failed to fetch portfolio items', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio items',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
