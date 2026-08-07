import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { requireAdmin } from '@/lib/auth-security';

/**
 * Get Media URL - Retrieve the URL of an uploaded file
 * 
 * This endpoint retrieves the media URL for a file that was uploaded.
 * The fileId is returned from the upload response.
 */

export const GET: APIRoute = async ({ request, url, cookies }) => {
  const requestId = crypto.randomUUID();

  try {
    // Verify admin authentication
    const denied = await requireAdmin(cookies, request, 'get-media-url');
    if (denied) return denied;
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      console.warn(`[GET_MEDIA_URL] Request ${requestId} missing fileId`);
      return new Response(
        JSON.stringify({ error: 'Missing fileId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GET_MEDIA_URL] Request ${requestId} fetching file`, { fileId });

    // Use auth.elevate to get the file descriptor with elevated permissions
    const elevatedGetDescriptor = auth.elevate(files.getFileDescriptor);
    const fileData = await elevatedGetDescriptor(fileId);

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
        fileId: fileData._id,
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
