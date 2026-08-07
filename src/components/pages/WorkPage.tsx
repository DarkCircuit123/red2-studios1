import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { PortfolioImages } from '@/entities';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { playClickSound } from '@/lib/click-sound';

interface ImageWithLayout extends PortfolioImages {
  layoutSize: 'small' | 'medium' | 'large';
  layoutOrientation: 'portrait' | 'landscape' | 'square';
}

export default function WorkPage() {
  const [allImages, setAllImages] = useState<ImageWithLayout[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Fetch all images from portfolioimages collection
  useEffect(() => {
    const fetchAllImages = async () => {
      setIsLoading(true);
      try {
        const result = await BaseCrudService.getAll<PortfolioImages>('portfolioimages', {}, { limit: 1000 });
        const images = result.items || [];
        
        // Assign artful layout sizes and orientations
        const layoutImages: ImageWithLayout[] = images.map((img, index) => {
          const layoutPattern = index % 12;
          let layoutSize: 'small' | 'medium' | 'large' = 'medium';
          let layoutOrientation: 'portrait' | 'landscape' | 'square' = 'square';

          // Create an artful pattern
          if (layoutPattern === 0 || layoutPattern === 7) {
            layoutSize = 'large';
            layoutOrientation = layoutPattern === 0 ? 'landscape' : 'portrait';
          } else if (layoutPattern === 3 || layoutPattern === 9) {
            layoutSize = 'large';
            layoutOrientation = layoutPattern === 3 ? 'portrait' : 'landscape';
          } else if (layoutPattern % 2 === 0) {
            layoutSize = 'medium';
            layoutOrientation = 'square';
          } else {
            layoutSize = 'small';
            layoutOrientation = layoutPattern % 3 === 1 ? 'portrait' : 'landscape';
          }

          return {
            ...img,
            layoutSize,
            layoutOrientation,
          };
        });

        setAllImages(layoutImages);
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

  const getGridClasses = (image: ImageWithLayout) => {
    const baseClasses = 'relative overflow-hidden group cursor-pointer';
    
    if (image.layoutSize === 'large') {
      return `${baseClasses} md:col-span-2 md:row-span-2`;
    } else if (image.layoutSize === 'medium') {
      return `${baseClasses} md:col-span-2 md:row-span-1`;
    }
    return baseClasses;
  };

  const getAspectRatioClasses = (image: ImageWithLayout) => {
    if (image.layoutSize === 'large') {
      return image.layoutOrientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/9]';
    } else if (image.layoutSize === 'medium') {
      return image.layoutOrientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]';
    }
    return 'aspect-square';
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
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
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
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

      <main ref={containerRef} className="max-w-[120rem] mx-auto px-4 md:px-8 py-24 md:py-32">
        {/* Page Header - Minimal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white tracking-tighter">
            Work
          </h1>
        </motion.div>

        {/* Masonry Grid - Pure Photos */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-max">
            {Array(16)
              .fill(null)
              .map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="bg-white/5 animate-pulse min-h-[300px] md:min-h-[400px]"
                />
              ))}
          </div>
        ) : allImages.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-max"
          >
            {allImages.map((image, index) => {
              const yOffset = useTransform(scrollY, [0, 1000], [0, index % 2 === 0 ? 30 : -30]);

              return (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: (index % 12) * 0.05,
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                  }}
                  style={{ y: yOffset }}
                  className={getGridClasses(image)}
                  onClick={() => {
                    playClickSound();
                    setSelectedImage(image.imageUrl || '');
                  }}
                >
                  {/* Image Container with Parallax */}
                  <motion.div
                    className={`relative w-full h-full overflow-hidden bg-black/30 ${getAspectRatioClasses(image)}`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                  >
                    {/* Image */}
                    <Image
                      src={image.imageUrl || 'https://static.wixstatic.com/media/e9d727_9c9c4486a82b496ca6c48026f5bbed4d~mv2.png?originWidth=576&originHeight=384'}
                      alt={image.altText || 'Portfolio image'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      data-field-name="imageUrl"
                      data-record-id={image._id}
                    />

                    {/* Subtle grain overlay */}
                    <div className="absolute inset-0 bg-grain opacity-5 pointer-events-none" />

                    {/* Hover overlay - minimal */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-white text-sm font-paragraph tracking-widest uppercase"
                      >
                        View
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-base font-paragraph text-white/50">
              No images found yet
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
