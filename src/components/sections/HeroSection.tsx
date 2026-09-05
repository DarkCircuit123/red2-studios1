import { Image } from '@/components/ui/image';
import { useState, useEffect, useRef } from 'react';
import { useImageFitting } from '@/hooks/useImageFitting';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
  const containerRef = useRef<HTMLDivElement>(null);

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
      // Use API endpoint instead of direct BaseCrudService (client-side safe)
      const response = await fetch('/api/cms/get-homepageimages', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hero image: ${response.status}`);
      }

      const result = await response.json();
      if (result?.items && result.items.length > 0) {
        const images = result.items[0] as HomepageImage;
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
          setHeroImage(null);
        }
      } else {
        setHeroImage(null);
      }
    } catch (error) {
      console.error('[HeroSection] Failed to load hero image:', error);
      setHeroImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeroImage();
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

      {/* Hero Caption Block - Lower Left */}
      <div className="absolute bottom-0 left-0 z-10" style={{ paddingLeft: '8vw', paddingBottom: '12vh' }}>
        <div style={{ letterSpacing: '0.3em' }} className="text-sm uppercase">
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>
            FASHION. EDITORIAL. BOUDOIR.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)' }}>
            LOS ANGELES
          </div>
        </div>
      </div>

      {/* CTA Link - Below Caption */}
      <Link
        to="/portfolio"
        className="absolute z-10 inline-block uppercase transition-all duration-[400ms] ease-out"
        style={{
          left: '8vw',
          bottom: 'calc(12vh - 60px)',
          paddingTop: '14px',
          paddingBottom: '14px',
          paddingLeft: '32px',
          paddingRight: '32px',
          letterSpacing: '0.25em',
          fontSize: '0.75rem',
          fontWeight: 500,
          border: '1px solid rgba(255,255,255,0.4)',
          backgroundColor: 'transparent',
          color: 'rgba(255,255,255,0.7)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = '#A31621';
          el.style.backgroundColor = '#A31621';
          el.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'rgba(255,255,255,0.4)';
          el.style.backgroundColor = 'transparent';
          el.style.color = 'rgba(255,255,255,0.7)';
        }}
      >
        View Work
      </Link>

      {/* Scroll Indicator - Bottom Center */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10"
        style={{
          transform: 'translateX(-50%)',
          width: '1px',
          height: '60px',
          backgroundColor: 'rgba(255,255,255,0.4)',
        }}
        animate={{
          scaleY: [0, 1, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </section>
  );
}
