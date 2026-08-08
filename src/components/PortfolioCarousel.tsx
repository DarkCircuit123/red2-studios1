import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { playClickSound } from '@/lib/click-sound';

interface CarouselImage {
  _id: string;
  image: string;
  altText?: string;
  aspectRatio?: number;
  gridSpan?: 'vertical' | 'horizontal' | 'square';
}

interface PortfolioCarouselProps {
  images: CarouselImage[];
  isLoading?: boolean;
}

export default function PortfolioCarousel({ images, isLoading = false }: PortfolioCarouselProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || !isAutoScrolling || images.length === 0) return;

    const startAutoScroll = () => {
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const maxScroll = container.scrollWidth - container.clientWidth;
          
          // Scroll by 2px every 50ms (smooth slow scroll)
          let newPosition = container.scrollLeft + 2;
          
          // Loop back to start when reaching end
          if (newPosition >= maxScroll) {
            newPosition = 0;
          }
          
          container.scrollLeft = newPosition;
          setScrollPosition(newPosition);
        }
      }, 50);
    };

    startAutoScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, images.length]);

  // Pause auto-scroll on hover
  const handleMouseEnter = () => {
    setIsAutoScrolling(false);
  };

  const handleMouseLeave = () => {
    setIsAutoScrolling(true);
  };

  // Handle manual scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition((e.target as HTMLDivElement).scrollLeft);
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gradient-to-r from-black via-white/5 to-black animate-pulse rounded-lg" />
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-96 bg-black/50 rounded-lg flex items-center justify-center border border-white/10">
        <p className="text-white/50 font-paragraph">No images available</p>
      </div>
    );
  }

  return (
    <>
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

      {/* Auto-Scrolling Carousel Container */}
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black/30 border border-white/10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scroll-smooth gap-4 p-4 md:p-6 scrollbar-hide"
          style={{
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Render images twice for seamless loop */}
          {[...images, ...images].map((image, index) => {
            const isVertical = image.gridSpan === 'vertical';
            const isHorizontal = image.gridSpan === 'horizontal';
            const isOriginal = index < images.length;

            return (
              <motion.div
                key={`${image._id}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="flex-shrink-0 cursor-pointer group relative overflow-hidden rounded-lg"
                style={{
                  width: isHorizontal ? '500px' : isVertical ? '280px' : '350px',
                  height: isVertical ? '420px' : isHorizontal ? '280px' : '350px',
                }}
                onClick={() => {
                  playClickSound();
                  setSelectedImage(image.image || '');
                }}
              >
                {/* Parallax Image Container */}
                <motion.div
                  className="relative w-full h-full overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                >
                  <Image
                    src={image.image || 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384'}
                    alt={image.altText || 'Portfolio image'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    data-field-name="image"
                    data-record-id={image._id}
                  />

                  {/* Parallax overlay effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-black/40"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                </motion.div>

                {/* Image count badge */}
                {isOriginal && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-mono text-white/70">
                    {index + 1} / {images.length}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Gradient fade edges for visual polish */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="w-1 h-1 rounded-full bg-white/40"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="w-1 h-1 rounded-full bg-white/40"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="w-1 h-1 rounded-full bg-white/40"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
        </motion.div>

        {/* Auto-scroll indicator text */}
        <motion.div
          className="absolute bottom-4 right-4 text-xs font-mono text-white/40 pointer-events-none"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {isAutoScrolling ? 'Auto-scrolling' : 'Paused'}
        </motion.div>
      </div>

      {/* Collage Grid Layout - Dynamic based on image count */}
      <div className="mt-12 w-full">
        <h3 className="text-lg font-heading font-semibold text-white mb-6">Gallery Collage</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-max">
          {images.map((image, index) => {
            const isVertical = image.gridSpan === 'vertical';
            const isHorizontal = image.gridSpan === 'horizontal';

            return (
              <motion.div
                key={image._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`relative overflow-hidden cursor-pointer group rounded-lg ${
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
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
