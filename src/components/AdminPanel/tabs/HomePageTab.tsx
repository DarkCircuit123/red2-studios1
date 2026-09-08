import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeroSectionManager from '../sections/HeroSectionManager';
import TextEditorSystem from '../sections/TextEditorSystem';
import MusicLibraryManager from '../sections/MusicLibraryManager';
import BehindTheScenesManager from '../sections/BehindTheScenesManagerSecure';
import RubberBandPhotosManager from '../sections/RubberBandPhotosManagerSecure';
import HomePagePreview from '../sections/HomePagePreview';
import { Image, Type, Music, Eye, Camera, Film } from 'lucide-react';

export default function HomePageTab() {
  return <div className="space-y-6"><Tabs defaultValue="hero" className="w-full"><div className="border-b border-admin-line bg-admin-surface overflow-x-auto"><TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none">
    <TabsTrigger value="hero" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none"><Image className="w-4 h-4" /><span className="hidden sm:inline">Hero</span></TabsTrigger><TabsTrigger value="text" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none"><Type className="w-4 h-4" /><span className="hidden sm:inline">Text</span></TabsTrigger><TabsTrigger value="music" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none"><Music className="w-4 h-4" /><span className="hidden sm:inline">Music</span></TabsTrigger><TabsTrigger value="photos" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none"><Film className="w-4 h-4" /><span className="hidden sm:inline">Photos</span></TabsTrigger><TabsTrigger value="behind-scenes" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none"><Camera className="w-4 h-4" /><span className="hidden sm:inline">Behind</span></TabsTrigger><TabsTrigger value="preview" className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none"><Eye className="w-4 h-4" /><span className="hidden sm:inline">Preview</span></TabsTrigger>
  </TabsList></div><TabsContent value="hero" className="mt-6"><HeroSectionManager /></TabsContent><TabsContent value="text" className="mt-6"><TextEditorSystem /></TabsContent><TabsContent value="music" className="mt-6"><MusicLibraryManager /></TabsContent><TabsContent value="photos" className="mt-6"><RubberBandPhotosManager /></TabsContent><TabsContent value="behind-scenes" className="mt-6"><BehindTheScenesManager /></TabsContent><TabsContent value="preview" className="mt-6"><HomePagePreview /></TabsContent></Tabs></div>;
}
