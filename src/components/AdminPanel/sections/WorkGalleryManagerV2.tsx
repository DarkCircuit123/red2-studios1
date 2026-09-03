import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, Trash2, Eye, X, RefreshCw, Maximize2, Image as ImageIcon, Zap, AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { motion, AnimatePresence } from 'framer-motion';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import { compressImages, formatBytes } from '@/lib/image-compression';
import { MultiThreadedUploader, UploadProgress } from '@/lib/multi-threaded-upload';
import { savePortfolioImage, cleanupOrphanedPortfolioImages } from '@/lib/portfolio-image-save-handler';
import { runFullImageRecovery, scanPortfolioImages } from '@/lib/portfolio-image-recovery';

/**
 * Sanitize filename for Wix Media API
 * CRITICAL: Wix API is extremely strict about filenames
 * - Must use lowercase extension (.jpg, not .JPG)
 * - Must not have hidden characters or BOM
 * - Must not have multiple dots
 * - Must not have special characters
 */
function sanitizeFilename(filename: string): string {
  // Remove BOM and hidden characters
  let cleaned = filename.replace(/^\uFEFF/, '').trim();
  
  // Extract extension and convert to lowercase
  const lastDotIndex = cleaned.lastIndexOf('.');
  let ext = lastDotIndex > 0 ? cleaned.substring(lastDotIndex).toLowerCase() : '.jpg';
  const nameWithoutExt = lastDotIndex > 0 ? cleaned.substring(0, lastDotIndex) : cleaned;
  
  // Ensure extension is strictly lowercase
  if (ext === '.jpeg') ext = '.jpg';
  if (!ext.match(/^\.(jpg|jpeg|png|webp|gif)$/i)) {
    ext = '.jpg';
  }
  
  // Sanitize name part
  let sanitized = nameWithoutExt
    .replace(/[()[\]{}]/g, '_')      // Replace brackets/parens
    .replace(/\s+/g, '_')             // Replace spaces
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // Replace special chars
    .replace(/_+/g, '_')               // Collapse multiple underscores
    .replace(/^_+|_+$/g, '');          // Remove leading/trailing underscores
  
  if (!sanitized) {
    sanitized = `image_${Date.now()}`;
  }
  
  // Ensure lowercase extension
  const finalExt = ext.toLowerCase();
  return sanitized + finalExt;
}

/**
 * STRICT MIME TYPE MAP - No concatenation, no guessing
 * Maps file extensions to valid MIME types
 */
const MIME_TYPE_MAP: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'gif': 'image/gif',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  'heic': 'image/heic',
};

/**
 * Detect MIME type from file
 * CRITICAL: Prefer browser-provided File.type, fall back to extension map
 */
function detectMimeType(file: File): { mimeType: string; source: 'browser' | 'extension-map' } {
  // FIRST: Try browser-provided type
  if (file.type && file.type.trim() !== '') {
    return { mimeType: file.type, source: 'browser' };
  }

  // FALLBACK: Use extension map
  const lastDotIndex = file.name.lastIndexOf('.');
  if (lastDotIndex > 0) {
    const ext = file.name.substring(lastDotIndex + 1).toLowerCase();
    const mappedType = MIME_TYPE_MAP[ext];
    if (mappedType) {
      return { mimeType: mappedType, source: 'extension-map' };
    }
  }

  // REJECT: Unknown extension
  throw new Error(`Unsupported file extension. Allowed: ${Object.keys(MIME_TYPE_MAP).join(', ')}`);
}

/**
 * Ensure filename has correct extension for MIME type
 */
function ensureCorrectExtension(filename: string, mimeType: string): string {
  const lower = filename.toLowerCase();
  
  if (mimeType === 'image/jpeg' && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg')) {
    return filename.replace(/\.[^/.]+$/, '') + '.jpg';
  }
  if (mimeType === 'image/png' && !lower.endsWith('.png')) {
    return filename.replace(/\.[^/.]+$/, '') + '.png';
  }
  if (mimeType === 'image/webp' && !lower.endsWith('.webp')) {
    return filename.replace(/\.[^/.]+$/, '') + '.webp';
  }
  if (mimeType === 'image/gif' && !lower.endsWith('.gif')) {
    return filename.replace(/\.[^/.]+$/, '') + '.gif';
  }
  if (mimeType === 'image/tiff' && !lower.endsWith('.tif') && !lower.endsWith('.tiff')) {
    return filename.replace(/\.[^/.]+$/, '') + '.tif';
  }
  if (mimeType === 'image/heic' && !lower.endsWith('.heic')) {
    return filename.replace(/\.[^/.]+$/, '') + '.heic';
  }
  
  return filename;
}

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

