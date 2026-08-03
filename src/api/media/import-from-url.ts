import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { IMAGE_UPLOAD_CONFIG, MUSIC_UPLOAD_CONFIG, validateFileAgainstConfig } from '@/lib/upload-config';

/**
 * Lets the admin paste a link to an image or audio file instead of
 * uploading one from disk. The link is TESTED before anything is
 * imported - reachability, real content-type, real size - each with
 * its own specific message, so a bad link fails with a reason instead
 * of a generic "upload failed."
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

export const POST: APIRoute = async (context) => {
  try {
    const request = context.request;
    const body = await request.json().catch(() => null);
    const rawUrl: string | undefined = body?.url;
    const kind: 'image' | 'music' = body?.kind === 'music' ? 'music' : 'image';
    const config = kind === 'music' ? MUSIC_UPLOAD_CONFIG : IMAGE_UPLOAD_CONFIG;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Paste a link first.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return new Response(
        JSON.stringify({ error: `That's not a valid web address: "${rawUrl}"` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return new Response(
        JSON.stringify({ error: 'Link must start with http:// or https://' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Test the link before importing anything ---
    console.log(`[IMPORT_FROM_URL] Testing ${parsed.toString()} (kind=${kind})`);
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
      return new Response(
        JSON.stringify({
          error: isAbort
            ? "That link took too long to respond and timed out. It may be down or blocking automated requests."
            : "Couldn't reach that link at all. Double-check the URL, or the host may be blocking this request.",
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!probeResponse.ok) {
      return new Response(
        JSON.stringify({ error: `That link returned an error (HTTP ${probeResponse.status}). It may be private, moved, or broken.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const headerContentType = probeResponse.headers.get('content-type')?.split(';')[0].trim();
    const contentLengthHeader = probeResponse.headers.get('content-length');
    const detectedType = headerContentType || extensionMimeGuess(parsed.pathname);
    const detectedSize = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;

    if (!detectedType) {
      return new Response(
        JSON.stringify({
          error: "Couldn't determine what kind of file that link points to (no content-type header, no recognizable file extension). Try a direct link ending in the file's extension, e.g. .mp3 or .jpg.",
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateFileAgainstConfig(
      { type: detectedType, size: detectedSize ?? 0 },
      config
    );
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Link passed testing - import it for real ---
    const fileName = decodeURIComponent(parsed.pathname.split('/').pop() || `${kind}-import`);
    console.log(`[IMPORT_FROM_URL] Link tested OK (type=${detectedType}, size=${detectedSize ?? 'unknown'}). Importing into Wix Media Manager...`);

    let importResult;
    try {
      const filesClient = files();
      importResult = await filesClient.importFile(parsed.toString(), {
        mimeType: detectedType,
        displayName: fileName,
        mediaType: kind === 'music' ? 'AUDIO' : 'IMAGE',
      });
      console.log('[IMPORT_FROM_URL] File imported successfully');
    } catch (importError) {
      console.error('[IMPORT_FROM_URL] Failed to import file:', importError);
      throw new Error(`Failed to import file: ${importError instanceof Error ? importError.message : String(importError)}`);
    }

    const mediaUrl = importResult?.file?.url;
    const mediaId = importResult?.file?._id;
    if (!mediaUrl) {
      return new Response(
        JSON.stringify({ error: 'The link checked out, but Wix Media Manager could not import it. Try again in a moment.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[IMPORT_FROM_URL] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to import from link';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
