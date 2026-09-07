/**
 * Music Library Manager - Multi-row library with isActive logic
 * 
 * Features:
 * - Read/write musicsettings collection (multi-row)
 * - Support at least 10 tracks
 * - Track list with play/pause, set active, and delete
 * - isActive logic for background music
 * - Dark theme applied
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Music, Upload, Trash2, Play, Pause, Volume2, RotateCw, Zap, Check, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function MusicLibraryManager() {
  const [tracks, setTracks] = useState<MusicSettings[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
      setTracks(result.items || []);
      console.log('[MusicLibraryManager] Loaded', result.items?.length || 0, 'tracks');
    } catch (error) {
      console.error('[MusicLibraryManager] Error loading tracks:', error);
      addStatusMessage('error', 'Failed to load music tracks');
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

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      addStatusMessage('info', 'Uploading music file...');

      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);

      if (!result.mediaUrl) {
        throw new Error('Upload returned empty media URL');
      }

      // Create new track
      const newTrack: MusicSettings = {
        _id: crypto.randomUUID(),
        musicTitle: file.name.replace(/\.[^/.]+$/, ''),
        musicUrl: result.mediaUrl,
        artist: 'Unknown',
        album: 'Music Library',
        genre: 'General',
        duration: '0:00',
        isEnabled: false,
        isDefaultHomepageTrack: false,
        loopMusic: true,
        volume: 50,
      };

      // Save to CMS
      await BaseCrudService.create('musicsettings', newTrack);
      
      setTracks(prev => [...prev, newTrack]);
      addStatusMessage('success', `Track "${newTrack.musicTitle}" added to library`);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[MusicLibraryManager] Upload error:', error);
      addStatusMessage('error', `Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActive = async (trackId: string) => {
    try {
      // Disable all other tracks
      const updatedTracks = await Promise.all(
        tracks.map(async (track) => {
          if (track._id === trackId) {
            // Enable this track
            await BaseCrudService.update('musicsettings', {
              _id: track._id,
              isEnabled: true,
              isDefaultHomepageTrack: true,
            });
            return { ...track, isEnabled: true, isDefaultHomepageTrack: true };
          } else if (track.isEnabled || track.isDefaultHomepageTrack) {
            // Disable other tracks
            await BaseCrudService.update('musicsettings', {
              _id: track._id,
              isEnabled: false,
              isDefaultHomepageTrack: false,
            });
            return { ...track, isEnabled: false, isDefaultHomepageTrack: false };
          }
          return track;
        })
      );
      
      setTracks(updatedTracks);
      addStatusMessage('success', 'Active track updated');
    } catch (error) {
      console.error('[MusicLibraryManager] Error setting active track:', error);
      addStatusMessage('error', 'Failed to set active track');
    }
  };

  const handlePlayPause = (track: MusicSettings) => {
    if (playingTrackId === track._id) {
      setPlayingTrackId(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setPlayingTrackId(track._id);
      if (audioRef.current && track.musicUrl) {
        audioRef.current.src = track.musicUrl;
        audioRef.current.play().catch(err => {
          console.error('[MusicLibraryManager] Playback error:', err);
          addStatusMessage('error', 'Failed to play track');
        });
      }
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Delete this track?')) return;

    try {
      await BaseCrudService.delete('musicsettings', trackId);
      setTracks(prev => prev.filter(t => t._id !== trackId));
      if (playingTrackId === trackId) {
        setPlayingTrackId(null);
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
      addStatusMessage('success', 'Track deleted');
    } catch (error) {
      console.error('[MusicLibraryManager] Delete error:', error);
      addStatusMessage('error', 'Failed to delete track');
    }
  };

  const handleUpdateTrack = async (trackId: string, updates: Partial<MusicSettings>) => {
    try {
      await BaseCrudService.update('musicsettings', {
        _id: trackId,
        ...updates,
      });
      
      setTracks(prev => prev.map(t => 
        t._id === trackId ? { ...t, ...updates } : t
      ));
      addStatusMessage('success', 'Track updated');
    } catch (error) {
      console.error('[MusicLibraryManager] Update error:', error);
      addStatusMessage('error', 'Failed to update track');
    }
  };

  const activeTrack = tracks.find(t => t.isDefaultHomepageTrack);

  return (
    <div className="space-y-6">
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
            {msg.type === 'success' && <Check className="w-4 h-4" />}
            {msg.type === 'error' && <X className="w-4 h-4" />}
            {msg.message}
          </motion.div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text flex items-center gap-2">
              <Music className="w-4 h-4 text-oxblood" />
              Music Library
            </h2>
            <p className="text-[13px] text-admin-dim mt-2">Manage background music tracks</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-oxblood">{tracks.length}</p>
            <p className="text-[11px] text-admin-faint font-medium">tracks</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="border border-admin-line bg-admin-raise p-4 rounded-none">
          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleMusicUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Upload className="w-4 h-4 text-oxblood" />
            <span className="text-[13px] font-medium text-admin-text">
              {isUploading ? 'Uploading...' : 'Click to upload music file'}
            </span>
          </label>
        </div>

        {tracks.length >= 10 && (
          <p className="text-[11px] text-admin-faint">
            Library full (10 tracks). Delete a track to add more.
          </p>
        )}
      </div>

      {/* Active Track */}
      {activeTrack && (
        <div className="bg-admin-raise rounded-none border border-oxblood/30 p-4">
          <p className="text-[11px] text-admin-faint uppercase tracking-[0.1em] mb-2">Active Track</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-[13px] text-admin-text">{activeTrack.musicTitle}</p>
              <p className="text-[11px] text-admin-dim">{activeTrack.artist || 'Unknown Artist'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-oxblood" />
              <span className="text-[11px] text-oxblood font-medium">ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text mb-4">
          All Tracks
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : tracks.length === 0 ? (
          <p className="text-[13px] text-admin-dim text-center py-8">No tracks yet. Upload one to get started.</p>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <motion.div
                key={track._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-3 rounded-none border transition-colors duration-160 ${
                  track.isDefaultHomepageTrack
                    ? 'bg-admin-raise border-oxblood/30'
                    : 'bg-admin-raise border-admin-line hover:border-admin-line/60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[13px] text-admin-text truncate">
                    {track.musicTitle}
                  </p>
                  <p className="text-[11px] text-admin-dim truncate">
                    {track.artist || 'Unknown'} • {track.album || 'Library'}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Play/Pause */}
                  <button
                    onClick={() => handlePlayPause(track)}
                    className="p-2 bg-admin-line hover:bg-admin-line/60 text-admin-text rounded-none transition-colors duration-160"
                    title={playingTrackId === track._id ? 'Pause' : 'Play'}
                  >
                    {playingTrackId === track._id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>

                  {/* Set Active */}
                  <button
                    onClick={() => handleSetActive(track._id)}
                    className={`p-2 rounded-none transition-colors duration-160 ${
                      track.isDefaultHomepageTrack
                        ? 'bg-oxblood text-white'
                        : 'bg-admin-line hover:bg-admin-line/60 text-admin-text'
                    }`}
                    title="Set as active"
                  >
                    <Zap className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteTrack(track._id)}
                    className="p-2 bg-admin-line hover:bg-danger/20 text-admin-text hover:text-danger rounded-none transition-colors duration-160"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingTrackId(null)}
        onError={() => {
          addStatusMessage('error', 'Playback error');
          setPlayingTrackId(null);
        }}
      />
    </div>
  );
}
