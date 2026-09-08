import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Music, Upload, Trash2, Play, Pause, Zap } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { MusicSettings } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';
import { motion } from 'framer-motion';

export default function BackgroundMusicManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tracks, setTracks] = useState<MusicSettings[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
      const sortedTracks = (result.items || [])
        .sort((a, b) => {
          // Active track first
          if (a.isDefaultHomepageTrack && !b.isDefaultHomepageTrack) return -1;
          if (!a.isDefaultHomepageTrack && b.isDefaultHomepageTrack) return 1;
          // Then by creation date (newest first)
          const dateA = new Date(a._createdDate || 0).getTime();
          const dateB = new Date(b._createdDate || 0).getTime();
          return dateB - dateA;
        });
      setTracks(sortedTracks);
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

      // Upload file to Wix Media Manager
      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);

      if (!result.mediaUrl) {
        throw new Error('Upload returned empty media URL');
      }

      // Create new track entry
      const newTrack: MusicSettings = {
        _id: crypto.randomUUID(),
        musicTitle: file.name.replace(/\.[^/.]+$/, ''),
        musicUrl: result.mediaUrl,
        isEnabled: true,
        isDefaultHomepageTrack: tracks.length === 0, // First track is active by default
        loopMusic: true,
        volume: 50,
      };

      await adminCms.create('musicsettings', newTrack);
      const updatedTracks = [newTrack, ...tracks];
      setTracks(updatedTracks);

      toast({
        title: 'Success',
        description: 'Music track uploaded successfully',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload music',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActive = async (trackId: string) => {
    try {
      setIsSaving(true);

      // Deactivate all other tracks
      for (const track of tracks) {
        if (track._id !== trackId && track.isDefaultHomepageTrack) {
          await adminCms.update('musicsettings', {
            _id: track._id,
            isDefaultHomepageTrack: false,
          });
        }
      }

      // Activate selected track
      await adminCms.update('musicsettings', {
        _id: trackId,
        isDefaultHomepageTrack: true,
      });

      // Update local state
      const updatedTracks = tracks.map(t => ({
        ...t,
        isDefaultHomepageTrack: t._id === trackId,
      }));
      setTracks(updatedTracks);

      toast({
        title: 'Success',
        description: 'Active track updated',
      });
    } catch (error) {
      console.error('Error setting active track:', error);
      toast({
        title: 'Error',
        description: 'Failed to set active track',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      setIsSaving(true);
      await adminCms.delete('musicsettings', trackId);
      const updatedTracks = tracks.filter(t => t._id !== trackId);
      setTracks(updatedTracks);

      // If deleted track was active, activate the first remaining track
      if (updatedTracks.length > 0 && !updatedTracks.some(t => t.isDefaultHomepageTrack)) {
        await handleSetActive(updatedTracks[0]._id);
      }

      toast({
        title: 'Success',
        description: 'Track deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete track',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlayPause = (trackId: string, musicUrl?: string) => {
    if (!musicUrl) return;

    const audio = audioRefs.current[trackId];
    if (!audio) return;

    if (playingId === trackId) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Pause other tracks
      Object.values(audioRefs.current).forEach(a => {
        if (a) a.pause();
      });
      audio.play();
      setPlayingId(trackId);
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
      <Card className="p-6 border border-admin-line bg-admin-surface">
        <div className="space-y-4">
          <div>
            <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text flex items-center gap-2">
              <Music className="w-5 h-5 text-oxblood" />
              Add Music Track
            </h3>
            <p className="text-admin-dim text-[13px] mt-2">
              Upload MP3 or WAV files (max 50MB). Recommended: 128-320 kbps bitrate.
            </p>
          </div>

          <label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleMusicUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              asChild
              disabled={isUploading}
              className="w-full bg-oxblood hover:bg-oxblood-hi text-white font-heading text-[12px] uppercase tracking-[0.08em]"
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
                    Upload Music Track
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </Card>

      {/* Music Library */}
      <Card className="p-6 border border-admin-line bg-admin-surface">
        <div className="space-y-4">
          <div>
            <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
              Music Library ({tracks.length})
            </h3>
            <p className="text-admin-dim text-[13px] mt-2">
              Manage your background music tracks. Only one track can be active at a time.
            </p>
          </div>

          {tracks.length === 0 ? (
            <div className="w-full py-12 rounded-lg border border-dashed border-admin-line bg-admin-bg flex items-center justify-center">
              <div className="text-center">
                <Music className="w-12 h-12 text-admin-faint mx-auto mb-2" />
                <p className="text-admin-dim text-sm">No music tracks yet</p>
                <p className="text-admin-faint text-xs mt-1">Upload a track above to get started</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map((track, index) => (
                <motion.div
                  key={track._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border-admin-line bg-admin-raise hover:border-oxblood/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => togglePlayPause(track._id, track.musicUrl)}
                      disabled={!track.musicUrl}
                      className="flex-shrink-0 p-2 rounded-lg bg-admin-surface hover:bg-oxblood/20 text-oxblood disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {playingId === track._id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-[12px] uppercase tracking-[0.08em] text-admin-text truncate">
                        {track.musicTitle || 'Untitled Track'}
                      </p>
                      <p className="text-admin-faint text-[11px] mt-1 truncate">
                        {track.musicUrl ? 'Ready to play' : 'No audio file'}
                      </p>
                    </div>

                    {/* Active Badge */}
                    {track.isDefaultHomepageTrack && (
                      <div className="flex-shrink-0 px-3 py-1 rounded-full bg-oxblood/20 border border-oxblood/50">
                        <span className="text-oxblood text-[11px] font-heading uppercase tracking-[0.08em] flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Active
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {!track.isDefaultHomepageTrack && (
                        <Button
                          onClick={() => handleSetActive(track._id)}
                          disabled={isSaving}
                          className="px-3 py-1 h-auto bg-admin-raise hover:bg-oxblood/20 text-admin-text border border-admin-line hover:border-oxblood/50 text-[11px] font-heading uppercase tracking-[0.08em]"
                        >
                          Set Active
                        </Button>
                      )}
                      <button
                        onClick={() => handleDeleteTrack(track._id)}
                        disabled={isSaving}
                        className="flex-shrink-0 p-2 rounded-lg bg-admin-surface hover:bg-danger/20 text-danger disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Hidden audio element for playback */}
                  <audio
                    ref={(el) => {
                      if (el) audioRefs.current[track._id] = el;
                    }}
                    src={track.musicUrl}
                    onEnded={() => setPlayingId(null)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-admin-surface border border-admin-line">
        <p className="text-admin-dim text-[12px] leading-relaxed">
          <strong className="text-admin-text">Tip:</strong> The active track will play as background music on your homepage. You can switch between tracks at any time. Each track can have its own volume and loop settings.
        </p>
      </Card>
    </div>
  );
}
