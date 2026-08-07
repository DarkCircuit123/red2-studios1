import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { PortfolioImages } from '@/entities';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { playClickSound } from '@/lib/click-sound';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function PortfolioPage() {
  const [allImages, setAllImages] = useState<PortfolioImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Fetch all images from portfolioimages collection
  useEffect(() => {
    const fetchAllImages = async () => {
      setIsLoading(true);
      try {
        const result = await BaseCrudService.getAll<PortfolioImages>('portfolioimages', {}, { limit: 1000 });
        setAllImages(result.items || []);
      } catch (error) {
        console.error('Failed to fetch portfolio images:', error);
        setAllImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllImages();
  }, []);

  // Load image dimensions when selected image changes
  useEffect(() => {
    if (!selectedImage) {
      setImageDimensions(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = selectedImage;
  }, [selectedImage]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 p-2 text-white/60 hover:text-white transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Dynamic container that scales to image aspect ratio */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
            style={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              aspectRatio: imageDimensions ? `${imageDimensions.width} / ${imageDimensions.height}` : 'auto',
            }}
          >
            <Image
              src={selectedImage}
              alt="Full resolution image"
              className="w-full h-full object-contain"
              data-field-name="lightbox"
            />
          </motion.div>
        </motion.div>
      )}

      <main className="max-w-[120rem] mx-auto px-8 py-24 md:py-32">
        {/* Page Header */}
        <ScrollReveal direction="up" duration={800} className="mb-20">
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            All Photos
          </h1>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A comprehensive collection of {allImages.length} photography work showcasing precision and creative excellence.
          </p>
        </ScrollReveal>

        {/* Images Grid - Pure Photos Only */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 auto-rows-max">
            {Array(16)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 animate-pulse min-h-[500px] md:min-h-[600px]"
                />
              ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 auto-rows-max"
          >
            {allImages.map((image) => (
              <motion.div
                key={image._id}
                variants={itemVariants}
                className="relative overflow-hidden cursor-pointer"
                onClick={() => {
                  playClickSound();
                  setSelectedImage(image.imageUrl || '');
                }}
              >
                {/* Pure Image - No Overlays, No Text */}
                <Image
                  src={image.imageUrl || 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384'}
                  alt={image.altText || 'Portfolio image'}
                  className="w-full h-auto object-cover"
                  data-field-name="imageUrl"
                  data-record-id={image._id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && allImages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-base font-paragraph text-white/50 mb-8">
              No images found yet
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
