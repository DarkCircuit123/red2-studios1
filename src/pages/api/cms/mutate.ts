import type { APIRoute } from 'astro';
import { mutate } from '@/api/cms/mutate';
import { requireAdmin } from '@/lib/auth-security';

const MAX_BODY_BYTES = 256 * 1024;
const MAX_COLLECTION_ID_LENGTH = 64;
const MAX_ITEM_ID_LENGTH = 200;
const ALLOWED_ACTIONS = new Set(['create', 'update', 'delete']);

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'cms-mutate');
  if (denied) return denied;

  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: 'Request is too large.' }, 413);

    const body = await context.request.json().catch(() => null) as {
      action?: unknown;
      collectionId?: unknown;
      itemData?: unknown;
      itemId?: unknown;
    } | null;

    if (!body || typeof body.action !== 'string' || !ALLOWED_ACTIONS.has(body.action)) return json({ error: 'Invalid mutation action.' }, 400);
    if (typeof body.collectionId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(body.collectionId)) return json({ error: 'Invalid collection ID.' }, 400);
    if (body.itemId !== undefined && (typeof body.itemId !== 'string' || body.itemId.length > MAX_ITEM_ID_LENGTH)) return json({ error: 'Invalid item ID.' }, 400);
    if (body.itemData !== undefined && (!body.itemData || typeof body.itemData !== 'object' || Array.isArray(body.itemData))) return json({ error: 'Invalid item data.' }, 400);

    const result = await mutate({
      action: body.action as 'create' | 'update' | 'delete',
      collectionId: body.collectionId,
      itemData: body.itemData as Record<string, any> | undefined,
      itemId: body.itemId as string | undefined,
    });

    if (!result.success) return json({ error: 'CMS mutation failed.' }, 400);
    return json({ success: true, data: result.data }, 200);
  } catch (error) {
    console.error('[CMS_MUTATE_ENDPOINT] Failed:', error instanceof Error ? error.message : String(error));
    return json({ error: 'CMS mutation failed.' }, 500);
  }
};
