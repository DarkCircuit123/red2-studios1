/**
 * Unified File Upload Component - Vibe Best Practices
 *
 * Reusable upload UI for images and audio with:
 * - Progress tracking
 * - Error handling
 * - Drag & drop support
 * - File preview
 * - Retry logic
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { uploadFile, importFromUrl, type UploadProgress, type UploadResult } from '@/lib/upload-service';
import { UploadConfig } from '@/lib/upload-config';
import { Button } from './button';

interface FileUploadProps {
  kind: 'image' | 'music';
  config: UploadConfig;
  onSuccess: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  showPreview?: boolean;
}

export function FileUpload({
  kind,
  config,
  onSuccess,
  onError,
  accept,
  label,
  showPreview = true,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProgress = useCallback((p: UploadProgress) => {
    setProgress(p);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      setProgress(null);

      try {
        const result = await uploadFile(file, kind, config, {
          onProgress: handleProgress,
          maxRetries: 2,
          timeoutMs: 120000,
        });

        onSuccess(result);
        setProgress(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsUploading(false);
      }
    },
    [kind, config, onSuccess, onError, handleProgress]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      handleFileUpload(file);
    }
  };

  const handleImportUrl = async () => {
    if (!urlValue.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const result = await importFromUrl(urlValue, kind, handleProgress);
      onSuccess(result);
      setUrlValue('');
      setShowUrlInput(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsImporting(false);
    }
  };

  const acceptTypes = accept || (kind === 'music' ? 'audio/*' : 'image/*');

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
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
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {label || `Drop your ${kind} here`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse (max {config.maxSizeLabel})
                </p>
              </div>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mt-2"
              >
                Select File
              </Button>
            </>
          )}
        </div>
      </div>

      {/* URL Import Option */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-sm text-primary hover:underline"
          disabled={isUploading || isImporting}
        >
          {showUrlInput ? 'Cancel' : 'Or paste a link'}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/file.mp3"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isImporting}
          />
          <Button
            onClick={handleImportUrl}
            disabled={isImporting || !urlValue.trim()}
            size="sm"
          >
            {isImporting ? <Loader className="w-4 h-4 animate-spin" /> : 'Import'}
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact upload button for inline use
 */
interface CompactUploadButtonProps {
  kind: 'image' | 'music';
  config: UploadConfig;
  onSuccess: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CompactUploadButton({
  kind,
  config,
  onSuccess,
  onError,
  label,
  size = 'md',
}: CompactUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);

      try {
        const result = await uploadFile(file, kind, config, {
          maxRetries: 2,
          timeoutMs: 120000,
        });
        onSuccess(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsUploading(false);
      }
    },
    [kind, config, onSuccess, onError]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={kind === 'music' ? 'audio/*' : 'image/*'}
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        size={size}
        variant="outline"
      >
        {isUploading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {label || `Upload ${kind}`}
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
