import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Edit2, Music, Calendar, LogOut, Trash2, Upload, Plus, AlertCircle } from 'lucide-react';
import { useMember } from '@/integrations';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';
import MusicManager from './MusicManager';
import BackgroundMusicManager from './AdminPanel/sections/BackgroundMusicManager';
import BookingManagerPro from './BookingManagerPro';
import RubberBandPhotosManager from './AdminPanel/sections/RubberBandPhotosManager';
import SplashpageManager from './AdminPanel/sections/SplashpageManager';
import BehindTheScenesManager from './AdminPanel/sections/BehindTheScenesManager';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages, ClientsPress, AboutSection, Portfolio, MusicSettings } from '@/entities/index';
import { playClickSound } from '@/lib/click-sound';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_GALLERY_SLOTS = 90;

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AboutSettings extends AboutSection {}

interface GallerySlot {
  slotNumber: number; // 1-MAX_GALLERY_SLOTS
  itemId: string; // CMS item _id
  image?: string; // Image URL
  caption?: string;
  altText?: string;
}

interface SponsorEditState {
  [key: string]: {
    clientName: string;
    category: string;
    externalLink: string;
  };
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
  const [sponsorEdits, setSponsorEdits] = useState<SponsorEditState>({});
  const [uploadingSponsorId, setUploadingSponsorId] = useState<string | null>(null);

  // Initialize gallery with self-healing
  const initializeGallery = useCallback(async () => {
    setIsInitializingGallery(true);
    try {
      // Fetch all existing portfolio items
      const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 100 });
      const existingItems = result?.items || [];
      
      // Create a map of existing items by displayOrder
      const itemsByOrder = new Map<number, Portfolio>();
      existingItems.forEach(item => {
        if (item.displayOrder && item.displayOrder >= 1 && item.displayOrder <= MAX_GALLERY_SLOTS) {
          itemsByOrder.set(item.displayOrder, item);
        }
      });

      // Self-heal: Create missing slots
      const slots: GallerySlot[] = [];
      for (let i = 1; i <= MAX_GALLERY_SLOTS; i++) {
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

  const handleSponsorFieldChange = (sponsorId: string, field: string, value: string) => {
    setSponsorEdits(prev => ({
      ...prev,
      [sponsorId]: {
        ...prev[sponsorId],
        [field]: value,
      },
    }));
  };

  const handleSaveSponsor = async (sponsor: ClientsPress) => {
    const edits = sponsorEdits[sponsor._id];
    if (!edits) return;

    try {
      await adminCms.update('clientspress', {
        _id: sponsor._id,
        clientName: edits.clientName,
        category: edits.category,
        externalLink: edits.externalLink,
      });
      
      // Update local state
      setSponsors(sponsors.map(s => 
        s._id === sponsor._id 
          ? { ...s, clientName: edits.clientName, category: edits.category, externalLink: edits.externalLink }
          : s
      ));
      
      // Clear edits
      setSponsorEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[sponsor._id];
        return newEdits;
      });
    } catch (error) {
      console.error('Failed to save sponsor:', error);
    }
  };

