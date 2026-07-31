/**
 * Media Upload Service - now a thin wrapper around the shared
 * direct-media-upload engine (see src/lib/direct-media-upload.ts).
 *
 * History, for context: this used to fabricate a fake static.wixstatic.com
 * URL without uploading anything (never fixed WDE0009), then was fixed to
 * proxy the file through our own /api/media/upload Cloudflare Worker
 * route (fixed WDE0009, but a Worker buffering the whole file in memory
 * is fragile for larger files and was the direct cause of the
 * "Unexpected token '<'" failures diagnosed this session). It now uploads
 * directly from the browser to Wix Media Manager, with the old
 * proxy-through-backend route kept alive only as an automatic fallback.
 *
 * Public API is unchanged on purpose so existing callers (e.g.
 * ImageUploadManager.tsx) don't need to change.
 */

import { uploadMedia, UploadProgress as SharedUploadProgress } from './direct-media-upload';
import { IMAGE_UPLOAD_CONFIG } from './upload-config';

export type MediaUploadProgress = SharedUploadProgress;

export interface MediaUploadResult {
  mediaUrl: string;
  mediaId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface MediaUploadError {
  code: string;
  message: string;
  details?: string;
}

class MediaUploadService {
  /**
   * Upload image to Wix Media Manager (direct-from-browser, with an
   * automatic fallback to the proxy route if that's ever blocked).
   * Returns a real Wix media URL (not base64, not fabricated).
   */
  static async uploadImage(
    file: File,
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaUploadResult> {
    try {
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG, onProgress);
      return {
        mediaUrl: result.mediaUrl,
        mediaId: result.mediaId || '',
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error as MediaUploadError;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      throw { code: 'UPLOAD_ERROR', message: errorMessage } as MediaUploadError;
    }
  }

  /**
   * Generate preview URL from File using URL.createObjectURL
   * Use this for local previews instead of base64
   * This is memory-efficient and doesn't bloat the CMS
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to free memory
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Check if a URL is a Wix media URL
   */
  static isWixMediaUrl(url: string): boolean {
    return url.startsWith('wix:image://') || url.includes('static.wixstatic.com');
  }

  /**
   * Check if a URL is a data URL (should NOT be used for CMS storage)
   * This includes both base64 and blob URLs
   */
  static isDataUrl(url: string): boolean {
    return url.startsWith('data:') || url.startsWith('blob:');
  }

  /**
   * Check if a URL is a blob URL (temporary preview)
   */
  static isBlobUrl(url: string): boolean {
    return url.startsWith('blob:');
  }

  /**
   * Check if a URL is a base64 data URL
   */
  static isBase64Url(url: string): boolean {
    return url.startsWith('data:image/') || url.startsWith('data:application/');
  }
}

export default MediaUploadService;
