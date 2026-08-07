import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PortfolioImages } from '@/entities';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { playClickSound } from '@/lib/click-sound';
import { ScrollReveal } from '@/components/ScrollReveal';

interface ImageWithAspectRatio extends PortfolioImages {
  aspectRatio?: number;
}

export default function PortfolioPage() {
  const { portfolios, isLoading: portfoliosLoading } = usePortfolio();
  const [allImages, setAllImages] = useState<ImageWithAspectRatio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Fetch all images from portfolios
  useEffect(() => {
    const fetchAllImages = async () => {
      setIsLoading(true);
      try {
        // Collect all images from all portfolios
        const allPortfolioImages: PortfolioImages[] = [];
        portfolios.forEach((portfolio) => {
          if (portfolio.images && portfolio.images.length > 0) {
            allPortfolioImages.push(...portfolio.images);
          }
        });
        
        // Load image dimensions and determine aspect ratios
        const imagesWithDimensions = await Promise.all(
          allPortfolioImages.map(
            (image) =>
              new Promise<ImageWithAspectRatio>((resolve) => {
                const img = new window.Image();
                img.onload = () => {
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  resolve({
                    ...image,
                    aspectRatio,
                  });
                };
                img.onerror = () => {
                  resolve({
                    ...image,
                    aspectRatio: 1,
                  });
                };
                img.src = image.imageUrl || '';
              })
          )
        );
        
        setAllImages(imagesWithDimensions);
      } catch (error) {
        console.error('Failed to fetch portfolio images:', error);
        setAllImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllImages();
  }, [portfolios]);

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
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.7,
        ease: [0.34, 1.56, 0.64, 1],
      },
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
            Portfolio
          </h1>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A comprehensive collection of {allImages.length} photography work showcasing precision and creative excellence across {portfolios.length} projects.
          </p>
        </ScrollReveal>

        {/* Images Grid - 2-Column Layout with Mixed Orientations */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {Array(12)
              .fill(null)
              .map((_, i) => {
                const isPortrait = i % 3 === 0;
                return (
                  <div
                    key={i}
                    className="bg-white/5 animate-pulse rounded-xl overflow-hidden"
                    style={{ aspectRatio: isPortrait ? '3/4' : '4/3' }}
                  />
                );
              })}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10"
          >
            {allImages.map((image) => {
              // Determine if image is portrait or landscape
              const isPortrait = (image.aspectRatio || 1) < 1;
              
              return (
                <motion.div
                  key={image._id}
                  variants={itemVariants}
                  className={`relative overflow-hidden cursor-pointer group rounded-xl ${
                    isPortrait ? 'lg:col-span-1' : 'lg:col-span-1'
                  }`}
                  onClick={() => {
                    playClickSound();
                    setSelectedImage(image.imageUrl || '');
                  }}
                >
                  {/* Image with hover effect */}
                  <div 
                    className="relative w-full overflow-hidden bg-black/20 rounded-xl"
                    style={{
                      aspectRatio: image.aspectRatio || 'auto',
                    }}
                  >
                    <Image
                      src={image.imageUrl || ''}
                      alt={image.altText || 'Portfolio image'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      data-field-name="imageUrl"
                      data-record-id={image._id}
                    />
                    {/* Subtle overlay on hover */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 rounded-xl" />
                  </div>
                </motion.div>
              );
            })}
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
              No portfolio projects with images yet. Create projects and add images in the admin panel.
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
