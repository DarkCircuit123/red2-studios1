/**
 * Backend endpoint for creating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * Astro API Route Handler
 */

import wixData from 'wix-data';
import { BookingAvailability } from '@/entities/index';

export async function POST({ request }: { request: Request }) {
  try {
    console.log('[API] POST /api/booking-availability/create - Request received');
    console.log('[API] Request type:', typeof request);
    console.log('[API] Request constructor:', request?.constructor?.name);
    
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

    // Validate required fields
    if (!availability._id) {
      console.error('[API] Validation failed: Missing _id');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: _id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('[API] Validation passed, creating booking availability...');

    // Create the booking availability with elevated permissions
    const insertPayload = {
      _id: availability._id,
      bookingDate: availability.bookingDate,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isAvailable: availability.isAvailable !== false,
      sessionType: availability.sessionType || 'Session'
    };

    console.log('[API] Insert payload:', JSON.stringify(insertPayload, null, 2));
    console.log('[API] Collection ID: bookingavailability');

    // Use wixData.insert with elevated permissions (suppressAuth: true)
    // This bypasses the ADMIN-only permission restriction on the collection
    const result = await wixData.insert('bookingavailability', insertPayload, { suppressAuth: true });

    console.log('[API] Database response:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Booking availability created successfully'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API] Error creating booking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking availability';
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
