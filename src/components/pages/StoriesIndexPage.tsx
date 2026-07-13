import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useStories } from '@/hooks/useStories';
import { parseISO, format } from 'date-fns';
import { playClickSound } from '@/lib/click-sound';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RotateCcw, Search, X } from 'lucide-react';
import { StoriesSEO } from '@/components/StoriesSEO';

interface Story {
  _id: string;
  title: string;
  slug: string;
  sourceURL: string;
  sourceName: string;
  publicationDate: string;
  featuredImage: string;
  excerpt: string;
  fullSummary: string;
}

const ITEMS_PER_PAGE = 12;
const MAX_STAGGER_DELAY = 0.5;

export default function StoriesIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSource, setSelectedSource] = useState(searchParams.get('source') || '');
  const observerTarget = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { fetchStories: fetchStoriesFromAPI } = useStories();

  // Get unique sources from stories with counts
  const uniqueSources = useMemo(() => {
    const sources = new Map<string, number>();
    stories.forEach(story => {
      sources.set(story.sourceName, (sources.get(story.sourceName) || 0) + 1);
    });
    return Array.from(sources.entries()).sort((a, b) => b[1] - a[1]);
  }, [stories]);

  // Filter stories based on search and source
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = !searchQuery || 
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = !selectedSource || story.sourceName === selectedSource;
      return matchesSearch && matchesSource;
    });
  }, [stories, searchQuery, selectedSource]);

  // Deduplicate stories by _id
  const deduplicatedStories = useMemo(() => {
    const seen = new Set<string>();
    return filteredStories.filter(story => {
      if (seen.has(story._id)) return false;
      seen.add(story._id);
      return true;
    });
  }, [filteredStories]);

  // Format date with proper parsing
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  }, []);

  // Get aspect ratio and dimensions for masonry
  const getAspectRatio = (index: number) => {
    if (index % 7 === 4) return 'aspect-video'; // 16/10
    return 'aspect-square'; // 4/5
  };

  // Fetch stories with AbortController
  const fetchStories = useCallback(async (skipValue: number) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setError(null);
      const result = await fetchStoriesFromAPI(ITEMS_PER_PAGE, skipValue);
      if (!result) throw new Error('Failed to fetch stories');
      
      if (skipValue === 0) {
        setStories(result.items);
      } else {
        // Deduplicate on merge
        setStories(prev => {
          const seen = new Set(prev.map(s => s._id));
          const newItems = result.items.filter(item => !seen.has(item._id));
          return [...prev, ...newItems];
        });
      }
      
      setHasMore(result.hasNext);
      setSkip(skipValue + ITEMS_PER_PAGE);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError('Failed to load stories. Please try again.');
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching stories:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchStoriesFromAPI]);

  // Initial load
  useEffect(() => {
    fetchStories(0);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStories]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !error) {
          fetchStories(skip);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [skip, hasMore, isLoading, error, fetchStories]);

  // Update URL params when search or filter changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSource) params.set('source', selectedSource);
    setSearchParams(params);
  }, [searchQuery, selectedSource, setSearchParams]);

  const handleRetry = useCallback(() => {
    playClickSound();
    setError(null);
    fetchStories(0);
  }, [fetchStories]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    playClickSound();
    setSearchQuery('');
  }, []);

  const handleSourceFilter = useCallback((source: string) => {
    playClickSound();
    setSelectedSource(selectedSource === source ? '' : source);
  }, [selectedSource]);

  // Skeleton loader grid
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`${
            i % 5 === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
          }`}
        >
          <Skeleton className="w-full h-64 lg:h-96 bg-secondary/20" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <StoriesSEO 
        totalCount={stories.length} 
        sourceCount={uniqueSources.length}
        currentUrl={typeof window !== 'undefined' ? window.location.href : 'https://example.com/stories'}
      />
      <Header />

      <main className="w-full px-6 py-16 pt-32">
        <div className="max-w-[100rem] mx-auto">
          {/* Page Title */}
          <div className="mb-12">
            <h1 className="font-heading text-6xl font-bold text-foreground mb-4">
              Stories & Insights
            </h1>
            <p className="font-paragraph text-secondary/60 text-sm tracking-widest">
              {uniqueSources.length > 0 
                ? `Curated from ${uniqueSources.length} source${uniqueSources.length !== 1 ? 's' : ''}`
                : 'Curated stories and insights'
              }
            </p>
          </div>

          {/* Search & Filter Section */}
          <div className="mb-12 space-y-6">
            {/* Search Input */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-secondary/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-10 py-3 bg-secondary/5 border border-secondary/20 rounded-lg text-foreground placeholder-secondary/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-4 p-1 hover:bg-secondary/10 rounded transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-secondary/60" />
                  </button>
                )}
              </div>
            </div>

            {/* Source Filters */}
            {uniqueSources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-paragraph text-secondary/60 uppercase tracking-widest self-center">
                  Filter by source:
                </span>
                {uniqueSources.map(([source, count]) => (
                  <motion.button
                    key={source}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSourceFilter(source)}
                    className={`px-4 py-2 rounded-lg text-xs font-paragraph tracking-widest transition-all ${
                      selectedSource === source
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/10 text-secondary/70 hover:bg-secondary/20'
                    }`}
                  >
                    {source} ({count})
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 p-6 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-4"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-500 font-paragraph text-sm mb-3">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors text-sm font-paragraph"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Loading State - Skeleton Grid */}
          {isLoading && stories.length === 0 && <SkeletonGrid />}

          {/* Masonry Grid */}
          {!isLoading && deduplicatedStories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max">
              {deduplicatedStories.map((story, index) => {
                const staggerDelay = Math.min((index * 0.05), MAX_STAGGER_DELAY);
                const aspectRatio = getAspectRatio(index);
                
                return (
                  <motion.div
                    key={story._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: staggerDelay, duration: 0.4 }}
                    className={`group cursor-pointer overflow-hidden rounded-lg ${
                      index % 5 === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
                    }`}
                  >
                    <Link to={`/stories/${story.slug}`} className="block h-full">
                      <div className="relative w-full h-full bg-secondary/10 overflow-hidden">
                        {/* Featured Image */}
                        <Image
                          src={story.featuredImage}
                          alt={story.title}
                          width={index % 5 === 0 ? 600 : 400}
                          height={index % 5 === 0 ? 600 : 400}
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${aspectRatio}`}
                        />

                        {/* Vignette overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                        {/* Content overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          {/* Title */}
                          <h3 className="font-heading text-xl font-bold text-foreground mb-3 line-clamp-3">
                            {story.title}
                          </h3>

                          {/* Meta */}
                          <p className="font-paragraph text-xs tracking-widest text-secondary/70">
                            {story.sourceName} · {formatDate(story.publicationDate)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && deduplicatedStories.length === 0 && stories.length > 0 && (
            <div className="text-center py-16">
              <p className="text-secondary/60 font-paragraph">
                No stories match your filters. Try adjusting your search or filters.
              </p>
            </div>
          )}

          {/* No stories state */}
          {!isLoading && stories.length === 0 && !error && (
            <div className="text-center py-16">
              <p className="text-secondary/60 font-paragraph">
                No stories available yet. Check back soon!
              </p>
            </div>
          )}

          {/* Infinite scroll observer & End of feed indicator */}
          <div ref={observerTarget} className="py-12 flex flex-col items-center justify-center gap-4">
            {isLoading && stories.length > 0 && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-secondary/60 font-paragraph text-sm"
              >
                Loading more stories...
              </motion.div>
            )}
            
            {!hasMore && stories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-secondary/50 font-paragraph text-sm uppercase tracking-widest"
              >
                End of feed
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
