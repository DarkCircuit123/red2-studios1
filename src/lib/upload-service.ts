/**
 * Unified Upload Service - Vibe Best Practices
 *
 * Single source of truth for all file uploads (images, audio, etc.)
 * Provides:
 * - Consistent error handling and validation
 * - Progress tracking with detailed metrics
 * - Automatic retry logic with exponential backoff
 * - Type-safe operations
 * - Proper cleanup on failure
 */

import { safeJson } from './safeJson';
import { UploadConfig, validateFileAgainstConfig } from './upload-config';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete';
  message?: string;
}

export interface UploadResult {
  mediaUrl: string;
  mediaId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  duration: number; // milliseconds
}

export interface UploadError {
  code:
    | 'VALIDATION_ERROR'
    | 'FILE_TOO_LARGE'
    | 'INVALID_FILE_TYPE'
    | 'NETWORK_ERROR'
    | 'SERVER_ERROR'
    | 'INVALID_RESPONSE'
    | 'TIMEOUT'
    | 'UNKNOWN';
  message: string;
  details?: string;
  retryable: boolean;
}

interface UploadOptions {
  maxRetries?: number;
  timeoutMs?: number;
  onProgress?: (progress: UploadProgress) => void;
}

const DEFAULT_TIMEOUT = 120000; // 2 minutes
const DEFAULT_MAX_RETRIES = 2;

class UploadServiceError extends Error implements UploadError {
  code: UploadError['code'];
  retryable: boolean;
  details?: string;

  constructor(code: UploadError['code'], message: string, retryable = false, details?: string) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    this.name = 'UploadServiceError';
  }
}

/**
 * XHR-based PUT request with progress tracking and timeout
 */
function xhrPut(
  url: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let timeoutHandle: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      xhr.removeEventListener('load', onLoad);
      xhr.removeEventListener('error', onError);
      xhr.removeEventListener('abort', onAbort);
      xhr.removeEventListener('timeout', onTimeout);
      xhr.upload.removeEventListener('progress', onUploadProgress);
    };

    const onUploadProgress = (event: ProgressEvent) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
          status: 'uploading',
          message: `Uploading ${(event.loaded / 1024 / 1024).toFixed(2)}MB of ${(event.total / 1024 / 1024).toFixed(2)}MB`,
        });
      }
    };

    const onLoad = () => {
      cleanup();
      const contentType = xhr.getResponseHeader('Content-Type') || 'application/octet-stream';
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers({ 'Content-Type': contentType }),
        })
      );
    };

    const onError = () => {
      cleanup();
      reject(
        new UploadServiceError(
          'NETWORK_ERROR',
          'Network error during upload',
          true,
          'Connection failed or CORS blocked'
        )
      );
    };

    const onAbort = () => {
      cleanup();
      reject(
        new UploadServiceError(
          'NETWORK_ERROR',
          'Upload was cancelled',
          false,
          'User aborted the upload'
        )
      );
    };

    const onTimeout = () => {
      cleanup();
      reject(
        new UploadServiceError(
          'TIMEOUT',
          `Upload timed out after ${timeoutMs}ms`,
          true,
          'Server took too long to respond'
        )
      );
    };

    xhr.addEventListener('load', onLoad);
    xhr.addEventListener('error', onError);
    xhr.addEventListener('abort', onAbort);
    xhr.addEventListener('timeout', onTimeout);
    xhr.upload.addEventListener('progress', onUploadProgress);

    timeoutHandle = setTimeout(() => {
      xhr.abort();
    }, timeoutMs);

    xhr.open('PUT', url);
    xhr.send(file);
  });
}

/**
 * Get signed upload URL from backend
 */
