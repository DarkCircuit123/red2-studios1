import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseCrudService } from '@/integrations';
import { playClickSound } from '@/lib/click-sound';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { scrollAnimationVariants } from '@/lib/scroll-animation-variants';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState('https://static.wixstatic.com/media/e9d727_c01a98369e0e46449c4db84b41fdb2dc~mv2.jpg');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ triggerOnce: true });

  useEffect(() => {
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
        // Use default image
      }
    };
    loadHeroImage();
  }, []);

  // Parallax effect with passive listener
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY * 0.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToGallery = useCallback(() => {
    playClickSound();
    const element = document.getElementById('portfolio');
    element?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleContactClick = useCallback(() => {
    playClickSound();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <section ref={contentRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Parallax image with depth */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: scrollY }}
      >
        {videoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : null}
        <Image
          src={heroImage}
          alt="Hero background"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
      </motion.div>


    </section>
  );
}
