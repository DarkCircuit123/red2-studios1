import { useState, useEffect } from 'react';
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

export default function MasonryGallery({
  items,
  onImageClick,
  isLoading = false,
}: MasonryGalleryProps) {
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});

  // Load image dimensions for masonry calculation
  useEffect(() => {
    items.forEach((item) => {
      if (!imageDimensions[item.id]) {
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions((prev) => ({
            ...prev,
            [item.id]: {
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          }));
        };
        img.src = item.image;
      }
    });
  }, [items, imageDimensions]);

  // Calculate optimal column layout based on aspect ratios
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2;
    return 3;
  };

  const [columnCount, setColumnCount] = useState(getColumnCount());

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Distribute items into columns based on aspect ratios
  const distributeItems = () => {
    const columns: MasonryItem[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array(columnCount).fill(0);

    items.forEach((item) => {
      const dims = imageDimensions[item.id];
      const height = dims ? 1 / (dims.width / dims.height) : 1;

      // Find column with smallest height
      const minColumn = columnHeights.indexOf(Math.min(...columnHeights));
      columns[minColumn].push(item);
      columnHeights[minColumn] += height;
    });

    return columns;
  };

  const columns = distributeItems();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="bg-white/5 animate-pulse aspect-square" />
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

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: (colIdx * column.length + itemIdx) * 0.05,
                }}
                className="group relative overflow-hidden bg-black/30 cursor-pointer"
                onClick={() => onImageClick(item.image, items.indexOf(item))}
                style={{ aspectRatio }}
              >
                {/* Image - Preserves Aspect Ratio */}
                <Image
                  src={item.image}
                  alt={item.title || 'Gallery image'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Subtle grain overlay */}
                <div className="absolute inset-0 bg-grain opacity-5" />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                {/* Title on hover (optional) */}
                {item.title && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={
                      true
                        ? { opacity: 0, y: 10 }
                        : { opacity: 1, y: 0 }
                    }
                    className="absolute inset-0 flex items-end justify-end p-6 group-hover:opacity-100"
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
