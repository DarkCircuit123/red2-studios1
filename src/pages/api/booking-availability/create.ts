/**
 * Backend endpoint for creating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function POST(request: Request) {
  try {
    console.log('[API] POST /api/booking-availability/create - Request received');
    
    const availability = await request.json() as BookingAvailability;
    
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

    const result = await BaseCrudService.create(
      'bookingavailability',
      insertPayload
    );

    console.log('[API] Database response:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API] Error creating booking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking availability';
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
