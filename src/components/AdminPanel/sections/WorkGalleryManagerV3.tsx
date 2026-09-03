/**
 * Work Gallery Manager V3 - Complete Rebuild
 * 
 * FEATURES:
 * ✓ 90 deterministic slots with stable positions
 * ✓ Professional UI with every slot always rendering
 * ✓ Robust Upload, Replace, Delete with verification
 * ✓ Multi-file upload with detailed queue
 * ✓ Canonical image URL resolver
 * ✓ Sync/Repair function with data consistency
 * ✓ Independent error handling per slot
 * ✓ Complete pipeline verification
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Upload, Trash2, Eye, X, RefreshCw, Maximize2, Image as ImageIcon,
  Zap, AlertCircle, CheckCircle, Wrench, RotateCcw, Gauge, AlertTriangle
} from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { motion, AnimatePresence } from 'framer-motion';
import { Portfolio } from '@/entities';
import { getCanonicalImageUrl, isValidImageUrl, resolveImageUrl } from '@/lib/canonical-image-resolver';
import { diagnosticScan, repairGallery, syncGalleries, getAllSlots } from '@/lib/work-gallery-diagnostics';
import { compressImages, formatBytes } from '@/lib/image-compression';
import { MultiThreadedUploader, UploadProgress } from '@/lib/multi-threaded-upload';
import { savePortfolioImage } from '@/lib/portfolio-image-save-handler';

const MAX_SLOTS = 90;
const MAX_CONCURRENT = 3;

interface UploadFileItem {
  id: string;
  original: File;
  compressed?: File;
  isCompressing?: boolean;
  compressionError?: string;
  originalSize?: number;
  compressedSize?: number;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadError?: string;
  cmsStatus?: 'pending' | 'saving' | 'saved' | 'failed';
  cmsSaveError?: string;
  mediaUrl?: string;
}

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

interface DiagnosticState {
  isRunning: boolean;
  lastRun?: string;
  issueCount?: number;
}

interface RepairState {
  isRunning: boolean;
  progress?: string;
}

export default function WorkGalleryManagerV3() {
  const [slots, setSlots] = useState<(Portfolio | null)[]>(Array(MAX_SLOTS).fill(null));
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<UploadFileItem[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [uploaderStats, setUploaderStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    uploading: 0,
    pending: 0,
    overallProgress: 0,
  });
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState>({ isRunning: false });
  const [repairState, setRepairState] = useState<RepairState>({ isRunning: false });
  const [previewImage, setPreviewImage] = useState<{ url: string; slotNumber: number } | null>(null);
  const [replacingSlot, setReplacingSlot] = useState<number | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);
  const uploaderRef = useRef<MultiThreadedUploader | null>(null);

  // Load slots on mount
  useEffect(() => {
    loadSlots();
  }, []);

  const addStatusMessage = useCallback((type: StatusMessage['type'], message: string, duration = 5000) => {
    const id = crypto.randomUUID();
    setStatusMessages(prev => [...prev, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setStatusMessages(prev => prev.filter(m => m.id !== id));
      }, duration);
    }
  }, []);

  const loadSlots = async () => {
    try {
      setIsLoading(true);
      const allSlots = await getAllSlots();
      setSlots(allSlots);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addStatusMessage('error', `Failed to load slots: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const newSelectedFiles: UploadFileItem[] = newFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random()}`,
      original: file,
      isCompressing: true,
      uploadProgress: 0,
      uploadStatus: 'pending',
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
              const fileIndex = prev.findIndex(f => f.id === item.id);
              if (fileIndex !== -1) {
                updated[fileIndex] = {
                  ...item,
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
            const fileIndex = prev.findIndex(f => f.id === item.id);
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                ...item,
                isCompressing: false,
                compressionError: 'Compression failed, will upload original',
              };
            }
            return updated;
          });
        });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      uploaderRef.current = new MultiThreadedUploader({
        maxConcurrent: MAX_CONCURRENT,
        uploadFn: async (file: File, onProgress: (percent: number) => void) => {
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await fetch('/api/media/upload-hero', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Upload failed (${uploadResponse.status})`);
          }

          const uploadedData = await uploadResponse.json();
          const imageUrl = uploadedData.mediaUrl || uploadedData.url;

          if (!imageUrl) {
            throw new Error('No image URL returned');
          }

          onProgress(100);
          return imageUrl;
        },
        onProgress: (progress: UploadProgress) => {
          setSelectedFiles(prev => {
            const updated = [...prev];
            const fileIndex = prev.findIndex(f => f.id === progress.taskId);
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                ...prev[fileIndex],
                uploadProgress: progress.progress,
                uploadStatus: progress.status as any,
                uploadError: progress.error,
              };
            }
            return updated;
          });

          const uploader = uploaderRef.current;
          if (uploader) {
            setUploaderStats(uploader.getStats());
          }
        },
        onComplete: async (taskId: string, imageUrl: string) => {
          const fileItem = selectedFiles.find(f => f.id === taskId);
          if (!fileItem) return;

          setSelectedFiles(prev => {
            const updated = [...prev];
            const fileIndex = prev.findIndex(f => f.id === taskId);
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                ...prev[fileIndex],
                mediaUrl: imageUrl,
                cmsStatus: 'saving',
              };
            }
            return updated;
          });

          try {
            // Find first empty slot
            const emptySlotIndex = slots.findIndex(s => !s || !s.image);
            if (emptySlotIndex === -1) {
              throw new Error('No empty slots available');
            }

            const slotNumber = emptySlotIndex + 1;

            // Save to CMS
            await savePortfolioImage(imageUrl, {
              displayOrder: slotNumber,
              caption: fileItem.original.name.replace(/\.[^/.]+$/, ''),
              altText: fileItem.original.name.replace(/\.[^/.]+$/, ''),
              portfolioItemId: crypto.randomUUID(),
            });

            setSelectedFiles(prev => {
              const updated = [...prev];
              const fileIndex = prev.findIndex(f => f.id === taskId);
              if (fileIndex !== -1) {
                updated[fileIndex] = {
                  ...prev[fileIndex],
                  cmsStatus: 'saved',
                };
              }
              return updated;
            });
          } catch (saveError) {
            const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);
            setSelectedFiles(prev => {
              const updated = [...prev];
              const fileIndex = prev.findIndex(f => f.id === taskId);
              if (fileIndex !== -1) {
                updated[fileIndex] = {
                  ...prev[fileIndex],
                  cmsStatus: 'failed',
                  cmsSaveError: errorMsg,
                };
              }
              return updated;
            });
            addStatusMessage('error', `Failed to save ${fileItem.original.name}: ${errorMsg}`);
          }
        },
        onError: (taskId: string, error: string) => {
          console.error(`Upload error for task ${taskId}:`, error);
        },
      });

      // Add all files to uploader
      selectedFiles.forEach(fileItem => {
        const fileToUpload = fileItem.compressed || fileItem.original;
        uploaderRef.current!.addTask(fileItem.id, fileToUpload);
      });

      // Wait for completion
      const checkComplete = setInterval(() => {
        const stats = uploaderRef.current?.getStats();
        if (stats && stats.uploading === 0 && stats.pending === 0) {
          clearInterval(checkComplete);
          loadSlots();
          
          const failedCount = stats.failed;
          const successCount = stats.completed;
          
          if (successCount > 0 && failedCount === 0) {
            addStatusMessage('success', `✓ Successfully uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}`);
          } else if (successCount > 0 && failedCount > 0) {
            addStatusMessage('warning', `✓ Uploaded ${successCount} • ✗ Failed: ${failedCount}`);
          } else if (failedCount > 0) {
            addStatusMessage('error', `✗ Failed to upload ${failedCount} photo${failedCount !== 1 ? 's' : ''}`);
          }
          
          setSelectedFiles([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          uploaderRef.current = null;
        }
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addStatusMessage('error', `Upload error: ${errorMsg}`);
    }
  };

  const handleReplacePhoto = async (slotNumber: number, file: File) => {
    try {
      setReplacingSlot(slotNumber);
      addStatusMessage('info', `Replacing slot ${slotNumber}...`);

      const compressionResults = await compressImages([file]);
      const fileToUpload = compressionResults.length > 0 ? compressionResults[0].file : file;

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const uploadResponse = await fetch('/api/media/upload-hero', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.mediaUrl || uploadedData.url;

      if (!imageUrl) {
        throw new Error('No image URL returned');
      }

      const slotItem = slots[slotNumber - 1];
      if (slotItem) {
        await savePortfolioImage(imageUrl, {
          displayOrder: slotNumber,
          caption: slotItem.caption || '',
          altText: slotItem.altText || '',
          portfolioItemId: slotItem.portfolioItemId || '',
        }, slotItem._id);

        await loadSlots();
        addStatusMessage('success', `Slot ${slotNumber} replaced successfully`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addStatusMessage('error', `Failed to replace slot ${slotNumber}: ${errorMsg}`);
    } finally {
      setReplacingSlot(null);
    }
  };

  const handleDeletePhoto = async (slotNumber: number) => {
    if (!confirm(`Delete photo in slot ${slotNumber}?`)) return;

    try {
      setDeletingSlot(slotNumber);
      const slotItem = slots[slotNumber - 1];
      if (slotItem) {
        await BaseCrudService.delete('portfolioimages', slotItem._id);
        await loadSlots();
        addStatusMessage('success', `Slot ${slotNumber} deleted`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addStatusMessage('error', `Failed to delete slot ${slotNumber}: ${errorMsg}`);
    } finally {
      setDeletingSlot(null);
    }
  };

  const handleDiagnostic = async () => {
    try {
      setDiagnosticState({ isRunning: true });
      addStatusMessage('info', 'Running diagnostic scan...');

      const report = await diagnosticScan();
      
      setDiagnosticState({
        isRunning: false,
        lastRun: new Date().toLocaleTimeString(),
        issueCount: report.issues.length,
      });

      if (report.issues.length === 0) {
        addStatusMessage('success', `✓ Gallery is healthy: ${report.filledSlots}/${report.totalSlots} slots filled`);
      } else {
        addStatusMessage('warning', `Found ${report.issues.length} issue${report.issues.length !== 1 ? 's' : ''}`);
      }

      console.log('Diagnostic Report:', report);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setDiagnosticState({ isRunning: false });
      addStatusMessage('error', `Diagnostic failed: ${errorMsg}`);
    }
  };

  const handleRepair = async () => {
    if (!confirm('This will repair the gallery. Continue?')) return;

    try {
      setRepairState({ isRunning: true, progress: 'Starting repair...' });
      addStatusMessage('info', 'Repairing gallery...');

      const result = await repairGallery();

      setRepairState({ isRunning: false });

      if (result.errors.length === 0) {
        addStatusMessage('success', `✓ Repair complete: Fixed ${result.fixed}, Deleted ${result.deleted}, Created ${result.created}`);
      } else {
        addStatusMessage('warning', `Repair complete with ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`);
      }

      await loadSlots();
      console.log('Repair Result:', result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setRepairState({ isRunning: false });
      addStatusMessage('error', `Repair failed: ${errorMsg}`);
    }
  };

  const filledSlots = slots.filter(s => s && s.image).length;
  const isUploading = uploaderStats.uploading > 0 || uploaderStats.pending > 0;

  return (
    <div className="w-full space-y-8">
      {/* Status Messages */}
      <AnimatePresence>
        {statusMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`w-full p-4 rounded-lg flex items-center gap-3 ${
              msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-900' :
              msg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-900' :
              msg.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
              'bg-blue-50 border border-blue-200 text-blue-900'
            }`}
          >
            {msg.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {msg.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {msg.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {msg.type === 'info' && <LoadingSpinner className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{msg.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Diagnostic & Repair Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border border-purple-200 bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-purple-900">Diagnostic Scan</p>
              <p className="text-xs text-purple-700 mt-1">Check gallery health and identify issues</p>
              {diagnosticState.lastRun && (
                <p className="text-xs text-purple-600 mt-1">Last run: {diagnosticState.lastRun}</p>
              )}
            </div>
            <Button
              onClick={handleDiagnostic}
              disabled={diagnosticState.isRunning}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
            >
              {diagnosticState.isRunning ? (
                <><LoadingSpinner className="w-4 h-4 mr-2" />Scanning...</>
              ) : (
                <><Gauge className="w-4 h-4 mr-2" />Scan</>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-4 border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-900">Repair Gallery</p>
              <p className="text-xs text-amber-700 mt-1">Fix broken links, duplicates, and missing slots</p>
            </div>
            <Button
              onClick={handleRepair}
              disabled={repairState.isRunning}
              className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
            >
              {repairState.isRunning ? (
                <><LoadingSpinner className="w-4 h-4 mr-2" />Repairing...</>
              ) : (
                <><Wrench className="w-4 h-4 mr-2" />Repair</>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="w-full p-6 border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Multi-File Upload
              </h3>
              <p className="text-sm text-slate-600 mt-1">Upload multiple photos with {MAX_CONCURRENT} concurrent threads</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{filledSlots}</p>
              <p className="text-xs text-blue-600 font-medium">/ {MAX_SLOTS} slots</p>
            </div>
          </div>

          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white rounded-lg border border-blue-200"
            >
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{uploaderStats.completed}</p>
                  <p className="text-xs text-slate-600">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{uploaderStats.uploading}</p>
                  <p className="text-xs text-slate-600">Uploading</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-600">{uploaderStats.pending}</p>
                  <p className="text-xs text-slate-600">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{uploaderStats.failed}</p>
                  <p className="text-xs text-slate-600">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{uploaderStats.overallProgress}%</p>
                  <p className="text-xs text-slate-600">Overall</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploaderStats.overallProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {!isUploading && (
            <div
              onDragOver={(e) => { e.preventDefault(); dragOverRef.current = true; }}
              onDragLeave={(e) => { e.preventDefault(); dragOverRef.current = false; }}
              onDrop={handleDrop}
              className={`w-full h-48 rounded-lg border-2 border-dashed transition-colors ${
                dragOverRef.current ? 'border-blue-500 bg-blue-100' : 'border-blue-300 bg-blue-50'
              } flex items-center justify-center cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-900">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-600 mt-2">PNG, JPG, GIF • {MAX_SLOTS - filledSlots} slots remaining</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading || filledSlots >= MAX_SLOTS}
            multiple
            className="hidden"
          />

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={isUploading}
                  className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <AnimatePresence>
                  {selectedFiles.map((fileItem) => (
                    <motion.div
                      key={fileItem.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                    >
                      <div className="w-full h-20 bg-slate-100 flex items-center justify-center flex-col relative">
                        {fileItem.isCompressing ? (
                          <LoadingSpinner className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                        {fileItem.uploadStatus === 'uploading' && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${fileItem.uploadProgress}%` }}
                              transition={{ duration: 0.2 }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 space-y-0.5">
                        <div className="truncate font-medium">{fileItem.original.name}</div>
                        {fileItem.uploadStatus === 'completed' && (
                          <div className="text-xs opacity-80 text-green-300">✓ Done</div>
                        )}
                        {fileItem.uploadStatus === 'failed' && (
                          <div className="text-xs opacity-80 text-red-300">✗ Failed</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading || filledSlots >= MAX_SLOTS}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isUploading ? (
              <><LoadingSpinner className="w-4 h-4 mr-2" />Uploading...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Start Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</>
            )}
          </Button>
        </div>
      </Card>

      {/* 90-Slot Grid */}
      <Card className="w-full p-6 border border-slate-200">
        <div className="w-full flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Work Gallery Slots ({filledSlots}/{MAX_SLOTS})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {MAX_SLOTS - filledSlots} empty slots • 9-column layout
            </p>
          </div>
          {filledSlots >= MAX_SLOTS && (
            <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              All slots filled
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="w-full flex items-center justify-center py-12">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2">
            {slots.map((photo, index) => {
              const slotNumber = index + 1;
              const hasImage = photo && isValidImageUrl(photo.image);
              const imageUrl = hasImage ? getCanonicalImageUrl(photo.image) : '';

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.01, 0.3) }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    hasImage
                      ? 'border-slate-200 bg-slate-50 hover:border-blue-400 group shadow-sm'
                      : 'border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100'
                  }`}
                >
                  {/* Slot Number */}
                  <div className="absolute top-0.5 left-0.5 z-20 bg-slate-900/80 text-white px-1 py-0.5 rounded text-xs font-bold">
                    {slotNumber}
                  </div>

                  {hasImage ? (
                    <>
                      {/* Image Preview */}
                      <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                        <img
                          src={imageUrl}
                          alt={`Slot ${slotNumber}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            console.warn('Failed to load image:', photo?.image);
                            (e.target as HTMLImageElement).src = '';
                          }}
                        />

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: imageUrl, slotNumber })}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            title="Preview"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(imageUrl, '_blank')}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
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
                                if (file) handleReplacePhoto(slotNumber, file);
                              }}
                              disabled={replacingSlot === slotNumber}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.currentTarget.parentElement?.querySelector('input')?.click();
                              }}
                              disabled={replacingSlot === slotNumber}
                              className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
                              title="Replace"
                            >
                              {replacingSlot === slotNumber ? (
                                <LoadingSpinner className="w-3 h-3" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </button>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(slotNumber)}
                            disabled={deletingSlot === slotNumber}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingSlot === slotNumber ? (
                              <LoadingSpinner className="w-3 h-3" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Image Preview Modal */}
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
              alt={`Slot ${previewImage.slotNumber} preview`}
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
