import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CarouselImages } from '@/entities';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

interface CarouselImage {
  id: string;
  url: string;
  alt: string;
  originWidth?: number;
  originHeight?: number;
}

const RubberBandCarouselSection: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const setWidth = useRef(0);
  const [slides, setSlides] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback images
  const fallbackImages: CarouselImage[] = useMemo(() => [
    {
      id: '1',
      url: 'https://static.wixstatic.com/media/e9d727_dc338c865879444cab6ecb545a8e8d0b~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 1',
      originWidth: 1920,
      originHeight: 1024,
    },
    {
      id: '2',
      url: 'https://static.wixstatic.com/media/e9d727_caf9a0b8c25a48e498e615968b84cfc5~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 2',
      originWidth: 1920,
      originHeight: 1024,
    },
    {
      id: '3',
      url: 'https://static.wixstatic.com/media/e9d727_af58458647a24198895103de7f52ee34~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 3',
      originWidth: 1920,
      originHeight: 1024,
    },
    {
      id: '4',
      url: 'https://static.wixstatic.com/media/e9d727_7398b229af7349179713a070e2ba3045~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 4',
      originWidth: 1920,
      originHeight: 1024,
    },
    {
      id: '5',
      url: 'https://static.wixstatic.com/media/e9d727_df5b596912a946fa8801c5a797d9fab5~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 5',
      originWidth: 1920,
      originHeight: 1024,
    },
    {
      id: '6',
      url: 'https://static.wixstatic.com/media/e9d727_9ddd1fbce8c04f54a8ae54df6c169f95~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 6',
      originWidth: 1920,
      originHeight: 1024,
    },
  ], []);

  // Parse originWidth and originHeight from Wix image URL
  const parseImageDimensions = useCallback((url: string): { width: number; height: number } => {
    const match = url.match(/originWidth=(\d+)&originHeight=(\d+)/);
    if (match) {
      return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
    }
    return { width: 1920, height: 1024 }; // Fallback
  }, []);

  // Load carousel images from carouselimages collection
  const loadCarouselImages = useCallback(async () => {
    try {
      const response = await fetch('/api/cms/get-carouselimages', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch carousel images: ${response.status}`);
      }

      const result = await response.json();
      const collected: CarouselImage[] = [];

      // Filter by isActive true and sort by displayOrder
      const activeItems = (result.items || [])
        .filter((item: CarouselImages) => item.isActive === true)
        .sort((a: CarouselImages, b: CarouselImages) =>
          (a.displayOrder || 0) - (b.displayOrder || 0)
        );

      console.log('[RubberBandCarousel] Fetched carousel images:', {
        totalItems: result.items?.length || 0,
        activeItems: activeItems.length,
        items: activeItems.map((item: CarouselImages) => ({
          id: item._id,
          name: item.imageName,
          isActive: item.isActive,
          displayOrder: item.displayOrder,
          hasImage: !!item.image,
        })),
      });

      activeItems.forEach((item: CarouselImages) => {
        if (item.image) {
          const httpsUrl = convertWixImageToHttps(item.image);
          if (httpsUrl) {
            const dims = parseImageDimensions(httpsUrl);
            collected.push({
              id: item._id,
              url: httpsUrl,
              alt: item.imageName || 'Carousel photo',
              originWidth: dims.width,
              originHeight: dims.height,
            });
            console.log('[RubberBandCarousel] Loaded image:', {
              id: item._id,
              name: item.imageName,
              url: httpsUrl,
              dims,
              isActive: item.isActive,
              displayOrder: item.displayOrder,
            });
          } else {
            console.warn('[RubberBandCarousel] Failed to convert image URL:', item.image);
          }
        } else {
          console.warn('[RubberBandCarousel] Item has no image:', {
            id: item._id,
            name: item.imageName,
          });
        }
      });

      console.log('[RubberBandCarousel] Collected images:', {
        count: collected.length,
        usingFallback: collected.length === 0,
      });

      setSlides(collected.length > 0 ? collected : fallbackImages);
    } catch (error) {
      console.error('[RubberBandCarousel] Failed to load carousel images:', error);
      setSlides(fallbackImages);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackImages, parseImageDimensions]);

  useEffect(() => {
    loadCarouselImages();
  }, [loadCarouselImages]);

  // Build duplicated loop for seamless scrolling
  const loop = useMemo(() => [...slides, ...slides], [slides]);

  // Measure track width on mount and resize
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setWidth.current = trackRef.current.scrollWidth / 2;
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [slides.length]);

  // Main animation loop with requestAnimationFrame - carousel never stops
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let x = 0;
    let raf: number;

    const step = () => {
      x -= 0.3;
      const w = setWidth.current;
      if (w && -x >= w) x += w;
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Helper to generate optimized image URL based on viewport height
  const carouselSrc = useCallback((slide: CarouselImage): string => {
    // If the URL is already a valid Wix static URL, use it directly with optimization params
    if (slide.url.includes('static.wixstatic.com/media/')) {
      // Extract the media ID from the URL (e.g., e9d727_xxxxx from the URL)
      const match = slide.url.match(/media\/([^~?]+)/);
      if (match) {
        const mediaId = match[1];
        const H = Math.min(1400, Math.round(620 * (window.devicePixelRatio || 1)));
        const W = Math.round(H * ((slide.originWidth || 1920) / (slide.originHeight || 1024)));
        // Use the correct Wix image transformation format: media/ID~c{width}x{height}/...
        return `https://static.wixstatic.com/media/${mediaId}~c${W}x${H}/file.webp`;
      }
    }
    // Fallback: return the original URL if we can't parse it
    return slide.url;
  }, []);

  return (
    <section
      className="relative w-full h-[40vh] sm:h-[48vh] lg:h-[55vh] min-h-[240px] max-h-[620px] bg-black overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%)',
      }}
    >
      {/* Carousel track */}
      <div ref={trackRef} className="flex h-full items-center gap-6 md:gap-8 will-change-transform">
        {loop.map((image, index) => (
          <figure
            key={`${image.id}-${index}`}
            className="relative m-0 h-full flex-[0_0_auto] overflow-hidden bg-gray-900"
            style={{ aspectRatio: `${image.originWidth} / ${image.originHeight}` }}
          >
            <img
              src={carouselSrc(image)}
              alt={image.alt}
              decoding="async"
              className="block h-full w-full object-cover"
              onError={(e) => {
                console.error('[RubberBandCarousel] Image failed to load:', {
                  src: (e.target as HTMLImageElement).src,
                  alt: image.alt,
                });
                // Fallback: use the original URL if transformation fails
                (e.target as HTMLImageElement).src = image.url;
              }}
              onLoad={() => {
                console.log('[RubberBandCarousel] Image loaded successfully:', {
                  src: carouselSrc(image),
                  alt: image.alt,
                });
              }}
            />
          </figure>
        ))}
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#2a2a2a]" />
    </section>
  );
};

export default RubberBandCarouselSection;
