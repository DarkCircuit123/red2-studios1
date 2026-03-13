import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

interface EditorialItem {
  id: string;
  image: string;
  title?: string;
  span?: 'small' | 'medium' | 'large';
}

interface EditorialLayoutProps {
  items: EditorialItem[];
  onImageClick?: (index: number) => void;
}

export default function EditorialLayout({
  items,
  onImageClick,
}: EditorialLayoutProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set([...prev, id]));
  };

  // Distribute span sizes dynamically for editorial layout
  const getSpanClass = (index: number): string => {
    const pattern = [
      'col-span-2 row-span-2', // Large horizontal
      'col-span-1 row-span-1', // Small
      'col-span-1 row-span-1', // Small
      'col-span-1 row-span-2', // Tall vertical
      'col-span-2 row-span-1', // Wide horizontal
      'col-span-1 row-span-1', // Small
    ];
    return pattern[index % pattern.length];
  };

  const getParallaxOffset = (index: number): number => {
    const baseOffset = (scrollY - (index * 100)) * 0.3;
    return Math.min(Math.max(baseOffset, -30), 30);
  };

  return (
    <div ref={containerRef} className="relative w-full py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      {/* Background RED2 Typography */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-40 text-6xl sm:text-8xl md:text-[12rem] lg:text-[20rem] font-heading font-black text-white/[0.03] tracking-tighter whitespace-nowrap"
          animate={{ y: scrollY * 0.1 }}
        >
          RED2
        </motion.div>
      </div>

      {/* Editorial Grid - Responsive */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 auto-rows-[200px] sm:auto-rows-[250px] md:auto-rows-[300px] lg:auto-rows-[350px]">
        {items.map((item, index) => {
          const spanClass = getSpanClass(index);
          const parallaxOffset = getParallaxOffset(index);
          const isLoaded = loadedImages.has(item.id);

          return (
            <motion.div
              key={item.id}
              className={`${spanClass} relative group cursor-pointer overflow-hidden bg-black/50`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.05 }}
              viewport={{ once: true, margin: '-100px' }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onImageClick?.(index)}
              style={{
                transform: `translateY(${parallaxOffset}px)`,
              }}
            >
              {/* Image */}
              <motion.div
                className="absolute inset-0 overflow-hidden"
                animate={{
                  scale: hoveredId === item.id ? 1.04 : 1,
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <Image
                  src={item.image}
                  alt={item.title || 'Gallery image'}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImageLoad(item.id)}
                />
              </motion.div>

              {/* Loading Skeleton */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black animate-pulse" />
              )}

              {/* Subtle Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Title Overlay */}
              {item.title && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 lg:p-6 z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: hoveredId === item.id ? 1 : 0,
                    y: hoveredId === item.id ? 0 : 10,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-xs md:text-sm font-heading text-white tracking-widest uppercase line-clamp-2">
                    {item.title}
                  </p>
                </motion.div>
              )}

              {/* Subtle Red Accent on Hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  boxShadow:
                    hoveredId === item.id
                      ? 'inset 0 0 40px rgba(111, 8, 9, 0.2)'
                      : 'inset 0 0 0px rgba(111, 8, 9, 0)',
                }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
