import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { IMAGE_UPLOAD_CONFIG, MUSIC_UPLOAD_CONFIG, validateFileAgainstConfig } from '@/lib/upload-config';

/**
 * Issues a signed Wix Media Manager upload URL WITHOUT touching the
 * file's bytes. The request body here is a few hundred bytes of JSON
 * (name/type/size) - never the file itself.
 *
 * Why this exists: the old /api/media/upload and /api/upload-music
 * routes received the whole file over HTTP into this Cloudflare Worker,
 * buffered it with `await file.arrayBuffer()`, and only then forwarded
 * the bytes on to Wix. That means every upload's actual payload passed
 * through, and was held in memory by, our own serverless function -
 * exactly the pattern Cloudflare's own docs warn crashes or truncates
 * on files that aren't tiny (Workers have a memory ceiling well under
 * what a real audio file can hit). It also meant every upload was
 * exposed to any bug, hang, or content-type mixup in our own route -
 * which is what produced the "Unexpected token '<'" failures earlier.
 *
 * The fix: the browser calls this route to get a signed uploadUrl (this
 * route never sees the file), then PUTs the file directly to that URL
 * itself - see src/lib/direct-media-upload.ts. Our Worker is only in
 * the path for a fraction of a second issuing a URL, never for the
 * actual transfer. This is also the flow Wix's own docs describe:
 * "Generates an upload URL to allow EXTERNAL CLIENTS to upload a file."
 */
export const POST: APIRoute = async (context) => {
  try {
    const request = context.request;
    const body = await request.json().catch(() => null);
    const fileName: string | undefined = body?.fileName;
    const mimeType: string | undefined = body?.mimeType;
    const sizeInBytes: number | undefined = body?.sizeInBytes;
    const kind: 'image' | 'music' = body?.kind === 'music' ? 'music' : 'image';

    console.log(`[GET_UPLOAD_URL] Request received: fileName=${fileName}, mimeType=${mimeType}, sizeInBytes=${sizeInBytes}, kind=${kind}`);

    if (!fileName || !mimeType || typeof sizeInBytes !== 'number') {
      console.error('[GET_UPLOAD_URL] Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'fileName, mimeType, and sizeInBytes are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = kind === 'music' ? MUSIC_UPLOAD_CONFIG : IMAGE_UPLOAD_CONFIG;
    const validation = validateFileAgainstConfig({ type: mimeType, size: sizeInBytes }, config);
    if (!validation.valid) {
      console.error(`[GET_UPLOAD_URL] Validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GET_UPLOAD_URL] Calling files.generateFileUploadUrl...');
    let uploadUrl: string;
    try {
      const filesClient = files();
      const result = await filesClient.generateFileUploadUrl(mimeType, { fileName });
      uploadUrl = result.uploadUrl;
      console.log('[GET_UPLOAD_URL] Successfully generated upload URL');
    } catch (apiError) {
      console.error('[GET_UPLOAD_URL] Wix Media API error:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      throw new Error(`Wix Media API failed: ${errorMessage}`);
    }

    if (!uploadUrl) {
      console.error('[GET_UPLOAD_URL] Wix Media Manager did not return an upload URL');
      throw new Error('Wix Media Manager did not return an upload URL');
    }

    console.log('[GET_UPLOAD_URL] Successfully generated upload URL');
    return new Response(
      JSON.stringify({ uploadUrl, fileName }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GET_UPLOAD_URL] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate upload URL';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'Check server logs for more information'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
