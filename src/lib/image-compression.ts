/**
 * Client-side image compression utility
 * Compresses images before upload to reduce file size and prevent 413/500 errors
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeBytes: 5 * 1024 * 1024, // 5MB target
};

/**
 * Sanitize filename to remove special characters that might confuse the API
 * Replaces special characters with underscores, keeps only alphanumeric, dots, hyphens, underscores
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[\/\\:\*\?"<>|]/g, '_');
  
  // Replace parentheses and other special chars with underscores
  sanitized = sanitized.replace(/[\(\)\[\]\{\}]/g, '_');
  
  // Replace multiple consecutive underscores with single underscore
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Ensure we have a valid filename
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'image';
  }
  
  return sanitized;
}

/**
 * Compress a single image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img;
          const maxWidth = opts.maxWidth || 2048;
          const maxHeight = opts.maxHeight || 2048;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Sanitize filename and ensure .jpg extension
          const sanitizedName = sanitizeFilename(file.name);
          let finalFilename = sanitizedName.toLowerCase().endsWith('.jpg') || 
                                sanitizedName.toLowerCase().endsWith('.jpeg')
            ? sanitizedName
            : sanitizedName.replace(/\.[^/.]+$/, '') + '.jpg';
          
          // CRITICAL: Double-check .jpg extension for Wix Media API
          if (!finalFilename.toLowerCase().endsWith('.jpg') && !finalFilename.toLowerCase().endsWith('.jpeg')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.jpg';
          }

          // Convert to blob with quality setting
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                throw new Error('Failed to create blob from canvas');
              }

              // If still too large, reduce quality further
              if (blob.size > (opts.maxSizeBytes || 5 * 1024 * 1024)) {
                const quality = (opts.quality || 0.85) * 0.7; // Reduce quality by 30%
                canvas.toBlob(
                  (retryBlob) => {
                    if (!retryBlob) {
                      throw new Error('Failed to create blob with reduced quality');
                    }

                    const compressedFile = new File([retryBlob], finalFilename, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });

                    resolve({
                      file: compressedFile,
                      originalSize: file.size,
                      compressedSize: compressedFile.size,
                      compressionRatio: (compressedFile.size / file.size) * 100,
                      width,
                      height,
                    });
                  },
                  'image/jpeg',
                  quality
                );
              } else {
                const compressedFile = new File([blob], finalFilename, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

                resolve({
                  file: compressedFile,
                  originalSize: file.size,
                  compressedSize: compressedFile.size,
                  compressionRatio: (compressedFile.size / file.size) * 100,
                  width,
                  height,
                });
              }
            },
            'image/jpeg',
            opts.quality || 0.85
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple image files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (const file of files) {
    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // Continue with other files even if one fails
    }
  }

  return results;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
