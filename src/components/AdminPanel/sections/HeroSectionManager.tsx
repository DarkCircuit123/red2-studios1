import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { HomePageSettings } from '@/entities';
import { useToast } from '@/hooks/use-toast';

export default function HeroSectionManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<HomePageSettings | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<HomePageSettings>('homepagesettings', {}, { limit: 1 });
      if (result.items.length > 0) {
        setSettings(result.items[0]);
      } else {
        // Create default settings
        const newSettings: HomePageSettings = {
          _id: crypto.randomUUID(),
          heroTitle: 'Welcome to Our Site',
          heroSubtitle: 'Create something amazing',
          buttonText: 'Get Started',
          musicEnabled: false,
          autoplayEnabled: false,
          loopMusic: true,
          volume: 50,
        };
        await BaseCrudService.create('homepagesettings', newSettings);
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load home page settings',
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

      // Generate upload URL from Wix Media Manager
      const uploadResponse = await fetch('/api/media/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });

      if (!uploadResponse.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, fileId } = await uploadResponse.json();

      // Upload file to Wix Media Manager
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResult.ok) throw new Error('Upload failed');

      // Get the media URL
      const mediaResponse = await fetch(`/api/media/get-media-url?fileId=${fileId}`);
      if (!mediaResponse.ok) throw new Error('Failed to get media URL');
      const { mediaUrl } = await mediaResponse.json();

      // Update settings with new image URL
      const updated = { ...settings, heroBackgroundImage: mediaUrl };
      await BaseCrudService.update('homepagesettings', updated);
      setSettings(updated);
      setPreviewUrl(mediaUrl);

      toast({
        title: 'Success',
        description: 'Hero background image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
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
      const updated = { ...settings, heroBackgroundImage: undefined };
      await BaseCrudService.update('homepagesettings', updated);
      setSettings(updated);
      setPreviewUrl(null);

      toast({
        title: 'Success',
        description: 'Hero background image removed',
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
      {/* Hero Background Image */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Hero Background Image
            </h3>
            <p className="text-sm text-slate-500 mt-1">Upload or replace the main background image for the hero section</p>
          </div>

          {/* Preview */}
          {(previewUrl || settings?.heroBackgroundImage) && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img
                src={previewUrl || settings?.heroBackgroundImage}
                alt="Hero background preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {!previewUrl && !settings?.heroBackgroundImage && (
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

            {(previewUrl || settings?.heroBackgroundImage) && (
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
          <strong>Tip:</strong> Use high-quality images (1920x1080 or larger) for best results. Supported formats: JPG, PNG, WebP.
        </p>
      </Card>
    </div>
  );
}
