import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { Image } from '@/components/ui/image';
import { useImageFitting } from '@/hooks/useImageFitting';
import { CarouselImages } from '@/entities';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

interface CarouselImage {
  id: string;
  url: string;
  alt: string;
  focalPointX?: number;
  focalPointY?: number;
  originWidth?: number;
  originHeight?: number;
}

interface CarouselImageCardProps {
  image: CarouselImage;
}

// Extract CarouselImageCard outside the component to prevent recreation on every render
const CarouselImageCard = memo(({ image }: CarouselImageCardProps) => {
  const [imageDims, setImageDims] = useState({ width: 1920, height: 1080 });

  // Memoize the options object to prevent useImageFitting from re-running on every render
  const fitOptions = useMemo(() => (
    {
      imageWidth: imageDims.width,
      imageHeight: imageDims.height,
      containerWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
      containerHeight: Math.round((typeof window !== 'undefined' ? window.innerHeight : 1080) * 0.55),
      focalPoint: {
        x: image.focalPointX ?? 50,
        y: image.focalPointY ?? 50,
      },
      fitMode: 'cover' as const,
    }
  ), [imageDims.width, imageDims.height, image.focalPointX, image.focalPointY]);

  const { fitting } = useImageFitting(fitOptions);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDims(prevDims => {
      // Guard: only update if dimensions actually changed
      if (prevDims.width === img.naturalWidth && prevDims.height === img.naturalHeight) {
        return prevDims;
      }
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    });
  }, []);

  const imageStyle = useMemo(() => (
    {
      objectFit: fitting.objectFit as any,
      objectPosition: fitting.objectPosition,
    }
  ), [fitting.objectFit, fitting.objectPosition]);

  return (
    <Image
      src={image.url}
      alt={image.alt}
      onLoad={handleImageLoad}
      width={1920}
      height={1080}
      loading="lazy"
      className="w-full h-full gallery-image-hover reveal-wipe"
      style={imageStyle}
    />
  );
});

CarouselImageCard.displayName = 'CarouselImageCard';

const RubberBandCarouselSection: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const setWidth = useRef(0);
  const [slides, setSlides] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mouse tracking refs
  const mousePercentRef = useRef(0);
  const curvedPullRef = useRef(0);
  const isHoveringRef = useRef(false);
  const snapBackAnimationRef = useRef<number>();

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
          }
        }
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

  // Elastic easing function for overshoot snap-back
  const easeOutElastic = useCallback((t: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
  }, []);

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

  // Track mouse position and calculate pull offset
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !isHoveringRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const sectionWidth = rect.width;
    const mouseXInSection = e.clientX - rect.left;

    mousePercentRef.current = (mouseXInSection / sectionWidth) * 100;
    const pullStrength = mousePercentRef.current - 50;
    const curvedPull =
      Math.sign(pullStrength) *
      Math.pow(Math.abs(pullStrength) / 50, 2) *
      50;

    curvedPullRef.current = curvedPull;
  }, []);

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    mousePercentRef.current = 0;
    curvedPullRef.current = 0;

    if (snapBackAnimationRef.current) {
      cancelAnimationFrame(snapBackAnimationRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;

    const startTime = Date.now();
    const duration = 600;
    const startPull = curvedPullRef.current;

    const animateSnapBack = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeValue = easeOutElastic(progress);
      curvedPullRef.current = startPull * (1 - easeValue);

      if (progress < 1) {
        snapBackAnimationRef.current = requestAnimationFrame(animateSnapBack);
      } else {
        curvedPullRef.current = 0;
        mousePercentRef.current = 0;
      }
    };

    snapBackAnimationRef.current = requestAnimationFrame(animateSnapBack);
  }, [easeOutElastic]);

  // Main animation loop with requestAnimationFrame
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let x = 0;
    let raf: number;

    const step = () => {
      x -= 0.5;
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
    const H = Math.min(1400, Math.round(620 * (window.devicePixelRatio || 1)));
    const W = Math.round(H * ((slide.originWidth || 1920) / (slide.originHeight || 1024)));
    const match = slide.url.match(/media\/([^/]+)\//);
    const id = match ? match[1] : 'e9d727_dc338c865879444cab6ecb545a8e8d0b';
    return `https://static.wixstatic.com/media/${id}/v1/fill/w_${W},h_${H},al_c,q_85,enc_auto/${id}`;
  }, []);

  return (
    <section
      ref={trackRef}
      className="relative w-full h-[40vh] sm:h-[48vh] lg:h-[55vh] min-h-[240px] max-h-[620px] bg-[#0a0a0a] overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel track */}
      <div className="flex h-full items-center gap-3 md:gap-4 will-change-transform">
        {loop.map((image, index) => (
          <figure
            key={`${image.id}-${index}`}
            className="relative m-0 h-full flex-[0_0_auto] overflow-hidden rounded-xl bg-neutral-900"
            style={{ aspectRatio: `${image.originWidth} / ${image.originHeight}` }}
          >
            <img
              src={carouselSrc(image)}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className="block h-full w-full object-cover"
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
