import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Portfolio } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

const MAX_SLOT = 1000;
const MAX_BODY_BYTES = 8 * 1024;

export const DELETE: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-delete-slot');
  if (denied) return denied;

  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ success: false, error: 'Request is too large.' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const body = await context.request.json().catch(() => null) as { displayOrder?: unknown } | null;
    const displayOrder = Number(body?.displayOrder);

    if (!Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > MAX_SLOT) {
      return new Response(JSON.stringify({ success: false, error: `displayOrder must be an integer from 1 to ${MAX_SLOT}.` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: MAX_SLOT });
    const item = result.items?.find((candidate) => candidate.displayOrder === displayOrder);

    if (!item?._id) {
      return new Response(JSON.stringify({ success: true, deleted: false, displayOrder }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    await BaseCrudService.delete('portfolioimages', item._id);

    return new Response(JSON.stringify({ success: true, deleted: true, displayOrder, itemId: item._id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[portfolio-delete-slot] Failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete gallery slot' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
