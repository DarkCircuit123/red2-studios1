import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Upload, Trash2, Eye, Plus, RefreshCw, X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import { motion } from 'framer-motion';

interface UploadProgress {
  fileIndex: number;
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function RubberBandPhotosManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<HomepageImages[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 100 });
      setPhotos(result.items || []);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load carousel photos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Upload the image
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      // Create new photo entry
      const newPhoto: HomepageImages = {
        _id: crypto.randomUUID(),
        imageName: file.name.replace(/\.[^/.]+$/, ''),
        heroImage: result.mediaUrl,
        isActive: true,
      };

      await adminCms.create('homepageimages', newPhoto);
      setPhotos([...photos, newPhoto]);

      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBatchPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setBatchUploading(true);
      const fileArray = Array.from(files);
      
      // Initialize progress tracking
      const initialProgress: UploadProgress[] = fileArray.map((file, index) => ({
        fileIndex: index,
        fileName: file.name,
        status: 'pending',
      }));
      setUploadProgress(initialProgress);

      const newPhotos: HomepageImages[] = [];
      const errors: string[] = [];

      // Upload each file sequentially
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        try {
          // Update progress to uploading
          setUploadProgress(prev => 
            prev.map((p, idx) => 
              idx === i ? { ...p, status: 'uploading' } : p
            )
          );

          // Upload the image
          const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

          // Create new photo entry
          const newPhoto: HomepageImages = {
            _id: crypto.randomUUID(),
            imageName: file.name.replace(/\.[^/.]+$/, ''),
            heroImage: result.mediaUrl,
            isActive: true,
          };

          await adminCms.create('homepageimages', newPhoto);
          newPhotos.push(newPhoto);

          // Update progress to success
          setUploadProgress(prev => 
            prev.map((p, idx) => 
              idx === i ? { ...p, status: 'success' } : p
            )
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Upload failed';
          errors.push(`${file.name}: ${errorMsg}`);
          
          // Update progress to error
          setUploadProgress(prev => 
            prev.map((p, idx) => 
              idx === i ? { ...p, status: 'error', error: errorMsg } : p
            )
          );
        }
      }

      // Update photos list
      setPhotos([...photos, ...newPhotos]);

      // Show summary toast
      if (newPhotos.length > 0) {
        toast({
          title: 'Batch Upload Complete',
          description: `Successfully uploaded ${newPhotos.length} of ${fileArray.length} photos`,
          variant: errors.length > 0 ? 'default' : 'default',
        });
      }

      if (errors.length > 0) {
        console.error('Upload errors:', errors);
        toast({
          title: 'Some uploads failed',
          description: `${errors.length} file(s) failed to upload`,
          variant: 'destructive',
        });
      }

      // Reset file input
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }

      // Clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: 'Error',
        description: 'Batch upload failed',
        variant: 'destructive',
      });
    } finally {
      setBatchUploading(false);
    }
  };

  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>, photoId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setReplacingId(photoId);

      // Upload the new image
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      // Update the photo with new image URL
      const photoToUpdate = photos.find(p => p._id === photoId);
      if (photoToUpdate) {
        const updatedPhoto: HomepageImages = {
          ...photoToUpdate,
          heroImage: result.mediaUrl,
          imageName: file.name.replace(/\.[^/.]+$/, ''),
        };

        await adminCms.update('homepageimages', updatedPhoto);
        
        // Update local state
        setPhotos(photos.map(p => p._id === photoId ? updatedPhoto : p));

        toast({
          title: 'Success',
          description: 'Photo replaced successfully',
        });
      }

      // Reset file input
      if (replaceFileInputRefs.current[photoId]) {
        replaceFileInputRefs.current[photoId]!.value = '';
      }
    } catch (error) {
      console.error('Replace error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to replace photo',
        variant: 'destructive',
      });
    } finally {
      setReplacingId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      setIsSaving(true);
      await adminCms.delete('homepageimages', photoId);
      setPhotos(photos.filter(p => p._id !== photoId));

      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add Carousel Photos
            </h3>
            <p className="text-sm text-slate-500 mt-1">Upload photos to display in the rubber band carousel section</p>
          </div>

          {/* Upload Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Single Upload Button */}
            <label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading || batchUploading}
                className="hidden"
              />
              <Button
                asChild
                disabled={uploading || batchUploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span className="cursor-pointer flex items-center justify-center gap-2">
                  {uploading ? (
                    <>
                      <LoadingSpinner />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Single Photo
                    </>
                  )}
                </span>
              </Button>
            </label>

            {/* Batch Upload Button */}
            <label>
              <input
                ref={batchFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchPhotoUpload}
                disabled={uploading || batchUploading}
                className="hidden"
              />
              <Button
                asChild
                disabled={uploading || batchUploading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <span className="cursor-pointer flex items-center justify-center gap-2">
                  {batchUploading ? (
                    <>
                      <LoadingSpinner />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Batch Upload Photos
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </Card>

      {/* Upload Progress Section */}
      {uploadProgress.length > 0 && (
        <Card className="p-6 border border-amber-200 bg-amber-50">
          <div className="space-y-3">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Progress ({uploadProgress.filter(p => p.status === 'success').length}/{uploadProgress.length})
            </h4>
            <div className="space-y-2">
              {uploadProgress.map((progress, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{progress.fileName}</p>
                    {progress.error && (
                      <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {progress.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-amber-500 animate-spin" />
                    )}
                    {progress.status === 'uploading' && (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                    )}
                    {progress.status === 'success' && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    {progress.status === 'error' && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Rubber Band Carousel Section */}
      <Card className="p-6 border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              RUBBER BAND CAROUSEL
            </h3>
            <p className="text-sm text-slate-600 mt-1">Manage images displayed in the carousel on the homepage</p>
          </div>

          {photos.length === 0 ? (
            <div className="w-full py-12 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No carousel photos yet</p>
                <p className="text-slate-400 text-xs mt-1">Upload photos above to get started</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo, index) => {
                // Convert wix:image URLs to HTTPS for display
                const displayImageUrl = convertWixImageToHttps(photo.heroImage) || photo.heroImage;
                
                return (
                  <motion.div
                    key={photo._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative rounded-lg overflow-hidden border-2 border-slate-200 bg-white hover:border-purple-300 transition-colors group"
                  >
                    {/* Position Badge */}
                    <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      #{index + 1}
                    </div>

                    {/* Photo Thumbnail Preview */}
                    <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                      {displayImageUrl && displayImageUrl.trim().length > 0 ? (
                        <img
                          src={displayImageUrl}
                          alt={photo.imageName || 'Carousel photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.warn('Failed to load image:', displayImageUrl);
                            (e.target as HTMLImageElement).src = '';
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => window.open(displayImageUrl, '_blank')}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title="View full image"
                          >
                            <Eye className="w-4 h-4" />
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
                              className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                              title="Replace this image"
                            >
                              {replacingId === photo._id ? (
                                <LoadingSpinner className="w-4 h-4" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo._id)}
                            disabled={isSaving}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete this image"
                          >
                            {isSaving ? (
                              <LoadingSpinner className="w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">No image</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Photo Info */}
                    <div className="p-3 space-y-2 bg-white">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {photo.imageName || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Active in carousel</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="space-y-2">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Use high-quality images (1920x1080 or larger) for best results. Photos will appear in the rubber band carousel section on the homepage.
          </p>
          <p className="text-sm text-blue-900">
            <strong>Batch Upload:</strong> Select multiple photos at once using the "Batch Upload Photos" button for faster uploads. The system will process all files sequentially and show you the progress.
          </p>
        </div>
      </Card>
    </div>
  );
}
