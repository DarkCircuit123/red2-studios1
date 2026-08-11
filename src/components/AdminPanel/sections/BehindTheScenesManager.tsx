import React, { useState, useEffect, useCallback } from 'react';
import { BaseCrudService } from '@/integrations';
import { Upload, Trash2, Loader } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BehindTheScenes } from '@/entities/index';

interface BehindTheScenesManagerProps {
  onSave?: () => void;
}

export default function BehindTheScenesManager({ onSave }: BehindTheScenesManagerProps) {
  const [items, setItems] = useState<BehindTheScenes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<BehindTheScenes>('behindthescenes', [], { limit: 100 });
      const sorted = (result?.items || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(sorted);
    } catch (error) {
      console.error('Failed to load behind-the-scenes items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = useCallback(async (itemId: string, file: File) => {
    try {
      setUploadingId(itemId);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Wix media
      const uploadResponse = await fetch('/api/media/upload-hero', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.mediaUrl || uploadData.url;

      // Update the item with new image
      await BaseCrudService.update<BehindTheScenes>('behindthescenes', {
        _id: itemId,
        photo: imageUrl,
      });

      // Reload items
      await loadItems();
      onSave?.();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingId(null);
    }
  }, [onSave]);

  const handleDeletePhoto = useCallback(async (itemId: string) => {
    try {
      await BaseCrudService.update<BehindTheScenes>('behindthescenes', {
        _id: itemId,
        photo: undefined,
      });
      await loadItems();
      onSave?.();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  }, [onSave]);

  const handleSaveEdit = useCallback(async (itemId: string) => {
    try {
      await BaseCrudService.update<BehindTheScenes>('behindthescenes', {
        _id: itemId,
        title: editTitle,
        description: editDescription,
      });
      setEditingId(null);
      await loadItems();
      onSave?.();
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes. Please try again.');
    }
  }, [editTitle, editDescription, onSave]);

  const startEdit = (item: BehindTheScenes) => {
    setEditingId(item._id);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Behind The Scenes Photos</h3>
        <p className="text-sm text-gray-600 mb-6">
          Manage the photos displayed in the Behind The Scenes section. Upload new photos or edit existing ones.
        </p>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex gap-4">
                {/* Photo Preview */}
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                  {item.photo ? (
                    <Image
                      src={item.photo}
                      alt={item.title || 'Behind the scenes'}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  {editingId === item._id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(item._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{item.title || 'Untitled'}</h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {item.description || 'No description'}
                      </p>
                      <button
                        onClick={() => startEdit(item)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handlePhotoUpload(item._id, file);
                        }
                      }}
                      disabled={uploadingId === item._id}
                      className="hidden"
                    />
                  </label>
                  {item.photo && (
                    <button
                      onClick={() => handleDeletePhoto(item._id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-sm text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {uploadingId === item._id && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No behind-the-scenes items found. Add items in the CMS first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
