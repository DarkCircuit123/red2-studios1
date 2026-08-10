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
 * Turn the upload response into a URL the site can actually RENDER.
 *
 * This is the difference between "saved" and "visible".
 *
 * The bare `file.url` that Wix returns looks like:
 *   https://static.wixstatic.com/media/e9d727_abc~mv2.jpg
 *
 * The site's <Image> component (src/components/ui/image.tsx, getImageData)
 * only understands two shapes:
 *   1. wix:image://v1/<id>/<filename>#originWidth=W&originHeight=H
 *   2. a static.wixstatic.com URL that ALREADY carries ?originWidth=&originHeight=
 *
 * A bare static URL matches neither, so getImageData returns undefined, Wix's
 * image SDK cannot compute a scaled src, and the image does not render - even
 * though the value is correctly stored in the CMS. Every image on this site
 * that works is in form 1; that is why the pre-existing ones render and freshly
 * uploaded ones did not.
 *
 * The upload response already contains the id and the real pixel dimensions
 * under file.media.image.image, so we assemble form 1 here. If metadata is
 * missing, we extract the media ID from the static URL and build a valid
 * wix:image://v1 URL. We never return a bare static URL.
 */
function buildWixMediaUrl(response: any, file: File): string | undefined {
  console.log('[WIX_MEDIA] buildWixMediaUrl - upload response:', response);
  
  const f = response?.file;
  if (!f) {
    console.error('[WIX_MEDIA] buildWixMediaUrl - no file in response');
    return undefined;
  }

  const img = f?.media?.image?.image;
  let id: string | undefined = img?.id || f?.id;
  const width = Number(img?.width);
  const height = Number(img?.height);
  const filename: string = img?.filename || f?.displayName || file.name;

  // If we have complete metadata, build the wix:image://v1 URL
  if (id && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    const url =
      `wix:image://v1/${id}/${encodeURIComponent(filename)}` +
      `#originWidth=${width}&originHeight=${height}`;
    console.log('[WIX_MEDIA] built renderable media URL from metadata', { id, width, height, url });
    return url;
  }

  // Metadata is missing - try to extract media ID from the static URL
  const staticUrl = f?.url;
  if (!staticUrl) {
    console.error('[WIX_MEDIA] buildWixMediaUrl - no URL in response');
    return undefined;
  }

  console.warn('[WIX_MEDIA] upload response missing image dimensions, attempting to extract media ID from static URL');

  // Extract media ID from static URL
  // Formats:
  //   Images: https://static.wixstatic.com/media/{mediaId}~{variant}.{ext}
  //   Music:  https://music.wixstatic.com/mp3/{mediaId}.mp3
  // Examples:
  //   https://static.wixstatic.com/media/e9d727_abc~mv2.jpg
  //   https://music.wixstatic.com/mp3/e9d727_948e0828bec8409fa0e9ff724b1806ae.mp3
  
  // Try image format first (with ~ separator)
  let mediaIdMatch = staticUrl.match(/\/media\/([^~]+)/);
  
  // If not found, try music format (direct filename without ~)
  if (!mediaIdMatch || !mediaIdMatch[1]) {
    mediaIdMatch = staticUrl.match(/\/(media|mp3)\/([^.]+)/);
    if (mediaIdMatch && mediaIdMatch[2]) {
      mediaIdMatch = [mediaIdMatch[0], mediaIdMatch[2]]; // Normalize to [fullMatch, id]
    }
  }
  
  if (!mediaIdMatch || !mediaIdMatch[1]) {
    console.error('[WIX_MEDIA] buildWixMediaUrl - could not extract media ID from static URL', { staticUrl });
    return undefined;
  }

  id = mediaIdMatch[1];
  console.log('[WIX_MEDIA] extracted media ID from static URL', { extractedId: id, staticUrl });

  // If we have dimensions, use them; otherwise use placeholder dimensions
  // (This ensures the image is at least renderable, even if not perfectly sized)
  const finalWidth = Number.isFinite(width) && width > 0 ? width : 1200;
  const finalHeight = Number.isFinite(height) && height > 0 ? height : 800;

  const url =
    `wix:image://v1/${id}/${encodeURIComponent(filename)}` +
    `#originWidth=${finalWidth}&originHeight=${finalHeight}`;
  
  console.log('[WIX_MEDIA] built renderable media URL from extracted ID', { 
    id, 
    width: finalWidth, 
    height: finalHeight, 
    url,
    usedPlaceholderDimensions: !(Number.isFinite(width) && width > 0)
  });
  
  return url;
}

/**
 * Dedicated audio URL resolver for uploaded music files.
 * 
 * Converts Wix media upload response to a valid HTTPS audio URL that
 * HTMLAudioElement can load and play.
 * 
 * The upload response contains a static URL like:
 *   https://music.wixstatic.com/mp3/{mediaId}.mp3
 *   or
 *   https://static.wixstatic.com/media/{mediaId}~{variant}.{ext}
 * 
 * We extract and return the HTTPS URL directly - no wix:image:// conversion.
 */
