import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { requireAdmin } from '@/lib/auth-security';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface UploadHeroResponse {
  success: true;
  mediaUrl: string;
  fileId: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

function isSafeWixMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex).toLowerCase() : '.jpg';
  const nameWithoutExt = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  const sanitized = nameWithoutExt
    .replace(/[()[\]{}]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 180);
  return `${sanitized || `hero_${Date.now()}`}${ext}`;
}

function jsonResponse(body: ErrorResponse | UploadHeroResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const denied = await requireAdmin(context.cookies, context.request, 'upload-hero');
    if (denied) return denied;

    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_SIZE_BYTES + 1024 * 1024) {
      return jsonResponse({ success: false, error: 'Upload is too large. Maximum file size is 10MB.' }, 413);
    }

    const formData = await context.request.formData();
    const entry = formData.get('file');
    if (!(entry instanceof File)) {
      return jsonResponse({ success: false, error: 'No image file was provided.' }, 400);
    }

    if (entry.size <= 0 || entry.size > MAX_SIZE_BYTES) {
      return jsonResponse({
        success: false,
        error: entry.size > MAX_SIZE_BYTES ? 'Image is too large. Maximum file size is 10MB.' : 'Image file is empty.',
      }, 400);
    }

    const mimeType = entry.type.trim().toLowerCase();
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return jsonResponse({ success: false, error: 'File type not supported. Allowed: JPEG, PNG, WebP.' }, 400);
    }

    const sanitizedFileName = sanitizeFilename(entry.name);
    const elevatedGenerateUrl = auth.elevate(files.generateFileUploadUrl);
    const uploadUrlResponse = await elevatedGenerateUrl(mimeType, { fileName: sanitizedFileName });

    if (!isSafeWixMediaUrl(uploadUrlResponse?.uploadUrl)) {
      console.error(`[UPLOAD_HERO] ${requestId} generated an invalid upload URL`);
      return jsonResponse({ success: false, error: 'Wix returned an invalid upload destination.' }, 502);
    }

    const uploadUrl = new URL(uploadUrlResponse.uploadUrl);
    uploadUrl.searchParams.set('filename', sanitizedFileName);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: await entry.arrayBuffer(),
    });

    if (!uploadResponse.ok) {
      console.error(`[UPLOAD_HERO] ${requestId} Wix upload returned HTTP ${uploadResponse.status}`);
      return jsonResponse({ success: false, error: 'Wix rejected the hero image upload. Please try again.' }, 502);
    }

    const uploadResult = await uploadResponse.json().catch(() => null);
    const mediaUrl = uploadResult?.file?.url;
    const fileId = uploadResult?.file?.id;

    if (!isSafeWixMediaUrl(mediaUrl) || typeof fileId !== 'string' || !fileId) {
      console.error(`[UPLOAD_HERO] ${requestId} Wix returned an invalid media result`);
      return jsonResponse({ success: false, error: 'Wix returned an invalid media result.' }, 502);
    }

    console.log(`[UPLOAD_HERO] ${requestId} completed`, {
      mimeType,
      sizeBytes: entry.size,
      fileId,
      durationMs: Date.now() - startTime,
    });

    return jsonResponse({ success: true, mediaUrl, fileId }, 200);
  } catch (error) {
    console.error(`[UPLOAD_HERO] ${requestId} failed`, {
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    return jsonResponse({ success: false, error: 'Hero image upload failed. Please try again.' }, 500);
  }
};
