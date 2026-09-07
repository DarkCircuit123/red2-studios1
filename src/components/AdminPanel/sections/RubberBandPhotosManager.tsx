/**
 * Rubber Band Photos Manager - Compact horizontal rows with dark theme
 * 
 * Features:
 * - Compact 96px max-height rows with 120x80 thumbnails
 * - File type validation (JPEG, PNG, GIF, WEBP only)
 * - Cleanup action for failed image rows
 * - Dark admin theme throughout
 * - Proper metadata labels and empty states
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, Trash2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { CarouselImages } from '@/entities';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function RubberBandPhotosManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<CarouselImages[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<CarouselImages>('carouselimages', {}, { limit: 100 });
      const activePhotos = (result.items || [])
        .filter(item => item.isActive === true)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setPhotos(activePhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
      addStatusMessage('error', 'Failed to load carousel photos');
    } finally {
      setIsLoading(false);
    }
  };

  const addStatusMessage = (type: StatusMessage['type'], message: string) => {
    const id = crypto.randomUUID();
    setStatusMessages(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setStatusMessages(prev => prev.filter(m => m.id !== id));
    }, 5000);
  };

  const validateImageFile = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return false;
    }
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    return hasValidExtension;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type BEFORE upload
    if (!validateImageFile(file)) {
      addStatusMessage('error', 'Only JPEG, PNG, GIF, and WEBP images are allowed');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      addStatusMessage('info', 'Uploading photo...');

      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      const nextDisplayOrder = photos.length > 0 
        ? Math.max(...photos.map(p => p.displayOrder || 0)) + 1 
        : 1;

      const newPhoto: CarouselImages = {
        _id: crypto.randomUUID(),
        imageName: file.name.replace(/\.[^/.]+$/, ''),
        image: result.mediaUrl,
        displayOrder: nextDisplayOrder,
        isActive: true,
      };

      await adminCms.create('carouselimages', newPhoto);
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);

      addStatusMessage('success', 'Photo uploaded successfully');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      addStatusMessage('error', error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this carousel photo?')) return;

    try {
      setIsSaving(true);
      addStatusMessage('info', 'Deleting photo...');
      
      await adminCms.delete('carouselimages', photoId);
      const updatedPhotos = photos.filter(p => p._id !== photoId);
      setPhotos(updatedPhotos);

      addStatusMessage('success', 'Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      addStatusMessage('error', 'Failed to delete photo');
    } finally {
      setIsSaving(false);
    }
  };

  const cleanupFailedImages = async () => {
    try {
      setIsCleaningUp(true);
      let deletedCount = 0;

      for (const photo of photos) {
        if (photo.image) {
          try {
            const response = await fetch(convertWixImageToHttps(photo.image) || photo.image, { method: 'HEAD' });
            if (!response.ok) {
              await adminCms.delete('carouselimages', photo._id);
              deletedCount++;
            }
          } catch {
            await adminCms.delete('carouselimages', photo._id);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        addStatusMessage('success', `Cleaned up ${deletedCount} failed image row(s)`);
        await loadPhotos();
      } else {
        addStatusMessage('info', 'No failed images found');
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      addStatusMessage('error', 'Cleanup failed');
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-admin-bg min-h-screen">
      {/* Status Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {statusMessages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-3 rounded-none flex items-center gap-2 text-[13px] font-medium border transition-colors duration-160 ${
              msg.type === 'success' ? 'bg-admin-raise border-ok/30 text-ok' :
              msg.type === 'error' ? 'bg-admin-raise border-danger/30 text-danger' :
              msg.type === 'warning' ? 'bg-admin-raise border-warn/30 text-warn' :
              'bg-admin-raise border-admin-line text-admin-text'
            }`}
          >
            {msg.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {msg.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {msg.message}
          </motion.div>
        ))}
      </div>

      {/* Header with Upload Button */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
              Carousel Photos
            </h2>
            <p className="text-[13px] text-admin-dim mt-1">Appears in the homepage carousel</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 bg-oxblood hover:bg-oxblood/90 text-white rounded-none text-[13px] font-medium transition-colors duration-160 disabled:opacity-50 h-10 px-4"
          >
            {uploading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Photos List */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
            All Items ({photos.length})
          </h3>
          {photos.length > 0 && (
            <button
              onClick={cleanupFailedImages}
              disabled={isCleaningUp}
              className="flex items-center gap-1 text-[11px] text-admin-dim hover:text-admin-text transition-colors disabled:opacity-50"
              title="Delete rows with broken images"
            >
              <Zap className="w-3 h-3" />
              Cleanup
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <p className="text-[13px] text-admin-dim">No carousel photos yet</p>
        ) : (
          <div className="space-y-1">
            {photos.map((photo) => {
              const displayImageUrl = convertWixImageToHttps(photo.image) || photo.image;
              return (
                <motion.div
                  key={photo._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-admin-line rounded-none bg-admin-raise hover:border-admin-line/60 transition-colors group flex items-center gap-3 p-2 h-24"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-none overflow-hidden border border-admin-line flex-shrink-0 bg-admin-surface">
                    {displayImageUrl ? (
                      <Image
                        src={displayImageUrl}
                        alt={photo.imageName || 'Carousel photo'}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Upload className="w-4 h-4 text-admin-faint" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-[13px] text-admin-text truncate">
                      {photo.imageName || '(No name)'}
                    </h4>
                    <div className="flex gap-4 mt-1">
                      <p className="text-[11px] text-admin-faint">Order: {photo.displayOrder}</p>
                      <p className="text-[11px] text-admin-faint">{photo.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDeletePhoto(photo._id)}
                      disabled={isSaving}
                      className="p-2 bg-admin-line hover:bg-danger/20 text-admin-text hover:text-danger rounded-none transition-colors duration-160 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
