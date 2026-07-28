import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Edit2, LogOut, Music } from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuthStore';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';
import { BaseCrudService } from '@/integrations';
import { Services, HomepageImages, Portfolio, ClientsPress } from '@/entities/index';
import { playClickSound } from '@/lib/click-sound';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MusicSettings {
  _id: string;
  musicUrl?: string;
  isEnabled?: boolean;
  volume?: number;
  loopMusic?: boolean;
  musicTitle?: string;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('photos');
  const [siteTitle, setSiteTitle] = useState('RED2');
  const [siteTagline, setSiteTagline] = useState('BY JORDAN MICHAEL ZUNIGA');
  const [homepageImages, setHomepageImages] = useState<HomepageImages | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [musicSettings, setMusicSettings] = useState<MusicSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        // Load homepage images (hero image is stored here)
        try {
          const homepageImagesResult = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 1 });
          if (homepageImagesResult?.items && homepageImagesResult.items.length > 0) {
            setHomepageImages(homepageImagesResult.items[0]);
          }
        } catch (error) {
          setHomepageImages(null);
        }

        // Load portfolio items
        try {
          const portfolioResult = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 });
          if (portfolioResult?.items) {
            setPortfolioItems(portfolioResult.items);
          } else {
            setPortfolioItems([]);
          }
        } catch (error) {
          setPortfolioItems([]);
        }

        // Load sponsors/clients
        try {
          const sponsorsResult = await BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 50 });
          if (sponsorsResult?.items) {
            setSponsors(sponsorsResult.items);
          } else {
            setSponsors([]);
          }
        } catch (error) {
          setSponsors([]);
        }

        // Load music settings
        try {
          const musicResult = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 1 });
          if (musicResult?.items && musicResult.items.length > 0) {
            setMusicSettings(musicResult.items[0]);
          }
        } catch (error) {
          setMusicSettings(null);
        }
      } catch (error) {
        setHomepageImages(null);
        setPortfolioItems([]);
        setSponsors([]);
        setMusicSettings(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImages();
  }, [isOpen]);

  // Only render admin panel if user is authenticated
  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white border-l border-black/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-black" />
                <h2 className="text-lg font-heading font-bold text-black">Admin Panel</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    logout();
                    onClose();
                  }}
                  className="p-2 hover:bg-red-500/10 rounded transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-black/60" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-16 bg-white border-b border-black/10 px-6 py-4 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'photos'
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                Site Photos
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'portfolio'
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('sponsors')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'sponsors'
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                Sponsors
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'music'
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                <Music className="w-3 h-3" />
                Music
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'text'
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                Text Content
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Site Photos Tab */}
              {activeTab === 'photos' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide">
                    Manage Site Photos
                  </h3>
                  <div className="space-y-6">
                    {/* Hero Image */}
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">
                        Hero Background Image
                      </label>
                      <ImageUploadManager
                        label="Upload Hero Image"
                        currentImage={homepageImages?.heroImage}
                        collectionId="homepageimages"
                        itemId={homepageImages?._id}
                        fieldName="heroImage"
                        onImageUpload={(url) => {
                          if (homepageImages) {
                            setHomepageImages({ ...homepageImages, heroImage: url });
                          }
                        }}
                        onImageDelete={() => {
                          if (homepageImages) {
                            setHomepageImages({ ...homepageImages, heroImage: undefined });
                          }
                        }}
                      />
                    </div>

                    {/* About Section Image */}
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">
                        About Section Image
                      </label>
                      <ImageUploadManager
                        label="Upload About Image"
                        currentImage={homepageImages?.aboutSectionImage}
                        collectionId="homepageimages"
                        itemId={homepageImages?._id}
                        fieldName="aboutSectionImage"
                        onImageUpload={(url) => {
                          if (homepageImages) {
                            setHomepageImages({ ...homepageImages, aboutSectionImage: url });
                          }
                        }}
                        onImageDelete={() => {
                          if (homepageImages) {
                            setHomepageImages({ ...homepageImages, aboutSectionImage: undefined });
                          }
                        }}
                      />
                    </div>

                    {/* Contact Background Image */}
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">
                        Contact Section Background
                      </label>
                      <ImageUploadManager
                        label="Upload Contact Background"
                        currentImage={homepageImages?.contactBackgroundImage}
                        collectionId="homepageimages"
                        itemId={homepageImages?._id}
                        fieldName="contactBackgroundImage"
                        onImageUpload={(url) => {
                          if (homepageImages) {
                            setHomepageImages({ ...homepageImages, contactBackgroundImage: url });
                          }
                        }}
                        onImageDelete={() => {
                          if (homepageImages) {
                            setHomepageImages({ ...homepageImages, contactBackgroundImage: undefined });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide">
                    Manage Portfolio Images
                  </h3>
                  <div className="space-y-8 max-h-96 overflow-y-auto">
                    {portfolioItems.length === 0 ? (
                      <p className="text-sm text-black/60">No portfolio items found. Add items in the CMS.</p>
                    ) : (
                      portfolioItems.map((item) => (
                        <div key={item._id} className="border-t border-black/10 pt-6">
                          <h4 className="text-xs font-heading font-bold text-black mb-4 uppercase tracking-wide">
                            {item.projectName || 'Untitled Project'}
                          </h4>
                          <div className="space-y-4">
                            {/* Main Image */}
                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                                Main Image
                              </label>
                              <ImageUploadManager
                                label="Upload Main Image"
                                currentImage={item.mainImage}
                                collectionId="portfolio"
                                itemId={item._id}
                                fieldName="mainImage"
                                onImageUpload={(url) => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, mainImage: url } : p
                                  ));
                                }}
                                onImageDelete={() => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, mainImage: undefined } : p
                                  ));
                                }}
                              />
                            </div>

                            {/* Gallery Images */}
                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                                Gallery Image 1
                              </label>
                              <ImageUploadManager
                                label="Upload Gallery Image 1"
                                currentImage={item.galleryImage1}
                                collectionId="portfolio"
                                itemId={item._id}
                                fieldName="galleryImage1"
                                onImageUpload={(url) => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, galleryImage1: url } : p
                                  ));
                                }}
                                onImageDelete={() => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, galleryImage1: undefined } : p
                                  ));
                                }}
                              />
                            </div>

                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                                Gallery Image 2
                              </label>
                              <ImageUploadManager
                                label="Upload Gallery Image 2"
                                currentImage={item.galleryImage2}
                                collectionId="portfolio"
                                itemId={item._id}
                                fieldName="galleryImage2"
                                onImageUpload={(url) => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, galleryImage2: url } : p
                                  ));
                                }}
                                onImageDelete={() => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, galleryImage2: undefined } : p
                                  ));
                                }}
                              />
                            </div>

                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                                Gallery Image 3
                              </label>
                              <ImageUploadManager
                                label="Upload Gallery Image 3"
                                currentImage={item.galleryImage3}
                                collectionId="portfolio"
                                itemId={item._id}
                                fieldName="galleryImage3"
                                onImageUpload={(url) => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, galleryImage3: url } : p
                                  ));
                                }}
                                onImageDelete={() => {
                                  setPortfolioItems(portfolioItems.map(p => 
                                    p._id === item._id ? { ...p, galleryImage3: undefined } : p
                                  ));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sponsors Tab */}
              {activeTab === 'sponsors' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide">
                    Manage Sponsors
                  </h3>
                  <div className="space-y-8 max-h-96 overflow-y-auto">
                    {sponsors.length === 0 ? (
                      <p className="text-sm text-black/60">No sponsors found. Add sponsors in the CMS.</p>
                    ) : (
                      sponsors.map((sponsor) => (
                        <div key={sponsor._id} className="border-t border-black/10 pt-6">
                          <h4 className="text-xs font-heading font-bold text-black mb-4 uppercase tracking-wide">
                            {sponsor.clientName || 'Untitled Sponsor'}
                          </h4>
                          <div className="space-y-4">
                            {/* Sponsor Name */}
                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                                Sponsor Name (Hover Text)
                              </label>
                              <TextEditableField
                                value={sponsor.clientName || ''}
                                onSave={async (newName) => {
                                  try {
                                    await BaseCrudService.update('clientspress', {
                                      _id: sponsor._id,
                                      clientName: newName
                                    });
                                    setSponsors(sponsors.map(s => 
                                      s._id === sponsor._id ? { ...s, clientName: newName } : s
                                    ));
                                  } catch (error) {
                                    console.error('Error updating sponsor name:', error);
                                  }
                                }}
                                className="text-sm text-black"
                              />
                            </div>
                            {/* Sponsor Logo */}
                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                                Sponsor Logo
                              </label>
                              <ImageUploadManager
                                label="Upload Sponsor Logo"
                                currentImage={sponsor.clientLogo}
                                collectionId="clientspress"
                                itemId={sponsor._id}
                                fieldName="clientLogo"
                                onImageUpload={(url) => {
                                  setSponsors(sponsors.map(s => 
                                    s._id === sponsor._id ? { ...s, clientLogo: url } : s
                                  ));
                                }}
                                onImageDelete={() => {
                                  setSponsors(sponsors.map(s => 
                                    s._id === sponsor._id ? { ...s, clientLogo: undefined } : s
                                  ));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Music Tab */}
              {activeTab === 'music' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Background Music Settings
                  </h3>
                  <div className="space-y-6">
                    {musicSettings ? (
                      <>
                        {/* Enable/Disable Toggle */}
                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">
                            Enable Background Music
                          </label>
                          <button
                            onClick={async () => {
                              try {
                                const newState = !musicSettings.isEnabled;
                                await BaseCrudService.update('musicsettings', {
                                  _id: musicSettings._id,
                                  isEnabled: newState
                                });
                                setMusicSettings({ ...musicSettings, isEnabled: newState });
                              } catch (error) {\n                                console.error('Error updating music settings:', error);\n                              }\n                            }}\n                            className={`px-4 py-2 rounded text-sm font-heading font-bold uppercase tracking-wide transition-all ${\n                              musicSettings.isEnabled\n                                ? 'bg-green-500 text-white hover:bg-green-600'\n                                : 'bg-gray-400 text-white hover:bg-gray-500'\n                            }`}\n                          >\n                            {musicSettings.isEnabled ? '✓ Enabled' : '✗ Disabled'}\n                          </button>\n                        </div>\n\n                        {/* Music Title */}\n                        <div>\n                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">\n                            Music Title\n                          </label>\n                          <TextEditableField\n                            value={musicSettings.musicTitle || ''}\n                            onSave={async (newTitle) => {\n                              try {\n                                await BaseCrudService.update('musicsettings', {\n                                  _id: musicSettings._id,\n                                  musicTitle: newTitle\n                                });\n                                setMusicSettings({ ...musicSettings, musicTitle: newTitle });\n                              } catch (error) {\n                                console.error('Error updating music title:', error);\n                              }\n                            }}\n                            className="text-sm text-black"\n                          />\n                        </div>\n\n                        {/* Music URL */}\n                        <div>\n                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">\n                            Music URL\n                          </label>\n                          <TextEditableField\n                            value={musicSettings.musicUrl || ''}\n                            onSave={async (newUrl) => {\n                              try {\n                                await BaseCrudService.update('musicsettings', {\n                                  _id: musicSettings._id,\n                                  musicUrl: newUrl\n                                });\n                                setMusicSettings({ ...musicSettings, musicUrl: newUrl });\n                              } catch (error) {\n                                console.error('Error updating music URL:', error);\n                              }\n                            }}\n                            className="text-xs text-black/70 break-all"\n                          />\n                        </div>\n\n                        {/* Volume Control */}\n                        <div>\n                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">\n                            Volume Level: {musicSettings.volume || 50}%\n                          </label>\n                          <input\n                            type="range"\n                            min="0"\n                            max="100"\n                            value={musicSettings.volume || 50}\n                            onChange={async (e) => {\n                              const newVolume = parseInt(e.target.value);\n                              setMusicSettings({ ...musicSettings, volume: newVolume });\n                              try {\n                                await BaseCrudService.update('musicsettings', {\n                                  _id: musicSettings._id,\n                                  volume: newVolume\n                                });\n                              } catch (error) {\n                                console.error('Error updating volume:', error);\n                              }\n                            }}\n                            className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer"\n                          />\n                        </div>\n\n                        {/* Loop Toggle */}\n                        <div>\n                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">\n                            Loop Music\n                          </label>\n                          <button\n                            onClick={async () => {\n                              try {\n                                const newState = !musicSettings.loopMusic;\n                                await BaseCrudService.update('musicsettings', {\n                                  _id: musicSettings._id,\n                                  loopMusic: newState\n                                });\n                                setMusicSettings({ ...musicSettings, loopMusic: newState });\n                              } catch (error) {\n                                console.error('Error updating loop setting:', error);\n                              }\n                            }}\n                            className={`px-4 py-2 rounded text-sm font-heading font-bold uppercase tracking-wide transition-all ${\n                              musicSettings.loopMusic\n                                ? 'bg-blue-500 text-white hover:bg-blue-600'\n                                : 'bg-gray-400 text-white hover:bg-gray-500'\n                            }`}\n                          >\n                            {musicSettings.loopMusic ? '✓ Looping' : '✗ No Loop'}\n                          </button>\n                        </div>\n\n                        {/* Info Box */}\n                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">\n                          <h4 className="text-xs font-heading font-bold text-blue-600 mb-2">ℹ️ How to Upload Music</h4>\n                          <ol className="text-xs text-blue-600/70 space-y-1 list-decimal list-inside">\n                            <li>Upload your MP3 file to Wix Media</li>\n                            <li>Copy the file URL</li>\n                            <li>Paste the URL in the "Music URL" field above</li>\n                            <li>Adjust volume and settings as needed</li>\n                            <li>Enable the music to activate playback</li>\n                          </ol>\n                        </div>\n                      </>\n                    ) : (\n                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">\n                        <p className="text-sm text-yellow-600">No music settings found. Please add one in the CMS.</p>\n                        <a\n                          href="https://manage.wix.com/dashboard"\n                          target="_blank"\n                          rel="noopener noreferrer"\n                          className="inline-block mt-4 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-xs text-yellow-600 transition-all duration-300"\n                        >\n                          Open CMS to Add Music Settings\n                        </a>\n                      </div>\n                    )}\n                  </div>\n                </div>\n              )}\n\n              {/* Text Content Tab */}\n              {activeTab === 'text' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide">
                    Site Text
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                        Site Title
                      </label>
                      <TextEditableField
                        value={siteTitle}
                        onSave={setSiteTitle}
                        className="text-lg font-heading font-bold text-black"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                        Tagline
                      </label>
                      <TextEditableField
                        value={siteTagline}
                        onSave={setSiteTagline}
                        className="text-sm text-black/70"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CMS Collections Info */}
              <div className="bg-black/5 border border-black/10 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-black mb-3 uppercase tracking-wide">
                  Manage Content
                </h3>
                <p className="text-xs text-black/60 mb-4">
                  Edit all your site content directly from the CMS:
                </p>
                <ul className="space-y-2 text-xs text-black/50">
                  <li>• Portfolio Projects</li>
                  <li>• Blog Posts & Stories</li>
                  <li>• Client Galleries</li>
                  <li>• Booking Availability</li>
                  <li>• Watermark Settings</li>
                  <li>• Team Members</li>
                  <li>• Services</li>
                </ul>
                <a
                  href="https://manage.wix.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-black/10 hover:bg-black/20 border border-black/20 rounded text-xs text-black transition-all duration-300"
                >
                  Open CMS Dashboard
                </a>
              </div>

              {/* Tips */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-red-600 mb-2">💡 Tips</h3>
                <ul className="text-xs text-red-600/70 space-y-1">
                  <li>• Click any text to edit it inline</li>
                  <li>• Drag & drop images for auto-crop</li>
                  <li>• All changes save automatically</li>
                  <li>• Use CMS for bulk content updates</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
