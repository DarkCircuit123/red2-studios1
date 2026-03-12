import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseCrudService } from '@/integrations';
import { playClickSound } from '@/lib/click-sound';

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState('https://static.wixstatic.com/media/e9d727_c01a98369e0e46449c4db84b41fdb2dc~mv2.jpg');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const loadHeroImage = async () => {
      try {
        setIsLoading(true);
        const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
        if (homepageImages.items && homepageImages.items.length > 0) {
          const images = homepageImages.items[0] as any;
          if (images.heroImage) {
            setHeroImage(images.heroImage);
          }
        }
      } catch (error) {
        // Silently fail - use default image
      } finally {
        setIsLoading(false);
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
      <div className="relative z-10 max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 text-left w-full h-full flex flex-col justify-end pb-16 sm:pb-20 md:pb-24 lg:pb-32">
        {/* Main headline with bold/larger styling */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tight uppercase font-roboto-bold lg:text-9xl xl:text-9xl">
            Visual{' '}
            <motion.span
              className="font-black inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-primary font-roboto-bold"
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >RED</motion.span>
          </h1>
        </motion.div>

        {/* Subheading - smaller and lighter */}
        {/* CTA buttons - horizontally aligned with spacing and hover effects */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          className="text-xs sm:text-sm text-white/70 max-w-xl mb-6 sm:mb-8 md:mb-10 leading-relaxed tracking-normal md:text-sm font-helvetica-neue-bold font-bold not-italic no-underline"
        >Capturing the essence of fashion through bold imagery and refined aesthetics. A portfolio of precision and luxury restraint.</motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6"
        >
          <motion.button
            onClick={scrollToGallery}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(111, 8, 9, 0.6)' }}
            whileTap={{ scale: 0.98 }}
            className="px-6 sm:px-8 py-2.5 sm:py-3 text-white font-heading font-bold text-xs tracking-widest uppercase hover:bg-primary/90 transition-all duration-300 relative overflow-hidden group bg-primary"
          >
            <span className="relative z-10">Explore Work</span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>
          <motion.button
            onClick={handleContactClick}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.8)' }}
            whileTap={{ scale: 0.98 }}
            className="px-6 sm:px-8 py-2.5 sm:py-3 border border-white/40 text-white font-heading font-bold text-xs tracking-widest uppercase hover:border-white/80 transition-all duration-300 relative overflow-hidden"
          >
            <span className="relative z-10">Get in Touch</span>
          </motion.button>
        </motion.div>
      </div>
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
