import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { Portfolio } from '@/entities/index';
import { Link } from 'react-router-dom';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { playClickSound } from '@/lib/click-sound';

interface DraggableCarouselProps {
  items: Portfolio[];
  isLoading: boolean;
}

export default function DraggableCarousel({ items, isLoading }: DraggableCarouselProps) {
  const [dragStart, setDragStart] = useState(0);
  const [dragEnd, setDragEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ start: 0, end: 0, time: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const displayItems = items.length > 0 ? items : Array(6).fill(null);
  const itemWidth = 320; // Reduced width for closer items
  const gap = 12; // Reduced gap for tighter spacing
  const totalWidth = displayItems.length * (itemWidth + gap);

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoScrolling || isDragging || isHovering) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      return;
    }

    autoScrollRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % displayItems.length);
    }, 4000); // Auto-scroll every 4 seconds

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [isAutoScrolling, isDragging, isHovering, displayItems.length]);

  // Calculate position with rubber banding
  const calculatePosition = (index: number, offset: number = 0) => {
    const basePosition = -(index * (itemWidth + gap)) + offset;
    
    // Rubber banding effect at boundaries
    if (basePosition > 0) {
      return basePosition * 0.3; // Reduce movement at start
    }
    if (basePosition < -(totalWidth - itemWidth - gap)) {
      const overflow = Math.abs(basePosition) - (totalWidth - itemWidth - gap);
      return basePosition + overflow * 0.7; // Reduce movement at end
    }
    
    return basePosition;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    dragRef.current = { start: e.clientX, end: e.clientX, time: Date.now() };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setDragEnd(e.clientX);
    dragRef.current.end = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const distance = dragRef.current.end - dragRef.current.start;
    const time = Date.now() - dragRef.current.time;
    const calculatedVelocity = distance / time;
    
    setVelocity(calculatedVelocity);
    
    // Determine next index based on drag distance and velocity
    const threshold = itemWidth * 0.15;
    const velocityThreshold = 0.3;
    
    if (Math.abs(distance) > threshold || Math.abs(calculatedVelocity) > velocityThreshold) {
      if (distance > 0) {
        // Dragged right - go to previous item
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else {
        // Dragged left - go to next item
        setCurrentIndex(prev => Math.min(displayItems.length - 1, prev + 1));
      }
    }
    
    setDragStart(0);
    setDragEnd(0);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (isDragging) {
      handleMouseUp();
    }
  };

  const dragOffset = isDragging ? dragEnd - dragStart : 0;
  const position = calculatePosition(currentIndex, dragOffset);

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
            Drag to explore. A selection of recent projects showcasing diverse aesthetics and creative directions.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setIsHovering(true)}
          className="relative overflow-hidden cursor-grab active:cursor-grabbing group"
        >
          {/* Carousel Track */}
          <motion.div
            className="flex gap-3"
            animate={{ x: position }}
            transition={
              isDragging
                ? { type: 'tween', duration: 0 }
                : { type: 'spring', damping: 25, stiffness: 120, mass: 0.8 }
            }
          >
            {displayItems.map((item, index) => (
              <motion.div
                key={item?._id || index}
                onMouseEnter={() => item && setHoveredId(item._id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500 flex-shrink-0 w-[320px] h-[400px] cursor-pointer"
              >
                {/* Image Container */}
                <div className="w-full h-full flex items-center justify-center bg-black/30 overflow-hidden">
                  <Image
                    src={item?.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png?originWidth=576&originHeight=576'}
                    alt={item?.projectName || 'Portfolio project'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    width={320}
                  />
                </div>

                {/* Grain overlay */}
                <div className="absolute inset-0 bg-grain opacity-5" />

                {/* Enhanced overlay with gradient */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={hoveredId === item?._id ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                />

                {/* Content - appears on hover */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={hoveredId === item?._id ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex flex-col items-end justify-end p-6 md:p-8 pointer-events-none"
                >
                  <div className="text-right w-full">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={hoveredId === item?._id ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-xs font-mono text-primary mb-4 uppercase tracking-widest line-clamp-2 break-words"
                    >
                      {item?.category || 'Fashion'}
                    </motion.p>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={hoveredId === item?._id ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-white mb-4 tracking-tight line-clamp-3"
                    >
                      {item?.projectName || 'Untitled Project'}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={hoveredId === item?._id ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-end gap-2 text-white group-hover:text-primary transition-colors"
                    >
                      <span className="text-sm font-paragraph">View</span>
                      <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Link */}
                {item && (
                  <Link
                    to={`/portfolio/${item._id}`}
                    onClick={playClickSound}
                    className="absolute inset-0 pointer-events-auto"
                    aria-label={`View ${item.projectName}`}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Navigation Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-12 flex items-center justify-center gap-6"
        >
          {/* Indicators */}
          <div className="flex items-center justify-center gap-3">
            {displayItems.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoScrolling(false);
                  setTimeout(() => setIsAutoScrolling(true), 8000);
                }}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary w-8 h-2'
                    : 'bg-white/30 hover:bg-white/50 w-2 h-2'
                } rounded-full`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              />
            ))}
          </div>

          {/* Auto-scroll toggle */}
          <motion.button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className="ml-4 p-2 rounded-full border border-white/20 hover:border-primary/50 text-white/60 hover:text-primary transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={isAutoScrolling ? 'Pause auto-scroll' : 'Resume auto-scroll'}
          >
            {isAutoScrolling ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </motion.button>
        </motion.div>

        {/* Drag Hint */}
        {!isDragging && currentIndex === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 flex items-center gap-2 text-white/60 text-sm font-paragraph"
          >
            <motion.div animate={{ x: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              ← Drag to explore
            </motion.div>
          </motion.div>
        )}

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
    </section>
  );
}
