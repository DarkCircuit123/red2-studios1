/**
 * Backend endpoint for fetching all bookings
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint is called from the frontend BookingManagerPro component
 * and uses backend-only APIs with elevated permissions to read from
 * the bookings collection.
 * 
 * CRITICAL: The bookings collection has read: ADMIN permissions.
 * suppressAuth: true is required to bypass this restriction on the backend.
 */

// Import CMS service for backend data access
import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities/index';
import { verifyAdminToken, getClientIP } from '@/lib/auth-security';

export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[GET_BOOKINGS:${requestId}] Starting request`);
    
    // ADMIN GATE. This endpoint queries with suppressAuth: true, so it
    // bypasses collection permissions entirely and returns every client's
    // name, email, phone number and message. It previously had no
    // authentication of any kind - anyone who knew the URL could GET the
    // full client list. Locking the bookings collection to PRIVILEGED
    // read would have been pointless while this route stayed open.
    const sessionToken = cookies?.get?.('admin_session')?.value;
    console.log(`[GET_BOOKINGS:${requestId}] Session token present: ${!!sessionToken}`);
    
    const validation = sessionToken
      ? await verifyAdminToken(sessionToken)
      : { valid: false as const };

    if (!validation.valid) {
      console.warn(`[GET_BOOKINGS:${requestId}] [SECURITY] Unauthenticated get-bookings attempt from IP: ${getClientIP(request.headers)}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GET_BOOKINGS:${requestId}] ✓ Admin authenticated as: ${validation.username}`);
    console.log(`[GET_BOOKINGS:${requestId}] Attempting to fetch bookings collection with suppressAuth: true`);

    // Use BaseCrudService to fetch bookings with suppressAuth to bypass permission restrictions
    // suppressAuth: true tells Wix to bypass collection permission checks on the backend
    // This is REQUIRED because the bookings collection has read: ADMIN permissions
    const results = await BaseCrudService.getAll<Bookings>('bookings', {}, { limit: 500, suppressAuth: true });

    console.log(`[GET_BOOKINGS:${requestId}] ✓ Successfully fetched ${results.items?.length || 0} bookings (total: ${results.totalCount})`);

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
    console.error(`[GET_BOOKINGS:${requestId}] ✗ Error fetching bookings:`, error);
    console.error(`[GET_BOOKINGS:${requestId}] Error type:`, error instanceof Error ? error.constructor.name : typeof error);
    console.error(`[GET_BOOKINGS:${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[GET_BOOKINGS:${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    // Check if this is a WDE0027 permission error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('WDE0027') || errorMessage.includes('permissions')) {
      console.error(`[GET_BOOKINGS:${requestId}] CRITICAL: Permission error detected - suppressAuth may not be working`);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
