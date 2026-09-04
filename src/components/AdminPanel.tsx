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
import { Image } from '@/components/ui/image';

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
          // Create missing slot - NOW USING adminCms.create
          const newItem: Portfolio = {
            _id: crypto.randomUUID(),
            displayOrder: i,
            image: undefined,
            caption: '',
            altText: '',
          };
          try {
            await adminCms.create('portfolioimages', newItem);
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
        // Load data in parallel with Promise.allSettled to avoid rate limiting
        const results = await Promise.allSettled([
          BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 1 }),
          BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 50 }),
          BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 1 }),
          BaseCrudService.getAll<AboutSection>('about', {}, { limit: 1 }),
        ]);

        // Handle homepage images
        if (results[0].status === 'fulfilled' && results[0].value?.items?.length > 0) {
          setHomepageImages(results[0].value.items[0]);
        } else {
          setHomepageImages(null);
        }

        // Handle sponsors
        if (results[1].status === 'fulfilled' && results[1].value?.items) {
          setSponsors(results[1].value.items);
        } else {
          setSponsors([]);
        }

        // Handle music settings
        if (results[2].status === 'fulfilled' && results[2].value?.items?.length > 0) {
          setMusicSettings(results[2].value.items[0]);
        } else {
          setMusicSettings(null);
        }

        // Handle about settings
        if (results[3].status === 'fulfilled' && results[3].value?.items?.length > 0) {
          setAboutSettings(results[3].value.items[0]);
        } else {
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
                                  <Image
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
                                      // Update the CMS item with the new image - NOW USING adminCms.update
                                      await adminCms.update('portfolioimages', {
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
                                      // Clear the image from the CMS item - NOW USING adminCms.update
                                      await adminCms.update('portfolioimages', {
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
                                    // NOW USING adminCms.update
                                    await adminCms.update('portfolioimages', {
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Homepage Photos
                    </h3>
                    <p className="text-xs text-black/60">Manage hero, about, and contact section images</p>
                  </div>
                  {homepageImages && (
                    <ImageUploadManager
                      label="Hero Image"
                      currentImage={homepageImages.heroImage}
                      collectionId="homepageimages"
                      itemId={homepageImages._id}
                      fieldName="heroImage"
                      onImageUpload={async (url) => {
                        try {
                          await adminCms.update('homepageimages', {
                            _id: homepageImages._id,
                            heroImage: url,
                          });
                          setHomepageImages({ ...homepageImages, heroImage: url });
                        } catch (error) {
                          console.error('Failed to update hero image:', error);
                        }
                      }}
                      onImageDelete={async () => {
                        try {
                          await adminCms.update('homepageimages', {
                            _id: homepageImages._id,
                            heroImage: undefined,
                          });
                          setHomepageImages({ ...homepageImages, heroImage: undefined });
                        } catch (error) {
                          console.error('Failed to delete hero image:', error);
                        }
                      }}
                    />
                  )}
                </div>
              )}

              {/* Sponsors Tab */}
              {activeTab === 'sponsors' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Sponsors & Press
                    </h3>
                    <p className="text-xs text-black/60">Manage client logos and press mentions</p>
                  </div>
                  <div className="bg-gradient-to-b from-black to-black/95 border border-white/10 rounded-lg p-6">
                    <RubberBandPhotosManager />
                  </div>
                </div>
              )}

              {/* Music Tab */}
              {activeTab === 'music' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Background Music
                    </h3>
                    <p className="text-xs text-black/60">Configure background music settings</p>
                  </div>
                  <div className="bg-gradient-to-b from-black to-black/95 border border-white/10 rounded-lg p-6">
                    <BackgroundMusicManager />
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      About Section
                    </h3>
                    <p className="text-xs text-black/60">Edit about page content and image</p>
                  </div>
                  {aboutSettings && (
                    <div className="space-y-4">
                      <TextEditableField
                        label="Heading"
                        value={aboutSettings.heading || ''}
                        onChange={async (value) => {
                          setIsSavingAbout(true);
                          try {
                            await adminCms.update('about', {
                              _id: aboutSettings._id,
                              heading: value,
                            });
                            setAboutSettings({ ...aboutSettings, heading: value });
                          } catch (error) {
                            console.error('Failed to update heading:', error);
                          } finally {
                            setIsSavingAbout(false);
                          }
                        }}
                        isSaving={isSavingAbout}
                      />
                      <TextEditableField
                        label="Subheading"
                        value={aboutSettings.subheading || ''}
                        onChange={async (value) => {
                          setIsSavingAbout(true);
                          try {
                            await adminCms.update('about', {
                              _id: aboutSettings._id,
                              subheading: value,
                            });
                            setAboutSettings({ ...aboutSettings, subheading: value });
                          } catch (error) {
                            console.error('Failed to update subheading:', error);
                          } finally {
                            setIsSavingAbout(false);
                          }
                        }}
                        isSaving={isSavingAbout}
                      />
                      <TextEditableField
                        label="About Text"
                        value={aboutSettings.aboutText || ''}
                        onChange={async (value) => {
                          setIsSavingAbout(true);
                          try {
                            await adminCms.update('about', {
                              _id: aboutSettings._id,
                              aboutText: value,
                            });
                            setAboutSettings({ ...aboutSettings, aboutText: value });
                          } catch (error) {
                            console.error('Failed to update about text:', error);
                          } finally {
                            setIsSavingAbout(false);
                          }
                        }}
                        isSaving={isSavingAbout}
                        isTextarea
                      />
                      {aboutSettings.mainImage && (
                        <ImageUploadManager
                          label="Main Image"
                          currentImage={aboutSettings.mainImage}
                          collectionId="about"
                          itemId={aboutSettings._id}
                          fieldName="mainImage"
                          onImageUpload={async (url) => {
                            try {
                              await adminCms.update('about', {
                                _id: aboutSettings._id,
                                mainImage: url,
                              });
                              setAboutSettings({ ...aboutSettings, mainImage: url });
                            } catch (error) {
                              console.error('Failed to update main image:', error);
                            }
                          }}
                          onImageDelete={async () => {
                            try {
                              await adminCms.update('about', {
                                _id: aboutSettings._id,
                                mainImage: undefined,
                              });
                              setAboutSettings({ ...aboutSettings, mainImage: undefined });
                            } catch (error) {
                              console.error('Failed to delete main image:', error);
                            }
                          }}
                        />
                      )}
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
