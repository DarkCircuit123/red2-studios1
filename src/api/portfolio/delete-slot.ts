import type { APIRoute } from 'astro';
import { cmsService } from '@/integrations/cms/service';
import type { Portfolio } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

const MAX_SLOT = 1000;
const MAX_BODY_BYTES = 8 * 1024;
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const DELETE: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-delete-slot'); if (denied) return denied;
  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0); if (contentLength > MAX_BODY_BYTES) return json({ success: false, error: 'Request is too large.' }, 413);
    const body = await context.request.json().catch(() => null) as { displayOrder?: unknown } | null; const displayOrder = Number(body?.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > MAX_SLOT) return json({ success: false, error: `displayOrder must be an integer from 1 to ${MAX_SLOT}.` }, 400);
    const result = await cmsService.getAll<Portfolio>('portfolioimages', {}, { limit: MAX_SLOT, suppressAuth: true }); const item = result.items?.find((candidate) => candidate.displayOrder === displayOrder);
    if (!item?._id) return json({ success: true, deleted: false, displayOrder });
    await cmsService.delete('portfolioimages', item._id, { suppressAuth: true }); return json({ success: true, deleted: true, displayOrder, itemId: item._id });
  } catch (error) { console.error('[portfolio-delete-slot] Failed:', error instanceof Error ? error.message : String(error)); return json({ success: false, error: 'Failed to delete gallery slot' }, 500); }
};
