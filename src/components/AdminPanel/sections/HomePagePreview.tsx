import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RefreshCw, Music, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import { HomePageSettings } from '@/entities';
import { useToast } from '@/hooks/use-toast';

export default function HomePagePreview() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<HomePageSettings | null>(null);

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
        description: 'Failed to load preview',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadSettings();
    toast({
      title: 'Refreshed',
      description: 'Preview updated with latest data',
    });
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
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Preview
        </Button>
      </div>

      {/* Hero Section Preview */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          {settings?.heroBackgroundImage ? (
            <>
              <img
                src={settings.heroBackgroundImage}
                alt="Hero background"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="text-center">
              <Eye className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400">No background image</p>
            </div>
          )}

          {/* Hero Content */}
          <div className="relative z-10 text-center text-white px-6 max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">{settings?.heroTitle || 'Welcome to Our Site'}</h1>
            <p className="text-xl text-slate-200 mb-8">{settings?.heroSubtitle || 'Create something amazing'}</p>
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
              {settings?.buttonText || 'Get Started'}
            </button>
          </div>
        </div>
      </Card>

      {/* Content Preview */}
      <Card className="p-8 border border-slate-200">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Content Preview</h2>
            <p className="text-slate-600">{settings?.sectionContent || 'No section content added yet'}</p>
          </div>
        </div>
      </Card>

      {/* Music Status */}
      {settings?.backgroundMusicUrl && (
        <Card className="p-6 border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Background Music</h3>
              <p className="text-sm text-slate-600 mt-1">{settings.musicTitle || 'Untitled'}</p>
              <div className="flex gap-4 mt-2 text-xs text-slate-600">
                <span className={`flex items-center gap-1 ${settings.musicEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                  ● {settings.musicEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className={`flex items-center gap-1 ${settings.autoplayEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                  ● {settings.autoplayEnabled ? 'Autoplay' : 'Manual play'}
                </span>
                <span className={`flex items-center gap-1 ${settings.loopMusic ? 'text-green-600' : 'text-slate-400'}`}>
                  ● {settings.loopMusic ? 'Loop' : 'No loop'}
                </span>
                <span className="text-slate-600">● Volume: {settings.volume}%</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Data Summary */}
      <Card className="p-6 border border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-4">Data Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Hero Title</p>
            <p className="font-medium text-slate-900">{settings?.heroTitle || '—'}</p>
          </div>
          <div>
            <p className="text-slate-600">Hero Subtitle</p>
            <p className="font-medium text-slate-900">{settings?.heroSubtitle || '—'}</p>
          </div>
          <div>
            <p className="text-slate-600">Button Text</p>
            <p className="font-medium text-slate-900">{settings?.buttonText || '—'}</p>
          </div>
          <div>
            <p className="text-slate-600">Background Image</p>
            <p className="font-medium text-slate-900">{settings?.heroBackgroundImage ? '✓ Uploaded' : '—'}</p>
          </div>
          <div>
            <p className="text-slate-600">Music File</p>
            <p className="font-medium text-slate-900">{settings?.backgroundMusicUrl ? '✓ Uploaded' : '—'}</p>
          </div>
          <div>
            <p className="text-slate-600">Last Updated</p>
            <p className="font-medium text-slate-900">
              {settings?._updatedDate ? new Date(settings._updatedDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> This preview shows how your home page will look with the current settings. Changes are saved automatically when you update content in other tabs.
        </p>
      </Card>
    </div>
  );
}
