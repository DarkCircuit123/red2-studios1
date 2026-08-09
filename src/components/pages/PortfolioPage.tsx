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
import { filterValidImages, generateSanitizationReport } from '@/lib/image-url-sanitizer';

interface ImageWithAspectRatio extends PortfolioImages {
  aspectRatio?: number;
  gridSpan?: 'vertical' | 'horizontal' | 'square';
}

export default function PortfolioPage() {
  const [allImages, setAllImages] = useState<ImageWithAspectRatio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Determine grid span based on aspect ratio
  const getGridSpan = (aspectRatio: number): 'vertical' | 'horizontal' | 'square' => {
    if (aspectRatio < 0.8) return 'vertical'; // Portrait: taller than wide
    if (aspectRatio > 1.3) return 'horizontal'; // Landscape: wider than tall
    return 'square'; // Near square
  };

  // Fetch all images from portfolioimages collection
  useEffect(() => {
    const fetchAllImages = async () => {
      setIsLoading(true);
      try {
        const result = await BaseCrudService.getAll<PortfolioImages>('portfolioimages', {}, { limit: 1000 });
        
        // Filter out items with broken/placeholder URLs using sanitizer
        const allItems = result.items || [];
        const validImages = filterValidImages(allItems, 'image');
        
        // Generate and log sanitization report
        const report = generateSanitizationReport(
          allItems.length,
          validImages.length,
          allItems
            .filter(img => !validImages.find(v => v._id === img._id))
            .map(img => img.image || 'unknown')
        );
        
        if (report.removed > 0) {
          console.info(
            `[PortfolioPage] Image Sanitization Report:\n` +
            `  Original: ${report.originalCount}\n` +
            `  Valid: ${report.sanitizedCount}\n` +
            `  Removed: ${report.removed} (${report.percentageRemoved.toFixed(1)}%)`
          );
          // Store report for display in status component
          sessionStorage.setItem('imageSanitizationReport', JSON.stringify({
            originalCount: report.originalCount,
            sanitizedCount: report.sanitizedCount,
            removed: report.removed,
            percentageRemoved: report.percentageRemoved,
          }));
        }

        // Load image dimensions and determine grid spans
        const imagesWithDimensions = await Promise.all(
          validImages.map(
            (image) =>
              new Promise<ImageWithAspectRatio>((resolve) => {
                const img = new window.Image();
                img.onload = () => {
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  resolve({
                    ...image,
                    aspectRatio,
                    gridSpan: getGridSpan(aspectRatio),
                  });
                };
                img.onerror = () => {
                  console.warn('Failed to load image:', image.image);
                  resolve({
                    ...image,
                    aspectRatio: 1,
                    gridSpan: 'square',
                  });
                };
                img.src = image.image || '';
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

        {/* Images Grid - Masonry Layout with Vertical/Horizontal Mix */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 auto-rows-max">
            {Array(16)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 animate-pulse min-h-[400px]"
                />
              ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 auto-rows-max"
          >
            {allImages.map((image) => {
              // Determine column and row span based on aspect ratio
              const isVertical = image.gridSpan === 'vertical';
              const isHorizontal = image.gridSpan === 'horizontal';
              
              return (
                <motion.div
                  key={image._id}
                  variants={itemVariants}
                  className={`relative overflow-hidden cursor-pointer group ${
                    isVertical ? 'md:col-span-1 md:row-span-2' : isHorizontal ? 'md:col-span-2 md:row-span-1' : 'md:col-span-1'
                  }`}
                  onClick={() => {
                    playClickSound();
                    setSelectedImage(image.image || '');
                  }}
                >
                  {/* Image with hover effect */}
                  <div className="relative w-full h-full overflow-hidden bg-black/20">
                    <Image
                      src={image.image || 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384'}
                      alt={image.altText || 'Portfolio image'}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        isVertical ? 'aspect-[3/4]' : isHorizontal ? 'aspect-[16/9]' : 'aspect-square'
                      }`}
                      data-field-name="image"
                      data-record-id={image._id}
                    />
                    {/* Subtle overlay on hover */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
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
              No images found yet
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
