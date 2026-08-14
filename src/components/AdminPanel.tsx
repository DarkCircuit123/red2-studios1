import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Edit2, Music, Calendar, LogOut, Trash2, Upload } from 'lucide-react';
import { useMember } from '@/integrations';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';
import MusicManager from './MusicManager';
import BackgroundMusicManager from './AdminPanel/sections/BackgroundMusicManager';
import BookingManagerPro from './BookingManagerPro';
import RubberBandPhotosManager from './AdminPanel/sections/RubberBandPhotosManager';
import SplashpageManager from './AdminPanel/sections/SplashpageManager';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages, ClientsPress, AboutSection, Portfolio, MusicSettings } from '@/entities/index';
import { playClickSound } from '@/lib/click-sound';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AboutSettings extends AboutSection {}

interface GallerySlot {
  slotNumber: number; // 1-30
  itemId: string; // CMS item _id
  image?: string; // Image URL
  caption?: string;
  altText?: string;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { member, actions: memberActions } = useMember();
  const [activeTab, setActiveTab] = useState('photos');
  const [homepageImages, setHomepageImages] = useState<HomepageImages | null>(null);
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [musicSettings, setMusicSettings] = useState<MusicSettings | null>(null);
  const [aboutSettings, setAboutSettings] = useState<AboutSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<Portfolio[]>([]);
  const [gallerySlots, setGallerySlots] = useState<GallerySlot[]>([]);
  const [isInitializingGallery, setIsInitializingGallery] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // Initialize 30-slot gallery with self-healing
  const initializeGallery = useCallback(async () => {
    setIsInitializingGallery(true);
    try {
      // Fetch all existing portfolio items
      const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 100 });
      const existingItems = result?.items || [];
      
      // Create a map of existing items by displayOrder
      const itemsByOrder = new Map<number, Portfolio>();
      existingItems.forEach(item => {
        if (item.displayOrder && item.displayOrder >= 1 && item.displayOrder <= 30) {
          itemsByOrder.set(item.displayOrder, item);
        }
      });

      // Self-heal: Create missing slots
      const slots: GallerySlot[] = [];
      for (let i = 1; i <= 30; i++) {
        const existing = itemsByOrder.get(i);
        if (existing) {
          slots.push({
            slotNumber: i,
            itemId: existing._id,
            image: existing.image,
            caption: existing.caption,
            altText: existing.altText,
          });
        } else {
          // Create missing slot
          const newItem: Portfolio = {
            _id: crypto.randomUUID(),
            displayOrder: i,
            image: undefined,
            caption: '',
            altText: '',
          };
          try {
            await BaseCrudService.create('portfolioimages', newItem);
            slots.push({
              slotNumber: i,
              itemId: newItem._id,
              image: undefined,
              caption: '',
              altText: '',
            });
          } catch (error) {
            console.error(`Failed to create slot ${i}:`, error);
          }
        }
      }

      setGallerySlots(slots);
      setPortfolioImages(slots.map(s => ({
        _id: s.itemId,
        displayOrder: s.slotNumber,
        image: s.image,
        caption: s.caption,
        altText: s.altText,
      })));
    } catch (error) {
      console.error('Failed to initialize gallery:', error);
    } finally {
      setIsInitializingGallery(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        try {
          const homepageImagesResult = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 1 });
          if (homepageImagesResult?.items && homepageImagesResult.items.length > 0) {
            setHomepageImages(homepageImagesResult.items[0]);
          }
        } catch (error) {
          setHomepageImages(null);
        }

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

