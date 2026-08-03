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
      {/* Subtle gradient overlay - darker at bottom */}
      <div className="absolute inset-0 z-5 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      
      {/* Content positioned in center */}
      <div className="relative z-10 max-w-[100rem] mx-auto px-4 md:px-8 text-center flex flex-col items-center justify-center h-full">
        <ScrollReveal direction="up" delay={200} duration={800}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={contentVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-white mb-6 tracking-tight"
          >
            RED<span className="text-primary">²</span>
          </motion.h1>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={400} duration={800}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={contentVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mb-12 font-paragraph"
          >
            Visual storytelling through the lens of experience
          </motion.p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={600} duration={800}>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <motion.button
              onClick={scrollToGallery}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-primary text-white font-mono text-sm uppercase tracking-widest rounded-lg hover:bg-primary/80 transition-colors duration-300"
            >
              View Work
            </motion.button>
            <motion.button
              onClick={handleContactClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border border-white/30 text-white font-mono text-sm uppercase tracking-widest rounded-lg hover:border-primary hover:text-primary transition-colors duration-300"
            >
              Get In Touch
            </motion.button>
          </div>
        </ScrollReveal>
      </div>

      {/* Enhanced scroll indicator with scroll animation */}
      <ScrollReveal direction="up" delay={800} duration={800} className="absolute bottom-6 md:bottom-12 left-4 md:left-8 z-10">
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
      </ScrollReveal>
    </section>
  );
}
