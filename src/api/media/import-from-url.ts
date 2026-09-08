import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { IMAGE_UPLOAD_CONFIG, MUSIC_UPLOAD_CONFIG, validateFileAgainstConfig } from '@/lib/upload-config';
import { isSafeExternalUrl } from '@/lib/safe-external-url';
import { requireAdmin } from '@/lib/auth-security';

const MAX_REQUEST_BYTES = 64 * 1024;
const PROBE_TIMEOUT_MS = 12_000;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function extensionMimeGuess(url: string): string | undefined {
  const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    tiff: 'image/tiff', tif: 'image/tiff', bmp: 'image/bmp', ico: 'image/x-icon', heic: 'image/heic', heif: 'image/heif',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', webm: 'audio/webm',
  };
  return ext ? map[ext] : undefined;
}

function safeMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

async function probeUrl(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: controller.signal });
    if (response.status === 405 || response.status === 501) {
      if (!isSafeExternalUrl(url)) throw new Error('Unsafe URL');
      response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal,
      });
    }
    if (response.status >= 300 && response.status < 400) throw new Error('External URL redirects are not supported.');
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const denied = await requireAdmin(context.cookies, context.request, 'import-from-url');
    if (denied) return denied;

    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_REQUEST_BYTES) return jsonResponse({ error: 'Request is too large.' }, 413);

    const body = await context.request.json().catch(() => null) as { url?: unknown; kind?: unknown } | null;
    const rawUrl = body?.url;
    const kind = body?.kind === 'music' ? 'music' : 'image';
    const config = kind === 'music' ? MUSIC_UPLOAD_CONFIG : IMAGE_UPLOAD_CONFIG;

    if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0 || rawUrl.trim().length > 2048) {
      return jsonResponse({ error: 'Paste a valid file link first.' }, 400);
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return jsonResponse({ error: "That's not a valid web address." }, 400);
    }

    if (!isSafeExternalUrl(parsed.toString())) {
      console.warn(`[IMPORT_FROM_URL] ${requestId} rejected unsafe URL`);
      return jsonResponse({ error: 'That link points to a private or reserved address and cannot be imported.' }, 400);
    }

    let probeResponse: Response;
    try {
      probeResponse = await probeUrl(parsed.toString());
    } catch (error) {
      console.warn(`[IMPORT_FROM_URL] ${requestId} URL probe failed`, {
        reason: error instanceof Error ? error.message : String(error),
      });
      return jsonResponse({ error: 'The link could not be safely reached. Use a direct file URL without redirects.' }, 400);
    }

    if (!probeResponse.ok) return jsonResponse({ error: `That link returned HTTP ${probeResponse.status}.` }, 400);

    const headerContentType = probeResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const contentLengthHeader = probeResponse.headers.get('content-length');
    const parsedSize = contentLengthHeader ? Number(contentLengthHeader) : undefined;
    const detectedSize = Number.isSafeInteger(parsedSize) && parsedSize >= 0 ? parsedSize : undefined;
    const detectedType = headerContentType || extensionMimeGuess(parsed.pathname);

    if (!detectedType) return jsonResponse({ error: 'The file type could not be determined.' }, 400);
    if (detectedSize === undefined) return jsonResponse({ error: 'The source did not provide a file size, so it cannot be safely imported.' }, 400);

    const validation = validateFileAgainstConfig({ type: detectedType, size: detectedSize }, config);
    if (!validation.valid) return jsonResponse({ error: validation.error }, 400);

    let fileName: string;
    try {
      const encodedName = parsed.pathname.split('/').pop() || `${kind}-import`;
      fileName = decodeURIComponent(encodedName).replace(/[\r\n]/g, '').slice(0, 180) || `${kind}-import`;
    } catch {
      fileName = `${kind}-import`;
    }

    let importResult;
    try {
      const elevatedImportFile = auth.elevate(files.importFile);
      importResult = await elevatedImportFile(parsed.toString(), {
        mimeType: detectedType,
        displayName: fileName,
        mediaType: kind === 'music' ? 'AUDIO' : 'IMAGE',
      });
    } catch (importError) {
      console.error(`[IMPORT_FROM_URL] ${requestId} Wix import failed`, {
        reason: importError instanceof Error ? importError.message : String(importError),
      });
      return jsonResponse({ error: 'Wix could not import that file. Please verify the direct file URL and try again.' }, 502);
    }

    const mediaUrl = importResult?.file?.url;
    const mediaId = importResult?.file?._id;
    if (!safeMediaUrl(mediaUrl) || typeof mediaId !== 'string' || !mediaId) {
      console.error(`[IMPORT_FROM_URL] ${requestId} Wix returned an invalid media result`);
      return jsonResponse({ error: 'Wix returned an invalid media result.' }, 502);
    }

    console.log(`[IMPORT_FROM_URL] ${requestId} completed`, {
      kind,
      detectedType,
      detectedSizeBytes: detectedSize,
      mediaId,
      durationMs: Date.now() - startTime,
    });

    return jsonResponse({
      success: true,
      mediaUrl,
      mediaId,
      fileName,
      detectedType,
      detectedSizeBytes: detectedSize,
      pending: importResult.file?.operationStatus === 'PENDING',
      message: 'Link verified and imported into Media Manager.',
    }, 200);
  } catch (error) {
    console.error(`[IMPORT_FROM_URL] ${requestId} failed`, {
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    return jsonResponse({ error: 'Import failed. Please try again.' }, 500);
  }
};