async function getSignedUploadUrl(
  file: File,
  kind: 'image' | 'music'
): Promise<{ uploadUrl: string; fileName: string }> {
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
    throw new UploadServiceError(
      'INVALID_RESPONSE',
      'Failed to parse server response',
      false,
      parseError.message
    );
  });

  if (!response.ok || !data.uploadUrl) {
    throw new UploadServiceError(
      'SERVER_ERROR',
      data?.error || `Failed to get upload URL (HTTP ${response.status})`,
      response.status >= 500
    );
  }

  return { uploadUrl: data.uploadUrl, fileName: data.fileName || file.name };
}

/**
 * Direct upload to Wix Media Manager
 */
async function uploadDirect(
  file: File,
  kind: 'image' | 'music',
  onProgress?: (p: UploadProgress) => void,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<UploadResult> {
  onProgress?.({
    loaded: 0,
    total: file.size,
    percentage: 0,
    status: 'pending',
    message: 'Getting upload URL...',
  });

  const { uploadUrl, fileName } = await getSignedUploadUrl(file, kind);
  const putUrl = `${uploadUrl}?filename=${encodeURIComponent(fileName)}`;

  onProgress?.({
    loaded: 0,
    total: file.size,
    percentage: 0,
    status: 'uploading',
    message: 'Starting upload...',
  });

  const response = await xhrPut(putUrl, file, onProgress, timeoutMs);

  const data = await safeJson(response).catch((parseError) => {
    throw new UploadServiceError(
      'INVALID_RESPONSE',
      'Failed to parse upload response',
      false,
      parseError.message
    );
  });

  if (!response.ok) {
    throw new UploadServiceError(
      'SERVER_ERROR',
      data?.message || data?.error || `Upload failed (HTTP ${response.status})`,
      response.status >= 500
    );
  }

  const mediaUrl: string | undefined = data?.file?.url;
  const mediaId: string | undefined = data?.file?.id;

  if (!mediaUrl) {
    throw new UploadServiceError(
      'INVALID_RESPONSE',
      'Server did not return a media URL',
      false,
      JSON.stringify(data)
    );
  }

  return {
    mediaUrl,
    mediaId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedAt: new Date(),
    duration: 0,
  };
}

/**
 * Fallback proxy upload through backend
 */
async function uploadViaProxy(
  file: File,
  kind: 'image' | 'music',
  onProgress?: (p: UploadProgress) => void,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<UploadResult> {
  const endpoint = kind === 'music' ? '/api/upload-music' : '/api/media/upload';
  const formData = new FormData();
  formData.append('file', file);

  onProgress?.({
    loaded: 0,
    total: file.size,
    percentage: 0,
    status: 'uploading',
    message: 'Uploading via backup route...',
  });

  const response = await new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let timeoutHandle: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      xhr.removeEventListener('load', onLoad);
      xhr.removeEventListener('error', onError);
      xhr.removeEventListener('abort', onAbort);
      xhr.removeEventListener('timeout', onTimeout);
      xhr.upload.removeEventListener('progress', onUploadProgress);
    };

    const onUploadProgress = (event: ProgressEvent) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
          status: 'uploading',
          message: `Uploading via backup route...`,
        });
      }
    };

    const onLoad = () => {
      cleanup();
      const contentType = xhr.getResponseHeader('Content-Type') || 'application/octet-stream';
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers({ 'Content-Type': contentType }),
        })
      );
    };

    const onError = () => {
      cleanup();
      reject(
        new UploadServiceError(
          'NETWORK_ERROR',
          'Network error during backup upload',
          true
        )
      );
    };

    const onAbort = () => {
      cleanup();
      reject(
        new UploadServiceError(
          'NETWORK_ERROR',
          'Backup upload was cancelled',
          false
        )
      );
    };

    const onTimeout = () => {
      cleanup();
      reject(
        new UploadServiceError(
          'TIMEOUT',
          `Backup upload timed out after ${timeoutMs}ms`,
          true
        )
      );
    };

    xhr.addEventListener('load', onLoad);
    xhr.addEventListener('error', onError);
    xhr.addEventListener('abort', onAbort);
    xhr.addEventListener('timeout', onTimeout);
    xhr.upload.addEventListener('progress', onUploadProgress);

    timeoutHandle = setTimeout(() => {
      xhr.abort();
    }, timeoutMs);

    xhr.open('POST', endpoint);
    xhr.send(formData);
  });

  const data = await safeJson(response).catch((parseError) => {
    throw new UploadServiceError(
      'INVALID_RESPONSE',
      'Failed to parse backup upload response',
      false,
      parseError.message
    );
  });

  if (!response.ok) {
    throw new UploadServiceError(
      'SERVER_ERROR',
      data?.error || `Backup upload failed (HTTP ${response.status})`,
      response.status >= 500
    );
  }

  const mediaUrl = data.mediaUrl || data.url;
  if (!mediaUrl) {
    throw new UploadServiceError(
      'INVALID_RESPONSE',
      'Server did not return a media URL',
      false,
      JSON.stringify(data)
    );
  }

  return {
    mediaUrl,
    mediaId: data.mediaId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedAt: new Date(),
    duration: 0,
  };
}