        try {
          const musicResult = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 1 });
          if (musicResult?.items && musicResult.items.length > 0) {
            setMusicSettings(musicResult.items[0]);
          }
        } catch (error) {
          console.error('Failed to load music settings:', error);
          setMusicSettings(null);
        }

        try {
          const aboutResult = await BaseCrudService.getAll<AboutSection>('about', {}, { limit: 1 });
          if (aboutResult?.items && aboutResult.items.length > 0) {
            setAboutSettings(aboutResult.items[0]);
          }
        } catch (error) {
          setAboutSettings(null);
        }

        // Initialize gallery on work tab open
        if (activeTab === 'work') {
          await initializeGallery();
        }
      } catch (error) {
        console.error('[ADMIN PANEL] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, activeTab, initializeGallery]);

  const handleLogout = useCallback(async () => {
    playClickSound();
    try {
      console.log('[ADMIN PANEL] Logout button clicked');
      await memberActions.logout();
      console.log('[ADMIN PANEL] Logout completed');
      onClose();
    } catch (error) {
      console.error('[ADMIN PANEL] Logout error:', error);
    }
  }, [memberActions, onClose]);

  if (!isOpen) {
    return null;
  }

  const tabs = [
    { id: 'photos', label: 'Photos', icon: Upload },
    { id: 'work', label: 'Work', icon: Upload },
    { id: 'sponsors', label: 'Sponsors', icon: Upload },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'about', label: 'About', icon: Edit2 },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-screen w-full max-w-3xl z-50 overflow-y-auto bg-white border-l border-black/10"
          >
            {/* Header */}
            <div className="sticky top-0 border-b border-black/10 bg-white p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/5 rounded-lg">
                  <Settings className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-black">Admin Panel</h2>
                  <p className="text-xs text-black/50">Manage your site content</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5 text-black/60" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-16 border-b border-black/10 bg-white px-6 py-3 overflow-x-auto z-10">
              <div className="flex gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? 'bg-black text-white shadow-md' : 'bg-black/5 text-black hover:bg-black/10'}`}
                    >
                      <Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="bg-gradient-to-b from-black to-black/95 border border-white/10 rounded-lg p-6">
                  <BookingManagerPro />
                </div>
              )}

              {/* Work Tab - 30-Slot Gallery Management */}
              {activeTab === 'work' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Work Gallery (30 Slots)
                    </h3>
                    <p className="text-xs text-black/60">Manage your portfolio with a deterministic 30-image gallery</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-xs text-blue-700">
                      Click any slot to upload an image. Empty slots are automatically created and maintained. Gallery order persists (Slot 1-30).
                    </p>
                  </div>

                  {isInitializingGallery && (
                    <div className="text-center py-8">
                      <p className="text-xs text-black/60">Initializing gallery...</p>
                    </div>
                  )}

                  {!isInitializingGallery && gallerySlots.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-5 gap-3">
                        {gallerySlots.map((slot) => (
                          <div
                            key={slot.slotNumber}
                            className="relative group"
                          >
                            <div className="aspect-square border-2 border-dashed border-black/20 rounded-lg overflow-hidden bg-black/2 hover:border-black/40 transition-colors cursor-pointer relative"
                              onClick={() => setUploadingSlot(slot.slotNumber)}
                            >
                              {slot.image ? (
                                <>
                                  <img
                                    src={slot.image}
                                    alt={`Slot ${slot.slotNumber}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                      Replace
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <Upload className="w-4 h-4 text-black/40 mb-1" />
                                  <span className="text-xs text-black/40 font-bold">Slot {slot.slotNumber}</span>
                                </div>
                              )}
                            </div>

                            {uploadingSlot === slot.slotNumber && (
                              <div className="absolute inset-0 z-50">
                                <ImageUploadManager
                                  label={`Upload to Slot ${slot.slotNumber}`}
                                  currentImage={slot.image}
                                  collectionId="portfolioimages"
                                  itemId={slot.itemId}
                                  fieldName="image"
                                  onImageUpload={async (url) => {
                                    try {
                                      // Update the CMS item with the new image
                                      await BaseCrudService.update('portfolioimages', {
                                        _id: slot.itemId,
                                        image: url,
                                      });
                                      // Update local state
                                      const updatedSlots = gallerySlots.map(s =>
                                        s.slotNumber === slot.slotNumber
                                          ? { ...s, image: url }
                                          : s
                                      );
                                      setGallerySlots(updatedSlots);
                                      setUploadingSlot(null);
                                    } catch (error) {
                                      console.error(`Failed to update slot ${slot.slotNumber}:`, error);
                                    }
                                  }}
                                  onImageDelete={async () => {
                                    try {
                                      // Clear the image from the CMS item
                                      await BaseCrudService.update('portfolioimages', {
                                        _id: slot.itemId,
                                        image: undefined,
                                      });
                                      // Update local state
                                      const updatedSlots = gallerySlots.map(s =>
                                        s.slotNumber === slot.slotNumber
                                          ? { ...s, image: undefined }
                                          : s
                                      );
                                      setGallerySlots(updatedSlots);
                                      setUploadingSlot(null);
                                    } catch (error) {
                                      console.error(`Failed to delete image from slot ${slot.slotNumber}:`, error);
                                    }
                                  }}
                                />
                              </div>
                            )}

                            {slot.image && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await BaseCrudService.update('portfolioimages', {
                                      _id: slot.itemId,
                                      image: undefined,
                                    });
                                    const updatedSlots = gallerySlots.map(s =>
                                      s.slotNumber === slot.slotNumber
                                        ? { ...s, image: undefined }
                                        : s
                                    );
                                    setGallerySlots(updatedSlots);
                                  } catch (error) {
                                    console.error(`Failed to delete image from slot ${slot.slotNumber}:`, error);
                                  }
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-8">
                  {/* Splash Screen Logo Section */}
                  <div>
                    <div>
                      <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                        Splash Screen Logo
                      </h3>
                      <p className="text-xs text-black/60">Manage the splash screen logo displayed on page load</p>
                    </div>
                    <div className="mt-6">
                      <SplashpageManager />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-black/10 pt-8">
                    {/* Rubber Band Carousel Section */}
                    <div>
                      <RubberBandPhotosManager />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-black/10 pt-8">
                    <div>
                      <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                        Site Photos
                      </h3>
                      <p className="text-xs text-black/60">Manage hero, about, and contact section images</p>
                    </div>

                    <div className="space-y-6 mt-6">
                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-3 font-bold">
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

                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-3 font-bold">
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

                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-3 font-bold">
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
                </div>
              )}

              {/* Sponsors Tab */}
              {activeTab === 'sponsors' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Sponsors
                    </h3>
                    <p className="text-xs text-black/60">{sponsors.length} sponsors found</p>
                  </div>

                  <div className="space-y-8 max-h-96 overflow-y-auto">
                    {sponsors.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-black/60">No sponsors found. Add sponsors in the CMS.</p>
                      </div>
                    ) : (
                      sponsors.map((sponsor) => (
                        <div key={sponsor._id} className="border-t border-black/10 pt-6">
                          <h4 className="text-xs font-heading font-bold text-black mb-4 uppercase tracking-wide">
                            {sponsor.clientName || 'Untitled Sponsor'}
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                                Sponsor Name
                              </label>
                              <TextEditableField
                                value={sponsor.clientName || ''}
                                onSave={async (newName) => {
                                  try {
                                    await adminCms.update('clientspress', {
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
                            <div>
                              <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Background Music
                    </h3>
                    <p className="text-xs text-black/60">Manage background music settings</p>
                  </div>

                  {musicSettings ? (
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-3 font-bold">
                          Upload Music File
                        </label>
                        <MusicManager
                          label="Upload Music"
                          currentMusicUrl={musicSettings.musicUrl}
                          collectionId="musicsettings"
                          itemId={musicSettings._id}
                          fieldName="musicUrl"
                          onMusicUpload={(url) => {
                            setMusicSettings({ ...musicSettings, musicUrl: url });
                          }}
                          onMusicDelete={() => {
                            setMusicSettings({ ...musicSettings, musicUrl: undefined });
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                            Enable Music
                          </label>
                          <button
                            onClick={async () => {
                              try {
                                const newState = !musicSettings.isEnabled;
                                await adminCms.update('musicsettings', {
                                  _id: musicSettings._id,
                                  isEnabled: newState
                                });
                                setMusicSettings({ ...musicSettings, isEnabled: newState });
                              } catch (error) {
                                console.error('Error updating music settings:', error);
                              }
                            }}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-heading font-bold uppercase tracking-wide transition-all ${
                              musicSettings.isEnabled
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-white hover:bg-gray-400'
                            }`}
                          >
                            {musicSettings.isEnabled ? '✓ Enabled' : '✗ Disabled'}
                          </button>
                        </div>

                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                            Loop Music
                          </label>
                          <button
                            onClick={async () => {
                              try {
                                const newState = !musicSettings.loopMusic;
                                await adminCms.update('musicsettings', {
                                  _id: musicSettings._id,
                                  loopMusic: newState
                                });
                                setMusicSettings({ ...musicSettings, loopMusic: newState });
                              } catch (error) {
                                console.error('Error updating loop setting:', error);
                              }
                            }}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-heading font-bold uppercase tracking-wide transition-all ${
                              musicSettings.loopMusic
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-white hover:bg-gray-400'
                            }`}
                          >
                            {musicSettings.loopMusic ? '✓ Looping' : '✗ No Loop'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                          Music Title
                        </label>
                        <TextEditableField
                          value={musicSettings.musicTitle || ''}
                          onSave={async (newTitle) => {
                            try {
                              await adminCms.update('musicsettings', {
                                _id: musicSettings._id,
                                musicTitle: newTitle
                              });
                              setMusicSettings({ ...musicSettings, musicTitle: newTitle });
                            } catch (error) {
                              console.error('Error updating music title:', error);
                            }
                          }}
                          className="text-sm text-black"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-3 font-bold">
                          Volume: {musicSettings.volume || 50}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={musicSettings.volume || 50}
                          onChange={async (e) => {
                            const newVolume = parseInt(e.target.value);
                            setMusicSettings({ ...musicSettings, volume: newVolume });
                            try {
                              await adminCms.update('musicsettings', {
                                _id: musicSettings._id,
                                volume: newVolume
                              });
                            } catch (error) {
                              console.error('Error updating volume:', error);
                            }
                          }}
                          className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700 mb-3">No music settings found. Upload your first track to get started.</p>
                      </div>
                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-3 font-bold">
                          Upload Music File
                        </label>
                        <MusicManager
                          label="Upload Music"
                          currentMusicUrl={undefined}
                          collectionId="musicsettings"
                          fieldName="musicUrl"
                          onMusicUpload={async (url) => {
                            try {
                              // Create new Music Settings record with the uploaded URL
                              const newMusicSettings: MusicSettings = {
                                _id: crypto.randomUUID(),
                                musicUrl: url,
                                musicTitle: 'Background Music',
                                isEnabled: true,
                                volume: 50,
                                loopMusic: true,
                                artist: '',
                                album: '',
                                genre: '',
                                duration: '',
                                isDefaultHomepageTrack: true,
                              };
                              await BaseCrudService.create('musicsettings', newMusicSettings);
                              setMusicSettings(newMusicSettings);
                              console.log('[ADMIN PANEL] Music Settings record created:', newMusicSettings._id);
                            } catch (error) {
                              console.error('[ADMIN PANEL] Error creating Music Settings record:', error);
                            }
                          }}
                          onMusicDelete={() => {
                            // No-op when no record exists
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      About Section
                    </h3>
                    <p className="text-xs text-black/60">Edit about section content</p>
                  </div>

                  {aboutSettings ? (
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                          About Text
                        </label>
                        <textarea
                          value={aboutSettings.aboutText || ''}
                          onChange={(e) => {
                            setAboutSettings({ ...aboutSettings, aboutText: e.target.value });
                          }}
                          className="w-full p-3 border border-black/10 rounded-lg text-sm text-black resize-none h-32 focus:outline-none focus:ring-2 focus:ring-black/20"
                          placeholder="Enter about section text..."
                        />
                      </div>

                      <div>
                        <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                          Font Family
                        </label>
                        <select
                          value={aboutSettings.fontFamily || 'cormorant-garamond-v2'}
                          onChange={(e) => {
                            setAboutSettings({ ...aboutSettings, fontFamily: e.target.value });
                          }}
                          className="w-full p-3 border border-black/10 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        >
                          <option value="cormorant-garamond-v2">Cormorant Garamond</option>
                          <option value="font-heading">Heading Font</option>
                          <option value="font-paragraph">Paragraph Font</option>
                          <option value="roboto">Roboto</option>
                          <option value="montserrat">Montserrat</option>
                          <option value="poppins-extralight">Poppins</option>
                          <option value="cinzel">Cinzel</option>
                        </select>
                      </div>

                      <button
                        onClick={async () => {
                          setIsSavingAbout(true);
                          try {
                            await adminCms.update('about', {
                              _id: aboutSettings._id,
                              aboutText: aboutSettings.aboutText,
                              fontFamily: aboutSettings.fontFamily
                            });
                            playClickSound();
                          } catch (error) {
                            console.error('Error saving about settings:', error);
                          } finally {
                            setIsSavingAbout(false);
                          }
                        }}
                        disabled={isSavingAbout}
                        className="w-full px-4 py-3 bg-black text-white rounded-lg text-sm font-heading font-bold uppercase tracking-wide hover:bg-black/90 disabled:opacity-50 transition-all"
                      >
                        {isSavingAbout ? 'Saving...' : 'Apply Changes'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-yellow-700 mb-3">No about settings found.</p>
                      <a
                        href="https://manage.wix.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-xs text-yellow-700 transition-all"
                      >
                        Open CMS to Add About Settings
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
