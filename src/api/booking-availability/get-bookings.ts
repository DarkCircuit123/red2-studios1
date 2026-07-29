/**
 * Backend endpoint for fetching all bookings
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities/index';

export async function GET(request: Request) {
  try {
    console.log('[Backend] Fetching all bookings');

    // Fetch all bookings with elevated permissions
    // The backend service bypasses frontend permission checks
    const result = await BaseCrudService.getAll<Bookings>(
      'bookings',
      {},
      { limit: 500 }
    );

    console.log('[Backend] Fetched bookings:', result.items?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: result.items || [],
        totalCount: result.totalCount || 0,
        hasNext: result.hasNext || false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error fetching bookings:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
