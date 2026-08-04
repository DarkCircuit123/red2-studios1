import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Check, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image as ImageComponent } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';

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
      const result = await BaseCrudService.getAll<Splashpage>('splashpage');
      const active = result.items.find((item) => item.isActive);
      setActiveLogo(active || null);
    } catch (error) {
      console.error('Error loading active logo:', error);
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

      // Upload file to Wix media
      const uploadResponse = await fetch('/api/media/upload-hero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileId } = await uploadResponse.json();

      // Upload file to the provided URL
      const uploadFileResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadFileResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setIsUploading(false);

      // Deactivate previous active logo
      if (activeLogo) {
        await BaseCrudService.update<Splashpage>('splashpage', {
          _id: activeLogo._id,
          isActive: false,
        });
      }

      // Create new logo entry
      const newLogo: Splashpage = {
        _id: crypto.randomUUID(),
        logoImage: fileId,
        logoName: selectedFile.name.replace(/\.[^/.]+$/, ''),
        altText: `Splash page logo - ${new Date().toLocaleDateString()}`,
        updatedDate: new Date(),
        isActive: true,
      };

      await BaseCrudService.create<Splashpage>('splashpage', newLogo);

      setActiveLogo(newLogo);
      setSelectedFile(null);
      setPreviewUrl(null);
      showNotification('success', 'Splash page logo updated successfully!');

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showNotification('error', 'Failed to upload and save logo');
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
      await BaseCrudService.delete<Splashpage>('splashpage', activeLogo._id);
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
        <Loader className="w-8 h-8 animate-spin text-primary" />
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
          className={`flex items-center gap-3 p-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {notification.type === 'success' && (
            <Check className="w-5 h-5 flex-shrink-0" />
          )}
          {notification.type === 'error' && (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </motion.div>
      )}

      {/* Current Logo Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Logo
        </h3>
        {activeLogo && activeLogo.logoImage ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-xs h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
              <ImageComponent
                src={activeLogo.logoImage}
                alt={activeLogo.altText || 'Splash page logo'}
                width={300}
                height={160}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {activeLogo.logoName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Updated:{' '}
                {new Date(activeLogo.updatedDate || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No logo uploaded yet</p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedFile ? 'Preview New Logo' : 'Upload New Logo'}
        </h3>

        {selectedFile && previewUrl ? (
          <div className="space-y-4">
            <div className="w-full max-w-xs h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 mx-auto">
              <img
                src={previewUrl}
                alt="Preview"
                className="object-contain w-full h-full"
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {selectedFile.name}
            </p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
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
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading || isSaving}
          >
            Cancel
          </Button>
        )}

        {activeLogo && !selectedFile && (
          <Button
            variant="destructive"
            onClick={handleDeleteLogo}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Logo
          </Button>
        )}

        {selectedFile && (
          <Button
            onClick={handleUploadAndSave}
            disabled={isUploading || isSaving}
            className="flex items-center gap-2"
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
