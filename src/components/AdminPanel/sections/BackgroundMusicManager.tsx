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
        // No settings found - create a placeholder that will be persisted on first upload
        console.log('[MUSIC_MANAGER] No settings found, creating placeholder...');
        const placeholderSettings: MusicSettings = {
          _id: crypto.randomUUID(),
          musicTitle: 'Background Music',
          isEnabled: false,
          autoplayEnabled: false,
          loopMusic: true,
          volume: 50,
          // No audio/musicUrl yet - will be set on upload
        };
        
        setSettings(placeholderSettings);
        console.log('[MUSIC_MANAGER] Placeholder created (not persisted yet)');
      }
    } catch (error) {
      console.error('[MUSIC_MANAGER] Error loading settings:', error);
      // Create a placeholder so user can still upload
      const placeholderSettings: MusicSettings = {
        _id: crypto.randomUUID(),
        musicTitle: 'Background Music',
        isEnabled: false,
        autoplayEnabled: false,
        loopMusic: true,
        volume: 50,
      };
      setSettings(placeholderSettings);
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

      // Upload file to Wix Media Manager
      const result = await uploadMedia(file, 'music', MUSIC_UPLOAD_CONFIG);
      console.log('[MUSIC_MANAGER] Upload completed, received URL:', { mediaUrl: result.mediaUrl });

      if (!result.mediaUrl) {
        throw new Error('Upload returned empty media URL');
      }

      // Check if this is a new record or an update
      let updated: MusicSettings;
      let isNewRecord = false;

      // Check if settings has been persisted to CMS (has _createdDate or was loaded from CMS)
      if (settings._createdDate) {
        // Existing record - update it
        console.log('[MUSIC_MANAGER] Updating existing MusicSettings record');
        updated = {
          ...settings,
          audio: result.mediaUrl,  // Canonical audio field - store HTTPS URL
          musicTitle: file.name.replace(/\.[^/.]+$/, ''),
          isEnabled: true,
        };
      } else {
        // New record - create it with the uploaded audio
        console.log('[MUSIC_MANAGER] Creating new MusicSettings record');
        isNewRecord = true;
        updated = {
          ...settings,
          audio: result.mediaUrl,  // Canonical audio field - store HTTPS URL
          musicTitle: file.name.replace(/\.[^/.]+$/, ''),
          isEnabled: true,
        };
      }
      
      console.log('[MUSIC_MANAGER] Saving to CMS:', { 
        _id: updated._id,
        audio: updated.audio,
        audioLength: updated.audio?.length,
        audioIsHttps: updated.audio?.startsWith('https://'),
        musicTitle: updated.musicTitle,
        isEnabled: updated.isEnabled,
        isNewRecord
      });
      
      if (isNewRecord) {
        // Create new record
        const created = await adminCms.create('musicsettings', updated);
        console.log('[MUSIC_MANAGER] Successfully created new MusicSettings record:', {
          _id: created._id,
          audio: created.audio,
          audioLength: created.audio?.length,
          audioIsHttps: created.audio?.startsWith('https://'),
          musicTitle: created.musicTitle,
          isEnabled: created.isEnabled
        });
        setSettings(created);
      } else {
        // Update existing record
        const updateResult = await adminCms.update('musicsettings', updated);
        console.log('[MUSIC_MANAGER] Successfully updated MusicSettings record:', {
          _id: updateResult._id,
          audio: updateResult.audio,
          audioLength: updateResult.audio?.length,
          audioIsHttps: updateResult.audio?.startsWith('https://'),
          musicTitle: updateResult.musicTitle,
          isEnabled: updateResult.isEnabled
        });
        setSettings(updateResult);
      }

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
      
      // Only update if this record has been persisted to CMS
      if (!settings._createdDate) {
        console.log('[MUSIC_MANAGER] Record not persisted yet, just clearing local state');
        const cleared: MusicSettings = {
          ...settings,
          audio: undefined,
          musicTitle: undefined,
          isEnabled: false,
        };
        setSettings(cleared);
        toast({
          title: 'Success',
          description: 'Music cleared',
        });
        return;
      }

      const updated: MusicSettings = {
        ...settings,
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
      
      // Only update CMS if record has been persisted
      if (settings._createdDate) {
        console.log('[MUSIC_MANAGER] Saving toggle to CMS:', { _id: updated._id, isEnabled: updated.isEnabled });
        await adminCms.update('musicsettings', updated);
        console.log('[MUSIC_MANAGER] Successfully toggled music enabled');
      }
      
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
      
      // Only update CMS if record has been persisted
      if (settings._createdDate) {
        console.log('[MUSIC_MANAGER] Saving autoplay toggle to CMS:', { _id: updated._id, autoplayEnabled: updated.autoplayEnabled });
        await adminCms.update('musicsettings', updated);
        console.log('[MUSIC_MANAGER] Successfully toggled autoplay');
      }
      
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
      
      // Only update CMS if record has been persisted
      if (settings._createdDate) {
        console.log('[MUSIC_MANAGER] Saving loop toggle to CMS:', { _id: updated._id, loopMusic: updated.loopMusic });
        await adminCms.update('musicsettings', updated);
        console.log('[MUSIC_MANAGER] Successfully toggled loop');
      }
      
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
      
      // Only update CMS if record has been persisted
      if (settings._createdDate) {
        console.log('[MUSIC_MANAGER] Saving volume to CMS:', { _id: updated._id, volume: updated.volume });
        await adminCms.update('musicsettings', updated);
        console.log('[MUSIC_MANAGER] Successfully updated volume');
      }
      
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
          {settings?.audio && (
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
          {settings?.audio && (
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
      {settings?.audio && (
        <Card className="p-6 border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Preview & Controls</h3>

            {/* Audio Player */}
            <audio
              ref={setAudioRef}
              src={settings.audio}
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
              disabled={isSaving || !settings?.audio}
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
              disabled={isSaving || !settings?.audio}
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
              disabled={isSaving || !settings?.audio}
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
