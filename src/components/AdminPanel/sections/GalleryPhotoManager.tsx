import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, Trash2, Eye, Plus, X, RefreshCw, Maximize2 } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { motion } from 'framer-motion';
import ImageThumbnailPreview from './ImageThumbnailPreview';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

interface GalleryPhoto {
  _id: string;
  gallerySlug?: string;
  category?: string;
  subCategory?: string;
  title?: string;
  image?: string;
  thumbnail?: string;
  description?: string;
  displayOrder?: number;
  featured?: boolean;
  _createdDate?: Date;
}

interface UploadFormData {
  category: string;
  subCategory: string;
  title: string;
  description: string;
  displayOrder: number;
  featured: boolean;
}

interface PreviewState {
  photoId: string | null;
  imageUrl: string | null;
}

export default function GalleryPhotoManager() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fullImagePreview, setFullImagePreview] = useState<PreviewState>({
    photoId: null,
    imageUrl: null,
  });
  const [formData, setFormData] = useState<UploadFormData>({
    category: 'Commercial',
    subCategory: 'Los Angeles 2006',
    title: '',
    description: '',
    displayOrder: 0,
    featured: false,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  // Load existing photos
  useEffect(() => {
    loadPhotos();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    const subs = photos
      .filter((p) => p.category === formData.category)
      .map((p) => p.subCategory)
      .filter((s) => s && s.length > 0);
    const uniqueSubs = Array.from(new Set(subs));
    setSubCategories(uniqueSubs as string[]);

    if (uniqueSubs.length > 0 && !uniqueSubs.includes(formData.subCategory)) {
      setFormData((prev) => ({
        ...prev,
        subCategory: uniqueSubs[0] as string,
      }));
    }
  }, [formData.category, photos]);

  // Update categories when photos change
  useEffect(() => {
    const cats = photos
      .map((p) => p.category)
      .filter((c) => c && c.length > 0);
    const uniqueCats = Array.from(new Set(cats));
    setCategories(uniqueCats as string[]);
  }, [photos]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<GalleryPhoto>(
        'galleryphotos',
        {},
        { limit: 1000 }
      );
      if (result.items) {
        const sorted = result.items.sort((a, b) => {
          const orderA = a.displayOrder ?? Number.MAX_VALUE;
          const orderB = b.displayOrder ?? Number.MAX_VALUE;
          return orderA - orderB;
        });
        setPhotos(sorted);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = true;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // Upload image to Wix Media Manager
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', selectedFile);

      const uploadResponse = await fetch('/api/media/upload-hero', {
        method: 'POST',
        body: formDataForUpload,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.url;

      // Create gallery slug from category and subcategory
      const gallerySlug = `${formData.category.toLowerCase()}-${formData.subCategory.toLowerCase()}`.replace(/\s+/g, '-');

      // Create new CMS record for this photo
      const newPhoto: GalleryPhoto = {
        _id: crypto.randomUUID(),
        gallerySlug,
        category: formData.category,
        subCategory: formData.subCategory,
        title: formData.title || selectedFile.name,
        image: imageUrl,
        description: formData.description,
        displayOrder: formData.displayOrder,
        featured: formData.featured,
      };

      // Insert into CMS
      await BaseCrudService.create('galleryphotos', newPhoto);

      // Reload photos
      await loadPhotos();

      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setFormData({
        category: formData.category,
        subCategory: formData.subCategory,
        title: '',
        description: '',
        displayOrder: (formData.displayOrder || 0) + 1,
        featured: false,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await BaseCrudService.delete('galleryphotos', photoId);
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo.');
    }
  };

  const clearForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData({
      category: 'Commercial',
      subCategory: 'Los Angeles 2006',
      title: '',
      description: '',
      displayOrder: 0,
      featured: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <Card className="p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Upload New Photo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Photo Image
            </label>
            {previewUrl ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full h-64 rounded-lg border-2 border-dashed transition-colors ${
                  dragOverRef.current
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 bg-slate-50'
                } flex items-center justify-center cursor-pointer`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              disabled={isUploading}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <Input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="e.g., Commercial"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project/Subcategory
              </label>
              <Input
                type="text"
                value={formData.subCategory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subCategory: e.target.value,
                  }))
                }
                placeholder="e.g., Los Angeles 2006"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Photo Title
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Optional title"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                className="w-full h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        featured: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Featured</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={uploadPhoto}
                disabled={!selectedFile || isUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
              <Button
                onClick={clearForm}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Photos List */}
      <Card className="p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          Gallery Photos ({photos.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : photos.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No photos uploaded yet. Start by uploading your first photo above.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors"
              >
                {/* Image */}
                <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                  {photo.image && (
                    <img
                      src={convertWixImageToHttps(photo.image) || photo.image}
                      alt={photo.title || 'Gallery photo'}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        const imageUrl = convertWixImageToHttps(photo.image) || photo.image;
                        setFullImagePreview({ photoId: photo._id, imageUrl });
                      }}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Preview full image"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(convertWixImageToHttps(photo.image) || photo.image, '_blank')}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="View full image in new tab"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePhoto(photo._id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Delete this photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {photo.category} / {photo.subCategory}
                    </p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {photo.title || 'Untitled'}
                    </p>
                  </div>
                  {photo.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                    <span>Order: {photo.displayOrder ?? 'N/A'}</span>
                    {photo.featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Full Image Preview Modal */}
      {fullImagePreview.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullImagePreview({ photoId: null, imageUrl: null })}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFullImagePreview({ photoId: null, imageUrl: null })}
              className="absolute top-4 right-4 z-10 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={fullImagePreview.imageUrl}
              alt="Full preview"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
