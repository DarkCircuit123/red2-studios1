import type { UploadConfig } from './upload-config';
import { validateFileAgainstConfig } from './upload-config';

export interface UploadProgress { loaded: number; total: number; percentage: number; }
export interface UploadResult { mediaUrl: string; mediaId?: string; fileName: string; fileSize: number; mimeType: string; }
export interface UploadError { code: string; message: string; details?: string; }
interface UploadUrlResponse { uploadUrl?: unknown; fileName?: unknown; }
const MAX_FILE_NAME_LENGTH = 255;

function sanitizeFilename(value: string): string {
  const trimmed = value.trim().replace(/[\r\n]/g, '');
  const lastDot = trimmed.lastIndexOf('.');
  const ext = lastDot > 0 ? trimmed.slice(lastDot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
  const base = (lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, MAX_FILE_NAME_LENGTH - ext.length);
  return `${base || `upload_${Date.now()}`}${ext}`;
}

function isSafeUploadUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}

function isSafeMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  if (/^wix:(?:image|audio|video):\/\//.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}

async function generateUploadUrl(file: File, kind: 'image' | 'music'): Promise<{ uploadUrl: string; fileName: string }> {
  const fileName = sanitizeFilename(file.name);
  const response = await fetch('/api/media/generate-upload-url', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ fileName, fileType: file.type, kind }) });
  const payload = await response.json().catch(() => null) as UploadUrlResponse | { error?: unknown } | null;
  if (!response.ok || !payload || !isSafeUploadUrl(payload.uploadUrl)) {
    const message = payload && 'error' in payload && typeof payload.error === 'string' ? payload.error : 'Could not prepare the upload.';
    throw { code: 'GENERATE_URL_FAILED', message } as UploadError;
  }
  return { uploadUrl: payload.uploadUrl, fileName: typeof payload.fileName === 'string' ? payload.fileName : fileName };
}

function parseUploadResponse(responseText: string): { mediaUrl: string; mediaId?: string } {
  let payload: any;
  try { payload = JSON.parse(responseText); } catch { throw new Error('Wix returned an invalid upload response.'); }
  const fileRecord = payload?.file;
  const mediaUrl = fileRecord?.url;
  if (!isSafeMediaUrl(mediaUrl)) throw new Error('Wix returned an invalid media URL.');
  return { mediaUrl, mediaId: typeof fileRecord?.id === 'string' ? fileRecord.id : undefined };
}

function uploadToWix(file: File, uploadUrl: string, onProgress?: (progress: UploadProgress) => void): Promise<{ mediaUrl: string; mediaId?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 300_000;
    xhr.addEventListener('load', () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(`Upload failed with status ${xhr.status}.`));
      try { resolve(parseUploadResponse(xhr.responseText)); } catch (error) { reject(error); }
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload was aborted.')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out.')));
    xhr.upload.addEventListener('progress', (event) => { if (event.lengthComputable) onProgress?.({ loaded: event.loaded, total: event.total, percentage: Math.round((event.loaded / event.total) * 100) }); });
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export async function uploadMedia(file: File, kind: 'image' | 'music', config: UploadConfig, onProgress?: (progress: UploadProgress) => void): Promise<UploadResult> {
  const validation = validateFileAgainstConfig({ type: file.type, size: file.size }, config);
  if (!validation.valid) throw { code: 'INVALID_FILE', message: validation.error } as UploadError;
  try {
    const { uploadUrl, fileName } = await generateUploadUrl(file, kind);
    const result = await uploadToWix(file, uploadUrl, onProgress);
    return { mediaUrl: result.mediaUrl, mediaId: result.mediaId, fileName, fileSize: file.size, mimeType: file.type };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error;
    throw { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed.' } as UploadError;
  }
}

export async function uploadToWixMedia(file: File, kind: 'image' | 'music'): Promise<string> {
  const config: UploadConfig = kind === 'music'
    ? { label: 'audio', acceptedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'], acceptedPrefix: 'audio/', maxSizeBytes: 500 * 1024 * 1024, maxSizeLabel: '500MB' }
    : { label: 'image', acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'image/bmp', 'image/x-icon', 'image/heic', 'image/heif'], acceptedPrefix: 'image/', maxSizeBytes: 100 * 1024 * 1024, maxSizeLabel: '100MB' };
  return (await uploadMedia(file, kind, config)).mediaUrl;
}

export async function importMediaFromUrl(url: string, kind: 'image' | 'music'): Promise<UploadResult> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl.length > 2048) throw { code: 'IMPORT_FAILED', message: 'Please provide a valid file URL.' } as UploadError;
  try {
    const response = await fetch('/api/media/import-from-url', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ url: trimmedUrl, kind }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success || !isSafeMediaUrl(payload.mediaUrl)) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Media import failed.');
    return { mediaUrl: payload.mediaUrl, mediaId: typeof payload.mediaId === 'string' ? payload.mediaId : undefined, fileName: typeof payload.fileName === 'string' ? payload.fileName : `imported-${kind}`, fileSize: typeof payload.detectedSizeBytes === 'number' ? payload.detectedSizeBytes : 0, mimeType: typeof payload.detectedType === 'string' ? payload.detectedType : '' };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error;
    throw { code: 'IMPORT_FAILED', message: error instanceof Error ? error.message : 'Failed to import from URL.' } as UploadError;
  }
}

export function createPreviewUrl(file: File): string { return URL.createObjectURL(file); }
export function revokePreviewUrl(url: string): void { URL.revokeObjectURL(url); }
export function isDataUrl(url: string): boolean { return url.trim().toLowerCase().startsWith('data:'); }
