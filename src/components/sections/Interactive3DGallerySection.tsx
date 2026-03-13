import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';

// Utility function to generate responsive image URL with 4:5 aspect ratio
const getResponsiveImageUrl = (url: string, width: number): string => {
  if (!url) return url;
  
  // Calculate height based on 4:5 aspect ratio
  const height = Math.round((width * 5) / 4);
  
  // For Wix static images, append resize parameters
  if (url.includes('wixstatic.com')) {
    // Remove existing parameters if any
    const baseUrl = url.split('~')[0];
    return `${baseUrl}~c_crop,w_${width},h_${height},x_0,y_0/~c_scale,w_${width},h_${height}`;
  }
  
  return url;
};

export default function Interactive3DGallerySection() {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Track container width for responsive image sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const currentItem = portfolioItems[currentIndex];
  const galleryImages = currentItem
    ? [currentItem.mainImage, currentItem.galleryImage1, currentItem.galleryImage2, currentItem.galleryImage3].filter(Boolean)
    : [];

  // Handle image load to get actual dimensions for lightbox
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % portfolioItems.length);
    setRotation((prev) => prev + 90);
    setImageDimensions(null); // Reset dimensions for new image
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + portfolioItems.length) % portfolioItems.length);
    setRotation((prev) => prev - 90);
    setImageDimensions(null); // Reset dimensions for new image
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
    <section id="portfolio" className="relative w-full py-16 md:py-20 lg:py-24 bg-black">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Box className="w-6 h-6 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">3D Experience</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            Immersive Gallery
          </h2>
          <p className="text-base text-white/60 max-w-xl leading-relaxed font-mono">
            Experience photography in three dimensions. Interactive 3D carousel with depth perception and spatial navigation.
          </p>
        </motion.div>

        {/* 3D Gallery Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center"
        >
          {/* Left Navigation */}
          <div className="flex flex-col gap-6">
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 flex items-center justify-center bg-white/5 border border-white/20 hover:border-white/60 transition-all duration-300"
              aria-label="Previous project"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>

            {/* Project Info */}
            <div className="bg-white/5 border border-white/10 p-6">
              <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-3">
                {currentIndex + 1} / {portfolioItems.length}
              </p>
              <h3 className="text-2xl font-heading font-bold text-white mb-3">
                {currentItem?.projectName || 'Project'}
              </h3>
              <p className="text-sm font-paragraph text-white/60 line-clamp-3">
                {currentItem?.shortDescription || 'No description'}
              </p>
            </div>
          </div>

          {/* Center 3D Viewer */}
          <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative overflow-hidden bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing"
            style={{ perspective: '1000px', aspectRatio: '4 / 5' }}
          >
            {/* 3D Carousel Effect */}
            <div className="relative w-full h-full">
              {galleryImages.map((image, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: idx === 0 ? 1 : 0.3,
                    scale: idx === 0 ? 1.8 : 0.8,
                    zIndex: idx === 0 ? 10 : 0,
                  }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                  style={{
                    transform: `rotateY(${rotation + idx * 90}deg) translateZ(200px)`,
                  }}
                >
                  <Image
                    src={getResponsiveImageUrl(image, containerWidth || 400)}
                    alt={`Gallery ${idx}`}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ))}
            </div>

            {/* Fullscreen Button */}
            <motion.button
              onClick={() => setIsFullscreen(!isFullscreen)}
              whileHover={{ scale: 1.1 }}
              className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/80 transition-colors z-20"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </motion.button>
          </motion.div>

          {/* Right Navigation */}
          <div className="flex flex-col gap-6">
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 flex items-center justify-center bg-white/5 border border-white/20 hover:border-white/60 transition-all duration-300"
              aria-label="Next project"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>

            {/* Image Counter */}
            <div className="bg-white/5 border border-white/10 p-6">
              <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-3">
                Gallery Images
              </p>
              <p className="text-3xl font-heading font-bold text-white">
                {galleryImages.length}
              </p>
              <p className="text-xs font-mono text-white/40 mt-2 uppercase tracking-widest">
                Available Views
              </p>
            </div>
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

        {/* Fullscreen Modal - Image-First Layout */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-auto"
              onClick={() => setIsFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                style={{
                  // Dynamic sizing based on image aspect ratio
                  width: imageDimensions
                    ? `min(95vw, ${(imageDimensions.width / imageDimensions.height) * 95}vh)`
                    : '95vw',
                  height: imageDimensions ? '95vh' : 'auto',
                  aspectRatio: imageDimensions
                    ? `${imageDimensions.width} / ${imageDimensions.height}`
                    : 'auto',
                }}
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

                {/* Fullscreen Image Container - Image-First */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {galleryImages[0] && (
                    <Image
                      ref={imageRef}
                      src={galleryImages[0]}
                      alt="Fullscreen view"
                      onLoad={handleImageLoad}
                      className="w-full h-full object-contain"
                      style={{
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                        width: 'auto',
                        height: 'auto',
                      }}
                    />
                  )}
                </div>

                {/* Navigation in Fullscreen */}
                <motion.button
                  onClick={handlePrev}
                  whileHover={{ scale: 1.1 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 transition-colors z-40"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 transition-colors z-40"
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
