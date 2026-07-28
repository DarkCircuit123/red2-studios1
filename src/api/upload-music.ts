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
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid audio file type. Supported: MP3, WAV, OGG, WebM' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 10MB - safe limit to avoid 413 errors)
    // Base64 encoding adds ~33% overhead, so we use a conservative limit
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          error: `File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please compress your audio and try again.` 
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
    console.error('Music upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to upload music file' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
