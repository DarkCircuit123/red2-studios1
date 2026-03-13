import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Image } from '@/components/ui/image';

interface GalleryViewerProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function GalleryViewer({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: GalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [preloadedDimensions, setPreloadedDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload next and previous images
  useEffect(() => {
    const preloadImage = (index: number) => {
      if (preloadedDimensions[index]) return;

      const img = new window.Image();
      img.onload = () => {
        setPreloadedDimensions((prev) => ({
          ...prev,
          [index]: { width: img.naturalWidth, height: img.naturalHeight },
        }));
      };
      img.src = images[index];
    };

    if (isOpen) {
      preloadImage(currentIndex);
      if (currentIndex > 0) preloadImage(currentIndex - 1);
      if (currentIndex < images.length - 1) preloadImage(currentIndex + 1);
    }
  }, [currentIndex, isOpen, images, preloadedDimensions]);

  // Get current image dimensions
  useEffect(() => {
    if (preloadedDimensions[currentIndex]) {
      setImageDimensions(preloadedDimensions[currentIndex]);
    } else {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.src = images[currentIndex];
    }
  }, [currentIndex, images, preloadedDimensions]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Mouse wheel navigation
  useEffect(() => {
    if (!isOpen) return;

    let wheelTimeout: NodeJS.Timeout;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 0) handleNext();
        else if (e.deltaY < 0) handlePrev();
      }, 50);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [isOpen, handleNext, handlePrev]);

  // Touch/swipe navigation
  const touchStartX = useRef(0);
  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) handleNext();
        else handlePrev();
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, handleNext, handlePrev]);

  if (!isOpen) return null;

  const aspectRatio = imageDimensions
    ? `${imageDimensions.width} / ${imageDimensions.height}`
    : 'auto';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/98 flex flex-col items-center justify-center p-4"
        onClick={onClose}
        ref={containerRef}
      >
        {/* Close Button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition-colors z-10"
          aria-label="Close viewer"
        >
          <X className="w-6 h-6" />
        </motion.button>

        {/* Main Image Container - Proportional Scaling */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center flex-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-center"
            style={{
              maxWidth: '95vw',
              maxHeight: '85vh',
              aspectRatio: aspectRatio,
            }}
          >
            <Image
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        {/* Navigation Arrows - Subtle and Minimal */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </motion.button>

        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </motion.button>

        {/* Thumbnail Filmstrip - Horizontal Below Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 flex gap-2 overflow-x-auto pb-2 max-w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, idx) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 h-16 w-auto transition-all duration-300 ${
                idx === currentIndex
                  ? 'ring-2 ring-white'
                  : 'opacity-50 hover:opacity-75'
              }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-auto object-contain"
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Image Counter - Minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-white/50 text-sm font-mono"
          onClick={(e) => e.stopPropagation()}
        >
          {currentIndex + 1} / {images.length}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