function buildWixAudioUrl(response: any, file: File): string | undefined {
  console.log('[WIX_AUDIO] buildWixAudioUrl - upload response:', response);
  
  const f = response?.file;
  if (!f) {
    console.error('[WIX_AUDIO] buildWixAudioUrl - no file in response');
    return undefined;
  }

  // Get the static URL from the response
  const staticUrl = f?.url;
  if (!staticUrl) {
    console.error('[WIX_AUDIO] buildWixAudioUrl - no URL in response');
    return undefined;
  }

  // Validate it's an HTTPS URL
  if (!staticUrl.startsWith('https://')) {
    console.error('[WIX_AUDIO] buildWixAudioUrl - URL is not HTTPS', { staticUrl });
    return undefined;
  }

  // Validate it's a Wix static domain (music.wixstatic.com or static.wixstatic.com)
  if (!staticUrl.includes('wixstatic.com')) {
    console.error('[WIX_AUDIO] buildWixAudioUrl - URL is not from Wix static domain', { staticUrl });
    return undefined;
  }

  console.log('[WIX_AUDIO] resolved audio URL', { staticUrl });
  return staticUrl;
}

/**
 * Upload file directly to Wix Media Manager using signed URL
 * Returns the media URL from the upload response
 * 
 * For audio files, uses buildWixAudioUrl to resolve to HTTPS URL.
 * For image files, uses buildWixMediaUrl to resolve to wix:image:// URL.
 */
function uploadToWix(
  file: File,
  uploadUrl: string,
  kind: 'image' | 'music' = 'image',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const uploadId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(`[WIX_MEDIA] [${uploadId}] File uploaded successfully, status: ${xhr.status}`);
        try {
          const response = JSON.parse(xhr.responseText);
          
          // Use appropriate URL builder based on file kind
          let mediaUrl: string | undefined;
          if (kind === 'music') {
            console.log(`[WIX_MEDIA] [${uploadId}] Using buildWixAudioUrl for audio file`);
            mediaUrl = buildWixAudioUrl(response, file);
          } else {
            console.log(`[WIX_MEDIA] [${uploadId}] Using buildWixMediaUrl for image file`);
            mediaUrl = buildWixMediaUrl(response, file);
          }
          
          if (mediaUrl) {
            console.log(`[WIX_MEDIA] [${uploadId}] Media URL resolved:`, { 
              kind, 
              urlType: mediaUrl.startsWith('wix:') ? 'wix:image://' : 'https://',
              urlLength: mediaUrl.length
            });
            resolve(mediaUrl);
          } else {
            console.error(`[WIX_MEDIA] [${uploadId}] URL builder returned undefined for ${kind}`);
            reject(new Error('Upload response missing media URL'));
          }
        } catch (e) {
          console.error(`[WIX_MEDIA] [${uploadId}] Failed to parse upload response:`, e);
          reject(new Error(`Failed to parse upload response: ${e instanceof Error ? e.message : String(e)}`));
        }
      } else {
        console.error(`[WIX_MEDIA] [${uploadId}] Upload failed with status ${xhr.status}`);
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      console.error(`[WIX_MEDIA] [${uploadId}] Network error during upload`);
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      console.error(`[WIX_MEDIA] [${uploadId}] Upload was aborted`);
      reject(new Error('Upload was aborted'));
    });

    xhr.addEventListener('timeout', () => {
      console.error(`[WIX_MEDIA] [${uploadId}] Upload timed out`);
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
  const uploadId = crypto.randomUUID();
  console.log(`[WIX_MEDIA] [${uploadId}] Starting ${kind} upload: ${file.name} (${file.size} bytes, type: ${file.type})`);

  // Validate file against config
  const validation = validateFileAgainstConfig({ type: file.type, size: file.size }, config);
  if (!validation.valid) {
    console.error(`[WIX_MEDIA] [${uploadId}] Validation failed: ${validation.error}`);
    throw {
      code: 'INVALID_FILE',
      message: validation.error
    } as UploadError;
  }

  try {
    // Step 1: Request signed upload URL from backend
    console.log(`[WIX_MEDIA] [${uploadId}] Requesting upload URL from backend`);
    const { uploadUrl, fileName } = await generateUploadUrl(file, kind);

    // Step 2: Upload file directly to Wix and get media URL from response
    // Pass kind to uploadToWix so it uses the correct URL builder
    console.log(`[WIX_MEDIA] [${uploadId}] Uploading to Wix Media Manager`);
    const mediaUrl = await uploadToWix(file, uploadUrl, kind, onProgress);

    console.log(`[WIX_MEDIA] [${uploadId}] ${kind} upload complete:`, { 
      mediaUrl, 
      fileName,
      mediaUrlType: mediaUrl.startsWith('wix:') ? 'wix:image://' : 'https://',
      mediaUrlLength: mediaUrl.length
    });

    return {
      mediaUrl,
      fileName,
      fileSize: file.size,
      mimeType: file.type
    };
  } catch (error) {
    console.error(`[WIX_MEDIA] [${uploadId}] ${kind} upload failed:`, error);
    
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
 * Simple upload function for direct use in components
 * Returns just the media URL string
 */
export async function uploadToWixMedia(
  file: File,
  kind: 'image' | 'music'
): Promise<string> {
  console.log(`[WIX_MEDIA] uploadToWixMedia - Starting ${kind} upload: ${file.name}`);

  try {
    // Request signed upload URL from backend
    const { uploadUrl } = await generateUploadUrl(file, kind);
    
    // Upload file directly to Wix and get media URL
    // CRITICAL: Pass kind parameter so uploadToWix uses correct URL builder
    const mediaUrl = await uploadToWix(file, uploadUrl, kind);
    
    console.log(`[WIX_MEDIA] uploadToWixMedia - Upload successful, returning URL: ${mediaUrl}`);
    return mediaUrl;
  } catch (error) {
    console.error(`[WIX_MEDIA] uploadToWixMedia - Upload failed:`, error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload ${kind}: ${errorMsg}`);
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
