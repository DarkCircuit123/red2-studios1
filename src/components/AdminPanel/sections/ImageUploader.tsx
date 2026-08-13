import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ImageUploaderProps {
  imageUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  isUploading?: boolean;
  isRemoving?: boolean;
  label?: string;
  description?: string;
  acceptedFormats?: string;
}

export default function ImageUploader({
  imageUrl,
  onUpload,
  onRemove,
  isUploading = false,
  isRemoving = false,
  label = 'Upload Image',
  description = 'Click to upload or drag and drop',
  acceptedFormats = 'image/*',
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  const handleFileSelect = async (file: File) => {
    if (file.type.startsWith('image/')) {
      await onUpload(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {imageUrl && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {!imageUrl && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-48 rounded-lg border-2 border-dashed transition-colors ${
            dragOverRef.current ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
          } flex items-center justify-center cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">{label}</p>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleInputChange}
        disabled={isUploading}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <LoadingSpinner />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {imageUrl ? 'Replace' : 'Upload'}
            </>
          )}
        </Button>

        {imageUrl && (
          <Button
            onClick={onRemove}
            disabled={isRemoving}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {isRemoving ? <LoadingSpinner /> : <Trash2 className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
