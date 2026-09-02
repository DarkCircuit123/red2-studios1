import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Eye, X, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';

interface PhotoItem {
  _id: string;
  imageUrl: string;
  name?: string;
  [key: string]: any;
}

interface MultiPhotoUploaderProps {
  photos: PhotoItem[];
  onUpload: (files: File[]) => Promise<void>;
  onReplace: (photoId: string, file: File) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  isUploading?: boolean;
  isReplacing?: boolean;
  isDeleting?: boolean;
  replacingId?: string | null;
  label?: string;
  description?: string;
  maxSlots?: number;
  acceptedFormats?: string;
  allowMultiple?: boolean;
}

export default function MultiPhotoUploader({
  photos,
  onUpload,
  onReplace,
  onDelete,
  isUploading = false,
  isReplacing = false,
  isDeleting = false,
  replacingId = null,
  label = 'Upload Photos',
  description = 'Click to upload or drag and drop',
  maxSlots = 100,
  acceptedFormats = 'image/*',
  allowMultiple = true,
}: MultiPhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const dragOverRef = useRef(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (allowMultiple) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(newFiles[0]);
      }
    } else {
      setSelectedFiles(newFiles);
      if (newFiles.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(newFiles[0]);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = true;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setPreviewUrl('');
    }
  };

  const canUpload = photos.length < maxSlots;
  const slotsRemaining = maxSlots - photos.length;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-slate-900">{label}</h4>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">
              {photos.length} / {maxSlots} slots used
            </p>
            {!canUpload && (
              <p className="text-xs text-red-600 font-medium mt-1">Slots full</p>
            )}
          </div>
        </div>

        {/* Upload Area */}
        {canUpload && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full h-40 rounded-lg border-2 border-dashed transition-colors ${
              dragOverRef.current ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
            } flex items-center justify-center cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleInputChange}
          disabled={isUploading}
          multiple={allowMultiple}
          className="hidden"
        />

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-700">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
                >
                  {previewUrl && index === 0 && (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-full h-24 object-cover"
                    />
                  )}
                  {!(previewUrl && index === 0) && (
                    <div className="w-full h-24 bg-slate-100 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveSelected(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs p-1 truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading || !canUpload}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
              </>
            )}
          </Button>
          {selectedFiles.length > 0 && (
            <Button
              onClick={() => {
                setSelectedFiles([]);
                setPreviewUrl('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              variant="outline"
              disabled={isUploading}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-700">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors group"
              >
                {/* Position Badge */}
                <div className="absolute top-1 left-1 z-10 bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold">
                  #{index + 1}
                </div>

                {/* Image */}
                <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                  {photo.imageUrl && (
                    <img
                      src={photo.imageUrl}
                      alt={photo.name || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.warn('Failed to load image:', photo.imageUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => window.open(photo.imageUrl, '_blank')}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="View full image"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <label className="cursor-pointer">
                      <input
                        ref={(el) => {
                          if (el) replaceFileInputRefs.current[photo._id] = el;
                        }}
                        type="file"
                        accept={acceptedFormats}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onReplace(photo._id, file);
                          }
                        }}
                        disabled={replacingId === photo._id}
                        className="hidden"
                      />
                      <button
                        onClick={() => {
                          const input = replaceFileInputRefs.current[photo._id];
                          if (input) input.click();
                        }}
                        disabled={replacingId === photo._id}
                        className="p-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
                        title="Replace this image"
                      >
                        {replacingId === photo._id ? (
                          <LoadingSpinner className="w-3 h-3" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                      </button>
                    </label>
                    <button
                      onClick={() => onDelete(photo._id)}
                      disabled={isDeleting}
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Delete this image"
                    >
                      {isDeleting ? (
                        <LoadingSpinner className="w-3 h-3" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                {photo.name && (
                  <div className="p-2 bg-white border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-900 truncate">{photo.name}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
