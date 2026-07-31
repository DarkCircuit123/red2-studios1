/**
 * Shared upload engine for both images and music.
 *
 * Why one shared file instead of the old setup (media-upload-service.ts
 * for images, separate inline logic in MusicManager.tsx for music, plus
 * a dead unused copy in MusicUploadManager.tsx): every bug found this
 * session that affected "uploads" only affected ONE of those files at a
 * time, because they were three separate, slightly different copies of
 * the same logic. A fix applied to one silently didn't apply to the
 * others. There is now exactly one place this logic lives.
 *
 * Upload strategy - two-tier, automatic, no user-visible choice:
 *
 * Tier 1 (primary): ask our backend for a signed Wix Media Manager
 * upload URL (a few hundred bytes of JSON, no file content), then PUT
 * the file directly from the browser to that URL. Our own server is
 * never in the path for the actual file bytes. This avoids the
 * Cloudflare Worker memory-buffering fragility that a proxied upload
 * has, and it's the flow Wix's own docs describe this URL for.
 *
 * Tier 2 (automatic fallback): if tier 1 fails in a way that looks like
 * a network/CORS-level failure specifically (not a validation error, not
 * a real server error with a real status code) - retry through the old
 * proxy-through-backend route instead. This is the safety net Jordan
 * asked for: "workarounds... to bypass future disasters" - if direct
 * upload ever turns out to be blocked for some environment, uploads
 * keep working instead of hard-failing.
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
  code:
    | 'INVALID_FILE_TYPE'
    | 'FILE_TOO_LARGE'
    | 'GET_UPLOAD_URL_FAILED'
    | 'UPLOAD_FAILED'
    | 'INVALID_RESPONSE'
    | 'UPLOAD_ERROR';
  message: string;
  details?: string;
}

function xhrPut(
  url: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
  timeoutMs = 120000
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });
    }

    xhr.addEventListener('load', () => {
      // Pass through the REAL content-type the server sent - never
      // fabricate one. A response that's honestly labelled text/html
      // fails safeJson with a readable message; a response dishonestly
      // relabelled as application/json is what caused the confusing
      // "Unexpected token '<'" crash earlier this session.
      const contentType = xhr.getResponseHeader('Content-Type') || 'application/octet-stream';
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers({ 'Content-Type': contentType }),
        })
      );
    });

    // A genuine network-level failure (DNS, CORS preflight rejection,
    // connection refused) fires 'error' with no status at all - this is
    // the signal tier 2 fallback watches for.
    xhr.addEventListener('error', () => reject(new NetworkLevelFailure('Network error during direct upload')));
    xhr.addEventListener('abort', () => reject(new NetworkLevelFailure('Upload was aborted')));
    xhr.timeout = timeoutMs;
    xhr.addEventListener('timeout', () => reject(new NetworkLevelFailure('Upload timed out')));

    xhr.open('PUT', url);
    xhr.send(file);
  });
}

class NetworkLevelFailure extends Error {}

async function getSignedUploadUrl(
  file: File,
  kind: 'image' | 'music'
): Promise<{ uploadUrl: string; fileName: string }> {
  console.log(`[GET_UPLOAD_URL] Requesting signed upload URL for ${kind}: ${file.name}`);
  const response = await fetch('/api/media/get-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      sizeInBytes: file.size,
      kind,
    }),
  });

  const data = await safeJson(response).catch((parseError) => {
    console.error(`[GET_UPLOAD_URL] Failed to parse response:`, parseError.message);
    throw { code: 'GET_UPLOAD_URL_FAILED', message: parseError.message } as UploadError;
  });

  if (!response.ok || !data.uploadUrl) {
    console.error(`[GET_UPLOAD_URL] Failed with status ${response.status}:`, data);
    const errorMsg = data?.error || data?.details || `Failed to get upload URL (HTTP ${response.status})`;
    throw {
      code: 'GET_UPLOAD_URL_FAILED',
      message: errorMsg,
      details: data?.details
    } as UploadError;
  }

  console.log(`[GET_UPLOAD_URL] Successfully got upload URL`);
  return { uploadUrl: data.uploadUrl, fileName: data.fileName || file.name };
}

/** Old proxy-through-backend path, kept alive as the tier-2 fallback. */
async function uploadViaProxy(
  file: File,
  kind: 'image' | 'music',
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  const endpoint = kind === 'music' ? '/api/upload-music' : '/api/media/upload';
  console.log(`[UPLOAD_PROXY] Uploading via proxy endpoint: ${endpoint}`);
  const formData = new FormData();
  formData.append('file', file);

  const response = await new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });
    }
    xhr.addEventListener('load', () => {
      const contentType = xhr.getResponseHeader('Content-Type') || 'application/octet-stream';
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers({ 'Content-Type': contentType }),
        })
      );
    });
    xhr.addEventListener('error', () => {
      console.error('[UPLOAD_PROXY] Network error during fallback upload');
      reject(new Error('Network error during fallback upload'));
    });
    xhr.addEventListener('abort', () => {
      console.error('[UPLOAD_PROXY] Fallback upload was aborted');
      reject(new Error('Fallback upload was aborted'));
    });
    xhr.timeout = 120000;
    xhr.addEventListener('timeout', () => {
      console.error('[UPLOAD_PROXY] Fallback upload timed out');
      reject(new Error('Fallback upload timed out'));
    });
    xhr.open('POST', endpoint);
    xhr.send(formData);
  });

  const data = await safeJson(response).catch((parseError) => {
    console.error(`[UPLOAD_PROXY] Failed to parse response:`, parseError.message);
    throw { code: 'INVALID_RESPONSE', message: parseError.message } as UploadError;
  });

  if (!response.ok) {
    console.error(`[UPLOAD_PROXY] Proxy upload failed with status ${response.status}:`, data);
    throw {
      code: 'UPLOAD_FAILED',
      message: data?.error || `Upload failed (HTTP ${response.status})`,
    } as UploadError;
  }

  const mediaUrl = data.mediaUrl || data.url;
  if (!mediaUrl) {
    console.error(`[UPLOAD_PROXY] Server returned no media URL. Response:`, data);
    throw { code: 'INVALID_RESPONSE', message: 'Server returned no media URL' } as UploadError;
  }

  console.log(`[UPLOAD_PROXY] Proxy upload successful: ${mediaUrl}`);
  return {
    mediaUrl,
    mediaId: data.mediaId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function uploadMedia(
  file: File,
  kind: 'image' | 'music',
  config: UploadConfig,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  const validation = validateFileAgainstConfig(file, config);
  if (!validation.valid) {
    throw { code: 'INVALID_FILE_TYPE', message: validation.error } as UploadError;
  }

  try {
    // Tier 1: direct browser-to-Wix upload.
    console.log(`[UPLOAD] Starting ${kind} upload for file: ${file.name} (${file.size} bytes)`);
    const { uploadUrl, fileName } = await getSignedUploadUrl(file, kind);
    console.log(`[UPLOAD] Got signed upload URL, uploading to Wix Media Manager...`);
    const putUrl = `${uploadUrl}?filename=${encodeURIComponent(fileName)}`;
    const response = await xhrPut(putUrl, file, onProgress);

    const data = await safeJson(response).catch((parseError) => {
      console.error(`[UPLOAD] Failed to parse response as JSON:`, parseError.message);
      throw { code: 'INVALID_RESPONSE', message: parseError.message } as UploadError;
    });

    if (!response.ok) {
      console.error(`[UPLOAD] Direct upload failed with status ${response.status}:`, data);
      throw {
        code: 'UPLOAD_FAILED',
        message: data?.message || data?.error || `Direct upload failed (HTTP ${response.status})`,
      } as UploadError;
    }

    const mediaUrl: string | undefined = data?.file?.url;
    const mediaId: string | undefined = data?.file?.id;
    console.log(`[UPLOAD] Response received. mediaUrl: ${mediaUrl}, mediaId: ${mediaId}`);
    
    if (!mediaUrl) {
      console.error(`[UPLOAD] Wix Media Manager response missing file URL. Full response:`, JSON.stringify(data));
      throw { code: 'INVALID_RESPONSE', message: 'Wix Media Manager response missing file URL' } as UploadError;
    }

    console.log(`[UPLOAD] Direct upload successful: ${mediaUrl}`);
    return { mediaUrl, mediaId, fileName: file.name, fileSize: file.size, mimeType: file.type };
  } catch (error) {
    // Only fall back on a genuine network/transport-level failure - never
    // on a real validation or server error, since retrying those through
    // a different path would just fail the same way with more delay.
    if (error instanceof NetworkLevelFailure) {
      console.warn('[UPLOAD] Direct-to-Wix upload failed at the network level, falling back to proxy path:', error.message);
      return uploadViaProxy(file, kind, onProgress);
    }
    
    // If we get a GET_UPLOAD_URL_FAILED error (SDK context or permissions issue),
    // also try the fallback since it might work through the proxy path
    if ((error as any)?.code === 'GET_UPLOAD_URL_FAILED') {
      console.warn('[UPLOAD] Failed to get signed upload URL, attempting fallback proxy path:', (error as any)?.message);
      try {
        return await uploadViaProxy(file, kind, onProgress);
      } catch (fallbackError) {
        console.error('[UPLOAD] Fallback proxy upload also failed:', fallbackError);
        throw error; // Throw the original error if fallback fails
      }
    }
    
    console.error('[UPLOAD] Upload failed with error:', error);
    throw error;
  }
}

/**
 * "Paste a link" path. The link is tested server-side (reachability,
 * real content-type, real size) before anything is imported - see
 * src/api/media/import-from-url.ts for exactly what's checked and why
 * each failure gets its own specific message rather than a generic one.
 */
export async function importMediaFromUrl(
  url: string,
  kind: 'image' | 'music'
): Promise<UploadResult> {
  const response = await fetch('/api/media/import-from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, kind }),
  });

  const data = await safeJson(response).catch((parseError) => {
    throw { code: 'INVALID_RESPONSE', message: parseError.message } as UploadError;
  });

  if (!response.ok || !data?.success) {
    throw {
      code: 'UPLOAD_FAILED',
      message: data?.error || `Could not import that link (HTTP ${response.status}).`,
    } as UploadError;
  }

  return {
    mediaUrl: data.mediaUrl,
    mediaId: data.mediaId,
    fileName: data.fileName || url,
    fileSize: data.detectedSizeBytes || 0,
    mimeType: data.detectedType || '',
  };
}
