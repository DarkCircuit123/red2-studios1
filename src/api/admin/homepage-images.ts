import type { APIRoute } from 'astro';
import { cmsService } from '@/integrations/cms/service';
import type { HomepageImages } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

export const GET: APIRoute = async (context) => { const denied = await requireAdmin(context.cookies, context.request, 'admin-homepage-images-read'); if (denied) return denied; try { const result = await cmsService.getAll<HomepageImages>('homepageimages', {}, { limit: 100, suppressAuth: true }); const active = (result.items || []).filter((item) => item.isActive === true).sort((a, b) => new Date(b._createdDate || 0).getTime() - new Date(a._createdDate || 0).getTime())[0] || null; return new Response(JSON.stringify({ success: true, item: active }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); } catch (error) { console.error('[ADMIN_HOMEPAGE_IMAGES] Read failed:', error instanceof Error ? error.message : String(error)); return new Response(JSON.stringify({ success: false, error: 'Could not load homepage images.' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); } };
