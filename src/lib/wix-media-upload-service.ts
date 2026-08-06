/**
 * Wix Media Upload Service - Client-side browser uploads
 * 
 * This service handles:
 * 1. Requesting signed upload URLs from the backend (server-only SDK logic)
 * 2. Uploading files directly from the browser to Wix Media Manager
 * 3. Returning media URLs from the upload response
 * 
 * Server-side SDK logic (auth.elevate, media client) is confined to backend endpoints.
 * No file bytes pass through our backend - only metadata for URL generation.
 */

import { safeJson } from './safeJson';
import { UploadConfig, validateFileAgainstConfig } from './upload-config';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  mediaUrl: string;
  mediaId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadError {
  code: string;
  message: string;
  details?: string;
}

/**
 * Request a signed upload URL from the backend
 * The backend uses server-only Wix SDK to generate the URL
 */
async function generateUploadUrl(
  file: File,
  kind: 'image' | 'music'
): Promise<{ uploadUrl: string; fileName: string }> {
  console.log(`[WIX_MEDIA] Requesting upload URL for ${kind}: ${file.name}`);
  
  try {
    // Call backend endpoint to generate signed URL (server-only SDK logic)
    const response = await fetch('/api/media/generate-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        kind
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to generate upload URL: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.uploadUrl) {
      throw new Error('Backend did not return an upload URL');
    }
    
    console.log('[WIX_MEDIA] Successfully received upload URL from backend');
    return { uploadUrl: data.uploadUrl, fileName: file.name };
  } catch (error) {
    console.error('[WIX_MEDIA] Failed to generate upload URL:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw {
      code: 'GENERATE_URL_FAILED',
      message: `Failed to generate upload URL: ${errorMessage}`,
      details: 'Check server logs for more information'
    } as UploadError;
  }
}

/**
 * Upload file directly to Wix Media Manager using signed URL
 * Returns the media URL from the upload response
 */
function uploadToWix(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[WIX_MEDIA] File uploaded successfully');
        try {
          const response = JSON.parse(xhr.responseText);
          const mediaUrl = response?.file?.url;
          if (mediaUrl) {
            resolve(mediaUrl);
          } else {
            reject(new Error('Upload response missing media URL'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse upload response: ${e instanceof Error ? e.message : String(e)}`));
        }
      } else {
        console.error(`[WIX_MEDIA] Upload failed with status ${xhr.status}`);
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      console.error('[WIX_MEDIA] Network error during upload');
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      console.error('[WIX_MEDIA] Upload was aborted');
      reject(new Error('Upload was aborted'));
    });

    xhr.addEventListener('timeout', () => {
      console.error('[WIX_MEDIA] Upload timed out');
      reject(new Error('Upload timed out'));
    });

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          });
        }
      });
    }

    xhr.timeout = 300000; // 5 minutes
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Main upload function - handles both images and music
 */
export async function uploadMedia(
  file: File,
  kind: 'image' | 'music',
  config: UploadConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  console.log(`[WIX_MEDIA] Starting ${kind} upload: ${file.name} (${file.size} bytes)`);

  // Validate file against config
  const validation = validateFileAgainstConfig({ type: file.type, size: file.size }, config);
  if (!validation.valid) {
    console.error(`[WIX_MEDIA] Validation failed: ${validation.error}`);
    throw {
      code: 'INVALID_FILE',
      message: validation.error
    } as UploadError;
  }

  try {
    // Step 1: Request signed upload URL from backend
    const { uploadUrl, fileName } = await generateUploadUrl(file, kind);

    // Step 2: Upload file directly to Wix and get media URL from response
    const mediaUrl = await uploadToWix(file, uploadUrl, onProgress);

    console.log(`[WIX_MEDIA] ${kind} upload complete:`, { mediaUrl, fileName });

    return {
      mediaUrl,
      fileName,
      fileSize: file.size,
      mimeType: file.type
    };
  } catch (error) {
    console.error(`[WIX_MEDIA] ${kind} upload failed:`, error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    
    throw {
      code: 'UPLOAD_FAILED',
      message: error instanceof Error ? error.message : 'Upload failed',
      details: 'Check server logs for more information'
    } as UploadError;
  }
}

/**
 * Import media from external URL
 */
export async function importMediaFromUrl(
  url: string,
  kind: 'image' | 'music'
): Promise<UploadResult> {
  console.log(`[WIX_MEDIA] Importing ${kind} from URL:`, url);

  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (!contentType) {
      throw new Error('URL did not return a content-type header');
    }

    const fileSize = contentLength ? parseInt(contentLength, 10) : 0;

    // Create a File object from the response
    const blob = await response.blob();
    const fileName = url.split('/').pop() || `imported-${kind}-${Date.now()}`;
    const file = new File([blob], fileName, { type: contentType });

    // Upload the file
    return await uploadMedia(file, kind, { maxSize: 100 * 1024 * 1024, mimeTypes: [] });
  } catch (error) {
    console.error(`[WIX_MEDIA] Failed to import ${kind} from URL:`, error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    throw {
      code: 'IMPORT_FAILED',
      message: error instanceof Error ? error.message : 'Failed to import from URL',
      details: 'Check server logs for more information'
    } as UploadError;
  }
}

/**
 * Create a preview URL from a File object (memory-efficient, not base64)
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Check if a URL is a data URL (base64)
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}
