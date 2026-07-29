/**
 * Backend endpoint for updating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * Astro API Route Handler
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function PUT({ request }: { request: Request }) {
  try {
    console.log('[API] PUT /api/booking-availability/update - Request received');
    
    // Parse request body safely - handle both standard Request and Astro's request wrapper
    let body: { id: string } & Partial<BookingAvailability>;
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
        body = await request.json() as { id: string } & Partial<BookingAvailability>;
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

    console.log('[API] Incoming update data:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.id) {
      console.error('[API] Validation failed: Missing id');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Validation passed, updating booking availability...');

    // Build update object with only provided fields
    const updateData: any = { _id: body.id };

    if (body.bookingDate !== undefined) updateData.bookingDate = body.bookingDate;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;
    if (body.sessionType !== undefined) updateData.sessionType = body.sessionType;

    console.log('[API] Update payload:', JSON.stringify(updateData, null, 2));

    // Update the booking availability with elevated permissions
    const result = await BaseCrudService.update('bookingavailability', updateData);

    console.log('[API] Database response:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Booking availability updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API] Error updating booking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update booking availability';
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
