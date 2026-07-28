import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Trash2, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[IMAGE_UPLOAD_UI] File selected: ${file.name}, Size: ${fileSizeMB}MB, Type: ${file.type}`);

    setErrorMessage('');
    setUploadStatus('idle');

    // Validate file type
    if (!isValidFileType(file)) {
      const errorMsg = `Unsupported file type: ${file.type || 'unknown'}. Supported formats: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC, and more.`;
      console.error(`[IMAGE_UPLOAD_UI] ${errorMsg}`);
      setErrorMessage(errorMsg);
      setUploadStatus('error');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = `File size exceeds 100MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      console.error(`[IMAGE_UPLOAD_UI] ${errorMsg}`);
      setErrorMessage(errorMsg);
      setUploadStatus('error');
      return;
    }

    console.log(`[IMAGE_UPLOAD_UI] File validation passed, starting upload...`);
    setIsProcessing(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      console.log(`[IMAGE_UPLOAD_UI] Sending to /api/upload-image...`);
      const uploadStart = Date.now();

      // Upload to API endpoint
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const uploadTime = Date.now() - uploadStart;
      console.log(`[IMAGE_UPLOAD_UI] Response received in ${uploadTime}ms, status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Upload failed with status ${response.status}`;
        console.error(`[IMAGE_UPLOAD_UI] Upload error:`, errorData);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const imageUrl = data.url;

      console.log(`[IMAGE_UPLOAD_UI] Upload successful, URL length: ${imageUrl.length} chars`);
      if (data.debug) {
        console.log(`[IMAGE_UPLOAD_UI] Debug info:`, data.debug);
      }

      // If collection info provided, save to CMS
      if (collectionId && itemId && fieldName) {
        try {
          console.log(`[IMAGE_UPLOAD_UI] Updating CMS: ${collectionId}/${itemId}/${fieldName}`);
          await BaseCrudService.update(collectionId, {
            _id: itemId,
            [fieldName]: imageUrl
          });
          console.log(`[IMAGE_UPLOAD_UI] CMS update successful`);
        } catch (cmsError) {
          console.warn('[IMAGE_UPLOAD_UI] CMS update failed, but file was uploaded:', cmsError);
          // Still call the callback even if CMS update fails
        }
      }

      onImageUpload(imageUrl);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
      setIsProcessing(false);
    } catch (error) {
      console.error('[IMAGE_UPLOAD_UI] Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      setErrorMessage(errorMessage);
      setUploadStatus('error');
      setIsProcessing(false);
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
            <p className="text-sm text-white/60">Processing image...</p>
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
