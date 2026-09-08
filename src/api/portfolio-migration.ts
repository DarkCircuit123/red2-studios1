/**
 * One-time Portfolio base64 image migration endpoint.
 * Requires both the signed admin session and PORTFOLIO_MIGRATION_SECRET.
 */

import type { APIRoute } from 'astro';
import { requireAdmin, readSecret, constantTimeEqual } from '@/lib/auth-security';
import { GET as portfolioScanHandler } from '@/api/portfolio-scan';
import { POST as portfolioUpdateHandler } from '@/api/portfolio-update';
import { POST as mediaUploadHandler } from '@/api/media/upload-hero';

const MAX_MIGRATED_IMAGE_BYTES = 10 * 1024 * 1024;
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function isBase64ImageData(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(value);
}

function base64ToFile(value: string, fileName: string): File {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');
  const mimeType = match[1].toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) throw new Error('Unsupported image format.');
  const binary = atob(match[2]);
  if (binary.length > MAX_MIGRATED_IMAGE_BYTES) throw new Error('Image exceeds the migration size limit.');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mimeType });
}

async function uploadBase64Image(value: string, fileName: string, cookieHeader: string, migrationSecret: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', base64ToFile(value, fileName));
  const request = new Request('https://internal.invalid/api/media/upload-hero', {
    method: 'POST',
    body: formData,
    headers: { Cookie: cookieHeader, 'x-migration-secret': migrationSecret },
  });
  const response = await mediaUploadHandler({ request } as unknown as Parameters<typeof mediaUploadHandler>[0]);
  if (!response.ok) throw new Error('Media upload failed.');
  const result = await response.json() as { mediaUrl?: unknown };
  if (typeof result.mediaUrl !== 'string' || !result.mediaUrl) throw new Error('Media upload returned no URL.');
  return result.mediaUrl;
}

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'portfolio-migration');
  if (denied) return denied;

  const suppliedSecret = context.request.headers.get('x-migration-secret') || '';
  const migrationSecret = await readSecret('PORTFOLIO_MIGRATION_SECRET');
  if (!migrationSecret) return new Response(JSON.stringify({ success: false, error: 'Migration is not configured.' }), { status: 503, headers: JSON_HEADERS });
  if (!suppliedSecret || !constantTimeEqual(suppliedSecret, migrationSecret)) return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });

  try {
    const cookieHeader = context.request.headers.get('cookie') || '';
    if (!cookieHeader) return new Response(JSON.stringify({ success: false, error: 'Admin session cookie is required.' }), { status: 401, headers: JSON_HEADERS });

    const scanRequest = new Request('https://internal.invalid/api/portfolio-scan', { headers: { Cookie: cookieHeader, 'x-migration-secret': migrationSecret } });
    const scanResponse = await portfolioScanHandler({ request: scanRequest } as unknown as Parameters<typeof portfolioScanHandler>[0]);
    if (!scanResponse.ok) throw new Error('Portfolio scan failed.');
    const scan = await scanResponse.json() as { items?: Array<Record<string, unknown>> };
    const items = Array.isArray(scan.items) ? scan.items : [];

    let migratedFields = 0;
    let failedFields = 0;
    const logs: Array<{ itemId: string; field: string; status: 'success' | 'error'; message: string }> = [];

    for (const item of items) {
      const itemId = typeof item._id === 'string' ? item._id : '';
      if (!itemId) continue;
      const updates: Record<string, string> = {};

      for (const field of ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3']) {
        const value = item[field];
        if (!isBase64ImageData(value)) continue;
        try {
          const extension = value.slice(5, value.indexOf(';')).split('/')[1] || 'jpg';
          const mediaUrl = await uploadBase64Image(value, `portfolio_${itemId}_${field}.${extension}`, cookieHeader, migrationSecret);
          updates[field] = mediaUrl;
          migratedFields++;
          logs.push({ itemId, field, status: 'success', message: 'Migrated to Wix Media.' });
        } catch (error) {
          failedFields++;
          logs.push({ itemId, field, status: 'error', message: error instanceof Error ? error.message : 'Migration failed.' });
        }
      }

      if (Object.keys(updates).length) {
        const updateRequest = new Request('https://internal.invalid/api/portfolio-update', {
          method: 'POST',
          headers: { Cookie: cookieHeader, 'x-migration-secret': migrationSecret, 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, updates }),
        });
        const updateResponse = await portfolioUpdateHandler({ request: updateRequest } as unknown as Parameters<typeof portfolioUpdateHandler>[0]);
        if (!updateResponse.ok) {
          failedFields += Object.keys(updates).length;
          migratedFields -= Object.keys(updates).length;
          logs.push({ itemId, field: 'all', status: 'error', message: 'CMS update failed.' });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, totalItems: items.length, migratedFields, failedFields, logs }), { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    console.error('[PORTFOLIO_MIGRATION] Failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Migration failed.' }), { status: 500, headers: JSON_HEADERS });
  }
};
