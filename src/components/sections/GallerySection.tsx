import { useState, useRef, useEffect } from 'react';
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
    <section id="gallery" className="relative w-full min-h-screen py-20 bg-white dark:bg-slate-950">
      <div className="max-w-[100rem] mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-foreground dark:text-white mb-4">
            Signature Reel
          </h2>
          <p className="text-lg font-paragraph text-foreground/60 dark:text-gray-400 max-w-2xl">
            A curated selection of our most compelling fashion photography work
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative h-[500px] md:h-[600px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-heading font-bold text-white"
                  >
                    {item.title}
                  </motion.h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            {galleryItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Counter */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
            {String(currentIndex + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(-1)}
              className="px-4 py-2 border border-foreground/20 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => paginate(1)}
              className="px-4 py-2 border border-foreground/20 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
