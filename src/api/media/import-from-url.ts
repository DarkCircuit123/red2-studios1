import type { APIRoute } from 'astro';
import { getSecureContext } from '@wix/sdk';
import { media } from '@wix/media';
import { IMAGE_UPLOAD_CONFIG, MUSIC_UPLOAD_CONFIG, validateFileAgainstConfig } from '@/lib/upload-config';

/**
 * Import from URL API - Lets the admin paste a link to an image or audio file
 * 
 * This endpoint:
 * 1. Tests the link before importing (reachability, content-type, size)
 * 2. Imports the file into Wix Media Manager
 * 3. Returns the permanent Wix media URL (never stores foreign URLs)
 * 4. Includes structured logging for debugging
 * 
 * The link itself is never stored directly: once it passes testing, the
 * file is imported into Wix Media Manager (files.importFile), and the
 * Media Manager's own permanent URL is what gets saved. This matches
 * the rest of the upload system - never trust a foreign URL to keep
 * working forever, always end up with a real Wix media URL.
 */

function extensionMimeGuess(url: string): string | undefined {
  const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', svg: 'image/svg+xml', tiff: 'image/tiff', tif: 'image/tiff',
    bmp: 'image/bmp', ico: 'image/x-icon', heic: 'image/heic', heif: 'image/heif',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', webm: 'audio/webm',
  };
  return ext ? map[ext] : undefined;
}

