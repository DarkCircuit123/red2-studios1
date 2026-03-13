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
  const [screenDimensions, setScreenDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: typeof window !== 'undefined' ? window.innerWidth : 1024, height: typeof window !== 'undefined' ? window.innerHeight : 768 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track screen resize
  useEffect(() => {
    const handleResize = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Calculate optimal image dimensions to maximize screen usage
  const calculateImageDimensions = () => {
    if (!imageDimensions) return { width: '95vw', height: '90vh' };

    const imageAspect = imageDimensions.width / imageDimensions.height;
    const screenAspect = screenDimensions.width / screenDimensions.height;
    
    // Account for padding and UI elements
    const maxWidth = screenDimensions.width * 0.95;
    const maxHeight = screenDimensions.height * 0.85; // Leave room for thumbnails and controls

    let width, height;

    if (imageAspect > screenAspect) {
      // Image is wider - constrain by width
      width = maxWidth;
      height = maxWidth / imageAspect;
    } else {
      // Image is taller - constrain by height
      height = maxHeight;
      width = maxHeight * imageAspect;
    }

    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  const imageDims = calculateImageDimensions();

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
        {/* Subtle background drift animation */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '1% 1%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

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
          className="flex items-center justify-center flex-1 w-full relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glass panel glow effect - subtle */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 40px rgba(255, 255, 255, 0.05)',
                '0 0 60px rgba(255, 255, 255, 0.08)',
                '0 0 40px rgba(255, 255, 255, 0.05)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="flex items-center justify-center rounded-lg"
            style={{
              width: imageDims.width,
              height: imageDims.height,
              willChange: 'box-shadow',
            }}
          >
            <Image
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              className="w-full h-full object-contain rounded-lg"
            />
          </motion.div>
        </motion.div>

        {/* Navigation Arrows - Subtle and Minimal */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </motion.button>

        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors z-10"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </motion.button>

        {/* Thumbnail Filmstrip - Larger and Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 flex gap-3 overflow-x-auto pb-2 max-w-full z-10 px-4 justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, idx) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 h-24 w-auto transition-all duration-300 rounded-md overflow-hidden ${
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
          className="mt-6 text-white/50 text-sm font-mono z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {currentIndex + 1} / {images.length}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
