import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Edit2, LogOut, Music, Calendar, Lock, AlertCircle, CheckCircle, Upload, Zap, Database } from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuthStore';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';
import MusicManager from './MusicManager';
import BookingManagerPro from './BookingManagerPro';
import MediaHealthTab from './AdminPanel/MediaHealthTab';
import DataManagementTab from './AdminPanel/DataManagementTab';
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
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState('');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

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

  const tabs = [
    { id: 'photos', label: 'Photos', icon: Upload },
    { id: 'portfolio', label: 'Portfolio', icon: Upload },
    { id: 'sponsors', label: 'Sponsors', icon: Upload },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'about', label: 'About', icon: Edit2 },
    { id: 'text', label: 'Text', icon: Edit2 },
    { id: 'media-health', label: 'Health', icon: Zap },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'credentials', label: 'Creds', icon: Lock },
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
                  onClick={() => {
                    playClickSound();
                    logout();
                    onClose();
                  }}
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
                      className={`px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'bg-black text-white shadow-md'
                          : 'bg-black/5 text-black hover:bg-black/10'
                      }`}
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
              {/* Credentials Tab */}
              {activeTab === 'credentials' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Admin Credentials
                    </h3>
                    <p className="text-xs text-black/60">Manage your admin login credentials</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-700">
                      Admin credentials are managed through Wix Secrets Manager. Update ADMIN_USERNAME and ADMIN_PASSWORD in Developer Tools, then republish.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                        Admin Username
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter admin username"
                        className="w-full px-4 py-2 border border-black/10 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
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
                        className="w-full px-4 py-2 border border-black/10 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                      />
                      <p className="text-xs text-black/40 mt-1">Minimum 6 characters required</p>
                    </div>

                    {credentialsError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{credentialsError}</p>
                      </motion.div>
                    )}

                    {credentialsSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700">{credentialsSuccess}</p>
                      </motion.div>
                    )}

                    <button
                      onClick={handleSaveCredentials}
                      disabled={isSavingCredentials || !newUsername || !newPassword}
                      className="w-full px-4 py-3 bg-black text-white rounded-lg text-sm font-heading font-bold uppercase tracking-wide hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSavingCredentials ? 'Saving...' : 'Save Credentials'}
                    </button>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="bg-gradient-to-b from-black to-black/95 border border-white/10 rounded-lg p-6">
                  <BookingManagerPro />
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Site Photos
                    </h3>
                    <p className="text-xs text-black/60">Manage hero, about, and contact section images</p>
                  </div>

                  <div className="space-y-6">
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
              )}

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Portfolio Images
                    </h3>
                    <p className="text-xs text-black/60">{portfolioItems.length} projects found</p>
                  </div>

                  <div className="space-y-8 max-h-96 overflow-y-auto">
                    {portfolioItems.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-black/60">No portfolio items found. Add items in the CMS.</p>
                      </div>
                    ) : (
                      portfolioItems.map((item) => (
                        <div key={item._id} className="border-t border-black/10 pt-6">
                          <h4 className="text-xs font-heading font-bold text-black mb-4 uppercase tracking-wide">
                            {item.projectName || 'Untitled Project'}
                          </h4>
                          <div className="space-y-4">
                            {['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'].map((field, idx) => (
                              <div key={field}>
                                <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                                  {field === 'mainImage' ? 'Main Image' : `Gallery Image ${idx}`}
                                </label>
                                <ImageUploadManager
                                  label={`Upload ${field === 'mainImage' ? 'Main' : `Gallery ${idx}`} Image`}
                                  currentImage={item[field as keyof Portfolio] as string}
                                  collectionId="portfolio"
                                  itemId={item._id}
                                  fieldName={field}
                                  onImageUpload={(url) => {
                                    setPortfolioItems(portfolioItems.map(p => 
                                      p._id === item._id ? { ...p, [field]: url } : p
                                    ));
                                  }}
                                  onImageDelete={() => {
                                    setPortfolioItems(portfolioItems.map(p => 
                                      p._id === item._id ? { ...p, [field]: undefined } : p
                                    ));
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
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
                                await BaseCrudService.update('musicsettings', {
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
                                await BaseCrudService.update('musicsettings', {
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
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-yellow-700 mb-3">No music settings found.</p>
                      <a
                        href="https://manage.wix.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-xs text-yellow-700 transition-all"
                      >
                        Open CMS to Add Music Settings
                      </a>
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

              {/* Text Tab */}
              {activeTab === 'text' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
                      Site Text
                    </h3>
                    <p className="text-xs text-black/60">Edit site title and tagline</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
                        Site Title
                      </label>
                      <TextEditableField
                        value={siteTitle}
                        onSave={setSiteTitle}
                        className="text-lg font-heading font-bold text-black"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
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

              {/* Media Health Tab */}
              {activeTab === 'media-health' && (
                <div>
                  <MediaHealthTab />
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  <DataManagementTab />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
