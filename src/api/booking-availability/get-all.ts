/**
 * Backend endpoint for fetching all booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint is called from the frontend BookingManagerPro component
 * and uses backend-only APIs with elevated permissions to read from
 * the bookingavailability collection.
 */

// Import Wix backend APIs - these run with elevated permissions
import wixData from 'wix-data';
import { BookingAvailability } from '@/entities/index';

export async function GET(request: Request) {
  try {
    console.log('[Backend] GET /api/booking-availability/get-all - Fetching all availability slots');

    // Use wixData.query with elevated permissions (backend-only)
    // This bypasses frontend permission restrictions
    const results = await wixData.query('bookingavailability')
      .limit(500)
      .find({ suppressAuth: true });

    console.log('[Backend] Fetched availability slots:', results.items?.length || 0);

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
    console.error('[Backend] Error fetching booking availability:', error);
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
