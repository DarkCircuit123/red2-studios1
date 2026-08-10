import { Image } from '@/components/ui/image';
import { useState, useEffect, useRef } from 'react';
import { BaseCrudService } from '@/integrations';
import { useImageFitting } from '@/hooks/useImageFitting';

interface HomepageImage {
  heroImage?: string;
  heroImageFocalPointX?: number;
  heroImageFocalPointY?: number;
}

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(3);

  const { fitting } = useImageFitting({
    imageWidth: imageDimensions.width,
    imageHeight: imageDimensions.height,
    containerWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    containerHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    focalPoint,
    fitMode: 'cover',
  });

  const loadHeroImage = async () => {
    try {
      const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
      if (homepageImages?.items && homepageImages.items.length > 0) {
        const images = homepageImages.items[0] as HomepageImage;
        if (images?.heroImage && typeof images.heroImage === 'string' && images.heroImage.trim()) {
          setHeroImage(images.heroImage);
          // Load focal point if available
          if (images.heroImageFocalPointX !== undefined && images.heroImageFocalPointY !== undefined) {
            setFocalPoint({
              x: images.heroImageFocalPointX,
              y: images.heroImageFocalPointY,
            });
          }
        } else {
          console.warn('[HeroSection] No hero image found in CMS');
          setHeroImage(null);
        }
      } else {
        console.warn('[HeroSection] No homepage images collection data found');
        setHeroImage(null);
      }
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      console.error('[HeroSection] Failed to load hero image:', error);
      setHeroImage(null);
      retryCountRef.current++;
      // Don't retry indefinitely - set to max retries to stop polling
      if (retryCountRef.current >= 3) {
        retryCountRef.current = 999;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeroImage();
    
    // Only poll if retries haven't been exhausted
    // Use exponential backoff: 30s, 60s, 120s
    const scheduleNextPoll = () => {
      if (retryCountRef.current < maxRetriesRef.current) {
        const delayMs = Math.min(30000 * Math.pow(2, retryCountRef.current), 120000);
        refreshIntervalRef.current = setTimeout(loadHeroImage, delayMs);
      }
    };
    
    scheduleNextPoll();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {heroImage && (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={heroImage}
            alt="Hero background"
            onLoad={handleImageLoad}
            className="w-full h-full"
            style={{
              objectFit: fitting.objectFit as any,
              objectPosition: fitting.objectPosition,
            }}
            width={1920}
            height={1080}
          />
        </div>
      )}
      {!heroImage && !isLoading && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-900 to-black" />
      )}
      {isLoading && (
        <div className="absolute inset-0 w-full h-full bg-black" />
      )}
    </section>
  );
}
