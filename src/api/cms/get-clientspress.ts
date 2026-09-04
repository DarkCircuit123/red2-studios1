import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get Clients & Press API
 * Fetches clients and press data from the clientspress collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_CLIENTSPRESS] Request started');

    const result = await BaseCrudService.getAll('clientspress', {}, { limit: 50 });

    console.log('[GET_CLIENTSPRESS] Successfully fetched clients & press data', {
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
    console.error('[GET_CLIENTSPRESS] Failed to fetch clients & press data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch clients & press data',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
