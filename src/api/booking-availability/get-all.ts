import { cmsService } from '@/integrations/cms/service';
import type { BookingAvailability } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  const requestId = crypto.randomUUID();
  try {
    const denied = await requireAdmin(cookies, request, 'get booking availability'); if (denied) return denied;
    const url = new URL(request.url);
    const rawLimit = Number.parseInt(url.searchParams.get('limit') || '500', 10); const rawSkip = Number.parseInt(url.searchParams.get('skip') || '0', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 500; const skip = Number.isFinite(rawSkip) ? Math.max(rawSkip, 0) : 0;
    const results = await cmsService.getAll<BookingAvailability>('bookingavailability', {}, { limit, skip, suppressAuth: true });
    return new Response(JSON.stringify({ success: true, data: results.items || [], totalCount: results.totalCount || 0, hasNext: results.hasNext || false }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(`[GET_ALL:${requestId}] Failed:`, error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch booking availability' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}
