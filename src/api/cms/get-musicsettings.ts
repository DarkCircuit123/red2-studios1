import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get Music Settings API
 * Fetches music settings from the musicsettings collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_MUSICSETTINGS] Request started');

    const result = await BaseCrudService.getAll('musicsettings', {}, { limit: 50 });

    console.log('[GET_MUSICSETTINGS] Successfully fetched music settings', {
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
    console.error('[GET_MUSICSETTINGS] Failed to fetch music settings', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch music settings',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
