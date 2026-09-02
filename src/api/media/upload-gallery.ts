import type { APIRoute } from 'astro';
import { mediaManager } from 'wix-media-backend';
import { requireAdmin } from '@/lib/auth-security';

/**
 * Gallery Image Upload API - For Work Gallery and other portfolio galleries
 * 
 * BACKEND-ONLY UPLOAD using mediaManager.upload()
 * 
 * Contract:
 * mediaManager.upload(
 *   '/portfolio',                    // 1: destination folder (with leading slash)
 *   buffer,                          // 2: Buffer (NOT base64 string)
 *   fileName,                        // 3: filename WITH extension
 *   {                                // 4: options
 *     mediaOptions: {
 *       mimeType: mimeType,          // MUST be nested here
 *       mediaType: 'image'
 *     },
 *     metadataOptions: { 
 *       isPrivate: false, 
 *       isVisitorUpload: false 
 *     }
 *   }
 * )
 * 
 * Returns: { fileUrl: 'wix:image://...' }
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

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ===== CRITICAL LOGGING BEFORE UPLOAD =====
    console.log(`[UPLOAD_GALLERY_CRITICAL_ARGS] Request ${requestId} - EXACT ARGUMENTS TO mediaManager.upload:`, {
      arg1_folder: {
        value: '/portfolio',
        type: 'string',
        hasLeadingSlash: true,
      },
      arg2_buffer: {
        type: 'Buffer',
        length: buffer.length,
        isBuffer: Buffer.isBuffer(buffer),
      },
      arg3_fileName: {
        value: sanitizedFileName,
        type: typeof sanitizedFileName,
        length: sanitizedFileName.length,
        hasExtension: sanitizedFileName.includes('.'),
        extension: sanitizedFileName.substring(sanitizedFileName.lastIndexOf('.')),
      },
      arg4_options: {
        mediaOptions: {
          mimeType: mimeType,
          mediaType: 'image',
        },
        metadataOptions: {
          isPrivate: false,
          isVisitorUpload: false,
        },
      },
      timestamp: new Date().toISOString(),
    });

    let uploadResult;
    try {
      console.log(`[UPLOAD_GALLERY] Request ${requestId} calling mediaManager.upload`, {
        fileName: sanitizedFileName,
        mimeType: mimeType,
        bufferLength: buffer.length,
        timestamp: new Date().toISOString(),
      });

      uploadResult = await mediaManager.upload(
        '/portfolio',                 // 1: destination folder, leading slash
        buffer,                       // 2: Buffer, NOT base64 string
        sanitizedFileName,            // 3: filename WITH extension
        {                             // 4: options
          mediaOptions: {
            mimeType: mimeType,       // MUST be nested here
            mediaType: 'image'
          },
          metadataOptions: { 
            isPrivate: false, 
            isVisitorUpload: false 
          }
        }
      );
    } catch (apiError) {
      // ===== MAKE FAILURE LOUD - FULL ERROR OBJECT =====
      console.error(`[UPLOAD_GALLERY_ERROR_CRITICAL] Request ${requestId} mediaManager.upload FAILED - FULL ERROR OBJECT:`, {
        fileName: file.name,
        sanitizedFileName: sanitizedFileName,
        mimeType: mimeType,
        bufferLength: buffer.length,
        errorObject: apiError,
        errorType: apiError instanceof Error ? apiError.constructor.name : typeof apiError,
        errorMessage: apiError instanceof Error ? apiError.message : String(apiError),
        errorStack: apiError instanceof Error ? apiError.stack : undefined,
        errorKeys: apiError instanceof Object ? Object.keys(apiError) : [],
        errorStringified: JSON.stringify(apiError, null, 2),
        timestamp: new Date().toISOString(),
      });

      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      console.error(`[UPLOAD_GALLERY] Request ${requestId} mediaManager.upload failed`, {
        fileName: file.name,
        mimeType: mimeType,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Upload failed: ${errorMessage}` 
        } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mediaUrl = uploadResult?.fileUrl;

    if (!mediaUrl) {
      console.error(`[UPLOAD_GALLERY] Request ${requestId} no fileUrl in response`, {
        fileName: file.name,
        response: uploadResult,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No media URL returned from Wix Media Manager' 
        } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const duration = Date.now() - startTime;

    // Structured logging: success
    console.log(`[UPLOAD_GALLERY] Request ${requestId} completed successfully`, {
      fileName: file.name,
      sanitizedFileName: sanitizedFileName,
      fileSizeBytes: file.size,
      mimeType: mimeType,
      mediaUrl: mediaUrl,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        mediaUrl,
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
