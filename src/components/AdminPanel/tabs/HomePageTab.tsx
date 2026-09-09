import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeroSectionManager from '../sections/HeroSectionManager';
import TextEditorSystem from '../sections/TextEditorSystem';
import BackgroundMusicManager from '../sections/BackgroundMusicManager_NEW';
import BehindTheScenesManager from '../sections/BehindTheScenesManager';
import RubberBandPhotosManager from '../sections/RubberBandPhotosManager';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image, Type, Music, Camera, Film } from 'lucide-react';

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
        <div className="border-b border-admin-line bg-admin-surface overflow-x-auto">
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none">
            <TabsTrigger value="hero" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none transition-colors duration-160 font-heading text-[11px] uppercase tracking-[0.12em] data-[state=active]:border-b-2 data-[state=active]:border-oxblood data-[state=active]:text-admin-text data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-admin-dim hover:text-admin-text hover:bg-white/[0.03]">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Hero</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none transition-colors duration-160 font-heading text-[11px] uppercase tracking-[0.12em] data-[state=active]:border-b-2 data-[state=active]:border-oxblood data-[state=active]:text-admin-text data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-admin-dim hover:text-admin-text hover:bg-white/[0.03]">
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none transition-colors duration-160 font-heading text-[11px] uppercase tracking-[0.12em] data-[state=active]:border-b-2 data-[state=active]:border-oxblood data-[state=active]:text-admin-text data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-admin-dim hover:text-admin-text hover:bg-white/[0.03]">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Music</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none transition-colors duration-160 font-heading text-[11px] uppercase tracking-[0.12em] data-[state=active]:border-b-2 data-[state=active]:border-oxblood data-[state=active]:text-admin-text data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-admin-dim hover:text-admin-text hover:bg-white/[0.03]">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="behind-scenes" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none transition-colors duration-160 font-heading text-[11px] uppercase tracking-[0.12em] data-[state=active]:border-b-2 data-[state=active]:border-oxblood data-[state=active]:text-admin-text data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-admin-dim hover:text-admin-text hover:bg-white/[0.03]">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Behind</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
      </Tabs>
    </div>
  );
}
