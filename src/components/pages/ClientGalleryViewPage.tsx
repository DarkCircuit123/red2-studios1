import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { useAuthStore } from '@/lib/clientAuthStore';
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

export default function ClientGalleryViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clientSession, logout } = useAuthStore();
  const [gallery, setGallery] = useState<ClientGallery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!clientSession || clientSession.galleryId !== id) {
      navigate('/client-login');
    }
  }, [clientSession, id, navigate]);

  useEffect(() => {
    const loadGallery = async () => {
      if (!id) return;
      try {
        const data = await BaseCrudService.getById<ClientGallery>('clientgalleries', id);
        setGallery(data);
      } catch (error) {
        console.error('Error loading gallery:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [id]);

  const handleLogout = () => {
    logout();
    navigate('/client-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </section>
        <Footer />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold mb-4">Gallery Not Found</h1>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300"
            >
              Back to Login
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const images = gallery.galleryCoverImage ? [gallery.galleryCoverImage] : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Header with Client Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex items-center justify-between"
          >
            <div>
              <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-2 uppercase">
                {gallery.clientName}'s Gallery
              </h1>
              <p className="text-lg text-white/60">
                {gallery.approvalStatus === 'approved' ? 'Ready for download' : 'Pending approval'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors duration-300 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-mono uppercase tracking-widest">Logout</span>
            </button>
          </motion.div>

          {/* Gallery Display */}
          {images.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              {/* Main Image */}
              <div className="relative aspect-video bg-white/5 rounded-lg overflow-hidden border border-white/10">
                <Image
                  src={images[selectedImageIndex]}
                  alt={`${gallery.clientName} gallery image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 transition-colors rounded-full"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 transition-colors rounded-full"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 rounded-full text-sm text-white/80">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Download Button */}
              {gallery.approvalStatus === 'approved' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = images[selectedImageIndex];
                    link.download = `${gallery.clientName}-image-${selectedImageIndex + 1}`;
                    link.click();
                  }}
                  className="w-full py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Image
                </motion.button>
              )}

              {/* Gallery Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10"
              >
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-heading font-bold text-white capitalize">
                    {gallery.approvalStatus || 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Expires</p>
                  <p className="text-lg font-heading font-bold text-white">
                    {gallery.galleryExpirationDate
                      ? new Date(gallery.galleryExpirationDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60 mb-6">No images available in this gallery yet.</p>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300"
              >
                Back to Login
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
