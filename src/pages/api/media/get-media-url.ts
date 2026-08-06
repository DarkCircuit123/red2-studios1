import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'Missing fileId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In production, this would retrieve the actual media URL from Wix Media Manager
    // For now, we'll construct a placeholder URL that can be replaced with real URLs
    const mediaUrl = `https://static.wixstatic.com/media/${fileId}`;

    return new Response(
      JSON.stringify({
        mediaUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting media URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get media URL' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
