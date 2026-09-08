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
 * Build a renderable HTTPS URL for audio files.
 * Audio files are returned as static HTTPS URLs from Wix Media Manager.
 * Unlike images, audio does NOT need wix:image:// URLs - it needs direct HTTPS URLs.
 */
function buildWixAudioUrl(response: any, file: File): string | undefined {
  console.log('[WIX_MEDIA] buildWixAudioUrl - full upload response:', JSON.stringify(response, null, 2));
  
  const f = response?.file;
  if (!f) {
    console.error('[WIX_MEDIA] buildWixAudioUrl - no file in response', {
      responseKeys: Object.keys(response || {}),
      response
    });
    return undefined;
  }

  console.log('[WIX_MEDIA] buildWixAudioUrl - file object:', {
    fileKeys: Object.keys(f),
    file: f
  });

  // For audio, we want the direct HTTPS URL from the response
  const staticUrl = f?.url;
  if (!staticUrl) {
    console.error('[WIX_MEDIA] buildWixAudioUrl - no URL in response', {
      fileKeys: Object.keys(f),
      file: f
    });
    return undefined;
  }

  console.log('[WIX_MEDIA] buildWixAudioUrl - returning HTTPS audio URL', { 
    staticUrl,
    isHttps: staticUrl.startsWith('https://'),
    domain: new URL(staticUrl).hostname,
    urlLength: staticUrl.length
  });
  return staticUrl;
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
 * Upload file directly to Wix Media Manager using signed URL
 * Returns the media URL from the upload response
 * 
 * For audio files, uses buildWixAudioUrl() to get HTTPS URL
 * For image files, uses buildWixMediaUrl() to get wix:image:// URL
 */
function uploadToWix(
  file: File,
  uploadUrl: string,
  kind: 'image' | 'music' = 'image',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[WIX_MEDIA] File uploaded successfully');
        try {
          const response = JSON.parse(xhr.responseText);
          
          // Use appropriate URL builder based on file kind
          const mediaUrl = kind === 'music' 
            ? buildWixAudioUrl(response, file)
            : buildWixMediaUrl(response, file);
          
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
    console.log(`[WIX_MEDIA] Received upload URL for ${kind}:`, {
      uploadUrlDomain: new URL(uploadUrl).hostname,
      fileName
    });

    // Step 2: Upload file directly to Wix and get media URL from response
    // Pass 'kind' to uploadToWix so it uses the correct URL builder
    const mediaUrl = await uploadToWix(file, uploadUrl, kind, onProgress);
    console.log(`[WIX_MEDIA] ${kind} upload complete:`, { 
      mediaUrl, 
      fileName,
      mediaUrlLength: mediaUrl.length,
      mediaUrlIsHttps: mediaUrl.startsWith('https://')
    });

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
    // Pass 'kind' to uploadToWix so it uses the correct URL builder
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
