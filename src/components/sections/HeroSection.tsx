import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseCrudService } from '@/integrations';
import { playClickSound } from '@/lib/click-sound';

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState('https://static.wixstatic.com/media/e9d727_c01a98369e0e46449c4db84b41fdb2dc~mv2.jpg');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const loadHeroImage = async () => {
      try {
        const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
        if (homepageImages.items && homepageImages.items.length > 0) {
          const images = homepageImages.items[0] as any;
          if (images.heroImage) {
            setHeroImage(images.heroImage);
          }
        }
      } catch (error) {
        // Silently fail - use default image
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
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black">
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
      {/* Subtle gradient overlay - darker at bottom */}
      <div className="absolute inset-0 z-5 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      {/* Content positioned in lower third with padding */}

      {/* Enhanced scroll indicator */}
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-6 md:bottom-12 left-4 md:left-8 z-10"
      >
        <motion.button
          onClick={scrollToGallery}
          whileHover={{ scale: 1.1 }}
          className="flex flex-col items-center gap-3 text-white/50 hover:text-primary transition-colors duration-300 group"
        >
          <span className="text-xs font-mono uppercase tracking-widest group-hover:text-primary transition-colors">Scroll</span>
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4 group-hover:text-primary transition-colors" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  );
}
