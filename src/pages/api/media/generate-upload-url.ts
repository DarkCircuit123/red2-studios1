import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { fileName, mimeType, kind } = await request.json();

    if (!fileName || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'Missing fileName or mimeType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate a unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create a mock upload URL (in production, this would use Wix Media Manager API)
    const uploadUrl = `https://www.wixapis.com/v1/media/upload?fileId=${fileId}`;

    console.log('[API] Generated upload URL:', { fileName, mimeType, kind, fileId });

    return new Response(
      JSON.stringify({
        uploadUrl,
        fileId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate upload URL' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
