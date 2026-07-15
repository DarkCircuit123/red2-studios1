import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Image as ImageIcon, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/clientAuthStore';
import { getClientGalleries } from '@/api/client-galleries';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';

interface ClientGallery {
  _id: string;
  clientName: string;
  clientEmail: string;
  approvalStatus: string;
  galleryCoverImage: string;
  galleryExpirationDate: string;
}

export default function ClientGalleryDashboardPage() {
  const navigate = useNavigate();
  const { clientSession, setClientSession } = useAuthStore();
  const [galleries, setGalleries] = useState<ClientGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add SEO meta tags - noindex/nofollow for private dashboard
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    // Session integrity check: verify user is logged in with account
    if (!clientSession?.isAccountLogin || !clientSession?.clientEmail) {
      navigate('/client-login');
      return;
    }

    loadGalleries(0);

    // Cleanup on unmount: abort pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clientSession, navigate]);

  const loadGalleries = async (page: number = 0) => {
    try {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError('');

      const limit = 12; // Pagination: 12 items per page
      const skip = page * limit;

      // Use server-side filtered API - only returns galleries for logged-in client
      const result = await getClientGalleries(
        clientSession?.clientEmail || '',
        limit,
        skip
      );

      setGalleries(result.items);
      setTotalCount(result.totalCount);
      setHasNext(result.hasNext);
      setCurrentPage(page);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('[ClientGalleryDashboard] Error loading galleries:', err);
      setError('Failed to load galleries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isGalleryExpired = (expirationDate: string): boolean => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const handleLogout = () => {
    // Full logout cleanup via auth store
    setClientSession(null);
    navigate('/client-login');
  };

  const handleViewGallery = (galleryId: string, isExpired: boolean) => {
    if (isExpired) {
      setError('This gallery has expired and is no longer accessible.');
      return;
    }
    navigate(`/client-gallery/${galleryId}`);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      loadGalleries(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      loadGalleries(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full min-h-screen flex flex-col overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full flex-1">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-2 uppercase">
                  Your Galleries
                </h1>
                <p className="text-lg text-white/60">
                  Welcome, {clientSession?.clientName}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-heading font-bold text-sm tracking-widest uppercase transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}

          {/* Galleries Grid */}
          {!isLoading && galleries.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              >
                {galleries.map((gallery, index) => {
                  const isExpired = isGalleryExpired(gallery.galleryExpirationDate);
                  return (
                    <motion.div
                      key={gallery._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group transition-opacity duration-300 ${
                        isExpired ? 'opacity-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleViewGallery(gallery._id, isExpired)}
                        disabled={isExpired}
                        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
                        aria-label={`View gallery: ${gallery.clientName}`}
                      >
                        <div className="relative overflow-hidden rounded-lg border border-white/10 hover:border-white/30 transition-all duration-300 h-64 bg-white/5 flex items-center justify-center">
                          {gallery.galleryCoverImage ? (
                            <Image
                              src={gallery.galleryCoverImage}
                              alt={gallery.clientName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-white/20" />
                            </div>
                          )}

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <span className="px-6 py-2 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase rounded-lg">
                              {isExpired ? 'Expired' : 'View Gallery'}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-4 right-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                gallery.approvalStatus === 'approved'
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : gallery.approvalStatus === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {gallery.approvalStatus}
                            </span>
                          </div>

                          {/* Expiration Warning */}
                          {isExpired && (
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <Clock className="w-4 h-4 text-red-300" />
                              <span className="text-xs font-bold text-red-300">Expired</span>
                            </div>
                          )}
                        </div>

                        {/* Gallery Info - NO ACCESS CODE DISPLAYED */}
                        <div className="mt-4">
                          <h3 className="text-lg font-heading font-bold text-white mb-1">
                            {gallery.clientName}
                          </h3>
                          {gallery.galleryExpirationDate && (
                            <p className="text-sm text-white/60">
                              Expires: {new Date(gallery.galleryExpirationDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Pagination Controls */}
              {totalCount > 12 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-4"
                >
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white font-heading font-bold text-sm tracking-widest uppercase transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-white/60 text-sm">
                    Page {currentPage + 1} of {Math.ceil(totalCount / 12)}
                  </span>

                  <button
                    onClick={handleNextPage}
                    disabled={!hasNext}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white font-heading font-bold text-sm tracking-widest uppercase transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && galleries.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-6">
                <ImageIcon className="w-12 h-12 text-white/40" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-white mb-2">No Galleries Yet</h2>
              <p className="text-white/60 max-w-md">
                You don't have any galleries assigned yet. Please contact the photographer to get access to your gallery.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
