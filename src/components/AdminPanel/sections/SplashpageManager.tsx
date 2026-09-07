import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Check, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image as ImageComponent } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { Splashpage } from '@/entities';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import ImageThumbnailPreview from './ImageThumbnailPreview';

interface SplashpageManagerProps {
  onSave?: () => void;
}

export default function SplashpageManager({ onSave }: SplashpageManagerProps) {
  const [activeLogo, setActiveLogo] = useState<Splashpage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load active logo on mount
  useEffect(() => {
    loadActiveLogo();
  }, []);

  const loadActiveLogo = async () => {
    try {
      setIsLoading(true);
      // Diagnostic: CMS query initiated
      const result = await BaseCrudService.getAll<Splashpage>('splashpage');
      
      console.log('[SplashpageManager] CMS query result:', result);
      
      if (!result.items || result.items.length === 0) {
        console.log('[SplashpageManager] No items in collection');
        setActiveLogo(null);
        return;
      }
      
      console.log('[SplashpageManager] Found items:', result.items);
      
      const active = result.items.find((item) => item.isActive);
      console.log('[SplashpageManager] Active logo:', active);
      setActiveLogo(active || null);
    } catch (error) {
      console.error('[SplashpageManager] Error loading active logo:', error);
      showNotification('error', 'Failed to load splash page logo');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAndSave = async () => {
    if (!selectedFile) {
      showNotification('error', 'Please select a file first');
      return;
    }

    try {
      setIsUploading(true);
      setIsSaving(true);

      // Use shared uploadMedia service
      const result = await uploadMedia(selectedFile, 'image', IMAGE_UPLOAD_CONFIG);

      console.log('[SplashpageManager] Upload result:', result);

      setIsUploading(false);

      // Deactivate previous active logo
      if (activeLogo) {
        console.log('[SplashpageManager] Deactivating previous logo:', activeLogo._id);
        await adminCms.update<Splashpage>('splashpage', {
          _id: activeLogo._id,
          isActive: false,
        });
      }

      // Create new logo entry
      const newLogo: Splashpage = {
        _id: crypto.randomUUID(),
        logoImage: result.mediaUrl,
        logoName: selectedFile.name.replace(/\.[^/.]+$/, ''),
        altText: `Splash page logo - ${new Date().toLocaleDateString()}`,
        updatedDate: new Date(),
        isActive: true,
      };

      console.log('[SplashpageManager] Creating new logo:', newLogo);

      await adminCms.create<Splashpage>('splashpage', newLogo);

      console.log('[SplashpageManager] Logo created successfully');

      setActiveLogo(newLogo);
      setSelectedFile(null);
      setPreviewUrl(null);
      showNotification('success', 'Splash page logo updated successfully!');

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as any).message 
        : 'Failed to upload and save logo';
      showNotification('error', errorMessage);
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!activeLogo) return;

    if (!window.confirm('Are you sure you want to delete this logo?')) {
      return;
    }

    try {
      setIsSaving(true);
      await adminCms.delete<Splashpage>('splashpage', activeLogo._id);
      setActiveLogo(null);
      showNotification('success', 'Logo deleted successfully');

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      showNotification('error', 'Failed to delete logo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-oxblood" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-3 p-4 rounded-none border transition-colors duration-160 ${
            notification.type === 'success'
              ? 'bg-admin-raise text-ok border-ok/30'
              : notification.type === 'error'
                ? 'bg-admin-raise text-danger border-danger/30'
                : 'bg-admin-raise text-admin-text border-admin-line'
          }`}
        >
          {notification.type === 'success' && (
            <Check className="w-5 h-5 flex-shrink-0" />
          )}
          {notification.type === 'error' && (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-[13px] font-medium">{notification.message}</span>
        </motion.div>
      )}

      {/* Current Logo Preview */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text mb-4">
          Current Logo
        </h2>
        {activeLogo && activeLogo.logoImage ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-xs h-40 bg-admin-raise rounded-none overflow-hidden flex items-center justify-center border border-admin-line">
              <ImageComponent
                src={convertWixImageToHttps(activeLogo.logoImage) || activeLogo.logoImage}
                alt={activeLogo.altText || ''}
                width={300}
                height={160}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-admin-text">
                {activeLogo.logoName}
              </p>
              <p className="text-[11px] text-admin-faint mt-1">
                Updated:{' '}
                {new Date(activeLogo.updatedDate || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-admin-raise rounded-none border border-dashed border-admin-line">
            <p className="text-[13px] text-admin-dim">No logo uploaded yet</p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text mb-4">
          {selectedFile ? 'Preview New Logo' : 'Upload New Logo'}
        </h2>

        {selectedFile && previewUrl ? (
          <div className="space-y-4">
            <div className="w-full max-w-xs h-40 bg-admin-raise rounded-none overflow-hidden flex items-center justify-center border border-admin-line mx-auto">
              <img
                src={previewUrl}
                alt="Preview"
                className="object-contain w-full h-full"
              />
            </div>
            <p className="text-[13px] text-admin-dim text-center">
              {selectedFile.name}
            </p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-admin-line rounded-none cursor-pointer hover:bg-admin-raise/50 transition-colors duration-160">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-admin-faint mb-2" />
              <p className="text-[13px] font-medium text-admin-text">
                Click to upload or drag and drop
              </p>
              <p className="text-[11px] text-admin-faint mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading || isSaving}
            />
          </label>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {selectedFile && (
          <Button
            onClick={handleCancel}
            disabled={isUploading || isSaving}
            className="bg-admin-raise hover:bg-admin-line text-admin-text border border-admin-line rounded-none transition-colors duration-160"
          >
            Cancel
          </Button>
        )}

        {activeLogo && !selectedFile && (
          <Button
            onClick={handleDeleteLogo}
            disabled={isSaving}
            className="flex items-center gap-2 bg-danger hover:bg-danger/90 text-white rounded-none transition-colors duration-160"
          >
            <Trash2 className="w-4 h-4" />
            Delete Logo
          </Button>
        )}

        {selectedFile && (
          <Button
            onClick={handleUploadAndSave}
            disabled={isUploading || isSaving}
            className="flex items-center gap-2 bg-oxblood hover:bg-oxblood/90 text-white rounded-none transition-colors duration-160"
          >
            {isUploading || isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Logo
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
