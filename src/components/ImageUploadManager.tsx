import { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Trash2, Edit3, Link2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { saveImageToCms } from '@/lib/cms-image-save';
import { uploadMedia, importMediaFromUrl, createPreviewUrl, revokePreviewUrl, isDataUrl, type UploadProgress } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import WDE0009FixValidator from '@/lib/wde0009-fix-validation';
import { validateImageStorage } from '@/lib/image-storage-validator';
import WixImageResolver from '@/lib/wix-image-resolver';

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

type MediaUploadProgress = UploadProgress;

// Web display formats only (no PSD, no proprietary formats)
const SUPPORTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp'],
  'image/x-icon': ['.ico'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

// Explicitly rejected formats
const REJECTED_FORMATS = {
  'image/vnd.adobe.photoshop': ['.psd'],
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

  // "Paste a link" state, kept separate from file-upload status above.
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkStatus, setLinkStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  const isValidFileType = (file: File): boolean => {
    // Reject PSD files explicitly
    if (file.type === 'image/vnd.adobe.photoshop' || file.name.toLowerCase().endsWith('.psd')) {
      return false;
    }
    
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

    // Validate file type - reject PSD with specific message
    if (file.type === 'image/vnd.adobe.photoshop' || file.name.toLowerCase().endsWith('.psd')) {
      setErrorMessage('PSD files are not supported. Please export your image as JPEG or PNG first.');
      setUploadStatus('error');
      return;
    }

    if (!isValidFileType(file)) {
      setErrorMessage('Image upload failed: this file format is not supported. Please use JPG, PNG, WebP, GIF, SVG, TIFF, or BMP.');
      setUploadStatus('error');
      return;
    }

    setIsProcessing(true);

    try {
      // Create local preview URL using URL.createObjectURL (not base64)
      // This is memory-efficient and doesn't bloat the CMS
      const localPreviewUrl = createPreviewUrl(file);
      setPreviewUrl(localPreviewUrl);

      // Upload to Wix Media Manager
      // Returns a Wix media URL (wix:image:// or https://static.wixstatic.com/)
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG, (progress: MediaUploadProgress) => {
        setUploadProgress(progress.percentage);
      });

      // Validate that we got a proper Wix media URL (not base64)
      // This prevents WDE0009 errors
      if (isDataUrl(result.mediaUrl)) {
        console.error('[ImageUploadManager] ERROR: Got data URL instead of Wix media URL:', result.mediaUrl.substring(0, 50));
        throw new Error('Image upload failed: this file could not be stored. Please retry the upload.');
      }

      // Use WixImageResolver to validate the URL format
      const resolved = WixImageResolver.resolve(result.mediaUrl);
      if (!resolved.isValid || resolved.isFallback) {
        console.error('[ImageUploadManager] ERROR: Invalid URL format from resolver');
        throw new Error('Image upload failed: invalid URL format returned. Please retry the upload.');
      }

      // FINAL HARDENING: Validate image storage before CMS update
      try {
        validateImageStorage(result.mediaUrl, fieldName || 'image');
      } catch (validationError) {
        console.error('[ImageUploadManager] ERROR: Image storage validation failed:', validationError);
        throw new Error('Image upload failed: this file could not be stored. Please retry the upload.');
      }

      // Save to the CMS through the shared path, which verifies the write
      // actually landed. There is deliberately NO "no CMS info, update
      // locally" branch any more: that branch showed a success message for an
      // image that was never stored, so it looked saved until you refreshed.
      try {
        await saveImageToCms({ collectionId, itemId, fieldName }, result.mediaUrl);
        onImageUpload(result.mediaUrl);
        setUploadStatus('success');
        setTimeout(() => setUploadStatus('idle'), 3000);
      } catch (cmsError) {
        console.error('[ImageUploadManager] CMS save failed:', cmsError);
        setErrorMessage(
          cmsError instanceof Error
            ? cmsError.message
            : 'Image upload failed: could not save to database. Please retry.'
        );
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('[ImageUploadManager] Error uploading image:', error);
      // Use user-friendly message instead of technical details
      setErrorMessage('Image upload failed: this file could not be stored. Please retry the upload.');
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleLinkImport = async () => {
    const url = linkValue.trim();
    if (!url) {
      setLinkStatus('error');
      setLinkMessage('Paste a link first.');
      return;
    }

    setLinkStatus('testing');
    setLinkMessage('Testing link...');

    try {
      // Server-side: checks the link is reachable, confirms the real
      // content-type and size, THEN imports it into Wix Media Manager.
      // Every way this can fail returns its own specific message - see
      // src/api/media/import-from-url.ts.
      const result = await importMediaFromUrl(url, 'image');

      // Same verified path as the file upload. Previously this silently
      // skipped the CMS write when the target was incomplete and still
      // reported "Link verified ... and added."
      await saveImageToCms({ collectionId, itemId, fieldName }, result.mediaUrl);

      onImageUpload(result.mediaUrl);
      setLinkStatus('success');
      setLinkMessage(`Link verified (${result.mimeType || 'image'}${result.fileSize ? `, ${(result.fileSize / 1024 / 1024).toFixed(2)}MB` : ''}) and added.`);
      setLinkValue('');
      setTimeout(() => {
        setLinkStatus('idle');
        setLinkMessage(null);
        setShowLinkInput(false);
      }, 3000);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : err instanceof Error
            ? err.message
            : 'Could not import that link.';
      setLinkStatus('error');
      setLinkMessage(message);
      console.error('Image link import error:', err);
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
      // Same verified path. A delete that silently did nothing used to look
      // identical to one that worked, until the image reappeared on refresh.
      await saveImageToCms({ collectionId, itemId, fieldName }, null);
      
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

      {/* Paste a link */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowLinkInput((prev) => !prev);
            setLinkStatus('idle');
            setLinkMessage(null);
          }}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-xs text-white/60 hover:text-white/80 transition-all duration-200 disabled:opacity-50"
        >
          <Link2 className="w-3 h-3" />
          {showLinkInput ? 'Cancel link' : 'Paste a Link'}
        </button>
      </div>

      {showLinkInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/20 rounded-lg p-3 space-y-2"
        >
          <div className="flex gap-2">
            <input
              type="url"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linkStatus !== 'testing') {
                  e.preventDefault();
                  handleLinkImport();
                }
              }}
              placeholder="https://example.com/image.jpg"
              disabled={linkStatus === 'testing'}
              className="flex-1 bg-black/30 border border-white/20 rounded px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleLinkImport}
              disabled={linkStatus === 'testing'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-xs text-blue-400 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
            >
              {linkStatus === 'testing' ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test & Add'
              )}
            </button>
          </div>
          {linkMessage && (
            <p
              className={`text-xs ${
                linkStatus === 'error'
                  ? 'text-red-400'
                  : linkStatus === 'success'
                  ? 'text-green-400'
                  : 'text-white/50'
              }`}
            >
              {linkMessage}
            </p>
          )}
        </motion.div>
      )}

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
        <p className="text-red-400/60">PSD files not supported - please export as JPEG or PNG</p>
      </div>
    </div>
  );
}
