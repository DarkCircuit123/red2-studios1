import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import HomePageTab from './tabs/HomePageTab';
import SplashpageTab from './tabs/SplashpageTab';
import GalleryPhotoManager from './sections/GalleryPhotoManager';
import PortfolioManager from './sections/PortfolioManager';
import { Settings, Home, FileText, Briefcase, Calendar, Mail, Cog, Image } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Home Page', icon: Home, enabled: true },
    { id: 'splashpage', label: 'Splash Page', icon: Image, enabled: true },
    { id: 'gallery', label: 'Work Gallery', icon: Briefcase, enabled: true },
    { id: 'portfolio', label: 'Portfolio Projects', icon: Briefcase, enabled: true },
    { id: 'about', label: 'About Page', icon: FileText, enabled: false },
    { id: 'services', label: 'Services', icon: Settings, enabled: false },
    { id: 'booking', label: 'Booking', icon: Calendar, enabled: false },
    { id: 'contact', label: 'Contact', icon: Mail, enabled: false },
    { id: 'settings', label: 'Settings', icon: Cog, enabled: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Manage your website content</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tabs List */}
            <div className="border-b border-slate-200 bg-slate-50 rounded-t-lg overflow-x-auto">
              <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      disabled={!tab.enabled}
                      className={`
                        flex items-center gap-2 px-4 py-3 border-b-2 rounded-none
                        transition-colors duration-200
                        ${!tab.enabled ? 'opacity-50 cursor-not-allowed' : ''}
                        data-[state=active]:border-blue-600 data-[state=active]:text-blue-600
                        data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-600
                        hover:text-slate-900 hover:bg-slate-100
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                      {!tab.enabled && <span className="text-xs text-slate-400 ml-1">(Coming soon)</span>}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="home" className="m-0">
                <HomePageTab />
              </TabsContent>

              <TabsContent value="splashpage" className="m-0">
                <SplashpageTab />
              </TabsContent>

              <TabsContent value="gallery" className="m-0">
                <GalleryPhotoManager />
              </TabsContent>

              <TabsContent value="portfolio" className="m-0">
                <PortfolioManager />
              </TabsContent>

              {/* Disabled tabs placeholder */}
              {['about', 'services', 'booking', 'contact', 'settings'].map((tabId) => (
                <TabsContent key={tabId} value={tabId} className="m-0">
                  <div className="text-center py-12">
                    <p className="text-slate-500">This tab is coming soon.</p>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
