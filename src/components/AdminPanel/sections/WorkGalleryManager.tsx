/**
 * Work Gallery Manager - DYNAMIC SLOT GALLERY WITH DATABASE PERSISTENCE
 * 
 * Features:
 * - Dynamic slot count (starts at 90, grows as needed)
 * - Derives slot count from data: max(90, highest displayOrder, filled + 12)
 * - Upload grows slots if no empty slots found
 * - Delete removes image but keeps empty box
 * - Loads every row from portfolioimages collection
 * - Add 12 slots button for manual extension
 * - Upload Photo button in gallery grid header
 * - Fixed toast messages (only show success if uploaded > 0)
 * - Dark theme applied throughout
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Upload, Trash2, Eye, X, RefreshCw, Maximize2, Image as ImageIcon,
  AlertCircle, CheckCircle, Copy, Info, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

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
  
  // DYNAMIC SLOT COUNT - starts at 90, grows as needed
  const [slotCount, setSlotCount] = useState(90);
  
  // SLOTS WITH DATABASE PERSISTENCE
  const [slots, setSlots] = useState<SlotData[]>([]);

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
      
      // Find highest displayOrder and count filled slots
      let highestOrder = 0;
      const filledCount = dbPhotos.length;
      
      dbPhotos.forEach(photo => {
        if (photo.displayOrder && photo.displayOrder > highestOrder) {
          highestOrder = photo.displayOrder;
        }
      });
      
      // Derive slot count: max(90, highest, filled + 12)
      const derivedSlotCount = Math.max(90, highestOrder, filledCount + 12);
      setSlotCount(derivedSlotCount);
      
      console.log('[WorkGalleryManager] Derived slot count:', { highestOrder, filledCount, derivedSlotCount });
      
      // Create slots for every row returned by query + up to derived count
      const newSlots: SlotData[] = [];
      for (let i = 1; i <= derivedSlotCount; i++) {
        const dbPhoto = dbPhotos.find(p => p.displayOrder === i);
        if (dbPhoto && dbPhoto.image) {
          newSlots.push({
            id: dbPhoto._id || `slot-${i}-${crypto.randomUUID()}`,
            slotNumber: i,
            image: convertWixImageToHttps(dbPhoto.image) || dbPhoto.image,
            filename: dbPhoto.caption || '',
            caption: dbPhoto.caption || '',
            altText: dbPhoto.altText || '',
            uploadedAt: dbPhoto._updatedDate?.toString(),
          });
        } else {
          newSlots.push({
            id: `slot-${i}-${crypto.randomUUID()}`,
            slotNumber: i,
            image: undefined,
            filename: '',
            caption: '',
            altText: '',
            uploadedAt: undefined,
          });
        }
      }
      
      setSlots(newSlots);
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
        // Always append new photos to the end - create a new slot for each upload
        // Use the current length of updatedSlots to get the next slot number
        const nextSlotNumber = updatedSlots.length + 1;
        const targetSlot: SlotData = {
          id: `slot-${nextSlotNumber}-${crypto.randomUUID()}`,
          slotNumber: nextSlotNumber,
          image: undefined,
          filename: '',
          caption: '',
          altText: '',
          uploadedAt: undefined,
        };
        updatedSlots.push(targetSlot);

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

          console.log('[WorkGalleryManager] Wix Media upload succeeded for slot', targetSlot.slotNumber, 'URL:', imageUrl);

          // Step 2: Upsert to CMS using the safe upsert API
          const upsertResponse = await fetch('/api/portfolio/upsert-slot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              displayOrder: targetSlot.slotNumber,
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
          console.log('[WorkGalleryManager] CMS upsert succeeded for slot', targetSlot.slotNumber, 'itemId:', upsertData.itemId, 'action:', upsertData.action);

          // Update local slot
          targetSlot.image = convertWixImageToHttps(imageUrl) || imageUrl;
          targetSlot.filename = file.name;
          targetSlot.caption = file.name.replace(/\.[^/.]+$/, '');
          targetSlot.altText = file.name;
          targetSlot.uploadedAt = new Date().toISOString();
          filesAdded++;

          addStatusMessage('success', `Slot ${targetSlot.slotNumber}: ${upsertData.action === 'created' ? 'created' : 'updated'}`);
        } catch (error) {
          console.error('[WorkGalleryManager] Error uploading file:', error);
          addStatusMessage('error', `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update slot count to reflect new total after all uploads
      const newSlotCount = updatedSlots.length;
      
      // Update state immediately to render new boxes without refresh
      setSlots(updatedSlots);
      setSlotCount(newSlotCount);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Only show success if at least one file was uploaded
      if (filesAdded > 0) {
        addStatusMessage('success', `Successfully uploaded ${filesAdded} file(s)`);
      } else if (selectedFiles.length > 0) {
        addStatusMessage('error', `No files were uploaded (${selectedFiles.length} selected)`);
      }
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

      // Update local slot - DELETE removes image, not the box
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

  const handleAddSlots = () => {
    const newCount = slotCount + 12;
    setSlotCount(newCount);
    
    // Add new empty slots
    const updatedSlots = [...slots];
    for (let i = slots.length + 1; i <= newCount; i++) {
      updatedSlots.push({
        id: `slot-${i}-${crypto.randomUUID()}`,
        slotNumber: i,
        image: undefined,
        filename: '',
        caption: '',
        altText: '',
        uploadedAt: undefined,
      });
    }
    setSlots(updatedSlots);
    addStatusMessage('info', `Added 12 slots. Total: ${newCount}`);
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
            className={`p-3 rounded-sm flex items-center gap-2 text-[13px] font-medium border transition-colors duration-160 ${
              msg.type === 'success' ? 'bg-admin-raise border-ok/30 text-ok' :
              msg.type === 'error' ? 'bg-admin-raise border-danger/30 text-danger' :
              msg.type === 'warning' ? 'bg-admin-raise border-warn/30 text-warn' :
              'bg-admin-raise border-admin-line text-admin-text'
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
      <div className="bg-admin-surface rounded-none border border-admin-line p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text flex items-center gap-2">
              <Upload className="w-4 h-4 text-oxblood" />
              Work Gallery Manager
            </h2>
            <p className="text-[13px] text-admin-dim mt-2">Upload photos with automatic CMS persistence</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 bg-oxblood hover:bg-oxblood/90 text-white border border-oxblood rounded-none text-[11px] px-3 py-2 transition-colors duration-160 disabled:opacity-50"
            >
              <Upload className="w-3 h-3" />
              Upload Photos
            </Button>
            <div className="text-right">
              <p className="text-2xl font-bold text-oxblood">{filledSlots}</p>
              <p className="text-[11px] text-admin-faint font-medium">/ {slotCount} slots</p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-40 rounded-none border-2 border-dashed transition-colors ${
            dragOverRef.current ? 'border-solid border-oxblood bg-admin-raise' : 'border-admin-line bg-admin-raise'
          } flex items-center justify-center cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Upload className="w-8 h-8 text-oxblood mx-auto mb-2" />
            <p className="text-[13px] font-medium text-admin-text">Drop photos here, or click to browse</p>
            <p className="text-[11px] text-admin-dim mt-1">PNG, JPG, GIF up to 10MB</p>
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
              <p className="text-[13px] font-medium text-admin-text">
                {selectedFiles.length} file(s) selected
              </p>
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-[11px] text-danger hover:text-danger/80 font-medium transition-colors duration-160"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative rounded-none overflow-hidden border border-admin-line bg-admin-raise"
                >
                  <div className="w-full h-20 bg-admin-raise flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-admin-faint" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[11px] p-1">
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
          className="w-full bg-oxblood hover:bg-oxblood/90 text-white disabled:opacity-50 rounded-none transition-colors duration-160"
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

      {/* Slots Grid */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
            Gallery Grid ({filledSlots}/{slotCount})
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 bg-oxblood hover:bg-oxblood/90 text-white border border-oxblood rounded-none text-[11px] px-3 py-2 transition-colors duration-160 disabled:opacity-50"
            >
              <Upload className="w-3 h-3" />
              Upload Photo
            </Button>
            <Button
              onClick={handleAddSlots}
              className="flex items-center gap-2 bg-admin-raise hover:bg-admin-line text-admin-text border border-admin-line rounded-none text-[11px] px-3 py-2 transition-colors duration-160"
            >
              <Plus className="w-3 h-3" />
              Add 12 Slots
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : (
          /* Grid - RENDERS ALL SLOTS */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))',
            gap: '8px',
            width: '100%',
          }}>
          {slots.map((slot, index) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.01, 0.3) }}
              className={`relative rounded-none overflow-hidden border transition-all aspect-[4/5] ${
                slot.image
                  ? 'border-admin-line bg-admin-raise hover:border-oxblood/50 group'
                  : 'border border-admin-line bg-admin-raise'
              }`}
            >
              {/* Slot Number Badge */}
              <div className="absolute top-2 left-2 z-10 text-[10px] font-heading text-admin-faint tabular-nums">
                {slot.slotNumber}
              </div>

              {/* Metadata Info Button */}
              <button
                onClick={() => setShowMetadata(showMetadata === slot.slotNumber ? null : slot.slotNumber)}
                className="absolute top-2 right-2 z-10 p-1 bg-white/10 border border-white/15 text-admin-text rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160"
                title="View metadata"
              >
                <Info className="w-3 h-3" />
              </button>

              {slot.image ? (
                <>
                  {/* Image */}
                  <div className="relative w-full h-full overflow-hidden bg-admin-raise">
                    <img
                      src={slot.image}
                      alt={slot.caption || 'Gallery photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-160">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: slot.image!, slotNumber: slot.slotNumber })}
                        className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160"
                        title="Preview"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(slot.image, '_blank')}
                        className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160"
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
                          className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160 disabled:opacity-50"
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
                        className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160 disabled:opacity-50"
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
                        className="p-1 bg-white/10 border border-white/15 text-white rounded-none hover:bg-white/20 hover:border-white/30 transition-colors duration-160"
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
                  <div className="w-full h-full bg-admin-raise flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-admin-faint" />
                  </div>
                </>
              )}

              {/* Metadata Panel */}
              {showMetadata === slot.slotNumber && slot.image && (
                <div className="absolute inset-0 z-20 bg-admin-bg/95 text-admin-text p-2 text-[11px] overflow-auto flex flex-col justify-between border border-admin-line">
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
                    className="mt-2 w-full bg-oxblood hover:bg-oxblood/90 text-white px-2 py-1 rounded-none text-[11px] font-medium flex items-center justify-center gap-1 transition-colors duration-160"
                  >
                    <Copy className="w-3 h-3" />
                    Copy All
                  </button>
                </div>
              )}
            </motion.div>
          ))}</div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl max-h-[90vh] bg-admin-bg rounded-none overflow-hidden border border-admin-line"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-oxblood text-white rounded-none hover:bg-oxblood/90 transition-colors duration-160"
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
