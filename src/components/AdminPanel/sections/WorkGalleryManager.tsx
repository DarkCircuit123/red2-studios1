import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, Trash2, Eye, Plus, X, RefreshCw, Maximize2, Image as ImageIcon } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { motion } from 'framer-motion';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import { compressImages, formatBytes } from '@/lib/image-compression';

/**
 * Sanitize filename for Wix Media API
 * The Wix API is very strict about filenames - it rejects:
 * - Special characters like (), [], {}, etc.
 * - Spaces (should be hyphens)
 * - Non-ASCII characters
 * - Multiple dots
 * 
 * This function converts filenames to a safe format:
 * "01_2023-12-11(101).jpg" → "01_2023-12-11_101.jpg"
 */
function sanitizeFilename(filename: string): string {
  // Extract extension
  const lastDotIndex = filename.lastIndexOf('.');
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '.jpg';
  const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  
  // Remove/replace problematic characters
  let sanitized = nameWithoutExt
    .replace(/[()[\]{}]/g, '_')  // Replace brackets/parens with underscore
    .replace(/\s+/g, '_')         // Replace spaces with underscore
    .replace(/[^a-zA-Z0-9_\-]/g, '_')  // Replace other special chars with underscore
    .replace(/_+/g, '_')          // Collapse multiple underscores
    .replace(/^_+|_+$/g, '');     // Remove leading/trailing underscores
  
  // Ensure we have a valid name
  if (!sanitized) {
    sanitized = `image_${Date.now()}`;
  }
  
  return sanitized + ext;
}

interface PortfolioImage {
  _id: string;
  portfolioItemId?: string;
  displayOrder?: number;
  caption?: string;
  altText?: string;
  image?: string;
  _createdDate?: Date;
}

interface PreviewState {
  photoId: string | null;
  imageUrl: string | null;
}

interface SelectedFileWithCompression {
  original: File;
  compressed?: File;
  isCompressing?: boolean;
  compressionError?: string;
  originalSize?: number;
  compressedSize?: number;
}

const MAX_SLOTS = 80;

