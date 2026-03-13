import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

interface HorizontalScrollerProps {
  images: string[];
  onImageClick: (image: string, index: number) => void;
}

export default function HorizontalProjectScroller({
  images,
  onImageClick,
}: HorizontalScrollerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [imageDimensions, setImageDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});

  // Load image dimensions
  useEffect(() => {
    images.forEach((image, idx) => {
      if (!imageDimensions[idx]) {
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions((prev) => ({
            ...prev,
            [idx]: {
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          }));
        };
        img.src = image;
      }
    });
  }, [images, imageDimensions]);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="relative group">
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 md:gap-8 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {images.map((image, idx) => {
          const dims = imageDimensions[idx];
          const aspectRatio = dims
            ? `${dims.width} / ${dims.height}`
            : '16 / 9';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className="flex-shrink-0 snap-center cursor-pointer group/item"
              style={{
                width: 'clamp(300px, 50vw, 600px)',
                aspectRatio: aspectRatio,
              }}
              onClick={() => onImageClick(image, idx)}
            >
              <div className="relative w-full h-full overflow-hidden bg-black/30">
                {/* Image */}
                <Image
                  src={image}
                  alt={`Project image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                />

                {/* Subtle grain overlay */}
                <div className="absolute inset-0 bg-grain opacity-5" />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/40 transition-colors duration-300" />

                {/* Image counter */}
                <div className="absolute bottom-4 left-4 text-white/60 text-xs font-mono opacity-0 group-hover/item:opacity-100 transition-opacity">
                  {idx + 1} / {images.length}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Left Scroll Button */}
      {canScrollLeft && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll('left')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 p-2 text-white/60 hover:text-white transition-colors z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
      )}

      {/* Right Scroll Button */}
      {canScrollRight && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll('right')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 p-2 text-white/60 hover:text-white transition-colors z-10"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}
