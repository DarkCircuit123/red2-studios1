import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeroSectionManager from '../sections/HeroSectionManager';
import TextEditorSystem from '../sections/TextEditorSystem';
import BackgroundMusicManager from '../sections/BackgroundMusicManager';
import BehindTheScenesManager from '../sections/BehindTheScenesManager';
import RubberBandPhotosManager from '../sections/RubberBandPhotosManager';
import HomePagePreview from '../sections/HomePagePreview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image, Type, Music, Eye, Camera, Film } from 'lucide-react';

export default function HomePageTab() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-admin-raise p-1 rounded-sm border border-admin-line">
          <TabsTrigger value="hero" className="flex items-center gap-2 rounded-sm data-[state=active]:bg-admin-surface data-[state=active]:text-admin-text data-[state=inactive]:text-admin-dim hover:text-admin-text transition-colors duration-160">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-heading uppercase tracking-[0.12em]">Hero</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2 rounded-sm data-[state=active]:bg-admin-surface data-[state=active]:text-admin-text data-[state=inactive]:text-admin-dim hover:text-admin-text transition-colors duration-160">
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-heading uppercase tracking-[0.12em]">Text</span>
          </TabsTrigger>
          <TabsTrigger value="music" className="flex items-center gap-2 rounded-sm data-[state=active]:bg-admin-surface data-[state=active]:text-admin-text data-[state=inactive]:text-admin-dim hover:text-admin-text transition-colors duration-160">
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-heading uppercase tracking-[0.12em]">Music</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2 rounded-sm data-[state=active]:bg-admin-surface data-[state=active]:text-admin-text data-[state=inactive]:text-admin-dim hover:text-admin-text transition-colors duration-160">
            <Film className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-heading uppercase tracking-[0.12em]">Photos</span>
          </TabsTrigger>
          <TabsTrigger value="behind-scenes" className="flex items-center gap-2 rounded-sm data-[state=active]:bg-admin-surface data-[state=active]:text-admin-text data-[state=inactive]:text-admin-dim hover:text-admin-text transition-colors duration-160">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-heading uppercase tracking-[0.12em]">Behind</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2 rounded-sm data-[state=active]:bg-admin-surface data-[state=active]:text-admin-text data-[state=inactive]:text-admin-dim hover:text-admin-text transition-colors duration-160">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-heading uppercase tracking-[0.12em]">Preview</span>
          </TabsTrigger>
        </TabsList>

        {/* Hero Section Manager */}
        <TabsContent value="hero" className="mt-6">
          <HeroSectionManager />
        </TabsContent>

        {/* Text Editor System */}
        <TabsContent value="text" className="mt-6">
          <TextEditorSystem />
        </TabsContent>

        {/* Background Music Manager */}
        <TabsContent value="music" className="mt-6">
          <BackgroundMusicManager />
        </TabsContent>

        {/* Rubber Band Photos Manager */}
        <TabsContent value="photos" className="mt-6">
          <RubberBandPhotosManager />
        </TabsContent>

        {/* Behind The Scenes Manager */}
        <TabsContent value="behind-scenes" className="mt-6">
          <BehindTheScenesManager />
        </TabsContent>

        {/* Home Page Preview */}
        <TabsContent value="preview" className="mt-6">
          <HomePagePreview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
