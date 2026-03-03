import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function HeroSection() {
  const scrollToGallery = () => {
    const element = document.getElementById('gallery');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://static.wixstatic.com/media/e9d727_b65d99d94acf4284abde71454dcf8408~mv2.png?originWidth=1920&originHeight=1024"
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[100rem] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6"
        >
          <h1 className="text-6xl md:text-8xl font-heading font-bold text-white leading-tight tracking-tight mb-4">
            Visual
            <br />
            Storytelling
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-2xl font-paragraph text-white/90 max-w-2xl mx-auto mb-8"
        >
          Capturing the essence of fashion through bold imagery and refined aesthetics
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={scrollToGallery}
            className="px-8 py-3 bg-white text-foreground font-heading font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Explore Work
          </button>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 border-2 border-white text-white font-heading font-semibold rounded-lg hover:bg-white/10 transition-colors"
          >
            Get in Touch
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <button
          onClick={scrollToGallery}
          className="flex flex-col items-center gap-2 text-white hover:text-white/70 transition-colors"
        >
          <span className="text-sm font-paragraph">Scroll to explore</span>
          <ChevronDown className="w-6 h-6" />
        </button>
      </motion.div>
    </section>
  );
}
