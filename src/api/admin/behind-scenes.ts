import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { BehindTheScenes } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'admin-behind-scenes-read');
  if (denied) return denied;
  try {
    const result = await BaseCrudService.getAll<BehindTheScenes>('behindthescenes', {}, { limit: 100 });
    return new Response(JSON.stringify({ success: true, items: result.items || [] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[ADMIN_BEHIND] Read failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Could not load behind-the-scenes items.' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};
