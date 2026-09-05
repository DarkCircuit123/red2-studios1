import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';

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
      const result = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 1 });
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
              <Eye className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400">No hero image</p>
            </div>
          )}
        </div>
      </Card>

      {/* Data Summary */}
      <Card className="p-6 border border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-4">Data Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Image Name</p>
            <p className="font-medium text-slate-900">{settings?.imageName || '—'}</p>
          </div>
          <div>
            <p className="text-slate-600">Hero Image</p>
            <p className="font-medium text-slate-900">{settings?.heroImage ? '✓ Uploaded' : '—'}</p>
          </div>
          <div>
            <p className="text-slate-600">Active</p>
            <p className="font-medium text-slate-900">{settings?.isActive ? '✓ Yes' : '✗ No'}</p>
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
          <strong>Tip:</strong> This preview shows how your home page will look with the current hero image. Changes are saved automatically when you update content in other tabs.
        </p>
      </Card>
    </div>
  );
}
