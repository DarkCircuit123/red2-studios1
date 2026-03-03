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
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="portfolio" className="relative w-full py-20 md:py-32 bg-white dark:bg-slate-950">
      <div className="max-w-[100rem] mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-foreground dark:text-white mb-4">
            Portfolio
          </h2>
          <p className="text-lg font-paragraph text-foreground/60 dark:text-gray-400 max-w-2xl">
            A selection of recent projects showcasing diverse aesthetics and creative directions
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {displayItems.map((item, index) => (
            <motion.div
              key={item?._id || index}
              variants={itemVariants}
              onMouseEnter={() => item && setHoveredId(item._id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 cursor-pointer"
            >
              {/* Image */}
              <Image
                src={item?.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png?originWidth=576&originHeight=576'}
                alt={item?.projectName || 'Portfolio project'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={hoveredId === item?._id ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-end justify-end p-6"
              >
                <div className="text-right">
                  <p className="text-xs font-paragraph text-white/70 mb-2 uppercase tracking-wide">
                    {item?.category || 'Fashion'}
                  </p>
                  <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-3">
                    {item?.projectName || 'Untitled Project'}
                  </h3>
                  <div className="flex items-center gap-2 text-white hover:gap-3 transition-all">
                    <span className="text-sm font-paragraph">View Project</span>
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
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-foreground dark:border-white text-foreground dark:text-white font-heading font-semibold rounded-lg hover:bg-foreground hover:text-white dark:hover:bg-white dark:hover:text-foreground transition-colors"
          >
            View All Projects
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
