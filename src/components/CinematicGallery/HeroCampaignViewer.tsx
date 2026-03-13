import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';

interface HeroCampaignViewerProps {
  images: string[];
  titles?: string[];
  onImageClick?: (index: number) => void;
}

export default function HeroCampaignViewer({
  images,
  titles = [],
  onImageClick,
}: HeroCampaignViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isAutoPlay || images.length === 0) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlay, images.length]);

  const handleMouseEnter = () => setIsAutoPlay(false);
  const handleMouseLeave = () => setIsAutoPlay(true);

  if (images.length === 0) return null;

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Film Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.015] mix-blend-overlay bg-grain" />

      {/* Ambient Red Lighting */}
      <div className="absolute inset-0 pointer-events-none z-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-900/15 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Images Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={images[currentIndex]}
              alt={titles[currentIndex] || `Campaign image ${currentIndex + 1}`}
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => onImageClick?.(currentIndex)}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Title Overlay */}
      {titles[currentIndex] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute bottom-8 sm:bottom-12 left-4 sm:left-8 md:left-16 z-20 pointer-events-none"
        >
          <p className="text-xs sm:text-sm md:text-base font-heading text-white/70 tracking-widest uppercase">
            {titles[currentIndex]}
          </p>
        </motion.div>
      )}

      {/* Navigation Dots */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsAutoPlay(false);
            }}
            className={`transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 sm:w-8 h-1 bg-white'
                : 'w-2 h-1 bg-white/30 hover:bg-white/60'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 text-white/40 text-xs tracking-widest uppercase"
      >
        Scroll to explore
      </motion.div>
    </div>
  );
}
