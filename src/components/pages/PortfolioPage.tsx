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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      <main className="max-w-[100rem] mx-auto px-6 py-20">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground dark:text-white mb-4">
            Portfolio
          </h1>
          <p className="text-lg font-paragraph text-foreground/60 dark:text-gray-400 max-w-2xl">
            A comprehensive collection of our fashion photography work across various categories and styles
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 flex flex-wrap gap-3"
        >
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-4 py-2 rounded-full font-heading font-semibold transition-all ${
              selectedCategory === null
                ? 'bg-primary dark:bg-primary-foreground text-white dark:text-foreground'
                : 'bg-gray-100 dark:bg-slate-800 text-foreground dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`px-4 py-2 rounded-full font-heading font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-primary dark:bg-primary-foreground text-white dark:text-foreground'
                  : 'bg-gray-100 dark:bg-slate-800 text-foreground dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-gray-200 dark:bg-slate-800 animate-pulse"
                />
              ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {filteredProjects.map((project) => (
              <motion.div
                key={project._id}
                variants={itemVariants}
                onMouseEnter={() => setHoveredId(project._id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 cursor-pointer"
              >
                {/* Image */}
                <Image
                  src={project.mainImage || 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384'}
                  alt={project.projectName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={hoveredId === project._id ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-end justify-end p-6"
                >
                  <div className="text-right">
                    <p className="text-xs font-paragraph text-white/70 mb-2 uppercase tracking-wide">
                      {project.category}
                    </p>
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-3">
                      {project.projectName}
                    </h3>
                    <div className="flex items-center gap-2 text-white hover:gap-3 transition-all">
                      <span className="text-sm font-paragraph">View Project</span>
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
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-lg font-paragraph text-foreground/60 dark:text-gray-400 mb-4">
              No projects found in this category
            </p>
            <button
              onClick={() => handleCategoryFilter(null)}
              className="px-6 py-3 bg-primary dark:bg-primary-foreground text-white dark:text-foreground font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              View All Projects
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
