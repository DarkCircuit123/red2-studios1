/**
 * Portfolio Update Endpoint (ADMIN ONLY)
 * Applies the one-time base64 migration updates with a durable backup.
 */

import type { APIRoute } from 'astro';
import { cmsService } from '@/integrations/cms/service';
import { requireAdmin, readSecret, constantTimeEqual } from '@/lib/auth-security';

const MAX_BODY_BYTES = 256 * 1024;
const ALLOWED_FIELDS = new Set(['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3']);
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

async function verifyMigrationAccess(context: Parameters<APIRoute>[0]): Promise<Response | null> {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-update');
  if (denied) return denied;
  const supplied = context.request.headers.get('x-migration-secret') || '';
  const expected = await readSecret('PORTFOLIO_MIGRATION_SECRET');
  if (!expected) return new Response(JSON.stringify({ success: false, error: 'Migration is not configured.' }), { status: 503, headers: JSON_HEADERS });
  if (!supplied || !constantTimeEqual(supplied, expected)) return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  return null;
}

export const POST: APIRoute = async (context) => {
  const denied = await verifyMigrationAccess(context);
  if (denied) return denied;
  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return new Response(JSON.stringify({ success: false, error: 'Request too large.' }), { status: 413, headers: JSON_HEADERS });
    const contentType = context.request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('application/json')) return new Response(JSON.stringify({ success: false, error: 'Content-Type must be application/json.' }), { status: 415, headers: JSON_HEADERS });
    const raw = await context.request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return new Response(JSON.stringify({ success: false, error: 'Request too large.' }), { status: 413, headers: JSON_HEADERS });

    const body = JSON.parse(raw) as { itemId?: unknown; updates?: unknown };
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
    const updates = body.updates && typeof body.updates === 'object' && !Array.isArray(body.updates) ? body.updates as Record<string, unknown> : null;
    if (!itemId || itemId.length > 100 || !updates) return new Response(JSON.stringify({ success: false, error: 'Invalid migration update.' }), { status: 400, headers: JSON_HEADERS });

    const sanitizedUpdates: Record<string, string> = {};
    for (const [field, value] of Object.entries(updates)) {
      if (!ALLOWED_FIELDS.has(field) || typeof value !== 'string' || value.length > 4096) return new Response(JSON.stringify({ success: false, error: 'Invalid migration field.' }), { status: 400, headers: JSON_HEADERS });
      sanitizedUpdates[field] = value;
    }
    if (Object.keys(sanitizedUpdates).length === 0) return new Response(JSON.stringify({ success: false, error: 'No valid fields supplied.' }), { status: 400, headers: JSON_HEADERS });

    const currentItem = await cmsService.getById<Record<string, unknown>>('portfolio', itemId, undefined, { suppressAuth: true });
    if (!currentItem) return new Response(JSON.stringify({ success: false, error: 'Portfolio item not found.' }), { status: 404, headers: JSON_HEADERS });

    await cmsService.create('portfolioimagebackups', {
      _id: crypto.randomUUID(),
      portfolioItemId: itemId,
      mainImage: typeof currentItem.mainImage === 'string' ? currentItem.mainImage : '',
      galleryImage1: typeof currentItem.galleryImage1 === 'string' ? currentItem.galleryImage1 : '',
      galleryImage2: typeof currentItem.galleryImage2 === 'string' ? currentItem.galleryImage2 : '',
      galleryImage3: typeof currentItem.galleryImage3 === 'string' ? currentItem.galleryImage3 : '',
      backupCreatedAt: new Date().toISOString(),
    }, undefined, { suppressAuth: true });

    await cmsService.update('portfolio', { _id: itemId, ...sanitizedUpdates }, { suppressAuth: true });
    return new Response(JSON.stringify({ success: true, itemId, updatedFields: Object.keys(sanitizedUpdates) }), { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    console.error('[PORTFOLIO_UPDATE] Update failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Could not update portfolio item.' }), { status: 500, headers: JSON_HEADERS });
  }
};
