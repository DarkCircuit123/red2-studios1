import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseCrudService } from '@/integrations';
import { playClickSound } from '@/lib/click-sound';

function HeroSection() {
  const [heroImage, setHeroImage] = useState('https://static.wixstatic.com/media/e9d727_c01a98369e0e46449c4db84b41fdb2dc~mv2.jpg');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHeroImage = async () => {
      try {
        setIsLoading(true);
        // Load from HomepageImages collection with optimized caching
        const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
        if (homepageImages.items && homepageImages.items.length > 0) {
          const images = homepageImages.items[0] as any;
          if (images.heroImage) {
            setHeroImage(images.heroImage);
          }
        }
      } catch (error) {
        console.error('Error loading hero image:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHeroImage();
  }, []);

  const scrollToGallery = useCallback(() => {
    playClickSound();
    const element = document.getElementById('portfolio');
    element?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Full-bleed hero background - video or image */}
      <div className="absolute inset-0 z-0">
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
        {/* Minimal dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 opacity-[0.51]" />
      </div>
      {/* Content with elegant fade-in and delay sequencing */}
      <div className="relative z-10 max-w-[120rem] mx-auto px-8 text-left w-full h-full flex flex-col justify-center">
        {/* Main headline - bold and clean */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
          className="mb-8"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading font-black text-white leading-none tracking-tight uppercase">
            Visual
            <br />
            <span className="font-black text-[#a01e1eff]">Storytelling</span>
          </h1>
        </motion.div>

        {/* Subheading - refined */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="text-sm md:text-base font-paragraph text-white/80 max-w-2xl mb-12 leading-relaxed font-light tracking-wide"
        >
          Capturing the essence of fashion through bold imagery and refined aesthetics. A portfolio of precision and luxury restraint.
        </motion.p>

        {/* CTA buttons - bold and minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-start gap-6"
        >
          <button
            onClick={scrollToGallery}
            className="px-8 py-3 bg-primary text-white font-heading font-bold text-xs tracking-widest uppercase hover:bg-primary/80 transition-all duration-300 hover:scale-105"
          >
            Explore Work
          </button>
          <button
            onClick={useCallback(() => {
              playClickSound();
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }, [])}
            className="px-8 py-3 border border-white/40 text-white font-heading font-bold text-xs tracking-widest uppercase hover:border-white/80 hover:bg-white/10 transition-all duration-300"
          >
            Get in Touch
          </button>
        </motion.div>
      </div>
      {/* Scroll indicator - subtle animation */}
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-12 left-8 z-10"
      >
        <button
          onClick={scrollToGallery}
          className="flex flex-col items-center gap-3 text-white/50 hover:text-white/70 transition-colors duration-300"
        >
          <span className="text-xs font-mono uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
}

export default React.memo(HeroSection);
