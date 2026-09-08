import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeroSectionManager from '../sections/HeroSectionManager';
import TextEditorSystem from '../sections/TextEditorSystem';
import MusicLibraryManager from '../sections/MusicLibraryManager';
import BehindTheScenesManagerSecure from '../sections/BehindTheScenesManagerSecure';
import RubberBandPhotosManagerSecure from '../sections/RubberBandPhotosManagerSecure';
import HomePagePreview from '../sections/HomePagePreview';
import { Image, Type, Music, Eye, Camera, Film } from 'lucide-react';

export default function HomePageTab() {
  return <div className="space-y-6"><Tabs defaultValue="hero" className="w-full"><div className="border-b border-admin-line bg-admin-surface overflow-x-auto"><TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none"><TabsTrigger value="hero"><Image className="w-4 h-4" /><span>Hero</span></TabsTrigger><TabsTrigger value="text"><Type className="w-4 h-4" /><span>Text</span></TabsTrigger><TabsTrigger value="music"><Music className="w-4 h-4" /><span>Music</span></TabsTrigger><TabsTrigger value="photos"><Film className="w-4 h-4" /><span>Photos</span></TabsTrigger><TabsTrigger value="behind-scenes"><Camera className="w-4 h-4" /><span>Behind</span></TabsTrigger><TabsTrigger value="preview"><Eye className="w-4 h-4" /><span>Preview</span></TabsTrigger></TabsList></div><TabsContent value="hero"><HeroSectionManager /></TabsContent><TabsContent value="text"><TextEditorSystem /></TabsContent><TabsContent value="music"><MusicLibraryManager /></TabsContent><TabsContent value="photos"><RubberBandPhotosManagerSecure /></TabsContent><TabsContent value="behind-scenes"><BehindTheScenesManagerSecure /></TabsContent><TabsContent value="preview"><HomePagePreview /></TabsContent></Tabs></div>;
}
