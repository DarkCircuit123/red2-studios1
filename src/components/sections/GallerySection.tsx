import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

const galleryItems = [
  {
    id: 1,
    title: 'Urban Elegance',
    image: 'https://static.wixstatic.com/media/e9d727_a70668e6ae6e419482ea443583c2fd82~mv2.png?originWidth=960&originHeight=576',
  },
  {
    id: 2,
    title: 'Minimalist Chic',
    image: 'https://static.wixstatic.com/media/e9d727_66bf35745d0f4c9fa743a32689db44b9~mv2.png?originWidth=960&originHeight=576',
  },
  {
    id: 3,
    title: 'Bold Statements',
    image: 'https://static.wixstatic.com/media/e9d727_17e67400d7d3467abfacc3985b2c080d~mv2.png?originWidth=960&originHeight=576',
  },
  {
    id: 4,
    title: 'Ethereal Moments',
    image: 'https://static.wixstatic.com/media/e9d727_76cb9ee2259f449e80661474813e0709~mv2.png?originWidth=960&originHeight=576',
  },
];

export default function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + galleryItems.length) % galleryItems.length);
  };

  return (
    <section id="gallery" className="relative w-full min-h-screen py-24 md:py-32 bg-slate-950">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Section Header - Ultra-minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            Signature Reel
          </h2>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A curated selection of our most compelling fashion photography work. Each frame meticulously crafted to capture essence and narrative.
          </p>
        </motion.div>

        {/* Full-bleed carousel */}
        <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] h-[70vh] md:h-[80vh] overflow-hidden bg-slate-900">
          <div ref={containerRef} className="relative w-full h-full">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate={index === currentIndex ? 'center' : 'exit'}
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.5 },
                }}
                className="absolute inset-0"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {/* Intelligent highlight protection */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                
                {/* Minimal title overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-12 left-8 md:left-12"
                >
                  <h3 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Minimal navigation - appears on hover */}
          <motion.button
            onClick={() => paginate(-1)}
            className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 p-3 text-white/40 hover:text-white transition-colors duration-300"
            aria-label="Previous slide"
            whileHover={{ scale: 1.1 }}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            onClick={() => paginate(1)}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 p-3 text-white/40 hover:text-white transition-colors duration-300"
            aria-label="Next slide"
            whileHover={{ scale: 1.1 }}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>

          {/* Minimal indicators */}
          <div className="absolute bottom-8 left-8 z-20 flex gap-3">
            {galleryItems.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 h-1 bg-white'
                    : 'w-2 h-1 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Counter - minimal typography */}
        <div className="mt-12 flex items-center justify-between max-w-[120rem]">
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
            {String(currentIndex + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
          </p>
        </div>
      </div>
    </section>
  );
}
