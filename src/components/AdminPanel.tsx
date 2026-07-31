import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Edit2, LogOut, Music, Calendar, Activity, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuthStore';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';
import MusicManager from './MusicManager';
import BookingManagerPro from './BookingManagerPro';
import MediaHealthTab from './AdminPanel/MediaHealthTab';
import { BaseCrudService } from '@/integrations';
import { Services, HomepageImages, Portfolio, ClientsPress, AboutSection } from '@/entities/index';
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

interface AboutSettings extends AboutSection {}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('photos');
  const [siteTitle, setSiteTitle] = useState('RED2');
  const [siteTagline, setSiteTagline] = useState('BY JORDAN MICHAEL ZUNIGA');
  const [homepageImages, setHomepageImages] = useState<HomepageImages | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [musicSettings, setMusicSettings] = useState<MusicSettings | null>(null);
  const [aboutSettings, setAboutSettings] = useState<AboutSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);

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
          const portfolioResult = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 });
          if (portfolioResult?.items) {
            setPortfolioItems(portfolioResult.items);
          } else {
            setPortfolioItems([]);
          }
        } catch (error) {
          setPortfolioItems([]);
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

        // Admin credentials are NOT read from the CMS. They live in
        // Secrets Manager (ADMIN_USERNAME / ADMIN_PASSWORD) and are only
        // ever compared server-side in /api/auth/admin-check.
        //
        // This used to load the 'admincredentials' collection and pour the
        // stored password straight into a form field. That collection was
        // world-readable, so the password was retrievable by anyone, and
        // the value shown here had no connection to the credentials that
        // actually authenticate you. The collection is now locked to
        // PRIVILEGED and nothing reads it.
      } catch (error) {
        console.error('[ADMIN PANEL] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isOpen]);

  const handleSaveCredentials = async () => {
    setCredentialsError('');
    setCredentialsSuccess('');

    if (!newUsername || !newPassword) {
      setCredentialsError('Username and password are required');
      return;
    }

    if (newPassword.length < 6) {
      setCredentialsError('Password must be at least 6 characters');
      return;
    }

    // Deliberately does NOT write to the CMS.
    //
    // This previously saved the username and password as plaintext into
    // the 'admincredentials' collection and reported "New credentials will
    // be active on next login" - which was never true. Real admin auth
    // compares against ADMIN_USERNAME / ADMIN_PASSWORD from Secrets
    // Manager (see /api/auth/admin-check), and never consults that
    // collection. So the form stored a readable copy of the password
    // while changing nothing about how login actually works.
    //
    // Credentials must be rotated in Secrets Manager. Writing them from
    // the browser would mean shipping them to a data collection, which is
    // the exact problem being removed here.
    setCredentialsError(
      'Admin credentials are stored in Wix Secrets Manager, not in the CMS. ' +
      'Update ADMIN_USERNAME / ADMIN_PASSWORD there (Developer Tools → Secrets Manager), ' +
      'then republish. Saving them here would store your password in a data collection.'
    );
    setIsSavingCredentials(false);
  };

  if (!isAdminAuthenticated) {
    return null;
  }

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
            className={`fixed right-0 top-0 h-screen w-full max-w-2xl z-50 overflow-y-auto transition-colors ${
              activeTab === 'bookings'
                ? 'bg-black border-l border-white/10'
                : 'bg-white border-l border-black/10'
            }`}
          >
            <div className={`sticky top-0 border-b p-6 flex items-center justify-between transition-colors ${
              activeTab === 'bookings'
                ? 'bg-black border-white/10'
                : 'bg-white border-black/10'
            }`}>
              <div className="flex items-center gap-2">
                <Settings className={`w-5 h-5 ${activeTab === 'bookings' ? 'text-red-500' : 'text-black'}`} />
                <h2 className={`text-lg font-heading font-bold ${activeTab === 'bookings' ? 'text-white' : 'text-black'}`}>Admin Panel</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    logout();
                    onClose();
                  }}
                  className={`p-2 rounded transition-colors ${
                    activeTab === 'bookings'
                      ? 'hover:bg-red-500/20'
                      : 'hover:bg-red-500/10'
                  }`}
                  title="Logout"
                >
                  <LogOut className={`w-4 h-4 ${activeTab === 'bookings' ? 'text-red-400' : 'text-red-500'}`} />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded transition-colors ${
                    activeTab === 'bookings'
                      ? 'hover:bg-white/10'
                      : 'hover:bg-black/5'
                  }`}
                >
                  <X className={`w-5 h-5 ${activeTab === 'bookings' ? 'text-white/60' : 'text-black/60'}`} />
                </button>
              </div>
            </div>

            <div className="sticky top-16 border-b px-6 py-4 flex gap-2 overflow-x-auto bg-black border-white/10">
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'photos'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                Site Photos
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'portfolio'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('sponsors')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'sponsors'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                Sponsors
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'music'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                <Music className="w-3 h-3" />
                Music
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'about'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'text'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                Text Content
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'credentials'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                <Lock className="w-3 h-3" />
                Credentials
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'bookings'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:text-red-500'
                }`}
              >
                <Calendar className="w-3 h-3" />
                Bookings
              </button>
            </div>

            <div className="p-6 space-y-8">
              {activeTab === 'credentials' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Admin Credentials
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-xs font-heading font-bold text-blue-600 mb-2">ℹ️ Credentials Management</h4>
                      <p className="text-xs text-blue-600/70">
                        Set your admin login credentials here. These credentials will be stored in the CMS and used for authentication. Changes take effect on your next login.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                        Admin Username
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter admin username"
                        className="w-full px-4 py-2 border border-black/10 rounded text-sm text-black focus:outline-none focus:border-black/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                        Admin Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter admin password (min 6 characters)"
                        className="w-full px-4 py-2 border border-black/10 rounded text-sm text-black focus:outline-none focus:border-black/30 transition-all"
                      />
                      <p className="text-xs text-black/40 mt-1">Minimum 6 characters required</p>
                    </div>

                    {credentialsError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{credentialsError}</p>
                      </motion.div>
                    )}

                    {credentialsSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-start gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-600">{credentialsSuccess}</p>
                      </motion.div>
                    )}

                    <button
                      onClick={handleSaveCredentials}
                      disabled={isSavingCredentials || !newUsername || !newPassword}
                      className="w-full px-4 py-3 bg-black text-white rounded text-sm font-heading font-bold uppercase tracking-wide hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSavingCredentials ? 'Saving...' : 'Save Credentials'}
                    </button>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <h4 className="text-xs font-heading font-bold text-yellow-600 mb-2">⚠️ Important</h4>
                      <ul className="text-xs text-yellow-600/70 space-y-1">
                        <li>• Credentials are stored securely in the CMS</li>
                        <li>• You'll need to log in again with new credentials</li>
                        <li>• Keep your password safe and unique</li>
                        <li>• Changes take effect immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="bg-gradient-to-b from-black to-black/95 border border-white/10 rounded-lg p-6">
                  <BookingManagerPro />
                </div>
              )}

              {activeTab === 'photos' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide">
                    Manage Site Photos
                  </h3>
                  <div className="space-y-6">
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

              {activeTab === 'music' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Background Music Settings
                  </h3>
                  <div className="space-y-6">
                    {musicSettings ? (
                      <>
                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">
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
                              } catch (error) {
                                console.error('Error updating music settings:', error);
                              }
                            }}
                            className={`px-4 py-2 rounded text-sm font-heading font-bold uppercase tracking-wide transition-all ${
                              musicSettings.isEnabled
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                          >
                            {musicSettings.isEnabled ? '✓ Enabled' : '✗ Disabled'}
                          </button>
                        </div>

                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                            Music Title
                          </label>
                          <TextEditableField
                            value={musicSettings.musicTitle || ''}
                            onSave={async (newTitle) => {
                              try {
                                await BaseCrudService.update('musicsettings', {
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
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">
                            Volume Level: {musicSettings.volume || 50}%
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
                                await BaseCrudService.update('musicsettings', {
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

                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-3">
                            Loop Music
                          </label>
                          <button
                            onClick={async () => {
                              try {
                                const newState = !musicSettings.loopMusic;
                                await BaseCrudService.update('musicsettings', {
                                  _id: musicSettings._id,
                                  loopMusic: newState
                                });
                                setMusicSettings({ ...musicSettings, loopMusic: newState });
                              } catch (error) {
                                console.error('Error updating loop setting:', error);
                              }
                            }}
                            className={`px-4 py-2 rounded text-sm font-heading font-bold uppercase tracking-wide transition-all ${
                              musicSettings.loopMusic
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                          >
                            {musicSettings.loopMusic ? '✓ Looping' : '✗ No Loop'}
                          </button>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
                          <h4 className="text-xs font-heading font-bold text-blue-600 mb-2">ℹ️ Music Upload</h4>
                          <p className="text-xs text-blue-600/70">
                            Click "Upload Music" to select an audio file from your computer. Supported formats: MP3, WAV, OGG, WebM (Max 500MB). The file will be automatically uploaded and saved to the CMS.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-sm text-yellow-600">No music settings found. Please add one in the CMS.</p>
                        <a
                          href="https://manage.wix.com/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-xs text-yellow-600 transition-all duration-300"
                        >
                          Open CMS to Add Music Settings
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-black mb-6 uppercase tracking-wide">
                    About Section Settings
                  </h3>
                  <div className="space-y-6">
                    {aboutSettings ? (
                      <>
                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                            About Text
                          </label>
                          <textarea
                            value={aboutSettings.aboutText || ''}
                            onChange={(e) => {
                              setAboutSettings({ ...aboutSettings, aboutText: e.target.value });
                            }}
                            className="w-full p-3 border border-black/10 rounded text-sm text-black resize-none h-32 focus:outline-none focus:border-black/30"
                            placeholder="Enter about section text..."
                          />
                        </div>

                        <div>
                          <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                            Font Family
                          </label>
                          <select
                            value={aboutSettings.fontFamily || 'cormorant-garamond-v2'}
                            onChange={(e) => {
                              const newFont = e.target.value;
                              setAboutSettings({ ...aboutSettings, fontFamily: newFont });
                            }}
                            className="w-full p-3 border border-black/10 rounded text-sm text-black focus:outline-none focus:border-black/30"
                          >
                            <option value="cormorant-garamond-v2">Cormorant Garamond</option>
                            <option value="font-heading">Heading Font</option>
                            <option value="font-paragraph">Paragraph Font</option>
                            <option value="font-mono">Mono Font</option>
                            <option value="roboto">Roboto</option>
                            <option value="montserrat">Montserrat</option>
                            <option value="poppins-extralight">Poppins</option>
                            <option value="cinzel">Cinzel</option>
                            <option value="playfair-display">Playfair Display</option>
                            <option value="noticia-text">Noticia Text</option>
                          </select>
                        </div>

                        <button
                          onClick={async () => {
                            setIsSavingAbout(true);
                            try {
                              await BaseCrudService.update('about', {
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
                          className="w-full px-4 py-3 bg-black text-white rounded text-sm font-heading font-bold uppercase tracking-wide hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isSavingAbout ? 'Saving...' : 'Apply Changes'}
                        </button>

                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <h4 className="text-xs font-heading font-bold text-green-600 mb-2">✓ Manual Save</h4>
                          <p className="text-xs text-green-600/70">
                            Click "Apply Changes" to save your about section text and font settings to the CMS.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-sm text-yellow-600">No about settings found. Please add one in the CMS.</p>
                        <a
                          href="https://manage.wix.com/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-xs text-yellow-600 transition-all duration-300"
                        >
                          Open CMS to Add About Settings
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
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
