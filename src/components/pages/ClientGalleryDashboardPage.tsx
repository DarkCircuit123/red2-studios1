import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { useAuthStore } from '@/lib/clientAuthStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ClientProofingGalleries } from '@/entities';

export default function ClientGalleryDashboardPageContent() {
  const navigate = useNavigate();
  const { clientSession, logout } = useAuthStore();
  const [galleries, setGalleries] = useState<ClientProofingGalleries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    // Check authentication
    if (!clientSession?.clientEmail) {
      navigate('/client-login');
      return;
    }

    loadGalleries();
  }, [clientSession, navigate]);

  const loadGalleries = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Server-side filtered query
      const result = await BaseCrudService.getAll<ClientProofingGalleries>(
        'clientgalleries',
        {},
        { limit: 100 }
      );

      const allGalleries = result.items || [];

      // Log warning if more than expected rows returned
      if (allGalleries.length > 50) {
        console.warn(`[ClientGalleryDashboard] Unexpected gallery count: ${allGalleries.length}. CMS permissions may need lockdown.`);
      }

      // Filter by client email
      const clientGalleries = allGalleries.filter(
        (g) => g.clientEmail?.toLowerCase() === clientSession?.clientEmail.toLowerCase()
      );

      setGalleries(clientGalleries);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Load galleries error:', err);
      }
      setError('Failed to load galleries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('galleryAccessCode');
    logout();
    navigate('/client-login');
  };

  const getApprovalStatusBadge = (status?: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      APPROVED: {
        bg: 'bg-green-500/10',
        text: 'text-green-300',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      PENDING: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-300',
        icon: <Clock className="w-4 h-4" />,
      },
      REJECTED: {
        bg: 'bg-red-500/10',
        text: 'text-red-300',
        icon: <AlertCircle className="w-4 h-4" />,
      },
    };

    const badgeConfig = statusMap[status || 'PENDING'] || statusMap.PENDING;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badgeConfig.bg} ${badgeConfig.text} text-xs font-bold uppercase`}>
        {badgeConfig.icon}
        {status || 'Pending'}
      </div>
    );
  };

  const isExpired = (expirationDate?: string | Date) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const paginatedGalleries = galleries.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(galleries.length / pageSize);

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead title="Gallery Dashboard" description="Your galleries" noindex nofollow />
      <Header />

      <section className="relative w-full min-h-screen flex flex-col overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full flex-1">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-2 uppercase">
                  Your Galleries
                </h1>
                <p className="text-lg text-white/60">
                  Welcome, {clientSession?.clientName || 'Guest'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-bold uppercase transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 mb-8"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && galleries.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-white/5 border border-white/10 rounded-lg text-center"
            >
              <p className="text-white/60 mb-4">No galleries available yet.</p>
              <a
                href="/contact"
                className="inline-block px-4 py-2 bg-white text-black font-bold text-sm uppercase rounded-lg hover:bg-white/90 transition-all duration-300"
              >
                Contact Us
              </a>
            </motion.div>
          )}

          {/* Galleries Grid */}
          {!isLoading && galleries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {paginatedGalleries.map((gallery, idx) => {
                const expired = isExpired(gallery.galleryExpirationDate);

                return (
                  <motion.div
                    key={gallery._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                      expired
                        ? 'border-red-500/30 opacity-60'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {/* Image Container */}
                    <Link
                      to={`/client-gallery/${gallery._id}`}
                      className="block relative aspect-video overflow-hidden bg-white/5"
                    >
                      {gallery.galleryCoverImage ? (
                        <img
                          src={gallery.galleryCoverImage}
                          alt={gallery.clientName || 'Gallery'}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                          <span className="text-white/40 text-sm">No image</span>
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="p-4 bg-black/50 backdrop-blur-sm">
                      {/* Title */}
                      <h3 className="text-lg font-heading font-bold text-white mb-2 truncate">
                        {gallery.clientName || 'Untitled Gallery'}
                      </h3>

                      {/* Metadata */}
                      <div className="space-y-2 mb-4">
                        {/* Approval Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40 uppercase">Status</span>
                          {getApprovalStatusBadge(gallery.approvalStatus)}
                        </div>

                        {/* Expiration Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires
                          </span>
                          <span className={`text-xs font-mono ${expired ? 'text-red-300' : 'text-white/60'}`}>
                            {formatDate(gallery.galleryExpirationDate)}
                          </span>
                        </div>
                      </div>

                      {/* Expired Badge */}
                      {expired && (
                        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-center">
                          <p className="text-xs text-red-300 font-bold">EXPIRED</p>
                        </div>
                      )}

                      {/* View Button */}
                      {!expired && (
                        <Link
                          to={`/client-gallery/${gallery._id}`}
                          className="block w-full py-2 bg-white text-black font-bold text-xs uppercase text-center rounded hover:bg-white/90 transition-all duration-300"
                        >
                          View Gallery
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Pagination */}
          {!isLoading && galleries.length > pageSize && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center gap-4"
            >
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white text-sm font-bold uppercase transition-all duration-300"
              >
                Previous
              </button>
              <span className="text-white/60 text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white text-sm font-bold uppercase transition-all duration-300"
              >
                Next
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function ClientGalleryDashboardPage() {
  return (
    <ErrorBoundary>
      <ClientGalleryDashboardPageContent />
    </ErrorBoundary>
  );
}
