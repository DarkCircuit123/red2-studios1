import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';

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

    let fileInfo;
    try {
      // Use auth.elevate to call listFiles with elevated permissions
      const elevatedListFiles = auth.elevate(files.listFiles);
      
      // Query files by name to get the file info
      fileInfo = await elevatedListFiles({
        sort: 'dateUpdated',
        order: 'DESC',
        limit: 100,
      });
      
      console.log('[GET_MEDIA_URL] Listed files successfully:', { 
        totalFiles: fileInfo.files?.length || 0,
        fileName 
      });
    } catch (apiError) {
      console.error('[GET_MEDIA_URL] Failed to list files:', {
        fileName,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
      });
      return new Response(
        JSON.stringify({ 
          error: `Failed to retrieve media URL: ${apiError instanceof Error ? apiError.message : String(apiError)}` 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find the file by name
    if (!fileInfo || !fileInfo.files || fileInfo.files.length === 0) {
      console.warn('[GET_MEDIA_URL] No files found in media library');
      return new Response(
        JSON.stringify({ error: `File not found: ${fileName}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const file = fileInfo.files.find((f: any) => f.displayName === fileName);
    
    if (!file || !file.url) {
      console.warn('[GET_MEDIA_URL] File not found:', { 
        fileName, 
        totalFiles: fileInfo.files.length,
        availableFiles: fileInfo.files.map((f: any) => f.displayName)
      });
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
    console.error('[GET_MEDIA_URL] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to get media URL' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
