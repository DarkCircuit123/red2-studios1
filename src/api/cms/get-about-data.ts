import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Get About Data API
 * Fetches about section text and settings from the about collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async () => {
  try {
    console.log('[GET_ABOUT_DATA] Request started');

    // Fetch about section data
    const aboutResult = await BaseCrudService.getAll('about', {}, { limit: 1 });

    console.log('[GET_ABOUT_DATA] Successfully fetched about data', {
      itemCount: aboutResult.items?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: aboutResult.items || [],
        totalCount: aboutResult.totalCount || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[GET_ABOUT_DATA] Failed to fetch about data', {
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
