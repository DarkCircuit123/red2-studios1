import type { APIRoute } from 'astro';

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

    // Validate file size (max 50MB - reasonable limit for audio)
    // NOTE: We're NOT using base64 encoding anymore, so no 33% overhead
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

    // Convert file to base64 for storage (with detailed logging)
    console.log('[MUSIC_UPLOAD] Converting to base64...');
    const conversionStart = Date.now();
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const conversionTime = Date.now() - conversionStart;
    
    const base64SizeMB = (base64.length / 1024 / 1024).toFixed(2);
    const overhead = (((base64.length - file.size) / file.size) * 100).toFixed(1);
    console.log(`[MUSIC_UPLOAD] Base64 conversion complete: ${base64SizeMB}MB (${overhead}% overhead), took ${conversionTime}ms`);
    
    const dataUrl = `data:${file.type};base64,${base64}`;

    const totalTime = Date.now() - startTime;
    console.log(`[MUSIC_UPLOAD] Upload successful in ${totalTime}ms`);

    return new Response(
      JSON.stringify({ 
        url: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        debug: {
          originalSizeMB: fileSizeMB,
          base64SizeMB,
          overheadPercent: overhead,
          processingTimeMs: totalTime
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
