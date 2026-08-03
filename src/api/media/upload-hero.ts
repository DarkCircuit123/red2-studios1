import type { APIRoute } from 'astro';
import { media } from '@wix/media';

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

    // Get Wix Media Manager client
    console.log(`[UPLOAD_HERO] Request ${requestId} getting Wix context`, {
      timestamp: new Date().toISOString(),
    });
    const wixContext = context;
    const mediaClient = media(wixContext);

    // Generate upload URL
    console.log(`[UPLOAD_HERO] Request ${requestId} calling generateFileUploadUrl`, {
      fileName: file.name,
      mimeType: file.type,
      timestamp: new Date().toISOString(),
    });

    let uploadUrlResponse;
    try {
      uploadUrlResponse = await mediaClient.files.generateFileUploadUrl(file.type, {
        fileName: file.name,
      });
    } catch (apiError) {
      console.error(`[UPLOAD_HERO] Request ${requestId} generateFileUploadUrl failed`, {
        fileName: file.name,
        mimeType: file.type,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to generate upload URL: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }

    if (!uploadUrlResponse.uploadUrl) {
      console.error(`[UPLOAD_HERO] Request ${requestId} no uploadUrl in response`, {
        fileName: file.name,
        response: uploadUrlResponse,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Failed to generate upload URL from Wix Media Manager');
    }

    // Verify upload URL is a real Wix domain
    const uploadUrlObj = new URL(uploadUrlResponse.uploadUrl);
    const isValidWixDomain = 
      uploadUrlObj.hostname.includes('wix') ||
      uploadUrlObj.hostname.includes('files') ||
      uploadUrlObj.hostname.includes('media');

    if (!isValidWixDomain) {
      console.error(`[UPLOAD_HERO] Request ${requestId} invalid upload URL domain`, {
        uploadUrl: uploadUrlResponse.uploadUrl,
        hostname: uploadUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid upload URL domain: ${uploadUrlObj.hostname}`);
    }

    console.log(`[UPLOAD_HERO] Request ${requestId} upload URL generated`, {
      fileName: file.name,
      uploadUrlDomain: uploadUrlObj.hostname,
      timestamp: new Date().toISOString(),
    });

    // Upload file to Wix
    console.log(`[UPLOAD_HERO] Request ${requestId} uploading file to Wix`, {
      fileName: file.name,
      fileSizeBytes: file.size,
      timestamp: new Date().toISOString(),
    });

    const buffer = await file.arrayBuffer();
    let uploadResponse;
    try {
      uploadResponse = await fetch(
        `${uploadUrlResponse.uploadUrl}?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: buffer,
        }
      );
    } catch (fetchError) {
      console.error(`[UPLOAD_HERO] Request ${requestId} fetch to upload URL failed`, {
        fileName: file.name,
        uploadUrlDomain: uploadUrlObj.hostname,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Upload failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error(`[UPLOAD_HERO] Request ${requestId} upload HTTP error`, {
        fileName: file.name,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText: errorText.substring(0, 500),
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    let uploadResult;
    try {
      uploadResult = await uploadResponse.json();
    } catch (parseError) {
      console.error(`[UPLOAD_HERO] Request ${requestId} failed to parse upload response`, {
        fileName: file.name,
        error: parseError instanceof Error ? parseError.message : String(parseError),
        timestamp: new Date().toISOString(),
      });
      throw new Error('Failed to parse upload response');
    }

    const mediaUrl = uploadResult?.file?.url;
    const fileId = uploadResult?.file?.id;

    if (!mediaUrl) {
      console.error(`[UPLOAD_HERO] Request ${requestId} no media URL in response`, {
        fileName: file.name,
        response: uploadResult,
        timestamp: new Date().toISOString(),
      });
      throw new Error('No media URL returned from Wix Media Manager');
    }

    // Verify media URL is a real Wix domain
    const mediaUrlObj = new URL(mediaUrl);
    const isValidMediaDomain = 
      mediaUrlObj.hostname.includes('wix') ||
      mediaUrlObj.hostname.includes('files') ||
      mediaUrlObj.hostname.includes('media');

    if (!isValidMediaDomain) {
      console.error(`[UPLOAD_HERO] Request ${requestId} invalid media URL domain`, {
        mediaUrl,
        hostname: mediaUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid media URL domain: ${mediaUrlObj.hostname}`);
    }

    const duration = Date.now() - startTime;

    // Structured logging: success
    console.log(`[UPLOAD_HERO] Request ${requestId} completed successfully`, {
      fileName: file.name,
      fileSizeBytes: file.size,
      fileId: fileId || 'unknown',
      mediaUrlDomain: mediaUrlObj.hostname,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        mediaUrl,
        fileId: fileId || '',
      } as UploadHeroResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
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
