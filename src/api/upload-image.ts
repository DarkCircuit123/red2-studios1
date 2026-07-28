import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  try {
    // Check if request has a body
    if (!request.body) {
      console.error('[IMAGE_UPLOAD] No request body provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[IMAGE_UPLOAD] Starting upload process...');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[IMAGE_UPLOAD] No file in FormData');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[IMAGE_UPLOAD] File received: ${file.name}, Size: ${fileSizeMB}MB, Type: ${file.type}`);

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
      console.error(`[IMAGE_UPLOAD] Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({ 
          error: `Invalid image file type: ${file.type}. Supported: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC`,
          debug: { receivedType: file.type, validTypes: validImageTypes }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 100MB - reasonable limit for images)
    // NOTE: We're NOT using base64 encoding anymore, so no 33% overhead
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[IMAGE_UPLOAD] File too large: ${fileSizeMB}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return new Response(
        JSON.stringify({ 
          error: `File size exceeds 100MB limit. Your file is ${fileSizeMB}MB. Please compress your image and try again.`,
          debug: { fileSize: file.size, maxSize: MAX_FILE_SIZE, fileSizeMB }
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to base64 for storage (with detailed logging)
    console.log('[IMAGE_UPLOAD] Converting to base64...');
    const conversionStart = Date.now();
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const conversionTime = Date.now() - conversionStart;
    
    const base64SizeMB = (base64.length / 1024 / 1024).toFixed(2);
    const overhead = (((base64.length - file.size) / file.size) * 100).toFixed(1);
    console.log(`[IMAGE_UPLOAD] Base64 conversion complete: ${base64SizeMB}MB (${overhead}% overhead), took ${conversionTime}ms`);
    
    const dataUrl = `data:${file.type};base64,${base64}`;

    const totalTime = Date.now() - startTime;
    console.log(`[IMAGE_UPLOAD] Upload successful in ${totalTime}ms`);

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
    console.error(`[IMAGE_UPLOAD] Error after ${totalTime}ms:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image file';
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
