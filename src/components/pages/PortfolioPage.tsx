import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { filterValidImages, generateSanitizationReport } from '@/lib/image-url-sanitizer';
import WixImageResolver from '@/lib/wix-image-resolver';
import { STATIC_MEDIA_URL } from '@wix/image-kit';
import { Image } from '@/components/ui/image';

interface ImageWithAspectRatio extends Portfolio {
  aspectRatio?: number;
  gridSpan?: 'vertical' | 'horizontal' | 'square';
}

/**
 * Convert wix:image:// URLs to HTTPS URLs for browser rendering
 * This resolves the CSP issue where browsers cannot load wix:image:// directly
 */
const convertWixImageToHttps = (url: string): string => {
  const wixImagePrefix = 'wix:image://v1/';
  if (url.startsWith(wixImagePrefix)) {
    // Extract the URI and parameters from wix:image://v1/{uri}/{filename}#{params}
    const withoutPrefix = url.replace(wixImagePrefix, '');
    const [uriPart, paramsString] = withoutPrefix.split('#');
    const uri = uriPart.split('/')[0];
    
    // Parse origin dimensions if available
    const params = new URLSearchParams(paramsString || '');
    const originWidth = params.get('originWidth');
    const originHeight = params.get('originHeight');
    
    // Build HTTPS URL using Wix static CDN
    let httpsUrl = `${STATIC_MEDIA_URL}${uri}`;
    
    // Add origin dimensions if available
    if (originWidth && originHeight) {
      httpsUrl += `?originWidth=${originWidth}&originHeight=${originHeight}`;
    }
    
    return httpsUrl;
  }
  return url;
};

export default function PortfolioPage() {
  const [allImages, setAllImages] = useState<ImageWithAspectRatio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine grid span based on aspect ratio
  const getGridSpan = (aspectRatio: number): 'vertical' | 'horizontal' | 'square' => {
    if (aspectRatio < 0.8) return 'vertical'; // Portrait: taller than wide
    if (aspectRatio > 1.3) return 'horizontal'; // Landscape: wider than tall
    return 'square'; // Near square
  };

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
          // Store report for display in status component
          sessionStorage.setItem('imageSanitizationReport', JSON.stringify({
            originalCount: report.originalCount,
            sanitizedCount: report.sanitizedCount,
            removed: report.removed,
            percentageRemoved: report.percentageRemoved,
          }));
        }

        // Load image dimensions and determine grid spans
        const imagesWithDimensions = await Promise.all(
          sortedImages.map(
            (image) =>
              new Promise<ImageWithAspectRatio>((resolve) => {
                const img = new window.Image();
                img.onload = () => {
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  resolve({
                    ...image,
                    aspectRatio,
                    gridSpan: getGridSpan(aspectRatio),
                  });
                };
                img.onerror = () => {
                  console.warn('Failed to load image:', image.image);
                  resolve({
                    ...image,
                    aspectRatio: 1,
                    gridSpan: 'square',
                  });
                };
                // Resolve wix:image:// URLs to HTTPS before setting as src
                // This ensures the browser can load the image without CSP violations
                const resolved = WixImageResolver.resolve(image.image);
                const browserUrl = convertWixImageToHttps(resolved.url);
                img.src = browserUrl || '';
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

      <main className="max-w-[120rem] mx-auto px-8 py-24 md:py-32">
        {/* Page Header */}
        <ScrollReveal direction="up" duration={800} className="mb-20">
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            All Photos
          </h1>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A comprehensive collection of {allImages.length} photography work showcasing precision and creative excellence.
          </p>
        </ScrollReveal>



        {/* Scrolling Photos Grid */}
        {!isLoading && allImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]"
          >
            {allImages.map((image, index) => (
              <motion.div
                key={image._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className={`relative overflow-hidden rounded-lg bg-white/5 group cursor-pointer ${
                  image.gridSpan === 'vertical' ? 'md:row-span-2' : ''
                } ${image.gridSpan === 'horizontal' ? 'md:col-span-2' : ''}`}
              >
                <Image
                  src={WixImageResolver.resolve(image.image).url}
                  alt={image.altText || image.caption || 'Portfolio image'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  width={400}
                  height={300}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-4">
                  {image.caption && (
                    <p className="text-white text-sm font-paragraph opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {image.caption}
                    </p>
                  )}
                </div>
              </motion.div>
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
