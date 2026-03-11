import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';

export default function Interactive3DGallerySection() {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % portfolioItems.length);
    setRotation((prev) => prev + 90);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + portfolioItems.length) % portfolioItems.length);
    setRotation((prev) => prev - 90);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = (y / rect.height - 0.5) * 20;
    const rotateY = (x / rect.width - 0.5) * 20;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  };

  const handleMouseLeave = () => {
    if (containerRef.current) {
      containerRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };

  if (portfolioItems.length === 0) {
    return null;
  }

  return (
    <section id="portfolio" className="relative w-full py-16 md:py-24 bg-black">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <Box className="w-5 h-5 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">3D Experience</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white mb-4 tracking-tighter">
            Immersive Gallery
          </h2>
          <p className="text-sm sm:text-base font-paragraph text-white/60 max-w-xl leading-relaxed">
            Experience photography in three dimensions. Interactive 3D carousel with depth perception and spatial navigation.
          </p>
        </motion.div>

        {/* 3D Gallery Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex flex-col gap-6 sm:gap-8"
        >
          {/* Main 3D Viewer - Responsive Size */}
          <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 hover:border-white/40 transition-all duration-300 cursor-grab active:cursor-grabbing shadow-2xl rounded-lg"
            style={{ perspective: '1500px' }}
          >
            {/* 3D Carousel Effect */}
            <div className="relative w-full h-full">
              {galleryImages.map((image, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: idx === 0 ? 1 : 0.2,
                    scale: idx === 0 ? 1 : 0.75,
                    zIndex: idx === 0 ? 10 : 0,
                  }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                  style={{
                    transform: `rotateY(${rotation + idx * 90}deg) translateZ(300px)`,
                  }}
                >
                  <Image
                    src={image}
                    alt={`Gallery ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>

            {/* Fullscreen Button */}
            <motion.button
              onClick={() => setIsFullscreen(!isFullscreen)}
              whileHover={{ scale: 1.15 }}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-3 bg-black/60 hover:bg-black/90 transition-colors z-20 rounded-lg"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.button>

            {/* Navigation Buttons - Responsive */}
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/60 hover:bg-black/90 transition-all duration-300 z-20 rounded-lg"
              aria-label="Previous project"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.button>

            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/60 hover:bg-black/90 transition-all duration-300 z-20 rounded-lg"
              aria-label="Next project"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.button>
          </motion.div>

          {/* Info Section Below - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Project Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-4 sm:p-6 rounded-lg"
            >
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">
                Project {currentIndex + 1} / {portfolioItems.length}
              </p>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-white mb-3">
                {currentItem?.projectName || 'Project'}
              </h3>
              <p className="text-sm font-paragraph text-white/70 leading-relaxed">
                {currentItem?.shortDescription || 'No description'}
              </p>
            </motion.div>

            {/* Image Counter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-4 sm:p-6 rounded-lg flex flex-col justify-center"
            >
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">
                Gallery Views
              </p>
              <p className="text-4xl sm:text-5xl font-heading font-bold text-white mb-2">
                {galleryImages.length}
              </p>
              <p className="text-xs font-mono text-white/50 uppercase tracking-widest">
                Available Angles
              </p>
            </motion.div>

            {/* Navigation Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-4 sm:p-6 rounded-lg flex flex-col justify-center sm:col-span-2 lg:col-span-1"
            >
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">
                Interaction
              </p>
              <p className="text-sm sm:text-base font-paragraph text-white/80 mb-2">
                ✦ Hover for 3D depth
              </p>
              <p className="text-sm sm:text-base font-paragraph text-white/80">
                ✦ Click arrows to rotate
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Thumbnail Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-8 sm:mt-10 flex gap-2 sm:gap-3 overflow-x-auto pb-3"
        >
          {portfolioItems.slice(0, 8).map((item, idx) => (
            <motion.button
              key={item._id}
              onClick={() => {
                setCurrentIndex(idx);
                setRotation(idx * 90);
              }}
              whileHover={{ scale: 1.05 }}
              className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition-all duration-300 rounded ${
                idx === currentIndex ? 'border-primary' : 'border-white/20 hover:border-white/60'
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

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-6 sm:mt-8 text-center"
        >
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
            💡 Tip: Move your mouse over the gallery to see the 3D depth effect
          </p>
        </motion.div>

        {/* Fullscreen Modal */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
              onClick={() => setIsFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <motion.button
                  onClick={() => setIsFullscreen(false)}
                  whileHover={{ scale: 1.1 }}
                  className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 transition-colors z-50"
                  aria-label="Close fullscreen"
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>

                {/* Fullscreen Image Container */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {galleryImages[0] && (
                    <Image
                      src={galleryImages[0]}
                      alt="Fullscreen view"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Navigation in Fullscreen */}
                <motion.button
                  onClick={handlePrev}
                  whileHover={{ scale: 1.1 }}
                  className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.1 }}
                  className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
