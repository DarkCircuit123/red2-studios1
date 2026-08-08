import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { PortfolioImages } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import WixImageResolver from '@/lib/wix-image-resolver';
import PortfolioCarousel from '@/components/PortfolioCarousel';

interface ImageWithAspectRatio extends PortfolioImages {
  aspectRatio?: number;
  gridSpan?: 'vertical' | 'horizontal' | 'square';
}

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
        const result = await BaseCrudService.getAll<PortfolioImages>('portfolioimages', {}, { limit: 1000 });
        
        // Get all items - no filtering, we'll resolve URLs through WixImageResolver
        const allItems = result.items || [];
        
        console.info(
          `[PortfolioPage] Fetched ${allItems.length} portfolio images for processing`
        );

        // Load image dimensions and determine grid spans
        // CRITICAL: Resolve wix:image:// URLs through WixImageResolver before loading dimensions
        const imagesWithDimensions = await Promise.all(
          allItems.map(
            (image) =>
              new Promise<ImageWithAspectRatio>((resolve) => {
                // Resolve the image URL through WixImageResolver
                const resolved = WixImageResolver.resolve(image.image, {
                  recordId: image._id,
                  fieldName: 'image'
                });
                const imageUrl = resolved.url;
                
                const img = new window.Image();
                img.onload = () => {
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  resolve({
                    ...image,
                    image: imageUrl, // Store the resolved URL
                    aspectRatio,
                    gridSpan: getGridSpan(aspectRatio),
                  });
                };
                img.onerror = () => {
                  console.warn('Failed to load image:', image.image);
                  resolve({
                    ...image,
                    image: imageUrl, // Still store the resolved URL even on error
                    aspectRatio: 1,
                    gridSpan: 'square',
                  });
                };
                img.src = imageUrl;
              })
          )
        );
        
        // Use all images - do NOT filter out valid images
        // WixImageResolver handles all URL resolution and validation
        const validImages = imagesWithDimensions;
        
        console.info(
          `[PortfolioPage] Successfully loaded ${validImages.length} portfolio images`
        );
        
        setAllImages(validImages);
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

        {/* Auto-Scrolling Carousel with Parallax */}
        <ScrollReveal direction="up" duration={800} className="mb-24">
          <PortfolioCarousel images={allImages} isLoading={isLoading} />
        </ScrollReveal>

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
