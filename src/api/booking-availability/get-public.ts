/**
 * Backend endpoint for fetching available booking slots (public)
 * Used by the public booking page
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function GET(request: Request) {
  try {
    console.log('[Backend] Fetching public available booking slots');

    // Fetch all booking availability with elevated permissions
    // Filter for available slots only
    const result = await BaseCrudService.getAll<BookingAvailability>(
      'bookingavailability',
      {},
      { limit: 500 }
    );

    // Filter for available slots only
    const availableSlots = (result.items || []).filter(slot => slot.isAvailable === true);

    console.log('[Backend] Fetched available slots:', availableSlots.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: availableSlots,
        totalCount: availableSlots.length,
        hasNext: false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error fetching public available slots:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch available slots'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
