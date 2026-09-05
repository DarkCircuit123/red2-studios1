import React, { useEffect, useRef, useState, useCallback, useMemo, memo, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useImageFitting } from '@/hooks/useImageFitting';
import { HomepageImages } from '@/entities';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

interface CarouselImage {
  id: string;
  url: string;
  alt: string;
  focalPointX?: number;
  focalPointY?: number;
}

interface CarouselImageCardProps {
  image: CarouselImage;
}

// Extract CarouselImageCard outside the component to prevent recreation on every render
const CarouselImageCard = memo(({ image }: CarouselImageCardProps) => {
  const [imageDims, setImageDims] = useState({ width: 1920, height: 1080 });

  // Memoize the options object to prevent useImageFitting from re-running on every render
  const fitOptions = useMemo(() => ({
    imageWidth: imageDims.width,
    imageHeight: imageDims.height,
    containerWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    containerHeight: Math.round((typeof window !== 'undefined' ? window.innerHeight : 1080) * 0.55),
    focalPoint: {
      x: image.focalPointX ?? 50,
      y: image.focalPointY ?? 50,
    },
    fitMode: 'cover' as const,
  }), [imageDims.width, imageDims.height, image.focalPointX, image.focalPointY]);

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

  const imageStyle = useMemo(() => ({
    objectFit: fitting.objectFit as any,
    objectPosition: fitting.objectPosition,
  }), [fitting.objectFit, fitting.objectPosition]);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const animationFrameRef = useRef<number>();
  const baseScrollRef = useRef(0);
  
  // Mouse tracking refs
  const mousePercentRef = useRef(0);
  const curvedPullRef = useRef(0);
  const isHoveringRef = useRef(false);
  const snapBackAnimationRef = useRef<number>();

  // Images uploaded through Admin -> Home Page -> Photos tab. This section now reads
  // from the 'homepageimages' collection which is managed via the admin panel.
  const [cmsImages, setCmsImages] = useState<CarouselImage[] | null>(null);

  // Load carousel images from CMS using API endpoint
  const loadCarouselImages = useCallback(async () => {
    try {
      const response = await fetch('/api/cms/get-homepageimages', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch carousel images: ${response.status}`);
      }

      const result = await response.json();
      const collected: CarouselImage[] = [];

      result.items?.forEach((item: HomepageImages) => {
        if (item.heroImage) {
          // Convert wix:image:// URLs to HTTPS for browser rendering
          const httpsUrl = convertWixImageToHttps(item.heroImage);
          if (httpsUrl) {
            collected.push({
              id: item._id,
              url: httpsUrl,
              alt: item.imageName || 'Carousel photo',
            });
          }
        }
      });

      // Only take over when there is something to show, so an empty or
      // failed read leaves the existing visuals in place rather than
      // blanking the section.
      setCmsImages(collected.length > 0 ? collected : null);
    } catch (error) {
      console.error('[RubberBandCarousel] Failed to load carousel images:', error);
      console.warn('[RubberBandCarousel] Using fallback images');
      setCmsImages(null);
    }
  }, []);

  useEffect(() => {
    loadCarouselImages();
  }, []);

  // Fallback used only until the CMS responds, or if it has no images yet.
  const fallbackImages: CarouselImage[] = useMemo(() => [
    {
      id: '1',
      url: 'https://static.wixstatic.com/media/e9d727_dc338c865879444cab6ecb545a8e8d0b~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 1',
    },
    {
      id: '2',
      url: 'https://static.wixstatic.com/media/e9d727_caf9a0b8c25a48e498e615968b84cfc5~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 2',
    },
    {
      id: '3',
      url: 'https://static.wixstatic.com/media/e9d727_af58458647a24198895103de7f52ee34~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 3',
    },
    {
      id: '4',
      url: 'https://static.wixstatic.com/media/e9d727_7398b229af7349179713a070e2ba3045~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 4',
    },
    {
      id: '5',
      url: 'https://static.wixstatic.com/media/e9d727_df5b596912a946fa8801c5a797d9fab5~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 5',
    },
    {
      id: '6',
      url: 'https://static.wixstatic.com/media/e9d727_9ddd1fbce8c04f54a8ae54df6c169f95~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 6',
    },
  ], []);

  // CMS wins whenever it has images; the hardcoded set is only a placeholder.
  const images: CarouselImage[] = cmsImages ?? fallbackImages;

  // Memoize duplicated images and total width to prevent effect re-runs
  const { duplicatedImages, totalWidth } = useMemo(() => {
    const duped = [...images, ...images, ...images];
    return {
      duplicatedImages: duped,
      totalWidth: duped.length * 100, // Each image is 100vw
    };
  }, [images]);

  // Elastic easing function for overshoot snap-back (memoized)
  const easeOutElastic = useCallback((t: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
  }, []);

  // Step 1 & 2: Track mouse position and calculate pull offset (memoized)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isHoveringRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const sectionWidth = rect.width;
    const mouseXInSection = e.clientX - rect.left;

    // Step 1: Calculate mousePercent (0 to 100)
    mousePercentRef.current = (mouseXInSection / sectionWidth) * 100;

    // Step 2: Calculate pullStrength (-50 to +50)
    const pullStrength = mousePercentRef.current - 50;

    // Step 3: Apply non-linear curve
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
    
    // Cancel any ongoing snap-back animation
    if (snapBackAnimationRef.current) {
      cancelAnimationFrame(snapBackAnimationRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;

    // Step 5: Animate snap-back with overshoot
    const startTime = Date.now();
    const duration = 600; // 0.6s in milliseconds
    const startPull = curvedPullRef.current;

    const animateSnapBack = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic-bezier(0.34, 1.56, 0.64, 1) approximation for overshoot
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
  }, []);

  // Step 4: Main animation loop - optimized to avoid unnecessary state updates
  // Use a ref to track the last scroll position to prevent excessive state updates
  const lastScrollPositionRef = useRef(0);
  
  useLayoutEffect(() => {
    let animationFrameId: number;
    let isAnimating = true;

    const animate = () => {
      if (!isAnimating) return;

      // Base auto-scroll speed (pixels per frame)
      const baseSpeed = 0.5;

      // Step 4: Apply pull to scroll speed
      // curvedPull modifies speed, not position
      const multiplier = 0.8; // Adjust sensitivity
      const activeScrollSpeed = baseSpeed + (curvedPullRef.current * multiplier) / 50;

      // Update base scroll with modified speed
      baseScrollRef.current += activeScrollSpeed;

      // Loop the scroll position - use totalWidth directly (stable from useMemo above)
      const loopedPosition = baseScrollRef.current % totalWidth;
      
      // Only update state if position changed significantly to avoid excessive renders
      if (Math.abs(loopedPosition - lastScrollPositionRef.current) > 0.1) {
        lastScrollPositionRef.current = loopedPosition;
        setScrollPosition(loopedPosition);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      isAnimating = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [totalWidth]);

  return (
    <section
      ref={containerRef}
      className="relative w-screen h-[55vh] bg-[#0a0a0a] overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel container */}
      <motion.div
        className="flex h-full"
        style={{
          x: -scrollPosition,
          gap: '8px',
        }}
      >
        {duplicatedImages.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className="flex-shrink-0 w-screen h-full"
          >
            <CarouselImageCard image={image} />
          </div>
        ))}
      </motion.div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#2a2a2a]" />
    </section>
  );
};

export default RubberBandCarouselSection;
