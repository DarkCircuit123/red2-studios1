import { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Trash2, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import MediaUploadService, { MediaUploadProgress } from '@/lib/media-upload-service';
import WDE0009FixValidator from '@/lib/wde0009-fix-validation';
import { validateImageStorage, validateCMSUpdatePayload } from '@/lib/image-storage-validator';

interface ImageUploadManagerProps {
  onImageUpload: (imageUrl: string) => void;
  onImageDelete?: () => void;
  currentImage?: string;
  label?: string;
  collectionId?: string;
  itemId?: string;
  fieldName?: string;
  acceptedFormats?: string[];
}

// Supported image formats with MIME types
const SUPPORTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp'],
  'image/x-icon': ['.ico'],
  'image/vnd.adobe.photoshop': ['.psd'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

export default function ImageUploadManager({
  onImageUpload,
  onImageDelete,
  currentImage,
  label = 'Upload Image',
  collectionId,
  itemId,
  fieldName,
  acceptedFormats
}: ImageUploadManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        MediaUploadService.revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  const isValidFileType = (file: File): boolean => {
    if (acceptedFormats && acceptedFormats.length > 0) {
      return acceptedFormats.some(format => file.type === format || file.name.toLowerCase().endsWith(format));
    }
    return Object.keys(SUPPORTED_FORMATS).includes(file.type) || file.type.startsWith('image/');
  };

  const getAcceptString = (): string => {
    if (acceptedFormats && acceptedFormats.length > 0) {
      return acceptedFormats.join(',');
    }
    return Object.keys(SUPPORTED_FORMATS).join(',') + ',image/*';
  };

  const processImage = async (file: File) => {
    setErrorMessage('');
    setUploadStatus('idle');
    setUploadProgress(0);

    // Validate file type
    if (!isValidFileType(file)) {
      setErrorMessage(`Unsupported file type: ${file.type || 'unknown'}. Supported formats: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC, and more.`);
      setUploadStatus('error');
      return;
    }

    setIsProcessing(true);

    try {
      // Create local preview URL using URL.createObjectURL (not base64)
      // This is memory-efficient and doesn't bloat the CMS
      const localPreviewUrl = MediaUploadService.createPreviewUrl(file);
      setPreviewUrl(localPreviewUrl);

      // Upload to Wix Media Manager
      // Returns a Wix media URL (wix:image:// or https://static.wixstatic.com/)
      const result = await MediaUploadService.uploadImage(file, (progress: MediaUploadProgress) => {
        setUploadProgress(progress.percentage);
      });

      // Validate that we got a proper Wix media URL (not base64)
      // This prevents WDE0009 errors
      if (MediaUploadService.isDataUrl(result.mediaUrl)) {
        throw new Error('Upload returned base64 data URL instead of Wix media URL. This would cause WDE0009 error.');
      }

      // FINAL HARDENING: Validate image storage before CMS update
      try {
        validateImageStorage(result.mediaUrl, fieldName || 'image');
      } catch (validationError) {
        throw new Error(`Image storage validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
      }

      // Save media URL (not base64) to CMS if collection info provided
      if (collectionId && itemId && fieldName) {
        try {
          // FINAL HARDENING: Validate entire CMS payload before update
          const updatePayload = {
            _id: itemId,
            [fieldName]: result.mediaUrl
          };
          validateCMSUpdatePayload(collectionId, updatePayload);

          await BaseCrudService.update(collectionId, updatePayload);
          onImageUpload(result.mediaUrl);
          setUploadStatus('success');
          setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (cmsError) {
          console.error('CMS update failed:', cmsError);
          setErrorMessage('Failed to save image reference to CMS. Please try again.');
          setUploadStatus('error');
        }
      } else {
        // No CMS info, just update locally with media URL
        onImageUpload(result.mediaUrl);
        setUploadStatus('success');
        setTimeout(() => setUploadStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMsg = error && typeof error === 'object' && 'message' in error
        ? (error as any).message
        : 'Failed to upload image. Please try again.';
      setErrorMessage(errorMsg);
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
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
      processImage(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImage) return;
    
    setIsDeleting(true);
    try {
      // If collection info provided, delete from CMS
      if (collectionId && itemId && fieldName) {
        await BaseCrudService.update(collectionId, {
          _id: itemId,
          [fieldName]: null
        });
      }
      
      // Call the callback to update parent state
      if (onImageDelete) {
        onImageDelete();
      }
      
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2000);
    } catch (error) {
      console.error('Error deleting image:', error);
      setErrorMessage('Failed to delete image. Please try again.');
      setUploadStatus('error');
    } finally {
      setIsDeleting(false);
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
            : uploadStatus === 'success'
            ? 'border-green-500/40 bg-green-500/5'
            : uploadStatus === 'error'
            ? 'border-red-500/40 bg-red-500/5'
            : 'border-white/20 hover:border-white/40 bg-white/5'
        }`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString()}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-white/60">Uploading image...</p>
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
        ) : uploadStatus === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <p className="text-sm text-green-500">Image uploaded successfully!</p>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-red-500">Upload failed</p>
          </div>
        ) : currentImage ? (
          <div className="flex flex-col items-center gap-3">
            <Image src={currentImage} alt="Preview" className="w-24 h-24 object-cover rounded" />
            <p className="text-xs text-white/60">{label}</p>
            <p className="text-xs text-white/40">Current image</p>
            {currentImage && (
              <div className="mt-2 flex gap-2 flex-wrap justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isProcessing}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-xs text-blue-400 transition-all duration-200 flex items-center gap-1 disabled:opacity-50"
                >
                  <Edit3 className="w-3 h-3" />
                  {isProcessing ? 'Uploading...' : 'Replace'}
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
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-6 h-6 text-white/40" />
            <p className="text-sm text-white/60">{label}</p>
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

      {/* Supported formats info */}
      <div className="text-xs text-white/40 space-y-1">
        <p>Supported formats: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC</p>
        <p>Max file size: 100MB</p>
      </div>
    </div>
  );
}
