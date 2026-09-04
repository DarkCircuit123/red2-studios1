import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { playClickSound } from '@/lib/click-sound';
import { filterValidImages, generateSanitizationReport } from '@/lib/image-url-sanitizer';
import WixImageResolver from '@/lib/wix-image-resolver';

const GAP = 24; // gap in pixels (matches gap-6 = 1.5rem = 24px)

interface ImageWithDimensions extends Portfolio {
  aspectRatio?: number;
  originWidth?: number;
  originHeight?: number;
}

/**
 * Extract origin dimensions from wix:image:// URL fragment
 * Format: wix:image://v1/{uri}/{filename}#originWidth={w}&originHeight={h}
 */
const extractOriginDimensions = (url: string): { width?: number; height?: number } => {
  if (!url) return {};
  
  const wixImagePrefix = 'wix:image://v1/';
  if (url.startsWith(wixImagePrefix)) {
    const withoutPrefix = url.replace(wixImagePrefix, '');
    const [, paramsString] = withoutPrefix.split('#');
    if (paramsString) {
      const params = new URLSearchParams(paramsString);
      const width = params.get('originWidth');
      const height = params.get('originHeight');
      return {
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
      };
    }
  }
  return {};
};

/**
 * Distribute images into columns using shortest-column-first packing
 * Returns array of arrays, one per column
 */
const distributeIntoColumns = (
  images: ImageWithDimensions[],
  columnCount: number,
  columnWidth: number
): ImageWithDimensions[][] => {
  const columns: ImageWithDimensions[][] = Array.from({ length: columnCount }, () => []);
  const columnHeights: number[] = Array(columnCount).fill(0);

  images.forEach((image) => {
    // Calculate display height for this image
    const aspectRatio = image.aspectRatio || 0.75; // Default to 3:4 portrait
    const displayHeight = columnWidth * aspectRatio + GAP;

    // Find column with smallest height (leftmost on tie)
    let minHeight = columnHeights[0];
    let minColumn = 0;
    for (let i = 1; i < columnCount; i++) {
      if (columnHeights[i] < minHeight) {
        minHeight = columnHeights[i];
        minColumn = i;
      }
    }

    // Add image to shortest column
    columns[minColumn].push(image);
    columnHeights[minColumn] += displayHeight;
  });

  return columns;
};

/**
 * Determine column count based on viewport width
 */
const getColumnCount = (containerWidth: number): number => {
  if (containerWidth < 768) return 1;  // mobile
  if (containerWidth < 1024) return 2; // md
  return 4;                             // lg
};

