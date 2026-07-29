/**
 * Backend endpoint for creating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function POST(request: Request) {
  try {
    const availability = await request.json() as BookingAvailability;

    // Validate required fields
    if (!availability._id) {
      return new Response(
        JSON.stringify({ message: 'Missing required field: _id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.bookingDate) {
      return new Response(
        JSON.stringify({ message: 'Missing required field: bookingDate' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.startTime) {
      return new Response(
        JSON.stringify({ message: 'Missing required field: startTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.endTime) {
      return new Response(
        JSON.stringify({ message: 'Missing required field: endTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the booking availability with elevated permissions
    // The backend service bypasses frontend permission checks
    const result = await BaseCrudService.create(
      'bookingavailability',
      {
        _id: availability._id,
        bookingDate: availability.bookingDate,
        startTime: availability.startTime,
        endTime: availability.endTime,
        isAvailable: availability.isAvailable !== false,
        sessionType: availability.sessionType || 'Session'
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating booking availability:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
