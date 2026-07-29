/**
 * Backend endpoint for updating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function PUT(request: Request) {
  try {
    console.log('[API] PUT /api/booking-availability/update - Request received');
    
    const body = await request.json() as { id: string } & Partial<BookingAvailability>;

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
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API] Error updating booking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update booking availability';
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
