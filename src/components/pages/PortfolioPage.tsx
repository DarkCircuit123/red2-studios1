import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Portfolio[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 });
        setProjects(data.items || []);
        setFilteredProjects(data.items || []);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Get unique categories
  const categories = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      setFilteredProjects(projects.filter((p) => p.category === category));
    } else {
      setFilteredProjects(projects);
    }
  };

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
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-[120rem] mx-auto px-8 py-24 md:py-32">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            Portfolio
          </h1>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A comprehensive collection of fashion photography work across various categories and styles. Each project represents precision and creative excellence.
          </p>
        </motion.div>

        {/* Filters - Ultra-minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-16 flex flex-wrap gap-3"
        >
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-6 py-2 font-heading font-semibold text-sm tracking-wide transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-white text-slate-950'
                : 'border border-white/20 text-white hover:border-white/60 hover:bg-white/5'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`px-6 py-2 font-heading font-semibold text-sm tracking-wide transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-white text-slate-950'
                  : 'border border-white/20 text-white hover:border-white/60 hover:bg-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-max">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-slate-800 animate-pulse"
                />
              ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-max"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project._id}
                variants={itemVariants}
                onMouseEnter={() => setHoveredId(project._id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative overflow-hidden bg-slate-900 cursor-pointer ${
                  index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                } ${index === 1 ? 'md:row-span-2' : ''}`}
              >
                {/* Aspect ratio container */}
                <div className="relative w-full aspect-square">
                  {/* Image */}
                  <Image
                    src={project.mainImage || 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384'}
                    alt={project.projectName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Subtle grain overlay */}
                  <div className="absolute inset-0 bg-grain opacity-5" />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

                  {/* Content - appears on hover */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={hoveredId === project._id ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex flex-col items-end justify-end p-8"
                  >
                    <div className="text-right">
                      <p className="text-xs font-mono text-white/60 mb-3 uppercase tracking-widest">
                        {project.category}
                      </p>
                      <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4 tracking-tight">
                        {project.projectName}
                      </h3>
                      <div className="flex items-center gap-2 text-white hover:gap-3 transition-all">
                        <span className="text-sm font-paragraph">View</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Link */}
                  <Link
                    to={`/portfolio/${project._id}`}
                    className="absolute inset-0"
                    aria-label={`View ${project.projectName}`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-base font-paragraph text-white/50 mb-8">
              No projects found in this category
            </p>
            <button
              onClick={() => handleCategoryFilter(null)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-950 font-heading font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-300"
            >
              View All Projects
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
