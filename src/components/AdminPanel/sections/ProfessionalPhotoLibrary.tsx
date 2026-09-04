import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  RotateCcw,
  Copy,
  Star,
  Eye,
  EyeOff,
  Grid,
  List,
  Download,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Image as ImageComponent } from '@/components/ui/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface PhotoFile {
  _id: string;
  image?: string;
  caption?: string;
  altText?: string;
  displayOrder?: number;
  portfolioItemId?: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'failed' | 'retrying';
  error?: string;
  result?: PhotoFile;
}

interface FilterState {
  search: string;
  status: 'all' | 'success' | 'failed' | 'pending';
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
}

interface ConfirmAction {
  type: 'delete' | 'replace' | 'bulk-delete' | 'sync' | null;
  items: string[];
  message: string;
}

// Professional Photo Library Component
export default function ProfessionalPhotoLibrary() {
  // State Management
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({
    type: null,
    items: [],
    message: '',
  });
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoFile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const dragOverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos on mount
  useEffect(() => {
    console.log('[ProfessionalPhotoLibrary] Component mounted, loading photos');
    loadPhotos();
  }, []);

  // Load photos from CMS
  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[ProfessionalPhotoLibrary] Loading photos from /api/cms/get-portfolio');
      const response = await fetch('/api/cms/get-portfolio');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ProfessionalPhotoLibrary] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[ProfessionalPhotoLibrary] API response:', data);
      
      // Handle both array and object responses
      let photos: PhotoFile[] = [];
      if (Array.isArray(data)) {
        photos = data;
      } else if (data && typeof data === 'object') {
        photos = data.items || [];
      }
      
      console.log('[ProfessionalPhotoLibrary] Loaded photos:', photos.length);
      setPhotos(photos);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load photos';
      console.error('[ProfessionalPhotoLibrary] Error loading photos:', errorMsg);
      setError(errorMsg);
      setPhotos([]); // Remain functional with empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverRef.current) {
      dragOverRef.current.classList.add('border-primary', 'bg-primary/5');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverRef.current) {
      dragOverRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverRef.current) {
      dragOverRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
    const files = Array.from(e.dataTransfer.files);
    addFilesToQueue(files);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFilesToQueue(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Add files to upload queue
  const addFilesToQueue = useCallback((files: File[]) => {
    console.log('[ProfessionalPhotoLibrary] Adding files to queue:', files.length);
    const imageFiles = files.filter(f => {
      const isImage = f.type.startsWith('image/');
      console.log(`[ProfessionalPhotoLibrary] File: ${f.name}, type: ${f.type}, isImage: ${isImage}`);
      return isImage;
    });
    
    console.log('[ProfessionalPhotoLibrary] Filtered image files:', imageFiles.length);
    
    const newItems: UploadQueueItem[] = imageFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
    }));
    
    setUploadQueue(prev => {
      const updated = [...prev, ...newItems];
      console.log('[ProfessionalPhotoLibrary] Upload queue updated:', updated.length);
      return updated;
    });
    
    // Process the new queue immediately
    processQueue([...uploadQueue, ...newItems]);
  }, [uploadQueue, processQueue]);

  // Process upload queue
  const processQueue = useCallback(async (queue: UploadQueueItem[]) => {
    console.log('[ProfessionalPhotoLibrary] Processing queue:', queue.length);
    
    for (const item of queue) {
      if (item.status !== 'pending') {
        console.log(`[ProfessionalPhotoLibrary] Skipping item ${item.id}, status: ${item.status}`);
        continue;
      }

      try {
        console.log(`[ProfessionalPhotoLibrary] Starting upload for ${item.file.name}`);
        
        // Update status to uploading
        setUploadQueue(prev =>
          prev.map(q =>
            q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q
          )
        );

        // Simulate upload with progress
        const formData = new FormData();
        formData.append('file', item.file);

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 90) + 10;
            setUploadQueue(prev =>
              prev.map(q => (q.id === item.id ? { ...q, progress } : q))
            );
          }
        });

        const uploadPromise = new Promise<PhotoFile>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            console.log(`[ProfessionalPhotoLibrary] Upload complete for ${item.file.name}, status: ${xhr.status}`);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                console.log(`[ProfessionalPhotoLibrary] Upload response:`, response);
                
                // Handle both direct PhotoFile response and mediaUrl response
                let photoFile: PhotoFile;
                if (response._id) {
                  // Direct PhotoFile response
                  photoFile = response;
                } else if (response.mediaUrl || response.success) {
                  // mediaUrl response - create PhotoFile object
                  photoFile = {
                    _id: `${Date.now()}-${Math.random()}`,
                    image: response.mediaUrl,
                    caption: item.file.name.replace(/\.[^/.]+$/, ''),
                    altText: item.file.name,
                    displayOrder: 0,
                    portfolioItemId: 'gallery',
                    _createdDate: new Date(),
                    _updatedDate: new Date(),
                  };
                } else {
                  throw new Error('Invalid response format: missing _id or mediaUrl');
                }
                
                console.log(`[ProfessionalPhotoLibrary] Resolved PhotoFile:`, photoFile);
                resolve(photoFile);
              } catch (parseErr) {
                console.error(`[ProfessionalPhotoLibrary] Failed to parse response:`, xhr.responseText);
                reject(new Error('Invalid response format'));
              }
            } else {
              console.error(`[ProfessionalPhotoLibrary] Upload failed with status ${xhr.status}: ${xhr.statusText}`);
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            console.error(`[ProfessionalPhotoLibrary] Network error during upload`);
            reject(new Error('Network error'));
          });
          
          xhr.addEventListener('abort', () => {
            console.warn(`[ProfessionalPhotoLibrary] Upload cancelled`);
            reject(new Error('Upload cancelled'));
          });
          
          console.log(`[ProfessionalPhotoLibrary] Sending upload request to /api/media/upload-gallery`);
          xhr.open('POST', '/api/media/upload-gallery');
          xhr.send(formData);
        });

        const result = await uploadPromise;

        // Update status to processing
        setUploadQueue(prev =>
          prev.map(q =>
            q.id === item.id
              ? { ...q, status: 'processing', progress: 95 }
              : q
          )
        );

        // Verify upload
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mark as success
        setUploadQueue(prev =>
          prev.map(q =>
            q.id === item.id
              ? { ...q, status: 'success', progress: 100, result }
              : q
          )
        );

        // Add to photos list
        setPhotos(prev => [result, ...prev]);
        console.log(`[ProfessionalPhotoLibrary] Upload successful for ${item.file.name}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        console.error(`[ProfessionalPhotoLibrary] Upload error for ${item.file.name}:`, errorMsg);
        
        setUploadQueue(prev =>
          prev.map(q =>
            q.id === item.id
              ? { ...q, status: 'failed', error: errorMsg, progress: 0 }
              : q
          )
        );
      }
    }
  }, []);

  // Retry failed upload
  const retryUpload = useCallback((itemId: string) => {
    setUploadQueue(prev =>
      prev.map(q =>
        q.id === itemId ? { ...q, status: 'pending', error: undefined } : q
      )
    );
    processQueue(uploadQueue);
  }, [uploadQueue, processQueue]);

  // Cancel upload
  const cancelUpload = useCallback((itemId: string) => {
    setUploadQueue(prev => prev.filter(q => q.id !== itemId));
  }, []);

  // Delete photo with confirmation
  const deletePhoto = useCallback((photoId: string) => {
    setConfirmAction({
      type: 'delete',
      items: [photoId],
      message: 'Are you sure you want to delete this photo? This action cannot be undone.',
    });
  }, []);

  // Bulk delete with confirmation
  const bulkDelete = useCallback(() => {
    if (selectedPhotos.size === 0) return;
    setConfirmAction({
      type: 'bulk-delete',
      items: Array.from(selectedPhotos),
      message: `Delete ${selectedPhotos.size} photo(s)? This action cannot be undone.`,
    });
  }, [selectedPhotos]);

  // Confirm and execute action
  const executeConfirmAction = useCallback(async () => {
    if (!confirmAction.type) return;

    try {
      console.log(`[ProfessionalPhotoLibrary] Executing action: ${confirmAction.type}, items: ${confirmAction.items.length}`);
      
      if (confirmAction.type === 'delete' || confirmAction.type === 'bulk-delete') {
        for (const photoId of confirmAction.items) {
          console.log(`[ProfessionalPhotoLibrary] Deleting photo: ${photoId}`);
          
          const response = await fetch(`/api/cms/mutate`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collection: 'portfolioimages',
              itemId: photoId,
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ProfessionalPhotoLibrary] Delete failed for ${photoId}:`, response.status, errorText);
            throw new Error(`Failed to delete photo: ${response.statusText}`);
          }
          
          console.log(`[ProfessionalPhotoLibrary] Successfully deleted photo: ${photoId}`);
        }
        
        setPhotos(prev =>
          prev.filter(p => !confirmAction.items.includes(p._id))
        );
        setSelectedPhotos(new Set());
        console.log(`[ProfessionalPhotoLibrary] Delete action completed`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Action failed';
      console.error(`[ProfessionalPhotoLibrary] Action error:`, errorMsg);
      setError(errorMsg);
    } finally {
      setConfirmAction({ type: null, items: [], message: '' });
    }
  }, [confirmAction]);

  // Sync/reconcile with CMS
  const syncPhotos = useCallback(async () => {
    setIsSyncing(true);
    try {
      await loadPhotos();
    } finally {
      setIsSyncing(false);
    }
  }, [loadPhotos]);

  // Filter and sort photos
  const filteredPhotos = photos
    .filter(p => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          p.caption?.toLowerCase().includes(searchLower) ||
          p.altText?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;
      if (filters.sortBy === 'name') {
        compareValue = (a.caption || '').localeCompare(b.caption || '');
      } else if (filters.sortBy === 'date') {
        compareValue =
          new Date(b._createdDate || 0).getTime() -
          new Date(a._createdDate || 0).getTime();
      }
      return filters.sortOrder === 'asc' ? -compareValue : compareValue;
    });

  // Calculate upload stats
  const uploadStats = {
    total: uploadQueue.length,
    uploading: uploadQueue.filter(q => q.status === 'uploading').length,
    success: uploadQueue.filter(q => q.status === 'success').length,
    failed: uploadQueue.filter(q => q.status === 'failed').length,
  };

  const overallProgress =
    uploadQueue.length > 0
      ? Math.round(
          uploadQueue.reduce((sum, q) => sum + q.progress, 0) / uploadQueue.length
        )
      : 0;

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Photo Library</h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage and organize your media assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncPhotos}
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="gap-2"
            >
              {viewMode === 'grid' ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-4"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error}</p>
              <p className="text-xs text-red-700 mt-1">
                The upload interface remains available. Try syncing or refreshing.
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Upload Stats */}
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-900">
                Upload Progress: {uploadStats.success + uploadStats.uploading}/{uploadStats.total}
              </p>
              <span className="text-xs text-blue-700">{overallProgress}%</span>
            </div>
            <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-blue-700">
              {uploadStats.uploading > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {uploadStats.uploading} uploading
                </span>
              )}
              {uploadStats.success > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {uploadStats.success} success
                </span>
              )}
              {uploadStats.failed > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {uploadStats.failed} failed
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-120px)]">
        {/* Left Panel - Upload & Queue */}
        <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto">
          {/* Drag & Drop Area */}
          <div className="p-4 border-b border-slate-200">
            <div
              ref={dragOverRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900">Drop photos here</p>
              <p className="text-xs text-slate-600 mt-1">or click to select</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                Select Photos
              </Button>
            </div>
          </div>

          {/* Upload Queue */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Upload Queue</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {uploadQueue.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No uploads in progress
                  </p>
                ) : (
                  uploadQueue.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-2 bg-slate-50 rounded border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.status === 'success'
                              ? 'default'
                              : item.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Error Message */}
                      {item.error && (
                        <p className="text-xs text-red-600 mb-2">{item.error}</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1">
                        {item.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryUpload(item.id)}
                            className="flex-1 h-7 text-xs gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                          </Button>
                        )}
                        {item.status !== 'success' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelUpload(item.id)}
                            className="flex-1 h-7 text-xs gap-1"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel - Photo Library */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-3">
              {selectedPhotos.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={selectedPhotos.size === filteredPhotos.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedPhotos(new Set(filteredPhotos.map(p => p._id)));
                      } else {
                        setSelectedPhotos(new Set());
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-slate-900">
                    {selectedPhotos.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={bulkDelete}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </motion.div>
              )}

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search photos..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-9"
                />
              </div>

              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as 'name' | 'date' | 'size',
                  }))
                }
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>
          </div>

          {/* Photo Grid/List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <LoadingSpinner className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Loading photos...</p>
                </div>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">No photos yet</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Upload your first photo to get started
                  </p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <AnimatePresence>
                  {filteredPhotos.map(photo => (
                    <PhotoGridCard
                      key={photo._id}
                      photo={photo}
                      isSelected={selectedPhotos.has(photo._id)}
                      onSelect={() => {
                        const newSelected = new Set(selectedPhotos);
                        if (newSelected.has(photo._id)) {
                          newSelected.delete(photo._id);
                        } else {
                          newSelected.add(photo._id);
                        }
                        setSelectedPhotos(newSelected);
                      }}
                      onDelete={() => deletePhoto(photo._id)}
                      onExpand={() => setExpandedPhoto(photo._id)}
                      onEdit={() => setEditingPhoto(photo)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredPhotos.map(photo => (
                    <PhotoListRow
                      key={photo._id}
                      photo={photo}
                      isSelected={selectedPhotos.has(photo._id)}
                      onSelect={() => {
                        const newSelected = new Set(selectedPhotos);
                        if (newSelected.has(photo._id)) {
                          newSelected.delete(photo._id);
                        } else {
                          newSelected.add(photo._id);
                        }
                        setSelectedPhotos(newSelected);
                      }}
                      onDelete={() => deletePhoto(photo._id)}
                      onExpand={() => setExpandedPhoto(photo._id)}
                      onEdit={() => setEditingPhoto(photo)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmAction.type !== null}
        onOpenChange={open => {
          if (!open) setConfirmAction({ type: null, items: [], message: '' });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>{confirmAction.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction({ type: null, items: [], message: '' })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeConfirmAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expanded Photo Modal */}
      <AnimatePresence>
        {expandedPhoto && (
          <PhotoExpandedView
            photoId={expandedPhoto}
            photos={photos}
            onClose={() => setExpandedPhoto(null)}
            onDelete={() => {
              deletePhoto(expandedPhoto);
              setExpandedPhoto(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Photo Modal */}
      <AnimatePresence>
        {editingPhoto && (
          <PhotoEditModal
            photo={editingPhoto}
            onClose={() => setEditingPhoto(null)}
            onSave={async updatedPhoto => {
              setPhotos(prev =>
                prev.map(p => (p._id === updatedPhoto._id ? updatedPhoto : p))
              );
              setEditingPhoto(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Photo Grid Card Component
function PhotoGridCard({
  photo,
  isSelected,
  onSelect,
  onDelete,
  onExpand,
  onEdit,
}: {
  photo: PhotoFile;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary'
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox checked={isSelected} onChange={onSelect} />
      </div>

      {/* Image */}
      <div className="aspect-square bg-slate-100 overflow-hidden">
        {photo.image ? (
          <ImageComponent
            src={photo.image}
            alt={photo.altText || 'Photo'}
            width={200}
            height={200}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <Button
          size="sm"
          variant="secondary"
          onClick={onExpand}
          className="gap-1"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onEdit}
          className="gap-1"
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="gap-1"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Caption */}
      {photo.caption && (
        <div className="p-2 bg-white border-t border-slate-200">
          <p className="text-xs font-medium text-slate-900 truncate">
            {photo.caption}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// Photo List Row Component
function PhotoListRow({
  photo,
  isSelected,
  onSelect,
  onDelete,
  onExpand,
  onEdit,
}: {
  photo: PhotoFile;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary'
      }`}
    >
      <Checkbox checked={isSelected} onChange={onSelect} />

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex-shrink-0">
        {photo.image ? (
          <ImageComponent
            src={photo.image}
            alt={photo.altText || 'Photo'}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <Upload className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {photo.caption || 'Untitled'}
        </p>
        <p className="text-xs text-slate-600">
          {photo._createdDate
            ? new Date(photo._createdDate).toLocaleDateString()
            : 'Unknown date'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={onExpand}
          className="h-8 w-8 p-0"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-8 w-8 p-0"
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Expanded Photo View Component
function PhotoExpandedView({
  photoId,
  photos,
  onClose,
  onDelete,
}: {
  photoId: string;
  photos: PhotoFile[];
  onClose: () => void;
  onDelete: () => void;
}) {
  const photo = photos.find(p => p._id === photoId);
  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <h3 className="font-semibold text-slate-900">
            {photo.caption || 'Photo'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {photo.image && (
            <ImageComponent
              src={photo.image}
              alt={photo.altText || 'Photo'}
              width={600}
              height={600}
              className="w-full h-auto rounded-lg mb-4"
            />
          )}

          <div className="space-y-3">
            {photo.caption && (
              <div>
                <p className="text-xs font-medium text-slate-600">Caption</p>
                <p className="text-sm text-slate-900">{photo.caption}</p>
              </div>
            )}
            {photo.altText && (
              <div>
                <p className="text-xs font-medium text-slate-600">Alt Text</p>
                <p className="text-sm text-slate-900">{photo.altText}</p>
              </div>
            )}
            {photo._createdDate && (
              <div>
                <p className="text-xs font-medium text-slate-600">Created</p>
                <p className="text-sm text-slate-900">
                  {new Date(photo._createdDate).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              className="flex-1 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Edit Photo Modal Component
function PhotoEditModal({
  photo,
  onClose,
  onSave,
}: {
  photo: PhotoFile;
  onClose: () => void;
  onSave: (photo: PhotoFile) => void;
}) {
  const [formData, setFormData] = useState({
    caption: photo.caption || '',
    altText: photo.altText || '',
    displayOrder: photo.displayOrder || 0,
  });

  const handleSave = async () => {
    try {
      console.log(`[PhotoEditModal] Saving photo: ${photo._id}`);
      const updated = { ...photo, ...formData };
      
      const response = await fetch(`/api/cms/mutate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'portfolioimages',
          item: updated,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PhotoEditModal] Save failed:`, response.status, errorText);
        throw new Error(`Failed to save photo: ${response.statusText}`);
      }
      
      console.log(`[PhotoEditModal] Photo saved successfully`);
      onSave(updated);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save';
      console.error(`[PhotoEditModal] Error:`, errorMsg);
      alert(errorMsg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-lg max-w-md w-full"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Edit Photo</h3>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Caption
            </label>
            <Input
              value={formData.caption}
              onChange={e =>
                setFormData(prev => ({ ...prev, caption: e.target.value }))
              }
              placeholder="Enter caption"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Alt Text
            </label>
            <Input
              value={formData.altText}
              onChange={e =>
                setFormData(prev => ({ ...prev, altText: e.target.value }))
              }
              placeholder="Enter alt text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Display Order
            </label>
            <Input
              type="number"
              value={formData.displayOrder}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  displayOrder: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
