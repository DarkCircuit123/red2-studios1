/**
 * Portfolio Scan Endpoint (ADMIN ONLY)
 * Fetches portfolio image fields for the one-time base64 migration utility.
 */

import type { APIRoute } from 'astro';
import { cmsService } from '@/integrations/cms/service';
import { requireAdmin, readSecret, constantTimeEqual } from '@/lib/auth-security';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

async function verifyMigrationAccess(context: Parameters<APIRoute>[0]): Promise<Response | null> {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-scan');
  if (denied) return denied;

  const supplied = context.request.headers.get('x-migration-secret') || '';
  const expected = await readSecret('PORTFOLIO_MIGRATION_SECRET');
  if (!expected) {
    console.error('[PORTFOLIO_SCAN] PORTFOLIO_MIGRATION_SECRET is not configured');
    return new Response(JSON.stringify({ success: false, error: 'Migration is not configured.' }), { status: 503, headers: JSON_HEADERS });
  }
  if (!supplied || !constantTimeEqual(supplied, expected)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }
  return null;
}

export const GET: APIRoute = async (context) => {
  const denied = await verifyMigrationAccess(context);
  if (denied) return denied;

  try {
    const result = await cmsService.getAll<Record<string, unknown>>('portfolio', {}, { limit: 1000, suppressAuth: true });
    const items = (result.items || []).map((item) => ({
      _id: typeof item._id === 'string' ? item._id : '',
      projectName: typeof item.projectName === 'string' ? item.projectName : '',
      mainImage: typeof item.mainImage === 'string' ? item.mainImage : '',
      galleryImage1: typeof item.galleryImage1 === 'string' ? item.galleryImage1 : '',
      galleryImage2: typeof item.galleryImage2 === 'string' ? item.galleryImage2 : '',
      galleryImage3: typeof item.galleryImage3 === 'string' ? item.galleryImage3 : '',
    })).filter((item) => item._id);

    const analysis = items.map((item) => ({
      _id: item._id,
      projectName: item.projectName,
      hasBase64: {
        mainImage: item.mainImage.startsWith('data:image/'),
        galleryImage1: item.galleryImage1.startsWith('data:image/'),
        galleryImage2: item.galleryImage2.startsWith('data:image/'),
        galleryImage3: item.galleryImage3.startsWith('data:image/'),
      },
    }));

    return new Response(JSON.stringify({ success: true, totalItems: items.length, itemsWithBase64: analysis.filter((x) => Object.values(x.hasBase64).some(Boolean)).length, items, analysis }), { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    console.error('[PORTFOLIO_SCAN] Read failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Could not scan portfolio.' }), { status: 500, headers: JSON_HEADERS });
  }
};
