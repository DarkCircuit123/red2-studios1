/**
 * Backend endpoint for submitting a public booking
 * Creates a booking record and marks the availability slot as booked
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint is called from the public booking page and uses
 * backend-only APIs with elevated permissions to write to both
 * the bookings and bookingavailability collections.
 */

import { Bookings, BookingAvailability } from '@/entities/index';
import { BaseCrudService } from '@/integrations';

interface BookingSubmission {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  sessionType?: string;
  bookingDate?: string | Date;
  bookingTime?: string;
  clientMessage?: string;
  slotId: string; // ID of the availability slot being booked
}

export async function POST({ request }: { request: Request }) {
  try {
    console.log('[Backend] POST /api/booking-availability/submit-booking - Submitting booking');
    
    const body = await request.json() as BookingSubmission;
    console.log('[Backend] Received booking submission:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.clientName) {
      console.error('[Backend] Missing clientName');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: clientName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.clientEmail) {
      console.error('[Backend] Missing clientEmail');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: clientEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.slotId) {
      console.error('[Backend] Missing slotId');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: slotId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create booking record
    const booking: Bookings = {
      _id: crypto.randomUUID(),
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      sessionType: body.sessionType,
      bookingDate: body.bookingDate,
      bookingTime: body.bookingTime,
      clientMessage: body.clientMessage,
      bookingStatus: 'Pending'
    };

    console.log('[Backend] Creating booking record:', JSON.stringify(booking, null, 2));

    // Save booking to CMS with suppressAuth to bypass permission restrictions
    const bookingResult = await BaseCrudService.create<Bookings>('bookings', booking, undefined, { suppressAuth: true });
    console.log('[Backend] Booking created successfully:', JSON.stringify(bookingResult, null, 2));

    // Mark the availability slot as booked
    const updateData = {
      _id: body.slotId,
      isAvailable: false
    };

    console.log('[Backend] Updating availability slot:', JSON.stringify(updateData, null, 2));

    const updateResult = await BaseCrudService.update<BookingAvailability>('bookingavailability', updateData, { suppressAuth: true });
    console.log('[Backend] Availability slot updated successfully:', JSON.stringify(updateResult, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        data: booking
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error submitting booking:', error);
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit booking'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
