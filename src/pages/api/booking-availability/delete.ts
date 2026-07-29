/**
 * Backend endpoint for deleting booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';

export async function DELETE(request: Request) {
  try {
    console.log('[API] DELETE /api/booking-availability/delete - Request received');
    
    // Parse request body safely
    let body: { id: string };
    try {
      body = await request.json() as { id: string };
    } catch (parseError) {
      console.error('[API] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON in request body' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Incoming delete data:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.id) {
      console.error('[API] Validation failed: Missing id');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Validation passed, deleting booking availability...');

    // Delete the booking availability with elevated permissions
    await BaseCrudService.delete('bookingavailability', body.id);

    console.log('[API] Successfully deleted booking availability with id:', body.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Booking availability deleted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API] Error deleting booking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete booking availability';
    console.error('[API] Error details:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
