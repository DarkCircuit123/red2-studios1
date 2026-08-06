import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { requireAdmin } from '@/lib/auth-security';

/**
 * Generate Upload URL - Server-side endpoint
 * 
 * This endpoint:
 * 1. Validates admin authentication
 * 2. Validates the request (file type, size)
 * 3. Uses auth.elevate() to get elevated permissions
 * 4. Calls files.generateFileUploadUrl() to get a signed upload URL
 * 5. Returns the URL to the client for direct upload
 * 
 * The client then uploads directly to the signed URL with a PUT request
 */

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp3',
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

function requireAdmin(request: Request): { valid: boolean; error?: string } {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.substring(7);
  const expectedToken = readSecret('ADMIN_SESSION_TOKEN');
  if (!expectedToken) {
    console.error('[GENERATE_URL] ADMIN_SESSION_TOKEN not configured');
    return { valid: false, error: 'Server configuration error' };
  }

  if (!constantTimeEqual(token, expectedToken)) {
    console.warn('[SECURITY] Invalid admin token for generate-upload-url');
    return { valid: false, error: 'Unauthorized' };
  }

  return { valid: true };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Verify admin authentication
    const denied = await requireAdmin(cookies, request, 'generate-upload-url');
    if (denied) return denied;

    console.log(`[GENERATE_URL] Request ${requestId} started`, {
      timestamp: new Date().toISOString()
    });

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.warn(`[GENERATE_URL] Request ${requestId} invalid JSON`, { error: e });
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { fileName, fileType } = body;

    // Validate inputs
    if (!fileName || !fileType) {
      console.warn(`[GENERATE_URL] Request ${requestId} missing parameters`, {
        hasFileName: !!fileName,
        hasFileType: !!fileType
      });
      return new Response(
        JSON.stringify({ error: 'Missing fileName or fileType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      console.warn(`[GENERATE_URL] Request ${requestId} invalid file type`, {
        fileType,
        allowedTypes: ALLOWED_TYPES
      });
      return new Response(
        JSON.stringify({ 
          error: `File type not supported. Allowed: ${ALLOWED_TYPES.join(', ')}` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GENERATE_URL] Request ${requestId} validated`, {
      fileName,
      fileType
    });

    // Get elevated permissions and generate upload URL
    console.log(`[GENERATE_URL] Request ${requestId} calling generateFileUploadUrl`);
    
    let uploadUrlResponse;
    try {
      // Use auth.elevate to get elevated permissions for file operations
      const elevatedGenerateUrl = auth.elevate(files.generateFileUploadUrl);
      uploadUrlResponse = await elevatedGenerateUrl(fileType, {
        fileName,
        mimeType: fileType
      });
    } catch (apiError) {
      console.error(`[GENERATE_URL] Request ${requestId} generateFileUploadUrl failed`, {
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        fileName,
        fileType
      });
      
      // Return 403 if permission denied, 500 for other errors
      const status = apiError instanceof Error && apiError.message.includes('403') ? 403 : 500;
      return new Response(
        JSON.stringify({ 
          error: `Failed to generate upload URL: ${apiError instanceof Error ? apiError.message : String(apiError)}` 
        }),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!uploadUrlResponse?.uploadUrl) {
      console.error(`[GENERATE_URL] Request ${requestId} no uploadUrl in response`, {
        response: uploadUrlResponse
      });
      return new Response(
        JSON.stringify({ error: 'No upload URL returned from Wix' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[GENERATE_URL] Request ${requestId} success`, {
      fileName,
      fileType,
      uploadUrlDomain: new URL(uploadUrlResponse.uploadUrl).hostname,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        uploadUrl: uploadUrlResponse.uploadUrl
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[GENERATE_URL] Request ${requestId} error`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate upload URL' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
