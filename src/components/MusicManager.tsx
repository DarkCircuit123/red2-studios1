import { useState, useRef, useEffect } from 'react';
import { Upload, X, Music, Loader, FileAudio } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { uploadMedia } from '@/lib/direct-media-upload';
import { MUSIC_UPLOAD_CONFIG, validateFileAgainstConfig } from '@/lib/upload-config';

interface MusicManagerProps {
  label: string;
  currentMusicUrl?: string;
  collectionId: string;
  itemId?: string;
  fieldName: string;
  onMusicUpload: (url: string) => void;
  onMusicDelete: () => void;
}

interface StoredMusic {
  _id: string;
  musicUrl?: string;
  musicTitle?: string;
}

export default function MusicManager({
  label,
  currentMusicUrl,
  collectionId,
  itemId,
  fieldName,
  onMusicUpload,
  onMusicDelete,
}: MusicManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [storedMusic, setStoredMusic] = useState<StoredMusic[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStoredMusic = async () => {
    setIsLoadingLibrary(true);
    try {
      const result = await BaseCrudService.getAll<StoredMusic>('musicsettings', {}, { limit: 100 });
      if (result?.items) {
        const musicItems = result.items.filter(item => item.musicUrl);
        setStoredMusic(musicItems);
      }
    } catch (err) {
      console.error('Failed to load stored music:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    if (showMediaLibrary) {
      loadStoredMusic();
    }
  }, [showMediaLibrary]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFileAgainstConfig(file, MUSIC_UPLOAD_CONFIG);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Shared upload engine: uploads directly from the browser to Wix
      // Media Manager (our backend only issues a signed URL, never
      // touches the file bytes), with an automatic fallback to the old
      // proxy-through-backend route if the direct path is ever blocked
      // at the network level. See src/lib/direct-media-upload.ts.
      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);
      const musicUrl = result.mediaUrl;

      if (itemId) {
        await BaseCrudService.update(collectionId, {
          _id: itemId,
          [fieldName]: musicUrl,
        });
      }

      onMusicUpload(musicUrl);
      setError(null);
      setShowMediaLibrary(false);
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : err instanceof Error
            ? err.message
            : 'Failed to upload music';
      setError(errorMessage);
      console.error('Music upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectFromLibrary = async (musicUrl: string) => {
    if (!itemId) return;

    try {
      await BaseCrudService.update(collectionId, {
        _id: itemId,
        [fieldName]: musicUrl,
      });
      onMusicUpload(musicUrl);
      setShowMediaLibrary(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select music';
      setError(errorMessage);
      console.error('Music selection error:', err);
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
      <div className="flex items-center gap-2 flex-wrap">
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

        <button
          onClick={() => setShowMediaLibrary(!showMediaLibrary)}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-xs font-heading font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileAudio className="w-3 h-3" />
          {showMediaLibrary ? 'Hide' : 'Select from Media'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {showMediaLibrary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-heading font-bold text-blue-900 uppercase tracking-wide">
              Select from Media Library
            </h4>
            {isLoadingLibrary && <Loader className="w-3 h-3 animate-spin text-blue-600" />}
          </div>

          {isLoadingLibrary ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs text-blue-600 ml-2">Loading media library...</span>
            </div>
          ) : storedMusic.length === 0 ? (
            <div className="bg-white rounded p-3 border border-blue-100">
              <p className="text-xs text-blue-600/70">
                No music files found in media library. Upload a new file first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {storedMusic.map((music) => (
                <button
                  key={music._id}
                  onClick={() => handleSelectFromLibrary(music.musicUrl!)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    currentMusicUrl === music.musicUrl
                      ? 'bg-blue-200 border-blue-400'
                      : 'bg-white border-blue-100 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Music className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-900 truncate">
                        {music.musicTitle || 'Untitled Music'}
                      </p>
                      <p className="text-xs text-blue-600/60 truncate">
                        {music.musicUrl?.split('/').pop() || 'Music File'}
                      </p>
                    </div>
                    {currentMusicUrl === music.musicUrl && (
                      <span className="text-xs font-bold text-blue-600 flex-shrink-0">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
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
        Supported formats: MP3, WAV, OGG, WebM (Max {MUSIC_UPLOAD_CONFIG.maxSizeLabel})
      </p>
    </div>
  );
}
