import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Splashpage } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'admin-splash-read');
  if (denied) return denied;
  try {
    const result = await BaseCrudService.getAll<Splashpage>('splashpage', {}, { limit: 100 });
    const active = (result.items || []).find((item) => item.isActive) || null;
    return new Response(JSON.stringify({ success: true, item: active }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[ADMIN_SPLASH] Read failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Could not load the splash page logo.' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};