interface ImportFromUrlResponse {
  success: true;
  mediaUrl: string;
  mediaId: string;
  fileName: string;
  detectedType: string;
  detectedSizeBytes?: number;
  pending: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
}

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const request = context.request;
    const body = await request.json().catch(() => null);
    const rawUrl: string | undefined = body?.url;
    const kind: 'image' | 'music' = body?.kind === 'music' ? 'music' : 'image';
    const config = kind === 'music' ? MUSIC_UPLOAD_CONFIG : IMAGE_UPLOAD_CONFIG;

    // Structured logging: request started
    console.log(`[IMPORT_FROM_URL] Request ${requestId} started`, {
      kind,
      rawUrl: rawUrl ? rawUrl.substring(0, 100) : undefined,
      timestamp: new Date().toISOString(),
    });

    if (!rawUrl || typeof rawUrl !== 'string') {
      console.warn(`[IMPORT_FROM_URL] Request ${requestId} no URL provided`, {
        timestamp: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ error: 'Paste a link first.' } as ErrorResponse), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      console.warn(`[IMPORT_FROM_URL] Request ${requestId} invalid URL format`, {
        rawUrl: rawUrl.substring(0, 100),
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: `That's not a valid web address: "${rawUrl}"` } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.warn(`[IMPORT_FROM_URL] Request ${requestId} invalid protocol`, {
        protocol: parsed.protocol,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: 'Link must start with http:// or https://' } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Test the link before importing anything ---
    console.log(`[IMPORT_FROM_URL] Request ${requestId} testing URL`, {
      url: parsed.toString().substring(0, 100),
      kind,
      timestamp: new Date().toISOString(),
    });

    let probeResponse: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        probeResponse = await fetch(parsed.toString(), { method: 'HEAD', signal: controller.signal });
        // Some servers don't implement HEAD properly (405/501, or lie about
        // content-length) - fall back to a GET and just not read the body.
        if (!probeResponse.ok && (probeResponse.status === 405 || probeResponse.status === 501)) {
          probeResponse = await fetch(parsed.toString(), { method: 'GET', signal: controller.signal });
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (fetchError) {
      const isAbort = fetchError instanceof Error && fetchError.name === 'AbortError';
      console.warn(`[IMPORT_FROM_URL] Request ${requestId} URL test failed`, {
        url: parsed.toString().substring(0, 100),
        isAbort,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          error: isAbort
            ? "That link took too long to respond and timed out. It may be down or blocking automated requests."
            : "Couldn't reach that link at all. Double-check the URL, or the host may be blocking this request.",
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!probeResponse.ok) {
      console.warn(`[IMPORT_FROM_URL] Request ${requestId} URL returned error`, {
        url: parsed.toString().substring(0, 100),
        status: probeResponse.status,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: `That link returned an error (HTTP ${probeResponse.status}). It may be private, moved, or broken.` } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const headerContentType = probeResponse.headers.get('content-type')?.split(';')[0].trim();
    const contentLengthHeader = probeResponse.headers.get('content-length');
    const detectedType = headerContentType || extensionMimeGuess(parsed.pathname);
    const detectedSize = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;

    if (!detectedType) {
      console.warn(`[IMPORT_FROM_URL] Request ${requestId} could not detect file type`, {
        url: parsed.toString().substring(0, 100),
        headerContentType,
        pathname: parsed.pathname,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          error: "Couldn't determine what kind of file that link points to (no content-type header, no recognizable file extension). Try a direct link ending in the file's extension, e.g. .mp3 or .jpg.",
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateFileAgainstConfig(
      { type: detectedType, size: detectedSize ?? 0 },
      config
    );
    if (!validation.valid) {
      console.warn(`[IMPORT_FROM_URL] Request ${requestId} file validation failed`, {
        url: parsed.toString().substring(0, 100),
        detectedType,
        detectedSize,
        error: validation.error,
        timestamp: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ error: validation.error } as ErrorResponse), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Link passed testing - import it for real ---
    const fileName = decodeURIComponent(parsed.pathname.split('/').pop() || `${kind}-import`);
    console.log(`[IMPORT_FROM_URL] Request ${requestId} URL test passed, importing`, {
      url: parsed.toString().substring(0, 100),
      fileName,
      detectedType,
      detectedSizeBytes: detectedSize,
      kind,
      timestamp: new Date().toISOString(),
    });

    let importResult;
    try {
      const wixContext = getSecureContext();
      const mediaClient = media(wixContext);
      importResult = await mediaClient.files.importFile(parsed.toString(), {
        mimeType: detectedType,
        displayName: fileName,
        mediaType: kind === 'music' ? 'AUDIO' : 'IMAGE',
      });
      console.log(`[IMPORT_FROM_URL] Request ${requestId} file imported successfully`, {
        fileName,
        mediaId: importResult?.file?._id,
        timestamp: new Date().toISOString(),
      });
    } catch (importError) {
      console.error(`[IMPORT_FROM_URL] Request ${requestId} import failed`, {
        url: parsed.toString().substring(0, 100),
        fileName,
        error: importError instanceof Error ? importError.message : String(importError),
        stack: importError instanceof Error ? importError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to import file: ${importError instanceof Error ? importError.message : String(importError)}`);
    }

    const mediaUrl = importResult?.file?.url;
    const mediaId = importResult?.file?._id;
    if (!mediaUrl) {
      console.error(`[IMPORT_FROM_URL] Request ${requestId} no media URL in response`, {
        fileName,
        response: importResult,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: 'The link checked out, but Wix Media Manager could not import it. Try again in a moment.' } as ErrorResponse),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify media URL is a real Wix domain
    const mediaUrlObj = new URL(mediaUrl);
    const isValidWixDomain = 
      mediaUrlObj.hostname.includes('wix') ||
      mediaUrlObj.hostname.includes('files') ||
      mediaUrlObj.hostname.includes('media');

    if (!isValidWixDomain) {
      console.error(`[IMPORT_FROM_URL] Request ${requestId} invalid media URL domain`, {
        mediaUrl,
        hostname: mediaUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid media URL domain: ${mediaUrlObj.hostname}`);
    }

    const duration = Date.now() - startTime;

    // Structured logging: success
    console.log(`[IMPORT_FROM_URL] Request ${requestId} completed successfully`, {
      fileName,
      detectedType,
      detectedSizeBytes: detectedSize,
      mediaId,
      mediaUrlDomain: mediaUrlObj.hostname,
      pending: importResult.file?.operationStatus === 'PENDING',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        mediaUrl,
        mediaId,
        fileName,
        detectedType,
        detectedSizeBytes: detectedSize,
        pending: importResult.file?.operationStatus === 'PENDING',
        message: 'Link verified and imported into Media Manager.',
      } as ImportFromUrlResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Structured logging: error with full stack
    console.error(`[IMPORT_FROM_URL] Request ${requestId} failed`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    const errorMessage = error instanceof Error ? error.message : 'Failed to import from link';
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
