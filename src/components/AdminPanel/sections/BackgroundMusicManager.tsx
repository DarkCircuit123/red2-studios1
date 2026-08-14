import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Music, Upload, Trash2, Play, Pause, Volume2, RotateCw, Zap } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { MusicSettings } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';

export default function BackgroundMusicManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<MusicSettings | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      console.log('[MUSIC_MANAGER] Loading music settings...');
      
      const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 1 });
      console.log('[MUSIC_MANAGER] Query result:', { itemCount: result.items.length, items: result.items });
      
      if (result.items.length > 0) {
        console.log('[MUSIC_MANAGER] Found existing settings:', result.items[0]);
        setSettings(result.items[0]);
      } else {
        // Create a default music settings entry if none exists
        console.log('[MUSIC_MANAGER] No settings found, creating default...');
        const newSettings: MusicSettings = {
          _id: crypto.randomUUID(),
          musicTitle: 'Background Music',
          isEnabled: false,
          autoplayEnabled: false,
          loopMusic: true,
          volume: 50,
        };
        
        try {
          const created = await adminCms.create('musicsettings', newSettings);
          console.log('[MUSIC_MANAGER] Successfully created default settings:', created);
          setSettings(newSettings);
        } catch (createError) {
          console.error('[MUSIC_MANAGER] Failed to create default settings:', createError);
          // Still set local state even if creation fails, so user can upload
          setSettings(newSettings);
          toast({
            title: 'Warning',
            description: 'Could not create default settings, but you can still upload music',
            variant: 'default',
          });
        }
      }
    } catch (error) {
      console.error('[MUSIC_MANAGER] Error loading settings:', error);
      // Create a temporary settings object so user can still upload
      const tempSettings: MusicSettings = {
        _id: crypto.randomUUID(),
        musicTitle: 'Background Music',
        isEnabled: false,
        autoplayEnabled: false,
        loopMusic: true,
        volume: 50,
      };
      setSettings(tempSettings);
      toast({
        title: 'Warning',
        description: 'Could not load music settings, but you can still upload music',
        variant: 'default',
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
      console.log('[MUSIC_MANAGER] Starting music upload:', { fileName: file.name, size: file.size, type: file.type });

      // Use unified upload service with wix-media-upload-service
      // This will use buildWixAudioUrl() for audio files to get HTTPS URL
      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);
      console.log('[MUSIC_MANAGER] Upload completed, received URL:', { mediaUrl: result.mediaUrl });

      // Update settings with the uploaded music URL (HTTPS URL from buildWixAudioUrl)
      const updated: MusicSettings = {
        ...settings,
        musicUrl: result.mediaUrl,  // HTTPS audio URL from Wix Media Manager
        audio: result.mediaUrl,      // Store the same HTTPS URL in audio field
        musicTitle: file.name.replace(/\.[^/.]+$/, ''),
        isEnabled: true,
      };
      
      console.log('[MUSIC_MANAGER] Saving to CMS:', { 
        _id: updated._id,
        musicUrl: updated.musicUrl,
        musicTitle: updated.musicTitle,
        isEnabled: updated.isEnabled
      });
      
      await adminCms.update('musicsettings', updated);
      console.log('[MUSIC_MANAGER] Successfully saved to CMS');
      
      setSettings(updated);

      toast({
        title: 'Success',
        description: 'Music file uploaded successfully',
      });
    } catch (error) {
      console.error('[MUSIC_MANAGER] Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 
                          (error && typeof error === 'object' && 'message' in error) ? (error as any).message :
                          'Failed to upload music file';
      toast({
        title: 'Error',
        description: errorMessage,
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
      console.log('[MUSIC_MANAGER] Removing music...');
      
      const updated: MusicSettings = {
        ...settings,
        musicUrl: undefined,
        audio: undefined,
        musicTitle: undefined,
        isEnabled: false,
      };
      
      console.log('[MUSIC_MANAGER] Saving removal to CMS:', { _id: updated._id });
      await adminCms.update('musicsettings', updated);
      console.log('[MUSIC_MANAGER] Successfully removed music');
      
      setSettings(updated);
      setIsPlaying(false);

      toast({
        title: 'Success',
        description: 'Music file removed',
      });
    } catch (error) {
      console.error('[MUSIC_MANAGER] Error removing music:', error);
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
      console.log('[MUSIC_MANAGER] Toggling music enabled:', { current: settings.isEnabled });
      
      const updated: MusicSettings = { ...settings, isEnabled: !settings.isEnabled };
      
      console.log('[MUSIC_MANAGER] Saving toggle to CMS:', { _id: updated._id, isEnabled: updated.isEnabled });
      await adminCms.update('musicsettings', updated);
      console.log('[MUSIC_MANAGER] Successfully toggled music enabled');
      
      setSettings(updated);

      toast({
        title: 'Success',
        description: `Music ${updated.isEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('[MUSIC_MANAGER] Error toggling music:', error);
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
      console.log('[MUSIC_MANAGER] Toggling autoplay:', { current: settings.autoplayEnabled });
      
      const updated: MusicSettings = { ...settings, autoplayEnabled: !settings.autoplayEnabled };
      
      console.log('[MUSIC_MANAGER] Saving autoplay toggle to CMS:', { _id: updated._id, autoplayEnabled: updated.autoplayEnabled });
      await adminCms.update('musicsettings', updated);
      console.log('[MUSIC_MANAGER] Successfully toggled autoplay');
      
      setSettings(updated);

      toast({
        title: 'Success',
        description: `Autoplay ${updated.autoplayEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('[MUSIC_MANAGER] Error toggling autoplay:', error);
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
      console.log('[MUSIC_MANAGER] Toggling loop:', { current: settings.loopMusic });
      
      const updated: MusicSettings = { ...settings, loopMusic: !settings.loopMusic };
      
      console.log('[MUSIC_MANAGER] Saving loop toggle to CMS:', { _id: updated._id, loopMusic: updated.loopMusic });
      await adminCms.update('musicsettings', updated);
      console.log('[MUSIC_MANAGER] Successfully toggled loop');
      
      setSettings(updated);

      toast({
        title: 'Success',
        description: `Loop ${updated.loopMusic ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('[MUSIC_MANAGER] Error toggling loop:', error);
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
      console.log('[MUSIC_MANAGER] Changing volume:', { current: settings.volume, new: newVolume });
      
      const updated: MusicSettings = { ...settings, volume: newVolume };
      
      console.log('[MUSIC_MANAGER] Saving volume to CMS:', { _id: updated._id, volume: updated.volume });
      await adminCms.update('musicsettings', updated);
      console.log('[MUSIC_MANAGER] Successfully updated volume');
      
      setSettings(updated);

      if (audioRef) {
        audioRef.volume = newVolume / 100;
      }
    } catch (error) {
      console.error('[MUSIC_MANAGER] Error updating volume:', error);
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
          {settings?.musicUrl && (
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
          {settings?.musicUrl && (
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
      {settings?.musicUrl && (
        <Card className="p-6 border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Preview & Controls</h3>

            {/* Audio Player */}
            <audio
              ref={setAudioRef}
              src={settings.musicUrl}
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
              disabled={isSaving || !settings?.musicUrl}
              variant={settings?.isEnabled ? 'default' : 'outline'}
              className={`flex items-center justify-center gap-2 ${
                settings?.isEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
              }`}
            >
              <Music className="w-4 h-4" />
              {settings?.isEnabled ? 'Enabled' : 'Disabled'}
            </Button>

            <Button
              onClick={handleToggleAutoplay}
              disabled={isSaving || !settings?.musicUrl}
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
              disabled={isSaving || !settings?.musicUrl}
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
