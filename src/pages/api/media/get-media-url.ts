import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { readSecret, constantTimeEqual } from '@/lib/auth-security';

/**
 * Get Media URL - Retrieve the URL of an uploaded file
 * 
 * This endpoint retrieves the media URL for a file that was uploaded.
 * The fileId is returned from the upload response.
 */

function requireAdmin(request: Request): { valid: boolean; error?: string } {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.substring(7);
  const expectedToken = readSecret('ADMIN_SESSION_TOKEN');
  if (!expectedToken) {
    console.error('[GET_MEDIA_URL] ADMIN_SESSION_TOKEN not configured');
    return { valid: false, error: 'Server configuration error' };
  }

  if (!constantTimeEqual(token, expectedToken)) {
    console.warn('[SECURITY] Invalid admin token for get-media-url');
    return { valid: false, error: 'Unauthorized' };
  }

  return { valid: true };
}

export const GET: APIRoute = async ({ request, url }) => {
  const requestId = crypto.randomUUID();

  try {
    // Verify admin authentication
    const authCheck = requireAdmin(request);
    if (!authCheck.valid) {
      console.warn(`[GET_MEDIA_URL] Request ${requestId} unauthorized`);
      return new Response(
        JSON.stringify({ error: authCheck.error || 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
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
