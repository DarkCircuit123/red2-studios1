import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, Trash2, Eye, Plus, X, RefreshCw, Maximize2, Image as ImageIcon } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { motion } from 'framer-motion';
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

  const MAX_SLOTS = 80;

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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Upload New Photo</h3>
            <p className="text-sm text-slate-500 mt-1">
              {photos.length} / {MAX_SLOTS} slots used
            </p>
          </div>
          <div className="text-right">
            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{photos.length}</p>
                <p className="text-xs text-blue-600 font-medium">/ {MAX_SLOTS}</p>
              </div>
            </div>
          </div>
        </div>

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
                disabled={!selectedFile || isUploading || photos.length >= MAX_SLOTS}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Uploading...
                  </>
                ) : photos.length >= MAX_SLOTS ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Slots Full
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

      {/* Photos Grid - 80 Slots */}
      <Card className="p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Work Photos ({photos.length}/{MAX_SLOTS})
          </h3>
          {photos.length >= MAX_SLOTS && (
            <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              All slots filled
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {/* Render all 80 slots */}
            {Array.from({ length: MAX_SLOTS }).map((_, slotIndex) => {
              const photo = photos[slotIndex];
              const hasImage = photo?.image && convertWixImageToHttps(photo.image);
              const displayImageUrl = hasImage ? convertWixImageToHttps(photo.image) : null;
              
              return (
                <motion.div
                  key={slotIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: slotIndex * 0.01 }}
                  className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors group"
                >
                  {/* Slot Number Badge */}
                  <div className="absolute top-1 left-1 z-10 bg-slate-900 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                    #{slotIndex + 1}
                  </div>

                  {/* Image Container */}
                  <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                    {displayImageUrl && photo ? (
                      <>
                        <img
                          src={displayImageUrl}
                          alt={photo.title || 'Gallery photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.warn('Failed to load image:', displayImageUrl);
                            (e.target as HTMLImageElement).src = '';
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              if (photo) {
                                setFullImagePreview({ photoId: photo._id, imageUrl: displayImageUrl });
                              }
                            }}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            title="Preview full image"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(displayImageUrl, '_blank')}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            title="View full image in new tab"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (photo) {
                                deletePhoto(photo._id);
                              }
                            }}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            title="Delete this photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  {photo && (
                    <div className="p-2 space-y-1 bg-white text-xs">
                      <p className="font-medium text-slate-900 truncate">
                        {photo.title || 'Untitled'}
                      </p>
                      <p className="text-slate-500 truncate">
                        {photo.category} / {photo.subCategory}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
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