export default function WorkGalleryManager() {
  const [photos, setPhotos] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileWithCompression[]>([])
  const [fullImagePreview, setFullImagePreview] = useState<PreviewState>({
    photoId: null,
    imageUrl: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  // Load existing photos
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<PortfolioImage>(
        'portfolioimages',
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Create SelectedFileWithCompression objects and start compression
    const newSelectedFiles: SelectedFileWithCompression[] = newFiles.map(file => ({
      original: file,
      isCompressing: true,
    }));
    
    setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
    
    // Compress all new files
    newSelectedFiles.forEach((item) => {
      compressImages([item.original])
        .then(results => {
          if (results.length > 0) {
            const result = results[0];
            setSelectedFiles(prev => {
              const updated = [...prev];
              const fileIndex = prev.findIndex(f => f.original === item.original);
              if (fileIndex !== -1) {
                updated[fileIndex] = {
                  original: item.original,
                  compressed: result.file,
                  isCompressing: false,
                  originalSize: result.originalSize,
                  compressedSize: result.compressedSize,
                };
              }
              return updated;
            });
          }
        })
        .catch(error => {
          console.error(`Compression failed for ${item.original.name}:`, error);
          setSelectedFiles(prev => {
            const updated = [...prev];
            const fileIndex = prev.findIndex(f => f.original === item.original);
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                original: item.original,
                isCompressing: false,
                compressionError: 'Compression failed, will upload original',
              };
            }
            return updated;
          });
        });
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
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
    handleFileSelect(e.dataTransfer.files);
  };

  const handleMultiPhotoUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      const successfulUploads: string[] = [];
      const failedUploads: { name: string; reason: string }[] = [];

      for (const fileItem of selectedFiles) {
        try {
          // Use compressed file if available, otherwise use original
          let fileToUpload = fileItem.compressed || fileItem.original;

          // CRITICAL FIX: Ensure the file has the correct MIME type and .jpg extension
          // The Wix API is strict about file types - it must be image/jpeg
          if (fileToUpload.type !== 'image/jpeg') {
            console.warn(`[UPLOAD] File ${fileToUpload.name} has type ${fileToUpload.type}, converting to image/jpeg`);
            const blob = fileToUpload.slice(0, fileToUpload.size, 'image/jpeg');
            const filename = fileToUpload.name.toLowerCase().endsWith('.jpg') || 
                           fileToUpload.name.toLowerCase().endsWith('.jpeg')
              ? fileToUpload.name
              : fileToUpload.name.replace(/\.[^/.]+$/, '') + '.jpg';
            fileToUpload = new File([blob], filename, { type: 'image/jpeg', lastModified: Date.now() });
            console.log(`[UPLOAD] Recreated file: ${filename} with type image/jpeg`);
          }

          // Sanitize filename for Wix API compatibility
          const sanitizedFilename = sanitizeFilename(fileToUpload.name);
          const finalFileToUpload = new File([fileToUpload], sanitizedFilename, { 
            type: fileToUpload.type, 
            lastModified: Date.now() 
          });

          // Upload image to Wix Media Manager
          const formDataForUpload = new FormData();
          // Explicitly append with filename and ensure proper MIME type
          formDataForUpload.append('file', finalFileToUpload, finalFileToUpload.name);

          console.log(`[UPLOAD] Uploading ${finalFileToUpload.name} (type: ${finalFileToUpload.type}, size: ${finalFileToUpload.size})`);

          const uploadResponse = await fetch('/api/media/upload-gallery', {
            method: 'POST',
            body: formDataForUpload,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            const errorMessage = errorData.error || `Upload failed (${uploadResponse.status})`;
            console.error(`[UPLOAD] Failed: ${fileItem.original.name} - ${errorMessage}`);
            failedUploads.push({
              name: fileItem.original.name,
              reason: errorMessage,
            });
            continue;
          }

          const uploadedData = await uploadResponse.json();
          const imageUrl = uploadedData.mediaUrl || uploadedData.url;

          if (!imageUrl) {
            console.error(`[UPLOAD] No image URL returned for ${fileItem.original.name}`);
            failedUploads.push({
              name: fileItem.original.name,
              reason: 'No image URL returned',
            });
            continue;
          }

          console.log(`[UPLOAD] Success: ${fileItem.original.name} -> ${imageUrl}`);

          // Create new CMS record for this photo
          const newPhoto: PortfolioImage = {
            _id: crypto.randomUUID(),
            portfolioItemId: 'work-gallery',
            caption: fileItem.original.name.replace(/\.[^/.]+$/, ''),
            altText: fileItem.original.name.replace(/\.[^/.]+$/, ''),
            image: imageUrl,
            displayOrder: photos.length + successfulUploads.length + 1,
          };

          // Insert into CMS
          await BaseCrudService.create('portfolioimages', newPhoto);
          successfulUploads.push(fileItem.original.name);
        } catch (fileError) {
          const errorMsg = fileError instanceof Error ? fileError.message : 'Unknown error';
          console.error(`[UPLOAD] Exception for ${fileItem.original.name}:`, errorMsg);
          failedUploads.push({
            name: fileItem.original.name,
            reason: errorMsg,
          });
        }
      }

      // Reload photos
      await loadPhotos();

      // Reset
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show results
      if (successfulUploads.length > 0 && failedUploads.length === 0) {
        alert(`✓ Successfully uploaded ${successfulUploads.length} photo${successfulUploads.length !== 1 ? 's' : ''}`);
      } else if (successfulUploads.length > 0 && failedUploads.length > 0) {
        const failedList = failedUploads.map(f => `• ${f.name} (${f.reason})`).join('\n');
        alert(
          `✓ Uploaded ${successfulUploads.length} photo${successfulUploads.length !== 1 ? 's' : ''}\n\n✗ Failed to upload ${failedUploads.length}:\n${failedList}`
        );
      } else if (failedUploads.length > 0) {
        const failedList = failedUploads.map(f => `• ${f.name} (${f.reason})`).join('\n');
        alert(`✗ Failed to upload ${failedUploads.length} photo${failedUploads.length !== 1 ? 's' : ''}:\n${failedList}`);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('An unexpected error occurred during upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplacePhoto = async (photoId: string, file: File) => {
    try {
      setReplacingId(photoId);
      setIsReplacing(true);

      // Compress the file first
      const compressionResults = await compressImages([file]);
      let fileToUpload = compressionResults.length > 0 ? compressionResults[0].file : file;

      // CRITICAL FIX: Ensure the file has the correct MIME type and .jpg extension
      if (fileToUpload.type !== 'image/jpeg') {
        const blob = fileToUpload.slice(0, fileToUpload.size, 'image/jpeg');
        const filename = fileToUpload.name.toLowerCase().endsWith('.jpg') || 
                       fileToUpload.name.toLowerCase().endsWith('.jpeg')
          ? fileToUpload.name
          : fileToUpload.name.replace(/\.[^/.]+$/, '') + '.jpg';
        fileToUpload = new File([blob], filename, { type: 'image/jpeg', lastModified: Date.now() });
      }

      // Sanitize filename for Wix API compatibility
      const sanitizedFilename = sanitizeFilename(fileToUpload.name);
      const finalFileToUpload = new File([fileToUpload], sanitizedFilename, { 
        type: fileToUpload.type, 
        lastModified: Date.now() 
      });

      // Upload the new image
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', finalFileToUpload, finalFileToUpload.name);

      const uploadResponse = await fetch('/api/media/upload-gallery', {
        method: 'POST',
        body: formDataForUpload,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.mediaUrl || uploadedData.url;

      if (!imageUrl) {
        throw new Error('No image URL returned from upload');
      }

      // Update the photo with new image URL
      const photoToUpdate = photos.find(p => p._id === photoId);
      if (photoToUpdate) {
        const updatedPhoto: PortfolioImage = {
          ...photoToUpdate,
          image: imageUrl,
        };

        await BaseCrudService.update('portfolioimages', updatedPhoto);
        
        // Update local state
        setPhotos(photos.map(p => p._id === photoId ? updatedPhoto : p));

        alert('Photo replaced successfully');
      }
    } catch (error) {
      console.error('Replace error:', error);
      alert('Failed to replace photo');
    } finally {
      setReplacingId(null);
      setIsReplacing(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      setIsDeleting(true);
      await BaseCrudService.delete('portfolioimages', photoId);
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canUpload = photos.length < MAX_SLOTS;
  const slotsRemaining = MAX_SLOTS - photos.length;

  // Create array of 80 slots
  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => {
    return photos[i] || null;
  });

  return (
    <div className="space-y-8">
      {/* Batch Upload Section */}
      <Card className="p-6 border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Batch Upload Photos
              </h3>
              <p className="text-sm text-slate-600 mt-1">Upload multiple photos at once to your work gallery</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{photos.length}</p>
              <p className="text-xs text-blue-600 font-medium">/ {MAX_SLOTS} slots</p>
            </div>
          </div>

          {/* Upload Area */}
          {canUpload && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full h-40 rounded-lg border-2 border-dashed transition-colors ${
                dragOverRef.current ? 'border-blue-500 bg-blue-100' : 'border-blue-300 bg-blue-50'
              } flex items-center justify-center cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-600 mt-1">PNG, JPG, GIF up to 10MB • {slotsRemaining} slots remaining</p>
              </div>
            </div>
          )}

          {!canUpload && (
            <div className="w-full p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-900">All 80 slots are full. Delete some photos to upload more.</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={isUploading || !canUpload}
            multiple
            className="hidden"
          />

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {selectedFiles.map((fileItem, index) => (
                  <div
                    key={`${fileItem.original.name}-${index}`}
                    className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
                  >
                    <div className="w-full h-20 bg-slate-100 flex items-center justify-center flex-col">
                      {fileItem.isCompressing ? (
                        <LoadingSpinner className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSelected(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 space-y-0.5">
                      <div className="truncate font-medium">{fileItem.original.name}</div>
                      {fileItem.isCompressing && (
                        <div className="text-xs opacity-80">Compressing...</div>
                      )}
                      {fileItem.compressed && !fileItem.isCompressing && (
                        <div className="text-xs opacity-80">
                          {formatBytes(fileItem.originalSize || 0)} → {formatBytes(fileItem.compressedSize || 0)}
                        </div>
                      )}
                      {fileItem.compressionError && (
                        <div className="text-xs opacity-80 text-amber-300">{fileItem.compressionError}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleMultiPhotoUpload}
              disabled={selectedFiles.length === 0 || isUploading || !canUpload}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Slots Grid */}
      <Card className="p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Work Gallery Slots ({photos.length}/{MAX_SLOTS})
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
            {slots.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  photo
                    ? 'border-slate-200 bg-slate-50 hover:border-slate-300 group'
                    : 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-400'
                }`}
              >
                {/* Slot Number Badge */}
                <div className="absolute top-1 left-1 z-10 bg-slate-900 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                  #{index + 1}
                </div>

                {photo ? (
                  <>
                    {/* Image */}
                    <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                      {photo.image && (
                        <img
                          src={convertWixImageToHttps(photo.image) || photo.image}
                          alt={photo.title || 'Gallery photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.warn('Failed to load image:', photo.image);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            const imageUrl = convertWixImageToHttps(photo.image) || photo.image;
                            setFullImagePreview({ photoId: photo._id, imageUrl });
                          }}
                          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          title="Preview full image"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(convertWixImageToHttps(photo.image) || photo.image, '_blank')}
                          className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          title="View full image in new tab"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleReplacePhoto(photo._id, file);
                              }
                            }}
                            disabled={replacingId === photo._id}
                            className="hidden"
                          />
                          <button
                            onClick={(e) => {
                              e.currentTarget.parentElement?.querySelector('input')?.click();
                            }}
                            disabled={replacingId === photo._id}
                            className="p-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
                            title="Replace this image"
                          >
                            {replacingId === photo._id ? (
                              <LoadingSpinner className="w-3 h-3" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                          </button>
                        </label>
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo._id)}
                          className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          title="Delete this photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Empty Slot */}
                    <div className="w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    </div>
                  </>
                )}
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
