import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import ImageThumbnailPreview from './ImageThumbnailPreview';

export default function HeroSectionManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<HomepageImages | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 1 });
      if (result.items.length > 0) {
        setSettings(result.items[0]);
      } else {
        // Create default settings
        const newSettings: HomepageImages = {
          _id: crypto.randomUUID(),
          imageName: 'Hero Image',
          isActive: true,
        };
        await adminCms.create('homepageimages', newSettings);
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load home page images',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    try {
      setUploadingBg(true);

      // Use unified upload service with wix-media-upload-service
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      // Update settings with new image URL
      const updated = { ...settings, heroImage: result.mediaUrl };
      await adminCms.update('homepageimages', updated);
      setSettings(updated);
      setPreviewUrl(result.mediaUrl);

      toast({
        title: 'Success',
        description: 'Hero image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingBg(false);
    }
  };

  const handleRemoveBackgroundImage = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updated = { ...settings, heroImage: undefined };
      await adminCms.update('homepageimages', updated);
      setSettings(updated);
      setPreviewUrl(null);

      toast({
        title: 'Success',
        description: 'Hero image removed',
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove image',
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
      {/* Hero Image */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Hero Image
            </h3>
            <p className="text-sm text-slate-500 mt-1">Upload or replace the main image for the hero section</p>
          </div>

          {/* Preview */}
          {(previewUrl || settings?.heroImage) && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img
                src={previewUrl || settings?.heroImage}
                alt="Hero image preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {!previewUrl && !settings?.heroImage && (
            <div className="w-full h-64 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No image uploaded yet</p>
              </div>
            </div>
          )}

          {/* Upload Controls */}
          <div className="flex gap-3">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageUpload}
                disabled={uploadingBg}
                className="hidden"
              />
              <Button
                asChild
                disabled={uploadingBg}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span className="cursor-pointer flex items-center justify-center gap-2">
                  {uploadingBg ? (
                    <>
                      <LoadingSpinner />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                </span>
              </Button>
            </label>

            {(previewUrl || settings?.heroImage) && (
              <Button
                onClick={handleRemoveBackgroundImage}
                disabled={isSaving}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Use high-quality images (1920x1080 or larger) for best results. Supported formats: JPG, PNG, WebP. This image is displayed on the live site.
        </p>
      </Card>
    </div>
  );
}
