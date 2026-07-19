import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Trash2 } from 'lucide-react';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';
import { BaseCrudService } from '@/integrations';
import { Services, HomepageImages, Portfolio, ClientsPress, Reels, BlogPosts } from '@/entities/index';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('photos');
  const [siteTitle, setSiteTitle] = useState('RED2');
  const [siteTagline, setSiteTagline] = useState('BY JORDAN MICHAEL ZUNIGA');
  const [homepageImages, setHomepageImages] = useState<HomepageImages | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [reels, setReels] = useState<Reels[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPosts[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        // Load homepage images
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

        // Load reels
        try {
          const reelsResult = await BaseCrudService.getAll<Reels>('reels', {}, { limit: 50 });
          if (reelsResult?.items) {
            setReels(reelsResult.items);
          } else {
            setReels([]);
          }
        } catch (error) {
          setReels([]);
        }

        // Load blog posts
        try {
          const blogResult = await BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 50 });
          if (blogResult?.items) {
            setBlogPosts(blogResult.items);
          } else {
            setBlogPosts([]);
          }
        } catch (error) {
          setBlogPosts([]);
        }
      } catch (error) {
        setHomepageImages(null);
        setPortfolioItems([]);
        setSponsors([]);
        setReels([]);
        setBlogPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImages();
  }, [isOpen]);

  const handleDeletePortfolioItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) return;
    
    setDeletingId(id);
    try {
      await BaseCrudService.delete('portfolio', id);
      setPortfolioItems(portfolioItems.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteReel = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    
    setDeletingId(id);
    try {
      await BaseCrudService.delete('reels', id);
      setReels(reels.filter(r => r._id !== id));
    } catch (error) {
      console.error('Error deleting reel:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    
    setDeletingId(id);
    try {
      await BaseCrudService.delete('blogposts', id);
      setBlogPosts(blogPosts.filter(b => b._id !== id));
    } catch (error) {
      console.error('Error deleting blog post:', error);
    } finally {
      setDeletingId(null);
    }
  };

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border-l border-primary/20 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-primary/20 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-heading font-bold text-white">Media Admin</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="sticky top-16 bg-slate-950/80 border-b border-primary/20 px-6 py-4 flex gap-2 overflow-x-auto backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'photos'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Site Photos
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'portfolio'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'media'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setActiveTab('sponsors')}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap ${
                  activeTab === 'sponsors'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Sponsors
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Site Photos Tab */}
              {activeTab === 'photos' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-white mb-6 uppercase tracking-wide">
                    Manage Site Photos
                  </h3>
                  <div className="space-y-6">
                    {/* Hero Image */}
                    <div>
                      <label className="text-xs text-white/60 uppercase tracking-wide block mb-3">
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
                      <label className="text-xs text-white/60 uppercase tracking-wide block mb-3">
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
                      <label className="text-xs text-white/60 uppercase tracking-wide block mb-3">
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
                  <h3 className="text-sm font-heading font-bold text-white mb-6 uppercase tracking-wide">
                    Manage Portfolio Items
                  </h3>
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {portfolioItems.length === 0 ? (
                      <p className="text-sm text-white/60">No portfolio items found. Add items in the CMS.</p>
                    ) : (
                      portfolioItems.map((item) => (
                        <div key={item._id} className="border-t border-white/10 pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wide flex-1">
                              {item.projectName || 'Untitled Project'}
                            </h4>
                            <button
                              onClick={() => handleDeletePortfolioItem(item._id)}
                              disabled={deletingId === item._id}
                              className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors disabled:opacity-50"
                              title="Delete portfolio item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            {/* Main Image */}
                            <div>
                              <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
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
                              <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
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
                              <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
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
                              <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
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

              {/* Media Tab - Reels & Blog */}
              {activeTab === 'media' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-white mb-6 uppercase tracking-wide">
                    Manage Media
                  </h3>
                  
                  {/* Reels Section */}
                  <div className="mb-8">
                    <h4 className="text-xs font-heading font-bold text-white/80 mb-4 uppercase tracking-wide">
                      Reels
                    </h4>
                    <div className="space-y-4 max-h-48 overflow-y-auto">
                      {reels.length === 0 ? (
                        <p className="text-xs text-white/60">No reels found.</p>
                      ) : (
                        reels.map((reel) => (
                          <div key={reel._id} className="bg-white/5 border border-white/10 rounded p-3 flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-heading font-bold text-white">{reel.title || 'Untitled'}</p>
                              {reel.thumbnail && (
                                <img src={reel.thumbnail} alt={reel.title} className="w-full h-16 object-cover rounded mt-2" />
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteReel(reel._id)}
                              disabled={deletingId === reel._id}
                              className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors disabled:opacity-50 ml-2"
                              title="Delete reel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Blog Posts Section */}
                  <div>
                    <h4 className="text-xs font-heading font-bold text-white/80 mb-4 uppercase tracking-wide">
                      Blog Posts
                    </h4>
                    <div className="space-y-4 max-h-48 overflow-y-auto">
                      {blogPosts.length === 0 ? (
                        <p className="text-xs text-white/60">No blog posts found.</p>
                      ) : (
                        blogPosts.map((post) => (
                          <div key={post._id} className="bg-white/5 border border-white/10 rounded p-3 flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-heading font-bold text-white">{post.title || 'Untitled'}</p>
                              {post.thumbnailImage && (
                                <img src={post.thumbnailImage} alt={post.title} className="w-full h-16 object-cover rounded mt-2" />
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteBlogPost(post._id)}
                              disabled={deletingId === post._id}
                              className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors disabled:opacity-50 ml-2"
                              title="Delete blog post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sponsors Tab */}
              {activeTab === 'sponsors' && (
                <div>
                  <h3 className="text-sm font-heading font-bold text-white mb-6 uppercase tracking-wide">
                    Manage Sponsors
                  </h3>
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {sponsors.length === 0 ? (
                      <p className="text-sm text-white/60">No sponsors found. Add sponsors in the CMS.</p>
                    ) : (
                      sponsors.map((sponsor) => (
                        <div key={sponsor._id} className="border-t border-white/10 pt-6">
                          <h4 className="text-xs font-heading font-bold text-white mb-4 uppercase tracking-wide">
                            {sponsor.clientName || 'Untitled Sponsor'}
                          </h4>
                          <div className="space-y-4">
                            {/* Sponsor Logo */}
                            <div>
                              <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
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

              {/* CMS Collections Info */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-white mb-3 uppercase tracking-wide">
                  Full CMS Access
                </h3>
                <p className="text-xs text-white/60 mb-4">
                  Edit all your site content directly from the CMS:
                </p>
                <ul className="space-y-2 text-xs text-white/50">
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
                  className="inline-block mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded text-xs text-primary transition-all duration-300"
                >
                  Open CMS Dashboard
                </a>
              </div>

              {/* Tips */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-primary mb-2">💡 Tips</h3>
                <ul className="text-xs text-primary/70 space-y-1">
                  <li>• Replace images by uploading new ones</li>
                  <li>• Delete items using the trash icon</li>
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
