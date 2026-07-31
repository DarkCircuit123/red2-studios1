/**
 * Media Upload Example Component
 *
 * Demonstrates best practices for using the new unified upload system
 * with CMS integration, error handling, and progress tracking.
 *
 * This is a reference implementation - adapt for your specific needs.
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader, Upload } from 'lucide-react';
import { useUpload } from '@/lib/upload-hooks';
import { IMAGE_UPLOAD_CONFIG, MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';
import { Button } from '@/components/ui/button';

interface MediaUploadExampleProps {
  collectionId: string;
  itemId: string;
  mediaType: 'image' | 'music';
  fieldName: string;
  onSuccess?: (mediaUrl: string) => void;
}

export default function MediaUploadExample({
  collectionId,
  itemId,
  mediaType,
  fieldName,
  onSuccess,
}: MediaUploadExampleProps) {
  const config = mediaType === 'music' ? MUSIC_UPLOAD_CONFIG : IMAGE_UPLOAD_CONFIG;
  const [isDragging, setIsDragging] = useState(false);

  const { upload, isUploading, progress, error, result, clearError } = useUpload({
    kind: mediaType,
    config,
    storage: {
      collectionId,
      itemId,
      fieldName,
    },
    onSuccess: (result) => {
      console.log(`${mediaType} uploaded and stored:`, result.mediaUrl);
      onSuccess?.(result.mediaUrl);
    },
    onError: (error) => {
      console.error(`${mediaType} upload failed:`, error.message);
    },
  });

  const handleFileSelect = (file: File) => {
    upload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const acceptTypes = mediaType === 'music' ? 'audio/*' : 'image/*';
  const label = mediaType === 'music' ? 'Audio File' : 'Image';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          accept={acceptTypes}
          onChange={handleFileInput}
          disabled={isUploading}
          className="hidden"
          id={`file-input-${mediaType}`}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {isUploading && progress ? (
            <>
              <Loader className="w-8 h-8 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {progress.message || `${progress.percentage}%`}
                </p>
                <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {progress.loaded > 0 && (
                    <>
                      {(progress.loaded / 1024 / 1024).toFixed(2)}MB of{' '}
                      {(progress.total / 1024 / 1024).toFixed(2)}MB
                    </>
                  )}
                </p>
              </div>
            </>
          ) : result ? (
            <>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Upload Complete!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded in {result.duration}ms
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Size: {(result.fileSize / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  Drop your {label.toLowerCase()} here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse (max {config.maxSizeLabel})
                </p>
              </div>
              <Button
                type="button"
                onClick={() => document.getElementById(`file-input-${mediaType}`)?.click()}
                disabled={isUploading}
                className="mt-2"
              >
                Select {label}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
            <p className="text-xs text-red-700 mt-1">
              Check that your file is the correct type and size.
            </p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Message */}
      {result && !error && (
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              {label} uploaded and saved successfully
            </p>
            <p className="text-xs text-green-700 mt-1">
              File: {result.fileName}
            </p>
            <p className="text-xs text-green-700">
              Type: {result.mimeType}
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>Upload Details:</strong>
          <br />
          Collection: {collectionId}
          <br />
          Field: {fieldName}
          <br />
          Max Size: {config.maxSizeLabel}
        </p>
      </div>
    </div>
  );
}

/**
 * Example usage in a page:
 *
 * export default function PortfolioEditPage() {
 *   const { id } = useParams<{ id: string }>();
 *
 *   return (
 *     <div>
 *       <h1>Edit Portfolio Item</h1>
 *
 *       <MediaUploadExample
 *         collectionId="portfolio"
 *         itemId={id!}
 *         mediaType="image"
 *         fieldName="mainImage"
 *         onSuccess={(url) => {
 *           console.log('Main image updated:', url);
 *         }}
 *       />
 *
 *       <MediaUploadExample
 *         collectionId="portfolio"
 *         itemId={id!}
 *         mediaType="music"
 *         fieldName="backgroundMusic"
 *         onSuccess={(url) => {
 *           console.log('Background music updated:', url);
 *         }}
 *       />
 *     </div>
 *   );
 * }
 */
