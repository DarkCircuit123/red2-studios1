import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Portfolio } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

interface DeleteRequest {
  displayOrder: number;
}

export const DELETE: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-delete-slot');
  if (denied) return denied;

  try {
    const body = (await context.request.json()) as Partial<DeleteRequest>;
    const displayOrder = Number(body.displayOrder);

    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      return new Response(JSON.stringify({ success: false, error: 'displayOrder must be a positive integer' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 10000 });
    const item = result.items?.find((candidate) => candidate.displayOrder === displayOrder);

    if (!item?._id) {
      return new Response(JSON.stringify({ success: true, deleted: false, displayOrder }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await BaseCrudService.delete('portfolioimages', item._id);

    return new Response(JSON.stringify({ success: true, deleted: true, displayOrder, itemId: item._id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[portfolio-delete-slot] Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete gallery slot' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
