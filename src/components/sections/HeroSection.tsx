import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { playClickSound } from '@/lib/click-sound';

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState('https://static.wixstatic.com/media/e9d727_1863a0ceed024925b98e4c777d55b483~mv2.png?originWidth=1600&originHeight=1152');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadHeroImage = async () => {
      try {
        const services = await BaseCrudService.getAll('services', {}, { limit: 1 });
        if (services.items && services.items.length > 0) {
          const service = services.items[0] as any;
          if (service.infographic) {
            setHeroImage(service.infographic);
          }
          // Check for video URL in the service description or custom field
          if (service.fullDescription && service.fullDescription.includes('http')) {
            const urlMatch = service.fullDescription.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              setVideoUrl(urlMatch[1]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading hero image:', error);
      }
    };
    loadHeroImage();
  }, []);

  const scrollToGallery = () => {
    playClickSound();
    const element = document.getElementById('portfolio');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

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
        <div className="absolute inset-0 bg-black/30" />
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
            <span className="text-red-900 font-black">Storytelling</span>
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
            className="px-8 py-3 bg-red-900 text-white font-heading font-bold text-xs tracking-widest uppercase hover:bg-red-800 transition-all duration-300 hover:scale-105"
          >
            Explore Work
          </button>
          <button
            onClick={() => {
              playClickSound();
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
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
