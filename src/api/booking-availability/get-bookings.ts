/**
 * Backend endpoint for fetching all bookings
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint is called from the frontend BookingManagerPro component
 * and uses backend-only APIs with elevated permissions to read from
 * the bookings collection.
 */

// Import Wix backend APIs - these run with elevated permissions
import wixData from 'wix-data';
import { Bookings } from '@/entities/index';
import { verifyAdminToken, getClientIP } from '@/lib/auth-security';

export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  try {
    // ADMIN GATE. This endpoint queries with suppressAuth: true, so it
    // bypasses collection permissions entirely and returns every client's
    // name, email, phone number and message. It previously had no
    // authentication of any kind - anyone who knew the URL could GET the
    // full client list. Locking the bookings collection to PRIVILEGED
    // read would have been pointless while this route stayed open.
    const sessionToken = cookies?.get?.('admin_session')?.value;
    const validation = sessionToken
      ? await verifyAdminToken(sessionToken)
      : { valid: false as const };

    if (!validation.valid) {
      console.warn(`[SECURITY] Unauthenticated get-bookings attempt from IP: ${getClientIP(request.headers)}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Backend] GET /api/booking-availability/get-bookings - Fetching all bookings');

    // Use wixData.query with elevated permissions (backend-only)
    // This bypasses frontend permission restrictions
    const results = await wixData.query('bookings')
      .limit(500)
      .find({ suppressAuth: true });

    console.log('[Backend] Fetched bookings:', results.items?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: results.items || [],
        totalCount: results.totalCount || 0,
        hasNext: results.hasNext || false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error fetching bookings:', error);
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
