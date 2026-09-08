import type { APIRoute } from 'astro';
import { cmsService } from '@/integrations/cms/service';
import type { ClientsPress } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

const MAX_BODY_BYTES = 32 * 1024; const MAX_SPONSORS = 100; const options = { suppressAuth: true };
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const cleanString = (value: unknown, max: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
const cleanHttpsUrl = (value: unknown, max = 2048) => { const text = cleanString(value, max); if (!text) return undefined; try { const url = new URL(text); return url.protocol === 'https:' && !url.username && !url.password ? text : undefined; } catch { return undefined; } };

export const GET: APIRoute = async (context) => { const denied = await requireAdmin(context.cookies, context.request, 'admin-sponsors-read'); if (denied) return denied; try { const result = await cmsService.getAll<ClientsPress>('clientspress', {}, { limit: MAX_SPONSORS, suppressAuth: true }); return json({ success: true, items: result.items || [] }); } catch (error) { console.error('[ADMIN_SPONSORS] Read failed:', error instanceof Error ? error.message : String(error)); return json({ success: false, error: 'Could not load sponsors.' }, 500); } };

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'admin-sponsors-write'); if (denied) return denied;
  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0); if (contentLength > MAX_BODY_BYTES) return json({ success: false, error: 'Request is too large.' }, 413);
    const body = await context.request.json().catch(() => null) as { action?: unknown; sponsor?: Record<string, unknown>; sponsorId?: unknown } | null; if (!body || typeof body.action !== 'string') return json({ success: false, error: 'Invalid sponsor request.' }, 400);
    if (body.action === 'delete') { if (typeof body.sponsorId !== 'string' || !body.sponsorId || body.sponsorId.length > 200) return json({ success: false, error: 'Sponsor ID is required.' }, 400); await cmsService.delete('clientspress', body.sponsorId, options); return json({ success: true, deleted: true, sponsorId: body.sponsorId }); }
    if (body.action !== 'create' && body.action !== 'update') return json({ success: false, error: 'Unsupported sponsor action.' }, 400);
    const input = body.sponsor; if (!input) return json({ success: false, error: 'Sponsor data is required.' }, 400);
    const clientName = cleanString(input.clientName, 200); if (!clientName) return json({ success: false, error: 'Client name is required.' }, 400);
    const sponsor: Partial<ClientsPress> = { clientName, clientLogo: cleanHttpsUrl(input.clientLogo, 4096), externalLink: cleanHttpsUrl(input.externalLink), dateOfFeature: cleanString(input.dateOfFeature, 32) ? new Date(String(input.dateOfFeature)) : undefined, category: cleanString(input.category, 100), highlightDescription: cleanString(input.highlightDescription, 1000) };
    if (body.action === 'create') { const current = await cmsService.getAll<ClientsPress>('clientspress', {}, { limit: MAX_SPONSORS, suppressAuth: true }); if ((current.items || []).length >= MAX_SPONSORS) return json({ success: false, error: `Sponsor list is limited to ${MAX_SPONSORS} entries.` }, 400); const item = { _id: crypto.randomUUID(), ...sponsor } as ClientsPress; await cmsService.create('clientspress', item, undefined, options); return json({ success: true, item }); }
    if (typeof body.sponsorId !== 'string' || !body.sponsorId || body.sponsorId.length > 200) return json({ success: false, error: 'Sponsor ID is required.' }, 400);
    const existing = await cmsService.getById<ClientsPress>('clientspress', body.sponsorId, undefined, options); if (!existing) return json({ success: false, error: 'Sponsor not found.' }, 404); const item = { ...existing, ...sponsor, _id: body.sponsorId } as ClientsPress; await cmsService.update('clientspress', item, options); return json({ success: true, item });
  } catch (error) { console.error('[ADMIN_SPONSORS] Write failed:', error instanceof Error ? error.message : String(error)); return json({ success: false, error: 'Sponsor operation failed.' }, 500); }
};
