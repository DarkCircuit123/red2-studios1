import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import GalleryViewer from '@/components/GalleryViewer';

export default function Interactive3DGallerySection() {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 12 });
        setPortfolioItems(data.items || []);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    };
    loadPortfolio();
  }, []);

  const currentItem = portfolioItems[currentIndex];
  const galleryImages = currentItem
    ? [currentItem.mainImage, currentItem.galleryImage1, currentItem.galleryImage2, currentItem.galleryImage3].filter(Boolean)
    : [];
  const currentImage = galleryImages[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % portfolioItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + portfolioItems.length) % portfolioItems.length);
  };

  if (portfolioItems.length === 0) {
    return null;
  }

  return (
    <section id="portfolio" className="relative w-full py-16 md:py-24 lg:py-32 bg-black">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-20 text-center"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            Portfolio
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            A curated collection of professional photography showcasing our finest work.
          </p>
        </motion.div>

        {/* Main Cinematic Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-12"
        >
          {/* Main Image Container - Centered with Adaptive Layout */}
          <div className="w-full flex flex-col items-center">
            {/* Image Viewer */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full flex items-center justify-center"
            >
              {currentImage && (
                <div
                  className="relative inline-flex items-center justify-center max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setViewerImages(galleryImages as string[]);
                    setViewerStartIndex(0);
                    setViewerOpen(true);
                  }}
                >
                  <Image
                    ref={imageRef}
                    src={currentImage}
                    alt={currentItem?.projectName || 'Portfolio image'}
                    className="w-auto h-auto max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              )}
            </motion.div>

            {/* Project Info - Below Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 text-center max-w-2xl"
            >
              <p className="text-sm font-mono text-white/50 uppercase tracking-widest mb-3">
                {currentIndex + 1} / {portfolioItems.length}
              </p>
              <h3 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                {currentItem?.projectName}
              </h3>
              <p className="text-base text-white/70 leading-relaxed">
                {currentItem?.shortDescription}
              </p>
            </motion.div>
          </div>

          {/* Navigation Controls - Centered Below */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Previous project"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>

            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Next project"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </motion.div>

        {/* Thumbnail Strip - Clean and Minimal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-20 flex justify-center gap-3 overflow-x-auto pb-4"
        >
          {portfolioItems.map((item, idx) => (
            <motion.button
              key={item._id}
              onClick={() => {
                setCurrentIndex(idx);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 w-24 h-24 overflow-hidden rounded-lg transition-all duration-300 ${
                idx === currentIndex
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={item.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png'}
                alt={item.projectName || 'Thumbnail'}
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Gallery Viewer */}
      <GalleryViewer
        images={viewerImages}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialIndex={viewerStartIndex}
      />
    </section>
  );
}
