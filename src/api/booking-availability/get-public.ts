/**
 * Backend endpoint for fetching available booking slots (public)
 * Used by the public booking page
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint filters for available slots only and returns them
 * to public users without exposing admin operations.
 */

// Import Wix backend APIs - these run with elevated permissions
import wixData from 'wix-data';
import { BookingAvailability } from '@/entities/index';

export async function GET({ request }: { request: Request }) {
  try {
    console.log('[Backend] GET /api/booking-availability/get-public - Fetching public available slots');

    // Use wixData.query with elevated permissions (backend-only)
    // Filter for available slots only
    const results = await wixData.query('bookingavailability')
      .eq('isAvailable', true)
      .limit(500)
      .find({ suppressAuth: true });

    console.log('[Backend] Fetched available slots:', results.items?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: results.items || [],
        totalCount: results.totalCount || 0,
        hasNext: results.hasNext || false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error fetching public available slots:', error);
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch available slots'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
