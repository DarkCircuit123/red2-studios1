import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { Portfolio } from '@/entities/index';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { playClickSound } from '@/lib/click-sound';

interface DraggableCarouselProps {
  items: Portfolio[];
  isLoading: boolean;
}

export default function DraggableCarousel({ items, isLoading }: DraggableCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedImage, setSelectedImage] = useState<Portfolio | null>(null);
  const [mouseY, setMouseY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const displayItems = items.length > 0 ? items : Array(6).fill(null);
  const itemWidth = 320;
  const gap = 12;
  const totalWidth = displayItems.length * (itemWidth + gap);

  // Continuous smooth scrolling
  useEffect(() => {
    let lastTime = Date.now();
    const scrollSpeed = 0.05; // Pixels per millisecond (slower)

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      setScrollPosition(prev => {
        let newPos = prev + scrollSpeed * deltaTime;
        // Loop infinitely
        if (newPos > totalWidth) {
          newPos = 0;
        }
        return newPos;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalWidth]);

  // Track mouse position for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMouseY((e.clientY - rect.top) / rect.height);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative w-full py-24 md:py-40 lg:py-48 bg-black overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 0% 0%, rgba(73, 7, 8, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(73, 7, 8, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 0%, rgba(73, 7, 8, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
        />
      </div>

      <div className="max-w-[120rem] mx-auto px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
          className="mb-24 md:mb-32"
        >
          <h2 className="text-7xl md:text-8xl lg:text-9xl font-heading font-black text-white mb-8 tracking-tighter leading-none">
            Selected
            <br />
            <motion.span
              className="text-primary"
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Photos
            </motion.span>
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/40 mb-8" />
          <p className="text-base md:text-lg font-paragraph text-white/70 max-w-2xl leading-relaxed">
            Click any image to view in full size. A selection of recent projects showcasing diverse aesthetics and creative directions.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden group"
        >
          {/* Carousel Track */}
          <div
            ref={trackRef}
            className="flex gap-3"
            style={{
              transform: `translateX(-${scrollPosition}px)`,
              transition: 'none',
            }}
          >
            {displayItems.map((item, index) => {
              // Parallax offset based on mouse position
              const parallaxOffset = (mouseY - 0.5) * 10;

              return (
                <motion.div
                  key={item?._id || index}
                  onClick={() => {
                    if (item) {
                      playClickSound();
                      setSelectedImage(item);
                    }
                  }}
                  className="group relative overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500 flex-shrink-0 w-[320px] h-[400px] cursor-pointer"
                >
                  {/* Image Container with Parallax */}
                  <motion.div
                    className="w-full h-full flex items-center justify-center bg-black/30 overflow-hidden"
                    animate={{ y: parallaxOffset }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  >
                    <Image
                      src={item?.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png?originWidth=576&originHeight=576'}
                      alt={item?.projectName || 'Portfolio project'}
                      className="w-full h-full object-contain"
                      width={320}
                    />
                  </motion.div>

                  {/* Grain overlay */}
                  <div className="absolute inset-0 bg-grain opacity-5" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-24 md:mt-32 text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/portfolio"
              onClick={playClickSound}
              className="inline-flex items-center gap-3 px-10 py-4 border-2 border-primary text-white font-heading font-bold text-sm tracking-widest uppercase hover:bg-primary/10 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10">View All Photos</span>
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </motion.div>
              <motion.div
                className="absolute inset-0 bg-primary/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Full Size Image Modal - Image Only, No Text */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                aria-label="Close image"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Image Only */}
              <motion.div
                className="flex items-center justify-center w-full h-full"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <Image
                  src={selectedImage.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png?originWidth=576&originHeight=576'}
                  alt={selectedImage.projectName || 'Portfolio project'}
                  className="w-auto h-auto max-w-full max-h-full object-contain"
                  width={2000}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
