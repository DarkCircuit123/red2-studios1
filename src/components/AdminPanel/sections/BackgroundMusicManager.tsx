import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Music, Upload, Trash2, Play, Pause, Volume2, RotateCw, Zap } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { HomePageSettings } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';

export default function BackgroundMusicManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<HomePageSettings | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<HomePageSettings>('homepagesettings', {}, { limit: 1 });
      if (result.items.length > 0) {
        setSettings(result.items[0]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    try {
      setIsUploading(true);

      // Use unified upload service with wix-media-upload-service
      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);

      // Update settings
      const updated = {
        ...settings,
        backgroundMusicUrl: result.mediaUrl,
        musicTitle: file.name.replace(/\.[^/.]+$/, ''),
      };
      await adminCms.update('homepagesettings', updated);
      setSettings(updated);

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

  const handleRemoveMusic = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updated = {
        ...settings,
        backgroundMusicUrl: undefined,
        musicTitle: undefined,
      };
      await adminCms.update('homepagesettings', updated);
      setSettings(updated);
      setIsPlaying(false);

      toast({
        title: 'Success',
        description: 'Music file removed',
      });
    } catch (error) {
      console.error('Error removing music:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove music file',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMusicEnabled = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updated = { ...settings, musicEnabled: !settings.musicEnabled };
      await adminCms.update('homepagesettings', updated);
      setSettings(updated);

      toast({
        title: 'Success',
        description: `Music ${updated.musicEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling music:', error);
      toast({
        title: 'Error',
        description: 'Failed to update music settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAutoplay = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updated = { ...settings, autoplayEnabled: !settings.autoplayEnabled };
      await adminCms.update('homepagesettings', updated);
      setSettings(updated);

      toast({
        title: 'Success',
        description: `Autoplay ${updated.autoplayEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling autoplay:', error);
      toast({
        title: 'Error',
        description: 'Failed to update autoplay settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLoop = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updated = { ...settings, loopMusic: !settings.loopMusic };
      await adminCms.update('homepagesettings', updated);
      setSettings(updated);

      toast({
        title: 'Success',
        description: `Loop ${updated.loopMusic ? 'enabled' : 'disabled'}`,
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

  const handleVolumeChange = async (newVolume: number) => {
    if (!settings) return;

    try {
      const updated = { ...settings, volume: newVolume };
      await adminCms.update('homepagesettings', updated);
      setSettings(updated);

      if (audioRef) {
        audioRef.volume = newVolume / 100;
      }
    } catch (error) {
      console.error('Error updating volume:', error);
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

          {/* Current Music Info */}
          {settings?.backgroundMusicUrl && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-900">Current Music:</p>
              <p className="text-sm text-slate-600 mt-1">{settings.musicTitle || 'Untitled'}</p>
            </div>
          )}

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

          {/* Remove Button */}
          {settings?.backgroundMusicUrl && (
            <Button
              onClick={handleRemoveMusic}
              disabled={isSaving}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Music
            </Button>
          )}
        </div>
      </Card>

      {/* Audio Preview */}
      {settings?.backgroundMusicUrl && (
        <Card className="p-6 border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Preview & Controls</h3>

            {/* Audio Player */}
            <audio
              ref={setAudioRef}
              src={settings.backgroundMusicUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full"
              controls
            />

            {/* Volume Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Volume: {settings.volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume || 50}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Settings */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Music Settings</h3>

          {/* Toggle Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={handleToggleMusicEnabled}
              disabled={isSaving || !settings?.backgroundMusicUrl}
              variant={settings?.musicEnabled ? 'default' : 'outline'}
              className={`flex items-center justify-center gap-2 ${
                settings?.musicEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
              }`}
            >
              <Music className="w-4 h-4" />
              {settings?.musicEnabled ? 'Enabled' : 'Disabled'}
            </Button>

            <Button
              onClick={handleToggleAutoplay}
              disabled={isSaving || !settings?.backgroundMusicUrl}
              variant={settings?.autoplayEnabled ? 'default' : 'outline'}
              className={`flex items-center justify-center gap-2 ${
                settings?.autoplayEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
              }`}
            >
              <Zap className="w-4 h-4" />
              {settings?.autoplayEnabled ? 'Autoplay On' : 'Autoplay Off'}
            </Button>

            <Button
              onClick={handleToggleLoop}
              disabled={isSaving || !settings?.backgroundMusicUrl}
              variant={settings?.loopMusic ? 'default' : 'outline'}
              className={`flex items-center justify-center gap-2 ${
                settings?.loopMusic ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
              }`}
            >
              <RotateCw className="w-4 h-4" />
              {settings?.loopMusic ? 'Loop On' : 'Loop Off'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Autoplay may be blocked by browsers. Users may need to interact with the page first to enable audio playback.
        </p>
      </Card>
    </div>
  );
}
