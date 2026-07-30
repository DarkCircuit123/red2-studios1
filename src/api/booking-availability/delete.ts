/**
 * DELETE /api/booking-availability/delete
 * 
 * Deletes a booking availability slot with comprehensive logging.
 * Uses elevated permissions to bypass frontend restrictions.
 * 
 * Request Payload:
 * {
 *   id: string (required, the _id of the slot to delete)
 * }
 * 
 * Success Response (200):
 * {
 *   success: true
 * }
 * 
 * Error Responses:
 * 400: Missing id
 * 500: Server error
 */

import wixData from 'wix-data';
import { requireAdmin } from '@/lib/auth-security';

export async function DELETE({ request, cookies }: { request: Request; cookies: any }) {
  // ADMIN GATE: this route mutates the availability calendar with
  // suppressAuth: true, bypassing collection permissions entirely.
  // It previously had no auth at all - anyone who knew the URL could
  // add, alter or wipe the entire booking calendar.
  const denied = await requireAdmin(cookies, request, 'delete booking availability');
  if (denied) return denied;

  const startTime = new Date();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[DELETE:${requestId}] DELETE /api/booking-availability/delete - Starting`);
    
    const body = await request.json() as { id: string };
    console.log(`[DELETE:${requestId}] Received delete request for id: ${body.id}`);

    // Validate required fields
    if (!body.id) {
      console.warn(`[DELETE:${requestId}] Validation failed: Missing id`);
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await wixData.remove('bookingavailability', body.id, { suppressAuth: true });

    const duration = new Date().getTime() - startTime.getTime();
    console.log(`[DELETE:${requestId}] ✓ Successfully deleted slot ${body.id} in ${duration}ms`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = new Date().getTime() - startTime.getTime();
    console.error(`[DELETE:${requestId}] ✗ Failed after ${duration}ms:`, error);
    console.error(`[DELETE:${requestId}] Error details:`, error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
