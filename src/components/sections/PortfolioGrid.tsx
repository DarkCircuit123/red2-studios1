import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Portfolio } from '@/entities/index';
import { Image } from '@/components/ui/image';
import { playClickSound } from '@/lib/click-sound';

interface PortfolioGridProps {
  items: Portfolio[];
  isLoading: boolean;
}

export default function PortfolioGrid({ items, isLoading }: PortfolioGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use first 6 items or create placeholder items
  const displayItems = items.length > 0 ? items.slice(0, 6) : Array(6).fill(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  return (
    <section id="portfolio" className="relative w-full py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
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
        {/* Section Header with enhanced typography */}
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
            A selection of recent projects showcasing diverse aesthetics and creative directions. Each work represents precision and luxury restraint.
          </p>
        </motion.div>

        {/* Grid - Photography-First with Mixed Aspect Ratios */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 auto-rows-max"
        >
          {displayItems.map((item, index) => {
            // Varied grid positioning for dynamic layout
            let colSpan = 'md:col-span-1';
            
            if (index === 0) {
              colSpan = 'md:col-span-2';
            } else if (index === 1) {
              colSpan = 'md:col-span-2';
            } else if (index === 2) {
              colSpan = 'md:col-span-2';
            } else if (index === 3) {
              colSpan = 'md:col-span-2';
            }

            return (
              <motion.div
                key={item?._id || index}
                variants={itemVariants}
                onMouseEnter={() => item && setHoveredId(item._id)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{ y: -8 }}
                className={`group relative overflow-hidden bg-white/5 cursor-pointer border border-white/10 hover:border-primary/50 transition-all duration-500 flex items-center justify-center ${colSpan}`}
              >
                {/* Image Container - Photography-First with Aspect Ratio Preservation */}
                <div className="w-full h-full flex items-center justify-center bg-black/30 min-h-[400px] md:min-h-[500px] overflow-hidden">
                  <Image
                    src={item?.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png?originWidth=576&originHeight=576'}
                    alt={item?.projectName || 'Portfolio project'}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
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

                {/* Content - appears on hover with smooth animation */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={hoveredId === item?._id ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex flex-col items-end justify-end p-6 md:p-8"
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
                    className="absolute inset-0"
                    aria-label={`View ${item.projectName}`}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Button with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-24 md:mt-32 text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/portfolio"
              onClick={playClickSound}
              className="inline-flex items-center gap-3 px-10 py-4 border-2 border-primary text-white font-heading font-bold text-sm tracking-widest uppercase hover:bg-primary/10 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10">View All Photos</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
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
