import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if request has a body
    if (!request.body) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
      return new Response(
        JSON.stringify({ error: 'Invalid image file type. Supported: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 15MB - safe limit to avoid 413 errors)
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          error: `File size exceeds 15MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please compress your image and try again.` 
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return new Response(
      JSON.stringify({ 
        url: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Image upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to upload image file' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
