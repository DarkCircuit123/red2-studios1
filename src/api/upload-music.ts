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

    // Validate file type - support all common MP3 MIME types
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
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

    // Validate file size (max 500MB - Wix Media Manager limit)
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[MUSIC_UPLOAD] File too large: ${fileSizeMB}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return new Response(
        JSON.stringify({
          error: `File size exceeds 500MB limit. Your file is ${fileSizeMB}MB. Please try a smaller file.`,
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
    let uploadUrl: string;
    try {
      const uploadUrlResponse = await files.generateFileUploadUrl(file.type, {
        fileName: file.name,
      });
      uploadUrl = uploadUrlResponse.uploadUrl;
      console.log('[MUSIC_UPLOAD] Generated upload URL successfully');
    } catch (urlError) {
      console.error('[MUSIC_UPLOAD] Failed to generate upload URL:', urlError);
      throw new Error(`Failed to generate Wix Media Manager upload URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
    }

    console.log('[MUSIC_UPLOAD] Preparing file buffer...');
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
      console.log(`[MUSIC_UPLOAD] File buffer prepared: ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
    } catch (bufferError) {
      console.error('[MUSIC_UPLOAD] Failed to read file as buffer:', bufferError);
      throw new Error(`Failed to read file: ${bufferError instanceof Error ? bufferError.message : String(bufferError)}`);
    }

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

    console.log('[MUSIC_UPLOAD] Upload response received, parsing...');
    let uploadResult: any;
    try {
      uploadResult = await uploadResponse.json();
      console.log('[MUSIC_UPLOAD] Upload result parsed successfully');
    } catch (parseError) {
      console.error('[MUSIC_UPLOAD] Failed to parse upload response:', parseError);
      throw new Error(`Failed to parse Media Manager response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    const mediaUrl: string | undefined = uploadResult?.file?.url;
    const mediaId: string | undefined = uploadResult?.file?.id;

    if (!mediaUrl) {
      console.error('[MUSIC_UPLOAD] Media Manager response missing file URL:', JSON.stringify(uploadResult));
      throw new Error('Media Manager did not return a file URL');
    }

    console.log(`[MUSIC_UPLOAD] Media URL obtained: ${mediaUrl}`);

    const totalTime = Date.now() - startTime;
    console.log(`[MUSIC_UPLOAD] Upload successful in ${totalTime}ms. Media URL: ${mediaUrl}`);
    console.log('[MUSIC_UPLOAD] Returning success response with media URL');

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
          note: 'Wix Media URL stored in CMS - tiny payload, avoids WDE0009',
          uploadMethod: 'Wix Media Manager (NOT base64)'
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
    
    console.error('[MUSIC_UPLOAD] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: errorStack,
          processingTimeMs: totalTime,
          note: 'Check browser console for detailed error logs'
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
