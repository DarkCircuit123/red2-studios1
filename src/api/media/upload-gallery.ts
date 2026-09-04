import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { requireAdmin } from '@/lib/auth-security';

/**
 * Gallery Image Upload API - For Work Gallery and other portfolio galleries
 * 
 * Uses the same SDK flow as upload-hero.ts:
 * 1. Validates the file (JPEG, PNG, WebP, GIF, TIFF, HEIC; max 10MB)
 * 2. Generates a signed upload URL from Wix Media Manager with auth.elevate()
 * 3. Receives the file bytes and uploads to Wix
 * 4. Returns { success, mediaUrl, fileId, error }
 * 5. Enforces admin authentication
 * 6. Includes structured logging for debugging
 */

const MIME_TYPE_MAP: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'gif': 'image/gif',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  'heic': 'image/heic',
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'image/heic'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface UploadGalleryResponse {
  success: true;
  mediaUrl: string;
  fileId?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * Detect MIME type from file
 * CRITICAL: Prefer browser-provided File.type, fall back to extension map
 */
function detectMimeType(file: File): { mimeType: string; source: 'browser' | 'extension-map' } {
  // FIRST: Try browser-provided type
  if (file.type && file.type.trim() !== '') {
    console.log(`[UPLOAD_GALLERY] Using browser-provided MIME type: ${file.type}`);
    return { mimeType: file.type, source: 'browser' };
  }

  // FALLBACK: Use extension map
  const lastDotIndex = file.name.lastIndexOf('.');
  if (lastDotIndex > 0) {
    const ext = file.name.substring(lastDotIndex + 1).toLowerCase();
    const mappedType = MIME_TYPE_MAP[ext];
    if (mappedType) {
      console.log(`[UPLOAD_GALLERY] Using extension map for .${ext}: ${mappedType}`);
      return { mimeType: mappedType, source: 'extension-map' };
    }
  }

  // REJECT: Unknown extension
  throw new Error(`Unsupported file extension. Allowed: ${Object.keys(MIME_TYPE_MAP).join(', ')}`);
}

/**
 * Sanitize filename for Wix Media API
 * The Wix API is very strict about filenames - it rejects:
 * - Special characters like (), [], {}, etc.
 * - Spaces (should be hyphens)
 * - Non-ASCII characters
 * - Multiple dots
 * 
 * This function converts filenames to a safe format:
 * "01_2023-12-11(101).jpg" → "01_2023-12-11_101.jpg"
 */
function sanitizeFilename(filename: string): string {
  // Extract extension
  const lastDotIndex = filename.lastIndexOf('.');
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '.jpg';
  const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  
  // Remove/replace problematic characters
  let sanitized = nameWithoutExt
    .replace(/[()[\]{}]/g, '_')  // Replace brackets/parens with underscore
    .replace(/\s+/g, '_')         // Replace spaces with underscore
    .replace(/[^a-zA-Z0-9_\-]/g, '_')  // Replace other special chars with underscore
    .replace(/_+/g, '_')          // Collapse multiple underscores
    .replace(/^_+|_+$/g, '');     // Remove leading/trailing underscores
  
  // Ensure we have a valid name
  if (!sanitized) {
    sanitized = `image_${Date.now()}`;
  }
  
  return sanitized + ext.toLowerCase();
}

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Check admin authentication
    const denied = await requireAdmin(context.cookies, context.request, 'upload-gallery');
    if (denied) return denied;

    // Structured logging: request started
    console.log(`[UPLOAD_GALLERY] Request ${requestId} started`, {
      timestamp: new Date().toISOString(),
    });

    const formData = await context.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.warn(`[UPLOAD_GALLERY] Request ${requestId} no file provided`, {
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Structured logging: file info
    console.log(`[UPLOAD_GALLERY] Request ${requestId} file received`, {
      fileName: file.name,
      browserMimeType: file.type,
      fileSizeBytes: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
      timestamp: new Date().toISOString(),
    });

    // CRITICAL: Detect MIME type with strict mapping
    let mimeTypeInfo;
    try {
      mimeTypeInfo = detectMimeType(file);
    } catch (typeError) {
      const errorMsg = typeError instanceof Error ? typeError.message : String(typeError);
      console.warn(`[UPLOAD_GALLERY] Request ${requestId} MIME type detection failed`, {
        fileName: file.name,
        browserMimeType: file.type,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMsg
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { mimeType, source } = mimeTypeInfo;

    console.log(`[UPLOAD_GALLERY] Request ${requestId} MIME type resolved`, {
      fileName: file.name,
      mimeType,
      source,
      timestamp: new Date().toISOString(),
    });

    // Validate MIME type is in allowed list
    if (!ALLOWED_TYPES.includes(mimeType)) {
      console.warn(`[UPLOAD_GALLERY] Request ${requestId} MIME type not allowed`, {
        fileName: file.name,
        mimeType,
        allowedTypes: ALLOWED_TYPES,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File type not supported. Allowed: ${Object.keys(MIME_TYPE_MAP).join(', ')}. Received: ${mimeType}` 
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      console.warn(`[UPLOAD_GALLERY] Request ${requestId} file too large`, {
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

    // Sanitize filename for Wix API compatibility
    const sanitizedFileName = sanitizeFilename(file.name);
    console.log(`[UPLOAD_GALLERY] Request ${requestId} filename sanitized`, {
      originalFileName: file.name,
      sanitizedFileName: sanitizedFileName,
      timestamp: new Date().toISOString(),
    });

    // Generate upload URL with elevated permissions
    console.log(`[UPLOAD_GALLERY] Request ${requestId} calling generateFileUploadUrl with auth.elevate()`, {
      fileName: sanitizedFileName,
      mimeType: mimeType,
      timestamp: new Date().toISOString(),
    });

    let uploadUrlResponse;
    try {
      // Use auth.elevate to get elevated permissions for file operations
      const elevatedGenerateUrl = auth.elevate(files.generateFileUploadUrl);
      uploadUrlResponse = await elevatedGenerateUrl(mimeType, {
        fileName: sanitizedFileName,
      });
    } catch (apiError) {
      console.error(`[UPLOAD_GALLERY] Request ${requestId} generateFileUploadUrl failed`, {
        fileName: sanitizedFileName,
        mimeType: mimeType,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to generate upload URL: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }

    if (!uploadUrlResponse.uploadUrl) {
      console.error(`[UPLOAD_GALLERY] Request ${requestId} no uploadUrl in response`, {
        fileName: sanitizedFileName,
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
      console.error(`[UPLOAD_GALLERY] Request ${requestId} invalid upload URL domain`, {
        uploadUrl: uploadUrlResponse.uploadUrl,
        hostname: uploadUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid upload URL domain: ${uploadUrlObj.hostname}`);
    }

    console.log(`[UPLOAD_GALLERY] Request ${requestId} upload URL generated`, {
      fileName: sanitizedFileName,
      uploadUrlDomain: uploadUrlObj.hostname,
      timestamp: new Date().toISOString(),
    });

    // Upload file to Wix
    console.log(`[UPLOAD_GALLERY] Request ${requestId} uploading file to Wix`, {
      fileName: sanitizedFileName,
      fileSizeBytes: file.size,
      timestamp: new Date().toISOString(),
    });

    const arrayBuffer = await file.arrayBuffer();
    let uploadResponse;
    try {
      uploadResponse = await fetch(
        `${uploadUrlResponse.uploadUrl}?filename=${encodeURIComponent(sanitizedFileName)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': mimeType },
          body: arrayBuffer,
        }
      );
    } catch (fetchError) {
      console.error(`[UPLOAD_GALLERY] Request ${requestId} fetch to upload URL failed`, {
        fileName: sanitizedFileName,
        uploadUrlDomain: uploadUrlObj.hostname,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Upload failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error(`[UPLOAD_GALLERY] Request ${requestId} upload HTTP error`, {
        fileName: sanitizedFileName,
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
      console.error(`[UPLOAD_GALLERY] Request ${requestId} failed to parse upload response`, {
        fileName: sanitizedFileName,
        error: parseError instanceof Error ? parseError.message : String(parseError),
        timestamp: new Date().toISOString(),
      });
      throw new Error('Failed to parse upload response');
    }

    const mediaUrl = uploadResult?.file?.url;
    const fileId = uploadResult?.file?.id;

    if (!mediaUrl) {
      console.error(`[UPLOAD_GALLERY] Request ${requestId} no media URL in response`, {
        fileName: sanitizedFileName,
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
      console.error(`[UPLOAD_GALLERY] Request ${requestId} invalid media URL domain`, {
        mediaUrl,
        hostname: mediaUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid media URL domain: ${mediaUrlObj.hostname}`);
    }

    const duration = Date.now() - startTime;

    // Structured logging: success
    console.log(`[UPLOAD_GALLERY] Request ${requestId} completed successfully`, {
      fileName: file.name,
      sanitizedFileName: sanitizedFileName,
      fileSizeBytes: file.size,
      mimeType: mimeType,
      mediaUrl: mediaUrl,
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
      } as UploadGalleryResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Structured logging: error with full stack
    console.error(`[UPLOAD_GALLERY] Request ${requestId} failed`, {
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
