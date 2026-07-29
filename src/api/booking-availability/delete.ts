/**
 * Backend endpoint for deleting booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint is called from the frontend BookingManagerPro component
 * and uses backend-only APIs with elevated permissions to delete from
 * the bookingavailability collection.
 */

// Import Wix backend APIs - these run with elevated permissions
import wixData from 'wix-data';

export async function DELETE(request: Request) {
  try {
    console.log('[Backend] DELETE /api/booking-availability/delete - Deleting availability slot');
    
    const body = await request.json() as { id: string };
    console.log('[Backend] Received delete request for id:', body.id);

    // Validate required fields
    if (!body.id) {
      console.error('[Backend] Missing id');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use wixData.remove with elevated permissions (backend-only)
    // This bypasses frontend permission restrictions
    await wixData.remove('bookingavailability', body.id, { suppressAuth: true });

    console.log('[Backend] Successfully deleted availability slot:', body.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error deleting booking availability:', error);
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
