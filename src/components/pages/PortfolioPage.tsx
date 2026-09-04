import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { filterValidImages, generateSanitizationReport } from '@/lib/image-url-sanitizer';
import WixImageResolver from '@/lib/wix-image-resolver';
import { Image } from '@/components/ui/image';

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

export default function PortfolioPage() {
  const [allImages, setAllImages] = useState<ImageWithDimensions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        
        // Filter out items with broken/placeholder URLs using sanitizer
        const allItems = result.items || [];
        const validImages = filterValidImages(allItems, 'image');
        
        // Sort by displayOrder to maintain 30-slot gallery order (Slot 1-30)
        const sortedImages = validImages.sort((a, b) => {
          const orderA = a.displayOrder || 999;
          const orderB = b.displayOrder || 999;
          return orderA - orderB;
        });
        
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
            `[PortfolioPage] Image Sanitization Report:\n` +
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
          sortedImages.map(
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
                  const img = new window.Image();
                  img.onload = () => {
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    resolve({
                      ...image,
                      originWidth: img.naturalWidth,
                      originHeight: img.naturalHeight,
                      aspectRatio,
                    });
                  };
                  img.onerror = () => {
                    console.warn('Failed to load image:', image.image);
                    resolve({
                      ...image,
                      aspectRatio: 0.75, // Default 3:4 portrait
                    });
                  };
                  const resolved = WixImageResolver.resolve(image.image);
                  img.src = resolved.url || '';
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

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main ref={containerRef} className="max-w-[120rem] mx-auto px-8 py-24 md:py-32">
        {/* Page Header */}
        <ScrollReveal direction="up" duration={800} className="mb-20">
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            All Photos
          </h1>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A comprehensive collection of {allImages.length} photography work showcasing precision and creative excellence.
          </p>
        </ScrollReveal>

        {/* Masonry Grid */}
        {!isLoading && allImages.length > 0 && (
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
                      transition={{ delay: globalIndex * 0.03, duration: 0.4 }}
                      className="relative overflow-hidden rounded-lg bg-white/5 group cursor-pointer w-full"
                      style={{ display: 'block' }}
                    >
                      <div
                        className="relative w-full overflow-hidden"
                        style={{
                          paddingBottom: image.aspectRatio
                            ? `${(1 / (image.aspectRatio || 1)) * 100}%`
                            : '133.33%', // 3:4 default
                        }}
                      >
                        <Image
                          src={WixImageResolver.resolve(image.image).url}
                          alt={image.altText || image.caption || 'Portfolio image'}
                          fittingType="fit"
                          className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-4">
                          {image.caption && (
                            <p className="text-white text-sm font-paragraph opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {image.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && allImages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-base font-paragraph text-white/50 mb-8">
              No images found yet
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
