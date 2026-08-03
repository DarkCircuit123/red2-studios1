/**
 * Backend endpoint for fetching available booking slots (public)
 * Used by the public booking page
 * No authentication required - returns only available slots
 * 
 * This endpoint filters for available slots only and returns them
 * to public users without exposing admin operations.
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function GET({ request }: { request: Request }) {
  try {
    console.log('[Backend] GET /api/booking-availability/get-public - Fetching public available slots');

    // Use BaseCrudService to fetch available slots
    // No authentication required for public endpoint
    const result = await BaseCrudService.getAll<BookingAvailability>('bookingavailability');

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
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return 200 with empty slots on error instead of 500
    // This prevents the booking page from crashing
    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        error: 'Availability is temporarily unavailable',
        errorCode: 'AVAILABILITY_FETCH_ERROR'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
