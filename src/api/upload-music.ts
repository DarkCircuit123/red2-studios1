import type { APIRoute } from 'astro';
import { files } from '@wix/media';

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    // Check if request has a body
    if (!request.body) {
      console.error('[MUSIC_UPLOAD] No request body provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[MUSIC_UPLOAD] Starting upload process...');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[MUSIC_UPLOAD] No file in FormData');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[MUSIC_UPLOAD] File received: ${file.name}, Size: ${fileSizeMB}MB, Type: ${file.type}`);

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      console.error(`[MUSIC_UPLOAD] Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({
          error: `Invalid audio file type: ${file.type}. Supported: MP3, WAV, OGG, WebM`,
          debug: { receivedType: file.type, validTypes }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 50MB - reasonable limit for audio, well under
    // Wix Media Manager's 100MB cap)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[MUSIC_UPLOAD] File too large: ${fileSizeMB}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return new Response(
        JSON.stringify({
          error: `File size exceeds 50MB limit. Your file is ${fileSizeMB}MB. Please compress your audio and try again.`,
          debug: { fileSize: file.size, maxSize: MAX_FILE_SIZE, fileSizeMB }
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upload to the real Wix Media Manager instead of base64-encoding the
    // file into a data: URL. The old approach stored the entire encoded
    // audio file (often several MB) directly in a CMS field, which is the
    // same WDE0009 "document too large" class of bug the image pipeline
    // was already fixed for - and if the CMS field is typed as a URL, Wix
    // Data rejects a multi-megabyte data: string outright, which is the
    // "string did not match the expected pattern" error. Storing a real,
    // tiny Wix media URL avoids both problems.
    console.log('[MUSIC_UPLOAD] Requesting Wix Media Manager upload URL...');
    const { uploadUrl } = await files.generateFileUploadUrl(file.type, {
      fileName: file.name,
    });

    console.log('[MUSIC_UPLOAD] Generated upload URL, preparing file buffer...');
    const buffer = await file.arrayBuffer();

    console.log('[MUSIC_UPLOAD] Uploading file bytes to Wix Media Manager...');
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
      console.error(`[MUSIC_UPLOAD] Media Manager upload failed: ${uploadResponse.status} ${uploadErrorText}`);
      throw new Error(`Media Manager upload failed with status ${uploadResponse.status}: ${uploadErrorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const mediaUrl: string | undefined = uploadResult?.file?.url;
    const mediaId: string | undefined = uploadResult?.file?.id;

    if (!mediaUrl) {
      console.error('[MUSIC_UPLOAD] Media Manager response missing file URL:', JSON.stringify(uploadResult));
      throw new Error('Media Manager did not return a file URL');
    }

    const totalTime = Date.now() - startTime;
    console.log(`[MUSIC_UPLOAD] Upload successful in ${totalTime}ms. Media URL: ${mediaUrl}`);

    return new Response(
      JSON.stringify({
        url: mediaUrl,
        mediaId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        debug: {
          originalSizeMB: fileSizeMB,
          processingTimeMs: totalTime,
          note: 'Wix Media URL stored in CMS - tiny payload, avoids WDE0009'
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[MUSIC_UPLOAD] Error after ${totalTime}ms:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload music file';
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
