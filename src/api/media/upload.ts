import type { APIRoute } from 'astro';
import { getSecureContext } from '@wix/sdk';
import { media } from '@wix/media';
import { IMAGE_UPLOAD_CONFIG, validateFileAgainstConfig } from '@/lib/upload-config';

/**
 * Media Upload API Endpoint - REAL FIX FOR WDE0009
 *
 * This endpoint:
 * 1. Receives image files from the frontend
 * 2. Uploads them to the real Wix Media Manager (generateFileUploadUrl + PUT)
 * 3. Returns the actual Wix media URL Media Manager assigns
 * 4. Frontend stores only the URL string in CMS (tiny payload)
 *
 * The previous version of this file only FABRICATED a URL in the
 * static.wixstatic.com shape (Date.now() + a random suffix as a fake
 * mediaId) without ever uploading the file bytes anywhere - it also
 * called browser-only APIs (Blob/URL.createObjectURL) that don't exist
 * in the Cloudflare Workers runtime this route actually executes in.
 * "Uploads" always returned 200 with a URL pointing at nothing real.
 * This mirrors the genuine two-step upload flow already fixed in
 * src/api/upload-music.ts.
 *
 * The key fix: store a real Wix media URL, not base64 data and not a
 * fabricated one. This prevents WDE0009 "Document is too large" errors
 * AND actually hosts the image somewhere resolvable.
 */

export const POST: APIRoute = async (context) => {
  const startTime = Date.now();

  try {
    const request = context.request;
    if (!request.body) {
      console.error('[MEDIA_UPLOAD] No request body provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[MEDIA_UPLOAD] Starting media upload to Wix Media Manager...');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[MEDIA_UPLOAD] No file in FormData');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[MEDIA_UPLOAD] File received: ${file.name}, Size: ${fileSizeMB}MB, Type: ${file.type}`);

    // ... keep existing code (validation) ...
    const validation = validateFileAgainstConfig(file, IMAGE_UPLOAD_CONFIG);
    if (!validation.valid) {
      console.error(`[MEDIA_UPLOAD] Rejected: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: validation.error, debug: { receivedType: file.type, fileSizeMB } }),
        { status: file.size > IMAGE_UPLOAD_CONFIG.maxSizeBytes ? 413 : 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upload to the REAL Wix Media Manager - two-step flow: request an
    // upload URL, then PUT the actual file bytes to it.
    console.log('[MEDIA_UPLOAD] Requesting Wix Media Manager upload URL...');
    let uploadUrl: string;
    try {
      const wixContext = getSecureContext();
      const mediaClient = media(wixContext);
      const uploadUrlResponse = await mediaClient.files.generateFileUploadUrl(file.type, {
        fileName: file.name,
      });
      uploadUrl = uploadUrlResponse.uploadUrl;
      console.log('[MEDIA_UPLOAD] Generated upload URL successfully');
    } catch (urlError) {
      console.error('[MEDIA_UPLOAD] Failed to generate upload URL:', urlError);
      throw new Error(`Failed to generate Wix Media Manager upload URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
    }

    const buffer = await file.arrayBuffer();

    console.log('[MEDIA_UPLOAD] Uploading file bytes to Wix Media Manager...');
    const uploadResponse = await fetch(
      `${uploadUrl}?filename=${encodeURIComponent(file.name)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const uploadErrorText = await uploadResponse.text().catch(() => '');
      console.error(`[MEDIA_UPLOAD] Media Manager upload failed: ${uploadResponse.status} ${uploadErrorText}`);
      throw new Error(`Media Manager upload failed with status ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    const mediaUrl: string | undefined = uploadResult?.file?.url;
    const mediaId: string | undefined = uploadResult?.file?.id;

    if (!mediaUrl) {
      console.error('[MEDIA_UPLOAD] Media Manager response missing file URL:', uploadResult);
      throw new Error('Media Manager did not return a file URL');
    }

    const totalTime = Date.now() - startTime;
    console.log(`[MEDIA_UPLOAD] Media upload successful in ${totalTime}ms`);
    console.log(`[MEDIA_UPLOAD] Wix Media URL: ${mediaUrl}`);

    return new Response(
      JSON.stringify({
        mediaUrl,
        mediaId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        debug: {
          originalSizeMB: fileSizeMB,
          processingTimeMs: totalTime,
          note: 'Real Wix Media Manager URL stored in CMS - tiny payload, avoids WDE0009'
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[MEDIA_UPLOAD] Error after ${totalTime}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to upload media file';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: errorStack,
          processingTimeMs: totalTime
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
