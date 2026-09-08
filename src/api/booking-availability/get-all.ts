/**
 * GET /api/booking-availability
 * Fetches all booking availability slots with pagination support.
 * Admin-only endpoint.
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';
import { requireAdmin } from '@/lib/auth-security';

export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const denied = await requireAdmin(cookies, request, 'get booking availability');
    if (denied) return denied;

    const url = new URL(request.url);
    const rawLimit = Number.parseInt(url.searchParams.get('limit') || '500', 10);
    const rawSkip = Number.parseInt(url.searchParams.get('skip') || '0', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 500;
    const skip = Number.isFinite(rawSkip) ? Math.max(rawSkip, 0) : 0;

    const results = await BaseCrudService.getAll<BookingAvailability>(
      'bookingavailability',
      {},
      { limit, skip }
    );

    console.log(`[GET_ALL:${requestId}] Fetched ${results.items.length} slots in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: results.items,
        totalCount: results.totalCount,
        hasNext: results.hasNext,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(`[GET_ALL:${requestId}] Failed:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking availability',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
}
