/**
 * Single source of truth for upload validation rules.
 *
 * Root cause this fixes: the image upload limit (50MB) and the music
 * upload limit (200MB, later 500MB) used to be declared separately in
 * three different files - the frontend component, and the backend route
 * - and drifted out of sync with each other for months. The same thing
 * happened with accepted MIME types (audio/x-mpeg was missing from some
 * copies but not others). Import from here everywhere instead of
 * hard-coding a list/number again - if it only exists in one place, it
 * can't disagree with itself.
 */

export interface UploadConfig {
  label: string;
  acceptedMimeTypes: string[];
  /** Prefix fallback - e.g. any 'image/*' is accepted even if not in acceptedMimeTypes explicitly */
  acceptedPrefix: string;
  maxSizeBytes: number;
  maxSizeLabel: string;
}

export const IMAGE_UPLOAD_CONFIG: UploadConfig = {
  label: 'image',
  acceptedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/tiff',
    'image/bmp',
    'image/x-icon',
    'image/heic',
    'image/heif',
  ],
  acceptedPrefix: 'image/',
  maxSizeBytes: 100 * 1024 * 1024,
  maxSizeLabel: '100MB',
};

export const MUSIC_UPLOAD_CONFIG: UploadConfig = {
  label: 'audio',
  acceptedMimeTypes: [
    'audio/mpeg',
    'audio/mp3',
    'audio/x-mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
  ],
  acceptedPrefix: 'audio/',
  maxSizeBytes: 500 * 1024 * 1024,
  maxSizeLabel: '500MB',
};

export function validateFileAgainstConfig(
  file: { type: string; size: number },
  config: UploadConfig
): { valid: true } | { valid: false; error: string } {
  const typeOk =
    config.acceptedMimeTypes.includes(file.type) || file.type.startsWith(config.acceptedPrefix);
  if (!typeOk) {
    return {
      valid: false,
      error: `Unsupported ${config.label} file type: ${file.type || 'unknown'}. Supported: ${config.acceptedMimeTypes.join(', ')}`,
    };
  }
  if (file.size > config.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${config.maxSizeLabel} limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
    };
  }
  return { valid: true };
}
