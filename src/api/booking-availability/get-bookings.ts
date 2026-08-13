/**
 * Backend endpoint for fetching all bookings
 * Uses Wix SDK auth.elevate() to bypass collection permission restrictions
 * 
 * This endpoint is called from the frontend BookingManagerPro component
 * and uses the Wix @wix/data API with auth.elevate() to read from
 * the bookings collection with elevated permissions.
 * 
 * CRITICAL: The bookings collection has read: ADMIN permissions.
 * auth.elevate() is required to bypass this restriction on the backend.
 * BaseCrudService.suppressAuth does NOT work on the backend.
 */

import { auth } from '@wix/essentials';
import { items } from '@wix/data';
import { Bookings } from '@/entities/index';
import { verifyAdminToken, getClientIP } from '@/lib/auth-security';

export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[GET_BOOKINGS:${requestId}] Starting request`);
    
    // ADMIN GATE: Verify admin session before allowing access to bookings
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
    console.log(`[GET_BOOKINGS:${requestId}] Attempting to fetch bookings collection with auth.elevate()`);

    // Use Wix SDK auth.elevate() to bypass permission restrictions
    // This is the CORRECT way to read protected collections on the backend
    const elevatedQuery = auth.elevate(items.query);
    const results = await elevatedQuery('bookings').find();

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
      console.error(`[GET_BOOKINGS:${requestId}] CRITICAL: Permission error detected - auth.elevate() may not be working`);
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