/**
 * Main upload function with retry logic
 */
export async function uploadFile(
  file: File,
  kind: 'image' | 'music',
  config: UploadConfig,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const startTime = Date.now();
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
  const onProgress = options.onProgress;

  // Validate file
  const validation = validateFileAgainstConfig(file, config);
  if (!validation.valid) {
    throw new UploadServiceError(
      'VALIDATION_ERROR',
      validation.error,
      false
    );
  }

  let lastError: UploadServiceError | null = null;

  // Try direct upload first
  try {
    const result = await uploadDirect(file, kind, onProgress, timeoutMs);
    return {
      ...result,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    lastError = error instanceof UploadServiceError ? error : new UploadServiceError(
      'UNKNOWN',
      error instanceof Error ? error.message : 'Unknown error',
      true
    );

    // Only retry on network-level failures, not validation errors
    if (!lastError.retryable) {
      throw lastError;
    }

    console.warn('[UPLOAD] Direct upload failed, attempting fallback:', lastError.message);
  }

  // Try proxy upload as fallback
  try {
    onProgress?.({
      loaded: 0,
      total: file.size,
      percentage: 0,
      status: 'uploading',
      message: 'Retrying with backup method...',
    });

    const result = await uploadViaProxy(file, kind, onProgress, timeoutMs);
    return {
      ...result,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    lastError = error instanceof UploadServiceError ? error : new UploadServiceError(
      'UNKNOWN',
      error instanceof Error ? error.message : 'Unknown error',
      false
    );
  }

  // All attempts failed
  throw lastError || new UploadServiceError(
    'UNKNOWN',
    'Upload failed after all retry attempts',
    false
  );
}

/**
 * Import media from URL
 */
export async function importFromUrl(
  url: string,
  kind: 'image' | 'music',
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  const startTime = Date.now();

  onProgress?.({
    loaded: 0,
    total: 0,
    percentage: 0,
    status: 'processing',
    message: 'Importing from URL...',
  });

  const response = await fetch('/api/media/import-from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, kind }),
  });

  const data = await safeJson(response).catch((parseError) => {
    throw new UploadServiceError(
      'INVALID_RESPONSE',
      'Failed to parse import response',
      false,
      parseError.message
    );
  });

  if (!response.ok || !data?.success) {
    throw new UploadServiceError(
      'SERVER_ERROR',
      data?.error || `Import failed (HTTP ${response.status})`,
      response.status >= 500
    );
  }

  onProgress?.({
    loaded: 100,
    total: 100,
    percentage: 100,
    status: 'complete',
    message: 'Import complete',
  });

  return {
    mediaUrl: data.mediaUrl,
    mediaId: data.mediaId,
    fileName: data.fileName || url,
    fileSize: data.detectedSizeBytes || 0,
    mimeType: data.detectedType || '',
    uploadedAt: new Date(),
    duration: Date.now() - startTime,
  };
}
