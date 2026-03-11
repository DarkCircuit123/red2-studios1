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
    <section id="portfolio" className="relative w-full py-24 md:py-32 bg-black">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Box className="w-6 h-6 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">3D Experience</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            Immersive Gallery
          </h2>
          <p className="text-base font-paragraph text-white/60 max-w-xl leading-relaxed">
            Experience photography in three dimensions. Interactive 3D carousel with depth perception and spatial navigation.
          </p>
        </motion.div>

        {/* 3D Gallery Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex flex-col gap-12"
        >
          {/* Main 3D Viewer - Full Width and Tall */}
          <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full min-h-[600px] md:min-h-[800px] overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 hover:border-white/40 transition-all duration-300 cursor-grab active:cursor-grabbing shadow-2xl"
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
              className="absolute top-6 right-6 p-4 bg-black/60 hover:bg-black/90 transition-colors z-20 rounded-lg"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </motion.button>

            {/* Navigation Buttons - Larger and More Visible */}
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/60 hover:bg-black/90 transition-all duration-300 z-20 rounded-lg"
              aria-label="Previous project"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </motion.button>

            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/60 hover:bg-black/90 transition-all duration-300 z-20 rounded-lg"
              aria-label="Next project"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </motion.button>
          </motion.div>

          {/* Info Section Below - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Project Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-8 rounded-lg"
            >
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">
                Project {currentIndex + 1} / {portfolioItems.length}
              </p>
              <h3 className="text-3xl font-heading font-bold text-white mb-4">
                {currentItem?.projectName || 'Project'}
              </h3>
              <p className="text-base font-paragraph text-white/70 leading-relaxed">
                {currentItem?.shortDescription || 'No description'}
              </p>
            </motion.div>

            {/* Image Counter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-8 rounded-lg flex flex-col justify-center"
            >
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">
                Gallery Views
              </p>
              <p className="text-5xl font-heading font-bold text-white mb-2">
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
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-8 rounded-lg flex flex-col justify-center"
            >
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">
                Interaction
              </p>
              <p className="text-lg font-paragraph text-white/80 mb-3">
                ✦ Hover for 3D depth
              </p>
              <p className="text-lg font-paragraph text-white/80">
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
          className="mt-16 flex gap-4 overflow-x-auto pb-4"
        >
          {portfolioItems.slice(0, 8).map((item, idx) => (
            <motion.button
              key={item._id}
              onClick={() => {
                setCurrentIndex(idx);
                setRotation(idx * 90);
              }}
              whileHover={{ scale: 1.05 }}
              className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-all duration-300 ${
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
          className="mt-12 text-center"
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
