import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function HeroSection() {
  const scrollToGallery = () => {
    const element = document.getElementById('gallery');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Full-bleed hero image with grain overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://static.wixstatic.com/media/e9d727_b65d99d94acf4284abde71454dcf8408~mv2.png?originWidth=1920&originHeight=1024"
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {/* Subtle filmic grain overlay */}
        <div className="absolute inset-0 bg-grain opacity-5" />
        {/* Intelligent highlight protection - dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/40" />
      </div>

      {/* Content with elegant fade-in and delay sequencing */}
      <div className="relative z-10 max-w-[120rem] mx-auto px-8 text-left w-full h-full flex flex-col justify-center">
        {/* Main headline - oversized with tight tracking */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-heading font-bold text-white leading-none tracking-tighter">
            Visual
            <br />
            <span className="text-white/80">Storytelling</span>
          </h1>
        </motion.div>

        {/* Subheading - refined and quiet */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="text-base md:text-lg font-paragraph text-white/70 max-w-xl mb-12 leading-relaxed"
        >
          Capturing the essence of fashion through bold imagery and refined aesthetics. A portfolio of precision and luxury restraint.
        </motion.p>

        {/* CTA buttons - minimal design */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-start gap-6"
        >
          <button
            onClick={scrollToGallery}
            className="px-8 py-3 bg-white text-slate-950 font-heading font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-300 hover:scale-105"
          >
            Explore Work
          </button>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 border border-white/40 text-white font-heading font-semibold text-sm tracking-wide hover:border-white/80 hover:bg-white/5 transition-all duration-300"
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
