/**
 * PUT /api/booking-availability/update
 * 
 * Updates an existing booking availability slot with production hardening:
 * - Server-side data normalization and validation
 * - Validates time logic (endTime after startTime)
 * - Comprehensive logging for audit trail
 * 
 * Request Payload:
 * {
 *   id: string (required, the _id of the slot to update)
 *   bookingDate?: string (YYYY-MM-DD format)
 *   startTime?: string (HH:mm format)
 *   endTime?: string (HH:mm format)
 *   sessionType?: string (trimmed)
 *   isAvailable?: boolean
 * }
 * 
 * Success Response (200):
 * {
 *   success: true,
 *   data: { _id: string, bookingDate, startTime, endTime, sessionType, isAvailable, _createdDate, _updatedDate }
 * }
 * 
 * Error Responses:
 * 400: Missing id or invalid field values
 * 500: Server error
 */

import { BookingAvailability } from '@/entities/index';
import wixData from 'wix-data';
import { requireAdmin } from '@/lib/auth-security';

// Validation helpers
function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function validateTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

function isTimeAfter(startTime: string, endTime: string): boolean {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  return endTotalMin > startTotalMin;
}

export async function PUT({ request, cookies }: { request: Request; cookies: any }) {
  // ADMIN GATE: this route mutates the availability calendar with
  // suppressAuth: true, bypassing collection permissions entirely.
  // It previously had no auth at all - anyone who knew the URL could
  // add, alter or wipe the entire booking calendar.
  const denied = await requireAdmin(cookies, request, 'update booking availability');
  if (denied) return denied;

  const startTime = new Date();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[UPDATE:${requestId}] PUT /api/booking-availability/update - Starting`);
    
    const body = await request.json() as { id: string } & Partial<BookingAvailability>;
    console.log(`[UPDATE:${requestId}] Received payload:`, JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.id) {
      console.warn(`[UPDATE:${requestId}] Validation failed: Missing id`);
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update object with only provided fields
    const updateData: any = { _id: body.id };

    // Normalize and validate each field if provided
    if (body.bookingDate !== undefined) {
      const bookingDate = body.bookingDate.trim();
      if (!validateDateFormat(bookingDate)) {
        console.warn(`[UPDATE:${requestId}] Validation failed: Invalid bookingDate format: ${bookingDate}`);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid bookingDate format. Expected YYYY-MM-DD' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updateData.bookingDate = bookingDate;
    }

    if (body.startTime !== undefined) {
      const startTimeNorm = body.startTime.trim();
      if (!validateTimeFormat(startTimeNorm)) {
        console.warn(`[UPDATE:${requestId}] Validation failed: Invalid startTime format: ${startTimeNorm}`);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid startTime format. Expected HH:mm' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updateData.startTime = startTimeNorm;
    }

    if (body.endTime !== undefined) {
      const endTimeNorm = body.endTime.trim();
      if (!validateTimeFormat(endTimeNorm)) {
        console.warn(`[UPDATE:${requestId}] Validation failed: Invalid endTime format: ${endTimeNorm}`);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid endTime format. Expected HH:mm' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updateData.endTime = endTimeNorm;
    }

    // Validate time logic if both times are being set or updated
    if (updateData.startTime && updateData.endTime) {
      if (!isTimeAfter(updateData.startTime, updateData.endTime)) {
        console.warn(`[UPDATE:${requestId}] Validation failed: endTime (${updateData.endTime}) is not after startTime (${updateData.startTime})`);
        return new Response(
          JSON.stringify({ success: false, message: 'endTime must be after startTime' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (body.sessionType !== undefined) {
      updateData.sessionType = body.sessionType.trim();
    }

    if (body.isAvailable !== undefined) {
      updateData.isAvailable = body.isAvailable;
    }

    console.log(`[UPDATE:${requestId}] Update data:`, JSON.stringify(updateData, null, 2));

    const result = await wixData.update('bookingavailability', updateData, { suppressAuth: true });

    const duration = new Date().getTime() - startTime.getTime();
    console.log(`[UPDATE:${requestId}] ✓ Successfully updated slot ${body.id} in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = new Date().getTime() - startTime.getTime();
    console.error(`[UPDATE:${requestId}] ✗ Failed after ${duration}ms:`, error);
    console.error(`[UPDATE:${requestId}] Error details:`, error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
