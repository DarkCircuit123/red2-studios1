import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Upload, Trash2, Eye, Plus } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import ImageThumbnailPreview from './ImageThumbnailPreview';

export default function RubberBandPhotosManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<HomepageImages[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const handleDeletePhoto = async (photoId: string) => {
    try {
      setIsSaving(true);
      await BaseCrudService.delete('homepageimages', photoId);
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

          {/* Upload Button */}
          <label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              asChild
              disabled={uploading}
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
                    Upload Photo
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </Card>

      {/* Photos Grid */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-slate-600" />
              Carousel Photos ({photos.length})
            </h3>
            <p className="text-sm text-slate-500 mt-1">Manage photos displayed in the carousel</p>
          </div>

          {photos.length === 0 ? (
            <div className="w-full py-12 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No photos uploaded yet</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo._id} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  {/* Photo Thumbnail Preview */}
                  {photo.heroImage && (
                    <div className="relative w-full h-48 bg-slate-100">
                      <img
                        src={photo.heroImage}
                        alt={photo.imageName || 'Carousel photo'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                        <button
                          onClick={() => window.open(photo.heroImage, '_blank')}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(photo._id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo Info */}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {photo.imageName || 'Untitled'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Use high-quality images (1920x1080 or larger) for best results. Photos will appear in the rubber band carousel section on the homepage.
        </p>
      </Card>
    </div>
  );
}
