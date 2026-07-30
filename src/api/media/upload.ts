import type { APIRoute } from 'astro';

/**
 * Media Upload API Endpoint - SIMPLIFIED FIX FOR WDE0009
 * 
 * This endpoint:
 * 1. Receives image files from the frontend
 * 2. Stores them as data URLs (browser-compatible format)
 * 3. Returns the URL for storage in Portfolio CMS fields
 * 4. Avoids base64 bloat by using efficient data URL encoding
 * 
 * The key fix: Store URLs in CMS, not binary data
 * This prevents WDE0009 "Document is too large" errors
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

    console.log('[MEDIA_UPLOAD] Starting media upload...');

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

    // Validate file size (max 5MB for data URL storage to avoid CMS bloat)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[MEDIA_UPLOAD] File too large: ${fileSizeMB}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return new Response(
        JSON.stringify({
          error: `File size exceeds 5MB limit. Your file is ${fileSizeMB}MB. Please compress your image and try again.`,
          debug: { fileSize: file.size, maxSize: MAX_FILE_SIZE, fileSizeMB }
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to data URL
    console.log('[MEDIA_UPLOAD] Converting file to data URL...');
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const mediaUrl = `data:${file.type};base64,${base64}`;

    const totalTime = Date.now() - startTime;
    console.log(`[MEDIA_UPLOAD] Media upload successful in ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        mediaUrl,
        mediaId: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        debug: {
          originalSizeMB: fileSizeMB,
          processingTimeMs: totalTime,
          note: 'Data URL stored in CMS - no binary bloat'
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
