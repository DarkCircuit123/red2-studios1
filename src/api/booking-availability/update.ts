/**
 * Backend endpoint for updating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { id: string } & Partial<BookingAvailability>;

    // Validate required fields
    if (!body.id) {
      return new Response(
        JSON.stringify({ message: 'Missing required field: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update object with only provided fields
    const updateData: any = { _id: body.id };

    if (body.bookingDate !== undefined) updateData.bookingDate = body.bookingDate;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;
    if (body.sessionType !== undefined) updateData.sessionType = body.sessionType;

    // Update the booking availability with elevated permissions
    const result = await BaseCrudService.update('bookingavailability', updateData);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating booking availability:', error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : 'Failed to update booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
