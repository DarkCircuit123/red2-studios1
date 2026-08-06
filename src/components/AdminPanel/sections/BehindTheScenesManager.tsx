import React, { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { Trash2, Plus, Edit2, X } from 'lucide-react';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { useToast } from '@/hooks/use-toast';

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

export default function BehindTheScenesManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<BehindTheScenesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    photo: '',
    title: '',
    description: '',
    order: 0,
    dateTaken: '',
  });

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
      toast({
        title: 'Error',
        description: 'Failed to load items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setFormData({
      photo: '',
      title: '',
      description: '',
      order: items.length,
      dateTaken: new Date().toISOString().split('T')[0],
    });
  };

  const handleEdit = (item: BehindTheScenesItem) => {
    setEditingId(item._id);
    setFormData({
      photo: item.photo || '',
      title: item.title || '',
      description: item.description || '',
      order: item.order || 0,
      dateTaken: item.dateTaken || '',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      photo: '',
      title: '',
      description: '',
      order: 0,
      dateTaken: '',
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a title',
          variant: 'destructive',
        });
        return;
      }

      if (editingId) {
        // Update existing
        await adminCms.update('behindthescenes', {
          _id: editingId,
          photo: formData.photo,
          title: formData.title,
          description: formData.description,
          order: formData.order,
          dateTaken: formData.dateTaken,
        });
      } else {
        // Create new
        await adminCms.create('behindthescenes', {
          _id: crypto.randomUUID(),
          photo: formData.photo,
          title: formData.title,
          description: formData.description,
          order: formData.order,
          dateTaken: formData.dateTaken,
        });
      }

      toast({
        title: 'Success',
        description: editingId ? 'Item updated' : 'Item created',
      });

      handleCancel();
      await loadItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await adminCms.delete('behindthescenes', id);
      await loadItems();
      toast({
        title: 'Success',
        description: 'Item deleted',
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);

      setFormData(prev => ({
        ...prev,
        photo: result.mediaUrl || '',
      }));

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Behind The Scenes</h3>
        {!isAdding && !editingId && (
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus size={16} />
            Add New
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">{editingId ? 'Edit' : 'Add New'} Behind The Scenes</h4>
            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Photo</label>
            <div className="flex gap-4">
              {formData.photo && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <Image
                    src={formData.photo}
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
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90"
                />
                <p className="text-xs text-gray-500 mt-2">Upload a new image or use existing URL</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          {/* Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            {/* Date Taken */}
            <div>
              <label className="block text-sm font-medium mb-2">Date Taken</label>
              <Input
                type="date"
                value={formData.dateTaken}
                onChange={(e) => setFormData(prev => ({ ...prev, dateTaken: e.target.value }))}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No behind-the-scenes items yet. Add one to get started!</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="border rounded-lg p-4 flex gap-4 items-start hover:bg-gray-50 transition">
              {/* Thumbnail */}
              {item.photo && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0">
                  <Image
                    src={item.photo}
                    alt={item.title || 'Behind the scenes'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    {item.dateTaken && (
                      <p className="text-xs text-gray-500 mt-2">
                        Date: {new Date(item.dateTaken).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Order: {item.order}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
