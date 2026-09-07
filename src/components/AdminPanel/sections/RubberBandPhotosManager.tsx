/**
 * Rubber Band Photos Manager - Carousel Images with dark theme
 * 
 * Features:
 * - Dynamic slot count derived from data
 * - Upload and replace carousel photos
 * - Dark theme applied throughout
 * - 4.5:1 contrast compliance
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Upload, Trash2, Eye, Plus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { CarouselImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import { computeSlotCount } from '@/lib/admin-helpers';
import { motion } from 'framer-motion';

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function RubberBandPhotosManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<CarouselImages[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [slotCount, setSlotCount] = useState(90);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<CarouselImages>('carouselimages', {}, { limit: 100 });
      // Filter for active items and sort by displayOrder ascending
      const activePhotos = (result.items || [])
        .filter(item => item.isActive === true)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setPhotos(activePhotos);
      // Compute dynamic slot count
      setSlotCount(computeSlotCount(activePhotos));
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      addStatusMessage('info', 'Uploading photo...');

      // Upload the image
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      // Get the next displayOrder
      const nextDisplayOrder = photos.length > 0 
        ? Math.max(...photos.map(p => p.displayOrder || 0)) + 1 
        : 1;

      // Create new photo entry in carouselimages collection
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
      setSlotCount(computeSlotCount(updatedPhotos));

      addStatusMessage('success', 'Photo uploaded successfully');

      // Reset file input
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

  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>, photoId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setReplacingId(photoId);
      addStatusMessage('info', 'Replacing photo...');

      // Upload the new image
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      // Update the photo with new image URL
      const photoToUpdate = photos.find(p => p._id === photoId);
      if (photoToUpdate) {
        const updatedPhoto: CarouselImages = {
          ...photoToUpdate,
          image: result.mediaUrl,
          imageName: file.name.replace(/\.[^/.]+$/, ''),
        };

        await adminCms.update('carouselimages', updatedPhoto);
        
        // Update local state
        const updatedPhotos = photos.map(p => p._id === photoId ? updatedPhoto : p);
        setPhotos(updatedPhotos);
        setSlotCount(computeSlotCount(updatedPhotos));

        addStatusMessage('success', 'Photo replaced successfully');
      }

      // Reset file input
      if (replaceFileInputRefs.current[photoId]) {
        replaceFileInputRefs.current[photoId]!.value = '';
      }
    } catch (error) {
      console.error('Replace error:', error);
      addStatusMessage('error', error instanceof Error ? error.message : 'Failed to replace photo');
    } finally {
      setReplacingId(null);
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
      setSlotCount(computeSlotCount(updatedPhotos));

      addStatusMessage('success', 'Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      addStatusMessage('error', 'Failed to delete photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSlots = () => {
    const newSlotCount = slotCount + 12;
    setSlotCount(newSlotCount);
    addStatusMessage('info', `Carousel expanded to ${newSlotCount} slots`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const filledSlots = photos.length;

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {statusMessages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-3 rounded-sm flex items-center gap-2 text-[13px] font-medium border transition-colors duration-160 ${
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

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="font-heading text-lg uppercase tracking-[0.12em] text-admin-text">
          Carousel Photos
        </h1>
        <p className="text-[13px] text-admin-dim">
          These images appear in the scrolling carousel section on the homepage
        </p>
      </div>

      {/* Live Count */}
      <div className="bg-admin-raise rounded-none border border-admin-line p-4 flex items-center justify-between">
        <span className="text-[13px] text-admin-text font-medium">Currently Live:</span>
        <span className="text-2xl font-bold text-oxblood">{filledSlots}</span>
      </div>

      {/* Upload Section */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6 space-y-4">
        {/* Upload Dropzone */}
        <label className="block">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className="w-full h-32 border-2 border-dashed border-admin-line bg-admin-raise rounded-none flex flex-col items-center justify-center cursor-pointer hover:border-oxblood/50 transition-colors duration-160 p-4">
            <Upload className="w-6 h-6 text-admin-dim mb-2" />
            <p className="text-[12px] font-medium text-admin-text text-center">
              Drag & drop or click to upload
            </p>
            <p className="text-[11px] text-admin-faint text-center mt-1">
              Destination: Homepage Carousel
            </p>
            <p className="text-[11px] text-admin-faint text-center">
              Formats: JPG, PNG, WebP • Max 10MB
            </p>
            <p className="text-[11px] text-admin-faint text-center">
              Recommended: 16:9 aspect ratio, 1920×1080px minimum
            </p>
          </div>
        </label>

        {/* Upload Button */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full bg-oxblood hover:bg-oxblood/90 text-white rounded-none text-[13px] font-medium transition-colors duration-160 disabled:opacity-50"
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

      {/* Carousel Photos Grid */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
            Carousel Grid ({filledSlots} photos)
          </h2>
          <Button
            onClick={handleAddSlots}
            className="flex items-center gap-2 bg-admin-raise hover:bg-admin-line text-admin-text border border-admin-line rounded-none text-[11px] px-3 py-2 transition-colors duration-160"
          >
            <Plus className="w-3 h-3" />
            Add 12 Slots
          </Button>
        </div>

        {photos.length === 0 ? (
          <div className="w-full py-12 rounded-none border border-dashed border-admin-line bg-admin-raise flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-admin-faint mx-auto mb-2" />
              <p className="text-admin-dim text-[13px]">No carousel photos yet</p>
              <p className="text-admin-faint text-[11px] mt-1">Upload photos above to get started</p>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))',
            gap: '8px',
            width: '100%',
          }}>
            {photos.map((photo, index) => {
              // Convert wix:image URLs to HTTPS for display
              const displayImageUrl = convertWixImageToHttps(photo.image) || photo.image;
              
              return (
                <motion.div
                  key={photo._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className="relative rounded-none overflow-hidden border border-admin-line bg-admin-raise hover:border-oxblood/50 group aspect-[4/5] flex flex-col"
                >
                  {/* Photo Thumbnail */}
                  {displayImageUrl && (
                    <div className="relative flex-1 overflow-hidden bg-admin-raise">
                      <img
                        src={displayImageUrl}
                        alt={photo.imageName || 'Carousel photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.warn('Failed to load image:', displayImageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Controls Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-160">
                        <button
                          type="button"
                          onClick={() => window.open(displayImageUrl, '_blank')}
                          className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160"
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
                            accept="image/*"
                            onChange={(e) => handleReplacePhoto(e, photo._id)}
                            disabled={replacingId === photo._id}
                            className="hidden"
                          />
                          <button
                            onClick={() => {
                              const input = replaceFileInputRefs.current[photo._id];
                              if (input) input.click();
                            }}
                            disabled={replacingId === photo._id}
                            className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160 disabled:opacity-50"
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
                          type="button"
                          onClick={() => handleDeletePhoto(photo._id)}
                          disabled={isSaving}
                          className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160 disabled:opacity-50"
                          title="Delete this image"
                        >
                          {isSaving ? (
                            <LoadingSpinner className="w-3 h-3" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!displayImageUrl && (
                    <div className="w-full flex-1 bg-admin-raise flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-admin-faint" />
                    </div>
                  )}

                  {/* Photo Label Footer */}
                  <div className="bg-admin-raise border-t border-admin-line p-2 space-y-1">
                    <p className="text-[10px] text-admin-text font-medium truncate" title={photo.imageName}>
                      {photo.imageName || 'Untitled'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-admin-faint">
                      <span>Order: {photo.displayOrder || 0}</span>
                      <span className={photo.isActive ? 'text-ok font-medium' : 'text-admin-faint'}>
                        {photo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-admin-raise rounded-none border border-admin-line p-4">
        <p className="text-[13px] text-admin-text">
          <strong className="text-oxblood">Tip:</strong> Use high-quality images (1920x1080 or larger) for best results. Photos appear in the rubber band carousel section on the homepage.
        </p>
      </div>
    </div>
  );
}
