/**
 * Media Upload Service - SIMPLIFIED FOR WDE0009 FIX
 * 
 * Handles uploading files and returning data URLs for CMS storage
 * Prevents WDE0009 errors by:
 * 1. Keeping file size under 5MB (compressed images)
 * 2. Storing data URLs (not binary) in CMS fields
 * 3. Using efficient base64 encoding
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
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for CMS storage
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
   * Upload image and return data URL for CMS storage
   * Prevents WDE0009 by keeping files under 5MB
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

    // Validate file size (5MB limit for CMS storage)
    if (file.size > this.MAX_FILE_SIZE) {
      throw {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds 5MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB. Please compress your image.`,
      } as MediaUploadError;
    }

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      // Upload via API endpoint
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
   * Check if a URL is a data URL
   */
  static isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }
}

export default MediaUploadService;
