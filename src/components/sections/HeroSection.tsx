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
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-primary/5 to-black opacity-60" />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(73, 7, 8, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(73, 7, 8, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(73, 7, 8, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
        />
      </div>
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
            <Image
              src={heroImage}
              alt="Hero background"
              className="w-full h-full object-cover"
            />
          </video>
        ) : (
          <Image
            src={heroImage}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        )}
        {/* Enhanced overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
      </motion.div>
      {/* Content with enhanced animations */}
      <div className="relative z-10 max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 text-left w-full h-full flex flex-col justify-end pb-20 md:pb-32">
        {/* Main headline with staggered animation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
          className="mb-6 md:mb-8"
        >
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white leading-tight tracking-tight uppercase font-heading">
            Visual{' '}
            <motion.span
              className="font-black inline-block text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-primary font-heading"
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              Storytelling
            </motion.span>
          </h1>
        </motion.div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mb-8 md:mb-12 leading-relaxed font-light tracking-normal font-paragraph"
        >
          Capturing the essence of fashion through bold imagery and refined aesthetics. A portfolio of precision and luxury restraint.
        </motion.p>

        {/* CTA buttons with ripple effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-start gap-6"
        >
          <motion.button
            onClick={scrollToGallery}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(73, 7, 8, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 text-white font-heading font-bold text-xs tracking-widest uppercase hover:bg-primary/90 transition-all duration-300 relative overflow-hidden group bg-color-7"
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
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 border border-white/40 text-white font-heading font-bold text-xs tracking-widest uppercase hover:border-white/80 transition-all duration-300 relative overflow-hidden"
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
