import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Portfolio } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

const MAX_SLOT = 1000;
const MAX_BODY_BYTES = 32 * 1024;

interface UpsertRequest {
  displayOrder: number;
  image: string;
  caption?: string;
  altText?: string;
  portfolioItemId?: string;
}

interface UpsertResponse {
  success: true;
  itemId: string;
  action: 'created' | 'updated';
  displayOrder: number;
}

interface ErrorResponse {
  success: false;
  error: string;
}

function jsonResponse(body: UpsertResponse | ErrorResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function isAllowedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-upsert');
  if (denied) return denied;

  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return jsonResponse({ success: false, error: 'Request is too large.' }, 413);

    const body = await context.request.json().catch(() => null) as Partial<UpsertRequest> | null;
    if (!body) return jsonResponse({ success: false, error: 'Invalid request body.' }, 400);

    const displayOrder = Number(body.displayOrder);
    const image = typeof body.image === 'string' ? body.image.trim() : '';
    const caption = typeof body.caption === 'string' ? body.caption.trim().slice(0, 500) : '';
    const altText = typeof body.altText === 'string' ? body.altText.trim().slice(0, 500) : '';
    const portfolioItemId = typeof body.portfolioItemId === 'string' ? body.portfolioItemId.trim().slice(0, 200) : 'work-gallery';

    if (!Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > MAX_SLOT) {
      return jsonResponse({ success: false, error: `Slot number must be an integer from 1 to ${MAX_SLOT}.` }, 400);
    }

    if (!image || image.length > 4096 || !isAllowedMediaUrl(image)) {
      return jsonResponse({ success: false, error: 'A valid HTTPS media URL is required.' }, 400);
    }

    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: MAX_SLOT });
    const existingRecord = result.items?.find((item) => item.displayOrder === displayOrder);

    if (existingRecord?._id) {
      await BaseCrudService.update<Portfolio>('portfolioimages', {
        _id: existingRecord._id,
        image,
        caption: caption || existingRecord.caption || '',
        altText: altText || existingRecord.altText || '',
        displayOrder,
        portfolioItemId: portfolioItemId || existingRecord.portfolioItemId || 'work-gallery',
      });

      return jsonResponse({ success: true, itemId: existingRecord._id, action: 'updated', displayOrder }, 200);
    }

    const itemId = crypto.randomUUID();
    await BaseCrudService.create<Portfolio>('portfolioimages', {
      _id: itemId,
      displayOrder,
      image,
      caption,
      altText,
      portfolioItemId,
    });

    return jsonResponse({ success: true, itemId, action: 'created', displayOrder }, 200);
  } catch (error) {
    console.error('[PORTFOLIO_UPSERT] Failed:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ success: false, error: 'Could not save the gallery slot.' }, 500);
  }
};
