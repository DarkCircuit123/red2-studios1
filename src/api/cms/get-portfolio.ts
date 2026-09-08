import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Portfolio } from '@/entities';

export const GET: APIRoute = async ({ url }) => {
  try {
    const requested = Number.parseInt(url.searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 1000) : 50;
    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit });
    return new Response(JSON.stringify({ success: true, items: result.items || [], totalCount: result.totalCount || 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[GET_PORTFOLIO] Failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Failed to load portfolio.', items: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
