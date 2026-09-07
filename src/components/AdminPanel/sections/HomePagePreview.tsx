import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { getActiveHomepageImages } from '@/lib/get-active-homepage-images';

export default function HomePagePreview() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<HomepageImages | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const item = await getActiveHomepageImages();
      if (item) {
        setSettings(item);
      } else {
        setSettings(null);
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
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-admin-text border border-white/15 rounded-none transition-colors duration-160 focus:outline-1 focus:outline-oxblood focus:outline-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Preview
        </Button>
      </div>

      {/* Hero Section Preview */}
      <div className="overflow-hidden border border-admin-line rounded-none bg-admin-raise">
        <div className="relative w-full h-96 bg-gradient-to-br from-admin-bg to-admin-surface flex items-center justify-center">
          {settings?.heroImage ? (
            <>
              <img
                src={settings.heroImage}
                alt="Hero image"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="text-center">
              <Eye className="w-12 h-12 text-admin-faint mx-auto mb-2" />
              <p className="text-admin-dim">No hero image</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Summary */}
      <div className="p-6 bg-admin-surface border border-admin-line rounded-sm">
        <h3 className="font-heading text-xs uppercase tracking-[0.14em] text-admin-text mb-4">Data Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-admin-faint">Image Name</p>
            <p className="text-admin-text font-medium">{settings?.imageName || '—'}</p>
          </div>
          <div>
            <p className="text-admin-faint">Hero Image</p>
            <p className="text-admin-text font-medium">{settings?.heroImage ? '✓ Uploaded' : '—'}</p>
          </div>
          <div>
            <p className="text-admin-faint">Active</p>
            <p className="text-admin-text font-medium">{settings?.isActive ? '✓ Yes' : '✗ No'}</p>
          </div>
          <div>
            <p className="text-admin-faint">Last Updated</p>
            <p className="text-admin-text font-medium">
              {settings?._updatedDate ? new Date(settings._updatedDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-admin-raise border border-admin-line rounded-sm">
        <p className="text-xs text-admin-dim">
          <strong>Tip:</strong> This preview shows how your home page will look with the current hero image. Changes are saved automatically when you update content in other tabs.
        </p>
      </div>
    </div>
  );
}
