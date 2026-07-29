/**
 * Backend endpoint for submitting a public booking
 * Creates a booking record and marks the availability slot as booked
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { Bookings, BookingAvailability } from '@/entities/index';

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

export async function POST(request: Request) {
  try {
    const body = await request.json() as BookingSubmission;

    // Validate required fields
    if (!body.clientName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: clientName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.clientEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: clientEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.slotId) {
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

    // Save booking to CMS with elevated permissions
    await BaseCrudService.create('bookings', booking);

    // Mark the availability slot as booked with elevated permissions
    await BaseCrudService.update('bookingavailability', {
      _id: body.slotId,
      isAvailable: false
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: booking
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error submitting booking:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit booking'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
