import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';

interface ImageUploadManagerProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  label?: string;
  collectionId?: string;
  itemId?: string;
  fieldName?: string;
  acceptedFormats?: string[];
  displayName?: string;
  onDisplayNameChange?: (name: string) => void;
  showDisplayNameField?: boolean;
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
  currentImage,
  label = 'Upload Image',
  collectionId,
  itemId,
  fieldName,
  acceptedFormats,
  displayName = '',
  onDisplayNameChange,
  showDisplayNameField = false
}: ImageUploadManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
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
    setErrorMessage('');
    setUploadStatus('idle');

    // Validate file type
    if (!isValidFileType(file)) {
      setErrorMessage(`Unsupported file type: ${file.type || 'unknown'}. Supported formats: JPG, PNG, WebP, GIF, SVG, TIFF, BMP, HEIC, and more.`);
      setUploadStatus('error');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage(`File size exceeds 50MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      setUploadStatus('error');
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          
          // If collection info provided, save to CMS
          if (collectionId && itemId && fieldName) {
            try {
              await BaseCrudService.update(collectionId, {
                _id: itemId,
                [fieldName]: base64
              });
            } catch (cmsError) {
              console.warn('CMS update failed, but continuing with local update:', cmsError);
              // Continue anyway - the image is still updated locally
            }
          }
          
          onImageUpload(base64);
          setUploadStatus('success');
          setTimeout(() => setUploadStatus('idle'), 3000);
          setIsProcessing(false);
        } catch (error) {
          console.error('Error processing image:', error);
          setErrorMessage('Failed to process image. Please try again.');
          setUploadStatus('error');
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read file. Please try again.');
        setUploadStatus('error');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setErrorMessage('Error processing image. Please try again.');
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

  const handleSaveName = () => {
    if (onDisplayNameChange) {
      onDisplayNameChange(tempName);
    }
    setIsEditingName(false);
  };

  return (
    <div className="w-full space-y-3">
      {/* Display Name Field */}
      {showDisplayNameField && (
        <div className="bg-black/5 border border-black/10 rounded-lg p-3">
          {isEditingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter display name..."
                className="flex-1 px-3 py-2 bg-white border border-black/20 rounded text-sm text-black placeholder-black/40 focus:outline-none focus:border-black/40"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-2 bg-black text-white text-xs font-bold rounded hover:bg-black/80 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setTempName(displayName);
                }}
                className="px-3 py-2 bg-black/10 text-black text-xs font-bold rounded hover:bg-black/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-black/60 uppercase tracking-wide mb-1">Display Name</p>
                <p className="text-sm text-black font-medium">{displayName || 'Not set'}</p>
              </div>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-2 hover:bg-black/10 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4 text-black/60" />
              </button>
            </div>
          )}
        </div>
      )}

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
            <p className="text-xs text-white/40">Click to replace</p>
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
        <p>Max file size: 50MB</p>
      </div>
    </div>
  );
}
