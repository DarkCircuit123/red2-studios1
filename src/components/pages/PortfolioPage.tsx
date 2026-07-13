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
const FALLBACK_IMAGE = 'https://static.wixstatic.com/media/e9d727_671ebd2ed39741ef96a8e977d62eb26b~mv2.png?originWidth=960&originHeight=512';

// ============================================================================
// MEMOIZED LOAD FUNCTION - Prevents duplicate fetches
// ============================================================================
const loadPortfolioProjects = async (signal: AbortSignal): Promise<Portfolio[]> => {
  try {
    const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 100 });
    if (signal.aborted) return [];
    return data.items || [];
  } catch (err) {
    if (!signal.aborted) throw err;
    return [];
  }
};

// ============================================================================
// IMAGE PRELOADING - For pagination performance
// ============================================================================
const preloadImages = (projects: Portfolio[], startIdx: number, count: number) => {
  projects.slice(startIdx, startIdx + count).forEach((project) => {
    if (project.mainImage) {
      const img = new window.Image();
      img.src = project.mainImage;
    }
  });
};

// ============================================================================
// HARDENED AUDIO - One-time context unlock with try/catch
// ============================================================================
let audioContextUnlocked = false;
const playClickSoundHardened = () => {
  try {
    playClickSound();
    // Unlock audio context on first interaction
    if (!audioContextUnlocked && typeof window !== 'undefined') {
      audioContextUnlocked = true;
    }
  } catch (err) {
    console.warn('Click sound error:', err);
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function PortfolioPage() {
  const [projects, setProjects] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadMoreAnnouncerRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // DETECT TOUCH DEVICE & MOTION PREFERENCES
  // =========================================================================
  useEffect(() => {
    setIsTouchDevice(() => {
      return (
        typeof window !== 'undefined' &&
        (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)
      );
    });

    // Detect prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // =========================================================================
  // LOAD PROJECTS - Memoized with AbortController
  // =========================================================================
  useEffect(() => {
    const loadProjects = async () => {
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      try {
        const projectList = await loadPortfolioProjects(abortControllerRef.current.signal);
        if (abortControllerRef.current.signal.aborted) return;

        setProjects(projectList);
        setCurrentPage(1);

        // Preload first 6 images
        preloadImages(projectList, 0, 6);
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

  // =========================================================================
  // PRELOAD NEXT PAGE IMAGES
  // =========================================================================
  useEffect(() => {
    if (hasNextPage) {
      const nextPageStartIdx = currentPage * ITEMS_PER_PAGE;
      preloadImages(filteredProjects, nextPageStartIdx, ITEMS_PER_PAGE);
    }
  }, [currentPage, filteredProjects]);

  // =========================================================================
  // MEMOIZED FILTERED PROJECTS
  // =========================================================================
  const filteredProjects = useMemo(() => {
    if (selectedCategory) {
      return projects.filter((p) => p.category === selectedCategory);
    }
    return projects;
  }, [projects, selectedCategory]);

  // =========================================================================
  // MEMOIZED PAGINATED PROJECTS
  // =========================================================================
  const paginatedProjects = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  // =========================================================================
  // MEMOIZED CATEGORIES
  // =========================================================================
  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter(Boolean))),
    [projects]
  );

  const hasNextPage = currentPage * ITEMS_PER_PAGE < filteredProjects.length;
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleCategoryFilter = useCallback((category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
    // Announce to screen readers
    if (loadMoreAnnouncerRef.current) {
      loadMoreAnnouncerRef.current.textContent = `Loaded page ${currentPage + 1} of ${totalPages}`;
    }
  }, [currentPage, totalPages]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    const loadProjects = async () => {
      abortControllerRef.current = new AbortController();
      try {
        const projectList = await loadPortfolioProjects(abortControllerRef.current.signal);
        if (abortControllerRef.current.signal.aborted) return;
        setProjects(projectList);
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

  // =========================================================================
  // ANIMATION VARIANTS - Respect prefers-reduced-motion
  // =========================================================================
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.06,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.5 },
    },
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="min-h-screen bg-black bg-grain">
      <Header />

      {/* SEO Meta Tags */}
      <head>
        <title>Portfolio | Photography Collection</title>
        <meta name="description" content="Comprehensive collection of photography work across various categories and styles. Each project represents precision and creative excellence." />
        <meta property="og:title" content="Portfolio | Photography Collection" />
        <meta property="og:description" content="Comprehensive collection of photography work across various categories and styles." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </head>

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Portfolio',
          description: 'A comprehensive collection of photography work across various categories and styles.',
          url: typeof window !== 'undefined' ? window.location.href : '',
          mainEntity: {
            '@type': 'ImageGallery',
            name: 'Photography Portfolio',
            associatedMedia: projects.map((p) => ({
              '@type': 'ImageObject',
              name: p.projectName,
              url: p.mainImage,
              description: p.shortDescription,
            })),
          },
        })}
      </script>

      <main className="max-w-[120rem] mx-auto px-8 py-24 md:py-32">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
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
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
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
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.1 }}
          className="mb-16 flex flex-wrap gap-3"
          role="group"
          aria-label="Filter projects by category"
        >
          <button
            onClick={() => {
              playClickSoundHardened();
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
                playClickSoundHardened();
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

        {/* Projects Grid - Semantic List with Mixed Aspect Ratios */}
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
        ) : error ? null : paginatedProjects.length > 0 ? (
          <>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 list-none p-0 m-0"
              aria-label="Portfolio projects"
            >
              {paginatedProjects.map((project, index) => (
                <motion.li
                  key={project._id}
                  variants={itemVariants}
                  onMouseEnter={() => !isTouchDevice && setHoveredId(project._id)}
                  onMouseLeave={() => !isTouchDevice && setHoveredId(null)}
                  className={`group relative overflow-hidden bg-white/5 cursor-pointer ${
                    index === 0 && currentPage === 1 ? 'md:col-span-2 md:row-span-1' : ''
                  }`}
                >
                  {/* Photography-First Container - Mixed Aspect Ratios */}
                  <div
                    className={`relative w-full overflow-hidden bg-black/30 ${
                      index === 0 && currentPage === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    {/* Image with lazy loading */}
                    <Image
                      src={project.mainImage || FALLBACK_IMAGE}
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
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                      animate={
                        isTouchDevice || hoveredId === project._id
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: prefersReducedMotion ? 0 : 20 }
                      }
                      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
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
                      onClick={playClickSoundHardened}
                      className="absolute inset-0"
                      aria-label={`View ${project.projectName}`}
                    />
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            {/* Load More Button with aria-live */}
            {hasNextPage && (
              <motion.div
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
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
        ) : null}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
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

      {/* Aria-live region for load more announcements */}
      <div
        ref={loadMoreAnnouncerRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <Footer />
    </div>
  );
}
