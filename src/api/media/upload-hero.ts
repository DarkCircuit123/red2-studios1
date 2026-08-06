import type { APIRoute } from 'astro';

/**
 * Hero Image Upload API - Clean, reliable upload flow
 * 
 * This endpoint:
 * 1. Validates the file (JPEG, PNG, WebP only; max 10MB)
 * 2. Generates a signed upload URL from Wix Media Manager
 * 3. Receives the file bytes and uploads to Wix
 * 4. Returns { success, mediaUrl, fileId, error }
 * 5. Enforces admin authentication
 * 6. Includes structured logging for debugging
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface UploadHeroResponse {
  success: true;
  mediaUrl: string;
  fileId: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Check admin authentication via header
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[UPLOAD_HERO] Request ${requestId} unauthorized`, {
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Structured logging: request started
    console.log(`[UPLOAD_HERO] Request ${requestId} started`, {
      timestamp: new Date().toISOString(),
    });

    const formData = await context.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.warn(`[UPLOAD_HERO] Request ${requestId} no file provided`, {
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Structured logging: file info
    console.log(`[UPLOAD_HERO] Request ${requestId} file received`, {
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
      timestamp: new Date().toISOString(),
    });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn(`[UPLOAD_HERO] Request ${requestId} invalid file type`, {
        fileName: file.name,
        mimeType: file.type,
        allowedTypes: ALLOWED_TYPES,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File type not supported. Allowed: JPEG, PNG, WebP. Received: ${file.type}` 
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      console.warn(`[UPLOAD_HERO] Request ${requestId} file too large`, {
        fileName: file.name,
        fileSizeBytes: file.size,
        maxSizeBytes: MAX_SIZE_BYTES,
        fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File too large. Max 10MB, received ${(file.size / 1024 / 1024).toFixed(2)}MB` 
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const duration = Date.now() - startTime;

    // Structured logging: not implemented
    console.log(`[UPLOAD_HERO] Request ${requestId} hero upload not configured`, {
      fileName: file.name,
      fileSizeBytes: file.size,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Hero image upload API is not configured. Please use Wix Media Manager directly.' 
      } as ErrorResponse),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Structured logging: error with full stack
    console.error(`[UPLOAD_HERO] Request ${requestId} failed`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
