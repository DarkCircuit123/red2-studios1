import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Trash2, Edit3, Loader, Search, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { validateCMSUpdatePayload } from '@/lib/image-storage-validator';

interface ImageUploadManagerProps {
  onImageUpload: (imageUrl: string) => void;
  onImageDelete?: () => void;
  currentImage?: string;
  label?: string;
  collectionId?: string;
  itemId?: string;
  fieldName?: string;
  acceptedFormats?: string[];
}

interface MediaFile {
  id: string;
  displayName: string;
  url: string;
  thumbnailUrl: string;
  sizeInBytes: number;
}

export default function ImageUploadManager({
  onImageUpload,
  onImageDelete,
  currentImage,
  label = 'Select Image',
  collectionId,
  itemId,
  fieldName,
}: ImageUploadManagerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Load media files when picker opens
  useEffect(() => {
    if (isPickerOpen && mediaFiles.length === 0) {
      loadMediaFiles();
    }
  }, [isPickerOpen]);

  const loadMediaFiles = async (cursor?: string) => {
    setIsLoadingMedia(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/media/list?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media files');

      const data = await response.json();
      if (cursor) {
        // Append to existing files for "load more"
        setMediaFiles((prev) => [...prev, ...data.items]);
      } else {
        // Replace files for new search
        setMediaFiles(data.items);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading media files:', error);
      setErrorMessage('Failed to load media files from Media Manager');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleSearch = async () => {
    setMediaFiles([]);
    setNextCursor(null);
    await loadMediaFiles();
  };

  const handleSelectFile = async (file: MediaFile) => {
    try {
      // Save to CMS if collection info provided
      if (collectionId && itemId && fieldName) {
        const updatePayload = {
          _id: itemId,
          [fieldName]: file.url,
        };
        validateCMSUpdatePayload(collectionId, updatePayload);
        await BaseCrudService.update(collectionId, updatePayload);
      }

      onImageUpload(file.url);
      setIsPickerOpen(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error selecting image:', error);
      setErrorMessage('Failed to save image. Please try again.');
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImage) return;

    setIsDeleting(true);
    try {
      // If collection info provided, delete from CMS
      if (collectionId && itemId && fieldName) {
        await BaseCrudService.update(collectionId, {
          _id: itemId,
          [fieldName]: null,
        });
      }

      // Call the callback to update parent state
      if (onImageDelete) {
        onImageDelete();
      }

      setDeleteStatus('success');
      setTimeout(() => setDeleteStatus('idle'), 2000);
    } catch (error) {
      console.error('Error deleting image:', error);
      setErrorMessage('Failed to delete image. Please try again.');
      setDeleteStatus('error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Current Image Display */}
      {currentImage ? (
        <motion.div className="bg-white/5 border border-white/20 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-white/60 mb-2">{label}</p>
              <Image src={currentImage} alt="Current" className="w-24 h-24 object-cover rounded" />
            </div>
            <div className="flex gap-2 flex-col">
              <button
                onClick={() => setIsPickerOpen(true)}
                disabled={isLoadingMedia}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-xs text-blue-400 transition-all duration-200 flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
              >
                <Edit3 className="w-3 h-3" />
                Replace
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded text-xs text-red-400 transition-all duration-200 flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
              >
                <Trash2 className="w-3 h-3" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          {deleteStatus === 'success' && (
            <p className="text-xs text-green-400">Image deleted successfully</p>
          )}
          {deleteStatus === 'error' && (
            <p className="text-xs text-red-400">Failed to delete image</p>
          )}
        </motion.div>
      ) : (
        <button
          onClick={() => setIsPickerOpen(true)}
          disabled={isLoadingMedia}
          className="w-full border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg p-8 text-center transition-all duration-200 disabled:opacity-50 bg-white/5 hover:bg-white/10"
        >
          <div className="flex flex-col items-center gap-2">
            <Edit3 className="w-6 h-6 text-white/40" />
            <p className="text-sm text-white/60">{label}</p>
            <p className="text-xs text-white/40">Click to select from Media Manager</p>
          </div>
        </button>
      )}

      {/* Media Picker Modal */}
      {isPickerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsPickerOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-black/90 border border-white/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Select Image from Media Manager</h2>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-all"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-white/10 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="Search images..."
                  className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoadingMedia}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-sm text-blue-400 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              <p className="text-xs text-white/40">
                Or{' '}
                <a
                  href="https://manage.wix.com/dashboard/3e83fde1-087e-4b66-b0cf-76bdb8b35929/media"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  add new photos in Media Manager
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingMedia && mediaFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2">
                    <Loader className="w-6 h-6 text-white/40 animate-spin" />
                    <p className="text-sm text-white/60">Loading media...</p>
                  </div>
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-white/60">No images found in Media Manager</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {mediaFiles.map((file) => (
                    <motion.button
                      key={file.id}
                      onClick={() => handleSelectFile(file)}
                      whileHover={{ scale: 1.05 }}
                      className="relative group rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all"
                    >
                      <Image
                        src={file.thumbnailUrl}
                        alt={file.displayName}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-400 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white/80 truncate">
                        {file.displayName}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => loadMediaFiles(nextCursor || undefined)}
                  disabled={isLoadingMedia}
                  className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-sm text-white/60 hover:text-white/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoadingMedia ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
        >
          <p className="text-xs text-red-500">{errorMessage}</p>
        </motion.div>
      )}
    </div>
  );
}
