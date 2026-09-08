import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Music, Upload, Trash2, Play, Pause, Zap, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MusicSettings } from '@/entities';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';

interface StatusMessage { id: string; type: 'info' | 'success' | 'error'; message: string; }

function jsonOptions(body: Record<string, unknown>): RequestInit {
  return { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) };
}

export default function MusicLibraryManager() {
  const [tracks, setTracks] = useState<MusicSettings[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addStatusMessage = (type: StatusMessage['type'], message: string) => {
    const id = crypto.randomUUID();
    setStatusMessages((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => setStatusMessages((prev) => prev.filter((item) => item.id !== id)), 5000);
  };

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/music', { credentials: 'include', headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load music library');
      setTracks(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error('[MusicLibraryManager] Load failed:', error instanceof Error ? error.message : String(error));
      addStatusMessage('error', 'Failed to load music tracks');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void loadTracks(); return () => { audioRef.current?.pause(); }; }, []);

  const handleMusicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isUploading) return;
    try {
      setIsUploading(true);
      addStatusMessage('info', 'Uploading music file...');
      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);
      const response = await fetch('/api/admin/music', jsonOptions({
        action: 'create',
        track: {
          musicTitle: file.name.replace(/\.[^/.]+$/, ''),
          musicUrl: result.mediaUrl,
          artist: 'Unknown', album: 'Music Library', genre: 'General', duration: '0:00',
          isEnabled: false, isDefaultHomepageTrack: false, loopMusic: true, volume: 50,
        },
      }));
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not save track');
      setTracks((prev) => [...prev, data.item]);
      addStatusMessage('success', 'Track added to library');
    } catch (error) {
      console.error('[MusicLibraryManager] Upload failed:', error instanceof Error ? error.message : String(error));
      addStatusMessage('error', error instanceof Error ? error.message : 'Failed to upload track');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetActive = async (trackId: string) => {
    try {
      const response = await fetch('/api/admin/music', jsonOptions({ action: 'set-active', trackId }));
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to set active track');
      setTracks((prev) => prev.map((track) => ({ ...track, isEnabled: track._id === trackId, isDefaultHomepageTrack: track._id === trackId })));
      addStatusMessage('success', 'Active track updated');
    } catch (error) { addStatusMessage('error', error instanceof Error ? error.message : 'Failed to set active track'); }
  };

  const handlePlayPause = (track: MusicSettings) => {
    if (!track.musicUrl || !audioRef.current) return;
    if (playingTrackId === track._id) { audioRef.current.pause(); setPlayingTrackId(null); return; }
    audioRef.current.src = track.musicUrl;
    void audioRef.current.play().then(() => setPlayingTrackId(track._id || null)).catch(() => addStatusMessage('error', 'Failed to play track'));
  };

  const handleDeleteTrack = async (trackId?: string) => {
    if (!trackId || !window.confirm('Delete this track?')) return;
    try {
      const response = await fetch('/api/admin/music', jsonOptions({ action: 'delete', trackId }));
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete track');
      setTracks((prev) => prev.filter((track) => track._id !== trackId));
      if (playingTrackId === trackId) { audioRef.current?.pause(); setPlayingTrackId(null); }
      addStatusMessage('success', 'Track deleted');
    } catch (error) { addStatusMessage('error', error instanceof Error ? error.message : 'Failed to delete track'); }
  };

  const activeTrack = tracks.find((track) => track.isDefaultHomepageTrack);

  return (
    <div className="space-y-6">
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {statusMessages.map((msg) => <motion.div key={msg.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-sm flex items-center gap-2 text-[13px] font-medium border bg-admin-raise border-admin-line text-admin-text">
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}{msg.message}
        </motion.div>)}
      </div>

      <div className="bg-admin-surface border border-admin-line p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text flex items-center gap-2"><Music className="w-4 h-4 text-oxblood" />Music Library</h2><p className="text-[13px] text-admin-dim mt-2">Manage background music tracks</p></div>
          <div className="text-right"><p className="text-2xl font-bold text-oxblood">{tracks.length}</p><p className="text-[11px] text-admin-faint">tracks</p></div>
        </div>
        <div className="border border-admin-line bg-admin-raise p-4 rounded-none">
          <label className="flex items-center justify-center gap-2 cursor-pointer"><input ref={fileInputRef} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm" onChange={handleMusicUpload} disabled={isUploading} className="hidden" /><Upload className="w-4 h-4 text-oxblood" /><span className="text-[13px] font-medium text-admin-text">{isUploading ? 'Uploading...' : 'Click to upload music file'}</span></label>
        </div>
      </div>

      {activeTrack && <div className="bg-admin-raise border border-oxblood/30 p-4"><p className="text-[11px] text-admin-faint uppercase tracking-[0.1em] mb-2">Active Track</p><div className="flex items-center justify-between"><div><p className="font-heading text-[13px] text-admin-text">{activeTrack.musicTitle}</p><p className="text-[11px] text-admin-dim">{activeTrack.artist || 'Unknown Artist'}</p></div><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-oxblood" /><span className="text-[11px] text-oxblood font-medium">ACTIVE</span></div></div></div>}

      <div className="bg-admin-surface border border-admin-line p-6">
        <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text mb-4">All Tracks</h3>
        {isLoading ? <div className="flex justify-center py-8"><LoadingSpinner className="w-6 h-6" /></div> : tracks.length === 0 ? <p className="text-[13px] text-admin-dim text-center py-8">No tracks yet. Upload one to get started.</p> : <div className="space-y-2">{tracks.map((track) => <motion.div key={track._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-3 border bg-admin-raise border-admin-line">
          <div className="flex-1 min-w-0"><p className="font-heading text-[13px] text-admin-text truncate">{track.musicTitle}</p><p className="text-[11px] text-admin-dim truncate">{track.artist || 'Unknown'} • {track.album || 'Library'}</p></div>
          <div className="flex items-center gap-2 ml-4"><button onClick={() => handlePlayPause(track)} className="p-2 bg-admin-line text-admin-text" title={playingTrackId === track._id ? 'Pause' : 'Play'}>{playingTrackId === track._id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button><button onClick={() => void handleSetActive(track._id || '')} className={`p-2 ${track.isDefaultHomepageTrack ? 'bg-oxblood text-white' : 'bg-admin-line text-admin-text'}`} title="Set as active"><Zap className="w-4 h-4" /></button><button onClick={() => void handleDeleteTrack(track._id)} className="p-2 bg-admin-line text-admin-text" title="Delete"><Trash2 className="w-4 h-4" /></button></div>
        </motion.div>)}</div>}
      </div>
      <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} onError={() => { addStatusMessage('error', 'Playback error'); setPlayingTrackId(null); }} />
    </div>
  );
}
