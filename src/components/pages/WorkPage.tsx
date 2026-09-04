import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { playClickSound } from '@/lib/click-sound';
import { filterValidImages, generateSanitizationReport } from '@/lib/image-url-sanitizer';
import WixImageResolver from '@/lib/wix-image-resolver';

const ROW_UNIT = 8; // pixels per row unit
const GAP = 24; // gap in pixels (matches gap-6 = 1.5rem = 24px)

interface ImageWithLayout extends Portfolio {
  layoutSize: 'small' | 'medium' | 'large';
  layoutOrientation: 'portrait' | 'landscape' | 'square';
  aspectRatio?: number;
  originWidth?: number;
  originHeight?: number;
  gridRowSpan?: number;
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
 * Calculate grid row span based on aspect ratio and column width
 * Formula: (columnWidth * aspectRatio + gap) / ROW_UNIT, rounded up
 */
const calculateGridRowSpan = (aspectRatio: number, columnWidth: number): number => {
  if (!aspectRatio || !columnWidth) return 1;
  const height = columnWidth * aspectRatio + GAP;
  return Math.ceil(height / ROW_UNIT);
};

export default function WorkPage() {
  const [allImages, setAllImages] = useState<ImageWithLayout[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [columnWidth, setColumnWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Set up ResizeObserver to track column width changes
  useEffect(() => {
    if (!gridRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (gridRef.current) {
        const gridStyle = window.getComputedStyle(gridRef.current);
        const gridTemplateColumns = gridStyle.gridTemplateColumns;
        if (gridTemplateColumns && gridTemplateColumns !== 'none') {
          const columns = gridTemplateColumns.split(' ');
          const firstColWidth = parseFloat(columns[0]);
          if (!isNaN(firstColWidth)) {
            setColumnWidth(firstColWidth);
          }
        }
      }
    });

    resizeObserver.observe(gridRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Recalculate grid row spans when column width changes
  useEffect(() => {
    if (columnWidth > 0 && allImages.length > 0) {
      setAllImages(prevImages =>
        prevImages.map(img => ({
          ...img,
          gridRowSpan: img.aspectRatio ? calculateGridRowSpan(img.aspectRatio, columnWidth) : 1,
        }))
      );
    }
  }, [columnWidth]);

  // Fetch all images from portfolioimages collection
  useEffect(() => {
    const fetchAllImages = async () => {
      setIsLoading(true);
      try {
        const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 1000 });
        const allImages = result.items || [];
        
        // Filter out items with broken/placeholder URLs using sanitizer
        const validImages = filterValidImages(allImages, 'image');
        
        // Generate and log sanitization report
        const report = generateSanitizationReport(
          allImages.length,
          validImages.length,
          allImages
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
          // Store report for display in status component
          sessionStorage.setItem('imageSanitizationReport', JSON.stringify({
            originalCount: report.originalCount,
            sanitizedCount: report.sanitizedCount,
            removed: report.removed,
            percentageRemoved: report.percentageRemoved,
          }));
        }
        
        // Assign artful layout sizes and orientations, load dimensions
        const layoutImages: ImageWithLayout[] = await Promise.all(
          validImages.map(async (img, index) => {
            const layoutPattern = index % 12;
            let layoutSize: 'small' | 'medium' | 'large' = 'medium';
            let layoutOrientation: 'portrait' | 'landscape' | 'square' = 'square';

            // Create an artful pattern
            if (layoutPattern === 0 || layoutPattern === 7) {
              layoutSize = 'large';
              layoutOrientation = layoutPattern === 0 ? 'landscape' : 'portrait';
            } else if (layoutPattern === 3 || layoutPattern === 9) {
              layoutSize = 'large';
              layoutOrientation = layoutPattern === 3 ? 'portrait' : 'landscape';
            } else if (layoutPattern % 2 === 0) {
              layoutSize = 'medium';
              layoutOrientation = 'square';
            } else {
              layoutSize = 'small';
              layoutOrientation = layoutPattern % 3 === 1 ? 'portrait' : 'landscape';
            }

            // Try to extract origin dimensions from URL first
            const urlDims = extractOriginDimensions(img.image);
            
            if (urlDims.width && urlDims.height) {
              // Use extracted dimensions
              const aspectRatio = urlDims.width / urlDims.height;
              return {
                ...img,
                layoutSize,
                layoutOrientation,
                originWidth: urlDims.width,
                originHeight: urlDims.height,
                aspectRatio,
                gridRowSpan: columnWidth > 0 ? calculateGridRowSpan(aspectRatio, columnWidth) : 1,
              };
            } else {
              // Fall back to loading image to measure
              return new Promise<ImageWithLayout>((resolve) => {
                const image = new window.Image();
                image.onload = () => {
                  const aspectRatio = image.naturalWidth / image.naturalHeight;
                  resolve({
                    ...img,
                    layoutSize,
                    layoutOrientation,
                    originWidth: image.naturalWidth,
                    originHeight: image.naturalHeight,
                    aspectRatio,
                    gridRowSpan: columnWidth > 0 ? calculateGridRowSpan(aspectRatio, columnWidth) : 1,
                  });
                };
                image.onerror = () => {
                  console.warn('Failed to load image:', img.image);
                  resolve({
                    ...img,
                    layoutSize,
                    layoutOrientation,
                    aspectRatio: 1,
                    gridRowSpan: 1,
                  });
                };
                const resolved = WixImageResolver.resolve(img.image);
                image.src = resolved.url || '';
              });
            }
          })
        );

        setAllImages(layoutImages);
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gridAutoRows: `${ROW_UNIT}px`,
            gap: `${GAP}px`,
            alignItems: 'start',
          }}>
            {Array(16)
              .fill(null)
              .map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="bg-white/5 animate-pulse"
                  style={{ gridRowEnd: 'span 50' }}
                />
              ))}
          </div>
        ) : allImages.length > 0 ? (
          <motion.div
            ref={gridRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gridAutoRows: `${ROW_UNIT}px`,
              gap: `${GAP}px`,
              alignItems: 'start',
            }}
          >
            {allImages.map((image, index) => {
              const yOffset = useTransform(scrollY, [0, 1000], [0, index % 2 === 0 ? 30 : -30]);

              return (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: (index % 12) * 0.05,
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                  }}
                  style={{
                    y: yOffset,
                    gridRowEnd: image.gridRowSpan ? `span ${image.gridRowSpan}` : 'auto',
                  }}
                  className="relative overflow-hidden group cursor-pointer"
                  onClick={() => {
                    playClickSound();
                    setSelectedImage(image.image || '');
                  }}
                >
                  {/* Image Container with Parallax */}
                  <motion.div
                    className="relative w-full h-full overflow-hidden bg-black/30"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                  >
                    {/* Image */}
                    <Image
                      src={image.image || 'https://static.wixstatic.com/media/e9d727_9c9c4486a82b496ca6c48026f5bbed4d~mv2.png?originWidth=576&originHeight=384'}
                      alt={image.altText || 'Portfolio image'}
                      fittingType="fit"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
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
                  </motion.div>
                </motion.div>
              );
            })}
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
