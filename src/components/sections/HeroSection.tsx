import { Image } from '@/components/ui/image';
import { useState, useEffect, useRef } from 'react';
import { BaseCrudService } from '@/integrations';

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadHeroImage = async () => {
    try {
      const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
      if (homepageImages?.items && homepageImages.items.length > 0) {
        const images = homepageImages.items[0] as any;
        if (images?.heroImage) {
          setHeroImage(images.heroImage);
        }
      }
    } catch (error) {
      console.error('[HeroSection] Failed to load hero image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeroImage();
    
    // Poll for image updates every 2 seconds to catch admin panel changes
    refreshIntervalRef.current = setInterval(loadHeroImage, 2000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
      {heroImage && (
        <Image
          src={heroImage}
          alt="Hero background"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
      )}
      {!heroImage && !isLoading && (
        <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black" />
      )}
    </section>
  );
}
