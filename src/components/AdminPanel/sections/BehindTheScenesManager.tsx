/**
 * Behind The Scenes Manager - Compact horizontal rows with dark theme
 * 
 * Features:
 * - Compact 96px max-height rows with 120x80 thumbnails
 * - File type validation (JPEG, PNG, GIF, WEBP only)
 * - Cleanup action for failed image rows
 * - Dark admin theme throughout
 * - Proper metadata labels and empty states
 */

import React, { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { Trash2, Plus, Upload, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import { motion } from 'framer-motion';

interface BehindTheScenesItem {
  _id: string;
  photo?: string;
  title?: string;
  description?: string;
  order?: number;
  dateTaken?: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export default function BehindTheScenesManager() {
  const [items, setItems] = useState<BehindTheScenesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [formData, setFormData] = useState({
    photo: '',
    title: '',
    order: 0,
    dateTaken: '',
  });

  const addStatusMessage = (type: StatusMessage['type'], message: string) => {
    const id = crypto.randomUUID();
    setStatusMessages(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setStatusMessages(prev => prev.filter(m => m.id !== id));
    }, 5000);
  };

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<BehindTheScenesItem>('behindthescenes', [], { limit: 100 });
      setItems(result.items.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('Failed to load behind-the-scenes items:', error);
      addStatusMessage('error', 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
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

  const handleAddNew = () => {
    setIsAdding(true);
    setFormData({
      photo: '',
      title: '',
      order: items.length,
      dateTaken: new Date().toISOString().split('T')[0],
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData({
      photo: '',
      title: '',
      order: 0,
      dateTaken: '',
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim()) {
        addStatusMessage('error', 'Please enter a title');
        return;
      }

      // Create new
      await adminCms.create('behindthescenes', {
        _id: crypto.randomUUID(),
        photo: formData.photo,
        title: formData.title,
        description: '',
        order: formData.order,
        dateTaken: formData.dateTaken,
      });

      addStatusMessage('success', 'Item created');
      handleCancel();
      await loadItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      addStatusMessage('error', 'Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await adminCms.delete('behindthescenes', id);
      await loadItems();
      addStatusMessage('success', 'Item deleted');
    } catch (error) {
      console.error('Failed to delete item:', error);
      addStatusMessage('error', 'Failed to delete item');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type BEFORE upload
    if (!validateImageFile(file)) {
      addStatusMessage('error', 'Only JPEG, PNG, GIF, and WEBP images are allowed');
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingImage(true);
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      setFormData(prev => ({
        ...prev,
        photo: result.mediaUrl || '',
      }));

      addStatusMessage('success', 'Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      addStatusMessage('error', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type BEFORE upload
    if (!validateImageFile(file)) {
      addStatusMessage('error', 'Only JPEG, PNG, GIF, and WEBP images are allowed');
      e.target.value = '';
      return;
    }

    try {
      setUploadingItemId(itemId);
      setIsUploadingImage(true);

      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      if (!result.mediaUrl) {
        throw new Error('Upload succeeded but no media URL returned');
      }

      await adminCms.update('behindthescenes', {
        _id: itemId,
        photo: result.mediaUrl,
      });

      await loadItems();
      addStatusMessage('success', 'Photo updated successfully');
    } catch (error) {
      console.error('Failed to upload and save photo:', error);
      addStatusMessage('error', error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploadingImage(false);
      setUploadingItemId(null);
    }
  };

  const cleanupFailedImages = async () => {
    try {
      setIsCleaningUp(true);
      let deletedCount = 0;

      for (const item of items) {
        if (item.photo) {
          try {
            const response = await fetch(convertWixImageToHttps(item.photo) || item.photo, { method: 'HEAD' });
            if (!response.ok) {
              await adminCms.delete('behindthescenes', item._id);
              deletedCount++;
            }
          } catch {
            await adminCms.delete('behindthescenes', item._id);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        addStatusMessage('success', `Cleaned up ${deletedCount} failed image row(s)`);
        await loadItems();
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

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
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

      {/* Header */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
              Behind The Scenes
            </h2>
            <p className="text-[13px] text-admin-dim mt-1">Appears on the home page</p>
          </div>
          {!isAdding && (
            <Button 
              onClick={handleAddNew} 
              className="flex items-center gap-2 bg-oxblood hover:bg-oxblood/90 text-white rounded-none text-[11px] px-4 py-2 transition-colors duration-160"
            >
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-admin-raise rounded-none border border-admin-line p-6 space-y-4"
        >
          <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
            Add New Behind The Scenes
          </h3>

          {/* Image Upload */}
          <div>
            <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">Photo</label>
            <div className="flex gap-4">
              {formData.photo && (
                <div className="relative w-32 h-32 rounded-none overflow-hidden border border-admin-line">
                  <Image
                    src={convertWixImageToHttps(formData.photo) || formData.photo}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="block w-full text-[13px] text-admin-dim
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-none file:border-0
                    file:text-[11px] file:font-semibold
                    file:bg-oxblood file:text-white
                    hover:file:bg-oxblood/90
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {isUploadingImage && <p className="text-[11px] text-admin-dim mt-2">Uploading...</p>}
                {!isUploadingImage && <p className="text-[11px] text-admin-faint mt-2">JPEG, PNG, GIF, or WEBP</p>}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter title"
              className="bg-admin-surface border-admin-line text-admin-text placeholder:text-admin-faint rounded-none"
            />
          </div>

          {/* Order & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">Order</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="bg-admin-surface border-admin-line text-admin-text placeholder:text-admin-faint rounded-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">Date Taken</label>
              <Input
                type="date"
                value={formData.dateTaken}
                onChange={(e) => setFormData(prev => ({ ...prev, dateTaken: e.target.value }))}
                className="bg-admin-surface border-admin-line text-admin-text rounded-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-admin-line">
            <Button 
              onClick={handleCancel} 
              className="flex-1 bg-admin-line hover:bg-admin-line/60 text-admin-text rounded-none text-[11px] transition-colors duration-160"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isUploadingImage} 
              className="flex-1 bg-oxblood hover:bg-oxblood/90 text-white rounded-none text-[11px] transition-colors duration-160 disabled:opacity-50"
            >
              Create
            </Button>
          </div>
        </motion.div>
      )}

      {/* Items List */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
            All Items ({items.length})
          </h3>
          {items.length > 0 && (
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

        {items.length === 0 ? (
          <p className="text-[13px] text-admin-dim">No items yet</p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-admin-line rounded-none bg-admin-raise hover:border-admin-line/60 transition-colors group flex items-center gap-3 p-2 h-24"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-none overflow-hidden border border-admin-line flex-shrink-0 bg-admin-surface">
                  {item.photo ? (
                    <>
                      <Image
                        src={convertWixImageToHttps(item.photo) || item.photo}
                        alt={item.title || 'Behind the scenes'}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Quick Upload Overlay */}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQuickUpload(e, item._id)}
                          disabled={isUploadingImage || uploadingItemId === item._id}
                          className="hidden"
                        />
                        <Upload className="w-4 h-4 text-white" />
                      </label>
                      {uploadingItemId === item._id && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <LoadingSpinner className="w-4 h-4" />
                        </div>
                      )}
                    </>
                  ) : (
                    <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-admin-line transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleQuickUpload(e, item._id)}
                        disabled={isUploadingImage || uploadingItemId === item._id}
                        className="hidden"
                      />
                      <Upload className="w-4 h-4 text-admin-faint" />
                    </label>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-[13px] text-admin-text truncate">
                    {item.title || '(No title)'}
                  </h4>
                  <div className="flex gap-4 mt-1">
                    <p className="text-[11px] text-admin-faint">Order: {item.order}</p>
                    {item.dateTaken && (
                      <p className="text-[11px] text-admin-faint">
                        {new Date(item.dateTaken).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={isLoading || uploadingItemId === item._id}
                    className="p-2 bg-admin-line hover:bg-danger/20 text-admin-text hover:text-danger rounded-none transition-colors duration-160 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
