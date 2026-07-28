import { useState, useRef } from 'react';
import { Upload, X, Music, Loader } from 'lucide-react';
import { BaseCrudService } from '@/integrations';

interface MusicUploadManagerProps {
  label: string;
  currentMusicUrl?: string;
  collectionId: string;
  itemId?: string;
  fieldName: string;
  onMusicUpload: (url: string) => void;
  onMusicDelete: () => void;
}

export default function MusicUploadManager({
  label,
  currentMusicUrl,
  collectionId,
  itemId,
  fieldName,
  onMusicUpload,
  onMusicDelete,
}: MusicUploadManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[MUSIC_UPLOAD_UI] File selected: ${file.name}, Size: ${fileSizeMB}MB, Type: ${file.type}`);

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = `Invalid file type: ${file.type}. Please upload a valid audio file (MP3, WAV, OGG, or WebM)`;
      console.error(`[MUSIC_UPLOAD_UI] ${errorMsg}`);
      setError(errorMsg);
      return;
    }

    // Validate file size (max 50MB - reasonable limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File size exceeds 50MB limit. Your file is ${fileSizeMB}MB. Please compress or use a smaller file.`;
      console.error(`[MUSIC_UPLOAD_UI] ${errorMsg}`);
      setError(errorMsg);
      return;
    }

    console.log(`[MUSIC_UPLOAD_UI] File validation passed, starting upload...`);
    setIsUploading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      console.log(`[MUSIC_UPLOAD_UI] Sending to /api/upload-music...`);
      const uploadStart = Date.now();

      // Upload to API endpoint
      const response = await fetch('/api/upload-music', {
        method: 'POST',
        body: formData,
      });

      const uploadTime = Date.now() - uploadStart;
      console.log(`[MUSIC_UPLOAD_UI] Response received in ${uploadTime}ms, status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Upload failed with status ${response.status}`;
        console.error(`[MUSIC_UPLOAD_UI] Upload error:`, errorData);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const musicUrl = data.url;

      console.log(`[MUSIC_UPLOAD_UI] Upload successful, URL length: ${musicUrl.length} chars`);
      if (data.debug) {
        console.log(`[MUSIC_UPLOAD_UI] Debug info:`, data.debug);
      }

      // Update CMS with the new music URL
      if (itemId && collectionId && fieldName) {
        try {
          console.log(`[MUSIC_UPLOAD_UI] Updating CMS: ${collectionId}/${itemId}/${fieldName}`);
          await BaseCrudService.update(collectionId, {
            _id: itemId,
            [fieldName]: musicUrl,
          });
          console.log(`[MUSIC_UPLOAD_UI] CMS update successful`);
        } catch (cmsError) {
          console.warn('[MUSIC_UPLOAD_UI] CMS update failed, but file was uploaded:', cmsError);
          // Still call the callback even if CMS update fails
        }
      }

      onMusicUpload(musicUrl);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload music';
      setError(errorMessage);
      console.error('[MUSIC_UPLOAD_UI] Music upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!itemId) return;

    try {
      await BaseCrudService.update(collectionId, {
        _id: itemId,
        [fieldName]: undefined,
      });
      onMusicDelete();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete music';
      setError(errorMessage);
      console.error('Music delete error:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded text-xs font-heading font-bold uppercase tracking-wide hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader className="w-3 h-3 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" />
              {label}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {currentMusicUrl && (
        <div className="bg-black/5 border border-black/10 rounded p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Music className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-black/60 mb-1">Current Music:</p>
              <a
                href={currentMusicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 break-all underline"
              >
                {currentMusicUrl.split('/').pop() || 'Music File'}
              </a>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-xs text-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        </div>
      )}

      <p className="text-xs text-black/50">
        Supported formats: MP3, WAV, OGG, WebM (Max 50MB)
      </p>
    </div>
  );
}
