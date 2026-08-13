/**
 * Backend endpoint for fetching all bookings with admin authentication
 * Used by UpcomingBookings component and other admin interfaces
 * 
 * This endpoint requires admin session and uses elevated permissions
 * to bypass collection permission restrictions.
 */

import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities/index';
import { verifyAdminToken, getClientIP } from '@/lib/auth-security';

export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  try {
    // ADMIN GATE: Verify admin session before allowing access
    const sessionToken = cookies?.get?.('admin_session')?.value;
    const validation = sessionToken
      ? await verifyAdminToken(sessionToken)
      : { valid: false as const };

    if (!validation.valid) {
      console.warn(`[SECURITY] Unauthenticated get-all-bookings attempt from IP: ${getClientIP(request.headers)}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Backend] GET /api/booking-availability/get-all-bookings - Fetching all bookings');

    // Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
    const skip = parseInt(url.searchParams.get('skip') || '0');

    // Use BaseCrudService to fetch bookings with suppressAuth to bypass permission restrictions
    const results = await BaseCrudService.getAll<Bookings>('bookings', {}, { limit, skip, suppressAuth: true });

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
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
