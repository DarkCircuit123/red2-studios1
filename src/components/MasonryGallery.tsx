import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

interface MasonryItem {
  id: string;
  image: string;
  aspectRatio: number;
  title?: string;
}

interface MasonryGalleryProps {
  items: MasonryItem[];
  onImageClick: (image: string, index: number) => void;
  isLoading?: boolean;
}

// Preload image dimensions with Promise
const preloadImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
};

export default function MasonryGallery({
  items,
  onImageClick,
  isLoading = false,
}: MasonryGalleryProps) {
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [scrollY, setScrollY] = useState(0);

  // Optimized image dimension loading with batching
  useEffect(() => {
    const itemsToLoad = items.filter((item) => !imageDimensions[item.id]);
    
    if (itemsToLoad.length === 0) return;

    // Batch load with staggering for performance
    const loadBatch = async () => {
      for (const item of itemsToLoad) {
        try {
          const dims = await preloadImageDimensions(item.image);
          setImageDimensions((prev) => ({
            ...prev,
            [item.id]: dims,
          }));
        } catch {
          // Silently fail - use default aspect ratio
        }
      }
    };

    loadBatch();
  }, [items, imageDimensions]);

  // Track scroll for subtle parallax with passive listener
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate optimal column layout
  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2;
    return 3;
  }, []);

  const [columnCount, setColumnCount] = useState(getColumnCount());

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount());
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [getColumnCount]);

  // Memoized column distribution
  const columns = useMemo(() => {
    const cols: MasonryItem[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array(columnCount).fill(0);

    items.forEach((item) => {
      const dims = imageDimensions[item.id];
      const height = dims ? 1 / (dims.width / dims.height) : 1;

      const minColumn = columnHeights.indexOf(Math.min(...columnHeights));
      cols[minColumn].push(item);
      columnHeights[minColumn] += height;
    });

    return cols;
  }, [items, imageDimensions, columnCount]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="bg-white/5 animate-pulse aspect-square rounded-lg" />
          ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:gap-8" style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
      {columns.map((column, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-6 md:gap-8">
          {column.map((item, itemIdx) => {
            const dims = imageDimensions[item.id];
            const aspectRatio = dims
              ? `${dims.width} / ${dims.height}`
              : '1 / 1';
            
            // Subtle parallax offset
            const parallaxOffset = (scrollY * 0.02 * (colIdx % 2 === 0 ? 1 : -1)) / (itemIdx + 1);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: (colIdx * column.length + itemIdx) * 0.05,
                  ease: 'easeOut',
                }}
                className="group relative overflow-hidden rounded-lg cursor-pointer"
                onClick={() => onImageClick(item.image, items.indexOf(item))}
                style={{ 
                  aspectRatio,
                  transform: `translateY(${parallaxOffset}px)`,
                  willChange: 'transform',
                }}
              >
                {/* Background glass effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Image */}
                <Image
                  src={item.image}
                  alt={item.title || 'Gallery image'}
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                />

                {/* Grain overlay */}
                <div className="absolute inset-0 bg-grain opacity-3 pointer-events-none" />

                {/* Overlay on hover */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" 
                />

                {/* Title on hover */}
                {item.title && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-end justify-start p-6 pointer-events-none"
                  >
                    <p className="text-white font-heading font-semibold text-sm">
                      {item.title}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
