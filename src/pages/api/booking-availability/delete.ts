/**
 * Backend endpoint for deleting booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * Astro API Route Handler - BACKEND ONLY
 * 
 * CRITICAL: This uses wix-data (backend SDK) with suppressAuth: true
 * NOT BaseCrudService which uses @wix/data (frontend SDK)
 */

import wixData from 'wix-data';

export async function DELETE({ request }: { request: Request }) {
  try {
    console.log('[API] DELETE /api/booking-availability/delete - Request received');
    console.log('[API] Authenticated identity: Backend (Astro API route)');
    console.log('[API] Current permissions: ADMIN (backend-only)');
    
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
    console.log('[API] Collection ID: bookingavailability');
    console.log('[API] Using wix-data backend SDK with suppressAuth: true');

    // Delete the booking availability with elevated permissions
    console.log('[API] Calling wixData.remove with suppressAuth: true...');
    await wixData.remove('bookingavailability', body.id, { suppressAuth: true });

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
    console.error('[API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete booking availability';
    console.error('[API] Error details:', errorMessage);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