  const handleDeleteSponsor = async (sponsorId: string) => {
    try {
      await adminCms.delete('clientspress', sponsorId);
      setSponsors(sponsors.filter(s => s._id !== sponsorId));
      setSponsorEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[sponsorId];
        return newEdits;
      });
    } catch (error) {
      console.error('Failed to delete sponsor:', error);
    }
  };

  const handleAddSponsor = async () => {
    try {
      const newSponsor: ClientsPress = {
        _id: crypto.randomUUID(),
        clientName: '',
        clientLogo: undefined,
        externalLink: '',
        highlightDescription: '',
        dateOfFeature: undefined,
        category: '',
      };
      
      await adminCms.create('clientspress', newSponsor);
      setSponsors([...sponsors, newSponsor]);
    } catch (error) {
      console.error('Failed to add sponsor:', error);
    }
  };

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

              {/* Work Tab - Gallery Management */}
              {activeTab === 'work' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Work Gallery ({MAX_GALLERY_SLOTS} Slots)
                    </h3>
                    <p className="text-xs text-black/60">Manage your portfolio with a deterministic {MAX_GALLERY_SLOTS}-image gallery</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-xs text-blue-700">
                      Click any slot to upload an image. Empty slots are automatically created and maintained. Gallery order persists (Slot 1-{MAX_GALLERY_SLOTS}).
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
                  {homepageImages ? (
                    <div className="space-y-6">
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
                      <ImageUploadManager
                        label="About Section Image"
                        currentImage={homepageImages.aboutSectionImage}
                        collectionId="homepageimages"
                        itemId={homepageImages._id}
                        fieldName="aboutSectionImage"
                        onImageUpload={async (url) => {
                          try {
                            await adminCms.update('homepageimages', {
                              _id: homepageImages._id,
                              aboutSectionImage: url,
                            });
                            setHomepageImages({ ...homepageImages, aboutSectionImage: url });
                          } catch (error) {
                            console.error('Failed to update about section image:', error);
                          }
                        }}
                        onImageDelete={async () => {
                          try {
                            await adminCms.update('homepageimages', {
                              _id: homepageImages._id,
                              aboutSectionImage: undefined,
                            });
                            setHomepageImages({ ...homepageImages, aboutSectionImage: undefined });
                          } catch (error) {
                            console.error('Failed to delete about section image:', error);
                          }
                        }}
                      />
                      <ImageUploadManager
                        label="Contact Background Image"
                        currentImage={homepageImages.contactBackgroundImage}
                        collectionId="homepageimages"
                        itemId={homepageImages._id}
                        fieldName="contactBackgroundImage"
                        onImageUpload={async (url) => {
                          try {
                            await adminCms.update('homepageimages', {
                              _id: homepageImages._id,
                              contactBackgroundImage: url,
                            });
                            setHomepageImages({ ...homepageImages, contactBackgroundImage: url });
                          } catch (error) {
                            console.error('Failed to update contact background image:', error);
                          }
                        }}
                        onImageDelete={async () => {
                          try {
                            await adminCms.update('homepageimages', {
                              _id: homepageImages._id,
                              contactBackgroundImage: undefined,
                            });
                            setHomepageImages({ ...homepageImages, contactBackgroundImage: undefined });
                          } catch (error) {
                            console.error('Failed to delete contact background image:', error);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-heading font-bold text-red-900">Data Failed to Load</p>
                        <p className="text-xs text-red-700 mt-1">Unable to load homepage images. Please try refreshing the admin panel.</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-black/10 pt-6">
                    <h4 className="text-sm font-heading font-bold text-black mb-4 uppercase tracking-wide">Splashpage</h4>
                    <SplashpageManager />
                  </div>
                  
                  <div className="border-t border-black/10 pt-6">
                    <h4 className="text-sm font-heading font-bold text-black mb-4 uppercase tracking-wide">Behind The Scenes</h4>
                    <BehindTheScenesManager />
                  </div>
                  
                  <div className="border-t border-black/10 pt-6">
                    <h4 className="text-sm font-heading font-bold text-black mb-4 uppercase tracking-wide">Carousel Images</h4>
                    <div className="bg-gradient-to-b from-black to-black/95 border border-white/10 rounded-lg p-6">
                      <RubberBandPhotosManager />
                    </div>
                  </div>
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
                  
                  <div className="space-y-4">
                    {sponsors.map((sponsor) => {
                      const edits = sponsorEdits[sponsor._id];
                      const isEditing = !!edits;
                      
                      return (
                        <div key={sponsor._id} className="border border-black/10 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-4">
                            {sponsor.clientLogo && (
                              <div className="flex-shrink-0">
                                <Image
                                  src={sponsor.clientLogo}
                                  alt={sponsor.clientName || 'Sponsor'}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                placeholder="Client Name"
                                value={isEditing ? edits.clientName : (sponsor.clientName || '')}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setSponsorEdits(prev => ({
                                      ...prev,
                                      [sponsor._id]: {
                                        clientName: e.target.value,
                                        category: sponsor.category || '',
                                        externalLink: sponsor.externalLink || '',
                                      },
                                    }));
                                  } else {
                                    handleSponsorFieldChange(sponsor._id, 'clientName', e.target.value);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-black/10 rounded"
                              />
                              <input
                                type="text"
                                placeholder="Category"
                                value={isEditing ? edits.category : (sponsor.category || '')}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setSponsorEdits(prev => ({
                                      ...prev,
                                      [sponsor._id]: {
                                        clientName: sponsor.clientName || '',
                                        category: e.target.value,
                                        externalLink: sponsor.externalLink || '',
                                      },
                                    }));
                                  } else {
                                    handleSponsorFieldChange(sponsor._id, 'category', e.target.value);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-black/10 rounded"
                              />
                              <input
                                type="text"
                                placeholder="External Link"
                                value={isEditing ? edits.externalLink : (sponsor.externalLink || '')}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setSponsorEdits(prev => ({
                                      ...prev,
                                      [sponsor._id]: {
                                        clientName: sponsor.clientName || '',
                                        category: sponsor.category || '',
                                        externalLink: e.target.value,
                                      },
                                    }));
                                  } else {
                                    handleSponsorFieldChange(sponsor._id, 'externalLink', e.target.value);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-black/10 rounded"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveSponsor(sponsor)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSponsorEdits(prev => {
                                      const newEdits = { ...prev };
                                      delete newEdits[sponsor._id];
                                      return newEdits;
                                    });
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSponsorEdits(prev => ({
                                      ...prev,
                                      [sponsor._id]: {
                                        clientName: sponsor.clientName || '',
                                        category: sponsor.category || '',
                                        externalLink: sponsor.externalLink || '',
                                      },
                                    }));
                                  }}
                                >
                                  Edit
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSponsor(sponsor._id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={handleAddSponsor}
                    className="w-full bg-black hover:bg-black/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Sponsor
                  </Button>
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
