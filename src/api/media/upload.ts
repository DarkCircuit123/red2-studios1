import type { APIRoute } from 'astro';
import { files } from '@wix/media';

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

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
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

    // Validate file type
    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/tiff',
      'image/bmp',
      'image/x-icon',
      'image/heic',
      'image/heif'
    ];

    if (!validImageTypes.includes(file.type) && !file.type.startsWith('image/')) {
      console.error(`[MEDIA_UPLOAD] Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({
          error: `Invalid image file type: ${file.type}. Supported: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC`,
          debug: { receivedType: file.type, validTypes: validImageTypes }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (Wix Media Manager limit is 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[MEDIA_UPLOAD] File too large: ${fileSizeMB}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return new Response(
        JSON.stringify({
          error: `File size exceeds 100MB limit. Your file is ${fileSizeMB}MB.`,
          debug: { fileSize: file.size, maxSize: MAX_FILE_SIZE, fileSizeMB }
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upload to the REAL Wix Media Manager - two-step flow: request an
    // upload URL, then PUT the actual file bytes to it.
    console.log('[MEDIA_UPLOAD] Requesting Wix Media Manager upload URL...');
    const { uploadUrl } = await files.generateFileUploadUrl(file.type, {
      fileName: file.name,
    });

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
