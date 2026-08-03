/**
 * Wix Media Upload Service - Direct browser-to-Wix Media Manager uploads
 * 
 * This service uses the current supported Wix Media Manager API to:
 * 1. Generate a signed upload URL on the backend
 * 2. Upload the file directly from the browser to that URL
 * 3. Return a real Wix media URL (not base64, not fabricated)
 * 
 * No file bytes pass through our backend - only metadata for URL generation.
 */

import { getSecureContext } from '@wix/sdk';
import { media } from '@wix/media';
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
 * Generate a signed upload URL from Wix Media Manager
 */
async function generateUploadUrl(
  file: File,
  kind: 'image' | 'music'
): Promise<{ uploadUrl: string; fileName: string }> {
  console.log(`[WIX_MEDIA] Generating upload URL for ${kind}: ${file.name}`);
  
  try {
    const wixContext = getSecureContext();
    const mediaClient = media(wixContext);
    const result = await mediaClient.files.generateFileUploadUrl(file.type, { 
      fileName: file.name 
    });
    
    if (!result.uploadUrl) {
      throw new Error('Wix Media Manager did not return an upload URL');
    }
    
    console.log('[WIX_MEDIA] Successfully generated upload URL');
    return { uploadUrl: result.uploadUrl, fileName: file.name };
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
 */
function uploadToWix(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[WIX_MEDIA] File uploaded successfully');
        resolve();
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
    xhr.send(file);
  });
}

/**
 * Get media URL from Wix Media Manager after upload
 */
async function getMediaUrl(fileName: string): Promise<string> {
  console.log('[WIX_MEDIA] Retrieving media URL for:', fileName);
  
  try {
    const wixContext = getSecureContext();
    const mediaClient = media(wixContext);
    
    // List files to find the one we just uploaded
    const files = await mediaClient.files.listFiles();
    
    // Find the file by name (most recent first)
    const uploadedFile = files.items?.find(f => f.fileName === fileName);
    
    if (!uploadedFile || !uploadedFile.url) {
      throw new Error(`Could not find uploaded file: ${fileName}`);
    }
    
    console.log('[WIX_MEDIA] Retrieved media URL:', uploadedFile.url);
    return uploadedFile.url;
  } catch (error) {
    console.error('[WIX_MEDIA] Failed to get media URL:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw {
      code: 'GET_MEDIA_URL_FAILED',
      message: `Failed to get media URL: ${errorMessage}`,
      details: 'Check server logs for more information'
    } as UploadError;
  }
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
    // Step 1: Generate signed upload URL
    const { uploadUrl, fileName } = await generateUploadUrl(file, kind);

    // Step 2: Upload file directly to Wix
    await uploadToWix(file, uploadUrl, onProgress);

    // Step 3: Get the media URL
    const mediaUrl = await getMediaUrl(fileName);

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
