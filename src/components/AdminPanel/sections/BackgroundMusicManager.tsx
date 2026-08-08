import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Music, Upload, Trash2, Volume2, RotateCw, Star } from 'lucide-react';
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
  const [tracks, setTracks] = useState<MusicSettings[]>([]);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
      setTracks(result.items || []);
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

      // Create new music track in musicsettings
      const newTrack: MusicSettings = {
        _id: crypto.randomUUID(),
        musicUrl: result.mediaUrl,
        musicTitle: file.name.replace(/\.[^/.]+$/, ''),
        isEnabled: true,
        volume: 50,
        loopMusic: true,
        isDefaultHomepageTrack: false,
      };

      await BaseCrudService.create('musicsettings', newTrack);
      await loadTracks();

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
      await loadTracks();

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

  const handleToggleEnabled = async (track: MusicSettings) => {
    try {
      setIsSaving(true);
      await BaseCrudService.update('musicsettings', {
        _id: track._id,
        isEnabled: !track.isEnabled,
      });
      await loadTracks();

      toast({
        title: 'Success',
        description: `Track ${!track.isEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling track:', error);
      toast({
        title: 'Error',
        description: 'Failed to update track',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLoop = async (track: MusicSettings) => {
    try {
      setIsSaving(true);
      await BaseCrudService.update('musicsettings', {
        _id: track._id,
        loopMusic: !track.loopMusic,
      });
      await loadTracks();

      toast({
        title: 'Success',
        description: `Loop ${!track.loopMusic ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling loop:', error);
      toast({
        title: 'Error',
        description: 'Failed to update track',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetAsDefault = async (track: MusicSettings) => {
    try {
      setIsSaving(true);
      
      // Set all tracks to false first
      for (const t of tracks) {
        if (t._id !== track._id && t.isDefaultHomepageTrack) {
          await BaseCrudService.update('musicsettings', {
            _id: t._id,
            isDefaultHomepageTrack: false,
          });
        }
      }

      // Set this track as default
      await BaseCrudService.update('musicsettings', {
        _id: track._id,
        isDefaultHomepageTrack: true,
      });

      await loadTracks();

      toast({
        title: 'Success',
        description: 'Default track updated',
      });
    } catch (error) {
      console.error('Error setting default track:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default track',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVolumeChange = async (track: MusicSettings, newVolume: number) => {
    try {
      await BaseCrudService.update('musicsettings', {
        _id: track._id,
        volume: newVolume,
      });
      await loadTracks();
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  };

  const handleFieldChange = async (track: MusicSettings, field: keyof MusicSettings, value: any) => {
    try {
      await BaseCrudService.update('musicsettings', {
        _id: track._id,
        [field]: value,
      });
      await loadTracks();
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: 'Error',
        description: 'Failed to update track',
        variant: 'destructive',
      });
    }
  };

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
      {tracks.length > 0 ? (
        <Card className="p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Music Tracks</h3>
          <div className="space-y-4">
            {tracks.map((track) => (
              <div key={track._id} className="p-4 border border-slate-200 rounded-lg space-y-3">
                {/* Track Title */}
                <div>
                  <label className="text-sm font-medium text-slate-900">Title</label>
                  <Input
                    value={track.musicTitle || ''}
                    onChange={(e) => handleFieldChange(track, 'musicTitle', e.target.value)}
                    placeholder="Track title"
                    className="mt-1"
                  />
                </div>

                {/* Track Artist */}
                <div>
                  <label className="text-sm font-medium text-slate-900">Artist</label>
                  <Input
                    value={track.artist || ''}
                    onChange={(e) => handleFieldChange(track, 'artist', e.target.value)}
                    placeholder="Artist name"
                    className="mt-1"
                  />
                </div>

                {/* Track Album */}
                <div>
                  <label className="text-sm font-medium text-slate-900">Album</label>
                  <Input
                    value={track.album || ''}
                    onChange={(e) => handleFieldChange(track, 'album', e.target.value)}
                    placeholder="Album name"
                    className="mt-1"
                  />
                </div>

                {/* Track Genre */}
                <div>
                  <label className="text-sm font-medium text-slate-900">Genre</label>
                  <Input
                    value={track.genre || ''}
                    onChange={(e) => handleFieldChange(track, 'genre', e.target.value)}
                    placeholder="Genre"
                    className="mt-1"
                  />
                </div>

                {/* Track Duration */}
                <div>
                  <label className="text-sm font-medium text-slate-900">Duration</label>
                  <Input
                    value={track.duration || ''}
                    onChange={(e) => handleFieldChange(track, 'duration', e.target.value)}
                    placeholder="Duration (e.g., 3:45)"
                    className="mt-1"
                  />
                </div>

                {/* Music URL */}
                <div>
                  <label className="text-sm font-medium text-slate-900">Music URL</label>
                  <Input
                    value={track.musicUrl || ''}
                    readOnly
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Volume Control */}
                <div>
                  <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Volume: {track.volume || 50}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={track.volume || 50}
                    onChange={(e) => handleVolumeChange(track, parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1"
                  />
                </div>

                {/* Control Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    onClick={() => handleToggleEnabled(track)}
                    disabled={isSaving}
                    variant={track.isEnabled ? 'default' : 'outline'}
                    className={`text-xs ${
                      track.isEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                    }`}
                  >
                    <Music className="w-3 h-3 mr-1" />
                    {track.isEnabled ? 'Enabled' : 'Disabled'}
                  </Button>

                  <Button
                    onClick={() => handleToggleLoop(track)}
                    disabled={isSaving}
                    variant={track.loopMusic ? 'default' : 'outline'}
                    className={`text-xs ${
                      track.loopMusic ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                    }`}
                  >
                    <RotateCw className="w-3 h-3 mr-1" />
                    {track.loopMusic ? 'Loop' : 'No Loop'}
                  </Button>

                  <Button
                    onClick={() => handleSetAsDefault(track)}
                    disabled={isSaving}
                    variant={track.isDefaultHomepageTrack ? 'default' : 'outline'}
                    className={`text-xs ${
                      track.isDefaultHomepageTrack ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''
                    }`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {track.isDefaultHomepageTrack ? 'Default' : 'Set Default'}
                  </Button>

                  <Button
                    onClick={() => handleRemoveTrack(track._id)}
                    disabled={isSaving}
                    variant="outline"
                    className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6 border border-slate-200 text-center">
          <p className="text-slate-600">No music tracks uploaded yet. Upload one to get started.</p>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> The track marked as "Default" will play on the homepage. Autoplay may be blocked by browsers; users may need to interact with the page first.
        </p>
      </Card>
    </div>
  );
}
