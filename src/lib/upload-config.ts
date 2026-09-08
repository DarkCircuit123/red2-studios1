/** Single source of truth for upload validation rules. */

export interface UploadConfig {
  label: string;
  acceptedMimeTypes: string[];
  /** Kept for backwards compatibility; validation requires an explicit MIME match. */
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
  const normalizedType = file.type.trim().toLowerCase();
  const typeOk = config.acceptedMimeTypes.includes(normalizedType);

  if (!typeOk) {
    return {
      valid: false,
      error: `Unsupported ${config.label} file type: ${file.type || 'unknown'}. Supported: ${config.acceptedMimeTypes.join(', ')}`,
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { valid: false, error: 'File is empty or has an invalid size.' };
  }

  if (file.size > config.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${config.maxSizeLabel} limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
    };
  }

  return { valid: true };
}
