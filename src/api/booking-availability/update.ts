/**
 * Backend endpoint for updating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint is called from the frontend BookingManagerPro component
 * and uses backend-only APIs with elevated permissions to update the
 * bookingavailability collection.
 */

import { BookingAvailability } from '@/entities/index';

// Import Wix backend APIs - these run with elevated permissions
import wixData from 'wix-data';

export async function PUT(request: Request) {
  try {
    console.log('[Backend] PUT /api/booking-availability/update - Updating availability slot');
    
    const body = await request.json() as { id: string } & Partial<BookingAvailability>;
    console.log('[Backend] Received update data:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.id) {
      console.error('[Backend] Missing id');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: id' }),
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

    console.log('[Backend] Update data:', JSON.stringify(updateData, null, 2));

    // Use wixData.update with elevated permissions (backend-only)
    // This bypasses frontend permission restrictions
    const result = await wixData.update('bookingavailability', updateData, { suppressAuth: true });

    console.log('[Backend] Successfully updated availability slot:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error updating booking availability:', error);
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
