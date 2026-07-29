/**
 * Backend endpoint for deleting booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * Astro API Route Handler
 */

import { BaseCrudService } from '@/integrations';

export async function DELETE({ request }: { request: Request }) {
  try {
    console.log('[API] DELETE /api/booking-availability/delete - Request received');
    
    // Parse request body safely - handle both standard Request and Astro's request wrapper
    let body: { id: string };
    try {
      // Check if request has json method
      if (typeof request.json !== 'function') {
        console.error('[API] Request.json is not a function. Request object:', request);
        // Try to get the body directly if it's an Astro request
        const rawBody = (request as any).body || (request as any).rawBody;
        if (rawBody) {
          body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        } else {
          throw new Error('Cannot parse request body - json() method not available');
        }
      } else {
        body = await request.json() as { id: string };
      }
    } catch (parseError) {
      console.error('[API] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON in request body',
          error: parseError instanceof Error ? parseError.message : String(parseError)
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
    console.error('[API] Full error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        error: String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
