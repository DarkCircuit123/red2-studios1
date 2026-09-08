import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HomePageTab from './tabs/HomePageTab';
import SplashpageTab from './tabs/SplashpageTab';
import WorkGalleryManager from './sections/WorkGalleryManager';
import ProfessionalPhotoLibrary from './sections/ProfessionalPhotoLibraryFixed';
import MusicLibraryManager from './sections/MusicLibraryManager';
import SponsorsManager from './sections/SponsorsManagerSecure';
import { Home, FileText, Briefcase, Calendar, Mail, Cog, Image, Library, Music, Users } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const tabs = [
    { id: 'home', label: 'Home Page', icon: Home, enabled: true },
    { id: 'splashpage', label: 'Splash Page', icon: Image, enabled: true },
    { id: 'gallery', label: 'Work Gallery', icon: Briefcase, enabled: true },
    { id: 'photo-library', label: 'Photo Library', icon: Library, enabled: true },
    { id: 'music', label: 'Music Library', icon: Music, enabled: true },
    { id: 'sponsors', label: 'Sponsors', icon: Users, enabled: true },
    { id: 'about', label: 'About Page', icon: FileText, enabled: false },
    { id: 'services', label: 'Services', icon: Cog, enabled: false },
    { id: 'booking', label: 'Booking', icon: Calendar, enabled: false },
    { id: 'contact', label: 'Contact', icon: Mail, enabled: false },
    { id: 'settings', label: 'Settings', icon: Cog, enabled: false },
  ];
  return <div className="min-h-screen bg-admin-bg"><div className="border-b border-admin-line bg-admin-bg"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div className="flex items-center gap-3"><h1 className="font-heading text-[22px] uppercase tracking-[0.18em] text-admin-text">RED<span className="text-oxblood relative -top-1">²</span></h1><div className="w-px h-6 bg-admin-line" /><p className="text-[11px] uppercase tracking-[0.2em] text-admin-faint">CONTROL ROOM</p></div></div></div><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="bg-admin-surface border border-admin-line"><Tabs value={activeTab} onValueChange={setActiveTab}><div className="border-b border-admin-line overflow-x-auto"><TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none">{tabs.map((tab) => { const Icon = tab.icon; return <TabsTrigger key={tab.id} value={tab.id} disabled={!tab.enabled} className="flex items-center gap-2 px-4 py-3 border-b-2 rounded-none font-heading text-[11px] uppercase tracking-[0.12em]"><Icon className="w-4 h-4" /><span>{tab.label}</span>{!tab.enabled && <span className="text-[11px] text-admin-faint ml-1">(Coming soon)</span>}</TabsTrigger>; })}</TabsList></div><TabsContent value="home" className="m-0 p-6"><HomePageTab /></TabsContent><TabsContent value="splashpage" className="m-0 p-6"><SplashpageTab /></TabsContent><TabsContent value="gallery" className="m-0 p-6"><WorkGalleryManager /></TabsContent><TabsContent value="photo-library" className="m-0 p-6"><ProfessionalPhotoLibrary /></TabsContent><TabsContent value="music" className="m-0 p-6"><MusicLibraryManager /></TabsContent><TabsContent value="sponsors" className="m-0 p-6"><SponsorsManager /></TabsContent>{['about','services','booking','contact','settings'].map((tabId) => <TabsContent key={tabId} value={tabId} className="m-0 p-6"><div className="text-center py-12"><p className="text-admin-dim text-[13px]">This tab is coming soon.</p></div></TabsContent>)}</Tabs></div></div></div>;
}
