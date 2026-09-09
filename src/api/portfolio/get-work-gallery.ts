import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Portfolio } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-get-work-gallery');
  if (denied) return denied;

  try {
    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 10000 });
    const items = (result.items || [])
      .filter((item) => Number.isInteger(item.displayOrder) && item.displayOrder >= 1)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Log the actual count for debugging
    console.log('[portfolio-get-work-gallery] Loaded items:', {
      totalCount: items.length,
      highestSlot: items.length > 0 ? items[items.length - 1].displayOrder : 0,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[portfolio-get-work-gallery] Error:', error);
    return new Response(JSON.stringify({ success: false, items: [], error: 'Failed to load work gallery' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
