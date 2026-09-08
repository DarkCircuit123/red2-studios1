import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { requireAdmin } from '@/lib/auth-security';
import { IMAGE_UPLOAD_CONFIG, MUSIC_UPLOAD_CONFIG, validateFileAgainstConfig } from '@/lib/upload-config';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_FILE_NAME_LENGTH = 255;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim().replace(/[\r\n]/g, '');
  const lastDot = trimmed.lastIndexOf('.');
  const ext = lastDot > 0 ? trimmed.slice(lastDot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
  const base = (lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_FILE_NAME_LENGTH - ext.length);
  return `${base || `upload_${Date.now()}`}${ext}`;
}

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'generate-upload-url');
  if (denied) return denied;

  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return jsonResponse({ error: 'Request is too large.' }, 413);

    const body = await context.request.json().catch(() => null) as {
      fileName?: unknown;
      fileType?: unknown;
      kind?: unknown;
    } | null;

    const fileName = typeof body?.fileName === 'string' ? body.fileName : '';
    const fileType = typeof body?.fileType === 'string' ? body.fileType.trim().toLowerCase() : '';
    const kind = body?.kind === 'music' ? 'music' : body?.kind === 'image' ? 'image' : null;

    if (!kind || !fileName || fileName.length > MAX_FILE_NAME_LENGTH) {
      return jsonResponse({ error: 'Invalid upload request.' }, 400);
    }

    const config = kind === 'music' ? MUSIC_UPLOAD_CONFIG : IMAGE_UPLOAD_CONFIG;
    const validation = validateFileAgainstConfig({ type: fileType, size: 1 }, config);
    if (!validation.valid) return jsonResponse({ error: validation.error }, 400);

    const sanitizedFileName = sanitizeFilename(fileName);
    const generateUploadUrl = auth.elevate(files.generateFileUploadUrl);
    const result = await generateUploadUrl(fileType, { fileName: sanitizedFileName });

    if (!result?.uploadUrl || typeof result.uploadUrl !== 'string') {
      console.error('[GENERATE_UPLOAD_URL] Wix returned no upload URL');
      return jsonResponse({ error: 'Wix did not return an upload destination.' }, 502);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(result.uploadUrl);
    } catch {
      return jsonResponse({ error: 'Wix returned an invalid upload destination.' }, 502);
    }

    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) {
      console.error('[GENERATE_UPLOAD_URL] Wix returned an unsafe upload URL');
      return jsonResponse({ error: 'Wix returned an unsafe upload destination.' }, 502);
    }

    return jsonResponse({ uploadUrl: result.uploadUrl, fileName: sanitizedFileName }, 200);
  } catch (error) {
    console.error('[GENERATE_UPLOAD_URL] Failed:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Could not prepare the upload. Please try again.' }, 500);
  }
};
