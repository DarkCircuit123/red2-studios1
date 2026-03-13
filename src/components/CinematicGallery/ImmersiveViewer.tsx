import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

interface ImmersiveViewerProps {
  images: string[];
  titles?: string[];
  years?: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function ImmersiveViewer({
  images,
  titles = [],
  years = [],
  isOpen,
  onClose,
  initialIndex = 0,
}: ImmersiveViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const touchStartRef = useRef<number>(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setImageLoaded(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageLoaded(false);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageLoaded(false);
  }, [images.length]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 bg-black"
        onClick={onClose}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Film Grain Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.01] mix-blend-overlay bg-grain" />

        {/* Ambient Red Lighting */}
        <div className="absolute inset-0 pointer-events-none z-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl opacity-15" />
        </div>

        {/* Image Container */}
        <div
          className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 md:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <Image
                src={images[currentIndex]}
                alt={titles[currentIndex] || `Image ${currentIndex + 1}`}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Loading Indicator */}
        {!imageLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/30 text-xs tracking-widest uppercase"
            >
              Loading...
            </motion.div>
          </motion.div>
        )}

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 sm:left-6 md:left-8 z-20 pointer-events-none"
        >
          {titles[currentIndex] && (
            <p className="text-xs md:text-sm font-heading text-white/80 tracking-widest uppercase mb-1 md:mb-2">
              {titles[currentIndex]}
            </p>
          )}
          <p className="text-xs font-heading text-white/50 tracking-wide">
            {currentIndex + 1} / {images.length}
            {years[currentIndex] && ` • ${years[currentIndex]}`}
          </p>
        </motion.div>

        {/* Navigation Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-20 pointer-events-none flex items-center justify-between p-2 sm:p-4 md:p-8"
        >
          {/* Left Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="pointer-events-auto p-2 sm:p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="pointer-events-auto p-2 sm:p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
        </motion.div>

        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 z-20 p-2 sm:p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm"
          aria-label="Close viewer"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
        </motion.button>

        {/* Progress Bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (currentIndex + 1) / images.length }}
          transition={{ duration: 0.6 }}
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-red-900 to-red-600 origin-left z-20"
        />

        {/* Keyboard Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 0.5 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-20 text-xs font-heading text-white/40 tracking-widest uppercase pointer-events-none"
        >
          ← → to navigate • ESC to close
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
