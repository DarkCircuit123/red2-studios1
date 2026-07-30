import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Calendar, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';
import { BaseCrudService, useMember } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ClientProofingGalleries } from '@/entities';

function ClientGalleryDashboardPageContent() {
  const navigate = useNavigate();
  const { member, actions } = useMember();
  const [galleries, setGalleries] = useState<ClientProofingGalleries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGalleries();
  }, [member?.loginEmail]);

  const loadGalleries = async () => {
    if (!member?.loginEmail) {
      setIsLoading(false);
      return;
    }

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

      // Filter by member email
      const memberGalleries = allGalleries.filter(
        (g) => g.clientEmail?.toLowerCase() === member.loginEmail.toLowerCase()
      );

      setGalleries(memberGalleries);
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
    actions.logout();
    navigate('/');
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

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead title="My Galleries" description="View your proofing galleries" noindex nofollow />
      <Header />

      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            {/* Header */}
            <div className="mb-16 flex items-center justify-between">
              <div>
                <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-4 tracking-tighter">
                  My Galleries
                </h1>
                <p className="text-base font-paragraph text-white/60">
                  Welcome, {member?.profile?.nickname || member?.contact?.firstName || 'Guest'}
                </p>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-3 bg-red-900 text-white font-heading font-semibold text-sm tracking-wide hover:bg-red-800 transition-all duration-300 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </motion.button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
              </div>
            ) : galleries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-12 bg-white/5 border border-white/10 text-center"
              >
                <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <h2 className="text-2xl font-heading font-bold text-white mb-2">No Galleries Available</h2>
                <p className="text-white/60 mb-6">
                  You don't have any galleries yet. Check back soon!
                </p>
                <Link
                  to="/contact"
                  className="inline-block px-6 py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300"
                >
                  Contact Support
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {galleries.map((gallery, index) => {
                  const isExpired = gallery.galleryExpirationDate
                    ? new Date(gallery.galleryExpirationDate) < new Date()
                    : false;

                  return (
                    <motion.div
                      key={gallery._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-8 bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-2xl font-heading font-bold text-white">
                              {gallery.clientName || 'Gallery'}
                            </h3>
                            {gallery.requiresPin && (
                              <Lock className="w-5 h-5 text-yellow-400" title="PIN required for access" />
                            )}
                          </div>

                          <div className="space-y-3 mb-6">
                            {gallery.galleryExpirationDate && (
                              <div className="flex items-center gap-2 text-white/60">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Expires: {new Date(gallery.galleryExpirationDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            <div>
                              {getApprovalStatusBadge(gallery.approvalStatus)}
                            </div>
                          </div>
                        </div>

                        {!isExpired && (
                          <Link
                            to={`/gallery/${gallery._id}`}
                            className="px-8 py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 whitespace-nowrap"
                          >
                            View Gallery
                          </Link>
                        )}
                        {isExpired && (
                          <div className="px-8 py-3 bg-white/10 text-white/60 font-heading font-bold text-sm tracking-widest uppercase cursor-not-allowed">
                            Expired
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
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
