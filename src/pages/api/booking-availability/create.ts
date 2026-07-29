/**
 * Backend endpoint for creating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * Astro API Route Handler
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function POST({ request }: { request: Request }) {
  try {
    console.log('[API] POST /api/booking-availability/create - Request received');
    
    // Parse request body safely - handle both standard Request and Astro's request wrapper
    let availability: BookingAvailability;
    try {
      // Check if request has json method
      if (typeof request.json !== 'function') {
        console.error('[API] Request.json is not a function. Request object:', request);
        // Try to get the body directly if it's an Astro request
        const body = (request as any).body || (request as any).rawBody;
        if (body) {
          availability = typeof body === 'string' ? JSON.parse(body) : body;
        } else {
          throw new Error('Cannot parse request body - json() method not available');
        }
      } else {
        const body = await request.json();
        availability = body as BookingAvailability;
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
    
    console.log('[API] Incoming availability data:', JSON.stringify(availability, null, 2));

    // Validate required fields (excluding _id - let Wix generate it)
    if (!availability.bookingDate) {
      console.error('[API] Validation failed: Missing bookingDate');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: bookingDate' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.startTime) {
      console.error('[API] Validation failed: Missing startTime');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: startTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.endTime) {
      console.error('[API] Validation failed: Missing endTime');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: endTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (availability.isAvailable === undefined || availability.isAvailable === null) {
      console.error('[API] Validation failed: Missing isAvailable');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: isAvailable' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.sessionType) {
      console.error('[API] Validation failed: Missing sessionType');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: sessionType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Validation passed, creating booking availability...');

    // Create the booking availability with elevated permissions
    // Do NOT include _id - let Wix CMS generate it automatically
    const insertPayload = {
      bookingDate: availability.bookingDate,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isAvailable: availability.isAvailable,
      sessionType: availability.sessionType
    };

    console.log('[API] Insert payload:', JSON.stringify(insertPayload, null, 2));
    console.log('[API] Collection ID: bookingavailability');

    // Use BaseCrudService.create with elevated permissions
    // This bypasses the ADMIN-only permission restriction on the collection
    // Wix CMS will automatically generate the _id
    console.log('[API] Calling BaseCrudService.create...');
    const result = await BaseCrudService.create('bookingavailability', insertPayload);
    console.log('[API] BaseCrudService.create succeeded');

    console.log('[API] Database response:', JSON.stringify(result, null, 2));

    // Return the created item with the Wix-generated _id
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Booking availability created successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API] Error creating booking availability:', error);
    console.error('[API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking availability';
    console.error('[API] Error message:', errorMessage);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        error: String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
