import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Music, Upload, Trash2, Volume2, RotateCw, Zap } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';

export default function BackgroundMusicManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [musicTracks, setMusicTracks] = useState<MusicSettings[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadMusicTracks();
  }, []);

  const loadMusicTracks = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
      if (result.items.length > 0) {
        setMusicTracks(result.items);
        // Select first enabled track or first track
        const enabledTrack = result.items.find(t => t.isEnabled);
        setSelectedTrackId(enabledTrack?._id || result.items[0]?._id || null);
      }
    } catch (error) {
      console.error('Error loading music tracks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load music tracks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Use unified upload service with wix-media-upload-service
      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);

      // Create new music track in musicsettings collection
      const newTrack: MusicSettings = {
        _id: crypto.randomUUID(),
        musicTitle: file.name.replace(/\.[^/.]+$/, ''),
        musicUrl: result.mediaUrl,
        artist: 'Unknown',
        album: 'Background Music',
        genre: 'Background',
        duration: '0:00',
        isEnabled: true,
        isDefaultHomepageTrack: musicTracks.length === 0, // First track is default
        volume: 30,
        loopMusic: true,
      };

      await BaseCrudService.create('musicsettings', newTrack);
      
      // Reload tracks
      await loadMusicTracks();

      toast({
        title: 'Success',
        description: 'Music file uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload music file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      setIsSaving(true);
      await BaseCrudService.delete('musicsettings', trackId);
      
      // Reload tracks
      await loadMusicTracks();

      toast({
        title: 'Success',
        description: 'Music track removed',
      });
    } catch (error) {
      console.error('Error removing track:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove music track',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTrackEnabled = async (trackId: string, currentState: boolean) => {
    try {
      setIsSaving(true);
      await BaseCrudService.update('musicsettings', {
        _id: trackId,
        isEnabled: !currentState,
      });
      
      // Reload tracks
      await loadMusicTracks();

      toast({
        title: 'Success',
        description: `Track ${!currentState ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling track:', error);
      toast({
        title: 'Error',
        description: 'Failed to update track settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLoop = async (trackId: string, currentState: boolean) => {
    try {
      setIsSaving(true);
      await BaseCrudService.update('musicsettings', {
        _id: trackId,
        loopMusic: !currentState,
      });
      
      // Reload tracks
      await loadMusicTracks();

      toast({
        title: 'Success',
        description: `Loop ${!currentState ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling loop:', error);
      toast({
        title: 'Error',
        description: 'Failed to update loop settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVolumeChange = async (trackId: string, newVolume: number) => {
    try {
      await BaseCrudService.update('musicsettings', {
        _id: trackId,
        volume: newVolume,
      });

      if (audioRef && selectedTrackId === trackId) {
        audioRef.volume = newVolume / 100;
      }
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  };

  const selectedTrack = musicTracks.find(t => t._id === selectedTrackId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-600" />
              Upload Background Music
            </h3>
            <p className="text-sm text-slate-500 mt-1">Upload an MP3 or audio file to use as background music</p>
          </div>

          {/* Upload Button */}
          <label className="block">
            <input
              type="file"
              accept="audio/*"
              onChange={handleMusicUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              asChild
              disabled={isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="cursor-pointer flex items-center justify-center gap-2">
                {isUploading ? (
                  <>
                    <LoadingSpinner />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Music File
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </Card>

      {/* Music Tracks List */}
      {musicTracks.length > 0 && (
        <Card className="p-6 border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Music Tracks</h3>

            <div className="space-y-3">
              {musicTracks.map((track) => (
                <div key={track._id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{track.musicTitle || 'Untitled'}</p>
                      <p className="text-xs text-slate-500 mt-1">{track.artist || 'Unknown Artist'}</p>
                      {track.musicUrl && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{track.musicUrl}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleRemoveTrack(track._id)}
                        disabled={isSaving}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Track Controls */}
                  <div className="mt-3 space-y-3">
                    {/* Volume Control */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-900 flex items-center gap-2">
                        <Volume2 className="w-3 h-3" />
                        Volume: {track.volume || 30}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={track.volume || 30}
                        onChange={(e) => handleVolumeChange(track._id, parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Toggle Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleToggleTrackEnabled(track._id, track.isEnabled || false)}
                        disabled={isSaving}
                        size="sm"
                        variant={track.isEnabled ? 'default' : 'outline'}
                        className={`flex items-center justify-center gap-1 text-xs ${
                          track.isEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                        }`}
                      >
                        <Music className="w-3 h-3" />
                        {track.isEnabled ? 'Enabled' : 'Disabled'}
                      </Button>

                      <Button
                        onClick={() => handleToggleLoop(track._id, track.loopMusic || false)}
                        disabled={isSaving}
                        size="sm"
                        variant={track.loopMusic ? 'default' : 'outline'}
                        className={`flex items-center justify-center gap-1 text-xs ${
                          track.loopMusic ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                        }`}
                      >
                        <RotateCw className="w-3 h-3" />
                        {track.loopMusic ? 'Loop' : 'No Loop'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Audio Preview */}
      {selectedTrack?.musicUrl && (
        <Card className="p-6 border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Preview</h3>

            {/* Audio Player */}
            <audio
              ref={setAudioRef}
              src={selectedTrack.musicUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Music plays after the first user interaction (click, touch, or key press). Enabled tracks are used by the background music player.
        </p>
      </Card>
    </div>
  );
}