interface PreviewState {
  photoId: string | null;
  imageUrl: string | null;
}

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
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

const MAX_SLOTS = 90;
const MAX_CONCURRENT = 3;

export default function WorkGalleryManagerV2() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<UploadFileItem[]>([]);
  const [fullImagePreview, setFullImagePreview] = useState<PreviewState>({
    photoId: null,
    imageUrl: null,
  });
  const [isReplacing, setIsReplacing] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploaderStats, setUploaderStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    uploading: 0,
    pending: 0,
    overallProgress: 0,
  });
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);
  const uploaderRef = useRef<MultiThreadedUploader | null>(null);

  // Load existing photos
  useEffect(() => {
    loadPhotos();
  }, []);

  const addStatusMessage = (type: StatusMessage['type'], message: string, duration = 5000) => {
    const id = crypto.randomUUID();
    setStatusMessages(prev => [...prev, { type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setStatusMessages(prev => prev.filter(m => m.message !== message));
      }, duration);
    }
  };

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<GalleryPhoto>(
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
      // Initialize uploader
      uploaderRef.current = new MultiThreadedUploader({
        maxConcurrent: MAX_CONCURRENT,
        uploadFn: async (file: File, onProgress: (percent: number) => void) => {
          // CRITICAL: Detect MIME type with strict mapping (prefer browser type, fall back to extension map)
          let mimeTypeInfo;
          try {
            mimeTypeInfo = detectMimeType(file);
          } catch (typeError) {
            const errorMsg = typeError instanceof Error ? typeError.message : String(typeError);
            throw new Error(`File type validation failed: ${errorMsg}`);
          }

          const { mimeType, source } = mimeTypeInfo;

          // Ensure filename has correct extension matching MIME type
          let finalFilename = ensureCorrectExtension(file.name, mimeType);
          
          // Sanitize the filename (CRITICAL: removes hidden chars, ensures lowercase ext)
          finalFilename = sanitizeFilename(finalFilename);
          
          // CRITICAL: Re-create File object with strict MIME type and sanitized name
          const blob = new Blob([file], { type: mimeType });
          const finalFileToUpload = new File([blob], finalFilename, { 
            type: mimeType, 
            lastModified: Date.now() 
          });

          console.log(`[UPLOAD_CRITICAL] File: ${file.name} -> ${finalFilename}, MIME: ${mimeType} (${source}), Size: ${finalFileToUpload.size}`);

          const formDataForUpload = new FormData();
          formDataForUpload.append('file', finalFileToUpload, finalFileToUpload.name);

          const uploadResponse = await fetch('/api/media/upload-hero', {
            method: 'POST',
            body: formDataForUpload,
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
          
          // Update stats
          const uploader = uploaderRef.current;
          if (uploader) {
            setUploaderStats(uploader.getStats());
          }
        },
        onComplete: async (taskId: string, imageUrl: string) => {
          const fileItem = selectedFiles.find(f => f.id === taskId);
          if (!fileItem) return;

          // CRITICAL: Update file item to show CMS save is starting
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
            // ATOMIC: Save to CMS with upload-first flow
            const saveResult = await savePortfolioImage(imageUrl, {
              displayOrder: photos.length + 1,
              caption: fileItem.original.name.replace(/\.[^/.]+$/, ''),
              altText: fileItem.original.name.replace(/\.[^/.]+$/, ''),
              portfolioItemId: crypto.randomUUID(), // Link to parent work item
            });

            // Mark as successfully saved
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

            console.log(`[UPLOAD_COMPLETE] File ${fileItem.original.name} saved to CMS:`, saveResult);
          } catch (saveError) {
            const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);

            // Mark as failed
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

            console.error(`[UPLOAD_COMPLETE] CMS save failed for ${fileItem.original.name}:`, errorMsg);
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

      // Wait for all uploads to complete
       const checkComplete = setInterval(() => {
         const stats = uploaderRef.current?.getStats();
         if (stats && stats.uploading === 0 && stats.pending === 0) {
           clearInterval(checkComplete);
           
           // Reload photos
           loadPhotos();
           
           // Show results
           const failedCount = stats.failed;
           const successCount = stats.completed;
           
           if (successCount > 0 && failedCount === 0) {
             addStatusMessage('success', `✓ Successfully uploaded and saved ${successCount} photo${successCount !== 1 ? 's' : ''}`);
           } else if (successCount > 0 && failedCount > 0) {
             addStatusMessage('warning', `✓ Uploaded ${successCount} photo${successCount !== 1 ? 's' : ''} • ✗ Failed: ${failedCount}`);
           } else if (failedCount > 0) {
             addStatusMessage('error', `✗ Failed to upload ${failedCount} photo${failedCount !== 1 ? 's' : ''}`);
           }
           
           // Reset
           setSelectedFiles([]);
           if (fileInputRef.current) {
             fileInputRef.current.value = '';
           }
           uploaderRef.current = null;
         }
       }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error uploading photos:', error);
      addStatusMessage('error', `Upload error: ${errorMsg}`);
    }
  };

  const handleCleanupOrphans = async () => {
    if (!confirm('This will delete all portfolio images with empty image fields. Continue?')) {
      return;
    }

    try {
      setIsCleaningUp(true);
      addStatusMessage('info', 'Cleaning up orphaned rows...');

      const result = await cleanupOrphanedPortfolioImages();

      if (result.deleted > 0) {
        addStatusMessage('success', `Deleted ${result.deleted} orphaned row${result.deleted !== 1 ? 's' : ''}`);
      } else {
        addStatusMessage('info', 'No orphaned rows found');
      }

      if (result.errors.length > 0) {
        addStatusMessage('warning', `${result.errors.length} error${result.errors.length !== 1 ? 's' : ''} during cleanup`);
        result.errors.forEach(err => console.warn(err));
      }

      // Reload photos
      await loadPhotos();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Cleanup error:', error);
      addStatusMessage('error', `Cleanup failed: ${errorMsg}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleReplacePhoto = async (photoId: string, file: File) => {
    try {
      setReplacingId(photoId);
      setIsReplacing(true);
      addStatusMessage('info', `Uploading replacement for ${file.name}...`);

      const compressionResults = await compressImages([file]);
      let fileToUpload = compressionResults.length > 0 ? compressionResults[0].file : file;

      // CRITICAL: Detect MIME type with strict mapping (prefer browser type, fall back to extension map)
      let mimeType = 'image/jpeg';
      try {
        const mimeTypeInfo = detectMimeType(fileToUpload);
        mimeType = mimeTypeInfo.mimeType;
      } catch (typeError) {
        console.warn('MIME type detection failed, defaulting to image/jpeg:', typeError);
      }

      // Ensure filename has correct extension
      let finalFilename = ensureCorrectExtension(fileToUpload.name, mimeType);
      finalFilename = sanitizeFilename(finalFilename);

      // CRITICAL: Re-create File with forced MIME type
      const blob = new Blob([fileToUpload], { type: mimeType });
      const finalFileToUpload = new File([blob], finalFilename, { 
        type: mimeType, 
        lastModified: Date.now() 
      });

      const formDataForUpload = new FormData();
      formDataForUpload.append('file', finalFileToUpload, finalFileToUpload.name);

      const uploadResponse = await fetch('/api/media/upload-hero', {
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

      // ATOMIC: Save to CMS with upload-first flow
      const photoToUpdate = photos.find(p => p._id === photoId);
      if (photoToUpdate) {
        const saveResult = await savePortfolioImage(imageUrl, {
          displayOrder: photoToUpdate.displayOrder || 0,
          caption: photoToUpdate.title || '',
          altText: photoToUpdate.title || '',
          portfolioItemId: photoToUpdate.portfolioItemId,
        }, photoId);

        setPhotos(photos.map(p => p._id === photoId ? { ...p, image: imageUrl } : p));
        addStatusMessage('success', `Photo replaced successfully`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Replace error:', error);
      addStatusMessage('error', `Failed to replace photo: ${errorMsg}`);
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
      addStatusMessage('success', 'Photo deleted successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error deleting photo:', error);
      addStatusMessage('error', `Failed to delete photo: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveSelected = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const canUpload = photos.length < MAX_SLOTS;
  const slotsRemaining = MAX_SLOTS - photos.length;
  const isUploading = uploaderStats.uploading > 0 || uploaderStats.pending > 0;

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => {
    return photos[i] || null;
  });

  return (
    <div className="w-full space-y-8">
      {/* Status Messages */}
      <AnimatePresence>
        {statusMessages.map((msg, idx) => (
          <motion.div
            key={idx}
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
            {msg.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {msg.type === 'info' && <LoadingSpinner className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{msg.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Recovery & Cleanup Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image Recovery Button */}
        <Card className="p-4 border border-purple-200 bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-purple-900">Recover Existing Photos</p>
              <p className="text-xs text-purple-700 mt-1">Find, fix links, and validate all uploaded images</p>
            </div>
            <Button
              onClick={async () => {
                try {
                  setIsRecovering(true);
                  addStatusMessage('info', 'Starting image recovery...');
                  const result = await runFullImageRecovery();
                  addStatusMessage('success', result.summary);
                  await loadPhotos();
                } catch (error) {
                  const errorMsg = error instanceof Error ? error.message : String(error);
                  addStatusMessage('error', `Recovery failed: ${errorMsg}`);
                } finally {
                  setIsRecovering(false);
                }
              }}
              disabled={isRecovering}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
            >
              {isRecovering ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Recovering...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Recover
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Cleanup Button */}
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-900">Cleanup Orphaned Rows</p>
              <p className="text-xs text-amber-700 mt-1">Delete portfolio images with empty image fields</p>
            </div>
            <Button
              onClick={handleCleanupOrphans}
              disabled={isCleaningUp}
              className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
            >
              {isCleaningUp ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Batch Upload Section */}
      <Card className="w-full p-6 border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-full space-y-4">
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Multi-Threaded Upload
              </h3>
              <p className="text-sm text-slate-600 mt-1">Upload multiple photos with {MAX_CONCURRENT} concurrent threads</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-blue-600">{photos.length}</p>
              <p className="text-xs text-blue-600 font-medium">/ {MAX_SLOTS} slots</p>
            </div>
          </div>

          {/* Upload Progress Stats */}
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

          {/* Upload Area */}
          {canUpload && !isUploading && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full h-48 rounded-lg border-2 border-dashed transition-colors ${
                dragOverRef.current ? 'border-blue-500 bg-blue-100' : 'border-blue-300 bg-blue-50'
              } flex items-center justify-center cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-900">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-600 mt-2">PNG, JPG, GIF up to 10MB • {slotsRemaining} slots remaining</p>
              </div>
            </div>
          )}

          {!canUpload && (
            <div className="w-full p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-900">All {MAX_SLOTS} slots are full. Delete some photos to upload more.</p>
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
                      className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
                    >
                      <div className="w-full h-20 bg-slate-100 flex items-center justify-center flex-col relative">
                        {fileItem.isCompressing ? (
                          <LoadingSpinner className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                        
                        {/* Upload Progress Bar */}
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
                      
                      {fileItem.uploadStatus !== 'uploading' && (
                        <button
                          onClick={() => handleRemoveSelected(fileItem.id)}
                          disabled={isUploading}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      
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
                        {fileItem.uploadStatus === 'uploading' && (
                          <div className="text-xs opacity-80">{fileItem.uploadProgress}%</div>
                        )}
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
                  <Zap className="w-4 h-4 mr-2" />
                  Start Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Slots Grid - 90 Slots in Compact 9-Column Layout */}
      <Card className="w-full p-6 border border-slate-200">
        <div className="w-full flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Work Gallery Slots ({photos.length}/{MAX_SLOTS})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {slotsRemaining} empty slots • Compact 9-column layout for all 90 slots
            </p>
          </div>
          {photos.length >= MAX_SLOTS && (
            <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex-shrink-0">
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
            {slots.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.01, 0.3) }}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  photo
                    ? 'border-slate-200 bg-slate-50 hover:border-blue-400 group shadow-sm'
                    : 'border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 hover:border-slate-400'
                }`}
              >
                {/* Slot Number Badge */}
                <div className="absolute top-0.5 left-0.5 z-20 bg-slate-900/80 text-white px-1 py-0.5 rounded text-xs font-bold leading-none">
                  {index + 1}
                </div>

                {photo && photo.image ? (
                  <>
                    {/* Image Preview */}
                    <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={convertWixImageToHttps(photo.image) || photo.image}
                        alt={photo.title || `Gallery photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          console.warn('Failed to load image:', photo.image);
                          (e.target as HTMLImageElement).src = '';
                        }}
                      />
                      
                      {/* Hover Overlay with Actions */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            const imageUrl = convertWixImageToHttps(photo.image) || photo.image;
                            setFullImagePreview({ photoId: photo._id, imageUrl });
                          }}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0"
                          title="Preview full image"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(convertWixImageToHttps(photo.image) || photo.image, '_blank')}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex-shrink-0"
                          title="View full image in new tab"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <label className="cursor-pointer flex-shrink-0">
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
                            type="button"
                            onClick={(e) => {
                              e.currentTarget.parentElement?.querySelector('input')?.click();
                            }}
                            disabled={replacingId === photo._id}
                            className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
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
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-shrink-0"
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
                      <ImageIcon className="w-5 h-5 text-slate-300" />
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
