import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Portfolio } from '@/entities/index';
import { Image } from '@/components/ui/image';

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
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="portfolio" className="relative w-full py-24 md:py-32 bg-white">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-black mb-6 tracking-tighter">
            Selected Works
          </h2>
          <p className="text-base font-paragraph text-black/50 max-w-xl leading-relaxed">
            A selection of recent projects showcasing diverse aesthetics and creative directions. Each work represents precision and luxury restraint.
          </p>
        </motion.div>

        {/* Grid - Asymmetrical layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-max"
        >
          {displayItems.map((item, index) => (
            <motion.div
              key={item?._id || index}
              variants={itemVariants}
              onMouseEnter={() => item && setHoveredId(item._id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative overflow-hidden bg-black/5 cursor-pointer ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              } ${index === 1 ? 'md:row-span-2' : ''}`}
            >
              {/* Aspect ratio container */}
              <div className={`relative w-full ${index === 0 ? 'aspect-square' : 'aspect-square'}`}>
                {/* Image */}
                <Image
                  src={item?.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png?originWidth=576&originHeight=576'}
                  alt={item?.projectName || 'Portfolio project'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Subtle grain overlay */}
                <div className="absolute inset-0 bg-grain opacity-5" />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

                {/* Content - appears on hover */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={hoveredId === item?._id ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-end justify-end p-8"
                >
                  <div className="text-right">
                    <p className="text-xs font-mono text-white/60 mb-3 uppercase tracking-widest">
                      {item?.category || 'Fashion'}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4 tracking-tight">
                      {item?.projectName || 'Untitled Project'}
                    </h3>
                    <div className="flex items-center gap-2 text-white hover:gap-3 transition-all">
                      <span className="text-sm font-paragraph">View</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>

                {/* Link */}
                {item && (
                  <Link
                    to={`/portfolio/${item._id}`}
                    className="absolute inset-0"
                    aria-label={`View ${item.projectName}`}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-3 px-8 py-4 border border-black/20 text-black font-heading font-semibold text-sm tracking-wide hover:border-black/60 hover:bg-black/5 transition-all duration-300"
          >
            View All Projects
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