export default function WorkPage() {
  const [allImages, setAllImages] = useState<ImageWithDimensions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [columnCount, setColumnCount] = useState(1);
  const [columns, setColumns] = useState<ImageWithDimensions[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width and update column count
  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      setContainerWidth(width);
      setColumnCount(getColumnCount(width));
    };

    updateLayout();
    const resizeObserver = new ResizeObserver(updateLayout);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Redistribute images when container width or column count changes
  useEffect(() => {
    if (allImages.length > 0 && containerWidth > 0 && columnCount > 0) {
      const columnWidth = (containerWidth - GAP * (columnCount - 1)) / columnCount;
      const newColumns = distributeIntoColumns(allImages, columnCount, columnWidth);
      setColumns(newColumns);
    }
  }, [allImages, containerWidth, columnCount]);

  // Fetch all images from portfolioimages collection
  useEffect(() => {
    const fetchAllImages = async () => {
      setIsLoading(true);
      try {
        const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 1000 });
        const allItems = result.items || [];
        
        // Filter out items with broken/placeholder URLs using sanitizer
        const validImages = filterValidImages(allItems, 'image');
        
        // Generate and log sanitization report
        const report = generateSanitizationReport(
          allItems.length,
          validImages.length,
          allItems
            .filter(img => !validImages.find(v => v._id === img._id))
            .map(img => img.image || 'unknown')
        );
        
        if (report.removed > 0) {
          console.info(
            `[WorkPage] Image Sanitization Report:\n` +
            `  Original: ${report.originalCount}\n` +
            `  Valid: ${report.sanitizedCount}\n` +
            `  Removed: ${report.removed} (${report.percentageRemoved.toFixed(1)}%)`
          );
          sessionStorage.setItem('imageSanitizationReport', JSON.stringify({
            originalCount: report.originalCount,
            sanitizedCount: report.sanitizedCount,
            removed: report.removed,
            percentageRemoved: report.percentageRemoved,
          }));
        }
        
        // Load image dimensions
        const imagesWithDimensions = await Promise.all(
          validImages.map(
            (image) =>
              new Promise<ImageWithDimensions>((resolve) => {
                // Try to extract origin dimensions from URL first
                const urlDims = extractOriginDimensions(image.image);
                
                if (urlDims.width && urlDims.height) {
                  // Use extracted dimensions
                  const aspectRatio = urlDims.width / urlDims.height;
                  resolve({
                    ...image,
                    originWidth: urlDims.width,
                    originHeight: urlDims.height,
                    aspectRatio,
                  });
                } else {
                  // Fall back to loading image to measure
                  return new Promise<ImageWithDimensions>((innerResolve) => {
                    const img = new window.Image();
                    img.onload = () => {
                      const aspectRatio = img.naturalWidth / img.naturalHeight;
                      innerResolve({
                        ...image,
                        originWidth: img.naturalWidth,
                        originHeight: img.naturalHeight,
                        aspectRatio,
                      });
                    };
                    img.onerror = () => {
                      console.warn('Failed to load image:', image.image);
                      innerResolve({
                        ...image,
                        aspectRatio: 0.75, // Default 3:4 portrait
                      });
                    };
                    const resolved = WixImageResolver.resolve(image.image);
                    img.src = resolved.url || '';
                  });
                }
              })
          )
        );

        setAllImages(imagesWithDimensions);
      } catch (error) {
        console.error('Failed to fetch portfolio images:', error);
        setAllImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllImages();
  }, []);

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

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Header />

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
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
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

      <main ref={containerRef} className="max-w-[120rem] mx-auto px-4 md:px-8 py-24 md:py-32">
        {/* Page Header - Minimal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white tracking-tighter">
            Work
          </h1>
        </motion.div>

        {/* Masonry Grid - Pure Photos */}
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              gap: `${GAP}px`,
              alignItems: 'flex-start',
            }}
          >
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <div
                key={colIndex}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${GAP}px`,
                }}
              >
                {Array(4)
                  .fill(null)
                  .map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="bg-white/5 animate-pulse w-full"
                      style={{ paddingBottom: '133.33%', position: 'relative' }}
                    />
                  ))}
              </div>
            ))}
          </div>
        ) : allImages.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex',
              gap: `${GAP}px`,
              alignItems: 'flex-start',
            }}
          >
            {columns.map((column, colIndex) => (
              <div
                key={colIndex}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${GAP}px`,
                }}
              >
                {column.map((image, imgIndex) => {
                  const globalIndex = allImages.findIndex(img => img._id === image._id);
                  return (
                    <motion.div
                      key={image._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: (globalIndex % 12) * 0.03,
                        type: 'spring',
                        stiffness: 100,
                        damping: 15,
                      }}
                      className="relative overflow-hidden group cursor-pointer w-full"
                      onClick={() => {
                        playClickSound();
                        setSelectedImage(image.image || '');
                      }}
                      style={{ display: 'block' }}
                    >
                      {/* Image Container with Hover Effect */}
                      <div
                        className="relative w-full overflow-hidden bg-black/30"
                        style={{
                          paddingBottom: image.aspectRatio
                            ? `${(1 / (image.aspectRatio || 1)) * 100}%`
                            : '133.33%', // 3:4 default
                        }}
                      >
                        {/* Image */}
                        <Image
                          src={image.image || 'https://static.wixstatic.com/media/e9d727_9c9c4486a82b496ca6c48026f5bbed4d~mv2.png?originWidth=576&originHeight=384'}
                          alt={image.altText || 'Portfolio image'}
                          fittingType="fit"
                          className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                          data-field-name="image"
                          data-record-id={image._id}
                          loading="lazy"
                        />

                        {/* Subtle grain overlay */}
                        <div className="absolute inset-0 bg-grain opacity-5 pointer-events-none" />

                        {/* Hover overlay - minimal */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center"
                        >
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="text-white text-sm font-paragraph tracking-widest uppercase"
                          >
                            View
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-base font-paragraph text-white/50">
              No images found yet
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
