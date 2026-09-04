/**
 * Work Gallery Manager - 90 SLOT GALLERY WITH DATABASE PERSISTENCE
 * FIXED: Uses the safe upsert API for CMS persistence
 * 
 * This version manages 90 slots with full metadata tracking:
 * - Unique ID for each slot
 * - Image URL/link (persisted to Wix Media)
 * - Filename
 * - Caption and alt text
 * - Upload timestamp
 * - PERSISTED TO DATABASE (portfolioimages collection)
 * 
 * CRITICAL FIX:
 * - Uses /api/portfolio/upsert-slot for CMS persistence
 * - Handles both empty slots (CREATE) and occupied slots (UPDATE)
 * - Never requires itemId for empty slots
 * - Maintains 90 visible slots regardless of CMS record existence
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Upload, Trash2, Eye, X, RefreshCw, Maximize2, Image as ImageIcon,
  AlertCircle, CheckCircle, Copy, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

const MAX_SLOTS = 90;

interface SlotData {
  id: string;
  slotNumber: number;
  image?: string;
  filename?: string;
  caption?: string;
  altText?: string;
  uploadedAt?: string;
}

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function WorkGalleryManager() {
  console.log('[WorkGalleryManager] Component rendering');
  
  // 90 SLOTS WITH DATABASE PERSISTENCE
  const [slots, setSlots] = useState<SlotData[]>(() => {
    const initialSlots = Array.from({ length: MAX_SLOTS }, (_, i) => {
      const slotNumber = i + 1;
      return {
        id: `slot-${slotNumber}-${crypto.randomUUID()}`,
        slotNumber,
        image: undefined,
        filename: '',
        caption: '',
        altText: '',
        uploadedAt: undefined,
      };
    });
    console.log('[WorkGalleryManager] Initial state created with', initialSlots.length, 'slots');
    return initialSlots;
  });

  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [replacingSlot, setReplacingSlot] = useState<number | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; slotNumber: number } | null>(null);
  const [showMetadata, setShowMetadata] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  // Load photos from database on mount
  useEffect(() => {
    loadPhotosFromDatabase();
  }, []);

  const loadPhotosFromDatabase = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 1000 });
      const dbPhotos = result.items || [];
      
      console.log('[WorkGalleryManager] Loaded', dbPhotos.length, 'photos from database');
      
      // Map database photos to slots based on displayOrder
      const updatedSlots = slots.map(slot => {
        const dbPhoto = dbPhotos.find(p => p.displayOrder === slot.slotNumber);
        if (dbPhoto && dbPhoto.image) {
          return {
            ...slot,
            image: convertWixImageToHttps(dbPhoto.image) || dbPhoto.image,
            filename: dbPhoto.caption || '',
            caption: dbPhoto.caption || '',
            altText: dbPhoto.altText || '',
            uploadedAt: dbPhoto._updatedDate?.toString(),
          };
        }
        return slot;
      });
      
      setSlots(updatedSlots);
    } catch (error) {
      console.error('[WorkGalleryManager] Error loading photos:', error);
      addStatusMessage('error', 'Failed to load photos from database');
    } finally {
      setIsLoading(false);
    }
  };

  const addStatusMessage = (type: StatusMessage['type'], message: string) => {
    const id = crypto.randomUUID();
    setStatusMessages(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setStatusMessages(prev => prev.filter(m => m.id !== id));
    }, 5000);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    addStatusMessage('info', `Selected ${newFiles.length} file(s)`);
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      addStatusMessage('info', `Uploading ${selectedFiles.length} file(s)...`);

      let filesAdded = 0;
      const updatedSlots = [...slots];

      for (const file of selectedFiles) {
        const emptySlot = updatedSlots.find(s => !s.image);
        if (emptySlot) {
          try {
            // Step 1: Upload to Wix Media
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/media/upload-gallery', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error('Upload failed');
            }

            const uploadedData = await uploadResponse.json();
            const imageUrl = uploadedData.mediaUrl || uploadedData.url;

            if (!imageUrl) {
              throw new Error('No image URL returned');
            }

            console.log('[WorkGalleryManager] Wix Media upload succeeded for slot', emptySlot.slotNumber, 'URL:', imageUrl);

            // Step 2: Upsert to CMS using the safe upsert API
            const upsertResponse = await fetch('/api/portfolio/upsert-slot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                displayOrder: emptySlot.slotNumber,
                image: imageUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                altText: file.name,
                portfolioItemId: 'work-gallery',
              }),
            });

            if (!upsertResponse.ok) {
              const errorData = await upsertResponse.json();
              throw new Error(`CMS upsert failed: ${errorData.error || 'Unknown error'}`);
            }

            const upsertData = await upsertResponse.json();
            console.log('[WorkGalleryManager] CMS upsert succeeded for slot', emptySlot.slotNumber, 'itemId:', upsertData.itemId, 'action:', upsertData.action);

            // Update local slot
            emptySlot.image = convertWixImageToHttps(imageUrl) || imageUrl;
            emptySlot.filename = file.name;
            emptySlot.caption = file.name.replace(/\.[^/.]+$/, '');
            emptySlot.altText = file.name;
            emptySlot.uploadedAt = new Date().toISOString();
            filesAdded++;

            addStatusMessage('success', `Slot ${emptySlot.slotNumber}: ${upsertData.action === 'created' ? 'created' : 'updated'}`);
          } catch (error) {
            console.error('[WorkGalleryManager] Error uploading file:', error);
            addStatusMessage('error', `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      setSlots(updatedSlots);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      addStatusMessage('success', `Successfully uploaded ${filesAdded} file(s)`);
    } catch (error) {
      console.error('[WorkGalleryManager] Upload error:', error);
      addStatusMessage('error', 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplacePhoto = async (slotNumber: number, file: File) => {
    try {
      setReplacingSlot(slotNumber);
      addStatusMessage('info', `Replacing slot ${slotNumber}...`);

      // Upload to Wix Media
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/media/upload-gallery', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.mediaUrl || uploadedData.url;

      if (!imageUrl) {
        throw new Error('No image URL returned');
      }

      // Use upsert API for replacement too
      const upsertResponse = await fetch('/api/portfolio/upsert-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayOrder: slotNumber,
          image: imageUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          altText: file.name,
          portfolioItemId: 'work-gallery',
        }),
      });

      if (!upsertResponse.ok) {
        const errorData = await upsertResponse.json();
        throw new Error(`CMS upsert failed: ${errorData.error || 'Unknown error'}`);
      }

      // Update local slot
      const updatedSlots = [...slots];
      const slot = updatedSlots.find(s => s.slotNumber === slotNumber);
      if (slot) {
        const now = new Date().toISOString();
        slot.image = convertWixImageToHttps(imageUrl) || imageUrl;
        slot.filename = file.name;
        slot.caption = file.name.replace(/\.[^/.]+$/, '');
        slot.altText = file.name;
        slot.uploadedAt = now;
        setSlots(updatedSlots);
        addStatusMessage('success', `Slot ${slotNumber} replaced`);
      }
    } catch (error) {
      console.error('[WorkGalleryManager] Replace error:', error);
      addStatusMessage('error', `Failed to replace slot ${slotNumber}`);
    } finally {
      setReplacingSlot(null);
    }
  };

  const handleDeletePhoto = async (slotNumber: number) => {
    if (!confirm(`Delete photo in slot ${slotNumber}?`)) return;

    try {
      setDeletingSlot(slotNumber);
      addStatusMessage('info', `Deleting slot ${slotNumber}...`);

      // Find and delete from database
      const existingPhotos = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 1000 });
      const photoToDelete = existingPhotos.items?.find(p => p.displayOrder === slotNumber);

      if (photoToDelete) {
        await BaseCrudService.delete('portfolioimages', photoToDelete._id);
      }

      // Update local slot
      const updatedSlots = [...slots];
      const slot = updatedSlots.find(s => s.slotNumber === slotNumber);
      if (slot) {
        slot.image = undefined;
        slot.filename = '';
        slot.caption = '';
        slot.altText = '';
        slot.uploadedAt = undefined;
        setSlots(updatedSlots);
        addStatusMessage('success', `Slot ${slotNumber} deleted`);
      }
    } catch (error) {
      console.error('[WorkGalleryManager] Delete error:', error);
      addStatusMessage('error', `Failed to delete slot ${slotNumber}`);
    } finally {
      setDeletingSlot(null);
    }
  };

  const copySlotMetadata = (slot: SlotData) => {
    const metadata = {
      id: slot.id,
      slotNumber: slot.slotNumber,
      filename: slot.filename,
      caption: slot.caption,
      altText: slot.altText,
      uploadedAt: slot.uploadedAt,
      imageUrl: slot.image ? '[Image URL]' : 'No image',
    };
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    addStatusMessage('success', `Slot ${slot.slotNumber} metadata copied to clipboard`);
  };

  const filledSlots = slots.filter(s => s.image).length;

  console.log('[WorkGalleryManager] Rendering with', slots.length, 'slots, filled:', filledSlots);

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {statusMessages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
              msg.type === 'success' ? 'bg-green-100 text-green-800' :
              msg.type === 'error' ? 'bg-red-100 text-red-800' :
              msg.type === 'warning' ? 'bg-amber-100 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {msg.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {msg.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {msg.type === 'warning' && <AlertCircle className="w-4 h-4" />}
            {msg.type === 'info' && <AlertCircle className="w-4 h-4" />}
            {msg.message}
          </motion.div>
        ))}
      </div>

      {/* Upload Section */}
      <Card className="p-6 border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Work Gallery Manager (90 Slots - Safe Upsert)
              </h3>
              <p className="text-sm text-slate-600 mt-1">Upload photos with automatic CMS persistence (create or update)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{filledSlots}</p>
              <p className="text-xs text-blue-600 font-medium">/ {MAX_SLOTS} slots</p>
            </div>
          </div>

          {/* Upload Area */}
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
              <p className="text-xs text-slate-600 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={isUploading}
            multiple
            className="hidden"
          />

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {selectedFiles.length} file(s) selected
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
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                  >
                    <div className="w-full h-20 bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                      <div className="truncate font-medium">{file.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
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
      </Card>

      {/* Slots Grid */}
      <Card className="p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            90-Slot Gallery Grid ({filledSlots}/{MAX_SLOTS})
          </h3>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Click info icon to view metadata
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : (
          /* Grid - ALWAYS RENDERS 90 SLOTS */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
            width: '100%',
            minHeight: '1200px'
          }}>
          {slots.map((slot) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (slot.slotNumber - 1) * 0.02 }}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                slot.image
                  ? 'border-slate-200 bg-slate-50 hover:border-slate-300 group'
                  : 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-400'
              }`}
            >
              {/* Slot Number Badge */}
              <div className="absolute top-1 left-1 z-10 bg-slate-900 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                #{slot.slotNumber}
              </div>

              {/* Metadata Info Button */}
              <button
                onClick={() => setShowMetadata(showMetadata === slot.slotNumber ? null : slot.slotNumber)}
                className="absolute top-1 right-1 z-10 p-1 bg-slate-700 text-white rounded hover:bg-slate-800 transition-colors"
                title="View metadata"
              >
                <Info className="w-3 h-3" />
              </button>

              {slot.image ? (
                <>
                  {/* Image */}
                  <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={slot.image}
                      alt={slot.caption || 'Gallery photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: slot.image!, slotNumber: slot.slotNumber })}
                        className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="Preview"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(slot.image, '_blank')}
                        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        title="View"
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
                              handleReplacePhoto(slot.slotNumber, file);
                            }
                          }}
                          disabled={replacingSlot === slot.slotNumber}
                          className="hidden"
                        />
                        <button
                          onClick={(e) => {
                            e.currentTarget.parentElement?.querySelector('input')?.click();
                          }}
                          disabled={replacingSlot === slot.slotNumber}
                          className="p-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
                          title="Replace"
                        >
                          {replacingSlot === slot.slotNumber ? (
                            <LoadingSpinner className="w-3 h-3" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </button>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(slot.slotNumber)}
                        disabled={deletingSlot === slot.slotNumber}
                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingSlot === slot.slotNumber ? (
                          <LoadingSpinner className="w-3 h-3" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => copySlotMetadata(slot)}
                        className="p-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                        title="Copy metadata"
                      >
                        <Copy className="w-3 h-3" />
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

              {/* Metadata Panel */}
              {showMetadata === slot.slotNumber && slot.image && (
                <div className="absolute inset-0 z-20 bg-black/90 text-white p-2 text-xs overflow-auto rounded-lg flex flex-col justify-between">
                  <div className="space-y-1">
                    <p><strong>ID:</strong> {slot.id.substring(0, 20)}...</p>
                    <p><strong>Slot:</strong> {slot.slotNumber}</p>
                    <p><strong>File:</strong> {slot.filename}</p>
                    <p><strong>Caption:</strong> {slot.caption}</p>
                    <p><strong>Alt:</strong> {slot.altText}</p>
                    {slot.uploadedAt && (
                      <p><strong>Uploaded:</strong> {new Date(slot.uploadedAt).toLocaleString()}</p>
                    )}
                  </div>
                  <button
                    onClick={() => copySlotMetadata(slot)}
                    className="mt-2 w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy All
                  </button>
                </div>
              )}
            </motion.div>
          ))}</div>
      </Card>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage.url}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
