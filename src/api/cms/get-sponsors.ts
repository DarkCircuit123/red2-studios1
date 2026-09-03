import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get Sponsors/Brands API
 * Fetches client logos and press mentions from the clientspress collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async () => {
  try {
    console.log('[GET_SPONSORS] Request started');

    const result = await BaseCrudService.getAll('clientspress', {}, { limit: 50 });

    console.log('[GET_SPONSORS] Successfully fetched sponsors', {
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
    console.error('[GET_SPONSORS] Failed to fetch sponsors', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sponsors',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
