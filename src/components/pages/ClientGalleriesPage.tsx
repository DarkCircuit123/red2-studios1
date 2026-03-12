import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Clock } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';

interface ClientGallery {
  _id: string;
  clientName: string;
  clientEmail: string;
  galleryAccessCode: string;
  approvalStatus: string;
  galleryCoverImage: string;
  galleryExpirationDate: string;
}

export default function ClientGalleriesPage() {
  const [galleries, setGalleries] = useState<ClientGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadGalleries = async () => {
      try {
        const result = await BaseCrudService.getAll<ClientGallery>('clientgalleries', {}, { limit: 50 });
        setGalleries(result.items || []);
      } catch (error) {
        // Silently fail - show empty state
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleries();
  }, []);

  const handleAccessGallery = (code: string) => {
    const gallery = galleries.find(g => g.galleryAccessCode === code);
    if (gallery) {
      // Navigate to gallery view or open modal
      alert(`Accessing gallery for ${gallery.clientName}`);
    } else {
      alert('Invalid access code');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Lock className="w-5 h-5 text-white/40" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-heading font-black text-white mb-4 uppercase">
              Client Galleries
            </h1>
            <p className="text-lg text-white/60 max-w-2xl">
              Access your private proofing gallery with your unique access code.
            </p>
          </motion.div>

          {/* Access Code Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16 max-w-md"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40 font-mono text-sm"
              />
              <button
                onClick={() => handleAccessGallery(accessCode)}
                disabled={!accessCode || isSearching}
                className="px-6 py-3 bg-white text-slate-950 font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Access'}
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">
              Check your email for your unique access code
            </p>
          </motion.div>

          {/* Galleries Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : galleries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60">No galleries available at the moment.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleries.map((gallery, idx) => (
                <motion.div
                  key={gallery._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-lg mb-4 aspect-square bg-white/5">
                    {gallery.galleryCoverImage && (
                      <Image
                        src={gallery.galleryCoverImage}
                        alt={gallery.clientName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-heading font-bold">{gallery.clientName}</h3>
                      {getStatusIcon(gallery.approvalStatus)}
                    </div>
                    <p className="text-sm text-white/60">{gallery.clientEmail}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-white/40 uppercase tracking-wide">
                        {gallery.approvalStatus || 'Pending'}
                      </span>
                      {gallery.galleryExpirationDate && (
                        <span className="text-xs text-white/40">
                          Expires: {new Date(gallery.galleryExpirationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
