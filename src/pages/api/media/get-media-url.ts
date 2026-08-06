import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';

/**
 * Get Media URL - Retrieve the URL of an uploaded file
 * 
 * This endpoint retrieves the media URL for a file that was uploaded.
 * The fileId is returned from the upload response.
 */

export const GET: APIRoute = async ({ url }) => {
  const requestId = crypto.randomUUID();

  try {
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      console.warn(`[GET_MEDIA_URL] Request ${requestId} missing fileId`);
      return new Response(
        JSON.stringify({ error: 'Missing fileId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GET_MEDIA_URL] Request ${requestId} fetching file`, { fileId });

    // Use auth.elevate to get the file with elevated permissions
    const elevatedGetFile = auth.elevate(files.getFile);
    const fileData = await elevatedGetFile(fileId);

    if (!fileData?.url) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} no URL in file data`, {
        fileId,
        fileData
      });
      return new Response(
        JSON.stringify({ error: 'File not found or has no URL' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GET_MEDIA_URL] Request ${requestId} success`, {
      fileId,
      urlDomain: new URL(fileData.url).hostname
    });

    return new Response(
      JSON.stringify({
        mediaUrl: fileData.url,
        fileId: fileData.id,
        displayName: fileData.displayName
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[GET_MEDIA_URL] Request ${requestId} error`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to get media URL' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
