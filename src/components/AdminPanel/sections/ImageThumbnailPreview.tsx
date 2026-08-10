import React from 'react';
import { Image as ImageIcon, Trash2, Eye } from 'lucide-react';
import { Image } from '@/components/ui/image';

interface ImageThumbnailPreviewProps {
  imageUrl?: string;
  altText?: string;
  title?: string;
  slotNumber?: number;
  isLoading?: boolean;
  onRemove?: () => void;
  onView?: () => void;
  compact?: boolean;
}

/**
 * Reusable thumbnail preview component for admin image uploads.
 * Displays actual image thumbnails instead of empty slots.
 * Supports compact and full-size modes.
 */
export default function ImageThumbnailPreview({
  imageUrl,
  altText,
  title,
  slotNumber,
  isLoading,
  onRemove,
  onView,
  compact = false,
}: ImageThumbnailPreviewProps) {
  if (!imageUrl) {
    return null;
  }

  if (compact) {
    // Compact thumbnail for grid layouts (e.g., 30-slot portfolio gallery)
    return (
      <div className="relative group w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
        <Image
          src={imageUrl}
          alt={altText || title || `Image ${slotNumber || ''}`}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
          {onView && (
            <button
              onClick={onView}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="View full image"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Slot indicator (subtle) */}
        {slotNumber && (
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            #{slotNumber}
          </div>
        )}
      </div>
    );
  }

  // Full-size thumbnail for detail views
  return (
    <div className="space-y-3">
      <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
        <div className="relative w-full h-64">
          <Image
            src={imageUrl}
            alt={altText || title || 'Uploaded image'}
            width={400}
            height={256}
            className="w-full h-full object-cover"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Image info */}
      {(title || altText) && (
        <div className="text-sm">
          {title && <p className="font-medium text-slate-900 truncate">{title}</p>}
          {altText && <p className="text-xs text-slate-600 truncate">{altText}</p>}
        </div>
      )}
    </div>
  );
}
