import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { getActiveHomepageImages } from '@/lib/get-active-homepage-images';
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
      const item = await getActiveHomepageImages();
      if (item) {
        setSettings(item);
      } else {
        // No active homepage images row found - render empty state
        setSettings(null);
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

      // Update existing homepageimages row's heroImage field only
      const updated = { ...settings, heroImage: result.mediaUrl };
      await adminCms.update('homepageimages', updated);
      // Re-read through the same helper so the editor reflects the row the site actually renders
      const reloaded = await getActiveHomepageImages();
      if (reloaded) {
        setSettings(reloaded);
      }
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
      // Re-read through the same helper so the editor reflects the row the site actually renders
      const reloaded = await getActiveHomepageImages();
      if (reloaded) {
        setSettings(reloaded);
      }
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

  if (!settings) {
    return (
      <div className="p-6 bg-admin-surface border border-admin-line rounded-none">
        <div className="space-y-4">
          <div>
            <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-oxblood" />
              Hero Image
            </h2>
            <p className="text-[13px] text-admin-dim mt-2">Upload or replace the main image for the hero section</p>
          </div>
          <div className="w-full h-64 rounded-none border border-dashed border-admin-line bg-admin-raise flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-admin-faint mx-auto mb-2" />
              <p className="text-[13px] text-admin-dim">No homepage images row found</p>
              <p className="text-[11px] text-admin-faint mt-1">Please create a homepageimages entry in the CMS</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Image */}
      <div className="p-6 bg-admin-surface border border-admin-line rounded-none">
        <div className="space-y-4">
          <div>
            <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-oxblood" />
              Hero Image
            </h2>
            <p className="text-[13px] text-admin-dim mt-2">Upload or replace the main image for the hero section</p>
          </div>

          {/* Preview */}
          {(previewUrl || settings?.heroImage) && (
            <div className="relative w-full h-64 rounded-none overflow-hidden border border-admin-line bg-admin-raise">
              <Image
                src={previewUrl || settings?.heroImage || ''}
                alt="Hero image preview"
                width={800}
                height={256}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {!previewUrl && !settings?.heroImage && (
            <div className="w-full h-64 rounded-none border border-dashed border-admin-line bg-admin-raise flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-admin-faint mx-auto mb-2" />
                <p className="text-[13px] text-admin-dim">No image uploaded yet</p>
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
                className="w-full bg-oxblood hover:bg-oxblood-hi text-white font-heading text-[12px] uppercase tracking-[0.08em] rounded-none transition-colors duration-160"
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
                      Upload Hero Image
                    </>
                  )}
                </span>
              </Button>
            </label>

            {(previewUrl || settings?.heroImage) && (
              <Button
                onClick={handleRemoveBackgroundImage}
                disabled={isSaving}
                className="w-10 h-10 p-0 bg-danger hover:bg-danger/90 text-white rounded-none transition-colors duration-160"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-admin-raise border border-admin-line rounded-none">
        <p className="text-[11px] text-admin-dim">
          <strong>Tip:</strong> Use high-quality images (1920x1080 or larger) for best results. Supported formats: JPG, PNG, WebP. This image is displayed on the live site.
        </p>
      </div>
    </div>
  );
}
