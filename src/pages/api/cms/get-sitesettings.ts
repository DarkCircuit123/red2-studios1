import { BaseCrudService } from '@/integrations';

/**
 * GET /api/cms/get-sitesettings
 * Fetches all site settings from the sitesettings collection
 * Returns the first (and typically only) settings record
 */
export async function GET() {
  try {
    const result = await BaseCrudService.getAll('sitesettings');
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[get-sitesettings] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
