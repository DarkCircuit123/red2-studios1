import type { APIRoute } from 'astro';
import { wixClient } from '@wix/sdk';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing fileName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GET_MEDIA_URL] Retrieving media URL for:', fileName);

    // Use Wix SDK to get the file URL
    const client = wixClient();
    const filesClient = client.media.files;
    
    let fileInfo;
    try {
      // Query files by name to get the file info
      fileInfo = await filesClient.listFiles({
        sort: 'dateUpdated',
        order: 'DESC',
        limit: 100,
      });
    } catch (apiError) {
      console.error('[GET_MEDIA_URL] Failed to list files:', {
        fileName,
        error: apiError instanceof Error ? apiError.message : String(apiError),
      });
      return new Response(
        JSON.stringify({ 
          error: `Failed to retrieve media URL: ${apiError instanceof Error ? apiError.message : String(apiError)}` 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find the file by name
    const file = fileInfo.files?.find((f: any) => f.displayName === fileName);
    
    if (!file || !file.url) {
      console.warn('[GET_MEDIA_URL] File not found:', { fileName, totalFiles: fileInfo.files?.length || 0 });
      return new Response(
        JSON.stringify({ error: `File not found: ${fileName}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GET_MEDIA_URL] Successfully retrieved media URL:', { fileName, fileId: file.id });

    return new Response(
      JSON.stringify({
        mediaUrl: file.url,
        fileId: file.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GET_MEDIA_URL] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to get media URL' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
