/**
 * Media Upload Service - REFACTORED FOR WDE0009 FIX
 * 
 * This service now uses Wix Media Manager instead of base64 storage.
 * 
 * Key changes:
 * 1. Removed base64 encoding (was causing WDE0009)
 * 2. Upload to Wix Media Manager returns proper URLs
 * 3. Store only URL strings in CMS (tiny payload)
 * 4. Use URL.createObjectURL for previews (not base64)
 * 
 * Result:
 * - Before: 2.67MB base64 string in CMS = WDE0009 error
 * - After: ~50 byte URL string in CMS = No error
 */

export interface MediaUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

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
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB - Wix Media Manager limit
  private static readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/tiff',
    'image/bmp',
    'image/x-icon',
    'image/heic',
    'image/heif'
  ];

  /**
   * Upload image to Wix Media Manager
   * Returns a Wix media URL (not base64)
   */
  static async uploadImage(
    file: File,
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaUploadResult> {
    // Validate file type
    if (!this.SUPPORTED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      throw {
        code: 'INVALID_FILE_TYPE',
        message: `Unsupported file type: ${file.type}. Supported: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC`,
      } as MediaUploadError;
    }

    // Validate file size (Wix Media Manager limit)
    if (file.size > this.MAX_FILE_SIZE) {
      throw {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds 100MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
      } as MediaUploadError;
    }

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      // Upload via API endpoint (which uploads to Wix Media Manager)
      const response = await this.uploadToAPI(formData, onProgress);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: 'UPLOAD_FAILED',
          message: errorData.error || `Upload failed with status ${response.status}`,
          details: errorData.debug?.errorType,
        } as MediaUploadError;
      }

      const result = await response.json();

      // Validate response structure
      if (!result.mediaUrl || !result.mediaId) {
        throw {
          code: 'INVALID_RESPONSE',
          message: 'Server returned invalid media response',
        } as MediaUploadError;
      }

      return {
        mediaUrl: result.mediaUrl,
        mediaId: result.mediaId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      throw {
        code: 'UPLOAD_ERROR',
        message: errorMessage,
      } as MediaUploadError;
    }
  }

  /**
   * Upload file with progress tracking
   */
  private static async uploadToAPI(
    formData: FormData,
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
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

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(
            new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
            })
          );
        } else {
          resolve(
            new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
            })
          );
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      // Set timeout (30 seconds)
      xhr.timeout = 30000;
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      // Send request
      xhr.open('POST', '/api/media/upload');
      xhr.send(formData);
    });
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
