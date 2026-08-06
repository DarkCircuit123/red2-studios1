import { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Trash2, Edit3, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';

interface HeroImageUploaderProps {
  currentImage?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  authToken: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export default function HeroImageUploader({
  currentImage,
  onImageUpdate,
  authToken,
}: HeroImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Allowed: JPEG, PNG, WebP. Received: ${file.type}`,
      };
    }

    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      return {
        valid: false,
        error: `File too large. Max 10MB, received ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    return { valid: true };
  };

  const uploadImage = async (file: File) => {
    setErrorMessage('');
    setStatus('idle');
    setUploadProgress(0);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setStatus('error');
      return;
    }

    setIsUploading(true);

    try {
      // Create local preview
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentage);
        }
      });

      // Handle completion
      const uploadPromise = new Promise<{ success: boolean; mediaUrl?: string; error?: string }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', '/api/media/upload-hero');
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        xhr.send(formData);
      });

      const result = await uploadPromise;

      if (!result.success || !result.mediaUrl) {
        throw new Error(result.error || 'Upload failed');
      }

      // Save to CMS
      const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
      if (homepageImages?.items && homepageImages.items.length > 0) {
        const item = homepageImages.items[0] as any;
        await adminCms.update('homepageimages', {
          _id: item._id,
          heroImage: result.mediaUrl,
        });
      }

      onImageUpdate(result.mediaUrl);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('[HeroImageUploader] Error:', error);
      const message = error instanceof Error ? error.message : 'Upload failed';
      setErrorMessage(message);
      setStatus('error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async () => {
    setIsDeleting(true);
    try {
      const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
      if (homepageImages?.items && homepageImages.items.length > 0) {
        const item = homepageImages.items[0] as any;
        await adminCms.update('homepageimages', {
          _id: item._id,
          heroImage: null,
        });
      }

      onImageUpdate(null);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('[HeroImageUploader] Delete error:', error);
      setErrorMessage('Failed to delete image');
      setStatus('error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadImage(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      uploadImage(files[0]);
    }
  };

  return (
    <div className="w-full space-y-3">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-white/60 bg-white/10'
            : status === 'success'
            ? 'border-green-500/40 bg-green-500/5'
            : status === 'error'
            ? 'border-red-500/40 bg-red-500/5'
            : 'border-white/20 hover:border-white/40 bg-white/5'
        }`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-white/60">Uploading hero image...</p>
            {uploadProgress > 0 && (
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/60 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {uploadProgress > 0 && (
              <p className="text-xs text-white/40">{uploadProgress}%</p>
            )}
          </div>
        ) : status === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <p className="text-sm text-green-500">Hero image updated successfully!</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-red-500">Upload failed</p>
          </div>
        ) : currentImage ? (
          <div className="flex flex-col items-center gap-3">
            <Image src={currentImage} alt="Hero preview" className="w-24 h-24 object-cover rounded" />
            <p className="text-xs text-white/60">Current hero image</p>
            <div className="mt-2 flex gap-2 flex-wrap justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-xs text-blue-400 transition-all duration-200 flex items-center gap-1 disabled:opacity-50"
              >
                <Edit3 className="w-3 h-3" />
                {isUploading ? 'Uploading...' : 'Replace'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage();
                }}
                disabled={isDeleting}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded text-xs text-red-400 transition-all duration-200 flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-6 h-6 text-white/40" />
            <p className="text-sm text-white/60">Upload Hero Image</p>
            <p className="text-xs text-white/40">Drag & drop or click to upload</p>
          </div>
        )}
      </motion.div>

      {/* Error message */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
        >
          <p className="text-xs text-red-500">{errorMessage}</p>
        </motion.div>
      )}

      {/* Info */}
      <div className="text-xs text-white/40 space-y-1">
        <p>Supported formats: JPEG, PNG, WebP</p>
        <p>Max file size: 10MB</p>
      </div>
    </div>
  );
}
