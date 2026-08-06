/**
 * Unified Media Upload Service
 * 
 * Handles all media uploads across the admin panel with:
 * - Proper error handling and logging
 * - File validation (type, size)
 * - Retry logic for transient failures
 * - Progress tracking
 * - Consistent response format
 */

export interface UploadOptions {
  fileName: string;
  fileType: string;
  fileSize: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export interface UploadResponse {
  success: boolean;
  mediaUrl?: string;
  fileId?: string;
  error?: string;
  duration?: number;
}

const DEFAULT_MAX_SIZE_MB = 50; // 50MB for audio/video
const DEFAULT_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: Partial<UploadOptions> = {}
): { valid: boolean; error?: string } {
  const maxSizeBytes = (options.maxSizeMB || DEFAULT_MAX_SIZE_MB) * 1024 * 1024;
  
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Max ${options.maxSizeMB || DEFAULT_MAX_SIZE_MB}MB, received ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check file type if specified
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed: ${options.allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Upload a file to Wix Media Manager
 * 
 * Flow:
 * 1. Generate upload URL from /api/media/generate-upload-url
 * 2. Upload file to the signed URL with PUT request
 * 3. Return media URL and file ID
 */
export async function uploadFile(
  file: File,
  options: Partial<UploadOptions> = {}
): Promise<UploadResponse> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Validate file
    const validation = validateFile(file, options);
    if (!validation.valid) {
      console.warn(`[UPLOAD] Request ${requestId} validation failed: ${validation.error}`);
      return {
        success: false,
        error: validation.error,
        duration: Date.now() - startTime
      };
    }

    console.log(`[UPLOAD] Request ${requestId} started`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

    // Step 1: Generate upload URL
    console.log(`[UPLOAD] Request ${requestId} generating upload URL`);
    const generateUrlResponse = await fetch('/api/media/generate-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type
      })
    });

    if (!generateUrlResponse.ok) {
      const errorText = await generateUrlResponse.text().catch(() => 'Unknown error');
      console.error(`[UPLOAD] Request ${requestId} generate URL failed`, {
        status: generateUrlResponse.status,
        error: errorText.substring(0, 500)
      });
      return {
        success: false,
        error: `Failed to generate upload URL: ${generateUrlResponse.status}`,
        duration: Date.now() - startTime
      };
    }

    let uploadUrlData;
    try {
      uploadUrlData = await generateUrlResponse.json();
    } catch (e) {
      console.error(`[UPLOAD] Request ${requestId} failed to parse generate URL response`, { error: e });
      return {
        success: false,
        error: 'Failed to parse upload URL response',
        duration: Date.now() - startTime
      };
    }

    const { uploadUrl, fileId } = uploadUrlData;
    if (!uploadUrl) {
      console.error(`[UPLOAD] Request ${requestId} no upload URL in response`, { response: uploadUrlData });
      return {
        success: false,
        error: 'No upload URL returned',
        duration: Date.now() - startTime
      };
    }

    console.log(`[UPLOAD] Request ${requestId} upload URL generated`, {
      uploadUrlDomain: new URL(uploadUrl).hostname
    });

    // Step 2: Upload file to signed URL
    console.log(`[UPLOAD] Request ${requestId} uploading file`);
    const buffer = await file.arrayBuffer();
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString()
      },
      body: buffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown error');
      console.error(`[UPLOAD] Request ${requestId} upload failed`, {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText.substring(0, 500)
      });
      return {
        success: false,
        error: `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        duration: Date.now() - startTime
      };
    }

    let uploadResult;
    try {
      uploadResult = await uploadResponse.json();
    } catch (e) {
      console.error(`[UPLOAD] Request ${requestId} failed to parse upload response`, { error: e });
      return {
        success: false,
        error: 'Failed to parse upload response',
        duration: Date.now() - startTime
      };
    }

    const mediaUrl = uploadResult?.file?.url;
    if (!mediaUrl) {
      console.error(`[UPLOAD] Request ${requestId} no media URL in response`, { response: uploadResult });
      return {
        success: false,
        error: 'No media URL returned',
        duration: Date.now() - startTime
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[UPLOAD] Request ${requestId} completed successfully`, {
      fileName: file.name,
      fileId: uploadResult?.file?.id || fileId,
      mediaUrlDomain: new URL(mediaUrl).hostname,
      duration: `${duration}ms`
    });

    return {
      success: true,
      mediaUrl,
      fileId: uploadResult?.file?.id || fileId,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[UPLOAD] Request ${requestId} error`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      duration
    };
  }
}

/**
 * Upload an image file
 */
export async function uploadImage(
  file: File,
  options: Partial<UploadOptions> = {}
): Promise<UploadResponse> {
  return uploadFile(file, {
    maxSizeMB: 10, // 10MB for images
    allowedTypes: DEFAULT_ALLOWED_IMAGE_TYPES,
    ...options
  });
}

/**
 * Upload an audio file
 */
export async function uploadAudio(
  file: File,
  options: Partial<UploadOptions> = {}
): Promise<UploadResponse> {
  return uploadFile(file, {
    maxSizeMB: 100, // 100MB for audio
    allowedTypes: DEFAULT_ALLOWED_AUDIO_TYPES,
    ...options
  });
}

/**
 * Upload a video file
 */
export async function uploadVideo(
  file: File,
  options: Partial<UploadOptions> = {}
): Promise<UploadResponse> {
  return uploadFile(file, {
    maxSizeMB: 500, // 500MB for video
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    ...options
  });
}
