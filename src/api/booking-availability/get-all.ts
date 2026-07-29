/**
 * Backend endpoint for fetching all booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function GET(request: Request) {
  try {
    console.log('[Backend] Fetching all booking availability slots');

    // Fetch all booking availability with elevated permissions
    // The backend service bypasses frontend permission checks
    const result = await BaseCrudService.getAll<BookingAvailability>(
      'bookingavailability',
      {},
      { limit: 500 }
    );

    console.log('[Backend] Fetched availability slots:', result.items?.length || 0);

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
    console.error('[Backend] Error fetching booking availability:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
