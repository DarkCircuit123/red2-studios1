import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, RotateCcw } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { playClickSound } from '@/lib/click-sound';

const ITEMS_PER_PAGE = 24;
const FALLBACK_IMAGES: Record<string, string> = {
  default: 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384',
  portrait: 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=512',
  landscape: 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=512&originHeight=384',
};

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice(() => {
      return (
        typeof window !== 'undefined' &&
        (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)
      );
    });
  }, []);

  // Load projects with retry logic and AbortController
  useEffect(() => {
    const loadProjects = async () => {
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 100 });
        
        if (abortControllerRef.current.signal.aborted) return;
        
        const projectList = data.items || [];
        setProjects(projectList);
        setCurrentPage(1);

        // Preload first 6 images
        projectList.slice(0, 6).forEach((project) => {
          if (project.mainImage) {
            const img = new window.Image();
            img.src = project.mainImage;
          }
        });
      } catch (err) {
        if (!abortControllerRef.current.signal.aborted) {
          setError('Failed to load portfolio. Please try again.');
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Memoized filtered projects with automatic persistence
  const filteredProjects = useMemo(() => {
    if (selectedCategory) {
      return projects.filter((p) => p.category === selectedCategory);
    }
    return projects;
  }, [projects, selectedCategory]);

  // Memoized paginated projects
  const paginatedProjects = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  // Memoized categories
  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter(Boolean))),
    [projects]
  );

  const hasNextPage = currentPage * ITEMS_PER_PAGE < filteredProjects.length;
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const handleCategoryFilter = useCallback((category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    const loadProjects = async () => {
      abortControllerRef.current = new AbortController();
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 100 });
        if (abortControllerRef.current.signal.aborted) return;
        setProjects(data.items || []);
        setCurrentPage(1);
      } catch (err) {
        if (!abortControllerRef.current.signal.aborted) {
          setError('Failed to load portfolio. Please try again.');
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    loadProjects();
  }, []);

  const getFallbackImage = (category?: string): string => {
    if (category?.toLowerCase().includes('portrait')) return FALLBACK_IMAGES.portrait;
    if (category?.toLowerCase().includes('landscape')) return FALLBACK_IMAGES.landscape;
    return FALLBACK_IMAGES.default;
  };

  // Animation variants with capped stagger (max 0.8s)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-black">
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
            All Photos
          </h1>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A comprehensive collection of photography work across various categories and styles. Each project represents precision and creative excellence.
          </p>
        </motion.div>

        {/* Error State with Retry */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 p-6 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-4"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-paragraph text-red-200">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 font-heading text-sm rounded transition-colors"
                aria-label="Retry loading portfolio"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Filters - Ultra-minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-16 flex flex-wrap gap-3"
          role="group"
          aria-label="Filter projects by category"
        >
          <button
            onClick={() => {
              playClickSound();
              handleCategoryFilter(null);
            }}
            className={`px-6 py-2 font-heading font-semibold text-sm tracking-wide transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-white text-black'
                : 'border border-white/20 text-white hover:border-white/60 hover:bg-white/5'
            }`}
            aria-pressed={selectedCategory === null}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                playClickSound();
                handleCategoryFilter(category);
              }}
              className={`px-6 py-2 font-heading font-semibold text-sm tracking-wide transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-white text-black'
                  : 'border border-white/20 text-white hover:border-white/60 hover:bg-white/5'
              }`}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid - Photography-First with Fixed Aspect Ratios */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 animate-pulse aspect-square"
                  aria-hidden="true"
                />
              ))}
          </div>
        ) : error ? null : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              role="grid"
              aria-label="Portfolio projects"
            >
              {paginatedProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  variants={itemVariants}
                  onMouseEnter={() => !isTouchDevice && setHoveredId(project._id)}
                  onMouseLeave={() => !isTouchDevice && setHoveredId(null)}
                  className={`group relative overflow-hidden bg-white/5 cursor-pointer ${
                    index === 0 && currentPage === 1 ? 'md:col-span-2' : ''
                  }`}
                  role="gridcell"
                >
                  {/* Photography-First Container - Fixed Aspect Ratio */}
                  <div className="relative w-full aspect-square overflow-hidden bg-black/30">
                    {/* Image with lazy loading */}
                    <Image
                      src={project.mainImage || getFallbackImage(project.category)}
                      alt={project.projectName || 'Portfolio project'}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Subtle grain overlay */}
                    <div className="absolute inset-0 bg-grain opacity-5" />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />

                    {/* Content - always visible on touch, hover on desktop */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        isTouchDevice || hoveredId === project._id
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: 20 }
                      }
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col items-end justify-end p-6 md:p-8"
                    >
                      <div className="text-right">
                        <p className="text-xs font-mono text-white/60 mb-2 md:mb-3 uppercase tracking-widest">
                          {project.category}
                        </p>
                        <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-3 md:mb-4 tracking-tight line-clamp-2">
                          {project.projectName}
                        </h3>
                        <div className="flex items-center justify-end gap-2 text-white hover:gap-3 transition-all">
                          <span className="text-sm font-paragraph">View</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Link */}
                    <Link
                      to={`/portfolio/${project._id}`}
                      onClick={playClickSound}
                      className="absolute inset-0"
                      aria-label={`View ${project.projectName}`}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Load More Button */}
            {hasNextPage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center mt-16"
              >
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-4 bg-white text-black font-heading font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-300"
                  aria-label={`Load more projects (page ${currentPage + 1} of ${totalPages})`}
                >
                  Load More
                </button>
              </motion.div>
            )}

            {/* Pagination Info */}
            {filteredProjects.length > ITEMS_PER_PAGE && (
              <div className="text-center mt-8 text-white/50 text-sm font-paragraph">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of{' '}
                {filteredProjects.length} projects
              </div>
            )}
          </>
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
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-heading font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-300"
            >
              View All Photos
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
