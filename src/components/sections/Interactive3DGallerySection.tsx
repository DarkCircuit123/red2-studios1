import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Film } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';

export default function Interactive3DGallerySection() {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(0);
  const positionRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 20 });
        setPortfolioItems(data.items || []);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPortfolio();
  }, []);

  // Physics-based momentum scrolling
  const applyMomentum = () => {
    if (!scrollContainerRef.current) return;

    const friction = 0.95;
    velocityRef.current *= friction;

    if (Math.abs(velocityRef.current) > 0.1) {
      positionRef.current += velocityRef.current;
      scrollContainerRef.current.style.transform = `translateY(${positionRef.current}px)`;
      animationFrameRef.current = requestAnimationFrame(applyMomentum);
    } else {
      velocityRef.current = 0;
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    velocityRef.current = delta * 0.5;
    lastTimeRef.current = Date.now();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    applyMomentum();
  };

  const handleTouchStart = (e: TouchEvent) => {
    lastYRef.current = e.touches[0].clientY;
    lastTimeRef.current = Date.now();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = lastYRef.current - currentY;
    const deltaTime = Date.now() - lastTimeRef.current;

    velocityRef.current = (deltaY / deltaTime) * 16;
    positionRef.current += deltaY;

    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.transform = `translateY(${positionRef.current}px)`;
    }

    lastYRef.current = currentY;
    lastTimeRef.current = Date.now();
  };

  const handleTouchEnd = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    applyMomentum();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return null;
  }

  if (portfolioItems.length === 0) {
    return null;
  }

  // Create infinite loop by duplicating items
  const allImages = portfolioItems.flatMap((item) => [
    item.mainImage,
    item.galleryImage1,
    item.galleryImage2,
    item.galleryImage3,
  ]).filter(Boolean);

  const infiniteImages = [...allImages, ...allImages, ...allImages];

  return (
    <section id="portfolio" className="relative w-full py-16 md:py-20 lg:py-24 bg-black overflow-hidden">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 mb-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Film className="w-6 h-6 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">Infinite Reel</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            Vertical Gallery
          </h2>
          <p className="text-base font-paragraph text-white/60 max-w-xl leading-relaxed">
            Scroll through our portfolio with smooth momentum physics. Optimized for vertical photography with infinite loop scrolling.
          </p>
        </motion.div>
      </div>

      {/* Infinite Scroll Reel */}
      <motion.div
        ref={containerRef}
        className="relative w-full h-screen md:h-[90vh] overflow-hidden bg-gradient-to-b from-black via-black to-black/80 cursor-grab active:cursor-grabbing"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="relative w-full h-full flex flex-col gap-4 md:gap-6"
          style={{
            willChange: 'transform',
          }}
        >
          {infiniteImages.map((image, idx) => (
            <motion.div
              key={`${idx}-${image}`}
              className="relative flex-shrink-0 w-full h-screen md:h-[90vh] overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Image
                src={image}
                alt={`Gallery item ${idx}`}
                className="w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Image Counter */}
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-10">
                <p className="text-xs font-mono text-white/60 uppercase tracking-widest">
                  {(idx % allImages.length) + 1} / {allImages.length}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="w-1 h-12 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="w-full h-1/3 bg-primary rounded-full"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest rotate-90 whitespace-nowrap origin-center translate-y-6">
            Scroll
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
            💡 Use scroll wheel or swipe to navigate with momentum
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
